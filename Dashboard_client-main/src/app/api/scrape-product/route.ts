import { NextRequest, NextResponse } from 'next/server';

// ── Types ─────────────────────────────────────────────────────────────────

interface ProductData {
  name: string;
  price: string;
  description: string;
  images: string[];
  brand: string;
  category: string;
  sourceUrl: string;
  aiExtracted: boolean;
  valid: boolean;
  errorMessage?: string;
}

// ── SSRF Protection ───────────────────────────────────────────────────────

function isBlockedHost(hostname: string): boolean {
  const blocked = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
  if (blocked.includes(hostname.toLowerCase())) return true;
  const privateRanges = [
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,
    /^fc[0-9a-f]{2}:/i,
    /^::1$/,
  ];
  return privateRanges.some((r) => r.test(hostname));
}

function validateUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (isBlockedHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

// ── HTML helpers ──────────────────────────────────────────────────────────

function metaContent(html: string, ...attrs: string[]): string | null {
  for (const attr of attrs) {
    // property="og:x" content="..." or content="..." property="og:x"
    const re1 = new RegExp(
      `<meta[^>]+(?:property|name)=["']${attr}["'][^>]+content=["']([^"']{1,800})["']`,
      'i',
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']{1,800})["'][^>]+(?:property|name)=["']${attr}["']`,
      'i',
    );
    const m = re1.exec(html) ?? re2.exec(html);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function firstMatch(html: string, ...patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = re.exec(html);
    if (m?.[1]) {
      const v = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (v) return v;
    }
  }
  return null;
}

function extractJsonLd(html: string): ProductData | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const raw = m[1].trim();
      const nodes: unknown[] = [];
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) nodes.push(...parsed);
      else nodes.push(parsed);

      // Flatten @graph
      const flat: unknown[] = [];
      for (const n of nodes) {
        const node = n as Record<string, unknown>;
        if (node['@graph'] && Array.isArray(node['@graph'])) flat.push(...(node['@graph'] as unknown[]));
        else flat.push(node);
      }

      for (const item of flat) {
        const node = item as Record<string, unknown>;
        const type = String(node['@type'] ?? '');
        if (!type.includes('Product') && !type.includes('ItemPage')) continue;

        const name = String(node['name'] ?? '').trim();
        if (!name) continue;

        const desc = String(node['description'] ?? '').trim();

        let price = '';
        const offers = node['offers'];
        if (offers) {
          const offer = Array.isArray(offers) ? (offers[0] as Record<string, unknown>) : (offers as Record<string, unknown>);
          price = String((offer as Record<string, unknown>)['price'] ?? '').trim();
        }

        let brand = '';
        const brandNode = node['brand'];
        if (brandNode) {
          brand = typeof brandNode === 'string' ? brandNode : String((brandNode as Record<string, unknown>)['name'] ?? '');
        }

        const images: string[] = [];
        const imgNode = node['image'];
        if (typeof imgNode === 'string') images.push(imgNode);
        else if (Array.isArray(imgNode)) {
          for (const img of imgNode as unknown[]) {
            if (typeof img === 'string') images.push(img);
            else if (img && typeof img === 'object') images.push(String((img as Record<string, unknown>)['url'] ?? ''));
          }
        } else if (imgNode && typeof imgNode === 'object') {
          images.push(String((imgNode as Record<string, unknown>)['url'] ?? ''));
        }

        const category = String(node['category'] ?? '').trim();

        return {
          name: name.slice(0, 160),
          price: cleanPrice(price),
          description: desc.slice(0, 2000),
          images: images.filter(Boolean).slice(0, 5),
          brand: brand.slice(0, 100),
          category: category.slice(0, 100),
          sourceUrl: '',
          aiExtracted: false,
          valid: true,
        };
      }
    } catch {
      // continue to next script block
    }
  }
  return null;
}

function cleanPrice(raw: string): string {
  if (!raw) return '';
  // remove all non-numeric except , and .
  let c = raw.replace(/[^\d.,]/g, '').trim();
  // normalise "1.234,56" European format
  if (/\d{1,3}\.\d{3},\d{2}$/.test(c)) c = c.replace(/\./g, '').replace(',', '.');
  return c || raw.trim();
}

function truncate(s: string | null | undefined, max: number): string {
  if (!s) return '';
  return s.length <= max ? s : s.slice(0, max);
}

// ── Browser header presets ────────────────────────────────────────────────

const BROWSER_HEADERS: [Record<string, string>, Record<string, string>] = [
  // Attempt 1: Chrome 124 on Windows
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  },
  // Attempt 2: Firefox 125 on Windows
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  },
];

// ── URL slug extraction (fallback for 403-protected sites) ────────────────

function extractFromUrlSlug(url: URL): Partial<ProductData> {
  const hostname = url.hostname.replace(/^www\./, '');

  // Detect brand from domain
  const domainBrand: Record<string, string> = {
    'decathlon.tn': 'Decathlon',
    'decathlon.fr': 'Decathlon',
    'decathlon.com': 'Decathlon',
    'zara.com': 'Zara',
    'mytek.tn': 'MyTek',
    'megapc.tn': 'Mega PC',
    'tunisianet.com.tn': 'Tunisianet',
    'jumia.com.tn': 'Jumia',
    'lacasashops.com': 'La Casa',
  };
  const brand = domainBrand[hostname] ?? '';

  // Extract slug: last path segment without extension and leading IDs
  const segments = url.pathname.split('/').filter(Boolean);
  let slug = segments[segments.length - 1] ?? '';
  slug = slug.replace(/\.[a-z]{2,4}$/, ''); // remove .html, .htm etc.

  // For Decathlon: /p/346758-92410-t-shirt-...-noir → strip leading "digits-digits-"
  slug = slug.replace(/^\d+-\d+-/, '');
  // Generic: strip leading numeric prefix
  slug = slug.replace(/^[\d-]+-/, '');

  // Convert slug to readable name
  const name = slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .slice(0, 160);

  // Detect category from path for known sites
  let category = '';
  if (hostname.includes('decathlon')) {
    // e.g. /sport/running/t-shirts-running/
    const sportIndex = segments.findIndex((s) => s === 'sport' || s === 'c');
    if (sportIndex !== -1 && segments[sportIndex + 1]) {
      category = segments[sportIndex + 1].replace(/-/g, ' ');
    }
  }

  return { name, brand, category };
}

// ── Main scrape logic ─────────────────────────────────────────────────────

async function fetchHtml(url: URL, headers: Record<string, string>): Promise<{ ok: boolean; status: number; html: string }> {
  const MAX_BYTES = 1_500_000;

  const res = await fetch(url.toString(), {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return { ok: false, status: res.status, html: '' };

  const reader = res.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.byteLength;
      if (total >= MAX_BYTES) { reader.cancel(); break; }
    }
  }
  const html = new TextDecoder().decode(
    chunks.reduce((a, b) => {
      const c = new Uint8Array(a.length + b.length);
      c.set(a); c.set(b, a.length);
      return c;
    }, new Uint8Array(0)),
  );
  return { ok: true, status: res.status, html };
}

async function scrapeProduct(url: URL): Promise<ProductData> {
  let html = '';
  let lastStatus = 0;

  // Try each header preset in order; stop on success
  for (const headers of BROWSER_HEADERS) {
    const attempt = await fetchHtml(url, headers);
    lastStatus = attempt.status;
    if (attempt.ok) { html = attempt.html; break; }
    if (attempt.status !== 403 && attempt.status !== 429) break; // non-retriable error
  }

  // If still blocked, extract what we can from the URL slug and return as partial result
  if (!html) {
    if (lastStatus === 403 || lastStatus === 429) {
      const slugData = extractFromUrlSlug(url);
      if (slugData.name) {
        return {
          name: slugData.name,
          price: '',
          description: '',
          images: [],
          brand: slugData.brand ?? '',
          category: slugData.category ?? '',
          sourceUrl: url.toString(),
          aiExtracted: false,
          valid: true,
          errorMessage: 'Données partielles extraites depuis l\'URL (le site bloque les robots). Vérifiez le nom et ajoutez les détails manuellement.',
        };
      }
    }
    return {
      name: '', price: '', description: '', images: [], brand: '', category: '',
      sourceUrl: '', aiExtracted: false, valid: false,
      errorMessage: lastStatus === 403 || lastStatus === 429
        ? 'Ce site bloque les importations automatiques. Saisissez les informations manuellement.'
        : `Impossible de charger la page (HTTP ${lastStatus}).`,
    };
  }

  const result: ProductData = { name: '', price: '', description: '', images: [], brand: '', category: '', sourceUrl: url.toString(), aiExtracted: false, valid: false };

  // 1. JSON-LD (most reliable)
  const jsonLd = extractJsonLd(html);
  if (jsonLd) {
    Object.assign(result, jsonLd);
    result.sourceUrl = url.toString();
  }

  // 2. Open Graph / meta fallbacks
  if (!result.name) result.name = truncate(metaContent(html, 'og:title', 'twitter:title', 'product:title') ?? firstMatch(html, /<h1[^>]*>([^<]{3,160})<\/h1>/i), 160);
  if (!result.description) result.description = truncate(metaContent(html, 'og:description', 'twitter:description', 'description'), 2000);
  if (!result.price) {
    result.price = cleanPrice(
      metaContent(html, 'product:price:amount', 'og:price:amount', 'twitter:data1') ??
      firstMatch(html,
        /itemprop=["']price["'][^>]*content=["']([^"']+)["']/i,
        /class=["'][^"']*price[^"']*["'][^>]*>([^<]{1,40})</i,
        /class=["'][^"']*prix[^"']*["'][^>]*>([^<]{1,40})</i,
      ) ?? ''
    );
  }
  if (result.images.length === 0) {
    const ogImg = metaContent(html, 'og:image', 'twitter:image');
    if (ogImg) result.images = [ogImg];
  }
  if (!result.brand) result.brand = truncate(metaContent(html, 'og:brand', 'product:brand', 'twitter:site'), 100);
  if (!result.category) result.category = truncate(metaContent(html, 'product:category', 'og:type'), 100);

  // 3. Detect if this looks like a product page
  const looksLikeProduct = result.name && (result.price || result.images.length > 0);
  if (!looksLikeProduct) {
    return { ...result, valid: false, errorMessage: 'Page produit invalide. Entrez une URL de produit valide.' };
  }

  result.valid = true;
  return result;
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, errorMessage: 'Corps de requête invalide.' }, { status: 400 });
  }

  const raw = (body.url ?? '').trim();

  // Validate URL
  const url = validateUrl(raw);
  if (!url) {
    return NextResponse.json(
      { valid: false, errorMessage: "URL invalide. Utilisez une URL http/https vers un site externe." },
      { status: 200 },
    );
  }

  try {
    const result = await scrapeProduct(url);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    if (msg.includes('timeout') || msg.includes('TimeoutError')) {
      return NextResponse.json({ valid: false, errorMessage: 'La page met trop de temps à répondre. Réessayez.' }, { status: 200 });
    }
    return NextResponse.json({ valid: false, errorMessage: 'Impossible de charger la page. Vérifiez l\'URL.' }, { status: 200 });
  }
}
