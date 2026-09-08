import { t } from '@extension/i18n';
import { buildSealosDeployUrl, parseGithubRepoRoot } from '@src/deploy-link';

/**
 * Injects a "Deploy on Sealos" button into the GitHub repository header actions row
 * (next to Watch / Star / Fork). Shown only on a repository root page; removed on every
 * other GitHub page and after client-side (turbo) tab navigation, since the header
 * persists across those.
 *
 * GitHub is migrating the repo header from the legacy SSR markup (ul.pagehead-actions)
 * to a React implementation (ul[data-testid="repo-header-actions"]); both anchors are
 * supported. Scoped styles reproduce the supplied glass button in either GitHub theme.
 */

const BUTTON_ID = 'sealos-deploy-button';
const ITEM_ID = 'sealos-deploy-item';

const SEALOS_LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="16.5 8.5 20 20"><path d="M20.0926 17.8262C21.3803 19.709 24.0497 19.5348 24.0497 19.5348C23.3877 18.8902 22.9522 18.2979 22.8999 16.6242C22.8477 14.9506 21.907 14.4976 21.907 14.4976C23.6222 13.4229 23.0045 12.2491 22.9522 10.9466C22.92 10.1412 23.4011 9.53555 23.7736 9.1925C19.6584 9.79953 16.5 13.3452 16.5 17.6293C16.5 17.9321 16.5322 18.2149 16.563 18.5097C16.7211 18.0875 18.9027 16.0856 20.0939 17.8262H20.0926Z" fill="#fafafa"/><path d="M34.6723 12.7127C33.7624 11.9462 32.7856 11.7479 32.0338 11.7479C29.8804 11.7479 28.0647 13.5033 27.9601 15.6541C27.9548 15.7506 27.9548 15.8202 27.9548 15.902C27.9548 16.048 27.9682 16.2062 27.9789 16.3308C27.999 16.5465 28.0727 16.8923 28.125 17.1938C28.1879 17.5596 28.2147 17.7539 28.2281 18.1345C28.2402 18.5123 28.2054 18.9184 28.1678 19.169C28.1102 19.5602 27.9883 20.0319 27.8462 20.391C27.4215 21.4684 26.7246 22.3689 25.8376 23.0188C24.8875 23.7156 23.7123 24.1404 22.3964 24.1404C21.445 24.1404 20.574 23.9207 19.7887 23.5267C18.1686 22.712 17.0068 21.2085 16.6477 19.3311C17.3566 24.1324 21.5508 27.8067 26.5491 27.8067C32.0445 27.8067 36.5001 23.3511 36.5001 17.8557C36.5001 17.0705 36.413 16.3656 36.291 15.768C36.1999 15.3218 36.0539 14.8192 35.8408 14.3234C35.5661 13.6843 35.2137 13.1697 34.6723 12.7127Z" fill="#fafafa"/></svg>';

// Glass surface sampled from the supplied 177 × 37 SVG. Keep the label as live text
// for localization, and scope overrides to avoid inheriting GitHub theme colors.
const ensureButtonStyle = () => {
  if (document.getElementById('sealos-deploy-button-style')) return;
  const style = document.createElement('style');
  style.id = 'sealos-deploy-button-style';
  style.textContent = `
    #${BUTTON_ID} {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-sizing: border-box;
      min-width: 177px;
      height: 37px;
      padding: 0 16px !important;
      border: 1px solid transparent !important;
      border-radius: 8px !important;
      background:
        linear-gradient(180deg, #3b82f6 0%, #60a5fa 79.8077%, #b5b4ff 96.3542%) padding-box,
        conic-gradient(from 90deg, #3b82f6, #b5b4ff 33.4591deg, #60a5fa 45.9075deg,
          #3b82f6 215.149deg, #b5b4ff 230.428deg, #1d4ed8 252.466deg,
          #1d4ed8 311.199deg, #60a5fa 326.974deg, #3b82f6) border-box !important;
      box-shadow:
        inset 0 0 0 1.25px #3b82f6,
        inset 3px 5px 2px -4.75px #b5b4ff,
        inset 1.25px 1.5px 0 rgb(29 78 216 / 75%),
        inset 0 4.75px 0.25px -2.5px #fbfbfb,
        inset 1px 1px 10.4px 3px rgb(29 78 216 / 50%),
        inset 0 -3px 1px rgb(59 130 246 / 50%),
        inset 2.5px -2px 3px rgb(181 180 255 / 75%),
        inset 0 -3px 3px 1px rgb(255 245 221 / 10%) !important;
      color: #fafafa !important;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      text-decoration: none !important;
      text-shadow: 0 0 2px rgb(241 237 238 / 40%);
      white-space: nowrap;
      vertical-align: middle;
    }
    #${BUTTON_ID}:hover {
      filter: brightness(1.06);
    }
    #${BUTTON_ID}:active {
      filter: brightness(0.96);
    }
    #${BUTTON_ID}:focus-visible {
      outline: 2px solid var(--fgColor-accent, #0969da) !important;
      outline-offset: 3px;
    }
    #${BUTTON_ID} .sealos-deploy-logo {
      display: block;
      width: 20px;
      height: 20px;
      flex: none;
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

const createItem = (repoRootUrl: string): HTMLLIElement => {
  ensureButtonStyle();
  const item = document.createElement('li');
  item.id = ITEM_ID;

  const button = document.createElement('a');
  button.id = BUTTON_ID;
  button.href = buildSealosDeployUrl(repoRootUrl);
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.className = 'btn btn-sm';
  button.setAttribute('role', 'button');
  const logo = document.createElement('img');
  logo.className = 'sealos-deploy-logo';
  logo.alt = '';
  logo.setAttribute('aria-hidden', 'true');
  logo.src = `data:image/svg+xml,${encodeURIComponent(SEALOS_LOGO)}`;
  const label = document.createElement('span');
  label.textContent = t('deployOnSealos');
  button.append(logo, label);

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
