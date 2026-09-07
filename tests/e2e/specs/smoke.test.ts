describe('The GitHub homepage can be loaded', () => {
  it('should be able to go to github.com', async () => {
    await browser.url('https://github.com');

    await expect(browser).toHaveTitleContaining('GitHub');
  });
});
