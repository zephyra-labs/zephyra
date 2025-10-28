# 🪽 Zephyra

[![License: Zephyra Labs](https://img.shields.io/badge/License-Zephyra_Labs-yellow.svg)](LICENSE)
![pnpm](https://img.shields.io/badge/Build-pnpm-blue)
![Hardhat](https://img.shields.io/badge/SmartContracts-Hardhat-orange)
![Foundry](https://img.shields.io/badge/Tests-Foundry-green)
![Nuxt](https://img.shields.io/badge/Frontend-Nuxt_4-00DC82)
![Firestore](https://img.shields.io/badge/Database-Firestore-FFCA28)

**Zephyra** is a blockchain-based trade infrastructure designed to support secure, transparent, and verifiable export–import operations.  
It integrates smart contracts, NFTs, and full-stack components to ensure authenticity, trust, and traceability across all trade participants.

---

## ✨ Key Features

- **Document Verification**  
  Verifies trade documents and anchors them on-chain for immutability.

- **NFT Identity Proof**  
  Each verified exporter/importer receives an NFT as digital identity proof.

- **Trade Contracts**  
  Enables verified parties to establish secure, on-chain trade contracts.

---

## 📂 Project Structure

```

zephyra/
├── contracts/     # Smart contracts (Solidity + Hardhat + Foundry)
├── backend/       # Express backend with Firestore
├── frontend/      # Nuxt 4 frontend application
├── scripts/       # Deployment scripts (TypeScript + tsx)
├── test/          # Unit & integration tests
└── ignition/      # Hardhat Ignition deployment modules

```

---

## ⚡ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/zephyra-labs/zephyra.git
cd zephyra
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Compile Smart Contracts

```bash
npx hardhat compile
```

### 4. Configure Environment Variables

Create `.env` files for both the **frontend** and **backend**.

**Frontend (`frontend/.env`):**

```bash
API_BASE=http://localhost:3000
```

**Backend (`backend/.env`):**

```bash
FIRESTORE_PROJECT_ID=your_project_id
FIRESTORE_PRIVATE_KEY=your_private_key
FIRESTORE_CLIENT_EMAIL=your_service_account_email
JWT_SECRET=your_backend_secret
```

---

## 🚀 Running the Project

### 1. Start Local Blockchain Node

```bash
npx hardhat node
```

### 2. Deploy Smart Contracts

```bash
npx tsx scripts/deploy.ts
```

### 3. Start the Backend (Express + Firestore)

```bash
cd backend
pnpm dev
```

### 4. Start the Frontend (Nuxt 4)

```bash
cd frontend
pnpm dev
```

---

## 🧠 Core Technologies

| Layer           | Stack                             |
| --------------- | --------------------------------- |
| Smart Contracts | Solidity, Hardhat, Foundry, Viem  |
| Backend         | Express.js, TypeScript, Firestore |
| Frontend        | Nuxt 4, Tailwind CSS              |
| Dev Tools       | pnpm, tsx, Hardhat Ignition       |

---

## 📌 Notes

* Zephyra currently runs **locally**, except for Firestore which requires internet access.
* The project is still in its **development phase** — contributions will open after the pilot release.

---

## 📜 License

**© 2025 Zephyra Labs**
All rights reserved.
Unauthorized use, modification, or redistribution of this software is strictly prohibited.