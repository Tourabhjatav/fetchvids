import { useState } from "react";

const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === "true";
const BRAND = {
  name: "FetchVids",
  first: "Fetch",
  accent: "Vids"
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

const FAQS = [
  {
    question: "How do I download an Instagram video?",
    answer: `Copy the Instagram video, Reel, post, or public Story link, paste it into ${BRAND.name}, and choose Download. If a safe MP4 is available, the result appears on the page.`
  },
  {
    question: "Can I download Instagram Reels?",
    answer: `${BRAND.name} supports public Instagram Reel links when the media is available without login and the source can be resolved by the downloader engine.`
  },
  {
    question: "What Instagram links are supported?",
    answer: "Public Instagram Reels, video posts, TV-style links, and publicly accessible Story links are accepted. Private, login-only, friends-only, or expired content is not supported."
  },
  {
    question: "Where are downloaded Instagram videos saved?",
    answer: "Your browser normally saves the MP4 file in your device's Downloads folder, unless you choose a different location."
  },
  {
    question: "Why is an Instagram video not downloading?",
    answer: "The video may be private, removed, region-limited, login-only, temporarily blocked, or unavailable as a direct MP4. Try a public Instagram link that opens in a browser without signing in."
  },
  {
    question: "Is it legal to download Instagram videos?",
    answer: "Only download public content you own, content in the public domain, or content you have permission to save. Do not use the service to infringe copyright or bypass platform access controls."
  },
  {
    question: `Is ${BRAND.name} affiliated with Instagram?`,
    answer: `No. ${BRAND.name} is independent and is not affiliated with Instagram, Meta, YouTube, X, Facebook, or Google.`
  }
];

const INSTAGRAM_FORMATS = [
  {
    title: "Instagram video downloader",
    text: "Paste a public Instagram video URL and resolve the available MP4 download option in your browser."
  },
  {
    title: "Instagram Reels downloader",
    text: "Save public Reels from shared links when the source is available without a private account or login wall."
  },
  {
    title: "Instagram post video saver",
    text: "Use links from video posts and carousel posts that include public video media."
  },
  {
    title: "Public Story support",
    text: "Accessible Story URLs can work while the Story is still live and publicly reachable."
  }
];

const LEGAL_ITEMS = [
  {
    id: "privacy",
    title: "Privacy",
    text: `${BRAND.name} does not require an account. Submitted links are processed by our server to resolve public media. Hosting providers may record IP addresses and request logs for security and rate limiting. We do not sell submitted links. If advertising or analytics is enabled later, this policy must be updated before those services are activated.`
  },
  {
    id: "terms",
    title: "Terms",
    text: `Use ${BRAND.name} only for public content you own, content in the public domain, or content you have explicit permission to save. Do not use the service to bypass access controls, download private media, infringe copyright, or violate a platform's terms. Availability is provided without warranty and abusive requests may be limited.`
  },
  {
    id: "copyright",
    title: "Copyright",
    text: `${BRAND.name} is a technical link-processing tool and does not host a public media library. Rights holders may request review of a supported URL by identifying the copyrighted work, the exact URL, their contact details, and a good-faith statement. The site operator must publish a working abuse contact before advertising is enabled.`
  }
];

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
      <a className="brand" href="#top" aria-label={`${BRAND.name} home`}>
        <BrandLogo />
      </a>
      <nav aria-label="Main navigation">
        <a href="#instagram">Instagram downloader</a>
        <a href="#how">How it works</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a className="privacy-link" href="#privacy">Privacy</a>
    </header>
  );
}

function Downloader({ onResult, result, onReset }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const platform = getPlatform(url);

  async function submit(event) {
    event.preventDefault();
    if (!platform) {
      setStatus("error");
      setMessage("Paste a supported public Instagram, YouTube, X/Twitter, or Facebook video link.");
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
        <label className="sr-only" htmlFor="media-url">Instagram video URL</label>
        <input
          id="media-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="Paste an Instagram video or Reel link..."
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

function Hero({ onResult, result, onReset }) {
  return (
    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <h1 aria-label={`Download Instagram videos online with ${BRAND.name}`}>
            <span>Download</span><em>Instagram videos</em><span>online</span>
          </h1>
          <p>
            Paste an Instagram Reel, video post, or public Story link and save the available MP4.
            Also supports public YouTube, X/Twitter, and Facebook video links.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="ribbon ribbon--back" />
          <span className="ribbon ribbon--front" />
        </div>
        <Downloader onResult={onResult} result={result} onReset={onReset} />
        <AdSlot className="ad-slot--wide" />
      </section>
    </main>
  );
}

function InstagramGuide() {
  return (
    <section className="instagram-section" id="instagram">
      <div className="section-shell instagram-shell">
        <div className="instagram-copy">
          <p className="eyebrow">Download Instagram video</p>
          <h2>Instagram video downloader for Reels, posts, and public Stories</h2>
          <p>
            {BRAND.name} is built for one simple task: paste a public Instagram URL and get a clean
            download option when the media can be resolved. It works in the browser, does not need
            an Instagram account, and keeps the downloader focused on public links.
          </p>
          <p>
            For the best result, use the share link from Instagram itself. If the video is private,
            expired, login-only, or blocked by the source platform, the downloader will not bypass
            those restrictions.
          </p>
        </div>
        <div className="format-grid" aria-label="Supported Instagram download types">
          {INSTAGRAM_FORMATS.map((item) => (
            <article className="format-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Copy the Instagram link", "Open Instagram, choose a public Reel, video post, or Story, and copy its share link."],
    ["Paste it here", `Drop the link into ${BRAND.name} and tap Download.`],
    ["Save your video", "Choose the available quality and save the MP4 file to your device."]
  ];
  return (
    <section className="how-section" id="how">
      <div className="section-shell">
        <h2>How to download an Instagram video</h2>
        <div className="steps">
          {steps.map(([title, text], index) => (
            <article className="step" key={title}>
              <span className="step-number">{index + 1}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              {index < steps.length - 1 ? <span className="step-arrow" aria-hidden="true">-&gt;</span> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Result({ result, onReset }) {
  return (
    <section className="result-section" id="result">
      <div className="section-shell">
        <h2>Ready when you are</h2>
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

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="faq-section" id="faq">
      <div className="section-shell">
        <div className="clip-rule"><BrandMark small /></div>
        <h2>Instagram video downloader FAQ</h2>
        <div className="faq-list">
          {FAQS.map((item, index) => {
            const expanded = open === index;
            return (
              <article className={`faq-item ${expanded ? "faq-item--open" : ""}`} key={item.question}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? -1 : index)}
                >
                  <span>{item.question}</span><span className="chevron" aria-hidden="true" />
                </button>
                <div className="faq-answer" hidden={!expanded}><p>{item.answer}</p></div>
              </article>
            );
          })}
        </div>
        <AdSlot className="ad-slot--wide ad-slot--footer" />
      </div>
    </section>
  );
}

function Legal() {
  return (
    <section className="legal-section" aria-labelledby="legal-heading">
      <div className="section-shell">
        <h2 id="legal-heading">Use {BRAND.name} responsibly</h2>
        <div className="legal-layout">
          {LEGAL_ITEMS.map((item) => (
            <article id={item.id} className="legal-item" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <a className="brand" href="#top" aria-label={`${BRAND.name} home`}><BrandLogo /></a>
        <div className="footer-links">
          <a href="#instagram">Instagram downloader</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#copyright">Copyright</a>
        </div>
      </div>
      <p>{BRAND.name} is not affiliated with Instagram, Meta, YouTube, X, Facebook, or Google. Download only public content you own or have permission to use.</p>
      <p>Copyright 2026 {BRAND.name}</p>
    </footer>
  );
}

export default function App() {
  const [result, setResult] = useState(null);
  const reset = () => setResult(null);
  return (
    <>
      <Header />
      <Hero onResult={setResult} result={result} onReset={reset} />
      <InstagramGuide />
      <HowItWorks />
      <Result result={result} onReset={reset} />
      <FAQ />
      <Legal />
      <Footer />
    </>
  );
}
