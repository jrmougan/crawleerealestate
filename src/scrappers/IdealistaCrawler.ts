import { Page } from "playwright";
import { RealStateCrawler, RealStateCrawlerConfig } from "../RealStateCrawler.js";
import { Dataset } from "crawlee";
import { IAsset } from "../entity/IAsset.js";

export class IdealistaCrawler extends RealStateCrawler {
    constructor(config: RealStateCrawlerConfig) {
        super(config);
    }

    async parseAssets(page: Page){
        const flats:IAsset[] = await page.$$eval('article.item',(rawFlat) => {        
            return rawFlat.map((rawFlat):IAsset => {
                const title = rawFlat.querySelector('a.item-link')?.textContent || '';
                const price = rawFlat.querySelector('span.item-price')?.textContent || '';
                const location = rawFlat.querySelector('span.item-detail')?.textContent || '';
                const link = rawFlat.querySelector('a.item-link')?.getAttribute('href') || '';
                return { title, price, location, link }
            })
        });

        await Dataset.pushData(flats);
    }


}