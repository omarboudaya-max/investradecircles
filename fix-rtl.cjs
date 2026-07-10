const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const pattern = /\s*\$\{isArabic \? 'flex-row-reverse' : ''\}/g;
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed', fullPath);
      }
    }
  }
}

replaceInFiles(path.join(__dirname, 'src'));
console.log('Done!');
