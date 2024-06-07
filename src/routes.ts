import { createPlaywrightRouter } from 'crawlee';
import { IdealistaCrawler } from './scrappers/IdealistaCrawler.js';
import { FotocasaCrawler } from './scrappers/FotocasaCrawler.js';

export const router = createPlaywrightRouter();


router.addDefaultHandler(async ({ page, request, log }) => {
    const { url } = request;
    log.info(`Navigating to ${url}`);
    if (url.includes('idealista.com')) {
        await page.waitForSelector('section.items-container');
        await new IdealistaCrawler().parseAssets(page);

    } else if (url.includes('fotocasa.es')) {
        const button = await page.waitForSelector('#didomi-notice-agree-button');
        await button.click();
        await page.waitForSelector('main.re-SearchPage-wrapper');
        await page.evaluate(() => {
          // Scroll to the bottom of the page to load all flats
            const scrollInterval = setInterval(() => {
                const lazyFlats = document.querySelectorAll('section.re-SearchResult div.sui-PerfDynamicRendering-placeholder');
                if (lazyFlats.length === 0) {
                  clearInterval(scrollInterval)
                } else {
                  lazyFlats[0].scrollIntoView();
                }
              }, 1500)

        });
        await page.waitForSelector('article:nth-child(33)');
        await new FotocasaCrawler().parseAssets(page);
    } else {
        log.info(`No handler for ${url}`);
    }

})