# FetchVids VAPT Report

Assessment date: June 25, 2026  
Target: local production build at `http://localhost:8787`  
Scope: frontend, Express API, URL validation, process invocation, dependencies, HTTP behavior, and deployment configuration.

## Executive summary

No open critical, high, medium, or low application findings remain from this assessment. Four public-launch hardening gaps were confirmed and remediated:

| Finding | Initial severity | Resolution |
|---|---:|---|
| Missing browser security headers | Medium | Added Helmet CSP, anti-framing, MIME-sniffing, referrer, HSTS in production, and permissions policies |
| Unrestricted expensive resolver calls | High | Added per-IP rate limits, a resolver-specific limit, and a concurrent resolver ceiling |
| Incomplete malformed/oversized request handling | Medium | Added strict JSON content type, a 2 KB body limit, and generic JSON errors |
| Unvalidated media URLs returned to the browser | Medium | Only HTTPS thumbnail and download URLs are now returned |

Additional hardening includes strict platform hostname/path allowlisting, URL length/port/userinfo rejection, `execFile` process invocation without a shell, process/socket/request timeouts, disabled yt-dlp config/cache loading, generic error messages, non-root Docker execution, pinned Python dependencies, and graceful shutdown.

## Test results

- `npm audit`: 0 known vulnerabilities.
- `pip-audit -r requirements.txt`: no known vulnerabilities.
- Automated API VAPT: all checks passed; see `vapt-results.json`.
- SSRF-shaped userinfo URL: rejected with HTTP 400.
- Untrusted, suffix-confusion, HTTP, and non-standard-port URLs: rejected with HTTP 400.
- Command-injection-shaped input: no execution; generic resolver failure only.
- XSS-shaped input: rejected and not reflected.
- Malformed JSON: HTTP 400 without stack disclosure.
- Oversized JSON body: HTTP 413.
- Non-JSON request: HTTP 415.
- Unknown API route and method tampering: JSON HTTP 404.
- Rate limiting: HTTP 429 observed.
- Three simultaneous resolver requests with a ceiling of two: third request rejected with HTTP 503.
- Cross-origin probe: no permissive `Access-Control-Allow-Origin` response.
- Production browser check: page rendered correctly with no console warnings or errors under CSP.

## Residual risks and limitations

- This is a practical application VAPT, not a formal third-party penetration-test certification.
- No authenticated features exist, so authentication, session, authorization, and account-recovery testing were not applicable.
- A full external infrastructure scan must be repeated against the final public hostname after deployment.
- The application deliberately asks yt-dlp to contact allowlisted social platforms. Security still depends partly on timely yt-dlp, Node.js, Python, and OS updates.
- Public downloader services are abuse-prone. Production should use paid, monitored hosting, bandwidth/spend alerts, centralized logs, and stronger distributed rate limiting if multiple instances are added.
- Platform terms, copyright obligations, ad-network policies, and hosting acceptable-use rules require separate legal/compliance review.

## Methodology references

- OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- OWASP REST Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- Express production security guidance: https://expressjs.com/en/advanced/best-practice-security.html
