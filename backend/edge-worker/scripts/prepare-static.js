import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const outputFile = join(__dirname, '../static-files.json');

function readDirRecursive(dir, base = '') {
    const entries = [];
    const files = readdirSync(dir);
    
    for (const file of files) {
        const fullPath = join(dir, file);
        const relativePath = join(base, file);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
            entries.push(...readDirRecursive(fullPath, relativePath));
        } else {
            const content = readFileSync(fullPath, 'utf-8');
            entries.push([
                '/' + relativePath.replace(/\\/g, '/'),
                content
            ]);
        }
    }
    
    return entries;
}

const entries = readDirRecursive(publicDir);
writeFileSync(outputFile, JSON.stringify(entries, null, 2));
