const fs = require('fs');
const { load } = require('resedit/cjs');

(async () => {
  const { NtExecutable, NtExecutableResource, Resource } = await load();
  const exePath = process.argv[2];
  const data = fs.readFileSync(exePath);
  const exe = NtExecutable.from(data, { ignoreCert: true });
  const res = NtExecutableResource.from(exe);

  const groups = Resource.IconGroupEntry.fromEntries(res.entries);
  console.log('icon groups:', JSON.stringify(groups.map((g) => ({ id: g.id, lang: g.lang, count: g.icons.length, sizes: g.icons.map((i) => i.width + 'x' + i.height) }))));

  const icons = Resource.IconEntry.fromEntries(res.entries);
  console.log('icon entries:', JSON.stringify(icons.map((i) => ({ id: i.id, lang: i.lang, bytes: i.bin.byteLength })).slice(0, 20)));

  const types = {};
  for (const e of res.entries) types[e.type] = (types[e.type] || 0) + 1;
  console.log('resource type histogram:', JSON.stringify(types));
})();
