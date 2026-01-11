# 📱 Compilar APK de Release - ClimbZone

## ✅ APK Independiente al 100%

Este APK funciona completamente **sin necesidad de Expo Go** ni servidores de desarrollo. Es una app nativa standalone lista para distribuir.

---

## 🚀 Compilación Rápida

```bash
./build-release.sh
```

Este script hace todo automáticamente:
- ✅ Genera proyecto Android si no existe
- ✅ Crea keystore de firma si no existe
- ✅ Compila APK de release firmado
- ✅ Copia el APK a un lugar accesible

---

## 📦 APK Generado

**Ubicación:** `android/app/build/outputs/apk/release/app-release.apk`  
**Tamaño:** ~68 MB (release optimizado)  
**Firmado:** ✅ Sí, con keystore propio

También se copia a: `ClimbZone-v1.0.0-release.apk`

---

## 📲 Instalar en Dispositivo

### Opción 1: Instalación Manual

1. Transfiere el APK a tu dispositivo Android
2. Habilita **"Fuentes desconocidas"** en:
   - Configuración → Seguridad → Fuentes desconocidas
   - O Configuración → Aplicaciones → Acceso especial → Instalar apps desconocidas
3. Abre el archivo APK en tu dispositivo
4. Toca "Instalar"

### Opción 2: Instalación Directa (USB)

Si tienes un dispositivo Android conectado por USB con depuración activada:

```bash
cd android
./gradlew installRelease
```

---

## 🔧 Compilación Manual (Paso a Paso)

Si prefieres hacerlo manualmente o el script falla:

### 1. Generar Proyecto Android

```bash
npx expo prebuild --platform android --clean
```

### 2. Compilar APK

```bash
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔑 Información del Keystore

**Archivo:** `android/app/climbzone-release.keystore`

**Credenciales:**
- **Store Password:** `climbzone2024`
- **Key Alias:** `climbzone-key-alias`
- **Key Password:** `climbzone2024`

> ⚠️ **IMPORTANTE:** Guarda estas credenciales de forma segura. Las necesitarás para actualizaciones futuras en Google Play Store.

---

## 📋 Variantes de Build Disponibles

### Debug APK (Desarrollo)
```bash
cd android
./gradlew assembleDebug
```
- Más rápido de compilar
- Permite debugging
- **Tamaño:** ~141 MB

### Release APK (Producción)
```bash
cd android
./gradlew assembleRelease
```
- Optimizado y minificado
- Firmado con keystore
- **Tamaño:** ~68 MB ✅ **Usa este**

### Release AAB (Google Play Store)
```bash
cd android
./gradlew bundleRelease
```
- Formato requerido por Play Store
- App Bundle optimizado por Google
- **Ubicación:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## ✨ Características del APK

- ✅ **Standalone:** Funciona sin Expo Go
- ✅ **Firmado:** Con keystore propio
- ✅ **Optimizado:** Código minificado y ofuscado
- ✅ **Conectado a producción:** Usa `https://climb-zone.onrender.com/api`
- ✅ **Maps:** Incluye react-native-maps
- ✅ **Location:** Permisos de ubicación configurados
- ✅ **Hermes:** Engine de JavaScript optimizado

---

## 🐛 Troubleshooting

### Error: "Keystore not found"
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/climbzone-release.keystore \
  -alias climbzone-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass climbzone2024 \
  -keypass climbzone2024 \
  -dname "CN=ClimbZone, OU=Mobile, O=ClimbZone, L=Madrid, ST=Madrid, C=ES"
```

### Error: "Android directory not found"
```bash
npx expo prebuild --platform android
```

### Error: "Gradle build failed"
```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### APK muy grande
El APK de release (~68 MB) es normal para una app React Native con:
- React Native Maps
- Hermes engine
- Múltiples arquitecturas (arm64-v8a, armeabi-v7a, x86, x86_64)

Para reducir tamaño, puedes generar APKs separados por arquitectura.

---

## 📚 Recursos Adicionales

- **Configuración:** `android/app/build.gradle`
- **Manifest:** `android/app/src/main/AndroidManifest.xml`
- **Permisos:** Ubicación (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION)

---

## 🎯 Próximos Pasos

1. ✅ **Probar el APK** en diferentes dispositivos
2. ✅ **Verificar funcionalidades:**
   - Búsqueda de sectores
   - Mapas
   - Ubicación del usuario
   - Conexión con API
3. 📱 **Distribuir** a testers beta
4. 🚀 **Publicar** en Google Play Store (usar AAB)

---

## 📝 Notas

- La app se conecta a: `https://climb-zone.onrender.com/api`
- No requiere Expo Go ni servidores de desarrollo
- Funciona 100% offline después de cargar datos
- El keystore es único y se debe conservar para actualizaciones

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2026
