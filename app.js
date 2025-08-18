const app = document.getElementById("app");

// Initial state
let messages = [
  {
    role: "bot",
    text: "Hi! Pick a scenario and model from the slicer above, click Execute, and start chatting. I’ll ask for approval whenever a step needs your confirmation.",
    timestamp: new Date(),
    needsApproval: false,
  },
];
let scenario = "support";
let model = "gpt-4o-mini";
let context = null;
let executing = false;

// Render function
function render() {
  app.innerHTML = `
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div class="h-10 w-10 rounded-2xl bg-slate-900 grid place-items-center text-white shadow">
        <i data-lucide="bot" class="w-5 h-5"></i>
      </div>
      <div>
        <h1 class="text-2xl font-semibold">Chatbot Console</h1>
        <p class="text-sm text-slate-500">Slicer → Execute → Chat → Approve/Reject</p>
      </div>
    </div>

    <!-- Slicer -->
    <div class="bg-white shadow-sm border border-slate-200 rounded-xl p-4 mb-6">
      <h2 class="flex items-center gap-2 text-lg mb-2"><i data-lucide="filter" class="w-4 h-4"></i> Slicer</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="text-xs text-slate-500">Scenario</label>
          <select id="scenario" class="w-full border rounded p-2">
            <option value="support">Customer Support</option>
            <option value="sales">Sales Assistant</option>
            <option value="ops">Operations Helper</option>
            <option value="custom">Custom Workflow</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-slate-500">Model</label>
          <select id="model" class="w-full border rounded p-2">
            <option value="gpt-4o-mini">GPT-4o mini</option>
            <option value="gpt-4.1">GPT-4.1</option>
            <option value="llama3.1">Llama 3.1</option>
            <option value="mistral-large">Mistral Large</option>
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
      ${context ? `<p class="mt-2 text-xs">Context: <b>${context.scenario}</b> • <b>${context.model}</b></p>` : ""}
    </div>

    <!-- Chat Panel -->
    <div class="bg-white shadow-sm border border-slate-200 rounded-xl flex flex-col h-[600px]">
      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="messages">
        ${messages.map(renderMessage).join("")}
      </div>
      <div class="border-t p-3 flex gap-2">
        <textarea id="inputBox" placeholder="Type a message..." class="flex-1 border rounded p-2"></textarea>
        <button id="sendBtn" class="bg-slate-900 text-white px-4 py-2 rounded flex items-center gap-2">
          <i data-lucide="send" class="w-4 h-4"></i> Send
        </button>
      </div>
    </div>
  `;

  lucide.createIcons();
  addListeners();
}

function renderMessage(m) {
  let roleClass = m.role === "user" ? "user" : m.role === "system" ? "system" : "bot";
  return `
    <div class="message ${roleClass}">
      <div class="flex items-center gap-2 mb-1 text-xs opacity-70">
        <i data-lucide="${m.role === "user" ? "user" : m.role === "system" ? "settings-2" : "bot"}" class="w-3 h-3"></i>
        <span>${m.role}</span>
      </div>
      <div class="whitespace-pre-wrap text-sm">${m.text}</div>
      <div class="text-[10px] opacity-60 mt-1">${m.timestamp.toLocaleTimeString()}</div>
    </div>
  `;
}

// Simulate bot response
async function simulateBotReply(userText) {
  await new Promise((r) => setTimeout(r, 500));
  if (/draft\s*approval/i.test(userText)) {
    messages.push({
      role: "bot",
      text: "Draft action:\n• Create refund ticket #RT-4821\n• Notify customer\n\nPlease approve or reject.",
      timestamp: new Date(),
      needsApproval: true,
    });
  } else {
    messages.push({
      role: "bot",
      text: `You said: "${userText}" (demo reply).`,
      timestamp: new Date(),
    });
  }
  render();
}

// Event Listeners
function addListeners() {
  document.getElementById("sendBtn").onclick = () => {
    let input = document.getElementById("inputBox");
    let val = input.value.trim();
    if (!val) return;
    messages.push({ role: "user", text: val, timestamp: new Date() });
    input.value = "";
    simulateBotReply(val);
    render();
  };

  document.getElementById("executeBtn").onclick = () => {
    scenario = document.getElementById("scenario").value;
    model = document.getElementById("model").value;
    context = { scenario, model };
    messages.push({ role: "system", text: `Context applied → ${scenario} • ${model}`, timestamp: new Date() });
    render();
  };

  document.getElementById("clearBtn").onclick = () => {
    messages = [{
      role: "bot",
      text: "Cleared chat. Pick scenario + model and Execute.",
      timestamp: new Date()
    }];
    context = null;
    render();
  };
}

// Initial render
render();
