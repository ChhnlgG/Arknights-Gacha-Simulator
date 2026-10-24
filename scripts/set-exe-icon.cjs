/**
 * 用 build/icon.ico 替换 exe 的图标资源（不重新打包，直接改写 PE 资源段）。
 * 用法: node scripts/set-exe-icon.cjs <exe> <ico>
 */
const fs = require('fs');
const path = require('path');
const { load } = require('resedit/cjs');

(async () => {
  const { NtExecutable, NtExecutableResource, Resource, Data } = await load();

  const exePath = path.resolve(process.argv[2]);
  const icoPath = path.resolve(process.argv[3] || path.join(__dirname, '..', 'build', 'icon.ico'));

  const icoFile = Data.IconFile.from(fs.readFileSync(icoPath));
  const images = icoFile.icons.map((i) => i.data);
  console.log('ico 内含图像:', icoFile.icons.map((i) => `${i.width}x${i.height}`).join(', '));

  const exe = NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const res = NtExecutableResource.from(exe);

  const before = Resource.IconGroupEntry.fromEntries(res.entries);
  console.log('替换前 icon group:', before.map((g) => `id=${g.id} lang=${g.lang} n=${g.icons.length}`).join(' | '));

  if (before.length === 0) {
    throw new Error('未找到 RT_GROUP_ICON 资源，无法替换');
  }

  for (const g of before) {
    Resource.IconGroupEntry.replaceIconsForResource(res.entries, g.id, g.lang, images);
    console.log(`已替换 group id=${g.id} lang=${g.lang}`);
  }

  res.outputResource(exe);

  const out = Buffer.from(exe.generate());
  fs.writeFileSync(exePath, out);
  console.log(`写入完成: ${exePath} (${(out.length / 1024 / 1024).toFixed(1)} MB)`);
})();
