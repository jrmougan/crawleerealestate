import { Page } from "playwright";
import { Dataset } from "crawlee";
import { IAsset } from "../entity/IAsset.js";

export class IdealistaCrawler {

    BASE_URL = 'https://www.idealista.com/'


    async parseAssets(page: Page){
        const flats:IAsset[] = await page.$$eval('article.item',(rawFlat) => {        
            return rawFlat.map((rawFlat):IAsset => {
                const title = rawFlat.querySelector('a.item-link')?.textContent || '';
                const price = rawFlat.querySelector('span.item-price')?.textContent || '';
                const location = rawFlat.querySelector('span.item-detail')?.textContent || '';
                const link = rawFlat.querySelector('a.item-link')?.getAttribute('href') || '';
                const fullLink = `https://www.idealista.com${link}`;
                const details = rawFlat.querySelectorAll('span.item-detail');
                let m2 = '';
                let floor = '';
                const id = link.match(/\/\d{5,}\//gm)?.[0]?.replace(/\//g, '') || '';
                details.forEach((detail) => {
                    if (detail.textContent?.includes('m²')) {
                        m2 = detail.textContent.replace('m²', '');
                    }
                    if (detail.textContent?.includes('planta')) {
                        floor = detail.textContent;
                    }
                });
                return { id, m2, title, price, location, link:fullLink, floor}
            })
        });

        await Dataset.pushData(flats);
    }


}