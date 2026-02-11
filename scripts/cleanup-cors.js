import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiBaseDir = path.join(__dirname, '../src/app/api');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const headersToRemove = [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Credentials',
    'Access-Control-Max-Age'
];

walk(apiBaseDir, (filePath) => {
    if (!filePath.endsWith('route.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Remove individual header lines
    headersToRemove.forEach(header => {
        const regex = new RegExp(`['"]${header}['"]\\s*:\\s*['"].*?['"]\\s*,?`, 'g');
        content = content.replace(regex, '');
    });

    // Remove empty headers objects
    content = content.replace(/headers\s*:\s*{\s*}/g, '');

    // Clean up trailing commas in objects after removal
    content = content.replace(/,\s*}/g, ' }');
    content = content.replace(/{\s*,/g, '{ ');

    // Remove OPTIONS handler if it only returns CORS headers
    // This is a bit tricky with regex, but we can try to find simple ones
    const optionsRegex = /export\s+async\s+function\s+OPTIONS\(.*?\)\s*{\s*return\s+new\s+(?:Response|NextResponse)\(null,\s*{\s*(?:status:\s*\d+,\s*)?headers:\s*{\s*.*?\s*}\s*}\s*\);?\s*}/gs;
    content = content.replace(optionsRegex, '');

    if (content !== originalContent) {
        console.log(`Cleaned up ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
