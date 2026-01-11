#!/bin/bash

# Script para compilar APK de release para ClimbZone
# Este APK funciona 100% independiente, sin necesidad de Expo Go

set -e

echo "🚀 Compilando ClimbZone APK de Release..."
echo "================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "app.json" ]; then
  echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
  exit 1
fi

# Verificar que el proyecto Android existe
if [ ! -d "android" ]; then
  echo "📦 Generando proyecto Android nativo..."
  npx expo prebuild --platform android
  echo "✅ Proyecto Android generado"
  echo ""
fi

# Verificar que el keystore existe
if [ ! -f "android/app/climbzone-release.keystore" ]; then
  echo "🔑 Generando keystore de firma..."
  keytool -genkeypair -v -storetype PKCS12 \
    -keystore android/app/climbzone-release.keystore \
    -alias climbzone-key-alias \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass climbzone2024 \
    -keypass climbzone2024 \
    -dname "CN=ClimbZone, OU=Mobile, O=ClimbZone, L=Madrid, ST=Madrid, C=ES"
  echo "✅ Keystore generado"
  echo ""
fi

# Compilar APK de release
echo "🔨 Compilando APK..."
cd android
./gradlew assembleRelease

# Verificar que se generó el APK
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
  APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
  echo ""
  echo "✅ ¡Build exitoso!"
  echo "================================================"
  echo "📦 APK generado: android/app/build/outputs/apk/release/app-release.apk"
  echo "📏 Tamaño: $APK_SIZE"
  echo ""
  echo "🎯 Para instalar en dispositivo:"
  echo "   1. Transfiere el APK a tu dispositivo Android"
  echo "   2. Habilita 'Fuentes desconocidas' en Configuración → Seguridad"
  echo "   3. Abre el APK para instalarlo"
  echo ""
  echo "📱 O instala directamente si tienes un dispositivo conectado:"
  echo "   cd android && ./gradlew installRelease"
  echo ""
  
  # Copiar a ubicación accesible
  VERSION=$(grep versionName app/build.gradle | awk '{print $2}' | tr -d '"')
  DEST="../ClimbZone-v${VERSION}-release.apk"
  cp app/build/outputs/apk/release/app-release.apk "$DEST"
  echo "📋 APK copiado a: $DEST"
else
  echo "❌ Error: No se pudo generar el APK"
  exit 1
fi
