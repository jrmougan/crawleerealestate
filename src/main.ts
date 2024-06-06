// For more information, see https://crawlee.dev/
import {  Dataset, PlaywrightCrawler, ProxyConfiguration } from "crawlee";

import { CronJob } from "cron";
import { generateUserAgent } from 'useragent-wizard';

import { router } from "./routes.js";
// Import the framework and instantiate it
import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

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
  crawler.run(startUrls).then(() => {
    console.log("Crawling finished!");
    Dataset.open().then((dataset) => {
      console.log("Dataset length", Object.keys(dataset).length);
      dataset.forEach((data) => {
        console.log(data);
      
      });
    });
  });
} catch (error) {
  console.error(error);
}
}


