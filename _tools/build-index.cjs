// Rebuilds devlog/index.html and sitemap.xml from the pages themselves. Run after adding a page or post:
//   node _tools/build-index.cjs
// GitHub Pages skips folders that start with "_", so this script is never published.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://sideeffectsstudio.buzz';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pick = (s, re) => (s.match(re) || [])[1] || '';
const GAMES = { tts: 'Tap Tap Sahur', gq: 'Brainrot Gem Quest', hg: 'Hatch &amp; Grow', pe: 'Pocket Exfil', bc: 'Bumper Crop', pa: 'Pocket Acres', cc: 'Caravan Cartel', tw: 'Town Wars', dd: 'DigDeeper', sr: 'Samurai Runner', ph: 'Coin Cavern', hh: 'Hoarder House', hx: 'HEXFIL' };

// ---------- devlog index ----------
const posts = fs.readdirSync(path.join(ROOT, 'devlog')).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => {
  const s = read('devlog/' + f);
  const game = pick(s, /<body class="game-page (\w+)"/);
  return {
    slug: f.replace(/\.html$/, ''), game,
    title: pick(s, /<h1 class="display">([\s\S]*?)<\/h1>/).trim(),
    date: pick(s, /<time datetime="([\d-]+)"/),
    pretty: pick(s, /<time datetime="[\d-]+">([^<]+)<\/time>/),
    summary: pick(s, /<meta name="description" content="([^"]*)"/),
  };
}).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
for (const p of posts) if (!p.title || !p.date || !GAMES[p.game]) throw new Error(`devlog/${p.slug}.html is missing a title, date or game class`);

const tpl = read('stories/index.html'); // same head, nav and footer as every other page
const head = tpl.slice(0, tpl.indexOf('<main>'))
  .replace(/<title>[^<]*<\/title>/, '<title>Devlog: what\'s new in our games · Rare Side Effects Studio</title>')
  .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*"/g, '$1Updates from Rare Side Effects Studio: what changed in each of our free browser games, and why."')
  .replace(/(<meta property="og:title" content=")[^"]*"/, '$1Devlog: what\'s new in our games"')
  .replace(/https:\/\/sideeffectsstudio\.buzz\/stories/g, SITE + '/devlog');
const foot = tpl.slice(tpl.indexOf('<footer>'));
const items = posts.map(p => `    <li><a href="/devlog/${p.slug}"><img src="/img/${p.game}-icon.png" alt="" width="64" height="64"><div><time datetime="${p.date}">${p.pretty} · ${GAMES[p.game]}</time><b>${p.title}</b><span>${p.summary}</span></div></a></li>`).join('\n');
fs.writeFileSync(path.join(ROOT, 'devlog/index.html'), `${head}<main>
<header class="page-head"><div class="wrap">
  <span class="kicker">What's new</span>
  <h1 class="display">Devlog</h1>
  <p class="lead">What changed in each of our games, written by the person who changed it. Newest first.</p>
</div></header>
<div class="wrap prose">
  <ul class="post-list">
${items}
  </ul>
  <p>Looking for how the studio works? Read the <a href="/stories">stories</a>.</p>
</div>
</main>
${foot}`);

// ---------- sitemap ----------
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !f.startsWith('google')).map(f => f === 'index.html' ? '' : f.replace(/\.html$/, ''));
const urls = [
  ...pages.sort((a, b) => (a === '' ? -1 : b === '' ? 1 : 0)),
  'devlog', ...posts.map(p => 'devlog/' + p.slug),
  'stories', ...fs.readdirSync(path.join(ROOT, 'stories')).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => 'stories/' + f.replace(/\.html$/, '')),
];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`devlog: ${posts.length} posts · sitemap: ${urls.length} URLs`);
