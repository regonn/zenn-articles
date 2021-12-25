---
title: "SolanaのNFTをMintするまで解説 4/4 SPLトークンをミントしてNFTを作成"
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
- [Arweave に画像とオフチェーンメタデータをアップロードする](https://zenn.dev/regonn/articles/solana-nft-02)
- SPL トークンをミントして NFT を作成する ← ココ

今回で最後の記事です。前回で Arweave にNFT用画像とオフチェーンメタデータをアップロードしたので、Solanaチェーンでトークン発行(Mint)を行っていきます。

### 環境構築

今回はMetaplex公式の [python-api](https://github.com/metaplex-foundation/python-api) のコードを持ってきて、それを利用します。

```
git clone https://github.com/metaplex-foundation/python-api.git
cd python-api
# ライブラリでバージョン管理されていないので最新コミットに固定
git checkout 441c2ba
# 必要なライブラリのバージョンもpython-api側に合わせる
pip install -r ./requirements.txt
```

### 生成用のSolanaアカウントを作成する

Mintをするために必要な Solana のアカウントを生成していきます。このまま実行するとゴミNFTが生成されてしまうので、 devnet で行っていきます。

```
from api.metaplex_api import MetaplexAPI
from cryptography.fernet import Fernet

from solana.keypair import Keypair
from solana.rpc.api import Client
import base58
import json

# 前回作った Arweave でのオフチェーンメタデータのURI
offchain_metadata_uri = 'https://arweave.net/s9IU4ite53UwvThJc4gqZFXCSJ23jUF5e0PEkwo1SwY/'

# 今回は devnet で行う
api_endpoint = 'https://api.devnet.solana.com'

# 秘密鍵情報等を Dictionary で管理しておいて、最後に JSON で出力するようにするための変数
keys_dict = {}

keys_dict['api_endpoint'] = api_endpoint

# 暗号化用のキーを生成
keys_dict["descryption_key"] = Fernet.generate_key().decode("ascii")

# トークン発行等を行う Wallet を作成
source_account = Keypair()

keys_dict["source_account_secret_key"] = list(source_account.secret_key)[:32]
keys_dict["source_account_public_key"] = str(source_account.public_key)
```

ここまでで Wallet が生成できているはずで、ちゃんと後から復元できるように、SecretKeyが正しいのかを確認しておきます。
SecretKeyからKeypairを作成して、そのPublicKeyが同じものかで確認しておきます。

```
source_account.public_key == Keypair(keys_dict["source_account_secret_key"]).public_key
```

### SPLトークンを Mint

もし、メインネットで実行する場合には作成したWalletにSOLを送金しておかないと、トランザクションを作成できずにMintが失敗します。devnetの場合等には次のサイト等で Airdrop を申請して、solscan で残高を確認しておきましょう。

https://solfaucet.com/

```
# MetaplexAPI に渡す用のコンフィグ生成
metaplex_config_dict = {
    "PRIVATE_KEY": base58.b58encode(source_account.secret_key).decode("ascii"),
    "PUBLIC_KEY": str(source_account.public_key),
    "DECRYPTION_KEY": keys_dict["descryption_key"]
}

metaplex_api = MetaplexAPI(metaplex_config_dict)
seller_basis_fees = 500 # セカンダリーマーケットで指定した creators に渡るロイヤリティ (0-10000) 500で5%
```

Mint します。

```
result_json = metaplex_api.deploy(api_endpoint, "Bubbles", "BUBBLENFT", seller_basis_fees)
```

私の場合は15秒程待って confirm transaction がログに出てきました。これはチェーンの混み具合によっても変動すると思います。
次のコードを実行すれば、実際にトークンの情報を確認できるURLを取得できます。

```
mint_address = json.loads(result_json)['contract']
f'https://solscan.io/token/{mint_address}?cluster=devnet'
```

![](https://storage.googleapis.com/zenn-user-upload/32237ff27d00-20211225.png)

のような形で、Mint した SPL トークン情報を確認できます。

### オフチェーンメタデータを Mint

もう一度構成図を確認すると、まだオンチェーンメタデータが作られていないので、最後にそこを Mint して、SPL トークンとオフチェーンデータのNFT用情報を紐付けます。

![](https://storage.googleapis.com/zenn-user-upload/f2da3dcda197-20211213.png)

```
# NFTを送る先のwalletを作成している。本番だったらWalletの public key だけあれば大丈夫
wallet_json = metaplex_api.wallet()
wallet = json.loads(wallet_json)
keys_dict['wallet_private_key'] = wallet['private_key']
keys_dict['wallet_public_key'] = wallet['address']

# TOKEN 受け取り用に wallet へ少額の SOL を送る、これも本番で別途SOLの入ったwalletがあるなら必要ない
metaplex_api.topup(api_endpoint, wallet['address'])
```

Mintします。

```
metaplex_api.mint(api_endpoint, mint_address, wallet['address'], offchain_metadata_uri)
```

ここまで利用したWallet情報等を json ファイルで書き出しておきます。

```
with open('../solana-nft-keys.json', 'w') as fp:
    json.dump(keys_dict, fp)
```

### NFT を確認する

これで、一通りのNFTをMintする作業が終わりましたが、ちゃんとできているのか、第2回の記事で利用したコードを使って、NFT情報を確認してみましょう。

```
# 第2回で利用したコード

from solana.publickey import PublicKey
import base64
import struct
import requests
METADATA_PROGRAM_ID = PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

# metadataアカウントを取得する
def get_metadata_account(mint_key):
    return PublicKey.find_program_address(
        [b'metadata', bytes(METADATA_PROGRAM_ID), bytes(PublicKey(mint_key))],
        METADATA_PROGRAM_ID
    )[0]

# バイナリデータからmetadata情報を取り出す
def unpack_metadata_account(data):
    assert(data[0] == 4)
    i = 1
    source_account = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    i += 32
    mint_account = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    i += 32
    name_len = struct.unpack('<I', data[i:i+4])[0]
    i += 4
    name = struct.unpack('<' + "B"*name_len, data[i:i+name_len])
    i += name_len
    symbol_len = struct.unpack('<I', data[i:i+4])[0]
    i += 4 
    symbol = struct.unpack('<' + "B"*symbol_len, data[i:i+symbol_len])
    i += symbol_len
    uri_len = struct.unpack('<I', data[i:i+4])[0]
    i += 4 
    uri = struct.unpack('<' + "B"*uri_len, data[i:i+uri_len])
    i += uri_len
    fee = struct.unpack('<h', data[i:i+2])[0]
    i += 2
    has_creator = data[i] 
    i += 1
    creators = []
    verified = []
    share = []
    if has_creator:
        creator_len = struct.unpack('<I', data[i:i+4])[0]
        i += 4
        for _ in range(creator_len):
            creator = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
            creators.append(creator)
            i += 32
            verified.append(data[i])
            i += 1
            share.append(data[i])
            i += 1
    primary_sale_happened = bool(data[i])
    i += 1
    is_mutable = bool(data[i])
    metadata = {
        "update_authority": source_account,
        "mint": mint_account,
        "data": {
            "name": bytes(name).decode("utf-8").strip("\x00"),
            "symbol": bytes(symbol).decode("utf-8").strip("\x00"),
            "uri": bytes(uri).decode("utf-8").strip("\x00"),
            "seller_fee_basis_points": fee,
            "creators": creators,
            "verified": verified,
            "share": share,
        },
        "primary_sale_happened": primary_sale_happened,
        "is_mutable": is_mutable,
    }
    return metadata

metadata_account = get_metadata_account(mint_address)
decoded_data = base64.b64decode(Client(api_endpoint).get_account_info(metadata_account)['result']['value']['data'][0])
metadata = unpack_metadata_account(decoded_data)
```

`metadata` (オンチェーンメタデータ)は次のようになっていて大丈夫そうでした。

```
{'data': {'creators': [b'EZD3kuYkYwwWfRwoCZSz7Fws4YC6P8xTBU633M1CBbrT'],
  'name': 'Bubbles',
  'seller_fee_basis_points': 500,
  'share': [100],
  'symbol': 'BUBBLENFT',
  'uri': 'https://arweave.net/s9IU4ite53UwvThJc4gqZFXCSJ23jUF5e0PEkwo1SwY/',
  'verified': [1]},
 'is_mutable': True,
 'mint': b'Tp2SAqDDNvQS9i5eRY8UrVz4RF7WAR97KGaEKXRkby4',
 'primary_sale_happened': False,
 'update_authority': b'EZD3kuYkYwwWfRwoCZSz7Fws4YC6P8xTBU633M1CBbrT'}
```

オフチェーンメタデータにたどり着けるかも確認します。

```
metadata_uri = metadata['data']['uri']
response = requests.get(metadata_uri)
response_json = response.json()
```

`response_json` も前回作成して、Arweaveにアップロードした内容が確認できました。

```
{'attributes': [{'trait_type': 'name', 'value': 'Bubbles #4'},
  {'trait_type': 'obj_size', 'value': 10},
  {'trait_type': 'obj_numbers', 'value': 100}],
 'collection': {'family': 'NFT Study', 'name': 'Bubbles'},
 'description': 'What a beautiful bubbles!',
 'external_url': 'https://twitter.com/regonn_haizine',
 'image': 'https://www.arweave.net/_j4HsitIYojvq3EpXubq9HyeMRPo9agkbAfPpXcIdqI?ext=png',
 'name': 'Bubbles #4',
 'properties': {'category': 'image',
  'creators': [{'address': 'A8r5gPBeUHbguZ6mKGB1zzbKhMHtfQdWx6YqXQ94Ujjd',
    'share': 100}],
  'files': [{'type': 'image/png',
    'uri': 'https://www.arweave.net/_j4HsitIYojvq3EpXubq9HyeMRPo9agkbAfPpXcIdqI?ext=png'}]},
 'seller_fee_basis_points': 500,
 'symbol': ''}
```

次を実行すれば、NFTを送ったWalletにNFTが入っているかも確認できます。

```
f'https://solscan.io/account/{wallet["address"]}?cluster=devnet'
```

![](https://storage.googleapis.com/zenn-user-upload/74f464d6585f-20211225.png)

また、先程 SPL トークンを確認したときの Token ページもNFT情報が反映されて画像等が表示されているようになりました。

Before

![](https://storage.googleapis.com/zenn-user-upload/32237ff27d00-20211225.png)

After

![](https://storage.googleapis.com/zenn-user-upload/eb92211a1c2f-20211225.png)

確認もできて、以上で終わりです。

### 所感

現在も流行っている(と信じたい) NFT 周りの技術を実際に Mint するところまで勉強してみて、Solana含めブロックチェーン技術についてより興味を持てた気がします。元々私がWebエンジニア出身というのもあってか、バイナリデータ周りの操作等には結構ハマりました。

今後もWeb3やメタバース、DAO等と一緒に新しい技術やサービス・プロダクトが生まれて、ブロックチェーン界隈も盛り上がってくると思います。(どのブロックチェーンがメジャーになるかは別として)。

個人的にはRustが使われている Solana を推していきたいので、今後も情報発信ができていけたらなと思います。
まずは、確定申告に向けて Solana ブロックチェーンのトランザクションから税理士さんに渡す用のデータ生成したり、来年はDEXを利用したBOT等も作成していきたいなと思っています。

それでは皆さん良いブロックチェーンライフを！