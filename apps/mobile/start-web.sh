#!/bin/bash

# Script para iniciar ClimbZone Mobile en Web

echo "🌐 Iniciando ClimbZone Mobile en Web..."
echo ""

cd "$(dirname "$0")"

# Verificar dependencias
if ! grep -q "@expo/metro-runtime" package.json; then
    echo "📦 Instalando dependencia web..."
    bun add @expo/metro-runtime@~4.0.1
fi

# Limpiar caché
echo "🧹 Limpiando caché..."
rm -rf .expo 2>/dev/null || true

# Matar procesos anteriores
pkill -f "expo start" 2>/dev/null || true
sleep 1

# Iniciar en web
echo "✨ Iniciando en modo web..."
echo ""
echo "🌐 La app se abrirá en tu navegador"
echo "📍 URL: http://localhost:8081"
echo ""

npx expo start --web
