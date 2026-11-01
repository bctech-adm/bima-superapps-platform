<p align="center"><img src="brand/bctone-logo-light.png" alt="BCTOne" height="120"></p>

# BCTOne

Satu sistem untuk usaha Anda, dari Gratis sampai Enterprise. SaaS ERP/POS multi-industri (retail, F&B, dan
lainnya) di atas Odoo 19 Community, dengan web profil, satu aplikasi Android, dan provisioning berbasis AI.

Produk PT Bima Creative Tech · https://bimacreative.tech

## Isi repo saat ini
| Path | Isi |
|---|---|
| `docs/BCTONE_FINAL_v2.md` | Dokumen final: PRD, aturan bisnis, arsitektur, kontrak integrasi, backlog MVP |
| `brand/` | Logo BCTOne (terang, gelap, asli) |
| `CLAUDE.md` | Panduan kerja agent dan aturan repo publik |

Kode produk belum ada; dimulai di Sprint S1 setelah dokumen final disetujui.

## Keamanan
Repo ini publik. Jangan commit secret, data klien, atau konfigurasi produksi. Setiap PR dipindai gitleaks.
Laporkan masalah keamanan ke tim BCT, bukan lewat issue publik.

## Struktur kode (Sprint S1)
| Path | Isi |
|---|---|
| `packages/rules` | Rule engine harga, PPN/PPh 23, prorata, kuota Free (`pnpm -r test`) |
| `docs/infra-proposals/` | Usulan ADR untuk repo infra (menunggu GATE 1) |

Prasyarat: Node 24 + `pnpm@12.16.1` (`npm i -g pnpm@12.16.1`), lalu `pnpm install && pnpm -r test`.
