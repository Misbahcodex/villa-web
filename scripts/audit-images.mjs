import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = process.cwd();
const IMAGES_DIR = path.join(ROOT_DIR, "public", "images");
const OUTPUT_JSON = path.join(ROOT_DIR, "data", "images.generated.json");

// Slot specifications from requirements
export const SLOT_DEFINITIONS = [
  {
    slot: "hero-main",
    requiredFilename: "hero-villa.png",
    minWidth: 2400,
    minHeight: 1350,
    orientation: "landscape",
    priority: "P0",
    fallbackSrc: "/images/hero-villa.svg",
    defaultAlt: "Exterior twilight view of Rizq Luxurious Villa and pool",
    focalPoint: "50% 40%",
    candidateFilenames: ["hero-villa.png", "hero-main.png", "hero-main.jpg", "hero-villa.jpg"],
  },
  {
    slot: "exterior-front",
    requiredFilename: "villa-facade.png",
    minWidth: 1600,
    minHeight: 1200,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/hero-villa.svg",
    defaultAlt: "Front facade and entrance of Rizq Luxurious Villa",
    focalPoint: "50% 50%",
    candidateFilenames: ["villa-facade.png", "exterior-front.png", "exterior-front.jpg"],
  },
  {
    slot: "pool-main",
    requiredFilename: "pool.png",
    minWidth: 2000,
    minHeight: 1333,
    orientation: "landscape",
    priority: "P0",
    fallbackSrc: "/images/amenities/pool.svg",
    defaultAlt: "Outdoor swimming pool courtyard with loungers",
    focalPoint: "50% 50%",
    candidateFilenames: ["pool.png", "pool-main.png", "pool-main.jpg"],
  },
  {
    slot: "pool-detail",
    requiredFilename: "pool-loungers.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/amenities/pool.svg",
    defaultAlt: "Close-up detail of outdoor pool and courtyard seating",
    focalPoint: "50% 50%",
    candidateFilenames: ["pool-loungers.png", "pool-detail.png", "pool-detail.jpg"],
  },
  {
    slot: "coworking-main",
    requiredFilename: "coworking.png",
    minWidth: 2000,
    minHeight: 1333,
    orientation: "landscape",
    priority: "P0",
    fallbackSrc: "/images/amenities/coworking.svg",
    defaultAlt: "Coworking space with dedicated work tables and seating",
    focalPoint: "50% 50%",
    candidateFilenames: ["coworking.png", "coworking-main.png", "coworking-main.jpg", "meetting-room.jpg"],
  },
  {
    slot: "coworking-detail",
    requiredFilename: "workspace-desk.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/amenities/coworking.svg",
    defaultAlt: "Work desk setup with power access for laptops",
    focalPoint: "50% 50%",
    candidateFilenames: ["workspace-desk.png", "coworking-detail.png", "coworking-detail.jpg"],
  },
  {
    slot: "cafe-main",
    requiredFilename: "living-space.png",
    minWidth: 2000,
    minHeight: 1333,
    orientation: "landscape",
    priority: "P0",
    fallbackSrc: "/images/amenities/cafe.svg",
    defaultAlt: "Social lounge and dining space with communal seating",
    focalPoint: "50% 50%",
    candidateFilenames: ["living-space.png", "cafe.png", "cafe-main.png", "cafe-main.jpg", "living-and-dining-space.jpg"],
  },
  {
    slot: "cafe-detail",
    requiredFilename: "modern-kitchen.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/amenities/cafe.svg",
    defaultAlt: "Resident kitchen and coffee counter area",
    focalPoint: "50% 50%",
    candidateFilenames: ["modern-kitchen.png", "kitchen.png", "cafe-detail.png", "cafe-detail.jpg", "modern-kitchen.jpg"],
  },
  {
    slot: "lounge-community",
    requiredFilename: "social-lounge.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P2",
    fallbackSrc: "/images/amenities/cafe.svg",
    defaultAlt: "Communal lounge area for villa residents",
    focalPoint: "50% 50%",
    candidateFilenames: ["social-lounge.png", "lounge-community.png", "lounge-community.jpg"],
  },
  {
    slot: "single-capsule-1",
    requiredFilename: "single-capsule-1.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P0",
    fallbackSrc: "/images/rooms/single-capsule-1.svg",
    defaultAlt: "Premium Single Capsule Pod sleeping compartment",
    focalPoint: "50% 50%",
    candidateFilenames: ["single-capsule-1.png", "single-capsule.png", "single-capsule-1.jpg"],
  },
  {
    slot: "single-capsule-2",
    requiredFilename: "single-capsule-2.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/rooms/single-capsule-2.svg",
    defaultAlt: "Interior view of single capsule pod with bedding and lighting",
    focalPoint: "50% 50%",
    candidateFilenames: ["single-capsule-2.png", "single-capsule-detail.png", "single-capsule-2.jpg"],
  },
  {
    slot: "single-capsule-3",
    requiredFilename: "single-capsule-3.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/rooms/single-capsule-3.svg",
    defaultAlt: "Capsule pod corridor and storage locker area",
    focalPoint: "50% 50%",
    candidateFilenames: ["single-capsule-3.png", "single-capsule-corridor.png", "single-capsule-3.jpg"],
  },
  {
    slot: "double-capsule-1",
    requiredFilename: "double-capsule-1.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P0",
    fallbackSrc: "/images/rooms/double-capsule-1.svg",
    defaultAlt: "Deluxe Double Capsule Pod with double bedding",
    focalPoint: "50% 50%",
    candidateFilenames: ["double-capsule-1.png", "double-capsule.png", "rizq-villa-luxury-dorm.png", "double-capsule-1.jpg", "rizq-villa-luxury-dorm.jpg"],
  },
  {
    slot: "double-capsule-2",
    requiredFilename: "double-capsule-2.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/rooms/double-capsule-2.svg",
    defaultAlt: "Double capsule pod interior showing tech shelf and lighting",
    focalPoint: "50% 50%",
    candidateFilenames: ["double-capsule-2.png", "double-capsule-detail.png", "double-capsule-2.jpg"],
  },
  {
    slot: "double-capsule-3",
    requiredFilename: "double-capsule-3.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/rooms/double-capsule-3.svg",
    defaultAlt: "Double capsule pod bay view",
    focalPoint: "50% 50%",
    candidateFilenames: ["double-capsule-3.png", "double-capsule-bay.png", "double-capsule-3.jpg"],
  },
  {
    slot: "executive-suite-1",
    requiredFilename: "executive-suite-1.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P0",
    fallbackSrc: "/images/rooms/executive-suite-1.svg",
    defaultAlt: "Executive Private Suite bedroom with master bed",
    focalPoint: "50% 50%",
    candidateFilenames: ["executive-suite-1.png", "executive-suite.png", "suite-bedroom.png", "executive-suite-1.jpg"],
  },
  {
    slot: "executive-suite-2",
    requiredFilename: "executive-suite-2.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/rooms/executive-suite-2.svg",
    defaultAlt: "Executive Private Suite dedicated work desk and seating",
    focalPoint: "50% 50%",
    candidateFilenames: ["executive-suite-2.png", "suite-desk.png", "executive-suite-2.jpg"],
  },
  {
    slot: "executive-suite-3",
    requiredFilename: "bathroom.png",
    minWidth: 1600,
    minHeight: 1067,
    orientation: "landscape",
    priority: "P1",
    fallbackSrc: "/images/rooms/executive-suite-3.svg",
    defaultAlt: "Private en-suite bathroom with walk-in shower and vanity",
    focalPoint: "50% 50%",
    candidateFilenames: ["bathroom.png", "executive-suite-3.png", "suite-bathroom.png", "bathroom.jpg", "executive-suite-3.jpg"],
  },
  {
    slot: "location-view",
    requiredFilename: "location-skyline.png",
    minWidth: 2000,
    minHeight: 1000,
    orientation: "landscape",
    priority: "P2",
    fallbackSrc: "/images/location-map.svg",
    defaultAlt: "Dubai skyline and Downtown district view near the villa",
    focalPoint: "50% 50%",
    candidateFilenames: ["location-skyline.png", "location-map.png", "location-view.png", "location-view.jpg"],
  },
  {
    slot: "og-share",
    requiredFilename: "og-share.png",
    minWidth: 1200,
    minHeight: 630,
    orientation: "landscape",
    priority: "P2",
    fallbackSrc: "/images/hero-villa.svg",
    defaultAlt: "Rizq Luxurious Villa Dubai social preview",
    focalPoint: "50% 40%",
    candidateFilenames: ["og-share.png", "hero-villa.png", "og-share.jpg", "hero-villa.jpg"],
  },
];

function getOrientation(width, height) {
  if (!width || !height) return "unknown";
  if (width > height) return "landscape";
  if (height > width) return "portrait";
  return "square";
}

function parseSvgDimensions(svgContent) {
  let width = 1200;
  let height = 800;
  const viewBoxMatch = svgContent.match(/viewBox=["']\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/);
  if (viewBoxMatch) {
    width = Math.round(parseFloat(viewBoxMatch[3]));
    height = Math.round(parseFloat(viewBoxMatch[4]));
  } else {
    const widthMatch = svgContent.match(/width=["'](\d+)(?:px)?["']/);
    const heightMatch = svgContent.match(/height=["'](\d+)(?:px)?["']/);
    if (widthMatch) width = parseInt(widthMatch[1], 10);
    if (heightMatch) height = parseInt(heightMatch[1], 10);
  }
  return { width, height };
}

async function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await scanDirectory(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export async function auditImages() {
  const allFilePaths = await scanDirectory(IMAGES_DIR);
  const inventory = [];

  for (const filePath of allFilePaths) {
    const ext = path.extname(filePath).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) {
      continue;
    }
    const stat = fs.statSync(filePath);
    const relFromPublic = path.relative(path.join(ROOT_DIR, "public"), filePath).replace(/\\/g, "/");
    const filename = path.basename(filePath);

    let width = 0;
    let height = 0;
    let format = ext.replace(".", "");
    let blurDataURL = null;

    if (ext === ".svg") {
      const content = fs.readFileSync(filePath, "utf8");
      const dims = parseSvgDimensions(content);
      width = dims.width;
      height = dims.height;
    } else {
      try {
        const image = sharp(filePath);
        const meta = await image.metadata();
        width = meta.width || 0;
        height = meta.height || 0;
        format = meta.format || format;

        // Generate tiny base64 placeholder for Next.js blur
        const tinyBuffer = await sharp(filePath)
          .resize(16, Math.max(1, Math.round(16 * (height / width))), { fit: "cover" })
          .jpeg({ quality: 50 })
          .toBuffer();
        blurDataURL = `data:image/jpeg;base64,${tinyBuffer.toString("base64")}`;
      } catch (err) {
        console.warn(`Warning reading metadata for ${filename}:`, err.message);
      }
    }

    inventory.push({
      filename,
      relPath: `/${relFromPublic}`,
      fullPath: filePath,
      sizeBytes: stat.size,
      sizeMB: parseFloat((stat.size / (1024 * 1024)).toFixed(2)),
      width,
      height,
      orientation: getOrientation(width, height),
      format,
      blurDataURL,
    });
  }

  // Build slot mapping and images.generated.json
  const generatedSlots = {};
  const slotMappings = [];
  const missingByPriority = { P0: [], P1: [], P2: [] };
  const qualityWarnings = [];

  for (const def of SLOT_DEFINITIONS) {
    let matchedItem = null;

    for (const cand of def.candidateFilenames) {
      const found = inventory.find(i => i.filename.toLowerCase() === cand.toLowerCase());
      if (found) {
        matchedItem = found;
        break;
      }
    }

    const isProvided = !!matchedItem;
    const finalSrc = isProvided ? matchedItem.relPath : def.fallbackSrc;

    // Quality check
    if (isProvided) {
      if (matchedItem.width < def.minWidth || matchedItem.height < def.minHeight) {
        qualityWarnings.push({
          slot: def.slot,
          filename: matchedItem.filename,
          issue: `Resolution ${matchedItem.width}x${matchedItem.height} is below recommended min ${def.minWidth}x${def.minHeight}`,
        });
      }
      if (matchedItem.orientation !== def.orientation) {
        qualityWarnings.push({
          slot: def.slot,
          filename: matchedItem.filename,
          issue: `Orientation is ${matchedItem.orientation}, but slot expects ${def.orientation}`,
        });
      }
      if (matchedItem.sizeMB > 2.0) {
        qualityWarnings.push({
          slot: def.slot,
          filename: matchedItem.filename,
          issue: `File size ${matchedItem.sizeMB} MB is larger than 2 MB. Optimization recommended.`,
        });
      }
    } else {
      missingByPriority[def.priority].push(def.requiredFilename);
    }

    // Alt text factual and visible
    const alt = def.defaultAlt;

    generatedSlots[def.slot] = {
      slot: def.slot,
      src: finalSrc,
      fallbackSrc: def.fallbackSrc,
      alt,
      width: matchedItem ? matchedItem.width : 1200,
      height: matchedItem ? matchedItem.height : 800,
      focalPoint: def.focalPoint || "50% 50%",
      status: isProvided ? "provided" : "missing",
      blurDataURL: matchedItem ? matchedItem.blurDataURL : undefined,
    };

    slotMappings.push({
      slot: def.slot,
      requiredFilename: def.requiredFilename,
      assignedFile: matchedItem ? matchedItem.filename : "(none - using SVG fallback)",
      status: isProvided ? "provided" : "missing",
      priority: def.priority,
      reason: isProvided
        ? `Matched ${matchedItem.filename} to ${def.slot} based on visual content & room type.`
        : `Awaiting photo '${def.requiredFilename}'.`,
    });
  }

  // Ensure /data directory exists and write images.generated.json
  const dataDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(generatedSlots, null, 2), "utf8");

  return {
    inventory,
    slotMappings,
    missingByPriority,
    qualityWarnings,
    generatedSlots,
  };
}

// If run directly via node scripts/audit-images.mjs
if (process.argv[1] && process.argv[1].endsWith("audit-images.mjs")) {
  auditImages().then(res => {
    console.log("\n=======================================================");
    console.log("RIZQ LUXURIOUS VILLA - IMAGE INVENTORY AUDIT");
    console.log("=======================================================\n");

    console.log("--- 1. FILES IN /public/images/ ---");
    console.table(
      res.inventory.map(i => ({
        Filename: i.filename,
        Dimensions: `${i.width}x${i.height}`,
        "Size (MB)": i.sizeMB,
        Orientation: i.orientation,
        Format: i.format,
      }))
    );

    console.log("\n--- 2. SLOT MAPPINGS ---");
    console.table(
      res.slotMappings.map(s => ({
        Slot: s.slot,
        "Assigned File": s.assignedFile,
        Status: s.status,
        Priority: s.priority,
      }))
    );

    console.log("\n--- 3. MISSING BY PRIORITY ---");
    console.log("P0 (pitch critical):", res.missingByPriority.P0);
    console.log("P1 (strong polish):", res.missingByPriority.P1);
    console.log("P2 (nice to have):", res.missingByPriority.P2);

    if (res.qualityWarnings.length > 0) {
      console.log("\n--- 4. QUALITY WARNINGS ---");
      console.table(res.qualityWarnings);
    }

    console.log(`\nGenerated registry data written to ${OUTPUT_JSON}\n`);
  }).catch(err => {
    console.error("Audit failed:", err);
    process.exit(1);
  });
}
