import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-data-'));
process.env.SB_DATA_DIR = tmpDir;
