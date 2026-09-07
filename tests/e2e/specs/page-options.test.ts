describe('Webextension Options Page', () => {
  it('should make the auto-deploy setting available', async () => {
    const extensionPath = await browser.getExtensionPath();
    const optionsUrl = `${extensionPath}/options/index.html`;

    await browser.url(optionsUrl);

    await expect(browser).toHaveTitle('Deploy on Sealos — Settings');

    const checkbox = await $('input[type="checkbox"]').getElement();
    await expect(checkbox).toBeExisting();

    // Toggle off and back on to prove the storage-backed control is interactive.
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });
});
