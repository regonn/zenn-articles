---
title: "OpenUSD を学んでいく(その1) ファイルフォーマットとPython API 環境構築"
emoji: "🔼"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["openusd", "nvidia", "omniverse"]
published: true
---

前回の記事では、Omniverse の環境を構築し、usdview で OpenUSD を表示できるようにしました。

https://zenn.dev/regonn/articles/open-usd-000

今回は、Python API で OpenUSD ファイルを作成していきます。

# OpenUSD とファイルフォーマット

OpenUSD には、用途に応じて最適化された複数のファイルフォーマットがあります。テキスト（`.usda` など）とバイナリ（`.usdc` など）のどちらを採用するかで、**ロード速度**および**差分の見やすさ**のバランスは大きく変わります。

また、**フォーマットの混在**も可能です。たとえばシーンの骨格だけ `.usda` で人が読みやすく保ち、重いジオメトリやアセット本体は `.usdc` に寄せる、といった運用も可能です。

| フォーマット  | 特性          | 主な用途      |
| ------- | ----------- | --------- |
| `.usda` | テキスト（ASCII） | デバッグ・学習   |
| `.usdc` | バイナリ（Crate） | 本番・大規模データ |
| `.usd`  | 可変（内部形式依存）  | 汎用        |
| `.usdz` | ZIPアーカイブ    | 配布（AR/XR） |

## .usda：人間が読むためのUSD
- テキスト形式
- Git 差分が見やすい
- 手動編集が可能

💡用途の例
- シーン構成の確認
- デバッグ
- 学習

## .usdc：高速処理のためのUSD
- バイナリ形式（Crate）
- メモリマッピングに対応する
- 高速にロードできる

💡用途の例

- 大規模ジオメトリ
- CAD データ
- 本番環境

## .usd：中間的な存在
- ASCII / Binary の両方に対応する
- 内部形式は環境依存

💡基本的には .usda / .usdc を明示的に使う方が安全です

## .usdz：配布専用フォーマット
- ZIP 圧縮
- 読み取り専用
- テクスチャを同梱しやすい

💡用途の例
- AR
- モバイル

# Python 環境構築
前回は Omniverse 上で Python を実行しました。ここからは、ローカル環境でも同じように USD を扱えるよう、環境構築と API を触る際に押さえておきたい用語を整理します。

この記事で使うサンプルコードは、次のリポジトリでも管理しています。

https://github.com/regonn/open_usd_regonn

## 実行に必要な環境

- Python（3.13 系）
  - ※2026年4月時点では、3.14 系では `usd-core` が未対応のため、3.13 系を利用しています
- `usd-core`
  - https://pypi.org/project/usd-core
  - OpenUSD ファイルを Python から扱うためのライブラリ（PyPI で配布）

## 理解に必要な概念

以降のコードでは **Stage**・**Prim**・**Xform** という概念が登場します。その前に、**シーン**と**シーングラフ**だけ押さえておくと、後の用語がつながりやすいです。

### シーン と シーングラフ

**シーン**は、ざっくりいえば「ひとつの 3D 世界のまとまり」を指す言葉です。ジオメトリ・ライト・カメラ・マテリアルなど、**レンダリングやシミュレーションの対象になる要素の集合**をひとかたまりとして考えたものです。

**シーングラフ**は、そのシーンを**親子関係のある木（ツリー）構造**で表したデータです。ルートから枝分かれし、各ノードに座標変換や形状などの情報がぶら下がります。親の移動や回転が子へ伝わるため、部品の組み立てやキャラクタの階層を表すのに向いています。

OpenUSD では、シーングラフ上のノードひとつひとつが **Prim** に相当し、Layer を重ね合わせたあとに**最終的にどう見えるか**をまとめて扱う入れ物が **Stage** です。

### Stage（ステージ）

**シーン全体を表す入れ物**です。複数の **Layer**（`.usda` や `.usdc` などのファイルやメモリ上の層）を重ね合わせた結果として、最終的にどう見えるかを扱うのが Stage です。

- `Usd.Stage.CreateNew(...)` で新規に作ると、ルート用の Layer がひとつ付いた Stage ができます
- `stage.GetRootLayer().Save()` のように、**保存の単位は通常 Layer** で行います

### Prim（プリム）

**シーングラフ上のノード**です。メッシュ・ライト・カメラ・グループ用のノードなど、シーンを構成する要素はすべて Prim として表現されます。

- **パス**（例: `/Root/Sphere`）で一意に識別される。

### Xform（エクストランスフォーム）

座標系（位置・回転・スケール）を表すための Prim の種類（スキーマ）のひとつです。ゲームエンジンでいう「Transform ノード」に近い役割で、子 Prim をまとめたり、階層全体の変換の基点にしたりします。

- デジタルツインやパイプラインでは、ルートを `Xform` にし、その下にジオメトリをぶら下げることが多いです。今回の例でも `/Root` を `UsdGeom.Xform` で定義しています。

### Default Prim（デフォルトプリム）との関係

**他の USD からこのファイルを参照（Reference）したとき、どの Prim を「主役」として読み込むか**を示すのが Default Prim です。`stage.SetDefaultPrim(...)` を設定しておかないと、参照側で意図したルートが選ばれず、コンポジション結果が想定とずれることがあります。サンプルでは `Root` を Default Prim にしています。

## コードを書いて実行

ここまでの用語に対応させると、流れは次のとおりです。

1. **Stage** を新規作成する。
2. ルート用の **Xform** Prim（`/Root`）を定義する。
3. その Prim を **Default Prim** にする。
4. 子として **Sphere** の Prim を追加し、属性（半径・表示色）をセットする。
5. **Root Layer** を保存する。

以下は型注釈付きの Python 例です。IDE の補完や静的解析と相性がよいように、`Usd.Stage` や `UsdGeom.Xform` などを明示しています。

```py
from pxr import Gf, Usd, UsdGeom


def main() -> None:
    # 1. 新しいUSDステージを作成（.usda形式を指定して可読性を確保）
    stage: Usd.Stage = Usd.Stage.CreateNew("./stage.usda")

    # 2. 最初のPrim（プリミティブ）を定義
    # デジタルツイン等の構築では、Xformをルートに置くのが作法です。
    root_xform: UsdGeom.Xform = UsdGeom.Xform.Define(stage, "/Root")

    # 3. デフォルトPrimの設定
    # 他のUSDファイルから参照（Reference）される際、どのPrimを主軸にするかを明示します。
    # これを忘れると、コンポジション時に意図したデータが読み込まれません。
    stage.SetDefaultPrim(root_xform.GetPrim())

    # 4. 球体（ルート配下に定義。ジオメトリは既定Prim設定の後に追加する）
    sphere: UsdGeom.Sphere = UsdGeom.Sphere.Define(stage, "/Root/Sphere")
    sphere.GetRadiusAttr().Set(1.0)
    sphere.GetDisplayColorAttr().Set([Gf.Vec3f(0.35, 0.55, 0.95)])

    # 5. メモリ上の変更をファイルシステムへ書き出し（保存）
    stage.GetRootLayer().Save()

    default_prim: Usd.Prim = stage.GetDefaultPrim()
    print(f"Stage created with Default Prim: {default_prim.GetName()}")


if __name__ == "__main__":
    main()
```

### 生成された usda ファイル

実行すると、次のような `stage.usda` ファイルが生成されます。

```usda
#usda 1.0
(
    defaultPrim = "Root"
)

def Xform "Root"
{
    def Sphere "Sphere"
    {
        color3f[] primvars:displayColor = [(0.35, 0.55, 0.95)]
        double radius = 1
    }
}


```

### usdview で確認

前回の記事で構築した Omniverse の **usdview** で、生成されたシーンの階層と属性を確認できます。Omniverse を起動し、今回の `stage.usda` を開いて、`/Root` とその子の `Sphere` が意図どおりに載っているかを見てみてください。

![](/images/open-usd-001-00.png)

Stage に DefaultPrim が指定された Root が存在し、その子の中に Sphere が存在していることが確認できました。
