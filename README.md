# MyClaw Toolkit — MCP Server

[![Glama](https://glama.ai/mcp/servers/Dusheh/myclaw-toolkit/badge)](https://glama.ai/mcp/servers/Dusheh/myclaw-toolkit)
[![npm](https://img.shields.io/npm/v/myclaw-toolkit)](https://www.npmjs.com/package/myclaw-toolkit)
[![npm downloads](https://img.shields.io/npm/dw/myclaw-toolkit)](https://www.npmjs.com/package/myclaw-toolkit)
[![license](https://img.shields.io/npm/l/myclaw-toolkit)](./LICENSE)
[![tests](https://github.com/Dusheh/myclaw-toolkit/actions/workflows/test.yml/badge.svg)](https://github.com/Dusheh/myclaw-toolkit/actions/workflows/test.yml)

**24-in-1 developer utility toolkit as an MCP server — privacy-first.** Search the web, convert currencies, check crypto prices, generate QR codes, format JSON, and more — all from any MCP-compatible AI assistant.

## 🔒 Privacy-First Design

Most tools run **100% locally on your machine** — no data ever leaves your device:

| Local tools (zero network) | Tools requiring remote API |
|---|---|
| timestamp, uuid, base64, hash | web_search, news_search |
| qrcode, wifi_qrcode | product_search, exchange_rate |
| color_tools, json_formatter | crypto_price, domain_check |
| url_tools, text_tools | rss_feed, read_page |
| bmi_calculator, vcard_generator | ai_translate, quote, compare |
| markdown_to_html | |

WiFi passwords, JSON data, text content, hashes, and Markdown documents are all processed entirely on-device. Only tools that genuinely need external data (search, exchange rates, etc.) call the remote API.

## Quick Install

```bash
npx myclaw-toolkit
```

Or add to your AI client:

**Claude Desktop / Cursor / ChatGPT:**
```json
{
  "mcpServers": {
    "myclaw-toolkit": {
      "command": "npx",
      "args": ["-y", "myclaw-toolkit"]
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add myclaw-toolkit -- npx myclaw-toolkit
```

## Tools

### Utility (Local)
| Tool | Description |
|------|-------------|
| `timestamp` | Current Unix timestamp & ISO 8601 |
| `uuid` | Generate UUID v4 |
| `base64` | Base64 encode/decode |
| `hash` | MD5, SHA1, SHA256, SHA512 |
| `qrcode` | QR code generator |
| `color_tools` | Hex ↔ RGB ↔ HSL converter |
| `json_formatter` | Format, validate, minify JSON |
| `url_tools` | URL encode/decode |
| `text_tools` | Text count, reverse, case |

### Data
| Tool | Description |
|------|-------------|
| `exchange_rate` | Real-time currency rates (API) |
| `crypto_price` | Cryptocurrency prices (API) |
| `domain_check` | Domain whois & availability (API) |
| `bmi_calculator` | BMI calculator (local) |
| `vcard_generator` | vCard (.vcf) generator (local) |
| `compare` | Side-by-side comparison (API) |
| `quote` | Random inspirational quotes (API) |

### Search & Content
| Tool | Description |
|------|-------------|
| `web_search` | Bing web search |
| `news_search` | Global news search |
| `product_search` | E-commerce product search |
| `rss_feed` | RSS feed parser |
| `read_page` | Web page content extractor |

### Processing
| Tool | Description |
|------|-------------|
| `markdown_to_html` | Markdown → HTML (local) |
| `wifi_qrcode` | WiFi QR code generator (local — password never sent) |
| `ai_translate` | AI translation via MyMemory API |

### Health
| Tool | Description |
|------|-------------|
| `health_check` | Check API backend status & latency |

## Discoverability

Listed on these MCP registries (help others find the toolkit):

- [Glama](https://glama.ai/mcp/servers/Dusheh/myclaw-toolkit) — auto-indexed
- [MCPFind](https://www.mcpfind.org/) — PR pending
- [mcp.so](https://mcp.so) — submitted
- [awesome-mcp-servers (punkpeye)](https://github.com/punkpeye/awesome-mcp-servers) — PR pending
- [awesome-mcp-servers (appcypher)](https://github.com/appcypher/awesome-mcp-servers) — PR pending
- [Awesome MCP List](https://github.com/MobinX/awesome-mcp-list) — PR pending
- [MCP.Directory](https://mcp.directory) — submitted
- [Official MCP Registry](https://registry.modelcontextprotocol.io) — published, awaiting indexing

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MYCLAW_API` | `http://47.103.7.241` | API backend URL |

## Development

```bash
git clone https://github.com/Dusheh/myclaw-toolkit
cd myclaw-toolkit
npm install
npm run dev     # Run with tsx
npm run build   # Compile TypeScript
npm test        # Run 24 unit tests
npm run lint    # ESLint check
```

## License

MIT
