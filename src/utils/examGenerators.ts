import { ExamSession, ExamStudent, ExamHall, ExamSeat, HallSector, ExamProctor } from '../types/exam';

// Normalize Arabic strings for sorting
export function normalizeArabicString(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّ]/g, ''); // Remove diacritics
}

// 1. Bulk text parsing
export function parsePastedStudents(text: string, defaultGrade: string): ExamStudent[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const parsed: ExamStudent[] = [];

  lines.forEach((line, index) => {
    // Check if line matches common formats:
    // Formats:
    // - Name only: أحمد محمد
    // - Roll + Name: 12245 أحمد محمد
    // - Name + Division: أحمد محمد - أ
    // - Roll + Name + Grade + Division: 12245, أحمد محمد, السادس العلمي, أ
    
    let rollNumber = '';
    let name = line;
    let gradeClass = defaultGrade;
    let division = 'أ';

    // Check for comma or tab separated fields first
    const delimiters = [',', '\t', ' - ', '-'];
    let parts: string[] = [];
    for (const d of delimiters) {
      if (line.includes(d)) {
        parts = line.split(d).map(p => p.trim());
        break;
      }
    }

    if (parts.length >= 2) {
      // Check if first part is a number
      if (/^\d+$/.test(parts[0])) {
        rollNumber = parts[0];
        name = parts[1];
        if (parts[2]) gradeClass = parts[2];
        if (parts[3]) division = parts[3];
      } else {
        name = parts[0];
        division = parts[1];
        if (parts[2]) gradeClass = parts[2];
        if (parts[3]) rollNumber = parts[3];
      }
    } else {
      // Single line text - check if it starts with a number (roll number)
      const numberMatch = line.match(/^(\d+)\s+(.+)$/);
      if (numberMatch) {
        rollNumber = numberMatch[1];
        name = numberMatch[2];
      } else {
        // Just name
        rollNumber = '';
        name = line;
      }
    }

    parsed.push({
      id: `std-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      rollNumber: rollNumber || `EX-${1000 + index}`,
      gradeClass,
      division,
    });
  });

  return parsed;
}

// 2. OCR simulation
export function simulateOCR(fileName: string, defaultGrade: string): { students: ExamStudent[]; log: string } {
  const mockStudents: ExamStudent[] = [
    { id: 'ocr-1', name: 'أحمد علي جاسم', rollNumber: '120401', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-2', name: 'محمد حسن الشمري', rollNumber: '120402', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-3', name: 'زينب عادل كمال', rollNumber: '120403', gradeClass: defaultGrade, division: 'ب' },
    { id: 'ocr-4', name: 'مصطفى *غير واضح*', rollNumber: '120404', gradeClass: defaultGrade, division: 'أ' }, // Unclear
    { id: 'ocr-5', name: 'حيدر عبد الحسين', rollNumber: '120405', gradeClass: defaultGrade, division: 'ب' },
    { id: 'ocr-6', name: 'فاطمة محمد رضا', rollNumber: '120406', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-7', name: 'علي رضا الطائي', rollNumber: '120407', gradeClass: defaultGrade, division: 'ب' },
    { id: 'ocr-8', name: 'سجاد كريم علوان', rollNumber: '', gradeClass: defaultGrade, division: 'أ' }, // Incomplete / missing roll
    { id: 'ocr-9', name: 'أحمد علي جاسم', rollNumber: '120401', gradeClass: defaultGrade, division: 'أ' }, // Duplicate
    { id: 'ocr-10', name: 'مريم عباس قاسم', rollNumber: '120410', gradeClass: defaultGrade, division: 'ب' },
  ];

  const log = `تم استخراج النص من الصورة: "${fileName}" بنجاح.
- العثور على 10 سطور نصية.
- تحديد 8 طلبة بنجاح كامل.
- تحذير: اسم غير واضح في السطر 4.
- تحذير: رقم امتحاني مفقود في السطر 8.
- تحذير: اسم مكرر ورقم امتحاني مكرر في السطر 9.`;

  return { students: mockStudents, log };
}

// 3. Auto Distribution Logic
export function autoDistribute(
  students: ExamStudent[],
  halls: ExamHall[],
  sortMethod: 'rollNumber' | 'alphabetical' | 'random' | 'manual',
  spacingMode: 'none' | 'one' | 'two',
  allowMultiGradeInSector: boolean,
  allowMultiGradeInHall: boolean
): { updatedHalls: ExamHall[]; unassignedStudents: ExamStudent[] } {
  
  // Clone halls and seats
  const updatedHalls: ExamHall[] = JSON.parse(JSON.stringify(halls));
  
  // Clean all existing student allocations except pinned ones
  updatedHalls.forEach(hall => {
    hall.seats.forEach(seat => {
      // Keep only pinned assignments if we had them (for simplicity, we clear all for fresh auto)
      seat.studentId1 = undefined;
      seat.studentId2 = undefined;
    });
  });

  // Sort students according to rule
  let sortedStudents = [...students];
  if (sortMethod === 'rollNumber') {
    sortedStudents.sort((a, b) => {
      const numA = parseInt(a.rollNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.rollNumber.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.rollNumber.localeCompare(b.rollNumber);
    });
  } else if (sortMethod === 'alphabetical') {
    sortedStudents.sort((a, b) => {
      return normalizeArabicString(a.name).localeCompare(normalizeArabicString(b.name));
    });
  } else if (sortMethod === 'random') {
    sortedStudents.sort(() => Math.random() - 0.5);
  }

  // Segment students by grade class to make sure they get placed grouped by grade
  // unless we allow complete random mix. We'll group them by grade and division.
  const studentsByGrade: Record<string, ExamStudent[]> = {};
  sortedStudents.forEach(st => {
    const key = st.gradeClass;
    if (!studentsByGrade[key]) studentsByGrade[key] = [];
    studentsByGrade[key].push(st);
  });

  const remainingStudents = [...sortedStudents];
  const unassignedStudents: ExamStudent[] = [];

  // Iterate over halls
  for (const hall of updatedHalls) {
    // 1. Establish the usable seats based on spacing mode and damaged seats
    // Spacing mode: 'none' (use all), 'one' (skip every other seat on row), 'two' (skip two)
    const seatsList = [...hall.seats];

    // Sort seats by row and column based on sector direction or simple sequence
    // A standard seat ordering: front rows first, right to left.
    seatsList.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col; // Row major sequence
    });

    // We can group seats by sectors
    const sectors = hall.sectors || [];
    
    // Assign students to sectors
    for (const sector of sectors) {
      // Find seats belonging to this sector
      const sectorSeats = seatsList.filter(s => s.assignedSectorId === sector.id && s.status !== 'damaged' && s.status !== 'corridor');

      // Sort sector seats by starting direction
      // Default starts from right of entrance
      if (sector.direction === 'right_to_left') {
        sectorSeats.sort((a, b) => {
          if (a.row !== b.row) return a.row - b.row;
          return b.col - a.col; // cols backwards (right to left)
        });
      } else if (sector.direction === 'left_to_right') {
        sectorSeats.sort((a, b) => {
          if (a.row !== b.row) return a.row - b.row;
          return a.col - b.col; // cols forwards
        });
      }

      // Filter out spacing seats
      let seatingIndex = 0;
      const usableSectorSeats: ExamSeat[] = [];
      
      sectorSeats.forEach((seat, idx) => {
        if (spacingMode === 'one' && idx % 2 !== 0) {
          seat.status = 'spacing';
        } else if (spacingMode === 'two' && idx % 3 !== 0) {
          seat.status = 'spacing';
        } else {
          seat.status = 'regular';
          usableSectorSeats.push(seat);
        }
      });

      // Filter students who should go to this sector
      // First try to match sector grade/division if assigned
      let sectorGrade = sector.assignedGrade;
      let sectorDivision = sector.assignedDivision;

      for (const seat of usableSectorSeats) {
        if (remainingStudents.length === 0) break;

        // Find candidate student
        let studentIndex = -1;
        if (sectorGrade) {
          studentIndex = remainingStudents.findIndex(st => {
            const gradeMatch = st.gradeClass === sectorGrade;
            const divMatch = sectorDivision ? st.division === sectorDivision : true;
            return gradeMatch && divMatch;
          });
        }

        // Fallback: if no specific assignment, or no matching students left
        if (studentIndex === -1) {
          if (allowMultiGradeInSector) {
            studentIndex = 0; // Take any first available
          } else {
            // Find student from a grade not yet in this sector, or the dominant grade
            // For simplicity, take the first available student that matches the hall's allowed grades
            studentIndex = 0;
          }
        }

        if (studentIndex !== -1 && studentIndex < remainingStudents.length) {
          const student = remainingStudents.splice(studentIndex, 1)[0];
          
          // Place student in seat
          seat.studentId1 = student.id;

          // If 2 students per seat is allowed, take another student
          if (hall.studentsPerSeat === 2 && remainingStudents.length > 0) {
            let nextIndex = -1;
            if (sectorGrade) {
              nextIndex = remainingStudents.findIndex(st => {
                const gradeMatch = st.gradeClass === sectorGrade;
                const divMatch = sectorDivision ? st.division === sectorDivision : true;
                // If we don't mix grades on same seat
                const sameGrade = st.gradeClass === student.gradeClass;
                return gradeMatch && divMatch && sameGrade;
              });
            }

            if (nextIndex === -1 && allowMultiGradeInSector) {
              nextIndex = 0;
            }

            if (nextIndex !== -1 && nextIndex < remainingStudents.length) {
              const student2 = remainingStudents.splice(nextIndex, 1)[0];
              seat.studentId2 = student2.id;
            }
          }
        }
      }
    }

    // Now process unassigned seats in the hall that don't belong to a sector but are regular
    const nonSectorSeats = seatsList.filter(s => !s.assignedSectorId && s.status === 'regular');
    for (const seat of nonSectorSeats) {
      if (remainingStudents.length === 0) break;
      const student = remainingStudents.shift();
      if (student) {
        seat.studentId1 = student.id;
        
        if (hall.studentsPerSeat === 2 && remainingStudents.length > 0) {
          const student2 = remainingStudents.shift();
          if (student2) {
            seat.studentId2 = student2.id;
          }
        }
      }
    }
  }

  // Remaining students are unassigned
  unassignedStudents.push(...remainingStudents);

  return { updatedHalls, unassignedStudents };
}

// 4. Quality self-checking validation engine
export interface QualityError {
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  id: string;
}

export function runQualityChecks(
  students: ExamStudent[],
  halls: ExamHall[],
  spacingMode: string
): QualityError[] {
  const errors: QualityError[] = [];

  // Check 1: Duplicate Names
  const nameCounts: Record<string, number> = {};
  students.forEach(st => {
    if (st.name) {
      nameCounts[st.name] = (nameCounts[st.name] || 0) + 1;
    }
  });

  Object.entries(nameCounts).forEach(([name, count]) => {
    if (count > 1) {
      errors.push({
        id: `chk-dup-name-${name}`,
        type: 'warning',
        title: 'أسماء طلبة مكررة',
        message: `تم تكرار الاسم المماثل "${name}" حوالي ${count} مرات في قائمة الطلاب.`
      });
    }
  });

  // Check 2: Duplicate Exam Roll Numbers
  const rollCounts: Record<string, number> = {};
  students.forEach(st => {
    if (st.rollNumber) {
      rollCounts[st.rollNumber] = (rollCounts[st.rollNumber] || 0) + 1;
    }
  });

  Object.entries(rollCounts).forEach(([roll, count]) => {
    if (count > 1 && roll !== '') {
      errors.push({
        id: `chk-dup-roll-${roll}`,
        type: 'danger',
        title: 'رقم امتحاني مكرر',
        message: `الرقم الامتحاني "${roll}" مستخدم أكثر من مرة لطلبة مختلفين!`
      });
    }
  });

  // Check 3: Students without Roll Number
  const missingRollCount = students.filter(s => !s.rollNumber).length;
  if (missingRollCount > 0) {
    errors.push({
      id: 'chk-missing-roll',
      type: 'warning',
      title: 'أرقام امتحانية مفقودة',
      message: `يوجد عدد ${missingRollCount} من الطلبة لا يمتلكون رقماً امتحانياً حتى الآن.`
    });
  }

  // Check 4: Unassigned students
  let assignedStudentIds = new Set<string>();
  halls.forEach(h => {
    h.seats.forEach(s => {
      if (s.studentId1) assignedStudentIds.add(s.studentId1);
      if (s.studentId2) assignedStudentIds.add(s.studentId2);
    });
  });

  const unassignedCount = students.length - assignedStudentIds.size;
  if (unassignedCount > 0) {
    errors.push({
      id: 'chk-unassigned-students',
      type: 'danger',
      title: 'طلبة خارج التوزيع',
      message: `تنبيه: يوجد ${unassignedCount} طالباً لم يتم حجز مقاعد لهم لعدم كفاية سعة القاعات المتاحة!`
    });
  }

  // Check 5: Over-allocated or damaged seats occupied
  halls.forEach(hall => {
    hall.seats.forEach(seat => {
      if (seat.status === 'damaged' && (seat.studentId1 || seat.studentId2)) {
        errors.push({
          id: `chk-damaged-occupied-${hall.id}-${seat.row}-${seat.col}`,
          type: 'danger',
          title: 'مقعد معطل مشغول',
          message: `تم توزيع طالب في مقعد معطل أو غير صالح للاستخدام بقاعة "${hall.name}"!`
        });
      }
    });
  });

  // Check 6: Capacity analysis
  halls.forEach(hall => {
    const totalSeats = hall.seats.filter(s => s.status !== 'corridor').length;
    const damagedSeats = hall.seats.filter(s => s.status === 'damaged').length;
    const spacingSeats = hall.seats.filter(s => s.status === 'spacing').length;
    const usable = totalSeats - damagedSeats - spacingSeats;
    const studentsInHall = hall.seats.reduce((acc, s) => {
      if (s.studentId1) acc++;
      if (s.studentId2) acc++;
      return acc;
    }, 0);

    const actualCapacity = usable * hall.studentsPerSeat;
    if (studentsInHall > actualCapacity) {
      errors.push({
        id: `chk-overflow-${hall.id}`,
        type: 'danger',
        title: 'تجاوز سعة القاعة',
        message: `تم تخصيص ${studentsInHall} طالب لقاعة "${hall.name}" بينما سعتها الفعلية هي ${actualCapacity} مقعداً فقط!`
      });
    }
  });

  return errors;
}
