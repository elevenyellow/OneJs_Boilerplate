# Weather API Package - Environment Variables

The `weather-api` package requires the following environment variables:

## Required Variables

### `METEOBLUE_API_KEY`

Your Meteoblue API key for accessing weather data.

- **Required**: Yes
- **Type**: String
- **Where to get it**: [Meteoblue Weather API](https://www.meteoblue.com/en/weather-api)
- **Example**: `936faad12e2a`

**Setup:**

1. Copy `.env.example` to `.env` in the project root (if not already exists)
2. Add your Meteoblue API key:
   ```bash
   METEOBLUE_API_KEY=your_actual_key_here
   ```

**Note:** The MeteoblueClient will throw an error on initialization if this variable is not set.

## Optional Configuration

You can also pass configuration directly when instantiating MeteoblueClient:

```typescript
import { MeteoblueClient } from '@packages/weather-api'

const client = new MeteoblueClient(logger, {
  apiKey: 'your-key-here',  // Override env var
  timeout: 60000,           // 60 seconds
  maxRetries: 5,
})
```

However, using environment variables is recommended for production deployments.
