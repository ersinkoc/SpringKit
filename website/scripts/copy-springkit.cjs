const fs = require('fs');
const path = require('path');

const p = 'public/springkit';
fs.mkdirSync(p, { recursive: true });

// Republish the ESM builds under the names vite.config.ts aliases to.
// The React bundle imports the core via the bare '@oxog/springkit' specifier,
// which the same alias resolves to springkit.mjs (one shared core instance).
function copyBundle(src, dest) {
  fs.copyFileSync(src, path.join(p, dest));
  // Older builds shipped source maps; drop any stale copies.
  fs.rmSync(path.join(p, `${dest}.map`), { force: true });
}

copyBundle('../dist/index.js', 'springkit.mjs');
copyBundle('../dist/react/index.js', 'react.mjs');

console.log('SpringKit dist copied!');
