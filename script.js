"use strict";

const $ = (id) => document.getElementById(id);

const BUILD_WEBSITE_ADDRESS_URL = "https://tinyurl.com/buildwebbd";
const BUILD_WEBSITE_SEARCH_URL = "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home";

let selectedEngine = "google";
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function getActiveTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function openOutside(url) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");

  if (!opened) {
    $("statusText").textContent =
      "Pop-up blocked. Allow pop-ups to open this website.";
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
  const encoded = encodeURIComponent(query.trim());

  if (selectedEngine === "bing") {
    return {
      url: "https://www.bing.com/search?q=" + encoded,
      mode: "embed",
      title: "Bing Search"
    };
  }

  if (selectedEngine === "opera") {
    return {
      url: "https://www.google.com/search?q=" + encoded,
      mode: "external",
      title: "Opera Search"
    };
  }

  if (selectedEngine === "firefox") {
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
    particle.style.setProperty(
      "--duration",
      (10 + Math.random() * 18) + "s"
    );
    particle.style.setProperty(
      "--delay",
      (-Math.random() * 20) + "s"
    );
    particle.style.opacity = (0.2 + Math.random() * 0.7).toString();

    layer.appendChild(particle);
  }
}

function updateNavigationButtons() {
  const tab = getActiveTab();

  const canGoBack =
    tab &&
    tab.view === "page" &&
    tab.historyIndex > 0;

  const canGoForward =
    tab &&
    tab.view === "page" &&
    tab.historyIndex < tab.history.length - 1;

  $("backButton").disabled = !canGoBack;
  $("forwardButton").disabled = !canGoForward;
}

function renderTabs() {
  const tabList = $("tabList");
  tabList.innerHTML = "";

  tabs.forEach((tab) => {
    const tabElement = document.createElement("div");
    tabElement.className = "browser-tab";

    if (tab.id === activeTabId) {
      tabElement.classList.add("active");
    }

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "tab-select";
    selectButton.textContent = tab.title;
    selectButton.title = tab.title;

    selectButton.addEventListener("click", () => {
      switchTab(tab.id);
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "tab-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close tab");

    closeButton.addEventListener("click", () => {
      closeTab(tab.id);
    });

    tabElement.appendChild(selectButton);
    tabElement.appendChild(closeButton);
    tabList.appendChild(tabElement);
  });
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

  setTimeout(() => {
    $("searchInput").focus();
  }, 100);
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

  showPage(tab.url, "Previous Page");
  updateNavigationButtons();
}

function goForward() {
  const tab = getActiveTab();

  if (
    !tab ||
    tab.historyIndex >= tab.history.length - 1
  ) {
    return;
  }

  tab.historyIndex++;
  tab.url = tab.history[tab.historyIndex];
  tab.view = "page";

  showPage(tab.url, "Next Page");
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

  const frame = $("webFrame");
  frame.src = "about:blank";

  setTimeout(() => {
    frame.src = tab.url;
  }, 50);

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
    const url =
      "https://www.google.com/search?q=" +
      encodeURIComponent(address);

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

function selectSearchEngine(engine, button) {
  selectedEngine = engine;

  document.querySelectorAll(".engine-option").forEach((option) => {
    option.classList.toggle("active", option === button);
  });

  const panel = $("searchForm");

  panel.classList.remove("engine-changed");

  requestAnimationFrame(() => {
    panel.classList.add("engine-changed");
  });
}

$("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();

  submitSearch($("searchInput").value);
});

$("addressForm").addEventListener("submit", (event) => {
  event.preventDefault();

  submitAddress($("addressInput").value);
});

document.querySelectorAll(".engine-option").forEach((button) => {
  button.addEventListener("click", () => {
    selectSearchEngine(button.dataset.engine, button);
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
