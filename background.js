const STORAGE_KEYS = {
  BLOCKED_SITES: 'blockedSites',
  UNBLOCK_EXPIRIES: 'unblockExpiries'
};
const ALARM_NAME = 'cleanupExpiredUnblocks';
const RULE_ID_BASE = 1000;

function normalizeDomain(domain) {
  let value = (domain || '').trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '');
  value = value.replace(/^www\./, '');
  const pathIndex = value.indexOf('/');
  if (pathIndex >= 0) {
    value = value.slice(0, pathIndex);
  }
  value = value.replace(/:\d+$/, '');
  value = value.replace(/\.+$/, '');
  if (!value || !/^[a-z0-9.-]+$/.test(value)) {
    return '';
  }
  return value;
}

function getRuleIdForDomain(domain, index) {
  return RULE_ID_BASE + 1 + index;
}

function getStorage(defaults = {}) {
  return new Promise((resolve) => {
    chrome.storage.local.get(defaults, resolve);
  });
}

function setStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

function getDynamicRules() {
  return new Promise((resolve) => {
    chrome.declarativeNetRequest.getDynamicRules(resolve);
  });
}

function updateDynamicRules(details) {
  return new Promise((resolve) => {
    chrome.declarativeNetRequest.updateDynamicRules(details, resolve);
  });
}

function isCurrentlyUnblocked(domain, unblockExpiries) {
  const expiry = unblockExpiries[domain];
  return expiry && expiry > Date.now();
}

function filterActiveDomains(blockedSites, unblockExpiries) {
  return blockedSites.filter((domain) => !isCurrentlyUnblocked(domain, unblockExpiries));
}

function buildRules(domains) {
  return domains.map((domain, index) => ({
    id: getRuleIdForDomain(domain, index),
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: '/blocked.html'
      }
    },
    condition: {
      requestDomains: [domain],
      resourceTypes: ['main_frame']
    }
  }));
}

async function refreshRules() {
  const { blockedSites = [], unblockExpiries = {} } = await getStorage({
    [STORAGE_KEYS.BLOCKED_SITES]: [],
    [STORAGE_KEYS.UNBLOCK_EXPIRIES]: {}
  });

  const activeDomains = filterActiveDomains(blockedSites, unblockExpiries);
  const newRules = buildRules(activeDomains.sort());
  const existingRules = await getDynamicRules();
  const existingIds = existingRules.map((rule) => rule.id);

  await updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: newRules
  });
}

async function cleanupExpiredUnblocks() {
  const { blockedSites = [], unblockExpiries = {} } = await getStorage({
    [STORAGE_KEYS.BLOCKED_SITES]: [],
    [STORAGE_KEYS.UNBLOCK_EXPIRIES]: {}
  });

  const now = Date.now();
  let changed = false;
  Object.keys(unblockExpiries).forEach((domain) => {
    if (unblockExpiries[domain] && unblockExpiries[domain] <= now) {
      delete unblockExpiries[domain];
      changed = true;
    }
  });

  if (changed) {
    await setStorage({ [STORAGE_KEYS.UNBLOCK_EXPIRIES]: unblockExpiries });
    await refreshRules();
  }
}

function scheduleCleanupAlarm() {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(async () => {
  scheduleCleanupAlarm();
  await refreshRules();
});

chrome.runtime.onStartup.addListener(async () => {
  scheduleCleanupAlarm();
  await refreshRules();
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await cleanupExpiredUnblocks();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) {
    return false;
  }

  if (message.action === 'refreshRules') {
    refreshRules().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === 'getState') {
    getStorage({
      [STORAGE_KEYS.BLOCKED_SITES]: [],
      [STORAGE_KEYS.UNBLOCK_EXPIRIES]: {}
    }).then((data) => sendResponse(data));
    return true;
  }

  if (message.action === 'normalizeDomain') {
    sendResponse({ domain: normalizeDomain(message.value) });
    return true;
  }

  return false;
});
