---
title: "Solana 分散ストレージの Shadow Drive を利用して Solana エコシステム上で NFT を発行する"
emoji: "🗃️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["solana", "nft", "ブロックチェーン"]
published: true
---

## Shadow Drive

今月(2022 年 5 月)に Shadow Drive という Solana ネイティブ分散ストレージサービスがローンチされました。

https://twitter.com/GenesysGo/status/1527079380215812099

また以前、Solana で NFT を Mint する記事を書きました。

https://zenn.dev/regonn/articles/solana-nft-00

以前の記事の時(2021/12)は、NFT 情報のメタデータや画像データを、Arweave や IPFS といった Solana エコシステム外の分散ストレージを利用するしか選択肢がありませんでした。そうなると、Solana のウォレット以外にも準備が必要であったり、トランザクションが分かれてしまい管理も大変になってしまう状態でした。

しかし、Shadow Drive がリリースされることで、Solana エコシステム内で NFT の Mint が完結するようになりました。

![](https://storage.googleapis.com/zenn-user-upload/1ab6d089bd3d-20220530.png)

アップロードなどの操作も全てトランザクションに紐づき、今後の Solana の NFT プロジェクトにおけるメジャーな技術になると思っています。

今回の記事では、Shadow Drive SDK(node 版) を利用して、NFT を Mint するところまでのコードを解説していきます。

Solana でメジャーな NFT の仕様である、Metaplex を利用した詳しい仕様などについては、[以前の記事](https://zenn.dev/regonn/articles/solana-nft-00#metaplex)で解説していますので、そちらをご覧ください。

また、利用するコードについては Github で公開しています。

https://github.com/regonn/Shadow-Drive-NFT

## NFT Mint

### npm プロジェクト作成

Shadow Drive SDK は現状 npm パッケージ版のみ公開されているため、ライブラリのバージョン管理のため npm プロジェクトを新規に作成していきます。

新しくディレクトリを作成して、npm プロジェクトを作ります。

```sh
$ mkdir shadow-drive-nft
$ cd shadow-drive-nft
$ npm init
```

### 必要なライブラリをインストール

必要なライブラリをインストールしていきます。

```sh
$ npm install @project-serum/anchor @shadow-drive/sdk @solana/web3.js fs @metaplex/js typescript
```

それぞれのライブラリを解説していきます。

- @project-serum/anchor
  - ウォレットなどの管理で利用します
- @shadow-drive/sdk
  - Shadow Drive の SDK です
- @solana/web3.js
  - トランザクションの実行の際のデータ型等を利用します
- fs
  - ローカルのファイル情報の読み書きに利用します
- @metaplex/js
  - NFT を Mint する際に利用します
- typescript
  - 開発は TypeScript で行っていきます

また、TypeScript を直接実行していくために、ts-node もインストールします。

```sh
$ npm install ts-node --save-dev
```

TypeScript を利用する際の設定を `tsconfig.json` で定義します。

```json:tsconfig.json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### Solana のウォレット情報をファイルで持つ

トランザクションの実行には、SOL や SHDW(Shadow Drive の容量確保に利用) といった SPL トークンが必要なので、Solana のウォレットを扱えるようにします。

`solana-keygen` コマンドの出力先オプションで `-o wallet.json` を指定するなどして、json ファイルとして、新しいウォレット情報を書き出します。既存ウォレットのインポートも `solana-keygen recover -o wallet.json` で実行して、シードフレーズを入力すれば利用できます。

wallet.json の中身は次のような数字の配列の形式で保存されています。これは、秘密鍵でもあるので大切に扱ってください。

```json:wallet.json
[145, ........ ,40]
```

### Solana のウォレット情報を読み取る

ウォレット情報を読み取り PublicKey を取得するコードを書いていきます。

`001-get-wallet-public-key.ts`

```ts:001-get-wallet-public-key.ts

import * as solanaWeb3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import driveUser from "./wallet.json";

(async () => {
  const connection = new solanaWeb3.Connection(
    "https://ssc-dao.genesysgo.net/"
  );
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(new Uint8Array(driveUser))
  );
  console.log(wallet.publicKey.toString());
})();

```

実行は次のコマンドを利用します。

```sh
$ npx ts-node 001-get-wallet-public-key.ts
```

これで実行時に PublicKey が文字列で表示されたら正しくウォレットの情報を読み取ることができています。

### Shadow Drive の容量を確保する

wallet.json に書き出したウォレットへ Transaction Fee 用の SOL と Shadow Drive の容量を確保するために SHDW トークンを送付します。SHDW は分散取引所(DEX)でしか上場していないので、[Jupiter](https://jup.ag/) などを利用して手に入れます。画像 NFT 程度の容量であれば、SOL と SHDW 共に 100 円分ぐらいのトークンで十分です。

それでは、Shadow Drive のアカウントを作成して、容量を確保するコードを書いていきます。

```ts: 002-create-drive-account.ts
import * as solanaWeb3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { ShdwDrive } from "@shadow-drive/sdk";
import driveUser from "./wallet.json";

// アカウント名を設定。他のアカウントと一意である必要はないので自由に設定可能。
const storage_account_name = "nft-shadow-drive";
const storage_size = "300KB"; // e.g) 10MB, 2KB

(async () => {
  const connection = new solanaWeb3.Connection(
    "https://ssc-dao.genesysgo.net/",
    "max"
  );
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(new Uint8Array(driveUser))
  );
  const drive = await new ShdwDrive(connection, wallet).init();
  const storageAcc = await drive.createStorageAccount(
    storage_account_name,
    storage_size
  );
  const acc = new solanaWeb3.PublicKey(storageAcc.shdw_bucket);
  console.log(`storageAccPublicKey: ${acc.toString()}`);
})();

```

とりあえず、今回は画像 250KB 程度とメタデータ(JSON)の 4KB 程度でしたので、300KB を確保しました。

コストは 0.0003 SHDW(約 0.03 円)でした。
コードを実行すると、発行された自分のドライブアカウントの PublicKey が表示されます。

```sh
$ npx ts-node 002-create-drive-account.ts
```

### 画像のアップロード

NFT 用の画像をアップロードしていきます。今回は、`image.png` という画像を準備して利用しています。

```ts:003-upload-image.ts
import * as solanaWeb3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { ShdwDrive } from "@shadow-drive/sdk";
import driveUser from "./wallet.json";
import fs from "fs";

// 002 の出力結果
const storageAccPublicKey = "";

(async () => {
  const connection = new solanaWeb3.Connection(
    "https://ssc-dao.genesysgo.net/",
    "max"
  );
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(new Uint8Array(driveUser))
  );
  const drive = await new ShdwDrive(connection, wallet).init();
  const acc = new solanaWeb3.PublicKey(storageAccPublicKey);
  let file = {
    name: "image.png",
    file: fs.readFileSync("./image.png"),
  };
  const upload = await drive.uploadFile(acc, file);
  console.log(upload);
})();

```

コードを実行すると、アップロードされたファイルの URL とトランザクション ID が出力されます。

```sh
$ npx ts-node 003-upload-image.ts
```

### Metadata をアップロード

今度は NFT 用の Metadata(JSON)をアップロードします。

```ts: 004-upload-metadata.ts
import * as solanaWeb3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { ShdwDrive } from "@shadow-drive/sdk";
import driveUser from "./wallet.json";
import fs from "fs";

// 002 の出力結果
const storageAccPublicKey = "";

// 003 の出力結果
const image_uri = "";

// NFT関連の設定
const nft_name = "";
const symbol = "";
const description = "";
const external_url = ""; // NFTの関連ページなど

// コレクションについて
const collection_name = "";
const collection_family = ""; // こちらはコレクションの識別子として設定

const metadata = {
  name: nft_name,
  symbol: symbol,
  description: description,
  seller_fee_basis_points: 500, // NFT売買時のロイヤリティの設定 500 で 5% になる
  image: image_uri,
  attributes: [
    {
      trait_type: "name",
      value: nft_name,
    },
    // NFT のアトリビュートを追加したい場合はここに追加
  ],
  external_url: external_url,
  properties: {
    files: [
      {
        uri: image_uri,
        type: "image/png",
      },
    ],
    category: "image",
    creators: [
      // ※設定必要
      // NFTが売買された際のロイヤリティを受け取るアドレス
      // shareが100になるように複数アドレスも設定可能だが、Mint発行時のアドレスが一つ以上含まれる必要がある
      {
        address: "",
        share: 100,
      },
    ],
  },
  collection: {
    name: collection_name,
    family: collection_family,
  },
};

(async () => {
  const connection = new solanaWeb3.Connection(
    "https://ssc-dao.genesysgo.net/",
    "max"
  );

  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(new Uint8Array(driveUser))
  );

  const drive = await new ShdwDrive(connection, wallet).init();
  const acc = new solanaWeb3.PublicKey(storageAccPublicKey);
  const metadata_file = "metaplex_metadata.json";
  fs.writeFileSync(metadata_file, JSON.stringify(metadata));

  let file = {
    name: metadata_file,
    file: fs.readFileSync("./" + metadata_file),
  };
  const upload = await drive.uploadFile(acc, file);
  console.log(upload);
})();
```

コードを実行すると、`metaplex_metadata.json` ファイルが作成され、アップロードされた JSON の URL とトランザクション ID が出力されます。

```sh
$ npx ts-node 004-upload-metadata.ts
```

### NFT を Mint

最後に今までアップロードしてきたファイルを利用して、NFT を Mint します。

Metaplex のライブラリを利用することで、Mint も簡単に行えます。

```ts: 005-mint-nft.ts
import { Connection, actions } from "@metaplex/js";
import * as anchor from "@project-serum/anchor";
import driveUser from "./wallet.json";

// 004 の出力結果である、MetadataのアップロードされたURL
const uri = "";

(async () => {
  // 'devnet', 'testnet', 'localnet' などでネットワークを切り替えることが可能です
  const connection = new Connection("mainnet-beta");
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(new Uint8Array(driveUser))
  );

  const response = await actions.mintNFT({
    connection,
    wallet,
    uri,
  });

  console.log(`txID: ${response.txId}`);
  console.log(`mint: ${response.mint.toString()}`);
  console.log(`metadata: ${response.metadata.toString()}`);
  console.log(`edition: ${response.edition.toString()}`);
})();

```

成功すると、実行したウォレットに NFT のトークンが追加されています。
設定した Metadata の情報が反映されていることも SolScan のサイト等で確認できます。

https://solscan.io/token/94z6iMJ6JrxHmnFPnSUyEKtgMNsL83TV63R5nrrWd9cq#txs

![](https://storage.googleapis.com/zenn-user-upload/f536ff836265-20220530.png)

## 実際にやってみての所感等

実際に NFT を Mint する所までやりましたが、まだドキュメント等も充実しておらず、直接コードを読みに行ったりもしました。しかし、そこまで複雑ではないので、どういった操作ができるのか把握できれば使いこなせる感じがします。

Solana プロジェクトとして過去のトランザクション情報が Google のサービス上で保管されているなど、まだまだ企業へ依存している部分が多いのも問題として存在しています。

この Shadow Drive が使われ出し、より企業に依存しない分散化されたプロジェクトとして、Solana が普及していくのを楽しみしています。
