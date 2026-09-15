// Parts Mart backend — minimal REST API.
// Run with: node server.js
// Data is persisted to Upstash Redis (free tier, no volume/disk needed) — see README for setup.

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3001;
const SEED_FILE = path.join(__dirname, "seed.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ---------- database — stored as one JSON blob in Upstash Redis (https://upstash.com, free tier) ----------
const DB_KEY = "parts-mart-db";
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function upstashCommand(command) {
  return new Promise((resolve, reject) => {
    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
      return reject(new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set on the server"));
    }
    const target = new URL(UPSTASH_URL);
    const payload = JSON.stringify(command);
    const req = https.request(
      {
        hostname: target.hostname,
        path: "/",
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          "Content-Type": "application/json",
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

async function readDB() {
  const result = await upstashCommand(["GET", DB_KEY]);
  if (!result.result) {
    // First run ever — seed Redis from the seed data checked into git.
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
    await upstashCommand(["SET", DB_KEY, JSON.stringify(seed)]);
    return seed;
  }
  const db = JSON.parse(result.result);
  // Backfill any collections added to the app after this database was first seeded,
  // so older live databases don't break when new features (like photoRequests) are added.
  db.suppliers = db.suppliers || [];
  db.parts = db.parts || [];
  db.customers = db.customers || [];
  db.orders = db.orders || [];
  db.partRequests = db.partRequests || [];
  db.supplierRequests = db.supplierRequests || [];
  db.photoRequests = db.photoRequests || [];
  return db;
}
async function writeDB(db) {
  await upstashCommand(["SET", DB_KEY, JSON.stringify(db)]);
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

// ---------- local fallback VIN decoding (used when NHTSA has no record) ----------
// Primary: the 'universal-vin-decoder' library (1500+ manufacturers, offline, no API key).
let libDecodeVIN = null;
try {
  libDecodeVIN = require("universal-vin-decoder").decodeVIN;
} catch (e) {
  libDecodeVIN = null; // package not installed — the manual table below still works as a safety net
}

// Secondary/manual fallback table (~25 manufacturers common in the Gulf market) — kept as a last resort.
const WMI_TABLE = {
  JTM: "Toyota", JTE: "Toyota", JTN: "Toyota", JT1: "Toyota", JT2: "Toyota", JT3: "Toyota", JT4: "Toyota", JT6: "Toyota", JT8: "Toyota",
  JHM: "Honda", JHL: "Honda", JHG: "Honda",
  JN1: "Nissan", JN6: "Nissan", JN8: "Nissan", JNK: "Nissan", JNR: "Nissan",
  JM1: "Mazda", JM3: "Mazda", JM6: "Mazda", JM7: "Mazda",
  JA3: "Mitsubishi", JA4: "Mitsubishi",
  JS1: "Suzuki", JS2: "Suzuki", JS3: "Suzuki", JS4: "Suzuki",
  JAL: "Isuzu", JALC: "Isuzu",
  KMH: "Hyundai", KMF: "Hyundai", KM8: "Hyundai",
  KNA: "Kia", KND: "Kia", KNM: "Kia",
  WBA: "BMW", WBS: "BMW", WBY: "BMW",
  WDB: "Mercedes-Benz", WDC: "Mercedes-Benz", WDD: "Mercedes-Benz",
  WVW: "Volkswagen", WV1: "Volkswagen", WV2: "Volkswagen",
  WAU: "Audi",
  "1FA": "Ford", "1FT": "Ford", "1FM": "Ford", "2FA": "Ford", "3FA": "Ford",
  "1GC": "Chevrolet", "1G1": "Chevrolet", "1GM": "GMC", "2G1": "Chevrolet", "3GN": "Chevrolet",
  "1C4": "Jeep", "1C6": "Ram", "1J4": "Jeep", "1J8": "Jeep",
  SAL: "Land Rover", SAJ: "Jaguar",
  "5YJ": "Tesla",
  JTJ: "Lexus", JT7: "Lexus",
};
const YEAR_CODE = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
  1: 2031, 2: 2032, 3: 2033, 4: 2034, 5: 2035, 6: 2036, 7: 2037, 8: 2038, 9: 2039,
};
const YEAR_CODE_OLD = {
  A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986, H: 1987, J: 1988, K: 1989,
  L: 1990, M: 1991, N: 1992, P: 1993, R: 1994, S: 1995, T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000,
  1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009,
};

function localVinDecode(vin) {
  const upper = vin.toUpperCase();

  if (libDecodeVIN) {
    try {
      const result = libDecodeVIN(upper);
      if (result && result.isValid && result.info && result.info.manufacturer) {
        return {
          make: result.info.manufacturer,
          model: "",
          year: result.info.modelYear ? String(result.info.modelYear) : "",
          trim: "",
          engine: "",
          country: result.info.country || "",
          approximate: true,
        };
      }
    } catch (e) {
      // fall through to the manual table below
    }
  }

  const wmi3 = upper.slice(0, 3);
  const wmi4 = upper.slice(0, 4);
  const make = WMI_TABLE[wmi4] || WMI_TABLE[wmi3];
  if (!make) return null;
  // Position 7 being a letter (vs. a digit) indicates the 2010+ model-year cycle per industry convention.
  const isNewCycle = /[A-Z]/.test(upper[6]);
  const yearChar = upper[9];
  const year = (isNewCycle ? YEAR_CODE : YEAR_CODE_OLD)[yearChar] || "";
  return { make, model: "", year: year ? String(year) : "", trim: "", engine: "", approximate: true };
}

// ---------- transactional email via Resend (https://resend.com) ----------
function sendEmail(to, subject, html) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return reject(new Error("RESEND_API_KEY is not set on the server"));
    const from = process.env.FROM_EMAIL || "Parts Mart <onboarding@resend.dev>";
    const payload = JSON.stringify({ from, to, subject, html });
    const req = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
          else reject(new Error(data));
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
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

  try {
    const db = await readDB();

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
      await writeDB(db);
      return sendJSON(res, 201, part);
    }

    // GET /api/suppliers
    if (req.method === "GET" && parts[1] === "suppliers") {
      return sendJSON(res, 200, db.suppliers);
    }

    // POST /api/suppliers/login  { username, password }
    if (req.method === "POST" && parts[1] === "suppliers" && parts[2] === "login") {
      const { username, password } = await readBody(req);
      const supplier = db.suppliers.find((s) => s.username.toLowerCase() === String(username).toLowerCase() && s.password === password);
      if (!supplier) return sendJSON(res, 401, { error: "invalid credentials" });
      const { password: _pw, ...safeSupplier } = supplier;
      return sendJSON(res, 200, safeSupplier);
    }

    // POST /api/suppliers  (admin only — enforce that in your real auth layer)
    if (req.method === "POST" && parts[1] === "suppliers" && !parts[2]) {
      const body = await readBody(req);
      const supplier = { id: newId("s"), rating: 0, ...body };
      db.suppliers.push(supplier);
      await writeDB(db);
      return sendJSON(res, 201, supplier);
    }

    // PATCH /api/suppliers/:id  (admin edits an existing supplier — omit "password" in body to leave it unchanged)
    if (req.method === "PATCH" && parts[1] === "suppliers" && parts[2]) {
      const body = await readBody(req);
      const supplier = db.suppliers.find((s) => s.id === parts[2]);
      if (!supplier) return sendJSON(res, 404, { error: "supplier not found" });
      if (!body.password) delete body.password;
      Object.assign(supplier, body);
      await writeDB(db);
      const { password: _pw, ...safeSupplier } = supplier;
      return sendJSON(res, 200, safeSupplier);
    }

    // POST /api/supplier-requests  { supplierId, supplierName, type: "profile_update" | "new_part", payload }
    if (req.method === "POST" && parts[1] === "supplier-requests") {
      const body = await readBody(req);
      const request = {
        id: newId("SREQ"),
        date: new Date().toISOString().slice(0, 10),
        status: "pending",
        adminNote: "",
        ...body,
      };
      db.supplierRequests.unshift(request);
      await writeDB(db);
      return sendJSON(res, 201, request);
    }
    // GET /api/supplier-requests?supplierId=s1  (omit supplierId for the admin's full queue)
    if (req.method === "GET" && parts[1] === "supplier-requests") {
      const supplierId = url.searchParams.get("supplierId");
      const results = supplierId ? db.supplierRequests.filter((r) => r.supplierId === supplierId) : db.supplierRequests;
      return sendJSON(res, 200, results);
    }
    // PATCH /api/supplier-requests/:id  { status: "approved"|"rejected"|"returned", adminNote } or supplier resubmit { payload, status: "pending" }
    if (req.method === "PATCH" && parts[1] === "supplier-requests" && parts[2]) {
      const body = await readBody(req);
      const request = db.supplierRequests.find((r) => r.id === parts[2]);
      if (!request) return sendJSON(res, 404, { error: "request not found" });
      Object.assign(request, body);

      if (body.status === "approved") {
        const supplier = db.suppliers.find((s) => s.id === request.supplierId);
        if (request.type === "profile_update" && supplier) {
          Object.assign(supplier, request.payload);
        } else if (request.type === "new_part") {
          const p = request.payload || {};
          db.parts.push({
            id: newId("p"),
            sku: p.partNumber || "",
            name: p.partName || "",
            make: p.carMake || "",
            model: p.carType || "",
            year: p.year || "",
            manufacturer: p.manufacturer || "",
            cylinders: p.cylinders || "",
            engineSize: p.engineSize || "",
            price: Number(p.price) || 0,
            quantity: p.quantity !== undefined && p.quantity !== "" ? Number(p.quantity) : 0,
            aliases: [],
            image: p.image || null,
            condition: "",
            supplierId: request.supplierId,
          });
        } else if (request.type === "update_part") {
          const p = request.payload || {};
          const existing = db.parts.find((x) => x.id === p.partId);
          if (existing) {
            if (p.quantity !== undefined && p.quantity !== "") existing.quantity = Number(p.quantity);
            if (p.price !== undefined && p.price !== "") existing.price = Number(p.price);
            if (p.image) existing.image = p.image;
          }
        }
      }

      await writeDB(db);
      return sendJSON(res, 200, request);
    }

    // POST /api/customers/login  { username, password }
    if (req.method === "POST" && parts[1] === "customers" && parts[2] === "login") {
      const { username, password } = await readBody(req);
      const customer = db.customers.find((c) => c.username.toLowerCase() === String(username).toLowerCase() && c.password === password);
      if (!customer) return sendJSON(res, 401, { error: "invalid credentials" });
      const { password: _pw, verifyToken: _vt, ...safeCustomer } = customer;
      return sendJSON(res, 200, safeCustomer);
    }

    // POST /api/customers  (registration)
    if (req.method === "POST" && parts[1] === "customers" && !parts[2]) {
      const body = await readBody(req);
      const emailNormalized = String(body.email || "").trim().toLowerCase();
      if (db.customers.some((c) => String(c.email || "").trim().toLowerCase() === emailNormalized)) {
        return sendJSON(res, 409, { error: "email already registered", reason: "email" });
      }
      if (db.customers.some((c) => c.username.toLowerCase() === String(body.username).toLowerCase())) {
        return sendJSON(res, 409, { error: "username already taken", reason: "username" });
      }
      const customer = { id: newId("c"), verified: true, ...body };
      db.customers.push(customer);
      await writeDB(db);

      const { password: _pw, verifyToken: _vt, ...safeCustomer } = customer;
      return sendJSON(res, 201, safeCustomer);
    }

    // GET /api/customers/verify?token=...  (the link clicked from the confirmation email)
    if (req.method === "GET" && parts[1] === "customers" && parts[2] === "verify") {
      const token = url.searchParams.get("token");
      const customer = db.customers.find((c) => c.verifyToken === token);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (!customer) {
        return res.end("<html dir='rtl'><body style='font-family:sans-serif;text-align:center;padding:40px'><h2>رابط غير صالح أو منتهي</h2></body></html>");
      }
      customer.verified = true;
      customer.verifyToken = null;
      await writeDB(db);
      return res.end("<html dir='rtl'><body style='font-family:sans-serif;text-align:center;padding:40px'><h2>تم تأكيد حسابك بنجاح ✅</h2><p>يمكنك الآن الرجوع إلى التطبيق وتسجيل الدخول.</p></body></html>");
    }

    // POST /api/customers/resend-verification  { username }
    if (req.method === "POST" && parts[1] === "customers" && parts[2] === "resend-verification") {
      const { username } = await readBody(req);
      const customer = db.customers.find((c) => c.username === username);
      if (!customer || customer.verified) return sendJSON(res, 200, { ok: true }); // don't leak account existence
      const verifyToken = crypto.randomBytes(20).toString("hex");
      customer.verifyToken = verifyToken;
      await writeDB(db);
      const verifyLink = `https://${req.headers.host}/api/customers/verify?token=${verifyToken}`;
      try {
        await sendEmail(
          customer.email,
          "تأكيد التسجيل - Parts Mart",
          `<p>مرحباً ${customer.name}،</p><p>اضغط الرابط التالي لتأكيد حسابك في Parts Mart:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
        );
      } catch (e) {}
      return sendJSON(res, 200, { ok: true });
    }

    if (req.method === "GET" && parts[1] === "customers") {
      return sendJSON(res, 200, db.customers.map(({ password, verifyToken, ...c }) => c));
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
      await writeDB(db);
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
      await writeDB(db);
      return sendJSON(res, 200, order);
    }

    // POST /api/part-requests
    if (req.method === "POST" && parts[1] === "part-requests") {
      const body = await readBody(req);
      const request = { id: newId("REQ"), date: new Date().toISOString().slice(0, 10), fulfilled: false, ...body };
      db.partRequests.unshift(request);
      await writeDB(db);
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
      await writeDB(db);
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

    // POST /api/photo-requests  { customerId, customerName, image, carMake, carType, year, cylinders, engineSize, quantity }
    if (req.method === "POST" && parts[1] === "photo-requests" && !parts[2]) {
      const body = await readBody(req);
      const request = {
        id: newId("PR"),
        date: new Date().toISOString().slice(0, 10),
        status: "pending",
        sentTo: [],
        ...body,
      };
      db.photoRequests.unshift(request);
      await writeDB(db);
      return sendJSON(res, 201, request);
    }
    // GET /api/photo-requests?customerId=c1  (omit for the admin's full queue)
    if (req.method === "GET" && parts[1] === "photo-requests") {
      const customerId = url.searchParams.get("customerId");
      const results = customerId ? db.photoRequests.filter((r) => r.customerId === customerId) : db.photoRequests;
      return sendJSON(res, 200, results);
    }
    // PATCH /api/photo-requests/:id/send-to-suppliers  { supplierIds: [...] }
    if (req.method === "PATCH" && parts[1] === "photo-requests" && parts[3] === "send-to-suppliers") {
      const { supplierIds } = await readBody(req);
      const request = db.photoRequests.find((r) => r.id === parts[2]);
      if (!request) return sendJSON(res, 404, { error: "request not found" });
      const targetSuppliers = db.suppliers.filter((s) => (supplierIds || []).includes(s.id) && s.email);

      const specsLine = [request.carMake, request.carType, request.year].filter(Boolean).join(" - ");
      const extraLine = [
        request.cylinders && `عدد الأسطوانات: ${request.cylinders}`,
        request.engineSize && `سعة المحرك: ${request.engineSize}`,
      ].filter(Boolean).join(" · ");
      const html = `
        <p>طلب قطعة جديد من عميل عبر Parts Mart</p>
        <p><b>مواصفات السيارة:</b> ${specsLine}</p>
        ${extraLine ? `<p>${extraLine}</p>` : ""}
        <p><b>الكمية المطلوبة:</b> ${request.quantity || 1}</p>
        ${request.image ? `<p><img src="${request.image}" style="max-width:320px;border-radius:8px" /></p>` : ""}
      `;

      const results = await Promise.allSettled(
        targetSuppliers.map((s) => sendEmail(s.email, "طلب قطعة جديد - Parts Mart", html))
      );
      const sentSupplierIds = targetSuppliers
        .filter((_, i) => results[i].status === "fulfilled")
        .map((s) => s.id);
      const failures = targetSuppliers
        .map((s, i) => (results[i].status === "rejected" ? { supplierId: s.id, email: s.email, error: results[i].reason?.message } : null))
        .filter(Boolean);
      if (failures.length) console.error("send-to-suppliers email failures:", JSON.stringify(failures));

      if (sentSupplierIds.length > 0) {
        request.status = "sent_to_suppliers";
        request.sentTo = [...new Set([...(request.sentTo || []), ...sentSupplierIds])];
      }
      await writeDB(db);
      return sendJSON(res, 200, { ...request, emailFailures: failures });
    }

    // POST /api/decode-vin  { vin }
    // Decodes a VIN via NHTSA's free public API — no API key needed.
    if (req.method === "POST" && parts[1] === "decode-vin") {
      const { vin } = await readBody(req);
      if (!vin || vin.trim().length < 11) {
        return sendJSON(res, 400, { error: "a valid VIN is required" });
      }
      let r = {};
      try {
        const data = await decodeVin(vin.trim());
        r = (data.Results && data.Results[0]) || {};
      } catch (e) {
        r = {}; // NHTSA unreachable — fall through to the local decoder below
      }
      if (!r.Make) {
        const fallback = localVinDecode(vin.trim());
        if (fallback) return sendJSON(res, 200, fallback);
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
    console.error(`Error on ${req.method} ${req.url}:`, err.message);
    return sendJSON(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Parts Mart API running on http://localhost:${PORT}`);
});
