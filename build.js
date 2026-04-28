const fs   = require('fs');
const path = require('path');

// ── Markdown-lite converter ──────────────────────────────────────────────────
// **text** → <strong>text</strong>
// _text_  → <em>text</em>
function md(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g,       '<em>$1</em>');
}

// ── Setup ────────────────────────────────────────────────────────────────────
const TEMPLATES = 'templates';
const CONTENT   = 'content';
const DIST      = 'dist';
const PAGES     = ['index', 'individual-therapy', 'couples-therapy', 'about', 'rates'];

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);

// Copy static assets (images, CSS, fonts, etc.) into dist
fs.readdirSync('.').forEach(file => {
  const ext = path.extname(file).toLowerCase();
  if (['.jpg','.jpeg','.png','.gif','.svg','.css','.ico','.txt','.xml','.webp'].includes(ext)) {
    fs.copyFileSync(file, path.join(DIST, file));
  }
});

// ── Load shared/global content ───────────────────────────────────────────────
const global = JSON.parse(fs.readFileSync(path.join(CONTENT, 'global.json'), 'utf8'));

// ── Build each page ──────────────────────────────────────────────────────────
PAGES.forEach(page => {
  const tmplPath    = path.join(TEMPLATES, `${page}.html`);
  const contentPath = path.join(CONTENT,   `${page}.json`);

  if (!fs.existsSync(tmplPath) || !fs.existsSync(contentPath)) {
    console.warn(`⚠  Skipping "${page}" — missing template or content file`);
    return;
  }

  let html = fs.readFileSync(tmplPath, 'utf8');
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

  // Merge global into page content (page values win on conflict)
  const all = { ...global, ...content };

  // Replace every __key__ placeholder
  Object.entries(all).forEach(([key, value]) => {
    html = html.split(`__${key}__`).join(md(String(value)));
  });

  fs.writeFileSync(path.join(DIST, `${page}.html`), html);
  console.log(`✓  Built ${page}.html`);
});

console.log('\nBuild complete.');
