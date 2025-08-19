/* =========================
   DOMO + Chat App (Vanilla)
   ========================= */

const app = document.getElementById("app");

// ==== CONFIG ====
const REGION_DATASET_ID = "f042effc-85d3-46ed-8f46-d38497740906"; // Region slicer
const OUTPUT_DATASET_ID = "5c0b9c87-9276-4ab2-bdbd-dd889f3db814"; // Results to show in chat

const WORKFLOW_V1_URL = "https://gwcteq-partner.domo.com/workflows/models/9d1252d3-c8b6-4032-b690-6baf2c7de447/1.0.1?_wfv=edit";
const WORKFLOW_V2_URL = "https://gwcteq-partner.domo.com/workflows/models/9d1252d3-c8b6-4032-b690-6baf2c7de447/1.0.2?_wfv=edit";

// ==== STATE ====
let messages = [
  {
    role: "bot",
    text:
      "Hi! Choose a Region and click Execute. I’ll fetch results and show them here. After that, press Send to trigger the next step.",
    timestamp: new Date(),
    needsApproval: false,
  },
];

let regions = [];          // loaded from REGION_DATASET_ID
let selectedRegion = null; // slicer choice
let context = null;
let composerLocked = false; // hide/disable textarea after Execute

// ==== RENDER ====
function render() {
  app.innerHTML = `
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div class="h-10 w-10 rounded-2xl bg-slate-900 grid place-items-center text-white shadow">
        <i data-lucide="milk" class="w-5 h-5"></i>
      </div>
      <div>
        <h1 class="text-2xl font-semibold">Low Quality Detector</h1>
        <p class="text-sm text-slate-500">Region → Execute → Results → Send (next workflow)</p>
      </div>
    </div>

    <!-- Slicer -->
    <div class="bg-white shadow-sm border border-slate-200 rounded-xl p-4 mb-6">
      <h2 class="flex items-center gap-2 text-lg mb-3">
        <i data-lucide="filter" class="w-4 h-4"></i> AI Bot
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_auto_auto] gap-3">
        <div>
          <label class="text-xs text-slate-500">Region</label>
          <select id="regionSelect" class="w-full border rounded p-2">
            ${renderRegionOptions()}
          </select>
        </div>
        <div class="flex gap-2 items-end">
          <button id="executeBtn" class="bg-slate-900 text-white px-3 py-2 rounded flex items-center gap-2">
            <i data-lucide="play" class="w-4 h-4"></i> Execute
          </button>
          <button id="clearBtn" class="border border-slate-300 px-3 py-2 rounded flex items-center gap-2">
            <i data-lucide="trash-2" class="w-4 h-4"></i> Clear
          </button>
        </div>
      </div>
      ${context ? `<p class="mt-2 text-xs">Context: <b>Region: ${escapeHtml(context.region || "-")}</b></p>` : ""}
    </div>

    <!-- Chat Panel -->
    <div class="bg-white shadow-sm border border-slate-200 rounded-xl flex flex-col h-[600px] relative">
      <!-- Modal (hidden by default) -->
      <div id="modalOverlay" class="hidden absolute inset-0 bg-black/30 backdrop-blur-[1px] z-20">
        <div class="h-full w-full grid place-items-center p-4">
          <div class="bg-white rounded-xl p-5 shadow-xl max-w-md w-full border border-slate-200 text-center">
            <div class="mx-auto h-10 w-10 rounded-full bg-slate-900 text-white grid place-items-center mb-3">
              <i data-lucide="bot" class="w-5 h-5"></i>
            </div>
            <h3 class="text-lg font-semibold mb-1">Processing</h3>
            <p class="text-sm text-slate-600">
              The Agent is analysing, please wait for a moment.<br/>
              Thank you for your patience.
            </p>
          </div>
        </div>
      </div>

      <div id="messagesScroll" class="flex-1 overflow-y-auto p-4 space-y-3">
        ${messages.map(renderMessage).join("")}
      </div>

      <!-- Composer -->
      <div class="border-t p-3 flex gap-2 ${composerLocked ? "opacity-60 pointer-events-none" : ""}">
        <textarea id="inputBox" placeholder="${composerLocked ? "" : "Type a message..."}"
          class="flex-1 border rounded p-2 ${composerLocked ? "hidden" : ""}"></textarea>
        <button id="sendBtn" class="bg-slate-900 text-white px-4 py-2 rounded flex items-center gap-2">
          <i data-lucide="send" class="w-4 h-4"></i> Send
        </button>
      </div>
    </div>
  `;

  lucide.createIcons();
  addListeners();
}

function renderRegionOptions() {
  if (!regions || regions.length === 0) {
    return `<option disabled selected>Loading...</option>`;
  }
  const opts = [`<option value="" ${!selectedRegion ? "selected" : ""}>All Regions</option>`]
    .concat(
      regions.map(r => `<option value="${escapeAttr(r)}" ${selectedRegion === r ? "selected" : ""}>${escapeHtml(r)}</option>`)
    );
  return opts.join("");
}

function renderMessage(m) {
  const roleClass = m.role === "user" ? "user" : m.role === "system" ? "system" : "bot";
  const headerIcon = m.role === "user" ? "user" : m.role === "system" ? "settings-2" : "bot";
  const time = m.timestamp && typeof m.timestamp.toLocaleTimeString === "function"
    ? m.timestamp.toLocaleTimeString()
    : "";

  // Support HTML content when m.html === true
  const content = m.html ? m.text : escapeHtml(m.text);

  const containerClasses = `
    message ${roleClass} max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow
    ${roleClass === "user" ? "bg-slate-900 text-white rounded-br-sm ml-auto" :
      roleClass === "system" ? "bg-slate-100 text-slate-700 border border-slate-200" :
      "bg-white text-slate-800 border border-slate-200"}
  `;

  return `
    <div class="${roleClass === "user" ? "flex justify-end" : "flex justify-start"}">
      <div class="${containerClasses.trim()}">
        <div class="flex items-center gap-2 mb-1">
          <i data-lucide="${headerIcon}" class="h-3.5 w-3.5 opacity-80"></i>
          <span class="text-[11px] uppercase tracking-wide opacity-70">${escapeHtml(m.role)}</span>
        </div>
        <div class="text-sm leading-relaxed ${m.html ? "" : "whitespace-pre-wrap"}">${content}</div>
        <div class="mt-1 text-[10px] opacity-60">${escapeHtml(time)}</div>
      </div>
    </div>
  `;
}

// ==== HELPERS ====
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}

// Convert SQL response (rows + columns) to array of objects
function rowsToObjects(sqlResp) {
  const cols = (sqlResp?.columns || []).map(c => c.name);
  const rows = sqlResp?.rows || [];
  return rows.map(arr => {
    const obj = {};
    arr.forEach((v, i) => (obj[cols[i]] = v));
    return obj;
  });
}

// Build a neat HTML table (limited rows/cols)
function tableHtmlFromObjects(objs, maxRows = 15, maxCols = 8) {
  if (!objs || objs.length === 0) {
    return `<div class="text-sm text-slate-600 italic">No rows found.</div>`;
  }
  const cols = Object.keys(objs[0] || {}).slice(0, maxCols);
  const rows = objs.slice(0, maxRows);

  const thead = `
    <thead class="text-xs uppercase bg-slate-50 border-b">
      <tr>${cols.map(c => `<th class="text-left p-2">${escapeHtml(c)}</th>`).join("")}</tr>
    </thead>
  `;
  const tbody = `
    <tbody>
      ${rows.map(r => `
        <tr class="border-b last:border-0">
          ${cols.map(c => `<td class="p-2 align-top">${escapeHtml(r[c])}</td>`).join("")}
        </tr>
      `).join("")}
    </tbody>
  `;

  return `
    <div class="overflow-auto -m-1">
      <table class="min-w-[520px] w-full text-sm m-1">${thead}${tbody}</table>
    </div>
  `;
}

// ==== DATA ACCESS (DOMO) ====
// Try SQL API first; fallback to Data API if needed.
async function getDistinctRegions() {
  // Prefer SQL for distinct + order
  try {
    const sql = 'SELECT DISTINCT "Region" FROM dataset WHERE "Region" IS NOT NULL ORDER BY "Region"';
    const resp = await domo.post(`/sql/v1/datasets/query/execute/${REGION_DATASET_ID}`, { sql });
    const objs = rowsToObjects(resp);
    return objs.map(o => o.Region).filter(Boolean);
  } catch (e) {
    // Fallback: pull rows and uniq client-side
    const data = await domo.get(`/data/v1/${REGION_DATASET_ID}?fields=Region&limit=50000`);
    const uniq = [...new Set((data || []).map(r => r.Region).filter(Boolean))].sort();
    return uniq;
  }
}

async function getOutputRows(region) {
  // Try to filter by Region if the column exists
  try {
    let sql = 'SELECT * FROM dataset';
    if (region) {
      // Quote region safely; regions came from dataset, so risk is low; still escape single quotes
      const val = String(region).replaceAll("'", "''");
      sql += ` WHERE "Region" = '${val}'`;
    }
    sql += " LIMIT 200";
    const resp = await domo.post(`/sql/v1/datasets/query/execute/${OUTPUT_DATASET_ID}`, { sql });
    return rowsToObjects(resp);
  } catch (e) {
    // Fallback: simple list (no filter)
    const data = await domo.get(`/data/v1/${OUTPUT_DATASET_ID}?limit=200`);
    if (region && data && data.length && "Region" in data[0]) {
      return data.filter(r => r.Region === region);
    }
    return data;
  }
}

// ==== UI ACTIONS ====
function showModal(on = true) {
  const el = document.getElementById("modalOverlay");
  if (!el) return;
  el.classList.toggle("hidden", !on);
}

async function handleExecute() {
  selectedRegion = document.getElementById("regionSelect")?.value || "";
  context = { region: selectedRegion || "All" };
  messages.push({
    role: "system",
    text: `Context applied → Region: ${selectedRegion || "All"}`,
    timestamp: new Date(),
  });
  render();

  // Open workflow v1 (new tab)
  window.open(WORKFLOW_V1_URL, "_blank");

  // Show modal + lock composer (hide textarea, keep Send)
  composerLocked = true;
  render();
  showModal(true);

  // Load results
  try {
    const rows = await getOutputRows(selectedRegion || null);
    const countTxt = `${rows?.length || 0} row${(rows?.length || 0) === 1 ? "" : "s"}`;
    const tableHtml = tableHtmlFromObjects(rows);
    messages.push({
      role: "bot",
      html: true,
      text: `
        <div class="mb-1 font-medium">Results ${selectedRegion ? `(Region: ${escapeHtml(selectedRegion)})` : ""} — ${countTxt}</div>
        ${tableHtml}
      `,
      timestamp: new Date(),
    });
  } catch (err) {
    messages.push({
      role: "system",
      text: `Failed to load results: ${err?.message || err}`,
      timestamp: new Date(),
    });
  } finally {
    showModal(false);
    render();
  }
}

function handleClear() {
  messages = [
    {
      role: "bot",
      text:
        "Cleared chat. Choose a Region and click Execute.",
      timestamp: new Date(),
    },
  ];
  context = null;
  composerLocked = false;
  selectedRegion = null;
  render();
}

async function handleSend() {
  // After Execute, textarea is hidden; Send should trigger workflow v2
  if (composerLocked) {
    window.open(WORKFLOW_V2_URL, "_blank");
    messages.push({
      role: "system",
      text: "Triggered the next workflow (v1.0.2).",
      timestamp: new Date(),
    });
    render();
    return;
  }

  // Pre-Execute behavior (normal chat)
  const input = document.getElementById("inputBox");
  const val = (input?.value || "").trim();
  if (!val) return;

  messages.push({ role: "user", text: val, timestamp: new Date() });
  input.value = "";

  // Simple echo
  messages.push({ role: "bot", text: `You said: "${val}" (demo reply).`, timestamp: new Date() });
  render();
}

// ==== LISTENERS ====
function addListeners() {
  const execBtn = document.getElementById("executeBtn");
  const clrBtn = document.getElementById("clearBtn");
  const sendBtn = document.getElementById("sendBtn");
  const regionSel = document.getElementById("regionSelect");

  if (execBtn) execBtn.onclick = handleExecute;
  if (clrBtn) clrBtn.onclick = handleClear;
  if (sendBtn) sendBtn.onclick = handleSend;
  if (regionSel) regionSel.onchange = (e) => (selectedRegion = e.target.value);
}

// ==== INIT ====
async function init() {
  render(); // initial UI with "Loading..." in region select
  try {
    regions = await getDistinctRegions();
    // Default to first region (optional) or keep "All"
    selectedRegion = selectedRegion || "";
  } catch (e) {
    regions = [];
    messages.push({
      role: "system",
      text: `Unable to load Regions: ${e?.message || e}`,
      timestamp: new Date(),
    });
  } finally {
    render();
  }
}

init();
