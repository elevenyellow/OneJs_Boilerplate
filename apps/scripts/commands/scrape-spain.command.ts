/**
 * Comando: scrape-spain
 * Scrape toda España (todas las regiones)
 * Wrapper sobre testCountry para conveniencia
 */

import { testCountry } from './test-country.command'

export async function scrapeSpain(container: any, cookie: string) {
  console.log('🇪🇸 Scraping Spain (all regions)...\n')
  await testCountry(container, cookie, 'Spain')
}
