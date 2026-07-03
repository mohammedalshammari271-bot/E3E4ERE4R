// APP METADATA AND PRESET DATA CONSTANTS FOR VANILLA JS PORT

window.THEME_COLORS = {
  primary: '#5B2596',
  darkPurple: '#3E176D',
  mediumPurple: '#7641B4',
  lightLavender: '#E9E6FA',
  secondaryBg: '#F5F3FF',
  textPrimary: '#1D2433',
  textSecondary: '#687084',
  border: '#D9D3F0',
  cardBg: '#FFFFFF',
};

window.IRAQI_GRADES = [
  // المرحلة الابتدائية
  {
    stageId: "primary",
    stageName: "المرحلة الابتدائية",
    gradeId: "primary_1",
    gradeName: "الأول الابتدائي",
    branch: null,
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "primary",
    stageName: "المرحلة الابتدائية",
    gradeId: "primary_2",
    gradeName: "الثاني الابتدائي",
    branch: null,
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "primary",
    stageName: "المرحلة الابتدائية",
    gradeId: "primary_3",
    gradeName: "الثالث الابتدائي",
    branch: null,
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "primary",
    stageName: "المرحلة الابتدائية",
    gradeId: "primary_4",
    gradeName: "الرابع الابتدائي",
    branch: null,
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "primary",
    stageName: "المرحلة الابتدائية",
    gradeId: "primary_5",
    gradeName: "الخامس الابتدائي",
    branch: null,
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "primary",
    stageName: "المرحلة الابتدائية",
    gradeId: "primary_6",
    gradeName: "السادس الابتدائي",
    branch: null,
    isTerminalGrade: true,
    supportsMinisterialPlans: true,
    supportsPredictedAverage: false
  },
  // المرحلة المتوسطة
  {
    stageId: "intermediate",
    stageName: "المرحلة المتوسطة",
    gradeId: "intermediate_1",
    gradeName: "الأول المتوسط",
    branch: null,
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "intermediate",
    stageName: "المرحلة المتوسطة",
    gradeId: "intermediate_2",
    gradeName: "الثاني المتوسط",
    branch: null,
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "intermediate",
    stageName: "المرحلة المتوسطة",
    gradeId: "intermediate_3",
    gradeName: "الثالث المتوسط",
    branch: null,
    isTerminalGrade: true,
    supportsMinisterialPlans: true,
    supportsPredictedAverage: true
  },
  // المرحلة الإعدادية
  {
    stageId: "secondary",
    stageName: "المرحلة الإعدادية",
    gradeId: "secondary_4_scientific",
    gradeName: "الرابع العلمي",
    branch: "علمي",
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "secondary",
    stageName: "المرحلة الإعدادية",
    gradeId: "secondary_4_literary",
    gradeName: "الرابع الأدبي",
    branch: "أدبي",
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "secondary",
    stageName: "المرحلة الإعدادية",
    gradeId: "secondary_5_scientific",
    gradeName: "الخامس العلمي",
    branch: "علمي",
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "secondary",
    stageName: "المرحلة الإعدادية",
    gradeId: "secondary_5_literary",
    gradeName: "الخامس الأدبي",
    branch: "أدبي",
    isTerminalGrade: false,
    supportsMinisterialPlans: false,
    supportsPredictedAverage: false
  },
  {
    stageId: "secondary",
    stageName: "المرحلة الإعدادية",
    gradeId: "secondary_6_scientific",
    gradeName: "السادس العلمي",
    branch: "علمي",
    isTerminalGrade: true,
    supportsMinisterialPlans: true,
    supportsPredictedAverage: true
  },
  {
    stageId: "secondary",
    stageName: "المرحلة الإعدادية",
    gradeId: "secondary_6_literary",
    gradeName: "السادس الأدبي",
    branch: "أدبي",
    isTerminalGrade: true,
    supportsMinisterialPlans: true,
    supportsPredictedAverage: true
  }
];

window.generateGradesOptionsHTML = function(includeAllOption = false, allOptionText = "عرض جميع الصفوف المتاحة") {
  let html = '';
  if (includeAllOption) {
    html += `<option value="all">${allOptionText}</option>`;
  }
  
  const stages = [
    { id: "primary", name: "المرحلة الابتدائية" },
    { id: "intermediate", name: "المرحلة المتوسطة" },
    { id: "secondary", name: "المرحلة الإعدادية" }
  ];
  
  stages.forEach(stage => {
    html += `<optgroup label="${stage.name}">`;
    const stageGrades = window.IRAQI_GRADES.filter(g => g.stageId === stage.id);
    stageGrades.forEach(g => {
      html += `<option value="${g.gradeName}">${g.gradeName}</option>`;
    });
    html += `</optgroup>`;
  });
  
  return html;
};

window.LESSON_TYPES_ARABIC = {
  study: { label: 'دراسة', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  review: { label: 'مراجعة', bg: 'bg-purple-50', text: 'text-purple-700' },
  solve: { label: 'حل أسئلة', bg: 'bg-blue-50', text: 'text-blue-700' },
  ministerial: { label: 'وزاريات', bg: 'bg-amber-50', text: 'text-amber-800' },
  homework: { label: 'واجب', bg: 'bg-sky-50', text: 'text-sky-700' },
  exam: { label: 'امتحان', bg: 'bg-rose-50', text: 'text-rose-700' },
  rest: { label: 'راحة', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

window.LESSON_STATUS_ARABIC = {
  upcoming: { label: 'قادم', bg: 'bg-gray-100', text: 'text-gray-700' },
  completed: { label: 'مكتمل', bg: 'bg-emerald-100/80', text: 'text-emerald-800' },
  delayed: { label: 'متأخر', bg: 'bg-amber-100/80', text: 'text-amber-800' },
  postponed: { label: 'مؤجل', bg: 'bg-rose-100/80', text: 'text-rose-800' },
};

window.SUBJECT_COLORS = [
  { name: 'لافندر ناعم', bg: 'bg-[#E9E6FA]', text: 'text-[#3E176D]', border: 'border-[#D9D3F0]', hexBg: '#E9E6FA', hexText: '#3E176D' },
  { name: 'بنفسجي متوسط', bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', border: 'border-[#E9D5FF]', hexBg: '#F3E8FF', hexText: '#7E22CE' },
  { name: 'أزرق سماوي', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]', hexBg: '#E0F2FE', hexText: '#0369A1' },
  { name: 'أخضر نعناعي', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]', hexBg: '#ECFDF5', hexText: '#047857' },
  { name: 'وردي هادئ', bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]', border: 'border-[#FBCFE8]', hexBg: '#FCE7F3', hexText: '#BE185D' },
  { name: 'ذهبي دافئ', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]', hexBg: '#FEF3C7', hexText: '#B45309' },
  { name: 'أزرق هادئ', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', border: 'border-[#DBEAFE]', hexBg: '#EFF6FF', hexText: '#1D4ED8' },
];

window.IRAQI_DAYS = [
  'الجمعة',
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
];

window.SUBJECTS_BY_GRADE = {
  // الابتدائية
  'الأول الابتدائي': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'التربية الفنية', 'التربية الرياضية'],
  'الثاني الابتدائي': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'التربية الفنية', 'التربية الرياضية'],
  'الثالث الابتدائي': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'التربية الفنية', 'التربية الرياضية'],
  'الرابع الابتدائي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'العلوم', 'الاجتماعيات'],
  'الخامس الابتدائي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'العلوم', 'الاجتماعيات'],
  'السادس الابتدائي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'العلوم', 'الاجتماعيات'],

  // المتوسطة
  'الأول المتوسط': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'العلوم', 'الاجتماعيات', 'الحاسوب'],
  'الثاني المتوسط': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'العلوم', 'الاجتماعيات', 'الحاسوب'],
  'الثالث المتوسط': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الاجتماعيات', 'الحاسوب'],

  // الإعدادية
  'الرابع العلمي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الحاسوب', 'اللغة الكردية'],
  'الرابع الأدبي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'التاريخ', 'الجغرافية', 'علم الاجتماع', 'الحاسوب'],
  'الخامس العلمي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الحاسوب', 'اللغة الكردية'],
  'الخامس الأدبي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'التاريخ', 'الجغرافية', 'الفلسفة وعلم النفس', 'الحاسوب'],
  'السادس العلمي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء'],
  'السادس الأدبي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'التاريخ', 'الجغرافية', 'الاقتصاد'],
};

window.MINISTERIAL_SUBJECTS_ORDER = {
  'السادس الابتدائي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'العلوم', 'الاجتماعيات'],
  'الثالث المتوسط': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الاجتماعيات', 'الإنسان وصحته (الأحياء)', 'الكيمياء', 'الفيزياء'],
  'السادس العلمي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الكيمياء', 'الفيزياء', 'الأحياء'],
  'السادس الأدبي': ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'التاريخ', 'الجغرافية', 'الاقتصاد'],
};

window.CURRICULUM_TREES = {
  'السادس العلمي': [
    {
      subjectName: 'الرياضيات',
      chapters: [
        { id: 'math-1', name: 'الفصل الأول: الأعداد المركبة', lessons: ['الدرس الأول: تعريف العدد المركب', 'الدرس الثاني: العمليات على الأعداد المركبة', 'الدرس الثالث: مرافق العدد المركب', 'الدرس الرابع: الجذور التربيعية', 'الدرس الخامس: مبرهنة ديموافر'] },
        { id: 'math-2', name: 'الفصل الثاني: القطوع المخروطية', lessons: ['الدرس الأول: القطع المكافئ', 'الدرس الثاني: القطع الناقص', 'الدرس الثالث: القطع الزائد'] },
        { id: 'math-3', name: 'الفصل الثالث: تطبيقات التفاضل', lessons: ['الدرس الأول: المشتقات ذات الرتب العليا', 'الدرس الثاني: المعدلات الزمنية المرتبطة', 'الدرس الثالث: مبرهنة رول والقيمة المتوسطة', 'الدرس الرابع: التقريب باستخدام التفاضل', 'الدرس الخامس: رسم الدوال'] }
      ]
    },
    {
      subjectName: 'الفيزياء',
      chapters: [
        { id: 'phy-1', name: 'الفصل الأول: المتسعات', lessons: ['الدرس الأول: المتسعة المنفردة', 'الدرس الثاني: ربط المتسعات على التوازي', 'الدرس الثالث: ربط المتسعات على التوالي', 'الدرس الرابع: العازل الكهربائي'] },
        { id: 'phy-2', name: 'الفصل الثاني: الحث الكهرومغناطيسي', lessons: ['الدرس الأول: اكتشاف اورستد وفاراداي', 'الدرس الثاني: القوة الدافعة الكهربائية الحركية', 'الدرس الثالث: قانون لنز وتطبيقاته'] }
      ]
    },
    {
      subjectName: 'الكيمياء',
      chapters: [
        { id: 'chem-1', name: 'الفصل الأول: علم الثرموداينمك', lessons: ['الدرس الأول: النظام والحرارة', 'الدرس الثاني: القانون الأول للثرموداينمك', 'الدرس الثالث: الانثالبي وقانون هيس', 'الدرس الرابع: طاقة كيبس الحرة'] },
        { id: 'chem-2', name: 'الفصل الثاني: الاتزان الكيميائي', lessons: ['الدرس الأول: التفاعلات الانعكاسية وغير الانعكاسية', 'الدرس الثاني: ثابت الاتزان Kc و Kp', 'الدرس الثالث: قاعدة لو شاتيليه'] }
      ]
    }
  ],
  'الثالث المتوسط': [
    {
      subjectName: 'الرياضيات',
      chapters: [
        { id: 'math3m-1', name: 'الفصل الأول: العلاقات والمتباينات في الأعداد الحقيقية', lessons: ['الدرس الأول: ترتيب العمليات في الأعداد الحقيقية', 'الدرس الثاني: التطبيقات', 'الدرس الثالث: المتتابعات', 'الدرس الرابع: متباينات القيمة المطلقة'] },
        { id: 'math3m-2', name: 'الفصل الثاني: المقادير الجبرية', lessons: ['الدرس الأول: ضرب المقادير الجبرية', 'الدرس الثاني: تحليل المقادير بـ (ج.م.أ)', 'الدرس الثالث: تحليل بالفرق بين مربعين والتحليل بالتجربة'] }
      ]
    },
    {
      subjectName: 'الفيزياء',
      chapters: [
        { id: 'phy3m-1', name: 'الفصل الأول: الكهربائية الساكنة', lessons: ['الدرس الأول: الشحنة الكهربائية', 'الدرس الثاني: قانون كولوم', 'الدرس الثالث: المجال الكهربائي'] },
        { id: 'phy3m-2', name: 'الفصل الثاني: المغناطيسية', lessons: ['الدرس الأول: المواد المغناطيسية', 'الدرس الثاني: المجال المغناطيسي', 'الدرس الثالث: التمغنط'] }
      ]
    }
  ]
};

window.DEFAULT_SCHEDULES = [
  {
    id: 'madrasati-schedule-1',
    studentName: 'كرار علي الحلي',
    gradeClass: 'السادس العلمي - أ',
    stage: 'preparatory',
    scheduleName: 'خطة المذاكرة الأسبوعية الشاملة للبكالوريا',
    scheduleType: 'جدول أسبوعي ذكي',
    timePeriod: 'الفترة المفتوحة للمراجعة والتحضير',
    createdAt: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    startDate: '2026-07-03',
    endDate: '2026-07-09',
    days: ['الجمعة', 'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    lessons: [
      'الدرس الأول',
      'الدرس الثاني',
      'الدرس الثالث',
      'الدرس الرابع',
      'الدرس الخامس'
    ],
    lessonTimes: [
      { start: '08:30', end: '10:00' },
      { start: '10:15', end: '11:45' },
      { start: '13:00', end: '14:30' },
      { start: '15:00', end: '16:30' },
      { start: '17:00', end: '18:30' }
    ],
    cells: {
      '0-0': { subject: 'التربية الإسلامية', topic: 'سورة البقرة وأحكام التلاوة', type: 'study', status: 'completed', teacher: 'أ. جاسم الحسني', room: 'القاعة الكبرى', color: '#FEF3C7', effort: 'easy', notes: 'بداية مباركة مع كتاب الله مع انطلاق جدول "تطبيق مدرسي".' },
      '0-1': { subject: 'راحة واستراحة', topic: 'فترة ترفيهية وراحة عائلية', type: 'rest', status: 'completed', teacher: '', room: '', color: '#ECFDF5', effort: 'easy', notes: 'شحن الطاقة الذهنية ليوم مذاكرة رائع.' },
      '0-2': { subject: 'الرياضيات', topic: 'الفصل الأول: العمليات على الأعداد المركبة', type: 'review', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: '#F3E8FF', effort: 'hard', notes: 'حل المسائل والتمارين المرافقة للدرس.' },
      
      '1-0': { subject: 'الفيزياء', topic: 'الفصل الأول: المتسعة المنفردة وشحنها', type: 'study', status: 'upcoming', teacher: 'أ. همام السعدي', room: 'مختبر الفيزياء', color: '#E0F2FE', effort: 'medium' },
      '1-1': { subject: 'الكيمياء', topic: 'الفصل الأول: علم الثرموداينمك والمصطلحات', type: 'study', status: 'upcoming', teacher: 'أ. ليث المشهداني', room: 'مختبر الكيمياء', color: '#ECFDF5', effort: 'medium' },
      '1-2': { subject: 'الرياضيات', topic: 'تمارين 1-1 الأعداد المركبة', type: 'solve', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: '#F3E8FF', effort: 'hard' },

      '2-0': { subject: 'اللغة العربية', topic: 'أسلوب الاستفهام - أدوات الاستفهام وركائزها', type: 'study', status: 'upcoming', teacher: 'أ. طه التميمي', room: 'قاعة ابن جني', color: '#E9E6FA', effort: 'medium' },
      '2-1': { subject: 'اللغة الإنكليزية', topic: 'الوحدة الأولى: القواعد وربط الأزمنة', type: 'study', status: 'upcoming', teacher: 'أ. رعد السهيل', room: 'القاعة الإنكليزية', color: '#FCE7F3', effort: 'medium' },
      '2-2': { subject: 'الأحياء', topic: 'الفصل الأول: الخلية ومكوناتها', type: 'study', status: 'upcoming', teacher: 'د. سرمد الجبوري', room: 'مختبر الأحياء', color: '#EFF6FF', effort: 'medium' },

      '3-0': { subject: 'الفيزياء', topic: 'المتسعات على التوازي والربط المختلط', type: 'study', status: 'upcoming', teacher: 'أ. همام السعدي', room: 'مختبر الفيزياء', color: '#E0F2FE', effort: 'medium' },
      '3-1': { subject: 'الكيمياء', topic: 'قانون هيس وحساب انثالبي التفاعل', type: 'review', status: 'upcoming', teacher: 'أ. ليث المشهداني', room: 'مختبر الكيمياء', color: '#ECFDF5', effort: 'hard' },
      '3-2': { subject: 'اللغة العربية', topic: 'إعراب أسماء الاستفهام (من وما)', type: 'solve', status: 'upcoming', teacher: 'أ. طه التميمي', room: 'قاعة ابن جني', color: '#E9E6FA', effort: 'hard' },

      '4-0': { subject: 'الرياضيات', topic: 'القطع المكافئ وبؤرته ودليله', type: 'study', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: '#F3E8FF', effort: 'medium' },
      '4-1': { subject: 'الأحياء', topic: 'الإنقسام الخيطي والاختزالي للخلية', type: 'review', status: 'upcoming', teacher: 'د. سرمد الجبوري', room: 'مختبر الأحياء', color: '#EFF6FF', effort: 'medium' },
      '4-2': { subject: 'التربية الإسلامية', topic: 'شرح الحديث النبوي الشريف في التعاون', type: 'study', status: 'upcoming', teacher: 'أ. جاسم الحسني', room: 'القاعة الكبرى', color: '#FEF3C7', effort: 'easy' },

      '5-0': { subject: 'الفيزياء', topic: 'وزاريات المتسعات وحل الأفكار الوزارية الإثرائية', type: 'ministerial', status: 'upcoming', teacher: 'أ. همام السعدي', room: 'مختبر الفيزياء', color: '#E0F2FE', effort: 'hard' },
      '5-1': { subject: 'اللغة الإنكليزية', topic: 'قطع الكتاب الاستيعابية وقصة زيد طارق', type: 'study', status: 'upcoming', teacher: 'أ. رعد السهيل', room: 'القاعة الإنكليزية', color: '#FCE7F3', effort: 'medium' },
      '5-2': { subject: 'الكيمياء', topic: 'علاقة كيبس وتطبيقاتها في التفاعلات تلقائية الذات', type: 'review', status: 'upcoming', teacher: 'أ. ليث المشهداني', room: 'مختبر الكيمياء', color: '#ECFDF5', effort: 'hard' },

      '6-0': { subject: 'الرياضيات', topic: 'وزاريات الأعداد المركبة وحل الأسئلة المكررة', type: 'ministerial', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: '#F3E8FF', effort: 'hard' },
      '6-1': { subject: 'اللغة العربية', topic: 'مراجعة أسبوعية مركزة لقواعد اللغة', type: 'review', status: 'upcoming', teacher: 'أ. طه التميمي', room: 'قاعة ابن جني', color: '#E9E6FA', effort: 'medium' },
      '6-2': { subject: 'الأحياء', topic: 'امتحان تجريبي شامل للباب الأول من الخلية', type: 'exam', status: 'upcoming', teacher: 'د. سرمد الجبوري', room: 'مختبر الأحياء', color: '#EFF6FF', effort: 'hard' }
    },
    notes: 'إرشادات تطبيق مدرسي: رتب طاولة مذاكرتك واحرص على الإضاءة المناسبة وجدد طاقتك بشرب الماء بانتظام وممارسة رياضة خفيفة.',
    completionRate: 15,
    adherenceRate: 100,
    studyHours: 35,
    completedCount: 2
  }
];
