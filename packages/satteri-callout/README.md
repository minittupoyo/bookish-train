# @minittupoyo/satteri-callout

[Satteri](https://docs.astro.build) 用のコールアウトプラグイン。GitHub 形式の `> [!NOTE]` ブロックを、Tabler Icons（base64 埋め込み）付きのスタイル付きコールアウトに変換します。

アイコンは Tabler Icons (MIT) の SVG を base64 エンコードしてバンドルに埋め込んでいるため、追加のリクエストやフォント不要で動作します。

## 使い方

```js
// astro.config.mjs
import { satteri } from "@astrojs/markdown-satteri";
import satteriCallout from "@minittupoyo/satteri-callout";

export default defineConfig({
    markdown: {
        processor: satteri({
            mdastPlugins: [satteriCallout],
        }),
    },
});
```

```md
> [!NOTE]
> 注記テキスト

> [!WARNING] カスタムタイトル
> タイトル付きの警告
```

## 対応タイプ

| マーカー       | エイリアス                        | アイコン       | 色     |
| -------------- | --------------------------------- | -------------- | ------ |
| `[!NOTE]`      | `[!INFO]`                         | info-circle    | 青     |
| `[!TIP]`       | `[!HINT]` `[!SUCCESS]` `[!CHECK]` | bulb           | 緑     |
| `[!IMPORTANT]` | —                                 | flag           | 紫     |
| `[!WARNING]`   | `[!ATTENTION]`                    | alert-triangle | 黄     |
| `[!CAUTION]`   | `[!DANGER]` `[!ERROR]`            | alert-octagon  | 赤     |
| `[!QUESTION]`  | `[!HELP]`                         | help-circle    | 青     |
| `[!EXAMPLE]`   | —                                 | code           | 紫     |
| `[!QUOTE]`     | —                                 | quote          | グレー |

マーカー直後にタイトルを書けます（例: `> [!TIP] コツ`）。GitHub と同じく折りたたみ記号 `+` / `-` も解析時に受け付けます（折りたたみ動作は行いません）。

## スタイル

出力される HTML:

```html
<div class="callout callout--note">
    <p class="callout__title">
        <img class="callout__icon" src="data:image/svg+xml;base64,..." alt="" width="18" height="18" />
        <span>Note</span>
    </p>
    <p>注記テキスト</p>
</div>
```

アクセントカラーは CSS 変数 `--callout-accent` で制御されます。グローバル CSS に以下を追加してください:

```css
@layer components {
    .callout {
        --callout-accent: var(--color-zinc-500);
        margin-block: 1.5em;
        padding: 0.875rem 1rem;
        border: 1px solid color-mix(in oklab, var(--callout-accent) 30%, white);
        border-radius: 1rem;
        background-color: color-mix(in oklab, var(--callout-accent) 6%, white);
    }

    .callout--note {
        --callout-accent: #0969da;
    }
    .callout--tip {
        --callout-accent: #1a7f37;
    }
    .callout--important,
    .callout--example {
        --callout-accent: #8250df;
    }
    .callout--warning {
        --callout-accent: #9a6700;
    }
    .callout--caution {
        --callout-accent: #cf222e;
    }
    .callout--question {
        --callout-accent: #0969da;
    }
    .callout--quote {
        --callout-accent: #57606a;
    }

    .callout__title {
        display: flex;
        gap: 0.375rem;
        align-items: center;
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--callout-accent);
    }

    .callout__icon {
        width: 18px;
        height: 18px;
        flex: none;
    }

    .callout > :first-child {
        margin-top: 0;
    }
    .callout > :last-child {
        margin-bottom: 0;
    }
}
```

## カスタムタイプ

```js
satteriCallout({
    types: {
        // 既存アイコンの再着色・改名
        note: { color: "#0ea5e9", label: "メモ" },
        // 別タイプへのエイリアス
        warn: { aliasOf: "warning", label: "注意" },
        // 独自 SVG（Tabler 形式、currentColor が color で着色される）
        pin: {
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">…</svg>',
            label: "ピン留め",
        },
    },
});
```

## ライセンス

MIT
