// 不经 vite CLI（其需 spawn esbuild 服务），直接用 esbuild 的 Node API
// 验证「缺本地名册 / 缺立绘」时模块图能否解析。仅用于本机沙箱自检。
import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  write: false,
  format: 'esm',
  target: 'es2020',
  jsx: 'automatic',
  loader: { '.json': 'json', '.css': 'css', '.woff2': 'file', '.jpg': 'file', '.png': 'file', '.svg': 'file' },
  logLevel: 'info',
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('BUNDLE OK');
