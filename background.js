// background.js
// Content script is auto-injected by manifest.json on codewars.com pages
// Nothing needed here for now — keeping for future platform expansion

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") return;
    if (!tab.url) return;
    if (!tab.url.includes("codewars.com/kata")) return;

    // Notify content.js that the page has fully loaded (SPA navigation)
    chrome.tabs.sendMessage(tabId, { type: "PAGE_LOADED" }).catch(() => { });
});