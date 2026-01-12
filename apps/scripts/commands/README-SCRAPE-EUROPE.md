# Comando: scrape-europe

## Descripción

Este comando consulta el nodo de Europa en TheCrag API y muestra el **raw data** de la respuesta sin scrapear ningún país. Es útil para:

- Inspeccionar la estructura de datos de Europa
- Ver la lista completa de países disponibles
- Verificar IDs de nodos
- Analizar la geometría y metadatos
- Debugging del API scraper

## Uso

```bash
bun run apps/scripts/cli.ts scrape-europe
```

## Qué hace

El comando realiza dos requests al API de TheCrag:

1. **`getChildren(EUROPE_NODE_ID)`**: Obtiene la lista de todos los países de Europa
2. **`getNodeInfo(EUROPE_NODE_ID)`**: Obtiene información detallada del nodo de Europa

## Datos Mostrados

### 1. Lista de Países (Children)

Para cada país muestra:
- Nombre
- ID del nodo
- Tipo (generalmente "Country")
- Si tiene geometría
- Primeros 100 caracteres de las coordenadas (si tiene geometría)

### 2. Raw JSON de Children

Muestra el JSON completo con toda la información de los países, incluyendo:
- `id`: ID del nodo en TheCrag
- `name`: Nombre del país
- `type`: Tipo de nodo
- `geometry`: Geometría GeoJSON (coordenadas, tipo, etc.)
- Otros campos disponibles en la respuesta

### 3. Europe Node Info

Muestra la información detallada del nodo de Europa, que puede incluir:
- `name`: Nombre del continente
- `geometry`: Geometría del continente
- `altNames`: Nombres alternativos
- `locatedness`: Nivel de localización
- `numberPhotos`: Número de fotos
- `numberTopos`: Número de topos
- `totalFavorites`: Total de favoritos
- Otros metadatos disponibles

## Ejemplo de Salida

```
🇪🇺 Fetching Europe raw data...

📡 Making API request to Europe node...

✅ Response received!

================================================================================
📊 EUROPE RAW DATA
================================================================================
Node ID: 7546064
Total children: 45
================================================================================

📦 Children (Countries):

1. Albania
   ID: 12345678
   Type: Country
   Geometry: Yes
   Coordinates: {"type":"Point","coordinates":[19.8187,41.3275]}...

2. Andorra
   ID: 12345679
   Type: Country
   Geometry: Yes
   Coordinates: {"type":"Point","coordinates":[1.5218,42.5063]}...

...

================================================================================
🔍 FULL RAW JSON DATA
================================================================================
[
  {
    "id": 12345678,
    "name": "Albania",
    "type": "Country",
    "geometry": {
      "type": "Point",
      "coordinates": [19.8187, 41.3275]
    }
  },
  ...
]
================================================================================

📋 Getting Europe node info...

================================================================================
🌍 EUROPE NODE INFO (RAW)
================================================================================
{
  "id": 7546064,
  "name": "Europe",
  "type": "Continent",
  "geometry": {
    "type": "Point",
    "coordinates": [10.0, 50.0]
  },
  "altNames": [],
  "locatedness": 1,
  "numberPhotos": 12345,
  "numberTopos": 6789,
  "totalFavorites": 98765,
  ...
}
================================================================================

✅ Done! Raw data displayed above.
```

## Constantes Usadas

- **`EUROPE_NODE_ID`**: `7546064` - ID del nodo de Europa en TheCrag

## Notas Técnicas

- **No scrape**: Este comando NO guarda ningún dato en la base de datos
- **Solo lectura**: Solo hace requests GET al API
- **Cookie requerida**: Usa la cookie configurada en `cli.ts`
- **Delay**: 100ms de delay entre requests
- **Formato JSON**: La salida es JSON pretty-printed para fácil lectura

## Uso para Debugging

Este comando es útil para:

1. **Verificar conectividad**: Confirmar que el API scraper funciona
2. **Inspeccionar estructura**: Ver qué campos devuelve el API
3. **Obtener IDs**: Copiar IDs de países para otros comandos
4. **Validar geometría**: Verificar que las coordenadas son correctas
5. **Comparar versiones**: Ver si el API ha cambiado

## Comandos Relacionados

Si quieres scrapear países específicos, usa:

```bash
# Scrapear un país específico
bun run apps/scripts/cli.ts test-country "Spain"
bun run apps/scripts/cli.ts test-country "France"

# Scrapear toda España
bun run apps/scripts/cli.ts scrape-spain
```

## Ver También

- `test-country.command.ts` - Scrape un país específico (guarda en BD)
- `scrape-spain.command.ts` - Scrape toda España (guarda en BD)
- `scrape-world.command.ts` - Scrape el mundo completo (guarda en BD)
