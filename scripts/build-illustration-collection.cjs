const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const workspace = path.resolve(__dirname, '..');
const folder = path.join(workspace, 'public/illustrations/collection-v1');
const originalFolder = path.join(workspace, 'output/image-originals/illustrations/collection-v1');
const reviewFolder = path.join(workspace, 'output/illustration-review');
const manifestPath = path.join(workspace, 'docs/illustrations-v1-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

async function main() {
  fs.mkdirSync(folder, { recursive: true });
  fs.mkdirSync(originalFolder, { recursive: true });
  fs.mkdirSync(reviewFolder, { recursive: true });
  const missing = manifest.assets.filter((asset) => !fs.existsSync(path.join(originalFolder, `${asset.id}.png`)) && !asset.existing);
  if (missing.length) throw new Error(`Missing ${missing.length} generated originals: ${missing.map((asset) => asset.id).join(', ')}`);

  const pilot = JSON.parse(fs.readFileSync(path.join(workspace, 'docs/illustration-pilot-v1.json'), 'utf8'));
  for (const asset of manifest.assets) {
    if (asset.existing) asset.prompt = pilot.assets.find((item) => item.id === asset.id).prompt;
    asset.path = `output/image-originals/illustrations/collection-v1/${asset.id}.png`;
  }

  const tiles = [];
  const catalog = [];
  for (const [index, asset] of manifest.assets.entries()) {
    const original = path.join(originalFolder, `${asset.id}.png`);
    if (asset.existing && !fs.existsSync(original)) {
      fs.copyFileSync(path.join(workspace, 'output/image-originals/illustrations/pilot-v1', `${asset.id}.png`), original);
    }
    const metadata = await sharp(original).metadata();
    if (!metadata.width || !metadata.height || metadata.width !== metadata.height) throw new Error(`Invalid square image: ${asset.id}`);
    const webp = path.join(folder, `${asset.id}.webp`);
    await sharp(original).resize(1024, 1024, { fit: 'contain', background: '#ffffff' }).webp({ quality: 80, effort: 6 }).toFile(webp);
    const image = await sharp(original).resize(300, 300, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
    const label = Buffer.from(`<svg width="300" height="50"><rect width="300" height="50" fill="white"/><text x="150" y="20" text-anchor="middle" font-family="Malgun Gothic, sans-serif" font-size="15" fill="#333">${escapeXml(asset.name)}</text><text x="150" y="40" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#777">${asset.id}</text></svg>`);
    tiles.push({ image, label, index });
    catalog.push({ id: asset.id, name: asset.name, animal: asset.animal, animalKo: asset.animalKo, element: asset.element, elementKo: asset.elementKo, src: `/illustrations/collection-v1/${asset.id}.webp`, width: 1024, height: 1024 });
  }

  async function sheet(selected, rows, output) {
    const composite = selected.flatMap((tile, index) => [
      { input: tile.image, left: (index % 5) * 300, top: Math.floor(index / 5) * 350 },
      { input: tile.label, left: (index % 5) * 300, top: Math.floor(index / 5) * 350 + 300 },
    ]);
    await sharp({ create: { width: 1500, height: rows * 350, channels: 3, background: '#ffffff' } }).composite(composite).png().toFile(path.join(reviewFolder, output));
  }
  await sheet(tiles, 20, 'preview-all.png');
  for (let page = 0; page < 4; page++) await sheet(tiles.slice(page * 25, page * 25 + 25), 5, `preview-${page + 1}.png`);
  fs.writeFileSync(path.join(folder, 'catalog.json'), JSON.stringify({ version: 1, elements: ['wood', 'fire', 'earth', 'metal', 'water'], assets: catalog }, null, 2) + '\n');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ originals: catalog.length, webp: catalog.length, previews: 5, webpBytes: catalog.reduce((sum, asset) => sum + fs.statSync(path.join(folder, `${asset.id}.webp`)).size, 0) }));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
