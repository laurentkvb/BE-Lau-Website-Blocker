const siteInput = document.getElementById('siteInput');
const addButton = document.getElementById('addButton');
const unblockAllButton = document.getElementById('unblockAllButton');
const reblockAllButton = document.getElementById('reblockAllButton');
const siteList = document.getElementById('siteList');
const statusMessage = document.getElementById('statusMessage');

let currentState = {
  blockedSites: [],
  unblockExpiries: {}
};

function normalizeDomain(value) {
  let domain = (value || '').trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  const slashIndex = domain.indexOf('/');
  if (slashIndex >= 0) {
    domain = domain.slice(0, slashIndex);
  }
  domain = domain.replace(/:\d+$/, '');
  domain = domain.replace(/\.+$/, '');
  if (!domain || !/^[a-z0-9.-]+$/.test(domain)) {
    return '';
  }
  return domain;
}

function setStatus(text, type = 'info') {
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
  if (text) {
    window.clearTimeout(setStatus.timeout);
    setStatus.timeout = window.setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = 'status-message';
    }, 3000);
  }
}

function formatCountdown(expiry) {
  const remaining = expiry - Date.now();
  if (remaining <= 0) {
    return 'Expired';
  }
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
}

function buildSiteEntry(domain, expiry) {
  const item = document.createElement('div');
  item.className = 'site-item';

  const left = document.createElement('div');
  left.className = 'site-meta';
  const title = document.createElement('div');
  title.className = 'site-domain';
  title.textContent = domain;
  left.appendChild(title);

  if (expiry) {
    const badge = document.createElement('span');
    badge.className = 'badge active';
    badge.textContent = formatCountdown(expiry);
    left.appendChild(badge);
  }

  item.appendChild(left);

  const actions = document.createElement('div');
  actions.className = 'site-actions';

  if (expiry) {
    const reblock = document.createElement('button');
    reblock.className = 'secondary-button';
    reblock.textContent = 'Re-block now';
    reblock.dataset.action = 'reblock';
    reblock.dataset.domain = domain;
    actions.appendChild(reblock);
  } else {
    [5, 10, 30].forEach((minutes) => {
      const button = document.createElement('button');
      button.className = 'small-button';
      button.textContent = `Unblock ${minutes}m`;
      button.dataset.action = 'unblock';
      button.dataset.domain = domain;
      button.dataset.minutes = minutes;
      actions.appendChild(button);
    });
  }

  const remove = document.createElement('button');
  remove.className = 'secondary-button';
  remove.textContent = 'Remove';
  remove.dataset.action = 'remove';
  remove.dataset.domain = domain;
  actions.appendChild(remove);

  item.appendChild(actions);
  return item;
}

function hasActiveUnblocks() {
  return Object.values(currentState.unblockExpiries).some((expiry) => expiry > Date.now());
}

function updateActionButtons() {
  reblockAllButton.hidden = !hasActiveUnblocks();
}

function renderSiteList() {
  siteList.innerHTML = '';
  if (!currentState.blockedSites.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No blocked sites yet. Add a domain to begin blocking distractions.';
    siteList.appendChild(emptyState);
    updateActionButtons();
    return;
  }

  currentState.blockedSites.forEach((domain) => {
    const expiry = currentState.unblockExpiries[domain];
    const element = buildSiteEntry(domain, expiry && expiry > Date.now() ? expiry : null);
    siteList.appendChild(element);
  });

  updateActionButtons();
}

function saveState() {
  return new Promise((resolve) => {
    chrome.storage.local.set(currentState, () => {
      chrome.runtime.sendMessage({ action: 'refreshRules' });
      resolve();
    });
  });
}

function loadState() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ blockedSites: [], unblockExpiries: {} }, (state) => {
      currentState = state;
      renderSiteList();
      resolve();
    });
  });
}

function addSite() {
  const domain = normalizeDomain(siteInput.value);
  if (!domain) {
    setStatus('Enter a valid domain like example.com.', 'error');
    return;
  }
  if (currentState.blockedSites.includes(domain)) {
    setStatus('This domain is already blocked.', 'error');
    return;
  }
  currentState.blockedSites.push(domain);
  currentState.blockedSites.sort();
  siteInput.value = '';
  saveState().then(() => {
    renderSiteList();
    setStatus(`Added ${domain}.`, 'success');
  });
}

function updateUnblock(domain, minutes) {
  currentState.unblockExpiries[domain] = Date.now() + minutes * 60000;
  saveState().then(() => {
    renderSiteList();
    setStatus(`${domain} is unblocked for ${minutes} minutes.`, 'success');
  });
}

function reblockSite(domain) {
  delete currentState.unblockExpiries[domain];
  saveState().then(() => {
    renderSiteList();
    setStatus(`Re-blocked ${domain}.`, 'success');
  });
}

function removeSite(domain) {
  currentState.blockedSites = currentState.blockedSites.filter((entry) => entry !== domain);
  delete currentState.unblockExpiries[domain];
  saveState().then(() => {
    renderSiteList();
    setStatus(`Removed ${domain}.`, 'success');
  });
}

function unblockAll() {
  if (!currentState.blockedSites.length) {
    setStatus('No blocked sites available to unblock.', 'error');
    return;
  }
  const expiry = Date.now() + 5 * 60000;
  currentState.blockedSites.forEach((domain) => {
    currentState.unblockExpiries[domain] = expiry;
  });
  saveState().then(() => {
    renderSiteList();
    setStatus('All sites are unblocked for 5 minutes.', 'success');
  });
}

function reblockAll() {
  if (!hasActiveUnblocks()) {
    setStatus('No active unblock timers to re-block.', 'error');
    return;
  }
  Object.keys(currentState.unblockExpiries).forEach((domain) => {
    if (currentState.unblockExpiries[domain] > Date.now()) {
      delete currentState.unblockExpiries[domain];
    }
  });
  saveState().then(() => {
    renderSiteList();
    setStatus('All temporary unblocks have been re-blocked.', 'success');
  });
}

addButton.addEventListener('click', addSite);
reblockAllButton.addEventListener('click', reblockAll);
siteInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addSite();
  }
});
siteList.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }
  const domain = button.dataset.domain;
  if (!domain) {
    return;
  }
  const action = button.dataset.action;
  if (action === 'remove') {
    removeSite(domain);
  } else if (action === 'reblock') {
    reblockSite(domain);
  } else if (action === 'unblock') {
    updateUnblock(domain, Number(button.dataset.minutes));
  }
});

unblockAllButton.addEventListener('click', unblockAll);

loadState();
setInterval(() => {
  renderSiteList();
}, 1000);
