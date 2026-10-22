# CarePass – Patient-Governed Multi-Specialty Medical Vault

[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak)

> Unlocking root-cause multidisciplinary healthcare through patient-governed consent, scoped specialist delegation, and session-bound cryptographic authority.

## Project Overview

1. **Vision & originality:**  
   CarePass resolves the conflict between patient privacy and holistic root-cause healthcare. When conditions span specialties—such as depression triggering stress-eating, obesity, and secondary hypertension—complete secrecy blinds doctors to the root cause, yet one doctor cannot treat every specialty. CarePass enables **patient-governed multi-specialty care coordination**: primary monitoring doctors diagnose interconnected root causes across consented records and delegate **single-disease scoped access** to specialist doctors.

2. **Trust constraint insight:**  
   Today, patients hide mental health or genetic histories during checkups because traditional hospital portals permanently expose plaintext to centralized databases, IT administrators, and clinicians outside the relevant specialty. This trust bottleneck prevents root-cause medicine.

3. **Value & impact:**  
   Patients track their multi-doctor care pathway and treatment completion (`0%–100%`), approving monitoring requests via red-bell consent alerts while keeping unrelated records (e.g., HIV/Genetics) sealed. Meanwhile, hospitals eliminate data-breach liability since servers store only ciphertext.

4. **Why TideCloak matters:**  
   Standard RBAC only hides data in the UI while database admins still hold master keys to read plaintext. TideCloak eliminates the master key via **Ineffable Cryptography** and **Emergent Authority**. Each specialty record is encrypted under a distinct policy tag (`doEncrypt`/`doDecrypt`). Through **Session-Bound Proxy Re-Encryption (PRE)**, the primary monitoring doctor decrypts patient-approved multi-specialty records, referred specialists decrypt **only their single assigned specialty tag**, and hospital admins managing rosters get zero plaintext.

5. **Prototype demonstration:**  
   Across **20 patients (`BN-101`–`BN-120`) and 6 specialist doctors**, our prototype demonstrates: (1) Red-bell patient consent alerts unlocking root-cause correlations; (2) A visual **Multi-Doctor Care Pathway & Completion Diagram** where the monitoring doctor delegates single-disease access to a specialist; (3) Zero-privilege hospital admin roster management (100% ciphertext for diagnoses/medications); and (4) Instant cryptographic revocation.

---

## Demo Video
🎥 Watch the 2-minute demonstration video located directly in the root of this repository: **[`demo.mp4`](./demo.mp4)**

---

## Architecture & Key Features

| Portal View | Role & Cryptographic Scope (TideCloak PRE) | Key Capabilities in Prototype |
| :--- | :--- | :--- |
| **1. Patient Portal**<br>*(20 Patients: `BN-101` ➔ `BN-120`)* | **Cryptographic Data Owner** (`PATIENT_SWE`) | • View personal health profile, daily medications, and treatment timeline.<br>• View **Multi-Doctor Care Pathway & Completion Diagram (`0%–100%`)**.<br>• Approve/Reject doctor monitoring requests via **Red Bell Notification (`🔔`)** or revoke all sessions instantly. |
| **2. Doctor Portal**<br>*(6 Specialist Doctors: `DOC-01` ➔ `DOC-06`)* | **Primary Monitoring Doctor** *(Multi-tag access)*<br>& **Referred Specialist Doctor** *(Scoped 1-tag access)* | • Doctor-centric sidebar managing primary monitored patients and specialist referrals.<br>• **Primary Monitoring Doctor** views consented multi-specialty records and sends specialist treatment requests.<br>• **Specialist Doctor** can **only decrypt the 1 specific disease** matching their specialty to update treatment progress. |
| **3. Hospital Admin Portal**<br>*(System Administrator)* | **Zero-Privilege Operational Admin** (`0 Master Keys`) | • Manage hospital roster of 20 patients and 6 assigned doctors.<br>• **100% blocked from reading clinical diagnoses, medications, or treatment notes** (`AES-256-GCM Ciphertext` only). |

---

## Setup & Installation

```bash
# 1. Clone the public repository
git clone https://github.com/nguyenbaoquoc/RMIT_SGS_HCMUT.BaoMC.git
cd RMIT_SGS_HCMUT.BaoMC

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Open `http://localhost:3000` in your browser to interact with the **CarePass Multi-Specialty Hospital Portal**.
