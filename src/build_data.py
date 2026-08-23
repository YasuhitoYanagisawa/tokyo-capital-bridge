#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tokyo Capital Bridge — データ整形スクリプト
入力: data/keikyo_raw.json（東京都中小企業の景況 / 産業労働局 CC-BY 4.0）
出力: data/tcb_data.js（アプリに埋め込む単一JSデータ）
"""
import json, os

RAW = json.load(open('data/keikyo_raw.json', encoding='utf-8'))
months = RAW['months']
segs = RAW['segs']
out = RAW['out']

IND = ['gyokyo', 'uriage_yoy', 'shiire', 'hanbai', 'gyokyo_fc']
IND_JA = {
    'gyokyo': '業況DI',
    'uriage_yoy': '売上高DI（前年同月比）',
    'shiire': '仕入単価DI（前月比）',
    'hanbai': '販売単価DI（前月比）',
    'gyokyo_fc': '業況見通しDI（今後3か月）',
}

# 業種階層（列位置で親子を定義）
PARENTS = {5: '全体', 14: '製造業', 86: '卸売業', 149: '小売業', 203: 'サービス業'}
HIER = {
    5:   [],
    14:  [23, 32, 41, 50, 59, 68, 77],
    86:  [95, 104, 113, 122, 131, 140],
    149: [158, 167, 176, 185, 194],
    203: [212, 221],
}


def parse(s):
    r = []
    for v in s.split(','):
        v = v.strip()
        if v in ('', '―', '-', '‐', '−'):
            r.append(None)
        else:
            try:
                r.append(int(float(v)))
            except ValueError:
                r.append(None)
    return r


series = {}
for key, arrs in out.items():
    name, col = key.rsplit('@', 1)
    col = int(col)
    series[col] = {'name': name, 'col': col}
    for i, ind in enumerate(IND):
        series[col][ind] = parse(arrs[i])

# 親子を反映したフルネーム
industries = []
for pcol, parent in PARENTS.items():
    industries.append({
        'col': pcol, 'name': parent, 'parent': None,
        'full': parent, 'level': 0,
    })
    for ccol in HIER[pcol]:
        industries.append({
            'col': ccol, 'name': series[ccol]['name'], 'parent': parent,
            'full': f"{parent}／{series[ccol]['name']}", 'level': 1,
        })


def avg(vals):
    v = [x for x in vals if x is not None]
    return round(sum(v) / len(v), 1) if v else None


N = len(months)


def diag(col):
    """資金需要タイプ判定エンジン（透明なルールベース）"""
    s = series[col]
    g, gf = s['gyokyo'], s['gyokyo_fc']
    sh, hb, uy = s['shiire'], s['hanbai'], s['uriage_yoy']

    L = avg(g[-3:])                      # 業況水準（直近3か月平均）
    L_prev = avg(g[-15:-12])             # 前年同期3か月平均
    M = round(L - L_prev, 1) if (L is not None and L_prev is not None) else None
    P = None                             # 価格転嫁ギャップ
    if hb[-1] is not None and sh[-1] is not None:
        P = round(avg(hb[-3:]) - avg(sh[-3:]), 1)
    E = round(avg(gf[-3:]) - L, 1) if (L is not None and avg(gf[-3:]) is not None) else None
    S = avg(uy[-3:])

    # ---- 判定ルール（上から順に評価。しきい値はすべて画面に明示）----
    if L is not None and (L < -34 or (L < -28 and M is not None and M < 0)):
        t, tag = 'defense', '防衛的運転資金・事業再構築'
        why = (f'業況DIが{L}と深い水準にあり、前年同期比でも{M}pt。'
               'まず資金繰りの下支えと、収益構造そのものの立て直しが先決です。')
    elif (M is not None and M > 6) and (E is not None and E > 0) and (L is not None and L > -32):
        t, tag = 'growth', '攻めの成長資金（エクイティ適性）'
        why = (f'業況DIが前年同期比+{M}ptと改善し、先行き見通しも現状を{E}pt上回ります。'
               '返済負担を伴う借入より、成長を取りにいく資本性資金が適合する局面です。')
    elif P is not None and P < -15:
        t, tag = 'cost', '価格転嫁・コスト対応資金'
        why = (f'販売単価DIが仕入単価DIを{abs(P)}pt下回り、コスト上昇を価格に転嫁しきれていません'
               f'（業況DI {L}）。運転資金の厚みと価格交渉力の両面の支援が要ります。')
    elif L is not None and L > -14 and S is not None and S > -14:
        t, tag = 'capex', '安定・設備投資資金'
        why = (f'業況DI {L}／売上高DI {S}と相対的に底堅く、'
               '省力化・DX・脱炭素などの設備投資に資金を向けやすい局面です。')
    else:
        t, tag = 'neutral', '中立（様子見）'
        why = (f'業況DI {L}、前年同期比モメンタム{M}pt。'
               '一方向のシグナルは出ておらず、四半期ごとの再判定が妥当です。')

    # 投資妙味スコア（0-100 に正規化。加重はすべて画面に明示）
    raw = 0.0
    if M is not None:
        raw += M * 2.2
    if E is not None:
        raw += E * 1.4
    if L is not None:
        raw += (L + 25) * 0.5
    if S is not None:
        raw += S * 0.6
    if P is not None:
        raw += P * 0.5
    score = max(2, min(98, round(50 + raw * 0.62, 1)))

    return {'L': L, 'M': M, 'P': P, 'E': E, 'S': S,
            'type': t, 'tag': tag, 'why': why, 'score': score}


data = {
    'meta': {
        'months': months,
        'latestLabel': f'{str(months[-1])[:4]}年{int(str(months[-1])[4:])}月調査',
        'n': N,
        'indicators': IND,
        'indicatorsJa': IND_JA,
        'sampleSize': 3875,
    },
    'industries': [],
}

for ind in industries:
    col = ind['col']
    s = series[col]
    rec = dict(ind)
    for k in IND:
        rec[k] = s[k]
    rec['diag'] = diag(col)
    data['industries'].append(rec)

# ---- 金融・家計データ（東京都統計年鑑 令和5年）----
data['finance'] = {
    'hosho': {
        'label': '東京信用保証協会 事業状況（15-3）',
        'years': [2019, 2020, 2021, 2022, 2023],
        'guarCases':    [92930, 294844, 85493, 80432, 78682],   # 保証承諾 件数
        'guarValue':    [1331571, 6278632, 1239488, 1159727, 1198994],
        'subroCases':   [5043, 3345, 2724, 4194, 6179],         # 代位弁済 件数
        'subroValue':   [49517, 35846, 32483, 51508, 73624],
        'outstandCases': [329972, 463039, 478337, 488449, 466364],
    },
    'tousan': {
        'label': '東京都 企業倒産状況（15-8）',
        'years': [2019, 2020, 2021, 2022, 2023],
        'cases': [1580, 1392, 1126, 1151, 1597],
        'liabMillionYen': [379313, 239239, 405147, 321542, 718090],
        'byIndustryLabels': ['建設業', '製造業', '情報通信業', '運輸業', '卸売業', '小売業',
                             '不動産業', '宿泊・飲食', '教育・学習', 'サービス業', 'その他'],
        'byIndustry2023': [176, 115, 203, 31, 219, 140, 74, 157, 66, 399, 17],
        'byIndustry2021': [125, 87, 107, 30, 200, 131, 67, 85, 45, 236, 13],
    },
    'ratio': {
        'label': '預貸率（貸出金÷預金）',
        'years': [2019, 2020, 2021, 2022, 2023],
        'bank':    [round(a / b * 100, 1) for a, b in zip(
            [2205541, 2319053, 2382921, 2469810, 2646350],
            [2867002, 3199433, 3283119, 3500992, 3661542])],
        'shinkin': [round(a / b * 100, 1) for a, b in zip(
            [14048162, 15547127, 15505659, 15575302, 15621949],
            [25509098, 27941832, 28591844, 28705637, 28496729])],
    },
    'kakei': {
        'label': '東京都 勤労者世帯 1世帯あたり1か月（14-2）',
        'years': [2019, 2020, 2021, 2022, 2023],
        'jitsushunyu':  [673468, 701538, 730386, 684038, 720584],
        'kashobun':     [539517, 561620, 583422, 550979, 576153],
        'shohishishutsu': [360606, 343451, 357123, 350149, 363224],
        'persons': [3.3, 3.3, 3.27, 3.27, 3.27],
        'headAge': [50.5, 49.4, 49.5, 49.7, 50.3],
    },
}

data['sources'] = [
    {'n': '東京都中小企業の景況（月次・回答3,875社対象）', 'org': '東京都産業労働局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000012d0000000087',
     'file': 'https://www.opendata.metro.tokyo.lg.jp/sangyouroudou/130001_chusyokeikyo.xlsx',
     'lic': 'CC BY 4.0', 'use': '25業種×5指標×255か月のDI時系列。資金需要タイプ判定と投資妙味スコアの中核。'},
    {'n': '東京都統計年鑑 令和5年 15金融 15-3 信用保証協会事業状況', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000001026',
     'file': 'https://www.toukei.metro.tokyo.lg.jp/tnenkan/2023/tn23qv150300.csv',
     'lic': 'CC BY 4.0', 'use': '代位弁済件数の急増を「返済余力の限界」シグナルとして提示。'},
    {'n': '東京都統計年鑑 令和5年 15金融 15-8 企業倒産状況', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000001026',
     'file': 'https://www.toukei.metro.tokyo.lg.jp/tnenkan/2023/tn23qv150800.csv',
     'lic': 'CC BY 4.0', 'use': '業種別倒産件数で、景況シグナルの帰結を裏づけ。'},
    {'n': '東京都統計年鑑 令和5年 15金融 15-1 銀行の預金・現金・貸出金', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000001026',
     'file': 'https://www.toukei.metro.tokyo.lg.jp/tnenkan/2023/tn23qv150100.csv',
     'lic': 'CC BY 4.0', 'use': '預貸率で「都内に滞留するマネー」を可視化。'},
    {'n': '東京都統計年鑑 令和5年 15金融 15-2 中小企業金融機関（信用金庫）', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000001026',
     'file': 'https://www.toukei.metro.tokyo.lg.jp/tnenkan/2023/tn23qv150201.csv',
     'lic': 'CC BY 4.0', 'use': '地域金融機関の預貸率。銀行との対比で資金循環の目詰まりを示す。'},
    {'n': '東京都統計年鑑 令和5年 14家計 14-2 勤労者世帯の収入と支出', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000001025',
     'file': 'https://www.toukei.metro.tokyo.lg.jp/tnenkan/2023/tn23qv140200.csv',
     'lic': 'CC BY 4.0', 'use': '都内勤労者世帯の可処分所得・消費支出から「毎月の投資余力」を実測値で算出。'},
]

os.makedirs('data', exist_ok=True)
js = 'window.TCB=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';'
open('data/tcb_data.js', 'w', encoding='utf-8').write(js)
print('wrote data/tcb_data.js', len(js), 'chars')
print('industries:', len(data['industries']))
for r in data['industries']:
    d = r['diag']
    print(f"  {r['full']:<28} L={d['L']} M={d['M']} P={d['P']} E={d['E']} score={d['score']} -> {d['tag']}")
