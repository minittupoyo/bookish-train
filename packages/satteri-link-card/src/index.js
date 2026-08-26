import { defineMdastPlugin } from "satteri";

const cache = new Map();

const ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

function decodeHtml(value) {
    return String(value)
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'");
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function extractStandaloneUrl(node) {
    const children = node.children ?? [];
    if (children.length !== 1) return undefined;
    const child = children[0];
    if (child.type === "text") {
        const value = child.value.trim();
        return /^https?:\/\/\S+$/.test(value) && isHttpUrl(value) ? value : undefined;
    }
    if (child.type === "link" && isHttpUrl(child.url)) {
        const label = (child.children ?? [])
            .map((c) => c.value ?? "")
            .join("")
            .trim();
        if (label === "" || label === child.url || label === `<${child.url}>`) {
            return child.url;
        }
    }
    return undefined;
}

function findMetaContent(html, keys) {
    for (const key of keys) {
        for (const attr of ["property", "name"]) {
            for (const aq of ['"', "'"]) {
                for (const cq of ['"', "'"]) {
                    const forward = new RegExp(`<meta[^>]+${attr}=${aq}${key}${aq}[^>]*content=${cq}([^${cq}]*)${cq}`, "i");
                    const reverse = new RegExp(`<meta[^>]+content=${cq}([^${cq}]*)${cq}[^>]*${attr}=${aq}${key}${aq}`, "i");
                    const match = html.match(forward) ?? html.match(reverse);
                    if (match?.[1]) return decodeHtml(match[1].trim());
                }
            }
        }
    }
    return undefined;
}

function parseCardData(html, baseUrl) {
    const title =
        findMetaContent(html, ["og:title", "twitter:title"]) ?? decodeHtml(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "");
    const description = findMetaContent(html, ["og:description", "twitter:description", "description"]);
    const siteName = findMetaContent(html, ["og:site_name"]);
    const rawImage = findMetaContent(html, ["og:image", "og:image:url", "twitter:image"]);
    let image;
    if (rawImage) {
        try {
            image = new URL(rawImage, baseUrl).href;
        } catch {
            image = undefined;
        }
    }
    return { title, description, image, siteName };
}

async function fetchCardData(url, timeoutMs) {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow",
        headers: {
            accept: "text/html,application/xhtml+xml",
            "accept-language": "ja,en;q=0.8",
            "user-agent": "Mozilla/5.0 (compatible; satteri-link-card/1.0; +https://github.com/minittupoyo)",
        },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("html")) throw new Error("not an HTML document");
    const html = await response.text();
    return parseCardData(html, response.url);
}

function getCardData(url, options) {
    let entry = cache.get(url);
    if (!entry) {
        entry = fetchCardData(url, options.timeoutMs).then(
            (data) => ({ ok: true, data }),
            (error) => ({ ok: false, error }),
        );
        cache.set(url, entry);
    }
    return entry;
}

function defaultFaviconUrl(url) {
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
}

function renderCard(url, result, options) {
    const hostname = new URL(url).hostname;
    const favicon = options.faviconUrl ? options.faviconUrl(new URL(url)) : defaultFaviconUrl(new URL(url));
    const target = options.openInNewTab ? ' target="_blank"' : "";
    const title = escapeHtml(result.ok && result.data.title ? result.data.title : url);
    const description =
        result.ok && result.data.description ? `\n<p class="link-card__description">${escapeHtml(result.data.description)}</p>` : "";
    const image =
        result.ok && result.data.image
            ? `\n<div class="link-card__thumbnail"><img src="${escapeHtml(result.data.image)}" alt="" loading="lazy"></div>`
            : "";
    const siteName = result.ok && result.data.siteName ? result.data.siteName : hostname;
    return `<div class="link-card not-prose"><a href="${escapeHtml(url)}"${target} rel="noopener noreferrer">
<div class="link-card__body">
<p class="link-card__title">${title}</p>${description}
<p class="link-card__host"><img class="link-card__favicon" src="${escapeHtml(favicon)}" alt="" width="16" height="16" loading="lazy">${escapeHtml(siteName)}</p>
</div>${image}
</a></div>`;
}

export function createSatteriLinkCard(options = {}) {
    const resolvedOptions = { timeoutMs: 5000, ...options };
    return defineMdastPlugin({
        name: "satteri-link-card",
        async paragraph(node, ctx) {
            const url = extractStandaloneUrl(node);
            if (!url) return;
            const result = await getCardData(url, resolvedOptions);
            if (!result.ok) {
                ctx.report({
                    message: `satteri-link-card: failed to fetch ${url} (${String(result.error?.cause ?? result.error)})`,
                    node,
                    severity: "warning",
                });
            }
            ctx.replaceNode(node, {
                type: "html",
                value: renderCard(url, result, resolvedOptions),
            });
        },
    });
}

export const satteriLinkCard = createSatteriLinkCard();

export default satteriLinkCard;
