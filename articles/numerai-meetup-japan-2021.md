---
title: "Numerai Meetup 参加記事"
emoji: "📈"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Numerai', '機械学習']
published: true
---

[Numerai Advent Calendar 2021 \- Adventar](https://adventar.org/calendars/6226) の20日目の記事です。
先日 [Numerai Meetup Japan2021](https://currypurin.notion.site/numerai-meetup-japan-9c0d5e30a9004ef5a3f702d2564523b4) が開催され、私も発表しましたので、参加報告レポートを書いていきます。

## Opening remark	katsu1110 さん

今回イベントを開催して頂いた、[NN Starter](https://www.kaggle.com/code1110/numerai-nn-baseline-with-new-massive-data) 等を公開されている katsu1110 さんによる挨拶。
オープンニングということで、今回のイベント開催までの経緯だったり、Numeraiからのメッセージ等が発表されました。

## JP docsについて現状の問題点と今後の方向性	tit_QASHさん

https://github.com/titbtcqash/Numerai-meeup-JP-2021/blob/main/Numerai%20meetup.pdf

リスクを取らずに儲ける tit_QASH さんによる、Numerai の公式日本語ドキュメントサイト [JP DOCS](https://jp.docs.numer.ai/) についての内容でした。JP DOCSでは翻訳等で貢献すると報酬(NMR)がもらえるけど、最近のNumeraiの仕様にドキュメントの内容が追随できていないのと、ネタも豊富にあるよという発表でした。
もし、NMRを海外取引所等で取得が難しい方は、一度ドキュメント翻訳からNumeraiに入っていくのもありかもしれませんね。

## 古参Numerai参加者の戯言	regonn

@[speakerdeck](b3a2e9b6f5fb43be99c79c7b0d67cad0)

私 regonn による、データサイエンスをやり始めた人にとって、Numeraiは良いコンテンツだよという話でした。データサイエンスを勉強しようとする際に、Kaggle等のコンペティションサイトで実力を磨いていくのがメジャーですが、実際の機械学習案件等を触る際にKaggle等では補えない観点がNumeraiに取り組むことで、それらの力が身につくかもしれないという内容でした。

## リスクニュートラル化のちょっとディープな話	よしそさん

https://github.com/yoshiso/numerai-japan-meetup/blob/master/numerai_meetup_20211218.pdf

専業Botterの よしそさん による、予測モデルのリスクを抑えるための手法の話でした。
よくあるリスクを抑える手法で、FN(FeatureNeutralization)がありますが、FNの限界について解説し、そこを補うための、リスク指標等を紹介していく内容でした。
質問で、「FNをやりすぎるとcorrが悪くなるが、今回の発表内容だとどうなるのか?」というものに対して、「リスクと報酬はトレードオフの関係で、どれだけリスク許容できるか」という話になり参考になりました。

## NN StarterのモデルをベイズNNにして分析してみた	habakanさん

@[speakerdeck](cb19a356bec445978e5b81adb4bf7940)

ベイジアン?の habakan さんによる発表。NNは学習設定が多く、学習結果の要因が分析しにくい等の理由から、ベイズNNを用いて、パラメータの分布を推定することで、モデルを新たな視点で評価できないかという試みの発表でした。
全体的にモデルが利益を出しにくくなるBurnEraの検出であったり、複数targetの生成過程が同一なのかの検証等ベイズの可能性を感じる発表でした。

## Numerai Tournamentの評価指標とcustom metrics	カレーちゃんさん

Notionで発表資料と当日のメモがまとまっています。
https://currypurin.notion.site/numerai-meetup-japan-9c0d5e30a9004ef5a3f702d2564523b4

専業Kagglerをやっていたカレーちゃんさんによる、11月から1ヶ月Numeraiを始めてみて、Tournamentを理解するために、参考になった記事等の紹介や、Kagglerの観点でのvalidation、objectiveをどう取り組んでいたかについて話していました。また、メジャーなBoosting系ライブラリのNumerai向けCustom metricのコードサンプルも解説していました。
Kaggleのノウハウが生かされいて、今後Numerai初心者がTournamentに臨む際に最初に参考にすると良いコンテンツの一つになりそうでした。

## Signalsのモデル作成方法	ageonsenさん

Tournament・Signalsでリーダーボードの上位を取得している ageonsen さんによる、Signalsのモデルの作成方法。
最初からデータが用意されているTournamentとは異なり、自分でデータ取得からやっていく必要があるSignalsでモデルを作成するにあたって、大事な観点を 「clean data」x 「銘柄数」x 「モデリング」という項目に分けて、それぞれ、どのように行っていくと corr sharp を大きくしていくことができるかの話でした。
Numerai参加者に硬い枕と揶揄される [ファイナンス機械学習](https://amzn.to/3E45b9e) に書かれている内容等から、Signalsのモデルを作成する際に必要なパラメータの参考値等をSignalsのデータに合わせて設定するときに参考になりそうな発表でした。

## 株式予測についてできるだけディープな話	UKIさん

https://github.com/UKI000/Numerai-Meetup-Japan2021/blob/main/numerai_meetup_material_uki.pdf

今回の発表者の中でも、Numeraiに取り組むきっかけになった人が多い、[機械学習による株価予測　はじめようNumerai \- Qiita](https://qiita.com/blog_UKI/items/fb401725288e58c92bd6) 等の記事を書かれている UKIさんによる発表。

伝統的なクオンツによる観点と比較して、機械学習を用いることで、どのように新しくデータを活用し、クオンツを発展させていくことができるのかという内容。
クオンツの見ている(見ていなかった)項目を分解していき、それに機械学習の適用可能性を考えていて、内容は中級者以上向けではあるものの、Signalsのモデルを開発していくためのネタが豊富に隠されている発表だと思います。

## 全体を通しての所感

今回、日本で初めてのNumeraiの公式イベントでしたが、普段リーダボード上位のモデルでみかけるような人達の話を聞いたり、懇親会等で話すことができて、とても有意義な時間でした。
来年も開催される予定みたいですが、このままNumeraiが発展していくと(NMRホルダーとして)私も嬉しいです。

あと、最近 [richmanbtcさんのbotter本](https://amzn.to/3mhMbhc) が発売されたこともあり、Kaggler界隈等人もMLBot等に興味を持ち始める人が増えているので、来年も色々とこの界隈は動きがありそうですね。