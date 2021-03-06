---
title: "Kaggle(データサイエンス)における写経"
emoji: "📝"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["kaggle"]
published: true
---

普段は Kaggle 等のデータサイエンスに関連する Podcast をやっていますれごんです。

この前、一緒に Podcast をやっているカレーちゃん[@currypurin](https://twitter.com/currypurin)に「Kaggle コードの写経について」の質問があり、ポッドキャストでも取り上げたので、それについてブログにも自分の思っていること(ポエム)を書いていきます。

私もまだ、Kaggle Expert なので、偉いことは言えませんが、Web 界隈で開発や写経を今までしてきて、データサイエンスでの写経の難しさについて書いていけたらなと思います。

## 質問内容

[Kaggle のタイタニックを終えて開催中のコンペの適当なカーネルを写経中なのですがとても難しいく、このままで力が \| Peing \-質問箱\-](https://peing.net/ja/q/e329fa57-faa1-404f-940a-5f3d2c49d771)

## 取り上げたポッドキャストの回

[056 Kaggle 写経 \- regonn\-curry](https://scrapbox.io/regonn-curry/056_Kaggle%E5%86%99%E7%B5%8C)

## とりあえず言いたいこと

Kaggle というかデータサイエンスにおいては、 **コードだけではなく、そのコードが必要になった経緯と、コードを動かしてから何がわかったか** のプロセスが重要で、その背景が説明されている(言語化されている)コンテンツで写経をしたほうが良いと思います。

## プログラミングの写経とデータサイエンスの写経で違う所

もちろん、プログラミングの学習における写経は、やったほうが良いと思います。
写経について書かれている記事などで **何をやろうとしてこのコードを書いているかを考えながら写経しましょう** というのがあります。
どういう処理をしようとして、コードが書かれているのかを理解しながら写経することで、効率的な書き方であったり、変数やメソッドの命名規則等を覚えていくことができます。

しかし、データサイエンスにおける写経では、それだけでは足りていない気がします。

データサイエンスでの写経では、欲しいデータを考えて、そのデータを得るためにプログラミングをして、実際どうだったかを検証していくプロセスも含めて理解していく必要があると思います。

ざっくりと図にまとめてみるとこんな感じです。

![](https://storage.googleapis.com/zenn-user-upload/gobndpnunm47b4zppcav48jhar6f)

プログラミングはデータを処理または表示するための行為なので、たとえコードが何をしたいのかを理解して写経していても、仮説と検証の部分が抜けてしまっている場合も多いです。特に Kaggle の Notebook では、処理に必要な順に書かれていたり、最終的に必要になった処理しか残っていません。

例えば、Kaggle の Notebook で、モデルに CatBoost が使われていたとして、それがなんで選ばれたのかがコードでは分からない場合が多いですよね(ただ単に、簡単に処理をしたかったのか、色々なモデルを試したら精度が一番良かったのか、理由は色々考えられます)。

それよりも、実力をつけていくには、強い人がまず何を考えて、データをどのような順番で分析していくのかを知ることができると参考になると思います。

## じゃあ何で勉強したら良いのか

ここまで、言ってきてアレですが。正直、このコンテンツで学ぶと良さそうというオススメが難しいです。
一番の理想は、職場や知り合いで Kaggle の強い人とチームを組んでペアプロ的に進められると、そこらへんの考えも含めて学べていけると思います。

もし YouTube 等でライブコーディングをしながらデータ分析や Kaggle コンペの問題に挑んでいるコンテンツでも良さそうです。
ただし、プライベートシェアリングやデータが NDA で公開出来ないなど、動画でのコンテンツは作るハードルが高いこともあり、なかなか私も見つけられていません。

もし、こんなコンテンツだと良いんじゃない?というものが有りました、私のやってる Podcast へのコメント等で教えていただけるとありがたいです。
