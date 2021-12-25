---
title: "SolanaのNFTをMintするまで解説 2/4 Walletに入っているNFTの画像をPythonで取得する"
emoji: "☀"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["solana", "nft", "ブロックチェーン"]
published: false
---

[Solana アドベントカレンダー 2021](https://adventar.org/calendars/6174) の記事です。

最近個人的に気に入っている Solana ブロックチェーンで、NFT 周りを触る機会があったので、記事にまとめていきます。

4 回に分けて記事投稿予定で、利用する技術は Metaplex と Arweave の予定です。

- [NFT のデータ構成を把握して Token 情報から NFT 画像まで辿れるようにする](https://zenn.dev/regonn/articles/solana-nft-00)
- Solana.py を利用して、Wallet の NFT 画像を取得する  ← ココ
- [Arweave に画像とオフチェーンメタデータをアップロードする](https://zenn.dev/regonn/articles/solana-nft-02)
- [SPL トークンをミントして NFT を作成する](https://zenn.dev/regonn/articles/solana-nft-03)

今回は Solana.py を利用して Wallet の NFT 画像を取得します。

現在 Solana を触るのであれば、プログラミング言語としては、RustとTypeScriptとPythonが利用できますが、今回Pythonを選んだのは、[Google Colab](https://colab.research.google.com/) などでローカルの環境構築せずに実行できる環境が揃っているので採用しました。

また、Metaplexは公式で[python-api](https://github.com/metaplex-foundation/python-api)というコードも公開している(pip ではインストールできない)ので、それを利用して、Metaplex形式で作成されたNFT情報を取得できます。

### 実行環境

- Python 3.7.12
    - [solana==0.19.1](https://pypi.org/project/solana/0.19.1/)
    - [base58==2.1.1](https://pypi.org/project/base58/2.1.1/)

### Solana.py

[公式ドキュメント](https://michaelhly.github.io/solana-py/)

Python で Solana の情報を参照したり操作するためのSDKです。Github のリポジトリは [michaelhly](https://github.com/michaelhly) さんの所で管理されていますが、準公式的な位置付けで、しっかりとメンテナンスもされており、現時点では Solana の仕様に追従するように開発されています。

### 環境構築

pip を利用して必要なライブラリをインストールします。
base58 はバイナリデータを文字列で表現するフォーマットで、base64 から視認性として間違えやすい小文字のl(エル)と数字の1などを考慮して一部の文字が取り除かれています。

```
pip install solana==0.19.1 base58==2.1.1
```

### ライブラリ読み込みや設定

```
# solana ライブラリで利用するもの
from solana.publickey import PublicKey # アドレスを扱えるようにするための Class
from solana.rpc.api import Client # オンチェーンデータの参照や操作を行う
from solana.rpc.types import TokenAccountOpts # 取得したrpcデータを扱うための型

# エンコードされたデータやバイナリデータを扱うためのライブラリ
import base58
import base64
import struct #バイナリデータを扱う際に利用する

# Arweaveの情報を取得する際のhttp client
import requests
```

Solana ではアップロードされたプログラム(スマートコントラクト)がPublicKey(アドレス)から呼べるので、今回利用する、MetaplexやSPL token programをPublicKeyで利用できるようにしておきます。

```
# Solana上にデプロイされたプログラムID
METADATA_PROGRAM_ID = PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
TOKEN_PROGRAM_ID = PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
```

[前回の記事](https://zenn.dev/regonn/articles/solana-nft-00)で利用した、NFTを一つだけ持っているアカウント[DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT](https://solscan.io/account/DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT#tokenAccounts)を利用します。

```
# メインネットを利用する
client = Client("https://api.mainnet-beta.solana.com")

# 一つだけTokenを持っているWalletアドレス
WALLET_ADDRESS = "DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT"
```

### クライアントで情報を取得する

clientでまずは、Walletが持っているトークン情報を取得します。扱いやすいようにJSONパースされた情報で取得します。

```
# encoding= 'jsonParsed' を設定しないと、Base64 等エンコードされたdataが返ってくるので注意
opts = TokenAccountOpts(program_id = TOKEN_PROGRAM_ID, encoding= 'jsonParsed')
# https://michaelhly.github.io/solana-py/api.html#solana.rpc.api.Client.get_token_accounts_by_owner
client_response = client.get_token_accounts_by_owner(PublicKey(WALLET_ADDRESS), opts=opts)
data = client_response['result']['value'][0]['account']['data']['parsed']
```

`data` には持っているトークン情報が入っています。

```
{'info': {'isNative': False,
  'mint': '6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg',
  'owner': 'DDM479qxu1s9eZF8cf8ygRzSGUdhghNymdfdUTWJYxoT',
  'state': 'initialized',
  'tokenAmount': {'amount': '1',
   'decimals': 0,
   'uiAmount': 1.0,
   'uiAmountString': '1'}},
 'type': 'account'}
```

前回の記事の画像では、NFTのオンチェーンデータとオフチェーンデータは次のように結びつけていました。

![](https://storage.googleapis.com/zenn-user-upload/f2da3dcda197-20211213.png)

現在は SPLトークン 情報が手に入っているので、SPLトークンが持っているミントアドレス情報からメタデータカウントが持っている情報を取得していきます。

```
mint_address = data['info']['mint']
# 6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg
```

次に、メタデータアカウントの情報を取得するのですが、オンチェーンデータで情報量を圧縮するために、バイナリ形式で保存されているため、扱いやすいデータで取得するために、公式の[python-api](https://github.com/metaplex-foundation/python-api)からコードを持ってきます。コード自体は少し長めですが、`unpack_metadata_account` ではMetaplex仕様でバイナリデータ化されたものを順に可読情報へと取得しています。

```
# https://github.com/metaplex-foundation/python-api/blob/4a0eee2dda938445855373b866c590ff6305f8fb/metaplex/metadata.py
# 上のURLからコード取得(今後更新される可能性が高いので、コミット番号を固定しています)

# メタデータアカウントを取得する
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
```

実際にデータを取得してきます。

```
metadata_account = get_metadata_account(mint_address)
# G5pwNCq6XSxS53WgJn1x7tLuizN5nV9WGeb283VdkvJp

# https://michaelhly.github.io/solana-py/api.html#solana.rpc.api.Client.get_account_info
# get_account_info は data が json としてパースできない場合には base64 で返してくる
# 今回の場合もmetadataはバイナリデータなので、jsonParsed を指定しても base64 で渡ってくる

decoded_data = base64.b64decode(client.get_account_info(metadata_account)['result']['value']['data'][0])
metadata = unpack_metadata_account(decoded_data)
```

これでやっと、オンチェーンメタデータが取得できました。

```
{'data': {'creators': [b'AuTF3kgAyBzsfjGcNABTSzzXK4bVcZcyZJtpCrayxoVp',
   b'E1bZ99d56AK9vCFq9Y5nC7ZVz2z8CcxVECsDTyZVksmS'],
  'name': 'Snek #8311',
  'seller_fee_basis_points': 0,
  'share': [0, 100],
  'symbol': '',
  'uri': 'https://arweave.net/mk6KmQM8Gb3RQoRV6qVnDqT146lfQX5SJ6fQah0Ba0Q',
  'verified': [1, 0]},
 'is_mutable': True,
 'mint': b'6pLr2MnfGmjZY71bSrofxVop2Nab8fBF8tWv2Y1R6sMg',
 'primary_sale_happened': True,
 'update_authority': b'DYWwMTH4J8Xr7qvpTjiQBjFbAqrDaHvdGqrhriLRrzxz'}
```

ここで、オフチェーンメタデータURLが指定されているので、それを取得します。

```
metadata_uri = metadata['data']['uri']
# https://arweave.net/mk6KmQM8Gb3RQoRV6qVnDqT146lfQX5SJ6fQah0Ba0Q

response = requests.get(metadata_uri)
response_json = response.json()
```

これでオフチェーンメタデータが取得できました。画像までもう一息です。

```
{'_fee_basis_points': 300,
 'attributes': [{'trait_count': 1566,
   'trait_type': 'background',
   'value': 'blue'},
  {'trait_type': 'fans', 'value': ''},
  {'trait_count': 864, 'trait_type': 'body', 'value': 'gold'},
  {'trait_count': 9081, 'trait_type': 'snake type', 'value': 'default'},
  {'trait_type': 'stripes', 'value': ''},
  {'trait_type': 'spots', 'value': ''},
  {'trait_type': 'skin', 'value': ''},
  {'trait_type': 'eyes', 'value': ''},
  {'trait_type': 'glasses', 'value': ''},
  {'trait_type': 'hats', 'value': ''},
  {'trait_type': 'mouth', 'value': ''},
  {'trait_type': 'outfits', 'value': ''}],
 'collection': {'family': 'The Sneks', 'name': 'The Sneks Collection #1'},
 'image': 'https://www.arweave.net/mbI9jCW3JUb6eMMRHqkCBpS_7N-IN4DPzW7x9GkA6Bs?ext=png',
 'name': 'Snek #8311',
 'properties': {'creators': [{'address': 'E1bZ99d56AK9vCFq9Y5nC7ZVz2z8CcxVECsDTyZVksmS',
    'share': 100}],
  'files': [{'type': 'image/png',
    'uri': 'https://www.arweave.net/mbI9jCW3JUb6eMMRHqkCBpS_7N-IN4DPzW7x9GkA6Bs?ext=png'}]},
 'symbol': '',
 'update_authority': 'E1bZ99d56AK9vCFq9Y5nC7ZVz2z8CcxVECsDTyZVksmS'}
```

最後に画像URLを取得します。

```
url = response_json['image']
# https://www.arweave.net/mbI9jCW3JUb6eMMRHqkCBpS_7N-IN4DPzW7x9GkA6Bs?ext=png
```

![solana nft image](https://www.arweave.net/mbI9jCW3JUb6eMMRHqkCBpS_7N-IN4DPzW7x9GkA6Bs?ext=png)

無事 Wallet からNFT画像までたどり着くことができました。

次回は、実際にNFTを作成していく段階に入り、まずは、NFT画像の準備と、Arweaveにオフチェーンメタデータをアップロードするところまでやっていきます。
