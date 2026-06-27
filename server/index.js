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
const primaryLandingPath = "/instagram-video-downloader/";

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

function sendAppShell(req, res) {
  const siteUrl = getPrimaryLandingUrl(req);
  const html = readFileSync(indexHtmlPath, "utf8")
    .replaceAll("%FETCHVIDS_SITE_URL%", siteUrl)
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
  const landingUrl = getPrimaryLandingUrl(req);
  const today = new Date().toISOString().slice(0, 10);
  res.type("application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${landingUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
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
