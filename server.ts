// AI Studio Application Entry Point
import fs from 'node:fs';
import path from 'node:path';

const distServer = path.join(process.cwd(), 'dist', 'server.cjs');

// In production or when bundled server exists outside of dev mode, load the bundled distribution
if (process.env.NODE_ENV === 'production' || (fs.existsSync(distServer) && process.env.NODE_ENV !== 'development')) {
  await import(distServer);
} else {
  // In development, tsx loads the unbundled server implementation
  await import('./server.impl.js');
}
