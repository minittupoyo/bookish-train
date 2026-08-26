import { defineMdastPlugin } from "satteri";
import { TABLER_ICONS } from "./icons.js";

const ALIASES = {
    note: "note",
    info: "note",
    tip: "tip",
    hint: "tip",
    success: "tip",
    check: "tip",
    important: "important",
    warning: "warning",
    attention: "warning",
    caution: "caution",
    danger: "caution",
    error: "caution",
    question: "question",
    help: "question",
    example: "example",
    quote: "quote",
};

const ALIAS_LABELS = {
    info: "Info",
    hint: "Hint",
    success: "Success",
    check: "Check",
    attention: "Attention",
    danger: "Danger",
    error: "Error",
    help: "Help",
};

const DEFAULT_COLOR = "#57606a";

// [!TYPE] optionally followed by folding marker (+/-) and a custom title.
const MARKER_RE = /^[ \t]*\[!([A-Za-z][A-Za-z0-9-]*)\]([+-])?[ \t]*(.*)$/;

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

function toBase64(value) {
    if (typeof Buffer === "function") return Buffer.from(value, "utf8").toString("base64");
    return btoa(unescape(encodeURIComponent(value)));
}

function makeIconDataUri(svg, color) {
    return `data:image/svg+xml;base64,${toBase64(String(svg).replaceAll("currentColor", color))}`;
}

function resolveTypes(customTypes = {}) {
    const resolved = new Map();
    for (const [key, icon] of Object.entries(TABLER_ICONS)) {
        const override = customTypes[key];
        resolved.set(key, {
            label: override?.label ?? icon.label,
            color: override?.color ?? icon.color,
            dataUri:
                override?.svg || (override?.color && override.color !== icon.color)
                    ? makeIconDataUri(override.svg ?? icon.svg, override.color ?? icon.color)
                    : icon.dataUri,
        });
    }
    for (const [key, def] of Object.entries(customTypes)) {
        const name = key.toLowerCase();
        if (!def.svg && !def.aliasOf) continue;
        const base = def.aliasOf != null ? TABLER_ICONS[def.aliasOf] : undefined;
        if (def.aliasOf != null && !base) {
            throw new Error(`satteri-callout: unknown aliasOf "${def.aliasOf}" for type "${name}"`);
        }
        if (!base && !def.svg) {
            throw new Error(`satteri-callout: type "${name}" needs either "svg" or "aliasOf"`);
        }
        const color = def.color ?? base?.color ?? DEFAULT_COLOR;
        resolved.set(name, {
            label: def.label ?? base?.label ?? name.charAt(0).toUpperCase() + name.slice(1),
            color,
            dataUri: def.svg || def.color ? makeIconDataUri(def.svg ?? base.svg, color) : base.dataUri,
        });
    }
    return resolved;
}

function renderTitle(type, title) {
    return `<p class="callout__title"><img class="callout__icon" src="${type.dataUri}" alt="" width="18" height="18" loading="lazy"><span>${escapeHtml(title)}</span></p>`;
}

function hasInlineContent(children) {
    return children.some((child) => child.type !== "html" || child.value.trim() !== "");
}

export function createSatteriCallout(options = {}) {
    let types;
    return defineMdastPlugin({
        name: "satteri-callout",
        blockquote(node, ctx) {
            types ??= resolveTypes(options.types);
            const first = node.children?.[0];
            if (!first || first.type !== "paragraph") return;
            const firstText = first.children?.[0];
            if (!firstText || firstText.type !== "text") return;

            const lineEnd = firstText.value.indexOf("\n");
            const markerLine = lineEnd === -1 ? firstText.value : firstText.value.slice(0, lineEnd);
            const match = MARKER_RE.exec(markerLine);
            if (!match) return;

            const name = match[1].toLowerCase();
            const key = types.has(name) ? name : ALIASES[name];
            const type = types.get(key);
            if (!type) {
                ctx.report({
                    message: `satteri-callout: unknown callout type "!${match[1]}"`,
                    node,
                    severity: "warning",
                });
                return;
            }

            const customTitle = match[3].trim();
            const title = customTitle || ALIAS_LABELS[key] || type.label;

            // Rebuild the blockquote as a styled div, dropping the marker line.
            const restValue = firstText.value.slice(match[0].length).replace(/^\n/, "");
            const restChildren = [...(restValue ? [{ type: "text", value: restValue }] : []), ...first.children.slice(1)];
            if (!restValue) {
                // satteri-breaks may already have turned the newline after the
                // marker into a `break` node; drop it so no <br> leads the body.
                while (
                    restChildren.length > 0 &&
                    (restChildren[0].type === "break" ||
                        (restChildren[0].type === "text" && restChildren[0].value.trim() === ""))
                ) {
                    restChildren.shift();
                }
            }

            const children = [{ type: "html", value: renderTitle(type, title) }];
            if (hasInlineContent(restChildren)) {
                children.push({ type: "paragraph", children: restChildren });
            }
            children.push(...node.children.slice(1));

            ctx.replaceNode(node, {
                type: "callout",
                data: {
                    hName: "div",
                    hProperties: { class: `callout callout--${key} not-prose` },
                },
                children,
            });
        },
    });
}

export const satteriCallout = createSatteriCallout();

export default satteriCallout;
