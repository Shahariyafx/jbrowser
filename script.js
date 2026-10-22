
"use strict";

const $ = (id) => document.getElementById(id);
const BUILD_WEBSITE_URL = "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home";

function makePixelParticles() {
  const container = $("pixelParticles");
  if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const count = window.innerWidth < 600 ? 12 : 22;

  for (let i = 0; i < count; i++) {
    const pixel = document.createElement("span");
    pixel.className = "pixel-particle";
    pixel.style.left = `${Math.random() * 100}%`;
    pixel.style.setProperty("--duration", `${10 + Math.random() * 12}s`);
    pixel.style.setProperty("--delay", `${-Math.random() * 18}s`);
    pixel.style.setProperty("--drift", `${(Math.random() - 0.5) * 100}px`);
    container.appendChild(pixel);
  }
}

const app = {
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
      button.className = `tab${tab.id === this.activeId ? " active" : ""}`;
      button.title = tab.title;

      const title = document.createElement("span");
      title.className = "tab-title";
      title.textContent = tab.title;

      const close = document.createElement("span");
      close.className = "tab-close";
      close.textContent = "×";
      close.title = "Close tab";
      close.setAttribute("role", "button");
      close.tabIndex = 0;
      close.setAttribute("aria-label", `Close ${tab.title}`);

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

    if ($("backButton")) {
      $("backButton").disabled = !tab || tab.historyIndex <= 0;
    }

    if ($("forwardButton")) {
      $("forwardButton").disabled = !tab || tab.historyIndex >= tab.history.length - 1;
    }
  },

  removeTab(id) {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;

    const wasActive = this.activeId === id;
    this.tabs.splice(index, 1);

    if (!this.tabs.length) {
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
      try {
        status.textContent = `Viewing ${new URL(url).hostname.replace(/^www\./i, "")}`;
      } catch {
        status.textContent = "Website view";
      }
    }
  },

  resolve(value) {
    const input = value.trim();
    if (!input) return null;

    if (/^build\s+website\s+bd$/i.test(input)) {
      return {
        url: BUILD_WEBSITE_URL,
        title: "Build Website BD"
      };
    }

    if (/^https?:\/\//i.test(input)) {
      try {
        const parsed = new URL(input);

        if (["https:", "http:"].includes(parsed.protocol)) {
          return {
            url: parsed.href,
            title: parsed.hostname.replace(/^www\./i, "")
          };
        }
      } catch {
        return this.search(input);
      }
    }

    if (!/\s/.test(input) && /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/i.test(input)) {
      try {
        const parsed = new URL(`https://${input}`);

        return {
          url: parsed.href,
          title: parsed.hostname.replace(/^www\./i, "")
        };
      } catch {
        return this.search(input);
      }
    }

    return this.search(input);
  },

  search(value) {
    return {
      url: `https://www.google.com/search?q=${encodeURIComponent(value)}`,
      title: "Google Search"
    };
  },

  navigate(value) {
    const result = this.resolve(value);

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
    tab.title = result.title || this.host(result.url);

    this.renderTabs();
    this.showPage(result.url);
  },

  host(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch {
      return "Website";
    }
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

function bindIfPresent(id, eventName, callback) {
  const element = $(id);
  if (element) element.addEventListener(eventName, callback);
}

bindIfPresent("addressForm", "submit", (event) => {
  event.preventDefault();
  app.navigate($("addressInput").value);
});

bindIfPresent("searchForm", "submit", (event) => {
  event.preventDefault();
  app.navigate($("searchInput").value);
});

bindIfPresent("backButton", "click", () => app.back());
bindIfPresent("forwardButton", "click", () => app.forward());
bindIfPresent("refreshButton", "click", () => app.refresh());
bindIfPresent("homeButton", "click", () => app.home());
bindIfPresent("externalButton", "click", () => app.openOutside());
bindIfPresent("noticeOpenButton", "click", () => app.openOutside());
bindIfPresent("newTabButton", "click", () => app.createTab());

bindIfPresent("brandHome", "click", (event) => {
  if ($("homeScreen")) {
    event.preventDefault();
    app.home();
  }
});

document.querySelectorAll(".quick-link[data-url]").forEach((button) => {
  button.addEventListener("click", () => {
    app.navigate(button.dataset.url || "");
  });
});

document.addEventListener("keydown", (event) => {
  const mac = navigator.platform.toLowerCase().includes("mac");
  const modifier = mac ? event.metaKey : event.ctrlKey;

  if (modifier && event.key.toLowerCase() === "l" && $("addressInput")) {
    event.preventDefault();
    $("addressInput").focus();
    $("addressInput").select();
  }

  if (modifier && event.key.toLowerCase() === "t" && $("newTabButton")) {
    event.preventDefault();
    app.createTab();
  }

  if (event.altKey && event.key === "ArrowLeft") {
    app.back();
  }

  if (event.altKey && event.key === "ArrowRight") {
    app.forward();
  }
});

makePixelParticles();

if ($("tabList")) {
  app.createTab();
}
