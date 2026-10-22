
"use strict";

const $ = (id) => document.getElementById(id);

const BUILD_WEBSITE_URL = "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home";
const HOME_URL = "about:blank";

let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function currentTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function createTab() {
  const tab = {
    id: nextTabId++,
    title: "New Tab",
    url: "",
    history: [],
    historyIndex: -1
  };

  tabs.push(tab);
  activeTabId = tab.id;
  renderTabs();
  showHome();
  return tab;
}

function renderTabs() {
  const tabList = $("tabList");
  tabList.replaceChildren();

  tabs.forEach((tab) => {
    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = "tab" + (tab.id === activeTabId ? " active" : "");
    tabButton.title = tab.title;
    tabButton.setAttribute("aria-label", "Switch to " + tab.title);

    const tabTitle = document.createElement("span");
    tabTitle.className = "tab-title";
    tabTitle.textContent = tab.title;

    const closeButton = document.createElement("span");
    closeButton.className = "tab-close";
    closeButton.textContent = "×";
    closeButton.title = "Close tab";
    closeButton.setAttribute("role", "button");
    closeButton.setAttribute("aria-label", "Close " + tab.title);
    closeButton.tabIndex = 0;

    const closeTab = (event) => {
      event.stopPropagation();
      removeTab(tab.id);
    };

    closeButton.addEventListener("click", closeTab);
    closeButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        closeTab(event);
      }
    });

    tabButton.addEventListener("click", () => {
      switchTab(tab.id);
    });

    tabButton.append(tabTitle, closeButton);
    tabList.appendChild(tabButton);
  });

  $("backButton").disabled = !currentTab() || currentTab().historyIndex <= 0;
  $("forwardButton").disabled =
    !currentTab() ||
    currentTab().historyIndex >= currentTab().history.length - 1;
}

function switchTab(id) {
  const tab = tabs.find((item) => item.id === id);
  if (!tab) return;

  activeTabId = id;
  renderTabs();

  if (tab.url) {
    showPage(tab.url, false);
  } else {
    showHome();
  }
}

function removeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index === -1) return;

  const wasActive = tabs[index].id === activeTabId;
  tabs.splice(index, 1);

  if (tabs.length === 0) {
    createTab();
    return;
  }

  if (wasActive) {
    const nextTab = tabs[Math.max(0, index - 1)];
    activeTabId = nextTab.id;
  }

  renderTabs();
  switchTab(activeTabId);
}

function showHome() {
  $("homeScreen").hidden = false;
  $("pageScreen").hidden = true;
  $("addressInput").value = "";
  $("searchInput").value = "";
  renderTabs();
}

function showPage(url, updateAddress = true) {
  $("homeScreen").hidden = true;
  $("pageScreen").hidden = false;
  $("webFrame").src = url;

  if (updateAddress) {
    $("addressInput").value = url;
  }

  const tab = currentTab();
  if (tab) {
    $("statusText");
    const status = document.querySelector(".status-text");
    if (status) status.textContent = "Viewing " + getHost(url);
  }
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "Website";
  }
}

function resolveAddress(value) {
  const text = value.trim();
  if (!text) return null;

  if (/^build\s+website\s+bd$/i.test(text)) {
    return {
      url: BUILD_WEBSITE_URL,
      title: "Build Website BD"
    };
  }

  if (/^https?:\/\//i.test(text)) {
    try {
      const parsed = new URL(text);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return {
          url: parsed.href,
          title: parsed.hostname.replace(/^www\./i, "")
        };
      }
    } catch {
      return searchUrl(text);
    }
  }

  if (/^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/i.test(text) &&
      !/\s/.test(text)) {
    try {
      const parsed = new URL("https://" + text);
      return {
        url: parsed.href,
        title: parsed.hostname.replace(/^www\./i, "")
      };
    } catch {
      return searchUrl(text);
    }
  }

  return searchUrl(text);
}

function searchUrl(text) {
  return {
    url: "https://www.google.com/search?q=" + encodeURIComponent(text),
    title: "Google Search"
  };
}

function navigate(value) {
  const result = resolveAddress(value);
  if (!result) {
    $("addressInput").focus();
    return;
  }

  let tab = currentTab();
  if (!tab) tab = createTab();

  tab.history = tab.history.slice(0, tab.historyIndex + 1);
  tab.history.push(result.url);
  tab.historyIndex = tab.history.length - 1;
  tab.url = result.url;
  tab.title = result.title || getHost(result.url);

  renderTabs();
  showPage(result.url);
}

function goHome() {
  const tab = currentTab();
  if (tab) {
    tab.url = "";
    tab.title = "New Tab";
  }
  showHome();
}

function goBack() {
  const tab = currentTab();
  if (!tab || tab.historyIndex <= 0) return;

  tab.historyIndex--;
  tab.url = tab.history[tab.historyIndex];
  tab.title = getHost(tab.url);

  renderTabs();
  showPage(tab.url);
}

function goForward() {
  const tab = currentTab();
  if (!tab || tab.historyIndex >= tab.history.length - 1) return;

  tab.historyIndex++;
  tab.url = tab.history[tab.historyIndex];
  tab.title = getHost(tab.url);

  renderTabs();
  showPage(tab.url);
}

function refreshPage() {
  const tab = currentTab();

  if (!tab || !tab.url) {
    showHome();
    return;
  }

  $("webFrame").src = tab.url;
}

function openOutside() {
  const tab = currentTab();
  if (!tab || !tab.url) return;

  window.open(tab.url, "_blank", "noopener,noreferrer");
}

$("addressForm").addEventListener("submit", (event) => {
  event.preventDefault();
  navigate($("addressInput").value);
});

$("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  navigate($("searchInput").value);
});

$("addressInput").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("addressInput").blur();
  }
});

$("backButton").addEventListener("click", goBack);
$("forwardButton").addEventListener("click", goForward);
$("refreshButton").addEventListener("click", refreshPage);
$("homeButton").addEventListener("click", goHome);
$("externalButton").addEventListener("click", openOutside);
$("noticeOpenButton").addEventListener("click", openOutside);

$("topNewTab").addEventListener("click", createTab);

$("brandHome").addEventListener("click", (event) => {
  event.preventDefault();
  goHome();
});

document.querySelectorAll(".quick-link").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.url || "");
  });
});

document.addEventListener("keydown", (event) => {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const modifierPressed = isMac ? event.metaKey : event.ctrlKey;

  if (modifierPressed && event.key.toLowerCase() === "l") {
    event.preventDefault();
    $("addressInput").focus();
    $("addressInput").select();
  }

  if (modifierPressed && event.key.toLowerCase() === "t") {
    event.preventDefault();
    createTab();
  }

  if (event.altKey && event.key === "ArrowLeft") {
    event.preventDefault();
    goBack();
  }

  if (event.altKey && event.key === "ArrowRight") {
    event.preventDefault();
    goForward();
  }
});

createTab();
