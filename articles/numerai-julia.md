---
title: "Julia言語 で Numerai のサンプルコード(事情によりLegacy)"
emoji: "❤"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Julia", "Numerai"]
published: true
---

[Numerai Advent Calendar 2021](https://adventar.org/calendars/6226) の 13 日目の記事です。

普段データサイエンス系のコードを触る時は、Python で書いていますが、定期的に新しいものにも触れていきたいので、Julia 言語で Numerai を触ってみました。
先に結論を言いますと、自分が所有している PC のメモリが 48GB と 32GB で現状の Numerai Tournament のデータだとメモリが足りずにクラッシュしたりして、Legacy のデータでなんとかできた状態です。
オススメの環境としては、[katsu さんの記事](https://zenn.dev/katsu1110/articles/a2901258c5c550)のように、Colab Pro+を使うのが無難ですね。Colab でも Julia 構築できるみたいですが、いちいちインスタンス立ち上げる毎に Julia をインストールしないといけないので、とりあえずローカルでできる範囲で最低限の Numerai へサブミットできるところまで行いました。

Julia は LST バージョンの 1.6.4 です。
データは Numerai Tournament(Legacy)

## 利用するライブラリ

今回はデータを読み込んで、機械学習をするだけなので利用するライブラリも最低限です。Julia でサクッと機械学習をしたい場合であれば [MLJ](https://alan-turing-institute.github.io/MLJ.jl/dev/) を利用すれば事足ります。もし、ディープラーニングしたい場合は [Flux.jl](https://github.com/FluxML/Flux.jl) あたりを使うと思います。

```julia
using DataFrames
using CSV
using MLJ
```

## データ読み込み&事前処理

学習用データを読み込んで、データの前処理を行います。Numerai Tournament の場合は欠損値等もないので、そのまま使えるのが良いですね。

```julia
training_data = DataFrame(CSV.File("numerai_training_data.csv"))
features = filter(name -> startswith(name, "feature_"), names(training_data))
X = training_data[:, features]
y = training_data[:, "target"]

# 評価用のテストデータも作っておく
train, test = partition(eachindex(y), 0.8)
```

## モデル生成

MLJ を利用するメリットの一つに、特徴量とターゲットの型から、MLJ で対応しているモデル一覧を表示してくれます。今回は、特徴量もターゲットも Float 型なので、それに合ったモデルが一覧で出てきます。

```julia
models(matching(X, y))
```

59 個のモデル候補が出てきました。

```
59-element
 (name = ARDRegressor, package_name = ScikitLearn, ... )
 (name = AdaBoostRegressor, package_name = ScikitLearn, ... )
 (name = BaggingRegressor, package_name = ScikitLearn, ... )
 (name = BayesianRidgeRegressor, package_name = ScikitLearn, ... )
 (name = ConstantRegressor, package_name = MLJModels, ... )
 (name = DecisionTreeRegressor, package_name = BetaML, ... )
 (name = DecisionTreeRegressor, package_name = DecisionTree, ... )
 ⋮
 (name = SVMRegressor, package_name = ScikitLearn, ... )
 (name = TheilSenRegressor, package_name = ScikitLearn, ... )
 (name = XGBoostRegressor, package_name = XGBoost, ... )
```

MLJ は ScikitLearn も対応しているので、何かしら出てくると思います。今回はサンプルコードと一緒で XGBoostRegressor を利用していきます。

```julia
model = @load XGBoostRegressor pkg=XGBoost
bst = model()
```

トレーニング結果等を保持できるように、machine というものでモデルを Wrap します。

```julia
mach = machine(bst, X, y)
```

## 学習

モデルをトレーニング用データで学習していきます。

```julia
fit!(mach, rows=train)
```

```
[1]	train-rmse:0.223071
[2]	train-rmse:0.222898
[3]	train-rmse:0.222750
…
[99] train-rmse:0.213784
[100] train-rmse:0.213708
```

rmse が減っているので、過学習なのかはともかく、学習はできていそうですね。分けておいたテストデータを予測して評価をしてみます。

```julia
yhat = predict(mach, X[test,:])
rmse(y[test], yhat)
```

```
0.2249687237690127
```

ハイパーパラメータ等はデフォルトのままなので、精度を上げたい場合はそこらへんをいじってみてください。

## 提出用データ生成

numerai への提出用にトーナメントデータを読み込んで、提出用データを生成していきます。

```julia
tournament_data = DataFrame(CSV.File("numerai_tournament_data.csv"))
tournament_X = tournament_data[:, features]
predicted = predict(mach, tournament_X)
submit = DataFrame(tournament_data[:, ["id"]])
submit[!, "prediction"] = predicted
```

最後に CSV を出力して一通り終わりです。

```julia
submit |> CSV.write("julia_numerai.csv", writeheader=true)
```

example_predictions.csv のように

```csv
id,prediction
n0003aa52cab36c2,0.4356964
n000920ed083903f,0.501367
```

みたいな形式で出力されていれば、Numerai に提出できます。

## 所感

最初にも書きましたが、Numerai のデータ自体が全体的に大きめになってきたので、ローカルでやる場合には、色々と工夫が必要そうです。

もし、新しいデータに対応する場合でも、

```julia
using JSON
using Parquet, DataFrames

ERA_COL = "era"
TARGET_COL = "target_nomi_20"
DATA_TYPE_COL = "data_type"
EXAMPLE_PREDS_COL = "example_preds"

feature_metadata = JSON.parsefile("features.json")
feature_names = feature_metadata["feature_sets"]["small"]
read_columns = vcat(feature_names, [ERA_COL, DATA_TYPE_COL, TARGET_COL])
training_data = DataFrame(read_parquet("numerai_training_data.parquet"))
```

のようにすればデータの読み込みができるはずですが、最後の読み込みの行でメモリが足りずにクラッシュしてしまいましたので、parquet の前処理などができるのであれば対応できるかもです。

Julia の記事や情報自体も少ないので、もう少し踏み込んでコードを書いて、実際に Numerai で stake できるくらいのところまでやっていこうかなと思います。(データの制限が無い Signals に移るかもしれませんが)
