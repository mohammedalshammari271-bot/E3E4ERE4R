// STORAGE UTILITIES FOR PERSISTENCE (localStorage)

const PROFILE_KEY = 'madrasati_student_profile_v2';
const SCHEDULES_KEY = 'madrasati_schedules_v2';
const ACTIVE_ID_KEY = 'madrasati_active_schedule_id_v2';
const USER_ROLE_KEY = 'madrasati_user_role_v2';
const CURRICULUM_TREE_KEY = 'madrasati_curriculum_tree_v2';
const TEACHER_LESSONS_KEY = 'madrasati_teacher_lessons_v2';
const TEACHER_SCHEDULES_KEY = 'madrasati_teacher_schedules_v2';
const ACTIVE_TEACHER_SCHEDULE_ID_KEY = 'madrasati_active_teacher_schedule_id_v2';

// --- STUDENT PROFILE ---
window.getStudentProfile = function() {
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return null;
  try {
    const profile = JSON.parse(data);
    if (profile && profile.gradeClass) {
      // Map old Iraqi grades to the new unified 15 grades
      const oldToNewMap = {
        'الخامس الأحيائي': 'الخامس العلمي',
        'الخامس التطبيقي': 'الخامس العلمي',
        'السادس الأحيائي': 'السادس العلمي',
        'السادس التطبيقي': 'السادس العلمي'
      };
      if (oldToNewMap[profile.gradeClass]) {
        profile.gradeClass = oldToNewMap[profile.gradeClass];
      }
      
      // Let's ensure the grade exists in our new central list
      const gradeExists = window.IRAQI_GRADES && window.IRAQI_GRADES.some(g => g.gradeName === profile.gradeClass);
      if (!gradeExists) {
        // If the grade is invalid/outdated, return null to force onboarding
        return null;
      }
      
      // Sync stage and other properties
      if (window.IRAQI_GRADES) {
        const gradeObj = window.IRAQI_GRADES.find(g => g.gradeName === profile.gradeClass);
        if (gradeObj) {
          profile.stage = gradeObj.stageId === 'primary' ? 'elementary' : gradeObj.stageId === 'intermediate' ? 'middle' : 'preparatory';
        }
      }
      
      // Persist the upgraded profile
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
    return profile;
  } catch (e) {
    return null;
  }
};

window.saveStudentProfile = function(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

window.clearStudentProfile = function() {
  localStorage.removeItem(PROFILE_KEY);
};

// --- SCHEDULES ---
window.getSavedSchedules = function() {
  const data = localStorage.getItem(SCHEDULES_KEY);
  if (!data) {
    // Return presets as initial state
    const presets = window.DEFAULT_SCHEDULES || [];
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(presets));
    return presets;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

window.saveSchedules = function(schedules) {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
};

window.getActiveScheduleId = function() {
  return localStorage.getItem(ACTIVE_ID_KEY) || (window.getSavedSchedules()[0] || {}).id || '';
};

window.saveActiveScheduleId = function(id) {
  localStorage.setItem(ACTIVE_ID_KEY, id);
};

// --- USER ROLE ---
window.getUserRole = function() {
  return localStorage.getItem(USER_ROLE_KEY) || 'student';
};

window.saveUserRole = function(role) {
  localStorage.setItem(USER_ROLE_KEY, role);
};

// --- CURRICULUM TREE ---
window.getCurriculumTree = function() {
  const data = localStorage.getItem(CURRICULUM_TREE_KEY);
  let tree = [];
  if (!data) {
    // Generate initial tree from CURRICULUM_TREES in data.js
    const initialTree = [];
    const trees = window.CURRICULUM_TREES || {};
    Object.entries(trees).forEach(([grade, subjects]) => {
      subjects.forEach(subj => {
        initialTree.push({
          id: `node-${grade}-${subj.subjectName}`,
          name: `${grade} - ${subj.subjectName}`,
          type: 'subject',
          completed: false,
          children: subj.chapters.map(chap => ({
            id: chap.id,
            name: chap.name,
            type: 'chapter',
            completed: false,
            children: chap.lessons.map((les, lidx) => ({
              id: `${chap.id}-les-${lidx}`,
              name: les,
              type: 'lesson',
              completed: false,
              reviewCount: 0,
              questionsCount: 5,
              ministerialQuestionsCount: 2,
              masteryPercentage: 0
            }))
          }))
        });
      });
    });
    tree = initialTree;
  } else {
    try {
      tree = JSON.parse(data);
    } catch (e) {
      tree = [];
    }
  }

  // Check if current student's grade exists in the tree. If not, generate fallbacks dynamically!
  const studentProfile = window.getStudentProfile();
  if (studentProfile && studentProfile.gradeClass) {
    const currentGrade = studentProfile.gradeClass;
    const gradeExistsInTree = tree.some(node => node.name.startsWith(currentGrade + " - "));
    
    if (!gradeExistsInTree) {
      let subjects = [];
      if (currentGrade.includes('الابتدائي')) {
        subjects = ['اللغة العربية', 'الرياضيات', 'العلوم', 'التربية الإسلامية', 'اللغة الإنكليزية'];
      } else if (currentGrade.includes('المتوسط')) {
        subjects = ['اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الاجتماعيات', 'اللغة الإنكليزية'];
      } else if (currentGrade.includes('العلمي')) {
        subjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية', 'اللغة الإنكليزية'];
      } else if (currentGrade.includes('الأدبي')) {
        subjects = ['التاريخ', 'الجغرافية', 'الرياضيات', 'الاقتصاد', 'اللغة العربية', 'اللغة الإنكليزية'];
      } else {
        subjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'اللغة العربية', 'اللغة الإنكليزية'];
      }

      const generatedNodes = subjects.map(subj => {
        const idSafe = subj.replace(/\s+/g, '-');
        return {
          id: `node-${currentGrade}-${idSafe}`,
          name: `${currentGrade} - ${subj}`,
          type: 'subject',
          completed: false,
          children: [
            {
              id: `chap-${currentGrade}-${idSafe}-1`,
              name: 'الفصل الأول: الأساسيات والمفاهيم العامة',
              type: 'chapter',
              completed: false,
              children: [
                { id: `les-${currentGrade}-${idSafe}-1-1`, name: 'الدرس الأول: مقدمة وتمهيد أساسي', type: 'lesson', completed: false },
                { id: `les-${currentGrade}-${idSafe}-1-2`, name: 'الدرس الثاني: الأنشطة والتطبيقات الأساسية', type: 'lesson', completed: false },
                { id: `les-${currentGrade}-${idSafe}-1-3`, name: 'الدرس الثالث: مراجعة وحل الأسئلة والتمارين', type: 'lesson', completed: false }
              ]
            },
            {
              id: `chap-${currentGrade}-${idSafe}-2`,
              name: 'الفصل الثاني: المهارات المتقدمة والتطبيقات',
              type: 'chapter',
              completed: false,
              children: [
                { id: `les-${currentGrade}-${idSafe}-2-1`, name: 'الدرس الأول: شرح المفاهيم المحورية', type: 'lesson', completed: false },
                { id: `les-${currentGrade}-${idSafe}-2-2`, name: 'الدرس الثاني: تطبيقات وتجارب عملية', type: 'lesson', completed: false },
                { id: `les-${currentGrade}-${idSafe}-2-3`, name: 'الدرس الثالث: أسئلة مراجعة الفصل واختبار الذات', type: 'lesson', completed: false }
              ]
            }
          ]
        };
      });

      tree = tree.concat(generatedNodes);
      localStorage.setItem(CURRICULUM_TREE_KEY, JSON.stringify(tree));
    }
  }

  return tree;
};

window.saveCurriculumTree = function(tree) {
  localStorage.setItem(CURRICULUM_TREE_KEY, JSON.stringify(tree));
};

// --- TEACHER LESSONS ---
window.getTeacherLessons = function() {
  const data = localStorage.getItem(TEACHER_LESSONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

window.saveTeacherLessons = function(lessons) {
  localStorage.setItem(TEACHER_LESSONS_KEY, JSON.stringify(lessons));
};

// --- TEACHER SCHEDULES ---
window.getTeacherSchedules = function() {
  const data = localStorage.getItem(TEACHER_SCHEDULES_KEY);
  if (!data) {
    const defaultSchedules = [{ id: 'tech-sch-1', name: 'جدول المدرس الموحد 2026', createdAt: new Date().toISOString().split('T')[0], lastModified: new Date().toISOString().split('T')[0] }];
    localStorage.setItem(TEACHER_SCHEDULES_KEY, JSON.stringify(defaultSchedules));
    return defaultSchedules;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

window.saveTeacherSchedules = function(schedules) {
  localStorage.setItem(TEACHER_SCHEDULES_KEY, JSON.stringify(schedules));
};

window.getActiveTeacherScheduleId = function() {
  return localStorage.getItem(ACTIVE_TEACHER_SCHEDULE_ID_KEY) || (window.getTeacherSchedules()[0] || {}).id || '';
};

window.saveActiveTeacherScheduleId = function(id) {
  localStorage.setItem(ACTIVE_TEACHER_SCHEDULE_ID_KEY, id);
};

// --- EXAM HALL ORGANIZER STORAGE ---
window.getExamSession = function() {
  const data = localStorage.getItem('exam_session');
  if (!data) {
    const defaultSession = {
      id: 'session-1',
      schoolName: 'إعدادية المتميزين للبنين',
      examTitle: 'امتحانات البكالوريا الوزارية التجريبية',
      subject: 'الرياضيات',
      gradeClass: 'السادس العلمي',
      attempt: 'الدور الأول',
      date: new Date().toISOString().split('T')[0],
      day: 'الأحد',
      time: '08:30 ص',
      committeeChair: 'أ. د. محمد الحسني',
      notes: 'يرجى الالتزام بالتباعد والهدوء ومنع إدخال الأجهزة الذكية للقاعة.',
      isMultiGrade: false,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0]
    };
    localStorage.setItem('exam_session', JSON.stringify(defaultSession));
    return defaultSession;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

window.saveExamSession = function(session) {
  localStorage.setItem('exam_session', JSON.stringify(session));
};

window.getExamStudents = function() {
  const data = localStorage.getItem('exam_students');
  if (!data) {
    const defaultStudents = [
      { id: 'st-1', name: 'أحمد علي جاسم', rollNumber: '100401', gradeClass: 'السادس العلمي', division: 'أ' },
      { id: 'st-2', name: 'محمد حسن الشمري', rollNumber: '100402', gradeClass: 'السادس العلمي', division: 'أ' },
      { id: 'st-3', name: 'حيدر عبد الحسين البهادلي', rollNumber: '100403', gradeClass: 'السادس العلمي', division: 'أ' },
      { id: 'st-4', name: 'زينب عادل كمال الغريري', rollNumber: '100404', gradeClass: 'السادس العلمي', division: 'ب' },
      { id: 'st-5', name: 'علي رضا الطائي', rollNumber: '100405', gradeClass: 'السادس العلمي', division: 'ب' },
      { id: 'st-6', name: 'مصطفى جواد كاظم العبيدي', rollNumber: '100406', gradeClass: 'السادس العلمي', division: 'أ' },
      { id: 'st-7', name: 'سجاد كريم علوان الخفاجي', rollNumber: '100407', gradeClass: 'السادس العلمي', division: 'ب' },
      { id: 'st-8', name: 'مريم عباس قاسم الأسدي', rollNumber: '100408', gradeClass: 'السادس العلمي', division: 'أ' },
    ];
    localStorage.setItem('exam_students', JSON.stringify(defaultStudents));
    return defaultStudents;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

window.saveExamStudents = function(students) {
  localStorage.setItem('exam_students', JSON.stringify(students));
};

window.getExamHalls = function() {
  const data = localStorage.getItem('exam_halls');
  if (!data) {
    // Generate DEFAULT_HALL_MOCK
    const defaultHall = {
      id: 'hall-1',
      name: 'القاعة الكبرى (١)',
      building: 'البناية الرئيسية',
      floor: 'الطابق الثاني',
      gatewaysCount: 1,
      gatewayPositions: ['يمين الغرفة'],
      rowsCount: 5,
      colsCount: 6,
      studentsPerSeat: 1,
      damagedSeatsCount: 2,
      notes: 'قاعة واسعة مكيفة بالكامل وتحتوي على نظام مراقبة بكاميرات معتمدة.',
      proctorId: 'proc-1',
      sectors: [
        {
          id: 'sec-1',
          name: 'القطاع الأول (اليمين)',
          position: 'right',
          associatedGate: 'المدخل الرئيسي',
          direction: 'right_to_left',
          maxCapacity: 20,
          assignedGrade: 'السادس العلمي',
          assignedDivision: 'أ',
          notes: 'يبدأ من جهة يمين المدخل.'
        },
        {
          id: 'sec-2',
          name: 'القطاع الثاني (اليسار)',
          position: 'left',
          associatedGate: 'المدخل الرئيسي',
          direction: 'left_to_right',
          maxCapacity: 20,
          assignedGrade: 'السادس العلمي',
          assignedDivision: 'ب',
          notes: 'يبدأ من يسار المدخل.'
        }
      ],
      seats: Array.from({ length: 30 }, (_, index) => {
        const row = Math.floor(index / 6);
        const col = index % 6;
        const isDamaged = index === 11 || index === 20;
        return {
          id: `seat-1-${index}`,
          row,
          col,
          status: isDamaged ? 'damaged' : 'regular',
          assignedSectorId: col < 3 ? 'sec-1' : 'sec-2'
        };
      })
    };
    const defaultHalls = [defaultHall];
    localStorage.setItem('exam_halls', JSON.stringify(defaultHalls));
    return defaultHalls;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

window.saveExamHalls = function(halls) {
  localStorage.setItem('exam_halls', JSON.stringify(halls));
};

window.getExamProctors = function() {
  const data = localStorage.getItem('exam_proctors');
  if (!data) {
    const defaultProctors = [
      { id: 'proc-1', name: 'أ. عمر الخفاجي', role: 'hall', assignedHallId: 'hall-1' },
      { id: 'proc-2', name: 'أ. ساجدة العبيدي', role: 'sector', assignedHallId: 'hall-1', assignedSectorId: 'sec-1' },
      { id: 'proc-3', name: 'أ. رائد العزاوي', role: 'sector', assignedHallId: 'hall-1', assignedSectorId: 'sec-2' },
      { id: 'proc-4', name: 'أ. علي التميمي', role: 'reserve' }
    ];
    localStorage.setItem('exam_proctors', JSON.stringify(defaultProctors));
    return defaultProctors;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

window.saveExamProctors = function(proctors) {
  localStorage.setItem('exam_proctors', JSON.stringify(proctors));
};
