import { useState } from "react";

const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === "true";
const BRAND = {
  name: "FetchVids",
  first: "Fetch",
  accent: "Vids"
};
const OWNER = {
  name: "Xyphora AI",
  url: "https://xyphora-ai.vercel.app/"
};

const ROUTES = {
  instagram: "/instagram-video-downloader/",
  facebook: "/facebook-video-downloader/",
  youtube: "/youtube-video-downloader/",
  x: "/x-twitter-video-downloader/",
  how: "/how-it-works/",
  faq: "/faq/",
  privacy: "/privacy/",
  terms: "/terms/",
  copyright: "/copyright/"
};

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

const PLATFORM_PAGES = {
  [ROUTES.instagram]: {
    key: "instagram",
    name: "Instagram",
    shortName: "Instagram",
    route: ROUTES.instagram,
    eyebrow: "Instagram downloader",
    title: "Instagram Video Downloader",
    heroLines: ["Download", "Instagram videos", "online"],
    description: "Paste an Instagram Reel, video post, or public Story link and save the available MP4 when the media is public and you have permission.",
    placeholder: "Paste an Instagram video or Reel link...",
    acceptedLinks: "Instagram Reels, video posts, TV-style links, and publicly accessible Story links.",
    unsupported: "Private profiles, friends-only posts, expired Stories, and login-only media are not supported.",
    cards: [
      ["Instagram Reels downloader", "Save public Reels from shared links when the source video is available without login."],
      ["Instagram video post saver", "Use public video post URLs and carousel posts that include video media."],
      ["Public Story support", "Story links can work while the Story is still live and accessible without authentication."],
      ["No Instagram login", "The downloader does not ask for your Instagram account or use private cookies."]
    ]
  },
  [ROUTES.facebook]: {
    key: "facebook",
    name: "Facebook",
    shortName: "Facebook",
    route: ROUTES.facebook,
    eyebrow: "Facebook downloader",
    title: "Facebook Video Downloader",
    heroLines: ["Download", "Facebook videos", "online"],
    description: "Paste a public Facebook video, Reel, Watch, or fb.watch link and save the available MP4 when the source can be resolved.",
    placeholder: "Paste a Facebook video or Reel link...",
    acceptedLinks: "Facebook Watch URLs, Reels, public page videos, shared video links, and fb.watch URLs.",
    unsupported: "Private profiles, friends-only posts, group-only videos, and login-only media are not supported.",
    cards: [
      ["Facebook video downloader", "Resolve public Facebook video links into downloadable MP4 options when available."],
      ["Facebook Reels downloader", "Use public Facebook Reel URLs without connecting an account."],
      ["fb.watch support", "Short fb.watch share links are accepted when they point to public video media."],
      ["Public pages and posts", "Download only videos you own or have permission to save from public Facebook pages or posts."]
    ]
  },
  [ROUTES.youtube]: {
    key: "youtube",
    name: "YouTube",
    shortName: "YouTube",
    route: ROUTES.youtube,
    eyebrow: "YouTube downloader",
    title: "YouTube Video Downloader",
    heroLines: ["Download", "YouTube videos", "online"],
    description: "Paste a public YouTube video, Shorts, live replay, or youtu.be link and save the available MP4 for content you are allowed to download.",
    placeholder: "Paste a YouTube video or Shorts link...",
    acceptedLinks: "YouTube watch pages, Shorts URLs, live replay URLs, embeds, and youtu.be links.",
    unsupported: "Private videos, members-only content, age-restricted videos, and login-only media are not supported.",
    cards: [
      ["YouTube video downloader", "Resolve public YouTube video pages into available MP4 options."],
      ["YouTube Shorts downloader", "Paste a public Shorts URL and download the available video format."],
      ["youtu.be links", "Short YouTube share URLs are supported when the video is public."],
      ["No playlist downloads", "The resolver is configured for one video at a time, which keeps downloads focused and fair."]
    ]
  },
  [ROUTES.x]: {
    key: "x-twitter",
    name: "X/Twitter",
    shortName: "X",
    route: ROUTES.x,
    eyebrow: "X video downloader",
    title: "X Twitter Video Downloader",
    heroLines: ["Download", "X videos", "online"],
    description: "Paste a public X or Twitter post URL and save the available MP4 when the post contains video media you have permission to download.",
    placeholder: "Paste an X or Twitter video post link...",
    acceptedLinks: "Public x.com and twitter.com status URLs that contain video media.",
    unsupported: "Protected accounts, deleted posts, login-only media, and posts without video are not supported.",
    cards: [
      ["X video downloader", "Use public x.com status links that include video media."],
      ["Twitter video downloader", "Older twitter.com post URLs are also accepted when the post is public."],
      ["MP4 result", "The page returns the available MP4 option when the source can be resolved."],
      ["Protected posts blocked", "The downloader does not bypass protected accounts or account-only media."]
    ]
  }
};

const PLATFORM_LINKS = Object.values(PLATFORM_PAGES);

const FAQS = [
  {
    question: "Which video sites does FetchVids support?",
    answer: `${BRAND.name} supports public Instagram, Facebook, YouTube, and X/Twitter video links that can be opened without a private login.`
  },
  {
    question: "How do I download an Instagram video?",
    answer: `Copy the Instagram video, Reel, post, or public Story link, paste it into ${BRAND.name}, and choose Download. If a safe MP4 is available, the result appears on the page.`
  },
  {
    question: "Can I download Facebook videos?",
    answer: "Public Facebook Watch, Reels, page videos, shared video URLs, and fb.watch links can work when the media is available without login."
  },
  {
    question: "Can I download YouTube Shorts?",
    answer: "Public YouTube Shorts links are accepted when the video is available to resolve. Private, members-only, and login-only videos are not supported."
  },
  {
    question: "Can I download X or Twitter videos?",
    answer: "Public x.com and twitter.com status links with video media are supported. Protected accounts and deleted posts are not supported."
  },
  {
    question: "Where are downloaded videos saved?",
    answer: "Your browser normally saves the MP4 file in your device's Downloads folder, unless you choose a different location."
  },
  {
    question: "Is it legal to download videos?",
    answer: "Only download public content you own, content in the public domain, or content you have permission to save. Do not use the service to infringe copyright or bypass platform access controls."
  },
  {
    question: `Is ${BRAND.name} affiliated with these platforms?`,
    answer: `No. ${BRAND.name} is independent and is not affiliated with Instagram, Meta, Facebook, YouTube, Google, X, or Twitter.`
  }
];

const HOW_DETAILS = [
  {
    title: "Copy the public video link",
    text: "Open Instagram, Facebook, YouTube, or X/Twitter, choose a public video, and copy the original share link. A clean share URL usually resolves better than a copied tracking URL."
  },
  {
    title: "Paste the URL into FetchVids",
    text: "Place the link in the downloader field. The site checks that the URL is from a supported platform before sending it to the resolver."
  },
  {
    title: "Wait for the available MP4",
    text: "If the media is public and available, FetchVids returns the best downloadable MP4 option it can find, plus title, thumbnail, duration, and quality when available."
  },
  {
    title: "Save only permitted content",
    text: "Download your own content, public-domain content, or videos you have permission to save. Do not use the tool to bypass privacy controls or copyright rules."
  }
];

const PRIVACY_SECTIONS = [
  {
    title: "No account required",
    text: `${BRAND.name} does not ask users to create an account, submit a password, or connect Instagram, Facebook, YouTube, or X/Twitter profiles. The downloader works from public media URLs.`
  },
  {
    title: "Submitted links",
    text: "When you paste a URL, the server processes that URL so it can try to resolve public media. Submitted links may appear in temporary server, hosting, security, or rate-limit logs."
  },
  {
    title: "IP addresses and security logs",
    text: "The hosting provider may process IP addresses, request times, user-agent data, and error logs to keep the service available, prevent abuse, and troubleshoot failures."
  },
  {
    title: "No sale of submitted links",
    text: `${BRAND.name} does not sell submitted links. If analytics, advertising, or third-party tracking is added later, this privacy page should be updated before those services are enabled.`
  },
  {
    title: "Private media",
    text: "The service is not designed to access private, friends-only, login-only, members-only, or restricted media. Do not submit URLs you are not allowed to access or save."
  }
];

const TERMS_SECTIONS = [
  {
    title: "Permitted use",
    text: `Use ${BRAND.name} only for content you own, content in the public domain, or content you have permission to download. You are responsible for how you use any saved file.`
  },
  {
    title: "No privacy bypassing",
    text: "Do not use the service to bypass platform restrictions, authentication, paywalls, privacy controls, account rules, or technical access controls."
  },
  {
    title: "Platform independence",
    text: `${BRAND.name} is independent. It is not affiliated with Instagram, Meta, Facebook, YouTube, Google, X, or Twitter, and it does not represent those platforms.`
  },
  {
    title: "Service availability",
    text: "Download availability can change when platforms update pages, restrict media, remove posts, require login, block traffic, or change video delivery systems."
  },
  {
    title: "Fair use limits",
    text: "Automated abuse, excessive requests, scraping, attempts to overload the resolver, or attempts to evade rate limits may be blocked without notice."
  }
];

const COPYRIGHT_SECTIONS = [
  {
    title: "No public media library",
    text: `${BRAND.name} is a technical link-processing tool. It does not operate a searchable public video library and does not claim ownership of user-submitted media.`
  },
  {
    title: "User responsibility",
    text: "Users must confirm they have the right to download and use a video. Saving someone else's work may require permission from the creator or rights holder."
  },
  {
    title: "Rights-holder review",
    text: "A rights holder can request review of a supported URL by identifying the copyrighted work, the exact URL, contact details, and a good-faith statement of ownership or authorization."
  },
  {
    title: "Repeat abuse",
    text: "Requests that appear to infringe rights, bypass restrictions, or abuse the downloader may be limited or blocked. The site operator should publish a working abuse contact before advertising is enabled."
  }
];

function getPlatform(value) {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:") return null;
    return PLATFORM_RULES.find((platform) =>
      platform.hosts.has(parsed.hostname.toLowerCase()) && platform.path.test(parsed.pathname)
    ) || null;
  } catch {
    return null;
  }
}

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return ROUTES.instagram;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function BrandMark({ small = false }) {
  return (
    <svg
      className={small ? "brand-mark brand-mark--small" : "brand-mark"}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mark-gradient" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#075BEA" />
          <stop offset=".55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#FF3538" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="38" height="38" rx="13" fill="url(#mark-gradient)" />
      <path d="M17 15h16M17 24h11M17 33h7" />
      <path className="brand-mark__play" d="M29 25.2v-8.4L36 21l-7 4.2Z" />
    </svg>
  );
}

function BrandLogo() {
  return (
    <>
      <BrandMark small />
      <span>{BRAND.first}</span><strong>{BRAND.accent}</strong>
    </>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14" />
    </svg>
  );
}

function AdSlot({ className = "" }) {
  if (!ADS_ENABLED) return null;
  return (
    <aside className={`ad-slot ${className}`} aria-label="Advertisement">
      <span>Advertisement</span>
    </aside>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href={ROUTES.instagram} aria-label={`${BRAND.name} home`}>
        <BrandLogo />
      </a>
      <nav aria-label="Main navigation">
        <a href={ROUTES.instagram}>Instagram</a>
        <a href={ROUTES.facebook}>Facebook</a>
        <a href={ROUTES.youtube}>YouTube</a>
        <a href={ROUTES.x}>X/Twitter</a>
        <a href={ROUTES.faq}>FAQ</a>
      </nav>
      <a className="privacy-link" href={ROUTES.privacy}>Privacy</a>
    </header>
  );
}

function Downloader({ focusPage, onResult, result, onReset }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const platform = getPlatform(url);

  async function submit(event) {
    event.preventDefault();
    if (!platform) {
      setStatus("error");
      setMessage("Paste a supported public Instagram, Facebook, YouTube, or X/Twitter video link.");
      return;
    }

    setStatus("loading");
    setMessage(`Finding the best available ${platform.name} video...`);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The video could not be resolved.");
      onResult(data);
      setStatus("success");
      setMessage("");
      document.querySelector("#result")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  function reset() {
    setUrl("");
    setStatus("idle");
    setMessage("");
    onReset();
    document.querySelector("#top")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <form className="download-form" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="media-url">{focusPage.shortName} video URL</label>
        <input
          id="media-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={focusPage.placeholder}
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          aria-describedby="url-help form-message"
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? <span className="spinner" /> : null}
          {status === "loading" ? "Working..." : "Download"}
        </button>
      </form>
      <div className="form-meta">
        <p id="url-help"><span className="shield">OK</span> Only download content you own or have permission to use.</p>
        <p id="form-message" className={`form-message form-message--${status}`} aria-live="polite">
          {message}
        </p>
      </div>
      {result ? (
        <button className="text-button top-reset" type="button" onClick={reset}>Try another link</button>
      ) : null}
    </>
  );
}

function PlatformLinks({ current }) {
  return (
    <section className="platform-strip" aria-label="Video downloader pages">
      <div className="section-shell platform-strip__inner">
        {PLATFORM_LINKS.map((page) => (
          <a className={page.key === current ? "platform-pill platform-pill--active" : "platform-pill"} href={page.route} key={page.key}>
            {page.shortName} downloader
          </a>
        ))}
      </div>
    </section>
  );
}

function Result({ result, onReset }) {
  return (
    <section className="result-section" id="result">
      <div className="section-shell">
        <h2>Download result</h2>
        <div className="result-layout">
          <div className={`result-card ${result ? "result-card--active" : ""}`}>
            <div className="video-preview">
              {result?.thumbnail ? <img src={result.thumbnail} alt="" /> : null}
              <span className="play-button" aria-hidden="true">Play</span>
              <div className="video-controls" aria-hidden="true">
                <span>Play</span><span>00:00 / {result?.duration || "00:30"}</span><i /><span>HD</span><span>Full</span>
              </div>
            </div>
            <div className="result-info">
              <h3>{result ? (result.title || "Your video is ready") : "Your video will appear here"}</h3>
              <p>{result ? `${result.platform || "Video"}  |  MP4  |  ${result.quality || "Best available"}` : "Paste a supported link above to begin."}</p>
              {result ? (
                <>
                  <a className="download-button" href={result.downloadUrl} download rel="nofollow">
                    <DownloadIcon /> Download MP4
                  </a>
                  <button className="text-button" type="button" onClick={onReset}>Try another link</button>
                </>
              ) : (
                <a className="download-button download-button--disabled" href="#top">Paste a link</a>
              )}
            </div>
          </div>
          <AdSlot className="ad-slot--side" />
        </div>
      </div>
    </section>
  );
}

function PlatformDownloaderPage({ page }) {
  const [result, setResult] = useState(null);
  const reset = () => setResult(null);

  return (
    <>
      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{page.eyebrow}</p>
            <h1 aria-label={`${page.title} with ${BRAND.name}`}>
              <span>{page.heroLines[0]}</span><em>{page.heroLines[1]}</em><span>{page.heroLines[2]}</span>
            </h1>
            <p>{page.description}</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="ribbon ribbon--back" />
            <span className="ribbon ribbon--front" />
          </div>
          <Downloader focusPage={page} onResult={setResult} result={result} onReset={reset} />
          <AdSlot className="ad-slot--wide" />
        </section>
      </main>
      <PlatformLinks current={page.key} />
      <section className="instagram-section">
        <div className="section-shell instagram-shell">
          <div className="instagram-copy">
            <p className="eyebrow">{page.title}</p>
            <h2>{page.title} for public links</h2>
            <p>{BRAND.name} is a browser-based downloader for public {page.name} videos. Paste a supported URL, let the resolver check the source, and save the available MP4 when the media can be reached publicly.</p>
            <p><strong>Supported:</strong> {page.acceptedLinks}</p>
            <p><strong>Not supported:</strong> {page.unsupported}</p>
          </div>
          <div className="format-grid" aria-label={`${page.name} download features`}>
            {page.cards.map(([title, text]) => (
              <article className="format-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Result result={result} onReset={reset} />
    </>
  );
}

function HowPage() {
  return (
    <main className="page-main">
      <PageHero
        eyebrow="How it works"
        title="How to download videos from Instagram, Facebook, YouTube, and X"
        description="Follow these steps to save a public social video when you own the content or have permission to download it."
      />
      <PlatformLinks />
      <section className="how-section">
        <div className="section-shell">
          <div className="detail-grid">
            {HOW_DETAILS.map((item, index) => (
              <article className="detail-card" key={item.title}>
                <span className="step-number">{index + 1}</span>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="content-section">
        <div className="section-shell two-column">
          <article>
            <h2>Tips for better results</h2>
            <p>Use the original platform share link instead of a shortened tracking URL. Public posts usually resolve more reliably than expired Stories, protected posts, members-only videos, or group-only media.</p>
            <p>If the page opens only after signing in, the downloader should not access it. Try a different public URL or ask the content owner for permission and a shareable file.</p>
          </article>
          <article>
            <h2>Why a link may fail</h2>
            <p>Platforms may remove videos, restrict regions, change media delivery, require login, or block automated resolution. A failed download does not always mean the URL is wrong.</p>
            <p>{BRAND.name} also rejects unsupported schemes, private account links, and URLs that do not match the supported platform patterns.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

function FAQPage() {
  return (
    <main className="page-main">
      <PageHero
        eyebrow="FAQ"
        title="Social video downloader questions"
        description="Answers about supported Instagram, Facebook, YouTube, and X/Twitter links, private media, download locations, safety, and responsible use."
      />
      <PlatformLinks />
      <section className="faq-section faq-section--page">
        <div className="section-shell">
          <div className="faq-list faq-list--static">
            {FAQS.map((item) => (
              <article className="faq-item faq-item--open" key={item.question}>
                <h2>{item.question}</h2>
                <div className="faq-answer"><p>{item.answer}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function PolicyPage({ eyebrow, title, description, sections }) {
  return (
    <main className="page-main">
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <section className="content-section">
        <div className="section-shell policy-shell">
          {sections.map((item) => (
            <article className="policy-item" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function PageHero({ eyebrow, title, description }) {
  return (
    <section className="page-hero">
      <div className="section-shell">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <a className="brand" href={ROUTES.instagram} aria-label={`${BRAND.name} home`}><BrandLogo /></a>
        <div className="footer-links">
          <a href={ROUTES.instagram}>Instagram</a>
          <a href={ROUTES.facebook}>Facebook</a>
          <a href={ROUTES.youtube}>YouTube</a>
          <a href={ROUTES.x}>X/Twitter</a>
          <a href={ROUTES.how}>How it works</a>
          <a href={ROUTES.faq}>FAQ</a>
          <a href={ROUTES.privacy}>Privacy</a>
          <a href={ROUTES.terms}>Terms</a>
          <a href={ROUTES.copyright}>Copyright</a>
        </div>
      </div>
      <p>{BRAND.name} is not affiliated with Instagram, Meta, Facebook, YouTube, Google, X, or Twitter. Download only public content you own or have permission to use.</p>
      <p>
        Developed by <a className="owner-link" href={OWNER.url} target="_blank" rel="noopener noreferrer">{OWNER.name}</a>.
      </p>
      <p>Copyright 2026 {BRAND.name}</p>
    </footer>
  );
}

function CurrentPage() {
  const path = normalizePath(window.location.pathname);
  const platformPage = PLATFORM_PAGES[path];

  if (platformPage) return <PlatformDownloaderPage page={platformPage} />;
  if (path === ROUTES.how) return <HowPage />;
  if (path === ROUTES.faq) return <FAQPage />;
  if (path === ROUTES.privacy) {
    return (
      <PolicyPage
        eyebrow="Privacy"
        title="Privacy policy"
        description="How FetchVids handles public links, request data, logs, and privacy-sensitive media."
        sections={PRIVACY_SECTIONS}
      />
    );
  }
  if (path === ROUTES.terms) {
    return (
      <PolicyPage
        eyebrow="Terms"
        title="Terms of use"
        description="Rules for using FetchVids responsibly with public media and permission-based downloads."
        sections={TERMS_SECTIONS}
      />
    );
  }
  if (path === ROUTES.copyright) {
    return (
      <PolicyPage
        eyebrow="Copyright"
        title="Copyright and rights-holder information"
        description="Information for creators, rights holders, and users about ownership, permission, and review requests."
        sections={COPYRIGHT_SECTIONS}
      />
    );
  }
  return <PlatformDownloaderPage page={PLATFORM_PAGES[ROUTES.instagram]} />;
}

export default function App() {
  return (
    <>
      <Header />
      <CurrentPage />
      <Footer />
    </>
  );
}
