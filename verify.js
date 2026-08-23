// 全バージョンをヘッドレスで検証（JSエラー・横スクロール・主要要素の描画）
const { chromium } = require('playwright');
const path = require('path');

const CHECKS = {
  v1: { lenses: 5, probe: () => ({
    heroDI: document.getElementById('heroDI').textContent,
    heat: document.querySelectorAll('#heatChart rect').length,
    ts: document.querySelectorAll('#tsChart path').length,
    score: document.querySelectorAll('#scoreChart rect').length,
    sim: document.getElementById('simTotal').textContent,
    srcs: document.getElementById('srcList').children.length }) },
  v2: { lenses: 5, probe: () => ({
    heroDI: document.getElementById('heroDI').textContent,
    urg: document.querySelectorAll('#urgChart rect').length,
    scatter: document.querySelectorAll('#scatterChart circle').length,
    routes: document.getElementById('routeList').children.length,
    srcs: document.getElementById('srcList').children.length }) },
  v4: { lenses: 9, probe: () => ({
    heroCorr: document.getElementById('heroCorr').textContent,
    flow: document.querySelectorAll('#flowMap .node').length,
    ladder: document.querySelectorAll('#ladderChart rect').length,
    mktRows: document.querySelectorAll('#marketTable tbody tr').length,
    tse: document.querySelectorAll('#tseMonthly circle').length,
    corr: document.querySelectorAll('#corrChart rect').length,
    lag: document.querySelectorAll('#lagChart rect').length,
    scatterRate: document.querySelectorAll('#scatterRate circle').length,
    curve: document.querySelectorAll('#curveChart circle').length,
    clim: document.querySelectorAll('#climate .ci').length,
    tosai: document.querySelectorAll('#tosaiChart rect').length,
    tosaiFx: document.querySelectorAll('#tosaiFx tbody tr').length,
    bondEnv: document.querySelectorAll('#bondEnv .metric').length,
    beSpread: document.getElementById('beSpread').textContent,
    policy: document.querySelectorAll('#policyList .p').length,
    gfci: document.querySelectorAll('#gfciBox .rk').length,
    equity: document.querySelectorAll('#equityGap .metric').length,
    growth: document.querySelectorAll('#growthChart rect').length,
    scan: document.querySelectorAll('#rateScanChart path').length,
    findLag: document.getElementById('findLag').textContent,
    ladderRate: document.querySelectorAll('#ladderRate rect').length,
    memo: document.getElementById('memoText').value.length,
    prep: document.getElementById('prepList').children.length,
    ineq: document.querySelectorAll('#ineqChart circle').length,
    ineqR: document.getElementById('ineqR').textContent,
    ineqAll: document.querySelectorAll('#ineqAllChart rect').length,
    ineqRatio: document.getElementById('ineqRatio').textContent,
    carryWin: document.querySelectorAll('#carryWin li').length,
    carryLose: document.querySelectorAll('#carryLose li').length,
    carryTable: document.querySelectorAll('#carryTable tbody tr').length,
    strip: document.querySelectorAll('#ineqStrip circle').length,
    stripM: document.querySelectorAll('#stripMetrics .metric').length,
    fxBars: document.querySelectorAll('#fxChart rect').length,
    fxR: document.getElementById('fxR').textContent,
    acts: document.querySelectorAll('#actList li').length,
    tkRows: document.querySelectorAll('#tkTable tbody tr').length,
    tkHero: document.getElementById('toolHero').textContent,
    tkPlace: document.querySelectorAll('#tkPlace .q').length,
    tkSim: document.querySelectorAll('#tkSim path').length,
    lnM: document.querySelectorAll('#lnMetrics .metric').length,
    ivRes: document.getElementById('ivResult').children.length,
    ratioBank: document.getElementById('ratioBank').textContent,
    opp: document.querySelectorAll('#oppTable tbody tr').length,
    rateGap: document.querySelectorAll('#rateGapChart rect').length,
    routes: document.getElementById('routeList').children.length,
    srcs: document.getElementById('srcList').children.length,
    findR: document.getElementById('findR').textContent }) },
  v3: { lenses: 6, probe: () => ({
    heroMarket: document.getElementById('heroMarket').textContent,
    ladder: document.querySelectorAll('#ladderChart rect').length,
    region: document.querySelectorAll('#regionChart rect').length,
    heroDI: document.getElementById('heroDI').textContent,
    scatter: document.querySelectorAll('#scatterChart circle').length,
    routes: document.getElementById('routeList').children.length,
    srcs: document.getElementById('srcList').children.length }) },
};

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  for (const v of Object.keys(CHECKS)) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({
        colorScheme: scheme, viewport: { width: 1280, height: 1000 }, locale: 'ja-JP',
      });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(`[${v}/${scheme}] pageerror: ${e.message}`));
      page.on('console', m => {
        const t = m.text();
        if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.googleapis/.test(t))
          errors.push(`[${v}/${scheme}] console: ${t}`);
      });
      await page.goto('file://' + path.resolve(`dist/${v}/index.html`));
      await page.waitForTimeout(1600);

      const of = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (of > 2) errors.push(`[${v}/${scheme}] horizontal overflow: ${of}px`);

      const probe = await page.evaluate(CHECKS[v].probe);
      for (const [k, val] of Object.entries(probe))
        if (val === 0 || val === '' || val == null) errors.push(`[${v}/${scheme}] empty: ${k}`);
      if (scheme === 'light') console.log(v, JSON.stringify(probe));

      for (let i = 0; i < CHECKS[v].lenses; i++) {
        await page.evaluate(n => document.querySelector(`.lens-btn[data-lens="${n}"]`).click(), i);
        await page.waitForTimeout(500);
        if (scheme === 'light') await page.screenshot({ path: `shots/${v}-${i}.png`, fullPage: true });
      }
      await ctx.close();
    }
  }

  // モバイル（最新版のみ）
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP' });
  const mp = await m.newPage();
  mp.on('pageerror', e => errors.push(`[mobile] ${e.message}`));
  await mp.goto('file://' + path.resolve('dist/index.html'));
  await mp.waitForTimeout(1500);
  const mo = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (mo > 2) errors.push(`[mobile] horizontal overflow: ${mo}px`);
  await mp.screenshot({ path: 'shots/mobile.png', fullPage: true });
  await m.close();

  // バージョン一覧ページ
  const vc = await browser.newContext({ viewport: { width: 900, height: 700 }, locale: 'ja-JP' });
  const vp = await vc.newPage();
  vp.on('pageerror', e => errors.push(`[versions] ${e.message}`));
  await vp.goto('file://' + path.resolve('dist/versions.html'));
  await vp.waitForTimeout(600);
  await vp.screenshot({ path: 'shots/versions.png', fullPage: true });
  await vc.close();

  await browser.close();
  console.log('\n=== ERRORS ===');
  console.log(errors.length ? errors.join('\n') : 'none');
  if (errors.length) process.exitCode = 1;
})();
