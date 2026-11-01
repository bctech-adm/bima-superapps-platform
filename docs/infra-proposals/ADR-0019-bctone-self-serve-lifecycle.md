# ADR 0019 (USULAN) — BCTOne: siklus langganan self-serve, kuota, dan job tenant baru

- **Status:** proposed. Menunggu GATE 1 owner. Setelah disetujui, file ini disalin ke `/opt/infra/docs/adr/` lewat proses repo infra.
- **Tanggal:** 2026-11-01
- **Terkait:** ADR 0004 (kapasitas), 0009 (job bridge), 0015 (addons platform), 0017 (identitas), 0018 (siklus langganan);
  `docs/BCTONE_FINAL_v2.md`, `docs/BCTONE_v2.1_ADAPTASI_INFRA.md` di repo ini.

## Context

1. ADR 0018 mengatur siklus tenant **implementasi** (implementation → warranty → active → past_due dengan grace 2 bulan →
   suspended). Siklus ini dipicu dan diawasi manual oleh platform-admin.
2. BCTOne butuh tenant **self-serve**: daftar sendiri, provisioning otomatis, paket Free/UMKM. Keputusan owner untuk tenant ini:
   - retensi 14 hari setelah suspend (K-13);
   - kuota Free: 1 user, 1 device, 300 transaksi/bulan, omzet Rp25 jt/bulan, grace 10%, AI 3 prompt/hari (K-06/K-19);
   - PPN + PPh 23 (K-11/K-20);
   - tenant Free dianggap berhenti setelah 60 hari tanpa login.
3. Rule engine harga/pajak/kuota sudah ada sebagai paket `@bctone/rules` di repo ini, dengan unit test.

## Decision (usulan)

1. **Atribut siklus baru di `subscriptions`:** `lifecycle` = `implementation` (default, perilaku ADR 0018 tidak berubah) |
   `self_serve`. Migrasi Drizzle aditif.
2. **Siklus `self_serve`** (BR-22), dijalankan `subscription_tick`:

   | Dari | Ke | Pemicu |
   |---|---|---|
   | (baru) | `active` | provisioning sukses (Free: tanpa invoice; berbayar: invoice pertama lunas atau aktivasi sementara 48 jam) |
   | `active` | `past_due` | `today > ends_at` |
   | `past_due` | `suspended` | `today > ends_at + 7 hari`, dan tidak ada bukti bayar berstatus `awaiting_confirmation` (BR-18) → `tenant_suspend` |
   | `suspended` | `active` | invoice lunas → `tenant_resume` |
   | `suspended` | `terminated` | `today > suspended_at + 14 hari` → job baru `tenant_purge` |
   | Free `active` | `suspended` | 60 hari tanpa login |

3. **Kuota:** tabel `plan_quota` (metrik, batas) dan `tenant_usage_daily` (tenant, tanggal, user, device, trx_gross, omzet_net),
   diisi addon tenant `bct_tenant_agent`. Penegakan dilakukan di tenant (Odoo), evaluasi memakai aturan yang sama dengan
   `@bctone/rules`.
4. **Job baru di dispatcher `infra-job`** (versi kontrak dinaikkan; argumen divalidasi sama ketatnya dengan job yang sudah ada):
   - `bctone_tenant_provision <slug> --pack fnb|retail`: membuat DB dari template pack, lalu konfigurasi company, outlet, dan owner.
     Gagal → drop DB.
   - `tenant_purge <slug>`: hapus DB, filestore, route, dan backup (crypto-shred). Wajib `--approve` di prod sampai 30 hari stabil.
5. **Kapasitas (ADR 0004):** maksimal 10–15 tenant BCTOne di `odoo-pool-a` [A]. Pendaftaran baru otomatis masuk waitlist
   bila RAM available p05 < 3 GiB atau tenant BCTOne ≥ batas.

## Consequences

- Tenant implementasi yang sudah ada tidak berubah.
- Dispatcher dan kontraknya bertambah dua tipe job, ditambah tes kontrak.
- Retensi 14 hari lebih pendek dari ADR 0018 (terminate manual). Karena itu purge memakai `--approve` di awal.

## Pertanyaan GATE 1

1. Setuju siklus `self_serve` terpisah dari siklus implementasi?
2. Batas awal 10–15 tenant BCTOne di pool-a?
3. `tenant_purge` dengan approval manual selama 30 hari pertama?
