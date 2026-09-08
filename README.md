# Deploy on Sealos — Chrome Extension

Add a **Deploy on Sealos** button to every GitHub repository page. One click opens Sealos and deploys the repository — no config files, no Dockerfile required.

## Download & Install

Grab the packaged extension: [`landing/sealos-deploy-chrome-extension.zip`](landing/sealos-deploy-chrome-extension.zip) (or build your own, see below).

1. Unzip it — you'll get a folder with `manifest.json` inside.
2. Open `chrome://extensions/` and enable **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder.
4. Open any GitHub repository — the button is there.

## What it does

On any repository root page (`https://github.com/<owner>/<repo>`), the extension injects a button into the repository header, next to Watch / Star. Clicking it opens a new tab to:

```text
https://usw-1.sealos.io/oauth
  ?openapp=system-brain
  &githubRepo=https%3A%2F%2Fgithub.com%2F<owner>%2F<repo>
  &autoDeploy=1
```

Sealos Desktop handles login / region / workspace, then Sealos runs the GitHub import and the AI deploy runner.

The button is **not** injected on non-repository pages (`/tree/...`, `/pull/...`, `/settings`, user/org pages), and it follows client-side (turbo) tab navigation inside a repository.

### Deployment flow

The repository button always requests automatic deployment. If signed out, users first see the Sealos login page. Brain then requests GitHub authorization when needed and continues creating the repository deployment task. There is no settings page or automatic-deployment toggle; installation does not open an extra page.

The toolbar popup's **Open Sealos** button opens the console without starting a repository deployment.

## Development

Requirements: Node.js ≥ 22.15, pnpm 10.

```bash
pnpm install
pnpm dev            # hot reload — load dist/ as unpacked, reload after edits
pnpm build          # output in dist/
pnpm zip            # packaged zip in dist-zip/
pnpm e2e            # WebdriverIO specs
```

Built on [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite) (React + Vite + TypeScript + Turbo monorepo).

## Project structure

```text
chrome-extension/        # manifest, background service worker, public assets
pages/
  content/               # content scripts (the GitHub button injector)
    src/deploy-link.ts   # Sealos deep-link protocol (URL validation + build)
    src/matches/github/  # button injection + SPA navigation handling
  popup/                 # extension action popup
landing/                 # download landing page (static, Linear design style)
packages/
  shared/ storage/ i18n/ ui/ env/ ...   # workspace libraries
tests/e2e/               # WebdriverIO specs
```

## Deep-link protocol

Source of truth: the Sealos one-click deploy architecture doc.

- `githubRepo` must be a repository root URL on `github.com` over HTTPS; `.git` suffixes are normalized away, and `/tree/...`, query params, credentials and non-github.com hosts are rejected.
- `autoDeploy=1` is the only value that enables auto-trigger; omitting the parameter opens the review pane.
- The link always goes through the regional Desktop `/oauth` gateway (`openapp=system-brain`), never directly to app internals.

## License

MIT
