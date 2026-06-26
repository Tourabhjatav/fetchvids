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
    question: `Is ${BRAND.name} free to use?`,
    answer: `${BRAND.name} is free during its public testing phase. Free-host limits and fair-use rate limits may apply.`
  },
  {
    question: "What links are supported?",
    answer: `${BRAND.name} supports public Instagram Reels, posts and accessible Stories, YouTube videos and Shorts, X/Twitter video posts, and Facebook videos and Reels.`
  },
  {
    question: "Where are downloaded videos saved?",
    answer: "Your browser normally saves the MP4 file in your device’s Downloads folder."
  },
  {
    question: "Can I download private or login-only media?",
    answer: `No. ${BRAND.name} does not use account cookies or bypass privacy controls. Private, friends-only, and login-only media are not supported.`
  },
  {
    question: `Is ${BRAND.name} affiliated with these platforms?`,
    answer: `No. ${BRAND.name} is independent and is not affiliated with Instagram, YouTube, X, Facebook, Meta, or Google.`
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
      setMessage("Paste a supported public Instagram, YouTube, X/Twitter, or Facebook link.");
      return;
    }

    setStatus("loading");
    setMessage(`Finding the best available ${platform.name} video…`);

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
        <label className="sr-only" htmlFor="media-url">Social media video URL</label>
        <input
          id="media-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="Paste a public video link…"
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
          {status === "loading" ? "Working…" : "Download"}
        </button>
      </form>
      <div className="form-meta">
        <p id="url-help"><span className="shield">◇</span> Only download content you own or have permission to use.</p>
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
          <h1 aria-label={`Download social videos with ${BRAND.name}`}>
            <span>Download</span><em>social videos</em><span>with {BRAND.name}</span>
          </h1>
          <p>Instagram, YouTube, X/Twitter and Facebook public links.<br /> Paste a shared URL—no account required.</p>
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

function HowItWorks() {
  const steps = [
    ["Copy the link", "Open a supported platform, choose a public video, and copy its share link."],
    ["Paste it here", `Drop the link into ${BRAND.name} and tap Download.`],
    ["Save your video", "Choose the available quality and save the file to your device."]
  ];
  return (
    <section className="how-section" id="how">
      <div className="section-shell">
        <h2>How it works</h2>
        <div className="steps">
          {steps.map(([title, text], index) => (
            <article className="step" key={title}>
              <span className="step-number">{index + 1}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              {index < steps.length - 1 ? <span className="step-arrow" aria-hidden="true">→</span> : null}
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
              <span className="play-button" aria-hidden="true">▶</span>
              <div className="video-controls" aria-hidden="true">
                <span>▶</span><span>00:00 / {result?.duration || "00:30"}</span><i /><span>◖</span><span>⛶</span>
              </div>
            </div>
            <div className="result-info">
              <h3>{result ? (result.title || "Your video is ready") : "Your video will appear here"}</h3>
              <p>{result ? `${result.platform || "Video"}  •  MP4  •  ${result.quality || "Best available"}` : "Paste a supported link above to begin."}</p>
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
        <h2>Frequently asked questions</h2>
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
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#copyright">Copyright</a>
        </div>
      </div>
      <p>{BRAND.name} is not affiliated with Instagram, YouTube, X, Facebook, Meta, or Google. Download only public content you own or have permission to use.</p>
      <p>© 2026 {BRAND.name}</p>
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
      <HowItWorks />
      <Result result={result} onReset={reset} />
      <FAQ />
      <Legal />
      <Footer />
    </>
  );
}
