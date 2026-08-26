import { config, fields, collection } from "@keystatic/core";
import { v4 as uuidv4 } from "uuid";

export default config({
    storage: {
        kind: "local",
    },
    collections: {
        blog: collection({
            label: "ブログ記事",
            slugField: "title",
            path: "content/blog/**/",
            format: { contentField: "content" },
            entryLayout: "content",
            columns: ["title", "date"],
            schema: {
                title: fields.slug({ name: { label: "タイトル" } }),
                description: fields.text({ label: "説明", multiline: false }),
                date: fields.datetime({ label: "公開日", defaultValue: { kind: "now" } }),
                tags: fields.array(fields.text({ label: "タグ" }), {
                    label: "タグ一覧",
                    itemLabel: (props) => props.value,
                }),
                draft: fields.checkbox({ label: "下書き", defaultValue: false }),
                content: fields.mdx({
                    label: "本文",
                    extension: "md",
                    options: {
                        image: {
                            directory: "content/assets/images/blog",
                            publicPath: "../../assets/images/blog/",
                            transformFilename(originalFilename) {
                                return `${uuidv4()}-${originalFilename}`;
                            },
                        },
                    },
                }),
            },
        }),
    },
});
