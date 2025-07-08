import fs from "fs";
import path from "path";

function replaceNpmWithBun(directory) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    let stat;

    try {
      stat = fs.statSync(fullPath);
    } catch (error) {
      console.error(`Error accessing: ${fullPath}`, error.message);
      return; // Skip this file or directory
    }

    if (stat.isDirectory()) {
      replaceNpmWithBun(fullPath);
    } else if (
      stat.isFile() &&
      (file.endsWith(".js") ||
        file.endsWith(".sh") ||
        file.endsWith(".yml") ||
        file.endsWith(".md"))
    ) {
      let content;
      try {
        content = fs.readFileSync(fullPath, "utf-8");
      } catch (error) {
        console.error(`Error reading: ${fullPath}`, error.message);
        return; // Skip this file
      }

      // Replace npm commands with bun equivalents
      content = content.replace(/bun run/g, "bun run");
      content = content.replace(/bun install/g, "bun install");
      content = content.replace(/bun install/g, "bun install");

      try {
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Updated: ${fullPath}`);
      } catch (error) {
        console.error(`Error writing: ${fullPath}`, error.message);
        return; // Skip this file
      }
    }
  });
}

// Correct path resolution for ES modules
const repoPath = path.resolve(new URL("../", import.meta.url).pathname);
replaceNpmWithBun(repoPath);
console.log("Replacement process completed.");
