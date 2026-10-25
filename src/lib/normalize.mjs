// Text normalization shared by the catalog builder (scripts/) and the search index (src/).
// Plain JS so the Node build script can import it without a TypeScript step.

const UNIT =
  "v|vac|vdc|w|kw|a|ma|mah|ah|k|kohm|m|mohm|ohm|r|uf|nf|pf|mf|uh|mh|mm|cm|inch|in|mhz|khz|ghz|hz|rpm|pin|pins|p|ch|channels?|way|teeth|t|cells?|s|bit|gb|mb|kb|db|g|kg|pcs|pc|awg|c|nm|lm|x";
const UNIT_TOKEN = new RegExp(`^\\d+(\\.\\d+)?(${UNIT})$`);

const STOP = new Set(
  "a an and the for with of to in on by from or at as is high quality new original best type pcs pc piece pieces set kit egypt"
    .split(" "),
);

// Store listings are in English; common Arabic (and Egyptian colloquial) part names map onto them.
const ARABIC = [
  ["مستشعرات|مستشعر|حساسات|حساس|سنسور", "sensor"],
  ["مقاومات|مقاومة|مقاومه", "resistor"],
  ["مكثفات|مكثف|كباسيتور", "capacitor"],
  ["اردوينو|أردوينو|اردوينو", "arduino"],
  ["رازبيري باي|راسبيري باي|رازبيري|راسبيري", "raspberry pi"],
  ["ريليه|ريلاي|ريلية", "relay"],
  ["الترا سونيك|التراسونيك|الترا صوتي|فوق صوتي", "ultrasonic"],
  ["حرارة|حراره", "temperature"],
  ["رطوبة|رطوبه", "humidity"],
  ["غاز", "gas"],
  ["حركة|حركه", "motion"],
  ["سيرفو", "servo"],
  ["ستيبر", "stepper"],
  ["موتور|موتورات|محركات|محرك", "motor"],
  ["بطاريات|بطارية|بطاريه|بطارياه", "battery"],
  ["شواحن|شاحن", "charger"],
  ["شاشات|شاشة|شاشه", "display"],
  ["كاويه|كاوية|كاوي", "soldering iron"],
  ["قصدير", "solder"],
  ["افوميتر|آفوميتر|ملتيميتر|مالتيميتر", "multimeter"],
  ["اوسيلوسكوب|راسم اشارة", "oscilloscope"],
  ["ترانزستور|ترانزيستور", "transistor"],
  ["دايود|دايودات|ثنائي", "diode"],
  ["ليدات|ليد|لمبة", "led"],
  ["اسلاك|أسلاك|سلك", "wire"],
  ["كابل|كابلات|كابلات", "cable"],
  ["بريد بورد|بريدبورد|لوحة تجارب", "breadboard"],
  ["باور سبلاي|مزود طاقة|مصدر جهد", "power supply"],
  ["محول|ترانس", "transformer"],
  ["بلوتوث", "bluetooth"],
  ["واي فاي", "wifi"],
  ["مفتاح|سويتش", "switch"],
  ["زرار|زر", "button"],
  ["سماعة|سماعات|سبيكر", "speaker"],
  ["كاميرا", "camera"],
  ["طابعة ثلاثية الابعاد|طابعه ثلاثيه الابعاد", "3d printer"],
  ["فيلامنت", "filament"],
  ["مروحة|مروحه", "fan"],
  ["عدة|عده|أدوات|ادوات", "tools"],
  ["منظم جهد|منظم", "regulator"],
  ["كريستالة|كريستال", "crystal"],
  ["طاقة شمسية|لوح شمسي", "solar"],
];
const ARABIC_RE = ARABIC.map(([ar, en]) => [new RegExp(ar, "g"), ` ${en} `]);

/** Lowercase, unify unit spellings and glue numbers to their units ("5 V" -> "5v"). */
export function clean(text) {
  if (/[\u0600-\u06ff]/.test(text)) {
    for (const [re, en] of ARABIC_RE) text = text.replace(re, en);
  }
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[µμ]/g, "u")
    .replace(/Ω|ohms?\b/g, "ohm")
    .replace(/\bvolts?\b/g, "v")
    .replace(/\bwatts?\b/g, "w")
    .replace(/\bamps?\b|\bamperes?\b/g, "a")
    .replace(/(\d),(\d{3})\b/g, "$1$2")
    .replace(/\b(\d+)([kmr])(\d+)\b/g, (m, a, u, b) => `${a}.${b}${u === "r" ? "ohm" : u}`) // 4k7 -> 4.7k
    .replace(/(\d(?:\.\d+)?)\s*([km])\s*ohm\b/g, "$1$2") // 10k ohm -> 10k
    .replace(/(\d(?:\.\d+)?)r\b/g, "$1ohm") // 220r -> 220ohm
    .replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s+(?=(?:${UNIT})\\b)`, "g"), "$1");
}

/**
 * Split text into search tokens. Hyphenated/dotted codes emit both their parts and the
 * joined form, so "HC-SR04" yields hc, sr04 and hcsr04.
 */
export function tokenize(text) {
  const out = [];
  for (const word of clean(text).split(/[\s,;:/()[\]{}"'+|*!?&#]+/)) {
    const parts = word.split(/[-_]|\.(?!\d)|(?<!\d)\./).filter(Boolean);
    for (const p of parts) out.push(p.replace(/[^a-z0-9.]/g, ""));
    if (parts.length > 1) out.push(parts.join("").replace(/[^a-z0-9]/g, ""));
  }
  return out.filter((t) => t && !STOP.has(t));
}

/**
 * A part-number-like token that is not a plain quantity: esp32, lm7805, sr04, or a bare
 * number of 3+ digits such as 4028 or 0603 (IC numbers, SMD package sizes).
 */
export function isModelCode(token) {
  if (UNIT_TOKEN.test(token) || token.length < 3 || token.includes(".")) return false;
  return /\d/.test(token) && (/[a-z]/.test(token) || /^\d+$/.test(token));
}

export function isQuantity(token) {
  return UNIT_TOKEN.test(token);
}

/**
 * The numeric core of a part number, without manufacturer prefix or package suffix:
 * l7805cv -> 7805, lm7805 -> 7805, ne555p -> 555. Null when there is nothing to strip.
 */
export function partCore(token) {
  const m = /^[a-z]{1,4}(\d{3,5})[a-z]{0,4}\d?$/.exec(token) ?? /^(\d{3,5})[a-z]{1,4}\d?$/.exec(token);
  return m && m[1] !== token ? m[1] : null;
}
