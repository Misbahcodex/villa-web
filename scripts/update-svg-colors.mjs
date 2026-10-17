import fs from "node:fs";
import path from "node:path";

// Strictly the 5 Urban Slate colors:
// #E9E6E7 (White/Half-White)
// #5E5653 (Dark Slate)
// #6B7C98 (Slate Blue)
// #7B7F8A (Slate Gray)
// #AB978C (Warm Taupe)
const colorMap = [
  // Backgrounds to exact #E9E6E7 or white
  { from: /#121417/gi, to: "#E9E6E7" },
  { from: /#1B1714/gi, to: "#E9E6E7" },
  { from: /#0E0E10/gi, to: "#E9E6E7" },
  { from: /#1A1A1D/gi, to: "#E9E6E7" },
  { from: /#1E2025/gi, to: "#E9E6E7" },
  { from: /#F5F3F1/gi, to: "#E9E6E7" },
  { from: /#151417/gi, to: "#FFFFFF" },
  { from: /#1F1B18/gi, to: "#FFFFFF" },
  { from: /#141416/gi, to: "#FFFFFF" },
  { from: /#201F24/gi, to: "#FFFFFF" },
  { from: /#141417/gi, to: "#FFFFFF" },
  { from: /#151518/gi, to: "#FFFFFF" },
  { from: /#18181C/gi, to: "#FFFFFF" },
  // Stems & lines
  { from: /#2A2A2E/gi, to: "#7B7F8A" },
  { from: /#D5CFCA/gi, to: "#7B7F8A" },
  // Accents to exact #6B7C98
  { from: /#4A607F/gi, to: "#6B7C98" },
  { from: /#C8A96A/gi, to: "#6B7C98" },
];

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".svg")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      let changed = false;
      for (const { from, to } of colorMap) {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Updated colors in ${entry.name}`);
      }
    }
  }
}

const imagesDir = path.resolve(process.cwd(), "public/images");
processDir(imagesDir);
console.log("SVG colors updated strictly to Urban Slate palette.");
