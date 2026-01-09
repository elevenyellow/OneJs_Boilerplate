// Test examples for sector search API
// Run with: bun test packages/sector/application/use-cases/__tests__/search-sectors.test.ts

import { describe, it, expect, beforeAll } from 'bun:test'
import type { SearchSectorsDto } from '@sector/domain/dtos/search-sectors.dto'

/**
 * Manual test examples for the sector search API
 * These require a running server with data
 */

describe('Sector Search API - Manual Tests', () => {
  const API_URL = 'http://localhost:4000/api/sectors/search'

  describe('Summer searches', () => {
    it('should find shaded sectors near Valencia in summer', async () => {
      const request: SearchSectorsDto = {
        userLocation: { lat: 39.5, lon: -0.5 },
        gradeRange: { min: '6b', max: '7a' },
        maxDistance: 80,
        currentMonth: 7, // July
        minRoutes: 10,
        limit: 5,
      }

      console.log('Test 1: Summer search')
      console.log('Expected: Sectors with N, NE, NW orientation')
      console.log('Request:', JSON.stringify(request, null, 2))
    })
  })

  describe('Winter searches', () => {
    it('should find sunny sectors near Valencia in winter', async () => {
      const request: SearchSectorsDto = {
        userLocation: { lat: 39.5, lon: -0.5 },
        gradeRange: { min: '6a', max: '6c' },
        maxDistance: 80,
        currentMonth: 1, // January
        minRoutes: 15,
        limit: 5,
      }

      console.log('Test 2: Winter search')
      console.log('Expected: Sectors with S, SE, SW orientation')
      console.log('Request:', JSON.stringify(request, null, 2))
    })
  })

  describe('Advanced filters', () => {
    it('should find limestone sectors with topos', async () => {
      const request: SearchSectorsDto = {
        userLocation: { lat: 39.5, lon: -0.5 },
        gradeRange: { min: '6c', max: '7b' },
        maxDistance: 100,
        rockTypes: ['Limestone'],
        hasTopo: true,
        minRoutes: 20,
        limit: 5,
      }

      console.log('Test 3: Limestone with topos')
      console.log('Expected: Limestone sectors with many 6c-7b routes and topos')
      console.log('Request:', JSON.stringify(request, null, 2))
    })
  })

  describe('Grade ranges', () => {
    it('should find beginner-friendly sectors', async () => {
      const request: SearchSectorsDto = {
        userLocation: { lat: 39.5, lon: -0.5 },
        gradeRange: { min: '5a', max: '6a' },
        maxDistance: 50,
        minRoutes: 10,
        limit: 5,
      }

      console.log('Test 4: Beginner search')
      console.log('Expected: Sectors with many 5a-6a routes')
      console.log('Request:', JSON.stringify(request, null, 2))
    })

    it('should find advanced sectors', async () => {
      const request: SearchSectorsDto = {
        userLocation: { lat: 39.5, lon: -0.5 },
        gradeRange: { min: '7b', max: '8a' },
        maxDistance: 150,
        minRoutes: 5,
        limit: 5,
      }

      console.log('Test 5: Advanced climber search')
      console.log('Expected: Sectors with hard routes (7b-8a)')
      console.log('Request:', JSON.stringify(request, null, 2))
    })
  })

  describe('Orientation override', () => {
    it('should force shade preference regardless of season', async () => {
      const request: SearchSectorsDto = {
        userLocation: { lat: 39.5, lon: -0.5 },
        gradeRange: { min: '6b', max: '7a' },
        maxDistance: 80,
        forceOrientation: 'shade',
        minRoutes: 10,
        limit: 5,
      }

      console.log('Test 6: Force shade orientation')
      console.log('Expected: Shaded sectors regardless of current month')
      console.log('Request:', JSON.stringify(request, null, 2))
    })
  })
})

// How to run manual tests:
console.log(`
========================================
MANUAL TEST INSTRUCTIONS
========================================

1. Start the API server:
   bun run start:api:dev

2. Ensure you have sector data in the database

3. Run the test script:
   ./test-sector-search.sh

4. Or use curl directly:
   curl -X POST http://localhost:4000/api/sectors/search \\
     -H "Content-Type: application/json" \\
     -d '{
       "userLocation": { "lat": 39.5, "lon": -0.5 },
       "gradeRange": { "min": "6b", "max": "7a" },
       "maxDistance": 80,
       "currentMonth": 7,
       "limit": 5
     }'

Expected response fields:
- results: Array of sectors with scoring
- total: Total number of results
- filters: Applied filters
- metadata: Search info (time, season, orientation)

Each result includes:
- sector: Full sector data
- relevanceScore: 0-100
- distance: km from user location
- routesInUserRange: Count of routes in grade range
- matchReasons: Human-readable explanations
- scoringBreakdown: Detailed score components
`)
