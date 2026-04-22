const { JSDOM } = require("jsdom");
const fs = require("fs");

const dom = new JSDOM(`<!DOCTYPE html><html><body><script src="/booking-widget.js" data-shop-id="123"></script></body></html>`, { runScripts: "dangerously" });

const scriptContent = fs.readFileSync("public/booking-widget.js", "utf-8");

const scriptEl = dom.window.document.createElement("script");
scriptEl.textContent = scriptContent;
scriptEl.setAttribute("data-shop-id", "123");
dom.window.document.body.appendChild(scriptEl);

setTimeout(() => {
  const container = dom.window.document.getElementById("barbersaas-booking-widget-container");
  console.log("Container exists:", !!container);
  if (container && container.shadowRoot) {
    const btn = container.shadowRoot.getElementById("widget-button");
    console.log("Button exists:", !!btn);
  }
}, 100);
