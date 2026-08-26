---
title: "このブログで使っているSatteriプラグインをnpmに公開した"
description: "Astro v7のSatteri向けに作ったリンクカードと改行プラグインを、npmパッケージとして公開した話。"
date: 2026-07-15T11:00:00.000Z
tags:
    - Satteri
    - Astro
    - npm
    - Markdown
    - リンクカード
draft: false
---

## npmに公開した

このブログで使っているSatteri向けのMarkdownプラグインを、npmに公開しました。

公開したのはこの2つです。

[https://www.npmjs.com/package/@minittupoyo/satteri-link-card](https://www.npmjs.com/package/@minittupoyo/satteri-link-card)

[https://www.npmjs.com/package/@minittupoyo/satteri-breaks](https://www.npmjs.com/package/@minittupoyo/satteri-breaks)

どちらもバージョンは`1.0.0`です。
2026年7月15日に公開しました。

もともとはこのブログの`src/lib`に置いていた自作プラグインです。
Astro v7でMarkdownプロセッサがSatteriになったので、今まで使っていたremark系プラグインの代わりとして作りました。

しばらくブログ内だけで使っていましたが、せっかくなのでnpmから入れられる形にしました。

## 作ったもの

`@minittupoyo/satteri-breaks`は、`remark-breaks`相当のプラグインです。
Markdown本文中の普通の改行を`<br>`として扱います。

ブログを書くときに、行末スペースや`<br>`を毎回書くのはだるいので、これはかなり大事です。

`@minittupoyo/satteri-link-card`は、単独行のリンクをリンクカードにするプラグインです。
`remark-link-card-plus`に近い使い心地を目指しています。

URLだけの行や、単独行のMarkdownリンクを見つけて、OGPを取得してカード化します。

```md
[https://astro.build/](https://astro.build/)
```

こんな感じのリンクを置くと、タイトル、説明、サムネイル、favicon付きのカードになります。

## インストール

使う場合はこんな感じです。

```shell
bun add @minittupoyo/satteri-link-card @minittupoyo/satteri-breaks satteri
```

npmならこうです。

```shell
npm install @minittupoyo/satteri-link-card @minittupoyo/satteri-breaks satteri
```

`satteri`はpeer dependencyです。
Astroで使う場合は`@astrojs/markdown-satteri`側から入っていることもありますが、明示しておくほうが分かりやすいと思います。

## Astroで使う

Astroでは`astro.config.mjs`に登録します。

```js
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { createSatteriLinkCardPlus } from "@minittupoyo/satteri-link-card";
import { satteriBreaks } from "@minittupoyo/satteri-breaks";

export default defineConfig({
    markdown: {
        processor: satteri({
            mdastPlugins: [satteriBreaks, createSatteriLinkCardPlus({ cache: true })],
        }),
    },
});
```

これでMarkdown変換時に、改行処理とリンクカード生成が入ります。

`cache: true`にすると、リンクカード用のOGPメタデータや画像をローカルに保存します。
リンクカードはビルド時に外部サイトへアクセスするので、キャッシュは有効にしておくのがおすすめです。

## リンクカード側でやっていること

`@minittupoyo/satteri-link-card`は、だいたいこのあたりをやっています。

- 単独行のリンクだけをカード化する
- OGPとTwitter Cardのメタデータを取得する
- サムネイル画像とfaviconを扱う
- metadataと画像をキャッシュする
- 取得に失敗してもフォールバックのカードを出す
- `[]()`形式のリンクにも対応する

OGP取得には`open-graph-scraper`を使っています。
自前でHTMLを読んでmetaタグを拾うこともできますが、相対URLの画像、Twitter Card、faviconまわりまで考えると地味に面倒です。

ここはライブラリに任せたほうが安定します。

## breaks側はかなり小さい

`@minittupoyo/satteri-breaks`はかなり小さいプラグインです。

やっていることは、mdastのtext node内にある改行をhard breakに変換するだけです。

```js
import { markdownToHtml } from "satteri";
import { satteriBreaks } from "@minittupoyo/satteri-breaks";

const { html } = markdownToHtml("hello\nworld", {
    mdastPlugins: [satteriBreaks],
});
```

ただ、ブログを書く感覚にはけっこう効きます。
文章を書いたときの見た目が、Markdownの細かい作法に引っ張られにくくなります。

## ブログ内実装からパッケージへ

最初は完全にこのブログ専用でした。

`src/lib/satteri-remark-breaks.js`と`src/lib/satteri-link-card-plus.js`に置いて、`astro.config.mjs`から直接importしていました。

でも、Satteri向けの小さなプラグインはまだ多くなさそうです。
自分と同じように、Astro v7へ上げたあとでremark系プラグインの置き換えに困る人もいるかもしれません。

なので、npmに置いておけば再利用しやすいかなと思って公開しました。

## おわり

このブログで使っているSatteri向けプラグインをnpmに公開しました。

- `@minittupoyo/satteri-link-card`
- `@minittupoyo/satteri-breaks`

Astro v7でSatteriを使いつつ、普通の改行とリンクカードがほしい場合に使えます。

まだ作ったばかりなので、細かいところは今後直すかもしれません。
とりあえず、このブログで実際に使っているものを外から入れられる形にできました。
