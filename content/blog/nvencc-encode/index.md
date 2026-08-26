---
title: "nvenccで動画エンコード！"
description: "主にアニメです。"
date: 2026-05-11T20:06:00.000Z
tags:
    - エンコード
    - 動画
    - NVEncC
draft: false
---

## 動画エンコード

動画エンコードになにを使っていますか？ffmpeg？

私はNVEncCです。

[https://github.com/rigaya/NVEnc](https://github.com/rigaya/NVEnc)

この記事では主にアニメをいい感じに軽く、高画質のままエンコードする方法を紹介します。

## 基本コマンド

さて基本のコマンドです。基本といってもガチの最小構成ではないです。

```shell
nvencc --avhw -i "input.mkv" -c av1 --audio-codec libmp3lame --audio-bitrate 192 -o "output.mp4"
```

動画のコーデックをAV1に、音声をmp3でエンコードするコマンドです。最小構成です。

## 私が使っているコマンド

```shell
nvencc --avhw -i "input.mkv" -c av1 --preset P7 --tune hq --output-depth 10 --vbr 0 --vbr-quality 28 --max-bitrate 3000 --aq --aq-temporal --bref-mode each --lookahead 32 --audio-codec libmp3lame --audio-bitrate 192 -o "output.mp4"
```

こんな感じです。各オプションの説明。

- `--preset P7`\
  プリセット。P7は品質最優先。
- `--tune hq`\
  チューニングオプション。
- `--output-depth 10`\
  ビット深度を10にする。グラデーションなどを滑らかにする。
- `--vbr 0 --vbr-quality 28`\
  固定品質によるエンコード。28を目標品質にビットレートを割り振りする。\
  qualityの方は小さければ高画質高ファイルサイズ、大きければ低画質低ファイルサイズ。
- `--max-bitrate 3000`\
  最大ビットレートを3000kbpsにする。経験上このくらいで収まることが多い。
- `--aq --aq-temporal`\
  適応的量子化を有効にするやつ。
- `--bref-mode each`\
  全てのBフレームを参照フレームとして利用する。
- `--lookahead 32`\
  先読みするフレーム数の設定。若干速度が落ちるが品質が向上する。

だいたいこんな感じのオプションを有効にしています。割とシンプル。

## ファイルサイズ

元データが大体1.45GBでモノにもよるけど大体300MB\~350MBになります。

軽くなるね。

## 画質

```
ssim/psnr/vmaf/vship: VMAF Score 96.783072
```

ということ。VMAFのスコアだけ見ると見た目上の劣化はない程度。\
目で見ても何も気にならない。

## 以上

最後雑にしてごめんね。

あとでVMAF結果とかを載っけとくから。
