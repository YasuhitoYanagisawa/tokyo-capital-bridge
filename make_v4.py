#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v4 のソースを組み立てる： markup + 共有CSS + v3のチャート基盤 + v4追加JS"""
css = open('src/_shared.css', encoding='utf-8').read()
v3js = open('src/_v3_script.js', encoding='utf-8').read()
extra2 = open('src/v4_extra2.js', encoding='utf-8').read()
extra = extra2 + '\n' + open('src/v4_extra.js', encoding='utf-8').read()
mk = open('src/v4_markup.html', encoding='utf-8').read()

# v3 スクリプトのうち、共通ヘルパと描画関数だけを使う（末尾の配線は v4 で差し替え）
cut = v3js.index('function fillSelect(id){')
base = v3js[:cut]

js = base + '\n' + extra
out = mk.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
open('src/v4_capital-bridge.html', 'w', encoding='utf-8').write(out)
print('src/v4_capital-bridge.html', round(len(out.encode()) / 1024, 1), 'KB')
