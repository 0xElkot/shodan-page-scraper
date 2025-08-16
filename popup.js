/* global chrome */
const scrapeBtn = document.getElementById('scrape');
const clearBtn = document.getElementById('clear');
const exportCSVBtn = document.getElementById('exportCSV');
const exportJSONBtn = document.getElementById('exportJSON');
const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  return tab;
}

function setStatus(msg) { statusEl.textContent = msg; }

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

function makeBaseFromUrl(u) {
  try {
    const url = new URL(u);
    let token = url.pathname.split('/').filter(Boolean).pop() || url.host;
    token = token.replace(/\.+/g, '-').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    return token.toLowerCase() || 'shodan';
  } catch {
    return 'shodan';
  }
}

async function refreshPreview() {
  const {data = [], lastBase = 'shodan'} = await chrome.storage.local.get(['data','lastBase']);
  preview.value = JSON.stringify(data, null, 2);
  setStatus(`Stored: ${data.length} rows. Base name: ${lastBase}`);
}

async function ensureExtractor(tabId) {
  await chrome.scripting.executeScript({ target: {tabId}, files: ['content-script.js'] });
}

scrapeBtn.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return setStatus('No active tab.');
  const base = makeBaseFromUrl(tab.url);
  try {
    setStatus('Injecting extractor…');
    await ensureExtractor(tab.id);
    setStatus('Scraping…');
    const [{result}] = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => (typeof window.__SHODAN_SCRAPER_EXTRACT === 'function' ? window.__SHODAN_SCRAPER_EXTRACT() : [])
    });
    const rows = Array.isArray(result) ? result : [];
    const {data: existing = []} = await chrome.storage.local.get('data');
    const key = (r) => `${r.type}|${r.value}|${r.source}`;
    const map = new Map(existing.map(r => [key(r), r]));
    for (const r of rows) map.set(key(r), r);
    const merged = [...map.values()];
    await chrome.storage.local.set({data: merged, lastBase: base});
    await refreshPreview();
    setStatus(rows.length ? 'Scrape complete.' : 'No structured data found. Scroll then try again.');
  } catch (e) {
    console.error(e);
    setStatus('Failed to scrape this page.');
  }
});

clearBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({data: []});
  await refreshPreview();
  setStatus('Cleared.');
});

exportCSVBtn.addEventListener('click', async () => {
  const {data = [], lastBase = 'shodan'} = await chrome.storage.local.get(['data','lastBase']);
  const csv = toCSV(data);
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const filename = `${lastBase}.csv`;
  await chrome.downloads.download({url, filename, saveAs: true});
  setStatus(`CSV exported as ${filename}.`);
});

exportJSONBtn.addEventListener('click', async () => {
  const {data = [], lastBase = 'shodan'} = await chrome.storage.local.get(['data','lastBase']);
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const filename = `${lastBase}.json`;
  await chrome.downloads.download({url, filename, saveAs: true});
  setStatus(`JSON exported as ${filename}.`);
});

refreshPreview();
