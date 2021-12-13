---
title: "特定のWalletに入っているNFTの画像をPythonで取得する"
emoji: "☀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["solana", "nft"]
published: false
---

[Solana アドベントカレンダー 2021](https://adventar.org/calendars/6174) の記事です。

最近個人的に気に入っている Solana ブロックチェーンで、NFT 周りを触る機会があったので、記事にまとめていきます。

全体で 4 回に分けて記事投稿予定で Metaplex と Arweave を利用する予定です。

- Metaplex における NFT のデータ構成や用語を解説
- Solana.py を利用して、Wallet の NFT 画像を取得する
- Arweave に画像とオフチェーンメタデータをアップロードする
- SPL トークンをミントして NFT を作成する

今回は Solana.py を利用して Wallet の NFT 画像を取得します。

同じく Solana.py を利用して、NFT の Metadata を取得して、画像の URL を取得します。
