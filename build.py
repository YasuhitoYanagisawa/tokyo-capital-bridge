#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""src/v*.html + data/tcb_data.js -> dist/

出力:
  dist/index.html        最新版（= LATEST に指定したバージョン）
  dist/v1/index.html     東京資本橋（初版・金融マッチング案）
  dist/v2/index.html     継ぐ東京（承継軸への転換）
  dist/v3/index.html     継ぐ東京（上場市場・海外投資家レイヤー追加）
  dist/v4/index.html     東京資本橋（四層＋連関＋投資機会）
  dist/versions.html     バージョン一覧
  dist/artifact.html     最新版の Artifact 用（doctype/html/head/body なし）

すべて単一HTML・外部依存なし。旧版は上書きせず残す。
"""
import os

DATA = open('data/tcb_data.js', encoding='utf-8').read()
LATEST = 'v4'

VERSIONS = [
    {'id': 'v1', 'src': 'src/v1_capital-bridge.html',
     'title': '東京資本橋 / Tokyo Capital Bridge',
     'desc': '初版。都の景況データを軸に、投資家・事業者・都民の三者へ資金タイプを提示する構成。',
     'note': '調査対象に上場企業が含まれるかを未検証のまま「投資妙味スコア」を掲げていた段階。'},
    {'id': 'v2', 'src': 'src/v2_tsugu-tokyo.html',
     'title': '継ぐ東京 / Tsugu Tokyo',
     'desc': '承継軸へ転換。経営者年齢・創業年を追加し、都民ビューを「届く／届かない経路」に作り直した版。',
     'note': '母集団が非上場のオーナー企業だと判明したことを受けた改訂。上場市場の視点はまだない。'},
    {'id': 'v3', 'src': 'src/v3_tsugu-tokyo.html',
     'title': '継ぐ東京 / Tsugu Tokyo',
     'desc': '上場市場と海外投資家のレイヤーを追加。東証3,837社と非上場3,875社を同じ画面で突き合わせる。',
     'note': '承継軸の版。上場市場の視点を初めて入れた段階。'},
    {'id': 'v4', 'src': 'src/v4_capital-bridge.html',
     'title': '東京資本橋 / Tokyo Capital Bridge',
     'desc': '初期構想へ回帰。海外・上場・中小・都民の四層を並べ、層どうしの連関を月次データで実測。事業承継は選択肢のひとつに戻した。',
     'note': '現行版。国債金利255か月を加え、相関分析と投資機会を追加。'},
]

META = {
    'v1': ('東京都のオープンデータから、業種ごとに「いま必要な資金の種類」を判定し、投資家・事業者・都民をつなぐ資金循環プラットフォーム。',
           '東京資本橋 / Tokyo Capital Bridge'),
    'v2': ('東京都のオープンデータで、東京の事業と資金の「渡し先」を可視化する。景況・経営者年齢・創業年から、いま必要な資金と次の担い手の不足を同時に読む。',
           '継ぐ東京 / Tsugu Tokyo'),
    'v3': ('東京都のオープンデータで、東京の資金の「渡し先」を可視化する。東証3,837社に流れ込む海外マネーと、非上場3,875社の資金・後継者不足を突き合わせる。',
           '継ぐ東京 / Tsugu Tokyo'),
    'v4': ('東京の資金を「海外→上場企業→中小企業→都民」の四層で可視化し、層どうしの連関を月次データで実測する。調達機会と投資機会も一次データで並べる。',
           '東京資本橋 / Tokyo Capital Bridge'),
}


def build(src_path, vid, rel):
    src = open(src_path, encoding='utf-8').read()
    assert '/*__TCB_DATA__*/' in src, 'placeholder missing in ' + src_path
    body = src.replace('/*__TCB_DATA__*/', DATA)
    # 版を行き来できるリンクは開発中の確認用。最新版（LATEST）には出さない。
    if vid != LATEST:
        bar = ('<footer>\n  <p style="margin:0 0 10px;font-family:\'IBM Plex Mono\',monospace;font-size:11px;'
               'letter-spacing:.1em">この画面は <b>' + vid.upper() + '</b>（開発中の旧版）です　'
               '<a href="' + rel + 'versions.html">← ほかのバージョンを見る</a></p>')
        body = body.replace('<footer>', bar, 1)
    head_end = body.index('</style>') + len('</style>')
    desc, og = META[vid]
    full = (
        '<!doctype html>\n<html lang="ja">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f'<meta name="description" content="{desc}">\n'
        f'<meta property="og:title" content="{og}">\n'
        f'<meta property="og:description" content="{desc}">\n'
        + body[:head_end] +
        '\n</head>\n<body>\n' + body[head_end:] + '\n</body>\n</html>\n'
    )
    return body, full


os.makedirs('dist', exist_ok=True)
built = {}
for v in VERSIONS:
    body, full = build(v['src'], v['id'], '../')
    os.makedirs('dist/' + v['id'], exist_ok=True)
    open(f"dist/{v['id']}/index.html", 'w', encoding='utf-8').write(full)
    built[v['id']] = (body, full)
    print(f"dist/{v['id']}/index.html", round(len(full.encode()) / 1024, 1), 'KB')

# 最新版をルートにも配置（Cloudflare Pages のトップ）
root_body, root_full = build(dict((v['id'], v) for v in VERSIONS)[LATEST]['src'], LATEST, './')
open('dist/index.html', 'w', encoding='utf-8').write(root_full)
open('dist/artifact.html', 'w', encoding='utf-8').write(root_body)
print('dist/index.html (=' + LATEST + ')', round(len(root_full.encode()) / 1024, 1), 'KB')

# バージョン一覧ページ
rows = ''.join(
    f'''<li{' class="latest"' if v['id'] == LATEST else ''}>
  <a href="./{v['id']}/"><span class="vid">{v['id']}</span><span class="vt">{v['title']}</span></a>
  <p>{v['desc']}</p><p class="note">{v['note']}</p>
</li>''' for v in reversed(VERSIONS))

open('dist/versions.html', 'w', encoding='utf-8').write(f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>東京資本橋 — バージョン一覧</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Shippori+Mincho+B1:wght@700&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
:root{{color-scheme:light;--bg:#eaeef3;--surface:#fff;--line:#d5dce5;--ink:#0e1720;--ink-2:#41505f;--ink-3:#6d7d8d;--accent:#1c5cab}}
@media(prefers-color-scheme:dark){{:root:not([data-theme="light"]){{color-scheme:dark;--bg:#090d12;--surface:#131b25;--line:#25313f;--ink:#eaf1f8;--ink-2:#adbccb;--ink-3:#7a8b9c;--accent:#4b9bea}}}}
:root[data-theme="dark"]{{color-scheme:dark;--bg:#090d12;--surface:#131b25;--line:#25313f;--ink:#eaf1f8;--ink-2:#adbccb;--ink-3:#7a8b9c;--accent:#4b9bea}}
body{{margin:0;background:var(--bg);color:var(--ink);font-family:"Zen Kaku Gothic New","Hiragino Sans",system-ui,sans-serif;line-height:1.75;padding:48px 20px 72px}}
main{{max-width:760px;margin:0 auto}}
h1{{font-family:"Shippori Mincho B1",serif;font-size:30px;letter-spacing:.06em;margin:0 0 6px}}
.sub{{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.2em;color:var(--ink-3);text-transform:uppercase;margin:0 0 28px}}
ul{{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:1px;background:var(--line);border:1px solid var(--line)}}
li{{background:var(--surface);padding:18px 20px}}
li.latest{{border-left:3px solid var(--accent)}}
a{{text-decoration:none;color:inherit;display:flex;align-items:baseline;gap:12px}}
a:hover .vt{{text-decoration:underline}}
.vid{{font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--ink-3);border:1px solid var(--line);padding:1px 7px}}
.vt{{font-weight:700;font-size:17px;color:var(--accent)}}
p{{margin:6px 0 0;font-size:13.5px;color:var(--ink-2)}}
p.note{{font-size:12px;color:var(--ink-3)}}
footer{{margin-top:26px;font-size:12px;color:var(--ink-3)}}
</style></head><body><main>
<h1>東京資本橋</h1>
<p class="sub">Version history</p>
<ul>{rows}</ul>
<footer>都知事杯オープンデータ・ハッカソン2026 応募作品プロトタイプ。各版は単一HTML・外部依存なしで、いつでも並べて比較できます。<br>いずれの版も最新のデータセットで再ビルドしているため、旧版の画面にも現在の出典一覧が表示されます（画面構成と判定ロジックが当時のものです）。</footer>
</main></body></html>
''')
print('dist/versions.html')
