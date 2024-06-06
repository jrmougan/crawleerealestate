// For more information, see https://crawlee.dev/
import {  Dataset, PlaywrightCrawler, ProxyConfiguration, RequestQueue } from "crawlee";
import { Telegraf } from 'telegraf'


import { router } from "./routes.js";
// Import the framework and instantiate it
import Fastify from "fastify";
import { parse } from "path";
import { IAsset } from "./entity/IAsset.js";

const fastify = Fastify({
  logger: true,
});

const telegram = new Telegraf('5042109408:AAHBrCsNiuI3lXBEiLjmyxqXapX4h1LHbJs', {handlerTimeout:10});


// Declare a route
fastify.get("/", async function handler(request, reply) {
  

  return { hello: "world" };
});





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
  const startUrls = ["https://www.idealista.com/alquiler-habitacion/sevilla-sevilla/", "https://www.fotocasa.es/es/comprar/viviendas/sevilla-capital/todas-las-zonas/l"];


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

    console.log(data.count)
    for (const item of data.items) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const asset = item as IAsset;
      console.log('enviando mensaje')
      telegram.telegram.sendMessage("-1002126678632", `${asset.price}, ${asset.link}`, { parse_mode: 'HTML' }).then(() => {
        console.log('message sent')
      })


    }

    console.log('droping dataset')
    await dataset.drop();
    const queue = await RequestQueue.open();
    await queue.drop();
    
  });
  crawler.teardown
} catch (error) {
  console.error(error);
}
}


