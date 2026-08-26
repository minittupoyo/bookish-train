---
title: Astroでブログを作り直した
description: Astroでブログを作り直したよ。
date: 2026-07-15
tags:
    - Astro
    - Astro v7
    - ブログ
    - AI
draft: false
---

## 変わりまくるスタック

私のブログのスタックは安定していません。\
Nuxtを使ったりAstroを使ったり、右往左往していました。

ちょっと前まではNuxtでしたが、やはりビルド時間が長いし開発も重いです。

ってことでAstroに引っ越した…といより戻ってきたという感じです。

## Astro v7への移行

Astroのメジャーバージョンがv6からv7になっていました。

個人的にこのアップデートでの最大の変更点は**Markdownプロセッサの変更**です。

これまではremarkでしたが、v7からはデフォルトでSätteriに変わりました。

SätteriはRustで書かれた高速なプロセッサですが、比較的新しいということもありremarkのような多様なプラグインが存在しません。

この点については

[https://blog.minittu.net/posts/satteri-plugins/](https://blog.minittu.net/posts/satteri-plugins/)

この記事を読んでほしいです。

## プラグインの移植

先程挙げた記事の内容と被りますが、書いておきます。

先ほども書いた通りremarkのプラグインは使えませんので、Sätteri用にプラグインを書かなきゃいけません。\
作るというよりは移植という言葉が近いですが。

移植するにあたり、私はコードを書いていません。

はい、コーディングエージェントです。プラグインについてはCodeXを使用しました。

ドキュメントのURLと移植元のURLを渡して作らせました。

移植したものは

- **remark-breaks**\
  行末にスペース2つ入れなくても改行できるようにするやつ
- **remark-link-card-plus**\
  リンクカード

になります。

コードなどはリポジトリにあります。

[https://github.com/minittupoyo/minittu/tree/master/src/lib](https://github.com/minittupoyo/minittu/tree/master/src/lib)

## 99%AI生成

プラグインもそうですが、このブログの99%はAIが書いています。\
私が書いた部分はほんの1%、もしかしたら1%もないかもしれません。

使用したコーディングエージェントは**Antigravity CLI**と**CodeX**です。

プラグインはCodeX、それ以外はAntigravity CLIです。

コード量なども大したことないため、ChatGPT Plus, Google AI Proの範疇で収まっています。

私は成果物を確認してやいのやいの言うだけの人間に成り下がっていました。ﾊﾊﾊ

## 最後に

内容のない記事です。申し訳ない。

AIをフルで活用して作りました。\
まだまだAIの使い方に慣れていないので、作りたいものをアウトプットする能力を伸ばしていきたいですね。

それでは👋
