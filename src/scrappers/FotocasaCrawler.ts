import { Page } from "playwright";
import { RealStateCrawler, RealStateCrawlerConfig } from "../RealStateCrawler.js";
import { Dataset } from "crawlee";
import { IAsset } from "../entity/IAsset.js";

export class FotocasaCrawler extends RealStateCrawler {
    constructor(config: RealStateCrawlerConfig) {
        super(config);
    }

    async parseAssets(page: Page){
        console.log('Parsing Fotocasa assets');
        const flats:IAsset[] = await page.$$eval('article',(rawFlat) => {        
            return rawFlat.map((rawFlat):IAsset => {
                const title = rawFlat.querySelector('span.re-CardTitle')?.textContent || '';
                const price = rawFlat.querySelector('span.item-price')?.textContent || '';
                const location = rawFlat.querySelector('span.item-detail')?.textContent || '';
                const link = rawFlat.querySelector('a.re-CardPackAdvance-info-container')?.getAttribute('href') || '';
                return { title, price, location, link }
            })
        });

        await Dataset.pushData(flats);
    }


}