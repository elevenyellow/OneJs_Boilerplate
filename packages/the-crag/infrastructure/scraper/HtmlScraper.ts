import { Injectable, logger } from '@OneJs/core'
import * as cheerio from 'cheerio'
import type {
  AreaFlattenItem,
  NodeInfoData,
  RouteTableInfo,
  TopoImageData,
  TopoRouteAnnotation,
} from './api.interfaces'
import { Curl } from './Curl'

// Raw topo route data from JSON parsing
interface RawTopoRoute {
  id: string
  type?: string
  num?: string
  grade?: string
  class?: string
  zindex?: string
  name?: string
  stars?: string
  style?: string
  order?: number
  url?: string
  points?: string
}

// Combined data from a single HTML request for an area page
export interface AreaHtmlData {
  topos: TopoImageData[]
  headerImage: string | null
  routesTableInfo: Map<string, RouteTableInfo>
}

// Combined data from a single HTML request for a crag overview page
export interface CragOverviewHtmlData {
  cragTopos: TopoImageData[]
  headerImage: string | null
}

@Injectable()
export class HtmlScraper {
  private readonly curl: Curl
  private readonly BASE_URL = 'https://www.thecrag.com'

  constructor(cookie: string) {
    this.curl = new Curl(cookie)
  }

  buildUrlPath(nodeData: NodeInfoData, nodeId: string): string {
    // Si urlStub contiene '/', es un path completo
    if (nodeData.urlStub && nodeData.urlStub.includes('/')) {
      return `/en/climbing/${nodeData.urlStub}`
    }

    // Si tiene ambos, concatenar
    if (nodeData.urlStub && nodeData.urlAncestorStub) {
      return `/en/climbing/${nodeData.urlAncestorStub}/${nodeData.urlStub}`
    }

    // Solo ancestor
    if (nodeData.urlAncestorStub) {
      return `/en/climbing/${nodeData.urlAncestorStub}/area/${nodeId}`
    }

    // Fallback
    return `/en/climbing/area/${nodeId}`
  }

  buildAreaPath(area: AreaFlattenItem): string {
    const urlStub = area[2]
    const urlAncestorStub = area[3]
    const areaId = area[0]

    if (urlStub && urlAncestorStub) {
      return `/en/climbing/${urlAncestorStub}/${urlStub}`
    }
    if (urlAncestorStub) {
      return `/en/climbing/${urlAncestorStub}/area/${areaId}`
    }
    return `/en/climbing/area/${areaId}`
  }

  async getTopos(urlPath: string): Promise<TopoImageData[]> {
    const html = await this.curl.requestHtml(`${this.BASE_URL}${urlPath}`)
    return this.parseToposFromHtml(html)
  }

  async getHeaderImage(urlPath: string): Promise<string | null> {
    const html = await this.curl.requestHtml(`${this.BASE_URL}${urlPath}`)
    return this.parseHeaderImageFromHtml(html)
  }

  /**
   * Fetches HTML once and extracts all area data (topos, headerImage, routesTableInfo)
   * in a single request to avoid duplicate HTTP calls.
   */
  async getAreaHtmlData(urlPath: string): Promise<AreaHtmlData> {
    const html = await this.curl.requestHtml(`${this.BASE_URL}${urlPath}`)

    return {
      topos: this.parseToposFromHtml(html),
      headerImage: this.parseHeaderImageFromHtml(html),
      routesTableInfo: this.parseRoutesTable(html),
    }
  }

  private parseToposFromHtml(html: string): TopoImageData[] {
    const $ = cheerio.load(html)
    const topos: TopoImageData[] = []

    $('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoId = $el.attr('data-tid') || ''
      const width = parseInt($el.attr('data-width') || '0', 10)
      const height = parseInt($el.attr('data-height') || '0', 10)
      const viewScale = parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      const imgEl = $el.find('img').first()
      const thumbnailUrl = this.normalizeUrl(imgEl.attr('src') || '')
      const fullImageUrl =
        this.normalizeUrl(imgEl.attr('data-big') || '') || thumbnailUrl

      const originalWidth =
        viewScale > 0 ? Math.round(width / viewScale) : width
      const originalHeight =
        viewScale > 0 ? Math.round(height / viewScale) : height

      let routes: TopoRouteAnnotation[] = []
      try {
        const rawRoutes = JSON.parse(topoDataStr)
        if (Array.isArray(rawRoutes)) {
          routes = rawRoutes.map((r: RawTopoRoute) => ({
            id: r.id,
            type: r.type || 'route',
            num: r.num || '',
            grade: r.grade || '',
            gradeClass: r.class || '',
            zindex: r.zindex || '1',
            name: r.name || '',
            stars: r.stars || '',
            style: r.style || '',
            order: r.order || 0,
            url: r.url || '',
            points: r.points || '',
          }))
        }
      } catch (err) {
        logger.warn(
          'MATO:SCRAPER:HTML',
          `Failed to parse topo annotations for ${topoId}`,
          {
            error: err,
          },
        )
      }

      if (topoId && (thumbnailUrl || fullImageUrl)) {
        topos.push({
          topoId,
          width,
          height,
          viewScale,
          thumbnailUrl,
          fullImageUrl,
          originalWidth,
          originalHeight,
          routes,
        })
      }
    })

    return topos
  }

  private parseHeaderImageFromHtml(html: string): string | null {
    const $ = cheerio.load(html)

    // 1. OG image
    const ogImage = $('meta[property="og:image"]').attr('content')
    if (ogImage && ogImage.includes('image.thecrag.com')) {
      return this.normalizeUrl(ogImage)
    }

    // 2. Hero/banner images
    const heroImg = $(
      '.hero-image img, .cover-image img, .header-image img',
    ).first()
    if (heroImg.length > 0) {
      const src = heroImg.attr('src') || heroImg.attr('data-src')
      if (src && src.includes('image.thecrag.com')) {
        return this.normalizeUrl(src)
      }
    }

    // 3. First large image
    let foundUrl: string | null = null
    $('img[src*="image.thecrag.com"]').each((_, el) => {
      if (foundUrl) return
      const src = $(el).attr('src') || ''
      const sizeMatch = src.match(/\/(\d+)x(\d+)\//)
      if (sizeMatch) {
        const width = parseInt(sizeMatch[1], 10)
        if (width >= 400) {
          foundUrl = src
        }
      }
    })

    return foundUrl ? this.normalizeUrl(foundUrl) : null
  }

  private normalizeUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `${this.BASE_URL}${url}`
    return url
  }

  async getCragOverviewTopos(urlPath: string): Promise<TopoImageData[]> {
    const html = await this.curl.requestHtml(`${this.BASE_URL}${urlPath}`)
    return this.parseCragOverviewToposFromHtml(html)
  }

  /**
   * Fetches HTML once and extracts crag overview data (cragTopos, headerImage)
   * in a single request to avoid duplicate HTTP calls.
   */
  async getCragOverviewHtmlData(
    urlPath: string,
  ): Promise<CragOverviewHtmlData> {
    const html = await this.curl.requestHtml(`${this.BASE_URL}${urlPath}`)

    return {
      cragTopos: this.parseCragOverviewToposFromHtml(html),
      headerImage: this.parseHeaderImageFromHtml(html),
    }
  }

  private parseCragOverviewToposFromHtml(html: string): TopoImageData[] {
    const $ = cheerio.load(html)
    const topos: TopoImageData[] = []

    // Buscar topos específicamente en el contenedor .phototopo-fsc (full-size crag overview)
    const fscContainer = $('div.phototopo-fsc')
    const searchContext = fscContainer.length > 0 ? fscContainer : $('body')

    searchContext.find('div.phototopo[data-tid]').each((_, el) => {
      const $el = $(el)

      const topoId = $el.attr('data-tid') || ''
      const width = parseInt($el.attr('data-width') || '0', 10)
      const height = parseInt($el.attr('data-height') || '0', 10)
      const viewScale = parseFloat($el.attr('data-view-scale') || '1')
      const topoDataStr = $el.attr('data-topodata') || '[]'

      const imgEl = $el.find('img').first()
      const thumbnailUrl = this.normalizeUrl(imgEl.attr('src') || '')
      const fullImageUrl =
        this.normalizeUrl(imgEl.attr('data-big') || '') || thumbnailUrl

      const originalWidth =
        viewScale > 0 ? Math.round(width / viewScale) : width
      const originalHeight =
        viewScale > 0 ? Math.round(height / viewScale) : height

      let routes: TopoRouteAnnotation[] = []
      try {
        const rawData = JSON.parse(topoDataStr)
        if (Array.isArray(rawData)) {
          routes = rawData.map((r: RawTopoRoute) => ({
            id: r.id,
            type: r.type || 'area', // Default 'area' para crag overview
            num: r.num || '',
            grade: r.grade || '',
            gradeClass: r.class || '',
            zindex: r.zindex || '1',
            name: r.name || '',
            stars: r.stars || '',
            style: r.style || '',
            order: r.order || 0,
            url: r.url || '',
            points: r.points || '',
          }))
        }
      } catch {
        logger.warn(
          'MATO:SCRAPER:HTML',
          `Failed to parse crag topo annotations for ${topoId}`,
        )
      }

      if (topoId && (thumbnailUrl || fullImageUrl)) {
        topos.push({
          topoId,
          width,
          height,
          viewScale,
          thumbnailUrl,
          fullImageUrl,
          originalWidth,
          originalHeight,
          routes,
        })
      }
    })

    return topos
  }

  async getRoutesTableInfo(
    urlPath: string,
  ): Promise<Map<string, RouteTableInfo>> {
    const html = await this.curl.requestHtml(`${this.BASE_URL}${urlPath}`)
    return this.parseRoutesTable(html)
  }

  private parseRoutesTable(html: string): Map<string, RouteTableInfo> {
    const $ = cheerio.load(html)
    const routesMap = new Map<string, RouteTableInfo>()

    $('.route[data-nid]').each((_, el) => {
      const $route = $(el)
      const routeId = $route.attr('data-nid')

      if (!routeId) return

      // Equipador (Set)
      const setInfo = $route
        .find('.route-history .fa')
        .filter((_, p) => {
          return $(p).find('.fa__what').text().trim() === 'Set:'
        })
        .first()

      const equipper = setInfo.find('.fa__who').text().trim() || null
      const equipDate = setInfo.find('.fa_when').text().trim() || null

      // Mantenimiento (Maint)
      const maintInfo = $route
        .find('.route-history .fa')
        .filter((_, p) => {
          return $(p).find('.fa__what').text().trim() === 'Maint:'
        })
        .first()

      const maintainer = maintInfo.find('.fa__who').text().trim() || null
      const maintDate = maintInfo.find('.fa_when').text().trim() || null

      // Descripción (sin incluir route-history)
      const $desc = $route.find('.markdown.desc').clone()
      $desc.find('.route-history').remove()
      const description = $desc.text().trim() || null

      // Nombres alternativos
      const akaNames: string[] = []
      $route.find('.aka').each((_, aka) => {
        const nextText = $(aka).get(0)?.nextSibling
        if (nextText && nextText.nodeType === 3) {
          // Text node
          const text = nextText.nodeValue?.trim()
          if (text) akaNames.push(text)
        }
      })

      // Estado
      const isClosed = $route.find('.label-important').length > 0
      const hasWarning = $route.find('.label-warning').length > 0
      const warningText = hasWarning
        ? $route.find('.label-warning').parent().text().trim()
        : null

      // Topo
      const hasTopo = $route.find('.num.hastopo').length > 0
      const topoNumber = $route.find('.num.toponum').text().trim() || null

      routesMap.set(routeId, {
        id: routeId,
        equipper,
        equipDate,
        maintainer,
        maintDate,
        description,
        akaNames: akaNames.length > 0 ? akaNames : undefined,
        isClosed,
        hasWarning,
        warningText,
        hasTopo,
        topoNumber,
      })
    })

    return routesMap
  }
}
