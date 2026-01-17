# Meteoblue API Signature Setup

## Overview

As of the latest update, the Meteoblue API requires **request signatures** to authenticate API calls. This prevents unauthorized access and ensures request integrity.

## What Changed

Previously, only the API key was required. Now, you also need:

1. **API Key** (`METEOBLUE_API_KEY`)
2. **Shared Secret** (`METEOBLUE_SHARED_SECRET`)

## How It Works

For every API request:

1. **Generate Expiration**: Timestamp 24 hours in the future (Unix timestamp in seconds)
2. **Build URL Path**: Complete URL path including `/packages/PACKAGE_NAMES?all_params&apikey=xxx`
3. **Create Signature**: MD5 hash of `urlPath + "&secret=" + sharedSecret`
4. **Append Signature**: Add `sig` parameter to the final URL (without secret)

### Example Flow

```
Original Parameters:
- packages: basic-day
- lat: 38.273
- lon: -0.5397
- expire: 1768060320
- apikey: 936faad12e2a

URL Path:
/packages/basic-day?lat=38.273&lon=-0.5397&expire=1768060320&apikey=936faad12e2a

Input to Hash:
/packages/basic-day?lat=38.273&lon=-0.5397&expire=1768060320&apikey=936faad12e2a&secret=j}8Lb}?H

MD5 Signature:
fcaf5772ffadaefdf43b0a8680fd98cf

Final URL:
https://my.meteoblue.com/packages/basic-day?lat=38.273&lon=-0.5397&expire=1768060320&apikey=936faad12e2a&sig=fcaf5772ffadaefdf43b0a8680fd98cf
```

**Important**: The signature is calculated over the ENTIRE path including `/packages/PACKAGE_NAMES`, not just the query string.

## Setup Instructions

### 1. Get Your Credentials

1. Log in to [Meteoblue](https://www.meteoblue.com)
2. Navigate to your account/API settings
3. You should see:
   - **API Key**: e.g., `936faad12e2a`
   - **Shared Secret**: e.g., `j}8Lb}?H`

### 2. Configure Environment Variables

Add both variables to your `.env` file:

```bash
# Meteoblue API Credentials
METEOBLUE_API_KEY=936faad12e2a
METEOBLUE_SHARED_SECRET=j}8Lb}?H
```

⚠️ **Important**: Replace these with your actual credentials!

### 3. Verify Setup

The `MeteoblueClient` will automatically:
- Read credentials from environment variables
- Generate timestamps for each request
- Calculate signatures using MD5
- Append signatures to URLs

You don't need to do anything manually!

## Code Implementation

The signature generation is implemented in `meteoblue.client.ts`:

```typescript
private buildUrl(coordinates: Coordinates, customPackages?: MeteobluePackage[]): string {
  const packages = customPackages?.join('_') || this.defaultPackages.join('_')
  
  // Generate expiration timestamp (24 hours from now)
  const expire = Math.floor(Date.now() / 1000) + 86400
  
  const params = {
    lat: coordinates.latitude,
    lon: coordinates.longitude,
    asl: 15,
    tz: 'UTC',
    temperature: 'C',
    // ... other params
    expire: expire,
    apikey: this.apiKey,
  }
  
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  
  // Build URL path for signing (including secret)
  const urlPathForSigning = `/packages/${packages}?${queryString}&secret=${this.sharedSecret}`
  
  // Generate signature
  const signature = this.generateSignature(urlPathForSigning)
  
  // Return URL without secret, only with sig
  return `${this.baseUrl}/packages/${packages}?${queryString}&sig=${signature}`
}

private generateSignature(urlPathWithSecret: string): string {
  return crypto.createHash('md5').update(urlPathWithSecret, 'utf8').digest('hex')
}
```

This matches the logic found in the Meteoblue Android app.

## Troubleshooting

### Error: "Signature with shared secret does not match"

**Cause**: The signature is incorrect.

**Solutions**:
1. **Check credentials**: Ensure `METEOBLUE_SHARED_SECRET` is set correctly in `.env`
2. **Restart server**: Environment variables are read at startup
3. **Check for typos**: The secret is case-sensitive and includes special characters
4. **Verify timestamp**: Make sure your system clock is accurate

### Error: "METEOBLUE_API_KEY is not configured"

**Cause**: API key not found in environment.

**Solution**: Add `METEOBLUE_API_KEY` to your `.env` file.

### Request works but returns 403

This usually means:
- The signature algorithm is incorrect (unlikely if using our implementation)
- The shared secret is wrong
- The expiration timestamp has passed (URLs are valid for 24 hours)
- The parameter order doesn't match what was used to generate the signature

## Security Notes

- ✅ The shared secret is used for **signature generation only**
- ✅ It's never sent in the request (only the resulting signature is sent)
- ⚠️ Keep both API key and shared secret confidential
- ⚠️ Never commit `.env` files to version control

## Testing

To verify your setup works:

```typescript
import { WeatherService } from '@packages/weather-api'

const weather = await weatherService
  .getByCoordinates({ latitude: 39.47, longitude: -0.38 })
  .parsed()

console.log('Success!', weather.current.temperature)
```

If you see weather data, signatures are working correctly! 🎉

## Default Fallback

The implementation includes a default shared secret (`j}8Lb}?H`) as a fallback. However:

- ⚠️ **Do NOT rely on this default in production**
- Always set your own `METEOBLUE_SHARED_SECRET` in `.env`
- The default is only for development/testing

## Further Reading

- [Meteoblue API Documentation](https://www.meteoblue.com/en/weather-api)
- [HMAC Authentication](https://en.wikipedia.org/wiki/HMAC)
- [MD5 Hash Function](https://en.wikipedia.org/wiki/MD5)

---

**Last Updated**: January 9, 2026
**Implementation**: Based on reverse-engineering of Meteoblue Android app (com.meteoblue.droid.data.network.ApiUtility)
