import { describe, expect, it } from "vitest";
import { computeTax } from "../src/tax.js";

describe("computeTax (BR-16, BR-17)", () => {
  it("contoh dokumen v2: UMKM Rp199.000", () => {
    const t = computeTax(199_000);
    expect(t.ppn).toBe(21_890);
    expect(t.total).toBe(220_890);
    expect(t.pph23).toBe(0);
    expect(t.payable).toBe(220_890);
  });

  it("dengan potongan PPh 23 -> transfer Rp216.910", () => {
    const t = computeTax(199_000, { withholdPph23: true });
    expect(t.pph23).toBe(3_980);
    expect(t.payable).toBe(216_910);
  });

  it("PPN = 12% x DPP nilai lain", () => {
    const t = computeTax(999_000);
    expect(t.ppn).toBe(Math.floor(t.dppNilaiLain * 0.12 + 1e-9));
  });

  it("membulatkan ke bawah ke rupiah penuh", () => {
    expect(computeTax(35_001).ppn).toBe(3_850); // 3850,11
  });

  it("menolak nilai non-integer / negatif", () => {
    expect(() => computeTax(-1)).toThrow(RangeError);
    expect(() => computeTax(10.5)).toThrow(RangeError);
  });
});
