import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const rootDirPath = path.join(path.dirname(__filename), '..');
