# ⚠️ Comportamiento Actual: Fallo Total de Proxies

**Fecha**: 2025-01-14  
**Severidad**: 🟡 **ADVERTENCIA**  
**Estado**: ⚠️ **COMPORTAMIENTO SUBÓPTIMO**

---

## 🎯 Pregunta

**¿Qué pasa si TODOS los proxies (51) son bloqueados simultáneamente?**

---

## 📊 Comportamiento Actual

### Cuando Todos los Proxies Están Deshabilitados

**Código**: `ProxyManager.ts` líneas 153-165

```typescript
// All proxies disabled, force re-enable the one with lowest failures
logger.warn(
  'MATO:SCRAPER:PROXY',
  'All proxies disabled, force re-enabling one',
)

const bestProxy = this.proxies.reduce((best, current) =>
  current.failures < best.failures ? current : best,
)

bestProxy.disabled = false    // ← FORZAR REACTIVACIÓN
bestProxy.failures = 0        // ← Resetear contador
bestProxy.lastUsed = Date.now()
return bestProxy              // ← Continuar scraping
```

### ❌ NO Espera el Cooldown

El sistema **NO pausa** para esperar el cooldown de 1 minuto. En su lugar:

1. ✅ Busca el proxy con **menos fallos históricos**
2. ✅ Lo **reactiva forzosamente** (ignora el estado `disabled`)
3. ✅ **Resetea su contador** a 0
4. ✅ **Devuelve ese proxy** para continuar

---

## 🔄 Flujo Completo

```
┌──────────────────────────────────────┐
│ Scraper intenta con todos los proxies│
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Proxy #1: 5 fallos → ❌ Deshabilitado│
│ Proxy #2: 5 fallos → ❌ Deshabilitado│
│ Proxy #3: 5 fallos → ❌ Deshabilitado│
│ ...                                  │
│ Proxy #51: 5 fallos → ❌ Deshabilitado│
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ getNext() → Todos deshabilitados     │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ ⚠️ FORZAR REACTIVACIÓN               │
│                                      │
│ 1. Buscar proxy con menos fallos    │
│ 2. bestProxy.disabled = false        │
│ 3. bestProxy.failures = 0            │
│ 4. return bestProxy                  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Scraper continúa con proxy reactivado│
└──────────────────────────────────────┘
```

---

## ⚠️ Problemas Potenciales

### 1. Loop Infinito de Reintentos

Si TheCrag está bloqueando **TODOS** los proxies:

```
Intento 1 → Proxy A (bloqueado) → 5 fallos → disabled
Intento 2 → Proxy B (bloqueado) → 5 fallos → disabled
...
Intento 51 → Proxy Z (bloqueado) → 5 fallos → disabled

getNext() → Reactiva Proxy A forzosamente
            ↓
Intento 52 → Proxy A (AÚN bloqueado) → 5 fallos → disabled
Intento 53 → Proxy B (AÚN bloqueado) → 5 fallos → disabled
...

getNext() → Reactiva Proxy A otra vez
            ↓
Intento 103 → Proxy A (AÚN bloqueado) → ...

🔄 LOOP INFINITO
```

### 2. No Hay Límite Global de Reintentos

**Límites actuales**:
- ✅ 3 intentos **por request individual** (`MAX_API_RETRIES`)
- ✅ 5 fallos **por proxy** antes de deshabilitar
- ❌ **NO hay límite** de reintentos globales cuando todos los proxies fallan

**Resultado**: El scraper puede quedar en un loop infinito reactivando y reintentando proxies bloqueados.

### 3. Desperdicio de Recursos

- ❌ CPU/Red consumidos en requests que fallarán
- ❌ Logs saturados con mensajes de error
- ❌ Scraping no progresa, solo reintenta

### 4. No Respeta el Cooldown

El sistema **ignora completamente** el periodo de cooldown de 1 minuto cuando todos los proxies están deshabilitados.

```typescript
// checkCooldowns() solo se ejecuta en getNext()
// ANTES de buscar proxies disponibles

// Pero si TODOS están disabled, nunca esperará el cooldown
// Solo reactiva forzosamente
```

---

## 🔧 Comportamiento Esperado (Ideal)

### Opción 1: Pausar y Esperar Cooldown

```typescript
getNext(): ProxyConfig | null {
  this.checkCooldowns()
  
  // Buscar proxy disponible
  const availableProxy = this.findAvailableProxy()
  
  if (availableProxy) {
    return availableProxy
  }
  
  // Si TODOS están disabled, esperar cooldown
  logger.warn('MATO:SCRAPER:PROXY', 
    'All proxies disabled, waiting for cooldown...')
  
  await this.waitForCooldown()  // ← ESPERAR
  
  // Después del cooldown, reactivar todos
  this.reEnableAll()
  
  return this.getNext()  // Intentar de nuevo
}
```

### Opción 2: Lanzar Error y Detener Scraping

```typescript
getNext(): ProxyConfig | null {
  this.checkCooldowns()
  
  const availableProxy = this.findAvailableProxy()
  
  if (!availableProxy) {
    // NO forzar reactivación, lanzar error
    throw new Error(
      'All proxies exhausted. TheCrag may be blocking all requests. ' +
      'Wait 1 minute before retrying.'
    )
  }
  
  return availableProxy
}
```

### Opción 3: Límite Global de Reintentos

```typescript
private globalRetries = 0
private readonly MAX_GLOBAL_RETRIES = 10

getNext(): ProxyConfig | null {
  this.checkCooldowns()
  
  const availableProxy = this.findAvailableProxy()
  
  if (!availableProxy) {
    this.globalRetries++
    
    if (this.globalRetries >= this.MAX_GLOBAL_RETRIES) {
      throw new Error('Max global retries exceeded')
    }
    
    // Reactiva forzosamente (comportamiento actual)
    const bestProxy = this.forceReEnableBest()
    return bestProxy
  }
  
  // Reset global retries on success
  this.globalRetries = 0
  return availableProxy
}
```

---

## 📊 Comparación de Opciones

| Opción | Pros | Contras | Recomendación |
|--------|------|---------|---------------|
| **Actual** | Nunca se detiene | Loop infinito posible | ❌ |
| **Opción 1: Pausar** | Respeta cooldown, auto-recovery | Complejidad (async), bloquea thread | 🟡 |
| **Opción 2: Error** | Detiene loop, claro | Requiere reinicio manual | ✅ Mejor |
| **Opción 3: Límite** | Balance entre resiliencia y control | Threshold arbitrario | 🟢 Bueno |

---

## ✅ Recomendación

**Implementar Opción 2 + Opción 3 combinadas**:

1. **Límite global de reintentos** (10 intentos de "forzar reactivación")
2. **Lanzar error** cuando se alcanza el límite
3. **Logging claro** para debugging

```typescript
private globalForceReEnables = 0
private readonly MAX_FORCE_REENABLES = 10

getNext(): ProxyConfig | null {
  this.checkCooldowns()
  
  // Find next available proxy
  let attempts = 0
  while (attempts < this.proxies.length) {
    const proxy = this.proxies[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length
    
    if (proxy && !proxy.disabled) {
      // Reset global counter on success
      this.globalForceReEnables = 0
      proxy.lastUsed = Date.now()
      return proxy
    }
    attempts++
  }
  
  // All proxies disabled
  this.globalForceReEnables++
  
  if (this.globalForceReEnables >= this.MAX_FORCE_REENABLES) {
    logger.error(
      'MATO:SCRAPER:PROXY',
      `All proxies exhausted after ${this.MAX_FORCE_REENABLES} force re-enables. ` +
      'TheCrag may be blocking all requests. Wait 1 minute before retrying.'
    )
    throw new Error('All proxies exhausted - possible IP ban')
  }
  
  // Force re-enable best proxy
  logger.warn(
    'MATO:SCRAPER:PROXY',
    `All proxies disabled, force re-enabling one (attempt ${this.globalForceReEnables}/${this.MAX_FORCE_REENABLES})`,
  )
  
  const bestProxy = this.proxies.reduce((best, current) =>
    current.failures < best.failures ? current : best,
  )
  
  bestProxy.disabled = false
  bestProxy.failures = 0
  bestProxy.lastUsed = Date.now()
  return bestProxy
}

// Método para resetear manualmente (útil después de esperar)
resetGlobalRetries(): void {
  this.globalForceReEnables = 0
  logger.info('MATO:SCRAPER:PROXY', 'Global retry counter reset')
}
```

---

## 🎯 Beneficios de la Mejora

### ✅ Previene Loop Infinito
- Máximo 10 reactivaciones forzadas
- Error claro cuando se alcanza el límite

### ✅ Debugging Mejorado
- Logs con contador de intentos
- Error descriptivo indica posible IP ban

### ✅ Permite Recovery Manual
- Script puede detectar el error
- Esperar y reintentar después

### ✅ Mantiene Resiliencia
- Primeros 10 intentos: auto-recovery
- Después de 10: error explícito

---

## 📝 Ejemplo de Uso

### Sin Mejora (Actual)

```typescript
// Loop infinito, scraper nunca termina
await scraper.scrape('https://thecrag.com/crag/123')
// ... sigue reintentando indefinidamente
```

### Con Mejora (Propuesta)

```typescript
try {
  await scraper.scrape('https://thecrag.com/crag/123')
} catch (error) {
  if (error.message.includes('All proxies exhausted')) {
    logger.error('SCRAPER', 'All proxies blocked, waiting 1 minute...')
    
    // Esperar cooldown manual
    await sleep(60000)
    
    // Resetear contador global
    ProxyManager.getInstance().resetGlobalRetries()
    
    // Reintentar
    await scraper.scrape('https://thecrag.com/crag/123')
  }
}
```

---

## 🚀 Próximos Pasos

1. **Implementar mejora** en `ProxyManager.ts`
2. **Añadir tests** para escenario de "todos bloqueados"
3. **Actualizar documentación** del comportamiento
4. **Añadir manejo de error** en el scraper principal

---

**¿Quieres que implemente esta mejora ahora?**

---

**Última actualización**: 2025-01-14
