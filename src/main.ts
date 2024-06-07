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

// Configuración para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

const telegram = new Telegraf('5042109408:AAHBrCsNiuI3lXBEiLjmyxqXapX4h1LHbJs', {handlerTimeout:10});


fastify.register(FastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', 
})

fastify.register(FastifyFormbody)

fastify.post('/submit', async (request: Fastify.FastifyRequest<{ Body: { telegramId: string } }>, reply) => {
  const { telegramId } = request.body;
  console.log(telegramId)
})






// Run the server!
try {
  process.on("SIGINT", function () {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    // some other closing procedures go here
    process.exit(0);
  });
  await fastify.listen({ port: 3000 });
  while (true) {
    startCrawling();
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
  }
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

function startCrawling() {
  const startUrls = ["https://www.idealista.com/alquiler-viviendas/sevilla-sevilla/", "https://www.fotocasa.es/es/comprar/viviendas/sevilla-capital/todas-las-zonas/l"];


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
      telegram.telegram.sendMessage("-1002126678632", `${asset.price}, ${asset.link}`, { parse_mode: 'HTML' }).then(() => {
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


