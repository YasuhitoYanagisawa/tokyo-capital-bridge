// 各幅で横スクロールが出ないか、はみ出す要素がないかを実測する
const { chromium } = require('playwright');
const path = require('path');

const WIDTHS = [
  { w: 360, h: 800, name: '360 (小型スマホ)' },
  { w: 390, h: 844, name: '390 (iPhone)' },
  { w: 768, h: 1024, name: '768 (タブレット)' },
  { w: 1280, h: 900, name: '1280 (ノートPC)' },
  { w: 1680, h: 1050, name: '1680 (デスクトップ)' },
];

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  for (const v of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
    const msgs = [];
    page.on('pageerror', e => msgs.push('JS: ' + e.message));
    await page.goto('file://' + path.resolve('dist/index.html'));
    await page.waitForTimeout(700);

    const nTabs = await page.$$eval('.lens-btn', b => b.length);
    for (let i = 0; i < nTabs; i++) {
      await page.$$eval('.lens-btn', (b, i) => b[i].click(), i);
      await page.waitForTimeout(220);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const over = de.scrollWidth - de.clientWidth;
        // 画面右端をはみ出す要素（横スクロール用のラッパの中は除外）
        const bad = [];
        const lim = de.clientWidth + 1;
        document.querySelectorAll('.panel.on *').forEach(el => {
          if (el.closest('.scroller, .tblwrap, .chart')) return;
          const b = el.getBoundingClientRect();
          if (b.width === 0) return;
          if (b.right > lim || b.left < -1) {
            bad.push(el.tagName + '.' + (el.className || '').toString().slice(0, 30)
              + ' [' + Math.round(b.left) + '→' + Math.round(b.right) + ']');
          }
        });
        const panel = document.querySelector('.panel.on');
        return { over, bad: bad.slice(0, 6), lens: panel && panel.id };
      });
      if (r.over > 1) errs.push(`${v.name} / ${r.lens}: ページが ${r.over}px 横にはみ出し`);
      if (r.bad.length) errs.push(`${v.name} / ${r.lens}: ${r.bad.join(' | ')}`);
    }
    if (msgs.length) errs.push(`${v.name}: ${msgs.join(' / ')}`);
    await page.close();
    console.log(v.name, '検査完了');
  }
  await browser.close();
  console.log('\n=== はみ出し ===');
  console.log(errs.length ? errs.join('\n') : 'なし');
})();
