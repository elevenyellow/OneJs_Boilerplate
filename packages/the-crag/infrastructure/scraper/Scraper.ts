import { Injectable, logger } from '@OneJs'
import * as cheerio from 'cheerio'
import type {
  AreaFlattenItem,
  NodeInfoResponse,
  ParentNode,
  ProcessedArea,
  RouteFlattenItem,
  RouteTableInfo,
  ScrapedCrag,
  ScrapedRoute,
  TagsMap,
  TopoImageData,
} from './api.interfaces'
import { GradeDistributionBuilder } from './grade-distribution-builder'
import { Curl } from './Curl'
import { HtmlScraper } from './HtmlScraper'
import type { AreaHtmlData, CragOverviewHtmlData } from './HtmlScraper'

const cookie =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

export type Node = string | number

@Injectable()
export class Scraper {
  private readonly BATCH_SIZE = 1
  private readonly REQUEST_DELAY_MS = 3000

  constructor(
    private readonly htmlScraper: HtmlScraper = new HtmlScraper(cookie),
    private readonly curl: Curl = new Curl(cookie),
  ) {}

  /**
   * Delay execution for a specified number of milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Execute a request with graceful failure handling and delay after completion
   * @param fn Function that returns a promise
   * @param defaultValue Default value to return on failure
   * @param context Optional context for logging
   */
  private async safeRequest<T>(
    fn: () => Promise<T>,
    defaultValue: T,
    context?: string,
  ): Promise<T> {
    try {
      const result = await fn()
      await this.delay(this.REQUEST_DELAY_MS)
      return result
    } catch (error) {
      logger.warn('scraper:safeRequest', `Request failed: ${context}`, {
        context,
        error: error instanceof Error ? error.message : String(error),
      })
      await this.delay(this.REQUEST_DELAY_MS)
      return defaultValue
    }
  }

  /**
   * Process items in batches to limit concurrent requests
   * @param items Array of items to process
   * @param processor Function to process each item
   * @param batchSize Number of items to process concurrently (default: BATCH_SIZE)
   */
  private async processInBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = this.BATCH_SIZE,
  ): Promise<R[]> {
    const results: R[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(items.length / batchSize)

      logger.debug(
        'scraper:batch',
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`,
      )

      const batchResults = await Promise.all(batch.map(processor))
      results.push(...batchResults)
    }

    return results
  }

  private extractNodeId(html: string): string | null {
    // Método 1: desde el body data-nid
    let match = html.match(/<body[^>]+data-nid="(\d+)"/)
    if (match) return match[1] || null

    // Método 2: desde defaultSelect
    match = html.match(/var\s+defaultSelect\s*=\s*['"](\d+)['"]/)
    if (match) return match[1] || null

    // Método 3: desde el breadcrumb seleccionado
    match = html.match(/crumb--selected[^>]+data-nid="(\d+)"/)
    if (match) return match[1] || null

    return null
  }

  private extractParentChain(html: string): ParentNode[] {
    const $ = cheerio.load(html)
    const parents: ParentNode[] = []

    $('#breadCrumbs .crumb a[data-nid]').each((index, el) => {
      const $el = $(el)
      const id = $el.attr('data-nid')
      const name =
        $el.find('[itemprop="name"]').text().trim() || $el.text().trim()
      const href = $el.attr('href') || ''

      // Extraer position del meta tag hermano
      const $li = $el.closest('li')
      const position = parseInt(
        $li.find('meta[itemprop="position"]').attr('content') ||
          String(index + 1),
      )

      // Extraer urlStub (última parte de la URL)
      const urlParts = href.split('/').filter((p) => p)
      const urlStub = urlParts[urlParts.length - 1] || ''

      // Inferir tipo basado en la URL
      const type = this.inferZoneTypeFromUrl(href, position)

      if (id && name) {
        parents.push({
          id,
          name,
          href,
          urlStub,
          position,
          type,
        })
      }
    })

    return parents
  }

  private inferZoneTypeFromUrl(href: string, position: number): string {
    // Patrones de URL de theCrag
    if (href.includes('/climbing/world')) return 'world'
    if (href.match(/\/climbing\/[^\/]+$/)) {
      // /climbing/europe → continent
      // /climbing/spain → country
      const knownContinents = [
        'europe',
        'asia',
        'africa',
        'north-america',
        'south-america',
        'oceania',
      ]
      const lastPart = href.split('/').pop()?.toLowerCase() || ''
      return knownContinents.includes(lastPart) ? 'continent' : 'country'
    }
    if (href.includes('/area/')) return 'region' // Comunidad Valenciana

    // Fallback basado en posición
    switch (position) {
      case 1:
        return 'world'
      case 2:
        return 'continent'
      case 3:
        return 'country'
      case 4:
        return 'region'
      case 5:
        return 'province'
      case 6:
        return 'area'
      default:
        return 'unknown'
    }
  }

  private async extractNodeInfo(nodeId: string): Promise<NodeInfoResponse> {
    const nodeInfo = await this.curl.requestApi(
      `https://www.thecrag.com/api/node/id/${nodeId}?show=stats,guidebooks,location,urlAncestorStub,approach,geometry,description,urlStub,grades,tags,info,map,ethics,access,links,coordinates,weather,beta,photos,topos,styles,altNames`,
    )

    try {
      return JSON.parse(nodeInfo)
    } catch (parseError) {
      logger.error(
        'scraper:extractNodeInfo',
        `Invalid JSON response for node ${nodeId}`,
        {
          responsePreview: nodeInfo.substring(0, 200),
          error:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        },
      )
      throw new Error(
        `Invalid JSON response for node ${nodeId}: ${nodeInfo.substring(0, 100)}...`,
      )
    }
  }

  private async extractNodeChildren(
    nodeId: string,
  ): Promise<AreaFlattenItem[]> {
    const nodeChildren = await this.curl.requestApi(
      `https://www.thecrag.com/api/node/id/${nodeId}/children/area?flatten=data[id,name,urlStub,urlAncestorStub,subAreaCount,subType,asciiName,approach,map,geo,location,geolocation,geometry,lat,lng,latitude,longitude,image,images,photo,photos,coverImage,thumbnail,media,numberPhotos,type,depth,numberRoutes,ascentCount,numberTopos,kudos,seasonality,averageHeight,tags,hasTopo,parentID,phototopo]&expires=10`,
    )

    let json: unknown
    try {
      json = JSON.parse(nodeChildren)
    } catch (parseError) {
      logger.error(
        'scraper:extractNodeChildren',
        `Invalid JSON response for node ${nodeId} children`,
        {
          responsePreview: nodeChildren.substring(0, 200),
          error:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        },
      )
      throw new Error(
        `Invalid JSON response for node ${nodeId} children: ${nodeChildren.substring(0, 100)}...`,
      )
    }

    if (Array.isArray(json)) {
      return json[0] ?? [] // Ya devuelve AreaFlattenItem[]
    }

    if (
      json !== null &&
      typeof json === 'object' &&
      'data' in json &&
      Array.isArray((json as { data: unknown[] }).data)
    ) {
      return (json as { data: AreaFlattenItem[][] }).data[0] ?? []
    }

    logger.error(
      'scraper:extractNodeChildren',
      `Unexpected response structure for node ${nodeId}`,
      {
        jsonType: typeof json,
        json: JSON.stringify(json).substring(0, 200),
      },
    )
    throw new Error(`Unexpected response structure for node ${nodeId}`)
  }

  private async extractNodeRoutes(nodeId: string): Promise<RouteFlattenItem[]> {
    const nodeRoutes = await this.curl.requestApi(
      `https://www.thecrag.com/api/node/id/${nodeId}/children/route?flatten=data[id,name,grade,gradeAtom,gradeBand,gradeStyle,gradeInContext,rawGrade,height,displayHeight,pitches,qualityScore,stars,ascents,ascentCount,style,styleStub,bolts,firstAscent,tags,warnings,flags,popularity,relativePopularity,cragScore,siblingLabel,parentID,depth,context,type,urlAncestorStub,description]&expires=10`,
    )

    let json: unknown
    try {
      json = JSON.parse(nodeRoutes)
    } catch (parseError) {
      logger.error(
        'scraper:extractNodeRoutes',
        `Invalid JSON response for node ${nodeId} routes`,
        {
          responsePreview: nodeRoutes.substring(0, 200),
          error:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        },
      )
      throw new Error(
        `Invalid JSON response for node ${nodeId} routes: ${nodeRoutes.substring(0, 100)}...`,
      )
    }

    if (Array.isArray(json)) {
      return json[0] ?? [] // Devuelve RouteFlattenItem[]
    }

    if (
      json !== null &&
      typeof json === 'object' &&
      'data' in json &&
      Array.isArray((json as { data: unknown[] }).data)
    ) {
      return (json as { data: RouteFlattenItem[][] }).data[0] ?? []
    }

    logger.error(
      'scraper:extractNodeRoutes',
      `Unexpected response structure for node ${nodeId}`,
      {
        jsonType: typeof json,
        json: JSON.stringify(json).substring(0, 200),
      },
    )
    throw new Error(`Unexpected response structure for node ${nodeId} routes`)
  }

  private hasSubAreas(info: NodeInfoResponse): boolean {
    return !!(info.data.subAreaCount && info.data.subAreaCount > 0)
  }

  private hasSubSectors(sector: AreaFlattenItem): boolean {
    if (!sector[4]) return false
    if (Number(sector[4]) > 0) return true
    return false
  }

  private flattenRouteToScrapedRoute(
    route: RouteFlattenItem,
    htmlInfo: RouteTableInfo | undefined,
  ): ScrapedRoute {
    return {
      // Campos de la API (32 campos)
      id: route[0],
      name: route[1],
      grade: route[2],
      gradeAtom: route[3],
      gradeBand: route[4],
      gradeStyle: route[5],
      gradeInContext: route[6],
      rawGrade: route[7],
      height: route[8],
      displayHeight: route[9],
      pitches: route[10],
      qualityScore: route[11],
      stars: route[12],
      ascents: route[13],
      ascentCount: route[14],
      style: route[15],
      styleStub: route[16],
      bolts: route[17],
      firstAscent: route[18],
      tags: route[19],
      warnings: route[20],
      flags: route[21],
      popularity: route[22],
      relativePopularity: route[23],
      cragScore: route[24],
      siblingLabel: route[25],
      parentID: route[26],
      depth: route[27],
      context: route[28],
      type: route[29],
      urlAncestorStub: route[30],
      description: route[31],

      // Campos del HTML (11 campos)
      equipper: htmlInfo?.equipper ?? null,
      equipDate: htmlInfo?.equipDate ?? null,
      maintainer: htmlInfo?.maintainer ?? null,
      maintDate: htmlInfo?.maintDate ?? null,
      descriptionHtml: htmlInfo?.description ?? null,
      akaNames: htmlInfo?.akaNames ?? [],
      isClosed: htmlInfo?.isClosed ?? false,
      hasWarning: htmlInfo?.hasWarning ?? false,
      warningText: htmlInfo?.warningText ?? null,
      hasTopoHtml: htmlInfo?.hasTopo ?? false,
      topoNumber: htmlInfo?.topoNumber ?? null,
    }
  }

  private buildProcessedAreaFromFlatten(
    area: AreaFlattenItem,
    topos: TopoImageData[],
    headerImage: string | null,
    areaInfo: NodeInfoResponse | null,
  ): ProcessedArea {
    return {
      // Identificación
      id: area[0],
      name: area[1],
      asciiName: area[6],
      type: area[25],
      subType: area[5],

      // URLs
      urlStub: area[2],
      urlAncestorStub: area[3],

      // Jerarquía
      parentID: area[35],
      depth: area[26],
      subAreaCount: area[4],

      // Ubicación
      geometry: area[12],
      approach: area[7],
      lat: area[13],
      lng: area[14],
      latitude: area[15],
      longitude: area[16],
      map: area[8],
      geo: area[9],
      location: area[10],
      geolocation: area[11],

      // Imágenes (de API flatten)
      image: area[17],
      images: area[18],
      photo: area[19],
      photos: area[20],
      coverImage: area[21],
      thumbnail: area[22],
      media: area[23],
      numberPhotos: area[24],
      phototopo: area[36],

      // Estadísticas
      numberRoutes: area[27],
      ascentCount: area[28],
      numberTopos: area[29],
      kudos: area[30],
      averageHeight: area[32],
      totalFavorites: areaInfo?.data.totalFavorites ?? null,
      maxPop: areaInfo?.data.maxPop ?? null,

      // Metadata
      seasonality: area[31] || areaInfo?.data.seasonality || null,
      tags: (areaInfo?.data.tags as TagsMap) || area[33] || null,
      hasTopo: area[34],

      // Información detallada (de NodeInfo API)
      beta: areaInfo?.data.beta || null,
      styles: areaInfo?.data.styles || null,
      altNames: areaInfo?.data.altNames || null,
      // NOTE: gbAscents and gbRoutes will be calculated from routes/subareas
      // instead of using TheCrag's gradeBand system
      gbAscents: [],
      gbRoutes: [],

      // Datos HTML (scraped)
      topos,
      headerImage,
    }
  }

  private async buildAreas(areas: AreaFlattenItem[]): Promise<ProcessedArea[]> {
    logger.info(
      'scraper:buildAreas',
      `Processing ${areas.length} areas in batches of ${this.BATCH_SIZE}`,
    )

    return this.processInBatches(areas, async (area) => {
      const areaPath = this.htmlScraper.buildAreaPath(area)
      const areaId = String(area[0])

      // Fetch HTML data once and extract all info (topos, headerImage, routesTableInfo)
      const defaultHtmlData: AreaHtmlData = {
        topos: [],
        headerImage: null,
        routesTableInfo: new Map<string, RouteTableInfo>(),
      }
      const htmlData = await this.safeRequest(
        () => this.htmlScraper.getAreaHtmlData(areaPath),
        defaultHtmlData,
        `htmlData for area ${areaId}`,
      )
      const { topos, headerImage, routesTableInfo } = htmlData

      // Fetch API data
      const routes = await this.safeRequest(
        () => this.extractNodeRoutes(areaId),
        [],
        `routes for area ${areaId}`,
      )
      const areaInfo = await this.safeRequest(
        () => this.extractNodeInfo(areaId),
        null,
        `areaInfo for area ${areaId}`,
      )

      // Build area with available data (may be partial)
      const processedArea = this.buildProcessedAreaFromFlatten(
        area,
        topos,
        headerImage,
        areaInfo,
      )

      // Add relationships (sub-areas or routes)
      if (this.hasSubSectors(area)) {
        try {
          const subAreas = await this.extractNodeChildren(areaId)
          processedArea.subAreas = await this.buildAreas(subAreas)

          // Aggregate gbRoutes and gbAscents from sub-areas
          processedArea.gbRoutes = GradeDistributionBuilder.aggregateGbRoutes(
            processedArea.subAreas,
          )
          processedArea.gbAscents = GradeDistributionBuilder.aggregateGbAscents(
            processedArea.subAreas,
          )
        } catch (subAreaError) {
          logger.warn(
            'scraper:buildAreas',
            `Failed to fetch sub-areas for area ${areaId}`,
            {
              areaId,
              error:
                subAreaError instanceof Error
                  ? subAreaError.message
                  : String(subAreaError),
            },
          )
          processedArea.subAreas = []
          processedArea.gbRoutes = []
          processedArea.gbAscents = []
        }
      } else {
        processedArea.routes = routes.map((route) =>
          this.flattenRouteToScrapedRoute(
            route,
            routesTableInfo.get(String(route[0])),
          ),
        )

        // Build gbRoutes and gbAscents from individual routes using our grading system
        processedArea.gbRoutes = GradeDistributionBuilder.buildGbRoutes(
          processedArea.routes,
        )
        processedArea.gbAscents = GradeDistributionBuilder.buildGbAscents(
          processedArea.routes,
        )
      }

      return processedArea
    })
  }

  private normalizeUrl(input: string | number): string {
    // Si es número (node ID), devolverlo como string
    if (typeof input === 'number') {
      return String(input)
    }

    let url = input.trim()

    // Eliminar protocolo si existe
    url = url.replace(/^https?:\/\//, '')

    // Eliminar dominio si existe (www.thecrag.com o thecrag.com)
    url = url.replace(/^(www\.)?thecrag\.com\/?/, '')

    // Eliminar slash inicial si quedó
    url = url.replace(/^\/+/, '')

    // Eliminar slash final
    url = url.replace(/\/+$/, '')

    return url
  }

  private async virtualCrag(
    urlPath: string,
    nodeId: string,
    info: NodeInfoResponse,
    parents: ParentNode[],
  ) {
    // Fetch HTML data once and extract all info (topos, headerImage, routesTableInfo)
    const defaultHtmlData: AreaHtmlData = {
      topos: [],
      headerImage: null,
      routesTableInfo: new Map<string, RouteTableInfo>(),
    }
    const htmlData = await this.safeRequest(
      () => this.htmlScraper.getAreaHtmlData(urlPath),
      defaultHtmlData,
      `htmlData for virtualCrag ${nodeId}`,
    )
    const { topos, headerImage, routesTableInfo } = htmlData

    // Fetch API data
    const routes = await this.safeRequest(
      () => this.extractNodeRoutes(nodeId),
      [],
      `routes for virtualCrag ${nodeId}`,
    )

    const scrapedRoutes = routes.map((route) =>
      this.flattenRouteToScrapedRoute(
        route,
        routesTableInfo.get(String(route[0])),
      ),
    )

    return {
      id: nodeId,
      name: info.data.name,
      type: info.data.subType,
      info: info.data,
      parents,
      topos,
      headerImage,
      routes: scrapedRoutes,
      // Build gbRoutes and gbAscents from individual routes using our grading system
      gbRoutes: GradeDistributionBuilder.buildGbRoutes(scrapedRoutes),
      gbAscents: GradeDistributionBuilder.buildGbAscents(scrapedRoutes),
    }
  }

  private async realCrag(
    urlPath: string,
    nodeId: string,
    info: NodeInfoResponse,
    parents: ParentNode[],
  ) {
    // Fetch HTML data once and extract crag overview info (cragTopos, headerImage)
    const defaultCragHtmlData: CragOverviewHtmlData = {
      cragTopos: [],
      headerImage: null,
    }
    const cragHtmlData = await this.safeRequest(
      () => this.htmlScraper.getCragOverviewHtmlData(urlPath),
      defaultCragHtmlData,
      `cragHtmlData for realCrag ${nodeId}`,
    )
    const { cragTopos, headerImage } = cragHtmlData

    // Fetch API data
    const areas = await this.safeRequest(
      () => this.extractNodeChildren(nodeId),
      [],
      `nodeChildren for realCrag ${nodeId}`,
    )

    // Process areas (may be empty if nodeChildren fetch failed)
    const processedAreas = await this.buildAreas(areas)

    return {
      id: nodeId,
      name: info.data.name,
      type: info.data.subType,
      info: info.data,
      parents,
      cragTopos,
      headerImage,
      areas: processedAreas,
      // Aggregate gbRoutes and gbAscents from all areas
      gbRoutes: GradeDistributionBuilder.aggregateGbRoutes(processedAreas),
      gbAscents: GradeDistributionBuilder.aggregateGbAscents(processedAreas),
    }
  }

  async execute(node: Node): Promise<ScrapedCrag> {
    const normalizedNode = this.normalizeUrl(node)
    logger.info(
      'scraper:execute',
      `Starting scrape for: https://www.thecrag.com/${normalizedNode}`,
    )

    const html = await this.curl.requestHtml(
      `https://www.thecrag.com/${normalizedNode}`,
    )

    const nodeId = this.extractNodeId(html)
    if (!nodeId) {
      throw new Error('Node ID not found')
    }

    // Extraer jerarquía de padres desde breadcrumbs
    const parents = this.extractParentChain(html)

    const info = await this.extractNodeInfo(nodeId)
    const urlPath = this.htmlScraper.buildUrlPath(info.data, nodeId)

    logger.info(
      'MATO:SCRAPER',
      `🏔️  Starting: https://www.thecrag.com${urlPath}`,
    )

    const response = this.hasSubAreas(info)
      ? await this.realCrag(urlPath, nodeId, info, parents)
      : await this.virtualCrag(urlPath, nodeId, info, parents)

    logger.info('scraper:execute', `Response: ${JSON.stringify(response)}`)

    return response
  }
}
