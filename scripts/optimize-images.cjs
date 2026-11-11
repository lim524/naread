const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const archive = path.join(root, 'output/image-originals');
const within = (target, base) => target.startsWith(base + path.sep);
function archiveFile(source) {
  if (!within(source, publicRoot)) throw new Error('Source outside public directory');
  const destination = path.resolve(archive, path.relative(publicRoot, source));
  if (!within(destination, archive)) throw new Error('Archive outside workspace');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination)) {
    if (!fs.readFileSync(destination).equals(fs.readFileSync(source))) throw new Error(`Archive conflict: ${source}`);
  } else fs.copyFileSync(source, destination);
  // The verified archive preserves originals locally, outside served assets.
  fs.unlinkSync(source);
}
function files(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(folder,entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
async function main() {
  const before = files(publicRoot).reduce((sum,file) => sum + fs.statSync(file).size,0);
  const collection = path.join(publicRoot,'illustrations/collection-v1');
  let originalBytes=0, optimizedBytes=0, optimized=0;
  for (const name of fs.readdirSync(collection).filter(name=>name.endsWith('.webp'))) {
    const target=path.join(collection,name);
    const png=name.replace(/\.webp$/,'.png');
    const localSource=path.join(collection,png), archivedSource=path.join(archive,'illustrations/collection-v1',png);
    const source=fs.existsSync(localSource)?localSource:archivedSource;
    if(!fs.existsSync(source)) continue;
    const current=fs.readFileSync(target);
    const metadata=await sharp(current).metadata();
    const output=await sharp(source).resize(metadata.width,metadata.height,{fit:'contain',background:'#ffffff'}).webp({quality:80,effort:6}).toBuffer();
    originalBytes+=current.length;
    if(output.length<current.length) {
      const backup=path.join(root,'output/image-backups',path.relative(publicRoot,target));
      fs.mkdirSync(path.dirname(backup),{recursive:true});
      if(!fs.existsSync(backup)) fs.writeFileSync(backup,current);
      fs.writeFileSync(target,output); optimized++;
      optimizedBytes+=output.length;
    } else optimizedBytes+=current.length;
  }
  const og=path.join(publicRoot,'og.png');
  if(fs.existsSync(og)) await sharp(og).jpeg({quality:85,mozjpeg:true}).toFile(path.join(publicRoot,'og.jpg'));
  // PNGs are editable originals or contact sheets; runtime images use WebP/JPEG.
  for(const file of files(publicRoot)) if(file.endsWith('.png')) archiveFile(file);
  const pilot=path.join(publicRoot,'illustrations/pilot-v1');
  if(fs.existsSync(pilot)) for(const file of files(pilot)) archiveFile(file);
  // Published catalogs should not link to locally archived source files.
  for(const folder of ['collection-v1','concepts-v1']) {
    const catalogPath=path.join(publicRoot,'illustrations',folder,'catalog.json');
    const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
    const assets=Array.isArray(catalog)?catalog:catalog.assets;
    for(const asset of assets) delete asset.original;
    fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
  }
  const after=files(publicRoot).reduce((sum,file)=>sum+fs.statSync(file).size,0);
  console.log(JSON.stringify({optimized,collectionBeforeMB:originalBytes/1048576,collectionAfterMB:optimizedBytes/1048576,publicBeforeMB:before/1048576,publicAfterMB:after/1048576,archive:'output/image-originals'},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
