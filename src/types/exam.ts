export type ExamSessionStatus = 'draft' | 'needs_review' | 'ready' | 'approved' | 'modified';

export interface ExamSession {
  id: string;
  schoolName: string;
  examTitle: string;
  subject: string;
  gradeClass: string;
  attempt: string; // الدور الأول، الدور الثاني، إلخ
  date: string;
  day: string;
  time: string;
  committeeChair: string;
  notes: string;
  isMultiGrade: boolean;
  status: ExamSessionStatus;
  createdAt: string;
}

export interface ExamStudent {
  id: string;
  name: string;
  rollNumber: string; // الرقم الامتحاني
  gradeClass: string;
  division: string; // الشعبة
  gender?: 'male' | 'female';
  specialNotes?: string;
  isPinned?: boolean; // هل تم تثبيته في مقعد محدد؟
}

export type SeatStatus = 'regular' | 'damaged' | 'reserved' | 'spacing' | 'corridor';

export interface ExamSeat {
  id: string;
  row: number;
  col: number;
  status: SeatStatus;
  studentId1?: string; // طالب أول
  studentId2?: string; // طالب ثاني (إذا كان المقعد لشخصين)
  assignedSectorId?: string;
}

export interface HallSector {
  id: string;
  name: string; // e.g. قطاع ١، قطاع ٢
  position: 'right' | 'left' | 'middle';
  associatedGate: string;
  direction: 'right_to_left' | 'left_to_right' | 'front_to_back';
  maxCapacity: number; // Default: 20
  assignedGrade?: string;
  assignedDivision?: string;
  proctorId?: string;
  notes?: string;
}

export interface ExamHall {
  id: string;
  name: string; // اسم أو رقم القاعة
  building: string;
  floor: string;
  gatewaysCount: number;
  gatewayPositions: string[]; // ['يمين الباب', 'يسار الباب']
  rowsCount: number;
  colsCount: number;
  studentsPerSeat: 1 | 2;
  damagedSeatsCount: number;
  notes?: string;
  proctorId?: string; // مراقب عام
  sectors: HallSector[];
  seats: ExamSeat[]; // 2D array representation flat
}

export interface ExamProctor {
  id: string;
  name: string;
  role: 'chair' | 'hall' | 'sector' | 'reserve';
  assignedHallId?: string;
  assignedSectorId?: string;
  notes?: string;
}

export interface ExamDistribution {
  sessionId: string;
  hallAssignments: {
    hallId: string;
    seats: {
      seatId: string;
      studentId1?: string;
      studentId2?: string;
    }[];
  }[];
}
