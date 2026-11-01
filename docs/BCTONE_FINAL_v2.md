# BCTOne — Dokumen Final v2 (PRD · Arsitektur · Backlog MVP)

- **Tanggal:** 1 Nov 2026
- **Status:** FINAL DISKUSI, menunggu persetujuan owner. Belum ada kode dan belum ada push. Scaffold repo dimulai setelah owner menyetujui dokumen ini.
- **Disusun oleh:** Leader (Hermes) bersama Business Analyst (BA), Odoo Functional/Solution Architect (SA), dan Product Owner (PO).
- **Riwayat:** `HASIL_DISKUSI_SUPERAPP_SAAS_v0.md` (putaran 1) → `HASIL_DISKUSI_SUPERAPP_SAAS_v1.md` (putaran 2–7, keputusan K-01..K-29).
- **Tanda:** **[A]** asumsi yang perlu diverifikasi · **[S]** keyakinan sedang (cek konsultan).

---

## 0. Keputusan owner yang mengikat (ringkas)

| Area | Keputusan |
|---|---|
| Produk | **BCTOne**, SaaS ERP/POS multi-industri di atas Odoo 19 CE, untuk UMKM sampai Enterprise. **Logo: file dari owner** (`brand/bctone-logo-original.png`; turunan `bctone-logo-light.png` / `bctone-logo-dark.png`, latar transparan, warna "One" disesuaikan per tema) |
| Domain | `one.bimacreative.tech` dengan subdomain `app.`, `admin.`, `api.`, `<klien>.erp.`, `<klien>.`, `status.`, `docs.` |
| Repo | `github.com/bctech-adm/bima-superapps-platform` **PUBLIC**, tanpa secret dan tanpa data klien. Deploy config, prompt, dan fork Enterprise disimpan di repo private terpisah |
| Server | Satu server produksi (SRV-1) (4 vCPU / 16 GB / 200 GB). Kapasitas MVP ±20–40 tenant, lalu waitlist. Backup wajib off-site |
| Tenancy | 1 DB Odoo per tenant (client). Di dalamnya: PT (`res.company`) → brand → outlet |
| App | **Satu app Android BCTOne** di akun Play BCT, tanpa white-label. Peran dipilih saat login (pelanggan / staf) |
| Poin | Berlaku di **semua PT milik satu client**, tidak bisa lintas client. Jurnal antar-PT otomatis |
| AI | Consent wajib dipilih saat register. **Izinkan** → Claude via 9router. **Tidak izinkan** → Ollama 3B via 9router, dan jalur ini tidak pernah fallback ke Claude. Provisioning otonom dengan guardrail |
| Free | 1 user, 1 device, 300 trx/bln, omzet Rp25 jt/bln, grace 10%, AI 3 prompt/hari, dianggap berhenti setelah 60 hari tanpa login |
| Harga | UMKM Rp199 rb, Bisnis Rp999 rb, Enterprise mulai Rp5 jt + implementasi (semua +PPN). BCT PKP dan menerima PPh 23 |
| Bayar | Transfer + konfirmasi manual. Xendit/Midtrans menyusul |
| Retensi | 14 hari setelah suspend/berhenti, lalu dihapus permanen |
| Operasional | Owner sendiri (tim 1 orang). Admin memakai **BCT Admin** (Next.js, berbasis form, tanpa Keycloak) |
| Odoo Care | Belum ada klien. Opsi tetap on-prem vs migrasi ke SaaS disiapkan untuk klien Care berikutnya |

---

## 1. PRD ringkas (BA)

**Tujuan.** Client bisa mendaftar sendiri dan menjalankan usahanya dalam hitungan menit, dimulai dari paket Gratis lalu naik paket sesuai pertumbuhan usaha.

Target 90 hari setelah launch: 30–40 tenant, ≥10% di antaranya berbayar, tingkat sukses provisioning ≥95%.

| Persona | Kebutuhan |
|---|---|
| P1 Pemilik UMKM | Daftar cepat, mulai gratis, kasir langsung bisa dipakai |
| P2 Pemilik grup (multi-PT/brand) | Konsolidasi, poin lintas PT, faktur pajak |
| P3 Staf (kasir/manajer) | Login di app, pilih tenant/outlet, menu sesuai peran |
| P4 Pelanggan akhir | Scan brand, lihat katalog, kumpulkan dan tukar poin |
| P5 Owner BCT | Konfirmasi bayar, pajak, support, pantau kuota dan provisioning |

**Ruang lingkup MVP-1**

| IN | OUT (setelah launch) |
|---|---|
| Web `one.bimacreative.tech` (beranda, fitur, industri, harga, app, privasi AI, FAQ, legal) | Payment gateway |
| Wizard 6 langkah + kalkulator harga deterministik + consent AI | Self-serve Bisnis/Enterprise (MVP-1 lewat sales) |
| Auto-provision Free/UMKM untuk pack **F&B** dan **Retail** | Pack logistik/jasa, marketplace modul |
| Console client (paket, tagihan, bukti bayar, privasi, ekspor) | Domain sendiri self-service, iOS |
| BCT Admin | Editor paket/katalog di UI (MVP-1: seed lewat kode) |
| App BCTOne: mode pelanggan + staf | Pesan online/booking di app, kasir native offline |
| Kuota Free, retensi 14 hari, poin per tenant | Logo final |
| 1 template web profil, AI 3 prompt/hari | Migrasi klien Odoo Care |

### User stories (MoSCoW)

| ID | Pri | Story | Kriteria terima |
|---|---|---|---|
| US-01 | M | Daftar dengan WA + OTP | OTP 6 digit, berlaku 5 menit [A], maks 3 kali kirim ulang. Identitas yang sudah dipakai akun Free ditolak untuk Free baru |
| US-02 | M | Isi wizard dan langsung melihat harga | Harga dihitung rule engine, bukan LLM. Tampil DPP + PPN, diperbarui ≤1 detik. Kebutuhan di luar katalog → "Butuh Konsultan" |
| US-03 | M | Pilih consent AI secara tegas | Tidak ada pilihan default. Tombol Lanjut nonaktif sampai user memilih. Pilihan dicatat di log hash-chain |
| US-04 | M | Tenant otomatis siap | Manifest lolos validasi, DB dibuat dari template, smoke test lolos. Bila gagal: rollback + notifikasi. Bila server penuh: masuk waitlist |
| US-05 | M | Diberi tahu sebelum kena batas | Notifikasi WA + banner di 80%. Grace 10%. Setelah grace habis: dokumen baru diblokir, data tetap bisa dibaca/diekspor |
| US-06 | M | Upgrade dengan transfer manual | Invoice DPP + PPN terbit. Unggah bukti → aktivasi sementara 48 jam. Setelah admin konfirmasi → aktif + kuitansi |
| US-07 | M | Memotong PPh 23 | Bisa bayar total − PPh 23 + unggah bukti potong. Invoice dianggap lunas setelah bukti diverifikasi |
| US-08 | M | Owner mengonfirmasi bayar dan menerbitkan faktur | Bukti dicocokkan dengan mutasi rekening. Konfirmasi → payment + rekonsiliasi + resume. Faktur masuk antrean Coretax |
| US-09 | M | Ekspor data sebelum dihapus | H0: read-only + ekspor terbuka. Pengingat H+7 dan H+13. H+14: hapus + DEK dimusnahkan |
| US-10 | S | Pelanggan scan QR outlet atau kode brand | Tema dan katalog brand tampil. Pelanggan menjadi member setelah memberi consent per brand |
| US-11 | S | Staf login lalu memilih tenant | Daftar tenant muncul bila staf terdaftar di >1 client. Menu mengikuti role Odoo. Device staf dihitung ke kuota |
| US-12 | S | Poin berlaku di semua PT milik client | Poin dari PT-A bisa ditukar di PT-B. Jurnal antar-PT otomatis. Tenant lain tidak bisa memakai poin ini |
| US-13 | S | Ubah consent AI di Console › Privasi | Tercatat sebagai entri baru. Routing AI berubah mulai request berikutnya |
| US-14 | C | Ganti device di paket Free | Maks 1 kali per bulan. Device lama otomatis logout |
| US-15 | W | Pembayaran otomatis lewat gateway | Di luar MVP |

---

## 2. Aturan bisnis yang bisa dites (BA)

**Registrasi & provisioning**
- **BR-01** Satu akun Free per nomor WA, NIK, NPWP, dan device ID.
- **BR-02** Maks 20 pendaftaran per hari. Kapasitas server berupa parameter 20–40 tenant [A, ditetapkan setelah load test]. Bila penuh → waitlist. Kill switch tersedia di BCT Admin.
- **BR-03** Harga hanya dihitung dari tabel paket dan add-on. Output LLM tidak pernah mengubah harga.
- **BR-04** Manifest hanya berisi modul dari allow-list tier. Pajak dan COA selalu dari template. Kebutuhan di luar katalog tidak diprovision.

**Consent AI**
- **BR-05** Consent wajib dipilih eksplisit, tanpa nilai default.
- **BR-06** Izinkan → `cc/claude-*`, dengan nama/HP/NIK dimasking. Tidak izinkan → `ol/*` (Ollama 3B, 1 vCPU, 1 request). Uji wajib: key deny yang memanggil model selain `ol/*` harus ditolak.
- **BR-07** Log consent bersifat append-only dengan hash-chain, disimpan 5 tahun [A].

**Kuota Free**

| BR | Item | Batas | Hard stop |
|---|---|---|---|
| BR-08 | Transaksi/bln (bruto, retur tidak mengurangi hitungan) | 300 | 330 |
| BR-09 | Omzet/bln (POS + invoice posted − retur, tanpa pajak, tanpa hitung ganda) | Rp25.000.000 | Rp27.500.000 |
| BR-10 | User / device | 1 / 1 | Tanpa grace. Ganti device maks 1×/bln |
| BR-11 | Prompt AI | 3/hari, reset 00:00 WIB | Prompt ke-4 ditolak di ai-gateway |

- **BR-12** Notifikasi di 80%. Setelah hard stop: dokumen baru diblokir, sedangkan baca, ekspor, dan sinkron offline tetap berjalan. Bila batas terlewati 2 bulan berturut-turut: wajib upgrade dalam 14 hari, kalau tidak tenant menjadi read-only.
- **BR-13** Data periode bulan yang sudah lewat dikunci.
- **BR-14** Free tanpa login selama 60 hari = berhenti, dan mulai dihitung sebagai H0 retensi.

**Bayar & pajak**
- **BR-15** Berita transfer berisi nomor invoice, tanpa kode unik.
- **BR-16** PPN = 12% × DPP nilai lain (11/12) [S]. Contoh paket UMKM: Rp199.000 + PPN Rp21.890 = **Rp220.890**.
- **BR-17** PPh 23 = 2% × harga sebelum PPN. Contoh: potong Rp3.980 → transfer **Rp216.910** + bukti potong.
- **BR-18** Aktivasi sementara 48 jam setelah bukti diunggah. Bukti yang masih menunggu konfirmasi tidak boleh memicu suspend.
- **BR-19** Konfirmasi bayar maks 1×24 jam kerja, dicocokkan dengan mutasi rekening.
- **BR-20** Faktur dibuat saat bayar diterima dan diunggah ke Coretax paling lambat tanggal 15 bulan berikutnya. NPWP/NIK wajib untuk paket berbayar.
- **BR-21** Paket tahunan = 10× harga bulanan. Upgrade dihitung prorata, downgrade berlaku di siklus berikutnya. Posting invoice yang gagal tidak memajukan tanggal tagihan.

**Retensi** (linimasa final dari leader)
- **BR-22** Jatuh tempo J → peringatan J+3 → **suspend J+7 = H0** (read-only + ekspor) → pengingat H+7 dan H+13 → **H+14 hapus** DB, filestore, subdomain, dan log konten AI, lalu DEK tenant dimusnahkan.
- **BR-23** Yang tetap disimpan: kontrak, invoice, dan faktur BCT (10 tahun), log consent, dan log audit yang sudah dipseudonimkan.

**App & data**
- **BR-24** Satu app Android, peran dipilih saat login.
- **BR-25** Data pelanggan yang disimpan global hanya: hash nomor, nama tampilan, keanggotaan, dan consent per brand. Riwayat belanja dan poin tetap di DB tenant.
- **BR-26** Brand hanya melihat member miliknya sendiri. Pemasaran lintas brand ditolak tanpa consent pelanggan.
- **BR-27** Device staf dihitung ke kuota, device pelanggan tidak.
- **BR-28** BCT Admin tidak bisa melihat transaksi atau data pelanggan tenant kecuali lewat sesi dukungan yang diaudit.
- **BR-29** Poin berlaku di semua PT/brand dalam satu tenant dan tidak pernah lintas tenant.
- **BR-30** Kewajiban poin dicatat di PT penerbit. Penukaran di PT lain menghasilkan jurnal intercompany otomatis. Saldo antar-PT harus nol saat eliminasi konsolidasi.

---

## 3. Arsitektur deploy di server produksi SRV-1 (SA)

Sisa kapasitas sekarang: ±3,5 vCPU, ±9,8 GB RAM, **±68 GB disk** (paling sempit).

| Container (project `bctone`) | Fungsi | RAM | CPU | Disk |
|---|---|---|---|---|
| `bct-traefik` | Router subdomain BCTOne, hanya listen di `127.0.0.1:8080` | 0,1 GB | 0,25 | – |
| `bct-pg` + `bct-pgbouncer` | DB control plane `bct_cp`, DB tenant, template `bct_tpl_fnb/retail` | 2,5 GB | 1,0 | 15 GB |
| `bct-odoo-cp` | Odoo control plane (2 worker) | 0,6 GB | 0,5 | 1 GB |
| `bct-odoo-tenant` | Satu proses multi-DB untuk semua tenant (`dbfilter`, 4 worker, 1 cron) | 2,4 GB | 1,5 | 10 GB |
| `bct-api` | NestJS BFF | 0,35 GB | 0,5 | – |
| `bct-web` / `bct-admin` / `bct-sites` | Next.js | 0,75 GB | 0,75 | – |
| `bct-ai-gateway` / `bct-orchestrator` / `bct-redis` | Layanan pendukung | 0,45 GB | 0,6 | – |
| `bct-ollama` | Model 3B Q4, 1 request, prioritas CPU rendah | 2,2 GB | 1,0 | 3 GB |
| `bct-backup` | restic + wal-g | 0,15 GB | 0,25 | 8 GB |
| **Total** | | **±9,5 GB** (normal ±6 GB) | dibatasi cgroup | **±46 GB** |

**Routing.** Dua wildcard TLS dengan DNS-01: `*.one.bimacreative.tech` dan `*.erp.one.bimacreative.tech`.
- Jika sudah ada edge proxy di port 443 [A], edge tersebut cukup ditambah satu blok yang meneruskan dua wildcard ke Traefik BCTOne.
- `admin.` dilindungi IP allowlist + TOTP.
- `/web/database/*` dan `/json/2/*` diblokir dari publik.

**Isolasi.**
- Folder `/opt/bctone` dengan user Linux sendiri.
- Network `bct_internal` diset internal. Tidak memakai docker.sock dan tidak berbagi Postgres dengan staging.
- ai-gateway menjangkau 9router lewat URL yang sudah ada, tidak join ke network 9router.
- CrowdSec ditambah pembacaan log Traefik BCTOne.
- Staging diberi `mem_limit` [A].

**Backup off-site.**
1. wal-g harian + WAL, RPO ≤15 menit, disimpan 7 hari.
2. `pg_dump` + filestore per tenant dienkripsi dengan DEK tenant, lalu disimpan via restic (14 harian + 8 mingguan).
3. Uji restore 1 tenant per bulan.
4. Crypto-shred di H+14.

**Kapan harus scale-out.** Bila salah satu terjadi: RAM >80% selama 7 hari, load >3, p95 sync POS >1,5 detik, disk >80%, tenant aktif >35, atau ada tenant Bisnis dengan ≥10 outlet. Urutannya:
1. Pindahkan Ollama ke VPS lain.
2. Buka cluster tenant #2.
3. Pisahkan Postgres.

---

## 4. Model data cluster (SA)

```
Tenant (client)        = 1 DB Odoo  <slug>.erp.one.bimacreative.tech
 └─ PT (res.company)   1..n   (Free/UMKM: 1 PT · Bisnis: maks 3 · Enterprise: kontrak) [A]
     └─ Brand          1..n   (satu brand = satu PT)
         └─ Outlet     → pos.config + gudang
```

| Data | Lokasi | Isi |
|---|---|---|
| Identitas pelanggan global | Control plane `bct.customer.identity` | UUID, HMAC(nomor WA), nama tampilan. Nomor asli tidak disimpan |
| Keanggotaan | Control plane `bct.customer.membership` | Tenant, brand, `member_ref` **berbeda per tenant**, consent |
| Direktori staf | Control plane | Hash login → daftar tenant (untuk pemilih tenant di app) |
| Profil member, poin, riwayat | DB tenant | Client sebagai pengendali data (UU PDP) |
| Langganan, kuota, pemakaian | Control plane | Tanpa transaksi, tanpa data pelanggan |

**Perubahan dari platform sumber:** ledger poin dipindah dari Postgres BFF ke **DB tenant**. Dengan begitu tidak ada database bersama yang berisi member lintas client, dan menghapus tenant cukup dengan drop DB.

**Poin lintas PT (akuntansi):**
- **Saat poin diperoleh** (di PT penerbit): Dr Beban/Pengurang Pendapatan, Cr **Liabilitas Poin**.
- **Saat poin ditukar di PT lain**, akrual harian membuat dua jurnal:
  - di PT penerbit: Dr Liabilitas Poin, Cr **Utang Poin Antar-PT**;
  - di PT penebus: Dr **Piutang Kliring Antar-PT**, Cr Pembayaran POS "Poin".
- **Settlement bulanan** per pasangan PT. Paket Bisnis ke atas memakai persetujuan empat mata.
- Poin yang kedaluwarsa diakui sebagai pendapatan (PSAK 72) [A, konfirmasi ke akuntan].
- Polanya mengikuti addon loyalty-accounting + intercompany dari platform sumber.

---

## 5. Komponen (SA)

**Addon control plane:** `bct_core`, `bct_audit`, `bct_cp_tenant`, `bct_cp_subscription`, `bct_cp_payment_proof`, `bct_cp_usage`, `bct_cp_catalog`, `bct_cp_onboarding`, `bct_cp_admin_api`, `bct_cp_identity`, `bct_cp_coretax`, `bct_cp_retention`.
- Sumbernya `src:super_admin`, `src:tenant_infra`, `src:subscription` (dengan **perbaikan bug invoice dobel**), `src:hub_console`, `src:onboarding_journey`, `src:brd_analyzer`, `src:coretax_export`, ditambah addon baru.

**Addon tenant:** `bct_core`, `bct_audit`, `bct_tenant_agent`, `bct_setup_org` (**ditulis ulang**, hardcode 7 PT dibuang), `bct_role`, `bct_pii`, `bct_privacy`, `bct_l10n_id`, `bct_pos_bff`, `bct_pos_otp_gate`, `bct_loyalty_ledger`, `bct_loyalty_accounting`, `bct_intercompany`, `bct_online_order`, `bct_promo`, `bct_kds`, `bct_table_booking`, `bct_pack_fnb`, `bct_pack_retail`.
- Setelah MVP: `bct_data_ask`, `bct_account_reports`, `bct_mrp_ck`, `bct_kitting`, `bct_payment_gateway`.

**App & service:**

| Path | Teknologi | Sumber |
|---|---|---|
| `apps/marketing`, `apps/console`, `apps/admin` | Next.js | Baru |
| `apps/sites` | Next.js | Dari `superapp-web` |
| `apps/mobile` | Expo | Dari app superapp platform sumber. App per-brand klien **tidak** diimpor |
| `services/api` | NestJS | Dari api-gateway platform sumber |
| `services/orchestrator`, `services/ai-gateway` | Python | Dari odoo-platform |
| `packages/*` | `odoo-client`, `schemas`, `ui`, `i18n`, `config` | Baru |

---

## 6. Kontrak integrasi utama (SA)

| Dari → Ke | Endpoint | Auth / aturan |
|---|---|---|
| Admin → control plane | `POST /bct/admin/v1/login` {login, password, totp} | Rate limit 5 kali/15 menit. Next.js menerbitkan cookie 8 jam (pola `lg_staff`) |
| Admin → control plane | `/json/2/bct.tenant/bct_action`, `bct.payment.proof/bct_confirm`/`bct_reject`, `bct.contract/bct_change_plan`, `bct.quota.override/create` | Bot API key server-side. Identitas admin dikirim lewat context ber-HMAC. Idempoten |
| Tenant agent → control plane | `POST /bct/usage/v1/daily`, `GET /bct/usage/v1/limits` | HMAC (ts, nonce, sha256 body), toleransi ±300 detik. Idempoten per (tenant, tanggal, seq). Hanya lewat network internal |
| api → ai-gateway | `POST /v1/chat` | Service key. Cek consent (cache 60 detik), kuota Redis, masking PII |
| ai-gateway → 9router, jalur izinkan | `POST /v1/messages` (Anthropic) | Key `K_ALLOW`, model `cc/claude-*` |
| ai-gateway → 9router, jalur tolak | `POST /v1/chat/completions` | Key `K_DENY` dengan allowlist `ol/*` saja. **Tidak ada fallback ke Claude.** Timeout 15 detik → job async atau template |
| Control plane ↔ orchestrator | `POST /v1/jobs` dan `POST /bct/orchestrator/v1/events` | HMAC. `job_id` sebagai kunci idempoten |
| api → Odoo tenant | `/json/2/<model>/<method>` | Bot key per tenant + `X-Odoo-Database` |

**Alur provisioning:**
1. Buat DB dari template pack (`CREATE DATABASE … TEMPLATE`).
2. Isi PT, brand, outlet, dan owner lewat JSON-2.
3. Rotasi bot key.
4. Jalankan smoke test. Jika gagal, drop DB.

LLM hanya menulis manifest, dan manifest itu divalidasi oleh control plane. LLM tidak pernah memanggil orchestrator secara langsung.

**Prasyarat 9router:** provider Ollama (prefix `ol/`), allowlist model per key, dan timeout. Saat ini 9router belum punya model Ollama.

---

## 7. Impor ke repo PUBLIC (SA)

0. **Persiapan:** secret scanning + push protection, branch protection, gitleaks di CI. Buat repo private `bctone-deploy` dan `bctone-enterprise`.
1. **Prosedur untuk setiap langkah:**
   1. `git archive` hanya path yang ada di allowlist.
   2. Rename prefix menjadi `bct_` dan ganti author menjadi PT Bima Creative Tech.
   3. Bersihkan komentar yang merujuk klien/proyek sumber.
   4. Scan dengan denylist. Isinya: nama klien (daftar di `scripts/denylist.txt` repo private), kode PT, IP, `*.local`, trycloudflare, ID gist, nomor `62…`, NIK, email.
   5. Pastikan semua tes hijau, lalu squash PR.
2. **Urutan impor:**
   1. Kerangka repo + CI.
   2. `bct_core` / `bct_audit`.
   3. Addon control plane. **Owner perlu menyerahkan arsip allowlist dari VPS1 `~/odoo-platform`**, karena sumbernya tidak ada di laptop.
   4. Basis tenant.
   5. POS / loyalty / intercompany / online order / pack.
   6. `services/api`.
   7. `apps/mobile`.
   8. Next.js.
   9. orchestrator + ai-gateway (repo public hanya berisi placeholder prompt).
   10. `compose.example.yml` dengan domain `example.com`.

---

## 8. Web, layar, dan paket (PO)

### Sitemap `one.bimacreative.tech`

| Halaman | Pesan utama |
|---|---|
| `/` | "Satu sistem untuk usaha Anda, dari Gratis sampai Enterprise." CTA Daftar Gratis |
| `/fitur` | POS, stok, pembukuan + PPN, member & poin, web profil, laporan, Tanya AI |
| `/industri/fnb`, `/industri/retail` | Siap pakai dalam hitungan menit. Jasa dan logistik: "segera" + waitlist |
| `/harga` | Harga jelas (+PPN), ada kalkulator, faktur pajak resmi |
| `/app` | Satu app BCTOne: staf kelola toko, pelanggan kumpulkan poin |
| `/privasi-ai` | Anda yang memilih: Claude atau AI di server BCT |
| `/faq`, `/legal/*` | Batas Free, grace, retensi, ekspor, PPh 23 · S&K, Privasi v1.0, DPA |

### Layar MVP-1

| Permukaan | Layar |
|---|---|
| Console (`app.`) | Daftar + OTP · Wizard 6 langkah · Progres provisioning · Beranda (status, kuota, tautan ERP) · Paket & upgrade · Tagihan + bukti bayar + bukti potong PPh 23 · Data faktur · Pengguna & device · Privasi/consent · Ekspor · Bantuan |
| BCT Admin (`admin.`) | Login password + TOTP · Dashboard · Client · Tenant · Langganan · **Konfirmasi bayar** · Kuota + override · Log provisioning/retry · Waitlist & kill switch · Audit & akses dukungan |
| App: umum | Discovery URL · Login WA + OTP · Pilih peran → tenant/outlet · Hapus akun |
| App: pelanggan | Scan QR outlet / kode brand · Beranda brand · Kartu member QR · Poin & riwayat · Promo · Consent per brand |
| App: staf | Dashboard harian · Kasir (Odoo POS PWA di dalam app) [A] · Scan member untuk tambah/tukar poin · Stok rendah · Kuota & tagihan (khusus pemilik) |

### Paket final (+PPN; paket tahunan = 10 bulan)

| | Free | UMKM | Bisnis | Enterprise |
|---|---|---|---|---|
| Harga/bln | Rp0 | Rp199 rb | Rp999 rb | mulai Rp5 jt + implementasi Rp25–75 jt |
| User / device | 1 / 1 | 5 / 3 | 25 / 10 | kontrak |
| Outlet / PT | 1 / 1 | 2 / 1 | 10 / maks 3 | multi-entitas |
| Transaksi/bln | 300 | 5.000 | 50.000 | fair use |
| Omzet/bln | Rp25 jt | – | – | – |
| AI | 3/hari | 30/hari | 150/hari | kontrak |
| App BCTOne | Mode staf | + member & poin | + multi-brand, poin lintas PT | + kustom (fork) |
| Lainnya | Watermark, 200 SKU, tanpa ekspor laporan | Ekspor, 1 web template | API, domain sendiri | SLA, SSO |
| Jalur MVP-1 | Self-serve | Self-serve | Sales | Sales |

**Add-on:**

| Item | Harga |
|---|---|
| User | Rp35 rb |
| Device | Rp50 rb |
| Outlet | Rp99 rb |
| AI +50 prompt/hari | Rp99 rb |
| Web profil template | Rp99 rb |
| Domain sendiri | +Rp50 rb |
| Migrasi klien Care | Rp5–15 jt [A] |
| SSO (khusus Enterprise) | – |

Tidak ada APK white-label.

---

## 9. Backlog MVP-1 & sprint (PO)

| Epic | Isi utama | Hari |
|---|---|---|
| E0 Fondasi repo | Monorepo, impor allowlist, scan secret di CI, repo private | 4 |
| E1 Infra | Compose, wildcard TLS, DB template, Ollama 3B, backup off-site + uji restore, monitor + alert WA | 5 |
| E2 Control plane | Perbaikan bug invoice, `contract.line`, kuota, bukti bayar + PPh 23, PPN/Coretax, retensi + crypto-shred | 8 |
| E3 Orchestrator | Skema manifest, pack F&B/Retail, rollback, smoke test, circuit breaker, waitlist, 20 dry-run | 7 |
| E4 Tenant agent | Usage HMAC, penegakan kuota + grace, kunci device, read-only, deteksi 60 hari | 4 |
| E5 AI gateway | Routing consent dua jalur, masking, kuota 3/hari, log | 3 |
| E6 Console | Layar MVP-1 | 7 |
| E7 BCT Admin | Login + JSON-2, layar MVP-1 | 6 |
| E8 App BCTOne | Identitas global, mode pelanggan & staf, poin, Data Safety Play | 8 |
| E9 Web & bantuan | Sitemap, 1 template web profil, 10 artikel | 3 |
| E10 Legal & rilis | S&K/Privasi/DPA, cek PSE, PDKI "BCTOne", listing Play + closed testing | 4 |
| E11 QA & buffer | Isolasi tenant, E2E bayar → faktur, load 40 tenant | 6 |
| **Total** | | **65 hari kerja** |

| Sprint (2 minggu, ±9 hari efektif) | Hasil |
|---|---|
| S1 | E0 + E1: server, backup, CI aman |
| S2 | E2 + awal E3: langganan + bayar manual |
| S3 | E3 + E4: provisioning otomatis + kuota |
| S4 | E5 + E7: AI gateway + BCT Admin |
| S5 | E6 + E9: console + web publik (mode waitlist) |
| S6 | E8: app + mulai closed testing Play |
| S7 | E10 + E11 + beta tertutup 5–10 tenant → **siap publish (±14 minggu)** |
| S8 | Cadangan bila review Play atau PSE tertunda |

Catatan: akun Play pribadi/baru wajib menjalani closed testing 12 tester × 14 hari [A]. Karena itu closed testing paling lambat dimulai di awal S6.

---

## 10. Launch checklist & metrik 90 hari (PO)

**Semua harus ✔ sebelum publish:**
1. Repo public bersih (scan secret lolos, tanpa nama/data klien, branch protection aktif). Secret, prompt, dan deploy config ada di repo private.
2. S&K, Privasi v1.0, dan DPA tersedia. Consent tercatat di hash-chain. PSE sudah dicek/didaftarkan [A]. Merek BCTOne sudah diajukan ke PDKI.
3. Uji isolasi tenant lulus, termasuk dari app.
4. 20 dry-run provisioning dengan sukses ≥95%, rollback teruji.
5. Jalur Claude OK. Jalur deny OK dengan Ollama, atau memakai template + chat dimatikan.
6. E2E invoice + PPN → bukti → konfirmasi → aktif → kuitansi lulus, termasuk kasus PPh 23.
7. Backup off-site + uji restore, monitor + alert WA, job H+14 teruji pada tenant dummy.
8. OTP + rate limit, kill switch, waitlist di 40 tenant, batas 20 pendaftaran per hari.
9. App lolos review Play (Data Safety, hapus akun, privacy policy).
10. Runbook insiden, akun cadangan dengan role terbatas, digest harian ke WA owner, 10 artikel bantuan, WA Business.

| Metrik 90 hari | Target |
|---|---|
| Tenant terprovision | 30–40 |
| Aktivasi (≥1 transaksi dalam 7 hari) | ≥60% |
| Konversi Free → berbayar | ≥10% |
| Bisnis/Enterprise | ≥1 closing + 3 pipeline |
| MRR hari ke-90 | ≥Rp1,8 jt [A] |
| Member pelanggan di app | ≥500 |
| Sukses provisioning / uptime | ≥95% / ≥99,5% |
| Konfirmasi bayar ≤1×24 jam kerja | 100% |
| Kebocoran antar-tenant | 0 |
| Waktu support owner | ≤6 jam/minggu |
| CPU / RAM server (p95) | <70% / <80% |

---

## 11. Risiko utama

| Risiko | Mitigasi |
|---|---|
| Satu server: disk tinggal ±68 GB, berbagi dengan 9router/staging | Batas cgroup, waitlist, pemicu scale-out, backup off-site |
| Owner sendirian | Grace otomatis, runbook, akun cadangan, digest harian |
| Repo PUBLIC | Allowlist impor, denylist, gitleaks + push protection, repo private untuk bagian sensitif |
| Klaim "data tidak keluar negeri" di jalur deny | Hanya boleh ditulis bila DC Hostinger terbukti di Indonesia. Kalau belum, pakai teks netral |
| Ollama 3B lambat atau kurang akurat | Template deterministik untuk provisioning, job async, kuota |
| Kesalahan PPN/PPh 23 | Rumus dikunci di BR-16/17, dicek konsultan pajak |
| Penolakan oleh Play Store | Satu app (bukan template app), Data Safety, closed testing dimulai lebih awal |

---

## 12. Keputusan kecil yang masih terbuka (tidak menghalangi mulai kerja)

| # | Pertanyaan | Usulan default |
|---|---|---|
| 1 | Member & poin di paket Free? | **Tidak.** Dipakai sebagai pemicu upgrade ke UMKM |
| 2 | Default program poin | Rp10.000 = 1 poin, berlaku 12 bulan, bisa diubah client |
| 3 | QR pelanggan per outlet atau per brand? | Per outlet (sekaligus membawa info brand) |
| 4 | Aktivasi sementara 48 jam juga untuk perpanjangan tenant berbayar yang suspend? | Ya, maks 1× per periode |
| 5 | Kasir di app: Odoo POS PWA atau native offline? | PWA dulu. Native menambah ±8 hari |
| 6 | Penyedia OTP WA + plafon biaya bulanan | Owner tentukan. Mempengaruhi batas 20 pendaftaran/hari |
| 7 | Lokasi backup off-site | Object storage Indonesia (narasi UU PDP), atau B2/Wasabi (lebih murah) |
| 8 | Lisensi kode JS/TS di repo public | MIT untuk packages, addon Odoo LGPL-3. Alternatif BUSL bila ingin mencegah penyalinan komersial |
| 9 | Boleh satu brand dijalankan >1 PT? | Tidak (default) |

**Yang harus diverifikasi owner sebelum S1:**
- Isi disk 132 GB di server.
- Apakah sudah ada edge proxy di port 443.
- Lokasi datacenter Hostinger.
- Arsip `~/odoo-platform` dari VPS1.
