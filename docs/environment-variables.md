# Environment Variables

This document lists all environment variables used across the application.

## Proxy Configuration

### `PROXY_URLS`

Comma-separated list of proxy URLs for HTTP requests (scraping, external APIs).

- **Required**: No (but recommended for scraping)
- **Type**: String (comma-separated URLs)
- **Format**: `http://user:pass@host:port,http://user:pass@host2:port,...`
- **Used by**: TheCrag scraper, potentially other HTTP clients

**Example:**

```bash
PROXY_URLS=http://user:pass@142.91.118.11:29842,http://user:pass@142.91.118.113:29842,http://user:pass@23.81.124.114:29842
```

**Usage in code:**

```typescript
import { getProxyUrls, hasProxyUrls } from '@shared'

if (hasProxyUrls()) {
  const proxies = getProxyUrls()
  // ['http://user:pass@host1:port', 'http://user:pass@host2:port', ...]
}
```

## Weather API (Meteoblue)

### `METEOBLUE_API_KEY`

Your Meteoblue API key for accessing weather data.

- **Required**: Yes (for weather features)
- **Type**: String
- **Where to get it**: [Meteoblue Weather API](https://www.meteoblue.com/en/weather-api)

### `METEOBLUE_SHARED_SECRET`

Your Meteoblue shared secret for generating API request signatures.

- **Required**: Yes (for weather features)
- **Type**: String
- **Where to get it**: Same location as your API key in the Meteoblue dashboard

See `packages/weather/ENV_CONFIG.md` for detailed signature documentation.

## Database

### `DATABASE_URL`

PostgreSQL connection string for the main database.

- **Required**: Yes
- **Type**: String (PostgreSQL connection URL)
- **Example**: `postgresql://user:password@localhost:5432/climb_app`

### `TEST_DATABASE_URL`

PostgreSQL connection string for the test database (integration tests).

- **Required**: Yes (for running integration tests)
- **Type**: String (PostgreSQL connection URL)
- **Example**: `postgresql://user:password@localhost:5432/climb_app_test`

## Example `.env` File

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/climb_app
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/climb_app_test

# Weather API
METEOBLUE_API_KEY=your_api_key_here
METEOBLUE_SHARED_SECRET=your_shared_secret_here

# Proxy Configuration (comma-separated list)
PROXY_URLS=http://user:pass@host1:port,http://user:pass@host2:port
```
