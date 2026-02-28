const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const manifest = require("./manifest.json");

// Base URL to scrape episodes
const BASE_URL = "https://nirvannathebandthe.show/episodes/#webseries";

const builder = new addonBuilder(manifest);

// Scrape the episodes catalog
builder.defineCatalogHandler(async ({ type, id }) => {
  if (type !== "series" || id !== "nirvanna-webseries-catalog") {
    return { metas: [] };
  }

  try {
    const res = await fetch(BASE_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    const metas = [];

    // Parse episodes - adjust selector based on actual website structure
    $(".et_pb_toggle_content li a").each((i, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr("href");

      if (!url || !title) return;

      metas.push({
        id: "nirvanna_" + encodeURIComponent(url),
        type: "series",
        name: title,
        poster: "", // Optional - can be added later
        posterShape: "landscape",
        description: `Episode from webseries: ${title}`,
        streams: []
      });
    });

    return { metas };
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return { metas: [] };
  }
});

// Provide streams when a meta is clicked
builder.defineStreamHandler(async ({ id }) => {
  try {
    // Decode the episode URL
    const episodeUrl = decodeURIComponent(id.replace("nirvanna_", ""));
    
    return {
      streams: [
        {
          title: "Webplay",
          url: episodeUrl
        }
      ]
    };
  } catch (error) {
    console.error("Error fetching stream:", error);
    return { streams: [] };
  }
});

const addonInterface = builder.getInterface();

const PORT = process.env.PORT || 7000;

require("http")
  .createServer(addonInterface)
  .listen(PORT, () => {
    console.log(`✨ NirvannaTheBandTheShow Addon running on http://localhost:${PORT}`);
  });