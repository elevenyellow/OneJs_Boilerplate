import { Injectable } from '@OneJs/core'
import {
  ScrapedZoneDto,
  type ScrapedZoneData,
} from '@scraper-thecrag/domain/dtos/scraped-zone.dto'
import type { ClimbType } from '@scraper-thecrag/domain/entities/climbing-zone.entity'
import * as cheerio from 'cheerio'

export interface ParsedAreaLink {
  name: string
  url: string
  routeCount?: number
}

import { CragAreaDto } from '@scraper-thecrag/domain/dtos/crag-area.dto'

@Injectable()
export class TheCragParserService {
  private readonly BASE_URL = 'https://www.thecrag.com'

  /**
   * Parsea los resultados de la búsqueda
   */
  parseSearchResults(html: string): CragAreaDto[] {
    const $ = cheerio.load(html)
    const results: CragAreaDto[] = []

    // Selectores para resultados de búsqueda
    $('.search-result .area, .node-item').each((_, element) => {
      const $el = $(element)
      const $link = $el.find('a').first()
      const href = $link.attr('href')
      const name = $link.text().trim() || $el.find('.name').text().trim()

      if (href && name && href.startsWith('/climbing/')) {
        // Extraer ID
        const idMatch = href.match(/\/(\d+)(?:\/|$)/)
        const id = idMatch
          ? idMatch[1]
          : href.split('/').pop()?.replace(/\D/g, '') || ''

        // Tipo (Area, Crag, etc)
        const type = $el.find('.type').text().trim() || 'Area'

        // Conteo de rutas
        const routesText = $el.find('.routes').text()
        const routesCount = this.extractNumber(routesText)

        if (id) {
          results.push(
            new CragAreaDto(
              id,
              name,
              this.normalizeUrl(href),
              type,
              routesCount,
            ),
          )
        }
      }
    })

    return results
  }

  /**
   * Parsea la página principal de un país/región para extraer subáreas
   */
  parseAreaLinks(html: string): ParsedAreaLink[] {
    const $ = cheerio.load(html)
    const links: ParsedAreaLink[] = []

    // TheCrag usa diferentes selectores para listar áreas
    // Selector para la lista de áreas hijas
    $(
      'div.area-children a.area-link, ul.areas-list li a, .node-list .node-item a',
    ).each((_, element) => {
      const $el = $(element)
      const href = $el.attr('href')
      const name = $el.text().trim()

      if (href && name && href.startsWith('/climbing/')) {
        const routeCountText = $el.find('.route-count, .stat-routes').text()
        const routeCount = this.extractNumber(routeCountText)

        links.push({
          name,
          url: this.normalizeUrl(href),
          routeCount,
        })
      }
    })

    // Selector alternativo para la vista de tarjetas
    $('.area-card, .crag-card').each((_, element) => {
      const $el = $(element)
      const $link = $el.find('a').first()
      const href = $link.attr('href')
      const name = $el
        .find('.area-name, .crag-name, h3, h4')
        .first()
        .text()
        .trim()

      if (href && name && href.startsWith('/climbing/')) {
        const routeCountText = $el.find('.route-count, .routes').text()
        const routeCount = this.extractNumber(routeCountText)

        links.push({
          name,
          url: this.normalizeUrl(href),
          routeCount,
        })
      }
    })

    // Eliminar duplicados por URL
    const uniqueLinks = links.reduce((acc, link) => {
      if (!acc.find((l) => l.url === link.url)) {
        acc.push(link)
      }
      return acc
    }, [] as ParsedAreaLink[])

    return uniqueLinks
  }

  /**
   * Parsea los detalles de una zona/sector específica
   */
  parseZoneDetails(html: string, sourceUrl: string): ScrapedZoneDto | null {
    const $ = cheerio.load(html)

    try {
      // Extraer ID externo de la URL
      const externalId = this.extractExternalId(sourceUrl)
      if (!externalId) return null

      // Nombre de la zona
      const name = this.extractName($)
      if (!name) return null

      // Ubicación
      const { country, region } = this.extractLocation($)
      if (!country) return null

      // Coordenadas
      const { latitude, longitude } = this.extractCoordinates($)

      // Estadísticas
      const routeCount = this.extractRouteCount($)
      const climbTypes = this.extractClimbTypes($)
      const { minGrade, maxGrade } = this.extractGradeRange($)

      // Información adicional
      const description = this.extractDescription($)
      const accessInfo = this.extractAccessInfo($)
      const imageUrl = this.extractImageUrl($)

      const data: ScrapedZoneData = {
        externalId,
        name,
        country,
        region,
        latitude,
        longitude,
        routeCount,
        climbTypes,
        minGrade,
        maxGrade,
        description,
        accessInfo,
        imageUrl,
        sourceUrl,
      }

      const dto = ScrapedZoneDto.fromScrapedData(data)
      return dto.isValid() ? dto : null
    } catch (error) {
      console.error(`Error parsing zone details from ${sourceUrl}:`, error)
      return null
    }
  }

  /**
   * Parsea la lista de países disponibles desde la página principal
   */
  parseCountryList(html: string): ParsedAreaLink[] {
    const $ = cheerio.load(html)
    const countries: ParsedAreaLink[] = []

    // Buscar enlaces a países en la navegación o índice
    $('a[href^="/climbing/"]').each((_, element) => {
      const $el = $(element)
      const href = $el.attr('href')
      const name = $el.text().trim()

      // Filtrar solo enlaces de primer nivel (países)
      if (href && name && this.isCountryLink(href)) {
        countries.push({
          name,
          url: this.normalizeUrl(href),
        })
      }
    })

    return countries
  }

  private extractExternalId(url: string): string | null {
    // TheCrag usa IDs numéricos en las URLs
    // Ejemplo: /climbing/spain/catalonia/montserrat/12345678
    const match = url.match(/\/(\d+)(?:\/|$)/)
    if (match) return match[1]

    // Alternativa: usar el slug de la URL
    const slugMatch = url.match(/\/climbing\/(.+?)(?:\?|$)/)
    if (slugMatch) {
      return slugMatch[1].replace(/\//g, '-')
    }

    return null
  }

  private extractName($: cheerio.CheerioAPI): string | null {
    // Intentar varios selectores para el nombre
    const selectors = [
      'h1.area-name',
      'h1.node-name',
      '.area-header h1',
      '.crag-header h1',
      'h1',
    ]

    for (const selector of selectors) {
      const name = $(selector).first().text().trim()
      if (name && name.length > 0) {
        return name
      }
    }

    return null
  }

  private extractLocation($: cheerio.CheerioAPI): {
    country: string | null
    region: string | null
  } {
    // Buscar en el breadcrumb
    const breadcrumbs: string[] = []
    $('.breadcrumb a, .breadcrumbs a, nav.breadcrumb a').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text !== 'Home' && text !== 'World') {
        breadcrumbs.push(text)
      }
    })

    // El primer elemento suele ser el país
    const country = breadcrumbs[0] || null
    const region =
      breadcrumbs.length > 1 ? breadcrumbs.slice(1).join(' > ') : null

    return { country, region }
  }

  private extractCoordinates($: cheerio.CheerioAPI): {
    latitude: number
    longitude: number
  } {
    // Buscar coordenadas en meta tags o data attributes
    const geoMeta = $('meta[name="geo.position"]').attr('content')
    if (geoMeta) {
      const [lat, lon] = geoMeta.split(';').map(Number)
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon }
      }
    }

    // Buscar en elementos con data attributes
    const mapEl = $('[data-lat][data-lng], [data-latitude][data-longitude]')
    if (mapEl.length) {
      const lat = parseFloat(
        mapEl.attr('data-lat') || mapEl.attr('data-latitude') || '0',
      )
      const lon = parseFloat(
        mapEl.attr('data-lng') || mapEl.attr('data-longitude') || '0',
      )
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
        return { latitude: lat, longitude: lon }
      }
    }

    // Buscar en scripts JSON-LD
    const jsonLd = $('script[type="application/ld+json"]').text()
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd)
        if (data.geo) {
          return {
            latitude: data.geo.latitude || 0,
            longitude: data.geo.longitude || 0,
          }
        }
      } catch {
        // Ignorar errores de parsing JSON
      }
    }

    // Buscar texto con formato de coordenadas
    const coordText = $('.coordinates, .gps, .location-coords').text()
    const coordMatch = coordText.match(/(-?\d+\.?\d*)[°\s,]+\s*(-?\d+\.?\d*)/)
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
      }
    }

    return { latitude: 0, longitude: 0 }
  }

  private extractRouteCount($: cheerio.CheerioAPI): number {
    const selectors = [
      '.stat-routes .value',
      '.routes-count',
      '.route-count',
      '[data-routes]',
      '.stats .routes',
    ]

    for (const selector of selectors) {
      const el = $(selector).first()
      const text = el.attr('data-routes') || el.text()
      const count = this.extractNumber(text)
      if (count > 0) return count
    }

    // Buscar en el texto general
    const statsText = $('.area-stats, .crag-stats, .statistics').text()
    const match = statsText.match(/(\d+)\s*(?:routes?|vías?|rutas?)/i)
    if (match) {
      return parseInt(match[1], 10)
    }

    return 0
  }

  private extractClimbTypes($: cheerio.CheerioAPI): ClimbType[] {
    const types: ClimbType[] = []
    const text = $('body').text().toLowerCase()

    const typeMapping: Record<string, ClimbType> = {
      sport: 'sport',
      deportiva: 'sport',
      boulder: 'boulder',
      bouldering: 'boulder',
      bloque: 'boulder',
      trad: 'trad',
      traditional: 'trad',
      clásica: 'trad',
      mixed: 'mixed',
      mixta: 'mixed',
    }

    // Buscar en badges o etiquetas
    $('.climb-type, .route-type, .tag, .badge').each((_, el) => {
      const tagText = $(el).text().toLowerCase()
      for (const [keyword, type] of Object.entries(typeMapping)) {
        if (tagText.includes(keyword) && !types.includes(type)) {
          types.push(type)
        }
      }
    })

    // Si no encontramos etiquetas específicas, buscar en el texto
    if (types.length === 0) {
      for (const [keyword, type] of Object.entries(typeMapping)) {
        if (text.includes(keyword) && !types.includes(type)) {
          types.push(type)
        }
      }
    }

    return types.length > 0 ? types : ['sport'] // Default a sport
  }

  private extractGradeRange($: cheerio.CheerioAPI): {
    minGrade: string | null
    maxGrade: string | null
  } {
    // Buscar rango de grados
    const gradeText = $('.grade-range, .grades, .difficulty-range').text()
    const rangeMatch = gradeText.match(
      /([3-9][abc]?[+]?)\s*(?:[-–to]+)\s*([3-9][abc]?[+]?)/i,
    )

    if (rangeMatch) {
      return {
        minGrade: rangeMatch[1],
        maxGrade: rangeMatch[2],
      }
    }

    // Buscar en estadísticas
    const statsText = $('.area-stats, .grade-distribution').text()
    const grades = statsText.match(/\b([3-9][abc]?[+]?)\b/gi)

    if (grades && grades.length >= 2) {
      const sortedGrades = [...new Set(grades)].sort(this.compareGrades)
      return {
        minGrade: sortedGrades[0],
        maxGrade: sortedGrades[sortedGrades.length - 1],
      }
    }

    return { minGrade: null, maxGrade: null }
  }

  private extractDescription($: cheerio.CheerioAPI): string | null {
    const selectors = [
      '.area-description',
      '.crag-description',
      '.description',
      '.intro',
      'meta[name="description"]',
    ]

    for (const selector of selectors) {
      if (selector.startsWith('meta')) {
        const content = $(selector).attr('content')
        if (content && content.length > 20) {
          return this.cleanText(content)
        }
      } else {
        const text = $(selector).first().text().trim()
        if (text && text.length > 20) {
          return this.cleanText(text)
        }
      }
    }

    return null
  }

  private extractAccessInfo($: cheerio.CheerioAPI): string | null {
    const selectors = [
      '.access-info',
      '.access',
      '.approach',
      '.getting-there',
      '[data-section="access"]',
    ]

    for (const selector of selectors) {
      const text = $(selector).first().text().trim()
      if (text && text.length > 10) {
        return this.cleanText(text)
      }
    }

    return null
  }

  private extractImageUrl($: cheerio.CheerioAPI): string | null {
    const selectors = [
      'meta[property="og:image"]',
      '.area-image img',
      '.crag-photo img',
      '.main-image img',
      '.gallery img',
    ]

    for (const selector of selectors) {
      if (selector.includes('meta')) {
        const content = $(selector).attr('content')
        if (content) return this.normalizeImageUrl(content)
      } else {
        const src = $(selector).first().attr('src')
        if (src) return this.normalizeImageUrl(src)
      }
    }

    return null
  }

  private isCountryLink(href: string): boolean {
    // Enlaces de países tienen formato /climbing/country-name
    // y no tienen muchos niveles adicionales
    const parts = href.split('/').filter(Boolean)
    return parts.length === 2 && parts[0] === 'climbing'
  }

  private normalizeUrl(href: string): string {
    if (href.startsWith('http')) return href
    return `${this.BASE_URL}${href}`
  }

  private normalizeImageUrl(src: string): string {
    if (src.startsWith('//')) return `https:${src}`
    if (src.startsWith('/')) return `${this.BASE_URL}${src}`
    return src
  }

  private extractNumber(text: string): number {
    const match = text.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim().slice(0, 2000) // Limitar longitud
  }

  private compareGrades(a: string, b: string): number {
    // Comparación simple de grados franceses
    const gradeOrder = [
      '3',
      '4',
      '4+',
      '5a',
      '5b',
      '5c',
      '6a',
      '6a+',
      '6b',
      '6b+',
      '6c',
      '6c+',
      '7a',
      '7a+',
      '7b',
      '7b+',
      '7c',
      '7c+',
      '8a',
      '8a+',
      '8b',
      '8b+',
      '8c',
      '8c+',
      '9a',
      '9a+',
      '9b',
      '9b+',
      '9c',
    ]
    const indexA = gradeOrder.indexOf(a.toLowerCase())
    const indexB = gradeOrder.indexOf(b.toLowerCase())
    return indexA - indexB
  }
}
