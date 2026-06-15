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

const schema = {};

function addField(table, field) {
  if (!schema[table]) schema[table] = new Set();
  schema[table].add(field);
}

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');

  // Look for .insert({ ... })
  const insertRegex = /supabase\.from\(['"]([^'"]+)['"]\)\.insert\(\s*\{([^}]+)\}/g;
  let match;
  while ((match = insertRegex.exec(content)) !== null) {
    const table = match[1];
    const objBody = match[2];
    const keys = objBody.match(/([a-zA-Z0-9_]+)\s*:/g);
    if (keys) {
      keys.forEach(k => addField(table, k.replace(':', '').trim()));
    }
    // Also catch shorthand properties
    const shorthands = objBody.match(/([a-zA-Z0-9_]+)\s*,/g);
    if (shorthands) {
      shorthands.forEach(k => addField(table, k.replace(',', '').trim()));
    }
  }

  // Look for .update({ ... })
  const updateRegex = /supabase\.from\(['"]([^'"]+)['"]\)\.update\(\s*\{([^}]+)\}/g;
  while ((match = updateRegex.exec(content)) !== null) {
    const table = match[1];
    const objBody = match[2];
    const keys = objBody.match(/([a-zA-Z0-9_]+)\s*:/g);
    if (keys) {
      keys.forEach(k => addField(table, k.replace(':', '').trim()));
    }
    const shorthands = objBody.match(/([a-zA-Z0-9_]+)\s*,/g);
    if (shorthands) {
      shorthands.forEach(k => addField(table, k.replace(',', '').trim()));
    }
  }
}

walkSync(path.join(process.cwd(), 'src'), processFile);

const output = {};
for (const table in schema) {
  output[table] = Array.from(schema[table]);
}
console.log(JSON.stringify(output, null, 2));
