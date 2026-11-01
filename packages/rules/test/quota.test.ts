import { describe, expect, it } from "vitest";
import { canConsume, evaluateQuota } from "../src/quota.js";

describe("kuota Free (BR-08..BR-11)", () => {
  it("transaksi: ok < 240, warn 240..300, grace 301..330, blocked > 330", () => {
    expect(evaluateQuota("free", "trxPerMonth", 239).state).toBe("ok");
    expect(evaluateQuota("free", "trxPerMonth", 240).state).toBe("warn");
    expect(evaluateQuota("free", "trxPerMonth", 300).state).toBe("warn");
    expect(evaluateQuota("free", "trxPerMonth", 301).state).toBe("grace");
    expect(evaluateQuota("free", "trxPerMonth", 330).state).toBe("grace");
    expect(evaluateQuota("free", "trxPerMonth", 331).state).toBe("blocked");
    expect(evaluateQuota("free", "trxPerMonth", 0).hardStop).toBe(330);
  });

  it("omzet: hard stop Rp27.500.000", () => {
    expect(evaluateQuota("free", "omzetPerMonth", 0).hardStop).toBe(27_500_000);
    expect(canConsume("free", "omzetPerMonth", 27_000_000, 500_000)).toBe(true);
    expect(canConsume("free", "omzetPerMonth", 27_000_000, 500_001)).toBe(false);
  });

  it("transaksi ke-331 ditolak, ke-330 boleh", () => {
    expect(canConsume("free", "trxPerMonth", 329)).toBe(true);
    expect(canConsume("free", "trxPerMonth", 330)).toBe(false);
  });

  it("AI 3 prompt/hari tanpa grace: prompt ke-4 ditolak", () => {
    expect(canConsume("free", "aiPromptsPerDay", 2)).toBe(true);
    expect(canConsume("free", "aiPromptsPerDay", 3)).toBe(false);
  });

  it("user & device 1/1 tanpa grace", () => {
    expect(canConsume("free", "users", 1)).toBe(false);
    expect(canConsume("free", "devices", 0)).toBe(true);
    expect(evaluateQuota("free", "devices", 2).state).toBe("blocked");
  });

  it("UMKM tanpa batas omzet; Enterprise tanpa batas apa pun", () => {
    expect(evaluateQuota("umkm", "omzetPerMonth", 10_000_000_000).state).toBe("ok");
    expect(canConsume("enterprise", "trxPerMonth", 1e9)).toBe(true);
  });

  it("menolak pemakaian negatif", () => {
    expect(() => evaluateQuota("free", "trxPerMonth", -1)).toThrow(RangeError);
  });
});
