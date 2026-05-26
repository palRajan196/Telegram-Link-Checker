const express = require("express");
const axios = require("axios");
const pLimit = require("p-limit").default;
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT =
  process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const limit = pLimit(10);

/*
========================================
CHECK TELEGRAM URL
========================================
*/

const http = require("http");
const https = require("https");

const client = axios.create({
  timeout: 15000,

  maxRedirects: 5,

  decompress: true,

  validateStatus: () => true,

  httpAgent: new http.Agent({
    keepAlive: true,
  }),

  httpsAgent: new https.Agent({
    keepAlive: true,
  }),

  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",

    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

    "Accept-Language": "en-US,en;q=0.9",

    "Cache-Control": "no-cache",

    "Pragma": "no-cache",
  },
});

async function checkTelegram(url) {
  try {
    const response = await client.get(url, {
      responseType: "text",
    });

    const code = response.status;

    const html =
      typeof response.data === "string"
        ? response.data
        : "";

    const lower = html.toLowerCase();

    /*
    ========================================
    DEAD CONDITIONS
    ========================================
    */

    const isDead =
      code === 404 ||

      lower.includes("post not found") ||
      lower.includes("message not found") ||
      lower.includes("channel is unavailable") ||
      lower.includes("page not found") ||
      lower.includes("this message couldn't be displayed") ||

      (
        lower.includes("tgme_page_description") &&
        lower.includes("telegram") &&
        !lower.includes("tgme_widget_message_text")
      );

    return {
      url,
      code,
      status: isDead ? "Dead" : "Active",
    };

  } catch (e) {

    return {
      url,
      status: "ERROR",
      error: e.message,
    };

  }
    }


//  RUN
// ========================================

async function run(urls) {
  //  console.log(urls);
  const tasks = urls.map((url) => limit(() => checkTelegram(url)));

  const results = await Promise.all(tasks);

  //  console.table(results);
  return results;
}

app.get("/", (req, res) => {

  res.send("Server Running");

});

app.post("/status", async (req, resp) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls)) {
      return resp.status(400).json({
        error: "urls must be array",
      });
    } else {
      const result = await run(urls);
      resp.json(result);
    }
  } catch (err) {
    resp.status(500).json({
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
