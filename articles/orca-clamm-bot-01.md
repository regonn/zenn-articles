---
title: "Orca で 集中流動性AMM Bot を動かす Part 1 ~SDKを利用してリバランスする~ "
emoji: "🐳"
type: "tech"
topics: ["solana", "ブロックチェーン"]
published: true
---

※ 投資は自己判断でお願いします。

## この記事シリーズでの目的

Solana ブロックチェーンの 集中流動性 AMM である Orca の SDK を利用して Bot を動かすのが目標です。

- Part 1 (この記事) SDK を利用して、流動性提供するために、対象トークンとステーブルコインの保有残高を調整する
- [Part 2 HelloMoon API を利用して、Orca でのヒストリカルデータを取得して、機械学習で集中流動性提供時の価格変動幅を予測してみる](https://zenn.dev/regonn/articles/orca-clamm-bot-02)
- [Part 3 定期的に集中流動性を調整する Bot を作成](https://zenn.dev/regonn/articles/orca-clamm-bot-03)

コード全体は

https://github.com/regonn/OrcaClammBot

で公開しています。

記事について質問がある場合は、Orca の Discord の日本語チャンネル(`#🇯🇵│日本語-japanese-community`)等で質問してもらえれば回答していきます。

https://discord.gg/orca-so

## Orca とは?

Solana ブロックチェーン上で利用できる 集中流動性 AMM(CLAMM: Concentrated Liquidity Automated Market Maker) です。

https://www.orca.so/

他のチェーン等での集中流動性 AMM は Uniswap v3 等が有名です。

流動性提供の価格帯を範囲指定することが可能で、少ない資本で効率的な流動性提供が可能です。

Orca は人によりそった DeFi を目指しており、UI も他のサービスに比べて触りやすくなっていますので、一度ウェブサイトで動かしてみると、Bot の際の動きが理解しやすいと思います。

## Orca の SDK

Orca は公式に Typescript SDK を提供しています。

https://github.com/orca-so/whirlpools

また、チュートリアルも用意されていて、今回扱う Orca のコード部分はチュートリアルを参考に作っています。

https://orca-so.gitbook.io/orca-developer-portal/whirlpools/tour-de-whirlpool-tutorial

https://github.com/everlastingsong/tour-de-whirlpool/

## ポートフォリオ調整

流動性を提供する際に、預ける 2 個のトークンは一緒の価値になるようにしてあげる必要があるため、SDK で Swap を行います。Part1 のコードだけでも、シャノンの悪魔 BOT のようなリバランスするための Bot は作成可能です。(※シャノンの悪魔は、手数料が 0 に等しく、ある程度価格が安定している場合に成り立ちます。ブロックチェーンでのトークンは価値が一気に下る場合もあるのでお気をつけください。)

### 開発環境を作成

Orca の SDK は Typescript なので、node で動かしていきます。

まず、新規にプロジェクト用のディレクトリを作成し、`npm init` 等で package.json を作成します。

```json
{
  "name": "orca-clamm-bot",
  "version": "1.0.0",
  "description": "",
  "scripts": {},
  "volta": {
    "node": "18.15.0",
    "npm": "9.5.0"
  },
  "devDependencies": {
    "@types/node": "^18.15.3",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.5"
  },
  "dependencies": {
    "decimal.js": "^10.4.3",
    "@orca-so/common-sdk": "^0.1.12",
    "@orca-so/whirlpools-sdk": "^0.8.2",
    "dotenv": "^16.0.3"
  }
}
```

Typescript 前提で動かすので、ts-node を入れたり、ウォレット情報等のセキュアな情報は dotenv を利用して、`.env` に記述しておきます。

また、Solana の Wallet 情報の json を読み取れるように、tsconfig.json を次のように設定しておきます。

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

### Solana を利用できるようにする

次のリンクを参考に、Solana CLI が動かせるようにしてください。

https://docs.solana.com/cli/install-solana-cli-tools

Solana CLI が動かせるようになったら、Wallet を作成します。

https://docs.solana.com/wallet-guide/file-system-wallet

ここで生成される json ファイルは、秘密鍵にあたるので、他人への共有はしないように気をつけましょう。

### Wallet にトークンと Solana を入れる

作成したウォレット宛に、トランザクション実行用の SOL と、BOT で取引するトークンを入れてくださいください。今回は(ORCA と USDC を取引する想定でやっていきます。)

ウォレットのアドレスは次のコマンドでも確認できます。

```shell
$ solana-keygen pubkey xxxxx.json
```

### Wallet の残高を取得する

ちゃんと、残高があるかを確認できるようにしていきます。

まずは、先程作成した、Wallet の json をプロジェクトルートディレクトリに入れておきます。今回は、 wallet.json としました。中身としては次のような数字の配列形式になっているはずです。

wallet.json

```json
[
  xxx, xxx, xxx, ...
]
```

また、Anchor というライブラリを利用する際に、環境変数を設定しておく必要があるので、今回は dotenv を利用するため、 .env ファイルに次のように書いておきます。

.env

```
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com
ANCHOR_WALLET=wallet.json
```

ANCHOR_PROVIDER_URL には Solana の RPC サーバーのアドレスを設定してください。公式の RPC だと、連続で情報取得したときに 429 エラーになることが多いので有料の RPC サーバー等も検討してください。

`ANCHOR_WALLET` は Solana Wallet のファイル名を設定してください。

次に、取得のコードを書いていきます。

まずは、今回の part1 で必要になるライブラリをインポートしておきます。

orca.ts

```ts
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import { Decimal } from "decimal.js";
import { AnchorProvider } from "@project-serum/anchor";
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  PriceMath,
  ORCA_WHIRLPOOLS_CONFIG,
  Whirlpool,
  WhirlpoolClient,
  swapQuoteByInputToken,
} from "@orca-so/whirlpools-sdk";
import { Keypair, Connection } from "@solana/web3.js";
import secret from "./wallet.json";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenUtil, DecimalUtil, Percentage } from "@orca-so/common-sdk";
```

`import secret from "./wallet.json"` のところで、json を直接読み込んでいます。tsconfing.json に `"resolveJsonModule": true,` の記述が無いとエラーになるのでご注意ください。

次に設定部分と残高取得部分を書いていきます。今回は USDC と ORCA トークンの残高を表示できるようにします。

```ts
dotenv.config();

interface Balance {
  target: Decimal;
  usdc: Decimal;
}

// STABLECOIN(USDC)
const usdc = {
  mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  decimals: 6,
};

// ORCA
const targetToken = {
  mint: new PublicKey("orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE"),
  decimals: 6,
};

const RPC_ENDPOINT_URL =
  process.env.ANCHOR_PROVIDER_URL || "https://api.mainnet-beta.solana.com";
const COMMITMENT = "confirmed";

function getBalance(): Promise<Balance> {
  const connection = new Connection(RPC_ENDPOINT_URL, COMMITMENT);
  const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
  console.log("wallet pubkey:", keypair.publicKey.toBase58());
  const accounts = await connection.getTokenAccountsByOwner(keypair.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });
  const balance: Balance = { target: new Decimal(0), usdc: new Decimal(0) };
  for (let i = 0; i < accounts.value.length; i++) {
    const value = accounts.value[i];

    const parsed_token_account = TokenUtil.deserializeTokenAccount(
      value.account.data
    );

    if (!parsed_token_account) continue;

    const mint = parsed_token_account.mint;

    if (mint.equals(targetToken.mint)) {
      balance.target = DecimalUtil.fromU64(
        parsed_token_account.amount,
        targetToken.decimals
      );
    } else if (mint.equals(usdc.mint)) {
      balance.usdc = DecimalUtil.fromU64(
        parsed_token_account.amount,
        usdc.decimals
      );
    }
  }

  return balance;
}

getBalance();
```

ここまで書けたら、次のコマンドを実行して、成功すれば、残高が表示されます。

```shell
$ npx ts-node orca.ts
wallet pubkey: XXXXXXXXXXXXXXXXXXXXXXXX
{ target: 10, usdc: 0 }
```

現在は、10 ORCA がウォレットにあることがわかります。

次に `getBalance();` はコメントアウトしておき、Orca からプールの情報を取ってきて価格を取得します。

```ts
// コメントアウトしておく
// getBalance();

export function getOrcaClient(): WhirlpoolClient {
  const provider = AnchorProvider.env();
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(ctx);
  return client;
}

export const tickSpacing = 64;

async function getWhirlpool(client: WhirlpoolClient): Promise<Whirlpool> {
  const whirlpool_pubkey = PDAUtil.getWhirlpool(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    ORCA_WHIRLPOOLS_CONFIG,
    targetToken.mint,
    usdc.mint,
    tickSpacing
  ).publicKey;
  console.log("pool pubkey: ", whirlpool_pubkey.toBase58());
  const whirlpool = await client.getPool(whirlpool_pubkey);
  return whirlpool;
}

export async function getPrice(): Promise<Decimal> {
  const client = getOrcaClient();
  const whirlpool = await getWhirlpool(client);

  const sqrt_price_x64 = whirlpool.getData().sqrtPrice;
  const price = PriceMath.sqrtPriceX64ToPrice(
    sqrt_price_x64,
    targetToken.decimals,
    usdc.decimals
  );

  console.log("price:", price.toFixed(usdc.decimals));
  return price;
}

getPrice();
```

また、同じように実行すると、現在のプールの価格を出力してくれます。

```shell
$ npx ts-node orca.ts
pool pubkey: 5Z66YYYaTmmx1R4mATAGLSc8aV4Vfy5tNdJQzk1GP9RF
price: 0.808118
```

今回は ORCA/USDC なので、1ORCA = 0.808118 USDC だということがわかります。

`PDAUtil.getWhirlpool` の関数で、Orca のプログラム ID、Orca コンフィグ ID、TokenA Mint アドレス、TokenB Mint アドレス、tickSpacing の 5 種類の情報から、一意の Orca Pool のアドレスを取得できます。pool pubkey で出力されたもので `https://www.orca.so/liquidity/open-position/{pool pubkey}` にアクセスしてみて、想定しているプールの入金画面になるか確認してください。(サイトへのアクセス時は Wallet での連携が必要です。)

例: ORCA/USDC Pool

[https://www.orca.so/liquidity/open-position/5Z66YYYaTmmx1R4mATAGLSc8aV4Vfy5tNdJQzk1GP9RF](https://www.orca.so/liquidity/open-position/5Z66YYYaTmmx1R4mATAGLSc8aV4Vfy5tNdJQzk1GP9RF)

最後に同じ価値になるように swap を実行する部分を書いていきます。

```ts
// コメントアウトしておく
// getBalance();

export async function swapInToken(
  token: { mint: PublicKey; decimals: number },
  InAmount: Decimal
) {
  const provider = AnchorProvider.env();
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(ctx);
  const whirlpool = await getWhirlpool(client);
  const quote = await swapQuoteByInputToken(
    whirlpool,
    token.mint,
    DecimalUtil.toU64(InAmount, token.decimals),
    Percentage.fromFraction(10, 1000), // (10/1000 = 1%)
    ctx.program.programId,
    ctx.fetcher,
    true
  );
  const tx = await whirlpool.swap(quote);
  const signature = await tx.buildAndExecute();
  console.log("signature:", signature);

  const latest_blockhash = await ctx.connection.getLatestBlockhash();
  await ctx.connection.confirmTransaction(
    { signature, ...latest_blockhash },
    "confirmed"
  );
}

async function main() {
  const price = await getPrice();
  const balance = await getBalance();

  const targetValue = balance.target.mul(price);
  const usdcValue = balance.usdc;
  const diff = targetValue.sub(usdcValue);
  if (diff.gt(0)) {
    swapInToken(targetToken, diff.div(price).div(2));
  } else {
    swapInToken(usdc, diff.div(2));
  }
}

main();
```

実行すると、実際にトランザクションが実行され、swap されるのでご注意ください。

```shell
$ npx ts-node orca.ts
pool pubkey: 5Z66YYYaTmmx1R4mATAGLSc8aV4Vfy5tNdJQzk1GP9RF
price: 0.808118
wallet pubkey: XXXXXXXXXXXXXXXXXXXXXXXX
{ target: 10, usdc: 0 }
signature: YYYYYYYYYYYYYYYYYYYYYY
```

これで実際にトランザクションが成功したかは、自分の Wallet や signature を Solscan 等のエクスプローラーで確認してみるとトークン保持額やトランザクションを確認できます。

[Solscan - The most intuitive Solana explorer](https://solscan.io/)

正しく成功しているなら、トークンが半額になり、その分の USDC を保持しているはずです。

今回なら、 5 ORCA, 4.0284 USDC になりました。

これで、指定した 2 個のトークンでリバランスできるようになりました。

(※ ステーブルコインの USDC ですが 2023 年 3 月には価格が乖離するデペグが発生する現象も見られているのでご注意ください。)

次回は、Solana 関連のヒストリカルデータ等を提供してくれている、Hello Moon API からロウソク足情報を取得し、tensorflow.js を利用して、簡単な機械学習でトレーニングをすることで、どれくらいの値幅で動きそうかを予測する部分を書いていきます。
