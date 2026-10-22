import { RawMedicalRecord, CrossSpecialtyCorrelation } from './mockMedicalRecords';

export interface EncryptedDatabaseRow {
  id: string;
  tideTag: string;
  category: string;
  vietnameseCategory: string;
  title: string;
  sensitivity: RawMedicalRecord['sensitivity'];
  sensitivityLabel: string;
  facility: string;
  updatedAt: string;
  algorithm: 'AES-256-GCM + Tide-PRE-Threshold';
  ivHex: string;
  ciphertextHex: string;
  ciphertextBytes: Uint8Array;
  ivBytes: Uint8Array;
  policySignatureHash: string;
  correlationSignal?: CrossSpecialtyCorrelation;
}

export interface DecryptedRecordView {
  plaintextDiagnosis: string;
  vietnameseDiagnosis: string;
  medicationOrPlan: string;
  vietnamesePlan: string;
  metrics: RawMedicalRecord['metrics'];
  preReEncryptionProof: string;
  boundSessionKeyId: string;
  decryptedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'PATIENT_SWE' | 'CLINICIAN_SWE' | 'TIDE_MPC_FABRIC' | 'CLOUD_DB_ADMIN';
  eventType:
    | 'TAG_ENCRYPT'
    | 'POLICY_GRANT'
    | 'POLICY_REVOKE'
    | 'HOLISTIC_REQUEST'
    | 'PRE_DECRYPT_SUCCESS'
    | 'PRE_DECRYPT_DENIED'
    | 'ADMIN_BYPASS_BLOCKED';
  status: 'SUCCESS' | 'DENIED' | 'CRITICAL_BLOCK';
  tideTag?: string;
  message: string;
  txHash: string;
}

export interface AdminBreachSimulationResult {
  timestamp: string;
  sqlExecuted: string;
  localDbRoleAfterOverride: string;
  rbacBypassedLocally: boolean;
  tideFabricResponseCode: string;
  mpcNodesRejected: string;
  plaintextBytesExposed: number;
  rawDumpPreview: Array<{
    id: string;
    tideTag: string;
    extractedCiphertext: string;
    decryptAttemptStatus: string;
  }>;
}

const fabricTagKeys = new Map<string, CryptoKey>();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Short(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const hex = bytesToHex(new Uint8Array(hashBuffer));
  return `0x${hex.slice(0, 16)}`;
}

/**
 * TideCloak SDK Adapter Pattern: IAMService.doEncrypt()
 * Encrypts each medical record under a dedicated cryptographic policy tag using Web Crypto AES-256-GCM.
 */
export async function doEncryptRecordWithTideTag(
  record: RawMedicalRecord
): Promise<EncryptedDatabaseRow> {
  let key = fabricTagKeys.get(record.tideTag);
  if (!key) {
    key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // extractable = false (Ineffable Cryptography invariant)
      ['encrypt', 'decrypt']
    );
    fabricTagKeys.set(record.tideTag, key);
  }

  const ivBytes = window.crypto.getRandomValues(new Uint8Array(12));
  const payloadObject = {
    plaintextDiagnosis: record.plaintextDiagnosis,
    vietnameseDiagnosis: record.vietnameseDiagnosis,
    medicationOrPlan: record.medicationOrPlan,
    vietnamesePlan: record.vietnamesePlan,
    metrics: record.metrics,
  };
  const encodedPayload = new TextEncoder().encode(JSON.stringify(payloadObject));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encodedPayload
  );

  const ciphertextBytes = new Uint8Array(encryptedBuffer);
  const ciphertextHex = `0x${bytesToHex(ciphertextBytes)}`;
  const ivHex = `0x${bytesToHex(ivBytes)}`;
  const policySignatureHash = await sha256Short(
    `tide:ineffable:${record.tideTag}:${ivHex}`
  );

  return {
    id: record.id,
    tideTag: record.tideTag,
    category: record.category,
    vietnameseCategory: record.vietnameseCategory,
    title: record.title,
    sensitivity: record.sensitivity,
    sensitivityLabel: record.sensitivityLabel,
    facility: record.facility,
    updatedAt: record.updatedAt,
    algorithm: 'AES-256-GCM + Tide-PRE-Threshold',
    ivHex,
    ciphertextHex,
    ciphertextBytes,
    ivBytes,
    policySignatureHash,
    correlationSignal: record.correlationSignal,
  };
}

/**
 * TideCloak SDK Adapter Pattern: IAMService.doDecrypt()
 * Evaluates Patient Policy alignment across the Tide Cybersecurity Fabric (12 MPC nodes)
 * and performs Proxy Re-Encryption (PRE) bound strictly to the Clinician's Ephemeral Session Key.
 */
export async function doDecryptRecordWithTidePRE(
  row: EncryptedDatabaseRow,
  authorizedTagsForClinician: Set<string>,
  clinicianSessionKeyId: string
): Promise<DecryptedRecordView> {
  if (!authorizedTagsForClinician.has(row.tideTag)) {
    throw new Error(
      `TIDE_FABRIC_POLICY_DENIED: Quorum (9/12 ORK nodes) refused Proxy Re-Encryption for tag [${row.tideTag}]. Active session [${clinicianSessionKeyId}] has no valid Patient Policy signature.`
    );
  }

  const key = fabricTagKeys.get(row.tideTag);
  if (!key) {
    throw new Error(
      `TIDE_INEFFABLE_KEY_MISSING: Threshold shard unavailable for tag [${row.tideTag}].`
    );
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: row.ivBytes as BufferSource },
    key,
    row.ciphertextBytes as BufferSource
  );

  const decodedJson = new TextDecoder().decode(decryptedBuffer);
  const parsed = JSON.parse(decodedJson) as {
    plaintextDiagnosis: string;
    vietnameseDiagnosis: string;
    medicationOrPlan: string;
    vietnamesePlan: string;
    metrics: RawMedicalRecord['metrics'];
  };

  const preReEncryptionProof = await sha256Short(
    `PRE_OK:${row.tideTag}:${clinicianSessionKeyId}:${Date.now()}`
  );

  return {
    plaintextDiagnosis: parsed.plaintextDiagnosis,
    vietnameseDiagnosis: parsed.vietnameseDiagnosis,
    medicationOrPlan: parsed.medicationOrPlan,
    vietnamesePlan: parsed.vietnamesePlan,
    metrics: parsed.metrics,
    preReEncryptionProof,
    boundSessionKeyId: clinicianSessionKeyId,
    decryptedAt: new Date().toLocaleTimeString(),
  };
}

/**
 * Simulates a Rogue Cloud Database Administrator or Attacker escalating privileges in the DB
 * and attempting to decrypt records without the Patient's TideCloak Policy Quorum.
 */
export async function simulateRogueAdminPrivilegeEscalation(
  rows: EncryptedDatabaseRow[]
): Promise<AdminBreachSimulationResult> {
  const now = new Date().toLocaleTimeString();
  return {
    timestamp: now,
    sqlExecuted:
      "UPDATE hospital_iam_users SET role = 'SUPER_ADMIN', rbac_bypass = TRUE WHERE user = 'root@carepass-cloud'; SELECT * FROM medical_records;",
    localDbRoleAfterOverride: 'SUPER_ADMIN (Full Database Read/Write)',
    rbacBypassedLocally: true,
    tideFabricResponseCode: 'ERR_INEFFABLE_NO_MASTER_KEY (HTTP 403 Cryptographic Reject)',
    mpcNodesRejected: '12/12 Tide ORK Nodes Rejected Unsigned Session (#SWE-ROOT-UNBOUND)',
    plaintextBytesExposed: 0,
    rawDumpPreview: rows.map((r) => ({
      id: r.id,
      tideTag: r.tideTag,
      extractedCiphertext: `${r.ciphertextHex.slice(0, 44)}...`,
      decryptAttemptStatus: 'DENIED: Missing Patient Policy Signature & Session PRE Binding',
    })),
  };
}
