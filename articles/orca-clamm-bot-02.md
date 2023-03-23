---
title: "Orca で 集中流動性AMM Bot を動かす Part 2 ~価格変動幅を予測する~"
emoji: "🐳"
type: "tech"
topics: ["solana", "ブロックチェーン"]
published: true
---

※ 投資は自己判断でお願いします。

## この記事シリーズでの目的

Solana ブロックチェーンの 集中流動性 AMM である Orca の SDK を利用して Bot を動かすのが目標です。

- [Part 1 SDK を利用して、流動性提供するために、対象トークンとステーブルコインの保有残高を調整する](https://zenn.dev/regonn/articles/orca-clamm-bot-01)
- Part 2 (この記事) HelloMoon API を利用して、Orca でのヒストリカルデータを取得して、機械学習で集中流動性提供時の価格変動幅を予測してみる
- [Part 3 定期的に集中流動性を調整する Bot を作成](https://zenn.dev/regonn/articles/orca-clamm-bot-03)

コード全体は

https://github.com/regonn/OrcaClammBot

で公開しています。

記事について質問がある場合は、Orca の Discord の日本語チャンネル(`#🇯🇵│日本語-japanese-community`)等で質問してもらえれば回答していきます。

https://discord.gg/orca-so

## 価格変動幅予測

今回は集中流動性提供時の価格変動幅を予測してみます。変動幅を予測することで、効率的に流動性を提供することが可能です。

AI を利用した金融界隈の事例では Kaggle 等のボラティリティ予測のコンペティションが開催されるなど、色々と手法がありますが、今回のメインは Orca の SDK を触る部分ですので、機械学習部分は簡略化して次のような条件にします。ついでに、もっと精度を上げることができそうな部分も思いつくところで書いていきます。

- SDK に合わせるため、モデルの学習含めて Typescript で記述する
  - Tensorflow.js で学習し、単純な Multilayer perceptron モデルを保存して、予測に利用する。
  - 機械学習では Python を使われることが多く、今回の予測の場合も、Tensorflow などのニューラルネットワークよりも、LightGBM 等の GradientBoosting 系で ONNX 形式でモデルを保存して、Javascript で利用する等してみると扱いやすいかもです。
- 予測も、単純にロウソクチャートデータ(OHLC)の High と Low の差分の直近 10 件分を入力に次の High と Low の差分を予測する
  - 銘柄組み合わせによって、値段のオーダなども変わるので、RSI 等の価格オーダーに依存しない他の指標を特徴量で持たせると良さそう
  - データ量も考慮するとターゲット変数はバイナリとかクラス変数にできた方が良さそう
  - ターゲット変数を log でした方が精度が上がるかも

## HelloMoon API

Solana の DeFi 系プライスデータ等を提供してくれる、HelloMoon API [https://docs.hellomoon.io/reference/post_v0-token-candlesticks](https://docs.hellomoon.io/reference/post_v0-token-candlesticks) を利用します。他にも、価格を提供してくれる API はありますが、Orca でのプールの価格を収集している、Coingecko 等は有料 API でないと取得できないことが多いです。HelloMoon API では SolanaWallet でログイン・登録することで、API 利用の無料枠がもらえます。

## Tensorflow.js

機械学習でニューラルネットワークモデルを構築する際のメジャーなフレームワークの Tensorflow の Javascript 版を利用します。

[https://github.com/tensorflow/tfjs](https://github.com/tensorflow/tfjs)

## HelloMoon API Key 取得

[https://www.hellomoon.io/dashboard](https://www.hellomoon.io/dashboard) で Solana Wallet を連携することで、API Key が表示されるようになります。その内容を `.env` ファイルに追加してください。

.env

```.env
HELLO_MOON_API_KEY = xxxxxx - xxxx - xxxx - xxxx - xxxxxxxxx;
```

npm で `@hellomoon/api` を追加することで、API を利用しやすくなります。

```shell
$ npm install @hellomoon/api
```

新しく機械学習用データ取得用 ts ファイルを作成します。コードでは、最新の 1 時間足で 500 時間分取得しています。取得条件を変更することで、より過去のデータも取得できます。

[該当 API ドキュメント](https://docs.hellomoon.io/reference/post_v0-token-candlesticks)

001-download-candle-sticks-data.ts

```ts
import {
  RestClient,
  TokenPriceCandlesticks,
  TokenPriceCandlesticksRequest,
  TokenPriceCandlesticksRequestArgs,
} from "@hellomoon/api";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { PublicKey } from "@solana/web3.js";

// ORCA
const targetToken = {
  mint: new PublicKey("orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE"),
  decimals: 6,
};

dotenv.config();
const client = new RestClient(process.env.HELLO_MOON_API_KEY as string);

async function main() {
  const mint: string = targetToken["mint"].toBase58();

  const args: TokenPriceCandlesticksRequestArgs = {
    mint,
    granularity: ["ONE_HOUR"],
    limit: 500, // 最大1000まで
  };
  const result = await client.send(new TokenPriceCandlesticksRequest(args));
  const tokenPriceCandleSticks: TokenPriceCandlesticks[] = result["data"];
  fs.writeFileSync(
    "candleSticks.json",
    JSON.stringify(tokenPriceCandleSticks, null, 2)
  );
}

main();
```

ts-node で実行することでデータを取得し、candleSticks.json というデータファイルを作成してくれます。

```shell
$ npx ts-node 001-download-candle-sticks-data.ts
```

## トレーニング

Tensorflow.js を使って機械学習モデルのトレーニングを実行します。

こちらも新しく ts ファイルを作成して、次のようなコードを書いていきます。

002-train.ts

```ts
import candleData from "./candleSticks.json";
import * as tf from "@tensorflow/tfjs-node";

export interface Ohlc {
  mint: string;
  granularity: string;
  lastblockid: number;
  startTime: number;
  high: string;
  low: string;
  open: string;
  close: string;
  volume: string;
}

const TRAIN_TICKS_WINDOW = 10;

// ORCA
const targetToken = {
  mint: new PublicKey("orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE"),
  decimals: 6,
};

async function trainModel(
  trainX: number[][],
  trainY: number[]
): Promise<tf.LayersModel> {
  const tensorX = tf.tensor2d(trainX);
  const tensorY = tf.tensor1d(trainY);

  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [tensorX.shape[1]],
      units: 64,
      activation: "relu",
    })
  );
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: tf.losses.meanSquaredError,
  });

  await model.fit(tensorX, tensorY, {
    batchSize: 32,
    epochs: 500,
    shuffle: true,
    verbose: 1,
  });

  return model;
}

function preprocessData(candleData: Ohlc[]): {
  trainX: number[][];
  trainY: number[];
} {
  const trainX: number[][] = [];
  const trainY: number[] = [];

  const volatilities = candleData.map(
    (candle) =>
      (Number(candle.high) - Number(candle.low)) /
      Math.pow(10, targetToken.decimals)
  );
  const windowSize = TRAIN_TICKS_WINDOW;

  for (let i = 0; i < candleData.length - windowSize - 1; i++) {
    const window = volatilities.slice(i, i + windowSize);
    const next = volatilities[i + windowSize];
    trainX.push(window);
    trainY.push(next);
  }

  return { trainX, trainY };
}

async function main() {
  const { trainX, trainY } = preprocessData(candleData as Ohlc[]);

  console.log("Training model...");
  const model = await trainModel(trainX, trainY);
  console.log("Model trained.");
  await model.save("file://./model");
}

main();
```

これで、`model` ディレクトリが作成され、その中に学習済みモデルの情報が保存されます。

```shell
$ npx ts-node 002-train.ts
```

## 価格幅予測

学習済みモデルを利用して、API から直近のデータを取得し価格幅を予測します。

003-predict-from-api.ts

```ts
import * as tf from "@tensorflow/tfjs-node";
import {
  RestClient,
  TokenPriceCandlesticks,
  TokenPriceCandlesticksRequest,
  TokenPriceCandlesticksRequestArgs,
} from "@hellomoon/api";
import * as dotenv from "dotenv";
const TRAIN_TICKS_WINDOW = 10;

// ORCA
const targetToken = {
  mint: new PublicKey("orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE"),
  decimals: 6,
};

dotenv.config();
const client = new RestClient(process.env.HELLO_MOON_API_KEY as string);

function preprocessPredictData(input: TokenPriceCandlesticks[]): number[] {
  return input.map((candle) => {
    return (
      (Number(candle.high) - Number(candle.low)) /
      Math.pow(10, targetToken.decimals)
    );
  });
}

async function predictPriceRange() {
  const mint: string = targetToken.mint.toBase58();
  const args: TokenPriceCandlesticksRequestArgs = {
    mint,
    granularity: ["ONE_HOUR"],
    limit: TRAIN_TICKS_WINDOW,
  };
  const result = await client.send(new TokenPriceCandlesticksRequest(args));
  const tokenPriceCandleSticks: TokenPriceCandlesticks[] = result["data"];
  const model = await tf.loadLayersModel("file://./model/model.json");
  const predictData = preprocessPredictData(tokenPriceCandleSticks);
  const predictX = tf.tensor2d([predictData]);
  const output = model.predict(predictX) as tf.Tensor;
  const volatility = (await output.array()) as number[][];
  console.log(volatility[0][0]);
  return volatility[0][0];
}

predictPriceRange();
```

```shell
$ npx ts-node 003-predict-from-api.ts
```

これで、価格幅まで予測できたので、次回は Orca の集中流動性プールに流動性を提供して、定期的に値幅を調整していく Bot を作っていきます。
