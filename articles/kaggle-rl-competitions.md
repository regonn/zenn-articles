---
title: "2020年のKaggle強化学習コンペティションとか強化学習フレームワークをざっと紹介"
emoji: "👩‍💻"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["kaggle", "強化学習"]
published: true
---

[Kaggle アドベントカレンダー 2020](https://qiita.com/advent-calendar/2020/kaggle) 4 日目の記事です。

Kaggle 等のデータサイエンスに関連する内容を扱っているポッドキャスト [regonn&curry.fm](https://anchor.fm/regonn-curry-fm) をやっている れごん([@regonn_haizine](https://twitter.com/regonn_haizine)) です。

この記事では、まだ Kaggle の強化学習向けコンペティションに参加したことがない人を対象に、強化学習向けコンペティションの特徴や今年開催されたコンペティションの紹介、また最近新しくリリースされた強化学習フレームワークを紹介していきます。

## Kaggle の強化学習コンペティション

今年は **Kaggle の強化学習コンペ元年** と呼んでもいいくらい始まりの年でした。
去年の 2019 年 12 月に行われた、Kaggle Days Tokyo での最初のオープニングトークの所で Kaggle CTO の Ben Hammer が「シミュレーションで対決できる強化学習のコンペを準備中」という話から始まり、今年 2020 年には Kaggle 初の強化学習向けコンペティションの [Connect X](https://www.kaggle.com/c/connectx/) が公開され、6 月には初めてのメダル対象強化学習向けコンペティションの [Halite コンペ](https://www.kaggle.com/c/halite) が開催されました。現在も引き続き強化学習向けコンペティションが開催しています。

強化学習"向け"コンペティションと書いているのは、これらのコンペティションではロジックのみを記述した(学習を行わない)タイプの上位解放も数多く存在しているためです。ここからこの記事では「強化学習コンペ」で統一します。

## 強化学習について

強化学習についての基礎や最近の動向等を知りたい場合は次の資料がとても参考になります。
@[tweet](https://twitter.com/ImAI_Eruel/status/1305446268030779395)

## Kaggle の強化学習コンペの特徴

### 評価方法

他の Kaggle コンペと比べて評価方法が特徴的です。
強化学習コンペではモデル(Agent)をサブミットした段階ではスコアは確定せずに、提出後に他の提出されたモデルと対戦を繰り返し、成績に応じてレーティングが更新され、その値がスコアになります。
また、リーダーボードでは実際に行われた試合を確認でき、それだけ見ていても面白いです。

[サッカーコンペ試合例(ノートブックだと実際に 3D のゲームで表示することも可能です)](https://www.kaggle.com/c/google-football/leaderboard?dialog=episodes-episode-6092740)

そして、最終モデル提出期限でスコアは確定せず 1 週間戦うだけの期間が設けられていて、その後、最終的にランキングが確定します。
戦うだけの期間でも結構ランキングが動くのでメダル圏に入るか入らないかぐらいの順位だととてもハラハラします。

### 強化学習用環境ライブラリ

あとは、強化学習の環境用に kaggle-environments というライブラリが提供されています。

https://github.com/Kaggle/kaggle-environments

強化学習を一度やったことがある人にとっては、OpenAI が提供している [OpenAI Gym](https://gym.openai.com/) といえばイメージできると思います。
コンペにはなっていませんが、kaggle-environments には tictactoe(◯☓ ゲーム)等の環境も用意されています。

### 提出ファイル

最終的なモデルを提出する際には Python ファイルに書き出して提出する必要があります。
ちゃんとドキュメントを確認できていないだけかもしれませんが、Python ファイル単体で提出しないといけないみたいで、[このノートブックの Output submission.py](https://www.kaggle.com/lbarbosa/connectx-deep-reinforcement-learning/output?scriptVersionId=48144648&select=submission.py)のように、ニューラルネットワークを利用したモデルを提出する場合はネットワークの Weights の情報をファイルに直書きする必要があります。

## 2020 年の Kaggle 強化学習コンペ

今年開催された(されている)強化学習コンペの紹介です。

- [Connect X](https://www.kaggle.com/c/connectx/)
  - Kaggle Days Tokyo の発表スライドにもこの対戦風景の画像が出ていた
  - プレイグラウンドとして公開されているため、タイタニックコンペのように初めて強化学習版コンペを触る人向けの位置づけみたいです
- [Halite](https://www.kaggle.com/c/halite)
  - 4 チームが同時に宇宙船を動かして、最終的に多くの Halite を集めたチームの勝ちというルール。
  - 日本語でのコンペ概要は [\[Japanese\] Halite コンペの概要 introduction \| Kaggle](https://www.kaggle.com/iicyan/japanese-halite-introduction) が参考になります
  - 1st solution が公開されています。[1st Place - Winning Solution \| Kaggle](https://www.kaggle.com/c/halite/discussion/183543)。元 DeepMind の人で、最初は Deep RL で挑戦していたけど、苦戦して途中からロジックメインの戦法に変えたみたいで、巨大なロジックファイルも Github に公開されています[ttvand/Halite: Kaggle Halite RL challenge \- Provisional first place solution](https://github.com/ttvand/Halite)
  - 2nd はバンダイナムコ研究所の人で、ゲーム AI 分野に強い人が、ここでも強い印象を受けました[バンダイナムコ研究所の AI 研究開発エンジニア　国際的コンペティション Kaggle の「Halite」で Gold メダルを受賞 \| 株式会社バンダイナムコ研究所](https://www.bandainamco-mirai.com/news/post_20200924.php)
- [サッカー](https://www.kaggle.com/c/google-football)
  - この記事が公開されるタイミングではモデル提出期間が終わり、最後の 1 週間で戦っている段階です
  - 今回も上位に入っている、 Halite 1st の人の解法が Discussion で公開されています。[Raw Beast provisional top-5 solution \| Kaggle](https://www.kaggle.com/c/google-football/discussion/200709) 今回は、ビデオゲーム StarCraft II で人間に勝利した DeepMind の AlphaStar とアプローチが似ており、Deep RL の技術が使われているみたいです
- [じゃんけん](https://www.kaggle.com/c/rock-paper-scissors)
  - ゲーム理論の分野では、どのような戦略が強いかという研究も昔から行われているみたいですが、AI が進歩してきて囲碁等でも人間に勝てるようになってきた段階ではどのようなロジックや AI モデルが強いのか気になるコンペです

私も Halite コンペにチームで取り組んでみましたが、既存の強化学習フレームワークに今回の環境を当てはめて学習させるのが難しく、結局ロジックのモデルになり、メダル圏には届きませんでした。。。

## 最近新しくリリースされた強化学習用フレームワーク

せっかくなので、2020 年になってからリリースされたもので個人的に今後の動向が気になっている強化学習フレームワークを紹介していきます。私が追いきれていないなだけで他にもオススメのフレームワークもあると思いますので、よかったら記事のコメントや Twitter 等で教えてください。

- [PFRL](https://github.com/pfnet/pfrl)
  - 日本の Preferred Networks が出している強化学習用フレームワーク
  - もともとは ChainerRL として公開されていた強化学習フレームワークですが、Chainer の開発が終わったため、PyTorch 版になって公開された
  - 個人的には ChainerRL の使い勝手が好きで、[ChainerRL Visualizer](https://github.com/chainer/chainerrl-visualizer) のようなツールもあり、ツールも含めて PyTorch 版になってくると、強化学習モデルの開発が楽になるなという印象です
- [coax](https://github.com/microsoft/coax)
  - Microsoft が出している強化学習用フレームワーク
  - [JAX](https://github.com/google/jax) という Google が出しているニューラルネットワークライブラリを使っていて、JAX は GPU 環境で JIT を利用できる numpy のラッパーで高速に処理ができるように設計されています
  - Microsoft は LightGBM のようなライブラリもだしていて、強化学習フレームワークでもスタンダードなポジションを狙えるのかなと思っていて楽しみです
- [acme](https://github.com/deepmind/acme)
  - DeepMind が出している強化学習フレームワーク
  - Agent は TensorFlow と JAX で実装されていて選べる
  - ゲーム AI やディープラーニングに強い DeepMind の出したライブラリなので、影響力がありそうです

傾向としては、JAX が使われるようになっていて、GPU や JIT による高速化が流行ってくるのかなと思って動向を追っています。

## 強化学習コンペに参加してみよう

これからも、Kaggle での強化学習コンペは他のコンペと同様に増えてくると思います。
興味が出てきた人は Connect X あたりから、kaggle-environments の動かし方等に慣れておくと新しく始まる強化学習コンペにも挑戦しやすくなると思います。

では、Have a nice Kaggle days!
