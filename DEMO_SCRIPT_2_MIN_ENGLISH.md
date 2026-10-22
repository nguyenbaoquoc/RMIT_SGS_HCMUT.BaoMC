# 🎬 2-MINUTE ENGLISH DEMO VIDEO SCRIPT – CAREPASS (TIDE × TIDECLOAK)

> **Live Demo URL:** `http://localhost:3000/`
> **Target Duration:** `2 minutes 00 seconds` (4 structured scenes with **Step-by-Step Screen Actions** + **English Voiceover Script**).

---

## ⏱️ PRE-RECORDING SETUP (5 SECONDS BEFORE RECORDING)
1. Open `http://localhost:3000/` in your browser.
2. Click the language toggle in the top-right corner so it displays **`🇬🇧 English`** (all names are automatically accent-free English: `Nguyen Van A`, `Dr. Alice Nguyen`, `Dr. Tran Minh`, etc.).
3. Select tab **`1. Patient Portal (BN-101)`** (`Nguyen Van A`, 34 yo, Male).
4. Ensure default state: the 1st record (`Cardiology & Hypertension`) is unlocked exclusively for `Dr. Alice Nguyen`, while the other 3 records are locked.

---

## 🟢 SCENE 1 (0:00 – 0:25): PATIENT PORTAL, 4-TIER CONDITION ALERTS & MULTI-DOCTOR CARE PATHWAY

### 🖱️ Screen Actions (Thao tác trên màn hình):
1. **(0:00 – 0:08)** Stay on **`1. Patient Portal (BN-101)`**. Hover over the **`🟠 Condition Alert: Severe`** badge on the top blue banner of `Nguyen Van A`, and briefly scroll/hover over the left sidebar (**`20 E2EE Patient Profiles`**) showing the 4 clinical alert levels (`🟢 Mild`, `🟡 Needs Attention`, `🟠 Severe`, `🔴 Critical`).
2. **(0:08 – 0:16)** Hover over the center diagram **`🗺️ Multi-Doctor Care Pathway & Completion Progress (Nguyen Van A)`**, pointing at **`Overall Care Completion: %`** and the 3 doctor stages.
3. **(0:16 – 0:25)** Point to the right panel **`Manage Record Access for Monitoring Doctor`**, highlighting **`👁️ Only Dr. Alice Nguyen can view`** on the 1st record and **`🔒 No doctor can view (Must request access)`** on the 3 locked records below.

### 🎙️ English Voiceover Script (Lời thoại Tiếng Anh):
> *"Hello Judges, welcome to **CarePass** — a Patient-Governed Multi-Specialty Electronic Health Record Vault secured by **TideCloak End-to-End Encryption**. In the Patient Portal for **Nguyen Van A (`BN-101`)**, CarePass displays real-time **4-tier Clinical Condition Alerts**—from Mild, Needs Attention, Severe, to Critical—alongside a **Multi-Doctor Care Pathway and Completion Progress diagram**. Most importantly, every medical record shows exactly which individual doctor has decryption rights. By default, only the Primary Monitoring Doctor, **Dr. Alice Nguyen**, can view the initial Cardiology record, while all other records and all other doctors remain strictly locked."*

---

## 🔵 SCENE 2 (0:25 – 0:55): PRIMARY MONITORING DOCTOR — MULTI-DISEASE VIEW & PER-DOCTOR ISOLATION

### 🖱️ Screen Actions (Thao tác trên màn hình):
1. **(0:25 – 0:32)** Click **`Switch to Dr. Alice Nguyen's View ➔`** at the bottom of the Patient Banner.
2. **(0:32 – 0:38)** On the Doctor Banner, click through the **`Condition Alert:`** buttons (`🟢 Mild` / `🟡 Needs Attention` / `🟠 Severe` / `🔴 Critical`) to show live clinical triage updates.
3. **(0:38 – 0:45)** Click the blue button **`📨 Request Patient to Unlock Related Records (For Dr. Alice Nguyen)`** at the bottom of the Doctor Banner.
4. **(0:45 – 0:55)** Click the flashing red button **`Switch to Patient to Approve Requests ➔`** (or click the red bell icon in the header) ➔ In the popup modal, point to **`Exclusively for: Dr. Alice Nguyen`** and click **`✅ Approve All`**.

### 🎙️ English Voiceover Script (Lời thoại Tiếng Anh):
> *"Switching to our Primary Monitoring Doctor, **Dr. Alice Nguyen**: she can update the patient's **Condition Alert level** in real time. Because she is the single Primary Monitoring Doctor overseeing holistic care, she is permitted to request access to multiple related conditions to diagnose the root cause. When the patient clicks **Approve** in the red-bell notification modal, TideCloak grants decryption keys **exclusively to Dr. Alice Nguyen**—every other doctor in the hospital remains completely blocked unless they submit their own request."*

---

## 🟣 SCENE 3 (0:55 – 1:30): SPECIALIST DOCTOR — MULTI-RECORD SPECIALTY SCOPE & CROSS-SPECIALTY BLOCKING

### 🖱️ Screen Actions (Thao tác trên màn hình):
1. **(0:55 – 1:03)** Click tab **`2. Doctor Portal`** ➔ In the left sidebar list of 6 doctors, click **`Dr. Tran Minh (Psychiatry & Sleep Medicine)`**.
2. **(1:03 – 1:10)** Point to the amber warning banner on the cards: **`🔐 This record is currently ONLY unlocked for [Dr. Alice Nguyen]. Dr. Tran Minh does NOT have access!`**, and scroll down to the last 2 records (`Orthopedics` and `Genetics`) showing **`🚫 OUTSIDE SPECIALTY (Psychiatry & Sleep Medicine)`**.
3. **(1:10 – 1:20)** Click **`📨 Request Unlock for All Specialty-Related Records (2 records — Psychiatry & Sleep Medicine)`** at the bottom of the Doctor Banner ➔ Click **`Open Patient Approval Modal ➔`** ➔ Click **`✅ Approve All`**.
4. **(1:20 – 1:30)** Switch back to **`2. Doctor Portal (Dr. Tran Minh)`** to show that **both Psychiatry-related records** (`Psychiatry eating disorder` AND `Stress-induced Obesity & Hypertension`) are now decrypted exclusively for `Dr. Tran Minh`, while the unrelated Orthopedics and Genetics records stay locked. Click **`+20% Progress`** or **`Complete 100%`** on the Care Pathway diagram.

### 🎙️ English Voiceover Script (Lời thoại Tiếng Anh):
> *"Here is our core cryptographic innovation—per-doctor and per-specialty access control. When we switch to **Dr. Tran Minh in Psychiatry and Sleep Medicine**, even though the patient already unlocked records for Dr. Alice Nguyen, Dr. Tran Minh still sees zero plaintext. As a Specialist Doctor, Dr. Tran Minh can request and view **multiple diseases as long as they are clinically related to Psychiatry**—here, both the **Night-Eating Depression** record and the **Stress-Related Obesity & Hypertension** record—while unrelated **Orthopedics** and **Genetics** records are strictly blocked outside his specialty. Once approved by the patient exclusively for Dr. Tran Minh, he decrypts both specialty-related records and updates treatment completion to 100%."*

---

## 🔴 SCENE 4 (1:30 – 2:00): TARGETED DOCTOR REVOCATION MODAL, ROOT ADMIN API BLOCK POPUP (HTTP 403) & BILINGUAL UI

### 🖱️ Screen Actions (Thao tác trên màn hình):
1. **(1:30 – 1:40)** Click tab **`1. Patient Portal (BN-101)`** ➔ Click **`🔥 Revoke Doctor Access (Select Doctor)`** at the bottom of the Patient Banner.
2. In the **`Specify Which Doctors Cannot View Records`** popup modal: click the red **`Revoke This Doctor`** button next to **`Dr. Tran Minh`** (or click **`🔥 Revoke ALL Doctors at Once`**) and close the modal.
3. **(1:40 – 1:53)** Click tab **`3. Hospital Admin`** ➔ Click the fixed red button **`⚡ Attempt Root Admin Decryption (BN-101)`**.
4. The security report modal **`🚨 TIDECLOAK FABRIC BLOCKED ROOT ADMIN DECRYPTION CALL`** pops up immediately: point to the dark console box showing the API call (`POST /api/v1/tidecloak/ork-quorum/admin-decrypt`), the **`HTTP 403 FORBIDDEN — ERR_INEFFABLE_NO_MASTER_KEY`** response from 12/12 MPC nodes, **`0 BYTES`** exposed, and the 4 blocked AES-256-GCM records, then click **`Got It (Close Security Report)`**.
5. **(1:53 – 2:00)** Click the **`🇬🇧 English` / `🇻🇳 Tiếng Việt`** toggle in the top-right corner to demonstrate seamless bilingual switching with 100% identical button layout.

### 🎙️ English Voiceover Script (Lời thoại Tiếng Anh):
> *"At any time, the patient remains in complete control: clicking **Revoke Doctor Access** opens a targeted revocation modal where the patient can **specify exactly which individual doctor is blocked from viewing their records**, or revoke all doctors at once. Finally, in the **Hospital Admin Portal**, when we click the red button to **Attempt Root Admin Decryption**, the system executes a live WebCrypto and TideCloak ORK API check, immediately popping up a security report: all 12 MPC nodes reject the unsigned admin session with **`HTTP 403 — No Master Key`**, proving that **zero bytes** of medical data or prescriptions are ever exposed. Thank you for watching CarePass!"*
