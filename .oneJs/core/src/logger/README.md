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

// Use default logger
logger.info('Application started')
logger.warn('This is a warning')
logger.error('Something went wrong')

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

// Basic logs
logger.info('User logged in')
logger.warn('Performance degradation detected')
logger.error('Database connection failed')
logger.trace('Detailed trace information')
```

### Logs with Context

```typescript
logger.info('User login attempt', { 
  userId: 'user123', 
  ip: '192.168.1.1', 
  userAgent: 'Mozilla/5.0...' 
})

logger.error('Database connection failed', { 
  error: 'Connection timeout',
  retryCount: 3,
  lastAttempt: new Date().toISOString()
})
```

### Specific Log Types

```typescript
// User actions
logger.userAction('purchase', 'user456', { 
  amount: 99.99, 
  currency: 'USD' 
})

// System information
logger.systemInfo('Cache cleared successfully', { 
  cacheSize: '2.5MB',
  itemsRemoved: 150
})

// Business logic
logger.businessLogic('Order processing completed', { 
  orderId: 'order-789',
  processingTime: '2.3s'
})

// Warnings
logger.deprecatedFeature('old-api', 'new-api')
logger.performanceWarning('Slow query detected', { duration: '2.5s' })
logger.securityWarning('Multiple failed login attempts', { attempts: 5 })

// Errors
logger.validationError('Invalid email format', 'email', 'invalid-email')
logger.databaseError('Connection timeout', 'SELECT * FROM users WHERE id = ?')
logger.apiError('Rate limit exceeded', '/api/users', 429)
logger.authenticationError('Invalid credentials', 'user123')
logger.systemError('Memory limit exceeded', 'cache-service')
logger.businessError('Insufficient funds', 'payment-processing')
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
- `logger.info(message, context?)`
- `logger.warn(message, context?)`
- `logger.error(message, context?)`
- `logger.debug(key, message, context?)`
- `logger.trace(message, context?)`

#### Specific Info Methods
- `logger.userAction(action, userId?, context?)`
- `logger.systemInfo(message, context?)`
- `logger.businessLogic(message, context?)`

#### Specific Warning Methods
- `logger.deprecatedFeature(feature, alternative?, context?)`
- `logger.performanceWarning(message, metrics?)`
- `logger.securityWarning(message, context?)`
- `logger.configurationWarning(message, context?)`

#### Specific Error Methods
- `logger.validationError(message, field?, value?, context?)`
- `logger.databaseError(message, query?, context?)`
- `logger.apiError(message, endpoint?, statusCode?, context?)`
- `logger.authenticationError(message, userId?, context?)`
- `logger.systemError(message, component?, context?)`
- `logger.businessError(message, operation?, context?)`

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
