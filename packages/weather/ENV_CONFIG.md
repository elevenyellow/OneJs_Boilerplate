# Weather API Package - Environment Variables

The `weather-api` package requires the following environment variables:

## Required Variables

### `METEOBLUE_API_KEY`

Your Meteoblue API key for accessing weather data.

- **Required**: Yes
- **Type**: String
- **Where to get it**: [Meteoblue Weather API](https://www.meteoblue.com/en/weather-api)
- **Example**: `936faad12e2a`

### `METEOBLUE_SHARED_SECRET`

Your Meteoblue shared secret for generating API request signatures.

- **Required**: Yes
- **Type**: String
- **Where to get it**: Same location as your API key in the Meteoblue dashboard
- **Example**: `j}8Lb}?H`
- **Purpose**: Used to generate MD5 signatures that authenticate your API requests

**Setup:**

1. Copy `.env.example` to `.env` in the project root (if not already exists)
2. Add your Meteoblue credentials:
   ```bash
   METEOBLUE_API_KEY=your_actual_key_here
   METEOBLUE_SHARED_SECRET=your_actual_secret_here
   ```

**Note:** The MeteoblueClient will throw an error on initialization if the API key is not set. The shared secret has a default fallback value but it's recommended to set it explicitly.

## How API Signatures Work

Meteoblue API uses MD5 signatures to prevent unauthorized access and ensure request integrity. For each request:

1. A timestamp for expiration (`expire`) is added to the URL (24 hours from now)
2. The complete URL path (including packages and all parameters) is concatenated with `&secret=YOUR_SECRET`
3. An MD5 hash is generated from this complete string
4. The hash is added as the `sig` parameter (the secret itself is NOT sent)

Example:
```typescript
// URL path: /packages/basic-day?lat=38.273&lon=-0.5397&...&expire=1768060320&apikey=xxx
// Input to hash: /packages/basic-day?lat=38.273&lon=-0.5397&...&expire=1768060320&apikey=xxx&secret=j}8Lb}?H
// Signature: fcaf5772ffadaefdf43b0a8680fd98cf
// Final URL: https://my.meteoblue.com/packages/basic-day?lat=38.273&lon=-0.5397&...&expire=1768060320&apikey=xxx&sig=fcaf5772ffadaefdf43b0a8680fd98cf
```

**Important**: The signature is calculated over the ENTIRE path including `/packages/PACKAGE_NAMES?params`, not just the query parameters.

This is all handled automatically by the `MeteoblueClient`.

## Optional Configuration

You can also pass configuration directly when instantiating MeteoblueClient:

```typescript
import { MeteoblueClient } from '@packages/weather-api'

const client = new MeteoblueClient(logger, {
  apiKey: 'your-key-here',        // Override env var
  sharedSecret: 'your-secret',    // Override env var
  timeout: 60000,                 // 60 seconds
  maxRetries: 5,
})
```

However, using environment variables is recommended for production deployments.
