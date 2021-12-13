---
title: "特定のWalletに入っているNFTの画像をPythonで取得する"
emoji: "☀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['solana', 'nft']
published: false
---

[Solana アドベントカレンダー 2021](https://adventar.org/calendars/6174) の記事です。

最近個人的に気に入っている Solana ブロックチェーンで、NFT周りを触る機会があったので、記事にまとめていきます。

全体で4回に分けて記事投稿予定で Metaplex と Arweave を利用する予定です。

- Metaplex におけるNFTのデータ構成や用語を解説 ← ココ
- Solana.py を利用して、WalletのNFT画像を取得する
- Arweaveに画像とオフチェーンメタデータをアップロードする
- SPLトークンをミントして NFT を作成する

今回は Metaplex で使われるNFTのデータ構成や用語をまとめます。NFT発行までに必要な内容をざっと触れるだけなので、興味のある人は、公式サイトやドキュメントを読んでください。

## Metaplex

[公式サイト](https://www.metaplex.com/)

Solana上でNFTのフォーマットを定めているフレームワークです。この形式に則ってNFTを発行すると、Phantom Wallet等のウォレットでNFTが表示されるようになります。

## MetaplexにおけるNFTのデータ構成

次は Metaplex を利用した NFT のデータ構成の一例です。
まず、大きく分けてSolanaの「オンチェーン情報」か「オフチェーン情報」かに分かれます。これは、データの内容をどこに持たせるかの内容で、オンチェーンの場合はSolanaブロックチェーン上にデータが乗ります。ただし、Solanaに画像等のバイナリデータを持たせるとコストが増えてしまうので、Solanaのブロックチェーン外にデータをもたせるようにしていきます。
そこで利用するのが、ArweaveやIPFSの分散化されたデータアップデートサービスです。

### Arweave

Arweave は、
特徴としては、一度データをアップロードすると、半永久的にデータが保存される(基本削除ができない)ため、NFTのアップロード等にも相性がいいです。

### NFTデータの辿り方

では実際に、トークン情報からデータを辿って、どのようにしてNFTの画像を取得できるかを見ていきます。

まず、表示したいNFTを所有しているWalletを準備します。

[DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT](https://solscan.io/account/DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT#tokenAccounts)

SOLSCANで確認をすると、1個だけトークン(6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg)を持っている状態です。

今度は所持しているトークンである、(6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg)[https://solscan.io/token/6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg#metadata] をSOLSCANで確認してみます。

SOLSCANでNFTのトークンを表示した場合関連している画像等を表示してくれます。
トークンのMetadataを確認すると、NFTに関連した情報が表示されています。

> Metadata is retrieved from token’s URI: https://arweave.net/mk6KmQM8Gb3RQoRV6qVnDqT146lfQX5SJ6fQah0Ba0Q

と書かれている部分のURLがオフチェーンメタデータの部分である、ArweaveにアップロードしたJSONファイルのURLで、そのJSONの内容が展開して表示されています。