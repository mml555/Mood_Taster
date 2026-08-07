#!/usr/bin/env node
/**
 * Download and resize catalog food images from Unsplash.
 * Free for commercial use; credits live on each Food.imageCredit.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "..", "public", "food");

/** Map food id → Unsplash images.unsplash.com path (photo-…). */
const IMAGES = {
  "crispy-hot-honey-chicken-sandwich":
    "photo-1606755962773-d324e0a13086",
  "spicy-vodka-rigatoni": "photo-1621996346565-e3dbc646d9a9",
  "birria-tacos": "photo-1565299585323-38d6b0865b47",
  "poke-bowl": "photo-1546069901-ba9599a7e63c",
  "grilled-cheese-tomato-soup": "photo-1528736235302-52922df5c122",
  "sour-gummy-candy": "photo-1582058091505-f87a2e55a40f",
  "mango-with-tajin": "photo-1553279768-865429fa0078",
  "garlic-butter-noodles": "photo-1569718212165-3a8278d5f624",
  "miso-ramen": "photo-1569718212165-3a8278d5f624",
  "avocado-toast": "photo-1541519227354-08fa5d50c44d",
  "korean-fried-chicken": "photo-1527477396000-e27163b481c2",
  "caprese-salad": "photo-1608897013039-887f21d8c804",
  "chocolate-lava-cake": "photo-1606313564200-e75d5e30476c",
  "ceviche": "photo-1534604973900-c43ab4c2e0ab",
  "mac-and-cheese": "photo-1543339494-b4cd4f7ba686",
  "falafel-wrap": "photo-1529006557810-274b9b2fc783",
  "thai-green-curry": "photo-1455619452474-d2be8b1e70cd",
  "soft-serve-cone": "photo-1571877227200-a0d98ea607e9",
  "shakshuka": "photo-1567620905732-2d1ec7ab7445",
  "crispy-pork-belly-bao": "photo-1529042410759-befb1204b468",
  "watermelon-feta-salad": "photo-1482049016688-2d3e1b311543",
  "loaded-nachos": "photo-1513456852971-30c0b8199d4d",
  "matcha-latte": "photo-1511920170033-f8396924c348",
  "beef-pho": "photo-1582878826629-29b7ad1cdc43",
  "churro-bites": "photo-1481391319762-47dff72954d9",
  "sashimi-plate": "photo-1579584425555-c3ce17fd4351",
  "mushroom-risotto": "photo-1476124369491-e7addf5db371",
  "elote": "photo-1551754655-cd27e38d2076",
  "pad-thai": "photo-1559314809-0d155014e29e",
  "affogato": "photo-1495474472287-4d71bcdd2085",
  "butter-chicken": "photo-1631452180519-c014fe946bc7",
  "vegetable-samosas": "photo-1601050690597-df0568f70950",
  "chicken-souvlaki": "photo-1603360946369-dc9bb6258143",
  "greek-salad": "photo-1540189549336-e6e99c3679fe",
  // doro-wat and misir-wat use Wikimedia Commons stills in public/food/
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(
      url,
      { headers: { "User-Agent": "MoodTasterBuild/1.0" } },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch {
            /* ignore */
          }
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      },
    );
    req.on("error", (err) => {
      try {
        fs.unlinkSync(dest);
      } catch {
        /* ignore */
      }
      reject(err);
    });
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  let fail = 0;

  for (const [id, photo] of Object.entries(IMAGES)) {
    const dest = path.join(OUT, `${id}.jpg`);
    const url = `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=800&q=80`;
    process.stdout.write(`${id}... `);
    try {
      await download(url, dest);
      try {
        execFileSync("sips", ["-Z", "800", dest], { stdio: "ignore" });
      } catch {
        /* sips optional */
      }
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`${kb}KB`);
      ok += 1;
    } catch (err) {
      console.log(`FAIL ${err.message}`);
      fail += 1;
    }
  }

  console.log(`Done: ${ok} ok, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
