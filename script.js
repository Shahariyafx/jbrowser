const $ = id => document.getElementById(id);

let tabs = [];
let activeTabId = 0;
let nextTabId = 1;

function createTab() {
  return {
    id: nextTabId++,
    title: "New Tab",
    url: "",
    history: [],
    historyIndex: -1
  };
}

function currentTab() {
  return tabs.find(tab => tab.id === activeTabId);
}

function updateStatus(message) {
  const status = document.querySelector(".status-text");
  if (status) status.textContent = message;
}

function renderTabs() {
  const container = $("tabList");
  container.replaceChildren();

  tabs.forEach(tab => {
    const item = document.createElement("div");
    item.className = "tab" + (tab.id === activeTabId ? " active" : "");
    item.setAttribute("role", "tab");
    item.setAttribute("aria-selected", String(tab.id === activeTabId));

    const label = document.createElement("span");
    label.className = "tab-label";
    label.textContent = tab.title;

    const close = document.createElement("button");
    close.className = "tab-close";
    close.type = "button";
    close.textContent = "×";
    close.title = "Close tab";
    close.setAttribute("aria-label", "Close " + tab.title);

    close.addEventListener("click", event => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    item.append(label, close);

    item.addEventListener("click", () => {
      activateTab(tab.id);
    });

    container.appendChild(item);
  });
}

function activateTab(id) {
  activeTabId = id;
  renderTabs();
  displayCurrentTab();

  const tab = currentTab();

  if (tab && tab.url) {
    openOutside(tab.url);
  }
}

function displayCurrentTab() {
  const tab = currentTab();

  if (!tab) return;

  $("homeScreen").hidden = false;
  $("pageScreen").hidden = true;
  $("webFrame").src = "about:blank";
  $("addressInput").value = tab.url;

  updateStatus(tab.url ? "Destination ready" : "Ready to browse");
}

function newTab() {
  const tab = createTab();

  tabs.push(tab);
  activeTabId = tab.id;

  renderTabs();
  displayCurrentTab();

  $("addressInput").value = "";
  $("addressInput").focus();
}

function closeTab(id) {
  if (tabs.length === 1) {
    tabs = [createTab()];
    activeTabId = tabs[0].id;
  } else {
    const index = tabs.findIndex(tab => tab.id === id);

    tabs = tabs.filter(tab => tab.id !== id);

    if (activeTabId === id) {
      const newIndex = Math.max(0, index - 1);
      activeTabId = tabs[newIndex].id;
    }
  }

  renderTabs();
  displayCurrentTab();
}

function resolveAddress(value) {
  const input = value.trim();

  if (!input) return null;

  const normalizedInput = input
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (normalizedInput === "build website bd") {
    return {
      url: "https://sites.google.com/view/buildwebsitesbd-jihanstudiobd/home",
      search: false
    };
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);

      if (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      ) {
        return {
          url: parsed.href,
          search: false
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  const isDomain =
    /^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?([/?#].*)?$/i.test(input) ||
    /^[^\s./]+\.[a-z]{2,}(?::\d+)?(?:[/?#][^\s]*)?$/i.test(input);

  if (isDomain) {
    return {
      url: "https://" + input,
      search: false
    };
  }

  return {
    url: "https://www.google.com/search?q=" + encodeURIComponent(input),
    search: true
  };
}

function openOutside(url) {
  if (!url) return;

  const newWindow = window.open(url, "_blank");

  if (newWindow) {
    newWindow.opener = null;
    updateStatus("Opened in a new tab");
  } else {
    updateStatus("Opening destination");
    window.location.href = url;
  }
}

function navigate(value) {
  const result = resolveAddress(value);

  if (!result) {
    updateStatus("Enter a valid website or search");
    $("addressInput").focus();
    return;
  }

  const tab = currentTab();

  if (!tab) return;

  tab.history = tab.history.slice(0, tab.historyIndex + 1);
  tab.history.push(result.url);
  tab.historyIndex = tab.history.length - 1;
  tab.url = result.url;

  try {
    const hostname = new URL(result.url).hostname;
    tab.title = result.search
      ? "Google Search"
      : hostname.replace(/^www\./, "");
  } catch {
    tab.title = "Website";
  }

  renderTabs();
  displayCurrentTab();
  openOutside(result.url);
}

function goHome() {
  const tab = currentTab();

  if (!tab) return;

  tab.title = "New Tab";
  tab.url = "";
  tab.history = [];
  tab.historyIndex = -1;

  renderTabs();
  displayCurrentTab();

  $("addressInput").value = "";
  $("searchInput").value = "";
  updateStatus("Ready to browse");
}

function goBack() {
  const tab = currentTab();

  if (!tab || tab.historyIndex <= 0) {
    updateStatus("No previous destination");
    return;
  }

  tab.historyIndex--;
  tab.url = tab.history[tab.historyIndex];
  renderTabs();
  displayCurrentTab();
  openOutside(tab.url);
}

function goForward() {
  const tab = currentTab();

  if (!tab || tab.historyIndex >= tab.history.length - 1) {
    updateStatus("No next destination");
    return;
  }

  tab.historyIndex++;
  tab.url = tab.history[tab.historyIndex];
  renderTabs();
  displayCurrentTab();
  openOutside(tab.url);
}

function refreshPage() {
  const tab = currentTab();

  if (tab && tab.url) {
    openOutside(tab.url);
  } else {
    window.location.reload();
  }
}

function openCurrentExternally() {
  const address = $("addressInput").value.trim();
  const tab = currentTab();

  const result = resolveAddress(address || (tab && tab.url));

  if (result) {
    openOutside(result.url);
  }
}

$("addressForm").addEventListener("submit", event => {
  event.preventDefault();
  navigate($("addressInput").value);
});

$("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  navigate($("searchInput").value);
});

document.querySelectorAll(".quick-link").forEach(button => {
  button.addEventListener("click", () => {
    navigate(button.dataset.url);
  });
});

$("backButton").addEventListener("click", goBack);
$("forwardButton").addEventListener("click", goForward);
$("refreshButton").addEventListener("click", refreshPage);
$("homeButton").addEventListener("click", goHome);
$("newTabButton").addEventListener("click", newTab);
$("topNewTab").addEventListener("click", newTab);
$("externalButton").addEventListener("click", openCurrentExternally);
$("noticeOpenButton").addEventListener("click", openCurrentExternally);

$("brandHome").addEventListener("click", event => {
  event.preventDefault();
  goHome();
});

tabs.push(createTab());
activeTabId = tabs[0].id;

renderTabs();
displayCurrentTab();
