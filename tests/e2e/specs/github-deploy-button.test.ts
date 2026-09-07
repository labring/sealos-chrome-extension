const SEALOS_BUTTON_ID = 'sealos-deploy-button';

const waitForButton = async (timeout = 15000) => {
  await browser.waitUntil(async () => !!(await $(`#${SEALOS_BUTTON_ID}`).getElement()), { timeout });
};

describe('GitHub Deploy on Sealos button', () => {
  it('should inject the button on a repository root page', async () => {
    await browser.url('https://github.com/vitejs/vite');
    await waitForButton();

    const button = await $(`#${SEALOS_BUTTON_ID}`).getElement();
    await expect(button).toBeDisplayed();
    await expect(button).toHaveAttributeContaining('class', 'btn');
  });

  it('should build the Sealos oauth deep link', async () => {
    await browser.url('https://github.com/vitejs/vite');
    await waitForButton();

    const button = await $(`#${SEALOS_BUTTON_ID}`).getElement();
    const href = await button.getAttribute('href');

    expect(href).toBe(
      'https://usw-1.sealos.io/oauth?openapp=system-brain&githubRepo=https%3A%2F%2Fgithub.com%2Fvitejs%2Fvite&autoDeploy=1',
    );
  });

  it('should not inject the button on non-repository pages', async () => {
    await browser.url('https://github.com/vitejs/vite/tree/main');
    await browser.pause(3000);

    const button = await $(`#${SEALOS_BUTTON_ID}`).getElement();
    await expect(button).not.toBeExisting();
  });
});
