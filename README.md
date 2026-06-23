# MyClaw Toolkit — MCP Server

**23-in-1 developer utility toolkit as an MCP server.** Search the web, convert currencies, check crypto prices, generate QR codes, format JSON, and more — all from any MCP-compatible AI assistant.

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
      "args": ["myclaw-toolkit"]
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add myclaw-toolkit -- npx myclaw-toolkit
```

## Tools

### Utility (Free)
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

### Data (Free)
| Tool | Description |
|------|-------------|
| `exchange_rate` | Real-time currency rates |
| `crypto_price` | Cryptocurrency prices |
| `domain_check` | Domain whois & availability |
| `bmi_calculator` | BMI calculator |
| `vcard_generator` | vCard (.vcf) generator |
| `compare` | Side-by-side comparison |
| `quote` | Random inspirational quotes |

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
| `markdown_to_html` | Markdown → HTML |
| `wifi_qrcode` | WiFi QR code generator |
| `ai_translate` | AI translation |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MYCLAW_API` | `http://47.103.7.241` | API backend URL |

## Development

```bash
git clone https://github.com/Dusheh/myclaw-toolkit
cd toolkit
npm install
npm run dev
```

## License

MIT — [MyClaw](https://myclaw.dev)
