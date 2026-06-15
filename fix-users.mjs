import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath);
    }
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("from('User')") || content.includes('from("User")') || content.includes('from(`User`)')) {
    const newContent = content.replace(/from\(['"`]User['"`]\)/g, "from('profiles')");
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed User references in', filePath);
  }
}

walkSync(path.join(process.cwd(), 'src'), processFile);
