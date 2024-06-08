// For more information, see https://crawlee.dev/
import {  Dataset, PlaywrightCrawler, ProxyConfiguration, RequestQueue } from "crawlee";
import { Telegraf } from 'telegraf'

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

import { router } from "./routes.js";
// Import the framework and instantiate it
import Fastify from "fastify";
import FastifyStatic from '@fastify/static';
import FastifyFormbody from '@fastify/formbody';
import { IAsset } from "./entity/IAsset.js";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configuración para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

const telegram = new Telegraf('5042109408:AAHBrCsNiuI3lXBEiLjmyxqXapX4h1LHbJs', {handlerTimeout:10});

async function startScrapper() {
  let interval = 15;
  while (true) {
    fs.open(path.join(__dirname, 'config.json'), 'r', (err, fd) => {
      if (err) {
        console.error('Config file not found')
        return;
      }
  
      fs.readFile(fd, (err, data) => {
        if (err) {
          console.error('Error reading config file')
          return;
        }
  
        const config = JSON.parse(data.toString());
  
        console.log('config', config)
        interval = config.interval || 15;
  
        startCrawling(config.telegramId, config.links)
      })
    }
    )
    await new Promise((resolve) => setTimeout(resolve, interval * 60 * 1000));
  } 

}


fastify.register(FastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '', 
})

fastify.register(FastifyFormbody)

fastify.post('/submit', async (request: Fastify.FastifyRequest<{ Body: { telegramId: string, links: string[], interval:number } }>, reply) => {
  const { telegramId, links, interval } = request.body;

  // save the scrapper config into json file and start the scrapper

  console.log(telegramId, links, interval)

  // save config.json in filesystem

  // if file not exist, start the scrapper
  fs.open(path.join(__dirname, 'config.json'), 'r', (err) => {
    if (err) {
      console.error('Config file not found')
      fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify({ telegramId, links, interval }));
      startCrawling(telegramId, links)
      return;
    } else {
      fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify({ telegramId, links, interval }));

    }
  })


  reply.send('ok')
})







// Run the server!
try {
  process.on("SIGINT", function () {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    // some other closing procedures go here
    process.exit(0);
  });
  await fastify.listen({ port: 3000, host:"0.0.0.0" });
  startScrapper();
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}



function startCrawling(telegramId: string, links: string[]) {
  const startUrls = links;



  const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 30,
    // Comment this option to scrape the full website.
    headless: true,
  
  });

  try {
  crawler.run(startUrls).then(async () => {
    console.log("Crawling finished!");

    const dataset = await Dataset.open();

    const data = await dataset.getData();

    const db = await open({
      filename: './database.db',
      driver: sqlite3.Database
    })

    db.exec(`CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY)`)

    console.log(data.count)
    for (const item of data.items) {
      
      const asset = item as IAsset;

      const isSended = await db.get('SELECT * FROM assets WHERE id = ?', [asset.id]);

      console.log('isSended', isSended)


      if (!isSended){
      await new Promise((resolve) => setTimeout(resolve, 3000));
      telegram.telegram.sendMessage(telegramId, `${asset.price}, ${asset.link}`, { parse_mode: 'HTML' }).then(() => {
        db.run(`INSERT INTO assets (id) VALUES ('${asset.id}')`).catch((err) => {
          console.error(err)
        })
      })
    } else {
      console.log('Already sended', asset.id)
    }


    }

    console.log('droping dataset')
    await dataset.drop();
    const queue = await RequestQueue.open();
    await queue.drop();
    
  });
  crawler.teardown;
} catch (error) {
  console.error(error);
}
}


