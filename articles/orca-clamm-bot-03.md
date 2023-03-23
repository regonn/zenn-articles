---
title: "Orca で 集中流動性AMM Bot を動かす Part 3 ~集中流動性提供 Bot を動かす~"
emoji: "🐳"
type: "tech"
topics: ["solana", "ブロックチェーン"]
published: true
---

※ 投資は自己判断でお願いします。

## この記事シリーズでの目的

Solana ブロックチェーンの 集中流動性 AMM である Orca の SDK を利用して Bot を動かすのが目標です。

- [Part 1 SDK を利用して、流動性提供するために、対象トークンとステーブルコインの保有残高を調整する](https://zenn.dev/regonn/articles/orca-clamm-bot-01)
- [Part 2 HelloMoon API を利用して、Orca でのヒストリカルデータを取得して、機械学習で集中流動性提供時の価格変動幅を予測してみる](https://zenn.dev/regonn/articles/orca-clamm-bot-02)
- Part 3 (この記事) 定期的に集中流動性を調整する Bot を作成

コード全体は

https://github.com/regonn/OrcaClammBot

で公開しています。

記事について質問がある場合は、Orca の Discord の日本語チャンネル(`#🇯🇵│日本語-japanese-community`)等で質問してもらえれば回答していきます。

https://discord.gg/orca-so

## 集中流動性提供

ほとんどデータ処理等は part 2, 3 で完了したので、あとは、定期的に流動性を提供するコードを書いていきます。

ここでは、流動性提供と流動性提供終了、現在の提供確認ができるように、 `openPosition`, `closePosition`, `getPositions` を作ります。
基本的にはチュートリアルのコードと一緒です。

https://github.com/everlastingsong/tour-de-whirlpool/

```ts
interface Position {
  positionAddress: string;
  whirlpoolId: string;
  whirlpoolPrice: string;
  tokenA: string;
  tokenB: string;
  liquidity: string;
  lower: string;
  upper: string;
  amountA: string;
  amountB: string;
}

async function openPosition(
  lowerPrice: Decimal,
  upperPrice: Decimal,
  targetAmount: Decimal
) {
  const provider = AnchorProvider.env();
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(ctx);

  const whirlpool = await getWhirlpool(client);

  const sqrt_price_x64 = whirlpool.getData().sqrtPrice;
  const price = PriceMath.sqrtPriceX64ToPrice(
    sqrt_price_x64,
    targetToken.decimals,
    usdc.decimals
  );
  console.log("price:", price.toFixed(usdc.decimals));

  const targetAmountU64 = DecimalUtil.toU64(targetAmount, targetToken.decimals);
  const slippage = Percentage.fromFraction(10, 1000); // 1%

  const whirlpool_data = whirlpool.getData();
  const token_a = whirlpool.getTokenAInfo();
  const token_b = whirlpool.getTokenBInfo();
  const lower_tick_index = PriceMath.priceToInitializableTickIndex(
    lowerPrice,
    token_a.decimals,
    token_b.decimals,
    whirlpool_data.tickSpacing
  );
  const upper_tick_index = PriceMath.priceToInitializableTickIndex(
    upperPrice,
    token_a.decimals,
    token_b.decimals,
    whirlpool_data.tickSpacing
  );
  console.log(
    "lower & upper price",
    PriceMath.tickIndexToPrice(
      lower_tick_index,
      token_a.decimals,
      token_b.decimals
    ).toFixed(token_b.decimals),
    PriceMath.tickIndexToPrice(
      upper_tick_index,
      token_a.decimals,
      token_b.decimals
    ).toFixed(token_b.decimals)
  );

  const quote = increaseLiquidityQuoteByInputTokenWithParams({
    tokenMintA: token_a.mint,
    tokenMintB: token_b.mint,
    sqrtPrice: whirlpool_data.sqrtPrice,
    tickCurrentIndex: whirlpool_data.tickCurrentIndex,

    tickLowerIndex: lower_tick_index,
    tickUpperIndex: upper_tick_index,

    inputTokenMint: targetToken.mint,
    inputTokenAmount: targetAmountU64,

    slippageTolerance: slippage,
  });

  console.log(
    "targetToken max input",
    DecimalUtil.fromU64(quote.tokenMaxA, token_a.decimals).toFixed(
      token_a.decimals
    )
  );
  console.log(
    "USDC max input",
    DecimalUtil.fromU64(quote.tokenMaxB, token_b.decimals).toFixed(
      token_b.decimals
    )
  );

  const open_position_tx = await whirlpool.openPositionWithMetadata(
    lower_tick_index,
    upper_tick_index,
    quote
  );

  try {
    const signature = await open_position_tx.tx.buildAndExecute();
    console.log("OpenPositionSignature", signature);
    console.log("positionNFT:", open_position_tx.positionMint.toBase58());

    const latest_blockhash = await ctx.connection.getLatestBlockhash();
    await ctx.connection.confirmTransaction(
      { signature, ...latest_blockhash },
      "confirmed"
    );
  } catch (e) {
    console.log("error", e);
    console.log("wait 10 sec");
    await sleep(10000);
  }
}

async function closePosition(position_address: string) {
  const provider = AnchorProvider.env();
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(ctx);

  const position_pubkey = new PublicKey(position_address);
  console.log("closePositionAddress:", position_pubkey.toBase58());

  const slippage = Percentage.fromFraction(10, 1000); // 1%

  const position = await client.getPosition(position_pubkey);
  const position_owner = ctx.wallet.publicKey;
  const position_token_account = await deriveATA(
    position_owner,
    position.getData().positionMint
  );
  const whirlpool_pubkey = position.getData().whirlpool;
  const whirlpool = await client.getPool(whirlpool_pubkey);
  const whirlpool_data = whirlpool.getData();

  const token_a = whirlpool.getTokenAInfo();
  const token_b = whirlpool.getTokenBInfo();

  const tick_spacing = whirlpool.getData().tickSpacing;
  const tick_array_lower_pubkey = PDAUtil.getTickArrayFromTickIndex(
    position.getData().tickLowerIndex,
    tick_spacing,
    whirlpool_pubkey,
    ctx.program.programId
  ).publicKey;
  const tick_array_upper_pubkey = PDAUtil.getTickArrayFromTickIndex(
    position.getData().tickUpperIndex,
    tick_spacing,
    whirlpool_pubkey,
    ctx.program.programId
  ).publicKey;

  const tokens_to_be_collected = new Set<string>();
  tokens_to_be_collected.add(token_a.mint.toBase58());
  tokens_to_be_collected.add(token_b.mint.toBase58());
  whirlpool.getData().rewardInfos.map((reward_info) => {
    if (PoolUtil.isRewardInitialized(reward_info)) {
      tokens_to_be_collected.add(reward_info.mint.toBase58());
    }
  });

  const required_ta_ix: Instruction[] = [];
  const token_account_map = new Map<string, PublicKey>();
  for (let mint_b58 of tokens_to_be_collected) {
    const mint = new PublicKey(mint_b58);

    const { address, ...ix } = await resolveOrCreateATA(
      ctx.connection,
      position_owner,
      mint,
      () => ctx.fetcher.getAccountRentExempt()
    );
    required_ta_ix.push(ix);
    token_account_map.set(mint_b58, address);
  }

  let update_fee_and_rewards_ix = WhirlpoolIx.updateFeesAndRewardsIx(
    ctx.program,
    {
      whirlpool: position.getData().whirlpool,
      position: position_pubkey,
      tickArrayLower: tick_array_lower_pubkey,
      tickArrayUpper: tick_array_upper_pubkey,
    }
  );

  let collect_fees_ix = WhirlpoolIx.collectFeesIx(ctx.program, {
    whirlpool: whirlpool_pubkey,
    position: position_pubkey,
    positionAuthority: position_owner,
    positionTokenAccount: position_token_account,
    tokenOwnerAccountA: token_account_map.get(
      token_a.mint.toBase58()
    ) as PublicKey,
    tokenOwnerAccountB: token_account_map.get(
      token_b.mint.toBase58()
    ) as PublicKey,
    tokenVaultA: whirlpool.getData().tokenVaultA,
    tokenVaultB: whirlpool.getData().tokenVaultB,
  });

  const collect_reward_ix = [
    EMPTY_INSTRUCTION,
    EMPTY_INSTRUCTION,
    EMPTY_INSTRUCTION,
  ];
  for (let i = 0; i < whirlpool.getData().rewardInfos.length; i++) {
    const reward_info = whirlpool.getData().rewardInfos[i];
    if (!PoolUtil.isRewardInitialized(reward_info)) continue;

    collect_reward_ix[i] = WhirlpoolIx.collectRewardIx(ctx.program, {
      whirlpool: whirlpool_pubkey,
      position: position_pubkey,
      positionAuthority: position_owner,
      positionTokenAccount: position_token_account,
      rewardIndex: i,
      rewardOwnerAccount: token_account_map.get(
        reward_info.mint.toBase58()
      ) as PublicKey,
      rewardVault: reward_info.vault,
    });
  }

  const quote = decreaseLiquidityQuoteByLiquidityWithParams({
    sqrtPrice: whirlpool_data.sqrtPrice,
    tickCurrentIndex: whirlpool_data.tickCurrentIndex,

    tickLowerIndex: position.getData().tickLowerIndex,
    tickUpperIndex: position.getData().tickUpperIndex,

    liquidity: position.getData().liquidity,

    slippageTolerance: slippage,
  });

  console.log(
    "targetToken min output",
    DecimalUtil.fromU64(quote.tokenMinA, token_a.decimals).toFixed(
      token_a.decimals
    )
  );
  console.log(
    "USDC min output",
    DecimalUtil.fromU64(quote.tokenMinB, token_b.decimals).toFixed(
      token_b.decimals
    )
  );

  const decrease_liquidity_ix = WhirlpoolIx.decreaseLiquidityIx(ctx.program, {
    ...quote,
    whirlpool: whirlpool_pubkey,
    position: position_pubkey,
    positionAuthority: position_owner,
    positionTokenAccount: position_token_account,
    tokenOwnerAccountA: token_account_map.get(
      token_a.mint.toBase58()
    ) as PublicKey,
    tokenOwnerAccountB: token_account_map.get(
      token_b.mint.toBase58()
    ) as PublicKey,
    tokenVaultA: whirlpool.getData().tokenVaultA,
    tokenVaultB: whirlpool.getData().tokenVaultB,
    tickArrayLower: tick_array_lower_pubkey,
    tickArrayUpper: tick_array_upper_pubkey,
  });

  const close_position_ix = WhirlpoolIx.closePositionIx(ctx.program, {
    position: position_pubkey,
    positionAuthority: position_owner,
    positionTokenAccount: position_token_account,
    positionMint: position.getData().positionMint,
    receiver: position_owner,
  });

  const tx_builder = new TransactionBuilder(ctx.connection, ctx.wallet);

  required_ta_ix.map((ix) => tx_builder.addInstruction(ix));
  tx_builder

    .addInstruction(update_fee_and_rewards_ix)
    .addInstruction(collect_fees_ix)
    .addInstruction(collect_reward_ix[0])
    .addInstruction(collect_reward_ix[1])
    .addInstruction(collect_reward_ix[2])

    .addInstruction(decrease_liquidity_ix)

    .addInstruction(close_position_ix);

  try {
    const signature = await tx_builder.buildAndExecute();
    console.log("ClosePositionSignature", signature);
    const latest_blockhash = await ctx.connection.getLatestBlockhash();
    await ctx.connection.confirmTransaction(
      { signature, ...latest_blockhash },
      "confirmed"
    );
  } catch (e) {
    console.log("error", e);
    console.log("wait 10 sec");
    await sleep(10000);
  }
}

async function getPositions(): Promise<Position[]> {
  const provider = AnchorProvider.env();
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(ctx);

  const token_accounts = (
    await ctx.connection.getTokenAccountsByOwner(ctx.wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })
  ).value;

  const whirlpool_position_candidate_pubkeys: PublicKey[] = token_accounts
    .map((ta) => {
      const parsed = TokenUtil.deserializeTokenAccount(ta.account.data);

      if (!parsed) return undefined;

      const pda = PDAUtil.getPosition(ctx.program.programId, parsed.mint);

      return new BN(parsed.amount.toString()).eq(new BN(1))
        ? pda.publicKey
        : undefined;
    })
    .filter((pubkey) => pubkey !== undefined) as PublicKey[];

  const whirlpool_position_candidate_datas = await ctx.fetcher.listPositions(
    whirlpool_position_candidate_pubkeys,
    true
  );

  const whirlpool_positions = whirlpool_position_candidate_pubkeys.filter(
    (pubkey, i) => whirlpool_position_candidate_datas[i] !== null
  );

  const positions: Position[] = [];

  for (let i = 0; i < whirlpool_positions.length; i++) {
    const p = whirlpool_positions[i];

    const position = await client.getPosition(p);
    const data = position.getData();

    const pool = await client.getPool(data.whirlpool);
    const token_a = pool.getTokenAInfo();
    const token_b = pool.getTokenBInfo();
    const price = PriceMath.sqrtPriceX64ToPrice(
      pool.getData().sqrtPrice,
      token_a.decimals,
      token_b.decimals
    );

    const lower_price = PriceMath.tickIndexToPrice(
      data.tickLowerIndex,
      token_a.decimals,
      token_b.decimals
    );
    const upper_price = PriceMath.tickIndexToPrice(
      data.tickUpperIndex,
      token_a.decimals,
      token_b.decimals
    );

    const amounts = PoolUtil.getTokenAmountsFromLiquidity(
      data.liquidity,
      pool.getData().sqrtPrice,
      PriceMath.tickIndexToSqrtPriceX64(data.tickLowerIndex),
      PriceMath.tickIndexToSqrtPriceX64(data.tickUpperIndex),
      true
    );

    positions.push({
      positionAddress: p.toBase58(),
      whirlpoolId: data.whirlpool.toBase58(),
      whirlpoolPrice: price.toFixed(token_b.decimals),
      tokenA: token_a.mint.toBase58(),
      tokenB: token_b.mint.toBase58(),
      liquidity: data.liquidity.toString(),
      lower: lower_price.toFixed(token_b.decimals),
      upper: upper_price.toFixed(token_b.decimals),
      amountA: DecimalUtil.fromU64(amounts.tokenA, token_a.decimals).toString(),
      amountB: DecimalUtil.fromU64(amounts.tokenB, token_b.decimals).toString(),
    });
  }
  return positions;
}
```

## Bot を記述

今まで書いてきた部分を利用して、定期実行 Bot 部分を書いていきます。
処理の順番としては、

- 現在のポジション取得
- ポジションを持っていたらクローズ
- リバランス
- 値幅予測
- 流動性提供

をしています。今までの記事で書いてきたものは、別のファイルに切り分けて利用できるようにしてあります。

コード全体は https://github.com/regonn/OrcaClammBot を確認してください。

004-bot.ts

```ts
import {
  getBalance,
  getPrice,
  swapInToken,
  openPosition,
  getPositions,
  closePosition,
  Position,
} from "./999-functions";
import { targetToken, usdc } from "./000-config";
import { predictPriceRange } from "./003-predict-from-api";

export async function bot() {
  let positions: Position[] = await getPositions();
  if (positions.length > 0) {
    for (let position of positions) {
      if (
        position.tokenA === targetToken.mint.toBase58() &&
        position.tokenB === usdc.mint.toBase58()
      ) {
        console.log("close position", position.positionAddress);
        await closePosition(position.positionAddress);
      }
    }
  }
  let price = await getPrice();
  let balance = await getBalance();
  const targetValue = balance.target.mul(price);
  const usdcValue = balance.usdc;
  const diff = targetValue.sub(usdcValue);
  if (diff.lt(balance.usdc.mul(0.01))) {
    console.log("skip swap");
  } else {
    console.log("swap");
    if (diff.gt(0)) {
      await swapInToken(targetToken, diff.div(price).div(2));
    } else {
      await swapInToken(usdc, diff.div(2));
    }
    price = await getPrice();
    balance = await getBalance();
  }
  console.log("predict price range");
  let predictedPriceRange = await predictPriceRange();
  const targetDepositValue = balance.target.mul(0.9); // 全額だと足りない場合があるので9割で流動性提供する
  await openPosition(
    price.minus(predictedPriceRange * 0.5),
    price.add(predictedPriceRange * 0.5),
    targetDepositValue
  );
}
```

## 定期実行

あとは、Bot が 1 時間毎に定期実行されるようにしていきます。
今回は、 `node-cron` を利用していきます。

```
$ npm instlal node-cron @types/node-cron --save-dev
```

実行用の `scripts` も package.json に追加して最終的には次のようになりました。

package.json

```json
{
  "name": "orca-clamm-bot",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "start": "ts-node main.ts"
  },
  "volta": {
    "node": "18.15.0",
    "npm": "9.5.0"
  },
  "devDependencies": {
    "@types/node": "^18.15.3",
    "@types/node-cron": "^3.0.7",
    "node-cron": "^3.0.2",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.5"
  },
  "dependencies": {
    "@hellomoon/api": "^1.1.1-alpha.1",
    "@orca-so/common-sdk": "^0.1.12",
    "@orca-so/whirlpools-sdk": "^0.8.2",
    "@tensorflow/tfjs-node": "^4.2.0",
    "decimal.js": "^10.4.3",
    "dotenv": "^16.0.3"
  }
}
```

main.ts

```ts
import cron from "node-cron";
import { bot } from "./004-bot";

const task = async () => {
  console.log("Bot Started");
  await bot();
  console.log("Bot Finished");
};

cron.schedule("5 * * * *", task);
```

毎時 00 分だと、HelloMoon 側が更新されない場合があるので、5 分ずらしています。

これで、

```shell
$ npm run start
```

を実行しておくと、毎時 05 分に Bot が起動して、流動性を提供し直してくれるようになります。
失敗時の再処理など、実運用まで持っていくには、もう少しコードを書く必要があるかもしれませんが、一通りの流動性提供の Bot の動きを見ていくことができました。

Solana は今年 2023 年の 3 月で 3 回目の誕生日を迎えました。今までも色々とありましたが、なんとか生き延びているので、私も Solana エコシステムの一部として、Solana を盛り上げていきたいと思います。

私も活動しているので、もしよかったら Orca の Discord 日本語チャンネル(`#🇯🇵│日本語-japanese-community`)に遊びに来てください。

https://discord.gg/orca-so
