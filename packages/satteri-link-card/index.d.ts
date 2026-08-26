import type { MdastPluginDefinition } from "satteri";

export interface SatteriLinkCardOptions {
    timeoutMs?: number;
    openInNewTab?: boolean;
    faviconUrl?: (url: URL) => string;
}

export declare function createSatteriLinkCard(options?: SatteriLinkCardOptions): MdastPluginDefinition;

declare const satteriLinkCard: MdastPluginDefinition;
export default satteriLinkCard;
