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
  PatientProfile,
  PatientTimelineStep,
  DoctorCareStage,
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

interface DoctorUnlockRequest {
  patientId: string;
  tideTag: string;
  categoryVi: string;
  doctorName: string;
  reasonVi: string;
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

  // Encrypted rows for the currently selected patient
  const [encryptedRows, setEncryptedRows] = useState<EncryptedDatabaseRow[]>([]);

  // Per-patient set of authorized tags for the Primary Monitoring Doctor
  const [authorizedByPatient, setAuthorizedByPatient] = useState<Record<string, Set<string>>>(
    () => {
      const initial: Record<string, Set<string>> = {};
      for (const p of ALL_20_PATIENTS) {
        initial[p.id] = new Set([`patient:${p.id.toLowerCase()}:primary`]);
      }
      return initial;
    }
  );

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

  // Per-patient pending unlock requests from doctors to patients
  const [requestsByPatient, setRequestsByPatient] = useState<
    Record<string, Record<string, DoctorUnlockRequest>>
  >(() => ({
    'BN-101': {
      'patient:bn-101:related': {
        patientId: 'BN-101',
        tideTag: 'patient:bn-101:related',
        categoryVi: 'Tâm thần học (Bệnh gốc gây Béo phì)',
        doctorName: 'BS. Alice Nguyễn',
        reasonVi:
          'Cần theo dõi tình trạng Trầm cảm & thuốc Sertraline để điều trị tận gốc chứng ăn đêm gây Béo phì (BMI 31.2) và Cao huyết áp (145/92).',
        requestedAt: 'Vừa xong',
      },
    },
  }));

  const [decryptedViews, setDecryptedViews] = useState<Record<string, DecryptedRecordView>>({});
  const [clinicianErrors, setClinicianErrors] = useState<Record<string, string>>({});
  const [adminBreachReport, setAdminBreachReport] = useState<AdminBreachSimulationResult | null>(
    null
  );
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

  // Overall treatment completion % for the current patient across their managing doctors
  const overallCompletionPercent = useMemo(() => {
    if (!currentCareStages.length) return 0;
    const sum = currentCareStages.reduce((acc, st) => acc + st.completionPercent, 0);
    return Math.round(sum / currentCareStages.length);
  }, [currentCareStages]);

  // Is the currently active doctor in Doctor Portal the Primary Monitoring Doctor of currentPatient?
  const isPrimaryMonitoringDoctor = activeDoctor.id === currentPatient.primaryDoctorId;

  // Or is the currently active doctor a Referred Specialist Doctor for a specific disease of currentPatient?
  const specialistStagesForActiveDoctor = useMemo(
    () =>
      currentCareStages.filter(
        (st) =>
          st.roleType !== 'PRIMARY_MONITOR' &&
          st.doctorId === activeDoctor.id &&
          st.isReferred
      ),
    [currentCareStages, activeDoctor.id]
  );

  // Effective tags that the activeDoctor is allowed to decrypt for currentPatient:
  // - Primary Monitoring Doctor: sees all tags unlocked by the patient (can see multiple diseases)
  // - Specialist Doctor: ONLY sees the specific targetTideTag(s) referred to their specialty!
  const effectiveDoctorTags = useMemo(() => {
    const patientUnlocked = authorizedByPatient[currentPatient.id] || new Set<string>();
    if (isPrimaryMonitoringDoctor) {
      return patientUnlocked;
    }
    const scopedTags = new Set<string>();
    for (const st of specialistStagesForActiveDoctor) {
      scopedTags.add(st.targetTideTag);
    }
    return scopedTags;
  }, [
    authorizedByPatient,
    currentPatient.id,
    isPrimaryMonitoringDoctor,
    specialistStagesForActiveDoctor,
  ]);

  const authorizedTags = useMemo(
    () => authorizedByPatient[currentPatient.id] || new Set<string>(),
    [authorizedByPatient, currentPatient.id]
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
        p.primaryDoctorName.toLowerCase().includes(q) ||
        p.primarySpecialtyVi.toLowerCase().includes(q) ||
        p.rootCauseChainVi.toLowerCase().includes(q);
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

  // Encrypt the selected patient's 4 medical records with Web Crypto AES-256-GCM
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
    }
    encryptCurrentPatientRecords();
    return () => {
      mounted = false;
    };
  }, [currentPatient]);

  // Sync Clinician Decryption based on effectiveDoctorTags (Primary Doctor sees multi-disease; Specialist sees ONLY their 1 disease)
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

  const getDefaultReasonVi = (row: EncryptedDatabaseRow) => {
    if (row.tideTag.endsWith(':related')) {
      return `Yêu cầu theo dõi tình trạng [${row.vietnameseCategory}] để điều trị tận gốc bệnh liên quan của BN ${currentPatient.name}.`;
    }
    if (row.tideTag.endsWith(':secondary')) {
      return `Yêu cầu theo dõi [${row.vietnameseCategory}] để phối hợp thuốc điều trị an toàn.`;
    }
    if (row.tideTag.endsWith(':primary')) {
      return `Yêu cầu mở khóa theo dõi tình trạng [${row.vietnameseCategory}].`;
    }
    return `Yêu cầu xem tiền sử trong [${row.vietnameseCategory}] phục vụ hội chẩn.`;
  };

  // Primary Monitoring Doctor sends an unlock request to the Patient
  const handleDoctorSendUnlockRequest = async (row: EncryptedDatabaseRow) => {
    const reasonVi = getDefaultReasonVi(row);

    setRequestsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: {
        ...(prev[currentPatient.id] || {}),
        [row.tideTag]: {
          patientId: currentPatient.id,
          tideTag: row.tideTag,
          categoryVi: row.vietnameseCategory,
          doctorName: currentPatient.primaryDoctorName,
          reasonVi,
          requestedAt: new Date().toLocaleTimeString(),
        },
      },
    }));

    await appendAuditLog(
      'CLINICIAN_SWE',
      'HOLISTIC_REQUEST',
      'SUCCESS',
      `${currentPatient.primaryDoctorName} gửi yêu cầu theo dõi tình trạng [${row.vietnameseCategory}] tới BN ${currentPatient.name}.`,
      row.tideTag
    );
  };

  // Primary Monitoring Doctor requests all related conditions for the current patient
  const handleDoctorRequestAllRelated = async () => {
    const currentReqs = { ...(requestsByPatient[currentPatient.id] || {}) };
    for (const row of encryptedRows) {
      if (!authorizedTags.has(row.tideTag) && !row.tideTag.endsWith(':private')) {
        currentReqs[row.tideTag] = {
          patientId: currentPatient.id,
          tideTag: row.tideTag,
          categoryVi: row.vietnameseCategory,
          doctorName: currentPatient.primaryDoctorName,
          reasonVi: getDefaultReasonVi(row),
          requestedAt: new Date().toLocaleTimeString(),
        };
      }
    }
    setRequestsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: currentReqs,
    }));

    await appendAuditLog(
      'CLINICIAN_SWE',
      'HOLISTIC_REQUEST',
      'SUCCESS',
      `${currentPatient.primaryDoctorName} gửi yêu cầu theo dõi toàn bộ các bệnh liên quan của BN ${currentPatient.name}.`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  // Primary Monitoring Doctor sends a Specialist Referral to the matching Specialist Doctor
  // The Specialist Doctor ONLY gets access to that 1 specific disease (targetTideTag)
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

    const newStep: PatientTimelineStep = {
      date: '22/10/2026 (Chuyển chuyên khoa)',
      titleVi: `Gửi yêu cầu Chuyên khoa: ${stage.doctorName} (${stage.specialtyVi})`,
      titleEn: `Specialist Referral: ${stage.doctorName}`,
      detailVi: `${currentPatient.primaryDoctorName} đã gửi yêu cầu cho ${stage.doctorName} điều trị riêng bệnh [${stage.diseaseCategoryVi}]. TideCloak chỉ cấp quyền cho ${stage.doctorName} xem đúng 1 bệnh này.`,
      detailEn: `Scoped access granted to ${stage.doctorName} for ${stage.diseaseCategoryVi} only.`,
      doctorName: `${currentPatient.primaryDoctorName} ➔ ${stage.doctorName}`,
    };
    setTimelinesByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: [newStep, ...(prev[currentPatient.id] || [])],
    }));

    await appendAuditLog(
      'CLINICIAN_SWE',
      'POLICY_GRANT',
      'SUCCESS',
      `${currentPatient.primaryDoctorName} gửi yêu cầu cho ${stage.doctorName} (${stage.specialtyVi}) sửa/điều trị bệnh [${stage.diseaseCategoryVi}] — Chỉ được xem đúng 1 bệnh này.`,
      stage.targetTideTag
    );
  };

  // Doctor updates completion % for their stage in the Patient's Care Pathway Diagram
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
        date: '22/10/2026 (Hoàn thành 100%)',
        titleVi: `Hoàn tất điều trị chuyên khoa: ${stage.diseaseCategoryVi}`,
        titleEn: `Completed Specialty Care: ${stage.diseaseCategoryVi}`,
        detailVi: `${stage.doctorName} (${stage.specialtyVi}) đã hoàn thành 100% phác đồ điều trị cho [${stage.diseaseTitleVi}].`,
        detailEn: `${stage.doctorName} completed 100% of treatment.`,
        doctorName: `${stage.doctorName} (${stage.specialtyVi})`,
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
      `${stage.doctorName} cập nhật mức độ hoàn thành khám/điều trị [${stage.diseaseCategoryVi}] lên ${clamped}%.`,
      stage.targetTideTag
    );
  };

  // Patient approves a specific Doctor request
  const handlePatientApproveRequest = async (tideTag: string) => {
    const nextAuthorized = new Set(authorizedTags);
    nextAuthorized.add(tideTag);
    setAuthorizedByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: nextAuthorized,
    }));

    const reqObj = pendingRequests[tideTag];
    setRequestsByPatient((prev) => {
      const copyForPatient = { ...(prev[currentPatient.id] || {}) };
      delete copyForPatient[tideTag];
      if (Object.keys(copyForPatient).length === 0) {
        setShowBellModal(false);
      }
      return { ...prev, [currentPatient.id]: copyForPatient };
    });

    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_GRANT',
      'SUCCESS',
      `BN ${currentPatient.name} ĐỒNG Ý mở khóa theo dõi [${reqObj?.categoryVi || tideTag}] cho ${currentPatient.primaryDoctorName}.`,
      tideTag
    );
  };

  // Patient approves ALL pending Doctor requests for their profile
  const handlePatientApproveAllRequests = async () => {
    const nextAuthorized = new Set(authorizedTags);
    Object.keys(pendingRequests).forEach((tag) => nextAuthorized.add(tag));
    setAuthorizedByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: nextAuthorized,
    }));
    setRequestsByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: {},
    }));
    setShowBellModal(false);

    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_GRANT',
      'SUCCESS',
      `BN ${currentPatient.name} ĐỒNG Ý TẤT CẢ yêu cầu theo dõi tình trạng của ${currentPatient.primaryDoctorName}.`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  // Patient rejects a Doctor request
  const handlePatientRejectRequest = async (tideTag: string) => {
    const reqObj = pendingRequests[tideTag];
    setRequestsByPatient((prev) => {
      const copyForPatient = { ...(prev[currentPatient.id] || {}) };
      delete copyForPatient[tideTag];
      if (Object.keys(copyForPatient).length === 0) {
        setShowBellModal(false);
      }
      return { ...prev, [currentPatient.id]: copyForPatient };
    });

    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_REVOKE',
      'DENIED',
      `BN ${currentPatient.name} đã TỪ CHỐI yêu cầu theo dõi [${reqObj?.categoryVi || tideTag}].`,
      tideTag
    );
  };

  const handleToggleTagAccess = async (row: EncryptedDatabaseRow) => {
    const tag = row.tideTag;
    const isGranted = authorizedTags.has(tag);
    const nextSet = new Set(authorizedTags);

    if (isGranted) {
      nextSet.delete(tag);
      setAuthorizedByPatient((prev) => ({
        ...prev,
        [currentPatient.id]: nextSet,
      }));
      await appendAuditLog(
        'PATIENT_SWE',
        'POLICY_REVOKE',
        'CRITICAL_BLOCK',
        `BN ${currentPatient.name} đã KHÓA quyền xem [${row.vietnameseCategory}] đối với ${currentPatient.primaryDoctorName}.`,
        tag
      );
    } else {
      nextSet.add(tag);
      setAuthorizedByPatient((prev) => ({
        ...prev,
        [currentPatient.id]: nextSet,
      }));
      setRequestsByPatient((prev) => {
        const copyForPatient = { ...(prev[currentPatient.id] || {}) };
        delete copyForPatient[tag];
        return { ...prev, [currentPatient.id]: copyForPatient };
      });
      await appendAuditLog(
        'PATIENT_SWE',
        'POLICY_GRANT',
        'SUCCESS',
        `BN ${currentPatient.name} đã MỞ KHÓA [${row.vietnameseCategory}] cho ${currentPatient.primaryDoctorName}.`,
        tag
      );
    }
  };

  const handleDoctorAddTreatmentNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorNote.trim()) return;
    const item: PatientTimelineStep = {
      date: '22/10/2026 (Hôm nay)',
      titleVi: isPrimaryMonitoringDoctor
        ? `Phác đồ Điều trị Tổng thể (${activeDoctor.name} cập nhật)`
        : `Điều chỉnh Chuyên khoa Sâu (${activeDoctor.name} sửa phác đồ)`,
      titleEn: `Treatment Update (${activeDoctor.name})`,
      detailVi: newDoctorNote.trim(),
      detailEn: newDoctorNote.trim(),
      doctorName: `${activeDoctor.name} (${activeDoctor.specialtyVi})`,
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
      `${activeDoctor.name} đã lưu phác đồ điều trị mới cho BN ${currentPatient.name} (mã hóa E2EE).`,
      `patient:${currentPatient.id.toLowerCase()}:primary`
    );
  };

  const handleAttemptUnauthorizedDecrypt = async (row: EncryptedDatabaseRow) => {
    try {
      await doDecryptRecordWithTidePRE(row, effectiveDoctorTags, activeDoctor.sweKey);
    } catch {
      const msg = isPrimaryMonitoringDoctor
        ? `TIDECLOAK CHẶN TRUY CẬP: ${activeDoctor.name} không thể tự ý mở "${row.vietnameseCategory}". Bác sĩ cần gửi yêu cầu theo dõi tình trạng để Bệnh nhân mở khóa!`
        : `TIDECLOAK SCOPED ACCESS CHẶN: ${activeDoctor.name} (${activeDoctor.specialtyVi}) chỉ là Bác sĩ chuyên khoa phối hợp nên CHỈ ĐƯỢC XEM ĐÚNG BỆNH CHUYÊN KHOA ĐƯỢC GIAO, không được xem "${row.vietnameseCategory}"!`;
      setClinicianErrors((prev) => ({
        ...prev,
        [row.tideTag]: msg,
      }));
      await appendAuditLog(
        'CLINICIAN_SWE',
        'PRE_DECRYPT_DENIED',
        'DENIED',
        `${activeDoctor.name} thử mở [${row.vietnameseCategory}] ngoài phạm vi cho phép -> Bị TideCloak chặn đứng!`,
        row.tideTag
      );
    }
  };

  const handleSimulateAdminInspect = async () => {
    const result = await simulateRogueAdminPrivilegeEscalation(encryptedRows);
    setAdminBreachReport(result);
    await appendAuditLog(
      'CLOUD_DB_ADMIN',
      'ADMIN_BYPASS_BLOCKED',
      'CRITICAL_BLOCK',
      `Admin thử đọc trộm bệnh án của BN ${currentPatient.name} (${currentPatient.id}) -> Bị TideCloak chặn đứng (0 Bytes bị lộ).`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  const handleEmergencyRevokeAll = async () => {
    setAuthorizedByPatient((prev) => ({
      ...prev,
      [currentPatient.id]: new Set(),
    }));
    await appendAuditLog(
      'PATIENT_SWE',
      'POLICY_REVOKE',
      'CRITICAL_BLOCK',
      `BN ${currentPatient.name} (${currentPatient.id}) đã THU HỒI TOÀN BỘ quyền xem bệnh án của bác sĩ ngay lập tức.`,
      `patient:${currentPatient.id.toLowerCase()}:*`
    );
  };

  const getCategoryIcon = (catText: string) => {
    const lower = catText.toLowerCase();
    if (lower.includes('tim') || lower.includes('huyết áp'))
      return <HeartPulse className="w-5 h-5 text-red-600" />;
    if (lower.includes('tâm thần') || lower.includes('thần kinh') || lower.includes('giấc ngủ'))
      return <Brain className="w-5 h-5 text-blue-600" />;
    if (lower.includes('di truyền') || lower.includes('riêng tư'))
      return <Dna className="w-5 h-5 text-red-500" />;
    if (lower.includes('xương khớp'))
      return <Bone className="w-5 h-5 text-sky-600" />;
    return <Activity className="w-5 h-5 text-blue-600" />;
  };

  const pendingRequestList = Object.values(pendingRequests);
  const pendingCount = pendingRequestList.length;
  const currentTimeline = timelinesByPatient[currentPatient.id] || currentPatient.timeline;
  const isRelatedUnlocked = authorizedTags.has(
    `patient:${currentPatient.id.toLowerCase()}:related`
  );

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
              🗺️ Sơ Đồ Khám Của Các Bác Sĩ Quản Lý & Mức Độ Hoàn Thành ({currentPatient.name})
            </h2>
            <p className="text-xs text-slate-500">
              Bác sĩ theo dõi chính biết nhiều bệnh để điều phối • Bác sĩ chuyên khoa phối hợp chỉ xem đúng 1 bệnh chuyên khoa để sửa/điều trị
            </p>
          </div>
        </div>

        {/* Overall Completion Progress Pill */}
        <div className="flex items-center gap-3 bg-blue-50/80 border border-blue-200 px-3.5 py-2 rounded-xl">
          <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-blue-900">
              <span>Tổng mức độ hoàn thành:</span>
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
                    Bước {stage.stageOrder} •{' '}
                    {stage.roleType === 'PRIMARY_MONITOR'
                      ? 'BS Theo Dõi Chính'
                      : 'BS Chuyên Khoa Sửa Bệnh'}
                  </span>

                  {stage.isReferred ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isCompleted ? '✅ Hoàn thành 100%' : `Đang khám (${stage.completionPercent}%)`}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      ⏳ Chờ chuyển khoa
                    </span>
                  )}
                </div>

                {/* Doctor Name & Specialty */}
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{stage.doctorName}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-blue-700 mt-0.5">
                    {stage.specialtyVi}
                  </div>
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
                      <span>Biết nhiều bệnh (khi BN mở khóa)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-red-600 shrink-0" />
                      <span>Chỉ xem đúng 1 bệnh: {stage.diseaseCategoryVi}</span>
                    </>
                  )}
                </div>

                {/* Disease / Clinical Task */}
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div className="font-bold text-slate-800">{stage.diseaseCategoryVi}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                    {stage.diseaseTitleVi}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Completion Bar + Interactive Referral / Progress Controls */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                    <span>Mức độ hoàn thành:</span>
                    <span
                      className={
                        isCompleted ? 'text-emerald-600 font-extrabold' : 'text-blue-600 font-extrabold'
                      }
                    >
                      {stage.isReferred ? `${stage.completionPercent}%` : '0% (Chưa chuyển)'}
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

                {/* Interactive Buttons when in Doctor Portal */}
                {showDoctorControls && (
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    {/* If logged in as Primary Doctor and this is a Specialist Stage */}
                    {isPrimaryMonitoringDoctor && stage.roleType !== 'PRIMARY_MONITOR' && (
                      <>
                        {!stage.isReferred ? (
                          <button
                            onClick={() => handleReferToSpecialistDoctor(stage)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                          >
                            <Send className="w-3 h-3" />
                            Gửi yêu cầu {stage.doctorName} sửa bệnh này
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveDoctorId(stage.doctorId)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <UserCheck className="w-3 h-3" />
                            Đổi sang góc nhìn {stage.doctorName} ➔
                          </button>
                        )}
                      </>
                    )}

                    {/* If logged in as the Doctor who owns this Stage, allow updating progress */}
                    {activeDoctor.id === stage.doctorId && stage.isReferred && (
                      <div className="w-full flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleUpdateStageProgress(stage, stage.completionPercent + 20)
                          }
                          disabled={stage.completionPercent >= 100}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold transition-all"
                        >
                          +20% Tiến độ khám
                        </button>
                        <button
                          onClick={() => handleUpdateStageProgress(stage, 100)}
                          disabled={stage.completionPercent >= 100}
                          className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold transition-all"
                        >
                          Hoàn thành 100%
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
  const renderPatientSelectorSidebar = (titleVi: string) => (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            20 Hồ Sơ Bệnh Nhân E2EE
          </span>
          <h3 className="text-sm font-extrabold text-slate-900">{titleVi}</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {filteredPatients.length}/20 BN
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
            placeholder="Tìm tên BN, mã BN-101..120..."
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
            <option value="ALL">Tất cả 6 Bác sĩ Chuyên khoa (20 BN)</option>
            {HOSPITAL_DOCTORS.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} — {doc.specialtyVi}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable List of 20 Patients */}
      <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
        {filteredPatients.map((p) => {
          const isSelected = p.id === currentPatient.id;
          const pGrants = authorizedByPatient[p.id]?.size || 0;
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
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {p.id}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    {p.name} ({p.age}t)
                  </span>
                </div>

                {/* RED BELL ICON ONLY WHEN THERE IS A REQUEST */}
                {pReqs > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatientId(p.id);
                      setPortal('PATIENT');
                      setShowBellModal(true);
                    }}
                    title="Có yêu cầu theo dõi tình trạng từ Bác sĩ"
                    className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/30 relative"
                  >
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                  </button>
                )}
              </div>

              {pReqs > 0 && (
                <div className="mt-1.5 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <BellRing className="w-3 h-3 shrink-0" />
                  <span className="truncate">Có yêu cầu theo dõi tình trạng</span>
                </div>
              )}

              <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
                <div className="truncate">
                  <strong className="text-blue-700">{p.primaryDoctorName}</strong> •{' '}
                  {p.primarySpecialtyVi}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>{p.statusVi}</span>
                  <span className="font-semibold text-blue-700">Mở {pGrants}/4 bệnh án</span>
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
  // Chỉ bao gồm Danh sách 6 Bác sĩ và trong đó quản lý các bệnh nhân mà Bác sĩ đó theo dõi / sửa bệnh
  // =========================================================================
  const renderDoctorListWithManagedPatientsSidebar = () => (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
      <div className="border-b border-slate-100 pb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
          Cổng Bác Sĩ Chuyên Khoa
        </span>
        <h3 className="text-sm font-extrabold text-slate-900">
          Danh Sách Bác Sĩ & Bệnh Nhân Đang Theo Dõi
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Chọn Bác sĩ để xem danh sách bệnh nhân mà Bác sĩ đó đang theo dõi chính hoặc nhận sửa chuyên khoa:
        </p>
      </div>

      <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
        {HOSPITAL_DOCTORS.map((doc) => {
          const isDocSelected = doc.id === activeDoctor.id;

          // Patients where this doctor is the Primary Monitoring Doctor
          const primaryPatients = ALL_20_PATIENTS.filter((p) => p.primaryDoctorId === doc.id);

          // Patients where another Monitoring Doctor referred a specific specialty disease to this doctor
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
                      {doc.name}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isDocSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {doc.specialtyVi}
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
                    {primaryPatients.length} BN chính
                  </span>
                  {specialistPatients.length > 0 && (
                    <span
                      className={`mt-0.5 text-[9px] font-bold ${
                        isDocSelected ? 'text-sky-100' : 'text-sky-700'
                      }`}
                    >
                      +{specialistPatients.length} BN hội chẩn
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
                      <span>🩺 Bệnh nhân theo dõi chính (Xem đa bệnh)</span>
                      <span>{primaryPatients.length} BN</span>
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
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                                {p.id}
                              </span>
                              <span className="truncate font-bold">{p.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {p.records[0]?.title}
                            </div>
                          </div>

                          {pReqs > 0 && (
                            <span
                              title="Đã gửi chuông đỏ yêu cầu theo dõi tình trạng"
                              className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0"
                            >
                              <BellRing className="w-3 h-3 animate-bounce" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Group 2: Referred Specialist Patients (Only sees 1 matching specialty disease) */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 px-1 flex items-center justify-between">
                      <span>🤝 BN nhận sửa chuyên khoa (Chỉ xem 1 bệnh)</span>
                      <span>{specialistPatients.length} BN</span>
                    </div>
                    {specialistPatients.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic px-1 py-1">
                        Chưa có yêu cầu hội chẩn chuyên khoa mới.
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
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-600 text-white font-bold">
                                  {p.id}
                                </span>
                                <span className="truncate font-bold">{p.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-sky-700 shrink-0">
                                {myStage?.completionPercent || 0}%
                              </span>
                            </div>
                            <div className="text-[10px] text-red-600 font-semibold truncate mt-0.5">
                              🔒 Chỉ xem: {myStage?.diseaseCategoryVi}
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
                    Thông Báo Yêu Cầu Theo Dõi Tình Trạng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bệnh nhân: <strong>{currentPatient.name}</strong> ({currentPatient.id})
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
                  key={req.tideTag}
                  className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">
                      {req.categoryVi}
                    </span>
                    <span className="text-xs font-semibold text-blue-700">
                      {req.doctorName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{req.reasonVi}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handlePatientApproveRequest(req.tideTag)}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Đồng ý cho Bác sĩ theo dõi
                    </button>
                    <button
                      onClick={() => handlePatientRejectRequest(req.tideTag)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-100 text-slate-600 hover:text-red-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Từ chối
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
                ✅ Đồng ý Mở Khóa Tất Cả ({pendingCount} yêu cầu)
              </button>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          TOP NAVIGATION BAR
      ======================================================================= */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Hospital Brand Logo */}
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
                  20 Bệnh Nhân • 6 Bác Sĩ • TideCloak E2EE
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'vi'
                  ? 'Hệ thống Phối hợp Đa Chuyên Khoa — Bác sĩ Theo dõi & Bác sĩ Chuyên khoa Sửa bệnh'
                  : 'Multi-Specialty E2EE Care Coordination Platform'}
              </p>
            </div>
          </div>

          {/* 3-Role Portal Switcher Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setPortal('LOGIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                portal === 'LOGIN'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'vi' ? '🔐 Đăng nhập' : '🔐 Sign In'}
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
              <span>1. Cổng Bệnh Nhân ({currentPatient.id})</span>
              {pendingCount > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setPortal('PATIENT');
                    setShowBellModal(true);
                  }}
                  title="Bệnh nhân có yêu cầu theo dõi tình trạng"
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
              <span>2. Cổng Bác Sĩ ({activeDoctor.name})</span>
            </button>

            <button
              onClick={() => {
                setPortal('ADMIN');
                if (!adminBreachReport) handleSimulateAdminInspect();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                portal === 'ADMIN'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {lang === 'vi' ? '3. Cổng Quản Trị (Admin)' : '3. Hospital Admin'}
            </button>
          </div>

          {/* Right: Red Bell Notification Icon + Language Toggle */}
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => setShowBellModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-sm transition-all"
              >
                <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center">
                  <BellRing className="w-3.5 h-3.5 animate-bounce" />
                </span>
                <span>Có yêu cầu theo dõi tình trạng</span>
              </button>
            )}

            <button
              onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              {lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            </button>
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
                Hệ thống 20 Bệnh Nhân & 6 Bác Sĩ Chuyên Khoa Bảo Mật Bằng TideCloak
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Cổng Đăng Nhập Bệnh Viện Số CarePass
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Chọn 1 trong 3 góc nhìn bên dưới để trải nghiệm quy trình khám chữa bệnh đa chuyên khoa, sơ đồ tiến độ khám của các bác sĩ quản lý và phân quyền chuyên khoa hẹp.
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
                      Góc nhìn 1 • Cổng Bệnh Nhân
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      20 Bệnh nhân (BN-101 ➔ BN-120)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đang chọn: {currentPatient.name} ({currentPatient.id})
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>• Xem sơ đồ khám của các bác sĩ quản lý & mức độ hoàn thành (%).</li>
                    <li>• Nhận thông báo chuông đỏ khi Bác sĩ yêu cầu theo dõi tình trạng.</li>
                  </ul>
                </div>

                <button className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                  Vào Cổng Bệnh Nhân <ArrowRight className="w-4 h-4" />
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
                      Góc nhìn 2 • Cổng Bác Sĩ
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      Danh sách 6 Bác sĩ Chuyên khoa
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mỗi bác sĩ quản lý danh sách bệnh nhân riêng của mình
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>• Bác sĩ theo dõi chính biết nhiều bệnh & gửi yêu cầu cho Bác sĩ chuyên khoa sửa bệnh.</li>
                    <li>• Bác sĩ chuyên khoa phối hợp chỉ xem được đúng 1 bệnh thuộc chuyên khoa đó.</li>
                  </ul>
                </div>

                <button className="mt-6 w-full py-2.5 rounded-xl bg-sky-600 group-hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                  Vào Cổng Bác Sĩ <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div
                onClick={() => {
                  setPortal('ADMIN');
                  if (!adminBreachReport) handleSimulateAdminInspect();
                }}
                className="cursor-pointer group rounded-2xl bg-white border-2 border-red-200 hover:border-red-600 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                      Góc nhìn 3 • Quản Trị Bệnh Viện
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">System Admin</h2>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      Quản lý 20 Bệnh nhân & 6 Bác sĩ
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>• Kiểm soát danh sách 20 Bệnh nhân & Bác sĩ nào đang theo dõi ai.</li>
                    <li>• Bị khóa hoàn toàn phần chi tiết bệnh tình, đơn thuốc & quá trình điều trị.</li>
                  </ul>
                </div>

                <button className="mt-6 w-full py-2.5 rounded-xl bg-red-600 group-hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                  Vào Cổng Admin <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 1: CỔNG BỆNH NHÂN (CÓ SƠ ĐỒ KHÁM CỦA CÁC BÁC SĨ QUẢN LÝ & MỨC ĐỘ HOÀN THÀNH)
        ===================================================================== */}
        {portal === 'PATIENT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 3 COLS: DANH SÁCH CHUYỂN ĐỔI NHANH 20 BỆNH NHÂN */}
            <div className="lg:col-span-3">
              {renderPatientSelectorSidebar('Chọn tài khoản Bệnh nhân')}
            </div>

            {/* RIGHT 9 COLS: HỒ SƠ CỦA BỆNH NHÂN ĐANG ĐĂNG NHẬP */}
            <div className="lg:col-span-9 space-y-5">
              {/* Patient Welcome Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 text-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white font-extrabold text-sm">
                    {currentPatient.id}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-blue-700">
                        Bệnh nhân: {currentPatient.name} ({currentPatient.age} tuổi,{' '}
                        {currentPatient.genderVi})
                      </span>
                      <span className="text-xs text-blue-100">
                        Bác sĩ theo dõi chính: <strong>{currentPatient.primaryDoctorName}</strong> (
                        {currentPatient.primarySpecialtyVi})
                      </span>
                    </div>
                    <h1 className="text-base font-extrabold text-white mt-1.5">
                      🔗 Chuỗi bệnh lý: {currentPatient.rootCauseChainVi}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* COMPACT RED BELL BUTTON ON BANNER IF REQUEST EXISTS */}
                  {pendingCount > 0 && (
                    <button
                      onClick={() => setShowBellModal(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white shadow-lg border border-red-300 transition-all"
                    >
                      <BellRing className="w-4 h-4 animate-bounce" />
                      Có yêu cầu theo dõi tình trạng ({pendingCount})
                    </button>
                  )}

                  <button
                    onClick={handleEmergencyRevokeAll}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-red-600 text-white border border-white/30 transition-all"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Thu hồi quyền Bác sĩ
                  </button>
                  <button
                    onClick={() => {
                      setActiveDoctorId(currentPatient.primaryDoctorId);
                      setPortal('DOCTOR');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-sm transition-all"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Sang góc nhìn {currentPatient.primaryDoctorName} ➔
                  </button>
                </div>
              </div>

              {/* SƠ ĐỒ KHÁM CỦA CÁC BÁC SĨ QUẢN LÝ & MỨC ĐỘ HOÀN THÀNH TRONG HỒ SƠ BỆNH NHÂN */}
              {renderDoctorCareDiagram(false)}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT 6 COLS: THUỐC UỐNG & QUÁ TRÌNH ĐIỀU TRỊ */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-red-600" />
                        Thuốc Đang Uống Của {currentPatient.name}
                      </h2>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Bảo mật E2EE
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
                            <div className="text-[11px] text-slate-600 mt-0.5">{med.dosageVi}</div>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200">
                            {med.deptVi}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3.5 shadow-sm">
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <CalendarClock className="w-4 h-4 text-blue-600" />
                      Quá Trình Điều Trị & Tiến Triển Bệnh
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
                                {item.doctorName}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-slate-900">{item.titleVi}</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {item.detailVi}
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
                      Phân Quyền Xem Bệnh Cho Bác Sĩ Theo Dõi ({currentPatient.primaryDoctorName})
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Bác sĩ theo dõi chính biết được các bệnh bạn mở khóa bên dưới để chẩn đoán tổng thể. Nếu cần sửa bệnh chuyên khoa, bác sĩ theo dõi sẽ chuyển riêng đúng 1 bệnh đó cho bác sĩ chuyên khoa tương ứng:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {encryptedRows.map((row) => {
                      const isGranted = authorizedTags.has(row.tideTag);
                      const isRequested = Boolean(pendingRequests[row.tideTag]);
                      const matchingStage = currentCareStages.find(
                        (st) => st.targetTideTag === row.tideTag && st.roleType !== 'PRIMARY_MONITOR'
                      );

                      return (
                        <div
                          key={row.id}
                          onClick={() => {
                            if (isRequested && !isGranted) {
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
                              {isRequested && !isGranted && (
                                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center absolute -top-1.5 -right-1.5 shadow">
                                  <BellRing className="w-2.5 h-2.5 animate-bounce" />
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="text-xs font-bold text-slate-900">
                                  {row.vietnameseCategory}
                                </h3>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{row.title}</p>
                              {matchingStage && matchingStage.isReferred && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                  🤝 BS chuyên khoa {matchingStage.doctorName} chỉ được xem riêng bệnh này ({matchingStage.completionPercent}%)
                                </span>
                              )}
                              {isRequested && !isGranted && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                                    <BellRing className="w-3 h-3" />
                                    Có yêu cầu theo dõi tình trạng (Bấm để duyệt)
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
                                Đang mở
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                Đang khóa
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
            VIEW 2: CỔNG BÁC SĨ (CHỈ BAO GỒM DANH SÁCH BÁC SĨ & BỆNH NHÂN CỦA BÁC SĨ ĐÓ)
        ===================================================================== */}
        {portal === 'DOCTOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 3 COLS: CHỈ BAO GỒM DANH SÁCH 6 BÁC SĨ & CÁC BỆNH NHÂN BÁC SĨ ĐÓ QUẢN LÝ */}
            <div className="lg:col-span-3">
              {renderDoctorListWithManagedPatientsSidebar()}
            </div>

            {/* RIGHT 9 COLS: KHÔNG GIAN LÀM VIỆC CỦA BÁC SĨ ĐANG CHỌN (activeDoctor) */}
            <div className="lg:col-span-9 space-y-5">
              {/* Doctor Role & Scope Banner */}
              <div
                className={`rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm border-2 ${
                  isPrimaryMonitoringDoctor
                    ? 'bg-white border-blue-300'
                    : 'bg-sky-50/60 border-sky-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isPrimaryMonitoringDoctor
                        ? 'bg-blue-600 text-white'
                        : 'bg-sky-600 text-white'
                    }`}
                  >
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          isPrimaryMonitoringDoctor
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-sky-200 text-sky-900'
                        }`}
                      >
                        {isPrimaryMonitoringDoctor
                          ? `🩺 Bác sĩ Theo Dõi Chính: ${activeDoctor.name} (${activeDoctor.specialtyVi})`
                          : `🤝 Bác sĩ Chuyên Khoa Sửa Bệnh: ${activeDoctor.name} (${activeDoctor.specialtyVi})`}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Khóa phiên: {activeDoctor.sweKey}
                      </span>
                    </div>
                    <h1 className="text-lg font-extrabold text-slate-900 mt-1">
                      Bệnh nhân: {currentPatient.name} ({currentPatient.id} • {currentPatient.age}{' '}
                      tuổi, {currentPatient.genderVi})
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isPrimaryMonitoringDoctor
                        ? '👁️ Quyền Bác sĩ theo dõi chính: Xem được nhiều bệnh (khi BN mở khóa) để chẩn đoán tổng thể & gửi yêu cầu cho Bác sĩ chuyên khoa sửa từng bệnh.'
                        : `🔒 Quyền Bác sĩ chuyên khoa phối hợp (được ${currentPatient.primaryDoctorName} gửi yêu cầu): CHỈ XEM ĐƯỢC ĐÚNG 1 BỆNH thuộc chuyên khoa [${activeDoctor.specialtyVi}], các bệnh khác đều bị khóa!`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isPrimaryMonitoringDoctor ? (
                    <button
                      onClick={handleDoctorRequestAllRelated}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      📨 Yêu cầu BN mở khóa các bệnh liên quan
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveDoctorId(currentPatient.primaryDoctorId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Quay lại BS Theo dõi chính ({currentPatient.primaryDoctorName})
                    </button>
                  )}

                  <button
                    onClick={() => setPortal('PATIENT')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all"
                  >
                    {pendingCount > 0 && (
                      <BellRing className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                    )}
                    Sang Hồ sơ BN ({currentPatient.id}) ➔
                  </button>
                </div>
              </div>

              {/* SƠ ĐỒ KHÁM CỦA CÁC BÁC SĨ QUẢN LÝ & MỨC ĐỘ HOÀN THÀNH (CÓ NÚT GỬI CHUYÊN KHOA & CẬP NHẬT %) */}
              {renderDoctorCareDiagram(true)}

              {/* 4 Medical Cards of the Selected Patient */}
              <div className="space-y-4">
                {encryptedRows.map((row) => {
                  const decrypted = decryptedViews[row.tideTag];
                  const isUnlockedForActiveDoctor = Boolean(decrypted);
                  const isPending = Boolean(pendingRequests[row.tideTag]);
                  const errorMsg = clinicianErrors[row.tideTag];

                  // Find if there is a specialist doctor stage corresponding to this disease
                  const specialistStage = currentCareStages.find(
                    (st) => st.targetTideTag === row.tideTag && st.roleType !== 'PRIMARY_MONITOR'
                  );

                  return (
                    <div
                      key={row.id}
                      className={`rounded-2xl p-5 border transition-all ${
                        isUnlockedForActiveDoctor
                          ? 'bg-white border-blue-300 shadow-md'
                          : isPending && isPrimaryMonitoringDoctor
                          ? 'bg-red-50/30 border-2 border-red-200 shadow-sm'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            {getCategoryIcon(row.vietnameseCategory)}
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900">
                              {row.vietnameseCategory}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {row.title} • {row.facility}
                            </p>
                          </div>
                        </div>

                        {isUnlockedForActiveDoctor ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            {isPrimaryMonitoringDoctor
                              ? 'BÁC SĨ THEO DÕI ĐANG XEM'
                              : 'ĐÚNG CHUYÊN KHOA ĐƯỢC GIAO (CHO PHÉP SỬA BỆNH)'}
                          </span>
                        ) : !isPrimaryMonitoringDoctor ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <Lock className="w-3.5 h-3.5 text-red-600" />
                            KHÓA NGOÀI CHUYÊN KHOA ({activeDoctor.specialtyVi})
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            <BellRing className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                            ĐÃ BÁO CHUÔNG ĐỎ CHO BỆNH NHÂN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3.5 h-3.5 text-red-600" />
                            ĐANG KHÓA
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
                                <div className="text-xs text-slate-500">{m.label}</div>
                                <div className="text-base font-extrabold text-blue-900 mt-0.5">
                                  {m.value}{' '}
                                  <span className="text-xs font-normal text-slate-500">
                                    {m.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                            <p className="text-slate-800 leading-relaxed">
                              <strong className="text-blue-700">
                                Tình trạng sức khỏe chi tiết:
                              </strong>{' '}
                              {decrypted.vietnameseDiagnosis}
                            </p>
                            <p className="text-slate-700 font-medium">
                              <strong className="text-red-600">Thuốc & Phác đồ điều trị:</strong>{' '}
                              {decrypted.vietnamesePlan}
                            </p>
                          </div>

                          {/* NẾU LÀ BÁC SĨ THEO DÕI CHÍNH & BỆNH NÀY CẦN BÁC SĨ CHUYÊN KHOA KHÁC SỬA */}
                          {isPrimaryMonitoringDoctor && specialistStage && (
                            <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs space-y-0.5">
                                <div className="font-extrabold text-sky-950 flex items-center gap-1.5">
                                  <Stethoscope className="w-4 h-4 text-sky-600" />
                                  <span>
                                    Phối hợp Chuyên khoa: Cần{' '}
                                    <strong>
                                      {specialistStage.doctorName} ({specialistStage.specialtyVi})
                                    </strong>{' '}
                                    trực tiếp điều trị bệnh này
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  Một bác sĩ không thể chữa tất cả các bệnh — khi gửi yêu cầu,{' '}
                                  <strong>{specialistStage.doctorName}</strong> sẽ chỉ xem được đúng
                                  bệnh <strong>[{row.vietnameseCategory}]</strong> này.
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {!specialistStage.isReferred ? (
                                  <button
                                    onClick={() => handleReferToSpecialistDoctor(specialistStage)}
                                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Gửi yêu cầu đến {specialistStage.doctorName} (Chỉ mở bệnh này)
                                  </button>
                                ) : (
                                  <>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                                      ✅ Đã giao {specialistStage.doctorName} (Tiến độ:{' '}
                                      {specialistStage.completionPercent}%)
                                    </span>
                                    <button
                                      onClick={() => setActiveDoctorId(specialistStage.doctorId)}
                                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                                    >
                                      Xem góc nhìn {specialistStage.doctorName} ➔
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* NẾU ĐANG ĐĂNG NHẬP LÀ BÁC SĨ CHUYÊN KHOA ĐƯỢC NHỜ SỬA BỆNH NÀY */}
                          {!isPrimaryMonitoringDoctor &&
                            specialistStage &&
                            specialistStage.doctorId === activeDoctor.id && (
                              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs">
                                  <div className="font-extrabold text-emerald-950">
                                    🛠️ Góc nhìn Bác sĩ Chuyên khoa ({activeDoctor.name}): Điều trị &
                                    Cập nhật tiến độ bệnh này
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    Mức độ hoàn thành hiện tại:{' '}
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
                                    +20% Tiến độ điều trị
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStageProgress(specialistStage, 100)}
                                    disabled={specialistStage.completionPercent >= 100}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all"
                                  >
                                    ✅ Đánh dấu Hoàn thành 100%
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          {/* NẾU LÀ BÁC SĨ CHUYÊN KHOA PHỐI HỢP -> CHỈ ĐƯỢC XEM ĐÚNG BỆNH CHUYÊN KHOA, BỆNH KHÁC BỊ CHẶN */}
                          {!isPrimaryMonitoringDoctor ? (
                            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                              <span>
                                🔒 <strong>Giới hạn Chuyên khoa TideCloak:</strong>{' '}
                                {activeDoctor.name} ({activeDoctor.specialtyVi}) chỉ được cấp quyền
                                xem đúng bệnh chuyên khoa được giao, không được xem{' '}
                                <strong>[{row.vietnameseCategory}]</strong> (Bác sĩ theo dõi chính{' '}
                                <strong>{currentPatient.primaryDoctorName}</strong> mới biết được
                                nhiều bệnh).
                              </span>
                              <button
                                onClick={() => handleAttemptUnauthorizedDecrypt(row)}
                                className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 text-[11px] font-bold shrink-0"
                              >
                                Thử mở trái phép
                              </button>
                            </div>
                          ) : (
                            <>
                              {row.correlationSignal && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 leading-relaxed">
                                  {row.correlationSignal.viSummary}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => handleDoctorSendUnlockRequest(row)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                                  >
                                    <BellRing className="w-3.5 h-3.5" />
                                    {isPending
                                      ? 'Đã gửi thông báo chuông đỏ cho Bệnh nhân'
                                      : 'Yêu cầu Bệnh nhân mở khóa theo dõi tình trạng'}
                                  </button>

                                  {isPending && (
                                    <button
                                      onClick={() => {
                                        setPortal('PATIENT');
                                        setShowBellModal(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
                                    >
                                      <BellRing className="w-3.5 h-3.5 animate-bounce" />
                                      Mở chuông thông báo bên BN ({currentPatient.id})
                                    </button>
                                  )}

                                  {/* Cho phép Bác sĩ theo dõi chính gửi yêu cầu thẳng tới Bác sĩ chuyên khoa đúng với bệnh này */}
                                  {specialistStage && !specialistStage.isReferred && (
                                    <button
                                      onClick={() => handleReferToSpecialistDoctor(specialistStage)}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all"
                                    >
                                      <Send className="w-3.5 h-3.5 text-sky-600" />
                                      Nhờ {specialistStage.doctorName} ({specialistStage.specialtyVi}
                                      ) sửa bệnh này
                                    </button>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleAttemptUnauthorizedDecrypt(row)}
                                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 transition-all"
                                >
                                  Thử tự mở không xin phép
                                </button>
                              </div>
                            </>
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
                  Cập nhật Quá trình Điều trị của {activeDoctor.name} cho BN {currentPatient.name} (
                  {currentPatient.id})
                </h3>
                <form
                  onSubmit={handleDoctorAddTreatmentNote}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    value={newDoctorNote}
                    onChange={(e) => setNewDoctorNote(e.target.value)}
                    placeholder={`Nhập ghi chú khám / sửa phác đồ của ${activeDoctor.name} (${activeDoctor.specialtyVi})...`}
                    className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shrink-0 transition-all"
                  >
                    Lưu & Mã hóa E2EE
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
                      Cổng Quản Trị Viên Bệnh Viện (System Admin)
                    </span>
                    <span className="text-xs font-mono text-red-600 font-bold">
                      Master Key trên Server: KHÔNG TỒN TẠI (0 Shards)
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                    Quản Lý Danh Sách 20 Bệnh Nhân & 6 Bác Sĩ Chuyên Khoa Đang Theo Dõi
                  </h1>
                </div>
              </div>

              <button
                onClick={handleSimulateAdminInspect}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                ⚡ Thử Dùng Quyền Root Admin Giải Mã Bệnh Án ({currentPatient.id})
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
                      {doc.name}
                    </div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelectedDoc ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {doc.specialtyVi}
                    </div>
                    <div
                      className={`mt-1.5 text-[10px] font-mono font-bold ${
                        isSelectedDoc ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      Đang theo dõi: {doc.patientCount} BN
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
                      ✅ Dữ liệu Điều phối Vận hành (Admin được phép kiểm soát)
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Danh sách 20 Bệnh nhân & Bác sĩ đang theo dõi ({filteredPatients.length} BN)
                    </h2>
                  </div>

                  {selectedDoctorFilter !== 'ALL' && (
                    <button
                      onClick={() => setSelectedDoctorFilter('ALL')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Xem tất cả 20 BN
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {filteredPatients.map((item) => {
                    const isSelected = currentPatient.id === item.id;
                    const activeCount = authorizedByPatient[item.id]?.size || 0;
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
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-600 font-mono text-xs font-bold text-white">
                              {item.id}
                            </span>
                            <span className="text-sm font-extrabold text-slate-900">
                              {item.name} ({item.age} tuổi, {item.genderVi})
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {item.statusVi}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700">
                          <div>
                            <strong className="text-slate-500">BS theo dõi chính:</strong>{' '}
                            <span className="text-blue-700 font-bold">
                              {item.primaryDoctorName}
                            </span>{' '}
                            ({item.primarySpecialtyVi})
                          </div>
                          <div>
                            <strong className="text-slate-500">BS phối hợp:</strong>{' '}
                            {item.coDoctorsVi}
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Số lượng mô-đun bệnh án E2EE: 4 mô-đun</span>
                          <span className="font-bold text-slate-800">
                            Trạng thái TideCloak: Mở {activeCount}/4 cho Bác sĩ
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
                    🔒 Nội dung Bệnh án & Điều trị (Được bảo vệ bởi TideCloak)
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Chi tiết Bệnh tình & Thuốc của {currentPatient.name} ({currentPatient.id})
                  </h2>
                </div>

                <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-red-700">
                    <FileLock2 className="w-4 h-4 text-red-600" />
                    ADMIN BIẾT AI KHÁM AI — NHƯNG MÙ HOÀN TOÀN VỀ BỆNH LÝ & THUỐC!
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Admin biết <strong>{currentPatient.name}</strong> đang được theo dõi bởi{' '}
                    <strong>{currentPatient.primaryDoctorName}</strong>, nhưng hoàn toàn không có khóa phiên TideCloak để giải mã tình trạng bệnh, đơn thuốc ({currentPatient.medications.length} loại) hay quá trình điều trị bên dưới:
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
                          {row.vietnameseCategory}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                          🔒 CIPHERTEXT
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <strong>Bệnh tình & Thuốc:</strong>{' '}
                        <span className="text-red-600 break-all">
                          [ENCRYPTED: {row.ciphertextHex.slice(0, 48)}...]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {adminBreachReport && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                    <div className="font-bold text-blue-800">
                      🛡️ Kết quả kiểm tra TideCloak (12/12 Nút MPC):
                    </div>
                    <div className="text-slate-700">
                      Số lượng bệnh án hay đơn thuốc của {currentPatient.name} bị lộ cho Admin:{' '}
                      <strong>0 BYTES</strong>.
                    </div>
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
            <strong className="text-slate-800">Nhật ký Bảo mật TideCloak:</strong>
            <span className="text-blue-700 font-medium">
              {auditLogs[0]?.message || 'Hệ thống sẵn sàng (20 Bệnh nhân • 6 Bác sĩ)'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            CarePass E2EE • 20 Bệnh Nhân (BN-101..BN-120) • 6 Bác Sĩ Chuyên Khoa
          </div>
        </div>
      </footer>
    </div>
  );
}
