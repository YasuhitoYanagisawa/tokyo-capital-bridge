const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('deck/deck.html'), { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.pdf({ path: 'submission/TokyoCapitalBridge_presentation.pdf',
    width: '1280px', height: '720px', printBackground: true, pageRanges: '1-9' });
  // 目視用に各ページのPNGも出す
  const n = await p.evaluate(() => document.querySelectorAll('.s').length);
  for (let i = 0; i < n; i++) {
    const el = await p.$(`.s:nth-of-type(${i + 1})`);
    await el.screenshot({ path: `deck/slide-${i + 1}.png` });
  }
  console.log('slides', n, errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
