#!/bin/bash

# Script para compilar la app Android con el servidor de producción
# La app usará https://climb-zone.onrender.com/api como backend

set -e

echo "🚀 Compilando ClimbZone para Android..."
echo "📍 Servidor API: https://climb-zone.onrender.com/api"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "app.json" ]; then
  echo "❌ Error: Debes ejecutar este script desde el directorio apps/mobile"
  exit 1
fi

# Verificar que la URL de producción está configurada
API_URL=$(grep -A 1 '"extra"' app.json | grep '"apiUrl"' | cut -d'"' -f4)
if [[ "$API_URL" != "https://climb-zone.onrender.com/api" ]]; then
  echo "⚠️  Advertencia: La URL del API no está configurada para producción"
  echo "   URL actual: $API_URL"
  echo "   Esperada: https://climb-zone.onrender.com/api"
  read -p "¿Continuar de todos modos? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
  echo "❌ Error: EAS CLI no está instalado"
  echo "   Instala con: npm install -g eas-cli"
  echo "   Luego configura con: eas login"
  exit 1
fi

echo "📦 Opciones de compilación:"
echo "   1. APK de desarrollo (más rápido, para testing)"
echo "   2. AAB para Google Play Store (producción)"
echo ""
read -p "Selecciona una opción (1 o 2): " BUILD_TYPE

case $BUILD_TYPE in
  1)
    echo ""
    echo "🔨 Compilando APK de desarrollo..."
    eas build --platform android --profile development
    ;;
  2)
    echo ""
    echo "🔨 Compilando AAB para producción..."
    eas build --platform android --profile production
    ;;
  *)
    echo "❌ Opción inválida"
    exit 1
    ;;
esac

echo ""
echo "✅ Compilación completada!"
echo "   El archivo estará disponible en tu cuenta de Expo"
echo "   Visita: https://expo.dev/accounts/[tu-usuario]/projects/climb-zone/builds"
