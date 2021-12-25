---
title: "SolanaのNFTをMintするまで解説 3/4 Arweaveに画像とオフチェーンメタデータをアップロード"
emoji: "☀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["solana", "nft", "ブロックチェーン"]
published: false
---

[Solana アドベントカレンダー 2021](https://adventar.org/calendars/6174) の記事です。

最近個人的に気に入っている Solana ブロックチェーンで、NFT 周りを触る機会があったので、記事にまとめていきます。

4 回に分けて記事投稿予定で、利用する技術は Metaplex と Arweave の予定です。

- [NFT のデータ構成を把握して Token 情報から NFT 画像まで辿れるようにする](https://zenn.dev/regonn/articles/solana-nft-00)
- [Solana.py を利用して、Wallet の NFT 画像を取得する](https://zenn.dev/regonn/articles/solana-nft-01)
- Arweave に画像とオフチェーンメタデータをアップロードする ← ココ
- [SPL トークンをミントして NFT を作成する](https://zenn.dev/regonn/articles/solana-nft-03)

今回は Arweave を利用してNFTの画像とオフチェーンメタデータ(JSON)をアップロードします。

### ArweaveのWallet作成

Solanaとは別に Arweave へデータをアップロードするには、別途AR WalletとARトークン(Solanaではなく、独立したトークン)が必要です。将来的には現在NFT([SSC](https://www.magiceden.io/marketplace/shadowy_super_coder_dao))が爆上げしている、[GenesysGo](https://twitter.com/GenesysGo)のShadow Driveというプロジェクトが運用され始めると、Solana経済圏で完結するかもしれないです。

AR を手に入れるには海外取引所が必要になってくるので、触りだけやってみたい人は公式の初回Wallet作成とTweet投稿でAirdropがもらえるので利用してみるのも良いと思います。

https://faucet.arweave.net/

新規Wallet作成時に json でキーファイルが生成されるので、それを利用します。Google Colab等で操作する場合にはアップロードする必要もあるので、扱いには注意してください。

ArweaveをPythonで扱う場合は[arweave-python-client](https://pypi.org/project/arweave-python-client/1.0.14/)を利用します。

### 実行環境

せっかくなのでNFT用に画像もランダム生成してみます。そのために、画像処理用ライブラリのPillowを使います。matplotlibは画像表示用なので、必須ではないです。

- Python 3.7.12
    - [arweave-python-client==1.0.14](https://pypi.org/project/arweave-python-client/1.0.14/)
    - [matplotlib==3.2.2](https://pypi.org/project/matplotlib/3.2.2/)
    - [pillow==7.1.2](https://pypi.org/project/pillow/7.1.2/)

### 環境構築

```
pip install arweave-python-client==1.0.14 matplotlib==3.2.2 pillow==7.1.2
```

### ライブラリ読み込みや設定

```
import random
from matplotlib.pyplot import imshow
from PIL import Image, ImageDraw

# 画像生成用シード値
seed_number = 46 # おぼろげながら浮かんできたんです。46という数字が。
# 画像上のオブジェクトサイズ
OBJ_SIZE = 10
# 画像に出現するオブジェクト数
OBJ_NUMBERS = 100
```

### NFT画像生成

NFT用の画像を生成する部分です。seed値を変更することで、生成画像も変わります。

```
def generate_random_image(seed):
    IMG_SIZE = 320
    random.seed(seed)
    im = Image.new("RGB", (IMG_SIZE, IMG_SIZE))
    draw = ImageDraw.Draw(im)
    for i in range(OBJ_NUMBERS):
        pos_x = int(random.random() * IMG_SIZE)
        pos_y = int(random.random() * IMG_SIZE)
        r = random.randint(0,256)
        g = random.randint(0,256)
        b = random.randint(0,256)
        draw.ellipse((pos_x - OBJ_SIZE, 
                      pos_y - OBJ_SIZE, 
                      pos_x + OBJ_SIZE, 
                      pos_y + OBJ_SIZE), 
                      (r,g,b))
    imshow(im)
    im.save('./bubbles.png')
# seed値を変えると異なる画像が生成される
generate_random_image(seed_number)
```

生成画像例(Seed値は変更してあります)
![](https://storage.googleapis.com/zenn-user-upload/4b163f9fd184-20211225.png)

### 画像をArweaveへアップロード

画像をArweaveへアップロードする際に、どれだけコスト(AR)が必要なのかは事前に見積が計算できます。

https://arweavefees.com/

今回の画像では9KB程度なので、

- 0.000041395224 AR
- $0.0025540853208 USD

ぐらいでした。安いととるか高いと取るかは人それぞれですが、Arweaveの仕組み上、半永久的にアップロードしてホストしてくれることを考えると安いなと私は思います。

では、実際にアップロードしていきます。

```
import arweave
import json

# ArweaveのWallet生成時に作成されたキーファイル
# ※ウォレットキーファイルのアップロードには注意してください
wallet_file_path = "./arweave-keyfile.json"
wallet = arweave.Wallet(wallet_file_path)
```

保有額等も確認できます。

```
wallet.balance
# 0.10184796595
```

画像を読み込んでアップロードします。トランザクションを生成するとアップロードされます。

```
# コード実行で実際にトランザクション(アップロード処理)が実行されるので注意
with open('./bubbles.png', 'rb') as img:
    img_data = img.read()

    transaction = arweave.Transaction(wallet, data=img_data)
    transaction.add_tag("Content-Type", "image/png")
    transaction.sign()
    transaction.send()
transaction_data = transaction.to_dict()
image_url = f"https://www.arweave.net/{transaction_data['id']}?ext=png"
# https://arweave.net/_j4HsitIYojvq3EpXubq9HyeMRPo9agkbAfPpXcIdqI/?ext=png
```

![](https://arweave.net/_j4HsitIYojvq3EpXubq9HyeMRPo9agkbAfPpXcIdqI/?ext=png)

トランザクションのID情報を直接 `https://www.arweave.net/` の後ろにつけるとファイルにアクセスできます。

### オフチェーン用JSONメタデータ作成

Metaplexで指定されている JSON 構造でオフチェーン用メタデータを作成します。

https://docs.metaplex.com/nft-standard#uri-json-schema

項目が多いのでコメントで説明してあります。詳しくはドキュメントをご覧下さい。

```
name = f'Bubbles #{seed_number}' # NFT のタイトル通し番号等も振っておくと良さそう
metadata = {
    'name': name, # 名前
    'symbol': "", # シンボル名(特に必須ではなさそう)
    'description': "What a beautiful bubbles!", # 説明
    'seller_fee_basis_points': 500, # セカンダリーマーケットで指定した creators に渡るロイヤリティ (0-10000) 500で5%
    'external_url': "https://twitter.com/regonn_haizine", # 本来はNFTのページとかを貼る用の外部URL
    'attributes': [ # アイテムに関する情報、opensea の形式に則っているっぽい https://docs.opensea.io/docs/metadata-standards#attributes value は数字か文字列
        {
            'trait_type': "name",
            'value': name
        },
        {
            'trait_type': "obj_size",
            'value': OBJ_SIZE
        },
        {
            'trait_type': "obj_numbers",
            'value': OBJ_NUMBERS
        },
    ],
    'collection': { # コレクション名(よくあるNFTの偽物ってここの情報を本物と同じに合わせているだけなのかも?)
        'name': "Bubbles",
        'family': "NFT Study",
    },
    'properties': { # ユーザに表示する情報をまとめたもの、表示する画像等
        'files': [
            {
                'uri': image_url,
                'type': "image/png",
            },
        ],
        'category': "image", # "image", "video", "audio", "vr" のカテゴリが存在する
        'creators': [
            {
                'address': "A8r5gPBeUHbguZ6mKGB1zzbKhMHtfQdWx6YqXQ94Ujjd",
                'share': 100,
            },
        ],
    },
    'image': image_url,
}
```

### オフチェーンメタデータをアップロード

画像同様に今度はjsonデータをArweaveにアップロードします。

```
json_str = json.dumps(metadata) # JSON の文字列化

# コード実行で実際にトランザクション(アップロード処理)が実行されるので注意
metadata_transaction = arweave.Transaction(wallet, data=json_str)
metadata_transaction.add_tag("Content-Type", "application/json")
metadata_transaction.sign()
metadata_transaction.send()

metadata_transaction_data = metadata_transaction.to_dict()
json_url = f"https://www.arweave.net/{metadata_transaction_data['id']}"
# https://arweave.net/s9IU4ite53UwvThJc4gqZFXCSJ23jUF5e0PEkwo1SwY
```

これで無事オフチェーンメタデータまで生成できました。
次回は、Solanaのオンチェーン側のデータを生成してNFTをMintします。

### (補足)Arweaveに上げたファイルを確認する

Arweaveにアップロード情報はWalletからも取得できます。
次のようなコードでデータ取得が可能です。

```
from arweave.arweave_lib import arql # arql という sql のようなデータベース参照に似た ar の情報を取得するための記法
transaction_ids = arql(
    wallet,
    {
        "op": "equals",
        "expr1": "from",
        "expr2": "ZF8XWGJFSj7bPlJCmXaJOIhianqkiUksMRqwAjz2kU8" # Transactionを生成した Wallet アドレス
    })
tx = arweave.Transaction(wallet, id=transaction_ids[0]) #一番最後にアップロードした JSON を取得
tx.get_transaction()
tx.get_data()
tx.data
# b'{"name": "Bubbles #4", "symbol": "", "description": "What a beautiful bubbles!", "seller_fee_basis_points": 500, "external_url": "https://twitter.com/regonn_haizine", "attributes": [{"trait_type": "name", "value": "Bubbles #4"}, {"trait_type": "obj_size", "value": 10}, {"trait_type": "obj_numbers", "value": 100}], "collection": {"name": "Bubbles", "family": "NFT Study"}, "properties": {"files": [{"uri": "https://www.arweave.net/_j4HsitIYojvq3EpXubq9HyeMRPo9agkbAfPpXcIdqI?ext=png", "type": "image/png"}], "category": "image", "creators": [{"address": "A8r5gPBeUHbguZ6mKGB1zzbKhMHtfQdWx6YqXQ94Ujjd", "share": 100}]}, "image": "https://www.arweave.net/_j4HsitIYojvq3EpXubq9HyeMRPo9agkbAfPpXcIdqI?ext=png"}'
```