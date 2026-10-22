
"use strict";

const $ = (id) => document.getElementById(id);

const BUILD_WEBSITE_URL =
  "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home";

function bind(id, eventName, callback) {
  const element = $(id);
  if (element) element.addEventListener(eventName, callback);
}

function openOutside(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function googleSearchURL(query) {
  return "https://www.google.com/search?q=" +
    encodeURIComponent(query.trim());
}

function hostFromURL(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
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
  const text = value.trim();

  if (/^https?:\/\//i.test(text)) {
    try {
      const parsed = new URL(text);
      return parsed.protocol === "https:" ||
        parsed.protocol === "http:";
    } catch {
      return false;
    }
  }

  return (
    !/\s/.test(text) &&
    /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/i.test(text)
  );
}

function makeParticles() {
  const layer = $("particleLayer");

  if (
    !layer ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const count = window.innerWidth < 650 ? 12 : 24;

  for (let i = 0; i < count; i++) {
    const pixel = document.createElement("span");
    pixel.className = "pixel";
    pixel.style.left = `${Math.random() * 100}%`;
    pixel.style.setProperty("--duration", `${9 + Math.random() * 12}s`);
    pixel.style.setProperty("--delay", `${-Math.random() * 18}s`);
    pixel.style.setProperty("--drift", `${(Math.random() - 0.5) * 100}px`);
    layer.appendChild(pixel);
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
      button.className = "tab" +
        (tab.id === this.activeId ? " active" : "");
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

      button.addEventListener("click", () => {
        this.switchTab(tab.id);
      });

      button.append(title, close);
      list.appendChild(button);
    });

    const tab = this.current();

    if ($("backButton")) {
      $("backButton").disabled = !tab || tab.historyIndex <= 0;
    }

    if ($("forwardButton")) {
      $("forwardButton").disabled =
        !tab || tab.historyIndex >= tab.history.length - 1;
    }
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

    if (wasActive) {
      this.activeId = this.tabs[Math.max(0, index - 1)].id;
    }

    this.renderTabs();
    this.switchTab(this.activeId);
  },

  switchTab(id) {
    const tab = this.tabs.find((item) => item.id === id);
    if (!tab) return;

    this.activeId = id;
    this.renderTabs();

    if (tab.url) {
      this.showPage(tab.url);
    } else {
      this.showHome();
    }
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
      status.textContent = "Viewing " + hostFromURL(url);
    }
  },

  navigate(url) {
    let tab = this.current();

    if (!tab) {
      this.createTab();
      tab = this.current();
    }

    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
    tab.url = url;
    tab.title = hostFromURL(url) || "Website";

    this.renderTabs();
    this.showPage(url);
  },

  back() {
    const tab = this.current();
    if (!tab || tab.historyIndex <= 0) return;

    tab.historyIndex--;
    tab.url = tab.history[tab.historyIndex];
    tab.title = hostFromURL(tab.url) || "Website";

    this.renderTabs();
    this.showPage(tab.url);
  },

  forward() {
    const tab = this.current();

    if (!tab || tab.historyIndex >= tab.history.length - 1) {
      return;
    }

    tab.historyIndex++;
    tab.url = tab.history[tab.historyIndex];
    tab.title = hostFromURL(tab.url) || "Website";

    this.renderTabs();
    this.showPage(tab.url);
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
    if (tab && tab.url) openOutside(tab.url);
  }
};

/* Address bar: search text opens Google in a new tab. */

bind("addressForm", "submit", (event) => {
  event.preventDefault();

  const input = $("addressInput").value.trim();
  if (!input) return;

  if (/^build\s+website\s+bd$/i.test(input)) {
    openOutside(BUILD_WEBSITE_URL);
    return;
  }

  if (!isWebsiteAddress(input)) {
    openOutside(googleSearchURL(input));
    return;
  }

  let url = input;

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  const host = hostFromURL(url);

  if (isKnownBlockedHost(host)) {
    openOutside(url);
    return;
  }

  browser.navigate(url);
});

/* Homepage search always opens Google results outside the iframe. */

bind("searchForm", "submit", (event) => {
  event.preventDefault();

  const query = $("searchInput").value.trim();
  if (!query) return;

  if (/^build\s+website\s+bd$/i.test(query)) {
    openOutside(BUILD_WEBSITE_URL);
    return;
  }

  openOutside(googleSearchURL(query));
});

/* Main navigation controls. */

bind("backButton", "click", () => browser.back());
bind("forwardButton", "click", () => browser.forward());
bind("refreshButton", "click", () => browser.refresh());
bind("homeButton", "click", () => browser.home());
bind("externalButton", "click", () => browser.openOutside());
bind("noticeOpenButton", "click", () => browser.openOutside());
bind("newTabButton", "click", () => browser.createTab());

bind("brandHome", "click", (event) => {
  event.preventDefault();
  browser.home();
});

/* Quick links open outside the embedded viewer. */

document.querySelectorAll(".quick-link[data-url]").forEach((button) => {
  button.addEventListener("click", () => {
    const url = button.dataset.url;
    if (url) openOutside(url);
  });
});

/* Keyboard shortcuts. */

document.addEventListener("keydown", (event) => {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const modifier = isMac ? event.metaKey : event.ctrlKey;

  if (modifier && event.key.toLowerCase() === "l") {
    event.preventDefault();
    $("addressInput").focus();
    $("addressInput").select();
  }

  if (modifier && event.key.toLowerCase() === "t") {
    event.preventDefault();
    browser.createTab();
  }

  if (event.altKey && event.key === "ArrowLeft") {
    event.preventDefault();
    browser.back();
  }

  if (event.altKey && event.key === "ArrowRight") {
    event.preventDefault();
    browser.forward();
  }
});

makeParticles();
browser.createTab();
