# FetchVids

An ad-ready downloader interface for public media from:

- Instagram Reels, posts, and Stories accessible without login
- YouTube videos, Shorts, and live-video pages
- X/Twitter video posts
- Facebook videos and Reels

## Run locally

1. Install Node.js 20+ and Python 3.10+.
2. Run `npm install`.
3. Run `python -m venv .venv`.
4. Run `.\.venv\Scripts\python -m pip install -r requirements.txt`.
5. Run `npm run dev`.
6. Open `http://localhost:5173`.

On Windows, the server automatically uses `.venv\Scripts\yt-dlp.exe`. On other systems, install `yt-dlp` on your PATH or set `YT_DLP_PATH`.

## Security check

With the API running on port 8787:

```powershell
.\security\vapt-api.ps1
npm audit
```

The API uses strict URL allowlisting, JSON/body limits, security headers, rate limits, resolver concurrency limits, process timeouts, and safe HTTPS output URL validation.

## Docker production deployment

```powershell
docker build -t fetchvids .
docker run --rm -p 8787:8787 fetchvids
```

Open `http://localhost:8787`. The image runs as a non-root user and includes Node.js, Python, FFmpeg, and pinned `yt-dlp` dependencies.

## Render deployment

Push this folder to a Git repository, then create a Render Blueprint from `render.yaml`. Alternatively, create a Docker Web Service from the included `Dockerfile`. Render supplies HTTPS and an `onrender.com` address.

Ad placeholders are disabled by default. Do not enable Google AdSense on the downloader surface; review the launch checklist for the policy-safe monetization path.

See [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md) for the verified cost breakdown, free-host choices, ad-approval limitations, and remaining launch requirements.

## SEO setup

The site is branded as **FetchVids** and includes a descriptive title, meta description, Open Graph/Twitter preview tags, a favicon, a web manifest, structured data, dynamic canonical URL injection, `/robots.txt`, and `/sitemap.xml`.

For best SEO after deployment, connect a real domain and optionally set `PUBLIC_SITE_URL=https://your-domain.com` in the hosting environment. If `PUBLIC_SITE_URL` is not set, FetchVids uses the current request host for canonical, robots, and sitemap URLs.

## Important

FetchVids only accepts supported public URLs. Do not add login cookies or private-account access. Instagram Stories commonly require authentication, so only Stories exposed publicly without login can resolve. Users should download only content they own or have permission to use. Review each platform’s terms, copyright law, your hosting provider’s policy, and your ad network’s policy before launch.
