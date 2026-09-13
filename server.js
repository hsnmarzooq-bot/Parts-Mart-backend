// Parts Mart backend — minimal REST API, zero external dependencies.
// Run with: node server.js
// Data is persisted to db.json (a real database like PostgreSQL should replace this before launch).

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, "db.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ---------- tiny JSON "database" ----------
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function newId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

// ---------- fuzzy matching (ported from the frontend prototype) ----------
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
function wordSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.95;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLen;
}
function fuzzyScore(query, fieldsText) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return 1;
  const qTokens = q.split(/\s+/).filter(Boolean);
  const tTokens = String(fieldsText || "").toLowerCase().split(/\s+/).filter(Boolean);
  let best = 0;
  for (const qt of qTokens) for (const tt of tTokens) best = Math.max(best, wordSimilarity(qt, tt));
  return best;
}
function yearScore(query, rangeStr) {
  const q = parseInt(String(query).replace(/\D/g, ""), 10);
  const nums = (String(rangeStr).match(/\d+/g) || []).map(Number);
  if (!isNaN(q) && nums.length) {
    const min = Math.min(...nums), max = Math.max(...nums);
    if (q >= min && q <= max) return 1;
    const dist = q < min ? min - q : q - max;
    return Math.max(0, 1 - dist / 8);
  }
  return fuzzyScore(String(query), String(rangeStr));
}
function L(field, lang) {
  return field && typeof field === "object" ? field[lang] || field.ar : field;
}

// ---------- request helpers ----------
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

// ---------- server-side AI calls (keeps the API key off the client) ----------
function callAnthropic(content) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return reject(new Error("ANTHROPIC_API_KEY is not set on the server"));
    const payload = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content }],
    });
    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ---------- VIN decoding via NHTSA's free public vPIC API (no key required) ----------
function decodeVin(vin) {
  return new Promise((resolve, reject) => {
    https
      .get(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// ---------- routes ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean); // e.g. ["api","orders","ORD-123"]

  if (req.method === "OPTIONS") return sendJSON(res, 204, {});

  // serve uploaded images
  if (req.method === "GET" && parts[0] === "uploads") {
    const filePath = path.join(UPLOADS_DIR, parts[1] || "");
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Access-Control-Allow-Origin": "*" });
      return fs.createReadStream(filePath).pipe(res);
    }
    return sendJSON(res, 404, { error: "not found" });
  }

  if (parts[0] !== "api") return sendJSON(res, 404, { error: "not found" });
  const db = readDB();

  try {
    // GET /api/parts?partName=&carMake=&carModel=&year=&partNumber=&lang=ar
    if (req.method === "GET" && parts[1] === "parts") {
      const lang = url.searchParams.get("lang") || "ar";
      const q = {
        partName: url.searchParams.get("partName") || "",
        carMake: url.searchParams.get("carMake") || "",
        carModel: url.searchParams.get("carModel") || "",
        year: url.searchParams.get("year") || "",
        partNumber: url.searchParams.get("partNumber") || "",
      };
      const results = db.parts
        .map((p) => {
          let combined = 1, count = 0, failed = false;
          if (q.partName.trim()) {
            const candidates = [L(p.name, lang), ...(p.aliases || [])];
            const s = Math.max(...candidates.map((c) => fuzzyScore(q.partName, c)));
            if (s < 0.35) failed = true;
            combined += s; count += 1;
          }
          const checks = [
            [q.carMake, L(p.make, lang)],
            [q.carModel, L(p.model, lang)],
            [q.partNumber, p.sku || ""],
          ];
          for (const [query, target] of checks) {
            if (!query.trim()) continue;
            const s = fuzzyScore(query, target);
            if (s < 0.35) failed = true;
            combined += s; count += 1;
          }
          if (q.year.trim()) {
            const ys = yearScore(q.year, p.year);
            if (ys < 0.3) failed = true;
            else { combined += ys; count += 1; }
          }
          return { part: p, score: count > 0 ? combined / (count + 1) : 1, failed };
        })
        .filter((r) => !r.failed)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.part);
      return sendJSON(res, 200, results);
    }

    // POST /api/parts  (admin: add a part)
    if (req.method === "POST" && parts[1] === "parts") {
      const body = await readBody(req);
      const part = { id: newId("p"), aliases: [], image: null, ...body };
      db.parts.push(part);
      writeDB(db);
      return sendJSON(res, 201, part);
    }

    // GET /api/suppliers
    if (req.method === "GET" && parts[1] === "suppliers") {
      return sendJSON(res, 200, db.suppliers);
    }

    // POST /api/suppliers  (admin only — enforce that in your real auth layer)
    if (req.method === "POST" && parts[1] === "suppliers") {
      const body = await readBody(req);
      const supplier = { id: newId("s"), rating: 0, ...body };
      db.suppliers.push(supplier);
      writeDB(db);
      return sendJSON(res, 201, supplier);
    }

    // POST /api/customers  (registration)
    if (req.method === "POST" && parts[1] === "customers") {
      const body = await readBody(req);
      const customer = { id: newId("c"), ...body };
      db.customers.push(customer);
      writeDB(db);
      return sendJSON(res, 201, customer);
    }
    if (req.method === "GET" && parts[1] === "customers") {
      return sendJSON(res, 200, db.customers);
    }

    // POST /api/orders
    if (req.method === "POST" && parts[1] === "orders") {
      const body = await readBody(req);
      const total = (body.items || []).reduce((s, i) => s + i.price * i.qty, 0);
      const order = {
        id: newId("ORD"),
        date: new Date().toISOString().slice(0, 10),
        stage: 0,
        total,
        commission: Math.round(total * 0.1),
        ...body,
      };
      db.orders.unshift(order);
      writeDB(db);
      return sendJSON(res, 201, order);
    }
    if (req.method === "GET" && parts[1] === "orders") {
      return sendJSON(res, 200, db.orders);
    }
    // PATCH /api/orders/:id  { stage: 2 }
    if (req.method === "PATCH" && parts[1] === "orders" && parts[2]) {
      const body = await readBody(req);
      const order = db.orders.find((o) => o.id === parts[2]);
      if (!order) return sendJSON(res, 404, { error: "order not found" });
      Object.assign(order, body);
      writeDB(db);
      return sendJSON(res, 200, order);
    }

    // POST /api/part-requests
    if (req.method === "POST" && parts[1] === "part-requests") {
      const body = await readBody(req);
      const request = { id: newId("REQ"), date: new Date().toISOString().slice(0, 10), fulfilled: false, ...body };
      db.partRequests.unshift(request);
      writeDB(db);
      return sendJSON(res, 201, request);
    }
    if (req.method === "GET" && parts[1] === "part-requests") {
      return sendJSON(res, 200, db.partRequests);
    }
    if (req.method === "PATCH" && parts[1] === "part-requests" && parts[2]) {
      const body = await readBody(req);
      const request = db.partRequests.find((r) => r.id === parts[2]);
      if (!request) return sendJSON(res, 404, { error: "request not found" });
      Object.assign(request, body);
      writeDB(db);
      return sendJSON(res, 200, request);
    }

    // POST /api/ai/parse-voice  { transcript }
    // Runs the voice-search AI parsing server-side so the API key never reaches the browser.
    if (req.method === "POST" && parts[1] === "ai" && parts[2] === "parse-voice") {
      const { transcript } = await readBody(req);
      const prompt = `Extract structured car-part search fields from this spoken query (it may be Arabic or English): "${transcript}"
Respond with ONLY a raw JSON object (no markdown, no code fences, no explanation) with exactly these keys: partName, carMake, carModel, year, partNumber. Use an empty string for any field that isn't mentioned. Keep values in the language they were spoken in.`;
      const data = await callAnthropic(prompt);
      const textBlock = (data.content || []).map((c) => c.text || "").join("");
      const cleaned = textBlock.replace(/```json|```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        return sendJSON(res, 502, { error: "could not parse AI response" });
      }
      return sendJSON(res, 200, parsed);
    }

    // POST /api/ai/identify-part  { imageBase64, mediaType }
    // Sends a photo of a part to Claude's vision model and extracts the same search fields.
    if (req.method === "POST" && parts[1] === "ai" && parts[2] === "identify-part") {
      const { imageBase64, mediaType } = await readBody(req);
      if (!imageBase64) return sendJSON(res, 400, { error: "imageBase64 is required" });
      const prompt = `This photo shows a car spare part. Identify it and respond with ONLY a raw JSON object (no markdown, no code fences, no explanation) with exactly these keys: partName, carMake, carModel, year, partNumber. Write partName in Arabic. Use an empty string for carMake, carModel, year, or partNumber if they cannot be determined from the photo alone (most of the time they can't — only fill them in if you can actually read a label, logo, or printed part number in the image).`;
      const data = await callAnthropic([
        { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
        { type: "text", text: prompt },
      ]);
      const textBlock = (data.content || []).map((c) => c.text || "").join("");
      const cleaned = textBlock.replace(/```json|```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        return sendJSON(res, 502, { error: "could not parse AI response" });
      }
      return sendJSON(res, 200, parsed);
    }

    // POST /api/decode-vin  { vin }
    // Decodes a VIN via NHTSA's free public API — no API key needed.
    if (req.method === "POST" && parts[1] === "decode-vin") {
      const { vin } = await readBody(req);
      if (!vin || vin.trim().length < 11) {
        return sendJSON(res, 400, { error: "a valid VIN is required" });
      }
      const data = await decodeVin(vin.trim());
      const r = (data.Results && data.Results[0]) || {};
      if (!r.Make) {
        return sendJSON(res, 404, { error: "could not decode this VIN" });
      }
      const engineParts = [r.EngineCylinders && `${r.EngineCylinders} cyl`, r.DisplacementL && `${r.DisplacementL}L`, r.FuelTypePrimary]
        .filter(Boolean)
        .join(" · ");
      return sendJSON(res, 200, {
        make: r.Make || "",
        model: r.Model || "",
        year: r.ModelYear || "",
        trim: r.Trim || "",
        engine: engineParts,
      });
    }

    return sendJSON(res, 404, { error: "not found" });
  } catch (err) {
    return sendJSON(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Parts Mart API running on http://localhost:${PORT}`);
});
