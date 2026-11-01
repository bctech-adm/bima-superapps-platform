# BCTOne — panduan kerja agent (Claude Code / Hermes)

Baca dulu `docs/BCTONE_FINAL_v2.md`, lalu `docs/BCTONE_v2.1_ADAPTASI_INFRA.md` (v2.1 menimpa v2 untuk infra, billing, orchestrator, domain). Dokumen itu sumber kebenaran: PRD, aturan bisnis BR-01..BR-30, arsitektur,
kontrak integrasi, dan backlog. Keputusan owner di §0 mengikat; jangan diperdebatkan ulang.

## Status
- Fase: **menunggu persetujuan v2 → Sprint S1 (E0 + E1)**. Belum ada kode produk.
- Bahasa kerja: Indonesia (dokumen, komentar, pesan commit boleh Inggris ringkas).

## Aturan keras repo (repo ini PUBLIC)
1. **Tidak boleh ada secret**: `.env`, API key, password, sertifikat, kunci SSH, token 9router. Pakai `*.example`
   dengan placeholder. Secret produksi, prompt sistem, dan config deploy ada di repo **private** terpisah
   (`bctone-deploy`), bukan di sini.
2. **Tidak boleh ada data/nama klien** atau proyek sumber, IP server, domain internal, nomor HP, NIK, email pribadi.
   Daftar kata terlarang lengkap disimpan di repo private (`scripts/denylist.txt`); CI di sini menjalankan gitleaks
   plus `scripts/denylist.example.txt` (pola generik).
3. **Impor kode dari repo sumber hanya lewat allowlist path** (`git archive <commit> <path>`), tanpa riwayat git.
   Lalu: rename prefix ke `bct_`, ganti author ke "PT Bima Creative Tech", bersihkan komentar yang merujuk klien,
   scan, tes hijau, PR squash. Addon yang meng-hardcode entitas klien **ditulis ulang**, bukan disalin.
4. Setiap PR wajib lulus job `secret-scan` (gitleaks) sebelum merge.

## Stack (target)
- Odoo 19 CE (1 DB per tenant) · addon `bct_*` di `odoo/addons/`
- Next.js: `apps/marketing`, `apps/console`, `apps/admin`, `apps/sites`
- Expo Android: `apps/mobile` (satu app BCTOne, peran saat login)
- NestJS: `services/api` · Python: `services/orchestrator`, `services/ai-gateway`
- Monorepo pnpm + Turborepo (JS) dan uv (Python)

## AI / LLM
- Gateway LLM: 9router (OpenAI- & Anthropic-compatible). URL dan key **tidak** ditulis di repo; baca dari env
  (`NINEROUTER_BASE_URL`, `NINEROUTER_KEY_ALLOW`, `NINEROUTER_KEY_DENY`).
- Jalur consent "Tidak izinkan" hanya boleh model `ol/*`, tidak pernah fallback ke model eksternal (BR-06).
- Harga selalu dihitung rule engine, tidak pernah oleh LLM (BR-03).

## Brand
- Logo: `brand/bctone-logo-light.png` (latar terang), `brand/bctone-logo-dark.png` (latar gelap),
  `brand/bctone-logo-original.png` (asli). Merah BCT: #E01B24 / #C41920 / #9B1018.
