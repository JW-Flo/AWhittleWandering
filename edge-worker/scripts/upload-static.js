import { exec } from 'child_process';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NAMESPACE_ID = 'c7eba0c892bf4f2fbcf73fb60a38706c';

async function uploadFiles() {
    try {
        const jsonPath = join(__dirname, '../static-files.json');
        const files = JSON.parse(await readFile(jsonPath, 'utf-8'));
        
        for (const [key, content] of files) {
            // Create a temporary file for the content
            const tempFilePath = join(__dirname, '../public', key);
            
            // Execute wrangler command
            const command = `npx wrangler kv key put --namespace-id=${NAMESPACE_ID} "${key}" --path="${tempFilePath}"`;
            console.log(`Uploading ${key}...`);
            
            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error uploading ${key}:`, error);
                        reject(error);
                        return;
                    }
                    if (stderr) {
                        console.error(`Warning for ${key}:`, stderr);
                    }
                    console.log(stdout);
                    resolve();
                });
            });
        }
        
        console.log('All files uploaded successfully!');
    } catch (error) {
        console.error('Error uploading files:', error);
        process.exit(1);
    }
}

uploadFiles();
