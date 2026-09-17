let corpusData = {
  Tagalog: [],
  Waray: []
};

let dictionaryData = {};
let statsData = {};
let vocabData = {};
let citiesData = {};
let collocationsData = {
  tagalog: {},
  waray: {}
};

let state = {
  corpus: "Tagalog",
  searchTerm: "basa",
  section: "home",
  activeMetric: null,
  freqWords: [],
  window: 1,
  collocView: "web" // web or cirrus
};

function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  const sec = params.get("section");
  const lang = params.get("lang");
  const target = params.get("target");
  const win = params.get("window");

  if (sec) {
    const sectionMap = { "sec1": "colloc", "sec2": "freq", "home": "home", "nlp": "nlp", "map": "map" };
    state.section = sectionMap[sec] || sec;
  }
  if (lang) {
    state.corpus = lang;
  }
  if (target) {
    state.searchTerm = target;
  }
  if (win) {
    state.window = parseInt(win, 10) || 1;
  }
}

function updateURLParams() {
  const params = new URLSearchParams(window.location.search);
  const revSectionMap = { "colloc": "sec1", "freq": "sec2", "home": "home", "nlp": "nlp", "map": "map" };
  params.set("section", revSectionMap[state.section] || state.section);
  params.set("lang", state.corpus);
  params.set("target", state.searchTerm);
  params.set("window", state.window);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

async function loadCSV(filename) {
  return new Promise((resolve) => {
    Papa.parse(filename, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: function(results) {
        let parsed = [];
        results.data.forEach(row => {
          const keys = Object.keys(row);
          if (keys.length >= 2) {
            let word = row[keys[0]];
            let freq = row[keys[1]];

            if (word !== undefined && word !== null) {
              word = String(word).trim().toLowerCase();
              freq = parseInt(freq, 10) || 0;
              if (word && !/^[\p{P}\p{S}]+$/u.test(word)) {
                parsed.push({ word, freq });
              }
            }
          }
        });
        resolve(parsed);
      },
      error: function(err) {
        console.error("May error sa pag-load ng " + filename, err);
        resolve([]);
      }
    });
  });
}

async function loadDictionary() {
  try {
    const response = await fetch("./dictionary.json");
    dictionaryData = await response.json();

    const selectEl = document.getElementById("target-word-select");
    if (selectEl) {
      selectEl.innerHTML = "";
      Object.keys(dictionaryData).sort().forEach(word => {
        const option = document.createElement("option");
        option.value = word;
        option.textContent = word;
        if (word === state.searchTerm) {
          option.selected = true;
        }
        selectEl.appendChild(option);
      });
      selectEl.value = state.searchTerm;
    }
  } catch (err) {
    console.error("Hindi ma-load ang dictionary.json", err);
  }
}

async function loadStats() {
  try {
    const response = await fetch("./Data/stats.json");
    statsData = await response.json();
  } catch (err) {
    console.error("Hindi ma-load ang stats.json", err);
    statsData = {};
  }
}

async function loadVocab() {
  try {
    const response = await fetch("./Data/vocab.json");
    vocabData = await response.json();
  } catch (err) {
    console.error("Hindi ma-load ang vocab.json", err);
    vocabData = {};
  }
}

async function loadCities() {
  try {
    const response = await fetch("./Data/cities.json");
    citiesData = await response.json();
  } catch (err) {
    console.error("Hindi ma-load ang cities.json", err);
    citiesData = {};
  }
}

async function loadCollocations() {
  try {
    const [tglRes, warRes] = await Promise.all([
      fetch("./Data/collocations_tagalog.json"),
      fetch("./Data/collocations_waray.json")
    ]);
    collocationsData.tagalog = await tglRes.json();
    collocationsData.waray = await warRes.json();
  } catch (err) {
    console.error("Hindi ma-load ang collocations JSON files", err);
  }
}

function getWordFreq(word) {
  if (vocabData && vocabData[word]) {
    return vocabData[word]; 
  }
  const tglItem = corpusData.Tagalog.find(item => item.word === word);
  const warItem = corpusData.Waray.find(item => item.word === word);
  return [tglItem ? tglItem.freq : 0, warItem ? warItem.freq : 0];
}

async function init() {
  readURLParams();
  
  const corpusSelect = document.getElementById("corpus-select");
  if (corpusSelect) corpusSelect.value = state.corpus;

  document.getElementById("status-text").textContent = "Nilo-load ang mga korpus file at estadistika...";

  const [tgl, war] = await Promise.all([
    loadCSV("./Data/wordlist_tgl_wikipedia_2021_20260904060133.csv"),
    loadCSV("./Data/wordlist_war_wikipedia_2021_20260904060844.csv"),
    loadDictionary(),
    loadStats(),
    loadVocab(),
    loadCities(),
    loadCollocations()
  ]);

  corpusData.Tagalog = tgl;
  corpusData.Waray = war;

  document.getElementById("status-text").textContent = `Tagalog (${tgl.length} salita) at Waray (${war.length} salita) ay handa na!`;

  populateFreqDatalist();
  renderMetrics();
  switchSection(state.section, false);
}

/* ===================== METRIC CARDS ===================== */

function renderMetrics() {
  const s = statsData[state.corpus];
  const tokensEl = document.getElementById("metric-tokens");
  const typesEl = document.getElementById("metric-types");
  const ttrEl = document.getElementById("metric-ttr");
  const sentEl = document.getElementById("metric-sentences");

  if (!s) {
    tokensEl.textContent = "N/A";
    typesEl.textContent = "N/A";
    ttrEl.textContent = "N/A";
    sentEl.textContent = "N/A";
    return;
  }

  tokensEl.textContent = s.tokens.toLocaleString();
  typesEl.textContent = s.types.toLocaleString();
  ttrEl.textContent = s.ttr;
  sentEl.textContent = s.sentences === null ? "N/A" : s.sentences.toLocaleString();

  if (state.activeMetric) {
    renderMetricDetail(state.activeMetric);
  }
}

function buildTokensDetailTable() {
  const dataset = corpusData[state.corpus];
  const s = statsData[state.corpus];
  if (!dataset || dataset.length === 0 || !s) return "";

  const top10 = dataset.slice(0, 10);
  const rows = top10.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.word}</td>
      <td>${item.freq.toLocaleString()}</td>
      <td>${((item.freq / s.tokens) * 100).toFixed(2)}%</td>
    </tr>
  `).join("");

  return `
    <table class="detail-table">
      <thead><tr><th>#</th><th>Salita</th><th>Dalas</th><th>% ng Tokens</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildTypesDetailTable() {
  const dataset = corpusData[state.corpus];
  if (!dataset || dataset.length === 0) return "";

  const buckets = [
    { label: "1 (hapax legomena)", test: f => f === 1 },
    { label: "2–5", test: f => f >= 2 && f <= 5 },
    { label: "6–10", test: f => f >= 6 && f <= 10 },
    { label: "11–100", test: f => f >= 11 && f <= 100 },
    { label: "101+", test: f => f > 100 }
  ];

  const total = dataset.length;
  const rows = buckets.map(b => {
    const count = dataset.reduce((acc, item) => acc + (b.test(item.freq) ? 1 : 0), 0);
    const pct = ((count / total) * 100).toFixed(1);
    return `<tr><td>${b.label}</td><td>${count.toLocaleString()}</td><td>${pct}%</td></tr>`;
  }).join("");

  return `
    <table class="detail-table">
      <thead><tr><th>Dalas (freq)</th><th>Bilang ng Types</th><th>% ng Types</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildTtrDetailTable() {
  const langs = ["Tagalog", "Waray"];
  const rows = langs.map(lang => {
    const s = statsData[lang];
    if (!s) return "";
    const rowClass = lang === state.corpus ? ' class="current-corpus"' : "";
    return `<tr${rowClass}><td>${lang}</td><td>${s.tokens.toLocaleString()}</td><td>${s.types.toLocaleString()}</td><td>${s.ttr}</td></tr>`;
  }).join("");

  return `
    <table class="detail-table">
      <thead><tr><th>Corpus</th><th>Tokens</th><th>Types</th><th>TTR</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderMetricDetail(metric) {
  const detailEl = document.getElementById("metric-detail");
  const s = statsData[state.corpus];
  if (!s) {
    detailEl.style.display = "none";
    return;
  }

  const explanations = {
    tokens: `<b>Kabuuang Token:</b> ${s.tokens.toLocaleString()} — kabuuang bilang ng salita sa ${state.corpus} corpus.`,
    types: `<b>Natatanging Salita (Types):</b> ${s.types.toLocaleString()} — bilang ng iba't ibang natatanging salita.`,
    ttr: `<b>Type-Token Ratio:</b> ${s.ttr} — ratio ng types sa tokens.`,
    sentences: `<b>Pangungusap:</b> N/A (Wala sa raw word-frequency list).`
  };

  let tableHtml = "";
  if (metric === "tokens") tableHtml = buildTokensDetailTable();
  else if (metric === "types") tableHtml = buildTypesDetailTable();
  else if (metric === "ttr") tableHtml = buildTtrDetailTable();

  detailEl.innerHTML = (explanations[metric] || "") + tableHtml;
  detailEl.style.display = "block";
}

function setupMetricCards() {
  document.querySelectorAll(".metric-card").forEach(card => {
    card.addEventListener("click", () => {
      const metric = card.getAttribute("data-metric");
      document.querySelectorAll(".metric-card").forEach(c => c.classList.remove("active-metric"));

      if (state.activeMetric === metric) {
        state.activeMetric = null;
        document.getElementById("metric-detail").style.display = "none";
      } else {
        state.activeMetric = metric;
        card.classList.add("active-metric");
        renderMetricDetail(metric);
      }
    });
  });
}

/* ===================== SECTION SWITCHING ===================== */

function renderActiveSection() {
  if (state.section === "home") renderHome();
  else if (state.section === "colloc") renderColloc();
  else if (state.section === "nlp") renderNlp();
  else if (state.section === "freq") renderFreq();
  updateURLParams();
}

function switchSection(sectionName, updateUrl = true) {
  state.section = sectionName;

  document.querySelectorAll(".content-section").forEach(sec => sec.classList.remove("active"));
  const targetSec = document.getElementById("section-" + sectionName);
  if (targetSec) targetSec.classList.add("active");

  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  const targetBtn = document.querySelector(`.tab-btn[data-section="${sectionName}"]`);
  if (targetBtn) targetBtn.classList.add("active");

  document.getElementById("search-container").style.display = sectionName === "colloc" ? "flex" : "none";

  renderActiveSection();
}

/* ===================== SEKSYON: HOME ===================== */

function renderHome() {
  const dataset = corpusData[state.corpus];
  if (!dataset || dataset.length === 0) return;

  const wordCloudEl = document.getElementById("home-word-cloud");
  const collocListEl = document.getElementById("home-colloc-list");

  const topItems = dataset.slice(0, 8);
  const maxFreq = topItems[0]?.freq || 1;

  wordCloudEl.innerHTML = `
    <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Paghahambing ng dalas (Frequency per corpus):</div>
      ${topItems.map(item => {
        const percentage = Math.round((item.freq / maxFreq) * 100);
        return `
          <div style="display: flex; align-items: center; gap: 10px; font-size: 12px;">
            <span style="width: 70px; font-weight: 600; text-align: right; color: #2C221E;">${item.word}</span>
            <div style="flex: 1; background: #E6D5C3; border-radius: 4px; height: 18px; overflow: hidden; position: relative;">
              <div style="background: #D96B27; width: ${percentage}%; height: 100%; border-radius: 4px;"></div>
            </div>
            <span style="width: 70px; color: #6B5E55; font-size: 11px;">${item.freq.toLocaleString()}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;

  collocListEl.innerHTML = `
    <div class="insight-box">
      <b>Estrukturang Pagsusuri:</b> Ang bar chart na ito ay nagpapakita ng mga pangunahing pananda sa ${state.corpus} corpus.
    </div>
    <div class="colloc-row"><span>Kabuuang Malinis na Salita:</span> <span class="colloc-count">${dataset.length.toLocaleString()}</span></div>
  `;
}

/* ===================== SEKSYON 1: KOLOKASYON (Network Graph / Web View) ===================== */

function renderColloc() {
  const term = state.searchTerm.toLowerCase();
  document.getElementById("colloc-target-display").textContent = term;

  const dataset = corpusData[state.corpus] || [];
  const sampleCollocs = dataset.slice(0, 14).map(i => i.word);
  if (!sampleCollocs.includes(term)) sampleCollocs.unshift(term);

  document.getElementById("colloc-meta-info").textContent = `${state.corpus} • ${sampleCollocs.length} Salita / ${(sampleCollocs.length * 1.5).toFixed(0)} Ugnayan`;

  const networkBox = document.getElementById("colloc-network-container");
  if (state.collocView === "web") {
    networkBox.innerHTML = sampleCollocs.map((w, idx) => {
      const isCenter = w === term;
      return `<div class="net-node ${isCenter ? 'center-node' : ''}" style="order: ${idx};">${w}</div>`;
    }).join("");
  } else {
    networkBox.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; align-items: center; padding: 20px;">
        ${sampleCollocs.map((w, idx) => {
          const size = Math.max(12, 28 - (idx * 1.2));
          return `<span style="font-size: ${size}px; font-weight: ${w === term ? '700' : '400'}; color: ${w === term ? 'var(--primary)' : 'var(--accent-gold)'};">${w}</span>`;
        }).join("")}
      </div>
    `;
  }

  const defEntry = dictionaryData[term] || {
    tagalog: "Walang tiyak na kahulugan sa lokal na diksyunaryo.",
    waray: "Walang tiyak na kahulugan sa lokal na diksyunaryo."
  };

  const tglMatch = corpusData.Tagalog.find(item => item.word === term) || { freq: 0 };
  const warMatch = corpusData.Waray.find(item => item.word === term) || { freq: 0 };

  const detailListEl = document.getElementById("colloc-detail-list");
  detailListEl.innerHTML = `
    <div class="insight-box">
      <b>Kahulugan mula sa Diksyunaryo:</b><br>
      • <b>Tagalog:</b> ${defEntry.tagalog}<br>
      • <b>Waray:</b> ${defEntry.waray}
    </div>
    <div class="colloc-row"><span>Tagalog Frequency:</span> <span class="colloc-count">${tglMatch.freq.toLocaleString()}</span></div>
    <div class="colloc-row"><span>Waray Frequency:</span> <span class="colloc-count">${warMatch.freq.toLocaleString()}</span></div>
  `;
  
  updateURLParams();
}

/* ===================== SEKSYON 2: DALAS NG SALITA ===================== */

function populateFreqDatalist() {
  const datalistEl = document.getElementById("vocab-datalist");
  if (!datalistEl) return;
  
  let words = Object.keys(vocabData).length > 0 ? Object.keys(vocabData) : corpusData.Tagalog.slice(0, 100).map(i => i.word);
  words.sort();
  datalistEl.innerHTML = words.map(w => `<option value="${w}"></option>`).join("");
}

function initFreqDefaults() {
  if (state.freqWords.length > 0) return;
  if (vocabData && Object.keys(vocabData).length > 0) {
    state.freqWords = Object.entries(vocabData)
      .sort((a, b) => (b[1][0] + b[1][1]) - (a[1][0] + a[1][1]))
      .slice(0, 6)
      .map(([word]) => word);
  } else {
    state.freqWords = corpusData.Tagalog.slice(0, 6).map(i => i.word);
  }
}

function showFreqMessage(msg) {
  const el = document.getElementById("freq-message");
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

function addFreqWord(rawWord) {
  const word = (rawWord || "").trim().toLowerCase();
  if (!word) return;

  const existsInVocab = vocabData && Object.prototype.hasOwnProperty.call(vocabData, word);
  const existsInTgl = corpusData.Tagalog.some(i => i.word === word);

  if (!existsInVocab && !existsInTgl) {
    showFreqMessage(`Hindi natagpuan ang "${word}" sa mga korpus.`);
    return;
  }
  if (state.freqWords.includes(word)) {
    showFreqMessage(`Nasa listahan na ang "${word}".`);
    return;
  }
  if (state.freqWords.length >= 10) {
    showFreqMessage("Pinakamarami 10 salita lang ang maaaring ikumpara nang sabay-sabay.");
    return;
  }

  state.freqWords.push(word);
  showFreqMessage("");
  renderFreq();
}

function removeFreqWord(word) {
  state.freqWords = state.freqWords.filter(w => w !== word);
  renderFreq();
}

function renderFreq() {
  initFreqDefaults();

  const chipsEl = document.getElementById("freq-chips");
  const chartEl = document.getElementById("freq-chart");
  const tableEl = document.getElementById("freq-table");
  if (!chipsEl || !chartEl || !tableEl) return;

  if (state.freqWords.length === 0) {
    chipsEl.innerHTML = `<span class="subtext" style="margin:0;">Wala pang napiling salita. Maghanap sa itaas.</span>`;
    chartEl.innerHTML = "";
    tableEl.innerHTML = "";
    return;
  }

  chipsEl.innerHTML = state.freqWords.map(w => `
    <span class="freq-chip">${w} <button class="freq-chip-remove" type="button" data-word="${w}" aria-label="Alisin ang ${w}">&times;</button></span>
  `).join("");

  const entries = state.freqWords.map(w => ({ word: w, counts: getWordFreq(w) }));
  const maxVal = Math.max(...entries.flatMap(e => e.counts), 1);

  chartEl.innerHTML = entries.map(e => {
    const [tgl, war] = e.counts;
    const tglPct = Math.round((tgl / maxVal) * 100);
    const warPct = Math.round((war / maxVal) * 100);
    return `
      <div class="freq-chart-row">
        <div class="freq-chart-word">${e.word}</div>
        <div class="freq-chart-bars">
          <div class="freq-bar-line">
            <span class="freq-bar-tag">TGL</span>
            <div class="freq-bar-track"><div class="freq-bar freq-bar-tgl" style="width:${tglPct}%;"></div></div>
            <span class="freq-bar-value">${tgl.toLocaleString()}</span>
          </div>
          <div class="freq-bar-line">
            <span class="freq-bar-tag">WAR</span>
            <div class="freq-bar-track"><div class="freq-bar freq-bar-war" style="width:${warPct}%;"></div></div>
            <span class="freq-bar-value">${war.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const tglTotalTokens = statsData["Tagalog"]?.tokens || 1;
  const warTotalTokens = statsData["Waray"]?.tokens || 1;

  const rows = entries.map((e, index) => {
    const [tgl, war] = e.counts;
    const tglProp = ((tgl / tglTotalTokens) * 100).toFixed(4) + "%";
    const warProp = ((war / warTotalTokens) * 100).toFixed(4) + "%";
    
    let dominantCorpus = "Pantay";
    if (tgl > war) dominantCorpus = "Tagalog";
    else if (war > tgl) dominantCorpus = "Waray";

    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${e.word}</strong></td>
        <td>${tgl.toLocaleString()} (${tglProp})</td>
        <td>${war.toLocaleString()} (${warProp})</td>
        <td>${dominantCorpus}</td>
      </tr>
    `;
  }).join("");

  tableEl.innerHTML = `
    <table class="detail-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Salita (Word)</th>
          <th>Tagalog Dalas & Proporsyon</th>
          <th>Waray Dalas & Proporsyon</th>
          <th>Nangingibabaw na Korpus</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  chipsEl.querySelectorAll(".freq-chip-remove").forEach(btn => {
    btn.addEventListener("click", () => removeFreqWord(btn.getAttribute("data-word")));
  });
}

/* ===================== SEKSYON 3: NLP ===================== */

function renderNlp() {
  document.getElementById("nlp-pipeline").innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
      <div style="background: #FDF6EC; padding: 10px; border-radius: 6px; border-left: 3px solid #1A365D;">
        <b>1. Token Filtering:</b> Pagtanggal ng mga bantas at hindi kinakailangang karakter mula sa corpus.
      </div>
      <div style="background: #FDF6EC; padding: 10px; border-radius: 6px; border-left: 3px solid #F1C40F;">
        <b>2. Lemmatization:</b> Pag-normalize ng mga pandiwa patungo sa kanilang salitang-ugat.
      </div>
    </div>
  `;

  document.getElementById("nlp-tool").innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div class="insight-box">
        <b>Gawain — Paghahanda para sa Pagsasalin:</b><br>
        I-edit ang teksto sa ibaba at i-click ang button upang linisin ang morpolohikal na ingay.
      </div>
      <textarea id="taglishInput" style="width: 100%; min-height: 90px; background: #FFFDF9; color: #2C221E; border: 1px solid #E6D5C3; border-radius: 6px; padding: 10px 12px; font-family: inherit; font-size: 13px; resize: vertical;">Kapag nag-aaral ako, parang gustong-gusto kong mag-relax muna, so nagbabasa ako ng libro. Actually, mas gusto ko ring kumakain ng meryenda while nagbabasa.</textarea>
      <button id="cleanBtn" style="background: #D96B27; color: #FFFDF9; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer;">Linisin ang Teksto para sa AI</button>
      <div id="cleanOutput" style="background: #FDF6EC; border: 1px solid #E6D5C3; border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.6; display: none;"></div>
    </div>
  `;

  const cleanBtn = document.getElementById("cleanBtn");
  if (cleanBtn) {
    cleanBtn.addEventListener("click", () => {
      const inputVal = document.getElementById("taglishInput").value;
      const rootMap = [{ pattern: /\b(kumakain|kakain|nangaon|mangaon)\b/gi, root: "kain/kaon" }];
      const fillerWords = ["so", "actually", "like", "while", "basically"];

      let html = inputVal;
      let changes = [];

      rootMap.forEach(({ pattern, root }) => {
        html = html.replace(pattern, m => {
          changes.push(`${m} → ${root}`);
          return `<mark style="background: rgba(217,107,39,0.2); color: #D96B27; padding: 0 3px; border-radius: 3px; font-weight: 600;">${root}</mark>`;
        });
      });

      fillerWords.forEach(fw => {
        const re = new RegExp(`\\b${fw}\\b,?`, "gi");
        html = html.replace(re, m => {
          changes.push(`inalis: "${m.trim()}"`);
          return `<mark style="background: rgba(128,21,21,0.15); color: #801515; text-decoration: line-through; padding: 0 3px; border-radius: 3px;">${m}</mark>`;
        });
      });

      const out = document.getElementById("cleanOutput");
      out.style.display = "block";
      out.innerHTML = `<div style="margin-bottom: 8px;"><b style="color: #2C221E;">Resulta:</b><br>${html}</div>` +
        (changes.length ? `<div style="font-size: 11px; color: #6B5E55; border-top: 1px dashed #E6D5C3; padding-top: 6px; margin-top: 6px;"><b style="color: #2C221E;">Mga Binago (${changes.length}):</b><br>${changes.join("<br>")}</div>` : ``);
    });
  }
}

/* ===================== EVENT WIRING ===================== */

document.addEventListener("DOMContentLoaded", () => {
  const corpusSelect = document.getElementById("corpus-select");
  const targetSelect = document.getElementById("target-word-select");
  const navButtons = document.querySelectorAll(".tab-btn[data-section]");

  if (corpusSelect) {
    corpusSelect.addEventListener("change", (e) => {
      state.corpus = e.target.value;
      renderMetrics();
      renderActiveSection();
    });
  }

  if (targetSelect) {
    targetSelect.addEventListener("change", (e) => {
      state.searchTerm = e.target.value.trim();
      renderColloc();
    });
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      switchSection(btn.getAttribute("data-section"));
    });
  });

  const btnWeb = document.getElementById("btn-colloc-web");
  const btnCirrus = document.getElementById("btn-colloc-cirrus");
  if (btnWeb && btnCirrus) {
    btnWeb.addEventListener("click", () => {
      btnWeb.classList.add("active");
      btnCirrus.classList.remove("active");
      state.collocView = "web";
      renderColloc();
    });
    btnCirrus.addEventListener("click", () => {
      btnCirrus.classList.add("active");
      btnWeb.classList.remove("active");
      state.collocView = "cirrus";
      renderColloc();
    });
  }

  const freqInput = document.getElementById("freq-search-input");
  const freqAddBtn = document.getElementById("freq-add-btn");
  if (freqInput && freqAddBtn) {
    freqAddBtn.addEventListener("click", () => {
      addFreqWord(freqInput.value);
      freqInput.value = "";
      freqInput.focus();
    });
    freqInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addFreqWord(freqInput.value);
        freqInput.value = "";
      }
    });
  }

  setupMetricCards();
  init();
});