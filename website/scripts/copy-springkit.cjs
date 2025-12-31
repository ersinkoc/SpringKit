const fs = require('fs');
const path = require('path');

const p = 'public/springkit';
fs.mkdirSync(p, { recursive: true });

// Copy main springkit bundle
let mainContent = fs.readFileSync('../dist/index.mjs', 'utf8');
mainContent = mainContent.replace(/\/\/# sourceMappingURL=index\.mjs\.map/g, '//# sourceMappingURL=springkit.mjs.map');
fs.writeFileSync(path.join(p, 'springkit.mjs'), mainContent);
fs.copyFileSync('../dist/index.mjs.map', path.join(p, 'springkit.mjs.map'));

// Copy react adapter
let reactContent = fs.readFileSync('../dist/react/index.mjs', 'utf8');
reactContent = reactContent.replace(/\/\/# sourceMappingURL=index\.mjs\.map/g, '//# sourceMappingURL=react.mjs.map');
fs.writeFileSync(path.join(p, 'react.mjs'), reactContent);
fs.copyFileSync('../dist/react/index.mjs.map', path.join(p, 'react.mjs.map'));

console.log('SpringKit dist copied!');
