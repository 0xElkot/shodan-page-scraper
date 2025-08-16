(function init() {
  function uniqueBy(arr, keyFn) { const m = new Map(); for (const x of arr) m.set(keyFn(x), x); return [...m.values()]; }
  function text(el) { return (el?.textContent || '').trim(); }

  function collectByRegex() {
    const bodyText = document.body.innerText || '';
    const results = [];
    const ipRe = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    for (const m of bodyText.matchAll(ipRe)) results.push({type: 'ip', value: m[0], meta: {}, source: location.href});
    const domainRe = /\b[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\b/g;
    for (const m of bodyText.matchAll(domainRe)) {
      const v = m[0];
      if (/\./.test(v) && !/[,;:]/.test(v) && v.length <= 253) results.push({type: 'domain', value: v.toLowerCase(), meta: {}, source: location.href});
    }
    const portRe = /\b(\d{1,5})\s*\/\s*(tcp|udp)\b/gi;
    for (const m of bodyText.matchAll(portRe)) results.push({type: 'port', value: m[1], meta: {proto: m[2].toLowerCase()}, source: location.href});
    return results;
  }

  function collectFromKnownSections() {
    const results = [];
    const subPanel = Array.from(document.querySelectorAll('h2, h3, h4')).find(h => /Subdomains/i.test(h.textContent));
    if (subPanel) {
      const box = subPanel.parentElement;
      const items = box.querySelectorAll('li, a, div');
      for (const el of items) {
        const v = text(el);
        if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(v)) results.push({type: 'subdomain', value: v.toLowerCase(), meta: {}, source: location.href});
      }
    }
    const domainRecordsHeader = Array.from(document.querySelectorAll('h2, h3, h4')).find(h => /Domain Records/i.test(h.textContent));
    if (domainRecordsHeader) {
      const table = domainRecordsHeader.parentElement.querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        for (const tr of rows) {
          const cols = tr.querySelectorAll('td');
          if (cols.length >= 3) {
            const host = text(cols[0]);
            const type = text(cols[1]);
            const value = text(cols[2]);
            if (host) results.push({type: 'record_host', value: host, meta: {rtype: type, target: value}, source: location.href});
            if (value && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) results.push({type: 'ip', value, meta: {via: 'DNS A'}, source: location.href});
          }
        }
      }
    }
    const openPortsHeader = Array.from(document.querySelectorAll('h2, h3, h4')).find(h => /Open Ports/i.test(h.textContent));
    if (openPortsHeader) {
      const portChips = openPortsHeader.parentElement.querySelectorAll('a, span, div');
      for (const el of portChips) {
        const v = text(el);
        if (/^\d{1,5}$/.test(v)) results.push({type: 'port', value: v, meta: {proto: 'tcp'}, source: location.href});
      }
    }
    const hostTitle = document.querySelector('h1, header h1, .host-title');
    if (hostTitle) {
      const v = text(hostTitle);
      if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(v)) results.push({type: 'ip', value: v.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)[0], meta: {role: 'page_title'}, source: location.href});
      else if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v)) results.push({type: 'domain', value: v.toLowerCase(), meta: {role: 'page_title'}, source: location.href});
    }
    return uniqueBy(results, r => `${r.type}|${r.value}`);
  }

  function extract() {
    const structured = collectFromKnownSections();
    const loose = collectByRegex();
    const key = (r) => `${r.type}|${r.value}`;
    const map = new Map(structured.map(r => [key(r), r]));
    for (const r of loose) if (!map.has(key(r))) map.set(key(r), r);
    const pageType = /\/domain\//.test(location.href) ? 'domain' : (/\/host\//.test(location.href) ? 'host' : 'generic');
    const ts = new Date().toISOString();
    return [...map.values()].map(r => ({ page: pageType, type: r.type, value: r.value, source: r.source || location.href, meta: r.meta || {}, scraped_at: ts }));
  }
  window.__SHODAN_SCRAPER_EXTRACT = extract;
})();