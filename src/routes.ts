import { createPlaywrightRouter } from 'crawlee';
import { IdealistaCrawler } from './scrappers/IdealistaCrawler.js';

export const router = createPlaywrightRouter();


router.addDefaultHandler(async ({ page, request, log }) => {
    const { url } = request;
    log.info(`Navigating to ${url}`);
    if (url.includes('idealista.com')) {
        await page.waitForSelector('section.items-container');
        new IdealistaCrawler({ telegramId: '123' }).parseAssets(page);

    } else if (url.includes('fotocasa.es')) {
        await page.waitForSelector('h1');
        const title = await page.title();
        log.info(`Title: ${title}`);
    } else {
        log.info(`No handler for ${url}`);
    }

})