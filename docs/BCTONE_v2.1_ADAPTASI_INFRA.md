# BCTOne v2.1: penyesuaian ke platform `/opt/infra` yang sudah berjalan di SRV-1

- **Tanggal:** 1 Nov 2026
- **Status:** draft revisi, menunggu persetujuan owner.
- **Cakupan:** dokumen ini hanya berisi perubahan terhadap `BCTONE_FINAL_v2.md`. Bagian v2 yang tidak disebut di sini
  tetap berlaku (PRD, BR-01..BR-30, paket, model data cluster, consent AI).
- **Dasar:** pemeriksaan read-only server produksi SRV-1 tanggal 1 Nov 2026. Yang dibaca: `docker ps/stats`, `docker system df`,
  `df`, `free`, `odoo.conf`, `ADR 0002/0004/0009/0015/0017/0018`, README dan skema control-plane, daftar route Traefik.
  Belum ada yang diubah di server. Angka beban Odoo per tenant masih **[A]** sampai ada load test.

## 1. Fakta baru yang mengubah v2

| # | Fakta di SRV-1 | Dampak ke v2 |
|---|---|---|
| F1 | Sudah ada platform multi-client `/opt/infra` (ADR 0001–0018, proses Lead → GATE 1/2) | BCTOne **dibangun di atas platform ini**, bukan sebagai stack `bct-*` baru. Perubahan infra mengikuti proses ADR + GATE di `/opt/infra/CLAUDE.md` |
| F2 | Control-plane Next.js (`cp.bimacreative.tech`, repo private `control-plane`) sudah punya client, plan, subscription, invoice transfer manual + konfirmasi admin, domain, environment, job provisioning, audit, dan portal client | E2 dan E7 di v2 menjadi **pengembangan control-plane yang ada**. Modul Odoo `bct_cp_*` versi v2 tidak dibuat |
| F3 | Odoo 19 `odoo-pool-a`: multi-DB, `dbfilter ^…_(prod\|demo)$`, header `X-Sh-Odoo-Db`, `workers=3`, `mem_limit 2.5 GiB`. ADR 0004 menargetkan **3–5 tenant kecil** dan ±18 user konkuren | Tenant BCTOne = DB `<slug>_prod` di pool-a. **Kapasitas MVP turun** (lihat §3) |
| F4 | Jalur aksi root dari control-plane hanya lewat **spool job + dispatcher `infra-job`** (ADR 0009). Tidak ada Docker API/SSH/sudo dari aplikasi | Orchestrator BCTOne **tidak dibuat sebagai service terpisah**. Provisioning = tipe job baru di dispatcher (butuh ADR + plan) |
| F5 | Identitas: Keycloak (realm `platform`, Organization per tenant, klaim `tenant_id`, SSO Odoo `sh_auth_oidc`, ADR 0008/0017). User dibuat lewat job skrip, bukan lewat konsol Keycloak | Lihat keputusan **D-1** |
| F6 | TLS hanya HTTP-01 per hostname, tanpa wildcard, DNS Hostinger dikelola manual (ADR 0002). Record DNS wildcard `*.erp` sudah ada | Wildcard cert `*.one…` di v2 **dibatalkan**. Setiap host mendapat sertifikat sendiri secara otomatis lewat Traefik |
| F7 | Ollama sudah berjalan: `qwen2.5:3b`, `llama3.2:3b`, `nomic-embed-text`, `NUM_PARALLEL=1`, `cpus 1.5`, `mem_limit 4g`, di network `9router_default` | Jalur "Tidak izinkan" memakai Ollama ini. Container baru tidak perlu. Tinggal satu pekerjaan: daftarkan provider `ol/*` di 9router (sekarang `GET /v1/models` belum menampilkan `ol/*`) |
| F8 | RAM: 16 GB, ±7,4 GB terpakai, ±8,6 GB available. Jumlah `mem_limit` sudah **overcommit** (keputusan owner di ADR 0004). Disk: 46 GB bebas (77%). Image yang bisa dibuang 30 GB + build cache 7,5 GB | Anggaran ±9,5 GB di v2 **tidak muat**. BCTOne hanya menambah komponen ringan (§3). Disk perlu dibersihkan dulu (sudah tercatat sebagai keputusan K4 platform) |
| F9 | ADR 0018: siklus langganan implementation → warranty → active → past_due (grace 2 bulan) → suspended. Terminate dilakukan manual | Paket self-serve BCTOne (Free/UMKM) butuh **siklus kedua**: aktif → past_due J+3 → suspend J+7 → hapus H+14 (K-13). Butuh **ADR 0019** |
| F10 | ADR 0015: modul platform masuk `addons/platform` sebagai submodule repo `odoo-addons-athera`. `custom_ai.enabled=False` sampai ada ADR gateway AI | Addon tenant `bct_*` masuk sebagai kategori platform (submodule `bima-superapps-platform/odoo/addons`). ai-gateway BCTOne sekaligus menjadi "ADR gateway AI" yang ditunggu |

## 2. Keputusan yang perlu owner tetapkan

**D-1. Keycloak.** K-15 menyatakan owner kesulitan memakai Keycloak.

| Opsi | Isi | Dampak |
|---|---|---|
| **A (rekomendasi)** Keycloak tetap ada di belakang | Owner tidak pernah membuka konsol Keycloak. Semua kelola user/tenant/role lewat **form BCT Admin di control-plane**. Form memanggil job `kc-user`/`kc-org` yang sudah ada | Perubahan kecil. ADR 0008/0017 dan SSO Odoo tetap berlaku. Kebutuhan K-15 terpenuhi karena owner cukup memakai form Next.js |
| B Keycloak dicabut | Login control-plane dan Odoo diganti ke Odoo + TOTP (rancangan v2 §6) | Membatalkan ADR 0008/0017. Login semua tenant existing harus dimigrasi. Estimasi +10–15 hari dan berisiko pada tenant yang sudah live |

**D-2. Kapasitas MVP.** Pool-a sekarang memakai `workers=3` dan ditargetkan untuk 3–5 tenant kecil, padahal sudah ada tenant yang berjalan.
Rekomendasi:
- Tenant **Free** memakai mode ringan, tanpa cron berat, dengan limit 1 sesi.
- Batas awal **10–15 tenant BCTOne** [A], dengan waitlist otomatis.
- Pemicu pindah ke VPS-2 mengikuti ADR 0004 §6.
- Target 20–40 tenant di v2 baru realistis setelah pool BCTOne dedicated atau VPS-2 tersedia.

**D-3. Domain.** Cukup **satu kali** menambah record DNS wildcard `*.one.bimacreative.tech` di Hostinger, mengikuti pola `*.erp`. Setelah itu:

| Host | Fungsi |
|---|---|
| `one.bimacreative.tech` | Marketing |
| `cp.bimacreative.tech` | Console client + BCT Admin (sudah ada) |
| `<slug>.erp.bimacreative.tech` | Odoo tenant (pola yang sudah ada) |
| `<slug>.one.bimacreative.tech` | Web profil client |
| `api.one.bimacreative.tech` | BFF untuk app |

Subdomain `app.` dan `admin.` dari v2 **digabung ke `cp.`** supaya jumlah host dan sertifikat tidak bertambah.

## 3. Komponen BCTOne di SRV-1 (pengganti v2 §3)

| Komponen | Bentuk | RAM limit [A] | Catatan |
|---|---|---|---|
| Control-plane (ada) | Dikembangkan: wizard, kalkulator, kuota, PPN/PPh23, consent, BCT Admin | 0 tambahan | Repo `control-plane` |
| `odoo-pool-a` (ada) | DB tenant `<slug>_prod` + addon `bct_*` | 0 (naik nanti bila diperlukan, butuh persetujuan) | Template DB per pack F&B/Retail |
| Postgres (ada) | DB tenant | 0 | `max_connections` dan `CONNECTION LIMIT` per tenant dihitung di plan |
| Ollama (ada) | Jalur deny | 0 | Model 3B |
| 9router (ada) | Tambah provider `ol/*` + key allow/deny | 0 | Konfigurasi 9router |
| **Baru:** `bctone-web` | Next.js: marketing `one.` + engine web profil `<slug>.one.` | 256 MiB | Satu container untuk dua fungsi |
| **Baru:** `bctone-api` | NestJS BFF untuk app (identitas pelanggan, scan brand, poin) | 320 MiB | |
| **Baru:** `bctone-ai-gw` | Consent, kuota 3/hari, masking, routing ke 9router | 128 MiB | |
| **Total tambahan** | | **±704 MiB** | Masuk dalam overcommit terkendali ADR 0004. Butuh persetujuan owner di GATE 1 |

**Prasyarat sebelum menambah komponen:** bersihkan image dan build cache (±37 GB, keputusan K4 platform yang menunggu "freeze") supaya disk di bawah 70%.

## 4. Perubahan backlog (pengganti v2 §9)

| Epic | Perubahan | Hari |
|---|---|---|
| E0 Fondasi repo | Tetap. Repo `bima-superapps-platform` berisi `apps/*`, `services/*`, `odoo/addons/bct_*`. Perubahan control-plane dikerjakan di repo `control-plane` | 4 |
| E1 Infra | Menyusut: ADR 0019 (siklus self-serve) + plan BCTOne, DNS `*.one`, route Traefik per host, provider `ol/*` di 9router, bersih disk | 3 |
| E2 Billing | Menyusut: plan, subscription, invoice, dan konfirmasi manual sudah ada. Tambah kuota (`plan_quota`), PPN/PPh23, siklus H+14 | 5 |
| E3 Orchestrator | Menjadi tipe job baru di `infra-job`: `bctone_tenant_provision` (DB dari template + konfigurasi), `tenant_purge`. Lewat dispatcher dengan argumen tervalidasi | 6 |
| E4 Tenant agent | Tetap (addon `bct_tenant_agent` → endpoint usage control-plane) | 4 |
| E5 AI gateway | Tetap, ditambah 9router `ol/*` | 3 |
| E6 + E7 Console + BCT Admin | Menyusut: halaman client/subscription/invoice/users sudah ada. Tambah wizard + kalkulator, consent, kuota, waitlist, form user/role (D-1 A) | 8 |
| E8 App BCTOne | Tetap | 8 |
| E9 Web & bantuan | Tetap (`bctone-web`) | 3 |
| E10 Legal & rilis | Tetap | 4 |
| E11 QA & buffer | Tetap, ditambah regresi tenant existing di pool-a | 6 |
| **Total** | **65 → ±54 hari** [A] | |

Urutan sprint tetap 2-mingguan. **Siap publish ±12 minggu** dihitung dari GATE 1 plan BCTOne.

## 5. Langkah berikut setelah owner menyetujui v2.1

1. Tulis ADR 0019 + `docs/plans/bctone-phase-1.md` di `/opt/infra` (proses GATE 1). Isinya: kapasitas, DNS, job baru, siklus self-serve.
2. Owner menjawab D-1, D-2, D-3 dan menyetujui GATE 1.
3. Sprint S1: kerangka monorepo + CI di repo ini, bersih disk SRV-1, provider `ol/*` di 9router, DNS `*.one`.
