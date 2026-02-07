#!/usr/bin/env node

/**
 * Quick Icon Generator for GAIA Extension
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for GAIA icon
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="50" cy="50" r="45" fill="#16a34a"/>
  
  <!-- Checkmark -->
  <path 
    d="M 30 50 L 42 62 L 70 30" 
    stroke="white" 
    stroke-width="8" 
    fill="none" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  />
</svg>`;

// Generate SVG files for each size
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ Created ${filename}`);
});

console.log('\n🎉 Icon files generated successfully!');
console.log('\n📝 Note: These are SVG files. For production, consider converting to PNG.');
console.log('   You can use an online converter or install sharp:');
console.log('   npm install --save-dev sharp');
console.log('   Then run: node convert-to-png.js');

// Create a conversion script
const convertScript = `#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

sizes.forEach(async (size) => {
  const svgPath = path.join(iconsDir, \`icon\${size}.svg\`);
  const pngPath = path.join(iconsDir, \`icon\${size}.png\`);
  
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    console.log(\`✅ Converted icon\${size}.svg → icon\${size}.png\`);
  } catch (err) {
    console.error(\`❌ Error converting icon\${size}:\`, err.message);
  }
});
`;

fs.writeFileSync('convert-to-png.js', convertScript);
fs.chmodSync('convert-to-png.js', '755');
console.log('\n📄 Created convert-to-png.js script');
