---
title: "Astroにリンクカードを追加する"
description: "remark-link-card-plusを使います。"
date: 2026-04-19T00:20:00.000Z
tags:
    - Astro
    - リンクカード
    - Markdown
draft: false
---

## リンクカード

[https://astro.build/](https://astro.build/)

[https://nuxt.com/](https://nuxt.com/)

これです。リンクカード。

## remark-link-card-plusを使う

[https://github.com/okaryo/remark-link-card-plus](https://github.com/okaryo/remark-link-card-plus)

このプラグインを使用します。

### インストール

以降はパッケージ管理にbunを使用します。

```shell
bun install remark-link-card-plus
```

### 設定

astro.config.mjsに追加します。

```js
import remarkLinkCard from "remark-link-card-plus";

export default defineConfig({
    markdown: {
        remarkPlugins: [
            [
                remarkLinkCard,
                {
                    cache: true,
                    shortenUrl: true,
                    thumbnailPosition: "right",
                    noThumbnail: false,
                    noFavicon: false,
                },
            ],
        ],
    },
});
```

こんな感じです。

### スタイルを当てる

tailwindcssを使用している前提です。

`global.css` に追記します。

```css
@layer components {
    .remark-link-card-plus__container {
        @apply my-8 block;
        img {
            @apply m-0!;
        }
    }
    .remark-link-card-plus__container a.remark-link-card-plus__card {
        @apply flex h-auto flex-col-reverse overflow-hidden rounded-lg border border-solid border-slate-200 bg-white font-normal text-inherit transition-all duration-200 sm:h-[126px] sm:flex-row;
        text-decoration: none !important;
    }

    .remark-link-card-plus__main {
        @apply flex min-w-0 flex-1 flex-col justify-between p-4;
    }

    .remark-link-card-plus__content {
        @apply flex flex-col;
    }

    .remark-link-card-plus__title {
        @apply mt-0 mb-1 line-clamp-1 text-sm leading-tight font-bold text-slate-900 sm:text-base;
    }

    .remark-link-card-plus__description {
        @apply m-0 line-clamp-2 text-xs leading-snug text-slate-500 sm:text-sm;
    }

    .remark-link-card-plus__meta {
        @apply mt-2 flex items-center gap-2;
    }

    .remark-link-card-plus__favicon {
        @apply h-4! w-4! object-contain;
    }

    .remark-link-card-plus__url {
        @apply m-0 truncate text-xs text-slate-400;
    }

    .remark-link-card-plus__thumbnail {
        @apply block w-full shrink-0 border-b border-solid border-slate-200 sm:w-[240px] sm:border-b-0 sm:border-l;
    }

    .remark-link-card-plus__image {
        @apply aspect-[1.91/1] h-full w-full object-cover sm:aspect-auto;
    }
}
```

これで私のブログと同じデザインになります。最低限見栄えがいいくらいのスタイリングなので、適当に変更してください。

### キャッシュフォルダの除外設定

高速化のためにキャッシュを有効にしましたが、別にGitHubに置く必要がないため、`.gitignore`に追加します。

```
public/remark-link-card-plus
```

こんな感じでね。

## おわり

以上です。キャッシュを有効にすることで、画像がオリジンから配信されるようになるため、おすすめの設定です。

それでは！
