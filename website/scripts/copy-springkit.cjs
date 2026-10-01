const fs = require('fs');
const path = require('path');

const p = 'public/springkit';
fs.mkdirSync(p, { recursive: true });

// Copy main springkit bundle (ESM output is dist/index.js; republish as springkit.mjs)
let mainContent = fs.readFileSync('../dist/index.js', 'utf8');
mainContent = mainContent.replace(/\/\/# sourceMappingURL=index\.js\.map/g, '//# sourceMappingURL=springkit.mjs.map');
fs.writeFileSync(path.join(p, 'springkit.mjs'), mainContent);
fs.copyFileSync('../dist/index.js.map', path.join(p, 'springkit.mjs.map'));

// Copy react adapter
let reactContent = fs.readFileSync('../dist/react/index.js', 'utf8');
reactContent = reactContent.replace(/\/\/# sourceMappingURL=index\.js\.map/g, '//# sourceMappingURL=react.mjs.map');
fs.writeFileSync(path.join(p, 'react.mjs'), reactContent);
fs.copyFileSync('../dist/react/index.js.map', path.join(p, 'react.mjs.map'));

console.log('SpringKit dist copied!');
