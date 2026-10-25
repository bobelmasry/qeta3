// Shared helpers for the scrapers.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export const DATA_DIR = path.join(import.meta.dirname, "..", "data");

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function get(url, { json = false, tries = 4 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { body: json ? await res.json() : await res.text(), headers: res.headers };
    } catch (err) {
      if (attempt >= tries) throw new Error(`${url}: ${err.message}`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}

// Run `fn` over `items` with at most `limit` in flight, pausing `delay` ms between starts per worker.
export async function pool(items, limit, delay, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
        await sleep(delay);
      }
    }),
  );
  return out;
}

export function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export function stripTags(html) {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

// Windows-1252 maps these characters to bytes 0x80-0x9F; Latin-1 covers the rest one to one.
const CP1252 = new Map(
  [..."€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ"].map((c, i) => [c, 0x80 + i]),
);

/**
 * Repair UTF-8 text that was decoded as Windows-1252/Latin-1 upstream ("15Â°", "â€“", "Î©").
 * Only applied when re-decoding produces valid UTF-8, so correct strings pass through.
 */
export function fixMojibake(text) {
  if (!/[ÂÃâÎ][\u0080-\u00ff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(text)) return text;
  const bytes = [];
  for (const c of text) {
    const code = CP1252.get(c) ?? c.codePointAt(0);
    if (code > 0xff) return text; // not mojibake: a real non-Latin character
    bytes.push(code);
  }
  const fixed = Buffer.from(bytes).toString("utf8");
  return fixed.includes("\ufffd") ? text : fixed;
}

const MAX_DESC_CHARS = 6000;

/**
 * Turn store description HTML into plain blocks the site can render without trusting the HTML:
 * { t: "h" | "p" | "li", text } and { t: "spec", k, v } for table rows.
 */
export function htmlToBlocks(html) {
  if (!html) return [];
  const specs = [];
  let src = html
    .replace(/<(script|style|iframe|noscript|svg)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<table[\s\S]*?<\/table>/gi, (table) => {
      const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        .filter((m) => /<td/i.test(m[0])) // header rows ("Parameter | Value") carry no data
        .map((m) =>
          [...m[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => stripTags(c[1])).filter(Boolean),
        );
      const out = rows
        .filter((cells) => cells.length >= 2)
        .map(([k, ...v]) => ({ t: "spec", k: k.replace(/:$/, ""), v: v.join(" · ") }));
      specs.push(out);
      return `\n\u0002${specs.length - 1}\n`;
    });
  src = src
    // Stores often mark sections with a bold-only paragraph instead of a heading.
    .replace(/<p[^>]*>\s*<(strong|b)>([^<]{1,60}?):?\s*<\/\1>\s*(<br\s*\/?>)?\s*<\/p>/gi, "\n\u0001h$2\n")
    .replace(/<h[1-6][^>]*>/gi, "\n\u0001h")
    .replace(/<li[^>]*>/gi, "\n\u0001l")
    .replace(/<\/(h[1-6]|li|p|div|ul|ol|tr|section)>|<(p|div|ul|ol|br)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const blocks = [];
  let chars = 0;
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("\u0002")) {
      blocks.push(...specs[+line.slice(1)]);
      continue;
    }
    const kind = line.startsWith("\u0001h") ? "h" : line.startsWith("\u0001l") ? "li" : "p";
    let text = decodeEntities(line.replace(/^\u0001[hl]/, "")).replace(/\s+/g, " ").trim();
    if (kind === "h") text = text.replace(/:$/, "");
    if (!text || /^(download|click here|&nbsp;)$/i.test(text)) continue;
    if (blocks.at(-1)?.text === text) continue;
    blocks.push({ t: kind, text });
    chars += text.length;
    if (chars > MAX_DESC_CHARS) break;
  }
  // A heading with nothing after it carries no information.
  while (blocks.at(-1)?.t === "h") blocks.pop();
  return blocks;
}

export async function save(name, data) {
  const file = path.join(DATA_DIR, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data));
  if (!name.startsWith("details/")) {
    console.log(`wrote ${file} (${Array.isArray(data) ? data.length : Object.keys(data).length} entries)`);
  }
}
