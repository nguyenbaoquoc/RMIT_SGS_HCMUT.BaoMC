import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  HeartPulse,
  Brain,
  Dna,
  Bone,
  User,
  CheckCircle2,
  XCircle,
  Flame,
  Globe,
  KeyRound,
  Stethoscope,
  BellRing,
  Pill,
  CalendarClock,
  Users,
  FileLock2,
  ArrowRight,
  Activity,
  PlusCircle,
  Sparkles,
  Cross,
  Send,
  Check,
  X,
  Search,
  Filter,
  GitBranch,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ALL_20_PATIENTS,
  HOSPITAL_DOCTORS,
  HospitalDoctor,
  PatientProfile,
  PatientTimelineStep,
  DoctorCareStage,
  toEnName,
} from './lib/hospitalPatientsData';
import {
  EncryptedDatabaseRow,
  DecryptedRecordView,
  AuditLogEntry,
  AdminBreachSimulationResult,
  doEncryptRecordWithTideTag,
  doDecryptRecordWithTidePRE,
  simulateRogueAdminPrivilegeEscalation,
  sha256Short,
} from './lib/tidecloakEngine';

type RolePortal = 'LOGIN' | 'PATIENT' | 'DOCTOR' | 'ADMIN';
type LangMode = 'vi' | 'en';
type ConditionAlertLevel = 'NHE' | 'CAN_CHU_Y' | 'NANG' | 'NGUY_CAP';

interface DoctorUnlockRequest {
  requestKey: string;
  patientId: string;
  doctorId: string;
  tideTag: string;
  categoryVi: string;
  categoryEn: string;
  doctorNameVi: string;
  doctorNameEn: string;
  reasonVi: string;
  reasonEn: string;
  requestedAt: string;
}

export default function App() {
  const [lang, setLang] = useState<LangMode>('vi');
  const [portal, setPortal] = useState<RolePortal>('PATIENT');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('BN-101');
  const [activeDoctorId, setActiveDoctorId] = useState<string>('DOC-01');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBellModal, setShowBellModal] = useState<boolean>(false);
  const [showRevokeModal, setShowRevokeModal] = useState<boolean>(false);

  // Per-patient set of doctors explicitly revoked/blocked from viewing records
  const [revokedDoctorsByPatient, setRevokedDoctorsByPatient] = useState<
    Record<string, Set<string>>
  >(() => ({}));

  // Per-patient 4-tier clinical condition alert level: Nhẹ | Cần chú ý | Nặng | Nguy cấp
  const [conditionAlertByPatient, setConditionAlertByPatient] = useState<
    Record<string, ConditionAlertLevel>
  >(() => {
    const map: Record<string, ConditionAlertLevel> = {};
    const cycle: ConditionAlertLevel[] = ['NANG', 'CAN_CHU_Y', 'NGUY_CAP', 'CAN_CHU_Y', 'NHE'];
    ALL_20_PATIENTS.forEach((p, idx) => {
      map[p.id] = cycle[idx % cycle.length];
    });
    return map;
  });

  const getAlertMeta = (level: ConditionAlertLevel) => {
    switch (level) {
      case 'NHE':
        return {
          level,
          labelVi: '🟢 Nhẹ',
          labelEn: '🟢 Mild',
          fullVi: 'Cảnh báo tình trạng: Nhẹ',
          fullEn: 'Condition Alert: Mild',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          bannerClass: 'bg-emerald-500 text-white border-emerald-200',
        };
      case 'CAN_CHU_Y':
        return {
          level,
          labelVi: '🟡 Cần chú ý',
          labelEn: '🟡 Needs Attention',
          fullVi: 'Cảnh báo tình trạng: Cần chú ý',
          fullEn: 'Condition Alert: Needs Attention',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          bannerClass: 'bg-amber-500 text-white border-amber-200',
        };
      case 'NANG':
        return {
          level,
          labelVi: '🟠 Nặng',
          labelEn: '🟠 Severe',
          fullVi: 'Cảnh báo tình trạng: Nặng',
          fullEn: 'Condition Alert: Severe',
          badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
          bannerClass: 'bg-orange-500 text-white border-orange-200',
        };
      case 'NGUY_CAP':
        return {
          level,
          labelVi: '🔴 Nguy cấp',
          labelEn: '🔴 Critical',
          fullVi: 'Cảnh báo tình trạng: Nguy cấp',
          fullEn: 'Condition Alert: Critical',
          badgeClass: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
          bannerClass: 'bg-red-600 text-white border-red-200 animate-pulse',
        };
    }
  };

  const getRowAlertLevel = (row: EncryptedDatabaseRow): ConditionAlertLevel => {
    if (row.tideTag.endsWith(':related')) return 'NANG';
    if (row.tideTag.endsWith(':primary')) return 'CAN_CHU_Y';
    if (row.tideTag.endsWith(':secondary')) return 'NHE';
    return 'NGUY_CAP';
  };

  // Bilingual helper getters (accent-free names & full English text when lang === 'en')
  const t = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const pName = (p: PatientProfile) => (lang === 'vi' ? p.name : p.nameEn);
  const pGender = (p: PatientProfile) => (lang === 'vi' ? p.genderVi : p.genderEn);
  const pDocName = (p: PatientProfile) =>
    lang === 'vi' ? p.primaryDoctorName : p.primaryDoctorNameEn;
  const pDocSpec = (p: PatientProfile) =>
    lang === 'vi' ? p.primarySpecialtyVi : p.primarySpecialtyEn;
  const pStatus = (p: PatientProfile) => (lang === 'vi' ? p.statusVi : p.statusEn);
  const pChain = (p: PatientProfile) =>
    lang === 'vi' ? p.rootCauseChainVi : p.rootCauseChainEn;
  const dName = (d: HospitalDoctor) => (lang === 'vi' ? d.name : d.nameEn);
  const dSpec = (d: HospitalDoctor) => (lang === 'vi' ? d.specialtyVi : d.specialtyEn);
  const rCat = (r: EncryptedDatabaseRow) =>
    lang === 'vi' ? r.vietnameseCategory : r.category;
  const rTitle = (r: EncryptedDatabaseRow) =>
    lang === 'vi' ? r.title : r.titleEn || r.title;
  const rFac = (r: EncryptedDatabaseRow) =>
    lang === 'vi' ? r.facility : r.facilityEn || r.facility;

  // Encrypted rows for the currently selected patient
  const [encryptedRows, setEncryptedRows] = useState<EncryptedDatabaseRow[]>([]);

  // Per-patient, per-doctor set of authorized tags:
  // - ONLY the Primary Monitoring Doctor (p.primaryDoctorId) starts with :primary and can view MULTIPLE records.
  // - Every Secondary Doctor (Bác sĩ phụ) starts with 0 records and can ONLY ever view/request 1 single specialty record!
  const [authorizedByPatientAndDoctor, setAuthorizedByPatientAndDoctor] = useState<
    Record<string, Record<string, Set<string>>>
  >(() => {
    const initial: Record<string, Record<string, Set<string>>> = {};
    for (const p of ALL_20_PATIENTS) {
      initial[p.id] = {};
      for (const d of HOSPITAL_DOCTORS) {
        if (d.id === p.primaryDoctorId) {
          initial[p.id][d.id] = new Set([`patient:${p.id.toLowerCase()}:primary`]);
        } else {
          initial[p.id][d.id] = new Set();
        }
      }
    }
    return initial;
  });

  // Per-patient 3-step Doctor Care Pathway & Completion %
  const [careStagesByPatient, setCareStagesByPatient] = useState<
    Record<string, DoctorCareStage[]>
  >(() => {
    const initial: Record<string, DoctorCareStage[]> = {};
    for (const p of ALL_20_PATIENTS) {
      initial[p.id] = p.careStages;
    }
    return initial;
  });

  // Per-patient pending unlock requests from doctors to patients (keyed by `${doctorId}__${tideTag}`)
  const [requestsByPatient, setRequestsByPatient] = useState<
    Record<string, Record<string, DoctorUnlockRequest>>
  >(() => ({}));
  const [requestSentBanner, setRequestSentBanner] = useState<string | null>(null);

  // Real-time Cross-Tab Synchronization (so Doctor Tab <-> Patient Tab sync instantly!)
  useEffect(() => {
    try {
      localStorage.setItem('carepass_requests_v2', JSON.stringify(requestsByPatient));
    } catch {
      // ignore
    }
  }, [requestsByPatient]);

  useEffect(() => {
    try {
      const serialized: Record<string, Record<string, string[]>> = {};
      Object.entries(authorizedByPatientAndDoctor).forEach(([pid, docMap]) => {
        serialized[pid] = {};
        Object.entries(docMap).forEach(([did, set]) => {
          serialized[pid][did] = Array.from(set);
        });
      });
      localStorage.setItem('carepass_authorized_v2', JSON.stringify(serialized));
    } catch {
      // ignore
    }
  }, [authorizedByPatientAndDoctor]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'carepass_requests_v2' && e.newValue) {
          setRequestsByPatient(JSON.parse(e.newValue));
        }
        if (e.key === 'carepass_authorized_v2' && e.newValue) {
          const parsed = JSON.parse(e.newValue) as Record<string, Record<string, string[]>>;
          const next: Record<string, Record<string, Set<string>>> = {};
          Object.entries(parsed).forEach(([pid, docMap]) => {
            next[pid] = {};
            Object.entries(docMap).forEach(([did, arr]) => {
              next[pid][did] = new Set(arr);
            });
          });
          setAuthorizedByPatientAndDoctor(next);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [decryptedViews, setDecryptedViews] = useState<Record<string, DecryptedRecordView>>({});
  const [clinicianErrors, setClinicianErrors] = useState<Record<string, string>>({});
  const [adminBreachReport, setAdminBreachReport] = useState<AdminBreachSimulationResult | null>(
    null
  );
  const [adminAttackCount, setAdminAttackCount] = useState<number>(0);
  const [showAdminAttackModal, setShowAdminAttackModal] = useState<boolean>(false);
  const [timelinesByPatient, setTimelinesByPatient] = useState<
    Record<string, PatientTimelineStep[]>
  >(() => {
    const map: Record<string, PatientTimelineStep[]> = {};
    for (const p of ALL_20_PATIENTS) {
      map[p.id] = p.timeline;
    }
    return map;
  });
  const [newDoctorNote, setNewDoctorNote] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const currentPatient: PatientProfile = useMemo(
    () => ALL_20_PATIENTS.find((p) => p.id === selectedPatientId) || ALL_20_PATIENTS[0],
    [selectedPatientId]
  );

  const activeDoctor = useMemo(
    () => HOSPITAL_DOCTORS.find((d) => d.id === activeDoctorId) || HOSPITAL_DOCTORS[0],
    [activeDoctorId]
  );

  const currentCareStages: DoctorCareStage[] = useMemo(
    () => careStagesByPatient[currentPatient.id] || currentPatient.careStages,
    [careStagesByPatient, currentPatient]
  );

  const overallCompletionPercent = useMemo(() => {
    if (!currentCareStages.length) return 0;
    const sum = currentCareStages.reduce((acc, st) => acc + st.completionPercent, 0);
    return Math.round(sum / currentCareStages.length);
  }, [currentCareStages]);

  const isPrimaryMonitoringDoctor = activeDoctor.id === currentPatient.primaryDoctorId;

  // Determine ALL record tags (1 or multiple diseases) that are related to a Secondary Specialist Doctor's specialty
  const getSpecialtyRelatedTagsForSecondaryDoctor = useCallback(
    (patient: PatientProfile, doc: HospitalDoctor, stages: DoctorCareStage[]): Set<string> => {
      const allowed = new Set<string>();
      const tagPrefix = `patient:${patient.id.toLowerCase()}`;

      // 1. Any stage explicitly assigned to this specialist doctor
      stages.forEach((st) => {
        if (st.doctorId === doc.id) {
          allowed.add(st.targetTideTag);
        }
      });

      // 2. Specialty keyword matching across all non-private records of the patient
      const specialtyKeywordsByDoc: Record<string, string[]> = {
        'DOC-01': ['tim', 'huyết áp', 'mạch', 'nhịp', 'lipid', 'mỡ máu', 'xơ vữa', 'cardio'],
        'DOC-02': ['tâm thần', 'giấc ngủ', 'trầm cảm', 'lo âu', 'stress', 'ăn đêm', 'mất ngủ', 'sertraline', 'psych'],
        'DOC-03': ['nội tiết', 'chuyển hóa', 'đái tháo đường', 'insulin', 'tuyến giáp', 'béo phì', 'bmi', 'tăng cân', 'mỡ máu', 'gout', 'acid uric'],
        'DOC-04': ['xương khớp', 'cột sống', 'đĩa đệm', 'khớp', 'gout', 'thoái hóa', 'thắt lưng', 'cổ vai', 'vật lý trị liệu', 'tăng 14kg', 'tăng cân'],
        'DOC-05': ['tiêu hóa', 'gan', 'mật', 'dạ dày', 'trào ngược', 'gerd', 'đại tràng', 'hang vị', 'loét', 'men gan', 'ăn đêm'],
        'DOC-06': ['hô hấp', 'phổi', 'hen', 'phế quản', 'thần kinh', 'đau đầu', 'chóng mặt', 'rễ thần kinh', 'ngưng thở', 'giấc ngủ'],
      };
      const keywords = specialtyKeywordsByDoc[doc.id] || [];

      patient.records.forEach((rec) => {
        if (rec.tideTag.endsWith(':private')) return;
        const haystack = `${rec.vietnameseCategory} ${rec.title} ${rec.vietnameseDiagnosis} ${rec.vietnamesePlan}`.toLowerCase();
        if (keywords.some((kw) => haystack.includes(kw))) {
          allowed.add(rec.tideTag);
        }
      });

      // 3. Ensure every specialist doctor has multiple (at least 2) clinically linked specialty records on the patient
      // so they can view all diseases related to their specialty (e.g., their direct specialty disease + its clinically linked cause/effect disease)
      if (allowed.has(`${tagPrefix}:related`) && allowed.size < 2) {
        allowed.add(`${tagPrefix}:primary`);
      } else if (allowed.has(`${tagPrefix}:secondary`) && allowed.size < 2) {
        allowed.add(`${tagPrefix}:related`);
      } else if (allowed.size === 0) {
        const docNum = parseInt(doc.id.replace(/\D/g, ''), 10) || 1;
        allowed.add(`${tagPrefix}:${docNum % 2 === 0 ? 'related' : 'secondary'}`);
        allowed.add(`${tagPrefix}:primary`);
      } else if (allowed.size === 1) {
        if (!allowed.has(`${tagPrefix}:related`)) {
          allowed.add(`${tagPrefix}:related`);
        } else {
          allowed.add(`${tagPrefix}:primary`);
        }
      }

      return allowed;
    },
    []
  );

  const allowedSpecialtyTagsForActiveSecondaryDoctor = useMemo(
    () =>
      getSpecialtyRelatedTagsForSecondaryDoctor(
        currentPatient,
        activeDoctor,
        currentCareStages
      ),
    [getSpecialtyRelatedTagsForSecondaryDoctor, currentPatient, activeDoctor, currentCareStages]
  );

  const revokedDoctorsForCurrentPatient = useMemo(
    () => revokedDoctorsByPatient[currentPatient.id] || new Set<string>(),
    [revokedDoctorsByPatient, currentPatient.id]
  );

  const isCurrentDoctorRevoked = useMemo(
    () => revokedDoctorsForCurrentPatient.has(activeDoctor.id),
    [revokedDoctorsForCurrentPatient, activeDoctor.id]
  );

  const currentPatientAlert = useMemo(
    () => conditionAlertByPatient[currentPatient.id] || 'CAN_CHU_Y',
    [conditionAlertByPatient, currentPatient.id]
  );

  // Strict per-doctor & per-role decryption scope:
  // - Primary Monitoring Doctor: can view multiple records unlocked specifically for them.
  // - Secondary Specialist Doctor: can view MULTIPLE records as long as those records are related to their specialty AND unlocked specifically for that doctor!
  const effectiveDoctorTags = useMemo(() => {
    if (revokedDoctorsForCurrentPatient.has(activeDoctor.id)) {
      return new Set<string>();
    }
    const grantedToThisDoctor =
      authorizedByPatientAndDoctor[currentPatient.id]?.[activeDoctor.id] || new Set<string>();

    if (isPrimaryMonitoringDoctor) {
      return grantedToThisDoctor;
    }

    // Secondary specialist doctor: can view all granted records that relate to their specialty!
    const filtered = new Set<string>();
    grantedToThisDoctor.forEach((tag) => {
      if (allowedSpecialtyTagsForActiveSecondaryDoctor.has(tag)) {
        filtered.add(tag);
      }
    });
    return filtered;
  }, [
    revokedDoctorsForCurrentPatient,
    activeDoctor.id,
    authorizedByPatientAndDoctor,
    currentPatient.id,
    isPrimaryMonitoringDoctor,
    allowedSpecialtyTagsForActiveSecondaryDoctor,
  ]);

  // Primary Monitoring Doctor's unlocked tags (for Patient Portal toggle view)
  const authorizedTags = useMemo(
    () =>
      authorizedByPatientAndDoctor[currentPatient.id]?.[currentPatient.primaryDoctorId] ||
      new Set<string>(),
    [authorizedByPatientAndDoctor, currentPatient.id, currentPatient.primaryDoctorId]
  );

  const pendingRequests = useMemo(
    () => requestsByPatient[currentPatient.id] || {},
    [requestsByPatient, currentPatient.id]
  );

  const filteredPatients = useMemo(() => {
    return ALL_20_PATIENTS.filter((p) => {
      const matchesDoc =
        selectedDoctorFilter === 'ALL' || p.primaryDoctorId === selectedDoctorFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesDoc;
      const matchesText =
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.primaryDoctorName.toLowerCase().includes(q) ||
        p.primaryDoctorNameEn.toLowerCase().includes(q) ||
        p.primarySpecialtyVi.toLowerCase().includes(q) ||
        p.primarySpecialtyEn.toLowerCase().includes(q) ||
        p.rootCauseChainVi.toLowerCase().includes(q) ||
        p.rootCauseChainEn.toLowerCase().includes(q);
      return matchesDoc && matchesText;
    });
  }, [selectedDoctorFilter, searchQuery]);

  const appendAuditLog = useCallback(
    async (
      actor: AuditLogEntry['actor'],
      eventType: AuditLogEntry['eventType'],
      status: AuditLogEntry['status'],
      message: string,
      tideTag?: string
    ) => {
      const txHash = await sha256Short(`${actor}:${eventType}:${message}:${Date.now()}`);
      const newEntry: AuditLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toLocaleTimeString(),
        actor,
        eventType,
        status,
        tideTag,
        message,
        txHash,
      };
      setAuditLogs((prev) => [newEntry, ...prev.slice(0, 12)]);
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    async function encryptCurrentPatientRecords() {
      const rows: EncryptedDatabaseRow[] = [];
      for (const rec of currentPatient.records) {
        const encryptedRow = await doEncryptRecordWithTideTag(rec);
        rows.push(encryptedRow);
      }
      if (!mounted) return;
      setEncryptedRows(rows);
      setClinicianErrors({});
      setRequestSentBanner(null);
    }
    encryptCurrentPatientRecords();
    return () => {
      mounted = false;
    };
  }, [currentPatient]);

  useEffect(() => {
    if (encryptedRows.length === 0) return;
    let mounted = true;

    async function syncClinicianDecryption() {
      const nextDecrypted: Record<string, DecryptedRecordView> = {};
      for (const row of encryptedRows) {
        if (effectiveDoctorTags.has(row.tideTag)) {
          try {
            const view = await doDecryptRecordWithTidePRE(
              row,
              effectiveDoctorTags,
              activeDoctor.sweKey
            );
            nextDecrypted[row.tideTag] = view;
          } catch {
            // Locked
          }
        }
      }
      if (mounted) {
        setDecryptedViews(nextDecrypted);
      }
    }
    syncClinicianDecryption();
    return () => {
      mounted = false;
    };
  }, [effectiveDoctorTags, encryptedRows, activeDoctor.sweKey]);

  const handleDoctorSendUnlockRequest = async (row: EncryptedDatabaseRow) => {
    // Enforce rule: Secondary Specialist Doctor can request ANY record (1 or multiple) related to their specialty,
    // but CANNOT request records unrelated to their specialty!
    if (
      !isPrimaryMonitoringDoctor &&
      !allowedSpecialtyTagsForActiveSecondaryDoctor.has(row.tideTag)
    ) {
      setClinicianErrors((prev) => ({
        ...prev,
        [row.tideTag]: t(
          `NGOÀI CHUYÊN KHOA: ${activeDoctor.name} (${activeDoctor.specialtyVi}) chỉ được yêu cầu xem các bệnh liên quan đến chuyên khoa của mình, không được yêu cầu [${row.vietnameseCategory}]!`,
          `OUTSIDE SPECIALTY SCOPE: ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) can only request records related to their specialty, NOT [${row.category}]!`
        ),
      }));
      return;
    }

    const reqKey = `${activeDoctor.id}__${row.tideTag}`;
    const reasonVi = isPrimaryMonitoringDoctor
      ? `BS theo dõi chính ${activeDoctor.name} (${activeDoctor.specialtyVi}) yêu cầu BN ${currentPatient.name} mở khóa [${row.vietnameseCategory}] (Chỉ cấp quyền cho riêng ${activeDoctor.name}).`
      : `BS chuyên khoa ${activeDoctor.name} (${activeDoctor.specialtyVi}) yêu cầu BN ${currentPatient.name} mở khóa bệnh liên quan đến chuyên khoa [${row.vietnameseCategory}] (Chỉ cấp quyền cho riêng ${activeDoctor.name}).`;
    const reasonEn = isPrimaryMonitoringDoctor
      ? `Primary monitoring doctor ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) requests ${currentPatient.nameEn} to unlock [${row.category}] (Granted exclusively to ${activeDoctor.nameEn}).`
      : `Specialist doctor ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) requests ${currentPatient.nameEn} to unlock specialty-related record [${row.category}] (Granted exclusively to ${activeDoctor.nameEn}).`;

    setRequestsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: {
        ...(prev[currentPatient.id] || {}),
        [reqKey]: {
          requestKey: reqKey,
          patientId: currentPatient.id,
          doctorId: activeDoctor.id,
          tideTag: row.tideTag,
          categoryVi: row.vietnameseCategory,
          categoryEn: row.category,
          doctorNameVi: activeDoctor.name,
          doctorNameEn: activeDoctor.nameEn,
          reasonVi,
          reasonEn,
          requestedAt: new Date().toLocaleTimeString(),
        },
      },
    }));

    setRequestSentBanner(
      lang === 'vi'
        ? `✅ Đã gửi chuông đỏ yêu cầu mở khóa [${row.vietnameseCategory}] cho riêng ${activeDoctor.name} tới BN ${currentPatient.name}!`
        : `✅ Sent red bell unlock request for [${row.category}] exclusively for ${activeDoctor.nameEn} to ${currentPatient.nameEn}!`
    );

    await appendAuditLog(
      'CLINICIAN_SWE',
      'HOLISTIC_REQUEST',
      'SUCCESS',
      lang === 'vi'
        ? `${activeDoctor.name} gửi yêu cầu xem riêng [${row.vietnameseCategory}] tới BN ${currentPatient.name}.`
        : `${activeDoctor.nameEn} sent an exclusive access request for [${row.category}] to ${currentPatient.nameEn}.`,
      row.tideTag
    );
  };

  const handleDoctorRequestAllRelated = async () => {
    const sourceRows = encryptedRows.length > 0 ? encryptedRows : currentPatient.records;
    const currentReqs = { ...(requestsByPatient[currentPatient.id] || {}) };
    const doctorCurrentSet =
      authorizedByPatientAndDoctor[currentPatient.id]?.[activeDoctor.id] || new Set<string>();

    // CASE 1: Secondary Specialist Doctor -> Can request ALL diseases (1 or multiple) related to their specialty!
    if (!isPrimaryMonitoringDoctor) {
      const targetRows = sourceRows.filter((r) =>
        allowedSpecialtyTagsForActiveSecondaryDoctor.has(r.tideTag)
      );
      if (targetRows.length === 0) return;

      let addedSpecCount = 0;
      for (const row of targetRows) {
        if (!doctorCurrentSet.has(row.tideTag)) {
          const reqKey = `${activeDoctor.id}__${row.tideTag}`;
          currentReqs[reqKey] = {
            requestKey: reqKey,
            patientId: currentPatient.id,
            doctorId: activeDoctor.id,
            tideTag: row.tideTag,
            categoryVi: row.vietnameseCategory,
            categoryEn: row.category,
            doctorNameVi: activeDoctor.name,
            doctorNameEn: activeDoctor.nameEn,
            reasonVi: `BS chuyên khoa ${activeDoctor.name} (${activeDoctor.specialtyVi}) yêu cầu mở khóa bệnh liên quan đến chuyên khoa [${row.vietnameseCategory}] (Chỉ riêng ${activeDoctor.name} được xem).`,
            reasonEn: `Specialist doctor ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) requests access to specialty-related record [${row.category}] (Exclusively for ${activeDoctor.nameEn}).`,
            requestedAt: new Date().toLocaleTimeString(),
          };
          addedSpecCount++;
        }
      }

      // If all specialty-related records were already unlocked for this specialist doctor, reset and re-request them cleanly for demo
      if (addedSpecCount === 0) {
        setAuthorizedByPatientAndDoctor((prev) => ({
          ...prev,
          [currentPatient.id]: {
            ...(prev[currentPatient.id] || {}),
            [activeDoctor.id]: new Set(),
          },
        }));
        for (const row of targetRows) {
          const reqKey = `${activeDoctor.id}__${row.tideTag}`;
          currentReqs[reqKey] = {
            requestKey: reqKey,
            patientId: currentPatient.id,
            doctorId: activeDoctor.id,
            tideTag: row.tideTag,
            categoryVi: row.vietnameseCategory,
            categoryEn: row.category,
            doctorNameVi: activeDoctor.name,
            doctorNameEn: activeDoctor.nameEn,
            reasonVi: `BS chuyên khoa ${activeDoctor.name} (${activeDoctor.specialtyVi}) yêu cầu mở khóa bệnh liên quan đến chuyên khoa [${row.vietnameseCategory}] (Chỉ riêng ${activeDoctor.name} được xem).`,
            reasonEn: `Specialist doctor ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) requests access to specialty-related record [${row.category}] (Exclusively for ${activeDoctor.nameEn}).`,
            requestedAt: new Date().toLocaleTimeString(),
          };
        }
      }

      setRequestsByPatient((prev) => ({
        ...prev,
        [currentPatient.id]: currentReqs,
      }));

      setRequestSentBanner(
        lang === 'vi'
          ? `✅ Bác sĩ chuyên khoa ${activeDoctor.name} đã gửi yêu cầu mở khóa ${targetRows.length} bệnh liên quan đến [${activeDoctor.specialtyVi}] tới BN ${currentPatient.name} (Chỉ mở riêng cho ${activeDoctor.name})!`
          : `✅ Specialist ${activeDoctor.nameEn} sent unlock requests for ${targetRows.length} records related to [${activeDoctor.specialtyEn}] to ${currentPatient.nameEn} (Exclusively for ${activeDoctor.nameEn})!`
      );
      return;
    }

    // CASE 2: Primary Monitoring Doctor (Bác sĩ theo dõi chính) -> Allowed to request multiple related records!
    let addedCount = 0;
    for (const row of sourceRows) {
      if (!doctorCurrentSet.has(row.tideTag) && !row.tideTag.endsWith(':private')) {
        const reqKey = `${activeDoctor.id}__${row.tideTag}`;
        currentReqs[reqKey] = {
          requestKey: reqKey,
          patientId: currentPatient.id,
          doctorId: activeDoctor.id,
          tideTag: row.tideTag,
          categoryVi: row.vietnameseCategory,
          categoryEn: row.category,
          doctorNameVi: activeDoctor.name,
          doctorNameEn: activeDoctor.nameEn,
          reasonVi: `BS theo dõi chính ${activeDoctor.name} (${activeDoctor.specialtyVi}) yêu cầu mở khóa hồ sơ [${row.vietnameseCategory}] để điều trị tận gốc (Chỉ riêng ${activeDoctor.name} được xem).`,
          reasonEn: `Primary monitoring doctor ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) requested access to [${row.category}] for root-cause care (Exclusively for ${activeDoctor.nameEn}).`,
          requestedAt: new Date().toLocaleTimeString(),
        };
        addedCount++;
      }
    }

    if (addedCount === 0) {
      setAuthorizedByPatientAndDoctor((prev) => ({
        ...prev,
        [currentPatient.id]: {
          ...(prev[currentPatient.id] || {}),
          [activeDoctor.id]: new Set([`patient:${currentPatient.id.toLowerCase()}:primary`]),
        },
      }));

      for (const row of sourceRows) {
        if (!row.tideTag.endsWith(':primary') && !row.tideTag.endsWith(':private')) {
          const reqKey = `${activeDoctor.id}__${row.tideTag}`;
          currentReqs[reqKey] = {
            requestKey: reqKey,
            patientId: currentPatient.id,
            doctorId: activeDoctor.id,
            tideTag: row.tideTag,
            categoryVi: row.vietnameseCategory,
            categoryEn: row.category,
            doctorNameVi: activeDoctor.name,
            doctorNameEn: activeDoctor.nameEn,
            reasonVi: `BS theo dõi chính ${activeDoctor.name} (${activeDoctor.specialtyVi}) yêu cầu mở khóa lại hồ sơ [${row.vietnameseCategory}] (Chỉ riêng ${activeDoctor.name} được xem).`,
            reasonEn: `Primary monitoring doctor ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) requested access to [${row.category}] (Exclusively for ${activeDoctor.nameEn}).`,
            requestedAt: new Date().toLocaleTimeString(),
          };
          addedCount++;
        }
      }
    }

    setRequestsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: currentReqs,
    }));

    const totalReqs = Object.keys(currentReqs).length;
    setRequestSentBanner(
      lang === 'vi'
        ? `✅ Đã gửi thành công ${totalReqs} yêu cầu mở khóa bệnh liên quan (dành riêng cho ${activeDoctor.name}) tới BN ${currentPatient.name}!`
        : `✅ Sent ${totalReqs} related record unlock requests (exclusively for ${activeDoctor.nameEn}) to Patient ${currentPatient.nameEn}!`
    );

    await appendAuditLog(
      'CLINICIAN_SWE',
      'HOLISTIC_REQUEST',
      'SUCCESS',
      lang === 'vi'
        ? `${activeDoctor.name} gửi yêu cầu theo dõi các bệnh liên quan của BN ${currentPatient.name}.`
        : `${activeDoctor.nameEn} requested access to related conditions of ${currentPatient.nameEn}.`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  const handleReferToSpecialistDoctor = async (stage: DoctorCareStage) => {
    setCareStagesByPatient((prev) => {
      const stages = prev[currentPatient.id] || currentPatient.careStages;
      const updated = stages.map((st) =>
        st.targetTideTag === stage.targetTideTag
          ? {
              ...st,
              isReferred: true,
              completionPercent: Math.max(st.completionPercent, 45),
            }
          : st
      );
      return { ...prev, [currentPatient.id]: updated };
    });

    // Also create a pending unlock request specifically for that specialist doctor on their 1 specialty disease!
    const reqKey = `${stage.doctorId}__${stage.targetTideTag}`;
    setRequestsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: {
        ...(prev[currentPatient.id] || {}),
        [reqKey]: {
          requestKey: reqKey,
          patientId: currentPatient.id,
          doctorId: stage.doctorId,
          tideTag: stage.targetTideTag,
          categoryVi: stage.diseaseCategoryVi,
          categoryEn: stage.diseaseCategoryEn,
          doctorNameVi: stage.doctorName,
          doctorNameEn: stage.doctorNameEn,
          reasonVi: `BS phụ chuyên khoa ${stage.doctorName} (${stage.specialtyVi}) yêu cầu BN ${currentPatient.name} mở khóa duy nhất 1 bệnh chuyên ngành [${stage.diseaseCategoryVi}] (Chỉ riêng ${stage.doctorName} được xem).`,
          reasonEn: `Secondary specialist ${stage.doctorNameEn} (${stage.specialtyEn}) requests ${currentPatient.nameEn} to unlock ONLY their 1 specialty record [${stage.diseaseCategoryEn}] (Exclusively for ${stage.doctorNameEn}).`,
          requestedAt: new Date().toLocaleTimeString(),
        },
      },
    }));

    const newStep: PatientTimelineStep = {
      date: '22/10/2026',
      titleVi: `Gửi yêu cầu Chuyên khoa: ${stage.doctorName} (${stage.specialtyVi})`,
      titleEn: `Specialist Referral: ${stage.doctorNameEn} (${stage.specialtyEn})`,
      detailVi: `${currentPatient.primaryDoctorName} chuyển bệnh [${stage.diseaseCategoryVi}] cho ${stage.doctorName}. ${stage.doctorName} chỉ được yêu cầu & xem duy nhất 1 bệnh chuyên ngành này.`,
      detailEn: `${currentPatient.primaryDoctorNameEn} referred [${stage.diseaseCategoryEn}] to ${stage.doctorNameEn}. ${stage.doctorNameEn} can ONLY request & view this 1 specialty condition.`,
      doctorName: `${currentPatient.primaryDoctorName} ➔ ${stage.doctorName}`,
      doctorNameEn: `${currentPatient.primaryDoctorNameEn} ➔ ${stage.doctorNameEn}`,
    };
    setTimelinesByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: [newStep, ...(prev[currentPatient.id] || [])],
    }));

    await appendAuditLog(
      'CLINICIAN_SWE',
      'POLICY_GRANT',
      'SUCCESS',
      lang === 'vi'
        ? `${currentPatient.primaryDoctorName} gửi yêu cầu cho ${stage.doctorName} sửa bệnh [${stage.diseaseCategoryVi}] (Cần BN duyệt cho riêng ${stage.doctorName}).`
        : `${currentPatient.primaryDoctorNameEn} referred [${stage.diseaseCategoryEn}] to ${stage.doctorNameEn} (Requires patient approval for ${stage.doctorNameEn}).`,
      stage.targetTideTag
    );
  };

  const handleUpdateStageProgress = async (
    stage: DoctorCareStage,
    newPercent: number
  ) => {
    const clamped = Math.min(100, Math.max(0, newPercent));
    setCareStagesByPatient((prev) => {
      const stages = prev[currentPatient.id] || currentPatient.careStages;
      const updated = stages.map((st) =>
        st.stageOrder === stage.stageOrder
          ? { ...st, isReferred: true, completionPercent: clamped }
          : st
      );
      return { ...prev, [currentPatient.id]: updated };
    });

    if (clamped === 100) {
      const doneStep: PatientTimelineStep = {
        date: '22/10/2026',
        titleVi: `Hoàn tất điều trị chuyên khoa: ${stage.diseaseCategoryVi}`,
        titleEn: `Completed Specialty Care: ${stage.diseaseCategoryEn}`,
        detailVi: `${stage.doctorName} (${stage.specialtyVi}) đã hoàn thành 100% phác đồ điều trị cho [${stage.diseaseTitleVi}].`,
        detailEn: `${stage.doctorNameEn} (${stage.specialtyEn}) completed 100% of the treatment plan for [${stage.diseaseTitleEn}].`,
        doctorName: `${stage.doctorName} (${stage.specialtyVi})`,
        doctorNameEn: `${stage.doctorNameEn} (${stage.specialtyEn})`,
      };
      setTimelinesByPatient((prev) => ({
        ...prev,
        [currentPatient.id]: [doneStep, ...(prev[currentPatient.id] || [])],
      }));
    }

    await appendAuditLog(
      'CLINICIAN_SWE',
      'TAG_ENCRYPT',
      'SUCCESS',
      lang === 'vi'
        ? `${stage.doctorName} cập nhật tiến độ khám [${stage.diseaseCategoryVi}] lên ${clamped}%.`
        : `${stage.doctorNameEn} updated completion progress for [${stage.diseaseCategoryEn}] to ${clamped}%.`,
      stage.targetTideTag
    );
  };

  const handlePatientApproveRequest = async (reqKey: string) => {
    const reqObj = pendingRequests[reqKey];
    if (!reqObj) return;

    // Grant access EXCLUSIVELY to reqObj.doctorId (no other doctor gets access!)
    // Both Primary Doctors and Specialist Doctors can hold multiple approved tags that relate to their specialty!
    setAuthorizedByPatientAndDoctor((prev) => {
      const patientMap = { ...(prev[currentPatient.id] || {}) };
      const docSet = new Set(patientMap[reqObj.doctorId] || []);
      docSet.add(reqObj.tideTag);
      patientMap[reqObj.doctorId] = docSet;
      return {
        ...prev,
        [currentPatient.id]: patientMap,
      };
    });

    setRequestsByPatient((prev) => {
      const copyForPatient = { ...(prev[currentPatient.id] || {}) };
      delete copyForPatient[reqKey];
      if (Object.keys(copyForPatient).length === 0) {
        setShowBellModal(false);
        setRequestSentBanner(null);
      }
      return { ...prev, [currentPatient.id]: copyForPatient };
    });

    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_GRANT',
      'SUCCESS',
      lang === 'vi'
        ? `BN ${currentPatient.name} ĐỒNG Ý mở khóa [${reqObj.categoryVi}] CHỈ DÀNH RIÊNG cho ${reqObj.doctorNameVi} (Các bác sĩ khác vẫn bị khóa).`
        : `Patient ${currentPatient.nameEn} APPROVED [${reqObj.categoryEn}] EXCLUSIVELY for ${reqObj.doctorNameEn} (All other doctors remain locked).`,
      reqObj.tideTag
    );
  };

  const handlePatientApproveAllRequests = async () => {
    setAuthorizedByPatientAndDoctor((prev) => {
      const patientMap = { ...(prev[currentPatient.id] || {}) };
      Object.values(pendingRequests).forEach((req) => {
        const docSet = new Set(patientMap[req.doctorId] || []);
        docSet.add(req.tideTag);
        patientMap[req.doctorId] = docSet;
      });
      return {
        ...prev,
        [currentPatient.id]: patientMap,
      };
    });

    setRequestsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: {},
    }));
    setShowBellModal(false);
    setRequestSentBanner(null);

    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_GRANT',
      'SUCCESS',
      lang === 'vi'
        ? `BN ${currentPatient.name} ĐỒNG Ý các yêu cầu mở khóa theo đúng từng Bác sĩ đã gửi yêu cầu.`
        : `Patient ${currentPatient.nameEn} APPROVED pending requests exclusively for each requesting doctor.`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  const handlePatientRejectRequest = async (reqKey: string) => {
    const reqObj = pendingRequests[reqKey];
    setRequestsByPatient((prev) => {
      const copyForPatient = { ...(prev[currentPatient.id] || {}) };
      delete copyForPatient[reqKey];
      if (Object.keys(copyForPatient).length === 0) {
        setShowBellModal(false);
        setRequestSentBanner(null);
      }
      return { ...prev, [currentPatient.id]: copyForPatient };
    });

    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_REVOKE',
      'DENIED',
      lang === 'vi'
        ? `BN ${currentPatient.name} đã TỪ CHỐI yêu cầu xem [${reqObj?.categoryVi || reqKey}] của ${reqObj?.doctorNameVi || ''}.`
        : `Patient ${currentPatient.nameEn} REJECTED request for [${reqObj?.categoryEn || reqKey}] from ${reqObj?.doctorNameEn || ''}.`,
      reqObj?.tideTag
    );
  };

  const handleToggleTagAccess = async (row: EncryptedDatabaseRow) => {
    const tag = row.tideTag;
    const primaryDocId = currentPatient.primaryDoctorId;
    const isGranted = authorizedTags.has(tag);
    const nextSet = new Set(authorizedTags);

    if (isGranted) {
      nextSet.delete(tag);
      setAuthorizedByPatientAndDoctor((prev) => ({
        ...prev,
        [currentPatient.id]: {
          ...(prev[currentPatient.id] || {}),
          [primaryDocId]: nextSet,
        },
      }));
      await appendAuditLog(
        'PATIENT_SWE',
        'POLICY_REVOKE',
        'CRITICAL_BLOCK',
        lang === 'vi'
          ? `BN ${currentPatient.name} đã KHÓA quyền xem [${row.vietnameseCategory}] đối với BS theo dõi chính ${currentPatient.primaryDoctorName}.`
          : `Patient ${currentPatient.nameEn} LOCKED [${row.category}] access for primary doctor ${currentPatient.primaryDoctorNameEn}.`,
        tag
      );
    } else {
      nextSet.add(tag);
      setAuthorizedByPatientAndDoctor((prev) => ({
        ...prev,
        [currentPatient.id]: {
          ...(prev[currentPatient.id] || {}),
          [primaryDocId]: nextSet,
        },
      }));
      setRequestsByPatient((prev) => {
        const copyForPatient = { ...(prev[currentPatient.id] || {}) };
        delete copyForPatient[`${primaryDocId}__${tag}`];
        return { ...prev, [currentPatient.id]: copyForPatient };
      });
      await appendAuditLog(
        'PATIENT_SWE',
        'POLICY_GRANT',
        'SUCCESS',
        lang === 'vi'
          ? `BN ${currentPatient.name} đã MỞ KHÓA [${row.vietnameseCategory}] cho riêng BS theo dõi chính ${currentPatient.primaryDoctorName}.`
          : `Patient ${currentPatient.nameEn} UNLOCKED [${row.category}] exclusively for primary doctor ${currentPatient.primaryDoctorNameEn}.`,
        tag
      );
    }
  };

  const handleDoctorAddTreatmentNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorNote.trim()) return;
    const cleanNoteEn = toEnName(newDoctorNote.trim());
    const item: PatientTimelineStep = {
      date: '22/10/2026',
      titleVi: isPrimaryMonitoringDoctor
        ? `Phác đồ Điều trị Tổng thể (${activeDoctor.name} cập nhật)`
        : `Điều chỉnh Chuyên khoa Sâu (${activeDoctor.name} sửa phác đồ)`,
      titleEn: isPrimaryMonitoringDoctor
        ? `Holistic Treatment Update (${activeDoctor.nameEn})`
        : `Specialty Treatment Adjustment (${activeDoctor.nameEn})`,
      detailVi: newDoctorNote.trim(),
      detailEn: cleanNoteEn,
      doctorName: `${activeDoctor.name} (${activeDoctor.specialtyVi})`,
      doctorNameEn: `${activeDoctor.nameEn} (${activeDoctor.specialtyEn})`,
    };
    setTimelinesByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: [item, ...(prev[currentPatient.id] || [])],
    }));
    setNewDoctorNote('');
    await appendAuditLog(
      'CLINICIAN_SWE',
      'TAG_ENCRYPT',
      'SUCCESS',
      lang === 'vi'
        ? `${activeDoctor.name} đã lưu phác đồ mới cho BN ${currentPatient.name} (E2EE).`
        : `${activeDoctor.nameEn} saved a new E2EE treatment note for ${currentPatient.nameEn}.`,
      `patient:${currentPatient.id.toLowerCase()}:primary`
    );
  };

  const handleAttemptUnauthorizedDecrypt = async (row: EncryptedDatabaseRow) => {
    try {
      await doDecryptRecordWithTidePRE(row, effectiveDoctorTags, activeDoctor.sweKey);
    } catch {
      const msg = isPrimaryMonitoringDoctor
        ? t(
            `TIDECLOAK CHẶN TRUY CẬP: ${activeDoctor.name} không thể tự ý mở "${row.vietnameseCategory}". Bác sĩ cần gửi yêu cầu theo dõi tình trạng để Bệnh nhân mở khóa!`,
            `TIDECLOAK ACCESS DENIED: ${activeDoctor.nameEn} cannot decrypt "${row.category}" without Patient consent! Please send a status monitoring request.`
          )
        : t(
            `TIDECLOAK SCOPED ACCESS CHẶN: ${activeDoctor.name} (${activeDoctor.specialtyVi}) chỉ là Bác sĩ chuyên khoa phối hợp nên CHỈ ĐƯỢC XEM ĐÚNG BỆNH CHUYÊN KHOA ĐƯỢC GIAO, không được xem "${row.vietnameseCategory}"!`,
            `TIDECLOAK SCOPED ACCESS DENIED: ${activeDoctor.nameEn} (${activeDoctor.specialtyEn}) is a referred specialist and is ONLY permitted to view their assigned specialty disease, NOT "${row.category}"!`
          );
      setClinicianErrors((prev) => ({
        ...prev,
        [row.tideTag]: msg,
      }));
      await appendAuditLog(
        'CLINICIAN_SWE',
        'PRE_DECRYPT_DENIED',
        'DENIED',
        lang === 'vi'
          ? `${activeDoctor.name} thử mở [${row.vietnameseCategory}] ngoài phạm vi cho phép -> Bị TideCloak chặn đứng!`
          : `${activeDoctor.nameEn} attempted unauthorized decryption of [${row.category}] -> Blocked by TideCloak!`,
        row.tideTag
      );
    }
  };

  const handleSimulateAdminInspect = async () => {
    const result = await simulateRogueAdminPrivilegeEscalation(encryptedRows);
    setAdminBreachReport(result);
    setAdminAttackCount((c) => c + 1);
    setShowAdminAttackModal(true);
    await appendAuditLog(
      'CLOUD_DB_ADMIN',
      'ADMIN_BYPASS_BLOCKED',
      'CRITICAL_BLOCK',
      lang === 'vi'
        ? `Admin gọi API thử đọc trộm bệnh án của BN ${currentPatient.name} (${currentPatient.id}) -> Bị TideCloak ORK (12/12 MPC Nodes) chặn đứng (HTTP 403 • 0 Bytes bị lộ).`
        : `Admin called API attempting root decryption on ${currentPatient.nameEn} (${currentPatient.id}) -> Blocked by TideCloak ORK (12/12 MPC Nodes • HTTP 403 • 0 Bytes exposed).`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  const handleToggleRevokeSpecificDoctor = async (doc: HospitalDoctor) => {
    const currentSet = new Set(revokedDoctorsByPatient[currentPatient.id] || []);
    const isAlreadyRevoked = currentSet.has(doc.id);

    if (isAlreadyRevoked) {
      currentSet.delete(doc.id);
      setRevokedDoctorsByPatient((prev) => ({
        ...prev,
        [currentPatient.id]: currentSet,
      }));
      await appendAuditLog(
        'PATIENT_SWE',
        'POLICY_GRANT',
        'SUCCESS',
        lang === 'vi'
          ? `BN ${currentPatient.name} đã CẤP LẠI quyền xem bệnh án cho ${doc.name} (${doc.specialtyVi}).`
          : `Patient ${currentPatient.nameEn} RESTORED record viewing access for ${doc.nameEn} (${doc.specialtyEn}).`,
        doc.id
      );
    } else {
      currentSet.add(doc.id);
      setRevokedDoctorsByPatient((prev) => ({
        ...prev,
        [currentPatient.id]: currentSet,
      }));
      await appendAuditLog(
        'PATIENT_SWE',
        'POLICY_REVOKE',
        'CRITICAL_BLOCK',
        lang === 'vi'
          ? `BN ${currentPatient.name} đã CHỈ ĐỊNH THU HỒI quyền xem bệnh án của riêng ${doc.name} (${doc.specialtyVi}).`
          : `Patient ${currentPatient.nameEn} REVOKED record viewing access specifically for ${doc.nameEn} (${doc.specialtyEn}).`,
        doc.id
      );
    }
  };

  const handleEmergencyRevokeAll = async () => {
    const allDocIds = new Set(HOSPITAL_DOCTORS.map((d) => d.id));
    setRevokedDoctorsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: allDocIds,
    }));
    const emptyPerDoc: Record<string, Set<string>> = {};
    HOSPITAL_DOCTORS.forEach((d) => {
      emptyPerDoc[d.id] = new Set();
    });
    setAuthorizedByPatientAndDoctor((prev) => ({
      ...prev,
      [currentPatient.id]: emptyPerDoc,
    }));
    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_REVOKE',
      'CRITICAL_BLOCK',
      lang === 'vi'
        ? `BN ${currentPatient.name} (${currentPatient.id}) đã THU HỒI TOÀN BỘ quyền xem bệnh án của tất cả bác sĩ ngay lập tức.`
        : `Patient ${currentPatient.nameEn} (${currentPatient.id}) REVOKED ALL doctor decryption sessions immediately.`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  const handleRestoreAllDoctors = async () => {
    setRevokedDoctorsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: new Set(),
    }));
    const defaultPerDoc: Record<string, Set<string>> = {};
    HOSPITAL_DOCTORS.forEach((d) => {
      if (d.id === currentPatient.primaryDoctorId) {
        defaultPerDoc[d.id] = new Set([`patient:${currentPatient.id.toLowerCase()}:primary`]);
      } else {
        defaultPerDoc[d.id] = new Set();
      }
    });
    setAuthorizedByPatientAndDoctor((prev) => ({
      ...prev,
      [currentPatient.id]: defaultPerDoc,
    }));
    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_GRANT',
      'SUCCESS',
      lang === 'vi'
        ? `BN ${currentPatient.name} đã khôi phục quyền xem mặc định cho Bác sĩ theo dõi chính ${currentPatient.primaryDoctorName}.`
        : `Patient ${currentPatient.nameEn} restored default monitoring access for primary doctor ${currentPatient.primaryDoctorNameEn}.`,
      `patient:${currentPatient.id.toLowerCase()}:primary`
    );
  };

  const handleChangePatientAlertLevel = async (level: ConditionAlertLevel) => {
    setConditionAlertByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: level,
    }));
    const meta = getAlertMeta(level);
    await appendAuditLog(
      'CLINICIAN_SWE',
      'TAG_ENCRYPT',
      'SUCCESS',
      lang === 'vi'
        ? `${activeDoctor.name} cập nhật mức cảnh báo tình trạng bệnh của ${currentPatient.name} thành [${meta.labelVi}].`
        : `${activeDoctor.nameEn} updated condition alert level of ${currentPatient.nameEn} to [${meta.labelEn}].`,
      `patient:${currentPatient.id.toLowerCase()}:alert`
    );
  };

  const getCategoryIcon = (catText: string) => {
    const lower = catText.toLowerCase();
    if (lower.includes('tim') || lower.includes('huyết áp') || lower.includes('cardio'))
      return <HeartPulse className="w-5 h-5 text-red-600" />;
    if (
      lower.includes('tâm thần') ||
      lower.includes('thần kinh') ||
      lower.includes('giấc ngủ') ||
      lower.includes('psych') ||
      lower.includes('neuro')
    )
      return <Brain className="w-5 h-5 text-blue-600" />;
    if (lower.includes('di truyền') || lower.includes('riêng tư') || lower.includes('genet'))
      return <Dna className="w-5 h-5 text-red-500" />;
    if (lower.includes('xương khớp') || lower.includes('ortho') || lower.includes('rheum'))
      return <Bone className="w-5 h-5 text-sky-600" />;
    return <Activity className="w-5 h-5 text-blue-600" />;
  };

  const getPatientAvatar = (genderVi: 'Nam' | 'Nữ') =>
    genderVi === 'Nam' ? '/avatar-male.png' : '/avatar-female.png';

  const pendingRequestList = Object.values(pendingRequests);
  const pendingCount = pendingRequestList.length;
  const currentTimeline = timelinesByPatient[currentPatient.id] || currentPatient.timeline;

  // =========================================================================
  // SƠ ĐỒ KHÁM CỦA CÁC BÁC SĨ QUẢN LÝ & MỨC ĐỘ HOÀN THÀNH (CARE PATHWAY DIAGRAM)
  // =========================================================================
  const renderDoctorCareDiagram = (showDoctorControls: boolean) => (
    <div className="rounded-2xl bg-white border border-blue-200 p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              {t(
                `🗺️ Sơ Đồ Khám Của Các Bác Sĩ Quản Lý & Mức Độ Hoàn Thành (${currentPatient.name})`,
                `🗺️ Multi-Doctor Care Pathway & Completion Progress (${currentPatient.nameEn})`
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {t(
                'Bác sĩ theo dõi chính biết nhiều bệnh để điều phối • Bác sĩ chuyên khoa phối hợp chỉ xem đúng 1 bệnh chuyên khoa để sửa/điều trị',
                'Primary monitoring doctor views multi-specialty records • Referred specialist doctor ONLY views 1 assigned specialty condition'
              )}
            </p>
          </div>
        </div>

        {/* Overall Completion Progress Pill */}
        <div className="flex items-center gap-3 bg-blue-50/80 border border-blue-200 px-3.5 py-2 rounded-xl">
          <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-blue-900">
              <span>{t('Tổng mức độ hoàn thành:', 'Overall Care Completion:')}</span>
              <span className="text-blue-600">{overallCompletionPercent}%</span>
            </div>
            <div className="w-36 h-2 bg-blue-200/70 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${overallCompletionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Connected Nodes in the Care Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {currentCareStages.map((stage, idx) => {
          const isCurrentLoggedDoctor =
            portal === 'DOCTOR' && activeDoctor.id === stage.doctorId;
          const isCompleted = stage.completionPercent >= 100;
          const stDocName = lang === 'vi' ? stage.doctorName : stage.doctorNameEn;
          const stSpec = lang === 'vi' ? stage.specialtyVi : stage.specialtyEn;
          const stCat = lang === 'vi' ? stage.diseaseCategoryVi : stage.diseaseCategoryEn;
          const stTitle = lang === 'vi' ? stage.diseaseTitleVi : stage.diseaseTitleEn;

          return (
            <div
              key={stage.stageOrder}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between relative ${
                isCurrentLoggedDoctor
                  ? 'bg-blue-50/60 border-2 border-blue-500 shadow-sm'
                  : stage.isReferred
                  ? 'bg-slate-50/90 border-slate-200'
                  : 'bg-slate-50/40 border-dashed border-slate-300'
              }`}
            >
              <div className="space-y-2.5">
                {/* Top Row: Step Order + Role Type */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      stage.roleType === 'PRIMARY_MONITOR'
                        ? 'bg-blue-600 text-white'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {t(`Bước ${stage.stageOrder}`, `Step ${stage.stageOrder}`)} •{' '}
                    {stage.roleType === 'PRIMARY_MONITOR'
                      ? t('BS Theo Dõi Chính', 'Primary Doctor')
                      : t('BS Chuyên Khoa Sửa Bệnh', 'Specialist Doctor')}
                  </span>

                  {stage.isReferred ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isCompleted
                        ? t('✅ Hoàn thành 100%', '✅ 100% Completed')
                        : t(
                            `Đang khám (${stage.completionPercent}%)`,
                            `In Progress (${stage.completionPercent}%)`
                          )}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {t('⏳ Chờ chuyển khoa', '⏳ Pending Referral')}
                    </span>
                  )}
                </div>

                {/* Doctor Name & Specialty */}
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{stDocName}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-blue-700 mt-0.5">{stSpec}</div>
                </div>

                {/* TideCloak Viewing Scope Badge */}
                <div
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                    stage.roleType === 'PRIMARY_MONITOR'
                      ? 'bg-blue-100/80 text-blue-800 border border-blue-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {stage.roleType === 'PRIMARY_MONITOR' ? (
                    <>
                      <Unlock className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>
                        {t(
                          'Biết nhiều bệnh (khi BN mở khóa)',
                          'Multi-disease view (with patient consent)'
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-red-600 shrink-0" />
                      <span>
                        {t(
                          `Xem các bệnh liên quan chuyên khoa: ${stSpec}`,
                          `Scoped to specialty-related diseases: ${stSpec}`
                        )}
                      </span>
                    </>
                  )}
                </div>

                {/* Disease / Clinical Task */}
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div className="font-bold text-slate-800">{stCat}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{stTitle}</div>
                </div>
              </div>

              {/* Bottom Section: Completion Bar + Interactive Referral / Progress Controls */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                    <span>{t('Mức độ hoàn thành:', 'Completion Progress:')}</span>
                    <span
                      className={
                        isCompleted
                          ? 'text-emerald-600 font-extrabold'
                          : 'text-blue-600 font-extrabold'
                      }
                    >
                      {stage.isReferred
                        ? `${stage.completionPercent}%`
                        : t('0% (Chưa chuyển)', '0% (Not referred)')}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        !stage.isReferred
                          ? 'bg-slate-400'
                          : isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${stage.isReferred ? stage.completionPercent : 8}%`,
                      }}
                    />
                  </div>
                </div>

                {showDoctorControls && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    {isPrimaryMonitoringDoctor && stage.roleType !== 'PRIMARY_MONITOR' && (
                      <>
                        {!stage.isReferred ? (
                          <button
                            onClick={() => handleReferToSpecialistDoctor(stage)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                          >
                            <Send className="w-3 h-3" />
                            {t(
                              `Gửi yêu cầu ${stDocName} sửa bệnh này`,
                              `Refer to ${stDocName} (1-disease scope)`
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveDoctorId(stage.doctorId)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <UserCheck className="w-3 h-3" />
                            {t(
                              `Đổi sang góc nhìn ${stDocName} ➔`,
                              `Switch to ${stDocName}'s View ➔`
                            )}
                          </button>
                        )}
                      </>
                    )}

                    {activeDoctor.id === stage.doctorId && stage.isReferred && (
                      <div className="w-full flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleUpdateStageProgress(stage, stage.completionPercent + 20)
                          }
                          disabled={stage.completionPercent >= 100}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold transition-all"
                        >
                          {t('+20% Tiến độ khám', '+20% Progress')}
                        </button>
                        <button
                          onClick={() => handleUpdateStageProgress(stage, 100)}
                          disabled={stage.completionPercent >= 100}
                          className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold transition-all"
                        >
                          {t('Hoàn thành 100%', 'Complete 100%')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {idx < 2 && (
                <div className="hidden md:flex w-6 h-6 rounded-full bg-blue-600 text-white items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 shadow">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // =========================================================================
  // SIDEBAR 1: DÀNH CHO CỔNG BỆNH NHÂN (CHỌN 1 TRONG 20 BỆNH NHÂN)
  // =========================================================================
  const renderPatientSelectorSidebar = () => (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            {t('20 Hồ Sơ Bệnh Nhân E2EE', '20 E2EE Patient Profiles')}
          </span>
          <h3 className="text-sm font-extrabold text-slate-900">
            {t('Chọn tài khoản Bệnh nhân', 'Select Patient Account')}
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {filteredPatients.length}/20
        </span>
      </div>

      {/* Search & Doctor Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'Tìm tên BN, mã BN-101..120...',
              'Search patient name, ID BN-101..120...'
            )}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <select
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">
              {t('Tất cả 6 Bác sĩ Chuyên khoa (20 BN)', 'All 6 Specialist Doctors (20 Patients)')}
            </option>
            {HOSPITAL_DOCTORS.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {dName(doc)} — {dSpec(doc)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable List of 20 Patients */}
      <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
        {filteredPatients.map((p) => {
          const isSelected = p.id === currentPatient.id;
          const pGrants =
            authorizedByPatientAndDoctor[p.id]?.[p.primaryDoctorId]?.size || 0;
          const pReqs = Object.keys(requestsByPatient[p.id] || {}).length;

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPatientId(p.id)}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={getPatientAvatar(p.genderVi)}
                    alt={pName(p)}
                    className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0 bg-slate-200"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {pName(p)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.id}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {p.age} {t('tuổi', 'yo')} • {pGender(p)}
                      </span>
                    </div>
                  </div>
                </div>

                {pReqs > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatientId(p.id);
                      setPortal('PATIENT');
                      setShowBellModal(true);
                    }}
                    title={t(
                      'Có yêu cầu theo dõi tình trạng từ Bác sĩ',
                      'Doctor status monitoring request'
                    )}
                    className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/30 relative"
                  >
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                  </button>
                )}
              </div>

              {pReqs > 0 && (
                <div className="mt-1.5 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <BellRing className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {t('Có yêu cầu theo dõi tình trạng', 'Status monitoring request')}
                  </span>
                </div>
              )}

              <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
                <div className="truncate">
                  <strong className="text-blue-700">{pDocName(p)}</strong> • {pDocSpec(p)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold border ${
                      getAlertMeta(conditionAlertByPatient[p.id] || 'CAN_CHU_Y').badgeClass
                    }`}
                  >
                    {lang === 'vi'
                      ? getAlertMeta(conditionAlertByPatient[p.id] || 'CAN_CHU_Y').labelVi
                      : getAlertMeta(conditionAlertByPatient[p.id] || 'CAN_CHU_Y').labelEn}
                  </span>
                  <span className="font-semibold text-blue-700">
                    {t(`Mở ${pGrants}/4 bệnh án`, `Unlocked ${pGrants}/4`)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // =========================================================================
  // SIDEBAR 2: DÀNH RIÊNG CHO CỔNG BÁC SĨ
  // =========================================================================
  const renderDoctorListWithManagedPatientsSidebar = () => (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
      <div className="border-b border-slate-100 pb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
          {t('Cổng Bác Sĩ Chuyên Khoa', 'Specialist Doctor Portal')}
        </span>
        <h3 className="text-sm font-extrabold text-slate-900">
          {t('Danh Sách Bác Sĩ & Bệnh Nhân Đang Theo Dõi', 'Doctors & Monitored Patients')}
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {t(
            'Chọn Bác sĩ để xem danh sách bệnh nhân mà Bác sĩ đó đang theo dõi chính hoặc nhận sửa chuyên khoa:',
            'Select a Doctor to manage their primary monitored patients and specialist referrals:'
          )}
        </p>
      </div>

      <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
        {HOSPITAL_DOCTORS.map((doc) => {
          const isDocSelected = doc.id === activeDoctor.id;
          const primaryPatients = ALL_20_PATIENTS.filter((p) => p.primaryDoctorId === doc.id);
          const specialistPatients = ALL_20_PATIENTS.filter((p) => {
            if (p.primaryDoctorId === doc.id) return false;
            const stages = careStagesByPatient[p.id] || p.careStages;
            return stages.some((st) => st.doctorId === doc.id && st.isReferred);
          });

          return (
            <div
              key={doc.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isDocSelected
                  ? 'border-2 border-blue-600 bg-blue-50/30 shadow-sm'
                  : 'border-slate-200 bg-slate-50/60 hover:border-blue-300'
              }`}
            >
              {/* Doctor Header Row */}
              <div
                onClick={() => {
                  setActiveDoctorId(doc.id);
                  const allManaged = [...primaryPatients, ...specialistPatients];
                  if (
                    allManaged.length > 0 &&
                    !allManaged.some((p) => p.id === selectedPatientId)
                  ) {
                    setSelectedPatientId(allManaged[0].id);
                  }
                }}
                className={`cursor-pointer p-3 flex items-center justify-between gap-2 ${
                  isDocSelected ? 'bg-blue-600 text-white' : 'hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                      isDocSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-extrabold truncate ${
                        isDocSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {dName(doc)}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isDocSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {dSpec(doc)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isDocSelected
                        ? 'bg-white text-blue-700'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {primaryPatients.length} {t('BN chính', 'Primary')}
                  </span>
                  {specialistPatients.length > 0 && (
                    <span
                      className={`mt-0.5 text-[9px] font-bold ${
                        isDocSelected ? 'text-sky-100' : 'text-sky-700'
                      }`}
                    >
                      +{specialistPatients.length} {t('BN hội chẩn', 'Referred')}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Managed Patients List inside Selected Doctor */}
              {isDocSelected && (
                <div className="p-2.5 space-y-2.5 bg-white border-t border-blue-200">
                  {/* Group 1: Primary Monitored Patients */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 px-1 flex items-center justify-between">
                      <span>
                        {t(
                          '🩺 Bệnh nhân theo dõi chính (Xem đa bệnh)',
                          '🩺 Primary Patients (Multi-disease view)'
                        )}
                      </span>
                      <span>{primaryPatients.length}</span>
                    </div>
                    {primaryPatients.map((p) => {
                      const isPSelected = p.id === currentPatient.id;
                      const pReqs = Object.keys(requestsByPatient[p.id] || {}).length;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPatientId(p.id)}
                          className={`cursor-pointer p-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 ${
                            isPSelected
                              ? 'bg-blue-50 border-blue-500 font-bold text-blue-950'
                              : 'bg-slate-50 border-slate-200 hover:border-blue-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={getPatientAvatar(p.genderVi)}
                              alt={pName(p)}
                              className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0 bg-slate-200"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-bold">{pName(p)}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                                  {p.id}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold border shrink-0 ${
                                    getAlertMeta(conditionAlertByPatient[p.id] || 'CAN_CHU_Y')
                                      .badgeClass
                                  }`}
                                >
                                  {lang === 'vi'
                                    ? getAlertMeta(conditionAlertByPatient[p.id] || 'CAN_CHU_Y')
                                        .labelVi
                                    : getAlertMeta(conditionAlertByPatient[p.id] || 'CAN_CHU_Y')
                                        .labelEn}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {lang === 'vi'
                                  ? p.records[0]?.title
                                  : p.records[0]?.titleEn || p.records[0]?.title}
                              </div>
                            </div>
                          </div>

                          {pReqs > 0 && (
                            <span
                              title={t(
                                'Đã gửi chuông đỏ yêu cầu theo dõi tình trạng',
                                'Status monitoring request pending'
                              )}
                              className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0"
                            >
                              <BellRing className="w-3 h-3 animate-bounce" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Group 2: Referred Specialist Patients */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 px-1 flex items-center justify-between">
                      <span>
                        {t(
                          '🤝 BN nhận sửa chuyên khoa (Chỉ xem 1 bệnh)',
                          '🤝 Specialist Referrals (1-disease scope)'
                        )}
                      </span>
                      <span>{specialistPatients.length}</span>
                    </div>
                    {specialistPatients.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic px-1 py-1">
                        {t('Chưa có yêu cầu hội chẩn chuyên khoa mới.', 'No active specialist referrals.')}
                      </div>
                    ) : (
                      specialistPatients.map((p) => {
                        const isPSelected = p.id === currentPatient.id;
                        const stages = careStagesByPatient[p.id] || p.careStages;
                        const myStage = stages.find(
                          (st) => st.doctorId === doc.id && st.isReferred
                        );
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPatientId(p.id)}
                            className={`cursor-pointer p-2 rounded-lg border text-xs transition-all ${
                              isPSelected
                                ? 'bg-sky-50 border-sky-500 font-bold text-sky-950'
                                : 'bg-slate-50 border-slate-200 hover:border-sky-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={getPatientAvatar(p.genderVi)}
                                  alt={pName(p)}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0 bg-slate-200"
                                />
                                <span className="truncate font-bold">{pName(p)}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold shrink-0">
                                  {p.id}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-sky-700 shrink-0">
                                {myStage?.completionPercent || 0}%
                              </span>
                            </div>
                            <div className="text-[10px] text-red-600 font-semibold truncate mt-0.5">
                              🔒 {t('Chỉ xem:', 'Only views:')}{' '}
                              {lang === 'vi'
                                ? myStage?.diseaseCategoryVi
                                : myStage?.diseaseCategoryEn}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Hospital Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-red-600" />

      {/* =======================================================================
          MODAL POPUP KHI BẤM VÀO CHUÔNG ĐỎ THÔNG BÁO YÊU CẦU THEO DÕI TÌNH TRẠNG
      ======================================================================= */}
      {showBellModal && pendingCount > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-red-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/20">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {t(
                      'Thông Báo Yêu Cầu Theo Dõi Tình Trạng',
                      'Doctor Status Monitoring Request'
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('Bệnh nhân:', 'Patient:')} <strong>{pName(currentPatient)}</strong> (
                    {currentPatient.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBellModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingRequestList.map((req) => (
                <div
                  key={req.requestKey}
                  className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {lang === 'vi' ? req.categoryVi : req.categoryEn}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {lang === 'vi'
                        ? `Chỉ mở riêng cho: ${req.doctorNameVi}`
                        : `Exclusively for: ${req.doctorNameEn}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {lang === 'vi' ? req.reasonVi : req.reasonEn}
                  </p>
                  <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    🔒{' '}
                    {t(
                      `Quy định bảo mật: Khi bạn đồng ý, CHỈ DUY NHẤT ${req.doctorNameVi} xem được hồ sơ này — các bác sĩ khác vẫn bị khóa hoàn toàn!`,
                      `Strict Isolation Rule: Approving unlocks this record EXCLUSIVELY for ${req.doctorNameEn} — all other doctors remain locked!`
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handlePatientApproveRequest(req.requestKey)}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4" />
                      {t(
                        `Đồng ý chỉ cho ${req.doctorNameVi} xem`,
                        `Approve Exclusively for ${req.doctorNameEn}`
                      )}
                    </button>
                    <button
                      onClick={() => handlePatientRejectRequest(req.requestKey)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-100 text-slate-600 hover:text-red-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <X className="w-4 h-4" />
                      {t('Từ chối', 'Reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pendingCount > 1 && (
              <button
                onClick={handlePatientApproveAllRequests}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm"
              >
                {t(
                  `✅ Đồng ý Mở Khóa Tất Cả (${pendingCount} yêu cầu)`,
                  `✅ Approve All (${pendingCount} requests)`
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL CỬA SỔ NHỎ CHỈ ĐỊNH BÁC SĨ NÀO KHÔNG ĐƯỢC XEM BỆNH ÁN
      ======================================================================= */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-red-200 max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {t(
                      'Chỉ Định Bác Sĩ Không Được Xem Bệnh Án',
                      'Specify Which Doctors Cannot View Records'
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('Hồ sơ Bệnh nhân:', 'Patient Profile:')}{' '}
                    <strong>{pName(currentPatient)}</strong> ({currentPatient.id}) •{' '}
                    {t(
                      'Chọn bác sĩ bạn muốn chặn/thu hồi quyền xem:',
                      'Select which doctor(s) to block from viewing your records:'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {HOSPITAL_DOCTORS.map((doc) => {
                const isBlocked = revokedDoctorsForCurrentPatient.has(doc.id);
                const isPrimary = doc.id === currentPatient.primaryDoctorId;
                const stageMatch = currentCareStages.find((st) => st.doctorId === doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isBlocked
                        ? 'bg-red-50/70 border-red-300'
                        : isPrimary || stageMatch
                        ? 'bg-blue-50/50 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          {dName(doc)}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {dSpec(doc)}
                        </span>
                        {isPrimary ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            {t('Bác sĩ theo dõi chính', 'Primary Monitoring Doctor')}
                          </span>
                        ) : stageMatch ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                            {t(
                              `BS chuyên khoa (${stageMatch.diseaseCategoryVi})`,
                              `Specialist (${stageMatch.diseaseCategoryEn})`
                            )}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[11px]">
                        {isBlocked ? (
                          <span className="font-bold text-red-600">
                            🚫{' '}
                            {t(
                              'Đã bị chặn — Không được phép xem bất kỳ bệnh án nào của bạn',
                              'Blocked — Cannot view any of your medical records'
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            🟢{' '}
                            {isPrimary
                              ? t(
                                  `BS theo dõi chính: Đang được xem ${
                                    authorizedByPatientAndDoctor[currentPatient.id]?.[doc.id]
                                      ?.size || 0
                                  }/4 bệnh án bạn mở khóa`,
                                  `Primary Doctor: Permitted to view ${
                                    authorizedByPatientAndDoctor[currentPatient.id]?.[doc.id]
                                      ?.size || 0
                                  }/4 unlocked records`
                                )
                              : (authorizedByPatientAndDoctor[currentPatient.id]?.[doc.id]
                                  ?.size || 0) > 0
                              ? t(
                                  `BS chuyên khoa: Đang xem ${
                                    authorizedByPatientAndDoctor[currentPatient.id]?.[doc.id]
                                      ?.size || 0
                                  } bệnh liên quan đến chuyên khoa [${doc.specialtyVi}]`,
                                  `Specialist Doctor: Permitted to view ${
                                    authorizedByPatientAndDoctor[currentPatient.id]?.[doc.id]
                                      ?.size || 0
                                  } specialty-related records [${doc.specialtyEn}]`
                                )
                              : t(
                                  'Chưa được cấp quyền xem bệnh án nào (Muốn xem phải gửi yêu cầu riêng)',
                                  'No records unlocked (Must send an individual request to view)'
                                )}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleRevokeSpecificDoctor(doc)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        isBlocked
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {isBlocked ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          {t('Cho phép xem lại', 'Restore Access')}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          {t('Không cho xem', 'Revoke This Doctor')}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleEmergencyRevokeAll}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Flame className="w-4 h-4" />
                {t(
                  '🔥 Thu hồi TẤT CẢ các Bác sĩ cùng lúc',
                  '🔥 Revoke ALL Doctors at Once'
                )}
              </button>

              {revokedDoctorsForCurrentPatient.size > 0 && (
                <button
                  onClick={handleRestoreAllDoctors}
                  className="py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
                >
                  {t('Khôi phục mặc định', 'Restore Default')}
                </button>
              )}

              <button
                onClick={() => setShowRevokeModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                {t('Đóng cửa sổ', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL KẾT QUẢ GỌI API GIẢI MÃ TRÁI PHÉP CỦA ROOT ADMIN (HTTP 403 BLOCK)
      ======================================================================= */}
      {showAdminAttackModal && adminBreachReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-red-300 max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/25">
                  <FileLock2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-red-700">
                      {t(
                        '🚨 TIDECLOAK FABRIC CHẶN ĐỨNG LỆNH GIẢI MÃ CỦA ROOT ADMIN',
                        '🚨 TIDECLOAK FABRIC BLOCKED ROOT ADMIN DECRYPTION CALL'
                      )}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-100 text-red-800 border border-red-300">
                      {t(`Lần thử #${adminAttackCount}`, `Attempt #${adminAttackCount}`)} • {adminBreachReport.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t(
                      `Đã thực thi WebCrypto subtle.decrypt() & gọi TideCloak ORK API trên 4 bệnh án của ${currentPatient.name} (${currentPatient.id})`,
                      `Executed WebCrypto subtle.decrypt() & TideCloak ORK API against 4 records of ${currentPatient.nameEn} (${currentPatient.id})`
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminAttackModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-700">
              <div className="text-amber-400 font-bold">
                $ {adminBreachReport.sqlExecuted}
              </div>
              <div className="text-red-400 font-bold">
                ➔ Response: {adminBreachReport.tideFabricResponseCode}
              </div>
              <div className="text-sky-300">
                ➔ Quorum: {adminBreachReport.mpcNodesRejected}
              </div>
              <div className="text-emerald-400 font-extrabold">
                ➔ Plaintext Medical Data Exposed to Admin: {adminBreachReport.plaintextBytesExposed} BYTES
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {adminBreachReport.rawDumpPreview.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-red-50/70 border border-red-200 font-mono text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {item.id} • Tag: {item.tideTag}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                      HTTP 403 BLOCKED
                    </span>
                  </div>
                  <div className="text-slate-500 truncate">
                    Ciphertext: {item.extractedCiphertext}
                  </div>
                  <div className="text-red-700 font-bold">
                    ❌ {item.decryptAttemptStatus}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAdminAttackModal(false)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-all"
              >
                {t('Đã hiểu (Đóng báo cáo bảo mật)', 'Got It (Close Security Report)')}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 space-y-2.5">
          {/* ROW 1 OF HEADER: HOSPITAL BRAND LOGO & SUBTITLE */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => setPortal('LOGIN')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20 relative group-hover:scale-105 transition-all">
                <Shield className="w-6 h-6 text-white stroke-[2.2]" />
                <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white flex items-center justify-center absolute -top-1 -right-1">
                  <Cross className="w-2.5 h-2.5 text-white stroke-[3]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    Care<span className="text-blue-600">Pass</span>
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {t(
                      '20 Bệnh Nhân • 6 Bác Sĩ • TideCloak E2EE',
                      '20 Patients • 6 Doctors • TideCloak E2EE'
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {t(
                    'Hệ thống Phối hợp Đa Chuyên Khoa — Bác sĩ Theo dõi & Bác sĩ Chuyên khoa Sửa bệnh',
                    'Multi-Specialty E2EE Care Coordination — Monitoring Doctor & Scoped Specialist Care'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ROW 2 OF HEADER: LEFT = 4 PORTAL TABS, RIGHT = BELL ALERT + LANGUAGE BUTTON */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 4-Tab Portal Switcher */}
            <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 gap-1">
              <button
                onClick={() => setPortal('LOGIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  portal === 'LOGIN'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('🔐 Đăng nhập', '🔐 Sign In')}
              </button>

              <button
                onClick={() => setPortal('PATIENT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  portal === 'PATIENT'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>
                  {t(
                    `1. Cổng Bệnh Nhân (${currentPatient.id})`,
                    `1. Patient Portal (${currentPatient.id})`
                  )}
                </span>
                {pendingCount > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setPortal('PATIENT');
                      setShowBellModal(true);
                    }}
                    title={t(
                      'Bệnh nhân có yêu cầu theo dõi tình trạng',
                      'Patient has a status monitoring request'
                    )}
                    className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm"
                  >
                    <BellRing className="w-3 h-3 animate-bounce" />
                  </span>
                )}
              </button>

              <button
                onClick={() => setPortal('DOCTOR')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  portal === 'DOCTOR'
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>
                  {t(
                    `2. Cổng Bác Sĩ (${activeDoctor.name})`,
                    `2. Doctor Portal (${activeDoctor.nameEn})`
                  )}
                </span>
              </button>

              <button
                onClick={() => setPortal('ADMIN')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  portal === 'ADMIN'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t('3. Cổng Quản Trị (Admin)', '3. Hospital Admin')}</span>
              </button>
            </div>

            {/* Right: Red Bell Notification Icon + Language Toggle (Always stays on Right of Row 2!) */}
            <div className="flex items-center gap-2 ml-auto">
              {pendingCount > 0 && (
                <button
                  onClick={() => setShowBellModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-sm transition-all"
                >
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center">
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                  </span>
                  <span>
                    {t('Có yêu cầu theo dõi tình trạng', 'Status monitoring request')}
                  </span>
                </button>
              )}

              <button
                onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                {lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =======================================================================
          MAIN CONTENT AREA
      ======================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {/* =====================================================================
            VIEW 0: TIDECLOAK LOGIN GATEWAY
        ===================================================================== */}
        {portal === 'LOGIN' && (
          <div className="max-w-4xl mx-auto py-6 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {t(
                  'Hệ thống 20 Bệnh Nhân & 6 Bác Sĩ Chuyên Khoa Bảo Mật Bằng TideCloak',
                  '20 Patients & 6 Specialist Doctors Secured by TideCloak E2EE'
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {t(
                  'Cổng Đăng Nhập Bệnh Viện Số CarePass',
                  'CarePass Digital Hospital Sign-In Gateway'
                )}
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {t(
                  'Chọn 1 trong 3 góc nhìn bên dưới để trải nghiệm quy trình khám chữa bệnh đa chuyên khoa, sơ đồ tiến độ khám của các bác sĩ quản lý và phân quyền chuyên khoa hẹp.',
                  'Select one of the 3 role portals below to experience multi-specialty care coordination, doctor completion diagrams, and scoped single-disease decryption.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => setPortal('PATIENT')}
                className="cursor-pointer group rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-600 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      {t('Góc nhìn 1 • Cổng Bệnh Nhân', 'Role 1 • Patient Portal')}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      {t('20 Bệnh nhân (BN-101 ➔ BN-120)', '20 Patients (BN-101 ➔ BN-120)')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('Đang chọn:', 'Selected:')} {pName(currentPatient)} ({currentPatient.id})
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>
                      {t(
                        '• Xem sơ đồ khám của các bác sĩ quản lý & mức độ hoàn thành (%).',
                        '• View the multi-doctor care pathway & treatment completion (%).'
                      )}
                    </li>
                    <li>
                      {t(
                        '• Nhận thông báo chuông đỏ khi Bác sĩ yêu cầu theo dõi tình trạng.',
                        '• Approve or reject doctor monitoring requests via red-bell alerts.'
                      )}
                    </li>
                  </ul>
                </div>

                <button className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                  {t('Vào Cổng Bệnh Nhân', 'Enter Patient Portal')}{' '}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div
                onClick={() => setPortal('DOCTOR')}
                className="cursor-pointer group rounded-2xl bg-white border-2 border-sky-200 hover:border-sky-600 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                      {t('Góc nhìn 2 • Cổng Bác Sĩ', 'Role 2 • Doctor Portal')}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      {t('Danh sách 6 Bác sĩ Chuyên khoa', '6 Specialist Doctors')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t(
                        'Mỗi bác sĩ quản lý danh sách bệnh nhân riêng của mình',
                        'Each doctor manages their own monitored & referred patients'
                      )}
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>
                      {t(
                        '• Bác sĩ theo dõi chính biết nhiều bệnh & gửi yêu cầu cho Bác sĩ chuyên khoa sửa bệnh.',
                        '• Primary monitoring doctors view consented multi-disease records & refer specialists.'
                      )}
                    </li>
                    <li>
                      {t(
                        '• Bác sĩ chuyên khoa phối hợp chỉ xem được đúng 1 bệnh thuộc chuyên khoa đó.',
                        '• Referred specialists can ONLY decrypt the 1 condition matching their specialty.'
                      )}
                    </li>
                  </ul>
                </div>

                <button className="mt-6 w-full py-2.5 rounded-xl bg-sky-600 group-hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                  {t('Vào Cổng Bác Sĩ', 'Enter Doctor Portal')}{' '}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div
                onClick={() => setPortal('ADMIN')}
                className="cursor-pointer group rounded-2xl bg-white border-2 border-red-200 hover:border-red-600 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                      {t('Góc nhìn 3 • Quản Trị Bệnh Viện', 'Role 3 • Hospital Admin')}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">System Admin</h2>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      {t('Quản lý 20 Bệnh nhân & 6 Bác sĩ', 'Manages 20 Patients & 6 Doctors')}
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>
                      {t(
                        '• Kiểm soát danh sách 20 Bệnh nhân & Bác sĩ nào đang theo dõi ai.',
                        '• View operational roster of 20 patients and their assigned doctors.'
                      )}
                    </li>
                    <li>
                      {t(
                        '• Bị khóa hoàn toàn phần chi tiết bệnh tình, đơn thuốc & quá trình điều trị.',
                        '• 100% blocked from reading clinical diagnoses, medications, or treatment notes.'
                      )}
                    </li>
                  </ul>
                </div>

                <button className="mt-6 w-full py-2.5 rounded-xl bg-red-600 group-hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                  {t('Vào Cổng Admin', 'Enter Admin Portal')}{' '}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 1: CỔNG BỆNH NHÂN (PATIENT PORTAL)
        ===================================================================== */}
        {portal === 'PATIENT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 3 COLS */}
            <div className="lg:col-span-3">{renderPatientSelectorSidebar()}</div>

            {/* RIGHT 9 COLS */}
            <div className="lg:col-span-9 space-y-5">
              {/* Patient Welcome Banner — Exact 3-Row Layout as Wireframe */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-sky-600 text-white p-5 space-y-3.5 shadow-md">
                {/* ROW 1: LEFT AVATAR SQUARE + RIGHT PERSONAL INFO RECTANGLE */}
                <div className="flex items-center gap-4">
                  <img
                    src={getPatientAvatar(currentPatient.genderVi)}
                    alt={pName(currentPatient)}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-extrabold text-white tracking-tight">
                        {pName(currentPatient)}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-extrabold bg-white text-blue-700 shadow-sm">
                        {currentPatient.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                        {currentPatient.age} {t('tuổi', 'yo')} • {pGender(currentPatient)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border shadow-sm ${
                          getAlertMeta(currentPatientAlert).bannerClass
                        }`}
                      >
                        {lang === 'vi'
                          ? getAlertMeta(currentPatientAlert).fullVi
                          : getAlertMeta(currentPatientAlert).fullEn}
                      </span>
                    </div>

                    <div className="text-xs text-blue-50 flex flex-wrap items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-white shrink-0" />
                      <span>
                        {t('Bác sĩ theo dõi chính:', 'Primary Monitoring Doctor:')}{' '}
                        <strong className="text-white">{pDocName(currentPatient)}</strong> (
                        {pDocSpec(currentPatient)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROW 2: FULL-WIDTH HORIZONTAL HEALTH CORRELATION BAR */}
                <div className="w-full px-4 py-2.5 rounded-xl bg-white/15 border border-white/25 text-xs text-blue-50 flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-sky-200 shrink-0" />
                  <div className="leading-relaxed">
                    <strong className="text-white">
                      {t('Tình trạng liên quan:', 'Related Clinical Chain:')}
                    </strong>{' '}
                    {pChain(currentPatient)}
                  </div>
                </div>

                {/* ROW 3: ACTION BUTTONS AT THE BOTTOM */}
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <button
                    onClick={() => {
                      setActiveDoctorId(currentPatient.primaryDoctorId);
                      setPortal('DOCTOR');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white text-blue-700 hover:bg-blue-50 shadow-sm transition-all"
                  >
                    <Stethoscope className="w-4 h-4" />
                    {t(
                      `Sang góc nhìn ${currentPatient.primaryDoctorName} ➔`,
                      `Switch to ${currentPatient.primaryDoctorNameEn}'s View ➔`
                    )}
                  </button>

                  <button
                    onClick={() => setShowRevokeModal(true)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      revokedDoctorsForCurrentPatient.size > 0
                        ? 'bg-red-600 hover:bg-red-700 text-white border-red-300 shadow-md'
                        : 'bg-white/15 hover:bg-red-600 text-white border-white/30'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    {revokedDoctorsForCurrentPatient.size > 0
                      ? t(
                          `Thu hồi quyền Bác sĩ (${revokedDoctorsForCurrentPatient.size} BS bị chặn)`,
                          `Revoke Doctor Access (${revokedDoctorsForCurrentPatient.size} Blocked)`
                        )
                      : t('Thu hồi quyền Bác sĩ (Chỉ định BS)', 'Revoke Doctor Access (Select Doctor)')}
                  </button>

                  {pendingCount > 0 && (
                    <button
                      onClick={() => setShowBellModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white shadow-lg border border-red-300 transition-all"
                    >
                      <BellRing className="w-4 h-4 animate-bounce" />
                      {t(
                        `Có yêu cầu theo dõi tình trạng (${pendingCount})`,
                        `Status Monitoring Request (${pendingCount})`
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* SƠ ĐỒ KHÁM CỦA CÁC BÁC SĨ QUẢN LÝ & MỨC ĐỘ HOÀN THÀNH */}
              {renderDoctorCareDiagram(false)}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT 6 COLS: THUỐC UỐNG & QUÁ TRÌNH ĐIỀU TRỊ */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-red-600" />
                        {t(
                          `Thuốc Đang Uống Của ${currentPatient.name}`,
                          `Active Medications of ${currentPatient.nameEn}`
                        )}
                      </h2>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {t('Bảo mật E2EE', 'E2EE Protected')}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {currentPatient.medications.map((med, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-extrabold text-blue-900">{med.name}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {lang === 'vi' ? med.dosageVi : med.dosageEn}
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200">
                            {lang === 'vi' ? med.deptVi : med.deptEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3.5 shadow-sm">
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <CalendarClock className="w-4 h-4 text-blue-600" />
                      {t(
                        'Quá Trình Điều Trị & Tiến Triển Bệnh',
                        'Treatment Timeline & Clinical Progress'
                      )}
                    </h2>

                    <div className="space-y-3.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                      {currentTimeline.map((item, idx) => (
                        <div key={idx} className="relative pl-8">
                          <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow absolute left-1.5 top-1.5" />
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="text-[11px] font-bold text-blue-700">
                                {item.date}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {lang === 'vi' ? item.doctorName : item.doctorNameEn}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-slate-900">
                              {lang === 'vi' ? item.titleVi : item.titleEn}
                            </h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {lang === 'vi' ? item.detailVi : item.detailEn}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT 6 COLS: CẤP QUYỀN MỞ KHÓA CHO BÁC SĨ THEO DÕI CHÍNH */}
                <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 space-y-3.5 shadow-sm h-fit">
                  <div className="border-b border-slate-100 pb-2.5">
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      {t(
                        `Phân Quyền Xem Bệnh Cho Bác Sĩ Theo Dõi (${currentPatient.primaryDoctorName})`,
                        `Manage Record Access for Monitoring Doctor (${currentPatient.primaryDoctorNameEn})`
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {t(
                        'Bác sĩ theo dõi chính biết được các bệnh bạn mở khóa bên dưới để chẩn đoán tổng thể. Nếu cần sửa bệnh chuyên khoa, bác sĩ theo dõi sẽ chuyển riêng đúng 1 bệnh đó cho bác sĩ chuyên khoa tương ứng:',
                        'Your primary monitoring doctor can view the records you unlock below for holistic diagnosis. When specialist care is needed, they delegate scoped 1-disease access to the matching specialist doctor:'
                      )}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {encryptedRows.map((row) => {
                      const isGranted = authorizedTags.has(row.tideTag);
                      const pendingForThisRow = Object.values(pendingRequests).filter(
                        (r) => r.tideTag === row.tideTag
                      );
                      const isRequested = pendingForThisRow.length > 0;
                      const permittedDoctorsForRow = HOSPITAL_DOCTORS.filter(
                        (d) =>
                          !revokedDoctorsForCurrentPatient.has(d.id) &&
                          Boolean(
                            authorizedByPatientAndDoctor[currentPatient.id]?.[d.id]?.has(
                              row.tideTag
                            )
                          )
                      );

                      return (
                        <div
                          key={row.id}
                          onClick={() => {
                            if (isRequested) {
                              setShowBellModal(true);
                            } else {
                              handleToggleTagAccess(row);
                            }
                          }}
                          className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                            isGranted
                              ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                              : isRequested
                              ? 'bg-red-50/60 border-red-300 hover:bg-red-50'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 mt-0.5 relative">
                              {getCategoryIcon(row.vietnameseCategory)}
                              {isRequested && (
                                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center absolute -top-1.5 -right-1.5 shadow">
                                  <BellRing className="w-2.5 h-2.5 animate-bounce" />
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="text-xs font-bold text-slate-900">{rCat(row)}</h3>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                    getAlertMeta(getRowAlertLevel(row)).badgeClass
                                  }`}
                                >
                                  {lang === 'vi'
                                    ? getAlertMeta(getRowAlertLevel(row)).labelVi
                                    : getAlertMeta(getRowAlertLevel(row)).labelEn}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{rTitle(row)}</p>

                              {/* Show exactly which specific doctor(s) are currently authorized to view this record */}
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                {permittedDoctorsForRow.length > 0 ? (
                                  permittedDoctorsForRow.map((d) => (
                                    <span
                                      key={d.id}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200"
                                    >
                                      👁️{' '}
                                      {lang === 'vi'
                                        ? `Chỉ ${d.name} được xem`
                                        : `Only ${d.nameEn} can view`}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    🔒{' '}
                                    {t(
                                      'Chưa bác sĩ nào được xem (Muốn xem phải gửi yêu cầu)',
                                      'No doctor can view (Must request access)'
                                    )}
                                  </span>
                                )}
                              </div>

                              {isRequested && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                                    <BellRing className="w-3 h-3" />
                                    {lang === 'vi'
                                      ? `🔔 Yêu cầu mở riêng cho: ${pendingForThisRow
                                          .map((r) => r.doctorNameVi)
                                          .join(', ')} (Bấm để duyệt)`
                                      : `🔔 Request exclusively from: ${pendingForThisRow
                                          .map((r) => r.doctorNameEn)
                                          .join(', ')} (Click to approve)`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTagAccess(row);
                            }}
                            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              isGranted
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-blue-600 hover:text-white'
                            }`}
                          >
                            {isGranted ? (
                              <>
                                <Unlock className="w-3 h-3 stroke-[2.5]" />
                                {t('Đang mở (BS chính)', 'Unlocked (Primary)')}
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                {t('Đang khóa', 'Locked')}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 2: CỔNG BÁC SĨ (DOCTOR PORTAL)
        ===================================================================== */}
        {portal === 'DOCTOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 3 COLS */}
            <div className="lg:col-span-3">
              {renderDoctorListWithManagedPatientsSidebar()}
            </div>

            {/* RIGHT 9 COLS */}
            <div className="lg:col-span-9 space-y-5">
              {/* Doctor Role & Scope Banner — Exact 3-Row Layout as Wireframe */}
              <div
                className={`rounded-2xl p-5 space-y-3.5 shadow-sm border-2 ${
                  isPrimaryMonitoringDoctor
                    ? 'bg-white border-blue-300'
                    : 'bg-sky-50/60 border-sky-400'
                }`}
              >
                {/* ROW 1: LEFT AVATAR SQUARE + RIGHT PATIENT/DOCTOR INFO BOX */}
                <div className="flex items-center gap-4">
                  <img
                    src={getPatientAvatar(currentPatient.genderVi)}
                    alt={pName(currentPatient)}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-200 shadow-sm bg-slate-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-lg font-extrabold text-slate-900">
                        {t('Bệnh nhân:', 'Patient:')} {pName(currentPatient)}
                      </h1>
                      <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-600 text-white">
                        {currentPatient.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                        {currentPatient.age} {t('tuổi', 'yo')} • {pGender(currentPatient)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                          getAlertMeta(currentPatientAlert).badgeClass
                        }`}
                      >
                        {lang === 'vi'
                          ? getAlertMeta(currentPatientAlert).fullVi
                          : getAlertMeta(currentPatientAlert).fullEn}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {t('Khóa phiên:', 'Session Key:')} {activeDoctor.sweKey}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isPrimaryMonitoringDoctor
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-sky-200 text-sky-900'
                        }`}
                      >
                        {isPrimaryMonitoringDoctor
                          ? t(
                              `🩺 Bác sĩ Theo Dõi Chính: ${activeDoctor.name} (${activeDoctor.specialtyVi})`,
                              `🩺 Primary Monitoring Doctor: ${activeDoctor.nameEn} (${activeDoctor.specialtyEn})`
                            )
                          : t(
                              `🤝 Bác sĩ Chuyên Khoa Sửa Bệnh: ${activeDoctor.name} (${activeDoctor.specialtyVi})`,
                              `🤝 Referred Specialist Doctor: ${activeDoctor.nameEn} (${activeDoctor.specialtyEn})`
                            )}
                      </span>

                      {/* 4-tier Clinical Condition Alert Selector for Doctor */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-600 mr-1">
                          {t('Cảnh báo tình trạng bệnh:', 'Condition Alert:')}
                        </span>
                        {(['NHE', 'CAN_CHU_Y', 'NANG', 'NGUY_CAP'] as ConditionAlertLevel[]).map(
                          (lvl) => {
                            const meta = getAlertMeta(lvl);
                            const active = currentPatientAlert === lvl;
                            return (
                              <button
                                key={lvl}
                                onClick={() => handleChangePatientAlertLevel(lvl)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  active
                                    ? `${meta.bannerClass} shadow-sm scale-105`
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {lang === 'vi' ? meta.labelVi : meta.labelEn}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isCurrentDoctorRevoked && (
                  <div className="w-full px-4 py-3 rounded-xl bg-red-600 text-white text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md">
                    <span>
                      🚫{' '}
                      {t(
                        `BỆNH NHÂN ĐÃ CHỈ ĐỊNH THU HỒI QUYỀN XEM CỦA ${activeDoctor.name}: Bác sĩ này hiện không được phép xem bất kỳ bệnh án nào của ${currentPatient.name}!`,
                        `PATIENT REVOKED ACCESS FOR ${activeDoctor.nameEn}: This doctor is blocked from viewing any records of ${currentPatient.nameEn}!`
                      )}
                    </span>
                    <button
                      onClick={() => setShowRevokeModal(true)}
                      className="px-3 py-1 rounded-lg bg-white text-red-700 font-extrabold text-[11px] hover:bg-red-50 transition-all"
                    >
                      {t('Mở cửa sổ chỉ định Bác sĩ ➔', 'Open Doctor Revocation Modal ➔')}
                    </button>
                  </div>
                )}

                {/* ROW 2: FULL-WIDTH HORIZONTAL SCOPE & CORRELATION BOX */}
                <div className="w-full px-4 py-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-slate-700 leading-relaxed">
                  {isPrimaryMonitoringDoctor ? (
                    <span>
                      👁️{' '}
                      <strong className="text-blue-900">
                        {t(
                          'Quy định Bác sĩ theo dõi chính (Xem đa bệnh tổng thể):',
                          'Primary Monitoring Doctor Rule (Holistic Multi-Disease View):'
                        )}
                      </strong>{' '}
                      {t(
                        `BS theo dõi chính ${activeDoctor.name} được yêu cầu & xem toàn bộ các bệnh liên quan`,
                        `Primary Doctor ${activeDoctor.nameEn} can request & view all related diseases`
                      )}{' '}
                      <strong className="text-blue-800">[{pChain(currentPatient)}]</strong>.{' '}
                      {t(
                        'Khi bác sĩ gửi yêu cầu được duyệt, chỉ riêng bác sĩ đó xem được — các bác sĩ khác muốn xem phải tự gửi yêu cầu!',
                        'When a doctor’s request is approved, ONLY that requesting doctor can view it — other doctors must request separately!'
                      )}
                    </span>
                  ) : (
                    <span>
                      🔒{' '}
                      <strong className="text-sky-900">
                        {t(
                          `Quy định Bác sĩ Chuyên khoa (${activeDoctor.name} — ${activeDoctor.specialtyVi}):`,
                          `Specialist Doctor Rule (${activeDoctor.nameEn} — ${activeDoctor.specialtyEn}):`
                        )}
                      </strong>{' '}
                      {t(
                        `Bác sĩ chuyên khoa được phép yêu cầu & xem TẤT CẢ các bệnh (1 hoặc nhiều bệnh, hiện có ${allowedSpecialtyTagsForActiveSecondaryDoctor.size}/4 bệnh) có liên quan đến chuyên khoa [${activeDoctor.specialtyVi}] của mình. Các bệnh không liên quan đến chuyên khoa vẫn bị khóa!`,
                        `Specialist doctors can request & view ALL diseases (1 or multiple, currently ${allowedSpecialtyTagsForActiveSecondaryDoctor.size}/4 records) related to their specialty [${activeDoctor.specialtyEn}]. Unrelated specialty records remain locked!`
                      )}
                    </span>
                  )}
                </div>

                {/* ROW 3: ACTION BUTTONS AT THE BOTTOM */}
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <button
                    onClick={handleDoctorRequestAllRelated}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                      pendingCount > 0
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {pendingCount > 0 ? (
                      <BellRing className="w-4 h-4 animate-bounce" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {pendingCount > 0
                      ? t(
                          `🔔 Đã gửi yêu cầu mở khóa (${pendingCount} yêu cầu) tới BN ${pName(currentPatient)}`,
                          `🔔 Sent Unlock Request (${pendingCount} pending) to ${pName(currentPatient)}`
                        )
                      : isPrimaryMonitoringDoctor
                      ? t(
                          `📨 Yêu cầu BN mở khóa các bệnh liên quan (Cho riêng ${activeDoctor.name})`,
                          `📨 Request Patient to Unlock Related Records (For ${activeDoctor.nameEn})`
                        )
                      : t(
                          `📨 Yêu cầu BN mở khóa các bệnh liên quan chuyên khoa (${allowedSpecialtyTagsForActiveSecondaryDoctor.size} bệnh — ${activeDoctor.specialtyVi})`,
                          `📨 Request Unlock for All Specialty-Related Records (${allowedSpecialtyTagsForActiveSecondaryDoctor.size} records — ${activeDoctor.specialtyEn})`
                        )}
                  </button>

                  {!isPrimaryMonitoringDoctor && (
                    <button
                      onClick={() => setActiveDoctorId(currentPatient.primaryDoctorId)}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition-all"
                    >
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      {t(
                        `Đổi sang BS chính (${currentPatient.primaryDoctorName})`,
                        `Switch to Primary Doctor (${currentPatient.primaryDoctorNameEn})`
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setPortal('PATIENT');
                      if (pendingCount > 0) setShowBellModal(true);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      pendingCount > 0
                        ? 'bg-red-600 hover:bg-red-700 text-white border border-red-300 animate-pulse'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {pendingCount > 0 && (
                      <BellRing className="w-4 h-4 text-white animate-bounce" />
                    )}
                    {pendingCount > 0
                      ? t(
                          `Sang BN duyệt ${pendingCount} yêu cầu ngay ➔`,
                          `Switch to Patient to Approve ${pendingCount} Requests ➔`
                        )
                      : t(
                          `Sang Hồ sơ BN (${currentPatient.id}) ➔`,
                          `Go to Patient Profile (${currentPatient.id}) ➔`
                        )}
                  </button>
                </div>

                {(requestSentBanner || pendingCount > 0) && (
                  <div className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {requestSentBanner ||
                          t(
                            `Đã gửi ${pendingCount} yêu cầu mở khóa bệnh liên quan tới Bệnh nhân ${currentPatient.name} (${currentPatient.id}).`,
                            `Sent ${pendingCount} related record unlock requests to Patient ${currentPatient.nameEn} (${currentPatient.id}).`
                          )}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setPortal('PATIENT');
                        setShowBellModal(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <BellRing className="w-3 h-3 animate-bounce" />
                      {t('Mở hộp thoại BN đồng ý ngay ➔', 'Open Patient Approval Modal ➔')}
                    </button>
                  </div>
                )}
              </div>

              {/* SƠ ĐỒ KHÁM CỦA CÁC BÁC SĨ QUẢN LÝ & MỨC ĐỘ HOÀN THÀNH */}
              {renderDoctorCareDiagram(true)}

              {/* 4 Medical Cards of the Selected Patient */}
              <div className="space-y-4">
                {encryptedRows.map((row) => {
                  const decrypted = decryptedViews[row.tideTag];
                  const isUnlockedForActiveDoctor = Boolean(decrypted);
                  const reqKeyForActiveDoc = `${activeDoctor.id}__${row.tideTag}`;
                  const isPending = Boolean(pendingRequests[reqKeyForActiveDoc]);
                  const isAllowedSpecialtyForDoctor =
                    isPrimaryMonitoringDoctor ||
                    allowedSpecialtyTagsForActiveSecondaryDoctor.has(row.tideTag);
                  const errorMsg = clinicianErrors[row.tideTag];

                  const specialistStage = currentCareStages.find(
                    (st) => st.targetTideTag === row.tideTag && st.roleType !== 'PRIMARY_MONITOR'
                  );

                  // Check if another doctor is permitted to view this record while the current doctor is NOT
                  const otherPermittedDocs = HOSPITAL_DOCTORS.filter(
                    (d) =>
                      d.id !== activeDoctor.id &&
                      !revokedDoctorsForCurrentPatient.has(d.id) &&
                      Boolean(
                        authorizedByPatientAndDoctor[currentPatient.id]?.[d.id]?.has(
                          row.tideTag
                        )
                      )
                  );

                  return (
                    <div
                      key={row.id}
                      className={`rounded-2xl p-5 border transition-all ${
                        isUnlockedForActiveDoctor
                          ? 'bg-white border-blue-300 shadow-md'
                          : isPending
                          ? 'bg-red-50/30 border-2 border-red-200 shadow-sm'
                          : !isAllowedSpecialtyForDoctor
                          ? 'bg-slate-100/70 border-slate-200 opacity-85'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            {getCategoryIcon(row.vietnameseCategory)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-extrabold text-slate-900">{rCat(row)}</h3>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                  getAlertMeta(getRowAlertLevel(row)).badgeClass
                                }`}
                              >
                                {lang === 'vi'
                                  ? getAlertMeta(getRowAlertLevel(row)).fullVi
                                  : getAlertMeta(getRowAlertLevel(row)).fullEn}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {rTitle(row)} • {rFac(row)}
                            </p>
                          </div>
                        </div>

                        {isCurrentDoctorRevoked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm">
                            <XCircle className="w-4 h-4" />
                            {t(
                              `BỆNH NHÂN ĐÃ CHẶN ${activeDoctor.name.toUpperCase()}`,
                              `REVOKED BY PATIENT (${activeDoctor.nameEn.toUpperCase()})`
                            )}
                          </span>
                        ) : isUnlockedForActiveDoctor ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            {isPrimaryMonitoringDoctor
                              ? t(
                                  `CHỈ ${activeDoctor.name.toUpperCase()} ĐANG ĐƯỢC XEM`,
                                  `UNLOCKED FOR ${activeDoctor.nameEn.toUpperCase()}`
                                )
                              : t(
                                  `BỆNH LIÊN QUAN CHUYÊN KHOA — MỞ RIÊNG CHO ${activeDoctor.name.toUpperCase()}`,
                                  `SPECIALTY-RELATED — UNLOCKED FOR ${activeDoctor.nameEn.toUpperCase()}`
                                )}
                          </span>
                        ) : !isAllowedSpecialtyForDoctor ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <Lock className="w-3.5 h-3.5 text-red-600" />
                            {t(
                              `KHÓA NGOÀI CHUYÊN KHOA (${activeDoctor.specialtyVi})`,
                              `OUTSIDE SPECIALTY (${activeDoctor.specialtyEn})`
                            )}
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            <BellRing className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                            {t(
                              `ĐÃ GỬI YÊU CẦU MỞ RIÊNG CHO ${activeDoctor.name.toUpperCase()}`,
                              `REQUEST SENT FOR ${activeDoctor.nameEn.toUpperCase()}`
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3.5 h-3.5 text-red-600" />
                            {t(
                              `BỆNH LIÊN QUAN CHUYÊN KHOA (ĐANG KHÓA VỚI ${activeDoctor.name.toUpperCase()})`,
                              `SPECIALTY-RELATED (LOCKED FOR ${activeDoctor.nameEn.toUpperCase()})`
                            )}
                          </span>
                        )}
                      </div>

                      {isUnlockedForActiveDoctor && decrypted ? (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            {decrypted.metrics.map((m, idx) => (
                              <div
                                key={idx}
                                className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3"
                              >
                                <div className="text-xs text-slate-500">
                                  {lang === 'vi' ? m.label : m.labelEn || m.label}
                                </div>
                                <div className="text-base font-extrabold text-blue-900 mt-0.5">
                                  {lang === 'vi' ? m.value : m.valueEn || m.value}{' '}
                                  <span className="text-xs font-normal text-slate-500">
                                    {lang === 'vi' ? m.unit : m.unitEn || m.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                            <p className="text-slate-800 leading-relaxed">
                              <strong className="text-blue-700">
                                {t('Tình trạng sức khỏe chi tiết:', 'Detailed Clinical Diagnosis:')}
                              </strong>{' '}
                              {lang === 'vi'
                                ? decrypted.vietnameseDiagnosis
                                : decrypted.plaintextDiagnosis}
                            </p>
                            <p className="text-slate-700 font-medium">
                              <strong className="text-red-600">
                                {t('Thuốc & Phác đồ điều trị:', 'Medication & Treatment Plan:')}
                              </strong>{' '}
                              {lang === 'vi' ? decrypted.vietnamesePlan : decrypted.medicationOrPlan}
                            </p>
                          </div>

                          {isPrimaryMonitoringDoctor && specialistStage && (
                            <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs space-y-0.5">
                                <div className="font-extrabold text-sky-950 flex items-center gap-1.5">
                                  <Stethoscope className="w-4 h-4 text-sky-600" />
                                  <span>
                                    {t('Phối hợp Chuyên khoa: Cần', 'Specialty Referral: Requires')}{' '}
                                    <strong>
                                      {lang === 'vi'
                                        ? `${specialistStage.doctorName} (${specialistStage.specialtyVi})`
                                        : `${specialistStage.doctorNameEn} (${specialistStage.specialtyEn})`}
                                    </strong>{' '}
                                    {t('trực tiếp điều trị bệnh này', 'to treat this condition')}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  {t(
                                    `Một bác sĩ không thể chữa tất cả các bệnh — khi gửi yêu cầu, ${specialistStage.doctorName} sẽ chỉ xem được đúng bệnh [${row.vietnameseCategory}] này.`,
                                    `One doctor cannot treat all specialties — when referred, ${specialistStage.doctorNameEn} will ONLY be able to view [${row.category}].`
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {!specialistStage.isReferred ? (
                                  <button
                                    onClick={() => handleReferToSpecialistDoctor(specialistStage)}
                                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    {t(
                                      `Gửi yêu cầu đến ${specialistStage.doctorName} (Chỉ mở bệnh này)`,
                                      `Refer to ${specialistStage.doctorNameEn} (1-disease scope)`
                                    )}
                                  </button>
                                ) : (
                                  <>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                                      {t(
                                        `✅ Đã giao ${specialistStage.doctorName} (Tiến độ: ${specialistStage.completionPercent}%)`,
                                        `✅ Assigned to ${specialistStage.doctorNameEn} (${specialistStage.completionPercent}%)`
                                      )}
                                    </span>
                                    <button
                                      onClick={() => setActiveDoctorId(specialistStage.doctorId)}
                                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                                    >
                                      {t(
                                        `Xem góc nhìn ${specialistStage.doctorName} ➔`,
                                        `Switch to ${specialistStage.doctorNameEn} ➔`
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {!isPrimaryMonitoringDoctor &&
                            specialistStage &&
                            specialistStage.doctorId === activeDoctor.id && (
                              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs">
                                  <div className="font-extrabold text-emerald-950">
                                    {t(
                                      `🛠️ Góc nhìn Bác sĩ Chuyên khoa (${activeDoctor.name}): Điều trị & Cập nhật tiến độ bệnh này`,
                                      `🛠️ Specialist View (${activeDoctor.nameEn}): Treat & Update Completion Progress`
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    {t('Mức độ hoàn thành hiện tại:', 'Current completion:')}{' '}
                                    <strong>{specialistStage.completionPercent}%</strong>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateStageProgress(
                                        specialistStage,
                                        specialistStage.completionPercent + 20
                                      )
                                    }
                                    disabled={specialistStage.completionPercent >= 100}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all"
                                  >
                                    {t('+20% Tiến độ điều trị', '+20% Treatment Progress')}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStageProgress(specialistStage, 100)}
                                    disabled={specialistStage.completionPercent >= 100}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all"
                                  >
                                    {t('✅ Đánh dấu Hoàn thành 100%', '✅ Mark 100% Complete')}
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          {row.correlationSignal && isAllowedSpecialtyForDoctor && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 leading-relaxed">
                              {lang === 'vi'
                                ? row.correlationSignal.viSummary
                                : row.correlationSignal.enSummary}
                            </div>
                          )}

                          {otherPermittedDocs.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                              🔐{' '}
                              {lang === 'vi'
                                ? `Bệnh án này hiện CHỈ mở cho [${otherPermittedDocs
                                    .map((d) => d.name)
                                    .join(', ')}]. Bác sĩ ${activeDoctor.name} chưa được cấp quyền xem!`
                                : `This record is currently ONLY unlocked for [${otherPermittedDocs
                                    .map((d) => d.nameEn)
                                    .join(', ')}]. ${activeDoctor.nameEn} does NOT have access!`}
                            </div>
                          )}

                          {isAllowedSpecialtyForDoctor ? (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => handleDoctorSendUnlockRequest(row)}
                                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                    isPending
                                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  <BellRing className={`w-3.5 h-3.5 ${isPending ? 'animate-bounce' : ''}`} />
                                  {isPending
                                    ? t(
                                        `🔔 Đã gửi yêu cầu mở riêng cho ${activeDoctor.name}`,
                                        `🔔 Request Sent Exclusively for ${activeDoctor.nameEn}`
                                      )
                                    : t(
                                        `📨 Yêu cầu BN mở khóa hồ sơ này (Chỉ cho ${activeDoctor.name})`,
                                        `📨 Request Patient to Unlock (Exclusively for ${activeDoctor.nameEn})`
                                      )}
                                </button>

                                {isPending && (
                                  <button
                                    onClick={() => {
                                      setPortal('PATIENT');
                                      setShowBellModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all animate-pulse"
                                  >
                                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                                    {t(
                                      `Mở chuông duyệt bên BN (${currentPatient.id}) ➔`,
                                      `Open Approval on Patient (${currentPatient.id}) ➔`
                                    )}
                                  </button>
                                )}

                                {isPrimaryMonitoringDoctor &&
                                  specialistStage &&
                                  !specialistStage.isReferred && (
                                    <button
                                      onClick={() => handleReferToSpecialistDoctor(specialistStage)}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all"
                                    >
                                      <Send className="w-3.5 h-3.5 text-sky-600" />
                                      {t(
                                        `Nhờ ${specialistStage.doctorName} (${specialistStage.specialtyVi}) sửa bệnh này`,
                                        `Refer to ${specialistStage.doctorNameEn} (${specialistStage.specialtyEn})`
                                      )}
                                    </button>
                                  )}
                              </div>

                              <button
                                onClick={() => handleAttemptUnauthorizedDecrypt(row)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 transition-all"
                              >
                                {t(
                                  'Thử tự mở không xin phép',
                                  'Attempt Unauthorized Decrypt'
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200">
                              <span className="text-xs font-bold text-slate-600">
                                🚫{' '}
                                {t(
                                  `Bệnh [${row.vietnameseCategory}] không thuộc phạm vi chuyên khoa [${activeDoctor.specialtyVi}] nên ${activeDoctor.name} không được phép xem hay yêu cầu mở khóa!`,
                                  `Record [${row.category}] is outside the specialty scope of [${activeDoctor.specialtyEn}], so ${activeDoctor.nameEn} cannot view or request it!`
                                )}
                              </span>
                              <button
                                onClick={() => handleAttemptUnauthorizedDecrypt(row)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-300 transition-all shrink-0"
                              >
                                {t(
                                  'Thử tự mở (Sẽ bị chặn)',
                                  'Attempt Decrypt (Blocked)'
                                )}
                              </button>
                            </div>
                          )}

                          {errorMsg && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>{errorMsg}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Treatment Note */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  {t(
                    `Cập nhật Quá trình Điều trị của ${activeDoctor.name} cho BN ${currentPatient.name} (${currentPatient.id})`,
                    `Add E2EE Treatment Note by ${activeDoctor.nameEn} for ${currentPatient.nameEn} (${currentPatient.id})`
                  )}
                </h3>
                <form
                  onSubmit={handleDoctorAddTreatmentNote}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    value={newDoctorNote}
                    onChange={(e) => setNewDoctorNote(e.target.value)}
                    placeholder={t(
                      `Nhập ghi chú khám / sửa phác đồ của ${activeDoctor.name} (${activeDoctor.specialtyVi})...`,
                      `Enter clinical note or treatment adjustment from ${activeDoctor.nameEn} (${activeDoctor.specialtyEn})...`
                    )}
                    className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shrink-0 transition-all"
                  >
                    {t('Lưu & Mã hóa E2EE', 'Save & Encrypt E2EE')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 3: CỔNG QUẢN TRỊ VIÊN (ADMIN PORTAL)
        ===================================================================== */}
        {portal === 'ADMIN' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                      {t(
                        'Cổng Quản Trị Viên Bệnh Viện (System Admin)',
                        'Hospital System Administrator Portal'
                      )}
                    </span>
                    <span className="text-xs font-mono text-red-600 font-bold">
                      {t(
                        'Master Key trên Server: KHÔNG TỒN TẠI (0 Shards)',
                        'Server Master Key: NON-EXISTENT (0 Shards)'
                      )}
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                    {t(
                      'Quản Lý Danh Sách 20 Bệnh Nhân & 6 Bác Sĩ Chuyên Khoa Đang Theo Dõi',
                      'Operational Roster of 20 Patients & 6 Assigned Specialist Doctors'
                    )}
                  </h1>
                </div>
              </div>

              <button
                onClick={handleSimulateAdminInspect}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm shrink-0"
              >
                {t(
                  `⚡ Thử Dùng Quyền Root Admin Giải Mã Bệnh Án (${currentPatient.id})`,
                  `⚡ Attempt Root Admin Decryption (${currentPatient.id})`
                )}
              </button>
            </div>

            {/* 6 Doctors Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {HOSPITAL_DOCTORS.map((doc) => {
                const isSelectedDoc = selectedDoctorFilter === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() =>
                      setSelectedDoctorFilter(isSelectedDoc ? 'ALL' : doc.id)
                    }
                    className={`cursor-pointer p-3 rounded-xl border transition-all ${
                      isSelectedDoc
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div
                      className={`text-xs font-extrabold ${
                        isSelectedDoc ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {dName(doc)}
                    </div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelectedDoc ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {dSpec(doc)}
                    </div>
                    <div
                      className={`mt-1.5 text-[10px] font-mono font-bold ${
                        isSelectedDoc ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      {t(
                        `Đang theo dõi: ${doc.patientCount} BN`,
                        `Monitoring: ${doc.patientCount} Patients`
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT 7 COLS: BẢNG DANH SÁCH 20 BỆNH NHÂN */}
              <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      {t(
                        '✅ Dữ liệu Điều phối Vận hành (Admin được phép kiểm soát)',
                        '✅ Operational Roster Metadata (Permitted for Admin)'
                      )}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {t(
                        `Danh sách 20 Bệnh nhân & Bác sĩ đang theo dõi (${filteredPatients.length} BN)`,
                        `20 Patients & Assigned Monitoring Doctors (${filteredPatients.length} Patients)`
                      )}
                    </h2>
                  </div>

                  {selectedDoctorFilter !== 'ALL' && (
                    <button
                      onClick={() => setSelectedDoctorFilter('ALL')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {t('Xem tất cả 20 BN', 'Show all 20 Patients')}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {filteredPatients.map((item) => {
                    const isSelected = currentPatient.id === item.id;
                    const activeCount =
                      authorizedByPatientAndDoctor[item.id]?.[item.primaryDoctorId]?.size || 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedPatientId(item.id)}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getPatientAvatar(item.genderVi)}
                              alt={pName(item)}
                              className="w-8 h-8 rounded-full object-cover border border-slate-300 bg-slate-200 shrink-0"
                            />
                            <span className="text-sm font-extrabold text-slate-900">
                              {pName(item)} ({item.age} {t('tuổi', 'yo')}, {pGender(item)})
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                              {item.id}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {pStatus(item)}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700">
                          <div>
                            <strong className="text-slate-500">
                              {t('BS theo dõi chính:', 'Primary Doctor:')}
                            </strong>{' '}
                            <span className="text-blue-700 font-bold">{pDocName(item)}</span> (
                            {pDocSpec(item)})
                          </div>
                          <div>
                            <strong className="text-slate-500">
                              {t('BS phối hợp:', 'Co-Doctors:')}
                            </strong>{' '}
                            {lang === 'vi' ? item.coDoctorsVi : item.coDoctorsEn}
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>
                            {t('Số lượng mô-đun bệnh án E2EE: 4 mô-đun', 'E2EE Medical Modules: 4')}
                          </span>
                          <span className="font-bold text-slate-800">
                            {t(
                              `Trạng thái TideCloak: Mở ${activeCount}/4 cho Bác sĩ`,
                              `TideCloak Policy: ${activeCount}/4 Unlocked for Doctor`
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT 5 COLS: NỘI DUNG BỆNH TÌNH & ĐƠN THUỐC (ADMIN BỊ CHẶN 100%) */}
              <div className="lg:col-span-5 rounded-2xl bg-white border-2 border-red-200 p-5 space-y-4 shadow-sm h-fit">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                    {t(
                      '🔒 Nội dung Bệnh án & Điều trị (Được bảo vệ bởi TideCloak)',
                      '🔒 Clinical Diagnoses & Medications (Protected by TideCloak)'
                    )}
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {t(
                      `Chi tiết Bệnh tình & Thuốc của ${currentPatient.name} (${currentPatient.id})`,
                      `Clinical Records & Prescriptions of ${currentPatient.nameEn} (${currentPatient.id})`
                    )}
                  </h2>
                </div>

                <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-red-700">
                    <FileLock2 className="w-4 h-4 text-red-600" />
                    {t(
                      'ADMIN BIẾT AI KHÁM AI — NHƯNG MÙ HOÀN TOÀN VỀ BỆNH LÝ & THUỐC!',
                      'ADMIN SEES ROSTER ASSIGNMENTS — ZERO ACCESS TO DIAGNOSES OR MEDICATIONS!'
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {t(
                      `Admin biết ${currentPatient.name} đang được theo dõi bởi ${currentPatient.primaryDoctorName}, nhưng hoàn toàn không có khóa phiên TideCloak để giải mã tình trạng bệnh, đơn thuốc (${currentPatient.medications.length} loại) hay quá trình điều trị bên dưới:`,
                      `Admin knows ${currentPatient.nameEn} is monitored by ${currentPatient.primaryDoctorNameEn}, but holds zero TideCloak session keys to decrypt diagnoses, medications (${currentPatient.medications.length} items), or treatment notes below:`
                    )}
                  </p>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  {encryptedRows.map((row) => (
                    <div
                      key={row.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-900 font-bold font-sans text-xs">
                          {rCat(row)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                          🔒 CIPHERTEXT
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <strong>{t('Bệnh tình & Thuốc:', 'Diagnosis & Rx:')}</strong>{' '}
                        <span className="text-red-600 break-all">
                          [ENCRYPTED: {row.ciphertextHex.slice(0, 48)}...]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {adminBreachReport && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 border-2 border-red-500 text-xs font-mono space-y-1.5 shadow-md">
                    <div className="flex items-center justify-between text-red-400 font-extrabold">
                      <span>
                        🛡️ {t('KẾT QUẢ GỌI API TIDECLOAK (12/12 MPC NODES):', 'TIDECLOAK API RESPONSE (12/12 MPC NODES):')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px]">
                        {t(`Lần #${adminAttackCount}`, `Attempt #${adminAttackCount}`)} • {adminBreachReport.timestamp}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-300 truncate">
                      {adminBreachReport.tideFabricResponseCode}
                    </div>
                    <div className="text-emerald-400 font-bold">
                      {t(
                        `Số lượng bệnh án hay đơn thuốc của ${currentPatient.name} bị lộ cho Admin: `,
                        `Plaintext medical records or prescriptions of ${currentPatient.nameEn} exposed to Admin: `
                      )}
                      <strong className="underline">0 BYTES</strong>
                    </div>
                    <button
                      onClick={() => setShowAdminAttackModal(true)}
                      className="mt-1 w-full py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-sans font-bold text-[11px] transition-all"
                    >
                      {t('Xem chi tiết Log API & WebCrypto 4 bản ghi ➔', 'View Detailed API & WebCrypto Log (4 Records) ➔')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =======================================================================
          FOOTER: CLEAN HOSPITAL STATUS BAR
      ======================================================================= */}
      <footer className="border-t border-slate-200 bg-white px-6 py-3 mt-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <strong className="text-slate-800">
              {t('Nhật ký Bảo mật TideCloak:', 'TideCloak Security Audit:')}
            </strong>
            <span className="text-blue-700 font-medium">
              {auditLogs[0]?.message ||
                t(
                  'Hệ thống sẵn sàng (20 Bệnh nhân • 6 Bác sĩ)',
                  'System Ready (20 Patients • 6 Specialist Doctors)'
                )}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {t(
              'CarePass E2EE • 20 Bệnh Nhân (BN-101..BN-120) • 6 Bác Sĩ Chuyên Khoa',
              'CarePass E2EE • 20 Patients (BN-101..BN-120) • 6 Specialist Doctors'
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
