import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, ShieldCheck, HelpCircle, BookOpen, Clock, AlertTriangle, 
  Calendar, Check, X, Award, Flame, Zap, Compass, RotateCcw, Play
} from 'lucide-react';
import { Schedule, StudentProfile, ScheduleCell, IRAQI_DAYS } from '../types';
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
    // Initialize temporary state for emergency questions
    setEmergencyData({
      studentName: studentProfile?.studentName || '',
      stageAndGrade: studentProfile?.gradeClass || '',
      examSubjectsCount: 5,
      subject: '',
      startDate: new Date().toISOString().split('T')[0],
      examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remainingDays: 5,
      studyHours: 8,
      restHours: 8,
      readinessRating: 'متوسط', // ممتاز، جيد جداً، متوسط، ضعيف
    });

    const newMsg: Message = {
      id: `emergency-step-1-${Date.now()}`,
      sender: 'assistant',
      text: `🚨 **مرحباً بك في محاكي ومخطط خطة الطوارئ للامتحانات!**
سأطرح عليك **10 أسئلة** مرتبة بدقة لمساعدتنا على حساب ساعاتك المتاحة وحجم المادة وتوليد جدول زمني حقيقي وفعال ينقذ الموقف.

**السؤال الأول:** ما هو اسمك الثلاثي ولقبك الكريم؟`,
      timestamp: formatTime(new Date()),
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
        // Step 1 input was studentName
        setEmergencyData(prev => ({ ...prev, studentName: value }));
        nextText = `📝 تشرّفنا بك يا بطل **${value}**.

**السؤال الثاني:** ما هي مرحلتك وصفك الدراسي الحالي؟`;
        options = [
          { label: 'السادس العلمي (منتهي 🎓)', value: 'السادس العلمي' },
          { label: 'السادس الأدبي (منتهي 🎓)', value: 'السادس الأدبي' },
          { label: 'الثالث المتوسط (منتهي 🎓)', value: 'الثالث المتوسط' },
          { label: 'السادس الابتدائي (منتهي 🎓)', value: 'السادس الابتدائي' },
          { label: 'صف آخر غير منتهي', value: 'صف غير منتهي' }
        ];
      } else if (nextStep === 3) {
        // Step 2 input was stageAndGrade
        setEmergencyData(prev => ({ ...prev, stageAndGrade: value }));
        nextText = `📚 رائع جداً، الله يوفقك في صفك **${value}**.

**السؤال الثالث:** ما هو عدد مواد الامتحان التي تستعد لها في هذا الدور الدراسي؟`;
        options = [
          { label: '٤ مواد', value: '4' },
          { label: '٥ مواد', value: '5' },
          { label: '٦ مواد', value: '6' },
          { label: '٧ مواد', value: '7' },
          { label: '٨ مواد', value: '8' }
        ];
      } else if (nextStep === 4) {
        // Step 3 input was examSubjectsCount
        setEmergencyData(prev => ({ ...prev, examSubjectsCount: Number(value) }));
        nextText = `⚠️ تمام، الاستعداد لـ (${value}) مواد يتطلب تنظيماً ذكياً.

**السؤال الرابع:** ما هي المادة الدراسية المتأخرة والحرجة التي ترغب في جدولتها فوراً وإنقاذها؟`;
        options = [
          { label: '🧪 الكيمياء', value: 'الكيمياء' },
          { label: '⚡ الفيزياء', value: 'الفيزياء' },
          { label: '📐 الرياضيات', value: 'الرياضيات' },
          { label: '📝 اللغة العربية', value: 'اللغة العربية' },
          { label: '🌍 الاجتماعيات / أخرى', value: 'الاجتماعيات' }
        ];
      } else if (nextStep === 5) {
        // Step 4 input was subject
        setEmergencyData(prev => ({ ...prev, subject: value }));
        nextText = `⏱️ اختيار موفق، سنركز جهودنا على إنقاذ مادة **${value}**.

**السؤال الخامس:** ما هو تاريخ بداية خطة الطوارئ والإنقاذ التي تود الانطلاق بها؟`;
        type = 'emergency_form'; // We will render date pickers below based on step
      } else if (nextStep === 6) {
        // Step 5 input was startDate
        setEmergencyData(prev => ({ ...prev, startDate: value }));
        nextText = `📅 ممتاز، تبدأ الخطة في تاريخ **${value}**.

**السؤال السادس:** ما هو تاريخ نهاية الخطة (تاريخ امتحان مادة ${emergencyData.subject} المتراكمة)؟`;
        type = 'emergency_form';
      } else if (nextStep === 7) {
        // Step 6 input was examDate
        const examDateVal = value;
        const start = new Date(emergencyData.startDate);
        const end = new Date(examDateVal);
        const diffTime = end.getTime() - start.getTime();
        const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        setEmergencyData(prev => ({ ...prev, examDate: examDateVal, remainingDays: calculatedDays }));

        nextText = `📅 تاريخ الامتحان هو **${examDateVal}**.
        
**السؤال السابع:** لقد قمت بحساب عدد الأيام الفعلية المتبقية تلقائياً ووجدتها **(${calculatedDays}) أيام**. هل تؤكد هذا الرقم أم تود تغييره يدوياً؟`;
        options = [
          { label: `✅ نعم، تأكيد (${calculatedDays}) أيام`, value: String(calculatedDays) },
          { label: '✏️ تعديل إلى ٣ أيام', value: '3' },
          { label: '✏️ تعديل إلى ٥ أيام', value: '5' },
          { label: '✏️ تعديل إلى ٧ أيام', value: '7' },
          { label: '✏️ تعديل إلى ١٠ أيام', value: '10' }
        ];
      } else if (nextStep === 8) {
        // Step 7 input was remainingDays
        setEmergencyData(prev => ({ ...prev, remainingDays: Number(value) }));
        nextText = `⚡ رائع، الخطة ممتدة على مدار **${value} أيام**.

**السؤال الثامن:** كم عدد الساعات اليومية التي تستطيع تخصيصها للمذاكرة الصارمة والمركزة حالياً؟`;
        options = [
          { label: '🕓 ٣ ساعات (خطة منقذة مخففة)', value: '3' },
          { label: '🕕 ٥ ساعات (خطة متوازنة جيدة)', value: '5' },
          { label: '🕗 ٨ ساعات (خطة طوارئ مكثفة للمتميزين)', value: '8' },
          { label: '🕛 ١٢ ساعة (خطة طوارئ قصوى وعالية الكثافة)', value: '12' }
        ];
      } else if (nextStep === 9) {
        // Step 8 input was studyHours
        setEmergencyData(prev => ({ ...prev, studyHours: Number(value) }));
        nextText = `🔋 ممتاز، تخصيص **${value} ساعات يومياً** للدراسة ممتاز.

**السؤال التاسع:** كم ساعة ترغب في تخصيصها للراحة والنوم لشحن طاقتك يومياً لكي نضمن توازنك؟`;
        options = [
          { label: '🛌 ٦ ساعات يومياً', value: '6' },
          { label: '🛌 ٨ ساعات يومياً (الخيار الصحي الموصى به)', value: '8' },
          { label: '🛌 ١٠ ساعات يومياً', value: '10' }
        ];
      } else if (nextStep === 10) {
        // Step 9 input was restHours
        setEmergencyData(prev => ({ ...prev, restHours: Number(value) }));
        nextText = `⚖️ رائع جداً، النوم والراحة الكافية هما أساس حفظ المعلومات.

**السؤال العاشر والأخير:** كيف تقيّم مستواك وفهمك الحالي الحالي في مادة **${emergencyData.subject}**؟`;
        options = [
          { label: '🟢 ممتاز (أحتاج فقط لوزاريات ودفاتر سابقة)', value: 'ممتاز' },
          { label: '🟡 جيد جداً (أحتاج للمراجعة وحل الوزاريات أساساً)', value: 'جيد جداً' },
          { label: '🟠 متوسط (أحتاج لدراسة المفاهيم وحل المسائل)', value: 'متوسط' },
          { label: '🔴 ضعيف (تراكم كبير وضيق شديد للوقت)', value: 'ضعيف' }
        ];
      } else if (nextStep === 11) {
        // Step 10 input was readinessRating
        const finalData = { ...emergencyData, readinessRating: value };
        setEmergencyData(finalData);

        // All 10 questions answered, generate and show final emergency plan
        generateAndShowEmergencyPlan(finalData);
        return;
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
    const totalStudyHours = data.remainingDays * data.studyHours;
    const isTerminal = ['السادس العلمي', 'السادس الأدبي', 'الثالث المتوسط', 'السادس الابتدائي'].includes(data.stageAndGrade);

    // Build unique tasks for each period based on terminal vs non-terminal
    // For terminal grades, we MUST alternate or include:
    // 1. "دراسة وفهم"
    // 2. "مراجعة وحل تمارين"
    // 3. "حل الوزاريات"
    // For non-terminal, just standard lesson types.
    const lessonsCount = data.studyHours > 8 ? 5 : data.studyHours > 5 ? 4 : 3;
    const lessonDuration = 50; // minutes

    const formatMinutes = (minutes: number): string => {
      const h = Math.floor(minutes / 60) % 24;
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // Let's create custom periods
    const lessons: string[] = [];
    const lessonTimes: { start: string; end: string }[] = [];
    const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];
    
    let currentStartMins = 8 * 60; // Start at 8:00 AM
    for (let l = 0; l < lessonsCount; l++) {
      lessons.push(`فترة الطوارئ ${ordinals[l] || (l + 1)}`);
      lessonTimes.push({
        start: formatMinutes(currentStartMins),
        end: formatMinutes(currentStartMins + lessonDuration)
      });
      currentStartMins += lessonDuration + 20; // 20 mins break
    }

    const cells: Record<string, ScheduleCell> = {};
    const taskCycleTerminal = [
      { label: 'دراسة وفهم', type: 'study' as const },
      { label: 'مراجعة وحل تمارين', type: 'review' as const },
      { label: 'حل الوزاريات والأسئلة السابقة', type: 'ministerial' as const }
    ];

    const taskCycleNonTerminal = [
      { label: 'مذاكرة المفاهيم الأساسية', type: 'study' as const },
      { label: 'حل الواجبات والتمارين الصعبة', type: 'homework' as const },
      { label: 'مراجعة وتلخيص الفصل', type: 'review' as const }
    ];

    // Generate revision plan with generators
    IRAQI_DAYS.forEach((day, dayIdx) => {
      for (let l = 0; l < lessonsCount; l++) {
        const cycleIdx = (dayIdx * lessonsCount + l) % 3;
        const taskObj = isTerminal ? taskCycleTerminal[cycleIdx] : taskCycleNonTerminal[cycleIdx];

        // Format date offset based on dayIndex
        const dateObj = new Date(data.startDate);
        dateObj.setDate(dateObj.getDate() + dayIdx);
        const dateStr = dateObj.toISOString().split('T')[0];

        cells[`${dayIdx}-${l}`] = {
          subject: data.subject,
          topic: `${taskObj.label} - المنهج المكثف`,
          type: taskObj.type,
          status: 'upcoming',
          color: '#E9E6FA', // Soft elegant lavender
          effort: l % 2 === 0 ? 'medium' : 'hard',
          notes: `خطة إنقاذ مادة ${data.subject} المعتمدة لـ ${data.studentName}.`
        };
      }
    });

    const generated: Schedule = {
      id: `emergency-plan-${Date.now()}`,
      studentName: data.studentName,
      gradeClass: data.stageAndGrade,
      stage: data.stageAndGrade.includes('الابتدائي') ? 'elementary' : data.stageAndGrade.includes('المتوسط') ? 'middle' : 'preparatory',
      scheduleName: `خطة طوارئ إنقاذ - مادة ${data.subject}`,
      scheduleType: 'خطة طوارئ معتمدة',
      timePeriod: `من ${data.startDate} إلى ${data.examDate}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      startDate: data.startDate,
      endDate: data.examDate,
      days: IRAQI_DAYS,
      lessons,
      lessonTimes,
      cells,
      notes: `خطة مخصصة لمادة ${data.subject} لإنقاذ الامتحان. الأيام المتاحة: ${data.remainingDays} أيام بمعدل ${data.studyHours} ساعات يومياً. إجمالي ساعات المذاكرة المتوقعة: ${totalStudyHours} ساعة. المستوى الحالي: ${data.readinessRating}.`,
      completionRate: 0,
      adherenceRate: 100,
      studyHours: totalStudyHours,
      completedCount: 0
    };

    const nextText = `🏁 **تهانينا يا بطل! اكتملت المحاكاة وحساب الخطة بنجاح!**
بناءً على إجاباتك العشرة المفصلة لحالتك الخاصة:
• **الطالب:** ${data.studentName}
• **المرحلة والصف:** ${data.stageAndGrade}
• **المادة المستهدفة بالإنقاذ:** ${data.subject} (التقييم: ${data.readinessRating})
• **الأيام المتبقية للامتحان:** ${data.remainingDays} أيام.
• **إجمالي ساعات المذاكرة المتوفرة لك:** **${totalStudyHours} ساعة دراسة فعالة**.
• **كثافة خطة الطوارئ:** ${data.remainingDays < 4 ? '🔴 طوارئ قصوى وعالية الحرج' : data.remainingDays < 7 ? '🟡 مراجعة مكثفة ممتازة ومضغوطة' : '🟢 خطة دراسة متوازنة ومريحة بالتساوي'}.
${isTerminal ? `💡 **ملاحظة بكالوريا هامّة:** نظراً لأنك في صف منتهٍ، تم تضمين فترات **"دراسة وفهم"**، و**"مراجعة وحل تمارين"**، و**"حل الوزاريات"** بالتساوي يومياً لضمان الفل مارك!` : `💡 **ملاحظة:** تم توليد دروس دراسية ومراجعات عامة وواجبات متوازنة يومياً تناسب صفك وتضمن تمكنك الكامل.`}

لقد قمت بتوليد جدول دراسي منظم حقيقي متكامل يتضمن تقسيم الفترات، أوقات الراحة، والمواضيع بالتفصيل. 

هل ترغب في **تأكيد وحفظ** هذا الجدول ليحل كجدول نشط وتتمكن من تتبعه وإنجازه فوراً؟`;

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

                {/* Optional Custom Form rendering for Step 5 & 6 Date Pickers */}
                {msg.type === 'emergency_form' && (emergencyStep === 5 || emergencyStep === 6) && (
                  <div className="mt-4 p-3 bg-slate-50 border border-gray-100 rounded-xl space-y-3">
                    <label className="block text-[10px] font-black text-[#3E176D]">
                      {emergencyStep === 5 ? 'تاريخ بدء خطة الطوارئ' : 'تاريخ نهاية الخطة (الامتحان)'}
                    </label>
                    <input
                      type="date"
                      value={emergencyStep === 5 ? emergencyData.startDate : emergencyData.examDate}
                      onChange={(e) => {
                        if (emergencyStep === 5) {
                          setEmergencyData({ ...emergencyData, startDate: e.target.value });
                        } else {
                          setEmergencyData({ ...emergencyData, examDate: e.target.value });
                        }
                      }}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white text-[#1D2433] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = emergencyStep === 5 ? emergencyData.startDate : emergencyData.examDate;
                        handleEmergencyStepAnswer(val, emergencyStep === 5 ? `البداية في ${emergencyData.startDate}` : `الامتحان في ${emergencyData.examDate}`);
                      }}
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
