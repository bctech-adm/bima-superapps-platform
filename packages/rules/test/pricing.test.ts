import { describe, expect, it } from "vitest";
import { quote, QuoteError, upgradeProration } from "../src/pricing.js";

describe("quote (US-02, BR-03, BR-21)", () => {
  it("Free = Rp0 tanpa pajak", () => {
    const q = quote({ plan: "free", cycle: "monthly" });
    expect(q.kind).toBe("quote");
    if (q.kind === "quote") expect(q.tax.total).toBe(0);
  });

  it("UMKM bulanan + 2 user tambahan", () => {
    const q = quote({ plan: "umkm", cycle: "monthly", addons: { user: 2 } });
    if (q.kind !== "quote") throw new Error("harus quote");
    expect(q.subtotal).toBe(199_000 + 70_000);
    expect(q.tax.ppn).toBe(Math.floor((269_000 * 11) / 100));
  });

  it("tahunan = 10 x bulanan", () => {
    const q = quote({ plan: "bisnis", cycle: "annual" });
    if (q.kind !== "quote") throw new Error("harus quote");
    expect(q.subtotal).toBe(9_990_000);
  });

  it("Enterprise diarahkan ke sales", () => {
    expect(quote({ plan: "enterprise", cycle: "monthly" })).toEqual({ kind: "contact_sales", reason: "enterprise" });
  });

  it("Free tidak bisa membeli add-on", () => {
    expect(() => quote({ plan: "free", cycle: "monthly", addons: { user: 1 } })).toThrow(QuoteError);
  });

  it("domain sendiri minimal paket Bisnis", () => {
    expect(() => quote({ plan: "umkm", cycle: "monthly", addons: { custom_domain: 1 } })).toThrow(/minimal paket Bisnis/);
    expect(quote({ plan: "bisnis", cycle: "monthly", addons: { custom_domain: 1 } }).kind).toBe("quote");
  });

  it("menolak jumlah add-on tidak valid", () => {
    expect(() => quote({ plan: "umkm", cycle: "monthly", addons: { user: -1 } })).toThrow(QuoteError);
    expect(() => quote({ plan: "umkm", cycle: "monthly", addons: { user: 1.5 } })).toThrow(QuoteError);
  });

  it("deterministik", () => {
    const req = { plan: "umkm", cycle: "annual", addons: { device: 1, ai_50: 1 }, withholdPph23: true } as const;
    expect(quote(req)).toEqual(quote(req));
  });
});

describe("upgradeProration", () => {
  it("UMKM -> Bisnis di tengah bulan 30 hari (sisa 15 hari)", () => {
    const r = upgradeProration({ oldMonthlyPrice: 199_000, newMonthlyPrice: 999_000, daysInPeriod: 30, daysRemaining: 15 });
    expect(r).toEqual({ credit: 99_500, charge: 499_500, due: 400_000 });
  });

  it("menolak downgrade", () => {
    expect(() => upgradeProration({ oldMonthlyPrice: 999_000, newMonthlyPrice: 199_000, daysInPeriod: 30, daysRemaining: 10 })).toThrow(/downgrade/);
  });
});
