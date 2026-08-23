#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""src/app.html + data/tcb_data.js -> dist/artifact.html, dist/index.html"""
import os, re

src = open('src/app.html', encoding='utf-8').read()
data = open('data/tcb_data.js', encoding='utf-8').read()

assert '/*__TCB_DATA__*/' in src, 'placeholder missing'
body = src.replace('/*__TCB_DATA__*/', data)

os.makedirs('dist', exist_ok=True)

# 1) Artifact 版：doctype/html/head/body なし（公開時に外側が付与される）
open('dist/artifact.html', 'w', encoding='utf-8').write(body)

# 2) Cloudflare Pages / 一般ホスティング版：完全な HTML 文書
head_end = body.index('</style>') + len('</style>')
head_part = body[:head_end]
body_part = body[head_end:]
full = (
    '<!doctype html>\n<html lang="ja">\n<head>\n'
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    '<meta name="description" content="東京都のオープンデータから、業種ごとに「いま必要な資金の種類」を判定し、投資家・事業者・都民をつなぐ資金循環プラットフォーム。">\n'
    '<meta property="og:title" content="東京資本橋 / Tokyo Capital Bridge">\n'
    '<meta property="og:description" content="都内中小企業3,875社・255か月の景況データを起点に、資金の宛先を可視化する。">\n'
    + head_part +
    '\n</head>\n<body>\n' + body_part + '\n</body>\n</html>\n'
)
open('dist/index.html', 'w', encoding='utf-8').write(full)

for f in ('artifact.html', 'index.html'):
    print(f, os.path.getsize('dist/' + f) / 1024, 'KB')
