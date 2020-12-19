---
title: "Numerai Signals の結果で実際に運用してみた"
emoji: "📈"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["numerai"]
published: true
---

[Numerai Advent Calendar 2020](https://adventar.org/calendars/5031) 19 日目の記事です。

※ 扱う内容が投資の内容のため、実際にご自身で試される場合には全て自己責任でお願いします。

## Numerai Signals

Numerai や Numerai Signals については次の記事を読んでもらえると理解しやすいです。

- [機械学習による株価予測　はじめよう Numerai \- Qiita](https://qiita.com/blog_UKI/items/fb401725288e58c92bd6)
- [機械学習による株価予測　さがそう 真の Numerai Signals \- Qiita](https://qiita.com/blog_UKI/items/6f044b41819f1f003426)

ざっくり説明すると、**株価の値動きを Kaggle のコンペみたいにデータサイエンスティスト達に予測させて、それで運用してみて、結果を予測が当たった人に分配していく仕組みのヘッジファンド**の仕組みです。

特に Numerai Signals はアノニマイズ(匿名化)されていないデータを予測するので、実際の日本やアメリカの株式銘柄が今後 1 週間で上がるか下がるかを予測します。

## 思ったこと

銘柄毎に上がるか下がるかの予測値が出ているので、実際にその数値で投資してみたら、上手くいくのか試してみようと思いました。

## 投資方法

投資方法は[マーケット・ニュートラル運用](https://www.daiwa-am.co.jp/guide/term/ma/maake_1.html)という、相場の影響を減らして運用する方式を採用。
今回はまだ、Signals モデルも改良中なので、お試しとして千円から銘柄に投資できる、OneTapBUY 証券を利用しました。

https://www.onetapbuy.co.jp/base/begin/begin.html

また銘柄も次のように毎週銘柄を変更して購入しています。

運用期間: 2020 年 11 月 13 日(金)　～ 2020 年 12 月 19 日(土)(この記事の公開日)
Signals の Round では(238~242)

- 日本株

  - 予測して、OneTapBUY の採用銘柄で Signal の高かった順に上位 2 銘柄を千円で購入
  - マーケット・ニュートラルにするために、日経ダブルインバース ETF(日経平均が下がった場合に 2 倍値上がりするように価格が調整される銘柄)を千円で購入

- 米株
  - 予測して、OneTapBUY の採用銘柄で Signal の高かった順に上位 3 銘柄を千円で購入
  - マーケット・ニュートラルにするために、Direxion Daily S&P 500 Bear 3X Shares ETF(S&P 500 が下がった場合 3 倍値上がりするように価格が調整される銘柄)を千円で購入

なので、毎週 `2(日本株買い) + 1(日本株2倍売り) + 3(米株買い) + 1(米株3倍売り) = 7銘柄` の 7 千円分購入していました。

OneTapBUY では千円の少額で購入できる代わりに、取引できる銘柄が限定されていたり、手数料(スプレッド)もあるので気をつけて下さい。また、米株には為替も影響してきます。

OneTapBUY で少額のマーケット・ニュートラルを実施するために、このような形になっていますが、他にも信用取引で Signal 上位銘柄を買い、下位銘柄を売りにするほうが良いかもしれません。

また、[IG 証券](https://www.ig.com/jp/welcome-page)を利用すれば、日本・米銘柄だけでなく世界の証券所銘柄を CFD 取引で購入できますが、手数料が高く今回は諦めましたが投資額によっては運用可能かもしれません。

## 銘柄選定用のコード

### OneTapBUY 採用銘柄リスト

OneTapBUY の採用銘柄(日本株・米株)は、リストになっているものがなかったので自分で作りました。
CSV で公開しておきますが、何かしら公開にあたり問題が発生したら削除する可能性もあります。

https://gist.github.com/regonn/3d8128c6d605d77fcb8e0e58d4257de9

### 予測から購入銘柄を決めるコード

予測自体のコードは次のものが参考になります。

- Numerai Signals の公式 example コード
- [Let’s talk about Signals\. Can you make unique and equally good… \| by Suraj Parmar \| Nov, 2020 \| Medium](https://parmarsuraj99.medium.com/lets-talk-about-signals-841934f24450)
- 手前味噌ですが Numerai アドベントカレンダーで書いた記事も共有しておきます
  - [Kedro を使って Numerai Signals 用のパイプライン構築](https://zenn.dev/regonn/articles/kedro-numerai-signals)

予測結果をマーケットでフィルターをかけて次のような CSV で出力しておきます。

(signal 降順)

```
signal,ticker,market
0.5123427552818974,DY,US
0.504949206751389,LGIH,US
0.5048074034053431,WSM,US
...
```

OneTapBUY の採用銘柄 CSV と予測結果 CSV を `merge` します。

```python
import pandas as pd
onetapbuy_us = pd.read_csv('./onetapbuy_us.csv')
predicted_us = pd.read_csv('./predicted_us_2020-12-11.csv')
pd.merge(predicted_us, onetapbuy_us, on='ticker')
```

実行すると、`merge` の `inner join` で対象銘柄が signal 順の大きい順にならぶので上から選んで買っていきます。

```
	signal      market  ticker  name
0	0.504181    US	    LMT	    Lockheed Martin Corporation
1	0.504120    US	    YUM	    Yum! Brands, Inc.
2	0.504067    US	    TGT	    Target Corporation
...
```

## 運用結果

### ROUND 毎の成果

`CORRELATION` は Signals の Score のようなものです。プラスの方が良い結果の評価値です。

|                       | ROUND | CORRELATION | JP(円) | US(円) | ALL(円) |
| --------------------- | ----- | ----------- | ------ | ------ | ------- |
| 2020/11/13~2020/11/23 | 238   | -0.0254     | -1     | -276   | -277    |
| 2020/11/20~2020/11/30 | 239   | 0.0274      | 23     | -102   | -79     |
| 2020/11/27~2020/12/07 | 240   | -0.0168     | -12    | -116   | -128    |
| 2020/12/04~2020/12/14 | 241   | 0.0075      | -11    | -223   | -234    |
| 2020/12/11~2020/12/21 | 242   | 0.005       | -68    | -115   | -183    |
| 合計                  |       |             | -69    | -832   | -901    |

### 購入銘柄と損益

| ROUND | 購入銘柄(損益)                                                                              |
| ----- | ------------------------------------------------------------------------------------------- |
| 238   | 東宝(36),富士フィルム(-2),日経ダブルインバ(-35),ZNGA(-244),PEP(-76),DOCU(46),SPXS(-2)       |
| 239   | サイバーエージェント(54),スズキ(34),日経ダブルインバ(-65),MCD(-2),COST(4),PG(-21),SPXS(-83) |
| 240   | テルモ(1),第一生命(6),日経ダブルインバ(-19),BYND(-37),V(-11),HSY(0),SPXS(-68)               |
| 241   | キヤノン(6),日産(-13),日経ダブルインバ(-4),LULU(-108),CRM(-35),GM(-78),SPXS(-2)             |
| 242   | ダイキン工業(-19),第一三共(-45),日経ダブルインバ(-4),LMT(-49),YUM(2),SPXS(-68)              |

全体的な相場としては、株高傾向で、売り用に買った ETF 系が殆ど損失を出して、個別銘柄がそこまで上がらず全体的にパフォーマンスは悪かったです。

## 所感

今回は残念な結果となってしまいました。

CORRELATION と損益額の相関も見られなかったので、個別銘柄での損益になってしまうと厳しいのでマーケット・ニュートラル的にはもっと銘柄数増やしたいですし、買いと売りのポジションも欲しかったです。
Signals では世界の銘柄を予測していて、限られた日・米株銘柄だけでの勝負だと、利益は出しにくいかなという印象でした。

実際の Numerai Signals の報酬の方が、今回の損失額より収益が出ているので、個人的には引き続き Numerai Signals のスコアをより伸ばせるように頑張っていこうと思います。

Numerai Signals でデータサイエンティスト側は予測にだけ専念すれば報酬がもらえるという仕組みは素晴らしいですね。
