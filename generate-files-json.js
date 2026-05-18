const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter(f => f.match(/\.jpg$/i))
  .sort();

fs.writeFileSync(
  path.join(dir, 'files.json'),
  JSON.stringify(files, null, 2)
);

console.log('✓ files.json generated with ' + files.length + ' images');