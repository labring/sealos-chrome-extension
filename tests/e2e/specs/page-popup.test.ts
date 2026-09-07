describe('Webextension Popup', () => {
  it('should open the popup with the Sealos entry', async () => {
    const extensionPath = await browser.getExtensionPath();
    const popupUrl = `${extensionPath}/popup/index.html`;
    await browser.url(popupUrl);

    await expect(browser).toHaveTitle('Deploy on Sealos');

    const openSealosButton = await $('button=Open Sealos').getElement();
    await expect(openSealosButton).toBeDisplayed();
  });
});
