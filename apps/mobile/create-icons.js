// Script para crear iconos placeholder
const fs = require('fs');
const path = require('path');

// SVG simple para iconos
const createSVG = (size, color) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#D4A574"/>
  <text x="${size/2}" y="${size/2}" font-size="${size/3}" text-anchor="middle" dy=".3em" fill="white" font-family="Arial">🧗</text>
</svg>`;

const assetsDir = path.join(__dirname, 'assets', 'images');

// Crear archivos SVG temporales (Expo los puede usar)
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), createSVG(1024, '#8B5A2B'));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), createSVG(1024, '#8B5A2B'));
fs.writeFileSync(path.join(assetsDir, 'splash-icon.svg'), createSVG(1024, '#8B5A2B'));
fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), createSVG(48, '#8B5A2B'));

// Crear PNG básicos con Node (sin dependencias externas)
const { createCanvas } = require('canvas');

function createPNG(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fondo
  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(0, 0, size, size);
  
  // Círculo
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
  ctx.fill();
  
  // Guardar
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
}

// Solo si canvas está disponible
try {
  createPNG(1024, 'icon.png');
  createPNG(1024, 'adaptive-icon.png');
  createPNG(1024, 'splash-icon.png');
  createPNG(48, 'favicon.png');
  console.log('✅ Iconos PNG creados');
} catch (e) {
  console.log('⚠️  Canvas no disponible, usando SVG');
}

console.log('✅ Assets creados en', assetsDir);
