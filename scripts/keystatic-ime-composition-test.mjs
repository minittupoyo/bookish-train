/**
 * Regression test: Japanese IME composition in the Keystatic rich text editor
 *
 * Simulates IME composition via CDP (Input.imeSetComposition) against the
 * running dev server and asserts that:
 *  - composing into an EMPTY editor stays a single composition (the historical
 *    bug: the widget-decoration placeholder was removed on the first
 *    character, force-committing the first romaji char, e.g. "ｎいほんご")
 *  - composing into a non-empty editor still works
 *  - the placeholder (now rendered with CSS ::before via node decoration,
 *    see patches/@keystatic%2Fcore@0.6.9.patch) shows/hides correctly, does
 *    not block click-to-focus, and returns after undo
 *
 * Prerequisites:
 *   - dev server on 127.0.0.1:4321 (bunx astro dev --background)
 *   - playwright-core + Chromium available to this script
 *     (e.g. cd /tmp && bun init && bun add playwright-core &&
 *      bun x playwright-core install chromium; run from there or adjust import)
 *   - Linux without libnss3/libnspr4 may need LD_LIBRARY_PATH pointing at
 *     extracted .deb libs for headless Chromium
 */
import { chromium } from "playwright-core";

const BASE = "http://127.0.0.1:4321";
const label = process.argv[2] ?? "run";

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ja-JP" });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

async function openFreshEditor() {
    await page.goto(`${BASE}/keystatic/collection/blog/create`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        const dbs = indexedDB.databases ? await indexedDB.databases() : [];
        await Promise.all(
            dbs.map(
                (d) =>
                    new Promise((res) => {
                        const req = indexedDB.deleteDatabase(d.name);
                        req.onsuccess = req.onerror = req.onblocked = res;
                    }),
            ),
        );
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".ProseMirror", { timeout: 20000 });
}

async function instrument() {
    return page.evaluate(() => {
        const el = document.querySelector(".ProseMirror");
        window.__ev = [];
        ["compositionstart", "compositionupdate", "compositionend", "textInput"].forEach((t) =>
            el.addEventListener(t, (e) => window.__ev.push([t, e.data ?? null, JSON.stringify(el.textContent)])),
        );
        return true;
    });
}

async function editorInfo() {
    return page.evaluate(() => {
        const el = document.querySelector(".ProseMirror");
        const firstP = el.querySelector("p");
        const style = firstP ? getComputedStyle(firstP, "::before") : null;
        return {
            text: el.textContent,
            childCount: el.firstElementChild?.childElementCount ?? null,
            pNodeClass: firstP?.className ?? null,
            pDataPlaceholder: firstP?.getAttribute("data-placeholder") ?? null,
            beforeContent: style?.content,
            beforeColor: style?.color,
            beforePointerEvents: style?.pointerEvents,
            placeholderSpanInDOM: !!el.querySelector(".ProseMirror-placeholder.ProseMirror-widget"),
        };
    });
}

async function composeJapanese(cdp, steps) {
    for (const s of steps) {
        await cdp.send("Input.imeSetComposition", {
            text: s.text,
            selectionStart: s.text.length,
            selectionEnd: s.text.length,
        });
        await new Promise((r) => setTimeout(r, s.wait ?? 350));
    }
}

function verdict(r, expectedText) {
    const starts = r.events.filter((e) => e[0] === "compositionstart").length;
    const ends = r.events.filter((e) => e[0] === "compositionend").length;
    const ok = starts === 1 && ends === 1 && r.after.text === expectedText;
    return { ok, starts, ends };
}

// ---------- Scenario A: empty editor, Japanese IME ----------
await openFreshEditor();
await instrument();
await page.locator(".ProseMirror").first().click();
const beforeA = await editorInfo();
const cdp = await context.newCDPSession(page);
await composeJapanese(cdp, [{ text: "n" }, { text: "に" }, { text: "にほん" }, { text: "にほんご", wait: 500 }]);
await cdp.send("Input.insertText", { text: "にほんご" });
await new Promise((r) => setTimeout(r, 400));
const afterA = await editorInfo();
const evA = await page.evaluate(() => window.__ev);
const vA = verdict({ after: afterA, events: evA }, "にほんご");

// ---------- Scenario B: non-empty editor, then IME ----------
await openFreshEditor();
await instrument();
await page.locator(".ProseMirror").first().click();
await page.keyboard.type("hello ");
await new Promise((r) => setTimeout(r, 250));
const cdp2 = await context.newCDPSession(page);
await composeJapanese(cdp2, [{ text: "にほんご", wait: 600 }]);
await cdp2.send("Input.insertText", { text: "にほんご" });
await new Promise((r) => setTimeout(r, 400));
const afterB = await editorInfo();
const evB = await page.evaluate(() => window.__ev);
const vB = verdict({ after: afterB, events: evB }, "hello にほんご");

// ---------- Scenario C: placeholder display + click-to-focus + undo/redo + delete-all ----------
await openFreshEditor();
await instrument();
const emptyInfo = await editorInfo();
// click-to-focus on empty editor
await page.locator(".ProseMirror").first().click();
const focusOk = await page.evaluate(() => {
    const el = document.querySelector(".ProseMirror");
    const sel = document.getSelection();
    return document.activeElement === el && !!sel.rangeCount && el.contains(sel.anchorNode);
});
// type normal ascii -> placeholder disappears
await page.keyboard.type("abc");
await new Promise((r) => setTimeout(r, 200));
const typedInfo = await editorInfo();
// undo (Ctrl/Cmd+Z) until empty again -> placeholder reappears
for (let i = 0; i < 5; i++) {
    await page.keyboard.press(process.platform === "darwin" ? "Meta+z" : "Control+z");
}
await new Promise((r) => setTimeout(r, 300));
const undoneInfo = await editorInfo();

console.log(`\n===== ${label} =====`);
console.log("\n--- A empty-editor IME ---");
console.log("before:", JSON.stringify(beforeA));
console.log("after:", JSON.stringify(afterA));
console.log("events:", evA.map((e) => `${e[0]}(${e[1]})@${e[2]?.slice(1, 30)}`).join(" | "));
console.log("--- B nonempty IME ---");
console.log("after:", JSON.stringify(afterB), "| verdict:", vB.ok ? "PASS" : `FAIL(${JSON.stringify(afterB.text)})`);
console.log("events:", evB.map((e) => `${e[0]}(${e[1]})`).join(" | "));
console.log("\n--- C placeholder/focus/undo ---");
console.log("empty:", JSON.stringify(emptyInfo));
console.log("focusOk:", focusOk);
console.log("typed:", JSON.stringify(typedInfo));
console.log("undone:", JSON.stringify(undoneInfo));

const checks = {
    A_empty_IME_contiguous: vA.ok,
    B_nonempty_IME_contiguous: vB.ok,
    C_placeholder_shown_when_empty:
        emptyInfo.pDataPlaceholder?.includes("Start writing") === true &&
        emptyInfo.beforeContent.replaceAll("\\", "") === `"${emptyInfo.pDataPlaceholder}"` &&
        !emptyInfo.placeholderSpanInDOM,
    C_placeholder_not_a_dom_child: emptyInfo.childCount !== null && emptyInfo.childCount >= 1 && !emptyInfo.placeholderSpanInDOM,
    C_focus_by_click: focusOk,
    C_placeholder_hidden_when_typed: typedInfo.pDataPlaceholder === null && typedInfo.text === "abc",
    C_placeholder_back_after_undo: undoneInfo.pDataPlaceholder?.includes("Start writing") === true && undoneInfo.text === "",
};

let allPass = true;
for (const [k, v] of Object.entries(checks)) {
    if (!v) allPass = false;
    console.log(`${v ? "PASS" : "FAIL"} ${k}`);
}
console.log(`\nOVERALL: ${allPass ? "PASS" : "FAIL"}`);

await browser.close();
process.exit(allPass ? 0 : 1);
