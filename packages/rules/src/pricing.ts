import { ADDONS, ANNUAL_MONTHS_CHARGED, PLANS, planRank, type AddonCode, type PlanCode } from "./catalog.js";
import { computeTax, type TaxBreakdown } from "./tax.js";

export type BillingCycle = "monthly" | "annual";

export interface QuoteRequest {
  readonly plan: PlanCode;
  readonly cycle: BillingCycle;
  readonly addons?: Readonly<Partial<Record<AddonCode, number>>>;
  readonly withholdPph23?: boolean;
}

export interface QuoteLine {
  readonly code: string;
  readonly label: string;
  readonly quantity: number;
  readonly unitMonthly: number;
  readonly months: number;
  readonly amount: number;
}

export type QuoteResult =
  | { readonly kind: "quote"; readonly lines: readonly QuoteLine[]; readonly subtotal: number; readonly tax: TaxBreakdown }
  | { readonly kind: "contact_sales"; readonly reason: "enterprise" };

export class QuoteError extends Error {
  constructor(readonly code: "addon_not_allowed" | "invalid_quantity" | "addon_on_free", message: string) {
    super(message);
    this.name = "QuoteError";
  }
}

/** Kalkulator harga wizard (US-02). Deterministik: input sama -> output sama. */
export function quote(req: QuoteRequest): QuoteResult {
  const plan = PLANS[req.plan];
  if (plan.monthlyPrice === null) return { kind: "contact_sales", reason: "enterprise" };

  const months = req.cycle === "annual" ? ANNUAL_MONTHS_CHARGED : 1;
  const lines: QuoteLine[] = [
    { code: `plan:${plan.code}`, label: `Paket ${plan.name}`, quantity: 1, unitMonthly: plan.monthlyPrice, months, amount: plan.monthlyPrice * months },
  ];

  for (const [code, qty] of Object.entries(req.addons ?? {}) as [AddonCode, number][]) {
    if (qty === 0) continue;
    if (!Number.isSafeInteger(qty) || qty < 0) throw new QuoteError("invalid_quantity", `jumlah ${code} tidak valid: ${qty}`);
    const addon = ADDONS[code];
    if (req.plan === "free") throw new QuoteError("addon_on_free", "paket Free tidak bisa membeli add-on; naik ke UMKM");
    if (planRank(req.plan) < planRank(addon.minPlan)) {
      throw new QuoteError("addon_not_allowed", `${addon.name} minimal paket ${PLANS[addon.minPlan].name}`);
    }
    lines.push({ code: `addon:${code}`, label: addon.name, quantity: qty, unitMonthly: addon.monthlyPrice, months, amount: addon.monthlyPrice * qty * months });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  return { kind: "quote", lines, subtotal, tax: computeTax(subtotal, { withholdPph23: req.withholdPph23 ?? false }) };
}

/**
 * Kredit prorata saat upgrade di tengah periode (BR-21): sisa hari periode lama x tarif harian lama,
 * dikurangkan dari tagihan paket baru untuk sisa periode. Downgrade tidak memakai fungsi ini (berlaku siklus berikutnya).
 */
export function upgradeProration(args: {
  oldMonthlyPrice: number;
  newMonthlyPrice: number;
  daysInPeriod: number;
  daysRemaining: number;
}): { readonly credit: number; readonly charge: number; readonly due: number } {
  const { oldMonthlyPrice, newMonthlyPrice, daysInPeriod, daysRemaining } = args;
  if (!(daysInPeriod > 0) || daysRemaining < 0 || daysRemaining > daysInPeriod) {
    throw new RangeError("hari periode tidak valid");
  }
  if (newMonthlyPrice < oldMonthlyPrice) throw new RangeError("bukan upgrade: downgrade berlaku di siklus berikutnya");
  const credit = Math.floor((oldMonthlyPrice * daysRemaining) / daysInPeriod);
  const charge = Math.floor((newMonthlyPrice * daysRemaining) / daysInPeriod);
  return { credit, charge, due: charge - credit };
}
