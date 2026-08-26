---
title: "Nuxt初学者が1日くらいでブログを作った話"
description: "このブログを作った時のログ(じゃない)"
date: 2026-04-21T19:38:00.000Z
tags:
    - Nuxt
    - 開発
    - ブログ
draft: false
---

## ガチNuxt初学者

ブログを作ろうと思い立つまで触ったことがなかったフレームワーク`nuxt`。
思い立ったが吉日…。いや凶日です。一気にこのブログを構築しました。

そのログです。

## 結論:ドキュメントを読みまくる

[https://nuxt.com/docs/4.x/getting-started/introduction](https://nuxt.com/docs/4.x/getting-started/introduction)

[https://content.nuxt.com/docs/getting-started](https://content.nuxt.com/docs/getting-started)

[https://ui.nuxt.com/docs/getting-started](https://ui.nuxt.com/docs/getting-started)

ドキュメントを読みまくります。とにかく。
使用したスタックのドキュメントを読み漁りなんとか作る。そんな感じです。

## Nuxt Content

Nuxt Contentを使っています。楽なので。

### 記事一覧ページ

記事一覧ページの実装です。

```vue
<script setup lang="ts">
import type { ButtonProps, BreadcrumbItem } from "@nuxt/ui";
const { data: posts } = await useAsyncData(() => {
    let query = queryCollection("blog");
    if (import.meta.env.PROD) {
        query.where("draft", "<>", true);
    }
    return query.order("date", "DESC").all();
});

useSeoMeta({
    title: `ブログ | minittu`,
    description: "投稿されている記事",
});

const breadcrumb = ref<BreadcrumbItem[]>([
    {
        label: "Home",
        icon: "i-tabler-home",
        to: "/",
    },
    {
        label: "Blog",
        icon: "i-tabler-book",
        to: "/blog",
    },
]);
</script>

<template>
    <UContainer>
        <UPage>
            <UPageHeader title="Blog" description="記事一覧">
                <template #headline>
                    <UBreadcrumb :items="breadcrumb" class="mb-4" />
                </template>
                <p v-if="posts" class="text-muted flex flex-row items-center gap-1">{{ posts.length }} 件の記事があります</p>
            </UPageHeader>
            <UPageBody>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <a
                        v-for="post in posts"
                        :href="post.path"
                        class="border-muted group hover:border-primary flex flex-row items-center justify-start gap-4 rounded-md border p-4 transition-all duration-150"
                    >
                        <div class="flex h-12 w-12 items-center justify-center text-2xl">
                            {{ post.emoji }}
                        </div>
                        <div class="flex shrink flex-col items-start">
                            <p class="text-dimmed text-sm">
                                {{
                                    new Date(post.date).toLocaleDateString("ja-jp", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                    })
                                }}
                            </p>
                            <h2 class="line-clamp-2 text-xl font-bold">{{ post.title }}</h2>
                            <p class="text-muted line-clamp-1 text-base">{{ post.description }}</p>
                        </div>
                    </a>
                </div>
            </UPageBody>
        </UPage>
    </UContainer>
</template>
```

postsにblogコレクションの記事を入れます。開発環境時は下書きの記事を表示、本番環境では下書きの記事は非表示になるようにしています。

### 記事ページ

記事ページの実装です。

```vue
<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";

const route = useRoute();

const { data: post } = await useAsyncData(route.path, () => {
    let query = queryCollection("blog");
    if (import.meta.env.PROD) {
        query.where("draft", "<>", true);
    }
    return query.path(route.path).first();
});

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
    let query = queryCollectionItemSurroundings("blog", route.path, {
        fields: ["title", "description", "date"],
    });
    if (import.meta.env.PROD) {
        query.where("draft", "<>", true);
    }
    return query;
});

defineOgImage("BlogOg.satori", { title: post.value?.title, description: post.value?.description });

useSeoMeta({
    title: `${post.value?.title} | minittu`,
    description: post.value?.description,
});

const breadcrumb = ref<BreadcrumbItem[]>([
    {
        label: "Home",
        icon: "i-tabler-home",
        to: "/",
    },
    {
        label: "Blog",
        icon: "i-tabler-book",
        to: "/blog",
    },
    {
        label: post.value?.title,
        icon: "i-tabler-article",
        to: route.path,
    },
]);
</script>

<template>
    <UContainer>
        <UPage v-if="post">
            <UPageHeader :title="post?.title" :description="post?.description">
                <template #headline>
                    <UBreadcrumb :items="breadcrumb" class="mb-4" />
                </template>
                <p v-if="post" class="text-muted flex flex-row items-center gap-1">
                    <Icon name="tabler:calendar-week" />{{ new Date(post?.date).toLocaleDateString("ja-jp") }}
                </p>
            </UPageHeader>
            <UPageBody>
                <ContentRenderer v-if="post" :value="post" />
                <USeparator v-if="surround?.filter(Boolean).length" />
                <UContentSurround :surround="surround as any" />
            </UPageBody>
            <template #right>
                <UPageAside>
                    <UContentToc
                        highlight
                        highlight-color="primary"
                        highlight-variant="circuit"
                        v-if="post"
                        :links="post.body.toc?.links"
                    />
                </UPageAside>
            </template>
        </UPage>
    </UContainer>
</template>
```

これは何の変哲もなく、記事を`route.path`から取得して、表示するだけです。

## Nuxt UI

スタイリング…っていうのかな。UIの構築にはNuxt UIを使用しています。
まぁまぁ学習コストが高かった気がしますが、なんとかここまで形にできました。

## その他

### 画像最適化

`@nuxt/image`を使用して画像を最適化しています。
`public`内の画像を最適化するため、記事にはっつけてる画像はほぼ最適化されています。

### OGの生成

`nuxt-og-image`を使用してOG画像を生成しています。
生成には`satori`を使用しています。

## AI使ったんでしょ？？

**コーディングエージェントは使用していません！**

わからないところをAIに聞いたりしましたがAntigravityなどのエディタや、コーディングエージェントを使用していません。
全部自分でコードを書いて実装しています。

証明のしようがないですけどね。

追記(2026年4月23日)：タグ関係のページにAntigravityを使用しました

## おわり

以上になります！このAI時代にエージェントを使わずに実装できたのは俺えらいなぁって思います。

1日で作れたのが不思議ですよね。過集中ぱわ～～～！
