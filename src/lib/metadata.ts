import type { UrlMetadata } from './types';
import { extractDomain, getFaviconUrl, normalizeUrl } from './utils';

// ─── Metadata services ──────────────────────────────────────────────────────
// On native there is no CORS, so we fetch the target page HTML directly first.
// Public CORS proxies remain as fallbacks for sites that block direct requests.

type Proxy = (url: string) => string;

const PROXIES: Proxy[] = [
  // Primary: direct fetch (works on native, no CORS restriction)
  (u) => u,
  // Fallbacks: public proxies
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

async function fetchWithTimeout(url: string, init?: RequestInit, ms = 9000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetches the page HTML, trying each proxy in turn. */
async function fetchViaProxy(targetUrl: string): Promise<{ html?: string }> {
  let lastError: unknown;
  for (const proxy of PROXIES) {
    try {
      const res = await fetchWithTimeout(proxy(targetUrl), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StashBot/1.0)' },
      });
      if (!res.ok) {
        lastError = new Error(`Proxy responded ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (!text || text.length === 0) continue;
      return { html: text };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error('All metadata proxies failed');
}

// ─── HTML parsing helpers ─────────────────────────────────────────────────

export function resolveImageUrl(raw: string, baseUrl: string): string {
  if (!raw) return '';
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return '';
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractImdbTitleId(url: string): string | null {
  try {
    const parsed = new URL(normalizeUrl(url));
    if (!parsed.hostname.includes('imdb.com')) return null;
    const match = parsed.pathname.match(/\/title\/(tt\d+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 60) return '';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${totalMinutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function normalizeAmazonImageUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/\._V1_\.(jpg|jpeg|png)$/i, '._V1_FMjpg_UX1000_.$1');
}

function extractJsonLdMetadata(html: string, normalizedUrl: string): Partial<UrlMetadata> {
  const scripts = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];

  for (const match of scripts) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const candidate = Array.isArray(item?.['@graph']) ? item['@graph'][0] : item;
        const title = typeof candidate?.headline === 'string' ? candidate.headline : candidate?.name;
        const description = typeof candidate?.description === 'string' ? candidate.description : '';
        const image =
          typeof candidate?.image === 'string'
            ? candidate.image
            : typeof candidate?.image?.url === 'string'
              ? candidate.image.url
              : Array.isArray(candidate?.image)
                ? candidate.image.find((entry: unknown) => typeof entry === 'string')
                : '';
        if (title || description || image) {
          return {
            title: typeof title === 'string' ? decodeHtmlEntities(title) : '',
            description: typeof description === 'string' ? decodeHtmlEntities(description) : '',
            imageUrl: resolveImageUrl(typeof image === 'string' ? image : '', normalizedUrl) || undefined,
          };
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  }
  return {};
}

// ─── IMDb special-casing ─────────────────────────────────────────────────────

async function fetchImdbMetadata(url: string): Promise<UrlMetadata | null> {
  const titleId = extractImdbTitleId(url);
  if (!titleId) return null;

  try {
    const [titleResponse, certificatesResponse] = await Promise.all([
      fetchWithTimeout(`https://api.imdbapi.dev/titles/${titleId}`),
      fetchWithTimeout(`https://api.imdbapi.dev/titles/${titleId}/certificates`),
    ]);

    if (!titleResponse.ok) throw new Error(`IMDb title lookup failed: ${titleResponse.status}`);

    const titleData = await titleResponse.json();
    const certificatesData = certificatesResponse.ok ? await certificatesResponse.json() : null;

    const genres = Array.isArray(titleData.genres) ? titleData.genres.slice(0, 3).join(', ') : '';
    const rating = titleData.rating?.aggregateRating;
    const certificate =
      certificatesData?.certificates?.find((entry: { country?: { code?: string } }) => entry.country?.code === 'US')
        ?.rating ??
      certificatesData?.certificates?.[0]?.rating ??
      '';

    const titleParts = [
      `${titleData.primaryTitle ?? extractDomain(url)}${titleData.startYear ? ` (${titleData.startYear})` : ''}`,
      rating ? `⭐ ${rating}` : '',
      genres,
    ].filter(Boolean);

    const description = [formatDuration(titleData.runtimeSeconds), certificate].filter(Boolean).join(' | ');

    return {
      title: titleParts.join(' | ').replace(' | ⭐', ' ⭐'),
      description: description || titleData.plot || '',
      imageUrl: normalizeAmazonImageUrl(titleData.primaryImage?.url) || undefined,
      faviconUrl: getFaviconUrl(url),
    };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const normalized = normalizeUrl(url);
  try {
    const imdbMetadata = await fetchImdbMetadata(normalized);
    if (imdbMetadata) return imdbMetadata;

    const result = await fetchViaProxy(normalized);
    const html = result.html || '';

    const getMetaContent = (property: string): string => {
      const match =
        html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
      return match ? decodeHtmlEntities(match[1]) : '';
    };

    const getMetaName = (name: string): string => {
      const match =
        html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
      return match ? decodeHtmlEntities(match[1]) : '';
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const htmlTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
    const jsonLd = extractJsonLdMetadata(html, normalized);

    const title =
      getMetaContent('og:title') || getMetaName('twitter:title') || jsonLd.title || htmlTitle || extractDomain(url);
    const description =
      getMetaContent('og:description') ||
      getMetaName('description') ||
      getMetaName('twitter:description') ||
      jsonLd.description ||
      '';
    const rawImageUrl = getMetaContent('og:image') || getMetaName('twitter:image') || jsonLd.imageUrl || '';
    const imageUrl = resolveImageUrl(rawImageUrl, normalized);
    const faviconUrl = getFaviconUrl(url);

    return { title, description, imageUrl: imageUrl || undefined, faviconUrl };
  } catch {
    // Best-effort fallback: at least fill the domain + favicon.
    return {
      title: extractDomain(url),
      description: '',
      imageUrl: undefined,
      faviconUrl: getFaviconUrl(url),
    };
  }
}
