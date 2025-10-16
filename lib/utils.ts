// lib/utils.ts

/** Normalizes & extracts domain like "youtube.com" */
export function extractDomain(raw: string): string {
  try {
    const normalized = normalizeUrl(raw);
    const u = new URL(normalized);
    return u.hostname.replace(/^www\./, "");
  } catch {
    const m = raw.replace(/^https?:\/\//i, "").split("/")[0];
    return m.replace(/^www\./, "");
  }
}

export function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/** Permissive validator: accepts bare domains or full http(s) URLs. */
export function isParsableUrlOrDomain(input: string): boolean {
  const s = input.trim();
  try {
    const u = new URL(normalizeUrl(s));
    return !!u.hostname && /\./.test(u.hostname);
  } catch {
    return false;
  }
}

/** Fetch page HTML (best effort) with a timeout */
export async function fetchHtml(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(normalizeUrl(url), {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 14; Runify) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Mobile Safari/537.36",
      },
      signal: controller.signal,
    });
    return await res.text();
  } finally {
    clearTimeout(to);
  }
}

/** Simple HTML attribute extractor: <meta property="og:title" content="..."> */
function pickMeta(
  html: string,
  names: { attr: "property" | "name"; value: string }[]
): string | null {
  for (const n of names) {
    const re = new RegExp(
      `<meta[^>]+${n.attr}\\s*=\\s*["']${escapeRegExp(n.value)}["'][^>]*>`,
      "i"
    );
    const tag = html.match(re)?.[0];
    if (!tag) continue;
    const content = tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    if (content) return decodeHtml(content.trim());
  }
  return null;
}

/** Extract <title>... */
function pickTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtml(m[1].trim()) : null;
}

function resolveUrlMaybe(base: string, candidate?: string | null): string | null {
  if (!candidate) return null;
  try {
    return new URL(candidate, normalizeUrl(base)).toString();
  } catch {
    return null;
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export type UrlMeta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
};

/** Parse common OpenGraph / Twitter meta tags with solid fallbacks */
export function parseMetaFromHtml(html: string, url: string): UrlMeta {
  const title =
    pickMeta(html, [
      { attr: "property", value: "og:title" },
      { attr: "name", value: "twitter:title" },
    ]) ?? pickTitle(html);

  const description =
    pickMeta(html, [
      { attr: "property", value: "og:description" },
      { attr: "name", value: "description" },
      { attr: "name", value: "twitter:description" },
    ]) ?? null;

  const imageRaw =
    pickMeta(html, [
      { attr: "property", value: "og:image" },
      { attr: "name", value: "twitter:image" },
      { attr: "name", value: "twitter:image:src" },
    ]) ?? null;

  const siteName =
    pickMeta(html, [{ attr: "property", value: "og:site_name" }]) ?? null;

  const image = resolveUrlMaybe(url, imageRaw);

  return { title, description, image, siteName };
}

/** One-shot: fetch and parse meta for a URL */
export async function fetchUrlMeta(url: string): Promise<UrlMeta> {
  try {
    const html = await fetchHtml(url);
    return parseMetaFromHtml(html, url);
  } catch {
    return { title: null, description: null, image: null, siteName: null };
  }
}
