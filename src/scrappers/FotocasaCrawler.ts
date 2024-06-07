import { Page } from "playwright";
import { Dataset } from "crawlee";
import { IAsset } from "../entity/IAsset.js";

export class FotocasaCrawler {
    BASE_URL = 'https://www.fotocasa.es/'

    async parseAssets(page: Page){
        console.log('Parsing Fotocasa assets');

        const flats:IAsset[] = await page.$$eval('article',(rawFlat) => {        
            return rawFlat.map((rawFlat):IAsset => {
                const title = rawFlat.querySelector('span.re-CardTitle')?.textContent || '';
                const price = rawFlat.querySelector('span.re-CardPrice')?.textContent || '';
                const m2 = rawFlat.querySelector('span.re-CardFeaturesWithIcons-feature-icon--surface')?.textContent?.replace('m²','') || '';
                const floor = rawFlat.querySelector('span.re-CardFeaturesWithIcons-feature-icon--floor')?.textContent || '';
                const location = rawFlat.querySelector('span.item-detail')?.textContent || '';
                const link = rawFlat.querySelector('a.re-CardPackMinimal-info')?.getAttribute('href') || rawFlat.querySelector('a.re-CardPackPremium-carousel')?.getAttribute('href') || rawFlat.querySelector('a.re-CardPackPremiumNewConstruction-carousel')?.getAttribute('href') || '';
                const fullLink = `https://www.fotocasa.es${link}`
                const id = link.match(/\/\d{3,}\//gm)?.[0]?.replace(/\//g, '') || '';
                return {id,m2, floor, title, price, location, link: fullLink }
            })
        });

        await Dataset.pushData(flats);
    }


}