// Force open the tutorial tab when the extension is loaded
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.create({ url: "tutorial.html" });
});

// You can also force it during development
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: "tutorial.html" });
});

let isExtensionActive = false;

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  if (tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
    isExtensionActive = !isExtensionActive;

    // Update the browser action icon
    try {
      await chrome.action.setIcon({
        path: isExtensionActive ? "on48.png" : "off48.png",
        tabId: tab.id
      });
    } catch (error) {
      console.error("Failed to set icon:", error);
    }

    // Inject the content script if necessary
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (error) {
      console.error("Error injecting content script:", error);
    }

    // Send a message to the content script to toggle the state
    try {
      chrome.tabs.sendMessage(tab.id, { active: isExtensionActive });
    } catch (error) {
      console.error("Error sending message to content script:", error);
    }
  }
});
