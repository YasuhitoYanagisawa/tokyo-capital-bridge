/* ============================================================
   v4 追加：資金地図・上場市場・連関・投資機会
   ============================================================ */

function renderMapHero(){
  var C=D.corr, k=D.finance.kakei, last=k.years.length-1;
  var surplus=k.kashobun[last]-k.shohishishutsu[last];
  var i=C.labels.indexOf("国債10年"), j=C.labels.indexOf("業況DI");
  var r=C.matrix[i][j];
  var best=C.rateScan?C.rateScan.reduce(function(a,b){return Math.abs(b.best.r)>Math.abs(a.best.r)?b:a}):null;
  document.getElementById("heroCorr").textContent=best?("r = "+best.best.r.toFixed(2)):("r = "+r.toFixed(2));
  var hn=document.getElementById("heroCorrNote");
  if(hn&&best) hn.textContent="同じ月で並べると r = "+r.toFixed(2)+"。"+best.best.lag+"か月ずらすと関係が現れます";
  var el2=document.getElementById("surplus2"); if(el2) el2.textContent=fmt(surplus);
  var f=D.finance, F=D.foreign, M=D.market;
  document.getElementById("mapTiles").innerHTML=
    '<div class="tile"><span class="k">海外投資家シェア（プライム）</span><span class="v">'+F.share.prime[3].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">委託売買代金ベース・2025年</span></div>'+
    '<div class="tile"><span class="k">上場会社数 / 景況調査対象</span><span class="v">'+fmt(M.listedTotal)+'<span style="font-size:14px"> / '+fmt(D.meta.sampleSize)+'</span></span><span class="d">ほぼ同数の企業が別の市場に生きています</span></div>'+
    '<div class="tile"><span class="k">業況DIが0を下回った月</span><span class="v" style="color:var(--st-crit)">'+D.meta.n+'<span style="font-size:14px"> / '+D.meta.n+'</span></span><span class="d">2005年5月以降、一度も0を超えていません</span></div>'+
    '<div class="tile"><span class="k">都内勤労者世帯の月次残額</span><span class="v" style="color:var(--accent)">'+fmt(surplus)+'</span><span class="d">円（可処分所得−消費支出・2023年）</span></div>';
}

function drawFlowMap(){
  var F=D.foreign, M=D.market, k=D.finance.kakei, last=k.years.length-1;
  var surplus=k.kashobun[last]-k.shohishishutsu[last];
  var jgb=D.jgb.curve[9];
  var nodes=[
    {lv:"Layer 1 — Global", nm:"海外投資家", big:F.share.prime[3].toFixed(1)+"%",
     dt:"東証プライムの委託売買代金に占めるシェア。75.3%が欧州経由。"},
    {lv:"Layer 2 — Listed", nm:"上場企業", big:fmt(M.listedTotal)+"社",
     dt:"プライム1,656／スタンダード1,619／グロース562。時価総額の96.1%がプライムに集中。"},
    {lv:"Layer 3 — SME", nm:"非上場の中小企業", big:fmt(D.meta.sampleSize)+"社",
     dt:"景況調査の対象。業況DIは255か月連続でマイナス。海外投資家が売買できる市場はありません。", cut:true},
    {lv:"Layer 4 — Households", nm:"都民の家計", big:fmt(surplus)+"円",
     dt:"勤労者世帯の月次残額。NISAで買えるのは上場3,837社まで。国債10年は"+jgb.toFixed(3)+"%。"}
  ];
  document.getElementById("flowMap").innerHTML=nodes.map(function(n){
    return '<div class="node'+(n.cut?' cut':'')+'"><span class="lv">'+n.lv+'</span>'+
      '<span class="nm">'+n.nm+'</span><span class="big">'+n.big+'</span><span class="dt">'+n.dt+'</span></div>';
  }).join("");
}

function renderForeign(){
  var F=D.foreign;
  document.getElementById("foreignTiles").innerHTML=
    '<div class="tile"><span class="k">プライム</span><span class="v">'+F.share.prime[3].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">2022年 '+F.share.prime[0].toFixed(1)+'% から低下</span></div>'+
    '<div class="tile"><span class="k">スタンダード</span><span class="v">'+F.share.standard[3].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">2022年 '+F.share.standard[0].toFixed(1)+'% から上昇</span></div>'+
    '<div class="tile"><span class="k">グロース</span><span class="v">'+F.share.growth[3].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">新興市場ほど海外マネーは薄い</span></div>'+
    '<div class="tile"><span class="k">プライム 買越額（2025年）</span><span class="v" style="color:var(--st-good)">+'+(F.net2025Prime/1e9).toFixed(1)+'<span style="font-size:14px">兆円</span></span><span class="d">売り'+(F.value2025.prime/2/1e9).toFixed(0)+'兆円規模の売買のなかでの差引き</span></div>';
  document.getElementById("foreignMetrics").innerHTML=
    '<div class="metric"><div class="mk">欧州経由</div><div class="mv">'+F.regionShare[0].toFixed(1)+'<span style="font-size:13px">%</span></div><div class="md">買越 +'+(F.regionNet[0]/1e9).toFixed(2)+'兆円</div></div>'+
    '<div class="metric"><div class="mk">アジア経由</div><div class="mv">'+F.regionShare[1].toFixed(1)+'<span style="font-size:13px">%</span></div><div class="md">買越 +'+(F.regionNet[1]/1e9).toFixed(2)+'兆円</div></div>'+
    '<div class="metric"><div class="mk">北米経由</div><div class="mv">'+F.regionShare[2].toFixed(1)+'<span style="font-size:13px">%</span></div><div class="md">買越 +'+(F.regionNet[2]/1e9).toFixed(2)+'兆円</div></div>';
}

function drawMarketTable(){
  var M=D.market, F=D.foreign;
  var h='<table><thead><tr><th class="l">市場区分</th><th>上場会社数</th><th>会社数シェア</th><th>時価総額シェア</th><th>売買回転率</th><th>配当利回り</th><th>海外投資家シェア</th></tr></thead><tbody>';
  M.segments.forEach(function(m){
    h+='<tr><td style="font-weight:700">'+m.name+'</td><td>'+fmt(m.listed[1])+'</td><td>'+m.listedShare.toFixed(1)+'%</td><td>'+m.capShare.toFixed(1)+'%</td><td>'+m.turnover[1].toFixed(1)+'%</td><td>'+m.yield.toFixed(2)+'%</td><td>'+F.share[m.key][3].toFixed(1)+'%</td></tr>';
  });
  h+='<tr><td style="font-weight:700">非上場の都内中小企業</td><td>'+fmt(D.meta.sampleSize)+'</td><td>—</td><td>—</td><td>—</td><td>—</td><td style="color:var(--st-crit);font-weight:600">0.0%</td></tr>';
  document.getElementById("marketTable").innerHTML=h+'</tbody></table>';
}

function drawTurnYield(){
  var M=D.market, host=document.getElementById("turnYield"); host.innerHTML="";
  var LW=92,W=520,RH=46,PT=8,RIGHT=58,H=PT+M.segments.length*RH+6;
  var maxT=450, maxY=2.5;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"市場区分別の売買回転率と配当利回り"});
  M.segments.forEach(function(m,i){
    var yy=PT+i*RH;
    svg.appendChild(el("text",{x:0,y:yy+24,fill:css("--ink-2"),"font-size":12,"font-family":'"Zen Kaku Gothic New",sans-serif'},m.name));
    [[m.turnover[1]/maxT,"--s2","売買回転率",m.turnover[1].toFixed(1)+"%"],
     [m.yield/maxY,"--s1","配当利回り",m.yield.toFixed(2)+"%"]].forEach(function(p,j){
      var w=(W-LW-RIGHT)*Math.min(p[0],1), yb=yy+6+j*16;
      var rr=el("rect",{x:LW,y:yb,width:Math.max(w,2),height:12,fill:css(p[1]),opacity:.88,rx:2});
      rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
        '<div class="th">'+m.name+'</div><div class="tr"><span>売買回転率</span><b>'+m.turnover[1].toFixed(1)+'%</b></div><div class="tr"><span>配当利回り</span><b>'+m.yield.toFixed(2)+'%</b></div>'); });
      rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
      svg.appendChild(el("text",{x:LW+Math.max(w,2)+6,y:yb+10,fill:css("--ink-2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},p[3]));
    });
  });
  host.appendChild(svg);
  legend("turnYieldLegend",[["--s2","売買回転率（右端の目盛 450%）","box"],["--s1","配当利回り（右端の目盛 2.5%）","box"]]);
}

var TSE_M={202301:[704862290,990.99],202302:[709953448,1021.69],202303:[713395363,1023.64],
  202304:[730509365,1037.58],202305:[754195866,1093.84],202306:[810720413,1160.91],
  202307:[823128416,1169.75],202308:[826779912,1175.48],202310:[796750455,1168.64],
  202311:[840545330,1212.69],202312:[833007509,1208.20]};
function drawTseMonthly(){
  var host=document.getElementById("tseMonthly"); host.innerHTML="";
  var ks=Object.keys(TSE_M).map(Number).sort();
  var W=760,H=220,PL=52,PR=108,PT=16,PB=30;
  var idx=ks.map(function(k){return TSE_M[k][1]});
  var lo=950, hi=1250;
  var x=function(i){return PL+(W-PL-PR)*i/(ks.length-1)}, y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"東証プライム株価指数の月次推移（2023年）"});
  for(var t=lo;t<=hi;t+=50){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t));
  }
  var d="";
  idx.forEach(function(v,i){ d+=(d?" L":"M")+x(i)+","+y(v); });
  svg.appendChild(el("path",{d:d,fill:"none",stroke:css("--s1"),"stroke-width":2}));
  idx.forEach(function(v,i){
    var c=el("circle",{cx:x(i),cy:y(v),r:4,fill:css("--s1"),stroke:css("--surface"),"stroke-width":2});
    c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+ymJa(ks[i])+'</div><div class="tr"><span>株価指数</span><b>'+v.toFixed(2)+'</b></div><div class="tr"><span>時価総額</span><b>'+fmt(TSE_M[ks[i]][0])+'</b></div>'); });
    c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
  });
  var lv=idx[idx.length-1];
  svg.appendChild(el("line",{x1:W-PR+6,x2:W-PR+16,y1:y(lv),y2:y(lv),stroke:css("--s1"),"stroke-width":3,"stroke-linecap":"round"}));
  svg.appendChild(el("text",{x:W-PR+21,y:y(lv)+4,fill:css("--ink-2"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},"プライム指数 "+lv.toFixed(0)));
  ks.forEach(function(k,i){ if(i%2) return;
    svg.appendChild(el("text",{x:x(i),y:H-9,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},String(k).slice(4)+"月")); });
  host.appendChild(svg);
  legend("tseMonthlyLegend",[["--s1","東証プライム市場株価指数（月中平均）"]]);
}

/* ---------------- 連関 ---------------- */
function corrColor(v){
  if(v==null) return css("--surface-2");
  var R=RAMP[isDark()?"dark":"light"];
  return v<0 ? rampColor(R.neg, -v*0.9) : rampColor(R.pos, v*0.85);
}
function drawCorr(){
  var C=D.corr, L=C.labels, host=document.getElementById("corrChart"); host.innerHTML="";
  document.getElementById("corrNote").textContent=C.note+"（n="+C.n+"）";
  var LW=124, CW=52, CH=30, PT=112, PB=6;
  var W=LW+L.length*CW+8, H=PT+L.length*CH+PB;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,width:W,role:"img","aria-label":"月次系列どうしの相関マトリクス"});
  svg.setAttribute("style","min-width:"+W+"px;max-width:100%");
  L.forEach(function(l,j){
    var cx=LW+j*CW+CW/2;
    svg.appendChild(el("text",{x:cx,y:PT-10,fill:css("--ink-2"),"font-size":10.5,
      "font-family":'"Zen Kaku Gothic New",sans-serif',transform:"rotate(-52 "+cx+" "+(PT-10)+")"},l));
  });
  L.forEach(function(rl,i){
    var y0=PT+i*CH;
    svg.appendChild(el("text",{x:0,y:y0+CH/2+4,fill:css("--ink-2"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},rl));
    L.forEach(function(cl,j){
      var v=C.matrix[i][j];
      var c=el("rect",{x:LW+j*CW,y:y0,width:CW-2,height:CH-2,fill:corrColor(v),rx:2,stroke:css("--surface"),"stroke-width":1});
      c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
        '<div class="th">'+rl+' × '+cl+'</div><div class="tr"><span>相関係数 r</span><b>'+(v==null?"—":v.toFixed(3))+'</b></div><div class="tr"><span>サンプル</span><b>'+C.n+'か月</b></div>'); });
      c.addEventListener("mouseleave",hideTip);
      svg.appendChild(c);
      if(v!=null){
        var strong=Math.abs(v)>0.55;
        svg.appendChild(el("text",{x:LW+j*CW+(CW-2)/2,y:y0+CH/2+4,"text-anchor":"middle",
          fill:strong?"#fff":css("--ink"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace",
          "font-weight":Math.abs(v)>0.5?600:400},v.toFixed(2)));
      }
    });
  });
  host.appendChild(svg);
  var lg=document.getElementById("corrLegend"); lg.innerHTML="";
  var s=document.createElement("span"); s.className="it";
  s.innerHTML='<span style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--ink-3)">-1.0</span>';
  var bar=document.createElement("span");
  bar.style.cssText="display:inline-block;height:12px;width:150px;border:1px solid var(--line-2);background:linear-gradient(90deg,"+[-1,-0.6,-0.3,0,0.3,0.6,1].map(corrColor).join(",")+")";
  s.appendChild(bar);
  var e2=document.createElement("span"); e2.style.cssText="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--ink-3)"; e2.textContent="+1.0";
  s.appendChild(e2);
  var lab=document.createElement("span"); lab.style.cssText="font-size:12px;color:var(--ink-2)"; lab.textContent="ピアソンの積率相関係数 r";
  lg.appendChild(s); lg.appendChild(lab);
}

function renderFindings(){
  var C=D.corr;
  var i=C.labels.indexOf("国債10年"), j=C.labels.indexOf("業況DI");
  document.getElementById("findR").textContent="r = "+C.matrix[i][j].toFixed(2);
  document.getElementById("findR2").textContent="r = "+(C.tseVsSme.r==null?"—":C.tseVsSme.r.toFixed(2));
}

function drawLag(){
  var C=D.corr, host=document.getElementById("lagChart"); host.innerHTML="";
  var d=C.lagForecast, W=520,H=220,PL=44,PR=16,PT=18,PB=34;
  var lo=0.6,hi=0.9;
  var bw=(W-PL-PR)/d.length, y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"見通しDIと業況DIのラグ相関"});
  for(var t=lo;t<=hi+0.001;t+=0.05){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t.toFixed(2)));
  }
  var best=d.reduce(function(a,b){return b.r>a.r?b:a});
  d.forEach(function(p,i){
    var x0=PL+bw*i+8, w=bw-16, h=(H-PT-PB)*(p.r-lo)/(hi-lo);
    var isBest=(p.lag===best.lag);
    var rr=el("rect",{x:x0,y:y(p.r),width:w,height:Math.max(h,1),fill:css(isBest?"--s1":"--rule"),opacity:isBest?1:.45,rx:3});
    rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+p.lag+'か月後</div><div class="tr"><span>相関係数 r</span><b>'+p.r.toFixed(3)+'</b></div><div class="tr"><span>n</span><b>'+p.n+'</b></div>'); });
    rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
    svg.appendChild(el("text",{x:x0+w/2,y:y(p.r)-6,"text-anchor":"middle",fill:css(isBest?"--ink":"--ink-3"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":isBest?600:400},p.r.toFixed(3)));
    svg.appendChild(el("text",{x:x0+w/2,y:H-16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace"},"+"+p.lag));
  });
  svg.appendChild(el("text",{x:(PL+W-PR)/2,y:H-3,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"見通しDI から k か月後の業況DI へ"));
  host.appendChild(svg);
  legend("lagLegend",[["--s1","相関が最大の遅れ（+"+best.lag+"か月, r="+best.r.toFixed(3)+"）","box"],["--rule","その他の遅れ","box"]]);
}

function drawScatterRate(){
  var host=document.getElementById("scatterRate"); host.innerHTML="";
  var g=byFull["全体"], jg=D.jgb.monthly.y10;
  var pts=[];
  for(var i=0;i<N;i++){
    var hb=g.hanbai[i], sh=g.shiire[i];
    if(hb==null||sh==null||jg[i]==null) continue;
    pts.push({x:jg[i], y:hb-sh, m:MONTHS[i]});
  }
  var W=520,H=260,PL=48,PR=16,PT=16,PB=38;
  var xlo=-0.4,xhi=3.0, ylo=-70,yhi=30;
  var X=function(v){return PL+(W-PL-PR)*(v-xlo)/(xhi-xlo)}, Y=function(v){return PT+(H-PT-PB)*(yhi-v)/(yhi-ylo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"国債10年利回りと価格転嫁ギャップの散布図"});
  for(var t=ylo;t<=yhi;t+=20){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:Y(t),y2:Y(t),stroke:css(t===0?"--axis":"--grid"),"stroke-width":t===0?1.5:1}));
    svg.appendChild(el("text",{x:PL-8,y:Y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t));
  }
  for(var v=0;v<=3;v+=0.5){
    svg.appendChild(el("line",{x1:X(v),x2:X(v),y1:PT,y2:H-PB,stroke:css("--grid")}));
    svg.appendChild(el("text",{x:X(v),y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},v.toFixed(1)));
  }
  pts.forEach(function(p){
    var c=el("circle",{cx:X(p.x),cy:Y(p.y),r:3,fill:css("--s2"),opacity:.5});
    c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+ymJa(p.m)+'</div><div class="tr"><span>国債10年</span><b>'+p.x.toFixed(3)+'%</b></div><div class="tr"><span>価格転嫁ギャップ</span><b>'+p.y+'</b></div>'); });
    c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
  });
  svg.appendChild(el("text",{x:(PL+W-PR)/2,y:H-4,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"国債10年利回り（%）"));
  host.appendChild(svg);
}

/* ---------------- 投資機会 ---------------- */
function drawCurve(){
  var J=D.jgb, host=document.getElementById("curveChart"); host.innerHTML="";
  document.getElementById("jgbNote").textContent=
    J.label+"（"+J.asOf+"時点）。10年は "+J.curve[9].toFixed(3)+"%。東証プライムの配当利回り2.21%を上回っており、"+
    "「株より国債」が成り立つ水準に戻っています。";
  var W=760,H=250,PL=48,PR=90,PT=16,PB=34;
  var T=J.tenors, C=J.curve;
  var lo=1.0,hi=4.5;
  var x=function(i){return PL+(W-PL-PR)*i/(T.length-1)}, y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"国債イールドカーブ"});
  for(var t=1;t<=4.5;t+=0.5){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t.toFixed(1)+"%"));
  }
  /* 東証プライム配当利回りの基準線 */
  var pd=D.market.segments[0].yield;
  svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(pd),y2:y(pd),stroke:css("--s2"),"stroke-width":1.5,"stroke-dasharray":"5 4"}));
  svg.appendChild(el("text",{x:W-PR+6,y:y(pd)+4,fill:css("--s2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace"},"株式配当 "+pd.toFixed(2)+"%"));
  var d="", dA="M"+PL+","+(H-PB);
  C.forEach(function(v,i){ d+=(d?" L":"M")+x(i)+","+y(v); dA+=" L"+x(i)+","+y(v); });
  dA+=" L"+x(T.length-1)+","+(H-PB)+" Z";
  svg.appendChild(el("path",{d:dA,fill:css("--s1"),opacity:.12}));
  svg.appendChild(el("path",{d:d,fill:"none",stroke:css("--s1"),"stroke-width":2.5}));
  C.forEach(function(v,i){
    var c=el("circle",{cx:x(i),cy:y(v),r:4,fill:css("--s1"),stroke:css("--surface"),"stroke-width":2});
    c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+T[i]+'年債</div><div class="tr"><span>利回り</span><b>'+v.toFixed(3)+'%</b></div>'); });
    c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
    if([0,4,9,11,14].indexOf(i)>=0){
      svg.appendChild(el("text",{x:x(i),y:y(v)-10,"text-anchor":"middle",fill:css("--ink"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},v.toFixed(2)));
      svg.appendChild(el("text",{x:x(i),y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},T[i]+"年"));
    }
  });
  host.appendChild(svg);
  legend("curveLegend",[["--s1","国債利回り（"+J.asOf+"）"],["--s2","東証プライム 配当利回り（2023年）"]]);
}

var ACC={ok:"個人でも可",capped:"上限あり",blocked:"経路なし"};
function drawOpp(){
  var O=D.opportunities;
  var h='<thead><tr><th>手段</th><th>利回り</th><th>種類</th><th>リスク</th><th>個人のアクセス</th><th class="note">補足</th></tr></thead><tbody>';
  O.forEach(function(o){
    h+='<tr class="'+(o.access==="blocked"?"blocked":"")+'"><td>'+o.name+'</td>'+
      '<td style="font-weight:600">'+(o.ret==null?"—":o.ret.toFixed(2)+"%")+'</td>'+
      '<td>'+o.kind+'</td><td>'+o.risk+'</td>'+
      '<td><span class="acc '+o.access+'">'+ACC[o.access]+'</span></td>'+
      '<td class="note">'+o.note+'<br><span style="font-family:IBM Plex Mono,monospace;font-size:10.5px">出典：'+o.src+'</span></td></tr>';
  });
  document.getElementById("oppTable").innerHTML=h+'</tbody>';
}

function drawRateGap(){
  var G=D.rateGap, host=document.getElementById("rateGapChart"); host.innerHTML="";
  document.getElementById("rateGapNote").textContent=G.note;
  var W=520,H=180,PL=64,PR=54,PT=14,PB=30;
  var maxV=45, LW=PL;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"中小企業の借入金利水準の分布と国債利回り"});
  var RH=34;
  G.smeRateLabels.forEach(function(l,i){
    var yy=PT+i*RH;
    svg.appendChild(el("text",{x:0,y:yy+18,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},l));
    [[G.smeRatePrev[i],"--rule",.45],[G.smeRate[i],"--s1",.9]].forEach(function(p,j){
      var w=(W-LW-PR)*p[0]/maxV, yb=yy+4+j*13;
      var rr=el("rect",{x:LW,y:yb,width:Math.max(w,2),height:11,fill:css(p[1]),opacity:p[2],rx:2});
      rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
        '<div class="th">'+l+'</div><div class="tr"><span>今回</span><b>'+G.smeRate[i].toFixed(1)+'%</b></div><div class="tr"><span>前回</span><b>'+G.smeRatePrev[i].toFixed(1)+'%</b></div>'); });
      rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
    });
    svg.appendChild(el("text",{x:LW+(W-LW-PR)*G.smeRate[i]/maxV+6,y:yy+18,fill:css("--ink-2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},G.smeRate[i].toFixed(1)+"%"));
  });
  host.appendChild(svg);
  legend("rateGapLegend",[["--s1","今回調査（令和8年5月）","box"],["--rule","前回調査","box"]]);
  document.getElementById("rateGapMetrics").innerHTML=
    '<div class="metric"><div class="mk">国債 2年</div><div class="mv">'+G.jgb2.toFixed(3)+'<span style="font-size:13px">%</span></div><div class="md">財務省 2026/8/20</div></div>'+
    '<div class="metric"><div class="mk">国債 10年</div><div class="mv" style="color:var(--st-crit)">'+G.jgb10.toFixed(3)+'<span style="font-size:13px">%</span></div><div class="md">同上</div></div>'+
    '<div class="metric"><div class="mk">借入金利「上昇」</div><div class="mv">'+G.trendUp.toFixed(1)+'<span style="font-size:13px">%</span></div><div class="md">回答企業の割合</div></div>';
}

function renderSmeHero(){
  var g=byFull["全体"].gyokyo, last=g[N-1], prev=g[N-13];
  document.getElementById("heroDI").textContent=last;
  document.getElementById("heroDINote").textContent=D.meta.latestLabel+"　前年同月 "+prev+" → "+sgn(last-prev,0)+"pt";
  var f=D.finance, S=D.shikin, T=SKby["全体"];
  document.getElementById("smeTiles").innerHTML=
    '<div class="tile"><span class="k">資金需要DI（今後3か月）</span><span class="v" style="color:var(--accent)">'+S.demandDI.toFixed(1)+'</span><span class="d">前回 '+S.demandDIPrev.toFixed(1)+'。資金需要は強まっています</span></div>'+
    '<div class="tile"><span class="k">代位弁済 件数</span><span class="v" style="color:var(--st-crit)">'+fmt(f.hosho.subroCases[4])+'</span><span class="d">2021年度 '+fmt(f.hosho.subroCases[2])+'件の '+(f.hosho.subroCases[4]/f.hosho.subroCases[2]).toFixed(1)+'倍</span></div>'+
    '<div class="tile"><span class="k">主な取引先が信用金庫</span><span class="v">'+S.bank[1].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">都市銀行 '+S.bank[0].toFixed(1)+'%</span></div>'+
    '<div class="tile"><span class="k">経営者が70歳以上</span><span class="v">'+T.old70.toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">創業1980年以前が '+T.pre1980.toFixed(1)+'%</span></div>';
}

function renderStampV4(){
  document.getElementById("stamp").innerHTML=
    "景況　<b>"+D.meta.latestLabel+"</b> / <b>"+D.meta.n+"</b> か月<br>"+
    "国債　<b>"+D.jgb.asOf+"</b> 10年 <b>"+D.jgb.curve[9].toFixed(3)+"%</b><br>"+
    "海外　<b>2025年</b> プライム <b>"+D.foreign.share.prime[3].toFixed(1)+"%</b>";
}

/* ---------------- ④ 今月のファイナンス環境 ---------------- */
var VKEY_COL={loose:"--st-good",tight:"--st-crit",neutral:"--ink"};
function drawClimate(){
  var C=D.climate, host=document.getElementById("climate"); if(!host) return;
  var col=css(VKEY_COL[C.vkey]||"--ink");
  var h='<div class="clim-top"><span class="vd" style="color:'+col+'">'+C.verdict+'</span>'+
    '<span class="sc">スコア '+(C.score>0?"+":"")+C.score.toFixed(1)+'</span>'+
    '<span class="as">'+C.label+'</span></div>'+
    '<p style="margin:0;font-size:13px;color:var(--ink-2);line-height:1.8">'+
    '海外・上場・中小・調達コストの四つを同じ月でそろえた結果です。数値はすべて前月比で、判定式は下に全文を置いています。</p>'+
    '<div class="clim-grid">';
  C.items.forEach(function(it){
    var dtxt="—", dcol=css("--ink-3");
    if(it.d!=null){
      var better=(it.good==="up")?(it.d>0):(it.d<0);
      dcol=css(it.d===0?"--ink-3":(better?"--st-good":"--st-crit"));
      dtxt=(it.d>0?"▲ +":(it.d<0?"▼ ":"– "))+it.d;
    }
    h+='<div class="ci"><span class="k">'+it.k+'</span>'+
       '<span class="v">'+it.v+(it.unit?'<span style="font-size:12px">'+it.unit+'</span>':'')+'</span>'+
       '<span class="dd" style="color:'+dcol+'">'+(it.d==null?'前月差 —':'前月差 '+dtxt)+'</span>'+
       '<span class="sr">'+it.src+'</span></div>';
  });
  host.innerHTML=h+'</div>';
  document.getElementById("climFormula").textContent=C.formula+" 判定は毎月の更新データでそのまま再計算されます。";
}

/* ---------------- ⑥ 個人向け都債 ---------------- */
function drawTosai(){
  var T=D.tosai; if(!T) return;
  var host=document.getElementById("tosaiChart"); if(!host) return;
  var gap=T.gapYears||12;
  document.getElementById("tosaiLede").innerHTML=
    '都民が「東京そのもの」に投資できる唯一の公式な入口が個人向け都債です。'+
    '円建ては<strong>'+T.jpy.since+'から'+T.jpy.count+'回</strong>発行され、'+T.jpy.lastDate+'の'+T.jpy.lastNo+
    '（'+T.jpy.term+'年・表面利率'+T.jpy.lastRate.toFixed(2)+'％・'+T.jpy.amountOku+'億円）を最後に止まっています。'+
    '出典：<a href="'+T.url+'" target="_blank" rel="noopener">'+T.label+'</a>。';

  var rows=T.jpy.rows.slice().reverse();   /* 第1回 → 第18回 */
  var W=520,H=230,PL=42,PR=94,PT=16,PB=42;
  var hi=1.2, bw=(W-PL-PR)/rows.length;
  var y=function(v){return PT+(H-PT-PB)*(hi-v)/hi};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"円建て個人向け都債の表面利率の推移"});
  for(var t=0;t<=hi+0.001;t+=0.2){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css(t===0?"--axis":"--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t.toFixed(1)+"%"));
  }
  rows.forEach(function(r,i){
    var x0=PL+bw*i+2, w=Math.max(bw-4,2);
    var rr=el("rect",{x:x0,y:y(r.rate),width:w,height:Math.max((H-PT-PB)*r.rate/hi,1),fill:css("--s1"),opacity:.85,rx:2});
    rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+r.no+'（'+r.yr+'）</div><div class="tr"><span>表面利率</span><b>'+r.rate.toFixed(2)+'%</b></div>'); });
    rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
    if(i===0||i===rows.length-1)
      svg.appendChild(el("text",{x:x0+w/2,y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},r.yr));
  });
  /* 発行停止の帯 */
  var gx=PL+bw*rows.length;
  svg.appendChild(el("rect",{x:gx,y:PT,width:(W-PR)-gx,height:H-PT-PB,fill:css("--st-crit"),opacity:.07}));
  svg.appendChild(el("line",{x1:gx,x2:gx,y1:PT,y2:H-PB,stroke:css("--st-crit"),"stroke-width":1.5,"stroke-dasharray":"4 3"}));
  svg.appendChild(el("text",{x:W-PR+6,y:PT+38,fill:css("--st-crit"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif',"font-weight":700},"発行なし"));
  svg.appendChild(el("text",{x:W-PR+6,y:PT+54,fill:css("--ink-3"),"font-size":11,"font-family":"IBM Plex Mono, monospace"},gap+"年以上"));
  svg.appendChild(el("text",{x:(PL+W-PR)/2,y:H-6,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"第1回（"+rows[0].yr+"）→ 第18回（"+rows[rows.length-1].yr+"）"));
  host.innerHTML=""; host.appendChild(svg);
  legend("tosaiLegend",[["--s1","円建て個人向け都債 表面利率","box"],["--st-crit","第18回以降 発行なし","box"]]);
  document.getElementById("tosaiNote").textContent=
    "同じ期間に国債10年は "+D.jgb.curve[9].toFixed(3)+"％（"+D.jgb.asOf+"）まで上昇しました。金利が戻ったいま、円建ての窓口は閉じたままです。";

  var f=T.fx, hh='<thead><tr><th>回号</th><th>発行</th><th>年限</th><th>表面利率</th><th>通貨</th><th>発行額</th></tr></thead><tbody>';
  f.rows.forEach(function(r,i){
    hh+='<tr'+(i===0?' style="font-weight:700"':'')+'><td>'+r.no+'</td><td>'+r.yr+'</td><td>'+r.term+'年</td><td>'+r.rate.toFixed(2)+'%</td><td>'+r.ccy+'</td><td>'+r.amt+'</td></tr>';
  });
  document.getElementById("tosaiFx").innerHTML=hh+'</tbody>';
  document.getElementById("tosaiFinding").innerHTML='<strong>読み取れること。</strong>'+T.finding;

  var e1=document.getElementById("ineqSme"); if(e1) e1.textContent=fmt(D.meta.sampleSize);
  var e2=document.getElementById("ineqYears"); if(e2) e2.textContent=gap;
}

/* ---------------- ② 債券市場・投資環境の概要 ---------------- */
function drawBondEnv(){
  var host=document.getElementById("bondEnv"); if(!host) return;
  var G=D.rateGap, pd=D.market.segments[0].yield, sp=G.jgb10-G.jgb2;
  host.innerHTML=
    '<div class="metric"><div class="mk">国債10年（調達コストの土台）</div><div class="mv">'+G.jgb10.toFixed(3)+'<span style="font-size:13px">%</span></div><div class="md">財務省・'+D.jgb.asOf+'</div></div>'+
    '<div class="metric"><div class="mk">プライム 配当利回り</div><div class="mv">'+pd.toFixed(2)+'<span style="font-size:13px">%</span></div><div class="md">東京都統計年鑑 15-6・2023年</div></div>'+
    '<div class="metric"><div class="mk">国債10年 − 配当利回り</div><div class="mv" style="color:var(--st-crit)">'+sgn(G.jgb10-pd,2)+'<span style="font-size:13px">pt</span></div><div class="md">プラスなら「配当より国債」</div></div>';
  var set=function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
  set("beY10",G.jgb10.toFixed(3)); set("beY10b",G.jgb10.toFixed(3));
  set("beY2",G.jgb2.toFixed(3)); set("beSpread",sgn(sp,3)); set("beDiv",pd.toFixed(2));
}

/* ---------------- wiring ---------------- */
function fillSelect(id){ var s=document.getElementById(id); if(!s) return; s.innerHTML="";
  IND.forEach(function(r){ var o=document.createElement("option");
    o.value=r.full; o.textContent=(r.level?"　　":"")+r.full; s.appendChild(o); }); }

/* ---------------- 狭い画面での図の可読性 ----------------
   SVG は viewBox ごと縮小されるため、画面が狭いと軸ラベルが 3〜7px まで小さくなる。
   縮めても文字が MINPX を下回らない図はそのまま、下回る図は原寸のまま横スクロールさせる。
   スクロールが必要になった図にだけ .pan を付け、右端のぼかしと注記で操作できることを示す。 */
var MINPX = 9;
function fitCharts(){
  /* 横スクロールに切り替えるのは、画面そのものが狭いときだけ。
     広い画面では2段組の中に図が収まっているので、そのまま縮小して表示する。 */
  var narrow = window.innerWidth < 760;
  document.querySelectorAll(".chart").forEach(function(host){
    var svg=host.firstElementChild;
    if(!svg||svg.tagName.toLowerCase()!=="svg") return;
    if(svg.dataset.mw===undefined) svg.dataset.mw=svg.style.minWidth||"";   /* 図が自分で指定した下限 */
    var vb=svg.viewBox.baseVal.width;
    var avail=host.clientWidth;
    if(!vb||!avail) return;
    var small=99;
    svg.querySelectorAll("text").forEach(function(t){
      var f=parseFloat(t.getAttribute("font-size"));
      if(f&&f<small) small=f;
    });
    var own=parseFloat(svg.dataset.mw)||0;
    var need=own;
    /* 原寸まで広げても文字は small px にしかならないので、そこが上限 */
    if(narrow&&small<99&&small*avail/vb<MINPX) need=Math.max(own,Math.min(vb,Math.ceil(vb*MINPX/small)));
    svg.style.minWidth=need?need+"px":"";
    var pan=need>avail+1;
    host.classList.toggle("pan",pan);
    var hint=host.nextElementSibling;
    var isHint=hint&&hint.classList&&hint.classList.contains("panhint");
    if(pan&&!isHint){
      var h=document.createElement("p"); h.className="panhint";
      h.textContent="図は横にスクロールできます →";
      host.parentNode.insertBefore(h,host.nextSibling);
    }else if(!pan&&isHint){ hint.remove(); }
  });
}

function renderAll(){
  renderStampV4();
  renderMapHero(); drawFlowMap(); drawIneqStrip(); drawLadder(); drawRatio(); renderRatioNote();
  renderForeign(); drawRegion(); drawForeignTrend(); renderPolicy();
  renderOutHero(); drawObSec(); drawObMix(); drawObLoan(); drawObYen(); renderObCayman(); drawObIn();
  drawBondEnv(); drawMarketTable(); drawMarketBars(); drawTurnYield(); drawTseMonthly();
  renderSmeHero(); drawHero(); drawShikin(); drawSubro(); drawHosho(); drawHeat();
  renderEquityGap(); drawGrowth();
  drawUrgency(); singleStack("ageOverview","ageOverviewLegend",SK.ageLabels,SKby["全体"].age,"age");
  drawClimate(); renderFindings(); drawRateScan(); drawLadderRate();
  drawCorr(); drawLag(); drawScatterRate();
  renderDiag(); drawRateGap(); renderRateGapPlain(); buildMemo();
  drawCurve(); drawTosai(); renderInequality(); drawCarry2(); drawFxHistory(); renderIvFilter();
  drawOpp(); drawRoutes();
  renderActions(); runTool(); runLoan();
  renderLogic();
  fitCharts();
}

document.querySelectorAll(".lens-btn").forEach(function(b){
  b.addEventListener("click",function(){
    document.querySelectorAll(".lens-btn").forEach(function(x){x.setAttribute("aria-selected","false")});
    b.setAttribute("aria-selected","true");
    document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("on")});
    document.getElementById("panel-"+b.dataset.lens).classList.add("on");
    fitCharts();
    window.scrollTo({top:0,behavior:"smooth"});
  });
});
fillSelect("dgInd");
document.getElementById("dgInd").value="製造業";
["dgInd","dgSize","dgUse"].forEach(function(id){
  document.getElementById(id).addEventListener("change",function(){ renderDiag(); buildMemo(); }); });
wireMemo(); wireIv(); tkInit();
renderAll();
var mq=window.matchMedia("(prefers-color-scheme: dark)");
if(mq.addEventListener) mq.addEventListener("change",renderAll);
new MutationObserver(renderAll).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
var rt; window.addEventListener("resize",function(){ clearTimeout(rt); rt=setTimeout(function(){HEAT=null;drawHeat();drawCorr();fitCharts();},200); });
})();
