import { Schedule, SUBJECT_COLORS } from './types';

export const DEFAULT_SCHEDULES: Schedule[] = [
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
    startDate: '2026-07-03', // الجمعه
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
      // الجمعة (Friday) - مراجعة خفيفة وأسبوعية وراحة
      '0-0': { subject: 'التربية الإسلامية', topic: 'سورة البقرة وأحكام التلاوة', type: 'study', status: 'completed', teacher: 'أ. جاسم الحسني', room: 'القاعة الكبرى', color: SUBJECT_COLORS[5].hexBg, effort: 'easy', notes: 'بداية مباركة مع كتاب الله مع انطلاق جدول "تطبيق مدرسي".' },
      '0-1': { subject: 'راحة واستراحة', topic: 'فترة ترفيهية وراحة عائلية', type: 'rest', status: 'completed', teacher: '', room: '', color: '#ECFDF5', effort: 'easy', notes: 'شحن الطاقة الذهنية ليوم مذاكرة رائع.' },
      '0-2': { subject: 'الرياضيات', topic: 'الفصل الأول: العمليات على الأعداد المركبة', type: 'review', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: SUBJECT_COLORS[1].hexBg, effort: 'hard', notes: 'حل المسائل والتمارين المرافقة للدرس.' },
      
      // السبت (Saturday)
      '1-0': { subject: 'الفيزياء', topic: 'الفصل الأول: المتسعة المنفردة وشحنها', type: 'study', status: 'upcoming', teacher: 'أ. همام السعدي', room: 'مختبر الفيزياء', color: SUBJECT_COLORS[2].hexBg, effort: 'medium' },
      '1-1': { subject: 'الكيمياء', topic: 'الفصل الأول: علم الثرموداينمك والمصطلحات', type: 'study', status: 'upcoming', teacher: 'أ. ليث المشهداني', room: 'مختبر الكيمياء', color: SUBJECT_COLORS[3].hexBg, effort: 'medium' },
      '1-2': { subject: 'الرياضيات', topic: 'تمارين 1-1 الأعداد المركبة', type: 'solve', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: SUBJECT_COLORS[1].hexBg, effort: 'hard' },

      // الأحد (Sunday)
      '2-0': { subject: 'اللغة العربية', topic: 'أسلوب الاستفهام - أدوات الاستفهام وركائزها', type: 'study', status: 'upcoming', teacher: 'أ. طه التميمي', room: 'قاعة ابن جني', color: SUBJECT_COLORS[0].hexBg, effort: 'medium' },
      '2-1': { subject: 'اللغة الإنكليزية', topic: 'الوحدة الأولى: القواعد وربط الأزمنة', type: 'study', status: 'upcoming', teacher: 'أ. رعد السهيل', room: 'القاعة الإنكليزية', color: SUBJECT_COLORS[4].hexBg, effort: 'medium' },
      '2-2': { subject: 'الأحياء', topic: 'الفصل الأول: الخلية ومكوناتها', type: 'study', status: 'upcoming', teacher: 'د. سرمد الجبوري', room: 'مختبر الأحياء', color: SUBJECT_COLORS[6].hexBg, effort: 'medium' },

      // الاثنين (Monday)
      '3-0': { subject: 'الفيزياء', topic: 'المتسعات على التوازي والربط المختلط', type: 'study', status: 'upcoming', teacher: 'أ. همام السعدي', room: 'مختبر الفيزياء', color: SUBJECT_COLORS[2].hexBg, effort: 'medium' },
      '3-1': { subject: 'الكيمياء', topic: 'قانون هيس وحساب انثالبي التفاعل', type: 'review', status: 'upcoming', teacher: 'أ. ليث المشهداني', room: 'مختبر الكيمياء', color: SUBJECT_COLORS[3].hexBg, effort: 'hard' },
      '3-2': { subject: 'اللغة العربية', topic: 'إعراب أسماء الاستفهام (من وما)', type: 'solve', status: 'upcoming', teacher: 'أ. طه التميمي', room: 'قاعة ابن جني', color: SUBJECT_COLORS[0].hexBg, effort: 'hard' },

      // الثلاثاء (Tuesday)
      '4-0': { subject: 'الرياضيات', topic: 'القطع المكافئ وبؤرته ودليله', type: 'study', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: SUBJECT_COLORS[1].hexBg, effort: 'medium' },
      '4-1': { subject: 'الأحياء', topic: 'الإنقسام الخيطي والاختزالي للخلية', type: 'review', status: 'upcoming', teacher: 'د. سرمد الجبوري', room: 'مختبر الأحياء', color: SUBJECT_COLORS[6].hexBg, effort: 'medium' },
      '4-2': { subject: 'التربية الإسلامية', topic: 'شرح الحديث النبوي الشريف في التعاون', type: 'study', status: 'upcoming', teacher: 'أ. جاسم الحسني', room: 'القاعة الكبرى', color: SUBJECT_COLORS[5].hexBg, effort: 'easy' },

      // الأربعاء (Wednesday)
      '5-0': { subject: 'الفيزياء', topic: 'وزاريات المتسعات وحل الأفكار الوزارية الإثرائية', type: 'ministerial', status: 'upcoming', teacher: 'أ. همام السعدي', room: 'مختبر الفيزياء', color: SUBJECT_COLORS[2].hexBg, effort: 'hard' },
      '5-1': { subject: 'اللغة الإنكليزية', topic: 'قطع الكتاب الاستيعابية وقصة زيد طارق', type: 'study', status: 'upcoming', teacher: 'أ. رعد السهيل', room: 'القاعة الإنكليزية', color: SUBJECT_COLORS[4].hexBg, effort: 'medium' },
      '5-2': { subject: 'الكيمياء', topic: 'علاقة كيبس وتطبيقاتها في التفاعلات تلقائية الذات', type: 'review', status: 'upcoming', teacher: 'أ. ليث المشهداني', room: 'مختبر الكيمياء', color: SUBJECT_COLORS[3].hexBg, effort: 'hard' },

      // الخميس (Thursday)
      '6-0': { subject: 'الرياضيات', topic: 'وزاريات الأعداد المركبة وحل الأسئلة المكررة', type: 'ministerial', status: 'upcoming', teacher: 'أ. علي الخفاجي', room: 'قاعة الرياضيات', color: SUBJECT_COLORS[1].hexBg, effort: 'hard' },
      '6-1': { subject: 'اللغة العربية', topic: 'مراجعة أسبوعية مركزة لقواعد اللغة', type: 'review', status: 'upcoming', teacher: 'أ. طه التميمي', room: 'قاعة ابن جني', color: SUBJECT_COLORS[0].hexBg, effort: 'medium' },
      '6-2': { subject: 'الأحياء', topic: 'امتحان تجريبي شامل للباب الأول من الخلية', type: 'exam', status: 'upcoming', teacher: 'د. سرمد الجبوري', room: 'مختبر الأحياء', color: SUBJECT_COLORS[6].hexBg, effort: 'hard' }
    },
    notes: 'إرشادات تطبيق مدرسي: رتب طاولة مذاكرتك واحرص على الإضاءة المناسبة وجدد طاقتك بشرب الماء بانتظام وممارسة رياضة خفيفة.',
    completionRate: 15,
    adherenceRate: 100,
    studyHours: 35,
    completedCount: 2
  }
];
