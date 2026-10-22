
"use strict";

const $ = (id) => document.getElementById(id);
const BUILD_WEBSITE_URL = "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home";

function bind(id, event, callback) {
  const element = $(id);
  if (element) element.addEventListener(event, callback);
}

function makeParticles() {
  const layer = $("particleLayer");
  if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const amount = window.innerWidth < 650 ? 12 : 24;

  for (let i = 0; i < amount; i++) {
    const particle = document.createElement("span");
    particle.className = "pixel";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.setProperty("--duration", `${9 + Math.random() * 12}s`);
    particle.style.setProperty("--delay", `${-Math.random() * 18}s`);
    particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 100}px`);
    layer.appendChild(particle);
  }
}

const browser = {
  tabs: [],
  activeId: 0,
  nextId: 1,

  current() {
    return this.tabs.find((tab) => tab.id === this.activeId) || null;
  },

  createTab() {
    const tab = {
      id: this.nextId++,
      title: "New Tab",
      url: "",
      history: [],
      historyIndex: -1
    };
    this.tabs.push(tab);
    this.activeId = tab.id;
    this.renderTabs();
    this.showHome();
  },

  renderTabs() {
    const list = $("tabList");
    if (!list) return;

    list.replaceChildren();

    this.tabs.forEach((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tab" + (tab.id === this.activeId ? " active" : "");
      button.title = tab.title;

      const title = document.createElement("span");
      title.className = "tab-title";
      title.textContent = tab.title;

      const close = document.createElement("span");
      close.className = "tab-close";
      close.textContent = "×";
      close.title = "Close tab";
      close.tabIndex = 0;
      close.setAttribute("role", "button");
      close.setAttribute("aria-label", "Close " + tab.title);

      const closeTab = (event) => {
        event.stopPropagation();
        this.removeTab(tab.id);
      };

      close.addEventListener("click", closeTab);
      close.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          closeTab(event);
        }
      });

      button.addEventListener("click", () => this.switchTab(tab.id));
      button.append(title, close);
      list.appendChild(button);
    });

    const tab = this.current();
    if ($("backButton")) $("backButton").disabled = !tab || tab.historyIndex <= 0;
    if ($("forwardButton")) $("forwardButton").disabled = !tab || tab.historyIndex >= tab.history.length - 1;
  },

  removeTab(id) {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;

    const wasActive = this.activeId === id;
    this.tabs.splice(index, 1);

    if (this.tabs.length === 0) {
      this.createTab();
      return;
    }

    if (wasActive) this.activeId = this.tabs[Math.max(0, index - 1)].id;
    this.renderTabs();
    this.switchTab(this.activeId);
  },

  switchTab(id) {
    const tab = this.tabs.find((item) => item.id === id);
    if (!tab) return;

    this.activeId = id;
    this.renderTabs();
    if (tab.url) this.showPage(tab.url);
    else this.showHome();
  },

  hideViews() {
    if ($("homeScreen")) $("homeScreen").hidden = true;
    if ($("pageScreen")) $("pageScreen").hidden = true;
  },

  showHome() {
    this.hideViews();
    if ($("homeScreen")) $("homeScreen").hidden = false;
    if ($("addressInput")) $("addressInput").value = "";
    if ($("searchInput")) $("searchInput").value = "";
    this.renderTabs();
  },

  showPage(url) {
    this.hideViews();
    if ($("pageScreen")) $("pageScreen").hidden = false;
    if ($("webFrame")) $("webFrame").src = url;
    if ($("addressInput")) $("addressInput").value = url;

    const status = document.querySelector(".status-text");
    if (status) {
      try {
        status.textContent = "Viewing " + new URL(url).hostname.replace(/^www\./i, "");
      } catch {
        status.textContent = "Website view";
      }
    }
  },

  searchUrl(query) {
    const engine = $("searchEngine") ? $("searchEngine").value : "google";
    const base = engine === "bing"
      ? "https://www.bing.com/search?q="
      : "https://www.google.com/search?q=";

    return {
      url: base + encodeURIComponent(query),
      title: engine === "bing" ? "Bing Search" : "Google Search"
    };
  },

  resolve(value, alwaysSearch = false) {
    const input = value.trim();
    if (!input) return null;

    if (/^build\s+website\s+bd$/i.test(input)) {
      return { url: BUILD_WEBSITE_URL, title: "Build Website BD" };
    }

    if (!alwaysSearch && /^https?:\/\//i.test(input)) {
      try {
        const parsed = new URL(input);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          return {
            url: parsed.href,
            title: parsed.hostname.replace(/^www\./i, "")
          };
        }
      } catch {
        return this.searchUrl(input);
      }
    }

    if (!alwaysSearch && !/\s/.test(input) &&
        /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/i.test(input)) {
      try {
        const parsed = new URL("https://" + input);
        return {
          url: parsed.href,
          title: parsed.hostname.replace(/^www\./i, "")
        };
      } catch {
        return this.searchUrl(input);
      }
    }

    return this.searchUrl(input);
  },

  navigate(value, alwaysSearch = false) {
    const result = this.resolve(value, alwaysSearch);
    if (!result) {
      if ($("addressInput")) $("addressInput").focus();
      return;
    }

    let tab = this.current();
    if (!tab) {
      this.createTab();
      tab = this.current();
    }

    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(result.url);
    tab.historyIndex = tab.history.length - 1;
    tab.url = result.url;
    tab.title = result.title;

    this.renderTabs();
    this.showPage(result.url);
  },

  back() {
    const tab = this.current();
    if (!tab || tab.historyIndex <= 0) return;

    tab.historyIndex--;
    tab.url = tab.history[tab.historyIndex];
    tab.title = this.host(tab.url);
    this.renderTabs();
    this.showPage(tab.url);
  },

  forward() {
    const tab = this.current();
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;

    tab.historyIndex++;
    tab.url = tab.history[tab.historyIndex];
    tab.title = this.host(tab.url);
    this.renderTabs();
    this.showPage(tab.url);
  },

  host(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch {
      return "Website";
    }
  },

  home() {
    const tab = this.current();
    if (tab) {
      tab.url = "";
      tab.title = "New Tab";
    }
    this.showHome();
  },

  refresh() {
    const tab = this.current();
    if (tab && tab.url && $("webFrame")) {
      $("webFrame").src = tab.url;
    } else {
      this.showHome();
    }
  },

  openOutside() {
    const tab = this.current();
    if (tab && tab.url) {
      window.open(tab.url, "_blank", "noopener,noreferrer");
    }
  }
};

bind("addressForm", "submit", (event) => {
  event.preventDefault();
  browser.navigate($("addressInput").value);
});

bind("searchForm", "submit", (event) => {
  event.preventDefault();
  browser.navigate($("searchInput").value, true);
});

bind("backButton", "click", () => browser.back());
bind("forwardButton", "click", () => browser.forward());
bind("refreshButton", "click", () => browser.refresh());
bind("homeButton", "click", () => browser.home());
bind("externalButton", "click", () => browser.openOutside());
bind("noticeOpenButton", "click", () => browser.openOutside());
bind("newTabButton", "click", () => browser.createTab());

bind("brandHome", "click", (event) => {
  if ($("homeScreen")) {
    event.preventDefault();
    browser.home();
  }
});

document.querySelectorAll(".quick-link[data-url]").forEach((button) => {
  button.addEventListener("click", () => browser.navigate(button.dataset.url));
});

document.addEventListener("keydown", (event) => {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const modifier = isMac ? event.metaKey : event.ctrlKey;

  if (modifier && event.key.toLowerCase() === "l" && $("addressInput")) {
    event.preventDefault();
    $("addressInput").focus();
    $("addressInput").select();
  }

  if (modifier && event.key.toLowerCase() === "t" && $("newTabButton")) {
    event.preventDefault();
    browser.createTab();
  }

  if (event.altKey && event.key === "ArrowLeft") browser.back();
  if (event.altKey && event.key === "ArrowRight") browser.forward();
});

makeParticles();

if ($("tabList")) browser.createTab();
