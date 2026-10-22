export type SensitivityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ClinicalMetric {
  label: string;
  value: string;
  unit?: string;
  flag?: 'normal' | 'warning' | 'critical';
}

export interface CrossSpecialtyCorrelation {
  viSummary: string;
  enSummary: string;
  linkedTags: string[];
  clinicalActionVi: string;
  clinicalActionEn: string;
}

export interface RawMedicalRecord {
  id: string;
  category: string;
  vietnameseCategory: string;
  title: string;
  tideTag: string;
  sensitivity: SensitivityLevel;
  sensitivityLabel: string;
  facility: string;
  updatedAt: string;
  plaintextDiagnosis: string;
  vietnameseDiagnosis: string;
  medicationOrPlan: string;
  vietnamesePlan: string;
  metrics: ClinicalMetric[];
  correlationSignal?: CrossSpecialtyCorrelation;
}

export const INITIAL_MEDICAL_RECORDS: RawMedicalRecord[] = [
  {
    id: 'REC-101-CARDIO',
    category: 'Cardiology & Metabolic',
    vietnameseCategory: 'Tim mạch & Huyết áp',
    title: '24h Holter ECG, Obesity & Hypertension Consult',
    tideTag: 'patient:101:cardiology',
    sensitivity: 'MODERATE',
    sensitivityLabel: 'Clinical Specialist',
    facility: 'Saigon Heart Institute',
    updatedAt: '2026-10-18',
    plaintextDiagnosis:
      'Episodic sinus tachycardia (108 bpm), Stage-1 hypertension (145/92 mmHg), and rapid weight gain (BMI 31.2 - Obesity Class I). Suspected secondary neuro-endocrine or stress-eating trigger.',
    vietnameseDiagnosis:
      'Nhịp nhanh xoang từng cơn (108 bpm), Tăng huyết áp độ 1 (145/92 mmHg) kèm tăng cân nhanh (BMI 31.2 - Béo phì độ I). Nghi ngờ có nguyên nhân gốc từ căng thẳng thần kinh hoặc ăn uống do stress.',
    medicationOrPlan: 'Bisoprolol 5mg QD • Telmisartan 40mg QD • Check SSRI drug interaction',
    vietnamesePlan: 'Bisoprolol 5mg/ngày • Telmisartan 40mg/ngày • Cần kiểm tra tương tác thuốc tâm thần',
    metrics: [
      { label: 'Nhịp tim (HR)', value: '108', unit: 'bpm', flag: 'warning' },
      { label: 'Huyết áp (BP)', value: '145/92', unit: 'mmHg', flag: 'warning' },
      { label: 'Chỉ số BMI', value: '31.2', unit: 'Béo phì độ I', flag: 'critical' },
    ],
  },
  {
    id: 'REC-101-PSYCH',
    category: 'Psychiatry & Behavioral Health',
    vietnameseCategory: 'Tâm thần học (Nguyên nhân gốc)',
    title: 'Major Depressive Episode & Compulsive Stress-Eating',
    tideTag: 'patient:101:psychiatry',
    sensitivity: 'HIGH',
    sensitivityLabel: 'Highly Sensitive',
    facility: 'MindCare Behavioral Clinic',
    updatedAt: '2026-09-29',
    plaintextDiagnosis:
      'ROOT CAUSE IDENTIFIED: Major Depressive Episode & Chronic Cortisol Elevation causing compulsive late-night stress-eating (+14kg in 6 months -> Obesity & Secondary Hypertension). Patient is taking Sertraline 50mg (risk of QTc interaction with cardiac drugs).',
    vietnameseDiagnosis:
      'NGUYÊN NHÂN GỐC RỄ: Trầm cảm kéo dài & tăng Cortisol mạn tính gây chứng ăn nhiều vô độ ban đêm để giải tỏa căng thẳng (tăng 14kg trong 6 tháng -> Gây Béo phì, Tăng huyết áp & Nhịp tim nhanh). Đang dùng Sertraline 50mg (cần phối hợp chặt với khoa Tim mạch).',
    medicationOrPlan: 'Sertraline 50mg QD • CBT for Emotional Eating • Multidisciplinary Endo-Cardio referral',
    vietnamesePlan: 'Sertraline 50mg/ngày • Trị liệu nhận thức hành vi (CBT) kiểm soát ăn uống do trầm cảm • Phối hợp Liên chuyên khoa Tim mạch - Nội tiết',
    metrics: [
      { label: 'Điểm Trầm cảm PHQ-9', value: '18/27', unit: 'Nặng', flag: 'critical' },
      { label: 'Tăng cân do Stress', value: '+14 kg', unit: '/ 6 tháng', flag: 'critical' },
      { label: 'Thuốc đang dùng', value: 'Sertraline', unit: '50mg SSRI', flag: 'warning' },
    ],
    correlationSignal: {
      viSummary:
        '🔗 PHÁT HIỆN LIÊN KẾT BỆNH LÝ GỐC: Hồ sơ [Tâm thần học] đang khóa có chứa nguyên nhân gốc gây [Béo phì BMI 31.2 + Tăng huyết áp 145/92] (Trầm cảm gây ăn nhiều mất kiểm soát & dùng thuốc Sertraline 50mg).',
      enSummary:
        '🔗 ROOT-CAUSE CORRELATION DETECTED: Locked [Psychiatry] record contains a direct causal link to [Obesity BMI 31.2 & Hypertension] (Depression-induced stress-eating & active SSRI Sertraline 50mg therapy).',
      linkedTags: ['patient:101:cardiology', 'patient:101:psychiatry'],
      clinicalActionVi:
        'Bác sĩ có thể gửi "Yêu cầu Mở khóa Khám Tổng Quát (15 phút)" để xem nguyên nhân gốc và chữa tận gốc (Server & Admin vẫn không đọc được!).',
      clinicalActionEn:
        'Clinician can request a 15-minute Holistic Diagnostic Unlock from the patient (Server & IT Admins still remain at 0% plaintext exposure).',
    },
  },
  {
    id: 'REC-101-ORTHO',
    category: 'Orthopedics & Spine',
    vietnameseCategory: 'Cơ xương khớp (Hệ quả từ Béo phì)',
    title: 'Lumbar Spine MRI (L4-L5) Overload from Rapid Weight Gain',
    tideTag: 'patient:101:orthopedics',
    sensitivity: 'LOW',
    sensitivityLabel: 'Standard Clinical',
    facility: 'RMIT Sports Medicine Center',
    updatedAt: '2026-08-14',
    plaintextDiagnosis:
      'L4-L5 posterior disc protrusion (3.5mm) exacerbated by rapid 14kg weight gain over the past 6 months. Treating lumbar pain requires addressing underlying metabolic/behavioral weight gain.',
    vietnameseDiagnosis:
      'Lồi đĩa đệm cột sống thắt lưng L4-L5 (3.5mm) trở nặng do tăng 14kg đột ngột trong 6 tháng qua. Để hết đau lưng tận gốc cần giải quyết nguyên nhân gây tăng cân.',
    medicationOrPlan: 'Low-impact aquatic therapy • Weight reduction coordination',
    vietnamesePlan: 'Vật lý trị liệu dưới nước giảm tải cột sống • Phối hợp giảm cân tận gốc',
    metrics: [
      { label: 'Lồi đĩa đệm L4-L5', value: '3.5', unit: 'mm', flag: 'warning' },
      { label: 'Áp lực cột sống', value: 'Cao', unit: 'Do tăng 14kg', flag: 'warning' },
      { label: 'Mức độ đau VAS', value: '5/10', unit: 'Trung bình', flag: 'warning' },
    ],
  },
  {
    id: 'REC-101-GENETICS',
    category: 'Genetics & HIV Screening',
    vietnameseCategory: 'Di truyền & HIV (Riêng tư tuyệt đối)',
    title: 'Hereditary Oncology Panel & Infectious Serology',
    tideTag: 'patient:101:genetics',
    sensitivity: 'CRITICAL',
    sensitivityLabel: 'Strictly Confidential',
    facility: 'National Genomic & Molecular Lab',
    updatedAt: '2026-10-04',
    plaintextDiagnosis:
      'STRICTLY RESTRICTED GENOMIC RECORD: Pathogenic heterozygous BRCA1 variant (c.5266dupC) identified. HIV-1/2 Ag/Ab 4th-Gen Combo Screen: Non-Reactive. Unrelated to current cardio-metabolic issue.',
    vietnameseDiagnosis:
      'HỒ SƠ TỐI MẬT: Phát hiện biến thể gen BRCA1 (tầm soát ung thư gia đình) & Xét nghiệm sàng lọc HIV. Không liên quan đến bệnh Tim mạch/Béo phì hiện tại nên không cần mở cho bác sĩ khám nội khoa.',
    medicationOrPlan: 'Annual oncology genetic counseling only',
    vietnamesePlan: 'Chỉ mở cho Bác sĩ Ung bướu khi tầm soát định kỳ (Giữ khóa với các khoa khác)',
    metrics: [
      { label: 'Gen BRCA1', value: 'c.5266dupC', unit: 'Biến thể', flag: 'critical' },
      { label: 'HIV-1/2 Ag/Ab', value: 'Âm tính', unit: 'Đã xác thực', flag: 'normal' },
      { label: 'Liên quan Tim mạch', value: '0%', unit: 'Độc lập', flag: 'normal' },
    ],
  },
];

export interface DemoSceneGuide {
  step: number;
  timeRange: string;
  title: string;
  criteriaTag: string;
  actionHint: string;
  englishVoiceover: string;
}

export const VIDEO_STORYBOARD_SCENES: DemoSceneGuide[] = [
  {
    step: 1,
    timeRange: '0:00 – 0:35',
    title: '1. Mở khóa Tim mạch + Phát hiện Liên kết Bệnh lý Gốc',
    criteriaTag: 'Vision (25%) + Trust Insight (20%)',
    actionHint: 'Bệnh nhân mở Tim mạch -> Bác sĩ thấy Béo phì/Tăng huyết áp + Cảnh báo có liên hệ với hồ sơ Tâm thần đang khóa!',
    englishVoiceover:
      '"Meet CarePass — built with TideCloak. When a patient visits a cardiologist for high blood pressure and obesity, they unlock Cardiology. Immediately, CarePass surfaces a Zero-Knowledge Clinical Correlation Alert: the patient’s obesity and hypertension are linked to a locked Psychiatry record — without exposing private therapy diaries to hospital servers."',
  },
  {
    step: 2,
    timeRange: '0:35 – 1:15',
    title: '2. Bác sĩ Gửi Yêu cầu & Chẩn đoán Tận Gốc (Holistic Care)',
    criteriaTag: 'Value & Impact (20%) + Why TideCloak (20%)',
    actionHint: 'Bác sĩ bấm "Yêu cầu mở Tâm thần học để chữa tận gốc" -> Bệnh nhân bấm Đồng ý -> Bác sĩ thấy rõ: Trầm cảm gây ăn nhiều (+14kg) dẫn tới Béo phì & Cao huyết áp!',
    englishVoiceover:
      '"To treat the root cause instead of just symptoms, Dr. Alice requests holistic access to Psychiatry. Because TideCloak uses Proxy Re-Encryption bound strictly to Dr. Alice’s browser session — never the hospital database — the patient safely approves. Dr. Alice discovers depression-induced stress-eating caused the 14kg weight gain and hypertension, enabling true root-cause care while Genetics & HIV stay sealed."',
  },
  {
    step: 3,
    timeRange: '1:15 – 1:40',
    title: '3. Admin Bệnh viện / Hacker Đọc Trộm (Bị chặn 100%)',
    criteriaTag: 'Why TideCloak Matters (20%)',
    actionHint: 'Chuyển sang tab Admin Server để chứng minh: dù Bệnh nhân vừa mở hồ sơ Tâm thần cho Bác sĩ, Admin Server vẫn chỉ thấy Ciphertext!',
    englishVoiceover:
      '"Crucially, even while Dr. Alice reads both records in her active session, a rogue database administrator or hacker escalating privileges to SUPER_ADMIN on our cloud server still sees 100% undecipherable ciphertext. No master key ever exists on the server."',
  },
  {
    step: 4,
    timeRange: '1:40 – 2:00',
    title: '4. Khám Xong Thu Hồi Quyền Tức Thì (Instant Revoke)',
    criteriaTag: 'Prototype & Storytelling (15%)',
    actionHint: 'Bệnh nhân bấm "Thu hồi tất cả" sau khi khám xong -> Màn hình Bác sĩ khóa lại ngay lập tức!',
    englishVoiceover:
      '"The moment the consultation ends, the patient clicks Revoke. Emergent authority dissolves instantly across Tide’s MPC fabric, locking Dr. Alice’s view. CarePass unlocks holistic root-cause medicine through mathematical trust."',
  },
];
