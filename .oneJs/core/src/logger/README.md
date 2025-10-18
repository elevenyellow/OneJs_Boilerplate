# EyJsLogger

[![npm version](https://badge.fury.io/js/eyjslogger.svg)](https://badge.fury.io/js/eyjslogger)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An extensible logging system that combines **debug** for debugging with keys and **pino** for structured logging and server transmission.

## ✨ Features

- 🔍 **Debug with keys**: Uses the `debug` library for filtering logs by specific keys
- 📊 **Structured logging**: Uses `pino` for structured logging with context
- 🚀 **Server transmission**: Configuration for sending logs to remote servers
- 🎯 **Strongly typed**: Fully typed with TypeScript
- 🔧 **Extensible**: Easy to extend with new log types
- 🎨 **Consistent API**: `logger.method` format for all logs
- 🌈 **Colorized output**: Different colors for different log levels
- ⚡ **High performance**: Minimal overhead in production

## 📦 Installation

```bash
npm install eyjslogger
# or
yarn add eyjslogger
# or
bun add eyjslogger
```

## 🚀 Quick Start

```typescript
import { logger, createLogger } from 'eyjslogger'

// Use default logger - all methods require a key and message
logger.info('app:startup', 'Application started')
logger.warn('app:config', 'This is a warning')
logger.error('app:fatal', 'Something went wrong')

// Create custom logger
const customLogger = createLogger({
  level: 'debug',
  enableDebug: true,
  debugKeys: ['my-app:database', 'my-app:api'],
  serviceName: 'my-service'
})
```

## 📖 Usage

### Basic Logging

```typescript
import { logger } from 'eyjslogger'

// Basic logs - all require a key as first parameter
logger.info('user:auth', 'User logged in')
logger.warn('system:performance', 'Performance degradation detected')
logger.error('db:connection', 'Database connection failed')
logger.trace('app:debug', 'Detailed trace information')
```

### Logs with Context

```typescript
logger.info('user:login', 'User login attempt', { 
  userId: 'user123', 
  ip: '192.168.1.1', 
  userAgent: 'Mozilla/5.0...' 
})

logger.error('db:connection', 'Database connection failed', { 
  error: 'Connection timeout',
  retryCount: 3,
  lastAttempt: new Date().toISOString()
})
```

### Specific Log Types

```typescript
// User actions - key is now the first parameter
logger.userAction('user:action', 'purchase', 'user456', { 
  amount: 99.99, 
  currency: 'USD' 
})

// System information
logger.systemInfo('system:cache', 'Cache cleared successfully', { 
  cacheSize: '2.5MB',
  itemsRemoved: 150
})

// Business logic
logger.businessLogic('order:processing', 'Order processing completed', { 
  orderId: 'order-789',
  processingTime: '2.3s'
})

// Warnings
logger.deprecatedFeature('api:deprecated', 'old-api', 'new-api')
logger.performanceWarning('db:performance', 'Slow query detected', { duration: '2.5s' })
logger.securityWarning('auth:security', 'Multiple failed login attempts', { attempts: 5 })

// Errors
logger.validationError('validation:email', 'Invalid email format', 'email', 'invalid-email')
logger.databaseError('db:query', 'Connection timeout', 'SELECT * FROM users WHERE id = ?')
logger.apiError('api:ratelimit', 'Rate limit exceeded', '/api/users', 429)
logger.authenticationError('auth:credentials', 'Invalid credentials', 'user123')
logger.systemError('system:memory', 'Memory limit exceeded', 'cache-service')
logger.businessError('business:payment', 'Insufficient funds', 'payment-processing')
```

### Debug with Keys

```typescript
import { logger, DEBUG_KEYS, databaseDebug, apiDebug } from 'eyjslogger'

// Debug with specific keys
logger.debug(DEBUG_KEYS.DATABASE, 'Executing query', { 
  query: 'SELECT * FROM users',
  duration: '45ms'
})

logger.debug(DEBUG_KEYS.API, 'Request received', { 
  method: 'GET',
  url: '/api/users'
})

// Use predefined debug loggers
databaseDebug('Connection pool status: healthy')
apiDebug('Response sent successfully', { statusCode: 200 })
```

### Environment Configuration

```bash
# Enable debug for specific keys
DEBUG=my-app:database,my-app:api node app.js

# Enable all debug logs
DEBUG=* node app.js

# Use wildcards
DEBUG=my-app:* node app.js
```

### Programmatic Configuration

```typescript
import { createLogger, debugUtils } from 'eyjslogger'

const logger = createLogger({
  level: 'debug',                    // Log level (trace, debug, info, warn, error)
  enableDebug: true,                 // Enable debug system
  debugKeys: ['app:db', 'app:api'],  // Enabled debug keys
  serverUrl: 'https://logs.com/api', // Remote log server URL
  serviceName: 'my-service'          // Service name
})

// Enable/disable debug keys dynamically
debugUtils.enableDebugKeys('app:auth', 'app:cache')
debugUtils.disableDebugKeys('app:db')
```

## 🎨 Color Scheme

- 🔍 **TRACE** - Gray - Very detailed information
- 🐛 **DEBUG** - Cyan - Debugging information
- ℹ️ **INFO** - Green - General information
- ⚠️ **WARN** - Yellow - Warnings
- ❌ **ERROR** - Red - Errors
- 💀 **FATAL** - Magenta - Critical errors

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | `string` | `'info'` | Log level (trace, debug, info, warn, error) |
| `enableDebug` | `boolean` | `true` | Enable debug system |
| `debugKeys` | `string[]` | `[]` | Enabled debug keys |
| `serverUrl` | `string` | `undefined` | Remote log server URL |
| `serviceName` | `string` | `'eyjslogger'` | Service name |

## 📚 API Reference

### Logger Methods

#### Basic Methods
- `logger.info(key, message, context?)`
- `logger.warn(key, message, context?)`
- `logger.error(key, message, context?)`
- `logger.debug(key, message, context?)`
- `logger.trace(key, message, context?)`

#### Specific Info Methods
- `logger.userAction(key, action, userId?, context?)`
- `logger.systemInfo(key, message, context?)`
- `logger.businessLogic(key, message, context?)`

#### Specific Warning Methods
- `logger.deprecatedFeature(key, feature, alternative?, context?)`
- `logger.performanceWarning(key, message, metrics?)`
- `logger.securityWarning(key, message, context?)`
- `logger.configurationWarning(key, message, context?)`

#### Specific Error Methods
- `logger.validationError(key, message, field?, value?, context?)`
- `logger.databaseError(key, message, query?, context?)`
- `logger.apiError(key, message, endpoint?, statusCode?, context?)`
- `logger.authenticationError(key, message, userId?, context?)`
- `logger.systemError(key, message, component?, context?)`
- `logger.businessError(key, message, operation?, context?)`

### Debug Keys

```typescript
import { DEBUG_KEYS } from 'eyjslogger'

DEBUG_KEYS.DATABASE    // 'eyjslogger:database'
DEBUG_KEYS.API         // 'eyjslogger:api'
DEBUG_KEYS.AUTH        // 'eyjslogger:auth'
DEBUG_KEYS.CACHE       // 'eyjslogger:cache'
DEBUG_KEYS.VALIDATION  // 'eyjslogger:validation'
DEBUG_KEYS.PERFORMANCE // 'eyjslogger:performance'
```

### Predefined Debug Loggers

```typescript
import { 
  databaseDebug, 
  apiDebug, 
  authDebug, 
  cacheDebug, 
  validationDebug, 
  performanceDebug 
} from 'eyjslogger'
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

## 📄 License

MIT © [Your Name](https://github.com/yourusername)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

Made with ❤️ by [Your Name](https://github.com/yourusername)
