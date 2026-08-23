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
    # 2019〜2023年度は東京都統計年鑑 令和5年 15-3。
    # 2024年度は同じ調査の元になる東京信用保証協会「令和6年度事業概況」から追加した。
    # 公表値は億円単位のため百万円に換算している（863億円→86300百万円）。
    # 前年度比の公表値（保証承諾件数94.4%／代位弁済件数113.7%／代位弁済額117.2%）と
    # 2023年度の値から逆算した比が一致することを確認済み。
    'hosho': {
        'label': '東京信用保証協会 事業状況（15-3）／2024年度は同協会「令和6年度事業概況」',
        'years': [2019, 2020, 2021, 2022, 2023, 2024],
        'guarCases':    [92930, 294844, 85493, 80432, 78682, 74291],   # 保証承諾 件数
        'guarValue':    [1331571, 6278632, 1239488, 1159727, 1198994, 1106400],
        'subroCases':   [5043, 3345, 2724, 4194, 6179, 7027],          # 代位弁済 件数
        'subroValue':   [49517, 35846, 32483, 51508, 73624, 86300],
        'outstandCases': [329972, 463039, 478337, 488449, 466364, 461581],
        'srcUrl': 'https://www.cgc-tokyo.or.jp/about/profile/cgc_gaikyou-.html',
        # 2025年度は年度途中。通年の棒には混ぜず、注記として別に持つ。
        'partial': {
            'label': '令和7年度 4〜12月',
            'cases': 4837, 'value': 53900,
            'yoyCases': 92.1, 'yoyValue': 82.6,
            'note': '2025年度は4〜12月の時点で代位弁済が件数92.1%・金額82.6%と前年同期を下回り、'
                    '増加が止まっています。通年の値が出ていないため、棒グラフには含めていません。',
        },
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

# ---- 承継データ（東京都中小企業の景況 付帯調査「景況調査回答企業の概要」令和8年6月）----
# PDF図表から抽出し、全行の構成比合計が100%になることを検算済み。
SHOKEI_ROWS = ['全体', '製造業', '卸売業', '小売業', 'サービス業',
               '小規模', '中小規模', '中規模', '大規模']
SHOKEI_N = [1283, 340, 345, 287, 311, 529, 178, 159, 412]
# 経営者の年齢（％）: [40歳未満, 40歳代, 50歳代, 60歳代, 70歳以上]
AGE = {
    '全体':        [1.1, 8.2, 26.6, 30.1, 34.1],
    '製造業':      [1.2, 9.9, 28.9, 28.4, 31.6],
    '卸売業':      [0.9, 9.2, 28.6, 31.2, 30.1],
    '小売業':      [0.3, 6.2, 24.7, 26.8, 41.9],
    'サービス業':  [1.9, 7.0, 23.5, 33.7, 34.0],
    '小規模':      [1.5, 5.4, 18.1, 29.3, 45.7],
    '中小規模':    [0.0, 8.4, 30.9, 30.3, 30.3],
    '中規模':      [0.0, 10.7, 30.2, 32.1, 26.4],
    '大規模':      [0.6, 10.9, 34.7, 30.3, 22.8],
}
# 創業年（％）: [1940年以前, 1941-1960, 1961-1980, 1981-2000, 2001-2020, 2021年以降]
FOUNDED = {
    '全体':        [16.4, 23.1, 24.1, 22.2, 13.6, 0.6],
    '製造業':      [18.2, 28.8, 29.1, 16.5, 6.5, 0.9],
    '卸売業':      [20.0, 23.2, 22.0, 22.3, 12.2, 0.7],
    '小売業':      [20.9, 23.3, 20.6, 18.5, 16.0, 0.6],
    'サービス業':  [6.4, 16.4, 24.1, 31.8, 20.6, 0.9],
    '小規模':      [13.0, 20.2, 23.8, 26.3, 15.7, 0.6],
    '中小規模':    [18.5, 27.0, 28.1, 19.1, 6.7, 0.6],
    '中規模':      [21.4, 28.9, 23.9, 15.7, 9.4, 0.3],
    '大規模':      [18.0, 22.6, 22.8, 21.1, 15.3, 0.2],
}

shokei = []
for name in SHOKEI_ROWS:
    a, f = AGE[name], FOUNDED[name]
    old70 = a[4]                 # 経営者70歳以上の割合
    pre1960 = f[0] + f[1]        # 1960年以前創業の割合
    urgency = round(0.6 * old70 + 0.4 * pre1960, 1)
    shokei.append({
        'name': name,
        'kind': 'size' if name in ('小規模', '中小規模', '中規模', '大規模') else
                ('total' if name == '全体' else 'industry'),
        'n': SHOKEI_N[SHOKEI_ROWS.index(name)],
        'age': a, 'founded': f,
        'old70': old70, 'over60': round(a[3] + a[4], 1),
        'pre1960': round(pre1960, 1), 'pre1980': round(f[0] + f[1] + f[2], 1),
        'young': round(a[0] + a[1], 1),
        'urgency': urgency,
    })

data['shokei'] = {
    'label': '東京都中小企業の景況 付帯調査「景況調査回答企業の概要」（令和8年6月調査）',
    'ageLabels': ['40歳未満', '40歳代', '50歳代', '60歳代', '70歳以上'],
    'foundedLabels': ['1940年以前', '1941〜1960年', '1961〜1980年',
                      '1981〜2000年', '2001〜2020年', '2021年以降'],
    'rows': shokei,
    'formula': '承継緊急度 ＝ 0.6 ×（経営者70歳以上の割合）＋ 0.4 ×（1960年以前創業の割合）',
    'areaLabels': ['城東', '多摩・島しょ', '城西・城北', '都心', '副都心', '城南'],
    'areaShare': [30.4, 16.8, 16.1, 13.7, 12.0, 10.9],
    'areaNote': '城東＝台東・墨田・江東・荒川・足立・葛飾・江戸川／都心＝千代田・中央・港。'
                '業種別では製造業の43.2％が城東、卸売業の21.2％が都心に集まる。',
}

# ---- 事業資金に関する調査（同 付帯調査・令和8年5月調査）----
data['shikin'] = {
    'label': '東京都中小企業の景況 付帯調査「事業資金に関する調査」（令和8年5月調査）',
    'demandDI': 13.6, 'demandDIPrev': 10.5,
    'useLabels': ['運転資金', '運転・設備', '設備投資'],
    'use': [64.8, 18.9, 16.4],
    'sourceLabels': ['自己資金', '借入（融資）', '借入（その他）'],
    'source': [52.5, 41.4, 5.4],
    'bankLabels': ['都市銀行', '信用金庫', '地方銀行', '信用組合', 'その他'],
    'bank': [48.4, 38.3, 6.7, 2.6, 4.1],
    'bankNote': '製造業は信用金庫が46.4％、卸売業は都市銀行が59.0％。',
    'rateLabels': ['1％未満', '1％台', '2％台'],
    'rate': [13.8, 36.7, 38.7],
    'ratePrev': [16.7, 41.2, 32.5],
    'rateTrendLabels': ['上昇', '変化なし', '低下'],
    'rateTrend': [45.2, 45.0, 0.8],
    'borrowLabels': ['増加した', '変化なし', '減少した'],
    'borrow': [14.7, 46.4, 38.9],
    'costTop': '原材料価格', 'costTopPct': 56.3, 'costTopMfg': 74.5,
}

# ---- 東証の市場区分（東京都統計年鑑 令和5年 15-6 株式取引状況）----
# 列: 年 / 取引日数 / 上場会社数(期末) / 時価総額(期末) / 1日平均売買高 / 売買回転率
MARKET_YEARS = [2022, 2023]
MARKET = [
    {'key': 'prime', 'name': 'プライム',
     'listed': [1837, 1656], 'cap': [676270419, 833007509], 'turnover': [85.28, 115.81]},
    {'key': 'standard', 'name': 'スタンダード',
     'listed': [1449, 1619], 'cap': [21978089, 27395639], 'turnover': [149.72, 236.41]},
    {'key': 'growth', 'name': 'グロース',
     'listed': [513, 562], 'cap': [7017963, 6790789], 'turnover': [321.56, 428.15]},
]
_cap_total = sum(m['cap'][-1] for m in MARKET)
_listed_total = sum(m['listed'][-1] for m in MARKET)
for m in MARKET:
    # 時価総額は原データに単位表記がないため、構成比（単位に依存しない指標）で扱う
    m['capShare'] = round(m['cap'][-1] / _cap_total * 100, 1)
    m['listedShare'] = round(m['listed'][-1] / _listed_total * 100, 1)

data['market'] = {
    'label': '東京都統計年鑑 令和5年 15金融 15-6 株式取引状況（東京証券取引所）',
    'years': MARKET_YEARS,
    'segments': MARKET,
    'listedTotal': _listed_total,
    'note': '2022年は市場区分再編（2022年4月4日）以降の取引日数184日、2023年は246日。'
            '時価総額は原データに単位表記がないため、本サービスでは構成比のみを用いています。',
}

# ---- 海外投資家（日本取引所グループ 投資部門別売買状況・年間・金額）----
data['foreign'] = {
    'label': '日本取引所グループ「投資部門別売買状況（年間・株式・金額）」'
             'および「海外投資家地域別株券売買状況（年間）」',
    'years': [2022, 2023, 2024, 2025],
    'share': {'prime': [70.6, 69.6, 67.3, 66.2],
              'standard': [47.3, 44.3, 45.2, 48.0],
              'growth': [39.9, 40.5, 39.5, 42.2]},
    'shareNote': '委託取引の売買代金に占める海外投資家の比率（売り買い合計）。',
    'value2025': {'prime': 1650305968504, 'standard': 39487893149, 'growth': 35892381875},
    'net2025Prime': 5736478042,
    'primeTotal2025': 2803034248441,
    'individualsPrime2025': 26.7,
    'regionLabels': ['欧州', 'アジア', '北米', 'その他地域'],
    'regionShare': [75.31, 16.48, 7.53, 0.68],
    'regionNet': [3497511347, 944491286, 829207935, None],
    'regionNote': '全国証券取引所ベース。欧州の比率が高いのは、'
                  '海外運用会社の発注拠点がロンドン等に置かれているためとされます。',
    'unit': '金額の単位は千円。',
}

# 「海外マネーが届く度合い」の階段（非上場は制度上ゼロ）
data['ladder'] = [
    {'name': 'プライム', 'listed': 1656, 'share': 66.2, 'kind': 'listed'},
    {'name': 'スタンダード', 'listed': 1619, 'share': 48.0, 'kind': 'listed'},
    {'name': 'グロース', 'listed': 562, 'share': 42.2, 'kind': 'listed'},
    {'name': '非上場の都内中小企業', 'listed': 3875, 'share': 0.0, 'kind': 'unlisted'},
]

# ---- 都民が非上場中小企業に資金を届けられる経路（制度の事実整理）----
data['routes'] = [
    {'name': '購入型クラウドファンディング', 'kind': '前払い（投資ではない）',
     'min': '1,000円〜', 'cap': '上限なし', 'reach': 'reaches',
     'note': 'リターンは商品・サービス。金融商品ではないため元本の概念がない。'
             '資金供給としては最も敷居が低い。'},
    {'name': '融資型クラウドファンディング', 'kind': 'デット',
     'min': '1万円〜', 'cap': '事業者により異なる', 'reach': 'reaches',
     'note': '貸金業＋第二種金融商品取引業の登録業者を経由。元本保証はなく、'
             '貸倒れリスクを負う。'},
    {'name': '株式投資型クラウドファンディング', 'kind': 'エクイティ',
     'min': '10万円前後〜', 'cap': '同一発行者へ年間50万円（財産状況により最大200万円）',
     'reach': 'reaches',
     'note': '非上場株式のみが対象。発行側も年間5億円未満。'
             '売却先がなく流動性はほぼない。（出典：日本証券業協会）'},
    {'name': '信用金庫への預金', 'kind': '間接',
     'min': '制限なし', 'cap': '—', 'reach': 'indirect',
     'note': '投資ではないが、信用金庫の預貸率54.8％ぶんは地域の事業者へ貸し出される。'
             '都内中小企業の38.3％が信用金庫を主な取引先としている。'},
    {'name': '事業承継・小規模M&A（後継者として）', 'kind': '出資ではなく承継',
     'min': '数百万円〜', 'cap': '—', 'reach': 'reaches',
     'note': '「資金の出し手」ではなく「次の経営者」として関わる形。'
             '東京都事業承継・引継ぎ支援センター、TOKYO版創業・承継マッチング支援事業が窓口。'},
    {'name': 'NISA（成長投資枠・つみたて投資枠）', 'kind': '—',
     'min': '100円〜', 'cap': '年間360万円', 'reach': 'blocked',
     'note': '対象は上場株式等・公募投資信託。買えるのは東証に上場している3,837社であり、'
             '非上場の都内中小企業3,875社には届かない。しかもその資金が向かうプライム市場は、'
             '売買代金の66.2％を海外投資家が占める市場でもある。'},
    {'name': 'iDeCo', 'kind': '—', 'min': '5,000円〜', 'cap': '職業により異なる',
     'reach': 'blocked',
     'note': '運用対象は投資信託・定期預金・保険。非上場企業への直接の資金供給経路はない。'},
    {'name': 'エンジェル税制', 'kind': 'エクイティ＋税制',
     'min': '案件による', 'cap': '優遇措置Aは総所得×40％と1,000万円の低い方',
     'reach': 'mismatch',
     'note': '個人の未上場ベンチャーへの出資を所得控除等で優遇する制度。'
             'ただし対象は設立間もない企業であり、創業1980年以前が63.6％を占める'
             'この母集団とはほとんど重ならない。'},
]

# ============================================================
#  v4 追加：国債金利・連関分析・投資機会
# ============================================================
JGB = json.load(open('data/jgb_monthly.json'))
assert len(JGB['y10']) == N and JGB['ym_start'] == months[0], '国債金利の月次が景況DIと揃っていません'

# ---- 連関分析（月次255か月）----
_zen = series[5]
CORR_SERIES = [
    ('業況DI', _zen['gyokyo']),
    ('売上高DI', _zen['uriage_yoy']),
    ('仕入単価DI', _zen['shiire']),
    ('販売単価DI', _zen['hanbai']),
    ('見通しDI', _zen['gyokyo_fc']),
    ('価格転嫁ギャップ', [(a - b) if (a is not None and b is not None) else None
                    for a, b in zip(_zen['hanbai'], _zen['shiire'])]),
    ('国債10年', JGB['y10']),
    ('国債2年', JGB['y2']),
    ('製造業DI', series[14]['gyokyo']),
    ('卸売業DI', series[86]['gyokyo']),
    ('小売業DI', series[149]['gyokyo']),
    ('サービス業DI', series[203]['gyokyo']),
]


def pearson(a, b, lag=0):
    xs, ys = [], []
    for i in range(N):
        j = i + lag
        if j < 0 or j >= N:
            continue
        if a[i] is None or b[j] is None:
            continue
        xs.append(a[i])
        ys.append(b[j])
    n = len(xs)
    if n < 12:
        return None, n
    mx, my = sum(xs) / n, sum(ys) / n
    sx = sum((x - mx) ** 2 for x in xs) ** .5
    sy = sum((y - my) ** 2 for y in ys) ** .5
    if sx == 0 or sy == 0:
        return None, n
    return round(sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy), 3), n


labels = [k for k, _ in CORR_SERIES]
matrix = [[pearson(v, w)[0] for _, w in CORR_SERIES] for _, v in CORR_SERIES]

lag_fc = [{'lag': k, 'r': pearson(_zen['gyokyo_fc'], _zen['gyokyo'], k)[0],
           'n': pearson(_zen['gyokyo_fc'], _zen['gyokyo'], k)[1]} for k in range(0, 7)]
lag_jgb = [{'lag': k, 'r': pearson(JGB['y10'], _zen['gyokyo'], k)[0],
            'n': pearson(JGB['y10'], _zen['gyokyo'], k)[1]} for k in (0, 3, 6, 12)]


# ---- 「なぜ国債10年か」と「時差はないか」への回答（⑤の実装）----
def _diff12(a):
    """前年同月差の系列。水準ではなく変化幅で見るための変換。"""
    return [None if (i < 12 or a[i] is None or a[i - 12] is None) else a[i] - a[i - 12]
            for i in range(len(a))]


_pxg = _zen['gyokyo']
_gap = [None if (_zen['hanbai'][i] is None or _zen['shiire'][i] is None)
        else _zen['hanbai'][i] - _zen['shiire'][i] for i in range(N)]

# 金利は「水準」と「前年差」の両方で、0〜24か月のラグを総当たり
_rateScan = []
for _key, _lab in (('y10', '国債10年'), ('y2', '国債2年')):
    for _mode, _mlab, _ser in (('level', '水準', JGB[_key]), ('yoy', '前年差', _diff12(JGB[_key]))):
        _best = None
        _pts = []
        for _k in range(0, 25):
            _r, _nn = pearson(_ser, _pxg, _k)
            if _r is None:
                continue
            _pts.append({'lag': _k, 'r': _r, 'n': _nn})
            if _best is None or abs(_r) > abs(_best['r']):
                _best = {'lag': _k, 'r': _r, 'n': _nn}
        _rateScan.append({'key': _key + '_' + _mode, 'rate': _lab, 'mode': _mlab,
                          'pts': _pts, 'best': _best})

# 価格転嫁ギャップについても同じ走査（唯一つながっていた経路の時差を測る）
_gapScan = []
for _k in range(0, 25):
    _r, _nn = pearson(JGB['y10'], _gap, _k)
    if _r is not None:
        _gapScan.append({'lag': _k, 'r': _r, 'n': _nn})
_gapBest = max(_gapScan, key=lambda p: abs(p['r'])) if _gapScan else None

# 上場市場（東証プライム株価指数）と中小企業DI ── 2023年の月次のみ、参考値
TSE_2023 = {  # 東京都統計年鑑 令和5年 15-6（9月は原データに欠測）
    202301: 990.99, 202302: 1021.69, 202303: 1023.64, 202304: 1037.58,
    202305: 1093.84, 202306: 1160.91, 202307: 1169.75, 202308: 1175.48,
    202310: 1168.64, 202311: 1212.69, 202312: 1208.20,
}
_pairs = [(TSE_2023[m], _zen['gyokyo'][i])
          for i, m in enumerate(months) if m in TSE_2023 and _zen['gyokyo'][i] is not None]
if len(_pairs) >= 3:
    _xs = [p[0] for p in _pairs]
    _ys = [p[1] for p in _pairs]
    _n = len(_xs)
    _mx, _my = sum(_xs) / _n, sum(_ys) / _n
    _sx = sum((x - _mx) ** 2 for x in _xs) ** .5
    _sy = sum((y - _my) ** 2 for y in _ys) ** .5
    tse_r = round(sum((x - _mx) * (y - _my) for x, y in zip(_xs, _ys)) / (_sx * _sy), 3)
else:
    tse_r, _n = None, 0

data['corr'] = {
    'labels': labels,
    'matrix': matrix,
    'n': N,
    'lagForecast': lag_fc,
    'lagJgb': lag_jgb,
    'tseVsSme': {'r': tse_r, 'n': _n, 'note': '東証プライム株価指数（月末）と都内中小企業 業況DI。'
                 '東京都統計年鑑 15-6 の月次が2023年分しか揃わないため、参考値です。'},
    'note': 'ピアソンの積率相関係数。欠測月は対ごとに除外。景況DIは東京都、国債金利は財務省の月中平均。',
    'rateScan': _rateScan,
    'gapScan': _gapScan,
    'gapBest': _gapBest,
    'whyY10': ('国債10年を基準にしているのは、これが日本の長期金利の代表値として、'
               '銀行の貸出金利・社債の発行条件・不動産の利回り評価まで幅広く参照される「基準の金利」だからです。'
               '中小企業が実際に借りる金利そのものではありませんが、その土台になります。'
               '短期側の代表として国債2年でも同じ計算を行い、あわせて掲載しています。'),
    'lagAnswer': ('「時差があるだけでは？」という疑いに答えるため、金利を0〜24か月ずらして総当たりで相関を取り直しました。'
                  'さらに金利の水準ではなく前年同月差（変化幅）でも同じ走査を行っています。'
                  'どの組み合わせでも業況DIとの相関は弱いままで、時差の設定では説明がつきませんでした。'),
}

# ---- 国債イールドカーブ（財務省 国債金利情報）----
data['jgb'] = {
    'label': '財務省「国債金利情報」',
    'asOf': '2026年8月20日',
    'tenors': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40],
    'curve': [1.430, 1.682, 1.814, 2.000, 2.127, 2.269, 2.410, 2.576,
              2.713, 2.854, 3.409, 3.719, 4.017, 3.995, 4.002],
    'monthly': {'y10': JGB['y10'], 'y2': JGB['y2']},
}

# ---- 上場市場の利回りと回転率（東京都統計年鑑 15-6 令和5年）----
for m, yld, idx in zip(MARKET, [2.21, 2.22, 0.34], [1125.39, 1091.56, 945.70]):
    m['yield'] = yld
    m['index'] = idx

# ---- 投資機会の一覧（利回りは一次情報、アクセス可否は制度の事実）----
data['opportunities'] = [
    {'name': '国債 1年', 'ret': 1.430, 'kind': '債券', 'risk': '低',
     'access': 'ok', 'src': '財務省 国債金利情報 2026/8/20',
     'note': '個人向け国債は変動10年・固定5年・固定3年の3種で条件が異なります。'},
    {'name': '国債 10年', 'ret': 2.854, 'kind': '債券', 'risk': '低',
     'access': 'ok', 'src': '財務省 国債金利情報 2026/8/20',
     'note': '金利上昇局面で、東証プライムの配当利回り2.21%を上回っています。'},
    {'name': '国債 30年', 'ret': 3.995, 'kind': '債券', 'risk': '中（金利変動）',
     'access': 'ok', 'src': '財務省 国債金利情報 2026/8/20',
     'note': '超長期ゾーンは金利変動による価格の振れが大きくなります。'},
    {'name': '東証プライム株式（配当利回り）', 'ret': 2.21, 'kind': '株式', 'risk': '中〜高',
     'access': 'ok', 'src': '東京都統計年鑑 15-6（2023年）',
     'note': '売買回転率115.8%。海外投資家が売買代金の66.2%を占めます。NISA対象。'},
    {'name': '東証スタンダード株式（配当利回り）', 'ret': 2.22, 'kind': '株式', 'risk': '中〜高',
     'access': 'ok', 'src': '東京都統計年鑑 15-6（2023年）',
     'note': '売買回転率236.4%。海外投資家シェア48.0%。NISA対象。'},
    {'name': '東証グロース株式（配当利回り）', 'ret': 0.34, 'kind': '株式', 'risk': '高',
     'access': 'ok', 'src': '東京都統計年鑑 15-6（2023年）',
     'note': '配当ではなく値上がり益を狙う市場。売買回転率428.2%と極端に短期。NISA対象。'},
    {'name': '東京グリーン・ブルーボンド（個人向け・外貨建て・5年）', 'ret': 4.22, 'kind': '債券（外貨）',
     'risk': '中（為替変動）', 'access': 'ok', 'src': '東京都財務局 第9回・R7.12',
     'note': '東京都が個人向けに発行する外貨建て債。国債5年（2.127%）の約2倍の表面利率ですが、'
             '為替変動のリスクは購入者が負います。調達資金は都の環境事業に充当されます。'},
    {'name': '個人向け都債（円建て・3年）', 'ret': 0.18, 'kind': '債券（円）', 'risk': '低',
     'access': 'blocked', 'src': '東京都財務局 第18回・H25.12',
     'note': '平成25年12月の第18回を最後に発行が止まっています。'
             '都民が円で東京都に直接資金を出す公式の窓口は、現在ありません。'},
    {'name': '融資型クラウドファンディング', 'ret': None, 'kind': 'デット', 'risk': '高（貸倒れ）',
     'access': 'ok', 'src': '—',
     'note': '案件ごとに想定利回りが提示されます。元本保証はありません。1万円程度から。'},
    {'name': '株式投資型クラウドファンディング（非上場）', 'ret': None, 'kind': 'エクイティ', 'risk': '極めて高',
     'access': 'capped', 'src': '日本証券業協会',
     'note': '配当も流動性もほぼありません。同一発行者へ年間50万円（財産状況により最大200万円）が上限。'},
    {'name': '都内中小企業への直接投資', 'ret': None, 'kind': 'エクイティ', 'risk': '—',
     'access': 'blocked', 'src': '—',
     'note': '個人が売買できる市場が存在しません。関われるのは融資型・株式投資型CF、'
             '信用金庫への預金、あるいは後継者として事業を引き継ぐ経路に限られます。'},
]

# ---- 事業者から見た金利ギャップ ----
data['rateGap'] = {
    'jgb10': 2.854,
    'jgb2': 1.682,
    'smeRateLabels': ['1％未満', '1％台', '2％台'],
    'smeRate': [13.8, 36.7, 38.7],
    'smeRatePrev': [16.7, 41.2, 32.5],
    'trendUp': 45.2,
    'note': '都内中小企業の借入金利は「2％台」が38.7％で最多。'
            '一方、国債10年は2.854％、2年でも1.682％。'
            '調達金利の上昇はまだ市場金利に追いついておらず、今後の上昇余地が残っています。',
}

# ---- 都債（東京都財務局 都債IR情報）----
data['tosai'] = {
    'label': '東京都財務局「都債IR情報 — 個人向け都債 発行予定/実績」',
    'url': 'https://www.zaimu.metro.tokyo.lg.jp/bond/tosai_hakkoujouken/saisei',
    'fx': {  # 東京グリーン・ブルーボンド（外貨建て・個人向け）
        'name': '東京グリーン・ブルーボンド（外貨建て）',
        'rows': [
            {'no': '第9回', 'yr': 'R7.12', 'term': 5, 'rate': 4.22, 'ccy': '豪ドル', 'amt': '1億400万'},
            {'no': '第8回', 'yr': 'R6.12', 'term': 5, 'rate': 3.88, 'ccy': '豪ドル', 'amt': '1億400万'},
            {'no': '第7回', 'yr': 'R5.12', 'term': 5, 'rate': 4.06, 'ccy': '豪ドル', 'amt': '1億700万'},
            {'no': '第6回', 'yr': 'R4.12', 'term': 5, 'rate': 3.63, 'ccy': '豪ドル', 'amt': '1億1千万'},
            {'no': '第5回', 'yr': 'R3.12', 'term': 5, 'rate': 1.83, 'ccy': '豪ドル', 'amt': '1億2千2百万'},
            {'no': '第4回', 'yr': 'R2.12', 'term': 5, 'rate': 0.41, 'ccy': '豪ドル', 'amt': '1億3千9百万'},
            {'no': '第3回', 'yr': 'R1.12', 'term': 5, 'rate': 1.60, 'ccy': '米ドル', 'amt': '9千4百万'},
            {'no': '第2回', 'yr': 'H30.12', 'term': 5, 'rate': 2.91, 'ccy': '米ドル', 'amt': '8千9百万'},
        ],
    },
    'jpy': {  # 円建ての個人向け都債（第18回で終了）
        'name': '個人向け都債（円建て）',
        'lastNo': '第18回', 'lastDate': '平成25年12月4日', 'lastRate': 0.18,
        'term': 3, 'amountOku': 200, 'count': 18, 'since': '平成14年9月',
        'rows': [
            {'no': '第18回', 'yr': 'H25.12', 'rate': 0.18}, {'no': '第17回', 'yr': 'H24.12', 'rate': 0.16},
            {'no': '第16回', 'yr': 'H23.12', 'rate': 0.26}, {'no': '第15回', 'yr': 'H22.12', 'rate': 0.26},
            {'no': '第14回', 'yr': 'H21.12', 'rate': 0.50}, {'no': '第13回', 'yr': 'H20.12', 'rate': 0.86},
            {'no': '第12回', 'yr': 'H19.12', 'rate': 1.00}, {'no': '第11回', 'yr': 'H19.9', 'rate': 1.06},
            {'no': '第10回', 'yr': 'H18.12', 'rate': 1.02}, {'no': '第9回', 'yr': 'H18.9', 'rate': 1.04},
            {'no': '第8回', 'yr': 'H17.12', 'rate': 0.48}, {'no': '第7回', 'yr': 'H17.9', 'rate': 0.32},
            {'no': '第6回', 'yr': 'H16.12', 'rate': 0.30}, {'no': '第5回', 'yr': 'H16.9', 'rate': 0.36},
            {'no': '第4回', 'yr': 'H15.12', 'rate': 0.34}, {'no': '第3回', 'yr': 'H15.9', 'rate': 0.36},
            {'no': '第2回', 'yr': 'H14.12', 'rate': 0.18}, {'no': '第1回', 'yr': 'H14.9', 'rate': 0.12},
        ],
    },
    'finding': '円建ての個人向け都債は平成25年12月の第18回を最後に発行が止まっています。'
               'いま東京都が個人向けに出しているのは外貨建てのグリーン・ブルーボンドで、'
               '直近の第9回は5年・表面利率4.22％。国債5年（2.127％）の約2倍ですが、'
               '為替変動のリスクは購入者が負います。'
               '都民が「円で東京に投資する」公式の窓口は、12年以上閉じたままです。',
    'gapYears': 12,
}

# ---- 今月のファイナンス環境（④の実装：毎月の連関サマリー）----
_g = _zen['gyokyo']
_gf = _zen['gyokyo_fc']
_hb, _sh = _zen['hanbai'], _zen['shiire']
_last = N - 1
_climate = {
    'label': f'{str(months[_last])[:4]}年{int(str(months[_last])[4:])}月時点',
    'items': [
        {'k': '実体（業況DI）', 'v': _g[_last], 'd': (_g[_last] - _g[_last - 1]) if _g[_last - 1] is not None else None,
         'unit': '', 'good': 'up', 'src': '東京都 中小企業の景況'},
        {'k': '先行き（見通しDI）', 'v': _gf[_last], 'd': (_gf[_last] - _gf[_last - 1]) if _gf[_last - 1] is not None else None,
         'unit': '', 'good': 'up', 'src': '同上'},
        {'k': '価格転嫁ギャップ', 'v': (_hb[_last] - _sh[_last]) if (_hb[_last] is not None and _sh[_last] is not None) else None,
         'd': None, 'unit': '', 'good': 'up', 'src': '同上'},
        {'k': '調達コスト（国債10年）', 'v': JGB['y10'][_last], 'd': round(JGB['y10'][_last] - JGB['y10'][_last - 1], 3),
         'unit': '%', 'good': 'down', 'src': '財務省 国債金利情報'},
        {'k': '資金需要DI（今後3か月）', 'v': 13.6, 'd': round(13.6 - 10.5, 1), 'unit': '',
         'good': 'up', 'src': '東京都 事業資金に関する調査'},
        {'k': '海外マネー（プライム）', 'v': 66.2, 'd': round(66.2 - 67.3, 1), 'unit': '%',
         'good': 'up', 'src': 'JPX 投資部門別売買状況'},
    ],
}
# 透明な合成：実体の前月差 + 先行きの前月差 − 金利上昇分 ×10
_dg = (_g[_last] - _g[_last - 1]) if _g[_last - 1] is not None else 0
_dgf = (_gf[_last] - _gf[_last - 1]) if _gf[_last - 1] is not None else 0
_dr = JGB['y10'][_last] - JGB['y10'][_last - 1]
_score = round(_dg + _dgf - _dr * 10, 1)
if _score >= 4:
    _verdict, _vkey = 'ゆるみつつある', 'growth'
elif _score <= -4:
    _verdict, _vkey = '引き締まりつつある', 'defense'
else:
    _verdict, _vkey = 'ほぼ横ばい', 'neutral'
_climate['score'] = _score
_climate['verdict'] = _verdict
_climate['vkey'] = _vkey
_climate['formula'] = ('今月のファイナンス環境スコア ＝ 業況DIの前月差 ＋ 見通しDIの前月差 − '
                       '国債10年利回りの前月差 × 10。+4以上でゆるみ、−4以下で引き締まりと判定します。')
data['climate'] = _climate

# ---- 都民の資産形成格差（⑥の中核）----
_kz = json.load(open('data/kazei_r5.json', encoding='utf-8'))
_muni = []
for _n, _nz, _amt, _ide, _ins in _kz['rows']:
    _muni.append({
        'n': _n, 'nz': _nz,
        'base': round(_amt * 1000 / _nz / 0.06),      # 課税標準額の目安（円／人）
        'ide': round(_ide / _nz * 100, 2),            # 小規模企業共済等掛金控除（iDeCo含む）利用率
        'ins': round(_ins / _nz * 100, 1),            # 生命保険料控除 利用率
    })
_muni.sort(key=lambda r: -r['base'])


def _pearson(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((a - mx) * (b - my) for a, b in zip(xs, ys))
    den = (sum((a - mx) ** 2 for a in xs) * sum((b - my) ** 2 for b in ys)) ** 0.5
    return round(num / den, 3) if den else None


_bx = [m['base'] for m in _muni]

# 全62区市町村の1人当たり住民税負担額（区部を含む格差の全体像）
_jz = json.load(open('data/juminzei_r4.json', encoding='utf-8'))
_all = sorted([{'n': r[0], 'v': r[1], 'g': r[2]} for r in _jz['rows']], key=lambda r: -r['v'])
_ward = [r for r in _all if r['g'] == '区部']

data['inequality'] = {
    'all': {
        'label': _jz['label'], 'url': _jz['url'], 'metric': _jz['metric'], 'note': _jz['note'],
        'rows': _all, 'n': len(_all), 'tokyo': _jz['tokyo'], 'groups': _jz['groups'],
        'top': _all[0], 'bottom': _all[-1],
        'ratio': round(_all[0]['v'] / _all[-1]['v'], 1),
        'wardTop': _ward[0], 'wardBottom': _ward[-1],
        'wardRatio': round(_ward[0]['v'] / _ward[-1]['v'], 1),
    },
    'label': _kz['label'],
    'url': _kz['url'],
    'note': _kz['note'],
    'muni': _muni,
    'n': len(_muni),
    'rIde': _pearson(_bx, [m['ide'] for m in _muni]),
    'rIns': _pearson(_bx, [m['ins'] for m in _muni]),
    'ideRange': [min(m['ide'] for m in _muni), max(m['ide'] for m in _muni)],
    'insRange': [min(m['ins'] for m in _muni), max(m['ins'] for m in _muni)],
    'baseRange': [min(_bx), max(_bx)],
    'totalNz': sum(m['nz'] for m in _muni),
    'totalIde': sum(r[3] for r in _kz['rows']),
    'wardNote': ('この散布図の対象は多摩・島しょの39市町村です。23区が入っていないのは、'
                 '23区の個人住民税が「特別区民税」として各区に課され、市町村を対象とする'
                 '「市町村税課税状況等の調」の集計外になるためです。'
                 '所得控除の適用人員（iDeCo等の利用状況）を区ごとに取れる公開データは見つかりませんでした。'
                 'ひとつ上の「全62区市町村の負担額」の図には区部を含めており、'
                 '格差の大きさそのものはそちらで示しています。'),
    'finding': ('生命保険料控除はどの自治体でも65〜75％の人が使っています（利用率の差は1.2倍以内、'
                '所得との相関はむしろ弱いマイナス）。ところが iDeCo・小規模企業共済など'
                '「資産を積み上げる制度」の利用率は、所得水準との相関が r=0.80。'
                '最も高い自治体と低い自治体で2.5倍の開きがあります。'
                '守りの制度は誰でも使えているのに、増やす制度は所得の高い地域に偏っている。'
                'これが数字に出た資産形成格差です。'),
}

# ---- 政策との接続（目的：国際金融都市・東京構想2.0／金融・資産運用特区）----
data['policy'] = {
    'gfci': {'edition': 'GFCI 39（2026年3月）', 'rank': 10, 'prevRank': 15, 'rating': 739, 'prevRating': 744,
             'top': [['New York', 767], ['London', 766], ['Hong Kong', 765], ['Singapore', 764],
                     ['San Francisco', 744], ['Shanghai', 743], ['Dubai', 742], ['Seoul', 741],
                     ['Shenzhen', 740], ['Tokyo', 739]],
             'src': 'Z/Yen Group & China Development Institute, The Global Financial Centres Index 39',
             'url': 'https://www.longfinance.net/programmes/financial-centre-futures/global-financial-centres-index/'},
    'items': [
        {'name': '「国際金融都市・東京」構想2.0',
         'who': '東京都', 'when': '令和3年11月策定',
         'what': 'サステナブルな社会を実現する「アジアのイノベーション・金融ハブ」を目標に掲げ、資産運用業者の育成、'
                 'サステナブルファイナンス、フィンテック支援などを展開。',
         'evidence': 'GFCIの東京の順位は第39版（2026年3月）で10位。前版の15位から5つ上昇し、10位以内に復帰しました。',
         'gap': 'ただしスコアは744→739と低下しており、順位の上昇は他都市の後退による面があります。'
                '本サービスの実測では、この市場の活況は非上場の中小企業の景況とほぼ無相関（r=-0.03）でした。',
         'url': 'https://www.sangyo-rodo.metro.tokyo.lg.jp/gfct/vision'},
        {'name': '「金融・資産運用特区」への提案',
         'who': '東京都 → 国', 'when': '令和6年2月提出',
         'what': '16項目の規制緩和等を提案。内訳はサステナブルファイナンス9項目、'
                 'グローバルに活躍するスタートアップ4項目（銀行グループによるスタートアップ投資規制の緩和ほか）、'
                '“英語でビジネス”3項目（創業時の英語手続の拡充、英文IR情報開示の推進ほか）。',
         'evidence': '提案の3本柱は、本サービスが可視化した3つの断絶（ESG資金の出口・成長企業の調達手段・海外への情報開示）と対応します。',
         'gap': '提案は運用業者と上場企業に届く一方、非上場の中小企業に資金を通す経路の規制緩和は含まれていません。',
         'url': 'https://www.sangyo-rodo.metro.tokyo.lg.jp/gfct/initiatives/nurturing-players/asset-management/global-financial-hub-proposal'},
        {'name': '東京グリーンボンド／個人向け都債',
         'who': '東京都財務局', 'when': '円建ては平成14年〜平成25年、外貨建ては平成30年〜',
         'what': '都民が東京都に直接資金を出せる唯一の公式な入口。現在は外貨建ての'
                 '東京グリーン・ブルーボンド（直近 第9回・5年・表面利率4.22％）。',
         'evidence': '外貨建ては毎年発行が続いており、ESG資金の受け皿として機能しています。',
         'gap': '円建ての個人向け都債は平成25年12月の第18回を最後に12年以上発行がありません。'
                '為替リスクを取れない都民には、東京都へ円で投資する経路が開いていません。',
         'url': 'https://www.zaimu.metro.tokyo.lg.jp/bond/tosai_hakkoujouken/saisei'},
    ],
}

# ---- 為替（円キャリーの前提を検証する）----
_fx = json.load(open('data/fx_usdjpy.json', encoding='utf-8'))
_v = _fx['usdjpy']
_chg = [round((_v[i] / _v[i - 12] - 1) * 100, 2) for i in range(12, len(_v))]
_months_fx = months[12:len(_v)]
_BE = round(-(4.22 - 1.43) / (1 + 4.22 / 100), 2)     # 損益分岐となる円高率
_lose = [c for c in _chg if c < _BE]
_r5 = _chg[-60:]
data['fx'] = {
    'label': _fx['label'], 'url': _fx['url'],
    'usdjpy': _v, 'start': _fx['start'],
    'chg': _chg, 'chgMonths': _months_fx,
    'n': len(_chg),
    'breakEven': _BE,
    'upCount': len([c for c in _chg if c > 0]),
    'upPct': round(len([c for c in _chg if c > 0]) / len(_chg) * 100, 1),
    'losePct': round(len(_lose) / len(_chg) * 100, 1),
    'loseCount': len(_lose),
    'worst': min(_chg), 'best': max(_chg),
    'mean': round(sum(_chg) / len(_chg), 2),
    'r5UpPct': round(len([c for c in _r5 if c > 0]) / len(_r5) * 100, 0),
    'r5Mean': round(sum(_r5) / len(_r5), 2),
    'latest': _v[-1],
    'finding': ('直近5年だけを見れば、12か月後に円安になっていた月は9割。'
                '「円安傾向だから基本は儲かる」という感覚は、この5年に限れば数字と一致します。'
                'ただし2006年以降の243か月で見ると円安だった月は53.9％で、ほぼ五分五分。'
                f'損益分岐（円高{abs(_BE)}％）を下回った月は3回に1回にあたり、'
                f'最悪の12か月では{abs(min(_chg))}％の円高が起きています。'
                'この取引は「円安が続く」という前提に賭けるもので、'
                '前提が外れる年がおよそ3年に1回まざる、というのが20年の記録です。'),
}

# ---- ツールのパラメータ（入口チェッカー）----
# 自治体ごとに「担税力」と「制度の使われ方」を結合（区部は利用率データなし）
_ide = {m['n']: m for m in _muni}
_muniTool = []
for i, r in enumerate(_all):
    e = _ide.get(r['n'])
    _muniTool.append({
        'n': r['n'], 'g': r['g'], 'v': r['v'], 'rank': i + 1,
        'ide': e['ide'] if e else None,
        'ins': e['ins'] if e else None,
    })

data['tools'] = {
    'muni': _muniTool,
    'muniN': len(_muniTool),
    'tokyoAvg': _jz['tokyo'],
    'ideAvg': round(sum(m['ide'] for m in _muni) / len(_muni), 2),
    # 年収帯 → 概算の課税所得と限界税率（所得税＋住民税10%）
    'income': [
        {'k': '300万円未満', 'taxable': 1100000, 'it': 5, 'rt': 15},
        {'k': '300〜500万円', 'taxable': 2000000, 'it': 10, 'rt': 20},
        {'k': '500〜700万円', 'taxable': 3400000, 'it': 20, 'rt': 30},
        {'k': '700〜1,000万円', 'taxable': 5000000, 'it': 20, 'rt': 30},
        {'k': '1,000万円以上', 'taxable': 7500000, 'it': 23, 'rt': 33},
    ],
    # 働き方 → 使える制度と年間の拠出上限（円）
    'work': [
        {'k': '会社員（企業年金なし）', 'ideco': 276000, 'kyosai': 0,
         'note': 'iDeCoの上限は月23,000円。企業年金がある場合は上限が下がります。'},
        {'k': '公務員', 'ideco': 240000, 'kyosai': 0,
         'note': 'iDeCoの上限は月20,000円。'},
        {'k': '自営業・フリーランス', 'ideco': 816000, 'kyosai': 840000,
         'note': 'iDeCoは月68,000円（国民年金基金等と合算）。小規模企業共済は月70,000円まで。'},
        {'k': '会社役員', 'ideco': 276000, 'kyosai': 840000,
         'note': '小規模企業共済は常時使用する従業員数などの要件があります。'},
    ],
    'nisaTsumitate': 1200000,
    'nisaGrowth': 2400000,
    'taxOnGain': 20.315,
    'limitNote': ('拠出上限・税率はいずれも一般的な条件での目安です。'
                  '企業年金の有無、他の所得控除、扶養の状況で変わります。'
                  '制度改正もあるため、実際の枠は必ず一次窓口でご確認ください。'),
    'links': [
        ['iDeCo公式サイト（国民年金基金連合会）', 'https://www.ideco-koushiki.jp/'],
        ['小規模企業共済（中小機構）', 'https://www.smrj.go.jp/kyosai/skyosai/'],
        ['NISA特設ウェブサイト（金融庁）', 'https://www.fsa.go.jp/policy/nisa2/'],
        ['東京都 事業承継・引継ぎ支援センター', 'https://jigyo-hikitsugi.go.jp/'],
    ],
}

# ---- 世界の金利（民間・政府公表データ。都民の選択肢を広げるための比較軸）----
data['world'] = {
    'label': '米国財務省 Daily Treasury Par Yield Curve Rates',
    'url': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/'
           'daily-treasury-rates.htm',
    'asOf': '2026年2月26日',
    'note': '本サービスが取得できた直近の公表値です。日本国債（2026年8月20日）とは基準日が異なります。',
    'us': {'1': 3.52, '2': 3.42, '5': 3.57, '10': 4.02, '30': 4.67},
    'compare': [
        {'n': '日本国債 10年', 'v': None, 'ccy': '円', 'fx': False, 'src': '財務省'},
        {'n': '米国債 10年', 'v': 4.02, 'ccy': '米ドル', 'fx': True, 'src': '米国財務省'},
        {'n': '東京グリーン・ブルーボンド（豪ドル・5年）', 'v': 4.22, 'ccy': '豪ドル', 'fx': True,
         'src': '東京都財務局'},
        {'n': '東証プライム 配当利回り', 'v': 2.21, 'ccy': '円', 'fx': False, 'src': '東京都統計年鑑 15-6'},
    ],
    'finding': ('円のままで取れる利回りと、為替リスクを取れば届く利回りには差があります。'
                'この差は運用の巧拙ではなく通貨ごとの金利水準の違いで、'
                '受け取るには為替の変動を引き受ける必要があります。'
                '下のシミュレーターでは、どちらを選ぶかで20年後がどう変わるかを並べて表示します。'),
}

# ---- 数字が制度に返すもの（ツールの結果から導かれる論点）----
data['actions'] = [
    {
        'no': '01',
        'name': '円建て個人向け都債の再開 ―「東京中小企業応援債」',
        'to': ['都民', '事業者'],
        'fact': '円建ての個人向け都債は平成25年12月の第18回（利率0.18％）を最後に12年以上発行がありません。'
                'その間に国債10年は2.854％まで戻り、東京都は外貨建てで年4.22％を払い続けています。'
                '都民が「円で東京に投資する」公式の入口だけが閉じたままです。',
        'do': '円建ての個人向け都債を再開し、調達資金の充当先を「中小企業制度融資の原資」と'
              '「信用保証料の補助」に限定して明示する。買った都民が、自分の資金の行き先を追えるようにする。',
        'why': '都民側は為替リスクを負わずに国債並みの利回りへ到達できる入口が復活します。'
               '事業者側は保証料補助・利子補給の財源が増え、借入コストが下がります。'
               '同じ一本の債券が、資産形成の入口と資金調達の緩和を同時に動かします。',
        'risk': '都債は東京都の債務であり、償還財源は税です。発行規模の拡大は財政規律の議論と切り離せません。'
                'また第18回の発行額は200億円で、都内中小企業全体の資金需要に対しては規模が小さく、'
                '象徴的な入口としての意味が先に立ちます。',
    },
    {
        'no': '02',
        'name': '資産形成制度の利用率を区市町村ごとに公表し、KPIにする',
        'to': ['都民'],
        'fact': 'iDeCo・小規模企業共済等の利用率は、自治体の所得水準との相関が r=0.80、'
                '最も高い自治体と低い自治体で2.5倍の開きがあります。'
                '一方で生命保険料控除の利用率は65〜75％の範囲に収まり、差は1.15倍しかありません。'
                '制度は全国一律なのに、増やす制度だけ使われ方が偏っています。',
        'do': '区市町村別の利用率を毎年公表し、低い自治体では商工会・信用金庫・区市町村の窓口を通じた'
              '重点的な情報提供を行う。数字を出すこと自体を最初の一手にする。',
        'why': '偏りの理由が「知らない・手続きが分からない」であれば、周知だけで縮む余地があります。'
               '公表すれば、どこに手を打つべきかが自治体側にも見えます。',
        'risk': '利用率の低さが単純に可処分所得の不足によるものなら、周知では動きません。'
                '原因の切り分けには追加調査が必要です。また現在のデータでは特別区（23区）の利用率が取れず、'
                '最も人口の多い地域が測れていません。まず区部のデータを取れるようにすることが前提になります。',
    },
    {
        'no': '03',
        'name': '中小企業支援の予算を、金利の動きの2年先回りで組む',
        'to': ['事業者'],
        'fact': '国債金利と業況DIを同じ月で比べると r=−0.03 でほぼ無関係に見えます。'
                'ところが金利を24か月さかのぼって比べると r=−0.54。'
                '金利は中小企業に効いていないのではなく、およそ2年遅れて効いていました。',
        'do': '現在の金利上昇局面（国債2年 1.682％）に対応する景況の悪化は2年後に表れるという前提で、'
              '信用保証枠・利子補給の予算を先に確保しておく。悪化してから組むのではなく、'
              '悪化が来る前提で積んでおく。',
        'why': '支援策は予算措置から現場に届くまで時間がかかります。'
               '「金利が上がった年」ではなく「その2年後」を山と見て備えれば、間に合う確率が上がります。',
        'risk': '相関は因果ではありません。景況は為替・物価・海外需要にも左右されるため、'
                'この関係だけを根拠に予算を動かすことはできません。'
                '2年という数字も24か月までの走査で最大だっただけで、さらに先で強まる可能性が残ります。',
    },
    {
        'no': '04',
        'name': '景況調査の資金調達手段に、エクイティの選択肢を足す',
        'to': ['事業者'],
        'fact': '東京都「事業資金に関する調査」の調達手段は、自己資金・借入（融資）・借入（その他）の3択です。'
                '増資も、社債も、クラウドファンディングも、選択肢として存在しません。',
        'do': '選択肢に「増資（第三者割当を含む）」「株式投資型クラウドファンディング」「社債」を追加する。',
        'why': 'いまは「エクイティが使われていない」ことすら数字で言えません。'
               '成長企業の資金調達難を政策で扱うには、まず実態が測れる状態にする必要があります。'
               '設問をひとつ足すだけで、翌年から時系列が積み上がります。',
        'risk': '設問の追加は回答者の負担を増やします。既存項目との入れ替えを含めた設計が要ります。',
    },
]

data['sources'] = [
    {'n': '東京都中小企業の景況（月次・回答3,875社対象）', 'org': '東京都産業労働局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000012d0000000087',
     'file': 'https://www.opendata.metro.tokyo.lg.jp/sangyouroudou/130001_chusyokeikyo.xlsx',
     'lic': 'CC BY 4.0', 'use': '25業種×5指標×255か月のDI時系列。資金需要タイプ判定と事業体力スコアの中核。'},
    {'n': '東京都中小企業の景況 付帯調査「景況調査回答企業の概要」（令和8年6月）', 'org': '東京都産業労働局',
     'url': 'https://www.sangyo-rodo.metro.tokyo.lg.jp/data/chushou/keikyou',
     'file': 'https://www.sangyo-rodo.metro.tokyo.lg.jp/documents/d/sangyo-rodo/keikyo_futai202606',
     'lic': 'CC BY 4.0', 'use': '経営者年齢・創業年・所在地の構成比。承継緊急度スコアの中核。全行の合計が100%になることを検算のうえ採録。'},
    {'n': '東京都中小企業の景況 付帯調査「事業資金に関する調査」（令和8年5月）', 'org': '東京都産業労働局',
     'url': 'https://www.sangyo-rodo.metro.tokyo.lg.jp/data/chushou/keikyou',
     'file': 'https://www.sangyo-rodo.metro.tokyo.lg.jp/documents/d/sangyo-rodo/keikyo_futai202605',
     'lic': 'CC BY 4.0', 'use': '資金需要DI・資金使途・調達手段・借入金利・取引金融機関。事業者ビューの裏づけ。'},
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
    {'n': '東京都統計年鑑 令和5年 15金融 15-6 株式取引状況（東京証券取引所）', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000001026',
     'file': 'https://www.toukei.metro.tokyo.lg.jp/tnenkan/2023/tn23qv150601.csv',
     'lic': 'CC BY 4.0', 'use': 'プライム・スタンダード・グロースの上場会社数と時価総額。上場市場の規模と偏りを示す。'},
    {'n': '投資部門別売買状況（年間・株式・金額）／海外投資家地域別株券売買状況', 'org': '日本取引所グループ（民間データ）',
     'url': 'https://www.jpx.co.jp/markets/statistics-equities/investor-type/00-02.html',
     'file': 'https://www.jpx.co.jp/markets/statistics-equities/investor-type/04-01.html',
     'lic': 'JPX 公表統計', 'use': '海外投資家の売買代金シェアと地域別内訳。市場区分ごとに海外マネーの届き方がどう変わるかを示す。'},
    {'n': '都債IR情報 個人向け都債 発行予定/実績', 'org': '東京都財務局',
     'url': 'https://www.zaimu.metro.tokyo.lg.jp/bond/tosai_hakkoujouken/saisei',
     'file': 'https://www.zaimu.metro.tokyo.lg.jp/bond/tosai_hakkoujouken/saisei',
     'lic': '東京都 利用規約', 'use': '個人向け都債（円建て・外貨建て）の発行実績と表面利率。都民が東京都へ直接資金を出せる経路の実態を示す。'},
    {'n': '国債金利情報（イールドカーブ・月次時系列）', 'org': '財務省（政府公表データ）',
     'url': 'https://www.mof.go.jp/jgbs/reference/interest_rate/index.htm',
     'file': 'https://www.mof.go.jp/jgbs/reference/interest_rate/data/jgbcm_all.csv',
     'lic': '財務省 利用規約', 'use': '投資機会のイールドカーブと、景況DIとの連関分析（255か月）に使用。'},
    {'n': '市町村税課税状況等の調（令和5年度）Q_02／Q_19', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000000352',
     'file': 'https://www.opendata.metro.tokyo.lg.jp/soumu/toukei/shityousoun/Q_19_R5.xlsx',
     'lic': 'CC BY 4.0',
     'use': '多摩・島しょ39市町村の所得割額と、iDeCo・小規模企業共済等（小規模企業共済等掛金控除）'
            'および生命保険料控除の適用人員。資産形成制度の利用率の格差（r=0.80）の算出に使用。'},
    {'n': '東京都統計年鑑 令和5年 21財政 21-8 地域別個人住民税負担額', 'org': '東京都総務局',
     'url': 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000003d2000001034',
     'file': 'https://www.toukei.metro.tokyo.lg.jp/tnenkan/2023/tn23qv210800.csv',
     'lic': 'CC BY 4.0',
     'use': '全62区市町村の住民1人当たり個人住民税負担額。区部を含む担税力の格差（最大7.9倍）と、'
            '入口チェッカーの地域表示に使用。'},
    {'n': '為替相場（東京市場 ドル・円 スポット 月中平均）', 'org': '日本銀行（政府関係機関の公表統計）',
     'url': 'https://www.stat-search.boj.or.jp/ssi/mtshtml/fm08_m_1.html',
     'file': 'https://www.stat-search.boj.or.jp/ssi/mtshtml/fm08_m_1.html',
     'lic': '日本銀行 利用規約',
     'use': '255か月のドル円から12か月変化率を243回算出し、「円安傾向だから儲かる」という前提を検証。'},
    {'n': '事業概況（令和6年度通期・令和7年度第3四半期）', 'org': '東京信用保証協会',
     'url': 'https://www.cgc-tokyo.or.jp/about/profile/cgc_gaikyou-.html',
     'file': 'https://www.cgc-tokyo.or.jp/about/profile/cgc_gaikyou-.files/cgc_gaikyou_R6-43.pdf.pdf',
     'lic': '東京信用保証協会 公表資料',
     'use': '統計年鑑が2023年度で止まっているため、代位弁済・保証承諾の系列を2024年度まで延長。'
            '2025年度は4〜12月の途中経過として注記のみに使用。'},
    {'n': 'Daily Treasury Par Yield Curve Rates（米国債利回り）', 'org': '米国財務省（民間・海外公表データ）',
     'url': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.htm',
     'file': 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.htm',
     'lic': 'U.S. Treasury（公開データ）',
     'use': '円のまま取れる利回りと、為替リスクを取れば届く利回りの比較軸。積立シミュレーションの選択肢に使用。'},
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
