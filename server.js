// AI Studio Application Entry Point
import fs from 'node:fs';
import path from 'node:path';

const distServer = path.join(process.cwd(), 'dist', 'server.cjs');

// In production, load the compiled distribution bundle
if (fs.existsSync(distServer)) {
  await import(distServer);
} else {
  // In development, tsx loads the unbundled TypeScript server implementation
  await import('./server.impl.js');
}
