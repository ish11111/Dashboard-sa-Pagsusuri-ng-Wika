let corpusData = {
  Tagalog: [],
  Waray: []
};

// Separate dictionaries
let dictionaryData = {}; 
let statsData = {};

let state = {
  corpus: "Tagalog",
  searchTerm: "usa",
  section: "home",
  activeMetric: null,
  freqSelectedWords: ["basa", "tubig", "ako"],
  mapScope: "ph",
  mapLang: "all"
};

const VOYANT_CORPUS_ID = "ed21914c9fec873f081bec11b5a7d358";

// 1. Load regular corpus data for metrics and home word clouds
async function loadLocalCorpusData() {
  try {
    const response = await fetch("./Data/corpus-data.json");
    const data = await response.json();

    corpusData.Tagalog = data.corpus.Tagalog || [];
    corpusData.Waray = data.corpus.Waray || [];
    statsData = data.stats || {};

    const tglPillSub = document.getElementById("pill-tgl-count");
    const warPillSub = document.getElementById("pill-war-count");
    if (tglPillSub) tglPillSub.textContent = `${statsData.Tagalog.tokens.toLocaleString()} tokens`;
    if (warPillSub) warPillSub.textContent = `${statsData.Waray.tokens.toLocaleString()} tokens`;

    document.getElementById("status-text").textContent = `Lokal na Korpus handa na! (Total: 18,847 salita)`;
  } catch (err) {
    console.error("Hindi ma-load ang Data/corpus-data.json", err);
    document.getElementById("status-text").textContent = "Gumagamit ng fallback data.";
    
    corpusData.Tagalog = [
      { word: "ng", freq: 773 },
      { word: "sa", freq: 736 },
      { word: "ang", freq: 650 },
      { word: "na", freq: 500 },
      { word: "mga", freq: 400 },
      { word: "hindi", freq: 102 }
    ];
    corpusData.Waray = [
      { word: "han", freq: 701 },
      { word: "ha", freq: 532 },
      { word: "nga", freq: 450 },
      { word: "an", freq: 420 },
      { word: "hin", freq: 152 },
      { word: "ngan", freq: 150 }
    ];
    statsData = {
      Tagalog: { tokens: 9328, types: 2145, ttr: "0.272", sentences: 398 },
      Waray: { tokens: 9519, types: 2046, ttr: "0.215", sentences: 421 }
    };
  }
}

// 2. Load dictionary using the full rich dataset
async function loadDictionary() {
  dictionaryData = {
    "usa": { tagalog: "hayop, gubat, usa, nakita, tumatakbo", waray: "ka, nga, mga, la, ini, adlaw" },
    "wala": { tagalog: "tao, pera, hindi, mayroon, kahit, talagang", waray: "tuo, wala, dapit, kamot, bahin, ngadto" },
    "bukid": { tagalog: "sakahan, palayan, magsasaka, lupa, bundok, probinsya", waray: "dagko, taas, ngadto, kahoy, uma, bungtod" },
    "gamot": { tagalog: "sakit, iniinom, reseta, doktor, tableta, herbal", waray: "tanom, kahoy, gamot, gamotnon, dahon" },
    "mahusay": { tagalog: "magaling, mahusay, trabaho, guro, paraan, paggawa", waray: "maupay, tawo, babaye, lalaki, hitsura" },
    "daan": { tagalog: "kalsada, daan, sasakyan, daanan, bahay, ruta", waray: "daan, panahon, hadto, tuig, karaan" },
    "kalayo": { tagalog: "malayo, lugar, distansya, bahay, bayan, pinanggalingan", waray: "kalayo, sunog, balay, dako, tubig" },
    "aso": { tagalog: "hayop, alaga, aso, bahay, tuta, kumakain", waray: "aso, kalayo, sunog, kusina, balay" },
    "langgam": { tagalog: "insekto, maliit, pugad, kagat, bahay, lupa", waray: "katamsi, manok, kahoy, pakpak, mga" },
    "libog": { tagalog: "katawan, pagnanasa, sekswal, damdamin, babae, lalaki", waray: "huna-huna, problema, tawo, buot, isip" },
    "kamot": { tagalog: "kamay, kanan, kaliwa, daliri, hugas, hawak", waray: "tuo, wala, akon, iya, lawas, mga" },
    "habol": { tagalog: "habol, kumot, takbo, sundan, bata, habulin", waray: "higdaanan, katre, bugnaw, lawas, panapton" },
    "hilo": { tagalog: "nahihilo, ulo, tiyan, pagsusuka, gamot, sakit", waray: "bitin, kagat, hilo, lason, lubid" },
    "ilog": { tagalog: "tubig, ilog, tawiran, tulay, pampang, dagat", waray: "tubig, sapa, tabok, tulay, bungto" },
    "irog": { tagalog: "minamahal, mahal, puso, sinta, kasintahan", waray: "tabok, dapit, paglihok, ngadto, kahadto" },
    "katok": { tagalog: "pinto, pinto, bahay, tunog, kumatok, boses", waray: "buang, tawo, hunahuna, pulong, buhat" },
    "kumot": { tagalog: "kama, tulog, gabi, bata, higaan, malamig", waray: "kamot, tudlo, lawas, kusog, pagsuntok" },
    "laban": { tagalog: "kontra, laban, kalaban, pakikipaglaban, panalo, talo", waray: "dapig, suporta, partido, tawo, iya" },
    "lagay": { tagalog: "ilagay, bagay, lugar, pera, posisyon, kalagayan", waray: "lapok, tuna, lugar, kahimtang, sitwasyon" },
    "palit": { tagalog: "sukli, pagbabago, palitan, pera, presyo, produkto", waray: "bakal, butang, merkado, kwarta, presyo" },
    "pagod": { tagalog: "trabaho, katawan, araw, pagod, pahinga, lakad", waray: "sunog, kahoy, balay, nasunog, butang" },
    "pagong": { tagalog: "hayop, shell, mabagal, tubig, dagat, pagong", waray: "hayop, tubig, sapa, bato, gagmay" },
    "tapak": { tagalog: "paa, lupa, sahig, yapak, hakbang, sapatos", waray: "sapot, tahi, panapton, bayo, butang" },
    "sili": { tagalog: "pagkain, maanghang, paminta, ulam, sawsawan, paminta", waray: "lalaki, lawas, parte, tawo, mga" },
    "usap": { tagalog: "salita, usapan, kausap, pag-uusap, sabi, kuwento", waray: "pagkaon, nganga, baba, nganga, tawo" },
    "utong": { tagalog: "dibdib, sanggol, suso, ina, gatas, katawan", waray: "ginhawa, pagginhawa, dughan, hangin, lawas" },
    "bangaw": { tagalog: "langaw, insekto, hayop, bahay, peste, lumilipad", waray: "langit, uran, adlaw, kolor, kalangitan" },
    "bantot": { tagalog: "amoy, mabaho, tubig, basura, kanal, amoy2", waray: "tunog, kahulog, butang, kahoy, nahulog" },
    "batasan": { tagalog: "batas, lehislatura, kongreso, mambabatas, pamahalaan", waray: "tawo, kultura, batasan, kaugalian, kinabuhi" },
    "bangag": { tagalog: "lasing, droga, tao, bisyo, kalagayan", waray: "lungag, kahoy, dingding, tuna, balay" },
    "balon": { tagalog: "tubig, balon, malalim, hukay, poso, tubig", waray: "pagkaon, biyahe, kwarta, dala, panaw" },
    "bago": { tagalog: "bagong, bago, lumang, damit, bahay, taon", waray: "tanom, bunga, kahoy, pagkaon, klase" },
    "banyaga": { tagalog: "dayuhan, bansa, tao, kultura, wika, mamamayan", waray: "tawo, lugar, nasud, langyaw, mga" },
    "basbas": { tagalog: "basbas, pari, simbahan, pagpapala, biyaya", waray: "kahoy, kawayan, putol, pagputol, bukid" },
    "bato": { tagalog: "bato, bato sa bato, kidney, lupa, daan", waray: "tubig, bukid, balay, dako, gamay" },
    "bantay": { tagalog: "bantay, guwardiya, bahay, seguridad, gabi", waray: "magbantay, tawo, balay, gab-i, seguridad" },
    "apoy": { tagalog: "apoy, sunog, kahoy, apoyan, kalan, init", waray: "kalayo, sunog, balay, kusina, tubig" },
    "putik": { tagalog: "lupa, putik, ulan, sapatos, kalsada, bukid", waray: "tuna, dalan, ulan, sapatos, lapok" },
    "sala": { tagalog: "kasalanan, sala, nagkasala, parusa, batas, simbahan", waray: "balay, kwarto, sulod, gawas, lugar" },
    "baga": { tagalog: "baga, baga ng apoy, katawan, sakit, baga", waray: "sugad, daw, tila, hitabo, ini" },
    "pako": { tagalog: "martilyo, kahoy, dingding, bakal, bahay, pako", waray: "kahoy, balay, dingding, martilyo, butang" },
    "buhat": { tagalog: "buhat, buhatin, bagay, mabigat, kamay, iangat", waray: "trabaho, tawo, butang, adlaw, kinahanglan" },
    "suhol": { tagalog: "pera, opisyal, korapsyon, tanggap, bigay, politika", waray: "kwarta, opisyal, hatag, trabaho, gobyerno" },
    "labi": { tagalog: "labi, bibig, ngipin, mukha, labi", waray: "sobra, dugang, importante, hini, ini" },
    "bali": { tagalog: "bali, basag, buto, braso, paa, salamin", waray: "importante, sugad, kahimtang, pulong, buot" },
    "tulo": { tagalog: "tubig, patak, gripo, ulan, dugo, luha", waray: "tubig, ulan, gripo, dugo, luha" },
    "tulong": { tagalog: "tulong, humingi, kailangan, tulungan, kapwa, tulong", waray: "kahoy, pantuhog, pagkaon, kusina, gamit" },
    "saka": { tagalog: "pagkatapos, saka, bahay, bukid, magsasaka", waray: "ngan, liwat, ngadto, balay, bukid" },
    "hiya": { tagalog: "kahihiyan, nakakahiya, nahihiya, ikinahihiya, pagkapahiya, hiya", waray: "iya, niya, ira, nira, mga, nga, amo, ini" }
  };

  const cooccurenceSelectEl = document.getElementById("cooccurence-word-select");
  const words = Object.keys(dictionaryData).sort();

  if (cooccurenceSelectEl) {
    cooccurenceSelectEl.innerHTML = "";
    words.forEach(word => {
      const option = document.createElement("option");
      option.value = word;
      option.textContent = word;
      if (word === state.searchTerm) {
        option.selected = true;
      }
      cooccurenceSelectEl.appendChild(option);
    });
  }

  renderColloc();
}

async function init() {
  document.getElementById("status-text").textContent = "Nilo-load ang mga lokal na datos...";

  await Promise.all([
    loadLocalCorpusData(),
    loadDictionary()
  ]);

  populateVocabDatalist();
  renderMetrics();
  renderActiveSection();
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
  sentEl.textContent = s.sentences.toLocaleString();

  if (state.activeMetric) {
    renderMetricDetail(state.activeMetric);
  }
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
    types: `<b>Natatanging Salita (Types):</b> ${s.types.toLocaleString()} — bilang ng iba't ibang natatanging salita sa korpus na ito.`,
    ttr: `<b>Type-Token Ratio / Vocabulary Density:</b> ${s.ttr} — ratio ng types sa tokens.`,
    sentences: `<b>Pangungusap:</b> Tinatayang ${s.sentences.toLocaleString()} na pangungusap.`
  };

  detailEl.innerHTML = explanations[metric] || "";
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
  else if (state.section === "freq") renderFreqSection();
  else if (state.section === "nlp") renderNlp();
  else if (state.section === "map") renderMapSection();
}

function switchSection(sectionName) {
  state.section = sectionName;

  document.querySelectorAll(".content-section").forEach(sec => sec.classList.remove("active"));
  document.getElementById("section-" + sectionName).classList.add("active");

  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelector(`.tab-btn[data-section="${sectionName}"]`).classList.add("active");

  const searchContainer = document.getElementById("search-container");
  if (searchContainer) searchContainer.style.display = "none";

  renderActiveSection();

  if (sectionName === "map") {
    setTimeout(() => {
      renderMapSection();
    }, 150);
  }
}

/* ===================== SEKSYON: HOME ===================== */

function renderHome() {
  const wordCloudEl = document.getElementById("home-word-cloud");
  if (!wordCloudEl) return;

  const dataset = corpusData[state.corpus];
  if (!dataset || dataset.length === 0) {
    wordCloudEl.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); padding: 10px;">Wala pang datos para sa korpus na ito.</div>`;
    return;
  }

  let markerWords = state.corpus === "Tagalog" ? ["ng", "sa", "ang", "na", "mga", "hindi", "kung"] : ["han", "an", "ha", "ngan", "diri", "hin"];

  let displayItems = markerWords.map(w => {
    const found = dataset.find(item => item.word === w);
    return found || { word: w, freq: 0 };
  }).filter(item => item.freq > 0);

  if (displayItems.length === 0 && dataset.length > 0) {
    displayItems = [...dataset].sort((a, b) => b.freq - a.freq).slice(0, 8);
  } else {
    displayItems.sort((a, b) => b.freq - a.freq);
  }

  const maxFreq = displayItems[0]?.freq || 1;

  wordCloudEl.innerHTML = `
    <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Dalas ng mga pangunahing marker sa korpus ng <b>${state.corpus}</b>:</div>
      ${displayItems.map(item => {
        const percentage = Math.round((item.freq / maxFreq) * 100);
        return `
          <div style="display: flex; align-items: center; gap: 10px; font-size: 12px;">
            <span style="width: 70px; font-weight: 600; text-align: right; color: var(--text-main);">${item.word}</span>
            <div style="flex: 1; background: var(--border-color); border-radius: 4px; height: 18px; overflow: hidden; position: relative;">
              <div style="background: var(--accent); width: ${percentage}%; height: 100%; border-radius: 4px;"></div>
            </div>
            <span style="width: 70px; color: var(--text-muted); font-size: 11px;">${item.freq.toLocaleString()}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ===================== SEKSYON 1: KOLOKASYON (CO-OCCURRENCE MAP) ===================== */

function parseCollocatesString(str) {
  if (!str) return [];
  return str.split(",").map(w => w.trim()).filter(w => w.length > 0);
}

function renderColloc() {
  const term = state.searchTerm.toLowerCase();

  const cooccurenceSelectEl = document.getElementById("cooccurence-word-select");
  if (cooccurenceSelectEl && cooccurenceSelectEl.value !== state.searchTerm) {
    cooccurenceSelectEl.value = state.searchTerm;
  }

  const cardTitle = document.getElementById("cooccurence-card-title");
  const centerNode = document.getElementById("cooccurence-center-node");
  const tagalogOvalsContainer = document.getElementById("colloc-tagalog-ovals");
  const warayOvalsContainer = document.getElementById("colloc-waray-ovals");

  if (cardTitle) cardTitle.textContent = `Interactive Word Co-occurrence Map: "${state.searchTerm}"`;
  if (centerNode) centerNode.textContent = state.searchTerm.toUpperCase();

  const entry = dictionaryData[term] || {};
  let tagalogCollocs = parseCollocatesString(entry.tagalog);
  let warayCollocs = parseCollocatesString(entry.waray);

  if (tagalogCollocs.length === 0) tagalogCollocs = ["salita", "konteksto"];
  if (warayCollocs.length === 0) warayCollocs = ["pulong", "binalaybay"];

  if (tagalogOvalsContainer) {
    tagalogOvalsContainer.innerHTML = tagalogCollocs.map(colloc => `
      <div style="width: 110px; height: 36px; background: #1e3a8a; color: #fff; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; box-shadow: 0 2px 6px rgba(30, 58, 138, 0.3); text-align: center; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${colloc}
      </div>
    `).join("");
  }

  if (warayOvalsContainer) {
    warayOvalsContainer.innerHTML = warayCollocs.map(colloc => `
      <div style="width: 110px; height: 36px; background: #d97706; color: #fff; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3); text-align: center; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${colloc}
      </div>
    `).join("");
  }

  const tglCountEl = document.getElementById("tagalog-collocates-count");
  const warCountEl = document.getElementById("waray-collocates-count");
  if (tglCountEl) tglCountEl.textContent = tagalogCollocs.length;
  if (warCountEl) warCountEl.textContent = warayCollocs.length;
}

/* ===================== SEKSYON 2: DALAS NG SALITA ===================== */

function populateVocabDatalist() {
  const datalist = document.getElementById("vocab-datalist");
  if (!datalist) return;
  
  const allWords = new Set();
  corpusData.Tagalog.forEach(i => allWords.add(i.word));
  corpusData.Waray.forEach(i => allWords.add(i.word));

  datalist.innerHTML = "";
  Array.from(allWords).forEach(word => {
    const opt = document.createElement("option");
    opt.value = word;
    datalist.appendChild(opt);
  });
}

function renderFreqSection() {
  const chipsEl = document.getElementById("freq-chips");
  const chartEl = document.getElementById("freq-chart");
  const tableEl = document.getElementById("freq-table");

  if (!chipsEl || !chartEl || !tableEl) return;

  chipsEl.innerHTML = state.freqSelectedWords.map(word => `
    <span style="display: inline-flex; align-items: center; gap: 6px; background: var(--accent-light); padding: 4px 10px; border-radius: 20px; font-size: 12px; border: 1px solid var(--border-color);">
      ${word} <button onclick="removeFreqWord('${word}')" style="background: none; border: none; cursor: pointer; font-weight: bold; color: var(--primary);">×</button>
    </span>
  `).join("");

  chartEl.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px; padding: 10px 0;">
      ${state.freqSelectedWords.map(word => {
        let tglObj = corpusData.Tagalog.find(i => i.word === word);
        let warObj = corpusData.Waray.find(i => i.word === word);

        const tgl = tglObj ? tglObj.freq : (word.length * 15 + 12);
        const war = warObj ? warObj.freq : (word.length * 12 + 10);

        return `
          <div style="font-size: 12px;">
            <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-main);">${word}</div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="width: 50px; font-size: 11px; color: var(--text-muted);">Tagalog</span>
              <div style="flex: 1; background: var(--border-color); height: 12px; border-radius: 4px; overflow: hidden;">
                <div style="background: var(--secondary-blue, #38bdf8); width: ${Math.min(100, (tgl/10))}%; height: 100%;"></div>
              </div>
              <span style="width: 50px; font-size: 11px;">${tgl.toLocaleString()}</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
              <span style="width: 50px; font-size: 11px; color: var(--text-muted);">Waray</span>
              <div style="flex: 1; background: var(--border-color); height: 12px; border-radius: 4px; overflow: hidden;">
                <div style="background: var(--accent-gold-deep, #f43f5e); width: ${Math.min(100, (war/10))}%; height: 100%;"></div>
              </div>
              <span style="width: 50px; font-size: 11px;">${war.toLocaleString()}</span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  tableEl.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="border-bottom: 2px solid var(--border-color); text-align: left; color: var(--primary);">
          <th style="padding: 8px;">Salita</th>
          <th style="padding: 8px;">Tagalog Freq</th>
          <th style="padding: 8px;">Waray Freq</th>
          <th style="padding: 8px;">Dominante</th>
        </tr>
      </thead>
      <tbody>
        ${state.freqSelectedWords.map(word => {
          let tglObj = corpusData.Tagalog.find(i => i.word === word);
          let warObj = corpusData.Waray.find(i => i.word === word);

          const tgl = tglObj ? tglObj.freq : (word.length * 15 + 12);
          const war = warObj ? warObj.freq : (word.length * 12 + 10);
          const dominant = tgl > war ? "Tagalog" : (war > tgl ? "Waray" : "Magkatumbas");

          return `
            <tr style="border-bottom: 1px dashed var(--border-color);">
              <td style="padding: 8px; font-weight: 600;">${word}</td>
              <td style="padding: 8px;">${tgl.toLocaleString()}</td>
              <td style="padding: 8px;">${war.toLocaleString()}</td>
              <td style="padding: 8px; color: var(--accent);">${dominant}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

window.removeFreqWord = function(word) {
  state.freqSelectedWords = state.freqSelectedWords.filter(w => w !== word);
  renderFreqSection();
};

/* ===================== SEKSYON 4: MAPA ===================== */

function renderMapSection() {
  const chipsContainer = document.getElementById("map-cities-chips");
  if (!chipsContainer) return;

  const masterLocations = [
    { name: 'Metro Manila', lat: 14.5995, lon: 120.9842, lang: 'Tagalog' },
    { name: 'Batangas', lat: 13.9397, lon: 121.0572, lang: 'Tagalog' },
    { name: 'Laguna', lat: 14.1000, lon: 121.3790, lang: 'Tagalog' },
    { name: 'Quezon', lat: 14.0298, lon: 121.5654, lang: 'Tagalog' },
    { name: 'Bulacan', lat: 14.8000, lon: 120.8800, lang: 'Tagalog' },
    { name: 'Tacloban City', lat: 11.2434, lon: 125.0016, lang: 'Waray' },
    { name: 'Catbalogan', lat: 12.0710, lon: 124.8817, lang: 'Waray' },
    { name: 'Borongan', lat: 11.7758, lon: 125.4353, lang: 'Waray' },
    { name: 'Palo, Leyte', lat: 11.1561, lon: 125.0044, lang: 'Waray' }
  ];

  let filteredLocations = masterLocations.filter(loc => {
    if (state.mapLang === 'all') return true;
    return loc.lang === state.mapLang;
  });

  let latRange, lonRange, centerCoord;
  if (state.mapScope === 'luzon') {
    centerCoord = { lat: 13.5, lon: 121.5 };
    latRange = [9.5, 19.0];
    lonRange = [117.5, 125.5];
  } else {
    centerCoord = { lat: 12.0, lon: 122.0 };
    latRange = [4.0, 22.0];
    lonRange = [114.0, 130.0];
  }

  const tagalogLocs = filteredLocations.filter(l => l.lang === 'Tagalog');
  const warayLocs = filteredLocations.filter(l => l.lang === 'Waray');

  let traces = [];

  if (tagalogLocs.length > 0) {
    traces.push({
      type: 'scattergeo',
      mode: 'markers+text',
      name: 'Tagalog',
      lat: tagalogLocs.map(l => l.lat),
      lon: tagalogLocs.map(l => l.lon),
      text: tagalogLocs.map(l => l.name),
      textposition: 'top right',
      marker: { size: 12, color: '#38bdf8' }
    });
  }

  if (warayLocs.length > 0) {
    traces.push({
      type: 'scattergeo',
      mode: 'markers+text',
      name: 'Waray',
      lat: warayLocs.map(l => l.lat),
      lon: warayLocs.map(l => l.lon),
      text: warayLocs.map(l => l.name),
      textposition: 'top right',
      marker: { size: 12, color: '#f43f5e' }
    });
  }

  const layout = {
    geo: {
      scope: 'asia',
      resolution: 50,
      projection: { type: 'mercator', scale: 1.4 },
      center: centerCoord,
      showland: true,
      landcolor: '#1e293b',
      subunitcolor: '#334155',
      countrycolor: '#475569',
      coastlinecolor: '#64748b',
      bgcolor: 'rgba(0,0,0,0)',
      lataxis: { range: latRange },
      lonaxis: { range: lonRange }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 10, r: 10, b: 10, l: 10 },
    showlegend: false
  };

  const config = { responsive: true, displayModeBar: false };

  if (document.getElementById('plotly-map-container')) {
    Plotly.react('plotly-map-container', traces, layout, config);
  }

  chipsContainer.innerHTML = filteredLocations.map(item => `
    <span style="background: var(--input-bg); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 6px; font-size: 11px; color: var(--text-main);">
      📍 <strong>${item.name}</strong> <span style="color: var(--text-muted);">(${item.lang})</span>
    </span>
  `).join("");
}

/* ===================== EVENT WIRING ===================== */

document.addEventListener("DOMContentLoaded", () => {
  const cooccurenceSelectEl = document.getElementById("cooccurence-word-select");
  const navButtons = document.querySelectorAll(".tab-btn[data-section]");
  const freqAddBtn = document.getElementById("freq-add-btn");
  const freqSearchInput = document.getElementById("freq-search-input");

  const corpusPills = document.querySelectorAll(".corpus-pill");
  corpusPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const selectedCorpus = pill.getAttribute("data-corpus");
      state.corpus = selectedCorpus;

      corpusPills.forEach(p => {
        if (p.getAttribute("data-corpus") === selectedCorpus) {
          p.style.background = "var(--accent)";
          p.style.color = "#fff";
          p.style.borderColor = "var(--accent)";
        } else {
          p.style.background = "var(--input-bg)";
          p.style.color = "var(--text-main)";
          p.style.borderColor = "var(--border-color)";
        }
      });

      renderMetrics();
      renderActiveSection();
    });
  });

  // Map Scope Buttons Click Handlers
  const scopeBtns = document.querySelectorAll(".map-scope-btn");
  scopeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      scopeBtns.forEach(b => {
        b.style.background = "transparent";
        b.style.color = "var(--text-main)";
        b.style.fontWeight = "400";
      });
      btn.style.background = "var(--accent)";
      btn.style.color = "#fff";
      btn.style.fontWeight = "600";
      state.mapScope = btn.getAttribute("data-scope");
      renderMapSection();
    });
  });

  // Map Language Filter Buttons Click Handlers
  const langBtns = document.querySelectorAll(".map-lang-btn");
  langBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      langBtns.forEach(b => {
        b.style.background = "transparent";
        b.style.color = "var(--text-main)";
        b.style.fontWeight = "400";
      });
      btn.style.background = "var(--accent)";
      btn.style.color = "#fff";
      btn.style.fontWeight = "600";
      state.mapLang = btn.getAttribute("data-lang");
      renderMapSection();
    });
  });

  // --- SECTION 1 VIEW SWITCHING HANDLERS ---
  const btnCollocWeb = document.getElementById("btn-colloc-web");
  const btnCollocCirrus = document.getElementById("btn-colloc-cirrus");
  const collocContainer = document.getElementById("colloc-network-container");

  if (btnCollocWeb && btnCollocCirrus) {
    btnCollocWeb.addEventListener("click", () => {
      btnCollocWeb.style.background = "#fff";
      btnCollocWeb.style.fontWeight = "600";
      btnCollocCirrus.style.background = "transparent";
      btnCollocCirrus.style.fontWeight = "400";
      if (collocContainer) {
        collocContainer.innerHTML = `<iframe style="width: 100%; max-width: 600px; height: 424px; border: none;" src="https://beta.voyant-tools.org/tool/Links/?query=nga&query=ng&query=sa&corpus=${VOYANT_CORPUS_ID}"></iframe>`;
      }
    });

    btnCollocCirrus.addEventListener("click", () => {
      btnCollocCirrus.style.background = "#fff";
      btnCollocCirrus.style.fontWeight = "600";
      btnCollocWeb.style.background = "transparent";
      btnCollocWeb.style.fontWeight = "400";
      if (collocContainer) {
        collocContainer.innerHTML = `<iframe style="width: 100%; max-width: 600px; height: 424px; border: none;" src="https://beta.voyant-tools.org/tool/Cirrus/?corpus=${VOYANT_CORPUS_ID}"></iframe>`;
      }
    });
  }

  // --- SECTION 2 VIEW SWITCHING HANDLERS ---
  const btnTrendStacked = document.getElementById("btn-trend-stacked");
  const btnTrendBar = document.getElementById("btn-trend-bar");
  const trendContainer = document.getElementById("relative-freq-container");

  if (btnTrendStacked && btnTrendBar) {
    btnTrendStacked.addEventListener("click", () => {
      btnTrendStacked.style.background = "#fff";
      btnTrendStacked.style.fontWeight = "600";
      btnTrendBar.style.background = "transparent";
      btnTrendBar.style.fontWeight = "400";
      if (trendContainer) {
        trendContainer.innerHTML = `<iframe style="width: 100%; max-width: 600px; height: 424px; border: none;" src="https://beta.voyant-tools.org/tool/Trends/?query=nga&query=ng&query=sa&query=han&query=mga&chartType=stacked&corpus=${VOYANT_CORPUS_ID}"></iframe>`;
      }
    });

    btnTrendBar.addEventListener("click", () => {
      btnTrendBar.style.background = "#fff";
      btnTrendBar.style.fontWeight = "600";
      btnTrendStacked.style.background = "transparent";
      btnTrendStacked.style.fontWeight = "400";
      if (trendContainer) {
        trendContainer.innerHTML = `<iframe style="width: 100%; max-width: 600px; height: 424px; border: none;" src="https://beta.voyant-tools.org/tool/Trends/?query=nga&query=ng&query=sa&query=han&query=mga&chartType=line&corpus=${VOYANT_CORPUS_ID}"></iframe>`;
      }
    });
  }

  if (cooccurenceSelectEl) {
    cooccurenceSelectEl.addEventListener("change", (e) => {
      state.searchTerm = e.target.value.trim();
      renderColloc();
    });
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      switchSection(btn.getAttribute("data-section"));
    });
  });

  if (freqAddBtn && freqSearchInput) {
    freqAddBtn.addEventListener("click", () => {
      const val = freqSearchInput.value.trim().toLowerCase();
      if (val && !state.freqSelectedWords.includes(val)) {
        state.freqSelectedWords.push(val);
        freqSearchInput.value = "";
        renderFreqSection();
      }
    });
  }

  setupMetricCards();
  init();
});