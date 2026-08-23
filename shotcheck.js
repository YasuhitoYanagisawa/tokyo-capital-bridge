// 修正箇所をPC幅とスマホ幅で撮る
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SHOTS = [
  { lens: '2', el: '#panel-2 .card:nth-of-type(2)', name: 'listed' },
  { lens: '3', el: '#panel-3', name: 'sme', full: true },
  { lens: '6', el: '#ineqChart', name: 'scatter', pad: true },
];

(async () => {
  fs.mkdirSync('shots', { recursive: true });
  const browser = await chromium.launch();
  for (const dev of [{ w: 1440, h: 1000, tag: 'pc' }, { w: 390, h: 844, tag: 'sp' }]) {
    const page = await browser.newPage({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: 2 });
    await page.goto('file://' + path.resolve('dist/index.html'));
    await page.waitForTimeout(700);
    for (const s of SHOTS) {
      await page.evaluate(l => document.querySelector('.lens-btn[data-lens="' + l + '"]').click(), s.lens);
      await page.waitForTimeout(350);
      const target = s.pad ? (await page.$(s.el)).evaluateHandle(e => e.closest('.card')) : null;
      const h = s.pad ? await target : await page.$(s.el);
      if (!h) { console.log('miss', s.name); continue; }
      const f = `shots/${s.name}-${dev.tag}.png`;
      await h.screenshot({ path: f });
      console.log(f);
    }
    await page.close();
  }
  await browser.close();
})();
