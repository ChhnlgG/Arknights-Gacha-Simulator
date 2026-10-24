/**
 * 本地上传头像：读取 → 居中裁剪为 4:5 → 压缩为 JPEG DataURL。
 * 目标尺寸控制在 320×400，单张约 20~40KB，可直接写入 localStorage。
 */
export const AVATAR_W = 320;
export const AVATAR_H = 400;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解析失败'));
    img.src = src;
  });
}

/** 上传图片 → 压缩后的 DataURL（保留人物主体：优先取上部居中区域） */
export async function compressAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件');
  if (file.size > 12 * 1024 * 1024) throw new Error('图片过大，请选择 12MB 以内的图片');

  const raw = await fileToDataUrl(file);
  const img = await loadImage(raw);

  const targetRatio = AVATAR_W / AVATAR_H;
  const srcRatio = img.width / img.height;

  let sw = img.width;
  let sh = img.height;
  if (srcRatio > targetRatio) {
    sw = img.height * targetRatio;
  } else {
    sh = img.width / targetRatio;
  }
  const sx = (img.width - sw) / 2;
  // 人物多数位于画面上半部分，向上偏移 8%
  const sy = Math.max(0, (img.height - sh) / 2 - img.height * 0.04);

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_W;
  canvas.height = AVATAR_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器不支持画布压缩');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, AVATAR_W, AVATAR_H);

  return canvas.toDataURL('image/jpeg', 0.86);
}

/** 粗略估算 localStorage 占用（用于提示） */
export function estimateBytes(value: string): number {
  return Math.ceil((value.length * 3) / 4);
}
