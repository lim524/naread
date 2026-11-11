const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../public/illustrations/concepts-v1');
const originalRoot = path.resolve(__dirname, '../output/image-originals/illustrations/concepts-v1');
const reviewRoot = path.resolve(__dirname, '../output/illustration-review');
async function main() {
  fs.mkdirSync(root,{recursive:true});
  fs.mkdirSync(reviewRoot,{recursive:true});
  const originals = fs.readdirSync(originalRoot).filter((name) => name.endsWith('.png') && !name.startsWith('preview'));
  const tiles = [];
  const assets = [];
  for (const [index, name] of originals.entries()) {
    const id = name.slice(0, -4);
    await sharp(path.join(originalRoot, name)).resize(768,768,{fit:'contain',background:'white'}).webp({quality:88}).toFile(path.join(root,`${id}.webp`));
    const input = await sharp(path.join(originalRoot,name)).resize(200,200,{fit:'contain',background:'white'}).png().toBuffer();
    const left = index%7*200, top = Math.floor(index/7)*230;
    tiles.push({input,left,top},{input:Buffer.from(`<svg width="200" height="30"><rect width="200" height="30" fill="white"/><text x="100" y="20" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#665575">${id}</text></svg>`),left,top:top+200});
    assets.push({id,src:`/illustrations/concepts-v1/${id}.webp`});
  }
  await sharp({create:{width:1400,height:Math.ceil(originals.length/7)*230,channels:3,background:'white'}}).composite(tiles).png().toFile(path.join(reviewRoot,'concepts-preview.png'));
  fs.writeFileSync(path.join(root,'catalog.json'),JSON.stringify({version:'2026.11.10-v1',mode:'built-in image_gen',assets},null,2)+'\n');
  console.log(JSON.stringify({originals:originals.length,webp:assets.length}));
}
main().catch((error)=>{console.error(error);process.exitCode=1;});
