# 🔄 Sistema de Reintentos con Proxies

**Ubicación**: `packages/the-crag/infrastructure/scraper/`  
**Estado**: ✅ **COMPLETAMENTE FUNCIONAL**

---

## 🎯 Resumen

El scraper implementa un **sistema robusto de reintentos automáticos con rotación de proxies** para manejar errores y bloqueos de TheCrag.

---

## 📊 Arquitectura

```
Request → ProxyManager → Proxy #1 → Error
              ↓
         getNext() → Proxy #2 → Error
              ↓
         getNext() → Proxy #3 → Success ✅
```

---

## 🔧 Componentes

### 1. ProxyManager (Singleton)

**Archivo**: `ProxyManager.ts`

**Características**:
- ✅ **Singleton**: Una única instancia compartida
- ✅ **51 proxies residenciales** en el pool
- ✅ **Round-robin**: Rotación automática
- ✅ **Tracking de fallos**: Contador por proxy
- ✅ **Auto-disable**: Desactiva después de 5 fallos
- ✅ **Cooldown**: Reactiva después de 1 minuto
- ✅ **Force re-enable**: Si todos fallan, reactiva el mejor

**Configuración**:
```typescript
ProxyManager.getInstance({
  maxFailures: 5,       // Fallos antes de deshabilitar
  cooldownMs: 60000,    // 1 minuto de cooldown
})
```

**Métodos Clave**:
```typescript
getNext()              // Obtiene siguiente proxy disponible
reportSuccess(proxy)   // Resetea contador de fallos
reportFailure(proxy)   // Incrementa fallos, deshabilita si ≥ 5
checkCooldowns()       // Reactiva proxies después de cooldown
```

---

## 🔄 Flujo de Reintentos

### requestApi() - Para Endpoints API

**Ubicación**: `Curl.ts` líneas 26-108

```typescript
async requestApi(url: string, retryCount = 0): Promise<string> {
  // 1. Obtener siguiente proxy
  const proxy = this.proxyManager.getNext()
  
  try {
    // 2. Hacer request con proxy
    const result = await Bun.spawn(curlArgs)
    
    // 3. Verificar si está bloqueado
    const isBlocked = this.isResponseBlocked(result)
    
    if (isBlocked) {
      // 4. Reportar fallo al proxy
      this.proxyManager.reportFailure(proxy)
      
      // 5. Reintentar con siguiente proxy
      if (retryCount + 1 < this.MAX_API_RETRIES) {
        return this.requestApi(url, retryCount + 1)  // ← Reintento recursivo
      }
      throw new Error('Request blocked after 3 attempts')
    }
    
    // 6. Reportar éxito
    this.proxyManager.reportSuccess(proxy)
    return result
    
  } catch (err) {
    // 7. Error de red: reportar fallo
    this.proxyManager.reportFailure(proxy)
    throw err
  }
}
```

**Reintentos**: Hasta **3 intentos** con diferentes proxies

### requestHtml() - Para Páginas HTML

**Ubicación**: `Curl.ts` líneas 113-213

```typescript
async requestHtml(url: string, retryCount = 0): Promise<string> {
  const proxy = this.proxyManager.getNext()
  
  try {
    const result = await Bun.spawn(curlArgs)
    const isBlocked = this.isResponseBlocked(result)
    
    if (isBlocked) {
      this.proxyManager.reportFailure(proxy)
      
      // Reintentar con siguiente proxy
      if (retryCount + 1 < this.MAX_HTML_RETRIES) {
        return this.requestHtml(url, retryCount + 1)  // ← Reintento recursivo
      }
      throw new Error('Request blocked after 3 attempts')
    }
    
    this.proxyManager.reportSuccess(proxy)
    return result
    
  } catch (err) {
    this.proxyManager.reportFailure(proxy)
    throw err
  }
}
```

**Reintentos**: Hasta **3 intentos** con diferentes proxies

---

## 🚨 Detección de Bloqueos

### isResponseBlocked()

Detecta respuestas bloqueadas por:
- Cloudflare challenges
- Rate limiting
- Captchas
- Errores HTTP (403, 429, 503)
- Respuestas vacías
- HTML de error

```typescript
private isResponseBlocked(response: string): string | false {
  if (!response || response.trim().length === 0) {
    return 'Empty response'
  }
  
  if (response.includes('cf-challenge')) {
    return 'Cloudflare challenge'
  }
  
  if (response.includes('403 Forbidden')) {
    return '403 Forbidden'
  }
  
  if (response.includes('429 Too Many Requests')) {
    return '429 Rate limit'
  }
  
  if (response.includes('503 Service Unavailable')) {
    return '503 Service unavailable'
  }
  
  return false
}
```

---

## 📊 Gestión de Proxies

### Estados del Proxy

```typescript
interface ProxyConfig {
  url: string
  host: string
  port: number
  protocol: 'http' | 'https' | 'socks5'
  username?: string
  password?: string
  failures: number      // ← Contador de fallos
  lastUsed: number      // ← Timestamp último uso
  disabled: boolean     // ← Estado (activo/deshabilitado)
}
```

### Lifecycle

```
┌─────────────┐
│ ACTIVO      │
│ failures: 0 │
└──────┬──────┘
       │
       │ Error ×1
       ▼
┌─────────────┐
│ ACTIVO      │
│ failures: 1 │
└──────┬──────┘
       │
       │ Error ×4 más
       ▼
┌─────────────┐
│ DISABLED    │
│ failures: 5 │
└──────┬──────┘
       │
       │ Cooldown (1 min)
       ▼
┌─────────────┐
│ ACTIVO      │
│ failures: 2 │ ← Reducido a la mitad
└─────────────┘
```

---

## 🔢 Estadísticas

### Pool Actual
```typescript
DEFAULT_PROXIES.length  // 51 proxies residenciales
```

### Configuración de Tolerancia
```typescript
maxFailures: 5          // Deshabilitar después de 5 fallos
cooldownMs: 60000       // Reactiva después de 1 minuto
MAX_API_RETRIES: 3      // 3 intentos por request API
MAX_HTML_RETRIES: 3     // 3 intentos por request HTML
```

### Capacidad Máxima de Reintentos
```
Por request: 3 intentos × 51 proxies = 153 intentos posibles
En realidad: 3 intentos (usa proxies distintos en cada uno)
```

---

## 📝 Logging

### Éxito
```typescript
this.proxyManager.reportSuccess(proxy)
// No log (silencioso)
```

### Fallo
```typescript
this.proxyManager.reportFailure(proxy)
logger.warn('MATO:SCRAPER:PROXY', 
  `Proxy ${proxy.host}:${proxy.port} failed (${proxy.failures}/5)`
)
```

### Bloqueo Detectado
```typescript
logger.warn('scraper:requestApi',
  `Request blocked | URL: ${url} | Proxy: ${proxy.host}:${proxy.port} | Reason: ${isBlocked} | Attempt: ${retryCount + 1}/3`,
  {
    url,
    proxy: { host, port },
    isBlocked,
    retryCount,
    maxRetries
  }
)
```

### Proxy Deshabilitado
```typescript
logger.warn('MATO:SCRAPER:PROXY',
  `Proxy ${proxy.host}:${proxy.port} disabled after 5 failures`
)
```

### Proxy Reactivado
```typescript
logger.info('MATO:SCRAPER:PROXY',
  `Proxy ${proxy.host}:${proxy.port} re-enabled after cooldown`
)
```

---

## 🎯 Ejemplo Real

### Escenario: Request Bloqueado

```typescript
// Intento 1: Proxy #1
requestApi('https://thecrag.com/api/node/123')
  ↓
Proxy: 142.91.118.11:29842
  ↓
Response: "403 Forbidden"
  ↓
isBlocked() = "403 Forbidden"
  ↓
reportFailure(proxy1)  // failures: 1
  ↓
retryCount: 0 < 3 → REINTENTAR

// Intento 2: Proxy #2
requestApi('https://thecrag.com/api/node/123', retryCount=1)
  ↓
getNext() → Proxy: 142.91.118.113:29842  // ← Proxy diferente
  ↓
Response: "cf-challenge"
  ↓
isBlocked() = "Cloudflare challenge"
  ↓
reportFailure(proxy2)  // failures: 1
  ↓
retryCount: 1 < 3 → REINTENTAR

// Intento 3: Proxy #3
requestApi('https://thecrag.com/api/node/123', retryCount=2)
  ↓
getNext() → Proxy: 142.91.118.147:29842  // ← Otro proxy diferente
  ↓
Response: {"data": {...}}  // ✅ JSON válido
  ↓
isBlocked() = false
  ↓
reportSuccess(proxy3)  // failures: 0 (resetea contador)
  ↓
return result  // ✅ ÉXITO
```

---

## 🚀 Ventajas del Sistema

### 1. Resiliencia
- ✅ Continúa funcionando aunque algunos proxies fallen
- ✅ Auto-recuperación después de cooldown

### 2. Distribución de Carga
- ✅ Round-robin entre 51 proxies
- ✅ Reduce probabilidad de rate limiting

### 3. Auto-healing
- ✅ Proxies se reactivan automáticamente
- ✅ Contador de fallos se reduce gradualmente

### 4. Transparencia
- ✅ Logging detallado de fallos
- ✅ Estadísticas del pool: `getStats()`

### 5. Fallback Inteligente
- ✅ Si todos fallan, reactiva el mejor proxy
- ✅ Nunca se queda sin proxies disponibles

---

## 🔍 Verificación

### Comprobar Estado del Pool

```typescript
const proxyManager = ProxyManager.getInstance()
const stats = proxyManager.getStats()

console.log({
  total: stats.total,      // 51
  active: stats.active,    // Ej: 48
  disabled: stats.disabled // Ej: 3
})
```

### Verificar si Hay Proxies

```typescript
proxyManager.hasProxies()  // true (51 proxies configurados)
```

---

## ✅ Conclusión

El sistema de reintentos con proxies es **robusto y completamente funcional**:

1. ✅ **51 proxies residenciales** en el pool
2. ✅ **3 intentos automáticos** por request
3. ✅ **Rotación round-robin** entre proxies
4. ✅ **Auto-disable** después de 5 fallos
5. ✅ **Auto-recovery** después de 1 minuto
6. ✅ **Detección inteligente** de bloqueos
7. ✅ **Logging completo** para debugging

**El scraper NO se detiene por un proxy bloqueado**, automáticamente prueba con el siguiente proxy disponible hasta completar el request o agotar los 3 intentos.

---

**Última actualización**: 2025-01-14
