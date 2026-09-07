/**
 * Sealos one-click deploy deep link.
 *
 * Protocol source of truth: "sealos-一键部署当前链路与架构.md"
 * - §1.2 GitHub auto deploy: /oauth?openapp=system-brain&githubRepo=<encoded repo root>&autoDeploy=1
 * - §5.2 URL validation: only https, github.com only, repo root URL only
 *   (reject /tree/... paths, query params, credentials, non-github.com hosts; ".git" is normalized away)
 */

export const SEALOS_REGION_HOST = 'usw-1.sealos.io';

/**
 * Assumption (configurable): the button triggers Brain's auto-deploy flow by default.
 * Set to false to open the GitHub Import review pane instead (manual "Deploy" confirmation, no autoDeploy param).
 */
export const DEFAULT_AUTO_DEPLOY = true;

/**
 * Returns the canonical repository root URL ("https://github.com/<owner>/<repo>") when the
 * given URL is a GitHub repository root page, or null when it is not a deployable repo root.
 */
export const parseGithubRepoRoot = (rawUrl: string): string | null => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.hostname !== 'github.com') return null;
  if (url.username || url.password) return null;
  if (url.search) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length !== 2) return null;

  const [owner, repoRaw] = parts;
  const repo = repoRaw.endsWith('.git') ? repoRaw.slice(0, -'.git'.length) : repoRaw;
  if (!owner || !repo) return null;

  return `https://github.com/${owner}/${repo}`;
};

export const buildSealosDeployUrl = (repoRootUrl: string, autoDeploy = DEFAULT_AUTO_DEPLOY): string => {
  const url = new URL(`https://${SEALOS_REGION_HOST}/oauth`);
  url.searchParams.set('openapp', 'system-brain');
  url.searchParams.set('githubRepo', repoRootUrl);
  if (autoDeploy) {
    url.searchParams.set('autoDeploy', '1');
  }
  return url.toString();
};
