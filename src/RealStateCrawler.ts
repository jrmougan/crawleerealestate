export interface RealStateCrawlerConfig {
    telegramId: string;
}

export class RealStateCrawler {
    telegramId: string;

    constructor(config: RealStateCrawlerConfig) {
        this.telegramId = config.telegramId;
    }

    printTelegramId() {
        console.log(this.telegramId);
    }
    


}