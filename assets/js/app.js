// CORE APPLICATION CONTROLLER FOR PURE STATIC HTML5/CSS/JS

// --- GLOBAL APPLICATION STATE ---
let state = {
  userRole: 'student', // 'student' | 'teacher' | 'exam_organizer'
  
  // Student State
  studentProfile: null,
  schedules: [],
  currentScheduleId: '',
  activeStudentTab: 'schedule', // 'schedule' | 'curriculum' | 'assistant'
  curriculumChecked: {}, // chapter/lesson completion
  wizardStep: 1,
  wizardSelectedSubjects: [],
  editingCell: null, // { dayIndex, lessonIndex }
  
  // Teacher State
  teacherRole: 'principal', // 'principal' | 'assistant' | 'teacher'
  teacherLessons: [],
  teacherFilters: { grade: 'all', teacher: 'all', room: 'all' },
  editingTeacherLessonId: null,
  teacherProfile: {
    schoolName: 'إعدادية المتميزين للبنين',
    principalName: 'أ. د. محمد الحسني',
    assistantName: 'أ. علاء الدين الجبوري',
    teachers: ['أ. أحمد الراوي (رياضيات)', 'أ. عمر الخفاجي (فيزياء)', 'أ. زينب الدليمي (كيمياء)', 'أ. ساجدة العبيدي (عربي)', 'أ. رائد العزاوي (إنجليزي)', 'أ. علي التميمي (أحياء)'],
    rooms: ['مختبر الفيزياء', 'قاعة المتميزين (١)', 'قاعة النوابغ (٢)', 'مختبر الكيمياء', 'القاعة الكبرى'],
    grades: ['السادس العلمي', 'السادس الأدبي', 'الثالث المتوسط', 'الرابع العلمي', 'الخامس الأحيائي'],
    divisions: ['أ', 'ب', 'ج', 'د']
  },
  
  // Exam Organizer State
  activeExamStep: 1,
  examSession: null,
  examStudents: [],
  examHalls: [],
  examProctors: [],
  selectedHallId: '', // for seating visual map edit
  examReportTab: 'cards', // 'cards' | 'registers' | 'maps' | 'proctors'
  studentInputMode: 'manual', // 'manual' | 'bulk' | 'ocr'
  ocrResults: [],
  ocrLogText: '',
  
  // Exam AI Assistant Chat
  examChatHistory: [],
  
  // Student AI Assistant Chat
  studentChatHistory: [],
  emergencyPlanStep: 0, // 0 = inactive, 1..10 step
  emergencyPlanData: {}
};

// --- DOM READY INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
  // 1. Load data from local storage helpers
  state.studentProfile = window.getStudentProfile();
  state.schedules = window.getSavedSchedules();
  state.currentScheduleId = window.getActiveScheduleId();
  state.userRole = window.getUserRole();
  
  // Load custom school teacher lessons
  state.teacherLessons = window.getTeacherLessons();
  if (state.teacherLessons.length === 0) {
    state.teacherLessons = [
      { id: 't-les-1', day: 'الأحد', periodIndex: 0, gradeClass: 'السادس العلمي', division: 'أ', subject: 'الرياضيات', teacher: 'أ. أحمد الراوي (رياضيات)', room: 'قاعة المتميزين (١)', type: 'study', notes: 'الأعداد المركبة ومبرهنة ديموافر' },
      { id: 't-les-2', day: 'الأحد', periodIndex: 1, gradeClass: 'السادس العلمي', division: 'أ', subject: 'الفيزياء', teacher: 'أ. عمر الخفاجي (فيزياء)', room: 'مختبر الفيزياء', type: 'study', notes: 'ربط المتسعات على التوالي والتوازي' },
      { id: 't-les-3', day: 'الاثنين', periodIndex: 1, gradeClass: 'الثالث المتوسط', division: 'ب', subject: 'اللغة العربية', teacher: 'أ. ساجدة العبيدي (عربي)', room: 'قاعة النوابغ (٢)', type: 'review', notes: 'قواعد اسم الفاعل وصيغ المبالغة' }
    ];
    window.saveTeacherLessons(state.teacherLessons);
  }

  // Load Exam Organizer configurations
  state.examSession = window.getExamSession();
  state.examStudents = window.getExamStudents();
  state.examHalls = window.getExamHalls();
  state.examProctors = window.getExamProctors();
  
  if (state.examHalls.length > 0) {
    state.selectedHallId = state.examHalls[0].id;
  }

  // Load custom checkmarks from local storage
  const savedChecks = localStorage.getItem('madrasati_curriculum_checked_v2');
  if (savedChecks) {
    try { state.curriculumChecked = JSON.parse(savedChecks); } catch(e) {}
  }

  // Initial welcome message in student advisor
  resetStudentChat();
  resetExamAdvisorChat();

  // Apply visual roles
  switchRole(state.userRole);
  
  // Render dropdown helpers
  populateTeacherRoleDropdowns();
  
  // Auto check clashes
  checkTeacherScheduleClashes();
});

// --- ROLE SWITCHING ENGINE ---
function switchRole(role) {
  state.userRole = role;
  window.saveUserRole(role);

  // Toggle visible containers
  document.getElementById('student-section').classList.add('hidden');
  document.getElementById('teacher-section').classList.add('hidden');
  document.getElementById('exam-organizer-section').classList.add('hidden');

  // Toggle active switcher buttons
  document.getElementById('btn-role-student').className = "px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer bg-[#F3F0FC] text-slate-600";
  document.getElementById('btn-role-teacher').className = "px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer bg-[#F3F0FC] text-slate-600";
  document.getElementById('btn-role-organizer').className = "px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer bg-[#F3F0FC] text-slate-600";

  if (role === 'student') {
    document.getElementById('student-section').classList.remove('hidden');
    document.getElementById('btn-role-student').className = "px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer bg-brand text-white shadow-md shadow-brand/25";
    
    // Check if profile exists
    if (state.studentProfile) {
      document.getElementById('student-onboarding').classList.add('hidden');
      document.getElementById('student-dashboard').classList.remove('hidden');
      renderStudentProfileDetails();
      renderStudentSchedulesList();
      renderStudentScheduleTable();
      renderCurriculumTracker();
    } else {
      document.getElementById('student-dashboard').classList.add('hidden');
      document.getElementById('student-onboarding').classList.remove('hidden');
      if (typeof window.updateOnboardSubjects === 'function') {
        window.updateOnboardSubjects();
      }
    }
  } else if (role === 'teacher') {
    document.getElementById('teacher-section').classList.remove('hidden');
    document.getElementById('btn-role-teacher').className = "px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer bg-brand text-white shadow-md shadow-brand/25";
    
    // Render teacher timetable and tools
    setTeacherRole(state.teacherRole);
    renderTeacherGrid();
  } else if (role === 'exam_organizer') {
    document.getElementById('exam-organizer-section').classList.remove('hidden');
    document.getElementById('btn-role-organizer').className = "px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer bg-brand text-white shadow-md shadow-brand/25";
    
    // Render active exam step panel
    switchExamStep(state.activeExamStep);
  }
}

// =========================================================
// 1. STUDENT DASHBOARD MODULE
// =========================================================

// Onboarding Profile creation
function handleStudentOnboarding(e) {
  e.preventDefault();
  const name = document.getElementById('onboard-name').value.trim();
  const grade = document.getElementById('onboard-grade').value;
  const division = document.getElementById('onboard-division').value.trim() || 'أ';
  const target = parseFloat(document.getElementById('onboard-target').value) || 95;

  const gradeObj = window.IRAQI_GRADES.find(g => g.gradeName === grade);
  const stageVal = gradeObj ? (gradeObj.stageId === 'primary' ? 'elementary' : gradeObj.stageId === 'intermediate' ? 'middle' : 'preparatory') : (grade.includes('الابتدائي') ? 'elementary' : grade.includes('المتوسط') ? 'middle' : 'preparatory');
  const profile = { studentName: name, gradeClass: grade, division, expectedAverage: target, stage: stageVal };
  state.studentProfile = profile;
  window.saveStudentProfile(profile);

  // Generate initial schedule based on grade choice
  const matchingSchedules = window.DEFAULT_SCHEDULES.filter(s => s.gradeClass === grade);
  let initialSchedules = [];
  if (matchingSchedules.length > 0) {
    initialSchedules = JSON.parse(JSON.stringify(matchingSchedules));
  } else {
    // Clone general weekly default
    initialSchedules = [JSON.parse(JSON.stringify(window.DEFAULT_SCHEDULES[0]))];
  }

  // Set names
  initialSchedules.forEach(s => {
    s.studentName = name;
    s.gradeClass = grade;
    s.stage = profile.stage;
  });

  state.schedules = initialSchedules;
  state.currentScheduleId = initialSchedules[0].id;
  window.saveSchedules(initialSchedules);
  window.saveActiveScheduleId(initialSchedules[0].id);

  // Redirect to dashboard
  switchRole('student');
  alert(`🎉 أهلاً بك يا بطل المتميزين "${name}"! تم توليد جدول دراسي مثالي لصفك الدراسي.`);
}

// Clear account
window.clearStudentProfileData = function() {
  const modal = document.getElementById('modal-confirm-reset');
  if (modal) {
    modal.showModal();
  } else {
    if (confirm('⚠️ تنبيه هام: هل أنت متأكد من مسح جميع بيانات بروفايلك وجداولك الحالية وبدء الإعداد من جديد؟')) {
      window.confirmResetApplicationData();
    }
  }
};

window.closeConfirmResetModal = function() {
  const modal = document.getElementById('modal-confirm-reset');
  if (modal) {
    modal.close();
  }
};

window.confirmResetApplicationData = function() {
  try {
    const keysToClear = [
      'madrasati_student_profile_v2',
      'madrasati_schedules_v2',
      'madrasati_active_schedule_id_v2',
      'madrasati_user_role_v2',
      'madrasati_curriculum_tree_v2',
      'madrasati_teacher_lessons_v2',
      'madrasati_teacher_schedules_v2',
      'madrasati_active_teacher_schedule_id_v2',
      'exam_session',
      'exam_students',
      'exam_halls',
      'exam_proctors',
      'madrasati_curriculum_checked_v2'
    ];

    keysToClear.forEach(key => {
      localStorage.removeItem(key);
    });

    sessionStorage.clear();

    if (window.indexedDB && window.indexedDB.databases) {
      window.indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      }).catch(err => {
        console.error("Error clearing IndexedDB databases:", err);
      });
    }

    state.studentProfile = null;
    state.schedules = [];
    state.currentScheduleId = '';
    state.curriculumChecked = {};
    state.teacherLessons = [];
    state.examStudents = [];
    state.examHalls = [];
    state.examProctors = [];

    window.closeConfirmResetModal();
    alert('✓ تم مسح جميع بيانات التطبيق بنجاح وإعادة الضبط للوضع الافتراضي.');

    switchRole('student');
  } catch (error) {
    console.error("Critical error during application reset:", error);
    alert('⚠️ حدث خطأ أثناء مسح بعض البيانات: ' + error.message);
  }
};

window.updateOnboardSubjects = function() {
  const selectedGrade = document.getElementById('onboard-grade')?.value;
  const gradeObj = window.IRAQI_GRADES.find(g => g.gradeName === selectedGrade);
  const container = document.getElementById('onboard-target-container');
  if (container) {
    if (gradeObj && gradeObj.supportsPredictedAverage) {
      container.style.display = 'block';
      document.getElementById('onboard-target').required = true;
    } else {
      container.style.display = 'none';
      document.getElementById('onboard-target').required = false;
    }
  }
};

function toggleGradeSpecificFeatures() {
  if (!state.studentProfile) return;
  const gradeName = state.studentProfile.gradeClass;
  const gradeObj = window.IRAQI_GRADES.find(g => g.gradeName === gradeName);
  if (!gradeObj) return;

  // 1. Check Predicted Average (ميزة المعدل المتوقع)
  const targetAvgBlock = document.getElementById('student-profile-target')?.parentElement;
  if (targetAvgBlock) {
    if (gradeObj.supportsPredictedAverage) {
      targetAvgBlock.style.display = 'block';
    } else {
      targetAvgBlock.style.display = 'none';
    }
  }

  // Hide/Show "معدلك المستهدف بالوزاري" in onboarding if the user resets or starts onboarding
  const onboardTargetBlock = document.getElementById('onboard-target-container');
  if (onboardTargetBlock) {
    const selectedOnboardGrade = document.getElementById('onboard-grade')?.value;
    const onboardGradeObj = window.IRAQI_GRADES.find(g => g.gradeName === selectedOnboardGrade);
    if (onboardGradeObj && onboardGradeObj.supportsPredictedAverage) {
      onboardTargetBlock.style.display = 'block';
      document.getElementById('onboard-target').required = true;
    } else {
      onboardTargetBlock.style.display = 'none';
      document.getElementById('onboard-target').required = false;
    }
  }

  // 2. Ministerial features toggling
  // If the student's grade does not support ministerial plans/questions:
  // - Disable or remove option with value "ministerial" in cell editor and lesson forms
  const cellTypeSelect = document.getElementById('edit-cell-type');
  if (cellTypeSelect) {
    const ministerialOpt = cellTypeSelect.querySelector('option[value="ministerial"]');
    if (ministerialOpt) {
      ministerialOpt.style.display = gradeObj.supportsMinisterialPlans ? 'block' : 'none';
      ministerialOpt.disabled = !gradeObj.supportsMinisterialPlans;
    }
  }

  const lessonTypeSelect = document.getElementById('form-lesson-type');
  if (lessonTypeSelect) {
    const ministerialOpt = lessonTypeSelect.querySelector('option[value="ministerial"]');
    if (ministerialOpt) {
      ministerialOpt.style.display = gradeObj.supportsMinisterialPlans ? 'block' : 'none';
      ministerialOpt.disabled = !gradeObj.supportsMinisterialPlans;
    }
  }
}

// Populate Details on Sidebar
function renderStudentProfileDetails() {
  if (!state.studentProfile) return;
  document.getElementById('student-profile-name').innerText = state.studentProfile.studentName;
  document.getElementById('student-profile-grade').innerText = state.studentProfile.gradeClass;
  document.getElementById('student-profile-target').innerText = `${state.studentProfile.expectedAverage}%`;
  
  toggleGradeSpecificFeatures();
}

// Populate schedules Picker
function renderStudentSchedulesList() {
  const container = document.getElementById('student-schedules-list');
  container.innerHTML = '';
  
  state.schedules.forEach(s => {
    const isActive = s.id === state.currentScheduleId;
    const card = document.createElement('div');
    card.className = `p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
      isActive 
        ? 'bg-brand/5 border-brand-lavender text-brand-dark font-black' 
        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
    }`;
    
    card.innerHTML = `
      <div onclick="selectActiveSchedule('${s.id}')" class="flex-1 truncate">
        <span class="block truncate">${s.scheduleName}</span>
        <span class="text-[9px] text-slate-400 font-bold">${s.scheduleType} • ${s.completionRate || 0}%</span>
      </div>
      <button onclick="deleteSavedSchedule(event, '${s.id}')" class="text-slate-400 hover:text-red-500 font-extrabold px-1 text-sm cursor-pointer no-print">×</button>
    `;
    container.appendChild(card);
  });
}

function selectActiveSchedule(id) {
  state.currentScheduleId = id;
  window.saveActiveScheduleId(id);
  renderStudentSchedulesList();
  renderStudentScheduleTable();
}

function deleteSavedSchedule(e, id) {
  e.stopPropagation();
  if (state.schedules.length <= 1) {
    alert('لا يمكن إزالة الجدول الأخير، يجب الاحتفاظ بجدول واحد على الأقل.');
    return;
  }
  if (confirm('هل ترغب في حذف هذا الجدول؟')) {
    state.schedules = state.schedules.filter(s => s.id !== id);
    window.saveSchedules(state.schedules);
    if (state.currentScheduleId === id) {
      state.currentScheduleId = state.schedules[0].id;
      window.saveActiveScheduleId(state.schedules[0].id);
    }
    renderStudentSchedulesList();
    renderStudentScheduleTable();
  }
}

// Tab Switching
function switchStudentTab(tab) {
  state.activeStudentTab = tab;
  
  document.getElementById('tab-student-schedule').className = "px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer bg-white text-slate-600 hover:bg-slate-50";
  document.getElementById('tab-student-curriculum').className = "px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer bg-white text-slate-600 hover:bg-slate-50";
  document.getElementById('tab-student-assistant').className = "px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer bg-white text-slate-600 hover:bg-slate-50";

  document.getElementById('pane-student-schedule').classList.add('hidden');
  document.getElementById('pane-student-curriculum').classList.add('hidden');
  document.getElementById('pane-student-assistant').classList.add('hidden');

  if (tab === 'schedule') {
    document.getElementById('pane-student-schedule').classList.remove('hidden');
    document.getElementById('tab-student-schedule').className = "px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer bg-brand text-white shadow-sm";
  } else if (tab === 'curriculum') {
    document.getElementById('pane-student-curriculum').classList.remove('hidden');
    document.getElementById('tab-student-curriculum').className = "px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer bg-brand text-white shadow-sm";
  } else if (tab === 'assistant') {
    document.getElementById('pane-student-assistant').classList.remove('hidden');
    document.getElementById('tab-student-assistant').className = "px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer bg-brand text-white shadow-sm";
    renderStudentChat();
  }
}

// Render dynamic student weekly/daily table
function renderStudentScheduleTable() {
  const schedule = state.schedules.find(s => s.id === state.currentScheduleId) || state.schedules[0];
  if (!schedule) return;

  // Banner titles
  document.getElementById('active-schedule-title').innerText = schedule.scheduleName;
  document.getElementById('schedule-banner-name').innerText = schedule.scheduleName;
  document.getElementById('schedule-banner-desc').innerText = `نوع: ${schedule.scheduleType} • الفترة: ${schedule.timePeriod}`;
  document.getElementById('schedule-stat-hours').innerText = `${schedule.studyHours || 0} ساعة`;
  document.getElementById('schedule-stat-percent').innerText = `${schedule.completionRate || 0}%`;
  document.getElementById('schedule-notes-text').innerText = schedule.notes || 'تطبيق مدرسي يضمن لك مستقبلاً مشرقاً.';

  // Table header days
  const tableHeaderRow = document.querySelector('#student-section table thead tr');
  // keep first cell
  tableHeaderRow.innerHTML = '<th class="p-4 text-xs font-black text-brand-dark text-right min-w-[120px]">الفترات / الأيام</th>';
  
  schedule.days.forEach(day => {
    const th = document.createElement('th');
    th.className = "p-4 text-xs font-extrabold text-brand-dark bg-[#F1EEFB]";
    th.innerText = day;
    tableHeaderRow.appendChild(th);
  });

  // Table body rows (one row for each period)
  const tbody = document.getElementById('student-grid-body');
  tbody.innerHTML = '';

  schedule.lessons.forEach((lesson, lessonIdx) => {
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 hover:bg-slate-50/30";
    
    // Column 1: period title & time
    const time = schedule.lessonTimes[lessonIdx] || { start: '--:--', end: '--:--' };
    const firstCell = document.createElement('td');
    firstCell.className = "p-3.5 text-right font-bold border-l border-slate-100 bg-slate-50/30 min-w-[120px]";
    firstCell.innerHTML = `
      <span class="block text-brand-dark text-xs">${lesson}</span>
      <span class="block text-[10px] text-slate-400 font-mono mt-0.5">${time.start} - ${time.end}</span>
    `;
    tr.appendChild(firstCell);

    // Columns for each day
    schedule.days.forEach((day, dayIdx) => {
      const td = document.createElement('td');
      td.className = "p-2 border-l border-slate-100 relative";
      
      const cellKey = `${dayIdx}-${lessonIdx}`;
      const cell = schedule.cells[cellKey];

      if (cell && cell.subject) {
        // Build card inside td
        const card = document.createElement('div');
        card.className = "p-2.5 rounded-xl text-center text-xs space-y-1.5 transition-card border cursor-pointer select-none relative";
        
        // Find text color if matches preset colors list
        const colorsList = window.SUBJECT_COLORS || [];
        const colorMatch = colorsList.find(c => c.hexBg === cell.color);
        const textHex = colorMatch ? colorMatch.hexText : '#3E176D';
        
        card.style.backgroundColor = cell.color || '#E9E6FA';
        card.style.borderColor = '#D9D3F0';
        card.style.color = textHex;

        // Topic handling
        const topicText = cell.topic ? `<span class="block text-[10px] text-slate-500 font-medium truncate">${cell.topic}</span>` : '';
        
        // Status Badge
        let badge = '';
        if (cell.status === 'completed') {
          badge = '<span class="inline-block text-[8px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded">✓ مكتمل</span>';
        } else if (cell.status === 'delayed') {
          badge = '<span class="inline-block text-[8px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded">⚠️ متأخر</span>';
        } else {
          badge = `<span class="inline-block text-[8px] opacity-80 font-bold">${cell.type === 'study' ? '✎ دراسة' : cell.type === 'review' ? '✎ مراجعة' : '✎ واجب'}</span>`;
        }

        card.innerHTML = `
          <h5 class="font-extrabold text-xs truncate">${cell.subject}</h5>
          ${topicText}
          <div class="flex items-center justify-center gap-1 mt-1">${badge}</div>
        `;
        
        // Click to open editor modal
        card.onclick = () => openCellEditor(dayIdx, lessonIdx);
        td.appendChild(card);
      } else {
        // Dotted placeholder
        td.innerHTML = `
          <div onclick="openCellEditor(${dayIdx}, ${lessonIdx})" class="border-2 border-dashed border-slate-200 rounded-xl p-3 text-slate-400 hover:border-brand-lavender hover:text-brand text-[10px] font-black cursor-pointer transition-all">
            + فارغ
          </div>
        `;
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// 1.C CELL EDITOR MODAL CONTROLLERS
function openCellEditor(dayIdx, lessonIdx) {
  state.editingCell = { dayIndex: dayIdx, lessonIndex: lessonIdx };
  const schedule = state.schedules.find(s => s.id === state.currentScheduleId) || state.schedules[0];
  const cellKey = `${dayIdx}-${lessonIdx}`;
  const cell = schedule.cells[cellKey] || { subject: '', topic: '', type: 'study', status: 'upcoming', notes: '' };

  document.getElementById('edit-cell-subject').value = cell.subject;
  document.getElementById('edit-cell-topic').value = cell.topic || '';
  document.getElementById('edit-cell-type').value = cell.type || 'study';
  document.getElementById('edit-cell-status').value = cell.status || 'upcoming';
  document.getElementById('edit-cell-notes').value = cell.notes || '';

  document.getElementById('modal-cell-editor').showModal();
}

function closeCellEditorModal() {
  document.getElementById('modal-cell-editor').close();
  state.editingCell = null;
}

function handleSaveCellEdits(e) {
  e.preventDefault();
  if (!state.editingCell) return;

  const { dayIndex, lessonIndex } = state.editingCell;
  const schedule = state.schedules.find(s => s.id === state.currentScheduleId);
  if (!schedule) return;

  const cellKey = `${dayIndex}-${lessonIndex}`;
  const subject = document.getElementById('edit-cell-subject').value.trim();
  const topic = document.getElementById('edit-cell-topic').value.trim();
  const type = document.getElementById('edit-cell-type').value;
  const status = document.getElementById('edit-cell-status').value;
  const notes = document.getElementById('edit-cell-notes').value.trim();

  // Find random bg color based on subject name (consistent hashing)
  let color = '#F3F0FC';
  const subjectsList = window.SUBJECT_COLORS || [];
  const foundColor = subjectsList.find(c => subject.includes(c.hexBg) || subject === c.hexBg);
  if (foundColor) {
    color = foundColor.hexBg;
  } else {
    // Generate simple modulo hash
    const charCodeSum = Array.from(subject).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIdx = charCodeSum % subjectsList.length;
    color = subjectsList[colorIdx] ? subjectsList[colorIdx].hexBg : '#E9E6FA';
  }

  schedule.cells[cellKey] = { subject, topic, type, status, notes, color };

  // Recalculate statistics
  recalculateScheduleStats(schedule);
  window.saveSchedules(state.schedules);
  
  closeCellEditorModal();
  renderStudentScheduleTable();
}

function handleDeleteCell() {
  if (!state.editingCell) return;
  const { dayIndex, lessonIndex } = state.editingCell;
  const schedule = state.schedules.find(s => s.id === state.currentScheduleId);
  if (!schedule) return;

  const cellKey = `${dayIndex}-${lessonIndex}`;
  delete schedule.cells[cellKey];

  recalculateScheduleStats(schedule);
  window.saveSchedules(state.schedules);

  closeCellEditorModal();
  renderStudentScheduleTable();
}

function recalculateScheduleStats(schedule) {
  let completed = 0;
  let total = 0;
  Object.values(schedule.cells).forEach(cell => {
    if (cell.subject) {
      total++;
      if (cell.status === 'completed') completed++;
    }
  });
  schedule.completedCount = completed;
  schedule.completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
}

// 1.D WIZARD MODAL POPULATOR
function openWizardModal() {
  state.wizardStep = 1;
  state.wizardSelectedSubjects = [];
  
  // Set default name
  document.getElementById('wiz-name').value = `جدول تفوق ${state.studentProfile ? state.studentProfile.studentName : 'مخصص'}`;
  
  // Show first pane, hide others
  showWizardPane(1);
  populateWizardSubjects();

  document.getElementById('modal-wizard').showModal();
}

function closeWizardModal() {
  document.getElementById('modal-wizard').close();
}

function showWizardPane(step) {
  document.getElementById('wizard-pane-1').classList.add('hidden');
  document.getElementById('wizard-pane-2').classList.add('hidden');
  document.getElementById('wizard-pane-3').classList.add('hidden');

  document.getElementById(`wizard-pane-${step}`).classList.remove('hidden');

  // Indicators highlighting
  document.getElementById('wiz-step-ind-1').className = step === 1 ? "font-black text-brand" : "";
  document.getElementById('wiz-step-ind-2').className = step === 2 ? "font-black text-brand" : "";
  document.getElementById('wiz-step-ind-3').className = step === 3 ? "font-black text-brand" : "";

  // Buttons toggle
  document.getElementById('btn-wiz-prev').classList.toggle('hidden', step === 1);
  document.getElementById('btn-wiz-next').innerText = step === 3 ? "✓ توليد الجدول المخصص" : "التالي ←";
}

function handleWizardNext() {
  if (state.wizardStep < 3) {
    state.wizardStep++;
    showWizardPane(state.wizardStep);
  } else {
    // Generate!
    generateWizardSchedule();
  }
}

function handleWizardPrev() {
  if (state.wizardStep > 1) {
    state.wizardStep--;
    showWizardPane(state.wizardStep);
  }
}

function populateWizardSubjects() {
  const container = document.getElementById('wizard-subjects-checkboxes');
  container.innerHTML = '';
  
  const grade = state.studentProfile ? state.studentProfile.gradeClass : 'السادس العلمي';
  const subjects = window.SUBJECTS_BY_GRADE[grade] || ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'العربي', 'الإنجليزي'];
  
  subjects.forEach(sub => {
    const div = document.createElement('label');
    div.className = "flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-all font-bold";
    div.innerHTML = `
      <input type="checkbox" checked value="${sub}" onchange="toggleWizardSubject('${sub}', this.checked)" class="rounded text-brand w-4 h-4">
      <span>${sub}</span>
    `;
    container.appendChild(div);
    state.wizardSelectedSubjects.push(sub);
  });
}

function toggleWizardSubject(subject, checked) {
  if (checked) {
    if (!state.wizardSelectedSubjects.includes(subject)) state.wizardSelectedSubjects.push(subject);
  } else {
    state.wizardSelectedSubjects = state.wizardSelectedSubjects.filter(s => s !== subject);
  }
}

function generateWizardSchedule() {
  const name = document.getElementById('wiz-name').value.trim() || 'جدولي الذكي المخصص';
  const type = document.getElementById('wiz-type').value;

  const wake = document.getElementById('wiz-wake').value;
  const sleep = document.getElementById('wiz-sleep').value;
  const lunch = document.getElementById('wiz-lunch').value;
  const dinner = document.getElementById('wiz-dinner').value;
  const count = parseInt(document.getElementById('wiz-lessons-count').value) || 5;
  const duration = parseInt(document.getElementById('wiz-lesson-duration').value) || 45;

  let newSch = null;
  const student = state.studentProfile ? state.studentProfile.studentName : 'بطل العراق';
  const grade = state.studentProfile ? state.studentProfile.gradeClass : 'السادس العلمي';
  const stage = state.studentProfile ? state.studentProfile.stage : 'preparatory';

  if (type === 'weekly') {
    newSch = window.generateWeeklySchedule({
      scheduleName: name,
      startDate: new Date().toISOString().split('T')[0],
      selectedSubjects: state.wizardSelectedSubjects,
      lessonsPerDay: count,
      lessonDuration: duration,
      breakDuration: 15,
      strategy: 'balanced',
      restDays: ['الجمعة']
    }, student, grade, stage);
  } else if (type === 'daily') {
    newSch = window.generateDailySchedule({
      scheduleName: name,
      date: new Date().toISOString().split('T')[0],
      studyPreference: 'both',
      wakeTime: wake,
      lunchTime: lunch,
      dinnerTime: dinner,
      sleepTime: sleep,
      lessonCount: count,
      lessonDuration: duration,
      breakDuration: 15,
      selectedSubjects: state.wizardSelectedSubjects
    }, student, grade, stage);
  } else {
    // revision plan (1 month)
    const end = new Date();
    end.setDate(end.getDate() + 30);
    newSch = window.generateRevisionPlan(
      name, 
      new Date().toISOString().split('T')[0], 
      end.toISOString().split('T')[0], 
      state.wizardSelectedSubjects, 
      count, 
      duration, 
      'خطة مراجعة بكالوريا مخصصة', 
      student, 
      grade, 
      stage
    );
  }

  if (newSch) {
    state.schedules.push(newSch);
    state.currentScheduleId = newSch.id;
    window.saveSchedules(state.schedules);
    window.saveActiveScheduleId(newSch.id);

    closeWizardModal();
    renderStudentSchedulesList();
    renderStudentScheduleTable();
    alert('🎉 تم توليد وحفظ جدولك الدراسي التفاعلي بنجاح!');
  }
}

// 1.E CURRICULUM TRACKER MODULE
function renderCurriculumTracker() {
  const container = document.getElementById('curriculum-tree-container');
  container.innerHTML = '';

  const tree = window.getCurriculumTree();
  
  tree.forEach(subjectNode => {
    // Only display subjects that belong to their current grade
    if (state.studentProfile && !subjectNode.name.includes(state.studentProfile.gradeClass)) {
      return;
    }

    const subCard = document.createElement('div');
    subCard.className = "p-4 border border-[#E9E6FA] rounded-2xl bg-[#FCFAFF] space-y-3";
    
    subCard.innerHTML = `
      <h4 class="font-extrabold text-brand-dark text-sm flex items-center gap-2">
        <span>📚 ${subjectNode.name}</span>
      </h4>
      <div class="space-y-2.5 pl-3 border-r border-[#E9E6FA] pr-3">
        <!-- Chapters list populates here -->
      </div>
    `;

    const chaptersContainer = subCard.querySelector('div');
    
    subjectNode.children.forEach(chapterNode => {
      const chapDiv = document.createElement('div');
      chapDiv.className = "space-y-1.5";
      chapDiv.innerHTML = `
        <h5 class="font-bold text-slate-700 text-xs flex items-center gap-1">
          <span>📖 ${chapterNode.name}</span>
        </h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4 pt-1">
          <!-- Lessons populates here -->
        </div>
      `;

      const lessonsContainer = chapDiv.querySelector('div');

      chapterNode.children.forEach(lessonNode => {
        const isChecked = state.curriculumChecked[lessonNode.id] === true;
        const lesLabel = document.createElement('label');
        lesLabel.className = `flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border select-none transition-all font-bold ${
          isChecked 
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
        }`;
        
        lesLabel.innerHTML = `
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleCurriculumLesson('${lessonNode.id}', this.checked)" class="rounded text-emerald-600 w-4 h-4">
          <span class="truncate">${lessonNode.name}</span>
        `;
        lessonsContainer.appendChild(lesLabel);
      });

      chaptersContainer.appendChild(chapDiv);
    });

    container.appendChild(subCard);
  });

  if (container.children.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 font-bold">لا يوجد منهج دراسي معرف حالياً للصف المختار: ${state.studentProfile ? state.studentProfile.gradeClass : 'غير محدد'}.</div>`;
  }
}

function toggleCurriculumLesson(id, checked) {
  state.curriculumChecked[id] = checked;
  localStorage.setItem('madrasati_curriculum_checked_v2', JSON.stringify(state.curriculumChecked));
  renderCurriculumTracker();
}

// 1.F PRINT CURRENT TABLE
function printActiveSchedule() {
  window.print();
}

// =========================================================
// 1.G STUDENT AI ASSISTANT MODULE (OFFLINE / GEMINI ACTIVE)
// =========================================================

// Context gatherer for AI
function getRoleAndContext() {
  const role = state.userRole; // 'student' | 'teacher' | 'exam_organizer'
  let activeRole = 'طالب';
  let activeModule = 'تنظيم الدراسة';
  let currentPage = 'الرئيسية';

  if (role === 'student') {
    activeRole = 'طالب';
    if (state.activeStudentTab === 'schedule') {
      activeModule = 'تنظيم الدراسة';
      currentPage = 'جدول الدراسة';
    } else if (state.activeStudentTab === 'curriculum') {
      activeModule = 'شجرة المنهج الوزاري';
      currentPage = 'منهج الصف';
    } else if (state.activeStudentTab === 'assistant') {
      activeModule = 'المراجعات';
      currentPage = 'المساعد الذكي';
    }
  } else if (role === 'teacher') {
    if (state.teacherRole === 'principal') {
      activeRole = 'مدير';
      activeModule = 'جدول المدرسة';
      currentPage = 'لوحة إدارة الكادر والجدول';
    } else if (state.teacherRole === 'assistant') {
      activeRole = 'معاون';
      activeModule = 'جدول المدرسة';
      currentPage = 'لوحة إدارة الكادر والجدول';
    } else {
      activeRole = 'مدرس';
      activeModule = 'جدول المدرس';
      currentPage = 'لوحة إدارة الكادر والجدول';
    }
  } else if (role === 'exam_organizer') {
    if (state.teacherRole === 'assistant') {
      activeRole = 'معاون';
    } else {
      activeRole = 'مدير';
    }
    activeModule = 'القاعات الامتحانية';
    currentPage = `الخطوة ${state.activeExamStep || 1}`;
  }

  // Get other local context data
  const profile = state.studentProfile || {};
  const currentSchedule = state.schedules ? state.schedules.find(s => s.id === state.currentScheduleId) : null;
  const activeSchedMeta = currentSchedule ? {
    scheduleName: currentSchedule.scheduleName || '',
    completionRate: currentSchedule.completionRate || 0,
    studyHours: currentSchedule.studyHours || 0,
    cellsCount: currentSchedule.cells ? Object.keys(currentSchedule.cells).length : 0,
  } : {};

  const teacherLessons = state.teacherLessons || [];
  const examSession = state.examSession || {};
  const examStudentsCount = state.examStudents ? state.examStudents.length : 0;
  const examHallsCount = state.examHalls ? state.examHalls.length : 0;
  const examProctorsCount = state.examProctors ? state.examProctors.length : 0;

  return {
    activeRole,
    activeModule,
    currentPage,
    studentContext: {
      studentName: profile.studentName || '',
      gradeClass: profile.gradeClass || '',
      stage: profile.stage || '',
    },
    currentSchedule: activeSchedMeta,
    teacherLessonsCount: teacherLessons.length,
    examContext: {
      examTitle: examSession.examTitle || '',
      schoolName: examSession.schoolName || '',
      subject: examSession.subject || '',
      gradeClass: examSession.gradeClass || '',
      studentsCount: examStudentsCount,
      hallsCount: examHallsCount,
      proctorsCount: examProctorsCount,
    }
  };
}

async function callGeminiAssistant(message, history, context) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context })
    });
    if (!response.ok) {
      throw new Error('Server returned status ' + response.status);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Gemini API call failed, falling back to offline planner:", error);
    return null;
  }
}

function getLocalPlannerResponse(message, context) {
  const totalStudents = state.examStudents ? state.examStudents.length : 0;
  let totalUsableSeats = 0;
  if (state.examHalls) {
    state.examHalls.forEach(hall => {
      const usableCount = hall.seats ? hall.seats.filter(s => s.status !== 'corridor' && s.status !== 'damaged' && s.status !== 'spacing').length : 0;
      totalUsableSeats += usableCount * (hall.studentsPerSeat || 1);
    });
  }

  const cleaned = message.toLowerCase().trim();
  let replyText = '';
  let actions = [];
  let requiresConfirmation = false;
  let detectedIntent = 'general_query';
  let detectedRole = 'student';
  let detectedModule = 'study_schedule';

  if (context.activeRole === 'طالب') {
    detectedRole = 'student';
    detectedModule = 'study_schedule';
    if (cleaned.includes('study_now') || cleaned.includes('ماذا يجب أن أدرس')) {
      detectedIntent = 'recommend_study';
      replyText = getStudyNowRecommendationText();
    } else if (cleaned.includes('analyze_schedule') || cleaned.includes('تحليل')) {
      detectedIntent = 'analyze_schedule';
      replyText = getScheduleAnalysisText();
    } else if (cleaned.includes('start_emergency') || cleaned.includes('طوارئ')) {
      detectedIntent = 'start_emergency';
      replyText = `🚨 **تم تفعيل محاكي خطة الطوارئ للامتحانات بنجاح!**
سأقوم بمساعدتك لحساب الساعات المتبقية وتوليد جدول حقيقي يتفادى التراكم في مادة معينة.
اضغط على المادة التي ترغب في إنقاذها للبدء بالخطوات التفاعلية:`;
      actions = [
        { label: '🧪 الكيمياء', value: 'START_EM_CHEM' },
        { label: '⚡ الفيزياء', value: 'START_EM_PHYS' },
        { label: '📐 الرياضيات', value: 'START_EM_MATH' },
        { label: '📝 اللغة العربية', value: 'START_EM_ARABIC' }
      ];
    } else if (cleaned.includes('baccalaureate_tips') || cleaned.includes('school_tips') || cleaned.includes('نصائح')) {
      detectedIntent = 'baccalaureate_tips';
      const gradeName = state.studentProfile ? state.studentProfile.gradeClass : '';
      const gradeObj = window.IRAQI_GRADES.find(g => g.gradeName === gradeName);
      const hasMinisterial = gradeObj ? gradeObj.supportsMinisterialPlans : true;

      if (hasMinisterial) {
        replyText = `💡 **إرشادات وتوصيات ذهبية لطلبة الصفوف المنتهية والمراجعة الوزارية في العراق:**
١. **الدراسة من الوزاريات:** الأفكار تتكرر بنسبة كبيرة من الامتحانات والأسئلة الوزارية السابقة بانتظام.
٢. **أوقات المذاكرة الذهبية:** الذاكرة تكون في أعلى مستوياتها نشاطاً في الصباح الباكر وعقب الفجر. تجنب السهر تماماً.
٣. **تقنية البومودورو:** ادرس لمدة ٤٥ دقيقة تليها ١٠-١٥ دقيقة راحة لاستعادة طاقتك وتركيزك الذهني.
٤. **مخطط خطة الطوارئ:** إذا واجهت تراكماً بالدروس، اطلب فوراً تفعيل "خطة الطوارئ" لتوزيع الفصول المتبقية بنجاح وتوازن.`;
      } else {
        replyText = `💡 **إرشادات وتوصيات ذهبية للتفوق الدراسي المتميز والامتحانات المدرسية:**
١. **فهم الأساسيات والمذاكرة أولاً بأول:** المذاكرة بانتظام تحميك تماماً من تراكم المواد في نهاية الفصل الدراسي.
٢. **المراجعة الدورية للملخصات:** مراجعة العناوين وحل التمارين نهاية كل فصل تضمن ثبات الفهم المتميز في ذاكرتك.
٣. **أوقات المذاكرة الذهبية:** تجنب الدراسة أثناء الإرهاق. المذاكرة في الصباح الباكر أو بعد راحة كافية هي الأفضل على الإطلاق.
٤. **تنظيم الحصص المدرسية:** التزم بجدولك اليومي المحسوب ونوّع في أنماط المذاكرة (دراسة، مراجعة، حل تمارين).`;
      }
    } else {
      replyText = `فهمت استفسارك يا بطل! بصفتي المساعد الذكي المخصص لصف **${context.studentContext.gradeClass || 'السادس العلمي'}**، لقد قمت بتحليل دراستك وجدولك الحالي.
بإمكاني تقديم إرشادات مخصصة للمذاكرة، أو توليد خطة طوارئ إنقاذية فورية، أو اقتراح أوقات المراجعة المضمونة بالوزاري.`;
      actions = [
        { label: '🔍 ماذا يجب أن أدرس الآن؟', value: 'study_now' },
        { label: '📊 مراجعة وتحليل جدولي', value: 'analyze_schedule' },
        { label: '🚨 محاكاة خطة الطوارئ', value: 'start_emergency' }
      ];
    }
  } else if (context.activeRole === 'مدرس' || context.activeRole === 'معاون' || context.activeRole === 'مدير') {
    if (context.activeRole === 'مدير') {
      detectedRole = 'director';
    } else if (context.activeRole === 'معاون') {
      detectedRole = 'assistant';
    } else {
      detectedRole = 'teacher';
    }
    
    if (context.activeModule === 'القاعات الامتحانية') {
      detectedModule = 'exam_halls';
      if (cleaned.includes('check_capacity') || cleaned.includes('سعة') || cleaned.includes('كفاية')) {
        detectedIntent = 'check_capacity';
        replyText = `📊 **تقرير تحليل السعة الاستيعابية المتكاملة:**
• عدد الطلاب المسجلين بالخطوة الثانية: **${totalStudents}** طالباً وطالبة.
• سعة المقاعد الصالحة الفعالة المتاحة بالقاعات: **${totalUsableSeats}** مقعد جلوس.
• **الكفاية الكلية:** ${totalUsableSeats >= totalStudents ? '🟢 كافية وممتازة بالكامل للتوزيع الفردي.' : '🔴 غير كافية! يتطلب تفعيل التوزيع الثنائي أو تقليل تباعد المقاعد الشاغرة.'}`;
      } else if (cleaned.includes('optimize_spacing') || cleaned.includes('تباعد') || cleaned.includes('مسافة')) {
        detectedIntent = 'optimize_spacing';
        replyText = `📐 **تحليل شروط التباعد والجلوس الوزارية:**
أوصيك باستخدام خيار **"تباعد مقعد واحد"** إذا كانت سعتك الكلية تسمح بترك خانة فارغة. هذا يمنع الغش والتواصل بنسبة تصل لـ 95٪.
في حال وجود فائض، شغل المقاعد بالكامل وركز على توزيع المراقبين المسجلين بالخطوة السادسة بالتساوي.`;
      } else if (cleaned.includes('check_clashes') || cleaned.includes('أخطاء') || cleaned.includes('تكرار')) {
        detectedIntent = 'check_clashes';
        const list = state.teacherLessons || [];
        const clashes = [];
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            if (a.day === b.day && a.periodIndex === b.periodIndex) {
              if (a.teacher === b.teacher) clashes.push(`المدرس (${a.teacher}) لديه حصتين بنفس الوقت.`);
              if (a.room === b.room && a.room !== 'القاعة الكبرى') clashes.push(`القاعة (${a.room}) محجوزة لحصتين معاً.`);
              if (a.gradeClass === b.gradeClass && a.division === b.division) clashes.push(`الصف (${a.gradeClass} شعبة ${a.division}) لديه حصتان بنفس الوقت.`);
            }
          }
        }
        replyText = `⚠️ **تقرير مراجعة البيانات التلقائي (أوفلاين):**
• تداخلات الحصص المكتشفة: ${clashes.length > 0 ? `العثور على ${clashes.length} تداخل في جدول المدرسين` : 'لا توجد تداخلات حالية ✓'}
• أرقام امتحانية مفقودة: ${state.examStudents ? state.examStudents.filter(s=>!s.rollNumber).length : 0} طلاب.`;
      } else {
        replyText = `أهلاً بك حضرة **${context.activeRole === 'مدير' ? 'المدير' : context.activeRole === 'معاون' ? 'المعاون' : 'الأستاذ'}**. بصفتي مساعد تنظيم الامتحانات للقاعات:
لقد قمت بفحص المدخلات الحالية لجلستك الامتحانية. هناك **${totalStudents}** طالباً مسجلاً، موزعين على **${state.examHalls ? state.examHalls.length : 0}** قاعة امتحانية.
بإمكاني مساعدتك في مراجعة كفاية السعة الاستيعابية، ضبط المسافات الآمنة بين الطلبة، أو تنظيم قطاعات الجلوس والمراقبين لحظر تداخل المجموعات.`;
        actions = [
          { label: '📊 تحليل ومقارنة سعة القاعات', value: 'check_capacity' },
          { label: '📐 مراجعة خيارات تباعد المقاعد', value: 'optimize_spacing' },
          { label: '⚠️ الكشف عن تضارب وأخطاء الأرقام', value: 'check_clashes' }
        ];
      }
    } else {
      detectedModule = context.activeRole === 'مدرس' ? 'teacher_schedule' : 'school_schedule';
      if (cleaned.includes('overlap') || cleaned.includes('تضارب') || cleaned.includes('تعارض') || cleaned.includes('check_clashes')) {
        detectedIntent = 'check_clashes';
        const list = state.teacherLessons || [];
        const clashes = [];
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            if (a.day === b.day && a.periodIndex === b.periodIndex) {
              if (a.teacher === b.teacher) clashes.push(`المدرس **(${a.teacher})** لديه حصتان في نفس الوقت (حصة ${a.periodIndex+1}، يوم ${a.day}).`);
              if (a.room === b.room && a.room !== 'القاعة الكبرى') clashes.push(`القاعة **(${a.room})** محجوزة لحصتين معاً بنفس الوقت.`);
              if (a.gradeClass === b.gradeClass && a.division === b.division) clashes.push(`الصف **(${a.gradeClass} - شعبة ${a.division})** لديه حصتان دراسيتان معاً بنفس التوقيت.`);
            }
          }
        }
        replyText = `🔍 **فحص تضارب الحصص والجدول المدرسي:**
${clashes.length > 0 
  ? `تم العثور على **${clashes.length}** تداخل في جدول الحصص الحالي:\n${clashes.map(c => `• ${c}`).join('\n')}` 
  : 'تهانينا! لم يتم الكشف عن أي تضارب في الزمن أو القاعات أو تعارض للمدرسين ✓.'}`;
      } else {
        replyText = `أهلاً بك أستاذنا القدير في لوحة إدارة الكادر الحصصي. بصفتي مساعدك الخاص، لقد قمت بمراجعة جدول المدرسين الحالي المكون من **${state.teacherLessons ? state.teacherLessons.length : 0}** حصة موزعة.
بإمكانك طلب مراجعة تضارب الحصص والزمن، أو اقتراح مدرسين بدلاء للحصص الشاغرة بذكاء لتأمين سير التدريس بسلاسة كاملة.`;
        actions = [
          { label: '⚠️ فحص وتدقيق تضارب الحصص', value: 'check_clashes' }
        ];
      }
    }
  }

  return {
    detectedRole,
    detectedModule,
    detectedIntent,
    extractedFacts: { totalStudents, totalUsableSeats },
    missingRequiredFields: [],
    safeArabicReply: replyText,
    suggestedActions: actions,
    requiresConfirmation,
    confidenceLevel: 'high'
  };
}

async function processAIChatMessage(userText, isExamAdvisor) {
  // 1. Prepare history
  const history = (isExamAdvisor ? state.examChatHistory : state.studentChatHistory)
    .slice(-10)
    .map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

  // 2. Prepare context
  const context = getRoleAndContext();

  // 3. Render a typing indicator or loading state
  const typingId = `typing-${Date.now()}`;
  const typingMsg = {
    id: typingId,
    sender: 'assistant',
    text: 'جاري التفكير وتحليل البيانات الحالية من قبل المساعد الدراسي والامتحاني المخصص... 🧠'
  };

  if (isExamAdvisor) {
    state.examChatHistory.push(typingMsg);
    renderExamAdvisorChat();
  } else {
    state.studentChatHistory.push(typingMsg);
    populateStudentChatBubbles();
  }

  // 4. Call server-side API
  const apiResponse = await callGeminiAssistant(userText, history, context);

  // Remove typing message
  if (isExamAdvisor) {
    state.examChatHistory = state.examChatHistory.filter(m => m.id !== typingId);
  } else {
    state.studentChatHistory = state.studentChatHistory.filter(m => m.id !== typingId);
  }

  // 5. Use offline local planner as fallback
  let parsedResponse = apiResponse;
  let source = 'online';

  if (!parsedResponse) {
    parsedResponse = getLocalPlannerResponse(userText, context);
    source = 'offline';
  }

  // 6. Push the reply to appropriate history
  const options = [];
  if (parsedResponse.suggestedActions) {
    parsedResponse.suggestedActions.forEach(act => {
      options.push({ label: act.label, value: act.value });
    });
  }

  // Check confirmation rules
  if (parsedResponse.requiresConfirmation) {
    options.push({ label: '✅ تأكيد التنفيذ', value: 'CONFIRM_CHANGES' });
    options.push({ label: '✏️ تعديل الاقتراح', value: 'MODIFY_SUGGESTION' });
    options.push({ label: '❌ إلغاء المعاملة', value: 'CANCEL_CHANGES' });
  }

  const replyMsg = {
    id: `rep-${Date.now()}`,
    sender: 'assistant',
    text: parsedResponse.safeArabicReply,
    timestamp: getFormattedTime(),
    options: options.length > 0 ? options : undefined,
    metadata: {
      detectedRole: parsedResponse.detectedRole,
      detectedModule: parsedResponse.detectedModule,
      confidenceLevel: parsedResponse.confidenceLevel,
      source: source
    }
  };

  if (isExamAdvisor) {
    state.examChatHistory.push(replyMsg);
    renderExamAdvisorChat();
  } else {
    state.studentChatHistory.push(replyMsg);
    populateStudentChatBubbles();
  }
}

function resetStudentChat() {
  const name = state.studentProfile ? state.studentProfile.studentName : 'يا بطل';
  const txt = `أهلاً بك ${name} في **المستشار الدراسي الذكي للبكالوريا** 🌟!
أنا مستشارك المحلي ومرافقك لتخفيف الضغط وحل الأسئلة وإعداد خطط المذاكرة مسبقاً بنجاح كامل دون الحاجة للاتصال بالإنترنت.

بصفتي مستشارك، كيف يمكنني مساعدتك اليوم؟ انقر على أحد الخيارات السريعة أدناه أو اكتب سؤالك:`;

  state.studentChatHistory = [{
    id: 'welcome',
    sender: 'assistant',
    text: txt,
    timestamp: getFormattedTime(),
    options: [
      { label: '🔍 ماذا يجب أن أدرس الآن؟', value: 'study_now' },
      { label: '📊 تحليل ومراجعة جدولي النشط', value: 'analyze_schedule' },
      { label: '🚨 بدء محاكاة خطة طوارئ الامتحان', value: 'start_emergency' },
      { label: '💡 نصائح للتفوق في البكالوريا وزاريات', value: 'baccalaureate_tips' }
    ]
  }];
}

function renderStudentChat() {
  const container = document.getElementById('assistant-chat-container');
  container.innerHTML = '';

  // Render the core chat shell
  const shell = document.createElement('div');
  shell.className = "flex flex-col bg-white border border-[#D9D3F0] rounded-3xl overflow-hidden h-[540px] relative text-xs";
  
  shell.innerHTML = `
    <!-- Top banner -->
    <div class="bg-gradient-to-r from-brand-dark to-brand-lavender p-4 text-white flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <div>
          <h4 class="font-black">مستشارك الدراسي الذكي</h4>
          <p class="text-[9px] text-purple-200">النمط الذكي الموحد 🛡️ • مجاني للطلاب العراقيين</p>
        </div>
      </div>
    </div>
    
    <!-- Scroller -->
    <div id="student-chat-scroller" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
      <!-- Messages populate here -->
    </div>
    
    <!-- Input Form -->
    <form id="student-chat-form-el" onsubmit="handleSendStudentChatMessage(event)" class="bg-white p-3 border-t border-[#D9D3F0] flex items-center gap-2">
      <input type="text" id="student-chat-text-input" placeholder="اكتب سؤالك أو استفسارك هنا..." class="flex-1 px-3 py-2 border border-[#D9D3F0] rounded-xl outline-none text-xs">
      <button type="submit" class="p-2.5 bg-brand text-white rounded-xl shadow cursor-pointer font-black hover:bg-brand-dark transition-all">←</button>
    </form>
  `;

  container.appendChild(shell);
  populateStudentChatBubbles();
}

function populateStudentChatBubbles() {
  const scroller = document.getElementById('student-chat-scroller');
  if (!scroller) return;
  scroller.innerHTML = '';

  state.studentChatHistory.forEach(msg => {
    const isAssistant = msg.sender === 'assistant';
    const div = document.createElement('div');
    div.className = `flex flex-col space-y-1.5 max-w-[85%] ${isAssistant ? 'self-start mr-0 ml-auto' : 'self-end mr-auto ml-0'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `p-3.5 rounded-2xl leading-relaxed ${
      isAssistant 
        ? 'bg-white text-slate-800 border border-[#D9D3F0] rounded-tr-none' 
        : 'bg-brand text-white rounded-tl-none font-bold'
    }`;
    bubble.innerHTML = `<div class="whitespace-pre-line">${msg.text}</div>`;

    div.appendChild(bubble);

    // Metadata badges for Assistant responses
    if (isAssistant && msg.metadata) {
      const metaDiv = document.createElement('div');
      metaDiv.className = "mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[9px] text-slate-500 font-bold";
      
      const roleMap = { student: 'طالب', teacher: 'مدرس', assistant: 'معاون', director: 'مدير' };
      const moduleMap = {
        study_schedule: 'تنظيم الدراسة',
        school_schedule: 'جدول المدرسة',
        teacher_schedule: 'جدول المدرس',
        exam_halls: 'القاعات الامتحانية',
        curriculum_tree: 'شجرة المنهج الوزاري',
        exams: 'الامتحانات',
        staff: 'الكادر الدراسي',
        reviews: 'المراجعات',
        printing_export: 'الطباعة والتصدير'
      };
      const confidenceMap = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };

      const r = roleMap[msg.metadata.detectedRole] || msg.metadata.detectedRole || 'طالب';
      const m = moduleMap[msg.metadata.detectedModule] || msg.metadata.detectedModule || 'المراجعات';
      const c = confidenceMap[msg.metadata.confidenceLevel] || msg.metadata.confidenceLevel || 'عالية';
      const sourceStr = msg.metadata.source === 'online' ? '⚡ متصل' : '🛡️ محلي';

      metaDiv.innerHTML = `
        <span class="bg-slate-100 px-2 py-0.5 rounded">👤 الدور: ${r}</span>
        <span class="bg-slate-100 px-2 py-0.5 rounded">📂 القسم: ${m}</span>
        <span class="bg-slate-100 px-2 py-0.5 rounded">🎯 الدقة: ${c}</span>
        <span class="bg-slate-100 px-2 py-0.5 rounded">${sourceStr}</span>
      `;
      bubble.appendChild(metaDiv);
    }

    // Options buttons if available
    if (msg.options && msg.options.length > 0) {
      const optDiv = document.createElement('div');
      optDiv.className = "flex flex-wrap gap-1.5 pt-1.5";
      msg.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "px-3 py-1.5 bg-[#E9E6FA] hover:bg-[#D9D3F0] text-[#3E176D] rounded-xl font-bold cursor-pointer transition-all border border-[#D9D3F0]/50 text-[10px]";
        btn.innerText = opt.label;
        btn.onclick = () => triggerStudentAdvisorOption(opt.value, opt.label);
        optDiv.appendChild(btn);
      });
      div.appendChild(optDiv);
    }

    scroller.appendChild(div);
  });

  // Scroll bottom
  setTimeout(() => {
    scroller.scrollTop = scroller.scrollHeight;
  }, 50);
}

function handleSendStudentChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('student-chat-text-input');
  const text = input.value.trim();
  if (!text) return;

  state.studentChatHistory.push({
    id: `u-${Date.now()}`,
    sender: 'user',
    text,
    timestamp: getFormattedTime()
  });
  input.value = '';
  populateStudentChatBubbles();

  setTimeout(() => {
    simulateStudentAdvisorReply(text);
  }, 600);
}

function triggerStudentAdvisorOption(value, label) {
  state.studentChatHistory.push({
    id: `u-opt-${Date.now()}`,
    sender: 'user',
    text: label,
    timestamp: getFormattedTime()
  });
  populateStudentChatBubbles();

  if (state.emergencyPlanStep > 0) {
    if (value === 'CONFIRM_PLAN_WIZ') {
      // Commit emergency plan
      const end = new Date();
      end.setDate(end.getDate() + state.emergencyPlanData.remainingDays);
      const endStr = end.toISOString().split('T')[0];

      const generated = window.generateRevisionPlan(
        `خطة إنقاذ طارئة - مادة ${state.emergencyPlanData.subject}`,
        new Date().toISOString().split('T')[0],
        endStr,
        [state.emergencyPlanData.subject],
        state.emergencyPlanData.studyHours > 8 ? 5 : 4,
        50,
        'خطة طوارئ معتمدة بالوزاري',
        state.studentProfile ? state.studentProfile.studentName : 'أحمد علي',
        state.studentProfile ? state.studentProfile.gradeClass : 'السادس العلمي',
        state.studentProfile ? state.studentProfile.stage : 'preparatory'
      );

      state.schedules.push(generated);
      state.currentScheduleId = generated.id;
      window.saveSchedules(state.schedules);
      window.saveActiveScheduleId(generated.id);

      state.emergencyPlanStep = 0;

      state.studentChatHistory.push({
        id: `confirm-reply`,
        sender: 'assistant',
        text: `🎉 **ألف مبروك!** تم تثبيت وتفعيل **"${generated.scheduleName}"** كجدولك النشط المعتمد الآن بنجاح!
بإمكانك الرجوع إلى **الجدول الدراسي التفاعلي** للبدء بتتبع الدروس وإكمالها بلمسة واحدة لضمان التفوق بالبكالوريا بإذن الله 🩺📐.`,
        timestamp: getFormattedTime()
      });
      populateStudentChatBubbles();
      renderStudentSchedulesList();
      renderStudentScheduleTable();
    } else if (value === 'CANCEL_PLAN_WIZ') {
      state.emergencyPlanStep = 0;
      state.studentChatHistory.push({
        id: `cancel-reply`,
        sender: 'assistant',
        text: `تم إلغاء خطة الطوارئ بنجاح. كيف يمكنني مساعدتك مجدداً اليوم؟`,
        timestamp: getFormattedTime(),
        options: [
          { label: '📊 تحليل ومراجعة جدولي', value: 'analyze_schedule' },
          { label: '🔍 ماذا يجب أن أدرس الآن؟', value: 'study_now' }
        ]
      });
      populateStudentChatBubbles();
    } else {
      handleEmergencyWizardStep(value, label);
    }
  } else {
    if (value === 'CONFIRM_CHANGES') {
      state.studentChatHistory.push({
        id: `confirm-rep-${Date.now()}`,
        sender: 'assistant',
        text: `✅ **تم تأكيد وتنفيذ التغييرات المقترحة بنجاح!** تم تطبيق التعديل على الجدول الدراسي النشط.`,
        timestamp: getFormattedTime()
      });
      populateStudentChatBubbles();
    } else if (value === 'CANCEL_CHANGES') {
      state.studentChatHistory.push({
        id: `cancel-rep-${Date.now()}`,
        sender: 'assistant',
        text: `تم إلغاء المقترح وتجاهل التغييرات بنجاح.`,
        timestamp: getFormattedTime()
      });
      populateStudentChatBubbles();
    } else if (value === 'MODIFY_SUGGESTION') {
      state.studentChatHistory.push({
        id: `modify-rep-${Date.now()}`,
        sender: 'assistant',
        text: `يرجى كتابة تفاصيل التعديل المطلوب وسأقوم بمواءمة جدولك فوراً.`,
        timestamp: getFormattedTime()
      });
      populateStudentChatBubbles();
    } else if (value.startsWith('START_EM_')) {
      const subMap = {
        'START_EM_CHEM': 'الكيمياء',
        'START_EM_PHYS': 'الفيزياء',
        'START_EM_MATH': 'الرياضيات',
        'START_EM_ARABIC': 'اللغة العربية'
      };
      const subject = subMap[value];
      state.emergencyPlanStep = 1;
      state.emergencyPlanData = {
        studentName: state.studentProfile ? state.studentProfile.studentName : 'أحمد علي',
        subject: subject,
        remainingDays: 5,
        studyHours: 8,
        readinessRating: 'متوسط'
      };
      handleEmergencyWizardStep(subject, label);
    } else {
      setTimeout(() => {
        simulateStudentAdvisorReply(value);
      }, 600);
    }
  }
}

function simulateStudentAdvisorReply(userText) {
  if (userText === 'start_emergency' || userText === 'طوارئ') {
    startEmergencyPlanStepFlow();
    return;
  }
  processAIChatMessage(userText, false);
}



function getStudyNowRecommendationText() {
  const schedule = state.schedules.find(s => s.id === state.currentScheduleId);
  if (!schedule) return 'لم تعثر على جدول دراسي نشط لتحديد المادة الدراسية المقررة حالياً.';
  
  const todayNum = new Date().getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const jsToIraqi = { 5: 'الجمعة', 6: 'السبت', 0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس' };
  const iraqiDay = jsToIraqi[todayNum];
  const dayIdx = schedule.days.indexOf(iraqiDay);

  if (dayIdx === -1) {
    return `اليوم هو **${iraqiDay}**، وبناءً على جدولك المكتمل، هذا اليوم مخصص كـ **يوم استراحة مدرسي**. خذ نفساً عميقاً وجدد نشاطك!`;
  }

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  let periodIdx = -1;
  schedule.lessonTimes.forEach((time, idx) => {
    const [sh, sm] = time.start.split(':').map(Number);
    const [eh, em] = time.end.split(':').map(Number);
    if (currentMins >= sh * 60 + sm && currentMins <= eh * 60 + em) {
      periodIdx = idx;
    }
  });

  if (periodIdx !== -1) {
    const cellKey = `${dayIdx}-${periodIdx}`;
    const cell = schedule.cells[cellKey];
    if (cell && cell.subject) {
      return `⏰ **أنت الآن في وقت "${schedule.lessons[periodIdx]}" (${schedule.lessonTimes[periodIdx].start} - ${schedule.lessonTimes[periodIdx].end})**:
يتوجب عليك حالياً مذاكرة مادة: **${cell.subject}**
الهدف الدراسي المحدد: *${cell.topic || 'مراجعة وتلخيص الفصل الباب'}*
💡 *إرشاد تطبيق مدرسي:* ضع هاتفك جانباً، وابدأ الآن بتركيز تام للتفوق!`;
    }
  }

  return `لقد انتهت جميع الدروس المقررة لهذا اليوم في جدولك النشط! معدل إنجاز جدولك اليوم هو **${schedule.completionRate || 0}%**. عمل رائع جداً، ننصحك بالنوم مبكراً.`;
}

function getScheduleAnalysisText() {
  const schedule = state.schedules.find(s => s.id === state.currentScheduleId);
  if (!schedule) return 'لم يتم تفعيل أي جدول دراسي نشط لتحليله حالياً.';

  const cellsList = Object.values(schedule.cells);
  const studyLessons = cellsList.filter(c => c.subject && c.type !== 'rest');
  const delayedLessons = cellsList.filter(c => c.status === 'delayed');
  
  let analysis = `📊 **تقرير تشخيص جدولي الذكي المكتمل ("${schedule.scheduleName}")**:
• **عدد مواد المذاكرة النشطة بالجدول:** ${studyLessons.length} دروس دراسية.
• **معدل الإنجاز العام لجدولك:** ${schedule.completionRate || 0}% 📈.
• **ساعات المذاكرة الكلية المقدرة:** ${schedule.studyHours || 0} ساعة.

🔍 **التوصيات لتطبيق مدرسي:**\n`;

  if (schedule.completionRate < 35) {
    analysis += `⚠️ *تنبيه:* معدل إنجازك منخفض حالياً (${schedule.completionRate}%). واجه التحديات، وسجل الدروس كمكتملة بانتظام.\n`;
  } else {
    analysis += `✨ *إشادة:* وتيرة تقدمك رائعة ومثيرة للاهتمام، استمر على هذا المنوال للتفوق بالوزاري!\n`;
  }

  if (delayedLessons.length > 0) {
    analysis += `⚠️ *تنبيه:* لديك (${delayedLessons.length}) دروس مسجلة كـ "متأخرة". ننصحك بضغط هذه الدروس وجدولتها مجدداً لتفادي التراكم.\n`;
  }

  analysis += `\n*تطبيق مدرسي يضمن لك مستقبلاً دراسياً مشرقاً ومنظماً بالكامل.*`;
  return analysis;
}

// 🚨 Step-by-step Emergency Plan Simulator
function startEmergencyPlanStepFlow() {
  state.emergencyPlanStep = 1;
  state.emergencyPlanData = {
    studentName: state.studentProfile ? state.studentProfile.studentName : 'أحمد علي',
    subject: '',
    remainingDays: 5,
    studyHours: 8,
    readinessRating: 'متوسط'
  };

  const text = `🚨 **مرحباً بك في محاكي ومخطط خطة الطوارئ للامتحانات!**
سأطرح عليك أسئلة سريعة لمساعدتنا على حساب الساعات وتوليد جدول زمني حقيقي ينقذ الموقف.

**السؤال الأول:** ما هي المادة الدراسية المتراكمة والحرجة التي ترغب في إنقاذها فوراً؟`;

  state.studentChatHistory.push({
    id: `em-st-1`,
    sender: 'assistant',
    text,
    options: [
      { label: '🧪 الكيمياء', value: 'الكيمياء' },
      { label: '⚡ الفيزياء', value: 'الفيزياء' },
      { label: '📐 الرياضيات', value: 'الرياضيات' },
      { label: '📝 اللغة العربية', value: 'اللغة العربية' }
    ],
    timestamp: getFormattedTime()
  });
  populateStudentChatBubbles();
}

function handleEmergencyWizardStep(val, label) {
  state.emergencyPlanStep++;
  const step = state.emergencyPlanStep;

  let nextText = '';
  let options = undefined;

  if (step === 2) {
    state.emergencyPlanData.subject = val;
    nextText = `⏱️ اختيار موفق، سنركز جهودنا على إنقاذ مادة **${val}**.

**السؤال الثاني:** كم يوماً متبقي على موعد امتحان هذه المادة؟`;
    options = [
      { label: '٣ أيام', value: '3' },
      { label: '٥ أيام', value: '5' },
      { label: '٧ أيام', value: '7' },
      { label: '١٠ أيام', value: '10' }
    ];
  } else if (step === 3) {
    state.emergencyPlanData.remainingDays = parseInt(val) || 5;
    nextText = `📅 تمام، الخطة ممتدة على مدار **${val} أيام**.

**السؤال الثالث:** كم عدد الساعات اليومية التي تستطيع تخصيصها للمذاكرة الصارمة والمركزة حالياً؟`;
    options = [
      { label: '🕓 ٣ ساعات يومياً', value: '3' },
      { label: '🕕 ٥ ساعات يومياً', value: '5' },
      { label: '🕗 ٨ ساعات يومياً', value: '8' },
      { label: '🕛 ١٢ ساعة يومياً (طوارئ قصوى)', value: '12' }
    ];
  } else if (step === 4) {
    state.emergencyPlanData.studyHours = parseInt(val) || 8;
    nextText = `🔋 تخصيص **${val} ساعات يومياً** للدراسة ممتاز.

**السؤال الرابع والأخير:** كيف تقيّم مستواك وفهمك الحالي في مادة **${state.emergencyPlanData.subject}**؟`;
    options = [
      { label: '🟢 ممتاز (أحتاج فقط لوزاريات)', value: 'ممتاز' },
      { label: '🟡 جيد جداً (أحتاج للمراجعة)', value: 'جيد جداً' },
      { label: '🟠 متوسط (تراكم جزئي بالفصول)', value: 'متوسط' },
      { label: '🔴 ضعيف (تراكم كبير وضيق للوقت)', value: 'ضعيف' }
    ];
  } else if (step === 5) {
    state.emergencyPlanData.readinessRating = val;
    // Generate final schedule
    generateEmergencyScheduleResult();
    return;
  }

  state.studentChatHistory.push({
    id: `em-st-${step}`,
    sender: 'assistant',
    text: nextText,
    options,
    timestamp: getFormattedTime()
  });
  populateStudentChatBubbles();
}

function generateEmergencyScheduleResult() {
  const data = state.emergencyPlanData;
  const totalHours = data.remainingDays * data.studyHours;
  const grade = state.studentProfile ? state.studentProfile.gradeClass : 'السادس العلمي';
  const stage = state.studentProfile ? state.studentProfile.stage : 'preparatory';

  // Call the generator in planner.js
  const end = new Date();
  end.setDate(end.getDate() + data.remainingDays);
  const endStr = end.toISOString().split('T')[0];

  const generated = window.generateRevisionPlan(
    `خطة إنقاذ طارئة - مادة ${data.subject}`,
    new Date().toISOString().split('T')[0],
    endStr,
    [data.subject],
    data.studyHours > 8 ? 5 : 4,
    50,
    'خطة طوارئ معتمدة بالوزاري',
    data.studentName,
    grade,
    stage
  );

  const text = `🏁 **تهانينا يا بطل! اكتملت حساب الخطة والإنقاذ بنجاح!**
بناءً على تفاصيل حالتك الخاصة:
• **المادة المستهدفة بالإنقاذ:** ${data.subject}
• **الأيام المتبقية للامتحان:** ${data.remainingDays} أيام.
• **إجمالي ساعات المذاكرة الكلية المتوفرة لك:** **${totalHours} ساعة دراسة فعالة**.
• **كثافة خطة الطوارئ:** ${data.remainingDays < 4 ? '🔴 طوارئ قصوى وعالية الحرج' : '🟡 مراجعة مكثفة ممتازة ومضغوطة'}.

لقد قمت بتوليد جدول دراسي منظم حقيقي متكامل يتضمن تقسيم الفترات، أوقات الراحة، وحل الوزاريات بالتساوي لضمان الدرجة الكاملة!

هل ترغب في **تأكيد وتطبيق** هذا الجدول ليحل كجدول نشط وتتمكن من تتبعه وإنجازه فوراً؟`;

  state.studentChatHistory.push({
    id: `em-result`,
    sender: 'assistant',
    text,
    options: [
      { label: '✅ تأكيد وتطبيق خطة الطوارئ', value: 'CONFIRM_PLAN_WIZ' },
      { label: '❌ إلغاء وتجاهل المقترح', value: 'CANCEL_PLAN_WIZ' }
    ],
    timestamp: getFormattedTime()
  });
  populateStudentChatBubbles();
}

function triggerStudentAdvisorOption(value, label) {
  state.studentChatHistory.push({
    id: `u-opt-${Date.now()}`,
    sender: 'user',
    text: label,
    timestamp: getFormattedTime()
  });
  populateStudentChatBubbles();

  if (state.emergencyPlanStep > 0) {
    if (value === 'CONFIRM_PLAN_WIZ') {
      // Commit emergency plan
      const end = new Date();
      end.setDate(end.getDate() + state.emergencyPlanData.remainingDays);
      const endStr = end.toISOString().split('T')[0];

      const generated = window.generateRevisionPlan(
        `خطة إنقاذ طارئة - مادة ${state.emergencyPlanData.subject}`,
        new Date().toISOString().split('T')[0],
        endStr,
        [state.emergencyPlanData.subject],
        state.emergencyPlanData.studyHours > 8 ? 5 : 4,
        50,
        'خطة طوارئ معتمدة بالوزاري',
        state.studentProfile ? state.studentProfile.studentName : 'أحمد علي',
        state.studentProfile ? state.studentProfile.gradeClass : 'السادس العلمي',
        state.studentProfile ? state.studentProfile.stage : 'preparatory'
      );

      state.schedules.push(generated);
      state.currentScheduleId = generated.id;
      window.saveSchedules(state.schedules);
      window.saveActiveScheduleId(generated.id);

      state.emergencyPlanStep = 0;

      state.studentChatHistory.push({
        id: `confirm-reply`,
        sender: 'assistant',
        text: `🎉 **ألف مبروك!** تم تثبيت وتفعيل **"${generated.scheduleName}"** كجدولك النشط المعتمد الآن بنجاح!
بإمكانك الرجوع إلى **الجدول الدراسي التفاعلي** للبدء بتتبع الدروس وإكمالها بلمسة واحدة لضمان التفوق بالبكالوريا بإذن الله 🩺📐.`,
        timestamp: getFormattedTime()
      });
      populateStudentChatBubbles();
      renderStudentSchedulesList();
      renderStudentScheduleTable();
    } else if (value === 'CANCEL_PLAN_WIZ') {
      state.emergencyPlanStep = 0;
      state.studentChatHistory.push({
        id: `cancel-reply`,
        sender: 'assistant',
        text: `تم إلغاء خطة الطوارئ بنجاح. كيف يمكنني مساعدتك مجدداً اليوم؟`,
        timestamp: getFormattedTime(),
        options: [
          { label: '📊 تحليل ومراجعة جدولي', value: 'analyze_schedule' },
          { label: '🔍 ماذا يجب أن أدرس الآن؟', value: 'study_now' }
        ]
      });
      populateStudentChatBubbles();
    } else {
      handleEmergencyWizardStep(value, label);
    }
  } else {
    setTimeout(() => {
      simulateStudentAdvisorReply(value);
    }, 600);
  }
}

// =========================================================
// 2. TEACHER MODE PANEL MODULE
// =========================================================
function setTeacherRole(role) {
  state.teacherRole = role;
  
  // Highlight role button
  document.getElementById('btn-t-principal').className = "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-white border border-slate-200 text-slate-600";
  document.getElementById('btn-t-assistant').className = "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-white border border-slate-200 text-slate-600";
  document.getElementById('btn-t-teacher').className = "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-white border border-slate-200 text-slate-600";

  if (role === 'principal') {
    document.getElementById('btn-t-principal').className = "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-brand text-white shadow-sm";
  } else if (role === 'assistant') {
    document.getElementById('btn-t-assistant').className = "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-brand text-white shadow-sm";
  } else if (role === 'teacher') {
    document.getElementById('btn-t-teacher').className = "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer bg-brand text-white shadow-sm";
  }
  
  // Refresh sidebar config form dropdowns
  populateTeacherRoleDropdowns();
  renderTeacherGrid();
}

function populateTeacherRoleDropdowns() {
  const p = state.teacherProfile;
  const days = window.IRAQI_DAYS || [];
  
  // Days Form
  const daySelect = document.getElementById('form-lesson-day');
  daySelect.innerHTML = '';
  days.forEach(day => {
    daySelect.innerHTML += `<option value="${day}">${day}</option>`;
  });

  // Period times Form
  const periodSelect = document.getElementById('form-lesson-period');
  periodSelect.innerHTML = '';
  const periods = [
    { name: 'الحصة الأولى (08:00 - 08:45)', val: 0 },
    { name: 'الحصة الثانية (08:50 - 09:35)', val: 1 },
    { name: 'الحصة الثالثة (09:40 - 10:25)', val: 2 },
    { name: 'الحصة الرابعة (10:45 - 11:30)', val: 3 },
    { name: 'الحصة الخامسة (11:35 - 12:20)', val: 4 },
    { name: 'الحصة السادسة (12:25 - 13:10)', val: 5 }
  ];
  periods.forEach(per => {
    periodSelect.innerHTML += `<option value="${per.val}">${per.name}</option>`;
  });

  // Grades Form and Filters
  const gradeFormSelect = document.getElementById('form-lesson-grade');
  const gradeFilterSelect = document.getElementById('teacher-filter-grade');
  if (gradeFormSelect) {
    gradeFormSelect.innerHTML = window.generateGradesOptionsHTML(false);
  }
  if (gradeFilterSelect) {
    gradeFilterSelect.innerHTML = window.generateGradesOptionsHTML(true, 'عرض جميع الصفوف المتاحة');
  }

  // Populate Exam session and Sector grade selectors
  const examGradeSelect = document.getElementById('exam-grade');
  if (examGradeSelect) {
    examGradeSelect.innerHTML = window.generateGradesOptionsHTML(false);
  }
  const sectorGradeSelect = document.getElementById('sector-grade');
  if (sectorGradeSelect) {
    sectorGradeSelect.innerHTML = window.generateGradesOptionsHTML(false);
  }

  // Divisions Form
  const divFormSelect = document.getElementById('form-lesson-division');
  divFormSelect.innerHTML = '';
  p.divisions.forEach(d => {
    divFormSelect.innerHTML += `<option value="${d}">${d}</option>`;
  });

  // Instructors Form and Filters
  const instFormSelect = document.getElementById('form-lesson-instructor');
  const instFilterSelect = document.getElementById('teacher-filter-instructor');
  instFormSelect.innerHTML = '';
  instFilterSelect.innerHTML = '<option value="all">عرض جميع الكادر التدريسي</option>';
  p.teachers.forEach(t => {
    instFormSelect.innerHTML += `<option value="${t}">${t}</option>`;
    instFilterSelect.innerHTML += `<option value="${t}">${t}</option>`;
  });

  // Rooms Form and Filters
  const roomFormSelect = document.getElementById('form-lesson-room');
  const roomFilterSelect = document.getElementById('teacher-filter-room');
  roomFormSelect.innerHTML = '';
  roomFilterSelect.innerHTML = '<option value="all">عرض جميع القاعات والمختبرات</option>';
  p.rooms.forEach(r => {
    roomFormSelect.innerHTML += `<option value="${r}">${r}</option>`;
    roomFilterSelect.innerHTML += `<option value="${r}">${r}</option>`;
  });

  // Textareas inside configuration card
  document.getElementById('config-teachers').value = p.teachers.join('\n');
  document.getElementById('config-rooms').value = p.rooms.join('\n');
}

function saveSchoolConfiguration() {
  const teachers = document.getElementById('config-teachers').value.split('\n').map(t => t.trim()).filter(t => t.length > 0);
  const rooms = document.getElementById('config-rooms').value.split('\n').map(r => r.trim()).filter(r => r.length > 0);

  state.teacherProfile.teachers = teachers;
  state.teacherProfile.rooms = rooms;
  
  populateTeacherRoleDropdowns();
  alert('✓ تم حفظ وتحديث الإعدادات المدرسية المحدثة بنجاح في قاعدة البيانات المحلية.');
}

// Render teacher unified weekly grid
function renderTeacherGrid() {
  const filterGradeVal = document.getElementById('teacher-filter-grade').value;
  const filterInstVal = document.getElementById('teacher-filter-instructor').value;
  const filterRoomVal = document.getElementById('teacher-filter-room').value;

  const days = window.IRAQI_DAYS || [];
  const periodsCount = 6;

  // Render Period Columns headers
  const theadRow = document.querySelector('#teacher-section table thead tr');
  theadRow.innerHTML = '<th class="p-4 text-xs font-black text-brand-dark text-right min-w-[120px]">الأيام / الحصص</th>';
  for (let p = 1; p <= periodsCount; p++) {
    const th = document.createElement('th');
    th.className = "p-4 text-xs font-extrabold text-brand-dark bg-[#F1EEFB]";
    th.innerText = `الحصة ${p}`;
    theadRow.appendChild(th);
  }

  // Populate dynamic rows for each Iraqi day
  const tbody = document.getElementById('teacher-grid-body');
  tbody.innerHTML = '';

  days.forEach(day => {
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 hover:bg-slate-50/30";

    // Day header column
    const firstCell = document.createElement('td');
    firstCell.className = "p-3.5 text-right font-bold border-l border-slate-100 bg-slate-50/30 min-w-[120px]";
    firstCell.innerText = day;
    tr.appendChild(firstCell);

    // Period columns
    for (let p = 0; p < periodsCount; p++) {
      const td = document.createElement('td');
      td.className = "p-2 border-l border-slate-100 relative";

      // Find matching lessons for this day and period, applied to filters
      const matches = state.teacherLessons.filter(les => {
        if (les.day !== day || les.periodIndex !== p) return false;
        
        // Apply sidebar filters
        if (filterGradeVal !== 'all' && les.gradeClass !== filterGradeVal) return false;
        if (filterInstVal !== 'all' && les.teacher !== filterInstVal) return false;
        if (filterRoomVal !== 'all' && les.room !== filterRoomVal) return false;

        return true;
      });

      if (matches.length > 0) {
        // List lessons cards inside cell
        matches.forEach(les => {
          const card = document.createElement('div');
          card.className = "p-2 rounded-xl text-center text-[10px] space-y-1 transition-card border cursor-pointer bg-brand/5 border-brand-lavender text-brand-dark relative";
          
          // Delete badge
          const delBtn = document.createElement('button');
          delBtn.className = "absolute top-1 left-1.5 text-slate-400 hover:text-red-500 font-extrabold text-sm no-print";
          delBtn.innerText = "×";
          delBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteTeacherLesson(les.id);
          };
          card.appendChild(delBtn);

          // Card contents
          const content = document.createElement('div');
          content.onclick = () => handleEditTeacherLesson(les.id);
          content.innerHTML = `
            <div class="font-black text-[11px] truncate">${les.subject}</div>
            <div class="font-bold text-slate-500 truncate">${les.teacher}</div>
            <div class="text-slate-400 font-mono truncate">${les.gradeClass} (${les.division}) • ${les.room}</div>
          `;
          card.appendChild(content);

          td.appendChild(card);
        });
      } else {
        td.innerHTML = `
          <div onclick="handleCreateLessonQuick('${day}', ${p})" class="border-2 border-dashed border-slate-100 rounded-xl py-4 text-slate-300 hover:border-brand-lavender hover:text-brand text-[9px] font-bold cursor-pointer transition-all">
            + حصة
          </div>
        `;
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

function handleCreateLessonQuick(day, periodIdx) {
  resetTeacherForm();
  document.getElementById('form-lesson-day').value = day;
  document.getElementById('form-lesson-period').value = periodIdx;
}

function resetTeacherForm() {
  state.editingTeacherLessonId = null;
  document.getElementById('form-lesson-id').value = '';
  document.getElementById('form-lesson-subject').value = '';
  document.getElementById('form-lesson-notes').value = '';
  document.getElementById('teacher-form-title').innerText = "➕ إضافة حصة دراسية جديدة";
}

function handleSaveTeacherLesson(e) {
  e.preventDefault();
  
  const id = document.getElementById('form-lesson-id').value || `tech-les-${Date.now()}`;
  const day = document.getElementById('form-lesson-day').value;
  const periodIndex = parseInt(document.getElementById('form-lesson-period').value);
  const gradeClass = document.getElementById('form-lesson-grade').value;
  const division = document.getElementById('form-lesson-division').value;
  const subject = document.getElementById('form-lesson-subject').value.trim();
  const teacher = document.getElementById('form-lesson-instructor').value;
  const room = document.getElementById('form-lesson-room').value;
  const type = document.getElementById('form-lesson-type').value;
  const notes = document.getElementById('form-lesson-notes').value.trim();

  const nextLesson = { id, day, periodIndex, gradeClass, division, subject, teacher, room, type, notes };

  if (state.editingTeacherLessonId) {
    state.teacherLessons = state.teacherLessons.map(l => l.id === state.editingTeacherLessonId ? nextLesson : l);
  } else {
    state.teacherLessons.push(nextLesson);
  }

  window.saveTeacherLessons(state.teacherLessons);
  resetTeacherForm();
  
  // Refresh clashes
  checkTeacherScheduleClashes();
  renderTeacherGrid();
}

function handleEditTeacherLesson(id) {
  const les = state.teacherLessons.find(l => l.id === id);
  if (!les) return;

  state.editingTeacherLessonId = id;
  document.getElementById('form-lesson-id').value = les.id;
  document.getElementById('form-lesson-day').value = les.day;
  document.getElementById('form-lesson-period').value = les.periodIndex;
  document.getElementById('form-lesson-grade').value = les.gradeClass;
  document.getElementById('form-lesson-division').value = les.division;
  document.getElementById('form-lesson-subject').value = les.subject;
  document.getElementById('form-lesson-instructor').value = les.teacher;
  document.getElementById('form-lesson-room').value = les.room;
  document.getElementById('form-lesson-type').value = les.type;
  document.getElementById('form-lesson-notes').value = les.notes || '';

  document.getElementById('teacher-form-title').innerText = "✏️ تعديل حصة دراسية قائمة";
}

function handleDeleteTeacherLesson(id) {
  if (confirm('هل ترغب في حذف هذه الحصة الدراسية؟')) {
    state.teacherLessons = state.teacherLessons.filter(l => l.id !== id);
    window.saveTeacherLessons(state.teacherLessons);
    checkTeacherScheduleClashes();
    renderTeacherGrid();
  }
}

// ⚠️ Teacher clashes checker
function checkTeacherScheduleClashes() {
  const list = state.teacherLessons;
  const clashes = [];

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];

      if (a.day === b.day && a.periodIndex === b.periodIndex) {
        // Clash 1: Same Instructor at same time
        if (a.teacher === b.teacher) {
          clashes.push(`تضارب مدرّس: المدرس **(${a.teacher})** مجدول لحصتين في نفس الوقت (حصة ${a.periodIndex+1}، يوم ${a.day}) لـ [${a.gradeClass} شعبة ${a.division}] و [${b.gradeClass} شعبة ${b.division}].`);
        }
        // Clash 2: Same Classroom/Room at same time
        if (a.room === b.room && a.room !== 'القاعة الكبرى') {
          clashes.push(`تضارب القاعة: القاعة **(${a.room})** محجوزة لحصتين معاً في نفس الوقت (حصة ${a.periodIndex+1}، يوم ${a.day}) لـ [${a.subject}] و [${b.subject}].`);
        }
        // Clash 3: Same Division/Grade class at same time
        if (a.gradeClass === b.gradeClass && a.division === b.division) {
          clashes.push(`تضارب صف: الصف **(${a.gradeClass} - شعبة ${a.division})** لديهم حصتان دراسيتان معاً بنفس التوقيت (حصة ${a.periodIndex+1}، يوم ${a.day}) مادة [${a.subject}] و [${b.subject}].`);
        }
      }
    }
  }

  const panel = document.getElementById('teacher-conflict-panel');
  const container = document.getElementById('teacher-conflict-list');

  if (clashes.length > 0) {
    panel.classList.remove('hidden');
    container.innerHTML = clashes.map(c => `<div class="p-1 leading-relaxed">• ${c}</div>`).join('');
  } else {
    panel.classList.add('hidden');
    container.innerHTML = '';
  }
}

// =========================================================
// 3. EXAM HALL ORGANIZER MODULE (STEPS 1 TO 8)
// =========================================================
function switchExamStep(step) {
  state.activeExamStep = step;

  // Toggle buttons highlight
  for (let s = 1; s <= 8; s++) {
    const btn = document.getElementById(`step-btn-${s}`);
    if (btn) {
      if (s === step) {
        btn.querySelector('div').className = "w-9 h-9 rounded-full flex items-center justify-center text-xs font-black bg-[#5B2596] text-white ring-4 ring-[#E9E6FA]";
        btn.querySelector('span').className = "text-[10px] font-black text-[#3E176D]";
      } else if (s < step) {
        btn.querySelector('div').className = "w-9 h-9 rounded-full flex items-center justify-center text-xs font-black bg-emerald-500 text-white";
        btn.querySelector('span').className = "text-[10px] font-bold text-emerald-600";
      } else {
        btn.querySelector('div').className = "w-9 h-9 rounded-full flex items-center justify-center text-xs font-black bg-white border border-[#D9D3F0] text-slate-500 hover:border-[#5B2596]";
        btn.querySelector('span').className = "text-[10px] font-bold text-slate-500";
      }
    }
    
    const pane = document.getElementById(`exam-step-pane-${s}`);
    if (pane) pane.classList.toggle('hidden', s !== step);
  }

  // Load contextual triggers
  if (step === 1) {
    populateExamStep1Form();
  } else if (step === 2) {
    setStudentInputMode(state.studentInputMode);
    renderExamStudentsList();
  } else if (step === 3) {
    renderExamHallsList();
    renderInteractiveSeatingGrid();
  } else if (step === 4) {
    renderExamAdvisorChat();
  } else if (step === 5) {
    populateSectorsFormHalls();
    renderSectorsList();
  } else if (step === 6) {
    populateProctorsFormHalls();
    renderProctorsList();
  } else if (step === 7) {
    // Run diagnostics
    runQualityDiagnostics();
  } else if (step === 8) {
    setExamReportTab(state.examReportTab);
  }
}

// STEP 1 CONTROLLER
function populateExamStep1Form() {
  const s = state.examSession;
  if (!s) return;
  document.getElementById('exam-school-name').value = s.schoolName;
  document.getElementById('exam-title').value = s.examTitle;
  document.getElementById('exam-subject').value = s.subject;
  document.getElementById('exam-grade').value = s.gradeClass;
  document.getElementById('exam-attempt').value = s.attempt;
  document.getElementById('exam-chair').value = s.committeeChair;
  document.getElementById('exam-date').value = s.date;
  document.getElementById('exam-day').value = s.day;
  document.getElementById('exam-time').value = s.time;
  document.getElementById('exam-notes').value = s.notes || '';
}

function saveExamStep1(e) {
  e.preventDefault();
  state.examSession = {
    id: state.examSession ? state.examSession.id : 'session-1',
    schoolName: document.getElementById('exam-school-name').value.trim(),
    examTitle: document.getElementById('exam-title').value.trim(),
    subject: document.getElementById('exam-subject').value.trim(),
    gradeClass: document.getElementById('exam-grade').value.trim(),
    attempt: document.getElementById('exam-attempt').value,
    committeeChair: document.getElementById('exam-chair').value.trim(),
    date: document.getElementById('exam-date').value,
    day: document.getElementById('exam-day').value.trim(),
    time: document.getElementById('exam-time').value.trim(),
    notes: document.getElementById('exam-notes').value.trim(),
    isMultiGrade: state.examSession ? state.examSession.isMultiGrade : false,
    status: 'draft',
    createdAt: state.examSession ? state.examSession.createdAt : new Date().toISOString().split('T')[0]
  };

  window.saveExamSession(state.examSession);
  switchExamStep(2);
}

// STEP 2 CONTROLLER (STUDENTS LIST)
function setStudentInputMode(mode) {
  state.studentInputMode = mode;
  document.getElementById('btn-st-manual').className = "px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer bg-white border border-slate-200 text-slate-600";
  document.getElementById('btn-st-bulk').className = "px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer bg-white border border-slate-200 text-slate-600";
  document.getElementById('btn-st-ocr').className = "px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer bg-white border border-slate-200 text-slate-600";

  document.getElementById('student-manual-form').classList.add('hidden');
  document.getElementById('student-bulk-form').classList.add('hidden');
  document.getElementById('student-ocr-form').classList.add('hidden');

  if (mode === 'manual') {
    document.getElementById('student-manual-form').classList.remove('hidden');
    document.getElementById('btn-st-manual').className = "px-3 py-1.5 text-[10px] font-black rounded-lg cursor-pointer bg-brand text-white shadow-sm";
  } else if (mode === 'bulk') {
    document.getElementById('student-bulk-form').classList.remove('hidden');
    document.getElementById('btn-st-bulk').className = "px-3 py-1.5 text-[10px] font-black rounded-lg cursor-pointer bg-brand text-white shadow-sm";
  } else if (mode === 'ocr') {
    document.getElementById('student-ocr-form').classList.remove('hidden');
    document.getElementById('btn-st-ocr').className = "px-3 py-1.5 text-[10px] font-black rounded-lg cursor-pointer bg-brand text-white shadow-sm";
  }
}

function renderExamStudentsList() {
  document.getElementById('exam-students-count').innerText = `${state.examStudents.length} طلاب`;
  const tbody = document.getElementById('exam-students-table-body');
  tbody.innerHTML = '';

  state.examStudents.forEach((st, idx) => {
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 hover:bg-slate-50/50";
    tr.innerHTML = `
      <td class="p-2.5 text-right text-slate-500 font-bold">${idx + 1}</td>
      <td class="p-2.5 font-mono text-brand font-black">${st.rollNumber}</td>
      <td class="p-2.5 font-extrabold text-slate-800 text-right">${st.name}</td>
      <td class="p-2.5">
        <button onclick="deleteExamStudent('${st.id}')" class="text-red-500 hover:text-red-600 font-extrabold cursor-pointer">×</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleAddStudentManual(e) {
  e.preventDefault();
  const roll = document.getElementById('manual-st-roll').value.trim();
  const name = document.getElementById('manual-st-name').value.trim();
  if (!name) return;

  const st = {
    id: `st-${Date.now()}`,
    name,
    rollNumber: roll || `EX-${1000 + state.examStudents.length}`,
    gradeClass: state.examSession ? state.examSession.gradeClass : 'السادس العلمي',
    division: 'أ'
  };

  state.examStudents.push(st);
  window.saveExamStudents(state.examStudents);
  
  document.getElementById('manual-st-roll').value = '';
  document.getElementById('manual-st-name').value = '';
  renderExamStudentsList();
}

function handleApplyBulkStudents() {
  const text = document.getElementById('bulk-st-text').value;
  if (!text.trim()) return;

  const parsed = window.parsePastedStudents(text, state.examSession ? state.examSession.gradeClass : 'السادس العلمي');
  if (parsed.length > 0) {
    state.examStudents.push(...parsed);
    window.saveExamStudents(state.examStudents);
    document.getElementById('bulk-st-text').value = '';
    renderExamStudentsList();
    alert(`✓ تم بنجاح إضافة وتوليد ${parsed.length} طلاب إضافيين من القائمة الملصقة!`);
  }
}

function triggerOcrSimulation() {
  document.getElementById('ocr-simulation-log-container').classList.remove('hidden');
  const res = window.simulateOCR('صورة_قوائم_الطلاب.png', state.examSession ? state.examSession.gradeClass : 'السادس العلمي');
  state.ocrResults = res.students;
  document.getElementById('ocr-log').innerText = res.log;
}

function applyOcrResult() {
  if (state.ocrResults.length > 0) {
    state.examStudents.push(...state.ocrResults);
    window.saveExamStudents(state.examStudents);
    state.ocrResults = [];
    document.getElementById('ocr-simulation-log-container').classList.add('hidden');
    renderExamStudentsList();
    alert('✓ تم دمج الطلاب المستخرجين من المسح الضوئي بنجاح بالقائمة النشطة!');
  }
}

function cancelOcrResult() {
  state.ocrResults = [];
  document.getElementById('ocr-simulation-log-container').classList.add('hidden');
}

function deleteExamStudent(id) {
  state.examStudents = state.examStudents.filter(s => s.id !== id);
  window.saveExamStudents(state.examStudents);
  renderExamStudentsList();
}

function clearAllExamStudents() {
  if (confirm('تنبيه: هل ترغب في مسح كامل قائمة الطلاب المسجلة وبدء الجلسة من جديد؟')) {
    state.examStudents = [];
    window.saveExamStudents([]);
    renderExamStudentsList();
  }
}

// STEP 3 CONTROLLER (HALLS CONFIG)
function renderExamHallsList() {
  const container = document.getElementById('exam-halls-list-container');
  container.innerHTML = '';

  state.examHalls.forEach(h => {
    const isActive = h.id === state.selectedHallId;
    const card = document.createElement('div');
    card.className = `p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
      isActive 
        ? 'bg-brand/5 border-brand-lavender text-brand-dark font-black' 
        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
    }`;
    
    card.innerHTML = `
      <div onclick="selectActiveExamHall('${h.id}')" class="flex-1 truncate">
        <span class="block truncate">🏫 ${h.name}</span>
        <span class="text-[9px] text-slate-400 font-bold">صفوف: ${h.rowsCount} • أعمدة: ${h.colsCount} • مقاعد: ${h.seats.filter(s=>s.status!=='corridor').length}</span>
      </div>
      <button onclick="deleteExamHall(event, '${h.id}')" class="text-slate-400 hover:text-red-500 font-extrabold px-1 text-sm cursor-pointer">×</button>
    `;
    container.appendChild(card);
  });
}

function selectActiveExamHall(id) {
  state.selectedHallId = id;
  renderExamHallsList();
  renderInteractiveSeatingGrid();
}

function deleteExamHall(e, id) {
  e.stopPropagation();
  if (state.examHalls.length <= 1) {
    alert('يجب الإبقاء على قاعة واحدة امتحانية على الأقل لجلسة التوزيع.');
    return;
  }
  if (confirm('هل ترغب في حذف هذه القاعة؟')) {
    state.examHalls = state.examHalls.filter(h => h.id !== id);
    window.saveExamHalls(state.examHalls);
    if (state.selectedHallId === id) {
      state.selectedHallId = state.examHalls[0].id;
    }
    renderExamHallsList();
    renderInteractiveSeatingGrid();
  }
}

function handleAddNewHall(e) {
  e.preventDefault();
  const name = document.getElementById('hall-form-name').value.trim();
  const rows = parseInt(document.getElementById('hall-form-rows').value) || 5;
  const cols = parseInt(document.getElementById('hall-form-cols').value) || 6;
  const capacity = parseInt(document.getElementById('hall-form-capacity').value) || 1;

  if (!name) return;

  const id = `hall-${Date.now()}`;
  const seats = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seats.push({
        id: `seat-${id}-${r}-${c}`,
        row: r,
        col: c,
        status: 'regular' // regular, damaged, corridor, spacing
      });
    }
  }

  const newHall = {
    id,
    name,
    building: 'بناية الامتحانات',
    floor: 'الطابق الأرضي',
    rowsCount: rows,
    colsCount: cols,
    studentsPerSeat: capacity,
    damagedSeatsCount: 0,
    gatewaysCount: 1,
    gatewayPositions: ['اليمين'],
    sectors: [],
    seats
  };

  state.examHalls.push(newHall);
  state.selectedHallId = id;
  window.saveExamHalls(state.examHalls);

  document.getElementById('hall-form-name').value = '';
  renderExamHallsList();
  renderInteractiveSeatingGrid();
}

function renderInteractiveSeatingGrid() {
  const hall = state.examHalls.find(h => h.id === state.selectedHallId);
  const container = document.getElementById('interactive-seating-grid');
  container.innerHTML = '';

  if (!hall) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 font-bold">يرجى اختيار قاعة من الشريط الأيمن أولاً لعرض مخطط جلوس المقاعد.</div>`;
    document.getElementById('active-hall-title-display').innerText = 'لا يوجد قاعة محددة';
    return;
  }

  document.getElementById('active-hall-title-display').innerText = `المخطط البصري: ${hall.name}`;
  container.style.gridTemplateColumns = `repeat(${hall.colsCount}, minmax(0, 1fr))`;

  hall.seats.forEach(seat => {
    const box = document.createElement('div');
    box.className = "aspect-square rounded-xl flex flex-col items-center justify-center border text-[9px] font-black cursor-pointer transition-all select-none relative ";
    box.innerText = `ر:${seat.row + 1} - ع:${seat.col + 1}`;

    // Apply color matching seat status
    if (seat.status === 'damaged') {
      box.className += "bg-red-500 border-red-600 text-white shadow-sm";
    } else if (seat.status === 'spacing') {
      box.className += "bg-amber-500 border-amber-600 text-white shadow-sm";
    } else if (seat.status === 'corridor') {
      box.className += "bg-slate-200 border-slate-300 text-slate-400 border-dashed";
      box.innerText = "ممر";
    } else {
      box.className += "bg-emerald-500 border-emerald-600 text-white shadow-sm";
    }

    // click to toggle state
    box.onclick = () => {
      toggleSeatStatusInActiveHall(seat.id);
    };

    container.appendChild(box);
  });
}

function toggleSeatStatusInActiveHall(seatId) {
  const hall = state.examHalls.find(h => h.id === state.selectedHallId);
  if (!hall) return;

  const seat = hall.seats.find(s => s.id === seatId);
  if (!seat) return;

  // Toggle status cycle: regular -> damaged -> spacing -> corridor -> regular
  if (seat.status === 'regular') seat.status = 'damaged';
  else if (seat.status === 'damaged') seat.status = 'spacing';
  else if (seat.status === 'spacing') seat.status = 'corridor';
  else seat.status = 'regular';

  window.saveExamHalls(state.examHalls);
  renderInteractiveSeatingGrid();
}

// STEP 4 CONTROLLER (EXAM AI ADVISOR CHAT)
function resetExamAdvisorChat() {
  state.examChatHistory = [{
    id: 'exam-adv-welcome',
    sender: 'assistant',
    text: `أهلاً بك في **المساعد الحواري لتوزيع القاعات الامتحانية** 🤖!
لقد قمت بتحليل المدخلات الحالية لجلستك. بإمكاني الإجابة ومحاكاة شروط التباعد وقدرة الاستيعاب فوراً أوفلاين.

انقر على الأزرار السريعة بالأيمن لمراجعة فحص الجودة التلقائي أو اكتب استفسارك المخصص:`,
    timestamp: getFormattedTime()
  }];
}

function renderExamAdvisorChat() {
  const scroller = document.getElementById('exam-chat-scroller');
  if (!scroller) return;
  scroller.innerHTML = '';

  state.examChatHistory.forEach(msg => {
    const isAssistant = msg.sender === 'assistant';
    const div = document.createElement('div');
    div.className = `flex flex-col space-y-1 max-w-[85%] ${isAssistant ? 'self-start mr-0 ml-auto' : 'self-end mr-auto ml-0'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `p-3 rounded-xl leading-relaxed ${
      isAssistant 
        ? 'bg-white text-slate-800 border border-[#D9D3F0] rounded-tr-none font-medium' 
        : 'bg-[#5B2596] text-white rounded-tl-none font-bold'
    }`;
    bubble.innerHTML = `<div class="whitespace-pre-line">${msg.text}</div>`;

    div.appendChild(bubble);

    // Metadata badges for Assistant responses in Exam Advisor
    if (isAssistant && msg.metadata) {
      const metaDiv = document.createElement('div');
      metaDiv.className = "mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[8px] text-slate-500 font-bold";
      
      const roleMap = { student: 'طالب', teacher: 'مدرس', assistant: 'معاون', director: 'مدير' };
      const moduleMap = {
        study_schedule: 'تنظيم الدراسة',
        school_schedule: 'جدول المدرسة',
        teacher_schedule: 'جدول المدرس',
        exam_halls: 'القاعات الامتحانية',
        curriculum_tree: 'شجرة المنهج الوزاري',
        exams: 'الامتحانات',
        staff: 'الكادر الدراسي',
        reviews: 'المراجعات',
        printing_export: 'الطباعة والتصدير'
      };
      const confidenceMap = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };

      const r = roleMap[msg.metadata.detectedRole] || msg.metadata.detectedRole || 'مدير';
      const m = moduleMap[msg.metadata.detectedModule] || msg.metadata.detectedModule || 'القاعات الامتحانية';
      const c = confidenceMap[msg.metadata.confidenceLevel] || msg.metadata.confidenceLevel || 'عالية';
      const sourceStr = msg.metadata.source === 'online' ? '⚡ متصل' : '🛡️ محلي';

      metaDiv.innerHTML = `
        <span class="bg-slate-100 px-1.5 py-0.5 rounded">👤 الدور: ${r}</span>
        <span class="bg-slate-100 px-1.5 py-0.5 rounded">📂 القسم: ${m}</span>
        <span class="bg-slate-100 px-1.5 py-0.5 rounded">🎯 الدقة: ${c}</span>
        <span class="bg-slate-100 px-1.5 py-0.5 rounded">${sourceStr}</span>
      `;
      bubble.appendChild(metaDiv);
    }

    // Action buttons if available in Exam Advisor
    if (msg.options && msg.options.length > 0) {
      const optDiv = document.createElement('div');
      optDiv.className = "flex flex-wrap gap-1 pt-1.5";
      msg.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "px-2 py-1 bg-[#F3F0FC] hover:bg-[#E9E6FA] text-[#5B2596] rounded-lg font-bold cursor-pointer transition-all border border-[#D9D3F0]/50 text-[9px]";
        btn.innerText = opt.label;
        btn.onclick = () => triggerExamAdvisorCommandWithOption(opt.value, opt.label);
        optDiv.appendChild(btn);
      });
      div.appendChild(optDiv);
    }

    scroller.appendChild(div);
  });

  setTimeout(() => {
    scroller.scrollTop = scroller.scrollHeight;
  }, 50);
}

function handleSendExamAdvisorMessage(e) {
  e.preventDefault();
  const input = document.getElementById('exam-advisor-input');
  const text = input.value.trim();
  if (!text) return;

  state.examChatHistory.push({
    id: `u-${Date.now()}`,
    sender: 'user',
    text,
    timestamp: getFormattedTime()
  });
  input.value = '';
  renderExamAdvisorChat();

  setTimeout(() => {
    simulateExamAdvisorReply(text);
  }, 600);
}

function triggerExamAdvisorCommand(cmd) {
  state.examChatHistory.push({
    id: `u-cmd-${Date.now()}`,
    sender: 'user',
    text: cmd === 'check_capacity' ? 'تحليل السعة الاستيعابية المتاحة' : cmd === 'optimize_spacing' ? 'مراجعة خيارات تباعد المقاعد' : 'مراجعة سلامة الأرقام والبيانات الكلية',
    timestamp: getFormattedTime()
  });
  renderExamAdvisorChat();

  setTimeout(() => {
    simulateExamAdvisorReply(cmd);
  }, 600);
}

function triggerExamAdvisorCommandWithOption(value, label) {
  state.examChatHistory.push({
    id: `u-opt-${Date.now()}`,
    sender: 'user',
    text: label,
    timestamp: getFormattedTime()
  });
  renderExamAdvisorChat();

  if (value === 'CONFIRM_CHANGES') {
    state.examChatHistory.push({
      id: `confirm-rep-${Date.now()}`,
      sender: 'assistant',
      text: `✅ **تم تأكيد وتنفيذ التغييرات المقترحة بنجاح!** تم تحديث قطاعات القاعات وجدول توزيع المراقبين وفقاً للمقترح.`,
      timestamp: getFormattedTime()
    });
    renderExamAdvisorChat();
  } else if (value === 'CANCEL_CHANGES') {
    state.examChatHistory.push({
      id: `cancel-rep-${Date.now()}`,
      sender: 'assistant',
      text: `تم إلغاء التغييرات المقترحة وتجاهلها بنجاح.`,
      timestamp: getFormattedTime()
    });
    renderExamAdvisorChat();
  } else if (value === 'MODIFY_SUGGESTION') {
    state.examChatHistory.push({
      id: `modify-rep-${Date.now()}`,
      sender: 'assistant',
      text: `يرجى كتابة التعديلات المطلوبة على المقترح وسأقوم بإعادة ضبط التوزيع فوراً.`,
      timestamp: getFormattedTime()
    });
    renderExamAdvisorChat();
  } else {
    setTimeout(() => {
      simulateExamAdvisorReply(value);
    }, 300);
  }
}

function simulateExamAdvisorReply(cmd) {
  processAIChatMessage(cmd, true);
}

// STEP 5 CONTROLLER (SECTORS)
function populateSectorsFormHalls() {
  const select = document.getElementById('sector-hall-select');
  select.innerHTML = '';
  state.examHalls.forEach(h => {
    select.innerHTML += `<option value="${h.id}">${h.name}</option>`;
  });
}

function renderSectorsList() {
  const container = document.getElementById('exam-sectors-grid-list');
  container.innerHTML = '';

  state.examHalls.forEach(hall => {
    const sectors = hall.sectors || [];
    sectors.forEach(sec => {
      const card = document.createElement('div');
      card.className = "p-4 bg-white border border-[#D9D3F0] rounded-2xl relative shadow-sm text-xs space-y-1.5";
      card.innerHTML = `
        <div class="font-extrabold text-brand-dark flex items-center justify-between">
          <span>🧩 ${sec.name}</span>
          <button onclick="deleteSector('${hall.id}', '${sec.id}')" class="text-red-500 font-extrabold cursor-pointer">×</button>
        </div>
        <div class="text-[10px] text-slate-500 font-bold leading-relaxed">
          <div>🏫 القاعة التابعة: ${hall.name}</div>
          <div>📍 الموقع: ${sec.position === 'right' ? 'اليمين' : sec.position === 'left' ? 'اليسار' : 'الوسط'}</div>
          <div>📚 الصف والشعبة المخصصة: ${sec.assignedGrade} (${sec.assignedDivision})</div>
          <div>↕ اتجاه القراءة: ${sec.direction === 'right_to_left' ? 'يمين لليسار' : 'يسار ليمين'}</div>
        </div>
      `;
      container.appendChild(card);
    });
  });

  if (container.children.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-400 font-bold col-span-2">لا توجد قطاعات فرعية معرفة حالياً. نقوم بتقسيم وتوزيع المقاعد افتراضياً على كامل القاعات.</div>`;
  }
}

function handleSaveSector(e) {
  e.preventDefault();
  const hallId = document.getElementById('sector-hall-select').value;
  const name = document.getElementById('sector-name').value.trim();
  const position = document.getElementById('sector-position').value;
  const grade = document.getElementById('sector-grade').value.trim();
  const div = document.getElementById('sector-division').value.trim();
  const dir = document.getElementById('sector-direction').value;

  if (!name) return;

  const hall = state.examHalls.find(h => h.id === hallId);
  if (!hall) return;

  if (!hall.sectors) hall.sectors = [];

  const newSec = {
    id: `sec-${Date.now()}`,
    name,
    position,
    associatedGate: 'المدخل الرئيسي',
    direction: dir,
    maxCapacity: 20,
    assignedGrade: grade,
    assignedDivision: div,
    notes: 'قطاع مخصص'
  };

  hall.sectors.push(newSec);
  
  // Re-map seats for this sector dynamically
  // Right side = first half columns, Left side = second half columns
  const halfCols = Math.floor(hall.colsCount / 2);
  hall.seats.forEach(seat => {
    if (position === 'right' && seat.col < halfCols) {
      seat.assignedSectorId = newSec.id;
    } else if (position === 'left' && seat.col >= halfCols) {
      seat.assignedSectorId = newSec.id;
    }
  });

  window.saveExamHalls(state.examHalls);
  
  document.getElementById('sector-name').value = '';
  renderSectorsList();
}

function deleteSector(hallId, sectorId) {
  const hall = state.examHalls.find(h => h.id === hallId);
  if (!hall) return;

  hall.sectors = hall.sectors.filter(s => s.id !== sectorId);
  // Clear assigned seat references
  hall.seats.forEach(seat => {
    if (seat.assignedSectorId === sectorId) {
      delete seat.assignedSectorId;
    }
  });

  window.saveExamHalls(state.examHalls);
  renderSectorsList();
}

// STEP 6 CONTROLLER (PROCTORS)
function populateProctorsFormHalls() {
  const select = document.getElementById('proctor-hall-select');
  select.innerHTML = '';
  state.examHalls.forEach(h => {
    select.innerHTML += `<option value="${h.id}">${h.name}</option>`;
  });
}

function toggleProctorRoleDropdowns() {
  const role = document.getElementById('proctor-role').value;
  const hallDiv = document.getElementById('proctor-hall-div');
  if (role === 'hall' || role === 'sector') {
    hallDiv.classList.remove('hidden');
  } else {
    hallDiv.classList.add('hidden');
  }
}

function renderProctorsList() {
  const container = document.getElementById('exam-proctors-list');
  container.innerHTML = '';

  state.examProctors.forEach(pr => {
    const card = document.createElement('div');
    card.className = "p-4 bg-white border border-[#D9D3F0] rounded-2xl relative shadow-sm text-xs space-y-1.5";
    
    let roleText = 'احتياط عام';
    if (pr.role === 'hall') {
      const hall = state.examHalls.find(h => h.id === pr.assignedHallId);
      roleText = `مراقب قاعة رئيسي • ${hall ? hall.name : 'قاعة محذوفة'}`;
    } else if (pr.role === 'sector') {
      const hall = state.examHalls.find(h => h.id === pr.assignedHallId);
      roleText = `مراقب قطاع • ${hall ? hall.name : 'قاعة محذوفة'}`;
    }

    card.innerHTML = `
      <div class="font-extrabold text-brand-dark flex items-center justify-between">
        <span>👩‍🏫 ${pr.name}</span>
        <button onclick="deleteProctor('${pr.id}')" class="text-red-500 font-extrabold cursor-pointer">×</button>
      </div>
      <div class="text-[10px] text-slate-500 font-bold leading-relaxed">
        <div>المسؤولية: ${roleText}</div>
      </div>
    `;
    container.appendChild(card);
  });

  if (container.children.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-400 font-bold col-span-2">لا توجد مراقبين مسجلين لهذه الجلسة حالياً.</div>`;
  }
}

function handleSaveProctor(e) {
  e.preventDefault();
  const name = document.getElementById('proctor-name').value.trim();
  const role = document.getElementById('proctor-role').value;
  const hallId = document.getElementById('proctor-hall-select').value;

  if (!name) return;

  const newPr = {
    id: `proc-${Date.now()}`,
    name,
    role,
    assignedHallId: (role === 'hall' || role === 'sector') ? hallId : undefined
  };

  state.examProctors.push(newPr);
  window.saveExamProctors(state.examProctors);

  document.getElementById('proctor-name').value = '';
  renderProctorsList();
}

function deleteProctor(id) {
  state.examProctors = state.examProctors.filter(p => p.id !== id);
  window.saveExamProctors(state.examProctors);
  renderProctorsList();
}

// STEP 7 CONTROLLER (DISTRIBUTION & RUN DIAGNOSTICS)
function runQualityDiagnostics() {
  const errors = window.runQualityChecks(state.examStudents, state.examHalls, 'none');
  const banner = document.getElementById('exam-distribution-checks-banner');
  const container = document.getElementById('exam-quality-errors-list');

  banner.classList.remove('hidden');
  
  if (errors.length > 0) {
    container.innerHTML = errors.map(err => {
      const isDanger = err.type === 'danger';
      return `
        <div class="p-3.5 rounded-xl border flex items-center justify-between gap-3 ${isDanger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'} font-extrabold">
          <div>
            <span class="block text-xs font-black">${err.title}</span>
            <span class="block text-[10px] font-bold opacity-90 mt-0.5">${err.message}</span>
          </div>
        </div>
      `;
    }).join('');
  } else {
    container.innerHTML = `
      <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-extrabold text-xs text-center">
        ✓ فحص رائع! كافة قواعد التوزيع، والتباعد، وتكرار الأرقام الامتحانية سليمة ومطابقة لمعايير جودة البكالوريا تماماً!
      </div>
    `;
  }
}

function triggerAutoDistributionSeating() {
  const sort = document.getElementById('dist-sort-config').value;
  const spacing = document.getElementById('dist-spacing-config').value;
  const allowMultiSector = document.getElementById('dist-allow-multi-grade-sector').checked;
  const allowMultiHall = document.getElementById('dist-allow-multi-grade-hall').checked;

  if (state.examStudents.length === 0) {
    alert('⚠️ تنبيه: يرجى إدخال أسماء الطلاب بالخطوة الثانية أولاً لتوزيع المقاعد.');
    return;
  }
  if (state.examHalls.length === 0) {
    alert('⚠️ تنبيه: يرجى إضافة قاعة واحدة على الأقل بالخطوة الثالثة.');
    return;
  }

  const result = window.autoDistribute(
    state.examStudents,
    state.examHalls,
    sort,
    spacing,
    allowMultiSector,
    allowMultiHall
  );

  state.examHalls = result.updatedHalls;
  window.saveExamHalls(state.examHalls);

  // Jump to step 8
  alert('🎉 تم توليد التوزيع الذكي والمخطط بنجاح! تم نقلكم لمعاينة النتائج والطباعة الرسمية.');
  switchExamStep(8);
}

// STEP 8 CONTROLLER (REPORTS & PRINTING)
function setExamReportTab(tab) {
  state.examReportTab = tab;

  // Toggle active sub tabs styling
  const tabs = ['cards', 'registers', 'maps', 'proctors'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btn-rep-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = "px-4 py-2 bg-brand text-white rounded-xl transition-all cursor-pointer font-black shadow-sm";
      } else {
        btn.className = "px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer font-bold";
      }
    }

    const pane = document.getElementById(`exam-rep-pane-${t}`);
    if (pane) pane.classList.toggle('hidden', t !== tab);
  });

  // Populate dynamic sub panels content
  if (tab === 'cards') {
    renderSeatReportCards();
  } else if (tab === 'registers') {
    renderSeatRegistersTable();
  } else if (tab === 'maps') {
    renderSeatingMapsVisual();
  } else if (tab === 'proctors') {
    renderProctorsDistributionTable();
  }
}

function renderSeatReportCards() {
  const container = document.getElementById('print-cards-grid');
  container.innerHTML = '';

  const sess = state.examSession || { schoolName: 'المدرسة الكبرى', examTitle: 'البكالوريا', attempt: 'الأول' };

  state.examHalls.forEach(hall => {
    hall.seats.forEach(seat => {
      if (seat.studentId1) {
        const student = state.examStudents.find(s => s.id === seat.studentId1);
        if (student) {
          const card = createSingleSeatCardMarkup(sess, hall, seat, student, 1);
          container.appendChild(card);
        }
      }
      if (seat.studentId2) {
        const student2 = state.examStudents.find(s => s.id === seat.studentId2);
        if (student2) {
          const card = createSingleSeatCardMarkup(sess, hall, seat, student2, 2);
          container.appendChild(card);
        }
      }
    });
  });

  if (container.children.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 font-bold col-span-2">يرجى تشغيل خوارزمية التوزيع في الخطوة السابعة لتوليد بطاقات الطلاب الشاغرة.</div>`;
  }
}

function createSingleSeatCardMarkup(sess, hall, seat, student, seatNo) {
  const div = document.createElement('div');
  div.className = "print-card p-5 bg-[#FCFBFE] border border-[#D9D3F0] rounded-2xl relative shadow-sm text-xs space-y-2 leading-relaxed";
  
  div.innerHTML = `
    <!-- Card header line -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold">
      <span class="text-brand-dark">${sess.schoolName}</span>
      <span class="text-[9px] bg-[#E9E6FA] text-[#3E176D] px-2 py-0.5 rounded font-black">${sess.attempt}</span>
    </div>
    
    <div class="text-center py-2 border-b border-slate-100 space-y-1">
      <div class="text-[10px] text-slate-400 font-bold">الاسم الثلاثي واللقب</div>
      <h4 class="font-extrabold text-brand-dark text-sm leading-tight">${student.name}</h4>
      <div class="font-mono text-xs text-[#5B2596] font-black tracking-wide">${student.rollNumber}</div>
    </div>
    
    <div class="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
      <div>🏫 القاعة: <span class="font-black text-slate-800">${hall.name}</span></div>
      <div>📐 الصف: <span class="font-black text-slate-800">${student.gradeClass}</span></div>
      <div>📍 الصف الأفقي: <span class="font-black text-slate-800">${seat.row + 1}</span></div>
      <div>📍 العمود الرأسي: <span class="font-black text-slate-800">${seat.col + 1}</span></div>
    </div>
    
    <!-- Footer instruction -->
    <p class="text-[9px] text-slate-400 border-t border-dashed border-slate-200 pt-1.5 text-center font-bold">
      تطبيق مدرسي: يرجى التواجد بالقاعة قبل الامتحان بـ 30 دقيقة ومنع الهواتف.
    </p>
  `;
  return div;
}

function renderSeatRegistersTable() {
  const container = document.getElementById('print-registers-table-container');
  container.innerHTML = '';

  const table = document.createElement('table');
  table.className = "w-full text-center border-collapse";
  
  table.innerHTML = `
    <thead>
      <tr class="bg-[#F6F4FC] border-b border-[#D9D3F0]">
        <th class="p-3 font-black text-brand-dark text-right">رقم المقعد</th>
        <th class="p-3 font-black text-brand-dark">الرقم الامتحاني</th>
        <th class="p-3 font-black text-brand-dark text-right">الاسم الثلاثي</th>
        <th class="p-3 font-black text-brand-dark">الصف الدراسي</th>
        <th class="p-3 font-black text-brand-dark">مكان الجلوس بالقاعة</th>
      </tr>
    </thead>
    <tbody id="print-registers-table-body">
      <!-- Rows populate -->
    </tbody>
  `;

  const tbody = table.querySelector('tbody');
  let count = 0;

  state.examHalls.forEach(hall => {
    hall.seats.forEach(seat => {
      if (seat.studentId1) {
        const student = state.examStudents.find(s => s.id === seat.studentId1);
        if (student) {
          count++;
          const tr = createRegisterRowMarkup(count, student, hall, seat);
          tbody.appendChild(tr);
        }
      }
      if (seat.studentId2) {
        const student2 = state.examStudents.find(s => s.id === seat.studentId2);
        if (student2) {
          count++;
          const tr = createRegisterRowMarkup(count, student2, hall, seat);
          tbody.appendChild(tr);
        }
      }
    });
  });

  if (count === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 font-bold">لا يوجد كشف طلاب نشط. يرجى التوزيع أولاً.</div>`;
    return;
  }

  container.appendChild(table);
}

function createRegisterRowMarkup(idx, student, hall, seat) {
  const tr = document.createElement('tr');
  tr.className = "border-b border-slate-100 hover:bg-slate-50/50";
  tr.innerHTML = `
    <td class="p-3 text-right font-bold text-slate-500">${idx}</td>
    <td class="p-3 font-mono text-brand font-black">${student.rollNumber}</td>
    <td class="p-3 font-extrabold text-slate-800 text-right">${student.name}</td>
    <td class="p-3 font-bold text-slate-600">${student.gradeClass}</td>
    <td class="p-3 font-bold text-slate-500">${hall.name} (صف ${seat.row+1} - عمود ${seat.col+1})</td>
  `;
  return tr;
}

function renderSeatingMapsVisual() {
  const container = document.getElementById('print-visual-maps-container');
  container.innerHTML = '';

  state.examHalls.forEach(hall => {
    const block = document.createElement('div');
    block.className = "p-5 bg-white border border-[#D9D3F0] rounded-2xl space-y-3";
    
    block.innerHTML = `
      <h4 class="font-extrabold text-brand-dark text-sm border-b border-slate-50 pb-2">🗺️ مخطط جلوس: ${hall.name}</h4>
      <div class="grid gap-2 overflow-x-auto p-1 text-center font-bold" style="grid-template-columns: repeat(${hall.colsCount}, minmax(0, 1fr))">
        <!-- Seats boxes populate -->
      </div>
    `;

    const grid = block.querySelector('.grid');
    hall.seats.forEach(seat => {
      const box = document.createElement('div');
      box.className = "aspect-square rounded-xl flex flex-col items-center justify-center border text-[9px] font-bold p-1 leading-normal";
      
      let bgClass = 'bg-slate-100 text-slate-400';
      let title = `ر:${seat.row+1}-ع:${seat.col+1}`;
      let nameSpan = '';

      if (seat.status === 'damaged') {
        bgClass = 'bg-red-500 border-red-600 text-white';
        title = 'معطل';
      } else if (seat.status === 'spacing') {
        bgClass = 'bg-amber-500 border-amber-600 text-white';
        title = 'مستبعد';
      } else if (seat.status === 'corridor') {
        bgClass = 'bg-slate-200 text-slate-400';
        title = 'ممر';
      } else if (seat.studentId1) {
        bgClass = 'bg-emerald-500 border-emerald-600 text-white';
        const st = state.examStudents.find(s => s.id === seat.studentId1);
        title = st ? st.name : 'طالب';
        nameSpan = st ? `<span class="block text-[8px] opacity-90">${st.rollNumber}</span>` : '';
      }

      box.className += ` ${bgClass}`;
      box.innerHTML = `
        <span class="block truncate max-w-[80px]">${title}</span>
        ${nameSpan}
      `;
      grid.appendChild(box);
    });

    container.appendChild(block);
  });
}

function renderProctorsDistributionTable() {
  const container = document.getElementById('print-proctors-table-container');
  container.innerHTML = '';

  const table = document.createElement('table');
  table.className = "w-full text-center border-collapse";

  table.innerHTML = `
    <thead>
      <tr class="bg-[#F6F4FC] border-b border-[#D9D3F0]">
        <th class="p-3 font-black text-brand-dark text-right">المراقب</th>
        <th class="p-3 font-black text-brand-dark">الصفة والوظيفة</th>
        <th class="p-3 font-black text-brand-dark">القاعة المسندة للمراقبة</th>
        <th class="p-3 font-black text-brand-dark">التوقيع عند الحضور</th>
      </tr>
    </thead>
    <tbody>
      <!-- Populates -->
    </tbody>
  `;

  const tbody = table.querySelector('tbody');
  let count = 0;

  state.examProctors.forEach(pr => {
    count++;
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 hover:bg-slate-50/50 text-slate-700 font-bold";
    
    let roleText = 'مراقب احتياطي عام';
    let hallText = 'غرفة الإشراف والاحتياط';

    if (pr.role === 'hall') {
      const hall = state.examHalls.find(h => h.id === pr.assignedHallId);
      roleText = 'مراقب قاعة رئيسي';
      hallText = hall ? hall.name : 'قاعة محذوفة';
    } else if (pr.role === 'sector') {
      const hall = state.examHalls.find(h => h.id === pr.assignedHallId);
      roleText = 'مراقب قطاع فرعي';
      hallText = hall ? hall.name : 'قاعة محذوفة';
    }

    tr.innerHTML = `
      <td class="p-3 text-right font-extrabold text-slate-800">${pr.name}</td>
      <td class="p-3 text-brand font-black">${roleText}</td>
      <td class="p-3 text-slate-600">${hallText}</td>
      <td class="p-3 font-serif text-slate-300">✍ ......................</td>
    `;
    tbody.appendChild(tr);
  });

  if (count === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 font-bold">لا يوجد قائمة مراقبين نشطة مسجلة للجلسة.</div>`;
    return;
  }

  container.appendChild(table);
}

// PRINT AND EXPORT CSV FILE HELPERS FOR STEP 8
window.openExportPreviewModal = function() {
  const modal = document.getElementById('modal-export-preview');
  if (!modal) return;

  // 1. Render Seating Maps (Structure and Seat layout) inside preview-seating-maps
  const mapsContainer = document.getElementById('preview-seating-maps');
  mapsContainer.innerHTML = '';
  
  if (state.examHalls.length === 0) {
    mapsContainer.innerHTML = `<div class="p-4 text-center text-slate-400 font-bold">لا توجد قاعات مسجلة.</div>`;
  } else {
    state.examHalls.forEach(hall => {
      const block = document.createElement('div');
      block.className = "p-3 bg-white border border-slate-250 rounded-xl space-y-2";
      
      block.innerHTML = `
        <h5 class="font-bold text-slate-700 text-xs flex items-center justify-between border-b border-slate-100 pb-1">
          <span>🏫 ${hall.name}</span>
          <span class="text-[10px] text-slate-400 font-normal">الأبعاد: ${hall.rowsCount} صفوف × ${hall.colsCount} أعمدة</span>
        </h5>
        <div class="grid gap-1 p-1 text-center font-bold" style="grid-template-columns: repeat(${hall.colsCount}, minmax(0, 1fr))">
          <!-- Seats boxes populate -->
        </div>
      `;

      const grid = block.querySelector('.grid');
      hall.seats.forEach(seat => {
        const box = document.createElement('div');
        box.className = "aspect-square rounded-lg flex flex-col items-center justify-center border text-[8px] font-bold p-0.5 leading-tight";
        
        let bgClass = 'bg-slate-50 text-slate-300 border-slate-100';
        let title = `ر:${seat.row+1}-ع:${seat.col+1}`;
        let nameSpan = '';

        if (seat.status === 'damaged') {
          bgClass = 'bg-red-50 text-red-500 border-red-100';
          title = 'معطل';
        } else if (seat.status === 'spacing') {
          bgClass = 'bg-amber-50 text-amber-500 border-amber-100';
          title = 'مستبعد';
        } else if (seat.status === 'corridor') {
          bgClass = 'bg-slate-100 text-slate-300';
          title = 'ممر';
        } else if (seat.studentId1) {
          bgClass = 'bg-emerald-500 text-white border-emerald-600';
          const st = state.examStudents.find(s => s.id === seat.studentId1);
          title = st ? st.name : 'طالب';
          nameSpan = st ? `<span class="block text-[7px] opacity-90">${st.rollNumber}</span>` : '';
        }

        box.className += ` ${bgClass}`;
        box.innerHTML = `
          <span class="block truncate max-w-[50px] font-extrabold">${title}</span>
          ${nameSpan}
        `;
        grid.appendChild(box);
      });

      mapsContainer.appendChild(block);
    });
  }

  // 2. Render Seating Cards inside preview-student-cards
  const cardsContainer = document.getElementById('preview-student-cards');
  cardsContainer.innerHTML = '';
  
  const sess = state.examSession || { schoolName: 'المدرسة الكبرى', examTitle: 'البكالوريا', attempt: 'الأول' };
  let cardCount = 0;

  state.examHalls.forEach(hall => {
    hall.seats.forEach(seat => {
      if (seat.studentId1) {
        const student = state.examStudents.find(s => s.id === seat.studentId1);
        if (student) {
          cardCount++;
          const card = document.createElement('div');
          card.className = "p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-[10px] shadow-sm";
          card.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-100 pb-1 font-bold text-slate-400">
              <span class="truncate max-w-[90px]">${sess.schoolName}</span>
              <span class="bg-indigo-50 text-indigo-700 px-1 rounded text-[8px]">${sess.attempt}</span>
            </div>
            <div class="text-center">
              <h6 class="font-extrabold text-brand-dark text-[11px] truncate">${student.name}</h6>
              <div class="font-mono text-[9px] text-[#5B2596] font-black">${student.rollNumber}</div>
            </div>
            <div class="grid grid-cols-2 gap-1 text-[8px] text-slate-500 font-bold border-t border-dashed border-slate-100 pt-1">
              <div>🏫 القاعة: <span class="text-slate-700">${hall.name}</span></div>
              <div>📍 المقعد: <span class="text-slate-700">ص${seat.row+1}-ع${seat.col+1}</span></div>
            </div>
          `;
          cardsContainer.appendChild(card);
        }
      }
    });
  });

  if (cardCount === 0) {
    cardsContainer.innerHTML = `<div class="p-4 text-center text-slate-400 font-bold col-span-2">يرجى تشغيل التوزيع أولاً في الخطوة السابعة لتوليد بطاقات المقاعد الشاغرة.</div>`;
  }

  // 3. Render Proctors assigned inside preview-proctors-table
  const proctorsContainer = document.getElementById('preview-proctors-table');
  proctorsContainer.innerHTML = '';

  const table = document.createElement('table');
  table.className = "w-full text-center border-collapse text-[10px]";
  table.innerHTML = `
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200 font-black text-slate-600">
        <th class="p-2 text-right">المراقب</th>
        <th class="p-2">الدور والمهمة</th>
        <th class="p-2">القاعة المسندة</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  let proctorCount = 0;

  state.examProctors.forEach(pr => {
    proctorCount++;
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 hover:bg-slate-50 font-bold text-slate-600";
    
    let roleText = 'احتياط عام';
    let hallText = 'غرفة الإشراف';

    if (pr.role === 'hall') {
      const hall = state.examHalls.find(h => h.id === pr.assignedHallId);
      roleText = 'مراقب رئيسي';
      hallText = hall ? hall.name : 'قاعة محذوفة';
    } else if (pr.role === 'sector') {
      const hall = state.examHalls.find(h => h.id === pr.assignedHallId);
      roleText = 'مراقب قطاع';
      hallText = hall ? hall.name : 'قاعة محذوفة';
    }

    tr.innerHTML = `
      <td class="p-2 text-right font-extrabold text-slate-800">${pr.name}</td>
      <td class="p-2 text-indigo-600">${roleText}</td>
      <td class="p-2">${hallText}</td>
    `;
    tbody.appendChild(tr);
  });

  if (proctorCount === 0) {
    proctorsContainer.innerHTML = `<div class="p-4 text-center text-slate-400 font-bold">لم يسند مراقبون بعد.</div>`;
  } else {
    proctorsContainer.appendChild(table);
  }

  modal.showModal();
};

window.closeExportPreviewModal = function() {
  const modal = document.getElementById('modal-export-preview');
  if (modal) {
    modal.close();
  }
};

window.confirmAndPrintExam = function() {
  const modal = document.getElementById('modal-export-preview');
  if (modal) {
    modal.close();
  }
  window.print();
};

function printOfficialExamDocuments() {
  window.print();
}

function exportExamStudentsToCsv() {
  if (state.examStudents.length === 0) return;
  window.exportStudentsToCSV(state.examStudents);
}

// --- UTILITY TIME STAMP FUNCTION ---
function getFormattedTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
