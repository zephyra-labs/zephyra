# Trade-Chain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![pnpm](https://img.shields.io/badge/Build-pnpm-blue)
![Hardhat](https://img.shields.io/badge/SmartContracts-Hardhat-orange)
![Foundry](https://img.shields.io/badge/Tests-Foundry-green)
![Nuxt](https://img.shields.io/badge/Frontend-Nuxt_4-00DC82)
![Firestore](https://img.shields.io/badge/Database-Firestore-FFCA28)

**Trade-Chain** adalah platform berbasis blockchain untuk mendukung proses perdagangan ekspor-impor.  
Proyek ini memanfaatkan smart contract, NFT, dan integrasi backend–frontend untuk menciptakan alur perdagangan yang aman, transparan, dan terdokumentasi dengan baik.

---

## ✨ Fitur Utama
- **Verifikasi Dokumen**  
  Dokumen yang diverifikasi akan diikat ke blockchain untuk menjamin keaslian dan integritas.
- **Penerbitan NFT**  
  Setiap entitas (importir dan eksportir) akan memiliki NFT sebagai bukti verifikasi identitas/dokumen.
- **Kontrak Perdagangan**  
  Smart contract perdagangan hanya dapat dibuat apabila kedua pihak (importir dan eksportir) telah memiliki NFT verifikasi.

---

## 📂 Struktur Proyek
- `contracts/` → Smart contract Solidity (Hardhat, Foundry)  
- `backend/` → Backend service (Express + Firestore)  
- `frontend/` → Frontend aplikasi (Nuxt 4)  
- `scripts/` → Script deployment kontrak (TypeScript + tsx)  
- `test/` → Unit dan integration test  
- `ignition/` → Modul deployment dengan Hardhat Ignition  

---

## ⚡️ Setup & Instalasi

### 1. Clone Repo
```bash
git clone https://github.com/Ajax-Z01/trade-chain.git
cd trade-chain
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Konfigurasi Environment

Buat file `.env` untuk frontend dan backend.
Contoh konfigurasi frontend (`frontend/.env`):

```
API_BASE=http://localhost:3000
```

Contoh konfigurasi backend (`backend/.env`):

```
FIRESTORE_PROJECT_ID=...
FIRESTORE_PRIVATE_KEY=...
FIRESTORE_CLIENT_EMAIL=...
```

---

## 🚀 Menjalankan Proyek

1. **Start Local Blockchain Node**

   ```bash
   npx hardhat node
   ```

2. **Deploy Smart Contracts**

   ```bash
   npx tsx scripts/deployRegistry.ts
   npx tsx scripts/deployFactory.ts
   ```

3. **Start Backend (Express + Firestore)**

   ```bash
   cd backend
   pnpm dev
   ```

4. **Start Frontend (Nuxt 4)**

   ```bash
   cd frontend
   pnpm dev
   ```

---

## 🧪 Testing

Proyek ini menggunakan **Foundry**, **Hardhat**, dan **Viem**.
Contoh menjalankan test Hardhat:

```bash
npx hardhat test
```

Contoh menjalankan test Foundry:

```bash
forge test
```

---

## 📖 Teknologi Utama

* [Hardhat](https://hardhat.org/) – Ethereum development environment
* [Foundry](https://book.getfoundry.sh/) – Smart contract testing framework
* [Viem](https://viem.sh/) – TypeScript interface untuk Ethereum
* [Nuxt 4](https://nuxt.com/) – Frontend framework
* [Express](https://expressjs.com/) – Backend service
* [Firestore](https://firebase.google.com/docs/firestore) – Database

---

## 📌 Catatan

* Saat ini proyek berjalan sepenuhnya **lokal**, kecuali backend yang tetap membutuhkan koneksi ke **Firestore**.
* Kontribusi belum dibuka karena proyek masih dalam tahap awal pengembangan.

---

## 📜 Lisensi

MIT License © 2025 [Ajax-Z01](https://github.com/Ajax-Z01)