
(function(){
"use strict";
var D=window.TCB, IND=D.industries, MONTHS=D.meta.months, N=MONTHS.length;
var byFull={}; IND.forEach(function(r){byFull[r.full]=r;});
var SK=D.shokei, SKby={}; SK.rows.forEach(function(r){SKby[r.name]=r;});

function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function el(t,a,c){ var e=document.createElementNS("http://www.w3.org/2000/svg",t);
  if(a) for(var k in a) e.setAttribute(k,a[k]);
  if(c!=null) e.textContent=c; return e; }
function fmt(n,d){ if(n==null||isNaN(n)) return "—"; return Number(n).toLocaleString("ja-JP",{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); }
function sgn(n,d){ if(n==null) return "—"; return (Number(n)>0?"+":"")+Number(n).toFixed(d==null?1:d); }
function ymJa(v){ var s=String(v); return s.slice(0,4)+"年"+parseInt(s.slice(4),10)+"月"; }
function hex2rgb(h){ h=h.replace("#",""); if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function mix(a,b,t){ var A=hex2rgb(a),B=hex2rgb(b);
  return "rgb("+Math.round(A[0]+(B[0]-A[0])*t)+","+Math.round(A[1]+(B[1]-A[1])*t)+","+Math.round(A[2]+(B[2]-A[2])*t)+")"; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function isDark(){ return css("--mode")==="dark"; }

var RAMP={
  light:{ neg:["#eceef2","#f7cfc9","#e89189","#cf4f47","#9d201b","#5f100d"],
          pos:["#eceef2","#cde2fb","#86b6ef","#2a78d6","#184f95"] },
  dark:{  neg:["#2b3644","#523039","#7a2c2c","#ab3a34","#dc5f56","#f38b80"],
          pos:["#2b3644","#22405f","#25588f","#3987e5","#7cb8f2"] }
};
var ORD={
  age:{ light:["#86b6ef","#5598e7","#2a78d6","#1c5cab","#104281"],
        dark: ["#184f95","#256abf","#3987e5","#6da7ec","#9ec5f4"] },
  fnd:{ light:["#8c3714","#c04d1f","#eb6834","#f0a271","#f7c9a8","#fbe4d3"],
        dark: ["#f2a97f","#e8814f","#d95926","#a34418","#7a3312","#54230c"] }
};
function ordScale(k){ return ORD[k][isDark()?"dark":"light"]; }
function rampColor(stops,t){ t=clamp(t,0,1); var n=stops.length-1, i=Math.min(Math.floor(t*n),n-1);
  return mix(stops[i],stops[i+1],t*n-i); }
function diColor(v){ if(v==null) return css("--surface-2");
  var R=RAMP[isDark()?"dark":"light"];
  return v<0 ? rampColor(R.neg,-v/70) : rampColor(R.pos,v/25); }

var STATUS={
  growth:{c:"--st-good",ic:"▲",label:"成長局面"},
  capex:{c:"--st-good",ic:"■",label:"投資可能"},
  neutral:{c:"--rule",ic:"—",label:"中立"},
  cost:{c:"--st-warn",ic:"!",label:"要注意"},
  defense:{c:"--st-crit",ic:"!!",label:"要支援"}
};

var tip=document.getElementById("tip");
function showTip(x,y,html){ tip.innerHTML=html; tip.style.opacity="1";
  var r=tip.getBoundingClientRect(), left=x+14, top=y-r.height-12;
  if(left+r.width>window.innerWidth-8) left=x-r.width-14;
  if(top<8) top=y+18;
  tip.style.left=left+"px"; tip.style.top=top+"px"; }
function hideTip(){ tip.style.opacity="0"; }
function legend(id,items){ var h=document.getElementById(id); if(!h) return; h.innerHTML="";
  items.forEach(function(it){ var s=document.createElement("span"); s.className="it";
    var sw=document.createElement("span"); sw.className="sw"+(it[2]?" "+it[2]:"");
    sw.style.background=it[0].charAt(0)==="-"?css(it[0]):it[0]; s.appendChild(sw);
    s.appendChild(document.createTextNode(it[1])); h.appendChild(s); }); }

var EVENTS=[{m:200809,t:"リーマン"},{m:201103,t:"震災"},{m:201404,t:"増税"},{m:202004,t:"コロナ"},{m:202203,t:"物価高"}];
function drawHero(){
  var host=document.getElementById("heroChart"); host.innerHTML="";
  var W=1100,H=210,PL=44,PR=14,PT=16,PB=26;
  var g=byFull["全体"].gyokyo, vals=g.filter(function(v){return v!=null});
  var lo=Math.floor(Math.min.apply(null,vals)/10)*10, hi=Math.ceil(Math.max(Math.max.apply(null,vals),5)/10)*10;
  var x=function(i){return PL+(W-PL-PR)*i/(N-1)}, y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"都内中小企業 業況DI の2005年5月以降の推移"});
  for(var t=lo;t<=hi;t+=20){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css(t===0?"--axis":"--grid"),"stroke-width":t===0?1.5:1}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t));
  }
  EVENTS.forEach(function(e){ var i=MONTHS.indexOf(e.m); if(i<0) return;
    svg.appendChild(el("line",{x1:x(i),x2:x(i),y1:PT,y2:H-PB,stroke:css("--line-2"),"stroke-dasharray":"2 3"}));
    svg.appendChild(el("text",{x:x(i)+4,y:PT+11,fill:css("--ink-3"),"font-size":9.5,"font-family":"IBM Plex Mono, monospace"},e.t)); });
  var dA="M"+x(0)+","+y(0), dL="";
  for(var i=0;i<N;i++){ if(g[i]==null) continue;
    dA+=" L"+x(i).toFixed(1)+","+y(g[i]).toFixed(1);
    dL+=(dL?" L":"M")+x(i).toFixed(1)+","+y(g[i]).toFixed(1); }
  dA+=" L"+x(N-1)+","+y(0)+" Z";
  svg.appendChild(el("path",{d:dA,fill:css("--dv-neg"),opacity:.13}));
  svg.appendChild(el("path",{d:dL,fill:"none",stroke:css("--dv-neg"),"stroke-width":2,"stroke-linejoin":"round"}));
  svg.appendChild(el("circle",{cx:x(N-1),cy:y(g[N-1]),r:4,fill:css("--dv-neg"),stroke:css("--surface"),"stroke-width":2}));
  for(var k=0;k<N;k+=24) svg.appendChild(el("text",{x:x(k),y:H-8,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},String(MONTHS[k]).slice(0,4)));
  var hl=el("line",{x1:0,x2:0,y1:PT,y2:H-PB,stroke:css("--ink-3"),opacity:0}); svg.appendChild(hl);
  var hit=el("rect",{x:PL,y:PT,width:W-PL-PR,height:H-PT-PB,fill:"transparent"}); svg.appendChild(hit);
  hit.addEventListener("mousemove",function(ev){ var b=svg.getBoundingClientRect();
    var i=clamp(Math.round(((ev.clientX-b.left)/b.width*W-PL)/(W-PL-PR)*(N-1)),0,N-1);
    hl.setAttribute("x1",x(i)); hl.setAttribute("x2",x(i)); hl.setAttribute("opacity",.55);
    showTip(ev.clientX,ev.clientY,'<div class="th">'+ymJa(MONTHS[i])+'</div><div class="tr"><span>業況DI（全体）</span><b>'+(g[i]==null?"—":g[i])+'</b></div>'); });
  hit.addEventListener("mouseleave",function(){ hl.setAttribute("opacity",0); hideTip(); });
  host.appendChild(svg);
}

function stacked(hostId,legendId,rows,labels,key,ordKey,highlightIdx){
  var host=document.getElementById(hostId); host.innerHTML="";
  var LW=92, W=560, RH=24, PT=6, RIGHT=54, H=PT+rows.length*RH+6;
  var cols=ordScale(ordKey);
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":hostId});
  rows.forEach(function(r,i){
    var yy=PT+i*RH, x0=LW, tot=0;
    r[key].forEach(function(v){tot+=v;});
    if(r.kind==="size"&&rows[i-1]&&rows[i-1].kind!=="size")
      svg.appendChild(el("line",{x1:0,x2:W-RIGHT,y1:yy-1,y2:yy-1,stroke:css("--line-2"),"stroke-dasharray":"3 3"}));
    svg.appendChild(el("text",{x:0,y:yy+RH/2+4,fill:css(r.kind==="total"?"--ink":"--ink-2"),
      "font-size":11.5,"font-weight":r.kind==="total"?700:400,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.name));
    r[key].forEach(function(v,j){
      var w=(W-LW-RIGHT)*v/tot;
      var rr=el("rect",{x:x0,y:yy+4,width:Math.max(w-2,0.5),height:RH-10,fill:cols[j],rx:2});
      rr.addEventListener("mouseenter",function(ev){
        var h='<div class="th">'+r.name+'（n='+r.n+'）</div>';
        r[key].forEach(function(vv,jj){ h+='<div class="tr"><span>'+labels[jj]+'</span><b>'+vv.toFixed(1)+'%</b></div>'; });
        showTip(ev.clientX,ev.clientY,h); });
      rr.addEventListener("mouseleave",hideTip);
      svg.appendChild(rr); x0+=w;
    });
    svg.appendChild(el("text",{x:W-RIGHT+8,y:yy+RH/2+4,fill:css("--ink"),"font-size":11.5,
      "font-weight":600,"font-family":"IBM Plex Mono, monospace"},r[key][highlightIdx].toFixed(1)+"%"));
  });
  host.appendChild(svg);
  if(legendId) legend(legendId,labels.map(function(l,j){return [cols[j],l,"box"]}));
}

function singleStack(hostId,legendId,labels,values,ordKey){
  var host=document.getElementById(hostId); host.innerHTML="";
  var W=520,H=94,PT=6,BH=34;
  var cols=ordScale(ordKey), tot=0; values.forEach(function(v){tot+=v});
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":hostId});
  var x0=0;
  values.forEach(function(v,j){
    var w=W*v/tot;
    var rr=el("rect",{x:x0,y:PT,width:Math.max(w-2,0.5),height:BH,fill:cols[j],rx:2});
    rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,'<div class="th">'+labels[j]+'</div><div class="tr"><span>構成比</span><b>'+v.toFixed(1)+'%</b></div>'); });
    rr.addEventListener("mouseleave",hideTip);
    svg.appendChild(rr);
    if(w>56){
      svg.appendChild(el("text",{x:x0+w/2-1,y:PT+BH+18,"text-anchor":"middle",fill:css("--ink"),"font-size":13,"font-weight":600,"font-family":"IBM Plex Mono, monospace"},v.toFixed(1)+"%"));
      svg.appendChild(el("text",{x:x0+w/2-1,y:PT+BH+33,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},labels[j]));
    }
    x0+=w;
  });
  host.appendChild(svg);
  legend(legendId,labels.map(function(l,j){return [cols[j],l,"box"]}));
}

function drawUrgency(){
  document.getElementById("urgFormula").innerHTML=SK.formula+"<br>"+
    "<strong>横棒1本が1区分の値そのもので、平均ではありません。</strong>"+
    "帯の左側が 0.6×（経営者70歳以上の割合）、右側が 0.4×（1960年以前創業の割合）で、"+
    "2つを足した長さが承継緊急度です。"+
    "母集団は同一（回答企業1,283社）で、業種別と規模別は同じ集団を切り直したもの。"+
    "先頭の「全体」は1,283社そのものの値で、下に並ぶ各区分を平均したものではありません。";
  var rows=SK.rows.slice();
  var host=document.getElementById("urgChart"); host.innerHTML="";
  var LW=98, W=680, RH=26, PT=22, RIGHT=54, H=PT+rows.length*RH+10;
  var maxU=Math.ceil(Math.max.apply(null,rows.map(function(r){return r.urgency}))/5)*5;
  var x=function(v){return LW+(W-LW-RIGHT)*v/maxU};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"業種別・規模別の承継緊急度"});
  for(var t=0;t<=maxU;t+=10){
    svg.appendChild(el("line",{x1:x(t),x2:x(t),y1:PT-6,y2:H-8,stroke:css(t===0?"--axis":"--grid")}));
    svg.appendChild(el("text",{x:x(t),y:PT-11,"text-anchor":"middle",fill:css("--ink-3"),"font-size":9.5,"font-family":"IBM Plex Mono, monospace"},t));
  }
  var c1=ordScale("age")[4], c2=ordScale("fnd")[2];
  rows.forEach(function(r,i){
    var yy=PT+i*RH;
    if(r.kind==="size"&&rows[i-1].kind!=="size")
      svg.appendChild(el("line",{x1:0,x2:W-RIGHT,y1:yy-3,y2:yy-3,stroke:css("--line-2"),"stroke-dasharray":"3 3"}));
    svg.appendChild(el("text",{x:0,y:yy+16,fill:css(r.kind==="total"?"--ink":"--ink-2"),"font-size":11.5,
      "font-weight":r.kind==="total"?700:400,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.name));
    var a=0.6*r.old70, b=0.4*r.pre1960;
    var r1=el("rect",{x:LW,y:yy+5,width:Math.max(x(a)-LW,1),height:14,fill:c1,rx:2});
    var r2=el("rect",{x:x(a)+1,y:yy+5,width:Math.max(x(a+b)-x(a)-2,1),height:14,fill:c2,rx:2});
    [r1,r2].forEach(function(rr){
      rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
        '<div class="th">'+r.name+'（n='+r.n+'）</div>'+
        '<div class="tr"><span>承継緊急度</span><b>'+r.urgency.toFixed(1)+'</b></div>'+
        '<div class="tr"><span>経営者70歳以上</span><b>'+r.old70.toFixed(1)+'%</b></div>'+
        '<div class="tr"><span>経営者60歳以上</span><b>'+r.over60.toFixed(1)+'%</b></div>'+
        '<div class="tr"><span>1960年以前創業</span><b>'+r.pre1960.toFixed(1)+'%</b></div>'+
        '<div class="tr"><span>1980年以前創業</span><b>'+r.pre1980.toFixed(1)+'%</b></div>'); });
      rr.addEventListener("mouseleave",hideTip);
    });
    svg.appendChild(r1); svg.appendChild(r2);
    svg.appendChild(el("text",{x:x(a+b)+8,y:yy+16,fill:css("--ink"),"font-size":11.5,"font-weight":600,"font-family":"IBM Plex Mono, monospace"},r.urgency.toFixed(1)));
  });
  host.appendChild(svg);
  legend("urgLegend",[[c1,"0.6 × 経営者70歳以上の割合","box"],[c2,"0.4 × 1960年以前創業の割合","box"]]);
}

function drawScatter(){
  var names=["製造業","卸売業","小売業","サービス業"];
  var pts=names.map(function(n){ return {n:n,u:SKby[n].urgency,d:byFull[n].diag.L,old:SKby[n].old70,tag:byFull[n].diag.tag,type:byFull[n].diag.type}; });
  var all={u:SKby["全体"].urgency,d:byFull["全体"].diag.L};
  var host=document.getElementById("scatterChart"); host.innerHTML="";
  var W=720,H=320,PL=56,PR=24,PT=18,PB=46;
  var xlo=-40,xhi=-8, ylo=26,yhi=46;
  var X=function(v){return PL+(W-PL-PR)*(v-xlo)/(xhi-xlo)}, Y=function(v){return PT+(H-PT-PB)*(yhi-v)/(yhi-ylo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"承継緊急度と業況DIの関係"});
  for(var t=ylo;t<=yhi;t+=5){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:Y(t),y2:Y(t),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:Y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t));
  }
  for(var v=xlo;v<=xhi;v+=8){
    svg.appendChild(el("line",{x1:X(v),x2:X(v),y1:PT,y2:H-PB,stroke:css("--grid")}));
    svg.appendChild(el("text",{x:X(v),y:H-PB+16,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},v));
  }
  svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:Y(all.u),y2:Y(all.u),stroke:css("--line-2"),"stroke-dasharray":"4 3"}));
  svg.appendChild(el("line",{x1:X(all.d),x2:X(all.d),y1:PT,y2:H-PB,stroke:css("--line-2"),"stroke-dasharray":"4 3"}));
  svg.appendChild(el("text",{x:W-PR-4,y:Y(all.u)-6,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},"全体 緊急度 "+all.u.toFixed(1)));
  svg.appendChild(el("text",{x:X(all.d)+5,y:PT+11,fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},"全体 DI "+all.d.toFixed(1)));
  pts.forEach(function(p){
    var col=css(STATUS[p.type].c);
    var c=el("circle",{cx:X(p.d),cy:Y(p.u),r:9,fill:col,opacity:.9,stroke:css("--surface"),"stroke-width":2});
    c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+p.n+'</div><div class="tr"><span>承継緊急度</span><b>'+p.u.toFixed(1)+'</b></div>'+
      '<div class="tr"><span>経営者70歳以上</span><b>'+p.old.toFixed(1)+'%</b></div>'+
      '<div class="tr"><span>業況DI</span><b>'+p.d.toFixed(1)+'</b></div>'+
      '<div class="tr"><span>資金タイプ</span><b>'+p.tag+'</b></div>'); });
    c.addEventListener("mouseleave",hideTip);
    svg.appendChild(c);
    svg.appendChild(el("text",{x:X(p.d),y:Y(p.u)-15,"text-anchor":"middle",fill:css("--ink"),"font-size":12,"font-weight":700,"font-family":'"Zen Kaku Gothic New",sans-serif'},p.n));
  });
  svg.appendChild(el("text",{x:(PL+W-PR)/2,y:H-10,"text-anchor":"middle",fill:css("--ink-3"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},"← 業況DI（直近3か月平均）　事業の体力がある →"));
  svg.appendChild(el("text",{x:0,y:PT-4,fill:css("--ink-3"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},"↑ 承継緊急度"));
  host.appendChild(svg);
}

function drawArea(){
  document.getElementById("areaNote").textContent=SK.areaNote;
  var host=document.getElementById("areaChart"); host.innerHTML="";
  var L=SK.areaLabels, V=SK.areaShare;
  var W=760,H=96,PL=8,PT=6,BH=34, tot=0;
  V.forEach(function(v){tot+=v});
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"回答企業の所在地構成"});
  /* 地域は順序のない区分なので単一色の構成比バーとし、識別はラベルが担う */
  var col=css("--s1"), x0=PL;
  V.forEach(function(v,j){
    var w=(W-PL*2)*v/tot;
    var rr=el("rect",{x:x0,y:PT,width:Math.max(w-2,1),height:BH,fill:col,rx:2,opacity:.88});
    rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,'<div class="th">'+L[j]+'</div><div class="tr"><span>構成比</span><b>'+v.toFixed(1)+'%</b></div>'); });
    rr.addEventListener("mouseleave",hideTip);
    svg.appendChild(rr);
    svg.appendChild(el("text",{x:x0+w/2-1,y:PT+BH+18,"text-anchor":"middle",fill:css("--ink"),"font-size":13,"font-weight":600,"font-family":"IBM Plex Mono, monospace"},v.toFixed(1)+"%"));
    svg.appendChild(el("text",{x:x0+w/2-1,y:PT+BH+34,"text-anchor":"middle",fill:css("--ink-3"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},L[j]));
    x0+=w;
  });
  host.appendChild(svg);
}

var YEARS=[]; (function(){ for(var y=2005;y<=2026;y++) YEARS.push(y); })();
function yearAvg(arr,yy){ var s=0,n=0;
  for(var i=0;i<N;i++){ if(Math.floor(MONTHS[i]/100)===yy&&arr[i]!=null){s+=arr[i];n++;} }
  return n?s/n:null; }
var HEAT=null;
function drawHeat(){
  if(!HEAT) HEAT=IND.map(function(r){ return {full:r.full,level:r.level,name:r.name,
    row:YEARS.map(function(yy){return yearAvg(r.gyokyo,yy)})}; });
  var host=document.getElementById("heatChart"); host.innerHTML="";
  var LW=176,CW=30,CH=19,GAP=2,PT=30,PB=6;
  var W=LW+YEARS.length*CW+8, H=PT+HEAT.length*(CH+GAP)+PB;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,width:W,role:"img","aria-label":"業種別・年別の業況DIヒートマップ"});
  svg.setAttribute("style","min-width:"+W+"px;max-width:100%");
  YEARS.forEach(function(yy,j){ if(yy%2===1) return;
    svg.appendChild(el("text",{x:LW+j*CW+CW/2,y:PT-9,"text-anchor":"middle",fill:css("--ink-3"),"font-size":9.5,"font-family":"IBM Plex Mono, monospace"},String(yy).slice(2))); });
  HEAT.forEach(function(r,i){
    var y0=PT+i*(CH+GAP);
    svg.appendChild(el("text",{x:r.level?14:2,y:y0+CH-5,fill:css(r.level?"--ink-2":"--ink"),"font-size":11.5,
      "font-weight":r.level?400:700,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.level?r.name:r.full));
    r.row.forEach(function(v,j){
      var c=el("rect",{x:LW+j*CW,y:y0,width:CW-2,height:CH,fill:diColor(v),rx:2,stroke:css("--surface"),"stroke-width":1});
      c.style.cursor="pointer";
      c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,'<div class="th">'+r.full+' / '+YEARS[j]+'年</div><div class="tr"><span>業況DI 年平均</span><b>'+(v==null?"—":v.toFixed(1))+'</b></div>'); });
      c.addEventListener("mouseleave",hideTip);
      c.addEventListener("click",function(){ document.getElementById("dgInd").value=r.full;
        renderDiag(); document.querySelector('.lens-btn[data-lens="3"]').click(); });
      svg.appendChild(c);
    });
  });
  host.appendChild(svg);
  var lg=document.getElementById("heatLegend"); lg.innerHTML="";
  var strip=document.createElement("span"); strip.className="it";
  strip.innerHTML='<span style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--ink-3)">-70</span>';
  var bar=document.createElement("span");
  bar.style.cssText="display:inline-block;height:12px;width:150px;border:1px solid var(--line-2);background:linear-gradient(90deg,"+[-70,-56,-42,-28,-14,0,8,16,25].map(diColor).join(",")+")";
  strip.appendChild(bar);
  var e2=document.createElement("span"); e2.style.cssText="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--ink-3)"; e2.textContent="+25";
  strip.appendChild(e2);
  var lab=document.createElement("span"); lab.style.cssText="font-size:12px;color:var(--ink-2)"; lab.textContent="業況DI（年平均）／ 中央の無彩色が 0";
  lg.appendChild(strip); lg.appendChild(lab);
}

function drawRatio(){
  var f=D.finance.ratio, host=document.getElementById("ratioChart"); host.innerHTML="";
  var W=520,H=190,PL=44,PR=96,PT=14,PB=28;
  var all=f.bank.concat(f.shinkin);
  var lo=Math.floor(Math.min.apply(null,all)/5)*5-2, hi=Math.ceil(Math.max.apply(null,all)/5)*5+2;
  var x=function(i){return PL+(W-PL-PR)*i/(f.years.length-1)}, y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"銀行と信用金庫の預貸率の推移"});
  for(var t=lo;t<=hi;t+=5){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t+"%"));
  }
  [["bank","--s1","銀行"],["shinkin","--s2","信用金庫"]].forEach(function(s){
    var d="",col=css(s[1]);
    f[s[0]].forEach(function(v,i){ d+=(d?" L":"M")+x(i)+","+y(v); });
    svg.appendChild(el("path",{d:d,fill:"none",stroke:col,"stroke-width":2}));
    f[s[0]].forEach(function(v,i){
      var c=el("circle",{cx:x(i),cy:y(v),r:4,fill:col,stroke:css("--surface"),"stroke-width":2});
      c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,'<div class="th">'+f.years[i]+'年度末</div><div class="tr"><span>'+s[2]+' 預貸率</span><b>'+v+'%</b></div>'); });
      c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
    });
    var lv=f[s[0]][f[s[0]].length-1];
    svg.appendChild(el("line",{x1:W-PR+6,x2:W-PR+16,y1:y(lv),y2:y(lv),stroke:col,"stroke-width":3,"stroke-linecap":"round"}));
    svg.appendChild(el("text",{x:W-PR+21,y:y(lv)+4,fill:css("--ink-2"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},s[2]+" "+lv+"%"));
  });
  f.years.forEach(function(yy,i){ svg.appendChild(el("text",{x:x(i),y:H-9,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},yy)); });
  host.appendChild(svg);
  legend("ratioLegend",[["--s1","銀行 預貸率（15-1）"],["--s2","信用金庫 預貸率（15-2）"]]);
}

function drawSubro(){
  var f=D.finance.hosho, host=document.getElementById("subroChart"); host.innerHTML="";
  var W=520,H=190,PL=52,PR=16,PT=18,PB=28;
  var hi=Math.ceil(Math.max.apply(null,f.subroCases)/1000)*1000;
  var bw=(W-PL-PR)/f.years.length, y=function(v){return PT+(H-PT-PB)*(1-v/hi)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"東京信用保証協会の代位弁済件数の推移"});
  for(var t=0;t<=hi;t+=2000){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css(t===0?"--axis":"--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},fmt(t)));
  }
  f.subroCases.forEach(function(v,i){
    var last=(i===f.subroCases.length-1), w=bw-14, xx=PL+bw*i+7;
    var r=el("rect",{x:xx,y:y(v),width:w,height:Math.max((H-PT-PB)*v/hi,1),fill:css(last?"--st-crit":"--dv-neg"),opacity:last?1:.5,rx:3});
    r.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,'<div class="th">'+f.years[i]+'年度</div><div class="tr"><span>代位弁済 件数</span><b>'+fmt(v)+'</b></div><div class="tr"><span>保証承諾 件数</span><b>'+fmt(f.guarCases[i])+'</b></div>'); });
    r.addEventListener("mouseleave",hideTip); svg.appendChild(r);
    svg.appendChild(el("text",{x:xx+w/2,y:y(v)-6,"text-anchor":"middle",fill:css("--ink-2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},fmt(v)));
    svg.appendChild(el("text",{x:xx+w/2,y:H-9,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},f.years[i]));
  });
  host.appendChild(svg);
  // 過年度の棒は同じ色を50%の濃さで描いているので、凡例の見本も同じ濃さに合わせる
  legend("subroLegend",[["--st-crit",f.years[f.years.length-1]+"年度（直近）","box"],
    ["color-mix(in srgb, "+css("--dv-neg")+" 50%, "+css("--surface")+")",
     f.years[0]+"〜"+f.years[f.years.length-2]+"年度","box"]]);
  var nEl=document.getElementById("subroNote");
  if(nEl){
    var p=f.partial, last=f.years[f.years.length-1];
    nEl.innerHTML=(f.label||"")+
      "。"+f.years[0]+"〜2023年度は東京都統計年鑑、"+last+"年度は同協会の事業概況から追加しています"+
      (f.srcUrl?'（<a href="'+f.srcUrl+'" target="_blank" rel="noopener">出典</a>）':"")+"。"+
      (p?" "+p.note:"");
  }
}

function drawHosho(){
  var f=D.finance.hosho, host=document.getElementById("hoshoChart"); host.innerHTML="";
  var SER=[{k:"guarCases",c:"--s1",n:"保証承諾"},{k:"subroCases",c:"--st-crit",n:"代位弁済"}];
  SER.forEach(function(s){ s.idx=f[s.k].map(function(v){return v/f[s.k][0]*100}); });
  var W=520,H=190,PL=44,PR=96,PT=14,PB=28;
  var hi=Math.ceil(Math.max.apply(null,SER[0].idx.concat(SER[1].idx))/50)*50;
  var x=function(i){return PL+(W-PL-PR)*i/(f.years.length-1)}, y=function(v){return PT+(H-PT-PB)*(hi-v)/hi};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"保証承諾と代位弁済の指数（2019年度=100）"});
  for(var t=0;t<=hi;t+=100){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css(t===100?"--axis":"--grid"),"stroke-width":t===100?1.5:1}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":9.5,"font-family":"IBM Plex Mono, monospace"},t));
  }
  var lbl=[];
  SER.forEach(function(s){
    var d=""; s.idx.forEach(function(v,i){ d+=(d?" L":"M")+x(i)+","+y(v); });
    svg.appendChild(el("path",{d:d,fill:"none",stroke:css(s.c),"stroke-width":2}));
    s.idx.forEach(function(v,i){
      var c=el("circle",{cx:x(i),cy:y(v),r:3.5,fill:css(s.c),stroke:css("--surface"),"stroke-width":2});
      c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,'<div class="th">'+f.years[i]+'年度</div><div class="tr"><span>'+s.n+'</span><b>'+fmt(f[s.k][i])+'件</b></div><div class="tr"><span>2019年度=100</span><b>'+v.toFixed(0)+'</b></div>'); });
      c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
    });
    lbl.push({y:y(s.idx[s.idx.length-1]),c:css(s.c),t:s.n+" "+s.idx[s.idx.length-1].toFixed(0)});
  });
  lbl.sort(function(a,b){return a.y-b.y}); if(lbl[1].y-lbl[0].y<14) lbl[1].y=lbl[0].y+14;
  lbl.forEach(function(L){
    svg.appendChild(el("line",{x1:W-PR+6,x2:W-PR+16,y1:L.y,y2:L.y,stroke:L.c,"stroke-width":3,"stroke-linecap":"round"}));
    svg.appendChild(el("text",{x:W-PR+21,y:L.y+4,fill:css("--ink-2"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},L.t));
  });
  f.years.forEach(function(yy,i){ svg.appendChild(el("text",{x:x(i),y:H-9,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},yy)); });
  host.appendChild(svg);
  legend("hoshoLegend",[["--s1","保証承諾件数（指数）"],["--st-crit","代位弁済件数（指数）"]]);
}

function drawShikin(){
  var S=D.shikin;
  document.getElementById("shikinLede").textContent=
    "「事業資金に関する調査」（令和8年5月）より。回答企業が実際に何のために、どの金利で資金を求めているか。"+S.bankNote;
  document.getElementById("shikinMetrics").innerHTML=
    '<div class="metric"><div class="mk">資金需要DI（今後3か月）</div><div class="mv" style="color:var(--accent)">'+S.demandDI.toFixed(1)+'</div><div class="md">前回 '+S.demandDIPrev.toFixed(1)+'</div></div>'+
    '<div class="metric"><div class="mk">借入金利「上昇」</div><div class="mv" style="color:var(--st-crit)">'+S.rateTrend[0].toFixed(1)+'<span style="font-size:13px">%</span></div><div class="md">金利2％台が '+S.rate[2].toFixed(1)+'%（前回 '+S.ratePrev[2].toFixed(1)+'%）</div></div>'+
    '<div class="metric"><div class="mk">コスト増の最大要因</div><div class="mv" style="font-size:15px">'+S.costTop+'</div><div class="md">'+S.costTopPct.toFixed(1)+'%（製造業 '+S.costTopMfg.toFixed(1)+'%）</div></div>';
  var host=document.getElementById("shikinChart"); host.innerHTML="";
  var groups=[{t:"資金使途（増加分）",l:S.useLabels,v:S.use,c:"--s1"},
              {t:"調達手段（増加分）",l:S.sourceLabels,v:S.source,c:"--s3"},
              {t:"主な取引金融機関",l:S.bankLabels,v:S.bank,c:"--s2"}];
  var W=520, RH=20, GH=24, H=0;
  groups.forEach(function(g){ H+=GH+g.v.length*RH+8; });
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"資金使途・調達手段・取引金融機関の構成比"});
  var yy=0, LW=104, RIGHT=46;
  groups.forEach(function(g){
    svg.appendChild(el("text",{x:0,y:yy+13,fill:css("--ink"),"font-size":12,"font-weight":700,"font-family":'"Zen Kaku Gothic New",sans-serif'},g.t));
    yy+=GH;
    g.v.forEach(function(v,i){
      svg.appendChild(el("text",{x:0,y:yy+14,fill:css("--ink-2"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},g.l[i]));
      var w=(W-LW-RIGHT)*v/70;
      var rr=el("rect",{x:LW,y:yy+4,width:Math.max(w,2),height:13,fill:css(g.c),opacity:.85,rx:3});
      rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,'<div class="th">'+g.t+'</div><div class="tr"><span>'+g.l[i]+'</span><b>'+v.toFixed(1)+'%</b></div>'); });
      rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
      svg.appendChild(el("text",{x:LW+Math.max(w,2)+6,y:yy+15,fill:css("--ink-2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},v.toFixed(1)+"%"));
      yy+=RH;
    });
    yy+=8;
  });
  host.appendChild(svg);
  legend("shikinLegend",[["--s1","資金使途","box"],["--s3","調達手段","box"],["--s2","取引金融機関","box"]]);
}

function drawKakei(){
  var k=D.finance.kakei, last=k.years.length-1;
  var surplus=k.years.map(function(_,i){return k.kashobun[i]-k.shohishishutsu[i]});
  document.getElementById("kakeiTiles").innerHTML=
    '<div class="tile"><span class="k">実収入 / 月</span><span class="v">'+fmt(k.jitsushunyu[last])+'</span><span class="d">円（'+k.years[last]+'年・世帯人員'+k.persons[last]+'人）</span></div>'+
    '<div class="tile"><span class="k">可処分所得 / 月</span><span class="v">'+fmt(k.kashobun[last])+'</span><span class="d">円（税・社会保険料を除いた手取り）</span></div>'+
    '<div class="tile"><span class="k">消費支出 / 月</span><span class="v">'+fmt(k.shohishishutsu[last])+'</span><span class="d">円（生活に使った金額）</span></div>'+
    '<div class="tile"><span class="k">差引き残る額 / 月</span><span class="v" style="color:var(--accent)">'+fmt(surplus[last])+'</span><span class="d">円。この行き先が問題です</span></div>';
  document.getElementById("inlineSurplus").textContent=fmt(surplus[last]);
  document.getElementById("surplus2").textContent=fmt(surplus[last]);
  var host=document.getElementById("kakeiChart"); host.innerHTML="";
  var W=760,H=200,PL=56,PR=16,PT=18,PB=28;
  var hi=Math.ceil(Math.max.apply(null,k.kashobun)/100000)*100000;
  var bw=(W-PL-PR)/k.years.length, y=function(v){return PT+(H-PT-PB)*(1-v/hi)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"都内勤労者世帯の可処分所得・消費支出・残額の推移"});
  for(var t=0;t<=hi;t+=100000){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css(t===0?"--axis":"--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":9.5,"font-family":"IBM Plex Mono, monospace"},(t/10000)+"万"));
  }
  k.years.forEach(function(yy,i){
    var x0=PL+bw*i+10, w=bw-30;
    var rc=el("rect",{x:x0,y:y(k.shohishishutsu[i]),width:w,height:(H-PT-PB)*k.shohishishutsu[i]/hi,fill:css("--s2"),opacity:.72,rx:3});
    var rs=el("rect",{x:x0,y:y(k.kashobun[i]),width:w,height:Math.max((H-PT-PB)*surplus[i]/hi-2,1),fill:css("--s1"),rx:3});
    [rc,rs].forEach(function(p){ p.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+yy+'年</div><div class="tr"><span>可処分所得</span><b>'+fmt(k.kashobun[i])+'</b></div><div class="tr"><span>消費支出</span><b>'+fmt(k.shohishishutsu[i])+'</b></div><div class="tr"><span>差引き残る額</span><b>'+fmt(surplus[i])+'</b></div>'); });
      p.addEventListener("mouseleave",hideTip); });
    svg.appendChild(rc); svg.appendChild(rs);
    svg.appendChild(el("text",{x:x0+w/2,y:y(k.kashobun[i])-6,"text-anchor":"middle",fill:css("--ink-2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},fmt(surplus[i])));
    svg.appendChild(el("text",{x:x0+w/2,y:H-9,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},yy));
  });
  host.appendChild(svg);
  legend("kakeiLegend",[["--s1","差引き残る額（可処分所得−消費支出）","box"],["--s2","消費支出","box"]]);
}

var REACH={reaches:"届く",indirect:"間接的に届く",mismatch:"制度はあるが噛み合わない",blocked:"届かない"};
function drawRoutes(){
  document.getElementById("routeList").innerHTML=D.routes.map(function(r){
    return '<li class="'+r.reach+'"><div><div class="rname">'+r.name+
      ' <span class="tagr '+r.reach+'">'+REACH[r.reach]+'</span></div>'+
      '<div class="rmeta">形態：'+r.kind+'<br>最低額：'+r.min+'<br>上限：'+r.cap+'</div></div>'+
      '<div class="rnote">'+r.note+'</div></li>';
  }).join("");
}

function drawYoung(){
  var rows=SK.rows.filter(function(r){return r.kind!=="total"});
  var host=document.getElementById("youngChart"); host.innerHTML="";
  var LW=88,W=470,RH=24,PT=6,RIGHT=92,H=PT+rows.length*RH+6, maxV=50;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"経営者が40歳代以下の割合と70歳以上の割合"});
  var cOld=ordScale("age")[4];
  rows.forEach(function(r,i){
    var yy=PT+i*RH;
    if(r.kind==="size"&&rows[i-1].kind!=="size")
      svg.appendChild(el("line",{x1:0,x2:W-RIGHT,y1:yy-1,y2:yy-1,stroke:css("--line-2"),"stroke-dasharray":"3 3"}));
    svg.appendChild(el("text",{x:0,y:yy+16,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.name));
    var w1=(W-LW-RIGHT)*r.young/maxV, w2=(W-LW-RIGHT)*r.old70/maxV;
    var b2=el("rect",{x:LW,y:yy+5,width:Math.max(w2,1),height:14,fill:cOld,opacity:.32,rx:2});
    var b1=el("rect",{x:LW,y:yy+8,width:Math.max(w1,1),height:8,fill:css("--st-good"),rx:2});
    [b1,b2].forEach(function(b){ b.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
      '<div class="th">'+r.name+'（n='+r.n+'）</div><div class="tr"><span>40歳代以下</span><b>'+r.young.toFixed(1)+'%</b></div><div class="tr"><span>70歳以上</span><b>'+r.old70.toFixed(1)+'%</b></div>'); });
      b.addEventListener("mouseleave",hideTip); });
    svg.appendChild(b2); svg.appendChild(b1);
    svg.appendChild(el("text",{x:LW+Math.max(w2,1)+6,y:yy+16,fill:css("--ink-2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},r.young.toFixed(1)+"% / "+r.old70.toFixed(1)+"%"));
  });
  host.appendChild(svg);
  legend("youngLegend",[["--st-good","経営者が40歳代以下","box"],[cOld,"経営者が70歳以上（薄い帯）","box"]]);
}

var SCHEME_LIB={
  defense:[
    ["信用保証付きの運転資金融資","保証協会の保証を付けて金融機関から借りる、最も標準的な手段。業況が深く沈んでいる局面では、まず手元資金の厚みを確保することが優先されます。"],
    ["既存借入の条件変更（リスケジュール）","新たに借りるより先に、いまの返済スケジュールを見直せないかを検討します。代位弁済に至る前の相談が要点です。"],
    ["資本性劣後ローン","金融機関の審査上は自己資本とみなされる借入。債務超過に近い局面で、財務を痛めずに資金を入れる選択肢になります。"],
    ["事業再構築・業態転換の補助金","収益構造そのものを変える投資に対する補助。返済不要な代わりに、計画と実行の負担は大きくなります。"]
  ],
  cost:[
    ["短期の運転資金枠（当座貸越・コミットメントライン）","仕入価格の変動を吸収する枠。都度の借入より機動的に動けます。"],
    ["価格転嫁・取引適正化の相談窓口","資金を入れる前に、そもそも値上げ交渉が可能かを詰めます。下請取引の適正化は行政側の重点施策です。"],
    ["省エネ・省力化設備への投資と補助金","コスト構造そのものを下げる投資。原材料価格をコスト増の最大要因に挙げた企業は56.3%に上ります。"],
    ["信用保証付きの運転資金融資","転嫁が進むまでの時間を買うための、つなぎの資金。"]
  ],
  growth:[
    ["設備投資向け長期借入","伸びている需要に供給を合わせるための投資。回収期間と借入期間を合わせるのが原則です。"],
    ["第三者割当増資（エクイティ）","返済義務のない資金。ただし非上場の中小企業では引受先を見つけること自体が難所で、実務上は取引先・金融機関系ファンド・事業承継ファンドが中心になります。"],
    ["少人数私募債・購入型クラウドファンディング","顧客や地域を資金の出し手に変える手段。資金調達と同時に需要の検証にもなります。"],
    ["株式投資型クラウドファンディング","個人投資家から非上場株式で調達する制度。発行は年間5億円未満、投資家1人あたりは同一発行者へ年間50万円（財産状況により最大200万円）が上限です。"]
  ],
  capex:[
    ["設備投資向け長期借入","業況が底堅い局面は、更新投資・省力化投資の実行に適します。"],
    ["リース・割賦","初期支出を抑えて設備を導入する手段。手元資金を運転資金に残せます。"],
    ["省エネ・DX関連の補助金","投資額の一部を補助で賄い、実質的な利回りを引き上げます。"],
    ["信用保証付きの運転資金融資","投資に伴って増える運転資金の手当て。"]
  ],
  neutral:[
    ["当座貸越枠の事前設定","いま借りる必要はなくても、枠だけ用意しておく。シグナルが振れたときの初動が変わります。"],
    ["四半期ごとの再判定","一方向のシグナルが出ていない局面では、意思決定を急がないことも選択です。"],
    ["設備投資向け長期借入","個別の投資案件があるなら、判定と無関係に検討する価値があります。"],
    ["補助金の情報収集","公募時期は限られます。判定が振れる前に候補を洗い出しておきます。"]
  ]
};
var SUCC=["事業承継・引継ぎの相談","譲渡・譲受のどちらでも、東京都事業承継・引継ぎ支援センターとTOKYO版創業・承継マッチング支援事業が無料の入口になります。承継に伴う資金には信用保証協会の事業承継支援があります。"];
var USE_BOOST={working:"信用保証付き",capex:"設備投資",growth:"第三者割当",restruct:"事業再構築"};
var SIZE_KEY={micro:"小規模",small:"中小規模",mid:"中規模",large:"大規模"};
var SIZE_LABEL={micro:"1〜9人",small:"10〜19人",mid:"20〜49人",large:"50人以上"};

function renderDiag(){
  var full=document.getElementById("dgInd").value;
  var size=document.getElementById("dgSize").value;
  var use=document.getElementById("dgUse").value;
  var r=byFull[full], d=r.diag, st=STATUS[d.type], sk=SKby[SIZE_KEY[size]];
  var pill=document.getElementById("dgPill");
  pill.querySelector(".dot").style.background=css(st.c);
  pill.querySelector(".ic").textContent=st.ic;
  pill.querySelector(".tx").textContent=st.label;
  document.getElementById("dgTitle").textContent=d.tag;
  document.getElementById("dgWhy").innerHTML="<strong>"+r.full+"</strong>："+d.why+
    '<br><br>同じ調査で、<strong>'+sk.name+'（従業員'+SIZE_LABEL[size]+'）の企業は経営者の '+sk.old70.toFixed(1)+
    '% が70歳以上、'+sk.pre1960.toFixed(1)+'% が1960年以前の創業</strong>です。資金の手当てと同時に、引き継ぎの段取りが要る規模帯です。';
  var M=[["L","業況水準",d.L,"直近3か月平均"],["M","モメンタム",d.M,"前年同期比 pt"],
         ["P","価格転嫁ギャップ",d.P,"販売単価−仕入単価"],["E","期待ギャップ",d.E,"見通し−現状"],
         ["S","売上高DI",d.S,"前年同月比"]];
  document.getElementById("dgMetrics").innerHTML=M.map(function(m){
    var col=(m[2]==null)?"--ink-3":(m[2]<0?"--dv-neg":"--dv-pos");
    return '<div class="metric"><div class="mk">'+m[0]+' · '+m[1]+'</div><div class="mv" style="color:var('+col+')">'+(m[2]==null?"—":sgn(m[2]))+'</div><div class="md">'+m[3]+'</div></div>';
  }).join("");
  var list=SCHEME_LIB[d.type].slice();
  if(use==="succession") list.unshift(SUCC);
  else if(use!=="unknown"){ var key=USE_BOOST[use];
    list.sort(function(a,b){ return (b[0].indexOf(key)>=0?1:0)-(a[0].indexOf(key)>=0?1:0); }); }
  var sizeNote={micro:"従業員9人以下では、日本政策金融公庫や信用金庫など小口に強い先が現実的な入口です。都内中小企業の38.3%が信用金庫を主な取引先としています。",
    small:"従業員10〜19人規模では、保証協会付き融資と補助金の組み合わせが基本線です。",
    mid:"従業員20〜49人規模では、プロパー融資や資本性資金も選択肢に入ります。",
    large:"従業員50人以上では、シンジケートローンや私募債など、より多様な調達手段が現実的です。"}[size];
  document.getElementById("dgSchemes").innerHTML=list.map(function(s,i){
    return '<li><span class="rank">'+(i+1)+'</span><div class="body"><strong>'+s[0]+'</strong><span>'+s[1]+'</span></div></li>';
  }).join("")+'<li><span class="rank">＊</span><div class="body"><strong>規模に応じた補足</strong><span>'+sizeNote+'</span></div></li>';
}

/* ---------------- 01 三つの市場と、その外側 ---------------- */
function drawLadder(){
  var L=D.ladder, host=document.getElementById("ladderChart"); host.innerHTML="";
  var LW=190, W=900, RH=42, PT=26, RIGHT=118, H=PT+L.length*RH+14;
  var maxS=70, x=function(v){return LW+(W-LW-RIGHT)*v/maxS};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"市場区分別の海外投資家シェアと、非上場企業のゼロ"});
  for(var t=0;t<=maxS;t+=10){
    svg.appendChild(el("line",{x1:x(t),x2:x(t),y1:PT-8,y2:H-12,stroke:css(t===0?"--axis":"--grid")}));
    svg.appendChild(el("text",{x:x(t),y:PT-13,"text-anchor":"middle",fill:css("--ink-3"),"font-size":9.5,"font-family":"IBM Plex Mono, monospace"},t+"%"));
  }
  var cols=ordScale("age").slice().reverse(); /* 濃い→薄い */
  L.forEach(function(r,i){
    var yy=PT+i*RH, unl=(r.kind==="unlisted");
    svg.appendChild(el("text",{x:0,y:yy+20,fill:css(unl?"--ink":"--ink-2"),"font-size":13,
      "font-weight":unl?700:500,"font-family":'"Zen Kaku Gothic New",sans-serif'},r.name));
    svg.appendChild(el("text",{x:0,y:yy+34,fill:css("--ink-3"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace"},
      fmt(r.listed)+(unl?" 社（調査対象）":" 社")));
    if(unl){
      svg.appendChild(el("rect",{x:LW,y:yy+6,width:W-LW-RIGHT,height:22,fill:"none",
        stroke:css("--st-crit"),"stroke-width":1.5,"stroke-dasharray":"5 4",rx:3}));
      svg.appendChild(el("text",{x:LW+14,y:yy+21,fill:css("--st-crit"),"font-size":12,"font-weight":700,
        "font-family":'"Zen Kaku Gothic New",sans-serif'},"海外投資家が入る市場そのものが存在しない"));
    }else{
      var w=x(r.share)-LW;
      var rr=el("rect",{x:LW,y:yy+6,width:Math.max(w,2),height:22,fill:cols[i],rx:3});
      rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
        '<div class="th">'+r.name+'</div><div class="tr"><span>上場会社数</span><b>'+fmt(r.listed)+'</b></div>'+
        '<div class="tr"><span>海外投資家シェア</span><b>'+r.share.toFixed(1)+'%</b></div>'); });
      rr.addEventListener("mouseleave",hideTip);
      svg.appendChild(rr);
    }
    svg.appendChild(el("text",{x:W-RIGHT+12,y:yy+23,fill:css(unl?"--st-crit":"--ink"),
      "font-size":unl?20:18,"font-weight":600,"font-family":"IBM Plex Mono, monospace"},r.share.toFixed(1)+"%"));
  });
  host.appendChild(svg);
  legend("ladderLegend",[[cols[0],"海外投資家の委託売買代金シェア（2025年）","box"],["--st-crit","制度上、海外投資家が売買できない","box"]]);
}

function drawMarketBars(){
  var M=D.market, host=document.getElementById("marketBars"); host.innerHTML="";
  document.getElementById("marketNote").textContent=M.note;
  var LW=92,W=520,RH=44,PT=8,RIGHT=52,H=PT+M.segments.length*RH+6;
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"市場区分別の上場会社数シェアと時価総額シェア"});
  M.segments.forEach(function(m,i){
    var yy=PT+i*RH;
    svg.appendChild(el("text",{x:0,y:yy+22,fill:css("--ink-2"),"font-size":12,"font-family":'"Zen Kaku Gothic New",sans-serif'},m.name));
    [["listedShare","--s1","会社数"],["capShare","--s2","時価総額"]].forEach(function(p,j){
      var v=m[p[0]], w=(W-LW-RIGHT)*v/100, yb=yy+4+j*15;
      var rr=el("rect",{x:LW,y:yb,width:Math.max(w,2),height:12,fill:css(p[1]),opacity:.88,rx:2});
      rr.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
        '<div class="th">'+m.name+'</div><div class="tr"><span>上場会社数</span><b>'+fmt(m.listed[1])+'社</b></div>'+
        '<div class="tr"><span>会社数シェア</span><b>'+m.listedShare+'%</b></div>'+
        '<div class="tr"><span>時価総額シェア</span><b>'+m.capShare+'%</b></div>'+
        '<div class="tr"><span>売買回転率</span><b>'+m.turnover[1]+'%</b></div>'); });
      rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
      svg.appendChild(el("text",{x:LW+Math.max(w,2)+6,y:yb+11,fill:css("--ink-2"),"font-size":10.5,"font-family":"IBM Plex Mono, monospace","font-weight":600},v.toFixed(1)+"%"));
    });
  });
  host.appendChild(svg);
  legend("marketLegend",[["--s1","上場会社数シェア","box"],["--s2","時価総額シェア","box"]]);
}

function drawRegion(){
  var F=D.foreign, host=document.getElementById("regionChart"); host.innerHTML="";
  document.getElementById("regionNote").textContent=F.regionNote+" "+F.unit;
  var W=520,H=104,PT=6,BH=36;
  var cols=[css("--s1"),css("--s3"),css("--s2"),css("--rule")];
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"海外投資家の地域別売買代金構成比"});
  var x0=0, tot=0; F.regionShare.forEach(function(v){tot+=v});
  F.regionShare.forEach(function(v,j){
    var w=W*v/tot;
    var rr=el("rect",{x:x0,y:PT,width:Math.max(w-2,1),height:BH,fill:cols[j],rx:2});
    rr.addEventListener("mouseenter",function(ev){
      var net=F.regionNet[j];
      showTip(ev.clientX,ev.clientY,'<div class="th">'+F.regionLabels[j]+'</div>'+
        '<div class="tr"><span>売買代金シェア</span><b>'+v.toFixed(2)+'%</b></div>'+
        (net?'<div class="tr"><span>買越額</span><b>'+(net/1e9).toFixed(2)+'兆円</b></div>':'')); });
    rr.addEventListener("mouseleave",hideTip); svg.appendChild(rr);
    if(w>50){
      svg.appendChild(el("text",{x:x0+w/2-1,y:PT+BH+19,"text-anchor":"middle",fill:css("--ink"),"font-size":13,"font-weight":600,"font-family":"IBM Plex Mono, monospace"},v.toFixed(1)+"%"));
      svg.appendChild(el("text",{x:x0+w/2-1,y:PT+BH+35,"text-anchor":"middle",fill:css("--ink-3"),"font-size":11,"font-family":'"Zen Kaku Gothic New",sans-serif'},F.regionLabels[j]));
    }
    x0+=w;
  });
  host.appendChild(svg);
  legend("regionLegend",F.regionLabels.map(function(l,j){return [cols[j],l+" "+F.regionShare[j].toFixed(2)+"%","box"]}));
}

function drawForeignTrend(){
  var F=D.foreign, host=document.getElementById("foreignTrend"); host.innerHTML="";
  var W=760,H=240,PL=46,PR=118,PT=16,PB=30;
  var lo=30,hi=75, Y=F.years;
  var x=function(i){return PL+(W-PL-PR)*i/(Y.length-1)}, y=function(v){return PT+(H-PT-PB)*(hi-v)/(hi-lo)};
  var svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"市場区分別 海外投資家シェアの推移"});
  for(var t=lo;t<=hi;t+=5){
    svg.appendChild(el("line",{x1:PL,x2:W-PR,y1:y(t),y2:y(t),stroke:css("--grid")}));
    svg.appendChild(el("text",{x:PL-8,y:y(t)+4,"text-anchor":"end",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},t+"%"));
  }
  var lbl=[];
  [["prime","--s1","プライム"],["standard","--s2","スタンダード"],["growth","--s3","グロース"]].forEach(function(s){
    var v=F.share[s[0]], col=css(s[1]), d="";
    v.forEach(function(p,i){ d+=(d?" L":"M")+x(i)+","+y(p); });
    svg.appendChild(el("path",{d:d,fill:"none",stroke:col,"stroke-width":2}));
    v.forEach(function(p,i){
      var c=el("circle",{cx:x(i),cy:y(p),r:4,fill:col,stroke:css("--surface"),"stroke-width":2});
      c.addEventListener("mouseenter",function(ev){ showTip(ev.clientX,ev.clientY,
        '<div class="th">'+Y[i]+'年</div><div class="tr"><span>'+s[2]+'</span><b>'+p.toFixed(1)+'%</b></div>'); });
      c.addEventListener("mouseleave",hideTip); svg.appendChild(c);
    });
    lbl.push({y:y(v[v.length-1]),c:col,t:s[2]+" "+v[v.length-1].toFixed(1)+"%"});
  });
  lbl.sort(function(a,b){return a.y-b.y});
  for(var i2=1;i2<lbl.length;i2++) if(lbl[i2].y-lbl[i2-1].y<15) lbl[i2].y=lbl[i2-1].y+15;
  lbl.forEach(function(L){
    svg.appendChild(el("line",{x1:W-PR+6,x2:W-PR+16,y1:L.y,y2:L.y,stroke:L.c,"stroke-width":3,"stroke-linecap":"round"}));
    svg.appendChild(el("text",{x:W-PR+21,y:L.y+4,fill:css("--ink-2"),"font-size":11.5,"font-family":'"Zen Kaku Gothic New",sans-serif'},L.t));
  });
  Y.forEach(function(yy,i){ svg.appendChild(el("text",{x:x(i),y:H-9,"text-anchor":"middle",fill:css("--ink-3"),"font-size":10,"font-family":"IBM Plex Mono, monospace"},yy)); });
  host.appendChild(svg);
  legend("foreignLegend",[["--s1","プライム"],["--s2","スタンダード"],["--s3","グロース"]]);
}

function renderMarketHero(){
  var M=D.market, F=D.foreign;
  document.getElementById("heroMarket").textContent=fmt(M.listedTotal)+" / "+fmt(D.meta.sampleSize);
  document.getElementById("heroMarketNote").textContent=
    "東証プライム・スタンダード・グロースの上場会社数（2023年末）と、東京都中小企業の景況の調査対象社数";
  document.getElementById("marketTiles").innerHTML=
    '<div class="tile"><span class="k">プライム 海外投資家シェア</span><span class="v">'+F.share.prime[3].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">2022年 '+F.share.prime[0].toFixed(1)+'% から低下</span></div>'+
    '<div class="tile"><span class="k">グロース 海外投資家シェア</span><span class="v">'+F.share.growth[3].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">新興市場ほど海外マネーは薄い</span></div>'+
    '<div class="tile"><span class="k">海外マネーの欧州経由比率</span><span class="v">'+F.regionShare[0].toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">アジア '+F.regionShare[1].toFixed(1)+'%／北米 '+F.regionShare[2].toFixed(1)+'%</span></div>'+
    '<div class="tile"><span class="k">非上場中小企業への海外マネー</span><span class="v" style="color:var(--st-crit)">0<span style="font-size:14px">%</span></span><span class="d">売買できる市場が制度上存在しません</span></div>';
}

function renderStamp(){
  document.getElementById("stamp").innerHTML=
    "景況　<b>"+D.meta.latestLabel+"</b> / <b>"+D.meta.n+"</b> か月<br>"+
    "承継　<b>令和8年6月調査</b> / n=<b>1,283</b><br>"+
    "母集団　<b>"+fmt(D.meta.sampleSize)+"</b> 社（調査対象）";
}
function renderHero(){
  var g=byFull["全体"].gyokyo, last=g[N-1], prev=g[N-13];
  document.getElementById("heroDI").textContent=last;
  document.getElementById("heroDINote").textContent=D.meta.latestLabel+"　前年同月 "+prev+" → "+sgn(last-prev,0)+"pt";
  var vals=g.filter(function(v){return v!=null});
  var f=D.finance, T=SKby["全体"];
  document.getElementById("heroTiles").innerHTML=
    '<div class="tile"><span class="k">DIが0を下回った月</span><span class="v">'+vals.length+'<span style="font-size:14px"> / '+vals.length+'</span></span><span class="d">2005年5月以降、一度も0を超えていません</span></div>'+
    '<div class="tile"><span class="k">経営者が70歳以上</span><span class="v" style="color:var(--st-crit)">'+T.old70.toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">60歳以上は '+T.over60.toFixed(1)+'%。40歳代以下は '+T.young.toFixed(1)+'%</span></div>'+
    '<div class="tile"><span class="k">創業1980年以前</span><span class="v">'+T.pre1980.toFixed(1)+'<span style="font-size:14px">%</span></span><span class="d">2021年以降の創業は '+T.founded[5].toFixed(1)+'%</span></div>'+
    '<div class="tile"><span class="k">代位弁済 件数</span><span class="v" style="color:var(--st-crit)">'+fmt(f.hosho.subroCases[4])+'</span><span class="d">2021年度 '+fmt(f.hosho.subroCases[2])+'件の '+(f.hosho.subroCases[4]/f.hosho.subroCases[2]).toFixed(1)+'倍</span></div>';
}
function renderLogic(){
  var defs=[["L","直近3か月の業況DI平均","業況（当月）"],["M","L − 前年同期3か月平均（モメンタム）","業況（当月）"],
    ["P","販売単価DI − 仕入単価DI（直近3か月平均）","販売単価・仕入単価（前月比）"],
    ["E","見通しDI3か月平均 − L（期待ギャップ）","業況見通し（今後3か月）"],
    ["S","直近3か月の売上高DI平均","売上高（前年同月比）"],
    ["U","0.6×（経営者70歳以上％）＋ 0.4×（1960年以前創業％）","付帯調査 経営者の年齢・創業年"]];
  document.getElementById("defTable").innerHTML=defs.map(function(d){
    return '<tr><td class="l mono" style="font-weight:600">'+d[0]+'</td><td class="l">'+d[1]+'</td><td class="l">'+d[2]+'</td></tr>'; }).join("");
  var rules=[["防衛的運転資金・事業再構築","L < -34、または（L < -28 かつ M < 0）","defense"],
    ["攻めの成長資金（エクイティ適性）","M > +6 かつ E > 0 かつ L > -32","growth"],
    ["価格転嫁・コスト対応資金","P < -15","cost"],
    ["安定・設備投資資金","L > -14 かつ S > -14","capex"],
    ["中立（様子見）","上記のいずれにも該当しない","neutral"]];
  document.getElementById("ruleList").innerHTML=rules.map(function(r,i){
    return '<li><span class="rank">'+(i+1)+'</span><div class="body"><strong style="display:flex;align-items:center;gap:8px"><span style="width:9px;height:9px;border-radius:50%;background:'+css(STATUS[r[2]].c)+';display:inline-block"></span>'+r[0]+'</strong><span class="mono">'+r[1]+'</span></div></li>'; }).join("");
  document.getElementById("srcList").innerHTML=D.sources.map(function(s){
    return '<li><span class="n">'+s.n+'</span><span class="m">'+s.org+'　/　'+s.lic+'</span><span class="u">'+s.use+'</span>'+
      '<div style="margin-top:6px"><a href="'+s.url+'" target="_blank" rel="noopener">出典ページ</a>　<a href="'+s.file+'" target="_blank" rel="noopener">'+s.file.split("/").pop()+'</a></div></li>'; }).join("");
  var h='<table><thead><tr><th class="l">業種</th><th class="l">判定</th><th>スコア</th><th>L</th><th>M</th><th>P</th><th>E</th><th>S</th></tr></thead><tbody>';
  IND.forEach(function(r){ var d=r.diag;
    h+='<tr><td style="font-weight:'+(r.level?400:700)+'">'+r.full+'</td><td class="l"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+css(STATUS[d.type].c)+';margin-right:6px"></span>'+d.tag+'</td><td>'+d.score.toFixed(0)+'</td><td>'+sgn(d.L)+'</td><td>'+sgn(d.M)+'</td><td>'+(d.P==null?"—":sgn(d.P))+'</td><td>'+sgn(d.E)+'</td><td>'+sgn(d.S)+'</td></tr>'; });
  document.getElementById("allTable").innerHTML=h+'</tbody></table>';
  var h2='<table><thead><tr><th class="l">区分</th><th>n</th><th>承継緊急度</th>'+
    SK.ageLabels.map(function(l){return "<th>"+l+"</th>"}).join("")+
    SK.foundedLabels.map(function(l){return "<th>"+l+"</th>"}).join("")+'</tr></thead><tbody>';
  SK.rows.forEach(function(r){
    h2+='<tr><td style="font-weight:'+(r.kind==="total"?700:400)+'">'+r.name+'</td><td>'+r.n+'</td><td style="font-weight:600">'+r.urgency.toFixed(1)+'</td>'+
      r.age.map(function(v){return "<td>"+v.toFixed(1)+"</td>"}).join("")+
      r.founded.map(function(v){return "<td>"+v.toFixed(1)+"</td>"}).join("")+'</tr>'; });
  document.getElementById("shokeiTable").innerHTML=h2+'</tbody></table>';
}

function fillSelect(id){ var s=document.getElementById(id); s.innerHTML="";
  IND.forEach(function(r){ var o=document.createElement("option");
    o.value=r.full; o.textContent=(r.level?"　　":"")+r.full; s.appendChild(o); }); }
function renderAll(){
  renderStamp(); renderMarketHero(); drawLadder(); drawMarketBars(); drawRegion(); drawForeignTrend();
  renderHero(); drawHero(); drawRatio(); drawSubro();
  singleStack("ageOverview","ageOverviewLegend",SK.ageLabels,SKby["全体"].age,"age");
  singleStack("foundedOverview","foundedOverviewLegend",SK.foundedLabels,SKby["全体"].founded,"fnd");
  drawUrgency();
  stacked("ageChart","ageLegend",SK.rows,SK.ageLabels,"age","age",4);
  stacked("foundedChart","foundedLegend",SK.rows,SK.foundedLabels,"founded","fnd",0);
  drawScatter(); drawHeat(); drawArea();
  renderDiag(); drawShikin(); drawHosho();
  drawKakei(); drawRoutes(); drawYoung();
  renderLogic();
}
document.querySelectorAll(".lens-btn").forEach(function(b){
  b.addEventListener("click",function(){
    document.querySelectorAll(".lens-btn").forEach(function(x){x.setAttribute("aria-selected","false")});
    b.setAttribute("aria-selected","true");
    document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("on")});
    document.getElementById("panel-"+b.dataset.lens).classList.add("on");
    window.scrollTo({top:0,behavior:"smooth"});
  });
});
fillSelect("dgInd");
document.getElementById("dgInd").value="小売業";
["dgInd","dgSize","dgUse"].forEach(function(id){ document.getElementById(id).addEventListener("change",renderDiag); });
renderAll();
var mq=window.matchMedia("(prefers-color-scheme: dark)");
if(mq.addEventListener) mq.addEventListener("change",renderAll);
new MutationObserver(renderAll).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
var rt; window.addEventListener("resize",function(){ clearTimeout(rt); rt=setTimeout(function(){HEAT=null;drawHeat();},200); });
})();
