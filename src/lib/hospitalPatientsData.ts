import { RawMedicalRecord } from './mockMedicalRecords';

export function toEnName(str: string): string {
  return str
    .replace(/BS\./g, 'Dr.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export interface HospitalDoctor {
  id: string;
  name: string;
  nameEn: string;
  specialtyVi: string;
  specialtyEn: string;
  sweKey: string;
  patientCount: number;
}

export interface PatientMedication {
  name: string;
  dosageVi: string;
  dosageEn: string;
  deptVi: string;
  deptEn: string;
}

export interface PatientTimelineStep {
  date: string;
  titleVi: string;
  titleEn: string;
  detailVi: string;
  detailEn: string;
  doctorName: string;
  doctorNameEn: string;
}

export interface DoctorCareStage {
  stageOrder: number;
  roleType: 'PRIMARY_MONITOR' | 'SPECIALIST_ROOT_CAUSE' | 'SPECIALIST_SECONDARY';
  roleLabelVi: string;
  roleLabelEn: string;
  scopeBadgeVi: string;
  scopeBadgeEn: string;
  doctorId: string;
  doctorName: string;
  doctorNameEn: string;
  specialtyVi: string;
  specialtyEn: string;
  targetTideTag: string;
  diseaseCategoryVi: string;
  diseaseCategoryEn: string;
  diseaseTitleVi: string;
  diseaseTitleEn: string;
  treatmentGoalVi: string;
  treatmentGoalEn: string;
  isReferred: boolean;
  completionPercent: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  nameEn: string;
  age: number;
  genderVi: 'Nam' | 'Nữ';
  genderEn: 'Male' | 'Female';
  primaryDoctorId: string;
  primaryDoctorName: string;
  primaryDoctorNameEn: string;
  primarySpecialtyVi: string;
  primarySpecialtyEn: string;
  coDoctorsVi: string;
  coDoctorsEn: string;
  statusVi: string;
  statusEn: string;
  rootCauseChainVi: string;
  rootCauseChainEn: string;
  medications: PatientMedication[];
  timeline: PatientTimelineStep[];
  records: RawMedicalRecord[];
  careStages: DoctorCareStage[];
}

export const HOSPITAL_DOCTORS: HospitalDoctor[] = [
  {
    id: 'DOC-01',
    name: 'BS. Alice Nguyễn',
    nameEn: 'Dr. Alice Nguyen',
    specialtyVi: 'Khoa Tim Mạch & Huyết Áp',
    specialtyEn: 'Cardiology & Hypertension',
    sweKey: '#SWE-DOC-8842',
    patientCount: 4,
  },
  {
    id: 'DOC-02',
    name: 'BS. Trần Minh',
    nameEn: 'Dr. Tran Minh',
    specialtyVi: 'Khoa Tâm Thần & Giấc Ngủ',
    specialtyEn: 'Psychiatry & Sleep Medicine',
    sweKey: '#SWE-DOC-3109',
    patientCount: 3,
  },
  {
    id: 'DOC-03',
    name: 'BS. Phạm Hùng',
    nameEn: 'Dr. Pham Hung',
    specialtyVi: 'Khoa Nội Tiết & Chuyển Hóa',
    specialtyEn: 'Endocrinology & Metabolism',
    sweKey: '#SWE-DOC-5521',
    patientCount: 4,
  },
  {
    id: 'DOC-04',
    name: 'BS. Lê Hoàng',
    nameEn: 'Dr. Le Hoang',
    specialtyVi: 'Khoa Cơ Xương Khớp',
    specialtyEn: 'Orthopedics & Rheumatology',
    sweKey: '#SWE-DOC-7740',
    patientCount: 3,
  },
  {
    id: 'DOC-05',
    name: 'BS. Vũ Thảo',
    nameEn: 'Dr. Vu Thao',
    specialtyVi: 'Khoa Tiêu Hóa & Gan Mật',
    specialtyEn: 'Gastroenterology & Hepatology',
    sweKey: '#SWE-DOC-9914',
    patientCount: 3,
  },
  {
    id: 'DOC-06',
    name: 'BS. Đặng Khoa',
    nameEn: 'Dr. Dang Khoa',
    specialtyVi: 'Khoa Hô Hấp & Thần Kinh',
    specialtyEn: 'Pulmonology & Neurology',
    sweKey: '#SWE-DOC-6208',
    patientCount: 3,
  },
];

interface SeedPatientInput {
  id: string;
  name: string;
  age: number;
  genderVi: 'Nam' | 'Nữ';
  docIndex: number;
  coDoctorsVi: string;
  statusVi: string;
  rootCauseChainVi: string;
  primaryCatVi: string;
  primaryTitle: string;
  primaryDiagVi: string;
  primaryPlanVi: string;
  primaryMetrics: Array<{ label: string; value: string; unit: string }>;
  relatedCatVi: string;
  relatedTitle: string;
  relatedDiagVi: string;
  relatedPlanVi: string;
  relatedMetrics: Array<{ label: string; value: string; unit: string }>;
  correlationAlertVi: string;
  thirdCatVi: string;
  thirdTitle: string;
  thirdDiagVi: string;
  thirdPlanVi: string;
  meds: Array<{ name: string; dosageVi: string; deptVi: string }>;
}

const SEED_PATIENTS: SeedPatientInput[] = [
  {
    id: 'BN-101',
    name: 'Nguyễn Văn A',
    age: 34,
    genderVi: 'Nam',
    docIndex: 0,
    coDoctorsVi: 'BS. Trần Minh (Tâm thần), BS. Lê Hoàng (Xương khớp)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'Trầm cảm kéo dài ➔ Ăn đêm tăng 14kg (Béo phì BMI 31.2) ➔ Cao huyết áp 145/92 & Đau lưng L4-L5',
    primaryCatVi: 'Tim mạch & Huyết áp (Đang theo dõi)',
    primaryTitle: 'Cao huyết áp độ 1 (145/92) & Nhịp nhanh xoang (108 bpm)',
    primaryDiagVi: 'Tăng huyết áp 145/92 mmHg kèm nhịp tim nhanh 108 bpm và béo phì độ I (BMI 31.2). Nghi ngờ nguyên nhân gốc từ rối loạn ăn uống do stress.',
    primaryPlanVi: 'Bisoprolol 5mg sáng • Telmisartan 40mg sáng • Cần kiểm tra bệnh án Tâm thần học',
    primaryMetrics: [
      { label: 'Huyết áp', value: '145/92', unit: 'mmHg' },
      { label: 'Nhịp tim', value: '108', unit: 'bpm' },
      { label: 'Chỉ số BMI', value: '31.2', unit: 'Béo phì' },
    ],
    relatedCatVi: 'Tâm thần học (Bệnh gốc gây Béo phì)',
    relatedTitle: 'Trầm cảm công việc & Chứng ăn đêm mất kiểm soát',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Trầm cảm nặng (PHQ-9: 18/27) khiến bệnh nhân ăn nhiều ban đêm tăng 14kg trong 6 tháng, dẫn tới Béo phì và Tăng huyết áp.',
    relatedPlanVi: 'Sertraline 50mg tối • Trị liệu CBT kiểm soát ăn đêm • Phối hợp khoa Tim mạch',
    relatedMetrics: [
      { label: 'Điểm PHQ-9', value: '18/27', unit: 'Nặng' },
      { label: 'Tăng cân', value: '+14 kg', unit: '6 tháng' },
      { label: 'Thuốc SSRI', value: 'Sertraline', unit: '50mg' },
    ],
    correlationAlertVi: '🔗 Phát hiện bệnh [Cao huyết áp & Béo phì] có nguyên nhân gốc từ hồ sơ [Tâm thần học] đang khóa (Trầm cảm gây ăn nhiều + dùng Sertraline).',
    thirdCatVi: 'Cơ xương khớp (Hệ quả tăng cân)',
    thirdTitle: 'Lồi đĩa đệm cột sống thắt lưng L4-L5 (3.5mm)',
    thirdDiagVi: 'Đau thắt lưng L4-L5 trở nặng do tăng 14kg đột ngột tạo áp lực lên cột sống.',
    thirdPlanVi: 'Vật lý trị liệu dưới nước • Giảm cân phối hợp',
    meds: [
      { name: 'Bisoprolol 5mg', dosageVi: '1 viên sáng • Hạ nhịp tim', deptVi: 'Khoa Tim mạch' },
      { name: 'Telmisartan 40mg', dosageVi: '1 viên sáng • Ổn định huyết áp', deptVi: 'Khoa Tim mạch' },
      { name: 'Sertraline 50mg', dosageVi: '1 viên tối • Trị trầm cảm & ăn đêm', deptVi: 'Khoa Tâm thần' },
    ],
  },
  {
    id: 'BN-102',
    name: 'Trần Thị Bích Ngọc',
    age: 42,
    genderVi: 'Nữ',
    docIndex: 2,
    coDoctorsVi: 'BS. Alice Nguyễn (Tim mạch), BS. Vũ Thảo (Tiêu hóa)',
    statusVi: 'Đang theo dõi tích cực',
    rootCauseChainVi: 'Hội chứng buồng trứng đa nang & Kháng Insulin ➔ Đái tháo đường Tuýp 2 ➔ Gan nhiễm mỡ độ 2 & Rối loạn mỡ máu',
    primaryCatVi: 'Nội tiết & Đái tháo đường (Đang theo dõi)',
    primaryTitle: 'Đái tháo đường Tuýp 2 (HbA1c 8.4%) & Kháng Insulin',
    primaryDiagVi: 'Đường huyết lúc đói cao (168 mg/dL), HbA1c 8.4%. Cần kiểm tra tổn thương gan mật và tim mạch đi kèm.',
    primaryPlanVi: 'Metformin 1000mg • Empagliflozin 10mg • Kiểm soát tinh bột',
    primaryMetrics: [
      { label: 'Chỉ số HbA1c', value: '8.4%', unit: 'Cao' },
      { label: 'Đường huyết đói', value: '168', unit: 'mg/dL' },
      { label: 'HOMA-IR', value: '4.8', unit: 'Kháng Insulin' },
    ],
    relatedCatVi: 'Tiêu hóa & Gan mật (Biến chứng liên quan)',
    relatedTitle: 'Gan nhiễm mỡ chuyển hóa độ 2 (MASLD) & Men gan cao',
    relatedDiagVi: 'BỆNH LIÊN QUAN: Men gan ALT/AST tăng gấp 2.5 lần do kháng insulin và gan nhiễm mỡ độ 2. Cần điều chỉnh thuốc hạ đường huyết tránh hại gan.',
    relatedPlanVi: 'Silymarin 140mg • Đổi phác đồ ưu tiên GLP-1/SGLT2 bảo vệ gan',
    relatedMetrics: [
      { label: 'Men gan ALT', value: '94', unit: 'U/L (Cao)' },
      { label: 'Độ nhiễm mỡ', value: 'Độ II', unit: 'Siêu âm đàn hồi' },
      { label: 'Triglyceride', value: '260', unit: 'mg/dL' },
    ],
    correlationAlertVi: '🔗 Phát hiện bệnh [Đái tháo đường HbA1c 8.4%] có liên quan mật thiết với hồ sơ [Gan mật] đang khóa (Tăng men gan & Gan nhiễm mỡ độ 2).',
    thirdCatVi: 'Tim mạch & Mỡ máu',
    thirdTitle: 'Rối loạn Lipid máu hỗn hợp & Xơ vữa cảnh nhẹ',
    thirdDiagVi: 'LDL-C tăng cao (155 mg/dL) thứ phát sau rối loạn chuyển hóa đường.',
    thirdPlanVi: 'Rosuvastatin 10mg tối • Theo dõi men gan định kỳ',
    meds: [
      { name: 'Metformin XR 1000mg', dosageVi: '1 viên sau ăn tối • Hạ đường huyết', deptVi: 'Khoa Nội tiết' },
      { name: 'Empagliflozin 10mg', dosageVi: '1 viên sáng • Đào thải đường', deptVi: 'Khoa Nội tiết' },
      { name: 'Rosuvastatin 10mg', dosageVi: '1 viên tối • Hạ mỡ máu', deptVi: 'Khoa Tim mạch' },
    ],
  },
  {
    id: 'BN-103',
    name: 'Lê Hoàng Nam',
    age: 51,
    genderVi: 'Nam',
    docIndex: 4,
    coDoctorsVi: 'BS. Lê Hoàng (Xương khớp), BS. Alice Nguyễn (Tim mạch)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'Viêm khớp Gout tự dùng thuốc giảm đau NSAID liều cao ➔ Loét hang vị dạ dày xuất huyết & Thiếu máu',
    primaryCatVi: 'Tiêu hóa & Dạ dày (Đang theo dõi)',
    primaryTitle: 'Viêm loét hang vị dạ dày cấp (Forrest III) & Thiếu máu nhẹ',
    primaryDiagVi: 'Đau thượng vị dữ dội, nội soi thấy ổ loét hang vị 12mm, HP âm tính. Nghi ngờ do lạm dụng thuốc kháng viêm giảm đau từ chuyên khoa khác.',
    primaryPlanVi: 'Esomeprazole 40mg 2 lần/ngày • Sucralfate • Tìm nguyên nhân dùng thuốc giảm đau',
    primaryMetrics: [
      { label: 'Ổ loét hang vị', value: '12 mm', unit: 'Forrest III' },
      { label: 'Hemoglobin', value: '11.4', unit: 'g/dL (Thấp)' },
      { label: 'Vi khuẩn HP', value: 'Âm tính', unit: 'CLO-test' },
    ],
    relatedCatVi: 'Cơ xương khớp (Nguyên nhân dùng thuốc gây loét)',
    relatedTitle: 'Viêm khớp Gout mạn tính — Tự uống Diclofenac & Corticoid',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Bệnh nhân bị Gout cấp (Acid Uric 540 µmol/L), tự ý uống Diclofenac 75mg liên tục 3 tuần lúc đói gây thủng/loét niêm mạc dạ dày.',
    relatedPlanVi: 'Ngưng ngay NSAID truyền thống • Chuyển sang Colchicine liều thấp + Febuxostat 40mg',
    relatedMetrics: [
      { label: 'Acid Uric máu', value: '540', unit: 'µmol/L' },
      { label: 'Thuốc gây loét', value: 'Diclofenac', unit: 'NSAID liều cao' },
      { label: 'Khớp sưng đau', value: 'Ngón chân cái', unit: 'Cấp tính' },
    ],
    correlationAlertVi: '🔗 Phát hiện ổ [Loét dạ dày HP âm tính] bắt nguồn từ thuốc kháng viêm trong hồ sơ [Cơ xương khớp] đang khóa (Điều trị Gout bằng NSAID).',
    thirdCatVi: 'Thận & Tiết niệu',
    thirdTitle: 'Sỏi urat thận phải 6mm & Giảm nhẹ độ lọc cầu thận',
    thirdDiagVi: 'Lắng đọng tinh thể urat tại thận do Gout kéo dài và uống ít nước.',
    thirdPlanVi: 'Kiềm hóa nước tiểu • Uống > 2.5L nước/ngày',
    meds: [
      { name: 'Esomeprazole 40mg', dosageVi: '1 viên trước ăn sáng 30p • Lành ổ loét', deptVi: 'Khoa Tiêu hóa' },
      { name: 'Febuxostat 40mg', dosageVi: '1 viên sáng • Hạ Acid Uric máu', deptVi: 'Khoa Xương khớp' },
      { name: 'Sucralfate 1g', dosageVi: '3 gói/ngày • Bọc niêm mạc dạ dày', deptVi: 'Khoa Tiêu hóa' },
    ],
  },
  {
    id: 'BN-104',
    name: 'Phạm Minh Tuấn',
    age: 29,
    genderVi: 'Nam',
    docIndex: 5,
    coDoctorsVi: 'BS. Vũ Thảo (Tiêu hóa), BS. Trần Minh (Giấc ngủ)',
    statusVi: 'Đang theo dõi tích cực',
    rootCauseChainVi: 'Trào ngược dạ dày thực quản (GERD) ban đêm ➔ Co thắt phế quản phản xạ ➔ Hen suyễn & Ho kéo dài về đêm',
    primaryCatVi: 'Hô hấp & Phổi (Đang theo dõi)',
    primaryTitle: 'Hen phế quản khởi phát ban đêm & Ho khan mạn tính 3 tháng',
    primaryDiagVi: 'Khò khè, khó thở về đêm (2–3h sáng), đo hô hấp ký FEV1 76%. Dùng ống hít giãn phế quản chỉ đỡ tạm thời, nghi do trào ngược axit kích thích phế quản.',
    primaryPlanVi: 'Budesonide/Formoterol hít • Cần phối hợp điều trị trào ngược dạ dày gốc',
    primaryMetrics: [
      { label: 'Chỉ số FEV1', value: '76%', unit: 'Giảm nhẹ' },
      { label: 'Cơn ho đêm', value: '4-5 lần', unit: '/ tuần' },
      { label: 'FeNO hơi thở', value: '38', unit: 'ppb' },
    ],
    relatedCatVi: 'Tiêu hóa (Bệnh gốc gây Hen ban đêm)',
    relatedTitle: 'Trào ngược dạ dày thực quản (GERD độ B) & Ăn khuya',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Axit dạ dày trào ngược lên thanh quản khi nằm ngủ gây phản xạ co thắt phế quản và cơn hen giả mỗi đêm.',
    relatedPlanVi: 'Rabeprazole 20mg trước ăn tối • Nằm kê cao đầu 15cm • Ngưng ăn trước ngủ 3 giờ',
    relatedMetrics: [
      { label: 'Nội soi thực quản', value: 'GERD độ B', unit: 'Trào ngược' },
      { label: 'pH thực quản đêm', value: '< 4.0', unit: 'Axit cao' },
      { label: 'Thói quen', value: 'Ăn khuya', unit: '23h đêm' },
    ],
    correlationAlertVi: '🔗 Phát hiện chứng [Hen & Ho ban đêm không dứt] có nguyên nhân gốc từ hồ sơ [Tiêu hóa] đang khóa (Trào ngược axit GERD kích thích đường thở).',
    thirdCatVi: 'Tai Mũi Họng',
    thirdTitle: 'Viêm thanh quản mạn tính vùng sụn phễu',
    thirdDiagVi: 'Phù nề dây thanh âm do dịch vị dạ dày trào lên ban đêm.',
    thirdPlanVi: 'Súc họng kiềm • Điều trị GERD triệt để',
    meds: [
      { name: 'Symbicort (Budesonide)', dosageVi: 'Hít 2 nhát/ngày • Kiểm soát hen', deptVi: 'Khoa Hô hấp' },
      { name: 'Rabeprazole 20mg', dosageVi: '1 viên trước ăn tối • Chống trào ngược', deptVi: 'Khoa Tiêu hóa' },
      { name: 'Montelukast 10mg', dosageVi: '1 viên tối • Giảm viêm đường thở', deptVi: 'Khoa Hô hấp' },
    ],
  },
  {
    id: 'BN-105',
    name: 'Đỗ Thùy Linh',
    age: 27,
    genderVi: 'Nữ',
    docIndex: 0,
    coDoctorsVi: 'BS. Phạm Hùng (Nội tiết), BS. Trần Minh (Tâm thần)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'Cường giáp Basedow (Tăng hormone tuyến giáp FT4) ➔ Tim đập nhanh 125 bpm, Run tay & Rối loạn lo âu giả định',
    primaryCatVi: 'Tim mạch (Đang theo dõi)',
    primaryTitle: 'Nhịp nhanh xoang liên tục (125 bpm) & Đánh trống ngực',
    primaryDiagVi: 'Bệnh nhân nữ trẻ tuổi tim đập nhanh 125 bpm ngay cả khi nghỉ ngơi, sụt 5kg trong 1 tháng, tay run nhẹ. Cấu trúc van tim bình thường.',
    primaryPlanVi: 'Propranolol 20mg 2 lần/ngày • Bắt buộc kiểm tra hồ sơ Nội tiết tuyến giáp',
    primaryMetrics: [
      { label: 'Nhịp tim nghỉ', value: '125', unit: 'bpm (Rất nhanh)' },
      { label: 'Sụt cân', value: '-5.2 kg', unit: '/ 1 tháng' },
      { label: 'Siêu âm tim', value: 'EF 66%', unit: 'Van bình thường' },
    ],
    relatedCatVi: 'Nội tiết & Tuyến giáp (Nguyên nhân gốc)',
    relatedTitle: 'Bệnh Cường giáp Basedow (TSH < 0.01, FT4 tăng gấp 3)',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Nhiễm độc giáp (Basedow) làm tăng chuyển hóa toàn thân và kích thích giao cảm gây nhịp tim 125 bpm và hoảng sợ.',
    relatedPlanVi: 'Methimazole (Thyrozol) 10mg 2 viên/ngày • Theo dõi công thức máu & chức năng gan',
    relatedMetrics: [
      { label: 'Hormone TSH', value: '0.005', unit: 'mIU/L (Cực thấp)' },
      { label: 'Free T4 (FT4)', value: '4.2', unit: 'ng/dL (Tăng x3)' },
      { label: 'Kháng thể TRAb', value: 'Dương tính', unit: 'Basedow' },
    ],
    correlationAlertVi: '🔗 Phát hiện [Nhịp tim nhanh 125 bpm & Sụt cân] bắt nguồn trực tiếp từ hồ sơ [Nội tiết Tuyến giáp] đang khóa (Cường giáp Basedow).',
    thirdCatVi: 'Tâm thần & Giấc ngủ',
    thirdTitle: 'Rối loạn lo âu thứ phát & Mất ngủ do nhiễm độc giáp',
    thirdDiagVi: 'Cáu gắt, bồn chồn và mất ngủ là triệu chứng của cường giáp chứ không phải bệnh tâm thần nguyên phát.',
    thirdPlanVi: 'Không cần thuốc chống trầm cảm • Sẽ hết khi bình giáp',
    meds: [
      { name: 'Methimazole 10mg', dosageVi: '2 viên/ngày • Kháng giáp trạng gốc', deptVi: 'Khoa Nội tiết' },
      { name: 'Propranolol 20mg', dosageVi: '2 viên/ngày • Giảm nhịp tim & run tay', deptVi: 'Khoa Tim mạch' },
    ],
  },
  {
    id: 'BN-106',
    name: 'Vũ Quốc Huy',
    age: 46,
    genderVi: 'Nam',
    docIndex: 3,
    coDoctorsVi: 'BS. Vũ Thảo (Tiêu hóa), BS. Phạm Hùng (Nội tiết)',
    statusVi: 'Đang theo dõi tích cực',
    rootCauseChainVi: 'Viêm cột sống dính khớp HLA-B27 (+) ➔ Viêm đại tràng mạn tính (IBD) & Thiếu hụt Vitamin D/Canxi',
    primaryCatVi: 'Cơ xương khớp (Đang theo dõi)',
    primaryTitle: 'Viêm cột sống dính khớp & Đau khớp cùng chậu hai bên',
    primaryDiagVi: 'Đau cứng lưng buổi sáng > 60 phút, xét nghiệm HLA-B27 dương tính, MRI thấy phù tủy xương khớp cùng chậu.',
    primaryPlanVi: 'Thuốc sinh học hoặc Sulfasalazine • Cần lưu ý bệnh lý đường ruột đi kèm',
    primaryMetrics: [
      { label: 'Gen HLA-B27', value: 'Dương tính', unit: 'Đặc hiệu' },
      { label: 'Chỉ số viêm CRP', value: '28.5', unit: 'mg/L (Cao)' },
      { label: 'Độ giãn thắt lưng', value: '2.1 cm', unit: 'Hạn chế' },
    ],
    relatedCatVi: 'Tiêu hóa & Đại tràng (Bệnh tự miễn đi kèm)',
    relatedTitle: 'Viêm loét đại trực tràng chảy máu (IBD thể nhẹ-vừa)',
    relatedDiagVi: 'BỆNH LIÊN QUAN TRỰC TIẾP: Hội chứng trục Ruột - Khớp. Tuyệt đối KHÔNG được kê NSAID liều cao vì sẽ làm bùng phát xuất huyết đại tràng!',
    relatedPlanVi: 'Mesalamine 1000mg • Ưu tiên phác đồ kháng TNF-alpha điều trị kép cả Khớp và Đại tràng',
    relatedMetrics: [
      { label: 'Calprotectin phân', value: '420', unit: 'µg/g (Viêm cao)' },
      { label: 'Nội soi đại tràng', value: 'Viêm loét', unit: 'Trực tràng' },
      { label: 'Chống chỉ định', value: 'Cấm NSAID', unit: 'Nguy cơ xuất huyết' },
    ],
    correlationAlertVi: '🔗 Cảnh báo An toàn Thuốc: Hồ sơ [Tiêu hóa] đang khóa ghi nhận bệnh nhân bị [Viêm loét đại tràng IBD] — chống chỉ định dùng thuốc giảm đau khớp NSAID!',
    thirdCatVi: 'Mắt & Nhãn khoa',
    thirdTitle: 'Tiền sử viêm màng bồ đào trước cấp tính mắt trái',
    thirdDiagVi: 'Đỏ mắt, sợ ánh sáng liên quan đến cơ địa HLA-B27.',
    thirdPlanVi: 'Khám mắt ngay khi có triệu chứng đỏ mắt',
    meds: [
      { name: 'Sulfasalazine 500mg', dosageVi: '2 viên x 2 lần/ngày • Trị cả khớp & ruột', deptVi: 'Khoa Xương khớp' },
      { name: 'Mesalamine 1g', dosageVi: '1 viên/ngày • Ổn định niêm mạc đại tràng', deptVi: 'Khoa Tiêu hóa' },
    ],
  },
  {
    id: 'BN-107',
    name: 'Hoàng Thanh Mai',
    age: 38,
    genderVi: 'Nữ',
    docIndex: 1,
    coDoctorsVi: 'BS. Đặng Khoa (Thần kinh), BS. Alice Nguyễn (Tim mạch)',
    statusVi: 'Điều trị ngoại trú',
    rootCauseChainVi: 'Rối loạn hoảng sợ (Panic Disorder) ➔ Cơn đau thắt ngực giả định & Đau đầu Migraine mạn tính',
    primaryCatVi: 'Tâm thần học (Đang theo dõi)',
    primaryTitle: 'Rối loạn hoảng sợ (Panic Attacks) & Lo âu bệnh tật',
    primaryDiagVi: 'Thường xuyên nhập viện cấp cứu vì cảm giác tim đập thình thịch, nghẹt thở, sợ tử vong kéo dài 15-20 phút.',
    primaryPlanVi: 'Escitalopram 10mg sáng • Kỹ thuật thở cơ hoành & CBT',
    primaryMetrics: [
      { label: 'Cơn hoảng sợ', value: '3 lần', unit: '/ tuần' },
      { label: 'Thang điểm HAMA', value: '24', unit: 'Lo âu nặng' },
      { label: 'SpO2 trong cơn', value: '99%', unit: 'Bình thường' },
    ],
    relatedCatVi: 'Thần kinh (Bệnh đi kèm)',
    relatedTitle: 'Đau nửa đầu Migraine có tiền triệu (Aura) & Mất ngủ',
    relatedDiagVi: 'BỆNH LIÊN QUAN: Đau nửa đầu Migraine xuất hiện trước các đợt hoảng sợ. Cần tránh dùng Triptan quá liều gây hội chứng Serotonin khi kết hợp SSRI.',
    relatedPlanVi: 'Magnesium Citrate 400mg • Propranolol dự phòng kép Migraine & Nhịp nhanh',
    relatedMetrics: [
      { label: 'Số ngày đau đầu', value: '8 ngày', unit: '/ tháng' },
      { label: 'Tương tác thuốc', value: 'SSRI + Triptan', unit: 'Cần thận trọng' },
      { label: 'MRI Sọ não', value: 'Bình thường', unit: 'Không u/mạch dị dạng' },
    ],
    correlationAlertVi: '🔗 Phát hiện tương tác thuốc giữa [Escitalopram] đang kê và thuốc cắt cơn [Migraine] trong hồ sơ [Thần kinh] đang khóa.',
    thirdCatVi: 'Tim mạch',
    thirdTitle: 'Loại trừ bệnh mạch vành (Troponin I âm tính, Điện tim bình thường)',
    thirdDiagVi: 'Đau ngực hoàn toàn do cơn hoảng sợ thần kinh thực vật, mạch vành thông thoáng.',
    thirdPlanVi: 'Tư vấn trấn an bệnh nhân',
    meds: [
      { name: 'Escitalopram 10mg', dosageVi: '1 viên sáng • Ngừa cơn hoảng sợ', deptVi: 'Khoa Tâm thần' },
      { name: 'Magnesium B6', dosageVi: '2 viên/ngày • Giảm Migraine & dịu thần kinh', deptVi: 'Khoa Thần kinh' },
    ],
  },
  {
    id: 'BN-108',
    name: 'Ngô Đức Anh',
    age: 55,
    genderVi: 'Nam',
    docIndex: 0,
    coDoctorsVi: 'BS. Đặng Khoa (Hô hấp), BS. Phạm Hùng (Nội tiết)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'Hội chứng Ngưng thở khi ngủ (OSA nặng) ➔ Thiếu oxy máu ban đêm ➔ Tăng huyết áp kháng trị buổi sáng (165/100)',
    primaryCatVi: 'Tim mạch (Đang theo dõi)',
    primaryTitle: 'Tăng huyết áp kháng trị buổi sáng (165/100 mmHg)',
    primaryDiagVi: 'Dù đã phối hợp 3 thuốc hạ áp, huyết áp lúc mới ngủ dậy vẫn vọt lên 165/100 mmHg kèm đau đầu vùng chẩm và buồn ngủ ngày.',
    primaryPlanVi: 'Amlodipine 5mg + Valsartan 160mg • Tìm nguyên nhân gây tăng huyết áp ban đêm',
    primaryMetrics: [
      { label: 'HA sáng sớm', value: '165/100', unit: 'mmHg (Kháng trị)' },
      { label: 'Vòng cổ', value: '43 cm', unit: 'Nguy cơ cao' },
      { label: 'Holter HA 24h', value: 'Non-dipper', unit: 'Tăng HA đêm' },
    ],
    relatedCatVi: 'Hô hấp & Giấc ngủ (Nguyên nhân gốc)',
    relatedTitle: 'Đa ký giấc ngủ: Ngưng thở khi ngủ tắc nghẽn mức độ nặng (AHI = 34/giờ)',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Bệnh nhân ngưng thở 34 lần mỗi giờ khi ngủ, SpO2 tụt xuống 82% kích thích giao cảm làm huyết áp tăng vọt không thuốc nào hạ nổi.',
    relatedPlanVi: 'Thở máy áp lực dương liên tục (CPAP) khi ngủ -> Giúp hạ huyết áp tự nhiên 15-20 mmHg',
    relatedMetrics: [
      { label: 'Chỉ số AHI', value: '34 lần', unit: '/ giờ (Nặng)' },
      { label: 'SpO2 thấp nhất', value: '82%', unit: 'Thiếu oxy đêm' },
      { label: 'Điều trị gốc', value: 'Máy CPAP', unit: 'Bắt buộc' },
    ],
    correlationAlertVi: '🔗 Phát hiện nguyên nhân gốc của [Tăng huyết áp kháng trị] nằm trong hồ sơ [Hô hấp & Giấc ngủ] đang khóa (Ngưng thở khi ngủ AHI 34/giờ).',
    thirdCatVi: 'Nội tiết & Chuyển hóa',
    thirdTitle: 'Tiền đái tháo đường (HbA1c 6.1%) & Rối loạn mỡ máu',
    thirdDiagVi: 'Thiếu oxy gián đoạn ban đêm làm tăng kháng insulin.',
    thirdPlanVi: 'Giảm 5% cân nặng • Tập thể dục nhịp điệu',
    meds: [
      { name: 'Exforge (Amlo/Val 5/160)', dosageVi: '1 viên tối • Kiểm soát huyết áp', deptVi: 'Khoa Tim mạch' },
      { name: 'Indapamide 1.5mg', dosageVi: '1 viên sáng • Lợi tiểu hạ áp', deptVi: 'Khoa Tim mạch' },
    ],
  },
  {
    id: 'BN-109',
    name: 'Bùi Thị Lan Hương',
    age: 31,
    genderVi: 'Nữ',
    docIndex: 2,
    coDoctorsVi: 'BS. Trần Minh (Tâm thần), BS. Lê Hoàng (Xương khớp)',
    statusVi: 'Tái khám định kỳ',
    rootCauseChainVi: 'Suy giáp Hashimoto (Tuyến giáp hoạt động kém) ➔ Mệt mỏi kiệt sức, Trầm cảm giả & Tăng cholesterol máu',
    primaryCatVi: 'Nội tiết (Đang theo dõi)',
    primaryTitle: 'Viêm tuyến giáp tự miễn Hashimoto & Suy giáp dưới lâm sàng',
    primaryDiagVi: 'Mệt mỏi triền miên, sợ lạnh, rụng tóc, tăng cân dù ăn ít. TSH tăng cao (11.8 mIU/L), Anti-TPO dương tính mạnh.',
    primaryPlanVi: 'Levothyroxine 50mcg uống lúc đói sáng • Tái khám sau 6 tuần',
    primaryMetrics: [
      { label: 'Hormone TSH', value: '11.8', unit: 'mIU/L (Cao)' },
      { label: 'Anti-TPO', value: '650', unit: 'IU/mL (+)' },
      { label: 'Cholesterol TP', value: '245', unit: 'mg/dL' },
    ],
    relatedCatVi: 'Tâm thần học (Triệu chứng chồng lấp)',
    relatedTitle: 'Khí sắc trầm buồn & Chậm chạp tâm thần vận động do Suy giáp',
    relatedDiagVi: 'LIÊN KẾT QUAN TRỌNG: Triệu chứng buồn bã, giảm tập trung của bệnh nhân là hệ quả của thiếu hormone giáp T3/T4 lên não. Bổ sung Levothyroxine sẽ cải thiện khí sắc.',
    relatedPlanVi: 'Theo dõi đáp ứng với hormone giáp trước khi dùng thuốc chống trầm cảm',
    relatedMetrics: [
      { label: 'Nguyên nhân', value: 'Nội tiết', unit: 'Do thiếu T4' },
      { label: 'Trí nhớ/Tập trung', value: 'Sương mù não', unit: 'Tạm thời' },
      { label: 'Tiên lượng', value: 'Hồi phục tốt', unit: 'Sau 4 tuần' },
    ],
    correlationAlertVi: '🔗 Hồ sơ [Tâm thần học] đang khóa có liên hệ trực tiếp với bệnh [Suy giáp Hashimoto] (Thiếu hormone giáp gây trầm cảm thứ phát).',
    thirdCatVi: 'Cơ xương khớp',
    thirdTitle: 'Đau mỏi cơ toàn thân & Hội chứng ống cổ tay nhẹ',
    thirdDiagVi: 'Phù niêm mô mềm cổ tay do suy giáp chèn ép dây thần kinh giữa.',
    thirdPlanVi: 'Nẹp cổ tay ban đêm • Hết phù khi bình giáp',
    meds: [
      { name: 'Levothyroxine 50mcg', dosageVi: '1 viên trước ăn sáng 30p • Bù hormone giáp', deptVi: 'Khoa Nội tiết' },
      { name: 'Selenium 100mcg', dosageVi: '1 viên/ngày • Giảm kháng thể tự miễn', deptVi: 'Khoa Nội tiết' },
    ],
  },
  {
    id: 'BN-110',
    name: 'Đặng Văn Khải',
    age: 60,
    genderVi: 'Nam',
    docIndex: 0,
    coDoctorsVi: 'BS. Phạm Hùng (Nội tiết), BS. Lê Hoàng (Xương khớp)',
    statusVi: 'Đang theo dõi tích cực',
    rootCauseChainVi: 'Đái tháo đường 10 năm ➔ Tổn thương thần kinh tự chủ tim mạch (Hạ huyết áp tư thế) & Đau thần kinh ngoại biên',
    primaryCatVi: 'Tim mạch (Đang theo dõi)',
    primaryTitle: 'Rối loạn huyết áp dao động & Hạ huyết áp tư thế đứng',
    primaryDiagVi: 'Chóng mặt tối sầm mắt khi đứng dậy (HA tụt 25 mmHg), nhưng khi nằm lại tăng huyết áp.',
    primaryPlanVi: 'Điều chỉnh liều thuốc hạ áp • Kiểm tra biến chứng thần kinh đái tháo đường',
    primaryMetrics: [
      { label: 'HA khi nằm', value: '150/88', unit: 'mmHg' },
      { label: 'HA khi đứng', value: '115/70', unit: 'Tụt 35 mmHg' },
      { label: 'Nhịp tim nghỉ', value: '92', unit: 'bpm' },
    ],
    relatedCatVi: 'Nội tiết & Biến chứng Thần kinh (Nguyên nhân gốc)',
    relatedTitle: 'Bệnh thần kinh tự chủ do Đái tháo đường (CAN) & Tê bì hai bàn chân',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Đường huyết cao kéo dài gây tổn thương dây thần kinh phế vị điều hòa mạch máu, làm mạch không co kịp khi đứng dậy.',
    relatedPlanVi: 'Dapagliflozin 10mg • Alpha-Lipoic Acid 600mg • Mang vớ y khoa áp lực',
    relatedMetrics: [
      { label: 'Thời gian mắc ĐTĐ', value: '10 năm', unit: 'Tuýp 2' },
      { label: 'Cảm giác bàn chân', value: 'Giảm 40%', unit: 'Monofilament' },
      { label: 'HbA1c hiện tại', value: '7.6%', unit: 'Cần hạ thêm' },
    ],
    correlationAlertVi: '🔗 Phát hiện chứng [Hạ huyết áp tư thế đứng] là biến chứng từ hồ sơ [Nội tiết - Đái tháo đường] đang khóa.',
    thirdCatVi: 'Mắt & Võng mạc',
    thirdTitle: 'Bệnh võng mạc đái tháo đường không tăng sinh nhẹ',
    thirdDiagVi: 'Soi đáy mắt có vi phình mạch rải rác.',
    thirdPlanVi: 'Kiểm soát chặt HbA1c < 7.0% và huyết áp',
    meds: [
      { name: 'Dapagliflozin 10mg', dosageVi: '1 viên sáng • Bảo vệ tim thận', deptVi: 'Khoa Nội tiết' },
      { name: 'Alpha-Lipoic Acid 600mg', dosageVi: '1 viên/ngày • Phục hồi dây thần kinh', deptVi: 'Khoa Nội tiết' },
    ],
  },
  {
    id: 'BN-111',
    name: 'Lý Mỹ Dung',
    age: 36,
    genderVi: 'Nữ',
    docIndex: 4,
    coDoctorsVi: 'BS. Trần Minh (Tâm thần), BS. Vũ Thảo (Tiêu hóa)',
    statusVi: 'Điều trị ngoại trú',
    rootCauseChainVi: 'Căng thẳng lo âu mạn tính (Trục Não - Ruột) ➔ Hội chứng ruột kích thích thể tiêu chảy (IBS-D)',
    primaryCatVi: 'Tiêu hóa (Đang theo dõi)',
    primaryTitle: 'Hội chứng Ruột kích thích (IBS-D) & Đau quặn bụng buổi sáng',
    primaryDiagVi: 'Đau bụng và tiêu chảy ngay khi căng thẳng hoặc trước cuộc họp quan trọng. Nội soi đại tràng hoàn toàn bình thường.',
    primaryPlanVi: 'Trimebutine 200mg • Chế độ ăn Low-FODMAP • Cần phối hợp điều hòa trục Não - Ruột',
    primaryMetrics: [
      { label: 'Nội soi đại tràng', value: 'Bình thường', unit: 'Không tổn thương' },
      { label: 'Tần suất đau bụng', value: 'Mỗi sáng', unit: 'Khi căng thẳng' },
      { label: 'Calprotectin', value: '18', unit: 'µg/g (Không viêm)' },
    ],
    relatedCatVi: 'Tâm thần học (Nguyên nhân kích hoạt Trục Não - Ruột)',
    relatedTitle: 'Rối loạn lo âu lan tỏa (GAD) & Tăng nhạy cảm nội tạng',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Căng thẳng thần kinh trung ương kích hoạt dây thần kinh phế vị làm tăng nhu động ruột quá mức.',
    relatedPlanVi: 'Amitriptyline liều rất thấp (10mg tối) giúp êm dịu thần kinh ruột & ngủ sâu',
    relatedMetrics: [
      { label: 'Điểm lo âu GAD-7', value: '15/21', unit: 'Trung bình-Nặng' },
      { label: 'Liên kết bệnh', value: 'Trục Não-Ruột', unit: 'Trực tiếp' },
      { label: 'Giấc ngủ', value: 'Hay giật mình', unit: 'Nông' },
    ],
    correlationAlertVi: '🔗 Phát hiện [Hội chứng ruột kích thích IBS] được kích hoạt trực tiếp bởi chứng [Rối loạn lo âu] trong hồ sơ [Tâm thần học] đang khóa.',
    thirdCatVi: 'Dinh dưỡng',
    thirdTitle: 'Bất dung nạp Lactose & Nhạy cảm Fructan',
    thirdDiagVi: 'Đầy hơi chướng bụng sau khi uống sữa tươi.',
    thirdPlanVi: 'Dùng sữa không đường lactose • Men vi sinh Saccharomyces boulardii',
    meds: [
      { name: 'Trimebutine 200mg', dosageVi: '2 viên/ngày • Điều hòa nhu động ruột', deptVi: 'Khoa Tiêu hóa' },
      { name: 'Amitriptyline 10mg', dosageVi: '1 viên tối • Dịu trục thần kinh Não-Ruột', deptVi: 'Khoa Tâm thần' },
    ],
  },
  {
    id: 'BN-112',
    name: 'Trương Gia Bảo',
    age: 48,
    genderVi: 'Nam',
    docIndex: 5,
    coDoctorsVi: 'BS. Alice Nguyễn (Tim mạch), BS. Đặng Khoa (Thần kinh)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'Rung nhĩ cơn (Loạn nhịp tim tiềm ẩn) ➔ Hình thành huyết khối tiểu nhĩ trái ➔ Cơn thiếu máu não thoáng qua (TIA)',
    primaryCatVi: 'Thần kinh (Đang theo dõi)',
    primaryTitle: 'Cơn thiếu máu não thoáng qua (TIA) — Tê yếu tay phải 10 phút',
    primaryDiagVi: 'Bệnh nhân đột ngột tê yếu tay phải và nói đớ 10 phút rồi tự hồi phục. MRI sọ não thấy chấm nhồi máu nhỏ vỏ não do huyết khối từ nơi khác bắn lên.',
    primaryPlanVi: 'Cần tìm nguồn huyết khối từ Tim mạch để dùng thuốc kháng đông đúng loại',
    primaryMetrics: [
      { label: 'Thang điểm ABCD2', value: '5/7 điểm', unit: 'Nguy cơ đột quỵ cao' },
      { label: 'MRI Sọ não (DWI)', value: 'Vi nhồi máu', unit: 'Nguồn từ tim' },
      { label: 'Động mạch cảnh', value: 'Không hẹp', unit: 'Siêu âm Doppler' },
    ],
    relatedCatVi: 'Tim mạch (Nguồn gốc gây huyết khối lên não)',
    relatedTitle: 'Holter Điện tâm đồ 72h: Phát hiện Rung nhĩ cơn (Paroxysmal AFib)',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Rung nhĩ cơn xuất hiện về đêm làm ứ máu tạo cục máu đông bắn lên não. Dùng Aspirin đơn thuần sẽ KHÔNG ngừa được đột quỵ, bắt buộc phải đổi sang thuốc kháng đông DOAC (Rivaroxaban)!',
    relatedPlanVi: 'Đổi ngay sang Rivaroxaban 20mg/ngày • Kiểm soát tần số thất bằng Bisoprolol',
    relatedMetrics: [
      { label: 'Holter ECG 72h', value: 'Rung nhĩ cơn', unit: 'Kéo dài 4 giờ' },
      { label: 'CHA2DS2-VASc', value: '4 điểm', unit: 'Bắt buộc kháng đông' },
      { label: 'Thuốc bắt buộc', value: 'Rivaroxaban', unit: 'Thay cho Aspirin' },
    ],
    correlationAlertVi: '🔗 CẢNH BÁO ĐỘT QUỴ: Cơn [Thiếu máu não TIA] có nguyên nhân gốc từ chứng [Rung nhĩ cơn] nằm trong hồ sơ [Tim mạch] đang khóa!',
    thirdCatVi: 'Nội tiết & Mỡ máu',
    thirdTitle: 'Tăng LDL-Cholesterol (148 mg/dL)',
    thirdDiagVi: 'Yếu tố nguy cơ mạch máu đi kèm.',
    thirdPlanVi: 'Atorvastatin 20mg tối',
    meds: [
      { name: 'Rivaroxaban 20mg', dosageVi: '1 viên trong bữa tối • Ngừa huyết khối đột quỵ', deptVi: 'Khoa Tim mạch' },
      { name: 'Atorvastatin 20mg', dosageVi: '1 viên tối • Ổn định thành mạch', deptVi: 'Khoa Thần kinh' },
    ],
  },
  {
    id: 'BN-113',
    name: 'Phan Thanh Thảo',
    age: 25,
    genderVi: 'Nữ',
    docIndex: 3,
    coDoctorsVi: 'BS. Đặng Khoa (Thần kinh), BS. Vũ Thảo (Tiêu hóa)',
    statusVi: 'Đang theo dõi tích cực',
    rootCauseChainVi: 'Bệnh Lupus ban đỏ hệ thống (Tự miễn) ➔ Đau đa khớp nhỏ bàn tay & Viêm cầu thận Lupus tiềm ẩn',
    primaryCatVi: 'Cơ xương khớp & Miễn dịch (Đang theo dõi)',
    primaryTitle: 'Đau sưng đối xứng khớp cổ tay & bàn ngón tay hai bên',
    primaryDiagVi: 'Nữ trẻ tuổi đau nhiều khớp nhỏ kèm nhạy cảm ánh nắng mặt trời. Kháng thể kháng nhân ANA và Anti-dsDNA dương tính.',
    primaryPlanVi: 'Hydroxychloroquine (HCQ) 200mg • Tầm soát tổn thương thận và huyết học',
    primaryMetrics: [
      { label: 'ANA / Anti-dsDNA', value: 'Dương tính', unit: 'Lupus (SLE)' },
      { label: 'Bổ thể C3/C4', value: 'Giảm thấp', unit: 'Đang hoạt tính' },
      { label: 'Số khớp sưng', value: '6 khớp', unit: 'Hai bàn tay' },
    ],
    relatedCatVi: 'Thận & Tiết niệu (Biến chứng cần phát hiện sớm)',
    relatedTitle: 'Tiểu đạm vi thể (Protein niệu 0.8g/24h) — Viêm cầu thận Lupus độ II',
    relatedDiagVi: 'BỆNH LIÊN QUAN: Lupus đã bắt đầu tấn công màng lọc cầu thận gây rò rỉ đạm qua nước tiểu. Cần phối hợp thuốc ức chế miễn dịch sớm để bảo tồn thận.',
    relatedPlanVi: 'Thêm Mycophenolate Mofetil hoặc Losartan giảm đạm niệu • Khám mắt định kỳ khi dùng HCQ',
    relatedMetrics: [
      { label: 'Đạm niệu 24h', value: '820 mg', unit: 'Tăng (Bình thường <150)' },
      { label: 'eGFR (Chức năng thận)', value: '88', unit: 'mL/phút' },
      { label: 'Hồng cầu niệu', value: '1+', unit: 'Vi thể' },
    ],
    correlationAlertVi: '🔗 Phát hiện bệnh nhân [Đau khớp Lupus] đã có dấu hiệu [Tiểu đạm / Viêm cầu thận] trong hồ sơ [Thận - Tiết niệu] đang khóa.',
    thirdCatVi: 'Huyết học',
    thirdTitle: 'Giảm nhẹ bạch cầu & Thiếu máu mạn tính (Hb 10.8 g/dL)',
    thirdDiagVi: 'Biểu hiện huyết học của bệnh tự miễn hệ thống.',
    thirdPlanVi: 'Bổ sung Acid Folic & Sắt hữu cơ',
    meds: [
      { name: 'Hydroxychloroquine 200mg', dosageVi: '1 viên/ngày • Kiểm soát Lupus nền', deptVi: 'Khoa Xương khớp' },
      { name: 'Losartan 25mg', dosageVi: '1 viên sáng • Giảm đạm niệu bảo vệ thận', deptVi: 'Khoa Thận' },
    ],
  },
  {
    id: 'BN-114',
    name: 'Võ Minh Quân',
    age: 39,
    genderVi: 'Nam',
    docIndex: 1,
    coDoctorsVi: 'BS. Vũ Thảo (Gan mật), BS. Đặng Khoa (Thần kinh)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'Mất ngủ kéo dài & Lạm dụng rượu bia để dễ ngủ ➔ Viêm gan nhiễm mỡ do rượu & Rối loạn thần kinh ngoại biên',
    primaryCatVi: 'Tâm thần & Giấc ngủ (Đang theo dõi)',
    primaryTitle: 'Mất ngủ mạn tính đầu giấc & Phụ thuộc cồn buổi tối',
    primaryDiagVi: 'Bệnh nhân dùng rượu mạnh mỗi tối suốt 1 năm để tự chữa mất ngủ, dẫn đến thức giấc sớm 3h sáng, mệt mỏi và run tay.',
    primaryPlanVi: 'Cắt cơn phụ thuộc cồn an toàn • Chú ý chức năng gan trước khi chọn thuốc ngủ!',
    primaryMetrics: [
      { label: 'Thời gian ngủ', value: '3.5 giờ', unit: '/ đêm' },
      { label: 'Điểm AUDIT-C', value: '8/12', unit: 'Phụ thuộc cồn' },
      { label: 'Run tay sáng', value: 'Có', unit: 'Mức độ nhẹ' },
    ],
    relatedCatVi: 'Tiêu hóa & Gan mật (Cảnh báo suy giảm chuyển hóa thuốc)',
    relatedTitle: 'Viêm gan do rượu (GGT tăng 380 U/L, AST 112 U/L)',
    relatedDiagVi: 'CẢNH BÁO AN TOÀN KÊ ĐƠN: Chức năng gan đang suy giảm mạnh do rượu. Nếu bác sĩ Tâm thần kê các thuốc chuyển hóa qua gan (như Diazepam hay Agomelatine) sẽ gây độc gan cấp tính! Phải chọn thuốc thải trừ qua thận hoặc Lorazepam liều thấp.',
    relatedPlanVi: 'Bổ sung Vitamin B1 (Thiamine) liều cao • Silymarin • Tuyệt đối tránh thuốc độc gan',
    relatedMetrics: [
      { label: 'Men GGT', value: '380', unit: 'U/L (Tăng x7)' },
      { label: 'Tỷ lệ AST/ALT', value: '2.1', unit: 'Đặc trưng do cồn' },
      { label: 'Chống chỉ định', value: 'Thuốc độc gan', unit: 'Cảnh báo đỏ' },
    ],
    correlationAlertVi: '🔗 CẢNH BÁO ĐỘC GAN: Hồ sơ [Gan mật] đang khóa ghi nhận [Men gan GGT 380 U/L rất cao] — cần mở khóa để tránh kê thuốc ngủ gây suy gan!',
    thirdCatVi: 'Thần kinh',
    thirdTitle: 'Thiếu hụt Vitamin B1 gây tê dị cảm hai bàn chân',
    thirdDiagVi: 'Giảm hấp thu Vitamin nhóm B do dùng bia rượu kéo dài.',
    thirdPlanVi: 'Vitamin B1 100mg + B6 + B12 mỗi ngày',
    meds: [
      { name: 'Thiamine (Vitamin B1) 100mg', dosageVi: '2 viên sáng • Bảo vệ tế bào thần kinh', deptVi: 'Khoa Thần kinh' },
      { name: 'L-Ornithine L-Aspartate', dosageVi: '2 gói/ngày • Hạ men gan & giải độc', deptVi: 'Khoa Gan mật' },
    ],
  },
  {
    id: 'BN-115',
    name: 'Đinh Thị Tuyết',
    age: 58,
    genderVi: 'Nữ',
    docIndex: 3,
    coDoctorsVi: 'BS. Phạm Hùng (Nội tiết), BS. Vũ Thảo (Tiêu hóa)',
    statusVi: 'Tái khám định kỳ',
    rootCauseChainVi: 'Cường tuyến cận giáp nguyên phát (Tăng PTH) ➔ Rút canxi từ xương vào máu ➔ Loãng xương nặng & Sỏi thận tái phát',
    primaryCatVi: 'Cơ xương khớp (Đang theo dõi)',
    primaryTitle: 'Loãng xương nặng sau mãn kinh (T-score -3.2) & Đau nhức xương',
    primaryDiagVi: 'Đo mật độ xương DEXA thấy T-score cột sống -3.2 dù bệnh nhân vẫn uống bổ sung Canxi đều đặn suốt 2 năm qua.',
    primaryPlanVi: 'Tuyệt đối kiểm tra nồng độ Canxi máu & Tuyến cận giáp trước khi kê thêm Canxi!',
    primaryMetrics: [
      { label: 'DEXA T-score', value: '-3.2', unit: 'Loãng xương nặng' },
      { label: 'Đáp ứng Canxi uống', value: 'Kém', unit: 'Bất thường' },
      { label: 'Nguy cơ gãy xương', value: 'Cao', unit: 'FRAX 22%' },
    ],
    relatedCatVi: 'Nội tiết (Nguyên nhân gốc làm rỗng xương)',
    relatedTitle: 'U lành tuyến cận giáp dưới phải — Cường cận giáp (PTH 145 pg/mL, Canxi máu cao)',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Tuyến cận giáp tiết quá nhiều hormone PTH rút Canxi từ xương ra máu (Canxi máu đang cao 11.4 mg/dL). Nếu tiếp tục cho uống thêm Canxi sẽ gây tăng Canxi máu nguy hiểm và sỏi thận!',
    relatedPlanVi: 'Ngưng uống bổ sung Canxi • Hội chẩn tiểu phẫu cắt u lành tuyến cận giáp + Truyền Bisphosphonate',
    relatedMetrics: [
      { label: 'Hormone PTH', value: '145', unit: 'pg/mL (Tăng x2.5)' },
      { label: 'Canxi máu toàn phần', value: '11.4', unit: 'mg/dL (Tăng cao)' },
      { label: 'Siêu âm cổ', value: 'Nhân cận giáp', unit: '9mm lành tính' },
    ],
    correlationAlertVi: '🔗 CẢNH BÁO NGUY HIỂM: Bệnh [Loãng xương] bắt nguồn từ [Cường tuyến cận giáp & Tăng Canxi máu] trong hồ sơ [Nội tiết] đang khóa — cấm kê thêm Canxi!',
    thirdCatVi: 'Thận & Tiết niệu',
    thirdTitle: 'Sỏi canxi thận hai bên tái phát 3 lần',
    thirdDiagVi: 'Do lượng canxi đào thải qua nước tiểu quá cao từ bệnh cường cận giáp.',
    thirdPlanVi: 'Uống nhiều nước • Sẽ hết tạo sỏi sau khi xử lý tuyến cận giáp',
    meds: [
      { name: 'Alendronate 70mg', dosageVi: '1 viên/tuần • Giữ canxi lại trong xương', deptVi: 'Khoa Xương khớp' },
      { name: 'Vitamin D3 1000 IU', dosageVi: '1 viên/ngày • Cân bằng chuyển hóa', deptVi: 'Khoa Nội tiết' },
    ],
  },
  {
    id: 'BN-116',
    name: 'Trần Quốc Tuấn',
    age: 44,
    genderVi: 'Nam',
    docIndex: 0,
    coDoctorsVi: 'BS. Lê Hoàng (Xương khớp), BS. Phạm Hùng (Nội tiết)',
    statusVi: 'Đang theo dõi tích cực',
    rootCauseChainVi: 'Hội chứng chuyển hóa (Bụng bia, Kháng Insulin) ➔ Tăng huyết áp + Tăng Acid Uric máu (Gout) + Rối loạn cương dương',
    primaryCatVi: 'Tim mạch (Đang theo dõi)',
    primaryTitle: 'Tăng huyết áp độ 2 (155/96 mmHg) & Hội chứng chuyển hóa',
    primaryDiagVi: 'Vòng bụng 98cm, huyết áp 155/96 mmHg. Cần chọn nhóm thuốc hạ huyết áp có lợi cho chuyển hóa Acid Uric và sinh lý nam.',
    primaryPlanVi: 'Ưu tiên Losartan (vừa hạ áp vừa giúp đào thải Acid Uric) • Tránh thuốc lợi tiểu Thiazide',
    primaryMetrics: [
      { label: 'Huyết áp', value: '155/96', unit: 'mmHg (Độ 2)' },
      { label: 'Vòng bụng', value: '98 cm', unit: 'Béo bụng' },
      { label: 'HDL-C', value: '34', unit: 'mg/dL (Thấp)' },
    ],
    relatedCatVi: 'Cơ xương khớp & Chuyển hóa (Tránh kê nhầm thuốc lợi tiểu)',
    relatedTitle: 'Bệnh Gout mạn tính (Acid Uric 510 µmol/L)',
    relatedDiagVi: 'BỆNH LIÊN QUAN: Bệnh nhân có tiền sử Gout. Nếu bác sĩ Tim mạch kê thuốc hạ áp nhóm Lợi tiểu Thiazide hoặc Chẹn Beta liều cao sẽ làm tăng vọt Acid Uric gây cơn Gout cấp! Nên chọn Losartan + Amlodipine.',
    relatedPlanVi: 'Dùng Losartan 50mg (hạ áp kiêm giảm Acid Uric) + Allopurinol 300mg',
    relatedMetrics: [
      { label: 'Acid Uric', value: '510', unit: 'µmol/L (Cao)' },
      { label: 'Thuốc cần tránh', value: 'Thiazide', unit: 'Gây Gout cấp' },
      { label: 'Thuốc tối ưu', value: 'Losartan', unit: 'Hạ cả HA & Uric' },
    ],
    correlationAlertVi: '🔗 Tối ưu Đơn thuốc: Hồ sơ [Xương khớp] đang khóa ghi nhận bệnh [Gout] — bác sĩ Tim mạch cần xem để chọn Losartan và tránh thuốc lợi tiểu Thiazide!',
    thirdCatVi: 'Nam khoa & Nội tiết',
    thirdTitle: 'Giảm Testosterone nhẹ & Nhạy cảm với thuốc Chẹn Beta',
    thirdDiagVi: 'Cần tránh thuốc hạ áp gây tác dụng phụ lên chức năng sinh lý.',
    thirdPlanVi: 'Tập kháng lực • Giảm mỡ nội tạng',
    meds: [
      { name: 'Losartan 50mg', dosageVi: '1 viên sáng • Hạ huyết áp & giảm Acid Uric', deptVi: 'Khoa Tim mạch' },
      { name: 'Amlodipine 5mg', dosageVi: '1 viên chiều • Kiểm soát huyết áp 24h', deptVi: 'Khoa Tim mạch' },
    ],
  },
  {
    id: 'BN-117',
    name: 'Nguyễn Thị Kim Anh',
    age: 33,
    genderVi: 'Nữ',
    docIndex: 5,
    coDoctorsVi: 'BS. Vũ Thảo (Tiêu hóa), BS. Trần Minh (Tâm thần)',
    statusVi: 'Điều trị ngoại trú',
    rootCauseChainVi: 'Ăn chay trường thiếu kiểm soát & Viêm dạ dày HP (+) ➔ Thiếu máu thiếu Sắt & Vitamin B12 ➔ Chóng mặt, Hoa mắt & Hồi hộp',
    primaryCatVi: 'Thần kinh (Đang theo dõi)',
    primaryTitle: 'Chóng mặt mạn tính, Hoa mắt & Giảm trí nhớ ngắn hạn',
    primaryDiagVi: 'Bệnh nhân thường xuyên xây xẩm mặt mày, da xanh niêm nhạt, tê đầu ngón tay. CT sọ não bình thường.',
    primaryPlanVi: 'Kiểm tra nguyên nhân thiếu máu và kém hấp thu từ đường tiêu hóa',
    primaryMetrics: [
      { label: 'Hemoglobin (Hb)', value: '9.6', unit: 'g/dL (Thiếu máu)' },
      { label: 'Ferritin dự trữ', value: '6.2', unit: 'ng/mL (Cạn kiệt)' },
      { label: 'Vitamin B12', value: '145', unit: 'pg/mL (Thấp)' },
    ],
    relatedCatVi: 'Tiêu hóa (Nguyên nhân gốc gây kém hấp thu Sắt & B12)',
    relatedTitle: 'Viêm teo niêm mạc dạ dày nhẹ & Nhiễm vi khuẩn H. Pylori (+)',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Viêm dạ dày HP (+) làm giảm tiết axit và yếu tố nội tại (Intrinsic Factor), khiến cơ thể không hấp thu được Sắt và Vitamin B12 từ thức ăn dẫn đến thiếu máu não.',
    relatedPlanVi: 'Tiệt trừ HP phác đồ 14 ngày • Bổ sung Sắt hữu cơ (Ferrous Bisglycinate) + Mecobalamin',
    relatedMetrics: [
      { label: 'Test hơi thở C13', value: 'Dương tính', unit: 'Nhiễm HP' },
      { label: 'Hấp thu Sắt/B12', value: 'Giảm mạnh', unit: 'Do viêm dạ dày' },
      { label: 'Điều trị gốc', value: 'Diệt HP', unit: '14 ngày' },
    ],
    correlationAlertVi: '🔗 Phát hiện chứng [Chóng mặt & Thiếu máu B12/Sắt] có nguyên nhân gốc từ [Viêm dạ dày HP (+)] trong hồ sơ [Tiêu hóa] đang khóa.',
    thirdCatVi: 'Tim mạch',
    thirdTitle: 'Nhịp tim nhanh bù trừ (98 bpm) do thiếu máu',
    thirdDiagVi: 'Tim phải đập nhanh hơn để bơm bù lượng oxy thiếu hụt do thiếu máu.',
    thirdPlanVi: 'Nhịp tim sẽ tự về bình thường khi Hb > 12 g/dL',
    meds: [
      { name: 'Ferrous Bisglycinate 28mg', dosageVi: '1 viên sáng • Bổ sung sắt dễ hấp thu', deptVi: 'Khoa Huyết học' },
      { name: 'Mecobalamin (Vit B12) 500mcg', dosageVi: '2 viên/ngày • Phục hồi thần kinh & tạo máu', deptVi: 'Khoa Thần kinh' },
    ],
  },
  {
    id: 'BN-118',
    name: 'Lương Thế Vinh',
    age: 49,
    genderVi: 'Nam',
    docIndex: 2,
    coDoctorsVi: 'BS. Alice Nguyễn (Tim mạch), BS. Đặng Khoa (Thần kinh)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'U tuyến thượng thận lành tính (Hội chứng Conn) ➔ Cường Aldosterone ➔ Tăng huyết áp nặng (170/105) kèm Hạ Kali máu gây yếu cơ',
    primaryCatVi: 'Nội tiết (Đang theo dõi)',
    primaryTitle: 'Hạ Kali máu tái diễn (2.8 mmol/L) & Chuột rút yếu hai chân',
    primaryDiagVi: 'Bệnh nhân nhập viện vì yếu liệt nhẹ hai chân và chuột rút, xét nghiệm Kali máu tụt thấp 2.8 mmol/L kèm huyết áp cao.',
    primaryPlanVi: 'Bù Kali + Dùng kháng Aldosterone (Spironolactone) • Phối hợp chặt với khoa Tim mạch',
    primaryMetrics: [
      { label: 'Kali máu (K+)', value: '2.8', unit: 'mmol/L (Nguy hiểm)' },
      { label: 'Tỷ lệ ARR', value: '48', unit: 'Cường Aldosterone' },
      { label: 'CT Thượng thận', value: 'U lành 11mm', unit: 'Bên trái' },
    ],
    relatedCatVi: 'Tim mạch (Biểu hiện Tăng huyết áp thứ phát & Nguy cơ loạn nhịp)',
    relatedTitle: 'Tăng huyết áp độ 2 (170/105) & Sóng U trên Điện tâm đồ do hạ Kali',
    relatedDiagVi: 'LIÊN KẾT SỐNG CÒN: Tăng huyết áp của bệnh nhân là Tăng huyết áp thứ phát do U tuyến thượng thận tiết Aldosterone. Thuốc hạ áp thông thường không hiệu quả, phải dùng Spironolactone/Eplerenone mới vừa hạ áp vừa giữ được Kali!',
    relatedPlanVi: 'Spironolactone 50mg/ngày + Amlodipine 5mg • Theo dõi điện tim',
    relatedMetrics: [
      { label: 'Huyết áp', value: '170/105', unit: 'mmHg' },
      { label: 'Điện tâm đồ', value: 'Sóng U rõ', unit: 'Do hạ Kali' },
      { label: 'Thuốc đặc trị', value: 'Spironolactone', unit: 'Trúng đích' },
    ],
    correlationAlertVi: '🔗 Phát hiện liên kết trực tiếp giữa [Hạ Kali máu / U thượng thận] và [Tăng huyết áp nặng 170/105] trong hồ sơ [Tim mạch] đang khóa.',
    thirdCatVi: 'Thận & Điện giải',
    thirdTitle: 'Kiềm chuyển hóa nhẹ & Tăng thải Kali qua nước tiểu',
    thirdDiagVi: 'Do tác động của Aldosterone lên ống góp thận.',
    thirdPlanVi: 'Ăn nhạt hoàn toàn • Tái khám điện giải đồ sau 1 tuần',
    meds: [
      { name: 'Spironolactone 50mg', dosageVi: '1 viên sáng • Đối kháng Aldosterone gốc', deptVi: 'Khoa Nội tiết' },
      { name: 'Kaleorid (Kali Clorid) 600mg', dosageVi: '2 viên/ngày • Bù Kali máu', deptVi: 'Khoa Nội tiết' },
    ],
  },
  {
    id: 'BN-119',
    name: 'Hà Kiều Trang',
    age: 30,
    genderVi: 'Nữ',
    docIndex: 1,
    coDoctorsVi: 'BS. Phạm Hùng (Nội tiết), BS. Vũ Thảo (Dinh dưỡng)',
    statusVi: 'Đang theo dõi tích cực',
    rootCauseChainVi: 'Trầm cảm sau sinh & Mất ngủ chăm con ➔ Rối loạn trục Hạ đồi - Tuyến yên ➔ Rối loạn kinh nguyệt & Tăng cân vùng bụng',
    primaryCatVi: 'Tâm thần học (Đang theo dõi)',
    primaryTitle: 'Trầm cảm sau sinh mức độ vừa (EPDS 16 điểm) & Kiệt sức',
    primaryDiagVi: 'Căng thẳng kéo dài sau sinh 8 tháng, mất ngủ, tự trách bản thân và thèm đồ ngọt liên tục.',
    primaryPlanVi: 'Sertraline 50mg (an toàn cho phụ nữ sau sinh) • Trị liệu tâm lý hỗ trợ gia đình',
    primaryMetrics: [
      { label: 'Thang điểm EPDS', value: '16/30', unit: 'Trầm cảm sau sinh' },
      { label: 'Cortisol sáng', value: '26.4', unit: 'µg/dL (Tăng cao)' },
      { label: 'Giấc ngủ liên tục', value: '< 3 giờ', unit: 'Đứt quãng' },
    ],
    relatedCatVi: 'Nội tiết & Phụ khoa (Hệ quả từ tăng Cortisol)',
    relatedTitle: 'Viêm tuyến giáp sau sinh & Rối loạn chu kỳ nội tiết',
    relatedDiagVi: 'BỆNH LIÊN QUAN: Biến động hormone sau sinh cộng với tăng Cortisol do stress làm rối loạn chức năng tuyến giáp tạm thời và tích mỡ bụng.',
    relatedPlanVi: 'Bổ sung Sắt, Vitamin D3, Omega-3 • Theo dõi TSH sau 8 tuần',
    relatedMetrics: [
      { label: 'TSH hiện tại', value: '5.8', unit: 'mIU/L (Tăng nhẹ)' },
      { label: 'Vitamin D máu', value: '16', unit: 'ng/mL (Thiếu hụt)' },
      { label: 'Cân nặng sau sinh', value: '+8 kg', unit: 'Chưa giảm' },
    ],
    correlationAlertVi: '🔗 Phát hiện chứng [Trầm cảm & Mất ngủ sau sinh] có liên quan trực tiếp đến [Rối loạn tuyến giáp & thiếu Vitamin D] trong hồ sơ [Nội tiết] đang khóa.',
    thirdCatVi: 'Cơ xương khớp',
    thirdTitle: 'Viêm bao gân cổ tay De Quervain (Do bế em bé)',
    thirdDiagVi: 'Đau nhói gốc ngón cái cổ tay hai bên.',
    thirdPlanVi: 'Đai nẹp ngón cái • Vật lý trị liệu siêu âm',
    meds: [
      { name: 'Sertraline 50mg', dosageVi: '1 viên sáng • Cải thiện khí sắc an toàn', deptVi: 'Khoa Tâm thần' },
      { name: 'Vitamin D3 + K2 & Omega-3', dosageVi: '1 viên/ngày • Phục hồi nội tiết & thần kinh', deptVi: 'Khoa Nội tiết' },
    ],
  },
  {
    id: 'BN-120',
    name: 'Mai Xuân Trường',
    age: 53,
    genderVi: 'Nam',
    docIndex: 5,
    coDoctorsVi: 'BS. Alice Nguyễn (Tim mạch), BS. Lê Hoàng (Xương khớp)',
    statusVi: 'Cần hội chẩn liên khoa',
    rootCauseChainVi: 'Bệnh phổi tắc nghẽn mạn tính (COPD) dùng Corticoid kéo dài ➔ Tăng đường huyết do thuốc & Loãng xương đốt sống',
    primaryCatVi: 'Hô hấp (Đang theo dõi)',
    primaryTitle: 'Bệnh phổi tắc nghẽn mạn tính (COPD nhóm B) & Khó thở khi gắng sức',
    primaryDiagVi: 'Tiền sử hút thuốc lá 20 năm (đã cai), FEV1/FVC = 0.61. Từng dùng nhiều đợt Corticoid đường uống khi vào đợt cấp tại tuyến dưới.',
    primaryPlanVi: 'Chuyển sang phác đồ giãn phế quản tác dụng kéo dài (LABA/LAMA) để giảm tối đa Corticoid',
    primaryMetrics: [
      { label: 'FEV1 / FVC', value: '0.61', unit: 'COPD Nhóm B' },
      { label: 'SpO2 khí trời', value: '95%', unit: 'Ổn định' },
      { label: 'Đợt cấp/năm', value: '2 đợt', unit: 'Dùng Medrol' },
    ],
    relatedCatVi: 'Nội tiết & Cơ xương khớp (Tác dụng phụ do dùng Corticoid)',
    relatedTitle: 'Tăng đường huyết do Corticoid (HbA1c 7.3%) & Giảm mật độ xương đốt sống',
    relatedDiagVi: 'NGUYÊN NHÂN GỐC: Các đợt dùng Methylprednisolone (Corticoid) trị khó thở trước đây đã gây tăng đường huyết thứ phát và mất xương cột sống ngực. Bác sĩ Hô hấp cần nắm để ưu tiên dùng LAMA/LABA không chứa Corticoid!',
    relatedPlanVi: 'Dùng Tiotropium/Olodaterol (Không Corticoid) • Metformin 500mg • Canxi + Vitamin D',
    relatedMetrics: [
      { label: 'HbA1c', value: '7.3%', unit: 'Tăng do Corticoid' },
      { label: 'DEXA Cột sống', value: '-2.6', unit: 'Loãng xương' },
      { label: 'Đổi thuốc hít', value: 'LAMA/LABA', unit: 'Tránh ICS/Steroid' },
    ],
    correlationAlertVi: '🔗 Cảnh báo Điều trị: Hồ sơ [Nội tiết & Xương khớp] đang khóa ghi nhận [Tăng đường huyết & Loãng xương do Corticoid] — cần mở khóa để đổi thuốc hít COPD!',
    thirdCatVi: 'Tim mạch',
    thirdTitle: 'Tăng nhẹ áp lực động mạch phổi (PAPs 36 mmHg) & Ngoại tâm thu thất thưa',
    thirdDiagVi: 'Ảnh hưởng nhẹ lên tim phải do bệnh phổi mạn tính.',
    thirdPlanVi: 'Tập phục hồi chức năng hô hấp • Tiêm vắc-xin Cúm & Phế cầu',
    meds: [
      { name: 'Spiolto Respimat (LAMA/LABA)', dosageVi: 'Hít 2 nhát mỗi sáng • Giãn phế quản không Steroid', deptVi: 'Khoa Hô hấp' },
      { name: 'Metformin 500mg', dosageVi: '1 viên tối • Kiểm soát đường huyết', deptVi: 'Khoa Nội tiết' },
    ],
  },
];

function resolveSpecialistDoctor(categoryText: string, excludeIds: string[]): HospitalDoctor {
  const lower = categoryText.toLowerCase();
  let preferredIdx = 2; // default DOC-03 (Nội tiết & Chuyển hóa)
  if (
    lower.includes('tâm thần') ||
    lower.includes('giấc ngủ') ||
    lower.includes('trầm cảm') ||
    lower.includes('lo âu') ||
    lower.includes('stress')
  ) {
    preferredIdx = 1; // DOC-02: BS. Trần Minh (Tâm Thần & Giấc Ngủ)
  } else if (lower.includes('tim') || lower.includes('huyết áp') || lower.includes('mạch')) {
    preferredIdx = 0; // DOC-01: BS. Alice Nguyễn (Tim Mạch & Huyết Áp)
  } else if (
    lower.includes('xương khớp') ||
    lower.includes('cột sống') ||
    lower.includes('gout') ||
    lower.includes('da liễu')
  ) {
    preferredIdx = 3; // DOC-04: BS. Lê Hoàng (Cơ Xương Khớp)
  } else if (
    lower.includes('tiêu hóa') ||
    lower.includes('dạ dày') ||
    lower.includes('gan') ||
    lower.includes('đại tràng') ||
    lower.includes('trào ngược')
  ) {
    preferredIdx = 4; // DOC-05: BS. Vũ Thảo (Tiêu Hóa & Gan Mật)
  } else if (
    lower.includes('hô hấp') ||
    lower.includes('thần kinh') ||
    lower.includes('phổi') ||
    lower.includes('xoang') ||
    lower.includes('tiền đình') ||
    lower.includes('mắt')
  ) {
    preferredIdx = 5; // DOC-06: BS. Đặng Khoa (Hô Hấp & Thần Kinh)
  }

  const candidate = HOSPITAL_DOCTORS[preferredIdx];
  if (!excludeIds.includes(candidate.id)) {
    return candidate;
  }
  return (
    HOSPITAL_DOCTORS.find((d) => !excludeIds.includes(d.id)) ||
    HOSPITAL_DOCTORS[(preferredIdx + 1) % HOSPITAL_DOCTORS.length]
  );
}

const MEDICAL_VI_TO_EN_PAIRS: Array<[string, string]> = [
  ['Cần hội chẩn liên khoa', 'Cross-Specialty Consultation'],
  ['Đang theo dõi tích cực', 'Active Clinical Monitoring'],
  ['Điều trị ngoại trú', 'Outpatient Care'],
  ['Tái khám định kỳ', 'Routine Follow-up'],
  ['Khoa Tim mạch', 'Cardiology Dept'],
  ['Khoa Tâm thần', 'Psychiatry Dept'],
  ['Khoa Nội tiết', 'Endocrinology Dept'],
  ['Khoa Xương khớp', 'Orthopedics Dept'],
  ['Khoa Tiêu hóa', 'Gastroenterology Dept'],
  ['Khoa Hô hấp', 'Pulmonology Dept'],
  ['Khoa Thần kinh', 'Neurology Dept'],
  ['Khoa Gan mật', 'Hepatology Dept'],
  ['Khoa Thận', 'Nephrology Dept'],
  ['Khoa Huyết học', 'Hematology Dept'],
  ['Tim mạch & Huyết áp (Đang theo dõi)', 'Cardiology & Hypertension (Primary Monitoring)'],
  ['Tim mạch (Đang theo dõi)', 'Cardiology (Primary Monitoring)'],
  ['Nội tiết & Đái tháo đường (Đang theo dõi)', 'Endocrinology & Diabetes (Primary Monitoring)'],
  ['Nội tiết (Đang theo dõi)', 'Endocrinology (Primary Monitoring)'],
  ['Tiêu hóa & Dạ dày (Đang theo dõi)', 'Gastroenterology & Stomach (Primary Monitoring)'],
  ['Tiêu hóa (Đang theo dõi)', 'Gastroenterology (Primary Monitoring)'],
  ['Hô hấp & Phổi (Đang theo dõi)', 'Pulmonology & Lungs (Primary Monitoring)'],
  ['Hô hấp (Đang theo dõi)', 'Pulmonology (Primary Monitoring)'],
  ['Cơ xương khớp (Đang theo dõi)', 'Orthopedics & Rheumatology (Primary Monitoring)'],
  ['Cơ xương khớp & Miễn dịch (Đang theo dõi)', 'Rheumatology & Immunology (Primary Monitoring)'],
  ['Tâm thần học (Đang theo dõi)', 'Psychiatry (Primary Monitoring)'],
  ['Tâm thần & Giấc ngủ (Đang theo dõi)', 'Psychiatry & Sleep Medicine (Primary Monitoring)'],
  ['Thần kinh (Đang theo dõi)', 'Neurology (Primary Monitoring)'],
  ['Tâm thần học (Bệnh gốc gây Béo phì)', 'Psychiatry (Root Cause of Obesity)'],
  ['Tiêu hóa & Gan mật (Biến chứng liên quan)', 'Gastroenterology & Hepatology (Related Complication)'],
  ['Cơ xương khớp (Nguyên nhân dùng thuốc gây loét)', 'Orthopedics (NSAID Root Cause of Ulcer)'],
  ['Tiêu hóa (Bệnh gốc gây Hen ban đêm)', 'Gastroenterology (GERD Root Cause of Nocturnal Asthma)'],
  ['Nội tiết & Tuyến giáp (Nguyên nhân gốc)', 'Endocrinology & Thyroid (Root Cause)'],
  ['Tiêu hóa & Đại tràng (Bệnh tự miễn đi kèm)', 'Gastroenterology & Colon (Autoimmune Comorbidity)'],
  ['Thần kinh (Bệnh đi kèm)', 'Neurology (Associated Condition)'],
  ['Hô hấp & Giấc ngủ (Nguyên nhân gốc)', 'Sleep & Pulmonology (Root Cause)'],
  ['Tâm thần học (Triệu chứng chồng lấp)', 'Psychiatry (Overlapping Symptoms)'],
  ['Nội tiết & Biến chứng Thần kinh (Nguyên nhân gốc)', 'Endocrinology & Neuropathy (Root Cause)'],
  ['Tâm thần học (Nguyên nhân kích hoạt Trục Não - Ruột)', 'Psychiatry (Brain-Gut Axis Trigger)'],
  ['Tim mạch (Nguồn gốc gây huyết khối lên não)', 'Cardiology (Cardioembolic Source)'],
  ['Thận & Tiết niệu (Biến chứng cần phát hiện sớm)', 'Nephrology & Urology (Early Complication)'],
  ['Tiêu hóa & Gan mật (Cảnh báo suy giảm chuyển hóa thuốc)', 'Hepatology (Impaired Drug Metabolism Alert)'],
  ['Nội tiết (Nguyên nhân gốc làm rỗng xương)', 'Endocrinology (Root Cause of Bone Loss)'],
  ['Cơ xương khớp & Chuyển hóa (Tránh kê nhầm thuốc lợi tiểu)', 'Rheumatology & Metabolism (Medication Safety)'],
  ['Tiêu hóa (Nguyên nhân gốc gây kém hấp thu Sắt & B12)', 'Gastroenterology (Malabsorption Root Cause)'],
  ['Tim mạch (Biểu hiện Tăng huyết áp thứ phát & Nguy cơ loạn nhịp)', 'Cardiology (Secondary Hypertension & Arrhythmia Risk)'],
  ['Nội tiết & Phụ khoa (Hệ quả từ tăng Cortisol)', 'Endocrinology & Gynecology (Cortisol Effect)'],
  ['Nội tiết & Cơ xương khớp (Tác dụng phụ do dùng Corticoid)', 'Endocrinology & Orthopedics (Steroid Side Effects)'],
  ['Cơ xương khớp (Hệ quả tăng cân)', 'Orthopedics (Weight-Gain Overload)'],
  ['Tim mạch & Mỡ máu', 'Cardiology & Lipid Profile'],
  ['Thận & Tiết niệu', 'Nephrology & Urology'],
  ['Tai Mũi Họng', 'Otolaryngology (ENT)'],
  ['Tâm thần & Giấc ngủ', 'Psychiatry & Sleep Medicine'],
  ['Mắt & Nhãn khoa', 'Ophthalmology'],
  ['Tim mạch', 'Cardiology'],
  ['Nội tiết & Chuyển hóa', 'Endocrinology & Metabolism'],
  ['Cơ xương khớp', 'Orthopedics & Rheumatology'],
  ['Mắt & Võng mạc', 'Ophthalmology & Retina'],
  ['Dinh dưỡng', 'Clinical Nutrition'],
  ['Nội tiết & Mỡ máu', 'Endocrinology & Lipids'],
  ['Huyết học', 'Hematology'],
  ['Thần kinh', 'Neurology'],
  ['Nam khoa & Nội tiết', 'Andrology & Endocrinology'],
  ['Thận & Điện giải', 'Nephrology & Electrolytes'],
  ['NGUYÊN NHÂN GỐC:', 'ROOT CAUSE IDENTIFIED:'],
  ['BỆNH LIÊN QUAN TRỰC TIẾP:', 'DIRECT CLINICAL CORRELATION:'],
  ['BỆNH LIÊN QUAN:', 'RELATED CONDITION:'],
  ['LIÊN KẾT QUAN TRỌNG:', 'KEY CLINICAL LINK:'],
  ['LIÊN KẾT SỐNG CÒN:', 'CRITICAL CLINICAL LINK:'],
  ['CẢNH BÁO AN TOÀN KÊ ĐƠN:', 'PRESCRIPTION SAFETY ALERT:'],
  ['CẢNH BÁO ĐỘT QUỴ:', 'STROKE RISK ALERT:'],
  ['CẢNH BÁO ĐỘC GAN:', 'HEPATOTOXICITY ALERT:'],
  ['CẢNH BÁO NGUY HIỂM:', 'CRITICAL MEDICAL ALERT:'],
  ['Cảnh báo An toàn Thuốc:', 'Medication Safety Alert:'],
  ['Cảnh báo Điều trị:', 'Treatment Alert:'],
  ['Tối ưu Đơn thuốc:', 'Prescription Optimization:'],
  ['Phát hiện bệnh', 'Detected condition'],
  ['Phát hiện chứng', 'Detected symptom'],
  ['Phát hiện ổ', 'Detected lesion'],
  ['Phát hiện nguyên nhân gốc của', 'Detected root cause of'],
  ['Phát hiện liên kết trực tiếp giữa', 'Detected direct correlation between'],
  ['Phát hiện tương tác thuốc giữa', 'Detected drug interaction between'],
  ['Phát hiện bệnh nhân', 'Detected patient with'],
  ['Phát hiện', 'Detected'],
  ['có nguyên nhân gốc từ hồ sơ', 'originates from locked record'],
  ['bắt nguồn trực tiếp từ hồ sơ', 'stems directly from locked record'],
  ['bắt nguồn từ thuốc kháng viêm trong hồ sơ', 'is triggered by NSAIDs in locked record'],
  ['có liên quan mật thiết với hồ sơ', 'is closely linked to locked record'],
  ['nằm trong hồ sơ', 'is recorded inside locked record'],
  ['trong hồ sơ', 'in locked record'],
  ['đang khóa', '(currently locked)'],
  ['Trầm cảm kéo dài', 'Chronic Depression'],
  ['Ăn đêm tăng 14kg', 'Late-night stress-eating (+14kg)'],
  ['Béo phì', 'Obesity'],
  ['Cao huyết áp', 'Hypertension'],
  ['Tăng huyết áp', 'Hypertension'],
  ['Đau lưng', 'Lumbar Back Pain'],
  ['Nhịp nhanh xoang', 'Sinus Tachycardia'],
  ['Nhịp tim nhanh', 'Tachycardia'],
  ['Tim đập nhanh', 'Tachycardia'],
  ['Đánh trống ngực', 'Palpitations'],
  ['Run tay', 'Hand Tremor'],
  ['Rối loạn lo âu giả định', 'Pseudo-Anxiety Disorder'],
  ['Rối loạn lo âu', 'Anxiety Disorder'],
  ['Cường giáp Basedow', 'Graves Hyperthyroidism'],
  ['Tăng hormone tuyến giáp', 'Elevated Thyroid Hormone'],
  ['Suy giáp Hashimoto', 'Hashimoto Hypothyroidism'],
  ['Đái tháo đường Tuýp 2', 'Type 2 Diabetes Mellitus'],
  ['Đái tháo đường', 'Diabetes Mellitus'],
  ['Kháng Insulin', 'Insulin Resistance'],
  ['Gan nhiễm mỡ', 'Fatty Liver Disease'],
  ['Rối loạn mỡ máu', 'Dyslipidemia'],
  ['Rối loạn Lipid máu', 'Dyslipidemia'],
  ['Viêm khớp Gout', 'Gouty Arthritis'],
  ['Loét hang vị dạ dày', 'Gastric Antral Ulcer'],
  ['Viêm loét hang vị dạ dày', 'Acute Gastric Ulcer'],
  ['Thiếu máu', 'Anemia'],
  ['Trào ngược dạ dày thực quản', 'Gastroesophageal Reflux (GERD)'],
  ['Co thắt phế quản', 'Bronchospasm'],
  ['Hen suyễn', 'Bronchial Asthma'],
  ['Hen phế quản', 'Bronchial Asthma'],
  ['Ho kéo dài về đêm', 'Chronic Nocturnal Cough'],
  ['Viêm cột sống dính khớp', 'Ankylosing Spondylitis'],
  ['Viêm đại tràng mạn tính', 'Chronic Colitis'],
  ['Viêm loét đại trực tràng', 'Ulcerative Colitis'],
  ['Rối loạn hoảng sợ', 'Panic Disorder'],
  ['Đau nửa đầu Migraine', 'Migraine Headache'],
  ['Hội chứng Ngưng thở khi ngủ', 'Obstructive Sleep Apnea'],
  ['Ngưng thở khi ngủ', 'Sleep Apnea'],
  ['Hội chứng ruột kích thích', 'Irritable Bowel Syndrome'],
  ['Cơn thiếu máu não thoáng qua', 'Transient Ischemic Attack'],
  ['Rung nhĩ cơn', 'Paroxysmal Atrial Fibrillation'],
  ['Bệnh Lupus ban đỏ hệ thống', 'Systemic Lupus Erythematosus'],
  ['Viêm cầu thận Lupus', 'Lupus Nephritis'],
  ['Mất ngủ mạn tính', 'Chronic Insomnia'],
  ['Mất ngủ kéo dài', 'Chronic Insomnia'],
  ['Viêm gan do rượu', 'Alcoholic Hepatitis'],
  ['Loãng xương nặng', 'Severe Osteoporosis'],
  ['Loãng xương', 'Osteoporosis'],
  ['Cường tuyến cận giáp', 'Primary Hyperparathyroidism'],
  ['Cường cận giáp', 'Hyperparathyroidism'],
  ['Sỏi thận', 'Kidney Stones'],
  ['Hội chứng chuyển hóa', 'Metabolic Syndrome'],
  ['Chóng mặt mạn tính', 'Chronic Vertigo'],
  ['Viêm dạ dày', 'Chronic Gastritis'],
  ['Hạ Kali máu', 'Hypokalemia'],
  ['U tuyến thượng thận', 'Adrenal Adenoma'],
  ['Trầm cảm sau sinh', 'Postpartum Depression'],
  ['Bệnh phổi tắc nghẽn mạn tính', 'Chronic Obstructive Pulmonary Disease'],
  ['Tăng đường huyết', 'Hyperglycemia'],
  ['Huyết áp', 'Blood Pressure'],
  ['Nhịp tim', 'Heart Rate'],
  ['Chỉ số BMI', 'BMI Index'],
  ['Điểm PHQ-9', 'PHQ-9 Score'],
  ['Tăng cân', 'Weight Gain'],
  ['Sụt cân', 'Weight Loss'],
  ['Thuốc SSRI', 'SSRI Medication'],
  ['Đường huyết đói', 'Fasting Glucose'],
  ['Men gan', 'Liver Enzyme'],
  ['Dương tính', 'Positive'],
  ['Âm tính', 'Negative'],
  ['Bình thường', 'Normal'],
  ['Nặng', 'Severe'],
  ['Cao', 'High'],
  ['Thấp', 'Low'],
  ['Ổn định', 'Stable'],
  ['1 viên sáng', '1 tablet morning'],
  ['1 viên tối', '1 tablet evening'],
  ['1 viên chiều', '1 tablet afternoon'],
  ['2 viên/ngày', '2 tablets/day'],
  ['1 viên/ngày', '1 tablet/day'],
  ['1 viên/tuần', '1 tablet/week'],
  ['2 viên sáng', '2 tablets morning'],
  ['trước ăn sáng 30p', '30m before breakfast'],
  ['trước ăn tối', 'before dinner'],
  ['sau ăn tối', 'after dinner'],
  ['Hạ nhịp tim', 'Heart rate control'],
  ['Ổn định huyết áp', 'BP stabilization'],
  ['Hạ huyết áp', 'BP reduction'],
  ['Kiểm soát huyết áp', 'BP control'],
  ['Trị trầm cảm & ăn đêm', 'Treats depression & night eating'],
  ['Hạ đường huyết', 'Lowers blood glucose'],
  ['Kiểm soát đường huyết', 'Glycemic control'],
  ['Hạ mỡ máu', 'Lipid lowering'],
];

export function toEnMedical(text: string): string {
  if (!text) return '';
  let out = text;
  for (const [vi, en] of MEDICAL_VI_TO_EN_PAIRS) {
    out = out.split(vi).join(en);
  }
  out = out
    .replace(/BS\./g, 'Dr.')
    .replace(/\(Tâm thần\)/g, '(Psychiatry)')
    .replace(/\(Xương khớp\)/g, '(Orthopedics)')
    .replace(/\(Tim mạch\)/g, '(Cardiology)')
    .replace(/\(Tiêu hóa\)/g, '(Gastroenterology)')
    .replace(/\(Giấc ngủ\)/g, '(Sleep Medicine)')
    .replace(/\(Nội tiết\)/g, '(Endocrinology)')
    .replace(/\(Thần kinh\)/g, '(Neurology)')
    .replace(/\(Hô hấp\)/g, '(Pulmonology)')
    .replace(/\(Gan mật\)/g, '(Hepatology)')
    .replace(/\(Dinh dưỡng\)/g, '(Nutrition)');
  return toEnName(out);
}

export const ALL_20_PATIENTS: PatientProfile[] = SEED_PATIENTS.map((s, idx) => {
  const doc = HOSPITAL_DOCTORS[s.docIndex];
  const tagPrefix = `patient:${s.id.toLowerCase()}`;
  const specialistRootDoc = resolveSpecialistDoctor(s.relatedCatVi, [doc.id]);
  const specialistSecDoc = resolveSpecialistDoctor(s.thirdCatVi, [doc.id, specialistRootDoc.id]);

  const primaryCatEn = toEnMedical(s.primaryCatVi);
  const primaryTitleEn = toEnMedical(s.primaryTitle);
  const primaryDiagEn = `Clinical Assessment (${toEnName(s.name)}): ${toEnMedical(s.primaryTitle)}. Primary monitoring by ${doc.nameEn} (${doc.specialtyEn}). Requires cross-specialty root-cause evaluation.`;
  const primaryPlanEn = toEnMedical(s.primaryPlanVi);

  const relatedCatEn = toEnMedical(s.relatedCatVi);
  const relatedTitleEn = toEnMedical(s.relatedTitle);
  const relatedDiagEn = `ROOT CAUSE IDENTIFIED: ${toEnMedical(s.relatedTitle)} directly drives the patient's primary condition (${toEnMedical(s.primaryTitle)}). Specialist care assigned to ${specialistRootDoc.nameEn} (${specialistRootDoc.specialtyEn}).`;
  const relatedPlanEn = toEnMedical(s.relatedPlanVi);

  const thirdCatEn = toEnMedical(s.thirdCatVi);
  const thirdTitleEn = toEnMedical(s.thirdTitle);
  const thirdDiagEn = `Secondary associated condition: ${toEnMedical(s.thirdTitle)}. Managed in coordination with ${specialistSecDoc.nameEn} (${specialistSecDoc.specialtyEn}).`;
  const thirdPlanEn = toEnMedical(s.thirdPlanVi);

  const careStages: DoctorCareStage[] = [
    {
      stageOrder: 1,
      roleType: 'PRIMARY_MONITOR',
      roleLabelVi: 'Bác sĩ Theo dõi Chính (Quản lý Tổng thể)',
      roleLabelEn: 'Primary Monitoring Doctor (Holistic Care)',
      scopeBadgeVi: 'Xem được nhiều bệnh (khi BN mở khóa)',
      scopeBadgeEn: 'Multi-disease view (when unlocked by patient)',
      doctorId: doc.id,
      doctorName: doc.name,
      doctorNameEn: doc.nameEn,
      specialtyVi: doc.specialtyVi,
      specialtyEn: doc.specialtyEn,
      targetTideTag: `${tagPrefix}:primary`,
      diseaseCategoryVi: s.primaryCatVi,
      diseaseCategoryEn: primaryCatEn,
      diseaseTitleVi: s.primaryTitle,
      diseaseTitleEn: primaryTitleEn,
      treatmentGoalVi: s.primaryPlanVi,
      treatmentGoalEn: primaryPlanEn,
      isReferred: true,
      completionPercent: 70 + ((idx * 7) % 25),
    },
    {
      stageOrder: 2,
      roleType: 'SPECIALIST_ROOT_CAUSE',
      roleLabelVi: 'Bác sĩ Chuyên khoa Điều trị Bệnh gốc',
      roleLabelEn: 'Specialist Doctor (Root-Cause Treatment)',
      scopeBadgeVi: 'Chỉ xem đúng 1 bệnh chuyên khoa này',
      scopeBadgeEn: 'Scoped to ONLY this 1 specialty disease',
      doctorId: specialistRootDoc.id,
      doctorName: specialistRootDoc.name,
      doctorNameEn: specialistRootDoc.nameEn,
      specialtyVi: specialistRootDoc.specialtyVi,
      specialtyEn: specialistRootDoc.specialtyEn,
      targetTideTag: `${tagPrefix}:related`,
      diseaseCategoryVi: s.relatedCatVi,
      diseaseCategoryEn: relatedCatEn,
      diseaseTitleVi: s.relatedTitle,
      diseaseTitleEn: relatedTitleEn,
      treatmentGoalVi: s.relatedPlanVi,
      treatmentGoalEn: relatedPlanEn,
      isReferred: idx % 2 === 1,
      completionPercent: idx % 2 === 1 ? 55 + ((idx * 9) % 35) : 20,
    },
    {
      stageOrder: 3,
      roleType: 'SPECIALIST_SECONDARY',
      roleLabelVi: 'Bác sĩ Chuyên khoa Điều trị Thứ phát',
      roleLabelEn: 'Specialist Doctor (Secondary Condition)',
      scopeBadgeVi: 'Chỉ xem đúng 1 bệnh chuyên khoa này',
      scopeBadgeEn: 'Scoped to ONLY this 1 specialty disease',
      doctorId: specialistSecDoc.id,
      doctorName: specialistSecDoc.name,
      doctorNameEn: specialistSecDoc.nameEn,
      specialtyVi: specialistSecDoc.specialtyVi,
      specialtyEn: specialistSecDoc.specialtyEn,
      targetTideTag: `${tagPrefix}:secondary`,
      diseaseCategoryVi: s.thirdCatVi,
      diseaseCategoryEn: thirdCatEn,
      diseaseTitleVi: s.thirdTitle,
      diseaseTitleEn: thirdTitleEn,
      treatmentGoalVi: s.thirdPlanVi,
      treatmentGoalEn: thirdPlanEn,
      isReferred: idx % 3 === 0,
      completionPercent: idx % 3 === 0 ? 50 + ((idx * 11) % 40) : 15,
    },
  ];

  const records: RawMedicalRecord[] = [
    {
      id: `${s.id}-REC-1`,
      category: primaryCatEn,
      vietnameseCategory: s.primaryCatVi,
      title: s.primaryTitle,
      titleEn: primaryTitleEn,
      tideTag: `${tagPrefix}:primary`,
      sensitivity: 'MODERATE',
      sensitivityLabel: 'Primary Monitored Condition',
      facility: `CarePass Hospital — ${doc.specialtyVi}`,
      facilityEn: `CarePass Hospital — ${doc.specialtyEn}`,
      updatedAt: '2026-10-20',
      plaintextDiagnosis: primaryDiagEn,
      vietnameseDiagnosis: s.primaryDiagVi,
      medicationOrPlan: primaryPlanEn,
      vietnamesePlan: s.primaryPlanVi,
      metrics: s.primaryMetrics.map((m) => ({
        label: m.label,
        labelEn: toEnMedical(m.label),
        value: m.value,
        valueEn: toEnMedical(m.value),
        unit: m.unit,
        unitEn: toEnMedical(m.unit),
        flag: 'warning',
      })),
    },
    {
      id: `${s.id}-REC-2`,
      category: relatedCatEn,
      vietnameseCategory: s.relatedCatVi,
      title: s.relatedTitle,
      titleEn: relatedTitleEn,
      tideTag: `${tagPrefix}:related`,
      sensitivity: 'HIGH',
      sensitivityLabel: 'Root-Cause Related Condition',
      facility: 'Chuyên khoa Phối hợp Liên Viện',
      facilityEn: `Inter-Department Specialty (${specialistRootDoc.specialtyEn})`,
      updatedAt: '2026-10-12',
      plaintextDiagnosis: relatedDiagEn,
      vietnameseDiagnosis: s.relatedDiagVi,
      medicationOrPlan: relatedPlanEn,
      vietnamesePlan: s.relatedPlanVi,
      metrics: s.relatedMetrics.map((m) => ({
        label: m.label,
        labelEn: toEnMedical(m.label),
        value: m.value,
        valueEn: toEnMedical(m.value),
        unit: m.unit,
        unitEn: toEnMedical(m.unit),
        flag: 'critical',
      })),
      correlationSignal: {
        viSummary: s.correlationAlertVi,
        enSummary: `🔗 Cross-Specialty Root-Cause Alert: Locked [${relatedCatEn}] record (${relatedTitleEn}) is directly linked to [${primaryTitleEn}].`,
        linkedTags: [`${tagPrefix}:primary`, `${tagPrefix}:related`],
        clinicalActionVi:
          'Bác sĩ có thể gửi yêu cầu xin Bệnh nhân mở khóa hồ sơ này để điều trị tận gốc.',
        clinicalActionEn:
          'Doctor can request patient consent to unlock this related condition for root-cause care.',
      },
    },
    {
      id: `${s.id}-REC-3`,
      category: thirdCatEn,
      vietnameseCategory: s.thirdCatVi,
      title: s.thirdTitle,
      titleEn: thirdTitleEn,
      tideTag: `${tagPrefix}:secondary`,
      sensitivity: 'LOW',
      sensitivityLabel: 'Secondary Associated Condition',
      facility: 'Trung tâm Chẩn đoán Hình ảnh & Xét nghiệm',
      facilityEn: 'Diagnostic Imaging & Laboratory Center',
      updatedAt: '2026-09-18',
      plaintextDiagnosis: thirdDiagEn,
      vietnameseDiagnosis: s.thirdDiagVi,
      medicationOrPlan: thirdPlanEn,
      vietnamesePlan: s.thirdPlanVi,
      metrics: [
        {
          label: 'Mức độ liên quan',
          labelEn: 'Clinical Link',
          value: 'Có liên hệ',
          valueEn: 'Correlated',
          unit: 'Thứ phát',
          unitEn: 'Secondary',
          flag: 'warning',
        },
        {
          label: 'Theo dõi',
          labelEn: 'Follow-up',
          value: 'Định kỳ',
          valueEn: 'Periodic',
          unit: 'Ngoại trú',
          unitEn: 'Outpatient',
          flag: 'normal',
        },
        {
          label: 'Bảo mật E2EE',
          labelEn: 'E2EE Security',
          value: 'AES-256',
          valueEn: 'AES-256',
          unit: 'TideCloak',
          unitEn: 'TideCloak',
          flag: 'normal',
        },
      ],
    },
    {
      id: `${s.id}-REC-4`,
      category: 'Genetics & Private Serology Screening (Confidential)',
      vietnameseCategory: 'Di truyền & Sàng lọc Riêng tư (Tối mật)',
      title: 'Hồ sơ Gen di truyền gia đình & Xét nghiệm Huyết thanh học riêng tư',
      titleEn: 'Family Genomic Sequencing & Confidential Serology Screening',
      tideTag: `${tagPrefix}:private`,
      sensitivity: 'CRITICAL',
      sensitivityLabel: 'Strictly Confidential',
      facility: 'Viện Di truyền & Sinh học Phân tử',
      facilityEn: 'Institute of Medical Genetics & Molecular Biology',
      updatedAt: '2026-08-05',
      plaintextDiagnosis:
        'STRICTLY CONFIDENTIAL RECORD: Hereditary oncology genomic panel & HIV/HBV serology screening. Unrelated to the active treatment episode; remains 100% sealed under patient sovereignty.',
      vietnameseDiagnosis:
        'HỒ SƠ CÁ NHÂN TỐI MẬT: Kết quả giải trình tự gen tầm soát ung thư di truyền & sàng lọc HIV/HBV. Không liên quan trực tiếp đến ca điều trị hiện tại nên bệnh nhân có quyền giữ khóa hoàn toàn.',
      medicationOrPlan: 'Unlock only for dedicated Genetics / Oncology consultation',
      vietnamesePlan: 'Chỉ mở khóa khi khám chuyên khoa Di truyền / Ung bướu',
      metrics: [
        {
          label: 'Mức độ bảo mật',
          labelEn: 'Security Tier',
          value: 'Tối mật',
          valueEn: 'Top Secret',
          unit: 'Zero-Trust',
          unitEn: 'Zero-Trust',
          flag: 'critical',
        },
        {
          label: 'HIV / HBV',
          labelEn: 'HIV / HBV',
          value: 'Âm tính',
          valueEn: 'Negative',
          unit: 'Đã xác thực',
          unitEn: 'Verified',
          flag: 'normal',
        },
        {
          label: 'Liên quan ca bệnh',
          labelEn: 'Case Relevance',
          value: '0%',
          valueEn: '0%',
          unit: 'Độc lập',
          unitEn: 'Independent',
          flag: 'normal',
        },
      ],
    },
  ];

  const timeline: PatientTimelineStep[] = [
    {
      date: '20/10/2026',
      titleVi: s.primaryTitle,
      titleEn: primaryTitleEn,
      detailVi: s.primaryDiagVi,
      detailEn: primaryDiagEn,
      doctorName: `${doc.name} (${doc.specialtyVi})`,
      doctorNameEn: `${doc.nameEn} (${doc.specialtyEn})`,
    },
    {
      date: '12/10/2026',
      titleVi: s.relatedTitle,
      titleEn: relatedTitleEn,
      detailVi: s.relatedDiagVi,
      detailEn: relatedDiagEn,
      doctorName: s.coDoctorsVi.split(',')[0] || 'Bác sĩ Chuyên khoa Phối hợp',
      doctorNameEn: `${specialistRootDoc.nameEn} (${specialistRootDoc.specialtyEn})`,
    },
    {
      date: '18/09/2026',
      titleVi: s.thirdTitle,
      titleEn: thirdTitleEn,
      detailVi: s.thirdDiagVi,
      detailEn: thirdDiagEn,
      doctorName: 'Khoa Khám Đa Chuyên Khoa',
      doctorNameEn: `${specialistSecDoc.nameEn} (${specialistSecDoc.specialtyEn})`,
    },
  ];

  return {
    id: s.id,
    name: s.name,
    nameEn: toEnName(s.name),
    age: s.age,
    genderVi: s.genderVi,
    genderEn: s.genderVi === 'Nam' ? 'Male' : 'Female',
    primaryDoctorId: doc.id,
    primaryDoctorName: doc.name,
    primaryDoctorNameEn: doc.nameEn,
    primarySpecialtyVi: doc.specialtyVi,
    primarySpecialtyEn: doc.specialtyEn,
    coDoctorsVi: s.coDoctorsVi,
    coDoctorsEn: toEnMedical(s.coDoctorsVi),
    statusVi: s.statusVi,
    statusEn: toEnMedical(s.statusVi),
    rootCauseChainVi: s.rootCauseChainVi,
    rootCauseChainEn: toEnMedical(s.rootCauseChainVi),
    medications: s.meds.map((m) => ({
      name: m.name,
      dosageVi: m.dosageVi,
      dosageEn: toEnMedical(m.dosageVi),
      deptVi: m.deptVi,
      deptEn: toEnMedical(m.deptVi),
    })),
    timeline,
    records,
    careStages,
  };
});
