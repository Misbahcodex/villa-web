import fs from 'fs';
import path from 'path';

const SVG_DIR = 'public/images';

function getSvgFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getSvgFiles(fullPath));
    } else if (file.endsWith('.svg')) {
      results.push(fullPath);
    }
  });
  return results;
}

// Map each legacy hex to the exact Urban Slate palette value
const COLOR_MAP = {
  // Whites -> soft-pearl (#E9E6E7) or pearl-50 (#F6F4F5)
  '#FFFFFF': '#E9E6E7',
  '#ffffff': '#E9E6E7',
  '#FFF': '#E9E6E7',
  '#fff': '#E9E6E7',

  // Deep darks -> umber-950 (#1C1816)
  '#121215': '#1C1816',
  '#131316': '#1C1816',
  '#131317': '#1C1816',
  '#141418': '#1C1816',
  '#14181B': '#1C1816',
  '#111114': '#1C1816',
  '#161619': '#1C1816',
  '#16161A': '#1C1816',
  '#18181D': '#1C1816',
  '#0F2022': '#1C1816',
  '#112428': '#1C1816',
  '#17282C': '#1C1816',

  // Medium darks & surfaces -> umber-900 (#262120)
  '#19191D': '#262120',
  '#1A1A1E': '#262120',
  '#1B1B1F': '#262120',
  '#1C1C20': '#262120',
  '#1C1C21': '#262120',
  '#1C1C22': '#262120',
  '#1D1D21': '#262120',
  '#1D1D23': '#262120',
  '#1E1E22': '#262120',
  '#1F1F24': '#262120',
  '#202024': '#262120',
  '#25252A': '#262120',

  // Cool blues / dark slates -> slate-blue-700 (#4F5E78)
  '#1E3A3A': '#4F5E78',
  '#1E3E44': '#4F5E78',
  '#233E44': '#4F5E78',
  '#1A2D2F': '#4F5E78',
  '#182A2E': '#4F5E78',
  '#172225': '#4F5E78',
};

const svgFiles = getSvgFiles(SVG_DIR);

let totalReplaced = 0;

svgFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let fileReplaced = 0;

  for (const [oldHex, newHex] of Object.entries(COLOR_MAP)) {
    // Regex for exact hex match (case-insensitive)
    const regex = new RegExp(oldHex + '(?![0-9a-fA-F])', 'gi');
    if (regex.test(content)) {
      content = content.replace(regex, newHex);
      fileReplaced++;
      totalReplaced++;
    }
  }

  if (fileReplaced > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Recolored ${file}`);
  }
});

console.log(`Successfully recolored ${totalReplaced} color references across SVG files.`);
