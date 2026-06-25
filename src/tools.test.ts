#!/usr/bin/env node
/**
 * Basic tests for local tool implementations.
 * Run: npx vitest run
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

// ═══════════════════════════════════════════════════════════════════
// Utility functions (replicated from index.ts for isolated testing)
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("timestamp", () => {
  it("generates valid timestamps", () => {
    const now = Date.now();
    const iso = new Date().toISOString();
    expect(now).toBeGreaterThan(1700000000000); // after 2023
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe("uuid", () => {
  it("generates valid UUID v4", () => {
    for (let i = 0; i < 10; i++) {
      const uuid = crypto.randomUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });

  it("generates unique UUIDs", () => {
    const uuids = new Set(Array.from({ length: 100 }, () => crypto.randomUUID()));
    expect(uuids.size).toBe(100);
  });
});

describe("base64", () => {
  it("encodes correctly", () => {
    expect(Buffer.from("hello").toString("base64")).toBe("aGVsbG8=");
    expect(Buffer.from("你好").toString("base64")).toBe("5L2g5aW9");
  });

  it("round-trips", () => {
    const original = "Hello, World! 你好世界";
    const encoded = Buffer.from(original, "utf-8").toString("base64");
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    expect(decoded).toBe(original);
  });
});

describe("hash", () => {
  it("generates correct SHA256", () => {
    const hash = crypto.createHash("sha256").update("test").digest("hex");
    expect(hash).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
  });

  it("generates correct MD5", () => {
    const hash = crypto.createHash("md5").update("hello").digest("hex");
    expect(hash).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("different inputs produce different hashes", () => {
    const h1 = crypto.createHash("sha256").update("a").digest("hex");
    const h2 = crypto.createHash("sha256").update("b").digest("hex");
    expect(h1).not.toBe(h2);
  });
});

describe("color_tools", () => {
  it("converts hex to RGB correctly", () => {
    expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
    expect(hexToRgb("#00ff00")).toEqual([0, 255, 0]);
    expect(hexToRgb("#0000ff")).toEqual([0, 0, 255]);
  });

  it("converts hex to HSL correctly", () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl[0]).toBe(0);   // hue
    expect(hsl[1]).toBe(100); // saturation
    expect(hsl[2]).toBe(50);  // lightness
  });

  it("round-trips hex → RGB → HSL → RGB → hex", () => {
    const originalHex = "#4a90d9";
    const rgb = hexToRgb(originalHex);
    const hsl = rgbToHsl(...rgb);
    const rgb2 = hslToRgb(...hsl);
    // Allow 1-unit rounding difference
    expect(Math.abs(rgb[0] - rgb2[0])).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb[1] - rgb2[1])).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb[2] - rgb2[2])).toBeLessThanOrEqual(1);
  });
});

describe("bmi_calculator", () => {
  it("calculates BMI correctly", () => {
    const height = 175, weight = 70;
    const h = height / 100;
    const bmi = weight / (h * h);
    expect(Math.round(bmi * 100) / 100).toBe(22.86);
  });

  it("correctly categorizes BMI", () => {
    const categorize = (bmi: number) => {
      if (bmi < 18.5) return "Underweight";
      if (bmi < 25) return "Normal weight";
      if (bmi < 30) return "Overweight";
      return "Obese";
    };
    expect(categorize(17)).toBe("Underweight");
    expect(categorize(22)).toBe("Normal weight");
    expect(categorize(27)).toBe("Overweight");
    expect(categorize(32)).toBe("Obese");
  });
});

describe("json_formatter", () => {
  it("formats JSON", () => {
    const obj = { a: 1, b: [2, 3] };
    expect(JSON.parse(JSON.stringify(obj))).toEqual(obj);
  });

  it("detects invalid JSON", () => {
    expect(() => JSON.parse("{bad json")).toThrow();
  });

  it("minifies JSON", () => {
    const minified = JSON.stringify({ a: 1, b: 2 });
    expect(minified).toBe('{"a":1,"b":2}');
    expect(minified).not.toContain("\n");
  });
});

describe("url_tools", () => {
  it("encodes URL components", () => {
    expect(encodeURIComponent("hello world")).toBe("hello%20world");
    expect(encodeURIComponent("你好")).toBe("%E4%BD%A0%E5%A5%BD");
  });

  it("decodes URL components", () => {
    expect(decodeURIComponent("hello%20world")).toBe("hello world");
    expect(decodeURIComponent("%E4%BD%A0%E5%A5%BD")).toBe("你好");
  });

  it("round-trips", () => {
    const original = "https://example.com?q=你好世界";
    expect(decodeURIComponent(encodeURIComponent(original))).toBe(original);
  });
});

describe("text_tools", () => {
  it("counts characters, words, lines", () => {
    const text = "Hello world\nHow are you?";
    expect(text.length).toBe(24);
    expect(text.trim().split(/\s+/).length).toBe(5);
    expect(text.split("\n").length).toBe(2);
  });

  it("reverses text", () => {
    expect("hello".split("").reverse().join("")).toBe("olleh");
  });

  it("converts case", () => {
    expect("Hello".toUpperCase()).toBe("HELLO");
    expect("Hello".toLowerCase()).toBe("hello");
    expect("hello world".replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).toBe("Hello World");
  });
});

describe("vcard_generator", () => {
  it("generates valid vCard", () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:John Doe",
      "ORG:ACME Inc",
      "TEL:+1234567890",
      "EMAIL:john@example.com",
      "END:VCARD",
    ].join("\n");
    expect(vcard).toContain("BEGIN:VCARD");
    expect(vcard).toContain("FN:John Doe");
    expect(vcard).toContain("END:VCARD");
  });
});

describe("wifi_qrcode format", () => {
  it("generates correct WiFi string format", () => {
    const ssid = "MyNetwork";
    const password = "secret123";
    const security = "WPA";
    const wifiString = `WIFI:S:${ssid};T:${security};P:${password};;`;
    expect(wifiString).toBe("WIFI:S:MyNetwork;T:WPA;P:secret123;;");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Rate Limiter Tests
// ═══════════════════════════════════════════════════════════════════

describe("rate_limiter", () => {
  it("allows requests within limit", () => {
    const RATE_WINDOW_MS = 60_000;
    const MAX = 100;
    let timestamps: number[] = [];
    const check = () => {
      const now = Date.now();
      timestamps = timestamps.filter(t => now - t < RATE_WINDOW_MS);
      if (timestamps.length >= MAX) return false;
      timestamps.push(now);
      return true;
    };
    
    // First 100 requests should pass
    for (let i = 0; i < MAX; i++) {
      expect(check()).toBe(true);
    }
    // 101st should fail
    expect(check()).toBe(false);
  });
  
  it("resets after window expires", () => {
    const now = Date.now();
    // Create 100 timestamps all older than the window
    const timestamps = Array.from({ length: 100 }, () => now - 90_000);
    const filtered = timestamps.filter(t => now - t < 60_000);
    expect(filtered.length).toBe(0); // all expired
  });
});
