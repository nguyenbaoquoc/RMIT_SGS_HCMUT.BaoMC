# CarePass – Patient-Governed Holistic Medical Vault

[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak)

> Unlocking root-cause multidisciplinary healthcare through zero-knowledge correlation signals and session-bound cryptographic consent.

## Project Overview

1. **Vision & originality:**  
   CarePass resolves the conflict between patient privacy and holistic root-cause medicine. When conditions span specialties—such as depression triggering compulsive stress-eating, obesity, and secondary hypertension—complete secrecy blinds doctors to the root cause. CarePass surfaces **Zero-Knowledge Clinical Correlation Signals** across locked records so clinicians can request temporary, patient-approved holistic access without exposing sensitive histories to hospital servers.

2. **Trust constraint insight:**  
   Today, patients hide mental health or genetic records during general checkups because sharing data in traditional hospital portals permanently exposes plaintext to centralized databases, IT administrators, and potential breaches. This trust bottleneck forces doctors to treat isolated symptoms rather than root causes.

3. **Value & impact:**  
   Patients confidently grant temporary cross-specialty access so doctors can diagnose interconnected root causes (e.g., linking depression to metabolic hypertension) while keeping unrelated records (e.g., HIV/Genetics) sealed. Meanwhile, clinics eliminate data-breach liability since their databases store only ciphertext.

4. **Why TideCloak matters:**  
   Standard RBAC only hides data in the UI while database admins still hold master keys to read plaintext. TideCloak eliminates the master key via **Ineffable Cryptography** and **Emergent Authority**. Each specialty is encrypted under a distinct policy tag (`doEncrypt`/`doDecrypt`). When a patient approves a holistic diagnostic request, TideCloak executes **Proxy Re-Encryption (PRE)** directly to the clinician’s ephemeral browser session key (`#SWE-DOC-8842`). Even while the doctor reads psychiatric and cardiac records, a rogue root admin dumping the database gets zero plaintext.

5. **Prototype demonstration:**  
   Our prototype demonstrates: (1) A Zero-Knowledge Correlation Alert linking a patient’s obesity/hypertension to a locked Psychiatry record; (2) Dr. Alice requesting and receiving temporary holistic decryption to treat the root cause while Genetics/HIV stays locked; (3) A root database admin attempting privilege escalation and receiving only ciphertext; and (4) Instant cryptographic revocation post-consultation.

---

## Demo Video
🎥 Watch the 2-minute demonstration video located directly in the root of this repository: **[`demo.mp4`](./demo.mp4)**

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

Open `http://localhost:3000` in your browser to interact with the **CarePass Sovereign Cockpit**.
