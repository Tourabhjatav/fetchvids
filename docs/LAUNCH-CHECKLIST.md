# FetchVids launch and earning checklist

## Cost of the current stack

| Component | Cost | Notes |
|---|---:|---|
| React, Vite, Express | Free | Open-source packages |
| yt-dlp | Free | Open-source executable; no API key |
| FFmpeg | Free | Open-source executable |
| Google Fonts | Free | External font delivery, not a paid API |
| Instagram, YouTube, X, Facebook | No paid API used | FetchVids resolves public URLs through yt-dlp; platform availability can change |
| Render free web service | Free within current limits | Sleeps after inactivity and is not recommended by Render for production |

There is no paid API key in the project.

## Before public launch

- Deploy the Docker service and test one lawful public sample from each supported platform.
- Buy or connect a domain; free subdomains are useful for testing but weaker for branding and ad approval.
- Set `PUBLIC_SITE_URL=https://your-domain.com` after connecting the domain so canonical, sitemap, and robots URLs are stable.
- Publish a real operator/support email for privacy and copyright notices.
- Replace placeholder legal wording with operator name, country, and contact details.
- Add uptime monitoring, error logging, bandwidth alerts, and a deletion/abuse process.
- Keep `yt-dlp`, Node.js, Python, FFmpeg, and system packages updated.
- Do not enable ads until the chosen ad network approves the exact live domain.

## Advertising reality

Do **not** put Google AdSense on the downloader surface. Google Publisher Policies prohibit copyright infringement and specifically identify pages that assist users in downloading streaming videos when the content provider prohibits it. Google also requires original, high-quality publisher content. A permission disclaimer does not override those policies.

Safer earning options:

1. Keep this downloader ad-free and offer voluntary donations or direct sponsorship only after reviewing each platform and sponsor policy.
2. Build a separate original-content site with creator tutorials, lawful native export/download guides, troubleshooting, and software comparisons. Apply for AdSense on that content site—not on prohibited downloader pages.
3. Use clearly disclosed affiliate links in original articles where the affiliate program permits your traffic and content.

Ad placeholders are disabled by default. `VITE_ADS_ENABLED=true` only reveals placeholders; it does not install an ad network or make the site policy-compliant.

## Free-host choices

1. **Render free** — easiest with the included `render.yaml`; good for validation and very low traffic. Render says free services are not for production, spin down after 15 idle minutes, and can be suspended for unusually high service-initiated internet traffic.
2. **Koyeb free instance** — supports a small free web service in supported regions; suitable for testing a Dockerized service.
3. **Oracle Cloud Always Free VM** — more operational work, but the best chance of an always-on free server if capacity is available. You maintain Linux, TLS, firewall, updates, and monitoring.

Cloudflare Pages, GitHub Pages, Netlify static hosting, and similar static hosts cannot run this backend because it needs a long-lived Node process plus Python/yt-dlp and FFmpeg.
