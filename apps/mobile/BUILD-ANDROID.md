# 🚀 Compilar ClimbZone para Android

Esta guía te ayudará a compilar la app Android que usa el servidor de producción `https://climb-zone.onrender.com/api`.

## ✅ Configuración Actual

La app está configurada para usar:
- **Servidor de producción**: `https://climb-zone.onrender.com/api`
- **Configurado en**: `app.json` → `expo.extra.apiUrl`

## 📋 Requisitos Previos

1. **Node.js y npm** instalados
2. **Cuenta de Expo** (gratuita): https://expo.dev/signup
3. **EAS CLI** instalado globalmente:
   ```bash
   npm install -g eas-cli
   ```

## 🔧 Configuración Inicial (Solo la primera vez)

```bash
# 1. Navegar al directorio de la app
cd apps/mobile

# 2. Iniciar sesión en Expo
eas login

# 3. Configurar el proyecto (si es necesario)
eas build:configure
```

## 🏗️ Compilar la App

### Opción 1: Script Automático (Recomendado)

```bash
cd apps/mobile
./build-android.sh
```

El script te guiará paso a paso y te preguntará qué tipo de build quieres:
- **APK de desarrollo**: Para testing interno
- **AAB para Google Play**: Para publicar en la Play Store

### Opción 2: Comandos Manuales

**APK de desarrollo (para testing):**
```bash
cd apps/mobile
eas build --platform android --profile development
```

**AAB para producción (Google Play Store):**
```bash
cd apps/mobile
eas build --platform android --profile production
```

## 📦 Tipos de Build

### Development (APK)
- ✅ Más rápido de compilar
- ✅ Ideal para testing interno
- ✅ No requiere certificado de Google Play
- ❌ No se puede publicar en Play Store

### Production (AAB)
- ✅ Formato requerido por Google Play Store
- ✅ Optimizado para producción
- ✅ Firmado con certificado
- ⏱️ Tarda más en compilar

## 📥 Descargar el Build

Una vez completada la compilación:

1. Visita https://expo.dev
2. Inicia sesión con tu cuenta
3. Ve a tu proyecto "climb-zone"
4. Haz clic en "Builds" en el menú lateral
5. Descarga el archivo APK o AAB

**Tiempo estimado**: 10-20 minutos dependiendo de la carga del servidor de Expo.

## 🔍 Verificar la Configuración

Antes de compilar, verifica que la URL del servidor esté correcta:

```bash
# Verificar app.json
cat apps/mobile/app.json | grep apiUrl
```

Deberías ver:
```json
"apiUrl": "https://climb-zone.onrender.com/api"
```

## 🐛 Troubleshooting

### Error: "EAS CLI not found"
```bash
npm install -g eas-cli
```

### Error: "Not authenticated"
```bash
eas login
```

### Error: "Project not configured"
```bash
cd apps/mobile
eas build:configure
```

### La app no se conecta al servidor
1. Verifica que `app.json` tenga la URL correcta
2. Verifica que el servidor esté accesible: `curl https://climb-zone.onrender.com/api/health`
3. En desarrollo, la app puede usar localhost, pero en builds compilados siempre usa la URL de producción

## 📱 Instalar el APK en un Dispositivo

1. Descarga el APK desde Expo
2. Transfiere el archivo a tu dispositivo Android
3. Habilita "Fuentes desconocidas" en Configuración → Seguridad
4. Abre el archivo APK para instalarlo

## 🎯 Próximos Pasos

Después de compilar:
1. ✅ Probar el APK en dispositivos físicos
2. ✅ Verificar que se conecta correctamente al servidor
3. ✅ Probar todas las funcionalidades principales
4. ✅ Si todo funciona, usar el AAB para publicar en Google Play Store

## 📚 Recursos Adicionales

- [Documentación de EAS Build](https://docs.expo.dev/build/introduction/)
- [Guía de publicación en Google Play](https://docs.expo.dev/submit/android/)
- [Configuración de Android](https://docs.expo.dev/workflow/android-studio/)
