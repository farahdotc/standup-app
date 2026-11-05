/* Small pure helpers used by the dashboard. */

/** Unbiased Fisher-Yates shuffle (the old sort(() => Math.random() - 0.5) trick favors some orders). */
export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randomItem(list) {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

/** Stable string hash so every day gets its own question. */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash * 31) + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function parseISODate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  return parseISODate(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

/**
 * Business day (Mon-Fri) of the sprint for `todayStr`, counting the start day as 1.
 * Returns null before the sprint starts. Capped at `length`.
 */
export function calcSprintDay(sprintStartStr, todayStr, length = 10) {
  if (!sprintStartStr || !todayStr) return null;
  const start = parseISODate(sprintStartStr);
  const today = parseISODate(todayStr);
  if (today < start) return null;

  let bizDays = 0;
  const cursor = new Date(start);
  while (cursor <= today && bizDays < length) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) bizDays++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return bizDays;
}

/* ─── Rich text sanitizing ────────────────────────────────────────────────
 * Notes and the sprint goal are often pasted from Jira, Teams or Outlook.
 * That HTML brings inline styles, fonts, classes and sometimes event handlers
 * (e.g. <img onerror>) that would run when the dashboard renders it.
 * Keep only simple formatting tags and safe links.
 */
const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "BR", "P", "DIV", "SPAN",
  "UL", "OL", "LI", "H2", "H3", "H4", "BLOCKQUOTE", "CODE", "PRE", "A",
]);
const DROP_WITH_CONTENT = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE", "META", "LINK", "TITLE", "HEAD"]);

function cleanNode(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    if (DROP_WITH_CONTENT.has(child.tagName)) {
      child.remove();
      continue;
    }
    cleanNode(child);

    if (!ALLOWED_TAGS.has(child.tagName)) {
      child.replaceWith(...child.childNodes); // unwrap, keep the text
      continue;
    }
    for (const attr of [...child.attributes]) {
      const keepHref =
        child.tagName === "A" && attr.name === "href" && /^(https?:|mailto:)/i.test(attr.value.trim());
      if (!keepHref) child.removeAttribute(attr.name);
    }
    if (child.tagName === "A") {
      child.setAttribute("target", "_blank");
      child.setAttribute("rel", "noopener noreferrer");
    }
  }
}

export function sanitizeHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

/* ─── Saved dashboard data ───────────────────────────────────────────────── */
export function loadSaved(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return defaults;
    // Fill in any fields added since the data was saved.
    return { ...defaults, ...saved };
  } catch {
    return defaults;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): keep working in memory.
  }
}
