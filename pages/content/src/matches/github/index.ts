import { t } from '@extension/i18n';
import { deploySettingsStorage } from '@extension/storage';
import { buildSealosDeployUrl, DEFAULT_AUTO_DEPLOY, parseGithubRepoRoot } from '@src/deploy-link';

/**
 * Injects a "Deploy on Sealos" button into the GitHub repository header actions row
 * (next to Watch / Star / Fork). Shown only on a repository root page; removed on every
 * other GitHub page and after client-side (turbo) tab navigation, since the header
 * persists across those.
 *
 * GitHub is migrating the repo header from the legacy SSR markup (ul.pagehead-actions)
 * to a React implementation (ul[data-testid="repo-header-actions"]); both anchors are
 * supported. The legacy `btn btn-sm` classes still resolve to GitHub's native button
 * style on both, so the injected control looks native without shipping custom CSS.
 */

const BUTTON_ID = 'sealos-deploy-button';
const ITEM_ID = 'sealos-deploy-item';

// Sealos logo blue (sampled from the extension icon), with a darker hover shade.
// Inlined because this content script ships no CSS file; `!important` beats GitHub's
// .btn theme variables in both light and dark mode.
const ensureButtonStyle = () => {
  if (document.getElementById('sealos-deploy-button-style')) return;
  const style = document.createElement('style');
  style.id = 'sealos-deploy-button-style';
  style.textContent = `
    #${BUTTON_ID} {
      background-color: #55acf8 !important;
      border-color: transparent !important;
      color: #ffffff !important;
    }
    #${BUTTON_ID}:hover {
      background-color: #3e9df5 !important;
    }
  `;
  document.head.appendChild(style);
};

const ACTIONS_ROW_SELECTORS = ['ul[data-testid="repo-header-actions"]', 'ul.pagehead-actions'];

const findActionsRow = (): HTMLElement | null => {
  for (const selector of ACTIONS_ROW_SELECTORS) {
    const row = document.querySelector<HTMLElement>(selector);
    if (row) return row;
  }
  return null;
};

/**
 * Detects a GitHub repository root page and returns its canonical root URL.
 * The URL gate rejects /tree/..., /pull/..., query params, non-github.com hosts and
 * two-segment non-repo paths; the actions-row marker confirms a repository header is
 * actually rendered (account/org/settings pages never have one).
 */
const currentRepoRoot = (): string | null => {
  if (!findActionsRow()) return null;
  // location.pathname covers trailing slash and ".git"; query/hash fragments never
  // belong to the repo root protocol value, so they are dropped here.
  return parseGithubRepoRoot(`${location.origin}${location.pathname}`);
};

/**
 * A live auto-deploy flag kept in sync with chrome.storage so clicks and re-injections
 * always build the URL with the user's current setting.
 */
let autoDeploy = DEFAULT_AUTO_DEPLOY;
deploySettingsStorage.get().then(state => {
  autoDeploy = state.autoDeploy;
});
deploySettingsStorage.subscribe(() => {
  const state = deploySettingsStorage.getSnapshot();
  if (!state) return;
  autoDeploy = state.autoDeploy;
  const button = document.getElementById(BUTTON_ID);
  const root = currentRepoRoot();
  if (button instanceof HTMLAnchorElement && root) {
    button.href = buildSealosDeployUrl(root, autoDeploy);
  }
});

const createItem = (repoRootUrl: string): HTMLLIElement => {
  ensureButtonStyle();
  const item = document.createElement('li');
  item.id = ITEM_ID;

  const button = document.createElement('a');
  button.id = BUTTON_ID;
  button.href = buildSealosDeployUrl(repoRootUrl, autoDeploy);
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.className = 'btn btn-sm';
  button.setAttribute('role', 'button');
  button.textContent = t('deployOnSealos');

  item.appendChild(button);
  return item;
};

const syncButton = () => {
  const repoRootUrl = currentRepoRoot();
  const existing = document.getElementById(ITEM_ID);

  if (!repoRootUrl) {
    existing?.remove();
    return;
  }

  if (existing) {
    return;
  }

  const row = findActionsRow();
  if (!row) {
    // Header not rendered yet; the observer will re-run syncButton on mutation.
    return;
  }

  // Prepend so the button sits left of Watch / Star / Fork.
  row.prepend(createItem(repoRootUrl));
};

// turbo swaps repository tabs without a page load; re-derive visibility on every DOM change.
let pending = false;
const observer = new MutationObserver(() => {
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    syncButton();
  });
});

const start = () => {
  syncButton();
  observer.observe(document.documentElement, { childList: true, subtree: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
