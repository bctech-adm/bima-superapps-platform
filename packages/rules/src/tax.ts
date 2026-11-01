/**
 * Pajak atas tagihan langganan BCT (PKP, K-11/K-20).
 *
 * BR-16: PPN = 12% x DPP nilai lain, DPP nilai lain = 11/12 x harga jual  =>  PPN efektif 11% dari harga jual.
 * BR-17: PPh 23 = 2% x harga jual sebelum PPN (dipotong klien badan usaha; BCT menerima bukti potong).
 *
 * Pembulatan: rupiah penuh ke bawah (floor). [S] Konfirmasi dengan konsultan pajak sebelum go-live;
 * bila aturannya berbeda cukup ubah fungsi `roundRupiah`.
 */

export function roundRupiah(value: number): number {
  return Math.floor(value);
}

function assertRupiah(amount: number, label: string): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError(`${label} harus integer rupiah >= 0, diterima ${amount}`);
  }
}

export interface TaxBreakdown {
  /** Harga jual (tanpa PPN). */
  readonly price: number;
  /** DPP nilai lain = 11/12 x harga (pecahan, tidak dibulatkan; hanya informasi faktur). */
  readonly dppNilaiLain: number;
  readonly ppn: number;
  /** Total tagihan = harga + PPN. */
  readonly total: number;
  /** Potongan PPh 23 (0 bila klien tidak memotong). */
  readonly pph23: number;
  /** Jumlah yang ditransfer klien = total - PPh 23. */
  readonly payable: number;
}

export function computeTax(price: number, opts: { withholdPph23?: boolean } = {}): TaxBreakdown {
  assertRupiah(price, "price");
  // 12% x (11/12 x price) = 11/100 x price; dihitung integer agar tidak ada galat floating point.
  const ppn = roundRupiah((price * 11) / 100);
  const pph23 = opts.withholdPph23 ? roundRupiah((price * 2) / 100) : 0;
  const total = price + ppn;
  return { price, dppNilaiLain: (price * 11) / 12, ppn, total, pph23, payable: total - pph23 };
}
