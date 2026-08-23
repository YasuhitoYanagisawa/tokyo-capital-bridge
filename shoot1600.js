// 提出フォーム 5-2 用：1600×900（16:9）の画面キャプチャを生成する（v4）
const { chromium } = require('playwright');
const path = require('path');

const SHOTS = [
  { lens: 0, y: 0,   file: 'capture-1-map.png' },
  { lens: 0, card: '同じ都民でも', file: 'capture-1b-gap.png' },        // 四層の資金地図＋r=-0.03
  { lens: 4, y: 130, file: 'capture-2-climate.png' },    // 今月のファイナンス環境
  { lens: 4, card: '層と層は、どれだけ連関しているか', file: 'capture-3-corr.png' },
  { lens: 1, y: 130, file: 'capture-4-foreign.png' },    // 海外からの資金
  { lens: 5, y: 130, file: 'capture-5-diagnosis.png' },  // 資金タイプ判定
  { lens: 6, card: '起点としての「個人向け都債」', file: 'capture-6-tosai.png' },
  { lens: 6, card: '「円安傾向だから基本は儲かる」', file: 'capture-7-carry.png' },
  { lens: 7, y: 0, file: 'capture-8-tool.png' },
  { lens: 7, card: '借入金利の立ち位置チェック', file: 'capture-8b-loan.png' },
  { lens: 6, card: '都民の資金が届く経路', file: 'capture-9-routes.png' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1, colorScheme: 'light', locale: 'ja-JP',
  });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve('dist/index.html'));
  await page.waitForTimeout(1800);

  for (const s of SHOTS) {
    await page.evaluate(n => document.querySelector(`.lens-btn[data-lens="${n}"]`).click(), s.lens);
    await page.waitForTimeout(700);
    if (s.card) {
      const ok = await page.evaluate(({ lens, card }) => {
        const c = [...document.querySelectorAll(`#panel-${lens} .card`)]
          .find(x => x.textContent.includes(card));
        if (!c) return false;
        window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 66);
        return true;
      }, { lens: s.lens, card: s.card });
      if (!ok) throw new Error('card not found: ' + s.card);
    } else {
      await page.evaluate(y => window.scrollTo(0, y), s.y);
    }
    await page.waitForTimeout(450);
    await page.screenshot({ path: 'submission/' + s.file });
    console.log('shot', s.file);
  }
  await browser.close();
})();
