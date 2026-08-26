import type { MdastPluginDefinition } from "satteri";

export interface SatteriCalloutTypeDefinition {
    /** Tabler-style SVG markup (stroke uses `currentColor`, tinted via `color`). */
    svg?: string;
    /** Accent color of the callout and the icon stroke. */
    color?: string;
    /** Default title shown when the marker has no custom title. */
    label?: string;
    /** Reuse the icon, color, and label of a built-in type. */
    aliasOf?: keyof typeof import("./src/icons.js").TABLER_ICONS;
}

export interface SatteriCalloutOptions {
    /** Additional or overridden callout types keyed by lowercase name. */
    types?: Record<string, SatteriCalloutTypeDefinition>;
}

export declare function createSatteriCallout(options?: SatteriCalloutOptions): MdastPluginDefinition;

declare const satteriCallout: MdastPluginDefinition;
export default satteriCallout;
