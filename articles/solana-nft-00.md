---
title: "SolanaのNFTをMintするまで解説 1/4 NFTのデータ構成を把握してToken情報からNFT画像まで辿れるようにする"
emoji: "☀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["solana", "nft", "ブロックチェーン"]
published: true
---

[Solana アドベントカレンダー 2021](https://adventar.org/calendars/6174) の記事です。

最近個人的に気に入っている Solana ブロックチェーンで、NFT 周りを触る機会があったので、記事にまとめていきます。

4 回に分けて記事投稿予定で、利用する技術は Metaplex と Arweave の予定です。

- NFT のデータ構成を把握して Token 情報から NFT 画像まで辿れるようにする ← ココ
- [Solana.py を利用して、Wallet の NFT 画像を取得する](https://zenn.dev/regonn/articles/solana-nft-01)
- [Arweave に画像とオフチェーンメタデータをアップロードする](https://zenn.dev/regonn/articles/solana-nft-02)
- [SPL トークンをミントして NFT を作成する](https://zenn.dev/regonn/articles/solana-nft-03)

今回は Metaplex で使われる NFT のデータ構成をまとめます。NFT 発行までに必要な内容をざっと触れるだけなので、興味のある人は、公式サイトやドキュメントを読んでください。

## Metaplex

https://www.metaplex.com/

Solana 上で NFT のフォーマットを定めているフレームワークの一つです。この Metaplex 形式が多く採用されていて、この形式に則って NFT を発行すると、Phantom Wallet 等のウォレットで NFT が表示されるようになります。

### Arweave

https://www.arweave.org/

Arweave は、分散型のクラウドストレージネットワークで、データをアップロードする際にトークン(AR)を払い、ストレージを提供している人達に報酬として渡すという非中央集権的なシステムで運用されているものです。
特徴としては、一度データをアップロードすると、半永久的にデータが保存される(基本削除ができない)ため、NFT のアップロード等にも相性がいいです。

## Metaplex における NFT のデータ構成

次は Metaplex を利用した NFT のデータ構成の一例です。

![](https://storage.googleapis.com/zenn-user-upload/f2da3dcda197-20211213.png)

まず、大きく分けて Solana の「オンチェーン情報」か「オフチェーン情報」かに分かれます。これは、データの内容をどこに持たせるかの内容で、オンチェーンの場合は Solana ブロックチェーン上にデータが乗ります。
ただし、Solana に画像等のバイナリデータを持たせるとコストが増えてしまうので、Solana のブロックチェーン外(オフチェーン)にデータをもたせるようにします。そこで、Arweave や IPFS といった分散化されたクラウドストレージネットワークが利用される場合が多いです。

オフチェーン側に NFT の表示等に必要なオフチェーンメタデータの情報があり、それとオンチェーン上の SPL トークン(Solana で SPL という規格で作られるトークン)を紐付ける存在が必要です。その紐付ける役目をしてくれているのがオンチェーン上のメタデータアカウントで、メタデータアカウントが SPL トークンのミントアドレスと紐付いていて、メタデータアカウントがオフチェーンメタデータの URL 情報を所持しているため、SPL トークンから NFT の画像(Arweave 上のアップロードされた情報)まで辿れることができます。

### NFT データの辿り方

では実際に、トークン情報からデータを辿って、どのようにして NFT の画像を取得できるかを見ていきます。

まず、表示したい NFT を所有している Wallet を準備します。

[DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT](https://solscan.io/account/DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT#tokenAccounts)

![](https://storage.googleapis.com/zenn-user-upload/eac84a5927c4-20211213.png)

SOLSCAN で確認をすると、1 個だけ SPL トークン(画像中の 6pLr2M...1R6sMg というアドレス)を持っている状態です。

今度は所持しているトークン [6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg](https://solscan.io/token/6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg#metadata) を SOLSCAN で確認してみます。

![](https://storage.googleapis.com/zenn-user-upload/91c405c4c102-20211213.png)

SOLSCAN で NFT のトークンを表示した場合関連している画像等を表示してくれます。
トークンの Metadata を確認すると、NFT に関連した情報が表示されています。

> Metadata is retrieved from token’s URI: https://arweave.net/mk6KmQM8Gb3RQoRV6qVnDqT146lfQX5SJ6fQah0Ba0Q

と書かれている部分の URL がオフチェーンメタデータ部分の Arweave にアップロードした JSON ファイルの URL です。その JSON の内容が下の方に展開されて表示してあります。

Arweave にアップロードするとアップロードファイル毎に専用の URL が作成されていて、直接 Arweave の JSON ファイルの URL にアクセスしても、JSON を確認できます。

JSON: https://arweave.net/mk6KmQM8Gb3RQoRV6qVnDqT146lfQX5SJ6fQah0Ba0Q

さらに、その JSON の中で NFT に必要な情報が記載されていて、 Arweave にアップロードした、画像ファイルの URL を指定します。

JSON に書かれていた画像情報は

[https://tgzd3dbfw4sun6tyymir5kica2kl73g7ra3ybt6nn3y7i2ia5anq.arweave.net/mbI9jCW3JUb6eMMRHqkCBpS_7N-IN4DPzW7x9GkA6Bs/?ext=png](https://tgzd3dbfw4sun6tyymir5kica2kl73g7ra3ybt6nn3y7i2ia5anq.arweave.net/mbI9jCW3JUb6eMMRHqkCBpS_7N-IN4DPzW7x9GkA6Bs/?ext=png])

というアドレスで、ここにアクセスすると SOLSCAN でも表示されていた NFT の画像が表示されます。

以上の情報を用いて、次回は Python のライブラリの solana.py を利用して、データを取得していきます。
