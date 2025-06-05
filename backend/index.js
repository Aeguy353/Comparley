const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const CJ_AUTHORIZATION = process.env.CJ_AUTHORIZATION;
const CJ_WEBSITE_ID = process.env.CJ_WEBSITE_ID;

let ebayAccessToken = null;

async function getEbayToken() {
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope"
  });

  const data = await res.json();
  ebayAccessToken = data.access_token;
}

app.get("/api/ebay-search", async (req, res) => {
  const query = req.query.q;
  if (!ebayAccessToken) await getEbayToken();

  const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=6`, {
    headers: {
      "Authorization": `Bearer ${ebayAccessToken}`,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  const items = (data.itemSummaries || []).map((item) => ({
    title: item.title,
    price: item.price.value,
    currency: item.price.currency,
    image: item.image?.imageUrl || "",
    shipping: item.shippingOptions?.[0]?.shippingCost?.value ? `$${item.shippingOptions[0].shippingCost.value}` : "Free",
    link: item.itemWebUrl,
    store: "eBay"
  }));

  res.json(items);
});

app.get("/api/cj-search", async (req, res) => {
  const query = req.query.q;
  const url = `https://linksearch.api.cj.com/v2/link-search?website-id=${CJ_WEBSITE_ID}&advertiser-ids=joined&keywords=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: CJ_AUTHORIZATION,
        Accept: "application/json"
      }
    });

    const data = await response.json();
    const items = (data.links || []).slice(0, 6).map((link) => ({
      title: link.linkText,
      price: "-",
      currency: "USD",
      image: link.creative?.imageUrl || "",
      shipping: "Varies",
      link: link.clickUrl,
      store: link.advertiserName
    }));
    res.json(items);
  } catch (e) {
    console.error("CJ API error", e);
    res.status(500).json({ error: "CJ search failed", details: e.message || e.toString() });
  }
});

app.get("/", (req, res) => {
  res.send("Comparley backend (CJ + eBay) is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
