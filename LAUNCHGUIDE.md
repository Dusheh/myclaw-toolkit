# LAUNCHGUIDE.md

## Listing Metadata

```yaml
name: MyClaw Toolkit
tagline: 23-in-1 developer utility toolkit — search, exchange rates, crypto, QR codes, translation, and more
description: >
  MyClaw Toolkit is the ultimate swiss-army knife for developers and AI assistants.
  It exposes 23 tools via MCP, covering:
  - Web/News/Product search (Bing-powered)
  - Real-time exchange rates & cryptocurrency prices
  - Domain availability checker
  - QR code & WiFi QR generator
  - Base64, hash, UUID, timestamp generators
  - Color converter, JSON formatter, URL tools
  - Markdown to HTML converter
  - BMI calculator, vCard generator
  - RSS feed parser, web page reader
  - AI translation, quote generator
  All tools are accessible through any MCP-compatible AI client (Claude, ChatGPT, Cursor, etc.)

category: Developer Tools
tags:
  - developer-tools
  - search
  - api
  - utilities
  - crypto
  - web

pricing: free
pricing_tiers:
  - name: Free
    price: 0
    features:
      - 11 utility tools (timestamp, uuid, base64, hash, qrcode, color, json, url, text, bmi, vcard)
      - 4 data tools (exchange_rate, crypto_price, domain_check, compare)
      - 1 fun tool (quote)
    rate_limit: 100 requests/day

install_commands:
  claude_desktop: |
    {
      "mcpServers": {
        "myclaw-toolkit": {
          "command": "npx",
          "args": ["myclaw-toolkit"]
        }
      }
    }
  claude_code: claude mcp add myclaw-toolkit -- npx myclaw-toolkit
  cursor: |
    {
      "mcpServers": {
        "myclaw-toolkit": {
          "command": "npx",
          "args": ["myclaw-toolkit"]
        }
      }
    }
  chatgpt: |
    {
      "mcpServers": {
        "myclaw-toolkit": {
          "command": "npx",
          "args": ["myclaw-toolkit"]
        }
      }
    }

setup_requirements: |
  Node.js 18+. Run `npx myclaw-toolkit` — that's it.

use_cases:
  - Quick web searches without leaving your AI chat
  - Currency conversion and crypto price checks
  - Generate UUIDs, hashes, QR codes on the fly
  - Format JSON, convert colors, encode URLs
  - Parse RSS feeds and read web page content
  - Check domain availability
  - Generate vCard contacts and WiFi QR codes

repository: https://github.com/Dusheh/myclaw-toolkit
homepage: https://myclaw.dev
author: MyClaw
author_url: https://myclaw.dev
```

## Tool List

### Free Tier (16 tools)
| # | Tool | Description |
|---|------|-------------|
| 1 | timestamp | Current Unix timestamp & ISO 8601 datetime |
| 2 | uuid | Generate UUID v4 identifiers |
| 3 | base64 | Encode/decode Base64 strings |
| 4 | hash | MD5, SHA1, SHA256, SHA512 hashing |
| 5 | qrcode | Generate QR codes from text/URLs |
| 6 | color_tools | Convert colors between hex, RGB, HSL |
| 7 | json_formatter | Format, validate, minify JSON |
| 8 | url_tools | Encode/decode URL strings |
| 9 | text_tools | Count, reverse, case-convert text |
| 10 | bmi_calculator | Calculate BMI from height & weight |
| 11 | vcard_generator | Generate .vcf contact files |
| 12 | exchange_rate | Real-time currency exchange rates |
| 13 | crypto_price | Cryptocurrency prices |
| 14 | domain_check | Domain availability & whois |
| 15 | compare | Side-by-side item comparison |
| 16 | quote | Inspirational random quotes |

### Pro Tier (7 tools — coming soon via MCP Marketplace subscriptions)
| # | Tool | Description |
|---|------|-------------|
| 17 | web_search | Bing web search |
| 18 | news_search | Global news search |
| 19 | product_search | Multi-platform product search |
| 20 | rss_feed | RSS feed parser |
| 21 | read_page | Web page content extractor |
| 22 | markdown_to_html | Markdown to HTML converter |
| 23 | wifi_qrcode | WiFi connection QR generator |
| 24 | ai_translate | AI-powered translation |

## Submission Checklist
- [x] MCP server code complete (23 tools)
- [x] Package published to npm (`myclaw-toolkit`)
- [x] README with install instructions
- [x] LAUNCHGUIDE.md for auto-fill
- [x] GitHub repository configured
- [ ] Submit to MCP Marketplace
- [ ] Security scan passed
- [ ] Live on marketplace
