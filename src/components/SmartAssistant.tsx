import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, ShieldCheck, HelpCircle, BookOpen, Clock, AlertTriangle, 
  Calendar, Check, X, Award, Flame, Zap, Compass, RotateCcw, Play
} from 'lucide-react';
import { Schedule, StudentProfile, ScheduleCell } from '../types';
import { SUBJECTS_BY_GRADE } from '../constants/subjects';
import { generateRevisionPlan } from '../utils/generators';

interface Message {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  // Options if the message is a prompt/question
  options?: { label: string; value: string; action?: () => void }[];
  // If the assistant generates a schedule preview
  suggestedSchedule?: Schedule;
  type?: 'text' | 'emergency_form' | 'analysis' | 'suggestion';
}

interface SmartAssistantProps {
  activeSchedule: Schedule | null;
  studentProfile: StudentProfile | null;
  schedules: Schedule[];
  onAddSchedule: (schedule: Schedule) => void;
  onUpdateSchedule: (fields: Partial<Schedule>) => void;
  isOpenAsModal?: boolean;
  onCloseModal?: () => void;
  initialCommand?: string; // command triggered from external buttons
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({
  activeSchedule,
  studentProfile,
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  isOpenAsModal = false,
  onCloseModal,
  initialCommand
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local toast alert state
  const [localToast, setLocalToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => {
      setLocalToast(null);
    }, 3500);
  };

  // Emergency Plan State
  const [emergencyStep, setEmergencyStep] = useState<number>(0); // 0 = inactive, 1..7 steps
  const [emergencyData, setEmergencyData] = useState({
    subject: '',
    examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    readiness: 50, // %
    lessonsUncompleted: 12,
    studyHours: 4,
    restDays: [] as string[],
    focusStyle: 'balanced' // balanced, review, ministerial
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load initial welcome message & handle external command triggers
  useEffect(() => {
    const studentName = studentProfile?.studentName || 'يا بطل';
    const initialWelcomeText = `أهلاً بك ${studentName} في **المساعد الذكي لتنظيم الدراسة** 🌟!
أنا مستشارك المحلي الخاص لمساعدتك في تفريغ الضغط، ترتيب دروسك، وبناء خطط المراجعة والطوارئ مجاناً بالكامل دون الحاجة للاتصال بالإنترنت.

بصفتي مستشارك، كيف يمكنني مساعدتك اليوم؟ اختر أحد الخيارات السريعة أدناه أو اكتب سؤالك:`;

    const welcomeMsg: Message = {
      id: 'welcome',
      sender: 'assistant',
      text: initialWelcomeText,
      timestamp: formatTime(new Date()),
      options: [
        { label: '🔍 ماذا يجب أن أدرس الآن؟', value: 'study_now' },
        { label: '📊 تحليل ومراجعة جدولي النشط', value: 'analyze_schedule' },
        { label: '🚨 بدء محاكاة خطة طوارئ الامتحان', value: 'start_emergency' },
        { label: '💡 نصائح للتفوق في البكالوريا', value: 'baccalaureate_tips' }
      ]
    };

    setMessages([welcomeMsg]);

    if (initialCommand) {
      handleOptionClick(initialCommand);
    }
  }, [initialCommand, studentProfile]);

  const formatTime = (date: Date): string => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  const simulateAssistantResponse = (userText: string, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      let replyText = '';
      let options: Message['options'] = undefined;
      let suggestedSchedule: Schedule | undefined = undefined;

      const cleaned = userText.toLowerCase().trim();

      if (cleaned.includes('study_now') || cleaned.includes('ماذا يجب أن أدرس') || cleaned.includes('دراسة الان')) {
        replyText = getStudyNowRecommendation();
      } else if (cleaned.includes('analyze_schedule') || cleaned.includes('تحليل') || cleaned.includes('حلّل')) {
        replyText = getScheduleAnalysis();
        options = [
          { label: '🚨 خطة طوارئ سريعة', value: 'start_emergency' },
          { label: '📅 اقتراح جدول جديد', value: 'suggest_new' }
        ];
      } else if (cleaned.includes('start_emergency') || cleaned.includes('طوارئ') || cleaned.includes('طوارئ الامتحان')) {
        startEmergencySimulator();
        return; // handle simulator logic separately
      } else if (cleaned.includes('baccalaureate_tips') || cleaned.includes('نصائح') || cleaned.includes('بكالوريا')) {
        replyText = getBaccalaureateTips();
      } else if (cleaned.includes('كيمياء') || cleaned.includes('فيزياء') || cleaned.includes('رياضيات') || cleaned.includes('مادة')) {
        replyText = `فهمت اهتمامك بالمواد الأساسية! يمكنك ربط أي درس من هذه المواد مباشرة من **شجرة المنهج** بجدولك النشط، أو تفعيل **خطة الطوارئ** لجدولة المادة وضمان مراجعتها بالكامل قبل موعد الامتحان بأيام.`;
        options = [
          { label: '🚨 تنظيم خطة طوارئ للمادة', value: 'start_emergency' }
        ];
      } else {
        // Fallback friendly reply
        replyText = `أهلاً بك! لقد استمعت لطلبك بعناية. بصفتي مساعداً محلياً ذكياً، قمت بتحليل دراستك لصف **${studentProfile?.gradeClass || 'السادس العلمي'}**. 

أوصيك بالنقر على أحد الأزرار السريعة لتوليد جداول دراسية فورية أو الاستعلام عما يتوجب عليك دراسته في هذه الساعة المحددة.`;
        options = [
          { label: '🔍 ماذا يجب أن أدرس الآن؟', value: 'study_now' },
          { label: '📊 تحليل ومراجعة جدولي', value: 'analyze_schedule' },
          { label: '🚨 محاكاة خطة الطوارئ', value: 'start_emergency' }
        ];
      }

      setMessages(prev => [...prev, {
        id: `reply-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: formatTime(new Date()),
        options,
        suggestedSchedule
      }]);
    }, delay);
  };

  // RECOMMENDATION: What to study right now
  const getStudyNowRecommendation = (): string => {
    if (!activeSchedule) return 'لم يتم تفعيل أي جدول دراسي حالياً لتحديد الدروس المقررة.';

    // Get current day of the week in Arabic
    const todayNum = new Date().getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    // Map standard JS day (0-6) to Iraqi Days
    // IRAQI_DAYS: ['الجمعة', 'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
    const jsDayToIraqiMap: Record<number, string> = {
      5: 'الجمعة',
      6: 'السبت',
      0: 'الأحد',
      1: 'الاثنين',
      2: 'الثلاثاء',
      3: 'الأربعاء',
      4: 'الخميس'
    };
    const currentIraqiDay = jsDayToIraqiMap[todayNum];
    const dayIdx = activeSchedule.days.indexOf(currentIraqiDay);

    if (dayIdx === -1) {
      return `اليوم هو **${currentIraqiDay}**، وبناءً على جدولك الحالي، هذا اليوم غير مدرج في أيام دراستك النشطة. إنها فرصة ممتازة للراحة وتجديد النشاط!`;
    }

    // Check current time of day
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentPeriodIdx = -1;
    let nextPeriodIdx = -1;

    activeSchedule.lessonTimes.forEach((time, idx) => {
      const [sh, sm] = time.start.split(':').map(Number);
      const [eh, em] = time.end.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;

      if (currentMinutes >= startMins && currentMinutes <= endMins) {
        currentPeriodIdx = idx;
      } else if (currentMinutes < startMins && nextPeriodIdx === -1) {
        nextPeriodIdx = idx;
      }
    });

    if (currentPeriodIdx !== -1) {
      const cellKey = `${dayIdx}-${currentPeriodIdx}`;
      const cell = activeSchedule.cells[cellKey];
      if (cell && cell.subject) {
        return `⏰ **أنت الآن في وقت "${activeSchedule.lessons[currentPeriodIdx]}" (${activeSchedule.lessonTimes[currentPeriodIdx].start} - ${activeSchedule.lessonTimes[currentPeriodIdx].end})**:
يتوجب عليك حالياً مذاكرة مادة: **${cell.subject}**
الهدف الدراسي الحالي: *${cell.topic || 'مراجعة عامة للمادة'}*
💡 *إرشاد تطبيق مدرسي:* خذ نفساً عميقاً، ضع هاتفك على الصامت، وابدأ الآن بتركيز تام!`;
      } else {
        return `⏰ **أنت في وقت "${activeSchedule.lessons[currentPeriodIdx]}"**، لكن لا توجد مادة مجدولة في هذه الخانة بعد. بإمكانك استغلال الوقت في مراجعة سريعة لمادة تشعر بضعف فيها!`;
      }
    }

    if (nextPeriodIdx !== -1) {
      const cellKey = `${dayIdx}-${nextPeriodIdx}`;
      const cell = activeSchedule.cells[cellKey];
      if (cell && cell.subject) {
        return `📅 **الدرس الدراسي القادم لليوم هو "${activeSchedule.lessons[nextPeriodIdx]}"** ويبدأ في تمام الساعة **${activeSchedule.lessonTimes[nextPeriodIdx].start}**:
المادة المقررة: **${cell.subject}**
التحضير المطلوب: *${cell.topic || 'عام'}*
استعد جيداً وجهز دفاترك وأقلامك مسبقاً للتفوق والريادة!`;
      }
    }

    return `اليوم هو **${currentIraqiDay}**. لقد انتهت جميع الدروس المجدولة المقررة لهذا اليوم في جدولك النشط!
معدل إنجاز جدولك اليوم هو **${activeSchedule.completionRate || 0}%**. عمل رائع جداً، ننصحك بأخذ قسط من الراحة والنوم مبكراً.`;
  };

  // ANALYSIS: Schedule diagnostic helper
  const getScheduleAnalysis = (): string => {
    if (!activeSchedule) return 'لم تعثر على جدول دراسي نشط لتحليله حالياً.';

    const cellsList = Object.values(activeSchedule.cells) as ScheduleCell[];
    const studyLessons = cellsList.filter(c => c.subject && c.type !== 'rest');
    const completedLessons = cellsList.filter(c => c.status === 'completed');
    const delayedLessons = cellsList.filter(c => c.status === 'delayed');
    
    let analysis = `📊 **تقرير تحليل وتشخيص جدولي الذكي ("${activeSchedule.scheduleName}")**:
• **عدد مواد المذاكرة النشطة:** ${studyLessons.length} درس دراسي.
• **معدل الإنجاز الحالي لجدولك:** ${activeSchedule.completionRate || 0}% 📈.
• **ساعات المذاكرة الكلية المقدرة:** ${activeSchedule.studyHours || 0} ساعة.

🔍 **التوصيات الذكية لتطبيق مدرسي:**\n`;

    if (activeSchedule.completionRate && activeSchedule.completionRate < 30) {
      analysis += `⚠️ *تنبيه:* معدل إنجازك منخفض حالياً (${activeSchedule.completionRate}%). واجه التحديات، وابدأ بتسجيل الدروس كـ "مكتملة" لتحفيز نفسك يومياً.\n`;
    } else {
      analysis += `✨ *إشادة:* وتيرة تقدمك رائعة ومثيرة للاهتمام، استمر على هذا المنوال!\n`;
    }

    if (delayedLessons.length > 0) {
      analysis += `⚠️ *تنبيه:* لديك (${delayedLessons.length}) دروس مسجلة كـ "متأخرة". ننصحك باستخدام **مساعد الطوارئ** لضغط هذه الدروس وجدولتها مجدداً لتفادي التراكم.\n`;
    }

    // Check balance
    const subjectCounts: Record<string, number> = {};
    studyLessons.forEach(c => {
      subjectCounts[c.subject] = (subjectCounts[c.subject] || 0) + 1;
    });

    const subjectsKeys = Object.keys(subjectCounts);
    if (subjectsKeys.length > 0) {
      const highest = subjectsKeys.reduce((a, b) => subjectCounts[a] > subjectCounts[b] ? a : b);
      const lowest = subjectsKeys.reduce((a, b) => subjectCounts[a] < subjectCounts[b] ? a : b);
      if (subjectCounts[highest] > subjectCounts[lowest] + 3) {
        analysis += `⚖️ *خلل توازن:* هناك تركيز مكثف على مادة (${highest}) بمعدل (${subjectCounts[highest]} حصص) مقابل ضعف في جدولة مادة (${lowest}) بمعدل (${subjectCounts[lowest]} حصص). نقترح موازنة الجدول الدراسي قليلاً لضمان تغطية كافة مناهج البكالوريا.\n`;
      }
    }

    analysis += `\n*تطبيق مدرسي يضمن لك مستقبلاً دراسياً مشرقاً ومنظماً بالكامل.*`;
    return analysis;
  };

  // TIPS
  const getBaccalaureateTips = (): string => {
    return `💡 **إرشادات وتوصيات ذهبية لطلبة البكالوريا والصفوف المنتهية في العراق:**
١. **الدراسة من الوزاريات:** ٧٠٪ إلى ٨٠٪ من أسئلة الامتحانات الوزارية تتكرر أفكارها من السنوات السابقة. احرص على تفعيل خانة "وزاريات" في جدول تطبيق مدرسي وحل الدفاتر السابقة بانتظام.
٢. **أوقات المذاكرة الذهبية:** الذاكرة تكون في أعلى مستويات نشاطها بعد صلاة الفجر ومبكراً في الصباح. تجنب السهر الطويل لأنه يقلل من جودة الاستيعاب بنسبة ٤٠٪.
٣. **تقنية الطماطم (المنظمة):** ادرس لمدة ٤٥ دقيقة بتركيز، ثم خذ استراحة لمدة ١٠-١٥ دقيقة لإنعاش الخلايا العصبية.
٤. **جدول الطوارئ للامتحانات:** إذا اقترب موعد الامتحان ولديك تراكم، لا تصب بالقلق. فعّل **مساعد خطة الطوارئ** فوراً لنقوم بحساب الساعات وتوزيع الفصول المتبقية بالتساوي وتغطية الأساسيات المضمونة بالبكالوريا.`;
  };

  // 🚨 MULTI-TURN EMERGENCY PLAN SIMULATOR
  const startEmergencySimulator = () => {
    setEmergencyStep(1);
    const newMsg: Message = {
      id: `emergency-step-1-${Date.now()}`,
      sender: 'assistant',
      text: `🚨 **مرحباً بك في محاكي ومخطط خطة الطوارئ للامتحانات!**
سأطرح عليك أسئلة بسيطة خطوة بخطوة، ثم أقوم بحساب متبقي الساعات وتوليد جدول دراسي مكثف حقيقي مناسب لحالتك لإنقاذ الموقف ودخول الامتحان بجاهزية تامة.

**السؤال الأول:** ما هي المادة الدراسية التي تواجه طوارئ في امتحانها القادم وترغب في إنقاذها؟`,
      timestamp: formatTime(new Date()),
      options: [
        { label: '🧪 الكيمياء', value: 'CHEM' },
        { label: '⚡ الفيزياء', value: 'PHYS' },
        { label: '📐 الرياضيات', value: 'MATH' },
        { label: '📝 اللغة العربية', value: 'ARAB' },
        { label: '📚 مادة مخصصة أخرى', value: 'OTHER_SUB' }
      ]
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleEmergencyStepAnswer = (value: string, labelText: string) => {
    // Save user answer in user chat log
    const userMsg: Message = {
      id: `user-ans-${Date.now()}`,
      sender: 'user',
      text: labelText,
      timestamp: formatTime(new Date())
    };
    setMessages(prev => [...prev, userMsg]);

    const nextStep = emergencyStep + 1;
    setEmergencyStep(nextStep);

    let nextText = '';
    let options: Message['options'] = undefined;
    let type: Message['type'] = 'text';

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      if (nextStep === 2) {
        // We got the subject. Save it.
        const subjectName = value === 'CHEM' ? 'الكيمياء' : value === 'PHYS' ? 'الفيزياء' : value === 'MATH' ? 'الرياضيات' : value === 'ARAB' ? 'اللغة العربية' : 'مادة الطوارئ';
        setEmergencyData(prev => ({ ...prev, subject: subjectName }));

        nextText = `📝 ممتاز، تم اختيار مادة **${subjectName}**.
        
**السؤال الثاني:** متى يصادف موعد امتحان هذه المادة؟ (يرجى اختيار التاريخ)`;
        type = 'emergency_form';
      } else if (nextStep === 3) {
        // We got date from form. Now ask about readiness
        nextText = `📊 **السؤال الثالث:** ما هو تقييمك لمستوى جاهزيتك وفهمك الحالي للمادة من ١٠٠٪؟`;
        options = [
          { label: '🔴 ضعيف جداً (تراكم كامل) ٠-٣٠٪', value: '30' },
          { label: '🟡 متوسط (أحتاج لمراجعة وحل) ٣٠-٧٠٪', value: '60' },
          { label: '🟢 جيد جداً (أحتاج فقط لوزاريات) ٧٠-١٠٠٪', value: '85' }
        ];
      } else if (nextStep === 4) {
        // We got readiness. Save.
        setEmergencyData(prev => ({ ...prev, readiness: Number(value) }));

        nextText = `📚 **السؤال الرابع:** كم عدد الدروس أو الأبواب/الفصول المتبقية التي لم تقم بإنهاء دراستها بعد؟`;
        options = [
          { label: '📖 ٣ فصول أو أقل (متبقي بسيط)', value: '6' },
          { label: '📖 ٤ إلى ٦ فصول (تراكم متوسط)', value: '12' },
          { label: '📖 أكثر من ٦ فصول (تراكم كبير جداً)', value: '18' }
        ];
      } else if (nextStep === 5) {
        // We got uncompleted. Save.
        setEmergencyData(prev => ({ ...prev, lessonsUncompleted: Number(value) }));

        nextText = `⚡ **السؤال الخامس:** كم عدد الساعات اليومية التي تستطيع تخصيصها للمذاكرة المكثفة حالياً؟`;
        options = [
          { label: '🕓 ٣ ساعات يومياً (خطة مخففة)', value: '3' },
          { label: '🕕 ٥ ساعات يومياً (خطة متوازنة)', value: '5' },
          { label: '🕗 ٨ ساعات يومياً (خطة مكثفة جداً للمحترفين)', value: '8' }
        ];
      } else if (nextStep === 6) {
        // We got hours. Save.
        setEmergencyData(prev => ({ ...prev, studyHours: Number(value) }));

        nextText = `⚖️ **السؤال السادس:** ما هو الأسلوب وطريقة التركيز التي تفضلها في خطة الطوارئ؟`;
        options = [
          { label: '🎯 تركيز وزاري (حل الدفاتر والأسئلة الوزارية فقط)', value: 'ministerial' },
          { label: '🧠 تركيز متوازن (دراسة مفاهيم + حل وزاريات)', value: 'balanced' },
          { label: '📖 مراجعة نظرية سريعة وتلخيصات', value: 'review' }
        ];
      } else if (nextStep === 7) {
        // We got style. Save and Generate the actual plan!
        const focusStyle = value;
        setEmergencyData(prev => ({ ...prev, focusStyle }));

        // Now calculate and generate the schedule!
        generateAndShowEmergencyPlan({ ...emergencyData, focusStyle });
        return; // handle final step separately
      }

      setMessages(prev => [...prev, {
        id: `emergency-step-${nextStep}-${Date.now()}`,
        sender: 'assistant',
        text: nextText,
        options,
        type
      }]);
    }, 600);
  };

  const generateAndShowEmergencyPlan = (data: typeof emergencyData) => {
    const today = new Date();
    const exam = new Date(data.examDate);
    const diffTime = exam.getTime() - today.getTime();
    const remainingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalStudyHours = remainingDays * data.studyHours;

    // Build the schedule objects
    const startStr = today.toISOString().split('T')[0];
    const endStr = data.examDate;

    // Generate revision plan with generators
    const generated = generateRevisionPlan(
      `خطة طوارئ إنقاذ - مادة ${data.subject}`,
      startStr,
      endStr,
      [data.subject, 'وزاريات الكيمياء', 'مراجعة مركزة', 'استراحة'],
      data.studyHours > 5 ? 5 : 4,
      50, // mins duration
      'خطة طوارئ مكثفة',
      studentProfile?.studentName || 'البطل',
      studentProfile?.gradeClass || 'عام',
      studentProfile?.stage || 'preparatory'
    );

    // Customize the notes field specifically for this student
    generated.notes = `خطة إنقاذ مخصصة لمادة ${data.subject}. المتبقي للامتحان: ${remainingDays} أيام بمعدل ${data.studyHours} ساعات دراسة يومياً. إجمالي المذاكرة المتوقع: ${totalStudyHours} ساعة لتغطية ${data.lessonsUncompleted} فصول متبقية بنجاح.`;

    const nextText = `🏁 **اكتملت المحاكاة وحساب الخطة بنجاح!**
بناءً على حسابات تطبيق مدرسي الذكي لظروفك الاستثنائية:
• **الأيام المتبقية للامتحان:** ${remainingDays} أيام.
• **إجمالي ساعات المذاكرة المتوفرة لك:** **${totalStudyHours} ساعة فعالة**.
• **كثافة الخطة:** ${remainingDays < 3 ? '🔴 طوارئ قصوى (حرجة جداً!)' : remainingDays < 6 ? '🟡 طوارئ متوسطة (مقبولة)' : '🟢 خطة مريحة جداً بالتساوي'}.

💡 **مقترح تطبيق مدرسي:** تم توليد جدول دراسي مكثف متكامل ومنظم في شبكة الجدول الرسمية ومقسم كدروس تفصيلية. 
مرفق أدناه المعاينة المباشرة للخطة المقترحة. هل ترغب في **تأكيد وحفظ** هذا الجدول ليحل كجدول نشط وتتمكن من تتبعه وإنجازه فوراً؟`;

    setMessages(prev => [...prev, {
      id: `emergency-result-${Date.now()}`,
      sender: 'assistant',
      text: nextText,
      suggestedSchedule: generated,
      options: [
        {
          label: '✅ تأكيد وتطبيق خطة الطوارئ في جهازي',
          value: 'CONFIRM_PLAN',
          action: () => {
            onAddSchedule(generated);
            setEmergencyStep(0);
            showToast('🎉 تم تفعيل وتطبيق جدول خطة الطوارئ كجدول نشط بنجاح!');
            setMessages(prev => [...prev, {
              id: `confirm-reply-${Date.now()}`,
              sender: 'assistant',
              text: `🎉 **ألف مبروك!** تم تثبيت وتفعيل **"${generated.scheduleName}"** كجدولك النشط المعتمد الآن بنجاح!
              
بإمكانك الرجوع إلى **الجدول الدراسي التفاعلي** للبدء بتتبع الدروس وإكمالها بلمسة واحدة لضمان التفوق والدرجة الكاملة بالبكالوريا بإذن الله 🩺📐.`,
              timestamp: formatTime(new Date())
            }]);
          }
        },
        {
          label: '❌ إلغاء وتجاهل المقترح',
          value: 'CANCEL_PLAN',
          action: () => {
            setEmergencyStep(0);
            showToast('تم إلغاء خطة الطوارئ بنجاح.');
            setMessages(prev => [...prev, {
              id: `cancel-reply-${Date.now()}`,
              sender: 'assistant',
              text: `تم إلغاء مقترح خطة الطوارئ. كيف يمكنني مساعدتك مجدداً؟`,
              timestamp: formatTime(new Date()),
              options: [
                { label: '📊 تحليل ومراجعة جدولي', value: 'analyze_schedule' },
                { label: '🔍 ماذا يجب أن أدرس الآن؟', value: 'study_now' }
              ]
            }]);
          }
        }
      ]
    }]);
  };

  // 8. SEND INPUT ACTION
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    // Add user message to log
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: formatTime(new Date())
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    
    // Simulate thinking and replying
    simulateAssistantResponse(userText);
  };

  const handleOptionClick = (value: string, labelText?: string) => {
    // If there's a custom handler action on options
    // Find option in recent messages with matching value to run the action
    let handled = false;
    messages.forEach(m => {
      if (m.options) {
        const found = m.options.find(o => o.value === value);
        if (found && found.action) {
          found.action();
          handled = true;
        }
      }
    });

    if (handled) return;

    const userLabel = labelText || value;
    const userMsg: Message = {
      id: `user-opt-${Date.now()}`,
      sender: 'user',
      text: userLabel,
      timestamp: formatTime(new Date())
    };

    setMessages(prev => [...prev, userMsg]);

    if (emergencyStep > 0) {
      handleEmergencyStepAnswer(value, userLabel);
    } else {
      simulateAssistantResponse(value, 800);
    }
  };

  return (
    <div className={`flex flex-col bg-white border border-[#D9D3F0] rounded-3xl overflow-hidden shadow-sm transition-shadow hover:shadow ${isOpenAsModal ? 'h-[85vh] w-full max-w-3xl' : 'h-[620px]'} relative`}>
      
      {/* Toast alert banner */}
      {localToast && (
        <div className="absolute top-14 left-4 right-4 z-50 bg-emerald-600 text-white p-3 rounded-xl shadow-lg text-xs font-bold text-center animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2">
          <span>{localToast}</span>
        </div>
      )}

      {/* Title bar */}
      <div className="bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm sm:text-base font-sans"># المساعد الذكي لتنظيم الدراسة</h3>
            <p className="text-[10px] text-purple-200">مستشارك المحلي الذكي • مجاني • أوفلاين بالكامل 🛡️</p>
          </div>
        </div>
        
        {isOpenAsModal && onCloseModal && (
          <button 
            onClick={onCloseModal}
            className="p-1 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-bold"
          >
            إغلاق المساعد
          </button>
        )}
      </div>

      {/* Messages layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col space-y-1.5 max-w-[85%] ${isAssistant ? 'self-start mr-0 ml-auto' : 'self-end mr-auto ml-0'}`}
              style={{ direction: 'rtl' }}
            >
              {/* Message text block */}
              <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                isAssistant 
                  ? 'bg-white text-[#1D2433] border border-[#D9D3F0] rounded-tr-none' 
                  : 'bg-[#5B2596] text-white rounded-tl-none font-semibold'
              }`}>
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Optional Custom Form rendering for Step 2 Date Picker */}
                {msg.type === 'emergency_form' && emergencyStep === 2 && (
                  <div className="mt-4 p-3 bg-slate-50 border border-gray-100 rounded-xl space-y-3">
                    <label className="block text-[10px] font-black text-[#3E176D]">تاريخ الامتحان المستهدف</label>
                    <input
                      type="date"
                      value={emergencyData.examDate}
                      onChange={(e) => setEmergencyData({ ...emergencyData, examDate: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white text-[#1D2433] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleEmergencyStepAnswer(emergencyData.examDate, `تاريخ الامتحان هو ${emergencyData.examDate}`)}
                      className="w-full py-2 bg-[#5B2596] hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      تأكيد التاريخ والمتابعة
                    </button>
                  </div>
                )}

                {/* If assistant suggested a schedule layout, render a beautiful preview */}
                {msg.suggestedSchedule && (
                  <div className="mt-4 border border-dashed border-[#5B2596]/30 rounded-2xl bg-[#F5F3FF]/40 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-gray-100 pb-2">
                      <span className="text-[#3E176D]">{msg.suggestedSchedule.scheduleName}</span>
                      <span className="bg-[#E9E6FA] text-[#3E176D] px-2 py-0.5 rounded text-[10px]">{msg.suggestedSchedule.scheduleType}</span>
                    </div>

                    <div className="text-[10px] text-[#687084] space-y-1">
                      <div>🗓️ **الأيام النشطة:** الجمعة إلى الخميس (شاملة)</div>
                      <div>⏱️ **الدروس المجدولة:** {msg.suggestedSchedule.lessons.length} فترات دراسية يومية</div>
                      <div>💡 **إرشاد الخطة:** {msg.suggestedSchedule.notes}</div>
                    </div>

                    {/* Small visual of the generated slots */}
                    <div className="grid grid-cols-4 gap-1 text-[8px] font-bold text-center">
                      {msg.suggestedSchedule.days.slice(0, 4).map((day) => (
                        <div key={day} className="bg-white p-1 rounded border border-gray-100">
                          <span className="text-[#3E176D] block border-b border-gray-100 mb-1 pb-0.5">{day}</span>
                          <span className="text-emerald-700">مذاكرة مكثفة</span>
                        </div>
                      ))}
                      <div className="bg-indigo-50 p-1 rounded text-[#5B2596] col-span-4 text-center mt-1 text-[9px]">
                        + وسيتم تثبيت بقية فترات الراحة والأيام تلقائياً لتفادي الإجهاد.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Options buttons if available */}
              {msg.options && msg.options.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleOptionClick(opt.value, opt.label)}
                      className="px-3 py-1.5 bg-[#E9E6FA] hover:bg-[#D9D3F0] text-[#3E176D] border border-[#D9D3F0]/60 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[9px] text-[#687084] px-1">{msg.timestamp}</span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1.5 self-start bg-white border border-[#D9D3F0] p-3 rounded-2xl text-xs text-[#687084] font-medium animate-pulse">
            <Zap className="w-3.5 h-3.5 text-[#5B2596] shrink-0 animate-bounce" />
            <span>جاري تحليل البيانات وصياغة الرد المخصص...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="no-print bg-white p-3 border-t border-[#D9D3F0] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب رسالتك للمستشار هنا... (مثال: ماذا أدرس الآن؟)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#D9D3F0] text-xs sm:text-sm focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] outline-none"
        />
        <button
          type="submit"
          className="p-2.5 bg-gradient-to-r from-[#3E176D] to-[#7641B4] hover:opacity-95 text-white rounded-xl transition-all cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4 shrink-0" />
        </button>
      </form>

    </div>
  );
};
