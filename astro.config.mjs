// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import react from "@astrojs/react";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";
import expressiveCode from "astro-expressive-code";
import { satteriBreaks } from "@minittupoyo/satteri-breaks";
import satteriLinkCard from "@minittupoyo/satteri-link-card";
import satteriCallout from "@minittupoyo/satteri-callout";
import { satteri } from "@astrojs/markdown-satteri";

// https://astro.build/config
export default defineConfig({
    integrations: [icon(), react(), markdoc(), ...(import.meta.env.PROD ? [] : [keystatic()]), expressiveCode()],
    vite: {
        plugins: [tailwindcss()],
    },
    markdown: {
        processor: satteri({
            mdastPlugins: [satteriBreaks, satteriLinkCard, satteriCallout],
        }),
    },
});
