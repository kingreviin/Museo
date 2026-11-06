const blockTypes = [
  { type: 'tick', label: 'Market Tick', color: 'tick' },
  { type: 'if', label: 'If Condition', color: 'if' },
  { type: 'order', label: 'Place Order', color: 'order' },
  { type: 'risk', label: 'Risk Limit', color: 'risk' },
  { type: 'log', label: 'Log Event', color: 'log' },
];

const defaultBots = [
  {
    id: 'bot-1',
    name: 'Bot Alpha',
    accountType: 'demo',
    status: 'Ready',
    blocks: [
      { id: 'b1', type: 'tick', label: 'Market Tick' },
      { id: 'b2', type: 'if', label: 'If Condition' },
      { id: 'b3', type: 'order', label: 'Place Order' },
    ],
  },
  {
    id: 'bot-2',
    name: 'Bot Beta',
    accountType: 'real',
    status: 'Paused',
    blocks: [
      { id: 'b4', type: 'risk', label: 'Risk Limit' },
      { id: 'b5', type: 'log', label: 'Log Event' },
    ],
  },
];

const state = {
  bots: [...defaultBots],
  activeBotId: 'bot-1',
  selectedMode: 'demo',
  socket: null,
  connected: false,
};

const botList = document.getElementById('botList');
const canvas = document.getElementById('canvas');
const activeBotTitle = document.getElementById('activeBotTitle');
const connectionBadge = document.getElementById('connectionBadge');
const logOutput = document.getElementById('logOutput');
const linkedAccountBox = document.getElementById('linkedAccountBox');
const tokenInput = document.getElementById('tokenInput');
const appIdInput = document.getElementById('appIdInput');

function getActiveBot() {
  return state.bots.find((bot) => bot.id === state.activeBotId);
}

function logMessage(message) {
  const entry = document.createElement('div');
  entry.textContent = message;
  logOutput.prepend(entry);
}

function renderBotList() {
  botList.innerHTML = '';

  state.bots.forEach((bot) => {
    const card = document.createElement('div');
    card.className = `bot-card ${bot.id === state.activeBotId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="bot-top">
        <strong>${bot.name}</strong>
        <span class="bot-status"><span class="dot ${bot.accountType === 'real' ? 'yellow' : 'green'}"></span>${bot.accountType}</span>
      </div>
      <small>${bot.blocks.length} blocks • ${bot.status}</small>
      <div class="mini-actions">
        <button data-action="select" data-id="${bot.id}">Open</button>
        <button data-action="toggle" data-id="${bot.id}">${bot.status === 'Ready' ? 'Pause' : 'Run'}</button>
      </div>
    `;

    card.addEventListener('click', (event) => {
      const target = event.target;
      const action = target.dataset.action;
      const botId = target.dataset.id;

      if (!botId) return;

      if (action === 'select') {
        state.activeBotId = botId;
        render();
      }

      if (action === 'toggle') {
        const bot = state.bots.find((item) => item.id === botId);
        bot.status = bot.status === 'Ready' ? 'Paused' : 'Ready';
        renderBotList();
      }
    });

    botList.appendChild(card);
  });
}

function renderCanvas() {
  const activeBot = getActiveBot();
  activeBotTitle.textContent = activeBot.name;

  const blockMenu = document.createElement('div');
  blockMenu.className = 'block-menu';

  blockTypes.forEach((block) => {
    const button = document.createElement('button');
    button.className = 'block-chip';
    button.textContent = block.label;
    button.addEventListener('click', () => addBlock(block.type));
    blockMenu.appendChild(button);
  });

  const list = document.createElement('div');
  list.className = 'block-list';

  activeBot.blocks.forEach((block) => {
    const item = document.createElement('div');
    item.className = 'block-item';

    const blockData = blockTypes.find((type) => type.type === block.type) || blockTypes[0];

    item.innerHTML = `
      <div class="kind">
        <span class="block-badge ${blockData.color}">${blockData.label.slice(0, 1)}</span>
        <span>${block.label}</span>
      </div>
      <button class="delete-block" data-remove="${block.id}">×</button>
    `;

    const removeButton = item.querySelector('.delete-block');
    removeButton.addEventListener('click', () => removeBlock(block.id));

    list.appendChild(item);
  });

  canvas.innerHTML = '';
  canvas.appendChild(blockMenu);
  canvas.appendChild(list);
}

function addBlock(type) {
  const bot = getActiveBot();
  const blockDef = blockTypes.find((item) => item.type === type) || blockTypes[0];

  bot.blocks.push({
    id: `block-${Date.now()}`,
    type,
    label: blockDef.label,
  });

  renderCanvas();
  logMessage(`${bot.name}: added ${blockDef.label}`);
}

function removeBlock(blockId) {
  const bot = getActiveBot();
  bot.blocks = bot.blocks.filter((block) => block.id !== blockId);
  renderCanvas();
  logMessage(`${bot.name}: removed block`);
}

function renderLinkedAccount() {
  const activeBot = getActiveBot();
  const mode = activeBot.accountType || state.selectedMode;
  const connectedText = state.connected ? 'connected' : 'awaiting token';

  linkedAccountBox.innerHTML = `
    <span class="dot ${state.connected ? 'green' : 'yellow'}"></span>
    <div>
      <strong>${mode === 'real' ? 'Real account' : 'Demo account'}</strong>
      <small>${connectedText}</small>
    </div>
  `;
}

function setAccountMode(mode) {
  state.selectedMode = mode;
  const activeBot = getActiveBot();
  activeBot.accountType = mode;

  document.querySelectorAll('.segment').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });

  renderBotList();
  renderLinkedAccount();
  logMessage(`${activeBot.name}: switched to ${mode} mode.`);
}

function connectToDeriv() {
  const appId = appIdInput.value.trim();
  const token = tokenInput.value.trim();

  if (!appId || !token) {
    logMessage('Add your Deriv App ID and API token before connecting.');
    return;
  }

  if (state.socket) {
    state.socket.close();
  }

  const socketUrl = `wss://ws.derivws.com/websockets/v3?app_id=${encodeURIComponent(appId)}`;
  const socket = new WebSocket(socketUrl);
  state.socket = socket;

  socket.onopen = () => {
    state.connected = true;
    connectionBadge.textContent = 'Connected';
    connectionBadge.classList.add('online');
    logMessage(`Connected to Deriv WebSocket using app_id ${appId}.`);

    socket.send(JSON.stringify({ authorize: token }));
    logMessage('Authorization request sent.');
    renderLinkedAccount();
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.error) {
      logMessage(`WebSocket error: ${msg.error.message || 'Unknown error'}`);
      return;
    }

    if (msg.authorize) {
      logMessage(`Authorized: ${msg.authorize.loginid || 'account ready'}`);
    }

    if (msg.msg_type === 'authorize') {
      logMessage(`Account accepted: ${msg.authorize.loginid || 'connected'}`);
    }
  };

  socket.onerror = () => {
    state.connected = false;
    connectionBadge.textContent = 'Offline';
    connectionBadge.classList.remove('online');
    logMessage('WebSocket connection failed. Check your App ID/token and try again.');
    renderLinkedAccount();
  };

  socket.onclose = () => {
    state.connected = false;
    connectionBadge.textContent = 'Offline';
    connectionBadge.classList.remove('online');
    logMessage('WebSocket closed.');
    renderLinkedAccount();
  };
}

function importBotData() {
  const sample = {
    name: 'Imported Strategy',
    accountType: 'demo',
    blocks: [
      { id: 'imp-1', type: 'tick', label: 'Market Tick' },
      { id: 'imp-2', type: 'if', label: 'If Condition' },
      { id: 'imp-3', type: 'order', label: 'Place Order' },
    ],
  };

  const bot = {
    id: `bot-${Date.now()}`,
    name: sample.name,
    accountType: sample.accountType,
    status: 'Ready',
    blocks: sample.blocks,
  };

  state.bots.push(bot);
  state.activeBotId = bot.id;
  render();
  logMessage(`Imported bot: ${bot.name}`);
}

function saveBot() {
  const activeBot = getActiveBot();
  const payload = JSON.stringify(activeBot, null, 2);
  logMessage(`Saved bot: ${activeBot.name}`);
  console.log(payload);
  alert(`Bot saved locally: ${activeBot.name}`);
}

function newBot() {
  const number = state.bots.length + 1;
  const newBotEntry = {
    id: `bot-${Date.now()}`,
    name: `Bot ${String.fromCharCode(64 + number)}`,
    accountType: 'demo',
    status: 'Ready',
    blocks: [{ id: `n-${Date.now()}`, type: 'log', label: 'Log Event' }],
  };

  state.bots.push(newBotEntry);
  state.activeBotId = newBotEntry.id;
  render();
}

function render() {
  renderBotList();
  renderCanvas();
  renderLinkedAccount();
}

document.getElementById('newBotBtn').addEventListener('click', newBot);
document.getElementById('connectBtn').addEventListener('click', connectToDeriv);
document.getElementById('importBotBtn').addEventListener('click', importBotData);
document.getElementById('saveBotBtn').addEventListener('click', saveBot);
document.querySelectorAll('.segment').forEach((button) => {
  button.addEventListener('click', () => setAccountMode(button.dataset.mode));
});

render();
logMessage('Museo bot studio loaded.');
logMessage('Tip: connect with a demo or real Deriv token to authorize the account.');
