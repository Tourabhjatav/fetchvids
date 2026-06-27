import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const execFileAsync = promisify(execFile);
const app = express();
const port = Number(process.env.PORT || 8787);
const isProduction = process.env.NODE_ENV === "production";
const maxConcurrentResolvers = Math.max(1, Number(process.env.MAX_CONCURRENT_RESOLVERS || 2));
let activeResolvers = 0;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const indexHtmlPath = path.join(distPath, "index.html");
const bundledYtDlp = path.resolve(__dirname, "../.venv/Scripts/yt-dlp.exe");
const ytDlpPath = process.env.YT_DLP_PATH || (existsSync(bundledYtDlp) ? bundledYtDlp : "yt-dlp");
const siteName = "FetchVids";
const ownerName = "Xyphora AI";
const ownerUrl = "https://xyphora-ai.vercel.app/";
const primaryLandingPath = "/instagram-video-downloader/";
const pageMetadata = {
  "/": {
    title: "Instagram Video Downloader - Download Reels, Posts & Stories | FetchVids",
    description: "Download Instagram videos, Reels, posts, and public Stories online with FetchVids. Paste an Instagram link and save the available MP4 when you have permission.",
    h1: "Instagram video downloader",
    platform: "Instagram",
    acceptedLinks: "Instagram Reels, video posts, TV-style links, and publicly accessible Story links."
  },
  "/instagram-video-downloader/": {
    title: "Instagram Video Downloader - Download Reels, Posts & Stories | FetchVids",
    description: "Download Instagram videos, Reels, posts, and public Stories online with FetchVids. Paste an Instagram link and save the available MP4 when you have permission.",
    h1: "Instagram video downloader",
    platform: "Instagram",
    acceptedLinks: "Instagram Reels, video posts, TV-style links, and publicly accessible Story links."
  },
  "/facebook-video-downloader/": {
    title: "Facebook Video Downloader - Download Facebook Reels & Videos | FetchVids",
    description: "Download public Facebook videos, Reels, Watch videos, page videos, and fb.watch links online with FetchVids when you have permission.",
    h1: "Facebook video downloader",
    platform: "Facebook",
    acceptedLinks: "Facebook Watch URLs, Reels, public page videos, shared video links, and fb.watch URLs."
  },
  "/youtube-video-downloader/": {
    title: "YouTube Video Downloader - Download Videos & Shorts | FetchVids",
    description: "Download public YouTube videos, Shorts, live replays, embeds, and youtu.be links online with FetchVids for content you are allowed to save.",
    h1: "YouTube video downloader",
    platform: "YouTube",
    acceptedLinks: "YouTube watch pages, Shorts URLs, live replay URLs, embeds, and youtu.be links."
  },
  "/x-twitter-video-downloader/": {
    title: "X Twitter Video Downloader - Download X Videos Online | FetchVids",
    description: "Download public X and Twitter videos from status links online with FetchVids when the post contains video media you have permission to save.",
    h1: "X Twitter video downloader",
    platform: "X/Twitter",
    acceptedLinks: "Public x.com and twitter.com status URLs that contain video media."
  },
  "/how-it-works/": {
    title: "How to Download Social Videos | FetchVids",
    description: "Learn how to copy a public Instagram, Facebook, YouTube, or X video link, paste it into FetchVids, resolve an MP4, and save permitted content.",
    h1: "How to download social videos"
  },
  "/faq/": {
    title: "Social Video Downloader FAQ | FetchVids",
    description: "Read answers about downloading Instagram, Facebook, YouTube, and X/Twitter videos, supported links, private media, safety, and responsible use.",
    h1: "Social video downloader FAQ"
  },
  "/privacy/": {
    title: "Privacy Policy | FetchVids",
    description: "Learn how FetchVids handles submitted public links, request data, security logs, IP addresses, and privacy-sensitive Instagram media.",
    h1: "Privacy policy"
  },
  "/terms/": {
    title: "Terms of Use | FetchVids",
    description: "Review the rules for using FetchVids responsibly with public Instagram media, permission-based downloads, fair-use limits, and platform restrictions.",
    h1: "Terms of use"
  },
  "/copyright/": {
    title: "Copyright Information | FetchVids",
    description: "Information for creators, rights holders, and users about copyright, ownership, permission, and review requests for supported URLs.",
    h1: "Copyright information"
  }
};
const sitemapPaths = [
  "/instagram-video-downloader/",
  "/facebook-video-downloader/",
  "/youtube-video-downloader/",
  "/x-twitter-video-downloader/",
  "/how-it-works/",
  "/faq/",
  "/privacy/",
  "/terms/",
  "/copyright/"
];

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);
app.use((_req, res, next) => {
  res.locals.cspNonce = randomBytes(16).toString("base64");
  next();
});
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'none'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", (_req, res) => `'nonce-${res.locals.cspNonce}'`],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: "deny" },
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: "no-referrer" }
}));
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

const resolveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many download requests. Please wait a few minutes and try again." }
});

app.use("/api", apiLimiter, express.json({ limit: "2kb", strict: true, type: "application/json" }));

const PLATFORM_RULES = [
  {
    name: "Instagram",
    hosts: new Set(["instagram.com", "www.instagram.com"]),
    path: /^\/(reel|reels|p|tv)\/[A-Za-z0-9_-]+\/?|^\/stories\/[A-Za-z0-9._-]+\/\d+\/?/
  },
  {
    name: "YouTube",
    hosts: new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]),
    path: /^\/(watch|shorts\/[A-Za-z0-9_-]+|live\/[A-Za-z0-9_-]+|embed\/[A-Za-z0-9_-]+)/
  },
  {
    name: "YouTube",
    hosts: new Set(["youtu.be"]),
    path: /^\/[A-Za-z0-9_-]{6,}/
  },
  {
    name: "X/Twitter",
    hosts: new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]),
    path: /^\/[^/]+\/status\/\d+/
  },
  {
    name: "Facebook",
    hosts: new Set(["facebook.com", "www.facebook.com", "m.facebook.com"]),
    path: /^\/(watch\/?|reel\/|share\/|[^/]+\/videos\/|video\.php)/
  },
  {
    name: "Facebook",
    hosts: new Set(["fb.watch"]),
    path: /^\/[A-Za-z0-9_-]+/
  }
];

function getAllowedPlatform(value) {
  try {
    if (typeof value !== "string" || value.length < 10 || value.length > 2048) return null;
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (url.port && url.port !== "443") return null;
    return PLATFORM_RULES.find((platform) =>
      platform.hosts.has(url.hostname.toLowerCase()) && platform.path.test(url.pathname)
    ) || null;
  } catch {
    return null;
  }
}

function safeHttpsUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.headers.host || `localhost:${port}`;
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function getPrimaryLandingUrl(req) {
  return `${getPublicBaseUrl(req)}${primaryLandingPath}`;
}

function normalizePagePath(pathname) {
  if (!pathname || pathname === "/") return primaryLandingPath;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function getPageMeta(pathname) {
  return pageMetadata[normalizePagePath(pathname)] || pageMetadata[primaryLandingPath];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function getPageUrl(req) {
  return `${getPublicBaseUrl(req)}${normalizePagePath(req.path)}`;
}

function getStructuredData(req, pageUrl, meta) {
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${getPublicBaseUrl(req)}/#website`,
      name: siteName,
      url: getPublicBaseUrl(req),
      description: "FetchVids helps users download public videos from Instagram, Facebook, YouTube, and X/Twitter when they have permission."
    },
    {
      "@type": "WebApplication",
      "@id": `${getPublicBaseUrl(req)}${primaryLandingPath}#app`,
      name: "FetchVids Social Video Downloader",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      url: `${getPublicBaseUrl(req)}${primaryLandingPath}`,
      description: "Paste a public Instagram, Facebook, YouTube, or X/Twitter video link and resolve available MP4 download options for content you own or have permission to save.",
      creator: {
        "@type": "Organization",
        name: ownerName,
        url: ownerUrl
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      }
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: meta.title,
      url: pageUrl,
      description: meta.description,
      isPartOf: {
        "@id": `${getPublicBaseUrl(req)}/#website`
      }
    }
  ];

  if (meta.platform) {
    graph.push({
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: meta.h1,
      serviceType: `${meta.platform} video downloader`,
      provider: {
        "@type": "Organization",
        name: siteName
      },
      areaServed: "Worldwide",
      description: meta.description
    });
  }

  if (normalizePagePath(req.path) === "/how-it-works/" || meta.platform) {
    graph.push({
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      name: meta.platform ? `How to download a ${meta.platform} video` : "How to download a social video",
      description: "Copy a public video link, paste it into FetchVids, and save the available MP4 file when you have permission.",
      step: [
        {
          "@type": "HowToStep",
          name: "Copy the video link",
          text: meta.acceptedLinks ? `Open ${meta.platform}, choose a supported public video link, and copy its share URL.` : "Open a supported platform, choose a public video, and copy its share URL."
        },
        {
          "@type": "HowToStep",
          name: "Paste the link",
          text: "Paste the URL into FetchVids and choose Download."
        },
        {
          "@type": "HowToStep",
          name: "Save the video",
          text: "Open the resolved MP4 option and save the file to your device."
        }
      ]
    });
  }

  if (normalizePagePath(req.path) === "/faq/") {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Which video sites does FetchVids support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FetchVids supports public Instagram, Facebook, YouTube, and X/Twitter video links that can be opened without a private login."
          }
        },
        {
          "@type": "Question",
          name: "How do I download an Instagram video?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Copy the Instagram video, Reel, post, or public Story link, paste it into FetchVids, and choose Download. If a safe MP4 is available, the result appears on the page."
          }
        },
        {
          "@type": "Question",
          name: "Can I download Facebook, YouTube, and X videos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Public Facebook videos and Reels, YouTube videos and Shorts, and X/Twitter status videos can work when the media is available without login and the source can be resolved."
          }
        },
        {
          "@type": "Question",
          name: "Is it legal to download videos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Only download public content you own, content in the public domain, or content you have permission to save. Do not use the service to infringe copyright or bypass platform access controls."
          }
        }
      ]
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

function sendAppShell(req, res) {
  const pageUrl = getPageUrl(req);
  const meta = getPageMeta(req.path);
  const html = readFileSync(indexHtmlPath, "utf8")
    .replaceAll("%FETCHVIDS_PAGE_URL%", escapeHtml(pageUrl))
    .replaceAll("%FETCHVIDS_PAGE_TITLE%", escapeHtml(meta.title))
    .replaceAll("%FETCHVIDS_PAGE_DESCRIPTION%", escapeHtml(meta.description))
    .replaceAll("%FETCHVIDS_FALLBACK_H1%", escapeHtml(meta.h1))
    .replaceAll("%FETCHVIDS_SCHEMA%", getStructuredData(req, pageUrl, meta))
    .replaceAll("%CSP_NONCE%", res.locals.cspNonce);
  res.type("html");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
}

app.post("/api/resolve", resolveLimiter, async (req, res) => {
  if (!req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json." });
  }

  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  const platform = getAllowedPlatform(url);
  if (!platform) {
    return res.status(400).json({
      error: "Enter a supported public Instagram, YouTube, X/Twitter, or Facebook media URL."
    });
  }

  if (activeResolvers >= maxConcurrentResolvers) {
    res.setHeader("Retry-After", "10");
    return res.status(503).json({
      error: "The downloader is busy. Please wait a moment and try again."
    });
  }

  activeResolvers += 1;
  try {
    const { stdout } = await execFileAsync(
      ytDlpPath,
      [
        "--dump-single-json",
        "--no-playlist",
        "--no-warnings",
        "--no-config",
        "--no-cache-dir",
        "--js-runtimes", "node",
        "--socket-timeout", "10",
        "--format", "best[ext=mp4]/best",
        url
      ],
      {
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true
      }
    );
    const media = JSON.parse(stdout);
    const downloadUrl = safeHttpsUrl(media.url);
    if (!downloadUrl) throw new Error("No safe downloadable media URL returned.");

    res.json({
      title: String(media.title || media.description || "Your video is ready").slice(0, 160),
      platform: platform.name,
      thumbnail: safeHttpsUrl(media.thumbnail),
      duration: media.duration_string ? String(media.duration_string).slice(0, 24) : null,
      quality: media.height ? `${media.height}p` : "Best available",
      downloadUrl
    });
  } catch (error) {
    const missingTool = error.code === "ENOENT";
    res.status(502).json({
      error: missingTool
        ? `The downloader engine is not installed on this server yet. Install yt-dlp and restart ${siteName}.`
        : "This media could not be resolved. It may be private, login-only, unavailable, or temporarily blocked."
    });
  } finally {
    activeResolvers -= 1;
  }
});

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true });
});
app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));

app.get("/robots.txt", (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  res.type("text/plain");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get("/sitemap.xml", (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const today = new Date().toISOString().slice(0, 10);
  const urls = sitemapPaths.map((pagePath) => `  <url>
    <loc>${escapeXml(`${baseUrl}${pagePath}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${pagePath === primaryLandingPath ? "weekly" : "monthly"}</changefreq>
    <priority>${pagePath === primaryLandingPath ? "1.0" : "0.7"}</priority>
  </url>`).join("\n");
  res.type("application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
});

app.use(express.static(distPath, {
  index: false,
  immutable: isProduction,
  maxAge: isProduction ? "1h" : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  return sendAppShell(req, res);
});
app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Malformed JSON request." });
  }
  console.error("Unhandled request error:", error);
  return res.status(500).json({ error: "Unexpected server error." });
});

const server = app.listen(port, () => {
  console.log(`${siteName} API listening on http://localhost:${port}`);
});

server.headersTimeout = 15_000;
server.requestTimeout = 40_000;
server.keepAliveTimeout = 5_000;

function shutdown(signal) {
  console.log(`${signal} received; closing HTTP server`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 25_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
