#!/usr/bin/env node
/**
 * MyClaw Toolkit — 23-in-1 Developer Utility MCP Server
 *
 * Exposes 23 tools to AI assistants (Claude, ChatGPT, Cursor, etc.)
 * via the Model Context Protocol (MCP).
 *
 * Privacy-first design: all local-computable operations run entirely
 * on-device. Only tools that genuinely need external data (search,
 * exchange rates, crypto prices, etc.) call the remote API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import QRCode from "qrcode";
import { marked } from "marked";

// ── Version (read from package.json, never hardcoded) ─────────────
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
const VERSION = pkg.version;

// ── Rate Limiter (protects backend from runaway AI clients) ─────────
const RATE_WINDOW_MS = 60_000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 100;
let requestTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(t => now - t < RATE_WINDOW_MS);
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) return false;
  requestTimestamps.push(now);
  return true;
}

// ── Config ──────────────────────────────────────────────────────────
const API_BASE = process.env.MYCLAW_API || "http://47.103.7.241";
const USER_AGENT = `myclaw-toolkit-mcp/${VERSION}`;
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Safe API call with timeout, proper error reading, and abort support.
 * Only used for tools that genuinely need external data.
 */
async function apiCall(path: string): Promise<string> {
  if (!checkRateLimit()) {
    return JSON.stringify({ error: "Rate limit exceeded", limit: `${MAX_REQUESTS_PER_WINDOW} requests per ${RATE_WINDOW_MS / 1000}s`, path });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    const body = await res.text();
    if (!res.ok) {
      // Parse error body if JSON, otherwise return raw text
      try {
        const errJson = JSON.parse(body);
        return JSON.stringify({ error: `API ${res.status}`, detail: errJson, path });
      } catch {
        return JSON.stringify({ error: `API ${res.status}`, detail: body.slice(0, 500), path });
      }
    }
    return body;
  } catch (err: any) {
    if (err.name === "AbortError") {
      return JSON.stringify({ error: "Request timed out", path });
    }
    return JSON.stringify({ error: `Connection failed: ${err.message}`, path });
  } finally {
    clearTimeout(timer);
  }
}

// ── Local utility functions ───────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// ── Server ──────────────────────────────────────────────────────────
const server = new McpServer({
  name: "myclaw-toolkit",
  version: VERSION,
});

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 1: UTILITY TOOLS — All local, zero network
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "timestamp",
  "Get current Unix timestamp and ISO 8601 datetime (runs locally, no network)",
  {},
  async () => {
    const now = new Date();
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          unix_ms: now.getTime(),
          unix_sec: Math.floor(now.getTime() / 1000),
          iso8601: now.toISOString(),
          utc: now.toUTCString(),
          local: now.toString(),
        }),
      }],
    };
  },
);

server.tool(
  "uuid",
  "Generate UUID v4 identifiers (runs locally, no network)",
  {
    count: z.number().min(1).max(100).default(1).describe("Number of UUIDs to generate"),
  },
  async ({ count }) => {
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());
    return { content: [{ type: "text", text: JSON.stringify({ uuids }) }] };
  },
);

server.tool(
  "base64",
  "Encode or decode Base64 strings (runs locally, no data leaves your machine)",
  {
    action: z.enum(["encode", "decode"]).describe("Operation to perform"),
    text: z.string().describe("Text to encode or Base64 to decode"),
  },
  async ({ action, text }) => {
    try {
      if (action === "encode") {
        const encoded = Buffer.from(text, "utf-8").toString("base64");
        return { content: [{ type: "text", text: JSON.stringify({ action, input: text, output: encoded }) }] };
      } else {
        const decoded = Buffer.from(text, "base64").toString("utf-8");
        return { content: [{ type: "text", text: JSON.stringify({ action, input: text, output: decoded }) }] };
      }
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message, action, input: text }) }] };
    }
  },
);

server.tool(
  "hash",
  "Generate cryptographic hashes — MD5, SHA1, SHA256, SHA512 (runs locally, no network)",
  {
    algorithm: z.enum(["md5", "sha1", "sha256", "sha512"]).default("sha256").describe("Hash algorithm"),
    text: z.string().describe("Text to hash"),
  },
  async ({ algorithm, text }) => {
    const hash = crypto.createHash(algorithm).update(text, "utf-8").digest("hex");
    return { content: [{ type: "text", text: JSON.stringify({ algorithm, input: text, hash }) }] };
  },
);

server.tool(
  "qrcode",
  "Generate QR codes from text or URLs (runs locally, no network)",
  {
    text: z.string().describe("Text or URL to encode in QR code"),
  },
  async ({ text }) => {
    const dataUrl = await QRCode.toDataURL(text, { width: 400, margin: 2 });
    return { content: [{ type: "text", text: dataUrl }] };
  },
);

server.tool(
  "color_tools",
  "Convert colors between hex, RGB, and HSL formats (runs locally, no network)",
  {
    color: z.string().describe("Color value (hex like '#ff0000', rgb like '255,0,0', or hsl like '0,100,50')"),
  },
  async ({ color }) => {
    try {
      const c = color.trim();
      // Detect format
      if (c.startsWith("#") || /^[0-9a-fA-F]{6}$/.test(c)) {
        const rgb = hexToRgb(c);
        const hsl = rgbToHsl(...rgb);
        return { content: [{ type: "text", text: JSON.stringify({ hex: `#${c.replace("#", "")}`, rgb, hsl }) }] };
      }
      if (c.toLowerCase().includes("hsl")) {
        const match = c.match(/[\d.]+/g);
        if (match && match.length >= 3) {
          const [h, s, l] = [parseFloat(match[0]), parseFloat(match[1]), parseFloat(match[2])];
          const rgb = hslToRgb(h, s, l);
          const hex = "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("");
          return { content: [{ type: "text", text: JSON.stringify({ hex, rgb, hsl: [h, s, l] }) }] };
        }
      }
      if (c.includes(",")) {
        const parts = c.split(",").map(Number);
        if (parts.length >= 3 && !isNaN(parts[0])) {
          const [r, g, b] = parts;
          const hsl = rgbToHsl(r, g, b);
          const hex = "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
          return { content: [{ type: "text", text: JSON.stringify({ hex, rgb: [r, g, b], hsl }) }] };
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ error: "Unrecognized color format. Use hex (#ff0000), rgb (255,0,0), or hsl (0,100,50)" }) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
    }
  },
);

server.tool(
  "json_formatter",
  "Format, validate, or minify JSON strings (runs locally, no data leaves your machine)",
  {
    action: z.enum(["format", "validate", "minify"]).default("format").describe("Operation"),
    json: z.string().describe("JSON string to process"),
  },
  async ({ action, json }) => {
    try {
      const parsed = JSON.parse(json);
      if (action === "validate") {
        return { content: [{ type: "text", text: JSON.stringify({ valid: true, depth: getDepth(parsed) }) }] };
      }
      const output = action === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      return { content: [{ type: "text", text: output }] };
    } catch (err: any) {
      if (action === "validate") {
        return { content: [{ type: "text", text: JSON.stringify({ valid: false, error: err.message }) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid JSON: ${err.message}` }) }] };
    }
  },
);

function getDepth(obj: any, depth = 0): number {
  if (typeof obj !== "object" || obj === null || obj === undefined) return depth;
  let max = depth;
  for (const key of Object.keys(obj)) {
    const d = getDepth(obj[key], depth + 1);
    if (d > max) max = d;
  }
  return max;
}

server.tool(
  "url_tools",
  "Encode or decode URL strings (runs locally, no network)",
  {
    action: z.enum(["encode", "decode"]).describe("Operation"),
    text: z.string().describe("Text to encode or URL to decode"),
  },
  async ({ action, text }) => {
    try {
      const output = action === "encode" ? encodeURIComponent(text) : decodeURIComponent(text);
      return { content: [{ type: "text", text: JSON.stringify({ action, input: text, output }) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message, action, input: text }) }] };
    }
  },
);

server.tool(
  "text_tools",
  "Text processing utilities — count, reverse, case conversion (runs locally, no network)",
  {
    action: z.enum(["count", "reverse", "upper", "lower", "title"]).describe("Operation"),
    text: z.string().describe("Text to process"),
  },
  async ({ action, text }) => {
    let output: any;
    switch (action) {
      case "count":
        output = { chars: text.length, words: text.trim() ? text.trim().split(/\s+/).length : 0, lines: text.split("\n").length };
        break;
      case "reverse":
        output = text.split("").reverse().join("");
        break;
      case "upper":
        output = text.toUpperCase();
        break;
      case "lower":
        output = text.toLowerCase();
        break;
      case "title":
        output = text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        break;
      default:
        output = text;
    }
    return { content: [{ type: "text", text: JSON.stringify({ action, input: text, output }) }] };
  },
);

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 2: DATA TOOLS — Mixed local + remote
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "exchange_rate",
  "Get real-time currency exchange rates between any two currencies",
  {
    from: z.string().length(3).describe("Source currency code (e.g., USD, CNY, EUR)"),
    to: z.string().length(3).describe("Target currency code (e.g., USD, CNY, EUR)"),
  },
  async ({ from, to }) => {
    const result = await apiCall(`/exchange?from=${from.toUpperCase()}&to=${to.toUpperCase()}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "crypto_price",
  "Get current cryptocurrency prices in USD or any fiat currency",
  {
    coin: z.string().describe("Cryptocurrency symbol (e.g., BTC, ETH, SOL, USDT)"),
    vs: z.string().default("usd").describe("Quote currency (e.g., usd, cny, eur)"),
  },
  async ({ coin, vs }) => {
    const result = await apiCall(`/crypto?coin=${coin.toUpperCase()}&vs=${vs.toLowerCase()}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "domain_check",
  "Check domain name availability and whois information",
  {
    domain: z.string().describe("Domain name to check (e.g., example.com)"),
  },
  async ({ domain }) => {
    const result = await apiCall(`/domain?name=${encodeURIComponent(domain)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "bmi_calculator",
  "Calculate BMI (Body Mass Index) from height and weight (runs locally, no network)",
  {
    height: z.number().min(50).max(300).describe("Height in centimeters"),
    weight: z.number().min(1).max(500).describe("Weight in kilograms"),
  },
  async ({ height, weight }) => {
    const h = height / 100;
    const bmi = weight / (h * h);
    let category: string;
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal weight";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ height_cm: height, weight_kg: weight, bmi: Math.round(bmi * 100) / 100, category }),
      }],
    };
  },
);

server.tool(
  "vcard_generator",
  "Generate vCard (.vcf) contact files (runs locally, no network)",
  {
    name: z.string().describe("Full name"),
    phone: z.string().optional().describe("Phone number"),
    email: z.string().optional().describe("Email address"),
    org: z.string().optional().describe("Organization/company"),
  },
  async ({ name, phone, email, org }) => {
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`];
    if (org) lines.push(`ORG:${org}`);
    if (phone) lines.push(`TEL:${phone}`);
    if (email) lines.push(`EMAIL:${email}`);
    lines.push("END:VCARD");
    const vcard = lines.join("\n");
    return { content: [{ type: "text", text: vcard }] };
  },
);

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 3: SEARCH & CONTENT TOOLS — Remote API
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "web_search",
  "Search the web using Bing — returns titles, snippets, and URLs",
  {
    query: z.string().describe("Search query"),
    count: z.number().min(1).max(20).default(10).describe("Number of results"),
  },
  async ({ query, count }) => {
    const result = await apiCall(`/search?q=${encodeURIComponent(query)}&limit=${count}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "news_search",
  "Search news articles from global sources",
  {
    query: z.string().describe("News search query"),
    count: z.number().min(1).max(20).default(10).describe("Number of articles"),
  },
  async ({ query, count }) => {
    const result = await apiCall(`/news?q=${encodeURIComponent(query)}&limit=${count}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "product_search",
  "Search products across multiple e-commerce platforms",
  {
    query: z.string().describe("Product search query"),
    count: z.number().min(1).max(20).default(10).describe("Number of results"),
  },
  async ({ query, count }) => {
    const result = await apiCall(`/products?q=${encodeURIComponent(query)}&limit=${count}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "rss_feed",
  "Fetch and parse RSS feeds from any URL",
  {
    url: z.string().url().describe("RSS feed URL to fetch"),
    count: z.number().min(1).max(50).default(10).describe("Number of items"),
  },
  async ({ url, count }) => {
    const result = await apiCall(`/rss?url=${encodeURIComponent(url)}&limit=${count}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "read_page",
  "Extract readable content from any web page (like Readability)",
  {
    url: z.string().url().describe("Web page URL to extract content from"),
  },
  async ({ url }) => {
    const result = await apiCall(`/read?url=${encodeURIComponent(url)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 4: PROCESSING TOOLS
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "markdown_to_html",
  "Convert Markdown text to HTML (runs locally, no data leaves your machine)",
  {
    markdown: z.string().describe("Markdown text to convert"),
  },
  async ({ markdown }) => {
    const html = await marked.parse(markdown, { async: true });
    return { content: [{ type: "text", text: html }] };
  },
);

server.tool(
  "ai_translate",
  "Translate text between languages (uses MyMemory translation API)",
  {
    text: z.string().describe("Text to translate"),
    from: z.string().default("auto").describe("Source language (auto for auto-detect)"),
    to: z.string().default("en").describe("Target language"),
  },
  async ({ text, from, to }) => {
    const langPair = from === "auto" ? `autodetect|${to}` : `${from}|${to}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      const translated = data?.responseData?.translatedText || `Error: ${data?.responseStatus || "unknown"}`;
      return { content: [{ type: "text", text: JSON.stringify({ from, to, original: text, translated }) }] };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Translation request timed out", from, to, original: text }) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify({ error: `Translation service unavailable: ${err.message}`, from, to, original: text }) }] };
    } finally {
      clearTimeout(timer);
    }
  },
);

server.tool(
  "quote",
  "Get inspirational or random quotes (remote API, no user data sent)",
  {},
  async () => {
    const result = await apiCall("/quote");
    return { content: [{ type: "text", text: result }] };
  },
);

/**
 * WiFi QR Code — CRITICAL: runs 100% locally.
 * WiFi passwords NEVER leave the user's machine.
 */
server.tool(
  "wifi_qrcode",
  "Generate WiFi connection QR codes (runs 100% locally — your password NEVER leaves your device)",
  {
    ssid: z.string().describe("WiFi network name (SSID)"),
    password: z.string().describe("WiFi password"),
    security: z.enum(["WPA", "WEP", "nopass"]).default("WPA").describe("Security type"),
  },
  async ({ ssid, password, security }) => {
    // WiFi QR code format: WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;;
    const wifiString = `WIFI:S:${ssid};T:${security};P:${password};;`;
    const dataUrl = await QRCode.toDataURL(wifiString, { width: 400, margin: 2 });
    return { content: [{ type: "text", text: dataUrl }] };
  },
);

server.tool(
  "compare",
  "Compare two items side-by-side (text, products, anything)",
  {
    a: z.string().describe("First item to compare"),
    b: z.string().describe("Second item to compare"),
  },
  async ({ a, b }) => {
    const result = await apiCall(`/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 5: HEALTH
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "health_check",
  "Check if the MyClaw API backend is reachable and responsive",
  {},
  async () => {
    const start = Date.now();
    const result = await apiCall("/ts");
    const elapsed = Date.now() - start;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          backend: API_BASE,
          status: result.startsWith("{") ? "healthy" : "degraded",
          latency_ms: elapsed,
          version: VERSION,
        }),
      }],
    };
  },
);

// ═══════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`MyClaw Toolkit v${VERSION} — Privacy-first MCP server running (stdio)`);
  console.error("  Local tools: timestamp, uuid, base64, hash, qrcode, wifi_qrcode, color_tools, json_formatter, url_tools, text_tools, bmi_calculator, vcard_generator, markdown_to_html");
  console.error("  Remote tools: web_search, news_search, product_search, exchange_rate, crypto_price, domain_check, rss_feed, read_page, ai_translate, quote, compare");
}

main().catch(console.error);
