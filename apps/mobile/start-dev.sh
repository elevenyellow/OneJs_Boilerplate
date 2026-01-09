#!/bin/bash

# Script para iniciar la app móvil de ClimbZone

echo "🚀 Iniciando ClimbZone Mobile..."
echo ""

# Ir al directorio correcto
cd "$(dirname "$0")"

# Limpiar caché
echo "🧹 Limpiando caché..."
rm -rf .expo node_modules/.cache 2>/dev/null || true

# Matar procesos anteriores
echo "🔄 Deteniendo procesos anteriores..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 1

# Iniciar Expo
echo "✨ Iniciando servidor de desarrollo..."
echo ""
echo "📱 Opciones disponibles:"
echo "  • Presiona 'a' para abrir en Android"
echo "  • Presiona 'i' para abrir en iOS"
echo "  • Presiona 'w' para abrir en Web"
echo "  • Escanea el QR con Expo Go en tu teléfono"
echo ""
echo "⚠️  Nota: Algunas dependencias tienen versiones diferentes"
echo "   Esto no afecta la funcionalidad básica"
echo ""

npx expo start
