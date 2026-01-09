# Campo apiResponseRaw - Resumen de Implementación

**Fecha**: 2026-01-09  
**Status**: ⚠️ EN PROGRESO

---

## ✅ Completado

1. **Schema actualizado**:
   - ✅ `sector.model.prisma` - campo `apiResponseRaw Json?` agregado
   - ✅ `crag.model.prisma` - campo `apiResponseRaw Json?` agregado
   - ✅ `area.model.prisma` - campo `apiResponseRaw Json?` agregado

2. **Migración aplicada**:
   - ✅ `20260109113432_add_api_response_raw` creada y aplicada

3. **Scraper actualizado**:
   - ✅ `thecrag-api.scraper.ts` - guarda `info.apiResponseRaw = data`

4. **DTO actualizado**:
   - ✅ `scraped-node.dto.ts` - campo `apiResponseRaw` agregado

5. **Mapper interfaces actualizadas**:
   - ✅ `ValidatedCragData` - campo `apiResponseRaw` agregado
   - ✅ `ValidatedAreaData` - campo `apiResponseRaw` agregado
   - ✅ `ValidatedSectorData` - campo `apiResponseRaw` agregado

6. **Mapper métodos actualizados**:
   - ✅ `mapToCrag()` - pasa `apiResponseRaw: info?.apiResponseRaw ?? null`
   - ✅ `mapToArea()` - pasa `apiResponseRaw: info?.apiResponseRaw ?? null`
   - ✅ `mapToSector()` - pasa `apiResponseRaw: info?.apiResponseRaw ?? null`

---

## ⚠️ Pendiente

### 1. Entidades (Domain)
- [ ] `SectorEntity` - agregar campo `apiResponseRaw` al constructor y `toJSON()`
- [ ] `CragEntity` - agregar campo `apiResponseRaw` al constructor y `toJSON()`
- [ ] `AreaEntity` - agregar campo `apiResponseRaw` al constructor y `toJSON()`

### 2. Repositorios (Infrastructure)
- [ ] `SectorPrismaRepository` - agregar `apiResponseRaw` en `toEntity()` y `toPrismaData()`
- [ ] `CragPrismaRepository` - agregar `apiResponseRaw` en `toEntity()` y `toPrismaData()`
- [ ] `AreaPrismaRepository` - agregar `apiResponseRaw` en `toEntity()` y `toPrismaData()`

### 3. Mapper `createXXXEntity()` métodos
- [ ] `createCragEntity()` - pasar `data.apiResponseRaw` al constructor
- [ ] `createAreaEntity()` - pasar `data.apiResponseRaw` al constructor
- [ ] `createSectorEntity()` - pasar `data.apiResponseRaw` al constructor

---

## 🎯 Beneficio

Una vez completado, tendremos la **respuesta completa de la API guardada** en cada entidad, lo que nos permitirá:

1. ✅ Analizar qué datos no estamos procesando sin re-escrapear
2. ✅ Detectar campos nuevos que TheCrag agregue en el futuro
3. ✅ Revisar datos históricos si necesitamos agregar nuevos campos
4. ✅ Debugging más fácil: ver exactamente qué devolvió la API

---

## 📝 Próximos Pasos

**OPCIÓN A: Completar implementación completa**
- Actualizar todas las entidades y repositorios
- Tiempo estimado: 30-45 minutos
- Requiere migrations, testing completo

**OPCIÓN B: Simplificar (solo guardar, no leer)**
- Guardar `apiResponseRaw` en BD pero no hidratarlo en entidades
- Más rápido, menos cambios
- Tiempo estimado: 5-10 minutos
- **RECOMENDADO** para este momento

---

## 🚀 Decisión Recomendada

Dado que el objetivo principal es **poder analizar qué datos faltan**, propongo:

1. ✅ **Actualizar solo los repositorios** para que guarden `apiResponseRaw`
2. ✅ **NO** agregar el campo a las entidades (por ahora)
3. ✅ **Ejecutar el scraper** y verificar que se guarde
4. ✅ **Analizar los datos** guardados en BD

Esto nos permite:
- ⚡ Obtener los datos RAW rápidamente
- 🔍 Analizar qué falta sin más refactoring
- 🎯 Decidir qué campos agregar basándonos en datos reales

**La respuesta a la pregunta original del usuario ("estamos guardando la orientación del sector?") es NO porque los datos no tienen orientación en los tags. Pero ahora podremos ver TODOS los datos de la API para determinar si orientación viene en otro campo o simplemente no está disponible en TheCrag.**

