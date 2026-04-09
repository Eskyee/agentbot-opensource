/**
 * Agentbot Web Summarizer — Free API (x402 payments coming soon)
 *
 * Summarize any URL. Deployed on Render/Railway.
 * Payments wallet: 0x9Fc073659284575850614f6286158803F0526Bc2 (Base mainnet)
 *
 * Endpoints:
 *   GET  /                    — API info
 *   GET  /health              — health check
 *   POST /api/summarize       — summarize a URL (title, description, headings, paragraphs, word count)
 *   POST /api/extract         — extract links, images, meta from a URL
 *
 * Future: x402 payment gating ($0.01/request) once facilitator compatibility is resolved.
 */

const express = require("express");
const cheerio = require("cheerio");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3100;
const PAY_TO = "0x9Fc073659284575850614f6286158803F0526Bc2";

// ── Free Endpoints ──

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "agentbot-web-summarizer", version: "1.0.0" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "Agentbot Web Summarizer",
    description: "Summarize and extract data from any URL",
    endpoints: {
      "POST /api/summarize": "Extract title, description, headings, key content — { url }",
      "POST /api/extract": "Extract all links, images, meta tags — { url }",
    },
    payment: { network: "base", currency: "USDC", payTo: PAY_TO, note: "x402 gating coming soon" },
  });
});

// ── Summarize ──

app.post("/api/summarize", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });

    const html = await fetchUrl(url);
    const $ = cheerio.load(html);

    const title = $("title").text().trim() || $("h1").first().text().trim() || "";
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const headings = [];
    $("h1, h2, h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && text.length < 200) headings.push(text);
    });

    const paragraphs = [];
    $("p, article, .content, .post-content, main p").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20 && text.length < 2000) {
        paragraphs.push(text.replace(/\s+/g, " "));
      }
    });

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(/\s+/).length;

    res.json({
      url,
      title,
      description,
      headings: [...new Set(headings)].slice(0, 20),
      paragraphs: [...new Set(paragraphs)].slice(0, 10),
      wordCount,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Extract ──

app.post("/api/extract", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });

    const html = await fetchUrl(url);
    const $ = cheerio.load(html);
    const base = new URL(url);

    const links = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        try {
          const resolved = new URL(href, base).href;
          links.push({ href: resolved, text: text.slice(0, 100) || resolved });
        } catch {}
      }
    });

    const images = [];
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src");
      const alt = $(el).attr("alt") || "";
      if (src) {
        try {
          const resolved = new URL(src, base).href;
          images.push({ src: resolved, alt: alt.slice(0, 100) });
        } catch {}
      }
    });

    const meta = {};
    $('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"]').each((_, el) => {
      const key = $(el).attr("property") || $(el).attr("name");
      const value = $(el).attr("content");
      if (key && value) meta[key] = value;
    });

    res.json({
      url,
      links: [...new Map(links.map((l) => [l.href, l])).values()].slice(0, 50),
      images: [...new Map(images.map((i) => [i.src, i])).values()].slice(0, 20),
      meta,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ──

async function fetchUrl(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Agentbot-WebSummarizer/1.0 (+https://agentbot.raveculture.xyz)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

// ── Start ──

app.listen(PORT, () => {
  console.log(`Web Summarizer running on :${PORT}`);
  console.log(`Payments → ${PAY_TO} (Base mainnet)`);
});
