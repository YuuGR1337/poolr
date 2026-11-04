import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const screenshotsDir = path.join(repoRoot, 'docs', 'screenshots');

async function main() {
  console.log('Launching browser for targeted screenshot refresh...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }
  });

  const page = await browser.newPage();
  const baseUrl = 'http://127.0.0.1:8089';

  const targets = [
    { page: 'dashboard', file: 'dashboard.png', wait: 2000 },
    { page: 'screening&tab=conflicts', file: 'screening-conflicts.png', wait: 2000 },
    { page: 'meta&fig=forest', file: 'meta-forest.png', wait: 2500 },
    { page: 'meta&fig=funnel_contour', file: 'meta-funnel.png', wait: 3000 },
    { page: 'meta&fig=galbraith', file: 'meta-diagnostics.png', wait: 3000 },
  ];

  for (const t of targets) {
    const url = `${baseUrl}/?page=${t.page}&demo=1&nosplash=1`;
    console.log(`Capturing ${t.file} from ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise(r => setTimeout(r, t.wait));
      const dest = path.join(screenshotsDir, t.file);
      await page.screenshot({ path: dest });
      console.log(`Saved ${dest}`);
    } catch (err) {
      console.error(`Failed capturing ${t.file}:`, err.message);
    }
  }

  await browser.close();
  console.log('Finished capturing all targeted screenshots.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
