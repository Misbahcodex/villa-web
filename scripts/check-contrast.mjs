/**
 * Contrast Checker Script
 * Computes WCAG 2.1 contrast ratios for every foreground/background pair in the Urban Slate Light Theme.
 * Enforces >= 4.5:1 for body text pairs and >= 3.0:1 for large text / UI component pairs.
 */

const PALETTE = {
  // Source palette
  'soft-pearl': '#E9E6E7',
  'warm-umber': '#5E5653',
  'slate-grey': '#7B7F8A',
  'warm-taupe': '#AB978C',
  'slate-blue': '#6B7C98',

  // Derived light theme shades
  'pearl-50': '#F6F4F5',
  'white': '#FFFFFF',
  'umber-950': '#1C1816',
  'slate-blue-700': '#4F5E78',
  'border-subtle': '#D8D4D6',
  'success': '#4E8752',
};

// Semantic Tokens - Light Theme
const TOKENS = {
  'bg-base': PALETTE['pearl-50'],
  'bg-surface': PALETTE['white'],
  'bg-light': PALETTE['soft-pearl'],
  'border-subtle': PALETTE['border-subtle'],
  'text-primary': PALETTE['umber-950'],
  'text-body': PALETTE['warm-umber'],
  'text-muted': PALETTE['slate-grey'],
  'text-link': PALETTE['slate-blue-700'],
  'accent': PALETTE['slate-blue'],
  'accent-strong': PALETTE['slate-blue-700'],
  'text-on-accent': PALETTE['white'],
  'success': PALETTE['success'],
};

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [sR, sG, sB] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Pairs to evaluate with role and minimum WCAG requirement
const PAIRS = [
  // --- ARCHITECTURAL DARK LUXURY PALETTE ---
  { fg: 'ivory-text', fgHex: '#F2E9DD', bg: 'bg-base', bgHex: '#10100F', role: 'Dark: Heading (Base)', min: 4.5 },
  { fg: 'ivory-text', fgHex: '#F2E9DD', bg: 'bg-surface', bgHex: '#171716', role: 'Dark: Heading (Surface)', min: 4.5 },
  { fg: 'ivory-text', fgHex: '#F2E9DD', bg: 'bg-elevated', bgHex: '#20201E', role: 'Dark: Heading (Elevated)', min: 4.5 },
  { fg: 'muted-taupe', fgHex: '#A7A097', bg: 'bg-base', bgHex: '#10100F', role: 'Dark: Body (Base)', min: 4.5 },
  { fg: 'muted-taupe', fgHex: '#A7A097', bg: 'bg-surface', bgHex: '#171716', role: 'Dark: Body (Surface)', min: 4.5 },
  { fg: 'accent-bronze', fgHex: '#C99A69', bg: 'bg-base', bgHex: '#10100F', role: 'Dark: Accent Label (Base)', min: 4.5 },
  { fg: 'bg-base', fgHex: '#10100F', bg: 'accent-bronze', bgHex: '#C99A69', role: 'Dark: Button Text on CTA', min: 3.0 },

  // --- URBAN SLATE LIGHT THEME PAIRS ---
  // Primary Headings / Text on Light Backgrounds (>= 4.5:1)
  { fg: 'text-primary', fgHex: TOKENS['text-primary'], bg: 'bg-base', bgHex: TOKENS['bg-base'], role: 'Light: Heading (Base)', min: 4.5 },
  { fg: 'text-primary', fgHex: TOKENS['text-primary'], bg: 'bg-surface', bgHex: TOKENS['bg-surface'], role: 'Light: Heading (Card)', min: 4.5 },
  { fg: 'text-primary', fgHex: TOKENS['text-primary'], bg: 'bg-light', bgHex: TOKENS['bg-light'], role: 'Light: Heading (Pearl)', min: 4.5 },

  // Body Copy on Light Backgrounds (>= 4.5:1)
  { fg: 'text-body', fgHex: TOKENS['text-body'], bg: 'bg-base', bgHex: TOKENS['bg-base'], role: 'Light: Body (Base)', min: 4.5 },
  { fg: 'text-body', fgHex: TOKENS['text-body'], bg: 'bg-surface', bgHex: TOKENS['bg-surface'], role: 'Light: Body (Card)', min: 4.5 },
  { fg: 'text-body', fgHex: TOKENS['text-body'], bg: 'bg-light', bgHex: TOKENS['bg-light'], role: 'Light: Body (Pearl)', min: 4.5 },

  // Links & Slate Blue Text (>= 4.5:1)
  { fg: 'text-link', fgHex: TOKENS['text-link'], bg: 'bg-base', bgHex: TOKENS['bg-base'], role: 'Light: Links (Base)', min: 4.5 },
  { fg: 'text-link', fgHex: TOKENS['text-link'], bg: 'bg-surface', bgHex: TOKENS['bg-surface'], role: 'Light: Links (Card)', min: 4.5 },
  { fg: 'text-link', fgHex: TOKENS['text-link'], bg: 'bg-light', bgHex: TOKENS['bg-light'], role: 'Light: Links (Pearl)', min: 4.5 },

  // Buttons & CTAs (UI Components / Bold Text >= 3.0:1)
  { fg: 'text-on-accent', fgHex: TOKENS['text-on-accent'], bg: 'accent', bgHex: TOKENS['accent'], role: 'Light: Button Text (Accent)', min: 3.0 },
  { fg: 'text-on-accent', fgHex: TOKENS['text-on-accent'], bg: 'accent-strong', bgHex: TOKENS['accent-strong'], role: 'Light: Button Text (Hover)', min: 3.0 },

  // Large Text & Muted Captions (>= 3.0:1)
  { fg: 'text-muted', fgHex: TOKENS['text-muted'], bg: 'bg-base', bgHex: TOKENS['bg-base'], role: 'Light: Large Text (Base)', min: 3.0 },
  { fg: 'text-muted', fgHex: TOKENS['text-muted'], bg: 'bg-surface', bgHex: TOKENS['bg-surface'], role: 'Light: Large Text (Card)', min: 3.0 },
  { fg: 'text-muted', fgHex: TOKENS['text-muted'], bg: 'bg-light', bgHex: TOKENS['bg-light'], role: 'Light: Large Text (Pearl)', min: 3.0 },
];

console.log('\n========================================================================================');
console.log(' WCAG 2.1 CONTRAST VERIFICATION: URBAN SLATE PURE LIGHT THEME');
console.log('========================================================================================\n');
console.log(
  'Foreground'.padEnd(23) +
  'Background'.padEnd(16) +
  'Role'.padEnd(28) +
  'Ratio'.padEnd(10) +
  'Min Req'.padEnd(10) +
  'Status'
);
console.log('-'.repeat(92));

let hasFailure = false;

for (const pair of PAIRS) {
  const ratio = getContrastRatio(pair.fgHex, pair.bgHex);
  const ratioStr = `${ratio.toFixed(2)}:1`;
  const minStr = `${pair.min.toFixed(1)}:1`;
  const passed = ratio >= pair.min;
  const status = passed ? '✓ PASS' : '✗ FAIL';

  if (!passed) {
    hasFailure = true;
  }

  const fgDisplay = `${pair.fg} (${pair.fgHex})`;
  const bgDisplay = `${pair.bg} (${pair.bgHex})`;

  console.log(
    fgDisplay.padEnd(23) +
    bgDisplay.padEnd(16) +
    pair.role.padEnd(28) +
    ratioStr.padEnd(10) +
    minStr.padEnd(10) +
    status
  );
}

console.log('-'.repeat(92));

if (hasFailure) {
  console.error('\n❌ CONTRAST VERIFICATION FAILED: One or more pairs do not satisfy minimum WCAG ratios.\n');
  process.exit(1);
} else {
  console.log('\n✅ ALL CONTRAST PAIRS SATISFY WCAG 2.1 REQUIREMENTS.\n');
  process.exit(0);
}
