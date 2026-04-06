---
title: "OpenUSD を学んでいく(その0) Omniverse で表示環境構築"
emoji: "🔼"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["usd", "openusd", "nvidia", "omniverse"]
published: true
---

NVIDIAが最近推している OpenUSD を勉強していこうと思います。

NVIDIA が公式で資格だったり、教材を扱っているので、それを見ながらやっていきます。

https://www.nvidia.com/en-us/learn/certification/openusd-development-professional/

https://github.com/NVIDIA-Omniverse/LearnOpenUSD

## この記事でやること

最初に、OpenUSD を触っていくにあたって、実際にPython API だったりで触れる環境を作っていきたいので、Omniverse を構築していきます。

私の環境は Windows で RTX のGPUを積んでいます。

以前は Omniverse は専用 Launcher がありましたが、2025年に非推奨になりました。
そのため、直接 kit app template の git から clone をしてきてインストールします。

https://github.com/NVIDIA-Omniverse/kit-app-template

この記事を書いているときの最新は v110.0.0 でした。

## Omniverse 環境構築

```bash
git clone https://github.com/NVIDIA-Omniverse/kit-app-template.git
cd kit-app-template
```

Windows だと `bat` ファイルが用意されているので、それを実行して、最初のテンプレートを作ります。

```bat
.\repo.bat template new
```

色々と聞かれるので回答していきます。

```text
? Select what you want to create with arrow keys ↑↓: Application

? Select desired template with arrow keys ↑↓: Kit Base Editor

? Enter name of application .kit file [name-spaced, lowercase, alphanumeric]: [set application name]

? Enter application_display_name: [set application display name]

? Enter version: [set application version]

Application [application name] created successfully in [path to project]/source/apps/[application name]

? Do you want to add application layers? No
```

今度は build します。

```bat
.\repo.bat build
```

ビルドに成功すれば完了です。

```text
BUILD (RELEASE) SUCCEEDED (Took XX.XX seconds)
```

アプリを立ち上げます。

```bat
.\repo.bat launch
```

![](/images/open-usd-000-00.png)

## Python で Cube を作る

アプリが立ち上がったら、まずは基本的な Python コードでオブジェクトを作ってみます。

メニューの Developer > Script Editor を開いて Python コードを実行できるようにします。

![](/images/open-usd-000-01.png)

次のコードを入力して実行します。

```python
from pxr import UsdGeom
import omni.usd

# 現在のステージ取得
stage = omni.usd.get_context().get_stage()

# Cube作成
cube = UsdGeom.Cube.Define(stage, "/World/Cube")

# サイズ変更
cube.GetSizeAttr().Set(300)

# 位置変更
cube.AddTranslateOp().Set((0, 0, 0))
```

実行すると、画面上に半分地面に埋まったキューブが生成されます。
画面右側の Stage タブの World の中に `Cube` が存在していると思います。

![](/images/open-usd-000-02.png)

## Cube を USDA 形式で保存する

作った Cube を usda(テキスト形式) にして出力してみます。

Stage タブ上の Cube を右クリックして、`Save Selected` を選択します。

![](/images/open-usd-000-03.png)

保存場所と名前を決めて、`usda` を選択して保存します。

![](/images/open-usd-000-04.png)

保存したファイルをエディタで開くと次のようなテキストを確認できます。

```usda
#usda 1.0
(
    defaultPrim = "Root"
    upAxis = "Y"
)

def Xform "Root"
{
    def Cube "Cube"
    {
        double size = 300
        token ui:displayGroup = "Material Graphs"
        token ui:displayName = "Cube"
        int ui:order = 1024
        float3 xformOp:rotateXYZ = (0, -0, 0)
        float3 xformOp:scale = (1, 1, 1)
        double3 xformOp:translate = (0, 0, 0)
        uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:rotateXYZ", "xformOp:scale"]
    }
}
```

## まとめ

基本的な USD の中身まで確認できました。
今回はここまでにして次回から、実際に構造の中身を確認していけたらと思います。
