import sharp from "sharp";
import fs from "fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="8" fill="#10100F" stroke="#C99A69" stroke-width="2"/>
  <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="36" fill="#C99A69">R</text>
</svg>`;

async function main() {
  const buf = Buffer.from(svg);
  await sharp(buf).resize(32, 32).png().toFile("public/favicon.ico");
  await sharp(buf).resize(192, 192).png().toFile("public/icon.png");
  await sharp(buf).resize(32, 32).png().toFile("app/favicon.ico");
  console.log("Favicons generated successfully!");
}

main().catch(console.error);
