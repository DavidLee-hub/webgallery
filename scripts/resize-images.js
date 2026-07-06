// resize-images.js — img/ 폴더의 대용량 원본 사진을 웹에 적당한 크기(기본 2000px)로
// 리사이즈해 같은 경로에 덮어쓴다. 덮어쓰기 전 원본은 img-originals-backup/에 백업한다.
//
// 실행:
//   npm install
//   node scripts/resize-images.js --dry-run     # 대상 목록만 확인
//   node scripts/resize-images.js                # 실제 리사이즈 실행

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const REPO_ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(REPO_ROOT, 'img');
const BACKUP_DIR = path.join(REPO_ROOT, 'img-originals-backup');
const MAX_WIDTH = 2000;
const JPEG_QUALITY = 85;

const dryRun = process.argv.includes('--dry-run');

function formatSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + 'MB';
}

async function main() {
  const files = fs.readdirSync(IMG_DIR).filter(f => /\.(jpe?g)$/i.test(f));
  console.log(`img/ 안 JPEG 파일 ${files.length}개 발견 (png/gif 로고 파일은 제외)`);

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skipped = 0;
  const failed = [];

  for (const file of files) {
    const filePath = path.join(IMG_DIR, file);
    const before = fs.statSync(filePath).size;
    const metadata = await sharp(filePath).metadata();

    if (metadata.width <= MAX_WIDTH) {
      console.log(`${file} — 이미 ${metadata.width}px, 건너뜀`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`${file} — ${metadata.width}px, ${formatSize(before)} → 처리 예정 (dry-run)`);
      continue;
    }

    try {
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const backupPath = path.join(BACKUP_DIR, file);
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      const buffer = await sharp(filePath)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();

      // Windows에서 파일이 일시적으로 잠겨(백신/색인 등) 쓰기가 실패하는 경우를 대비해
      // 임시 파일에 먼저 쓰고 원본 자리로 교체(rename)한다. 실패 시 잠시 대기 후 재시도.
      const tmpPath = filePath + '.tmp';
      let lastErr;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          fs.writeFileSync(tmpPath, buffer);
          fs.renameSync(tmpPath, filePath);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          await new Promise(r => setTimeout(r, 800 * attempt));
        }
      }
      if (lastErr) throw lastErr;

      const after = buffer.length;
      totalBefore += before;
      totalAfter += after;
      processed++;

      console.log(`${file} — ${formatSize(before)} → ${formatSize(after)} (원본은 img-originals-backup/에 보관)`);
    } catch (err) {
      console.error(`${file} — 실패: ${err.message}`);
      failed.push(file);
    }
  }

  console.log('\n=== 요약 ===');
  console.log(`처리: ${processed}개, 건너뜀(이미 작음): ${skipped}개, 실패: ${failed.length}개`);
  if (failed.length) console.log('실패 목록:', failed);
  if (processed) {
    console.log(`용량: ${formatSize(totalBefore)} → ${formatSize(totalAfter)}`);
  }
}

main();
