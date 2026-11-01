import { PLANS, type PlanCode } from "./catalog.js";

/**
 * Evaluasi kuota (BR-08..BR-12).
 * - Metrik transaksi & omzet: peringatan di 80%, grace 10% di atas batas, lewat itu dokumen baru diblokir.
 * - Metrik user, device, prompt AI: tanpa grace.
 */
export type QuotaMetric = "trxPerMonth" | "omzetPerMonth" | "users" | "devices" | "aiPromptsPerDay";
export type QuotaState = "ok" | "warn" | "grace" | "blocked";

export const WARN_RATIO = 0.8;
export const GRACE_RATIO = 0.1;
const GRACE_METRICS: ReadonlySet<QuotaMetric> = new Set(["trxPerMonth", "omzetPerMonth"]);

export interface QuotaStatus {
  readonly metric: QuotaMetric;
  readonly limit: number | null;
  readonly used: number;
  readonly state: QuotaState;
  /** Batas keras: dokumen/aksi baru ditolak bila `used` melewati angka ini. */
  readonly hardStop: number | null;
}

export function hardStopFor(metric: QuotaMetric, limit: number): number {
  return GRACE_METRICS.has(metric) ? Math.floor(limit * (1 + GRACE_RATIO)) : limit;
}

export function evaluateQuota(plan: PlanCode, metric: QuotaMetric, used: number): QuotaStatus {
  if (!Number.isFinite(used) || used < 0) throw new RangeError(`pemakaian tidak valid: ${used}`);
  const limit = PLANS[plan].limits[metric];
  if (limit === null) return { metric, limit, used, state: "ok", hardStop: null };
  const hardStop = hardStopFor(metric, limit);
  let state: QuotaState;
  if (used > hardStop) state = "blocked";
  else if (used > limit) state = "grace";
  else if (used >= limit * WARN_RATIO) state = "warn";
  else state = "ok";
  // Tanpa grace: tepat di batas masih boleh dipakai, tetapi aksi berikutnya ditolak (lihat `canConsume`).
  return { metric, limit, used, state, hardStop };
}

/** Apakah satu aksi baru (mis. transaksi ke-N+1, prompt ke-4) boleh dijalankan. */
export function canConsume(plan: PlanCode, metric: QuotaMetric, usedBefore: number, amount = 1): boolean {
  const limit = PLANS[plan].limits[metric];
  if (limit === null) return true;
  return usedBefore + amount <= hardStopFor(metric, limit);
}
