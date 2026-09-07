import 'webextension-polyfill';

// First install: surface the settings page so the user can choose auto-deploy vs review mode.
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});
