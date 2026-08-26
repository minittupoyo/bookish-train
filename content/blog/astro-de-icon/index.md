---
title: "Astroでアイコンを扱う！"
description: "Astroでアイコンを使う方法です。"
date: 2026-04-18T14:46:00.000Z
tags:
    - Astro
    - アイコン
    - Astro Icon
draft: false
---

## Astroでアイコン

Nuxtにはモジュールがあります。

[https://nuxt.com/modules/icon](https://nuxt.com/modules/icon)

これと同じような感覚で使いてぇって話。

## Astro Iconを使う

[https://www.astroicon.dev/](https://www.astroicon.dev/)

これを使います。

### インストール

```shell
bun astro add astro-icon

```

これで勝手に設定までされます。

### アイコンセットのインストール

iconifyにあるものを使えます。 アイコン数と見た目を取って私はTablerを使っています。

[https://tabler.io/icons](https://tabler.io/icons)

```shell
bun add @iconify-json/tabler

```

でインストールできます。

### 使う

```astro
---
import { Icon } from "astro-icon/components";
---

<Icon name="tabler:brand-android" />
```

これでAndroidのロゴが表示されます。

## アイコンを探す

[https://tabler.io/icons](https://tabler.io/icons)

から探します。

![](https://pub-144d74b17528424c9155230d18db7545.r2.dev/uploads/1776524509823-siciti.png)

小文字の一番目立つやつ(赤枠で囲ってるところ)をクリックします。

nameのところに`tabler:コピーした名前` とします。

## 終わり

以上です。このブログでも使っていますよ、この方法。
