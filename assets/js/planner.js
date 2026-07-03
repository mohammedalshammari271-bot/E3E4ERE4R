// PLANNER AND SCHEDULER GENERATION ENGINE

// Helper to format time into HH:MM
function formatTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Convert HH:MM to minutes
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to get random subject color from custom list
function getRandomColor() {
  const colors = window.SUBJECT_COLORS || [];
  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx] ? colors[idx].hexBg : '#E9E6FA';
}

// 1. GENERATE SMART DAILY SCHEDULE
window.generateDailySchedule = function(params, studentName, gradeClass, stage) {
  const {
    scheduleName,
    date,
    studyPreference,
    wakeTime,
    lunchTime,
    dinnerTime,
    sleepTime,
    lessonCount,
    lessonDuration,
    breakDuration,
    selectedSubjects
  } = params;

  const wakeMins = parseTimeToMinutes(wakeTime);
  let sleepMins = parseTimeToMinutes(sleepTime);
  if (sleepMins < wakeMins) {
    sleepMins += 24 * 60; // Rollover midnight
  }

  const lunchMins = parseTimeToMinutes(lunchTime);
  const dinnerMins = parseTimeToMinutes(dinnerTime);

  // Excluded blocks (meals, 45 mins each)
  const isExcluded = (mins) => {
    if (mins >= lunchMins && mins < lunchMins + 45) return true;
    if (mins >= dinnerMins && mins < dinnerMins + 45) return true;
    return false;
  };

  const lessonTimes = [];
  const lessons = [];
  const cells = {};

  let currentMins = wakeMins + 30; // 30 mins buffer after waking up
  let createdCount = 0;

  const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

  while (currentMins + lessonDuration <= sleepMins && createdCount < lessonCount) {
    if (isExcluded(currentMins) || isExcluded(currentMins + lessonDuration)) {
      currentMins += 15; // Shift forward
      continue;
    }

    const startStr = formatTime(currentMins);
    const endStr = formatTime(currentMins + lessonDuration);

    lessonTimes.push({ start: startStr, end: endStr });
    const lessonTitle = `الدرس ${ordinals[createdCount] || (createdCount + 1)}`;
    lessons.push(lessonTitle);

    const subIdx = createdCount % (selectedSubjects.length || 1);
    const subject = selectedSubjects[subIdx] || 'دراسة عامة';

    cells[`0-${createdCount}`] = {
      subject,
      topic: 'مراجعة وتلخيص الفصل الأول',
      type: 'study',
      status: 'upcoming',
      color: getRandomColor(),
      effort: 'medium',
      startTime: startStr,
      endTime: endStr,
      notes: 'تطبيق مدرسي يوصي بالتركيز والابتعاد عن المشتتات.'
    };

    createdCount++;
    currentMins += lessonDuration + breakDuration;
  }

  return {
    id: `daily-${Date.now()}`,
    studentName,
    gradeClass,
    stage,
    scheduleName: scheduleName || `جدول يومي - ${date}`,
    scheduleType: 'جدول يومي ذكي',
    timePeriod: `يوم ${date}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    startDate: date,
    endDate: date,
    days: ['اليوم المفرد'],
    lessons,
    lessonTimes,
    cells,
    notes: 'تم توليد هذا الجدول اليومي الذكي وتوزيع أوقات المذاكرة والراحة تلقائياً لتناسب أسلوب حياتك.',
    completionRate: 0,
    adherenceRate: 100,
    studyHours: Math.round((createdCount * lessonDuration) / 60),
    completedCount: 0
  };
};

// 2. GENERATE SMART WEEKLY SCHEDULE
window.generateWeeklySchedule = function(params, studentName, gradeClass, stage) {
  const {
    scheduleName,
    startDate,
    selectedSubjects,
    lessonsPerDay,
    lessonDuration,
    breakDuration,
    strategy,
    restDays
  } = params;

  const lessons = [];
  const lessonTimes = [];
  const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

  let currentStartMins = 8 * 60;
  for (let l = 0; l < lessonsPerDay; l++) {
    lessons.push(`الدرس ${ordinals[l] || (l + 1)}`);
    lessonTimes.push({
      start: formatTime(currentStartMins),
      end: formatTime(currentStartMins + lessonDuration)
    });
    currentStartMins += lessonDuration + breakDuration;
  }

  const cells = {};
  const iraqiDays = window.IRAQI_DAYS || [];

  iraqiDays.forEach((day, dayIdx) => {
    if (restDays.includes(day)) {
      for (let l = 0; l < lessonsPerDay; l++) {
        cells[`${dayIdx}-${l}`] = {
          subject: 'راحة واستراحة',
          topic: 'يوم استراحة مدرسي معتمد',
          type: 'rest',
          status: 'upcoming',
          color: '#ECFDF5',
          effort: 'easy',
          notes: 'وقت مخصص لتجديد النشاط والراحة الذهنية.'
        };
      }
      return;
    }

    for (let l = 0; l < lessonsPerDay; l++) {
      let subIdx = (dayIdx * lessonsPerDay + l) % (selectedSubjects.length || 1);
      
      if (strategy === 'weak' && selectedSubjects.length > 1) {
        const weightedPool = [];
        selectedSubjects.forEach((sub, sIdx) => {
          const weight = sIdx === 0 || sIdx === 1 ? 3 : 1;
          for (let w = 0; w < weight; w++) weightedPool.push(sub);
        });
        const poolIdx = (dayIdx * lessonsPerDay + l) % weightedPool.length;
        subIdx = selectedSubjects.indexOf(weightedPool[poolIdx]);
      }

      const subject = selectedSubjects[subIdx] || 'مذاكرة حرة';
      const types = ['study', 'review', 'solve', 'ministerial'];
      const type = types[(dayIdx + l) % types.length];

      cells[`${dayIdx}-${l}`] = {
        subject,
        topic: type === 'ministerial' ? 'حل الأسئلة الوزارية المهمة' : 'دراسة وتلخيص الباب الأول',
        type,
        status: 'upcoming',
        color: getRandomColor(),
        effort: l % 2 === 0 ? 'medium' : 'hard',
        notes: 'تطبيق مدرسي: واظب على التعلم المنظم لأفضل النتائج.'
      };
    }
  });

  const endDateObj = new Date(startDate);
  endDateObj.setDate(endDateObj.getDate() + 6);
  const endDateStr = endDateObj.toISOString().split('T')[0];

  return {
    id: `weekly-${Date.now()}`,
    studentName,
    gradeClass,
    stage,
    scheduleName: scheduleName || 'الجدول الدراسي الأسبوعي الذكي',
    scheduleType: 'جدول أسبوعي ذكي',
    timePeriod: `${startDate} إلى ${endDateStr}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    startDate,
    endDate: endDateStr,
    days: iraqiDays,
    lessons,
    lessonTimes,
    cells,
    notes: 'تم توزيع دروس هذا الجدول الأسبوعي الذكي بصورة متوازنة تبدأ من الجمعة وتنتهي بالخميس طبقاً للتسلسل المدرسي العراقي العريق.',
    completionRate: 0,
    adherenceRate: 100,
    studyHours: Math.round((lessonsPerDay * (iraqiDays.length - restDays.length) * lessonDuration) / 60),
    completedCount: 0
  };
};

// 3. GENERATE REVISION PLAN
window.generateRevisionPlan = function(title, startDate, endDate, selectedSubjects, lessonsPerDay, lessonDuration, type, studentName, gradeClass, stage) {
  const lessons = [];
  const lessonTimes = [];
  const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

  let currentStartMins = 8 * 60;
  for (let l = 0; l < lessonsPerDay; l++) {
    lessons.push(`الدرس ${ordinals[l] || (l + 1)}`);
    lessonTimes.push({
      start: formatTime(currentStartMins),
      end: formatTime(currentStartMins + lessonDuration)
    });
    currentStartMins += lessonDuration + 15;
  }

  const cells = {};
  const iraqiDays = window.IRAQI_DAYS || [];

  iraqiDays.forEach((day, dayIdx) => {
    for (let l = 0; l < lessonsPerDay; l++) {
      const subIdx = (dayIdx * lessonsPerDay + l) % (selectedSubjects.length || 1);
      const subject = selectedSubjects[subIdx] || 'مراجعة عامة';

      let lessonType = 'review';
      let topic = 'مراجعة المنهج والمفردات الأساسية';
      if (type.includes('وزارية')) {
        lessonType = 'ministerial';
        topic = 'مراجعة وحل الدفاتر والأسئلة الوزارية السابقة';
      } else if (type.includes('طوارئ')) {
        lessonType = 'solve';
        topic = 'تغطية طارئة وحل المسائل المضمونة بالامتحان';
      }

      cells[`${dayIdx}-${l}`] = {
        subject,
        topic,
        type: lessonType,
        status: 'upcoming',
        color: getRandomColor(),
        effort: 'hard',
        notes: 'الاستمرارية والمثابرة اليومية هي مفتاح التفوق والنجاح.'
      };
    }
  });

  return {
    id: `plan-${Date.now()}`,
    studentName,
    gradeClass,
    stage,
    scheduleName: title,
    scheduleType: type,
    timePeriod: `الفترة من ${startDate} إلى ${endDate}`,
    createdAt: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    startDate,
    endDate,
    days: iraqiDays,
    lessons,
    lessonTimes,
    cells,
    notes: `تم إنشاء خطة المذاكرة المكثفة بنجاح للفترة الزمنية المحددة لتغطية كل مفردات المناهج الدراسية الخاصة بالصف وتتبع نسبة إنجازك بانتظام.`,
    completionRate: 0,
    adherenceRate: 100,
    studyHours: Math.round((lessonsPerDay * iraqiDays.length * lessonDuration) / 60),
    completedCount: 0
  };
};

// 4. NORMALIZE ARABIC STRING
window.normalizeArabicString = function(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّ]/g, '');
};

// 5. BULK PASTED STUDENTS PARSER
window.parsePastedStudents = function(text, defaultGrade) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const parsed = [];

  lines.forEach((line, index) => {
    let rollNumber = '';
    let name = line;
    let gradeClass = defaultGrade || 'السادس العلمي';
    let division = 'أ';

    const delimiters = [',', '\t', ' - ', '-'];
    let parts = [];
    for (const d of delimiters) {
      if (line.includes(d)) {
        parts = line.split(d).map(p => p.trim());
        break;
      }
    }

    if (parts.length >= 2) {
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
      const numberMatch = line.match(/^(\d+)\s+(.+)$/);
      if (numberMatch) {
        rollNumber = numberMatch[1];
        name = numberMatch[2];
      } else {
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
};

// 6. OCR SIMULATOR
window.simulateOCR = function(fileName, defaultGrade) {
  const mockStudents = [
    { id: 'ocr-1', name: 'أحمد علي جاسم', rollNumber: '120401', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-2', name: 'محمد حسن الشمري', rollNumber: '120402', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-3', name: 'زينب عادل كمال', rollNumber: '120403', gradeClass: defaultGrade, division: 'ب' },
    { id: 'ocr-4', name: 'مصطفى *غير واضح*', rollNumber: '120404', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-5', name: 'حيدر عبد الحسين', rollNumber: '120405', gradeClass: defaultGrade, division: 'ب' },
    { id: 'ocr-6', name: 'فاطمة محمد رضا', rollNumber: '120406', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-7', name: 'علي رضا الطائي', rollNumber: '120407', gradeClass: defaultGrade, division: 'ب' },
    { id: 'ocr-8', name: 'سجاد كريم علوان', rollNumber: '', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-9', name: 'أحمد علي جاسم', rollNumber: '120401', gradeClass: defaultGrade, division: 'أ' },
    { id: 'ocr-10', name: 'مريم عباس قاسم', rollNumber: '120410', gradeClass: defaultGrade, division: 'ب' },
  ];

  const log = `تم استخراج النص من الصورة: "${fileName}" بنجاح.
- العثور على 10 سطور نصية.
- تحديد 8 طلبة بنجاح كامل.
- تحذير: اسم غير واضح في السطر 4.
- تحذير: رقم امتحاني مفقود في السطر 8.
- تحذير: اسم مكرر ورقم امتحاني مكرر في السطر 9.`;

  return { students: mockStudents, log };
};

// 7. AUTO DISTRIBUTION SEATING LOGIC
window.autoDistribute = function(students, halls, sortMethod, spacingMode, allowMultiGradeInSector, allowMultiGradeInHall) {
  const updatedHalls = JSON.parse(JSON.stringify(halls));
  
  updatedHalls.forEach(hall => {
    hall.seats.forEach(seat => {
      seat.studentId1 = undefined;
      seat.studentId2 = undefined;
    });
  });

  const sortedStudents = [...students];
  if (sortMethod === 'rollNumber') {
    sortedStudents.sort((a, b) => {
      const numA = parseInt(a.rollNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.rollNumber.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.rollNumber.localeCompare(b.rollNumber);
    });
  } else if (sortMethod === 'alphabetical') {
    sortedStudents.sort((a, b) => {
      return window.normalizeArabicString(a.name).localeCompare(window.normalizeArabicString(b.name));
    });
  } else if (sortMethod === 'random') {
    sortedStudents.sort(() => Math.random() - 0.5);
  }

  const remainingStudents = [...sortedStudents];
  const unassignedStudents = [];

  for (const hall of updatedHalls) {
    const seatsList = [...hall.seats];
    seatsList.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    const sectors = hall.sectors || [];
    
    for (const sector of sectors) {
      const sectorSeats = seatsList.filter(s => s.assignedSectorId === sector.id && s.status !== 'damaged' && s.status !== 'corridor');

      if (sector.direction === 'right_to_left') {
        sectorSeats.sort((a, b) => {
          if (a.row !== b.row) return a.row - b.row;
          return b.col - a.col;
        });
      } else if (sector.direction === 'left_to_right') {
        sectorSeats.sort((a, b) => {
          if (a.row !== b.row) return a.row - b.row;
          return a.col - b.col;
        });
      }

      const usableSectorSeats = [];
      
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

      const sectorGrade = sector.assignedGrade;
      const sectorDivision = sector.assignedDivision;

      for (const seat of usableSectorSeats) {
        if (remainingStudents.length === 0) break;

        let studentIndex = -1;
        if (sectorGrade) {
          studentIndex = remainingStudents.findIndex(st => {
            const gradeMatch = st.gradeClass === sectorGrade;
            const divMatch = sectorDivision ? st.division === sectorDivision : true;
            return gradeMatch && divMatch;
          });
        }

        if (studentIndex === -1) {
          if (allowMultiGradeInSector) {
            studentIndex = 0;
          } else {
            studentIndex = 0;
          }
        }

        if (studentIndex !== -1 && studentIndex < remainingStudents.length) {
          const student = remainingStudents.splice(studentIndex, 1)[0];
          seat.studentId1 = student.id;

          if (hall.studentsPerSeat === 2 && remainingStudents.length > 0) {
            let nextIndex = -1;
            if (sectorGrade) {
              nextIndex = remainingStudents.findIndex(st => {
                const gradeMatch = st.gradeClass === sectorGrade;
                const divMatch = sectorDivision ? st.division === sectorDivision : true;
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

  unassignedStudents.push(...remainingStudents);
  return { updatedHalls, unassignedStudents };
};

// 8. QUALITY AUTO-CHECK RULES
window.runQualityChecks = function(students, halls, spacingMode) {
  const errors = [];

  // Duplicate Names
  const nameCounts = {};
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

  // Duplicate Roll Numbers
  const rollCounts = {};
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

  // Missing Roll
  const missingRollCount = students.filter(s => !s.rollNumber).length;
  if (missingRollCount > 0) {
    errors.push({
      id: 'chk-missing-roll',
      type: 'warning',
      title: 'أرقام امتحانية مفقودة',
      message: `يوجد عدد ${missingRollCount} من الطلبة لا يمتلكون رقماً امتحانياً حتى الآن.`
    });
  }

  // Unassigned students
  const assignedStudentIds = new Set();
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

  // Damaged seat occupation
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

  // Capacity analysis
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
};
