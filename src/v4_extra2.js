/* ============================================================
   v4.1 追加：政策／増資・成長企業／時差走査／都債の物差し
             相談メモ／資産形成格差／内外金利差／制度の絞り込み
   ============================================================ */

/* ---------------- 02 政策 ---------------- */
function renderPolicy(){
  var P=D.policy; if(!P) return;
  var g=P.gfci, up=g.prevRank-g.rank;
  document.getElementById("policyLede").innerHTML=
    '東京への資金流入は自然現象ではなく、政策の結果でもあります。国と東京都が何に取り組み、'+
    'どこまで効いて、何が届いていないのかを、本サービスの実測値と突き合わせて並べます。';
  document.getElementById("gfciBox").innerHTML=
    '<div><span class="lv" style="font-family:IBM Plex Mono,monospace;font-size:10px;letter-spacing:.16em;color:var(--ink-3);display:block;margin-bottom:2px">GLOBAL FINANCIAL CENTRES INDEX</span>'+
    '<span class="rk" style="color:var(--st-good)">'+g.rank+'<span style="font-size:15px;font-weight:400;color:var(--ink-3)"> 位 / 世界</span></span></div>'+
    '<p class="tx"><strong>'+g.edition+'で東京は'+g.rank+'位。</strong>前版の'+g.prevRank+'位から'+up+'つ上昇し、10位以内に復帰しました。'+
    'ただしスコアは'+g.prevRating+'→'+g.rating+'と<strong>低下</strong>しており、順位の改善は他都市の後退による面があります。'+
    '上位は'+g.top.slice(0,4).map(function(t){return t[0]}).join('・')+'。'+
    '<br><span style="font-size:11.5px;color:var(--ink-3)">出典：'+g.src+'</span></p>';
  document.getElementById("policyList").innerHTML=P.items.map(function(p){
    return '<div class="p"><h4>'+p.name+'</h4>'+
      '<div class="meta">'+p.who+'　/　'+p.when+'</div>'+
      '<dl>'+
      '<dt>取組</dt><dd>'+p.what+'</dd>'+
      '<dt>効果</dt><dd>'+p.evidence+'</dd>'+
      '<dt class="g">不足</dt><dd>'+p.gap+'</dd>'+
      '<dt>一次情報</dt><dd><a href="'+p.url+'" target="_blank" rel="noopener">'+p.url.replace(/^https:\/\//,'').slice(0,58)+'…</a></dd>'+
      '</dl></div>';
  }).join("");
}

/* ---------------- 01 預貸率の補足 ---------------- */
function renderRatioNote(){
  var r=D.finance.ratio, last=r.years.length-1;
  var b=r.bank[last], s=r.shinkin[last];
  var e1=document.getElementById("ratioBank"); if(e1) e1.textContent=b.toFixed(1);
  var e2=document.getElementById("ratioShinkin"); if(e2) e2.textContent=s.toFixed(1);
  var el3=document.getElementById("ratioNote"); if(!el3) return;
  el3.textContent="銀行は "+r.bank[0].toFixed(1)+"%（"+r.years[0]+"年）から "+b.toFixed(1)+"%（"+r.years[last]+"年）へ "+
    (b-r.bank[0]).toFixed(1)+"ポイント低下。信用金庫は5年間ほぼ横ばいの"+s.toFixed(1)+"%で、差は "+
    (b-s).toFixed(1)+"ポイントあります。預貸率の高低それ自体に良し悪しはありませんが、"+
    "中小企業の主力取引先である信用金庫で、預金の半分近くが貸出以外に向かっている点は、資金の目詰まりを見るうえでの手がかりになります。";
}

/* ---------------- 04 増資の不在と成長企業 ---------------- */
function renderEquityGap(){
  var S=D.shikin, M=D.market;
  var host=document.getElementById("equityGap"); if(!host) return;
  host.innerHTML=
    '<div class="metric"><div class="mk">調達手段の選択肢</div><div class="mv">'+S.sourceLabels.length+'<span style="font-size:13px"> 種類</span></div><div class="md">'+S.sourceLabels.join('／')+'</div></div>'+
    '<div class="metric"><div class="mk">うちエクイティ</div><div class="mv" style="color:var(--st-crit)">0<span style="font-size:13px"> 種類</span></div><div class="md">増資・社債・CFは選択肢に無い</div></div>'+
    '<div class="metric"><div class="mk">借入に依存する割合</div><div class="mv">'+(S.source[1]+S.source[2]).toFixed(1)+'<span style="font-size:13px">%</span></div><div class="md">自己資金 '+S.source[0].toFixed(1)+'% を除く全て</div></div>';
  var gr=M.segments[2];
  document.getElementById("growthNote").innerHTML=
    '<strong>非上場からエクイティまでの距離。</strong>'+
    '株式投資型クラウドファンディングは1社あたり年間1億円未満・投資家1人あたり同一発行者へ年50万円まで。'+
    'ベンチャーキャピタルは事業計画と成長シナリオを求めます。'+
    '東証グロースは'+fmt(gr.listed[1])+'社で、配当利回りは'+gr.yield.toFixed(2)+'%、売買回転率は'+gr.turnover[1].toFixed(1)+'%。'+
    '値上がり益で報いる市場であり、安定配当を出す成熟企業の受け皿ではありません。'+
    '<br><br><strong>そして最大の段差は制度ではなく年齢です。</strong>'+
    '景況調査の回答企業は創業1980年以前が'+SKby["全体"].pre1980.toFixed(1)+'%、経営者の'+SKby["全体"].old70.toFixed(1)+'%が70歳以上。'+
    'エクイティが前提とする「これから10年で数倍にする」という物語と、この母集団はそもそも噛み合っていません。'+
    '成長企業の資金調達難と、既存中小企業の資金繰りは、同じ「資金不足」でも必要な処方が違います。';
}

function drawGrowth(){
  var host=document.getElementById("growthChart"); if(!host) return; host.innerHTML="";
  var M=D.market;
  var rows=[
    {n:"東証プライム", v:M.segments[0].listed[1], c:"--s1"},
    {n:"東証スタンダード", v:M.segments[1].listed[1], c:"--s1"},
    {n:"東証グロース", v:M.segments[2].listed[1], c:"--s3"},
    {n:"景況調査の対象（非上場）", v:D.meta.sampleSize, c:"--s2"}
  ];
  var W=520,H=190,PL=150,PR=64,PT=10,RH=42;
  var max=Math.max.apply(null,rows.map(function(r){return r.v}));
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"市場区分別の会社数と景況調査対象企業数の比較"});
  rows.forEach(function(r,i){
    var y0=PT+i*RH, w=(W-PL-PR)*r.v/max;
    svg.appendChild(el("text",{x:0,y:y0+21,fill:css("--ink-2"),"font-size":12,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.n));
    var rr=el("rect",{x:PL,y:y0+6,width:Math.max(w,2),height:20,fill:css(r.c),opacity:.88,rx:2});
    rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+r.n+'</div><div class="tr"><span>社数</span><b>'+fmt(r.v)+'</b></div>'); });
    rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
    svg.appendChild(el("text",{x:PL+Math.max(w,2)+7,y:y0+21,fill:css("--ink-2"),"font-size":11,"font-family":"IBM Plex Mono, monospace","font-weight":600},fmt(r.v)));
  });
  host.appendChild(svg);
  legend("growthLegend",[["--s3","エクイティで資金を集める市場","box"],["--s2","調査対象の非上場企業","box"]]);
}

/* ---------------- 05 時差走査 ---------------- */
/* 色は金利の種類だけを表し、水準／前年差は実線・破線で区別する */
var SCAN_COL={y10_level:"--s1",y10_yoy:"--s1",y2_level:"--s3",y2_yoy:"--s3"};
function drawRateScan(){
  var C=D.corr; if(!C.rateScan) return;
  var host=document.getElementById("rateScanChart"); if(!host) return; host.innerHTML="";
  document.getElementById("whyY10").textContent=C.whyY10;
  document.getElementById("lagAnswer").textContent=C.lagAnswer;
  var W=880,H=300,PL=52,PR=170,PT=18,PB=44;
  var lo=-0.6,hi=0.6;
  var x=function(k){return PL+(W-PL-PR)*k/24}, y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,width:W,role:"img","aria-label":"金利と業況DIのラグ相関の走査"});
  svg.setAttribute("style","min-width:"+W+"px;max-width:100%");
  for(var t=-0.6;t<=0.601;t+=0.2){
    var tv=Math.round(t*10)/10;
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(tv),y2:y(tv),stroke:css(Math.abs(tv)<1e-9?"--axis":"--grid"),"stroke-width":Math.abs(tv)<1e-9?1.5:1}));
    svg.appendChild(el("text",{x:PL-8,y:y(tv)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},tv.toFixed(1)));
  }
  [0,6,12,18,24].forEach(function(k){
    svg.appendChild(el("line",{x1:x(k),x2:x(k),y1:PT,y2:H-PB,stroke:css("--grid")}));
    svg.appendChild(el("text",{x:x(k),y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},k));
  });
  svg.appendChild(el("text",{x:(PL+W-PR)/2,y:H-8,"text-anchor":"middle",fill:css("--ink-3"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},"金利を何か月さかのぼるか（か月）"));
  var ends=[];
  C.rateScan.forEach(function(s){
    var col=css(SCAN_COL[s.key]||"--s1"), d="";
    s.pts.forEach(function(p,i){ d+=(i?" L":"M")+x(p.lag)+","+y(p.r); });
    svg.appendChild(el("path",{d:d,fill:"none",stroke:col,"stroke-width":2.2,
      "stroke-dasharray":s.mode==="前年差"?"5 3":""}));
    var b=s.best;
    var c=el("circle",{cx:x(b.lag),cy:y(b.r),r:5,fill:col,stroke:css("--surface"),"stroke-width":2});
    c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+s.rate+'（'+s.mode+'） '+b.lag+'か月前</div><div class="tr"><span>相関係数 r</span><b>'+b.r.toFixed(3)+'</b></div><div class="tr"><span>n</span><b>'+b.n+'</b></div>'); });
    c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
    var lp=s.pts[s.pts.length-1];
    ends.push({y:y(lp.r), col:col, t:s.rate+"／"+s.mode, dash:s.mode==="前年差"});
  });
  ends.sort(function(a,b){return a.y-b.y});
  for(var i=1;i<ends.length;i++) if(ends[i].y-ends[i-1].y<15) ends[i].y=ends[i-1].y+15;
  ends.forEach(function(e){
    svg.appendChild(el("line",{x1:W-PR+8,x2:W-PR+26,y1:e.y,y2:e.y,stroke:e.col,"stroke-width":2.4,
      "stroke-dasharray":e.dash?"4 3":"","stroke-linecap":"round"}));
    svg.appendChild(el("text",{x:W-PR+32,y:e.y+4,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},e.t));
  });
  host.appendChild(svg);
  legend("rateScanLegend",[["--s1","国債10年"],["--s3","国債2年"],
    ["--ink-3","実線＝金利の水準／破線＝前年同月差（変化幅）"]]);

  /* 最も強かった組み合わせ */
  var best=C.rateScan.reduce(function(a,b){return Math.abs(b.best.r)>Math.abs(a.best.r)?b:a});
  var zero=C.rateScan.filter(function(s){return s.key==="y10_level"})[0].pts[0];
  document.getElementById("findLag").textContent="r = "+best.best.r.toFixed(2);
  document.getElementById("findLag").style.color=css("--s1");
  document.getElementById("findLagNote").innerHTML=
    '<strong>'+best.rate+'の'+best.mode+'を'+best.best.lag+'か月さかのぼって比べたとき（n='+best.best.n+'）。</strong>'+
    '同じ月どうしなら r='+zero.r.toFixed(2)+' で無関係に見えたものが、時差を入れると r='+best.best.r.toFixed(2)+' まで上がります。'+
    'しかも相関はラグを延ばすほど一方向に強まっており、偶然の当たりではありません。'+
    '<br><br>読み方は二つあります。<strong>水準</strong>（実線）は、金利が高かった時期の約2年後に景況が悪い、という遅れて効く負の関係。'+
    '<strong>前年差</strong>（破線）は、金利が上がっている局面ほど同時期の景況も良い、という順方向の関係で、'+
    '景気が良いから金利が上がるという因果の向きと整合します。'+
    '<br><br>結論は「金利は中小企業に効いていない」ではなく、'+
    '<strong>「金利は約2年遅れて効く。だから今日の金利で今日の景況を語ってはいけない」</strong>です。'+
    '相関は因果を示すものではありませんが、施策の効果を測る時間軸の目安にはなります。';
  var gl=document.getElementById("gapBestLab");
  if(gl&&C.gapBest) gl.textContent="最大は"+C.gapBest.lag+"か月後の r="+C.gapBest.r.toFixed(2);
}

/* ---------------- 05 都債を物差しに ---------------- */
function drawLadderRate(){
  var host=document.getElementById("ladderRate"); if(!host) return; host.innerHTML="";
  var G=D.rateGap, T=D.tosai, J=D.jgb;
  var rows=[
    {n:"日本国（国債10年）", v:J.curve[9], c:"--s1", d:"財務省・"+J.asOf},
    {n:"東京都（円建て都債・最終回）", v:T.jpy.lastRate, c:"--s3", d:T.jpy.lastDate+"／以後発行なし"},
    {n:"東京都（外貨建て・直近）", v:T.fx.rows[0].rate, c:"--s4", d:T.fx.rows[0].yr+"／"+T.fx.rows[0].ccy+"建て"},
    {n:"都内中小企業（最多価格帯）", v:2.5, c:"--s2", d:"「2％台」が"+G.smeRate[2].toFixed(1)+"%で最多"}
  ];
  var W=620,H=210,PL=196,PR=104,PT=10,RH=46;
  var max=4.6;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"国・都・中小企業の調達金利の比較"});
  rows.forEach(function(r,i){
    var y0=PT+i*RH, w=(W-PL-PR)*r.v/max;
    svg.appendChild(el("text",{x:0,y:y0+19,fill:css("--ink-2"),"font-size":12,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.n));
    svg.appendChild(el("text",{x:0,y:y0+34,fill:css("--ink-3"),"font-size":10,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.d));
    var rr=el("rect",{x:PL,y:y0+6,width:Math.max(w,2),height:20,fill:css(r.c),opacity:.88,rx:2});
    rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+r.n+'</div><div class="tr"><span>金利</span><b>'+r.v.toFixed(2)+'%</b></div><div class="tr"><span>時点</span><b>'+r.d+'</b></div>'); });
    rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
    svg.appendChild(el("text",{x:PL+Math.max(w,2)+7,y:y0+21,fill:css("--ink-2"),"font-size":11,"font-family":"IBM Plex Mono, monospace","font-weight":600},r.v.toFixed(2)+"%"));
  });
  host.appendChild(svg);
  legend("ladderRateLegend",[["--s1","国","box"],["--s3","東京都（円）","box"],["--s4","東京都（外貨）","box"],["--s2","都内中小企業","box"]]);
  document.getElementById("ladderRateNote").innerHTML=
    '<strong>都債を物差しにすると、二つの歪みが見えます。</strong>'+
    '第一に、東京都が円で個人から資金を集めていた最後の利率は'+T.jpy.lastRate.toFixed(2)+'%（'+T.jpy.lastDate+'）。'+
    'いま国債10年は'+J.curve[9].toFixed(3)+'%です。金利がこれだけ戻っているのに、円建ての窓口は'+(T.gapYears||12)+'年以上閉じたままです。'+
    '<br><br>第二に、東京都が外貨で払っている'+T.fx.rows[0].rate.toFixed(2)+'%は、都内中小企業が借りている金利帯とほぼ同じ水準です。'+
    '同じ「東京」の名の下で、片方は海外の投資家に、もう片方は地元の事業者に、近い値段の資金が動いている。'+
    '両者をつなぐ経路があれば、という問いが立ちます。'+
    '<br><br><span style="color:var(--ink-3)">※ 都債と事業融資は信用力も担保も期間も異なり、金利水準を直接比較して優劣を論じられるものではありません。ここでは層ごとの資金の値段を同じ目盛りに並べることを目的としています。</span>';
}

/* ---------------- 06 事業者：平易な金利の読み方 ---------------- */
function renderRateGapPlain(){
  var G=D.rateGap, C=D.corr, host=document.getElementById("rateGapPlain"); if(!host) return;
  var best=C.rateScan?C.rateScan.reduce(function(a,b){return Math.abs(b.best.r)>Math.abs(a.best.r)?b:a}):null;
  host.innerHTML=
    '<strong>いま借りている方への読み方。</strong>'+
    'いちばん多い借入金利は「2％台」で'+G.smeRate[2].toFixed(1)+'%の企業がここにいます。前回調査では'+G.smeRatePrev[2].toFixed(1)+'%でしたから、'+
    'この価格帯に入る企業が増えています。実際、金利が「上昇した」と答えた企業は'+G.trendUp.toFixed(1)+'%。'+
    '<br><br>いっぽう国の金利（国債10年）はすでに'+G.jgb10.toFixed(2)+'%、2年ものでも'+G.jgb2.toFixed(2)+'%です。'+
    '銀行の貸出金利はこの国の金利を土台に決まるため、<strong>まだ上がる余地が残っている</strong>と読むのが自然です。'+
    (best?'<br><br>本サービスの分析では、金利の影響が景況に表れるまで<strong>およそ'+best.best.lag+'か月</strong>かかっていました。'+
      'いま金利が上がっているなら、その影響が事業の実感に届くのはこれからです。':'')+
    '<br><br><strong>できること。</strong>変動金利で借りている場合は、固定への切替や借換えの条件を一度確認しておくこと。'+
    '信用保証協会の保証付き融資や制度融資は金利と保証料の合計で比較すること。'+
    '資金需要が出てから動くと選択肢が減るため、必要になる前に取引金融機関へ相談しておくこと。'+
    '下の「相談メモ」はそのための下書きです。';
}

/* ---------------- 06 相談メモ ---------------- */
var PREP={
  common:["直近2期分の決算書（貸借対照表・損益計算書・勘定科目内訳明細書）","直近の試算表（決算から3か月以上経っている場合）","資金繰り表（できれば今後6〜12か月分）","会社の概要が分かるもの（沿革・取引先・主要商品）"],
  capex:["設備の見積書またはカタログ","導入後の効果を書いた簡単な計画（何がどれだけ変わるか）"],
  growth:["採用計画または事業計画（1〜3年）","売上の見通しと、その根拠になる受注・引合の状況"],
  restruct:["返済計画の見直し案","経費削減や収益改善の具体策と、その実行時期"],
  succession:["株主名簿と、後継者候補の有無が分かるもの","自社株の評価に関する資料（あれば）"],
  working:["直近の売掛・買掛の状況が分かるもの","資金が不足する時期と金額の見込み"]
};
function buildMemo(){
  var ta=document.getElementById("memoText"); if(!ta) return;
  var ind=document.getElementById("dgInd").value;
  var size=document.getElementById("dgSize");
  var use=document.getElementById("dgUse");
  var amt=document.getElementById("memoAmt").value;
  var when=document.getElementById("memoWhen").value;
  var yrs=document.getElementById("memoYears").value;
  var rec=byFull[ind], dg=rec.diag;
  var G=D.rateGap, J=D.jgb;
  var schemes=[];
  var ol=document.getElementById("dgSchemes");
  if(ol) schemes=[].slice.call(ol.querySelectorAll("li")).slice(0,3).map(function(li){
    var s=li.querySelector("strong"); return s?s.textContent:li.textContent.slice(0,26); });
  var L=[];
  L.push("【資金調達のご相談】");
  L.push("");
  L.push("■ 事業の概要");
  L.push("・業種："+ind);
  L.push("・従業員規模："+size.options[size.selectedIndex].text);
  L.push("・創業からの年数："+yrs);
  L.push("");
  L.push("■ ご相談したいこと");
  L.push("・資金の使いみち："+use.options[use.selectedIndex].text);
  L.push("・希望金額："+amt);
  L.push("・必要な時期："+when);
  L.push("");
  L.push("■ 業界の状況（東京都の公開統計より）");
  L.push("・「東京都中小企業の景況」"+D.meta.latestLabel+"時点で、"+ind+"の業況DIは直近3か月平均で "+dg.L+"。");
  L.push("　1年前との差は "+sgn(dg.M,1)+"ポイントです。");
  if(dg.P!=null) L.push("・仕入価格を販売価格に転嫁できていない度合い（価格転嫁ギャップ）は "+dg.P+"。");
  L.push("・以上から、当社に必要な資金は「"+dg.tag+"」に分類されると考えています。");
  L.push("");
  L.push("■ 検討している調達の方向");
  if(schemes.length) schemes.forEach(function(s,i){ L.push("・"+(i+1)+". "+s); });
  else L.push("・まだ絞り込めていないため、あわせてご相談させてください。");
  L.push("");
  L.push("■ 金利環境について（財務省「国債金利情報」"+J.asOf+"時点）");
  L.push("・国債10年 "+G.jgb10.toFixed(3)+"%、国債2年 "+G.jgb2.toFixed(3)+"%。");
  L.push("・都内中小企業の借入金利は「2％台」が "+G.smeRate[2].toFixed(1)+"% で最多、"
        +"金利が上昇したと回答した企業は "+G.trendUp.toFixed(1)+"% です。");
  L.push("・固定・変動の選択と、借換えの可否についてもご意見をいただきたいです。");
  L.push("");
  L.push("■ ご用意できる資料");
  var pre=PREP.common.concat(PREP[use.value]||[]);
  pre.forEach(function(p){ L.push("・"+p); });
  L.push("");
  L.push("※ 数値は東京都・財務省の公開統計をもとに Tokyo Capital Bridge が機械的に算出したものです。");
  L.push("　 出典：東京都「中小企業の景況」「事業資金に関する調査」、財務省「国債金利情報」。");
  ta.value=L.join("\n");

  var pl=document.getElementById("prepList");
  if(pl) pl.innerHTML=pre.map(function(p){
    return '<li><strong>'+p+'</strong></li>'; }).join("");
}
function wireMemo(){
  ["memoAmt","memoWhen","memoYears"].forEach(function(id){
    var e=document.getElementById(id); if(e) e.addEventListener("change",buildMemo); });
  var b=document.getElementById("memoCopy");
  if(b) b.addEventListener("click",function(){
    var ta=document.getElementById("memoText");
    ta.select(); ta.setSelectionRange(0,99999);
    var ok=false;
    try{ ok=document.execCommand("copy"); }catch(e){}
    var m=document.getElementById("memoMsg");
    m.textContent=ok?"コピーしました":"⌘/Ctrl+C でコピーしてください";
    m.style.color=ok?css("--st-good"):css("--ink-3");
    setTimeout(function(){ m.textContent=""; },3200);
  });
}

/* ---------------- 01 格差のちらばり（ドットストリップ） ---------------- */
var GRP_COL={"区部":"--s1","市部":"--s3","郡部":"--s2","島部":"--s4"};
function drawIneqStrip(){
  var A=(D.inequality||{}).all; if(!A) return;
  var host=document.getElementById("ineqStrip"); if(!host) return; host.innerHTML="";
  document.getElementById("stripH").textContent=
    "同じ都民でも、投資に回せる余力の出発点が"+A.ratio.toFixed(1)+"倍ちがう";
  var W=980,H=168,PL=16,PR=16,PT=22,PB=42;
  var max=620000;
  var X=function(v){return PL+(W-PL-PR)*v/max};
  var BAND=[PT+8, H-PB-10];
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img",
    "aria-label":"全62区市町村の住民1人当たり個人住民税負担額のちらばり"});
  /* 軸 */
  svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:H-PB+6,y2:H-PB+6,stroke:css("--axis")}));
  for(var v=0;v<=600000;v+=100000){
    svg.appendChild(el("line",{x1:X(v),x2:X(v),y1:H-PB+6,y2:H-PB+11,stroke:css("--line-2")}));
    svg.appendChild(el("text",{x:X(v),y:H-PB+25,"text-anchor":"middle",fill:css("--ink-3"),
      "font-size":10.5,"font-family":"IBM Plex Mono, monospace"},v===0?"0":(v/10000)+"万円"));
  }
  /* 都平均 */
  var tx=X(A.tokyo);
  svg.appendChild(el("line",{x1:tx,x2:tx,y1:PT-4,y2:H-PB+6,stroke:css("--st-crit"),"stroke-width":1.5,"stroke-dasharray":"4 3"}));
  svg.appendChild(el("text",{x:tx,y:PT-9,"text-anchor":"middle",fill:css("--st-crit"),"font-size":11,
    "font-family":'"Zen Kaku Gothic New",sans-serif',"font-weight":700},"都平均 "+fmt(A.tokyo)+"円"));
  /* ドット（重なりを避けるため決定論的に縦へ散らす） */
  var slots=[];
  A.rows.forEach(function(r,i){
    var x=X(r.v), row=0;
    while(slots[row]!=null && Math.abs(slots[row]-x)<9) row++;
    slots[row]=x;
    var y=BAND[0]+row*11;
    if(y>BAND[1]){ y=BAND[1]; }
    var c=el("circle",{cx:x,cy:y,r:4.5,fill:css(GRP_COL[r.g]||"--s1"),opacity:.82,
      stroke:css("--surface"),"stroke-width":1});
    c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+r.n+'（'+r.g+'）</div>'+
      '<div class="tr"><span>1人当たり負担額</span><b>'+fmt(r.v)+'円</b></div>'+
      '<div class="tr"><span>都平均との比</span><b>'+(r.v/A.tokyo).toFixed(2)+'倍</b></div>'); });
    c.addEventListener("mouseleave",hideTip);
    svg.appendChild(c);
    if(r.n===A.top.n||r.n===A.bottom.n||r.n===A.wardBottom.n){
      svg.appendChild(el("text",{x:x,y:y-9,"text-anchor":"middle",fill:css("--ink"),"font-size":11,
        "font-family":'"Zen Kaku Gothic New",sans-serif',"font-weight":700},r.n));
    }
  });
  host.appendChild(svg);
  legend("ineqStripLegend",[["--s1","区部（23区）"],["--s3","市部（26市）"],
    ["--s2","郡部（西多摩）"],["--s4","島部"],["--st-crit","都平均","box"]]);
  document.getElementById("stripMetrics").innerHTML=
    '<div class="metric"><div class="mk">最も高い'+A.top.n+'</div><div class="mv">'+fmt(A.top.v)+'<span style="font-size:13px">円</span></div><div class="md">都平均の'+(A.top.v/A.tokyo).toFixed(1)+'倍</div></div>'+
    '<div class="metric"><div class="mk">最も低い'+A.bottom.n+'</div><div class="mv" style="color:var(--st-crit)">'+fmt(A.bottom.v)+'<span style="font-size:13px">円</span></div><div class="md">都平均の'+(A.bottom.v/A.tokyo).toFixed(2)+'倍</div></div>'+
    '<div class="metric"><div class="mk">23区の中だけでも</div><div class="mv">'+A.wardRatio.toFixed(1)+'<span style="font-size:13px">倍</span></div><div class="md">'+A.wardTop.n+' ↔ '+A.wardBottom.n+'</div></div>';
  document.getElementById("stripNote").innerHTML=
    A.metric+"（"+A.label.replace(/^東京都統計年鑑\s*/,"東京都統計年鑑 ")+"）。"+
    "ここでは格差の<strong>大きさ</strong>だけを示しています。この差が資産形成の制度の使われ方にどう表れるかは、"+
    "<strong>パネル07「投資家：投資機会」</strong>で、iDeCo等の利用率との相関（r="+
    ((D.inequality||{}).rIde||0).toFixed(2)+"）として扱います。";
}

/* ---------------- 07 格差の大きさ（全62区市町村・区部を含む） ---------------- */
function drawIneqAll(){
  var A=(D.inequality||{}).all; if(!A) return;
  var host=document.getElementById("ineqAllChart"); if(!host) return; host.innerHTML="";
  document.getElementById("ineqAllLede").innerHTML=
    '住民1人あたりの個人住民税の負担額を、'+A.n+'すべての区市町村で並べます。'+
    '所得の水準と、税を納めている人の割合の両方が反映されるため、地域の担税力の目安になります。'+
    '出典：<a href="'+A.url+'" target="_blank" rel="noopener">'+A.label+'</a>';
  document.getElementById("ineqRatio").textContent=A.ratio.toFixed(1)+" 倍";
  document.getElementById("ineqRatioNote").innerHTML=
    '<strong>最も高い'+A.top.n+'（'+fmt(A.top.v)+'円）と、最も低い'+A.bottom.n+'（'+fmt(A.bottom.v)+'円）の差。</strong>'+
    '23区の中だけで見ても'+A.wardTop.n+'と'+A.wardBottom.n+'で <b class="num">'+A.wardRatio.toFixed(1)+'倍</b>あります。'+
    '東京都の平均は'+fmt(A.tokyo)+'円ですが、平均の周りに集まっているわけではありません。'+
    '同じ「都民」でも、投資に回せる余力の出発点がこれだけ違います。';

  var R=A.rows, W=980, RH=17, PL=104, PR=88, PT=12;
  var H=PT+R.length*RH+8;
  var max=600000;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,width:W,role:"img","aria-label":"区市町村別の住民1人当たり個人住民税負担額"});
  svg.setAttribute("style","min-width:"+W+"px;max-width:100%");
  /* 都平均の基準線 */
  var tx=PL+(W-PL-PR)*A.tokyo/max;
  svg.appendChild(el("line",{x1:tx,x2:tx,y1:PT,y2:H-6,stroke:css("--st-crit"),"stroke-width":1.4,"stroke-dasharray":"4 3"}));
  svg.appendChild(el("text",{x:tx+5,y:H-8,fill:css("--st-crit"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif',"font-weight":700},"都平均 "+fmt(A.tokyo)+"円"));
  R.forEach(function(r,i){
    var y0=PT+i*RH, w=(W-PL-PR)*r.v/max;
    svg.appendChild(el("text",{x:PL-7,y:y0+12,"text-anchor":"end",fill:css("--ink-2"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.n));
    var rr=el("rect",{x:PL,y:y0+3,width:Math.max(w,1.5),height:11,fill:css(GRP_COL[r.g]||"--s1"),opacity:.85,rx:1.5});
    rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+r.n+'（'+r.g+'）</div>'+
      '<div class="tr"><span>1人当たり負担額</span><b>'+fmt(r.v)+'円</b></div>'+
      '<div class="tr"><span>都平均との比</span><b>'+(r.v/A.tokyo).toFixed(2)+'倍</b></div>'); });
    rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
    if(i<3||i>=R.length-3)
      svg.appendChild(el("text",{x:PL+Math.max(w,1.5)+6,y:y0+12,fill:css("--ink-2"),"font-size":10,"font-family":"IBM Plex Mono, monospace","font-weight":600},fmt(r.v)));
  });
  host.appendChild(svg);
  legend("ineqAllLegend",[["--s1","区部","box"],["--s3","市部","box"],["--s2","郡部","box"],["--s4","島部","box"]]);
  document.getElementById("ineqAllNote").textContent=
    A.metric+"。"+A.note+" 区部の平均は"+fmt(A.groups["区部"])+"円、市部は"+fmt(A.groups["市部"])+
    "円、郡部は"+fmt(A.groups["郡部"])+"円、島部は"+fmt(A.groups["島部"])+"円です。";
}

/* ---------------- 07 資産形成格差 ---------------- */
function renderInequality(){
  drawIneqAll();
  var Q=D.inequality; if(!Q) return;
  var host=document.getElementById("ineqChart"); if(!host) return;
  document.getElementById("ineqLede").innerHTML=
    '「都民の平均」では格差は見えません。そこで多摩・島しょの'+Q.n+'市町村について、'+
    '<strong>納税義務者1人あたりの課税標準額</strong>（所得の代理指標）と、'+
    '<strong>資産形成に使う制度の利用率</strong>を突き合わせました。'+
    '対象は'+Q.label+'。<a href="'+Q.url+'" target="_blank" rel="noopener">データセット</a>';
  document.getElementById("ineqR").textContent="r = "+Q.rIde.toFixed(2);
  document.getElementById("ineqRNote").innerHTML=
    '<strong>所得水準 × iDeCo・小規模企業共済等の利用率（n='+Q.n+'）。</strong>'+
    '所得の高い自治体ほど、資産を積み上げる制度が使われています。'+
    '利用率は '+Q.ideRange[0].toFixed(2)+'% 〜 '+Q.ideRange[1].toFixed(2)+'% で、最大 '+
    (Q.ideRange[1]/Q.ideRange[0]).toFixed(1)+'倍の開き。'+
    '同じ制度が同じ条件で用意されていても、実際に使われる度合いは所得によって大きく違います。';

  host.innerHTML="";
  var W=760,H=330,PL=60,PR=204,PT=18,PB=48;
  var xs=Q.muni.map(function(m){return m.base});
  var xlo=140e4, xhi=400e4, ylo=0, yhi=14;
  var X=function(v){return PL+(W-PL-PR)*(v-xlo)/(xhi-xlo)};
  var Y=function(v){return PT+(H-PT-PB)*(yhi-v)/(yhi-ylo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"市町村ごとの所得水準と制度利用率の散布図"});
  for(var t=0;t<=yhi;t+=2){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:Y(t),y2:Y(t),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:Y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t+"%"));
  }
  for(var v=150e4;v<=400e4;v+=50e4){
    svg.appendChild(el("line",{x1:X(v),x2:X(v),y1:PT,y2:H-PB,stroke:css("--grid")}));
    svg.appendChild(el("text",{x:X(v),y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},(v/1e4)+"万"));
  }
  svg.appendChild(el("text",{x:(PL+W-PR)/2,y:H-8,"text-anchor":"middle",fill:css("--ink-3"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},"納税義務者1人あたり課税標準額の目安（円）"));
  /* 生命保険料控除（比較用・薄く） */
  Q.muni.forEach(function(m){
    if(m.ins>yhi) return;
    svg.appendChild(el("circle",{cx:X(m.base),cy:Y(m.ins),r:2.5,fill:css("--ink-3"),opacity:.25}));
  });
  Q.muni.forEach(function(m){
    var c=el("circle",{cx:X(m.base),cy:Y(m.ide),r:Math.max(3,Math.min(11,Math.sqrt(m.nz)/70)),
      fill:css("--s1"),opacity:.6,stroke:css("--surface"),"stroke-width":1});
    c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+m.n+'</div>'+
      '<div class="tr"><span>課税標準額の目安</span><b>'+fmt(Math.round(m.base/1e4))+'万円</b></div>'+
      '<div class="tr"><span>iDeCo・小規模企業共済等</span><b>'+m.ide.toFixed(2)+'%</b></div>'+
      '<div class="tr"><span>生命保険料控除</span><b>'+m.ins.toFixed(1)+'%</b></div>'+
      '<div class="tr"><span>所得割の納税義務者</span><b>'+fmt(m.nz)+'人</b></div>'); });
    c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
  });
  /* 目立つ2点だけ直接ラベル */
  [Q.muni[0], Q.muni[Q.muni.length-1]].forEach(function(m){
    svg.appendChild(el("text",{x:X(m.base),y:Y(m.ide)-13,"text-anchor":"middle",fill:css("--ink"),
      "font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif',"font-weight":700},m.n));
  });
  /* 凡例（右側に直接） */
  var LX=W-PR+18, LT=LX+14;
  svg.appendChild(el("circle",{cx:LX,cy:PT+30,r:6,fill:css("--s1"),opacity:.6}));
  svg.appendChild(el("text",{x:LT,y:PT+34,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"iDeCo・小規模企業共済等"));
  svg.appendChild(el("text",{x:LT,y:PT+50,fill:css("--ink-3"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace"},"r = "+Q.rIde.toFixed(2)));
  svg.appendChild(el("text",{x:LT,y:PT+65,fill:css("--ink-3"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"（右上がり）"));
  svg.appendChild(el("circle",{cx:LX,cy:PT+96,r:3,fill:css("--ink-3"),opacity:.4}));
  svg.appendChild(el("text",{x:LT,y:PT+100,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"生命保険料控除"));
  svg.appendChild(el("text",{x:LT,y:PT+116,fill:css("--ink-3"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace"},"r = "+Q.rIns.toFixed(2)));
  svg.appendChild(el("text",{x:LT,y:PT+131,fill:css("--ink-3"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"（ほぼ横ばい）"));
  svg.appendChild(el("text",{x:LX,y:PT+160,fill:css("--ink-3"),"font-size":10,"font-family":'"Zen Kaku Gothic New",sans-serif'},"円の大きさ＝納税義務者数"));
  host.appendChild(svg);
  legend("ineqLegend",[]);
  document.getElementById("ineqNote").textContent=
    "縦軸は所得控除を使った納税義務者の割合。生命保険料控除は "+Q.insRange[0].toFixed(1)+"%〜"+Q.insRange[1].toFixed(1)+
    "% の範囲に収まり、所得との相関は r="+Q.rIns.toFixed(2)+"。iDeCo・小規模企業共済等は "+
    Q.ideRange[0].toFixed(2)+"%〜"+Q.ideRange[1].toFixed(2)+"% で、相関は r="+Q.rIde.toFixed(2)+"です。";
  document.getElementById("ineqFinding").innerHTML="<strong>読み取れること。</strong>"+Q.finding+
    '<br><br><strong>この散布図に23区が入っていない理由。</strong>'+(Q.wardNote||"")+
    '<br><br><span style="color:var(--ink-3)">※ 課税標準額は所得割額を標準税率6%で割り戻した目安です。小規模企業共済等掛金控除にはiDeCoのほか小規模企業共済・企業型DCの加入者掛金が含まれます。上の全62区市町村の図は令和4年度、この散布図は令和5年度のデータです。</span>';
}

/* ---------------- 07 円キャリートレード：儲け方と損の出方 ---------------- */
function drawCarry2(){
  var T=D.tosai, J=D.jgb;
  var borrow=J.curve[0];               /* 円を1年借りるときの目安：国債1年 */
  var invest=T.fx.rows[0].rate;        /* 外貨で運用する利率 */
  var ccy=T.fx.rows[0].ccy;
  var P=1000000, LEV=3;
  var spread=invest-borrow;
  var be=-(spread/(1+invest/100));     /* 損益ゼロになる為替変動率（円高側・％） */

  function yen(n){ return (n>0?"+":(n<0?"−":"±"))+fmt(Math.abs(n))+"円"; }
  function pl(fxPct, mult){
    var gross = P*mult*(1+invest/100)*(1+fxPct/100);   /* 外貨で運用した結果を円に戻した額 */
    var repay = P*mult*(1+borrow/100);                 /* 借りた円に利息を付けて返す額 */
    return Math.round(gross-repay);
  }

  var w=document.getElementById("carryWin");
  var l=document.getElementById("carryLose");
  if(w) w.innerHTML=
    '<li>円を<b>年'+borrow.toFixed(2)+'%</b>で借りる。<br><span style="color:var(--ink-3);font-size:11.5px">円の金利が低いこと自体が、この取引の元手です。</span></li>'+
    '<li>借りた円を'+ccy+'に替えて、<b>年'+invest.toFixed(2)+'%</b>で運用する。</li>'+
    '<li>1年後に円へ戻して返済する。為替が動いていなければ、<strong>金利の差だけが手元に残る</strong>。<br>'+
    invest.toFixed(2)+'% − '+borrow.toFixed(2)+'% ＝ <b>'+spread.toFixed(2)+'%</b>（'+sgn(pl(0,1),0)+'円）</li>'+
    '<li class="tot">さらに円安が10%進めば、金利差に<strong>為替差益が上乗せ</strong>される。<br>1年後の損益 <b>'+yen(pl(10,1))+'</b></li>';
  if(l) l.innerHTML=
    '<li>手順は同じ。借りて、替えて、運用する。<br><span style="color:var(--ink-3);font-size:11.5px">違うのは1年後の為替だけです。</span></li>'+
    '<li>円高が'+Math.abs(be).toFixed(2)+'%進むと、金利差<b>'+spread.toFixed(2)+'%</b>が為替差損でちょうど消える。<br><span style="color:var(--ink-3);font-size:11.5px">ここが損益の分かれ目です。</span></li>'+
    '<li>それ以上の円高では、<strong>返す円が足りなくなる</strong>。運用で増えた'+ccy+'を円に戻しても、借りた額に届きません。</li>'+
    '<li class="tot">円高が10%進むと、1年後の損益 <b>'+yen(pl(-10,1))+'</b><br><span style="color:var(--ink-3);font-size:11.5px">金利差'+spread.toFixed(2)+'%では埋まらない大きさです。</span></li>';

  var host=document.getElementById("carryTable"); if(!host) return;
  var h='<thead><tr><th>1年後の為替</th><th>元手100万円のみ</th><th>3倍を動かした場合</th><th class="note">状態</th></tr></thead><tbody>';
  [20,10,0,be,-10,-20].forEach(function(f){
    var isBe=Math.abs(f-be)<1e-9;
    var a=pl(f,1), b=pl(f,LEV);
    var cls=isBe?"be":(a>0?"pos":(a<0?"neg":""));
    var st=isBe?"損益ゼロ（分かれ目）":(f>0?"円安：金利差＋為替差益":(f===0?"金利差だけが残る":"円高：金利差を為替差損が食う"));
    var lab=f>0?("円安 +"+f.toFixed(0)+"%"):(f<0?("円高 "+Math.abs(f).toFixed(f===Math.round(f)?0:2)+"%"):"変わらず 0%");
    h+='<tr class="'+cls+'"><td>'+lab+'</td>'+
       '<td class="v">'+yen(a)+'</td><td class="v">'+yen(b)+'</td>'+
       '<td class="note">'+st+'</td></tr>';
  });
  host.innerHTML=h+'</tbody>';

  document.getElementById("carry2Note").innerHTML=
    '<strong>要するに、こういう取引です。</strong>'+
    '儲けの源は<strong>金利差'+spread.toFixed(2)+'%</strong>で、これは為替が動かなければ確実に入ります。'+
    '損の源は<strong>為替</strong>で、円高が'+Math.abs(be).toFixed(2)+'%を超えた瞬間に金利差を食いつぶします。'+
    '<strong>小さく確実に稼いで、たまに大きく損をする</strong>——これが円キャリーの形です。'+
    '<br><br><strong>そして借入を重ねると、その形が増幅されます。</strong>'+
    '3倍を動かせば金利差の利益も3倍ですが、円高'+Math.abs(be).toFixed(0)+'%超えの損失も3倍です。'+
    '為替が'+(100/LEV).toFixed(0)+'%動けば元手が消える計算になります。'+
    '損失を止めるために一斉に'+ccy+'を売って円を買い戻す動きが起きると、それ自体がさらに円高を呼ぶ。'+
    'これが<strong>「円キャリーの巻き戻し」</strong>と呼ばれ、市場が急変する理由になります。'+
    '<br><br><span style="color:var(--ink-3)">※ 借入金利は日本国債1年（'+borrow.toFixed(2)+'%・'+J.asOf+'）を目安に置いた単純化です。'+
    '実際の調達金利・取引コスト・税金・追加担保の請求は考慮していません。'+
    '本サービスはこの取引を勧めるものではなく、外貨建て商品の利率がどこから来るのかを説明するために構造を示しています。</span>';
}

/* ---------------- 07 制度の絞り込み ---------------- */
function renderIvFilter(){
  var host=document.getElementById("ivResult"); if(!host) return;
  var p=document.getElementById("ivPurpose").value;
  var t=document.getElementById("ivTerm").value;
  var fxOk=document.getElementById("ivFx").value==="ok";
  var O=D.opportunities;
  var out=[];
  O.forEach(function(o){
    var why=[], ng=null;
    var isFx=/外貨/.test(o.name)||/為替/.test(o.risk);
    var isBond=/債券/.test(o.kind);
    var isEq=/株式|エクイティ/.test(o.kind);
    if(o.access==="blocked"){ ng="いまは募集そのものがありません"; }
    else if(isFx&&!fxOk){ ng="為替リスクを取らない条件に合いません"; }
    else{
      if(p==="safe"){
        if(isEq) ng="値動きが大きく、元本の変動を抑える目的に合いません";
        else if(/高/.test(o.risk)) ng="リスク区分が「"+o.risk+"」で、元本の変動を抑える目的に合いません";
        else why.push("償還時に額面が戻る債券で、リスク区分が「"+o.risk+"」であること"); }
      if(p==="income"){ if(o.ret==null||o.ret<0.5) ng="定期的な収入として意味のある利回りが出ていません";
        else why.push("利回り "+o.ret.toFixed(2)+"% の定期収入が見込めること"); }
      if(p==="growth"){ if(isBond) ng="満期まで利率が固定で、値上がり益を狙う目的に合いません";
        else why.push("値上がり益を取りにいく資産であること"); }
      if(p==="local"){ if(!/都債|クラウドファンディング|中小企業|信用金庫/.test(o.name+o.note))
          ng="東京の事業や地域に資金が向かう経路ではありません";
        else why.push("資金が都内の事業者・東京都に向かう経路であること"); }
      var mt=/(\d+)\s*年/.exec(o.name);
      var yr=mt?parseInt(mt[1],10):null;      /* 年限が定義されない手段は null */
      if(!ng&&yr!=null){
        if(t==="short"&&yr>2) ng="年限"+yr+"年は、想定している1〜2年より長すぎます";
        else if(t==="mid"&&(yr<3||yr>10)) ng="年限"+yr+"年は、想定している3〜10年から外れます";
        else if(t==="long"&&yr<=10) ng="年限"+yr+"年は、想定している10年超より短すぎます";
        else why.push("年限"+yr+"年が想定期間に収まること");
      }
      if(!ng&&yr==null) why.push("満期の定めがなく、期間の制約を受けないこと");
      if(!ng&&!isFx) why.push("為替の影響を受けないこと");
    }
    out.push({o:o, ok:!ng, why:ng||why.join("／")||"条件に反する項目がないこと"});
  });
  var ok=out.filter(function(x){return x.ok}), no=out.filter(function(x){return !x.ok});
  host.innerHTML=(ok.length?ok:[]).map(function(x){
    return '<li class="reaches"><div class="rname"><strong>'+x.o.name+'</strong><span class="tagr reaches">条件に合う</span></div>'+
      '<div class="rnote"><b>利回り '+(x.o.ret==null?"—":x.o.ret.toFixed(2)+"%")+'</b>／'+x.o.kind+'／リスク'+x.o.risk+
      '<br>残った理由：'+x.why+'<br><span style="color:var(--ink-3)">'+x.o.note+'</span></div></li>';
  }).join("")
  +'<li style="border-left-color:var(--line-2)"><div class="rname"><strong>条件に合わなかったもの（'+no.length+'件）</strong></div>'+
   '<div class="rnote">'+no.map(function(x){return '<div style="margin-bottom:4px">・<b>'+x.o.name+'</b> — '+x.why+'</div>'}).join("")+'</div></li>';
  if(!ok.length) host.insertAdjacentHTML("afterbegin",
    '<li style="border-left-color:var(--st-warn)"><div class="rname"><strong>条件に合うものがありませんでした</strong></div>'+
    '<div class="rnote">条件を緩めると候補が出ます。とくに「為替リスク」と「目的」の組み合わせで絞られやすくなっています。</div></li>');
  document.getElementById("ivRule").textContent=
    "判定は上の3条件を順に当てはめた結果です。利回りは公開統計の実測値（国債は財務省、株式の配当利回りは東京都統計年鑑 15-6、都債は東京都財務局）で、"+
    "将来の成果を示すものではありません。手数料・税金は考慮していません。";
}
function wireIv(){
  ["ivPurpose","ivTerm","ivFx"].forEach(function(id){
    var e=document.getElementById(id); if(e) e.addEventListener("change",renderIvFilter); });
}


/* ---------------- 07 「円安だから儲かる」を実績で検かめる ---------------- */
function drawFxHistory(){
  var F=D.fx; if(!F) return;
  var host=document.getElementById("fxChart"); if(!host) return; host.innerHTML="";
  document.getElementById("fxLede").innerHTML=
    'よく聞く感覚を、20年の実績で確かめます。ドル円の月中平均から'+
    '<strong>「12か月後に円安になっていたか」を'+F.n+'回ぶん</strong>数え直しました。'+
    '出典：<a href="'+F.url+'" target="_blank" rel="noopener">'+F.label+'</a>';
  document.getElementById("fxR").textContent=F.losePct.toFixed(1)+" %";
  document.getElementById("fxRNote").innerHTML=
    '<strong>損益分岐（円高'+Math.abs(F.breakEven).toFixed(2)+'％）を下回った12か月の割合。</strong>'+
    'およそ3回に1回は、金利差を為替差損が食いつぶしていました。'+
    '最も悪かった12か月では<b class="num">'+Math.abs(F.worst).toFixed(1)+'％</b>の円高が起きています。'+
    '一方で最も良かった12か月は'+F.best.toFixed(1)+'％の円安でした。';

  var W=880,H=290,PL=52,PR=124,PT=18,PB=42;
  var c=F.chg, ms=F.chgMonths;
  var lo=-25,hi=35;
  var x=function(i){return PL+(W-PL-PR)*i/(c.length-1)};
  var y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,width:W,role:"img",
    "aria-label":"ドル円の12か月変化率の推移と円キャリーの損益分岐"});
  svg.setAttribute("style","min-width:"+W+"px;max-width:100%");
  for(var t=-20;t<=hi;t+=10){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css(t===0?"--axis":"--grid"),"stroke-width":t===0?1.5:1}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},(t>0?"+":"")+t+"%"));
  }
  /* 損益分岐より下＝負けの帯 */
  svg.appendChild(el("rect",{x:PL,y:y(F.breakEven),width:W-PR-PL,height:(H-PB)-y(F.breakEven),
    fill:css("--st-crit"),opacity:.08}));
  svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(F.breakEven),y2:y(F.breakEven),
    stroke:css("--st-crit"),"stroke-width":1.4,"stroke-dasharray":"5 3"}));
  /* 棒（円安＝緑／円高＝赤） */
  var bw=Math.max((W-PL-PR)/c.length-0.4,1);
  c.forEach(function(v,i){
    var top=v>=0?y(v):y(0), h=Math.abs(y(v)-y(0));
    var r=el("rect",{x:x(i)-bw/2,y:top,width:bw,height:Math.max(h,0.6),
      fill:css(v>=F.breakEven?"--st-good":"--st-crit"),opacity:v>=F.breakEven?.55:.75});
    r.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+ymJa(ms[i])+'までの12か月</div>'+
      '<div class="tr"><span>ドル円の変化</span><b>'+(v>0?"+":"")+v.toFixed(1)+'%（'+(v>0?"円安":"円高")+'）</b></div>'+
      '<div class="tr"><span>キャリーの損益</span><b>'+(v>=F.breakEven?"プラス":"マイナス")+'</b></div>'); });
    r.addEventListener("mouseleave",hideTip); svg.appendChild(r);
  });
  [0,60,120,180,c.length-1].forEach(function(i){
    svg.appendChild(el("text",{x:x(i),y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},String(ms[i]).slice(0,4)));
  });
  svg.appendChild(el("text",{x:W-PR+8,y:y(F.breakEven)+4,fill:css("--st-crit"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif',"font-weight":700},"損益分岐 "+F.breakEven.toFixed(2)+"%"));
  svg.appendChild(el("text",{x:W-PR+8,y:PT+30,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"↑ 円安（勝ち）"));
  svg.appendChild(el("text",{x:W-PR+8,y:H-PB-14,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},"↓ 円高（負け）"));
  host.appendChild(svg);
  legend("fxLegend",[["--st-good","キャリーが黒字だった12か月","box"],
    ["--st-crit","赤字だった12か月（"+F.loseCount+"回 / "+F.n+"回）","box"]]);

  document.getElementById("fxNote").innerHTML=
    '<strong>結論から言うと、感覚は「直近5年については」正しいです。</strong>'+
    'この5年に限れば、12か月後に円安になっていた月は<b class="num">'+F.r5UpPct.toFixed(0)+'％</b>、'+
    '平均で年<b class="num">'+F.r5Mean.toFixed(1)+'％</b>の円安でした。図の右側がずっと緑なのはそのためです。'+
    '<br><br><strong>ただし20年に伸ばすと、話が変わります。</strong>'+
    '円安だった月は'+F.upPct.toFixed(1)+'％で、ほぼ五分五分。'+
    '損益分岐を割った月は'+F.losePct.toFixed(1)+'％あり、'+
    '2008年前後には12か月で'+Math.abs(F.worst).toFixed(1)+'％の円高が起きています。'+
    'この規模の円高が来ると、金利差'+(4.22-1.43).toFixed(2)+'％では到底埋まりません。'+
    '<br><br>つまりこれは<strong>「円安が続くほうに賭ける取引」</strong>です。'+
    '賭けが当たっている間は静かに儲かり、外れる年に大きく戻す。'+
    '過去5年の勝率をそのまま将来の確率と読み替えられない、というのが20年の記録が示すことです。'+
    '<br><br><span style="color:var(--ink-3)">※ ドル円で計算しています。外貨建て都債は豪ドル建てのため動きは一致しません。'+
    '金利差は現在の値（外貨建て都債4.22％、日本国債1年1.43％）で固定して計算した簡略版です。</span>';
}

/* ============================================================
   08 入口をひらく：都民向け／事業者向けの2つのツール
   ============================================================ */
var TK={};
function tkInit(){
  var T=D.tools; if(!T) return;
  var m=document.getElementById("tkMuni"); if(!m||m.options.length) return;
  T.muni.forEach(function(x){
    var o=document.createElement("option"); o.value=x.n;
    o.textContent=x.n+"（"+x.g+"）"; m.appendChild(o); });
  m.value="世田谷区";
  var i=document.getElementById("tkInc");
  T.income.forEach(function(x,k){ var o=document.createElement("option");
    o.value=k; o.textContent=x.k; i.appendChild(o); });
  i.value=1;
  var w=document.getElementById("tkWork");
  T.work.forEach(function(x,k){ var o=document.createElement("option");
    o.value=k; o.textContent=x.k; w.appendChild(o); });
  ["tkMuni","tkInc","tkWork","tkAge"].forEach(function(id){
    document.getElementById(id).addEventListener("change",runTool); });
  ["lnAmt","lnRate","lnYears"].forEach(function(id){
    var e=document.getElementById(id); if(e) e.addEventListener("change",runLoan); });
}

function runTool(){
  var T=D.tools; if(!T) return;
  var host=document.getElementById("tkTable"); if(!host) return;
  var mn=document.getElementById("tkMuni").value;
  var inc=T.income[+document.getElementById("tkInc").value];
  var wk=T.work[+document.getElementById("tkWork").value];
  var age=+document.getElementById("tkAge").value;
  var mu=T.muni.filter(function(x){return x.n===mn})[0]||T.muni[0];

  /* --- 自治体の状況 --- */
  var ideTxt=mu.ide==null
    ? '<span class="v" style="color:var(--ink-3);font-size:15px">データなし</span><span class="d">特別区は本調査の対象外です</span>'
    : '<span class="v">'+mu.ide.toFixed(2)+'<span style="font-size:12px">%</span></span><span class="d">39市町村の平均 '+T.ideAvg.toFixed(2)+'%</span>';
  document.getElementById("tkPlace").innerHTML=
    '<div class="q"><span class="k">住民1人あたりの住民税負担額</span><span class="v">'+fmt(mu.v)+'<span style="font-size:12px">円</span></span><span class="d">都平均 '+fmt(T.tokyoAvg)+'円</span></div>'+
    '<div class="q"><span class="k">都内'+T.muniN+'区市町村での順位</span><span class="v">'+mu.rank+'<span style="font-size:12px"> 位</span></span><span class="d">上位ほど担税力が高い</span></div>'+
    '<div class="q"><span class="k">iDeCo・小規模企業共済等の利用率</span>'+ideTxt+'</div>'+
    '<div class="q"><span class="k">想定した課税所得と税率</span><span class="v">'+inc.rt+'<span style="font-size:12px">%</span></span><span class="d">課税所得 '+fmt(inc.taxable)+'円と仮定（所得税'+inc.it+'%＋住民税10%）</span></div>';

  /* --- 制度ごとの節税額 --- */
  var rows=[];
  if(wk.ideco) rows.push({n:"iDeCo（個人型確定拠出年金）", limit:wk.ideco,
    save:Math.round(wk.ideco*inc.rt/100), kind:"所得控除",
    note:"掛金の全額が所得控除。原則60歳まで引き出せません。"});
  if(wk.kyosai) rows.push({n:"小規模企業共済", limit:wk.kyosai,
    save:Math.round(wk.kyosai*inc.rt/100), kind:"所得控除",
    note:"掛金の全額が所得控除。廃業・退職時に共済金を受け取ります。"});
  var nisa=T.nisaTsumitate;
  rows.push({n:"NISA（つみたて投資枠）", limit:nisa, save:null, kind:"運用益が非課税",
    note:"拠出時の節税はありませんが、運用益にかかる"+T.taxOnGain+"%が非課税になります。いつでも売却できます。"});

  var totalSave=rows.reduce(function(a,b){return a+(b.save||0)},0);
  var totalLimit=rows.reduce(function(a,b){return a+b.limit},0);
  var h='<thead><tr><th>制度</th><th>年間の上限</th><th>1年あたりの節税額</th><th>効き方</th><th class="note">条件</th></tr></thead><tbody>';
  rows.forEach(function(r){
    h+='<tr><td>'+r.n+'</td><td>'+fmt(r.limit)+'円</td>'+
      '<td style="font-weight:600'+(r.save?';color:var(--st-good)':'')+'">'+(r.save==null?"—":"+"+fmt(r.save)+"円")+'</td>'+
      '<td>'+r.kind+'</td><td class="note">'+r.note+'</td></tr>';
  });
  h+='<tr style="border-top:2px solid var(--line-2)"><td style="font-weight:700">合計</td><td style="font-weight:700">'+fmt(totalLimit)+'円</td>'+
     '<td style="font-weight:700;color:var(--st-good)">+'+fmt(totalSave)+'円</td><td>—</td><td class="note">上限まで使った場合</td></tr>';
  host.innerHTML=h+'</tbody>';

  document.getElementById("tkFormula").textContent=
    "節税額の計算式：年間の拠出額 × ( 所得税の限界税率 "+inc.it+"% ＋ 住民税 10% ) = 拠出額 × "+inc.rt+"%。"+
    T.limitNote;

  document.getElementById("toolHero").textContent="+"+fmt(totalSave)+"円";
  document.getElementById("toolHeroNote").textContent=
    mu.n+"／"+inc.k+"／"+wk.k+" の場合。所得控除を上限まで使ったときに、税金が減る額です。";

  /* --- 20年シミュレーション --- */
  var yrs=Math.max(5, Math.min(30, 65-age));
  var monthly=Math.round(totalLimit/12);
  var W=780,H=300,PL=64,PR=178,PT=18,PB=42;
  var rates=[
    {n:"日本国債10年", r:D.jgb.curve[9], c:"--s1", fx:false},
    {n:"米国債10年", r:D.world.us["10"], c:"--s2", fx:true},
    {n:"外貨建て都債", r:D.tosai.fx.rows[0].rate, c:"--s4", fx:true},
    {n:"預金のまま", r:0.2, c:"--rule", fx:false}
  ];
  var host2=document.getElementById("tkSim"); host2.innerHTML="";
  function fv(r){ var m=r/100/12, n=yrs*12;
    return m===0?monthly*n:monthly*((Math.pow(1+m,n)-1)/m); }
  var maxV=Math.max.apply(null,rates.map(function(x){return fv(x.r)}))*1.06;
  var X=function(t){return PL+(W-PL-PR)*t/yrs}, Y=function(v){return PT+(H-PT-PB)*(1-v/maxV)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"積立の推移シミュレーション"});
  var NICE=[1e6,2e6,5e6,1e7,2e7,2.5e7,5e7];
  var step=NICE.filter(function(x){return maxV/x<=6})[0]||1e8;
  for(var v=0;v<=maxV;v+=step){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:Y(v),y2:Y(v),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:Y(v)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},(v/10000).toFixed(0)+"万"));
  }
  for(var t=0;t<=yrs;t+=Math.max(1,Math.round(yrs/6))){
    svg.appendChild(el("text",{x:X(t),y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t+"年"));
  }
  var ends=[];
  rates.forEach(function(x){
    var d="", m=x.r/100/12;
    for(var t=0;t<=yrs;t+=0.25){ var n=t*12;
      var v=m===0?monthly*n:monthly*((Math.pow(1+m,n)-1)/m);
      d+=(d?" L":"M")+X(t)+","+Y(v); }
    svg.appendChild(el("path",{d:d,fill:"none",stroke:css(x.c),"stroke-width":2.2,
      "stroke-dasharray":x.fx?"5 3":""}));
    ends.push({y:Y(fv(x.r)), c:css(x.c), t:x.n+" "+x.r.toFixed(2)+"%", v:fv(x.r), dash:x.fx});
  });
  /* ラベルは2行ぶんの高さが要るので、最低32px空ける */
  ends.sort(function(a,b){return a.y-b.y});
  for(var i=1;i<ends.length;i++) if(ends[i].y-ends[i-1].y<32) ends[i].y=ends[i-1].y+32;
  var over=ends.length?ends[ends.length-1].y-(H-PB-4):0;
  if(over>0) ends.forEach(function(e){ e.y-=over; });
  ends.forEach(function(e){
    svg.appendChild(el("line",{x1:W-PR+6,x2:W-PR+22,y1:e.y,y2:e.y,stroke:e.c,"stroke-width":2.4,
      "stroke-dasharray":e.dash?"4 3":"","stroke-linecap":"round"}));
    svg.appendChild(el("text",{x:W-PR+27,y:e.y+3,fill:css("--ink-2"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},e.t));
    svg.appendChild(el("text",{x:W-PR+27,y:e.y+16,fill:css("--ink-3"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},fmt(Math.round(e.v/10000))+"万円"));
  });
  host2.appendChild(svg);
  legend("tkSimLegend",[["--s1","実線＝円のまま（為替の影響を受けない）"],
    ["--s4","破線＝為替リスクを取る場合"]]);

  document.getElementById("tkSimLede").textContent=
    "上の上限を毎月に割ると月 "+fmt(monthly)+"円。これを"+age+"歳から65歳まで（"+yrs+"年）積み立てた場合です。"+
    "利回りはすべて公開統計の実測値で、将来を予測するものではありません。";
  var base=fv(0.2), best=fv(D.tosai.fx.rows[0].rate), jp=fv(D.jgb.curve[9]);
  document.getElementById("tkOut").innerHTML=
    '<strong>いま動かせる分。</strong>制度を上限まで使うと、税金が減る分だけで年 <b class="big">'+fmt(totalSave)+'円</b>。'+
    yrs+'年ぶんでは '+fmt(totalSave*yrs)+'円になります。これは運用の成績に関係なく確定する部分です。'+
    '<br><br><strong>運用でつく差。</strong>同じ月'+fmt(monthly)+'円を預金のまま置くと'+yrs+'年後に '+fmt(Math.round(base))+'円。'+
    '円のまま国債で運用すると '+fmt(Math.round(jp))+'円（差 +'+fmt(Math.round(jp-base))+'円）。'+
    '為替リスクを取って外貨建てなら '+fmt(Math.round(best))+'円（差 +'+fmt(Math.round(best-base))+'円）ですが、'+
    '円高が進めばこの差は縮み、逆転もします（詳しくはパネル07）。';
  document.getElementById("tkNote").innerHTML=
    "積立の計算は複利・毎月末払い・手数料と税金を考慮しない単純化です。"+
    "利回りの出典：日本国債＝財務省（"+D.jgb.asOf+"）、米国債＝"+D.world.label+"（"+D.world.asOf+"）、"+
    "外貨建て都債＝東京都財務局。"+D.world.note+
    "　制度の詳細は "+T.links.map(function(l){
      return '<a href="'+l[1]+'" target="_blank" rel="noopener">'+l[0]+'</a>'; }).join(" ／ ")+" でご確認ください。";
}

function runLoan(){
  var G=D.rateGap, J=D.jgb;
  var host=document.getElementById("lnMetrics"); if(!host) return;
  var amt=+document.getElementById("lnAmt").value;
  var rate=+document.getElementById("lnRate").value;
  var yrs=+document.getElementById("lnYears").value;
  var band=rate<1?0:(rate<2?1:2);
  var share=G.smeRate[band];
  var spread=rate-J.curve[1];        /* 国債2年との差 */
  var addPerYear=Math.round(amt*0.01);
  host.innerHTML=
    '<div class="metric"><div class="mk">同じ金利帯にいる企業</div><div class="mv">'+share.toFixed(1)+'<span style="font-size:13px">%</span></div><div class="md">'+G.smeRateLabels[band]+'（前回 '+G.smeRatePrev[band].toFixed(1)+'%）</div></div>'+
    '<div class="metric"><div class="mk">国債2年との差</div><div class="mv" style="color:'+(spread<0?"var(--st-warn)":"var(--ink)")+'">'+sgn(spread,2)+'<span style="font-size:13px">pt</span></div><div class="md">国債2年 '+J.curve[1].toFixed(3)+'%（'+J.asOf+'）</div></div>'+
    '<div class="metric"><div class="mk">金利が1%上がったら</div><div class="mv" style="color:var(--st-crit)">+'+fmt(addPerYear)+'<span style="font-size:13px">円/年</span></div><div class="md">'+yrs+'年で +'+fmt(addPerYear*yrs)+'円</div></div>';
  var C=D.corr;
  var best=C.rateScan?C.rateScan.reduce(function(a,b){return Math.abs(b.best.r)>Math.abs(a.best.r)?b:a}):null;
  document.getElementById("lnNote").innerHTML=
    '<strong>読み方。</strong>いまの'+rate.toFixed(1)+'％は、都内中小企業では「'+G.smeRateLabels[band]+'」に入り、回答企業の'+share.toFixed(1)+'％がこの帯にいます。'+
    (spread<0
      ? '国債2年（'+J.curve[1].toFixed(3)+'％）を<strong>下回っています</strong>。制度融資や保証付きなど、金利が抑えられている条件である可能性があります。市場金利が上がるほど、この条件の価値は大きくなります。'
      : '国債2年に対する上乗せは '+spread.toFixed(2)+'ポイントです。')+
    '<br><br><strong>備えるべき金額。</strong>借入'+fmt(amt)+'円で金利が1％上がると、年 '+fmt(addPerYear)+'円、'+yrs+'年で '+fmt(addPerYear*yrs)+'円の追加負担になります。'+
    (best?'本サービスの分析では、金利の影響が景況に表れるまで約'+best.best.lag+'か月かかっていました。いま動くほうが選択肢は多く残ります。':'')+
    '<br><br><strong>次にやること。</strong>変動で借りているなら固定への切替条件を、固定なら借換えの手数料込みの損益を、取引金融機関に確認する。'+
    '信用保証協会の保証付き融資は金利と保証料の合計で比べる。'+
    'パネル06の「相談メモをつくる」に業種と使いみちを入れると、この数字を含んだ相談文が出ます。'+
    '<br><br><span style="color:var(--ink-3)">※ 追加負担額は残高が一定と仮定した単純計算です。元金均等・元利均等など返済方式により実際の金額は変わります。</span>';
}

/* ---------------- 08 数字が制度に返すもの ---------------- */
/* ---------------- 08 打ち手 ---------------- */
function renderActions(){
  var A=D.actions; if(!A) return;
  var host=document.getElementById("actList"); if(!host) return;
  host.innerHTML=A.map(function(a){
    var both=a.to.length>1;
    return '<li>'+a.to.map(function(t){
        return '<span class="tg'+(both?' both':'')+'">'+t+'</span>'; }).join("")+
      '<strong>'+a.name+'</strong>'+a.fact+'　<span style="color:var(--ink-3)">'+a.risk+'</span></li>';
  }).join("");

  document.getElementById("actLimit").innerHTML=
    'これらは<strong>本サービスが計算した数字だけを根拠にした提案</strong>であり、東京都の方針でも、実現可能性を検証した政策案でもありません。'+
    '相関は因果を示すものではなく、費用の試算も制度設計の詰めも行っていません。'+
    '資産形成制度の利用率は特別区（23区）のデータが取れておらず、最も人口の多い地域が測れていない点も未解決です。'+
    '打ち手ごとに留意点を併記しているのは、この提案がどこまで言えてどこから言えないかを、読む側が判断できるようにするためです。';
}
