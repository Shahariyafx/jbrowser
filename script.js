"use strict";

const $ = (id) => document.getElementById(id);

const BUILD_WEBSITE_ADDRESS_URL = "https://tinyurl.com/buildwebbd";
const BUILD_WEBSITE_SEARCH_URL = "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home";

let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function getActiveTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function openOutside(url) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");

  if (!opened) {
    $("statusText").textContent = "Pop-up blocked. Allow pop-ups to open this website.";
  }

  return opened;
}

function getHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isKnownBlockedHost(host) {
  return (
    host === "google.com" ||
    host.endsWith(".google.com") ||
    host === "google.co" ||
    host.endsWith(".google.co") ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtu.be" ||
    host === "github.com" ||
    host.endsWith(".github.com")
  );
}

function isWebsiteAddress(value) {
  return (
    /^https?:\/\//i.test(value) ||
    /^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(value)
  );
}

function normalizeAddress(value) {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return "https://" + trimmed;
}

function getSearchRequest(query) {
  const engine = $("searchEngine")?.value || "google";
  const encoded = encodeURIComponent(query.trim());

  if (engine === "bing") {
    return {
      url: "https://www.bing.com/search?q=" + encoded,
      mode: "embed",
      title: "Bing Search"
    };
  }

  if (engine === "opera") {
    return {
      url: "https://www.google.com/search?q=" + encoded,
      mode: "external",
      title: "Opera Search"
    };
  }

  if (engine === "firefox") {
    return {
      url: "https://www.google.com/search?q=" + encoded,
      mode: "external",
      title: "Firefox Search"
    };
  }

  return {
    url: "https://www.google.com/search?q=" + encoded,
    mode: "external",
    title: "Google Search"
  };
}

function makeParticles() {
  const layer = $("particleLayer");

  if (!layer) return;

  layer.innerHTML = "";

  for (let i = 0; i < 45; i++) {
    const particle = document.createElement("span");

    particle.className = "pixel";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.setProperty("--duration", (10 + Math.random() * 18) + "s");
    particle.style.setProperty("--delay", (-Math.random() * 20) + "s");
    particle.style.opacity = (0.2 + Math.random() * 0.7).toString();

    layer.appendChild(particle);
  }
}

function updateNavigationButtons() {
  const tab = getActiveTab();

  $("backButton").disabled = !tab || tab.historyIndex <= 0;
  $("forwardButton").disabled =
    !tab || tab.historyIndex >= tab.history.length - 1;
}

function renderTabs() {
  const tabList = $("tabList");
  tabList.innerHTML = "";

  tabs.forEach((tab) => {
    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = "browser-tab";

    if (tab.id === activeTabId) {
      tabButton.classList.add("active");
    }

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title;

    const close = document.createElement("span");
    close.className = "tab-close";
    close.textContent = "×";
    close.setAttribute("role", "button");
    close.setAttribute("aria-label", "Close tab");

    tabButton.appendChild(title);
    tabButton.appendChild(close);

    tabButton.addEventListener("click", (event) => {
      if (event.target === close) {
        closeTab(tab.id);
        return;
      }

      switchTab(tab.id);
    });

    tabList.appendChild(tabButton);
  });
}

function updateTabTitle(title) {
  const tab = getActiveTab();

  if (!tab) return;

  tab.title = title || "New Tab";
  renderTabs();
}

function showHome() {
  $("homeScreen").hidden = false;
  $("pageScreen").hidden = true;
  $("addressInput").value = "";

  const tab = getActiveTab();

  if (tab) {
    tab.view = "home";
    tab.url = "";
    tab.title = "New Tab";
  }

  renderTabs();
  updateNavigationButtons();

  setTimeout(() => $("searchInput").focus(), 100);
}

function showPage(url, title) {
  $("homeScreen").hidden = true;
  $("pageScreen").hidden = false;
  $("webFrame").src = url;
  $("addressInput").value = url;
  $("statusText").textContent = title || "Opening website...";
}

function navigate(url, title = "Website") {
  const tab = getActiveTab();

  if (!tab) return;

  tab.history = tab.history.slice(0, tab.historyIndex + 1);
  tab.history.push(url);
  tab.historyIndex = tab.history.length - 1;
  tab.view = "page";
  tab.url = url;
  tab.title = title;

  renderTabs();
  showPage(url, title);
  updateNavigationButtons();
}

function switchTab(id) {
  const tab = tabs.find((item) => item.id === id);

  if (!tab) return;

  activeTabId = id;
  renderTabs();

  if (tab.view === "page" && tab.url) {
    showPage(tab.url, tab.title);
  } else {
    $("homeScreen").hidden = false;
    $("pageScreen").hidden = true;
    $("addressInput").value = "";
  }

  updateNavigationButtons();
}

function createTab() {
  const tab = {
    id: nextTabId++,
    title: "New Tab",
    view: "home",
    url: "",
    history: [],
    historyIndex: -1
  };

  tabs.push(tab);
  activeTabId = tab.id;

  renderTabs();
  switchTab(tab.id);
}

function closeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);

  if (index === -1) return;

  tabs.splice(index, 1);

  if (tabs.length === 0) {
    createTab();
    return;
  }

  if (activeTabId === id) {
    const nextIndex = Math.min(index, tabs.length - 1);
    switchTab(tabs[nextIndex].id);
  } else {
    renderTabs();
  }
}

function goBack() {
  const tab = getActiveTab();

  if (!tab || tab.historyIndex <= 0) return;

  tab.historyIndex--;
  tab.url = tab.history[tab.historyIndex];
  tab.view = "page";

  const url = tab.url;

  showPage(url, "Previous Page");
  updateNavigationButtons();
}

function goForward() {
  const tab = getActiveTab();

  if (!tab || tab.historyIndex >= tab.history.length - 1) return;

  tab.historyIndex++;
  tab.url = tab.history[tab.historyIndex];
  tab.view = "page";

  const url = tab.url;

  showPage(url, "Next Page");
  updateNavigationButtons();
}

function goHome() {
  showHome();
}

function refreshPage() {
  const tab = getActiveTab();

  if (!tab || tab.view !== "page" || !tab.url) {
    showHome();
    return;
  }

  $("webFrame").src = tab.url;
  $("statusText").textContent = "Refreshing website...";
}

function submitSearch(query) {
  const value = query.trim();

  if (!value) return;

  if (/^build\s+website\s+bd$/i.test(value)) {
    openOutside(BUILD_WEBSITE_SEARCH_URL);
    return;
  }

  const request = getSearchRequest(value);

  if (request.mode === "embed") {
    navigate(request.url, request.title);
  } else {
    openOutside(request.url);
  }
}

function submitAddress(value) {
  const address = value.trim();

  if (!address) return;

  if (/^build\s+website\s+bd$/i.test(address)) {
    openOutside(BUILD_WEBSITE_ADDRESS_URL);
    return;
  }

  if (!isWebsiteAddress(address)) {
    const url = "https://www.google.com/search?q=" + encodeURIComponent(address);
    openOutside(url);
    return;
  }

  const url = normalizeAddress(address);
  const host = getHost(url);

  if (isKnownBlockedHost(host)) {
    openOutside(url);
    return;
  }

  navigate(url, host || "Website");
}

function openQuickLink(url) {
  const host = getHost(url);

  if (isKnownBlockedHost(host)) {
    openOutside(url);
    return;
  }

  navigate(url, host || "Website");
}

$("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const input = $("searchInput");
  submitSearch(input.value);
});

$("addressForm").addEventListener("submit", (event) => {
  event.preventDefault();

  submitAddress($("addressInput").value);
});

$("searchEngine").addEventListener("change", () => {
  const panel = $("searchForm");

  panel.classList.remove("engine-changed");

  requestAnimationFrame(() => {
    panel.classList.add("engine-changed");
  });
});

$("backButton").addEventListener("click", goBack);
$("forwardButton").addEventListener("click", goForward);
$("refreshButton").addEventListener("click", refreshPage);
$("homeButton").addEventListener("click", goHome);
$("newTabButton").addEventListener("click", createTab);
$("brandHome").addEventListener("click", (event) => {
  event.preventDefault();
  goHome();
});

$("externalButton").addEventListener("click", () => {
  const tab = getActiveTab();

  if (tab && tab.url) {
    openOutside(tab.url);
  }
});

document.querySelectorAll(".quick-link").forEach((button) => {
  button.addEventListener("click", () => {
    const url = button.dataset.url;

    if (url) {
      openQuickLink(url);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    $("addressInput").focus();
    $("addressInput").select();
  }

  if (event.ctrlKey && event.key.toLowerCase() === "t") {
    event.preventDefault();
    createTab();
  }

  if (event.ctrlKey && event.key.toLowerCase() === "w") {
    event.preventDefault();

    const tab = getActiveTab();

    if (tab) {
      closeTab(tab.id);
    }
  }
});

makeParticles();
createTab();
