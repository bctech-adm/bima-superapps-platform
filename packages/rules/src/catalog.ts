/**
 * Katalog paket & add-on BCTOne (docs/BCTONE_FINAL_v2.md §8, keputusan owner K-19/K-20).
 * Semua harga dalam rupiah penuh (integer), BELUM termasuk PPN.
 * Satu-satunya sumber angka harga: LLM tidak pernah menghasilkan harga (BR-03).
 */

export type PlanCode = "free" | "umkm" | "bisnis" | "enterprise";
export type AddonCode = "user" | "device" | "outlet" | "ai_50" | "web_template" | "custom_domain";

export interface PlanLimits {
  /** Jumlah user internal aktif. `null` = sesuai kontrak. */
  readonly users: number | null;
  readonly devices: number | null;
  readonly outlets: number | null;
  /** Transaksi per bulan kalender WIB (bruto). */
  readonly trxPerMonth: number | null;
  /** Omzet per bulan (rupiah, tanpa pajak). `null` = tanpa batas. */
  readonly omzetPerMonth: number | null;
  readonly aiPromptsPerDay: number | null;
}

export interface Plan {
  readonly code: PlanCode;
  readonly name: string;
  /** Harga bulanan (rupiah, tanpa PPN). `null` = harga kontrak (Enterprise). */
  readonly monthlyPrice: number | null;
  readonly selfServe: boolean;
  readonly limits: PlanLimits;
}

export const PLANS: Readonly<Record<PlanCode, Plan>> = {
  free: {
    code: "free",
    name: "Free",
    monthlyPrice: 0,
    selfServe: true,
    limits: { users: 1, devices: 1, outlets: 1, trxPerMonth: 300, omzetPerMonth: 25_000_000, aiPromptsPerDay: 3 },
  },
  umkm: {
    code: "umkm",
    name: "UMKM",
    monthlyPrice: 199_000,
    selfServe: true,
    limits: { users: 5, devices: 3, outlets: 2, trxPerMonth: 5_000, omzetPerMonth: null, aiPromptsPerDay: 30 },
  },
  bisnis: {
    code: "bisnis",
    name: "Bisnis",
    monthlyPrice: 999_000,
    selfServe: false,
    limits: { users: 25, devices: 10, outlets: 10, trxPerMonth: 50_000, omzetPerMonth: null, aiPromptsPerDay: 150 },
  },
  enterprise: {
    code: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    selfServe: false,
    limits: { users: null, devices: null, outlets: null, trxPerMonth: null, omzetPerMonth: null, aiPromptsPerDay: null },
  },
};

export interface Addon {
  readonly code: AddonCode;
  readonly name: string;
  readonly monthlyPrice: number;
  /** Paket minimum yang boleh membeli add-on ini. */
  readonly minPlan: PlanCode;
}

export const ADDONS: Readonly<Record<AddonCode, Addon>> = {
  user: { code: "user", name: "User tambahan", monthlyPrice: 35_000, minPlan: "umkm" },
  device: { code: "device", name: "Device tambahan", monthlyPrice: 50_000, minPlan: "umkm" },
  outlet: { code: "outlet", name: "Outlet tambahan", monthlyPrice: 99_000, minPlan: "umkm" },
  ai_50: { code: "ai_50", name: "AI +50 prompt/hari", monthlyPrice: 99_000, minPlan: "umkm" },
  web_template: { code: "web_template", name: "Web profil template", monthlyPrice: 99_000, minPlan: "umkm" },
  custom_domain: { code: "custom_domain", name: "Domain sendiri", monthlyPrice: 50_000, minPlan: "bisnis" },
};

const PLAN_ORDER: readonly PlanCode[] = ["free", "umkm", "bisnis", "enterprise"];

export function planRank(code: PlanCode): number {
  return PLAN_ORDER.indexOf(code);
}

/** Paket tahunan = 10 x harga bulanan (BR-21). */
export const ANNUAL_MONTHS_CHARGED = 10;
