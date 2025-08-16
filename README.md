<div align="center">
  <img src="icons/logo.png" width="96" height="96" alt="logo"><br/>
  <h1>Shodan Page Scraper</h1>
  <p>Chrome (MV3) extension to scrape <code>shodan.io</code> host & domain pages and export IPs, open ports, subdomains, and DNS records.</p>
  <p><strong>Made by Mahmoud Attia (0xelkot)</strong></p>
  <video src="assets/demo.mp4" width="640" controls></video>
</div>

---

## ✨ Features
- Scrapes data from Shodan pages:
  - IPs (from title, DNS A, and page text)
  - Open ports (e.g., 80, 443, 8443)
  - Subdomains (right panel on domain pages)
  - Domain records (host / type / value table)
- Deduplicates results and shows a JSON preview
- One-click export to **CSV** or **JSON**
- Smart filenames based on URL, e.g.:
  - `https://www.shodan.io/host/35.239.225.225` → `35-239-225-225.json`

## 🧩 Install (Developer Mode)
1. Download the repo code (`Code → Download ZIP`) and unzip it.
2. Visit `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select this folder.

> This is a pure MV3 extension — no external dependencies.

## 🚀 Usage
1. Open a Shodan page like:
   - `https://www.shodan.io/host/<ip>`
2. Click the extension icon → **Scrape page**.
3. Optionally scroll the page first to ensure lazy-loaded sections (Open Ports / Subdomains) are present.
4. Export your data with **Export CSV** or **Export JSON**.

## 📁 Output schema (JSON/CSV)
Each row:
```json
{
  "page": "host|generic",
  "type": "ip|port|subdomain|record_host",
  "value": "string",
  "source": "page URL",
  "meta": { "proto": "tcp|udp", "rtype": "A|CNAME|...", "target": "x.y.z.w", "role": "page_title|DNS A|..." },
  "scraped_at": "ISO-8601 timestamp"
}
```

## 🔒 Permissions
- `activeTab`, `scripting`, `downloads`, `storage`
- Host permissions: `https://*.shodan.io/*`

## 🛠 Development
- The popup injects `content-script.js` using `chrome.scripting.executeScript` and then calls the global extractor `window.__SHODAN_SCRAPER_EXTRACT()`.
- Selectors target Shodan sections (`Open Ports`, `Domain Records`, `Subdomains`), with regex fallbacks (IPs, domains, `NNN/tcp`).
- To package:
  ```bash
  zip -r shodan-page-scraper.zip .
  ```

## 🗺 Roadmap
- [ ] Auto-scroll to load all lazy sections
- [ ] NDJSON export
- [ ] Copy-to-clipboard
- [ ] Auto-run on certain URL patterns with a toggle
- [ ] Firefox Port (MV2 polyfill or MV3 compatibility)

## 🤝 Contributing
PRs welcome! Please keep code simple (no heavy frameworks) and test on both `/host` and `/domain` pages.

## 📜 License
MIT — see [LICENSE](LICENSE).
