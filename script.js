
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
    window.matchMedia("(prefers-reduced-motion: reduce
