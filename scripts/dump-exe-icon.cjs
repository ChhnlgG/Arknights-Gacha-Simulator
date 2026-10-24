/** 从 exe 中导出当前 RT_GROUP_ICON 的最大尺寸图，用于验证替换结果。 */
const fs = require('fs');
const path = require('path');
const { load } = require('resedit/cjs');

(async () => {
  const { NtExecutable, NtExecutableResource, Resource } = await load();
  const exePath = path.resolve(process.argv[2]);
  const outPath = path.resolve(process.argv[3]);
  const exe = NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const res = NtExecutableResource.from(exe);
  const groups = Resource.IconGroupEntry.fromEntries(res.entries);
  const g = groups[0];
  console.log('group:', g.id, g.lang, g.icons.map((i) => `${i.width}x${i.height}(${i.dataSize}B)`).join(' '));

  const entries = res.entries.filter((e) => e.type === 3);
  const target = g.icons[g.icons.length - 1];
  const found = entries.find((e) => e.id === target.iconID);
  if (!found) throw new Error('找不到 iconID=' + target.iconID + ' 的 RT_ICON');
  fs.writeFileSync(outPath, Buffer.from(found.bin));
  console.log('导出', outPath, found.bin.byteLength, 'bytes');
})();
