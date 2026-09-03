const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const publicDir = path.join(__dirname, '../public');

function processTransparentCutout(inputJpgPath, outputPngPath, minComponentSize = 800, padding = 32) {
  const rawFile = path.join(publicDir, 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(7) + '.raw');
  const info = execSync(`identify -format "%w %h" "${inputJpgPath}"`).toString().trim().split(' ');
  const width = parseInt(info[0]);
  const height = parseInt(info[1]);

  execSync(`convert "${inputJpgPath}" -depth 8 rgba:"${rawFile}"`);
  const buf = fs.readFileSync(rawFile);
  fs.unlinkSync(rawFile);

  // 1. Identify white background pixels
  const isWhite = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = buf[i * 4];
    const g = buf[i * 4 + 1];
    const b = buf[i * 4 + 2];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    // Background is near pure white with low saturation
    if (minC > 218 && (maxC - minC) < 35) {
      isWhite[i] = 1;
    }
  }

  // 2. Connected component analysis to isolate outer and large interior negative spaces
  const visited = new Uint8Array(width * height);
  const isBackground = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (isWhite[idx] && !visited[idx]) {
        const q = [idx];
        visited[idx] = 1;
        let head = 0;
        let touchesBorder = false;

        while (head < q.length) {
          const cur = q[head++];
          const cx = cur % width;
          const cy = Math.floor(cur / width);
          if (cx === 0 || cx === width - 1 || cy === 0 || cy === height - 1) {
            touchesBorder = true;
          }

          if (cx > 0 && isWhite[cur - 1] && !visited[cur - 1]) { visited[cur - 1] = 1; q.push(cur - 1); }
          if (cx < width - 1 && isWhite[cur + 1] && !visited[cur + 1]) { visited[cur + 1] = 1; q.push(cur + 1); }
          if (cy > 0 && isWhite[cur - width] && !visited[cur - width]) { visited[cur - width] = 1; q.push(cur - width); }
          if (cy < height - 1 && isWhite[cur + width] && !visited[cur + width]) { visited[cur + width] = 1; q.push(cur + width); }
        }

        // If it touches outer border or is a large internal negative space (> minComponentSize)
        if (touchesBorder || q.length >= minComponentSize) {
          for (const p of q) {
            isBackground[p] = 1;
          }
        }
      }
    }
  }

  // 3. Subpixel anti-aliasing and color defringing for dark background rendering
  const outBuf = Buffer.from(buf);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const p4 = idx * 4;

      if (isBackground[idx]) {
        outBuf[p4 + 3] = 0; // 100% transparent
      } else {
        const r = buf[p4];
        const g = buf[p4 + 1];
        const b = buf[p4 + 2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

        // Check if adjacent to background
        let bgNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (isBackground[ny * width + nx]) bgNeighbors++;
            }
          }
        }

        if (bgNeighbors > 0 && brightness > 140) {
          // Anti-aliased edge pixel: suppress white fringe, blend to dark stroke
          const alpha = Math.max(0, Math.min(1, (255 - brightness) / 115));
          outBuf[p4 + 3] = Math.round(alpha * 255);
          // Tint border pixel with emblem stroke dark teal tone
          outBuf[p4] = Math.round(r * 0.15 + 4);
          outBuf[p4 + 1] = Math.round(g * 0.35 + 24);
          outBuf[p4 + 2] = Math.round(b * 0.45 + 32);
        } else {
          outBuf[p4 + 3] = 255;
        }
      }
    }
  }

  const tempOutRaw = path.join(publicDir, 'temp_out_' + Date.now() + '.raw');
  fs.writeFileSync(tempOutRaw, outBuf);

  // Trim transparent excess and apply precise symmetric padding
  execSync(`convert -size ${width}x${height} -depth 8 rgba:"${tempOutRaw}" -trim +repage -bordercolor none -border ${padding} "${outputPngPath}"`);
  fs.unlinkSync(tempOutRaw);

  console.log(`Created transparent cutout: ${outputPngPath}`);
}

console.log('--- Processing User Uploaded Logos ---');
const logo1Jpg = path.join(publicDir, 'Logo1.jpeg');
const logo2Jpg = path.join(publicDir, 'Logo2.jpeg');

const logo1Png = path.join(publicDir, 'Logo1.png');
const logo2Png = path.join(publicDir, 'Logo2.png');
const defaultLogoPng = path.join(publicDir, 'logo.png');
const stockblocLogoPng = path.join(publicDir, 'stockbloc-logo.png');

processTransparentCutout(logo1Jpg, logo1Png, 800, 24);
processTransparentCutout(logo2Jpg, logo2Png, 800, 24);

// Copy Logo1 (rich 3D chrome emblem) as default logo.png
fs.copyFileSync(logo1Png, defaultLogoPng);
fs.copyFileSync(logo1Png, stockblocLogoPng);
console.log('Saved default logo.png and stockbloc-logo.png');

// 4. Create high-resolution dark-background composited JPG (for OpenGraph & Apple Touch Icons)
// Using an obsidian dark backdrop (#020617) with radial cyan ambient glow
const compositeDarkJpg = path.join(publicDir, 'logo.jpg');
execSync(`convert -size 1200x1200 radial-gradient:"#083344-#020617" \\( "${logo1Png}" -resize 980x980 \\) -gravity center -composite -quality 95 "${compositeDarkJpg}"`);
console.log('Created high-res composited logo.jpg');

// 5. Create Apple Touch Icon (180x180)
const appleIcon = path.join(publicDir, 'apple-touch-icon.png');
execSync(`convert -size 180x180 radial-gradient:"#0e4453-#030712" \\( "${logo1Png}" -resize 156x156 \\) -gravity center -composite "${appleIcon}"`);
console.log('Created apple-touch-icon.png');

// 6. Create favicon.png (64x64) and favicon.ico
const faviconPng = path.join(publicDir, 'favicon.png');
execSync(`convert "${logo1Png}" -resize 64x64 "${faviconPng}"`);
const faviconIco = path.join(publicDir, 'favicon.ico');
execSync(`convert "${faviconPng}" -define icon:auto-resize=64,32,16 "${faviconIco}"`);
console.log('Created favicon.png and favicon.ico');

console.log('--- All Logo Assets Generated Successfully ---');
