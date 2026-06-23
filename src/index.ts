#!/usr/bin/env node
/**
 * MyClaw Toolkit — 23-in-1 Developer Utility MCP Server
 *
 * Exposes 23 tools to AI assistants (Claude, ChatGPT, Cursor, etc.)
 * via the Model Context Protocol (MCP).
 *
 * Free tier: utility & data tools
 * Pro tier: search & AI tools (subscription-based via MCP Marketplace)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Config ──────────────────────────────────────────────────────────
const API_BASE = process.env.MYCLAW_API || "http://47.103.7.241";
const USER_AGENT = "myclaw-toolkit-mcp/1.0";
const FETCH_TIMEOUT_MS = 15_000;

async function apiCall(path: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      return JSON.stringify({ error: `API returned ${res.status}`, path });
    }
    return res.text();
  } catch (err: any) {
    if (err.name === "AbortError") {
      return JSON.stringify({ error: "Request timed out", path });
    }
    return JSON.stringify({ error: `Connection failed: ${err.message}`, path });
  } finally {
    clearTimeout(timer);
  }
}

// ── Server ──────────────────────────────────────────────────────────
const server = new McpServer({
  name: "myclaw-toolkit",
  version: "1.0.3",
});

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 1: UTILITY TOOLS (Free)
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "timestamp",
  "Get current Unix timestamp and ISO 8601 datetime",
  {},
  async () => {
    const result = await apiCall("/ts");
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "uuid",
  "Generate UUID v4 identifiers",
  {
    count: z.number().min(1).max(100).default(1).describe("Number of UUIDs to generate"),
  },
  async ({ count }) => {
    const result = await apiCall(`/uuid?count=${count}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "base64",
  "Encode or decode Base64 strings",
  {
    action: z.enum(["encode", "decode"]).describe("Operation to perform"),
    text: z.string().describe("Text to encode or Base64 to decode"),
  },
  async ({ action, text }) => {
    const result = await apiCall(`/b64?action=${action}&text=${encodeURIComponent(text)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "hash",
  "Generate cryptographic hashes (MD5, SHA1, SHA256, SHA512)",
  {
    algorithm: z.enum(["md5", "sha1", "sha256", "sha512"]).default("sha256").describe("Hash algorithm"),
    text: z.string().describe("Text to hash"),
  },
  async ({ algorithm, text }) => {
    const result = await apiCall(`/hash?algo=${algorithm}&text=${encodeURIComponent(text)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "qrcode",
  "Generate QR codes from text or URLs",
  {
    text: z.string().describe("Text or URL to encode in QR code"),
  },
  async ({ text }) => {
    const result = await apiCall(`/qr?text=${encodeURIComponent(text)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "color_tools",
  "Convert colors between hex, RGB, and HSL formats",
  {
    color: z.string().describe("Color value (hex like #ff0000, rgb like 255,0,0, or hsl like 0,100,50)"),
  },
  async ({ color }) => {
    const result = await apiCall(`/color?value=${encodeURIComponent(color)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "json_formatter",
  "Format, validate, or minify JSON strings",
  {
    action: z.enum(["format", "validate", "minify"]).default("format").describe("Operation"),
    json: z.string().describe("JSON string to process"),
  },
  async ({ action, json }) => {
    const result = await apiCall(`/json?action=${action}&data=${encodeURIComponent(json)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "url_tools",
  "Encode or decode URL strings",
  {
    action: z.enum(["encode", "decode"]).describe("Operation"),
    text: z.string().describe("Text to encode or URL to decode"),
  },
  async ({ action, text }) => {
    const result = await apiCall(`/url?action=${action}&text=${encodeURIComponent(text)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "text_tools",
  "Text processing utilities (count, reverse, case conversion)",
  {
    action: z.enum(["count", "reverse", "upper", "lower", "title"]).describe("Operation"),
    text: z.string().describe("Text to process"),
  },
  async ({ action, text }) => {
    const result = await apiCall(`/text?action=${action}&text=${encodeURIComponent(text)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 2: DATA TOOLS (Free)
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
  "Calculate BMI (Body Mass Index) from height and weight",
  {
    height: z.number().min(50).max(300).describe("Height in centimeters"),
    weight: z.number().min(1).max(500).describe("Weight in kilograms"),
  },
  async ({ height, weight }) => {
    const result = await apiCall(`/bmi?h=${height}&w=${weight}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "vcard_generator",
  "Generate vCard (.vcf) contact files",
  {
    name: z.string().describe("Full name"),
    phone: z.string().optional().describe("Phone number"),
    email: z.string().optional().describe("Email address"),
    org: z.string().optional().describe("Organization/company"),
  },
  async ({ name, phone, email, org }) => {
    const params = new URLSearchParams({ name });
    if (phone) params.set("phone", phone);
    if (email) params.set("email", email);
    if (org) params.set("org", org);
    const result = await apiCall(`/vcard?${params.toString()}`);
    return { content: [{ type: "text", text: result }] };
  },
);

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 3: SEARCH & CONTENT TOOLS (Pro / requires API key)
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
// CATEGORY 4: PROCESSING TOOLS (Pro)
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "markdown_to_html",
  "Convert Markdown text to HTML",
  {
    markdown: z.string().describe("Markdown text to convert"),
  },
  async ({ markdown }) => {
    const result = await apiCall(`/md?text=${encodeURIComponent(markdown)}`);
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "ai_translate",
  "Translate text between languages using AI",
  {
    text: z.string().describe("Text to translate"),
    from: z.string().default("auto").describe("Source language (auto for auto-detect)"),
    to: z.string().default("en").describe("Target language"),
  },
  async ({ text, from, to }) => {
    const langPair = from === "auto" ? `autodetect|${to}` : `${from}|${to}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const translated = data?.responseData?.translatedText || `Error: ${data?.responseStatus || "unknown"}`;
      return { content: [{ type: "text", text: JSON.stringify({ from, to, original: text, translated }) }] };
    } catch {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Translation service unavailable", from, to, original: text }) }] };
    }
  },
);

server.tool(
  "quote",
  "Get inspirational or random quotes",
  {},
  async () => {
    const result = await apiCall("/quote");
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "wifi_qrcode",
  "Generate WiFi connection QR codes",
  {
    ssid: z.string().describe("WiFi network name (SSID)"),
    password: z.string().describe("WiFi password"),
    security: z.enum(["WPA", "WEP", "nopass"]).default("WPA").describe("Security type"),
  },
  async ({ ssid, password, security }) => {
    const result = await apiCall(`/wifi?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(password)}&sec=${security}`);
    return { content: [{ type: "text", text: result }] };
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
  console.error("MyClaw Toolkit MCP server running (stdio)");
}

main().catch(console.error);
