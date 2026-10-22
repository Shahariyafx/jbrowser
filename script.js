"use strict";

const $ = (id) => document.getElementById(id);
const BUILD_WEBSITE_URL = "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home";

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
  const list = $("tabList");
  list.replaceChildren();

  tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab" + (tab.id === activeTabId ? " active" : "");
    button.title = tab.title;

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title;

    const close = document.createElement("span");
    close.className = "tab-close";
    close.textContent = "×";
    close.title = "Close tab";
    close.setAttribute("role", "button");
    close.setAttribute("tabindex", "0");
    close.setAttribute("aria-label", "Close " + tab.title);

    const closeThisTab = (event) => {
      event.stopPropagation();
      removeTab(tab.id);
    };

    close.addEventListener("click", closeThisTab);
    close.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        closeThisTab(event);
      }
    });

    button.addEventListener("click", () => switchTab(tab.id));
    button.append(title, close);
    list.appendChild(button);
  });

  const tab = currentTab();
  $("backButton").disabled = !tab || tab.historyIndex <= 0;
  $("forwardButton").disabled = !tab || tab.historyIndex >= tab.history.length - 1;
}

function removeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index < 0) return;

  const wasActive = tabs[index].id === activeTabId;
  tabs.splice(index, 1);

  if (!tabs.length) {
    createTab();
    return;
  }

  if (wasActive) {
    activeTabId = tabs[Math.max(0, index - 1)].id;
  }

  renderTabs();
  switchTab(activeTabId);
}

function switchTab(id) {
  const tab = tabs.find((item) => item.id === id);
  if (!tab) return;

  activeTabId = id;
  renderTabs();

  if (tab.url) showPage(tab.url);
  else showHome();
}

function hideAllPages() {
  $("homeScreen").hidden = true;
  $("creditsPage").hidden = true;
  $("pageScreen").hidden = true;
}

function showHome() {
  hideAllPages();
  $("homeScreen").hidden = false;
  $("addressInput").value = "";
  $("searchInput").value = "";
  renderTabs();
}

function showCredits() {
  hideAllPages();
  $("creditsPage").hidden = false;
  renderTabs();
}

function showPage(url) {
  hideAllPages();
  $("pageScreen").hidden = false;
  $("webFrame").src = url;
  $("addressInput").value = url;

  const status = document.querySelector(".status-text");
  if (status) status.textContent = "Viewing " + getHost(url);
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "Website";
  }
}

function searchResult(query) {
  return {
    url: "https://www.google.com/search?q=" + encodeURIComponent(query),
    title: "Google Search"
  };
}

function resolveAddress(value) {
  const input = value.trim();
  if (!input) return null;

  if (/^build\s+website\s+bd$/i.test(input)) {
    return { url: BUILD_WEBSITE_URL, title: "Build Website BD" };
  }

  if (/^https?:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return {
          url: parsed.href,
          title: parsed.hostname.replace(/^www\./i, "")
        };
      }
    } catch {
      return searchResult(input);
    }
  }

  if (!/\s/.test(input) && /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/i.test(input)) {
    try {
      const parsed = new URL("https://" + input);
      return {
        url: parsed.href,
        title: parsed.hostname.replace(/^www\./i, "")
      };
    } catch {
      return searchResult(input);
    }
  }

  return searchResult(input);
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

function goHome() {
  const tab = currentTab();
  if (tab) {
    tab.url = "";
    tab.title = "New Tab";
  }
  showHome();
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

$("openCreditsButton").addEventListener("click", showCredits);
$("backToHomeButton").addEventListener("click", goHome);
$("creditsHomeButton").addEventListener("click", goHome);

document.querySelectorAll(".quick-link").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.url || ""));
});

document.addEventListener("keydown", (event) => {
  const mac = navigator.platform.toLowerCase().includes("mac");
  const modifier = mac ? event.metaKey : event.ctrlKey;

  if (modifier && event.key.toLowerCase() === "l") {
    event.preventDefault();
    $("addressInput").focus();
    $("addressInput").select();
  }

  if (modifier && event.key.toLowerCase() === "t") {
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

  if (event.key === "Escape" && !$("creditsPage").hidden) {
    goHome();
  }
});

function createParticles() {
  const container = $("shaderParticles");
  if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const count = window.innerWidth < 600 ? 18 : 32;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = (Math.random() * 100) + "%";
    particle.style.setProperty("--duration", (9 + Math.random() * 12) + "s");
    particle.style.setProperty("--delay", (-Math.random() * 18) + "s");
    particle.style.setProperty("--drift", ((Math.random() - 0.5) * 130) + "px");
    particle.style.opacity = (0.15 + Math.random() * 0.35).toFixed(2);
    container.appendChild(particle);
  }
}

createParticles();
createTab();
