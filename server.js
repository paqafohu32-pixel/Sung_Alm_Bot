"use strict";

/**
 * SUNG BOT WEBSITE SERVER
 * Website + real WhatsApp installation/session detection.
 * Start with: node server.js
 */

const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const { setPendingLink } = require("../lib/analytics/tracker");
const {
  createWhatsAppSession,
  getWhatsAppSessions,
  getWhatsAppSession,
  TELEGRAM_SESSIONS_DIR
} = require("../core/connect");

const HOST = process.env.NOVA_WEB_HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || process.env.NOVA_WEB_PORT || 24622
);

function normalizePublicURL(value) {
  if (!value) return null;
  const v = String(value).trim().replace(/\/+$/, "");
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `http://${v}`;
}
const PUBLIC_URL =
  normalizePublicURL(process.env.NOVA_WEB_URL) ||
  `http://144.217.64.5:${PORT}`;

const WEBSITE_SOURCE = path.resolve(__dirname, "novasite");
const WEBSITE_ROOT = path.join(WEBSITE_SOURCE, "dist");
const INDEX_FILE = path.join(WEBSITE_ROOT, "index.html");
const PACKAGE_FILE = path.join(WEBSITE_SOURCE, "package.json");
const NODE_MODULES = path.join(WEBSITE_SOURCE, "node_modules");
const VITE_BINARY = path.join(
  NODE_MODULES, ".bin", process.platform === "win32" ? "vite.cmd" : "vite"
);

let server = null;
let installingDependencies = false;
let installPromise = null;
let building = false;
let buildPromise = null;

/* -------------------------------------------------------------------------- */
/* MIME                                                                       */
/* -------------------------------------------------------------------------- */

const MIME_TYPES = {
  ".html":"text/html; charset=utf-8",".htm":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".mjs":"application/javascript; charset=utf-8",".jsx":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8",".map":"application/json; charset=utf-8",
  ".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",
  ".gif":"image/gif",".svg":"image/svg+xml",".ico":"image/x-icon",".avif":"image/avif",
  ".bmp":"image/bmp",".mp4":"video/mp4",".webm":"video/webm",".mov":"video/quicktime",
  ".mp3":"audio/mpeg",".wav":"audio/wav",".ogg":"audio/ogg",".aac":"audio/aac",
  ".m4a":"audio/mp4",".woff":"font/woff",".woff2":"font/woff2",".ttf":"font/ttf",
  ".otf":"font/otf",".txt":"text/plain; charset=utf-8",".xml":"application/xml; charset=utf-8",
  ".webmanifest":"application/manifest+json; charset=utf-8"
};

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function execute(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      cwd: options.cwd || WEBSITE_SOURCE,
      env: { ...process.env, ...(options.env || {}) },
      windowsHide: true,
      maxBuffer: options.maxBuffer || 50 * 1024 * 1024,
      timeout: options.timeout || 15 * 60 * 1000
    }, (error, stdout, stderr) => {
      if (error) {
        const output = [stdout, stderr, error.message].filter(Boolean).join("\n").trim();
        const e = new Error(output || "Command execution failed");
        e.code = error.code;
        throwOrReject(reject, e);
        return;
      }
      resolve({ stdout: stdout || "", stderr: stderr || "" });
    });
  });
}
function throwOrReject(reject, e) { reject(e); }

function validateWebsiteProject() {
  if (!fs.existsSync(WEBSITE_SOURCE)) {
    throw new Error(`NOVA website source directory not found:\n${WEBSITE_SOURCE}`);
  }
  if (!fs.existsSync(PACKAGE_FILE)) {
    throw new Error(`NOVA website package.json not found:\n${PACKAGE_FILE}`);
  }
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, "utf8"));
  if (!pkg?.scripts?.build) throw new Error("Website package.json does not contain a build script");
  return pkg;
}

function dependenciesReady() {
  return fs.existsSync(NODE_MODULES) && fs.existsSync(VITE_BINARY);
}

async function installWebsiteDependencies() {
  if (dependenciesReady()) return true;
  if (installingDependencies && installPromise) return installPromise;
  validateWebsiteProject();
  installingDependencies = true;
  installPromise = (async () => {
    try {
      const result = await execute(getNpmCommand(), [
        "install","--no-audit","--no-fund","--progress=false"
      ], { cwd: WEBSITE_SOURCE });
      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.log(result.stderr);
      if (!dependenciesReady()) throw new Error("npm install completed but Vite is unavailable");
      return true;
    } finally {
      installingDependencies = false;
      installPromise = null;
    }
  })();
  return installPromise;
}

async function buildWebsite(force = false) {
  if (!force && fs.existsSync(INDEX_FILE)) return true;
  if (building && buildPromise) return buildPromise;
  validateWebsiteProject();
  await installWebsiteDependencies();
  building = true;
  buildPromise = (async () => {
    try {
      const result = await execute(getNpmCommand(), ["run","build"], {
        cwd: WEBSITE_SOURCE,
        env: { ...process.env, NODE_ENV: "production" }
      });
      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.log(result.stderr);
      if (!fs.existsSync(INDEX_FILE)) throw new Error("dist/index.html was not created");
      return true;
    } finally {
      building = false;
      buildPromise = null;
    }
  })();
  return buildPromise;
}

/* -------------------------------------------------------------------------- */
/* HTTP helpers                                                               */
/* -------------------------------------------------------------------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"Content-Type, Authorization",
    "Access-Control-Allow-Methods":"GET, POST, HEAD, OPTIONS",
    "Access-Control-Max-Age":"86400"
  };
}

function sendJSON(res, statusCode, data) {
  if (res.headersSent) return;
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type":"application/json; charset=utf-8",
    "Content-Length":Buffer.byteLength(body),
    "Cache-Control":"no-store",
    ...corsHeaders()
  });
  if (res.req?.method === "HEAD") return res.end();
  res.end(body);
}

function sendFile(req, res, filePath, options = {}) {
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) return sendJSON(res,404,{success:false,error:"File not found"});
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200,{
      "Content-Type":MIME_TYPES[ext] || "application/octet-stream",
      "Content-Length":stats.size,
      "Cache-Control":options.cacheControl || (ext === ".html" ? "no-cache, no-store, must-revalidate" : "public, max-age=31536000, immutable"),
      "X-Content-Type-Options":"nosniff",
      "X-Frame-Options":"SAMEORIGIN",
      "Referrer-Policy":"strict-origin-when-cross-origin"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

function resolveWebsitePath(requestPath) {
  let decoded;
  try { decoded = decodeURIComponent(String(requestPath || "/")); } catch { return null; }
  decoded = decoded.split("?")[0].split("#")[0];
  if (!decoded.startsWith("/")) decoded = "/" + decoded;
  const relative = decoded.replace(/^[/\\]+/,"");
  const filePath = path.resolve(WEBSITE_ROOT, relative);
  const root = WEBSITE_ROOT.endsWith(path.sep) ? WEBSITE_ROOT : WEBSITE_ROOT + path.sep;
  if (filePath !== WEBSITE_ROOT && !filePath.startsWith(root)) return null;
  return filePath;
}

async function serveStatic(req,res,pathname) {
  if (!fs.existsSync(INDEX_FILE)) await buildWebsite();
  const filePath = resolveWebsitePath(pathname);
  if (!filePath) return sendJSON(res,403,{success:false,error:"Forbidden"});
  if (fs.existsSync(filePath)) {
    try {
      if (fs.statSync(filePath).isFile()) return sendFile(req,res,filePath);
    } catch {}
  }
  return sendFile(req,res,INDEX_FILE,{cacheControl:"no-cache, no-store, must-revalidate"});
}

function normalizePhone(value) {
  return String(value || "").trim().replace(/[^0-9]/g,"").replace(/^00/,"");
}

function parseBody(req) {
  return new Promise((resolve,reject) => {
    let data = "";
    const fail = e => { reject(e); try { req.destroy(); } catch {} };
    req.on("data", chunk => {
      data += chunk.toString("utf8");
      if (Buffer.byteLength(data,"utf8") > 1024 * 1024) fail(new Error("Request body too large"));
    });
    req.on("end", () => {
      if (!data.trim()) return resolve({});
      try {
        const parsed = JSON.parse(data);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return reject(new Error("Invalid JSON body"));
        resolve(parsed);
      } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error",reject);
    req.on("aborted",()=>reject(new Error("Request aborted")));
  });
}

/* -------------------------------------------------------------------------- */
/* REAL NOVA SESSION DETECTION                                                */
/* -------------------------------------------------------------------------- */

function jidPhone(jid) {
  const raw = String(jid || "").split(":")[0].split("@")[0];
  return normalizePhone(raw);
}

function socketIsConnected(socket) {
  return Boolean(socket?.user?.id && socket?.ws?.isOpen);
}

function socketPhone(socket) {
  return jidPhone(socket?.user?.id);
}

async function readRegisteredPhone(sessionDir) {
  try {
    const credsPath = path.join(sessionDir,"creds.json");
    const creds = JSON.parse(await fsp.readFile(credsPath,"utf8"));
    if (creds?.registered !== true) return null;
    return jidPhone(creds?.me?.id || creds?.me?.jid || creds?.id);
  } catch {
    return null;
  }
}

async function findSessionByPhone(phone) {
  const target = normalizePhone(phone);
  if (!target) return { exists:false, connected:false, jid:null, sessionId:null, sessionDir:null };

  /* First inspect the live sockets. This is the authoritative online state. */
  try {
    const sessions = getWhatsAppSessions();
    if (sessions instanceof Map) {
      for (const [id, socket] of sessions.entries()) {
        if (socketPhone(socket) === target) {
          return {
            exists:true,
            connected:socketIsConnected(socket),
            connecting:false,
            jid:socket?.user?.id || null,
            sessionId:String(id),
            sessionDir:socket?.__novaSessionDir || path.join(TELEGRAM_SESSIONS_DIR,String(id)),
            source:"memory"
          };
        }
      }
    }
  } catch {}

  /* Then inspect persisted creds. This catches sessions after restart and
     sessions that have not finished reconnecting yet. */
  let entries = [];
  try {
    entries = await fsp.readdir(TELEGRAM_SESSIONS_DIR,{withFileTypes:true});
  } catch {
    return { exists:false, connected:false, jid:null, sessionId:null, sessionDir:null };
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const id = String(entry.name);
    const dir = path.join(TELEGRAM_SESSIONS_DIR,id);
    const registeredPhone = await readRegisteredPhone(dir);
    if (registeredPhone === target) {
      const live = getWhatsAppSession(id);
      return {
        exists:true,
        connected:socketIsConnected(live),
        connecting:false,
        jid:live?.user?.id || null,
        sessionId:id,
        sessionDir:dir,
        source:"disk"
      };
    }
  }

  return { exists:false, connected:false, jid:null, sessionId:null, sessionDir:null };
}

const installLocks = new Map();

async function getSessionStatus(phone) {
  const target = normalizePhone(phone);
  const found = await findSessionByPhone(target);

  if (!found.exists) {
    return {
      success:true, platform:"whatsapp", phone:target,
      exists:false, connected:false, status:"not_installed",
      jid:null, sessionId:null
    };
  }

  let status = found.connected ? "connected" : "offline";
  const live = found.sessionId ? getWhatsAppSession(found.sessionId) : null;

  if (live && !live?.user?.id) status = "connecting";

  return {
    success:true, platform:"whatsapp", phone:target,
    exists:true, connected:found.connected, status,
    jid:found.jid || live?.user?.id || null,
    sessionId:found.sessionId,
    source:found.source,
    sessionDir:found.sessionDir
  };
}

/* -------------------------------------------------------------------------- */
/* INSTALL                                                                    */
/* -------------------------------------------------------------------------- */

async function installWhatsApp(req,res) {
  const body = req.body || {};
  const phone = normalizePhone(body.phone);

  if (!phone) return sendJSON(res,400,{success:false,error:"WhatsApp number is required",errorCode:"INVALID_PHONE"});
  if (phone.length < 8 || phone.length > 15) {
    return sendJSON(res,400,{success:false,error:"Invalid WhatsApp number",errorCode:"INVALID_PHONE"});
  }

  if (installLocks.has(phone)) {
    return sendJSON(res,409,{
      success:false,platform:"whatsapp",phone,
      error:"A session request is already running for this number.",
      errorCode:"SESSION_ALREADY_CONNECTING"
    });
  }

  installLocks.set(phone,true);

  try {
    const before = await findSessionByPhone(phone);

    if (before.exists) {
      if (before.connected) {
        return sendJSON(res,409,{
          success:false,platform:"whatsapp",phone,
          error:"This number is already installed and connected.",
          errorCode:"SESSION_ALREADY_INSTALLED",
          exists:true,connected:true,status:"connected",
          jid:before.jid,sessionId:before.sessionId
        });
      }

      return sendJSON(res,409,{
        success:false,platform:"whatsapp",phone,
        error:"A registered NOVA session already exists for this number.",
        errorCode:"SESSION_EXISTS_OFFLINE",
        exists:true,connected:false,status:"offline",
        jid:before.jid,sessionId:before.sessionId
      });
    }

    setPendingLink(phone,{channel:"website",number:phone});
    const result = await createWhatsAppSession(phone,phone);
    const pairingCode =
      result?.pairingCode ||
      result?.code ||
      result?.pairing_code ||
      result?.socket?.__novaPairingCode ||
      null;

    const connected = Boolean(result?.connected || socketIsConnected(result?.socket));

    return sendJSON(res,200,{
      success:true,platform:"whatsapp",phone,
      installed:true,exists:true,connected,
      status:connected ? "connected" : pairingCode ? "pairing_code" : "connecting",
      pairingCode: pairingCode ? String(pairingCode) : null,
      jid: result?.socket?.user?.id || null,
      sessionId: result?.socket?.__novaTelegramId || phone,
      realCode:true
    });
  } catch (error) {
    console.error("[NOVA WEBSITE] WhatsApp installation error:",error);
    return sendJSON(res,500,{
      success:false,platform:"whatsapp",
      error:error?.message || "WhatsApp installation failed",
      errorCode:"INSTALLATION_FAILED"
    });
  } finally {
    installLocks.delete(phone);
  }
}

/* -------------------------------------------------------------------------- */
/* INFO                                                                       */
/* -------------------------------------------------------------------------- */

function health(req,res) {
  sendJSON(res,200,{
    success:true,name:"NOVA Website",status:"online",
    service:"NOVA Installation Platform",host:os.hostname(),
    listenHost:HOST,port:PORT,url:PUBLIC_URL,
    websiteSource:WEBSITE_SOURCE,websiteRoot:WEBSITE_ROOT,
    productionBuild:fs.existsSync(INDEX_FILE),
    dependenciesReady:dependenciesReady(),
    timestamp:new Date().toISOString()
  });
}

function apiInfo(req,res) {
  sendJSON(res,200,{
    success:true,name:"NOVA",platform:"NOVA Installation Platform",status:"online",
    website:PUBLIC_URL,port:PORT,
    endpoints:{
      website:"/",health:"/api/health",api:"/api",
      whatsappInstall:"/api/install/whatsapp",
      whatsappStatus:"/api/install/whatsapp/status?phone=..."
    }
  });
}

/* -------------------------------------------------------------------------- */
/* ROUTER                                                                     */
/* -------------------------------------------------------------------------- */

async function requestHandler(req,res) {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204,corsHeaders()); return res.end();
    }

    let url;
    try {
      url = new URL(req.url || "/",`http://${req.headers.host || `127.0.0.1:${PORT}`}`);
    } catch {
      url = new URL(req.url || "/","http://127.0.0.1");
    }

    const pathname = url.pathname;

    if (pathname === "/api/health") return health(req,res);
    if (pathname === "/api") return apiInfo(req,res);

    if (pathname === "/api/install/whatsapp/status" && (req.method === "GET" || req.method === "HEAD")) {
      const phone = normalizePhone(url.searchParams.get("phone"));
      if (!phone) return sendJSON(res,400,{success:false,error:"WhatsApp number is required",errorCode:"INVALID_PHONE"});
      return sendJSON(res,200,await getSessionStatus(phone));
    }

    if (pathname === "/api/install/whatsapp" && req.method === "POST") {
      try { req.body = await parseBody(req); }
      catch (e) { return sendJSON(res,400,{success:false,error:e.message}); }
      return installWhatsApp(req,res);
    }

    if (pathname.startsWith("/api/")) {
      return sendJSON(res,404,{success:false,error:"API endpoint not found",path:pathname});
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJSON(res,405,{success:false,error:"Method not allowed"});
    }

    return serveStatic(req,res,pathname);
  } catch (error) {
    console.error("[NOVA WEBSITE]",error);
    if (!res.headersSent) return sendJSON(res,500,{success:false,error:"Internal server error",details:error?.message || "Unknown error"});
    res.end();
  }
}

/* -------------------------------------------------------------------------- */
/* START / STOP                                                               */
/* -------------------------------------------------------------------------- */

async function startWebsite() {
  if (server) return {server,port:PORT,host:HOST,url:PUBLIC_URL,root:WEBSITE_ROOT};

  validateWebsiteProject();
  await installWebsiteDependencies();
  if (!fs.existsSync(INDEX_FILE)) await buildWebsite();
  if (!fs.existsSync(INDEX_FILE)) throw new Error(`NOVA website build unavailable:\n${INDEX_FILE}`);

  server = http.createServer(requestHandler);
  server.keepAliveTimeout=65000;
  server.headersTimeout=66000;
  server.requestTimeout=120000;
  server.maxRequestsPerSocket=1000;

  await new Promise((resolve,reject)=>{
    const onError=e=>{server.off("listening",onListening);reject(e)};
    const onListening=()=>{server.off("error",onError);resolve()};
    server.once("error",onError);
    server.once("listening",onListening);
    server.listen(PORT,HOST);
  });

  console.log("");
  console.log("╭──────────────────────────────────────────────╮");
  console.log("│              🌌 NOVA WEBSITE                │");
  console.log("├──────────────────────────────────────────────┤");
  console.log("│ 🟢 Status : ONLINE                          │");
  console.log(`│ 🔌 Port   : ${String(PORT).padEnd(34)}│`);
  console.log(`│ 🌐 URL    : ${PUBLIC_URL.slice(0,34).padEnd(34)}│`);
  console.log("╰──────────────────────────────────────────────╯");
  console.log(`🌐 NOVA WEBSITE → ${PUBLIC_URL}`);
  console.log(`🩺 NOVA HEALTH  → ${PUBLIC_URL}/api/health`);
  console.log(`📡 NOVA API     → ${PUBLIC_URL}/api`);
  return {server,port:PORT,host:HOST,url:PUBLIC_URL,root:WEBSITE_ROOT};
}

async function stopWebsite() {
  if (!server) return;
  const current=server; server=null;
  await new Promise(resolve=>{
    let done=false; const finish=()=>{if(done)return;done=true;resolve()};
    current.close(finish);
    try { current.closeIdleConnections?.(); current.closeAllConnections?.(); } catch {}
    setTimeout(finish,5000);
  });
}

module.exports={
  startWebsite,stopWebsite,
  getWebsitePort:()=>PORT,getWebsiteUrl:()=>PUBLIC_URL,
  getWebsiteRoot:()=>WEBSITE_ROOT,getWebsiteHost:()=>HOST,
  getWebsiteSource:()=>WEBSITE_SOURCE,getWebsiteBuild:()=>INDEX_FILE,
  getWebsiteDependencies:()=>dependenciesReady(),
  findSessionByPhone,getSessionStatus
};