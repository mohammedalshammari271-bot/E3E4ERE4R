import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, MapPin, Link2, Plus, Edit2, Trash2, Copy, 
  Printer, CheckCircle, AlertTriangle, AlertCircle, FileText, ChevronLeft, ChevronRight, BookOpen
} from 'lucide-react';
import { TeacherLesson, TeacherSchedule, THEME_COLORS, IRAQI_DAYS } from '../types';
import { 
  getTeacherLessons, saveTeacherLessons, getTeacherSchedules, 
  saveTeacherSchedules, getActiveTeacherScheduleId, saveActiveTeacherScheduleId 
} from '../utils/db';

export const TeacherMode: React.FC = () => {
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string>('');
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  
  // UI States
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [subject, setSubject] = useState('');
  const [gradeClass, setGradeClass] = useState('السادس العلمي');
  const [studentGroup, setStudentGroup] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [day, setDay] = useState('السبت');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [locationType, setLocationType] = useState<'physical' | 'online'>('physical');
  const [meetLink, setMeetLink] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<'once' | 'weekly'>('once');

  // Load Initial Configurations
  useEffect(() => {
    const savedSchedules = getTeacherSchedules();
    const activeId = getActiveTeacherScheduleId();
    const savedLessons = getTeacherLessons();

    setLessons(savedLessons);

    if (savedSchedules.length > 0) {
      setSchedules(savedSchedules);
      const validId = savedSchedules.some(s => s.id === activeId) ? activeId : savedSchedules[0].id;
      setActiveScheduleId(validId);
    } else {
      // Create first default teacher schedule
      const defaultSch: TeacherSchedule = {
        id: `teacher-sch-${Date.now()}`,
        name: 'جدول المحاضرات العام للمدرس',
        createdAt: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };
      setSchedules([defaultSch]);
      setActiveScheduleId(defaultSch.id);
      saveTeacherSchedules([defaultSch]);
      saveActiveTeacherScheduleId(defaultSch.id);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 1. ADD NEW TEACHER SCHEDULE
  const handleCreateSchedule = () => {
    const name = window.prompt('أدخل اسم جدول المدرس الجديد:', 'جدول الدورات والخصوصي الجديد');
    if (!name || !name.trim()) return;

    const newSch: TeacherSchedule = {
      id: `teacher-sch-${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0]
    };

    const updated = [...schedules, newSch];
    setSchedules(updated);
    setActiveScheduleId(newSch.id);
    saveTeacherSchedules(updated);
    saveActiveTeacherScheduleId(newSch.id);
    showToast('تم إنشاء جدول مدرس جديد بنجاح');
  };

  // 2. CONFLICT / DOUBLE BOOKING DETECTION
  const checkConflict = (
    targetDay: string, 
    targetDate: string, 
    startT: string, 
    endT: string, 
    excludeId?: string
  ): TeacherLesson | null => {
    // Parse times into minutes of day
    const parseMins = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = parseMins(startT);
    const newEnd = parseMins(endT);

    for (const les of lessons) {
      if (les.id === excludeId) continue;
      if (les.scheduleId !== activeScheduleId) continue;

      // Check if day matches OR specific single-date matches
      const isSameDay = les.day === targetDay;
      const isSameDate = les.date === targetDate && les.recurrence === 'once';

      if (isSameDay || isSameDate) {
        const extStart = parseMins(les.startTime);
        const extEnd = parseMins(les.endTime);

        // Check range overlap: (StartA < EndB) and (EndA > StartB)
        if (newStart < extEnd && newEnd > extStart) {
          return les; // Conflict found!
        }
      }
    }
    return null;
  };

  // 3. SUBMIT FORM (ADD / EDIT)
  const handleSubmitLesson = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!subject.trim() || !studentGroup.trim()) {
      setErrorMessage('يرجى ملء كافة الحقول الإلزامية.');
      return;
    }

    // Auto calculate duration
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);

    if (duration <= 0) {
      setErrorMessage('خطأ: وقت نهاية الحصة لا يمكن أن يكون قبل وقت البدء.');
      return;
    }

    // Double booking detection
    const conflict = checkConflict(day, date, startTime, endTime, editingLessonId || undefined);
    if (conflict) {
      setErrorMessage(`⚠️ تعارض بالموعد: المدرس محجوز بالفعل في هذا التوقيت لـ "${conflict.studentGroup}" (${conflict.subject}) من الساعة ${conflict.startTime} إلى ${conflict.endTime}. يرجى تغيير التوقيت لتفادي التداخل.`);
      return;
    }

    let updatedLessons = [...lessons];

    if (editingLessonId) {
      // Edit mode
      updatedLessons = lessons.map(l => {
        if (l.id === editingLessonId) {
          return {
            ...l,
            subject: subject.trim(),
            gradeClass,
            studentGroup: studentGroup.trim(),
            lessonTitle: lessonTitle.trim(),
            date,
            day,
            startTime,
            endTime,
            duration,
            locationType,
            meetLink: locationType === 'online' ? meetLink.trim() : '',
            notes: notes.trim(),
            recurrence
          };
        }
        return l;
      });
      showToast('تم تحديث بيانات المحاضرة بنجاح!');
    } else {
      // Add mode
      const newLesson: TeacherLesson = {
        id: `teacher-less-${Date.now()}`,
        scheduleId: activeScheduleId,
        subject: subject.trim(),
        gradeClass,
        studentGroup: studentGroup.trim(),
        lessonTitle: lessonTitle.trim(),
        date,
        day,
        startTime,
        endTime,
        duration,
        locationType,
        meetLink: locationType === 'online' ? meetLink.trim() : '',
        notes: notes.trim(),
        recurrence
      };
      updatedLessons.push(newLesson);
      showToast('تم حجز وجدولة المحاضرة بنجاح دون أي تعارضات!');
    }

    setLessons(updatedLessons);
    saveTeacherLessons(updatedLessons);
    resetForm();
  };

  const resetForm = () => {
    setIsAddingLesson(false);
    setEditingLessonId(null);
    setSubject('');
    setStudentGroup('');
    setLessonTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setDay('السبت');
    setStartTime('09:00');
    setEndTime('10:30');
    setLocationType('physical');
    setMeetLink('');
    setNotes('');
    setRecurrence('once');
    setErrorMessage('');
  };

  // 4. START EDIT LESSON
  const handleStartEdit = (les: TeacherLesson) => {
    setEditingLessonId(les.id);
    setSubject(les.subject);
    setGradeClass(les.gradeClass);
    setStudentGroup(les.studentGroup);
    setLessonTitle(les.lessonTitle);
    setDate(les.date);
    setDay(les.day);
    setStartTime(les.startTime);
    setEndTime(les.endTime);
    setLocationType(les.locationType);
    setMeetLink(les.meetLink || '');
    setNotes(les.notes || '');
    setRecurrence(les.recurrence);
    setIsAddingLesson(true);
  };

  // 5. DELETE LESSON
  const handleDeleteLesson = (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء وحذف موعد هذه المحاضرة نهائياً؟')) return;
    const updated = lessons.filter(l => l.id !== id);
    setLessons(updated);
    saveTeacherLessons(updated);
    showToast('تم إلغاء المحاضرة بنجاح');
  };

  // 6. COPY LESSON TO ANOTHER DAY
  const handleDuplicateLesson = (les: TeacherLesson) => {
    const nextDay = IRAQI_DAYS[(IRAQI_DAYS.indexOf(les.day) + 1) % IRAQI_DAYS.length];
    
    // Auto calculate tomorrow's date
    const d = new Date(les.date);
    d.setDate(d.getDate() + 1);
    const nextDateStr = d.toISOString().split('T')[0];

    const duplicated: TeacherLesson = {
      ...les,
      id: `teacher-less-dup-${Date.now()}`,
      day: nextDay,
      date: nextDateStr,
      lessonTitle: `${les.lessonTitle} (نسخة مكررة)`
    };

    // check if conflict
    const conflict = checkConflict(nextDay, nextDateStr, les.startTime, les.endTime);
    if (conflict) {
      alert(`⚠️ تعارض مكرر: لا يمكن النسخ لليوم التالي لتعارض الوقت مع درس آخر!`);
      return;
    }

    const updated = [...lessons, duplicated];
    setLessons(updated);
    saveTeacherLessons(updated);
    showToast(`تم نسخ وتكرار الدرس بنجاح إلى يوم ${nextDay}!`);
  };

  // 7. PRINT TEACHER SCHEDULE
  const handlePrintTeacher = () => {
    window.print();
  };

  const activeScheduleObj = schedules.find(s => s.id === activeScheduleId);
  const activeLessons = lessons.filter(l => l.scheduleId === activeScheduleId);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION FOR TEACHER MODE */}
      <div className="no-print bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#3E176D] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#5B2596]" />
            وضع المدرس — # جدول المدرس
          </h2>
          <p className="text-xs text-[#687084]">
            منصة تتبع وحجز دورات ومحاضرات الخصوصي للطلاب العراقيين مع كاشف التداخل والتعارض الآلي.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Active schedule selector */}
          <select
            value={activeScheduleId}
            onChange={(e) => {
              setActiveScheduleId(e.target.value);
              saveActiveTeacherScheduleId(e.target.value);
            }}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-[#D9D3F0] text-xs font-bold text-[#3E176D] bg-white outline-none cursor-pointer"
          >
            {schedules.map(sch => (
              <option key={sch.id} value={sch.id}>{sch.name}</option>
            ))}
          </select>

          <button
            onClick={handleCreateSchedule}
            className="px-3.5 py-2 bg-[#E9E6FA] text-[#3E176D] text-xs font-bold rounded-xl hover:bg-[#D9D3F0] transition-colors shrink-0"
          >
            جدول جديد
          </button>
        </div>
      </div>

      {/* ERROR / TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN: BOOKING FORM (Settings right) */}
        <div className="no-print col-span-1 lg:col-span-4 space-y-6">
          {isAddingLesson ? (
            <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <span className="font-extrabold text-sm text-[#3E176D] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#5B2596]" />
                  {editingLessonId ? 'تعديل بيانات المحاضرة' : 'حجز ومحاكاة محاضرة جديدة'}
                </span>
                <button onClick={resetForm} className="text-gray-500 hover:text-rose-600 text-xs font-bold">إلغاء</button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold space-y-1">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>تنبيه خطأ في الجدولة</span>
                  </div>
                  <p className="text-[10px] text-rose-700 leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmitLesson} className="space-y-4 text-xs">
                {/* Subject name */}
                <div>
                  <label className="block font-bold text-[#1D2433] mb-1">المادة الدراسية *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: الرياضيات، الفيزياء، كيمياء السادس"
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] bg-gray-50 font-semibold text-[#1D2433]"
                    required
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block font-bold text-[#1D2433] mb-1">الصف الدراسي المستهدف</label>
                  <select
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] bg-white font-semibold"
                  >
                    <option value="السادس العلمي">السادس العلمي</option>
                    <option value="السادس الأدبي">السادس الأدبي</option>
                    <option value="الثالث المتوسط">الثالث المتوسط</option>
                    <option value="السادس الابتدائي">السادس الابتدائي</option>
                    <option value="أخرى / خارجي">دورة خارجية مخصصة</option>
                  </select>
                </div>

                {/* Student or Group group */}
                <div>
                  <label className="block font-bold text-[#1D2433] mb-1">اسم الطالب أو المجموعة الخصوصي *</label>
                  <input
                    type="text"
                    value={studentGroup}
                    onChange={(e) => setStudentGroup(e.target.value)}
                    placeholder="مثال: مجموعة أ المنصور، الطالب مصطفى الحلي"
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] bg-gray-50 font-semibold text-[#1D2433]"
                    required
                  />
                </div>

                {/* Lesson Title */}
                <div>
                  <label className="block font-bold text-[#1D2433] mb-1">عنوان المحاضرة أو الموضوع</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="مثال: مبرهنة ديموافر وتطبيقاتها"
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] bg-gray-50"
                  />
                </div>

                {/* Day and Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#1D2433] mb-1">اليوم</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] bg-white font-semibold"
                    >
                      {IRAQI_DAYS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1D2433] mb-1">التاريخ</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-[#D9D3F0]"
                    />
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block font-bold text-[#1D2433] mb-1 text-right">وقت البدء (٢٤س)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2 border border-[#D9D3F0] rounded-xl text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1D2433] mb-1 text-right">وقت النهاية (٢٤س)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2 border border-[#D9D3F0] rounded-xl text-center font-bold"
                    />
                  </div>
                </div>

                {/* Recurrence */}
                <div>
                  <label className="block font-bold text-[#1D2433] mb-1">تكرار الحجز</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] bg-white font-semibold"
                  >
                    <option value="once">حجز لمرة واحدة فقط</option>
                    <option value="weekly">تكرار أسبوعي مستمر في نفس الموعد</option>
                  </select>
                </div>

                {/* Location type */}
                <div>
                  <label className="block font-bold text-[#1D2433] mb-1">نوع وموقع الحضور</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLocationType('physical')}
                      className={`p-2 rounded-xl border font-bold text-center transition-all ${locationType === 'physical' ? 'border-[#5B2596] bg-[#E9E6FA] text-[#3E176D]' : 'border-gray-200 bg-white'}`}
                    >
                      حضوري بالفروع
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType('online')}
                      className={`p-2 rounded-xl border font-bold text-center transition-all ${locationType === 'online' ? 'border-[#5B2596] bg-[#E9E6FA] text-[#3E176D]' : 'border-gray-200 bg-white'}`}
                    >
                      أونلاين (عبر الإنترنت)
                    </button>
                  </div>
                </div>

                {/* Link online if online */}
                {locationType === 'online' && (
                  <div>
                    <label className="block font-bold text-[#1D2433] mb-1">رابط الاجتماع / البث أونلاين</label>
                    <input
                      type="text"
                      value={meetLink}
                      onChange={(e) => setMeetLink(e.target.value)}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] bg-gray-50"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block font-bold text-[#1D2433] mb-1">ملاحظات الحجز</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="كتابة متطلبات المذاكرة أو الدفاتر المطلوبة للمحاضرة..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] resize-none"
                    rows={2}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#5B2596] text-white font-extrabold rounded-xl hover:opacity-95 shadow cursor-pointer text-center"
                  >
                    {editingLessonId ? 'حفظ التحديثات' : 'تأكيد وحفظ موعد الحجز'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 text-center space-y-4 shadow-sm">
              <Users className="w-10 h-10 text-[#5B2596] mx-auto opacity-70" />
              <div className="space-y-1">
                <span className="block text-sm font-black text-[#3E176D]">ابدأ بتنظيم وإضافة محاضراتك الخصوصي</span>
                <p className="text-[11px] text-[#687084]">سيقوم تطبيق مدرسي بفحص التوقيت آلياً لتفادي أي تضارب أو حجز مكرر في نفس اللحظة.</p>
              </div>
              <button
                onClick={() => setIsAddingLesson(true)}
                className="w-full py-3 bg-[#5B2596] text-white rounded-2xl font-bold text-xs hover:bg-[#3E176D] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>حجز وجدولة محاضرة جديدة</span>
              </button>
            </div>
          )}

          {/* Quick Print guide */}
          <div className="bg-[#F5F3FF] border border-[#D9D3F0] p-4 rounded-3xl space-y-2">
            <span className="font-extrabold text-xs text-[#3E176D] flex items-center gap-1">
              <Printer className="w-4 h-4" />
              طباعة الجدول الموحد
            </span>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              تستطيع طباعة جدول المدرس الخصوصي بالكامل بصيغة A4 منسقة ومطبوعة من خلال النقر على زر الطباعة المعتمد في الزاوية اليسرى.
            </p>
            <button
              onClick={handlePrintTeacher}
              className="w-full py-2 bg-white text-[#3E176D] border border-[#D9D3F0] text-xs font-bold rounded-xl hover:bg-gray-50"
            >
              فتح نافذة الطباعة / تصدير PDF
            </button>
          </div>
        </div>

        {/* LEFT COLUMN: WEEKLY GRID PREVIEW (Preview left) */}
        <div className="col-span-1 lg:col-span-8 space-y-5">
          <div className="no-print flex justify-between items-center flex-wrap gap-2">
            <span className="text-sm font-extrabold text-[#3E176D] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#5B2596]" />
              قائمة المحاضرات والدروس المجدولة للأسبوع ({activeLessons.length} حصة)
            </span>
            <span className="text-[11px] text-gray-500">تم حجز المحاضرات بنظام التسلسل الأسبوعي العراقي.</span>
          </div>

          {/* Printable visual structure */}
          <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-4">
            {activeLessons.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl space-y-2">
                <Users className="w-12 h-12 text-[#D9D3F0] mx-auto" />
                <p className="text-xs font-extrabold text-gray-600">لا توجد أي محاضرات مسجلة في هذا الجدول الدراسي للمدرس حالياً.</p>
                <p className="text-[10px] text-gray-400">انقر على زر "حجز وجدولة محاضرة جديدة" في اليمين لإدراج أولى دوراتك الخصوصية.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual day-by-day stack */}
                {IRAQI_DAYS.map((iraqiDay) => {
                  const dayLessons = activeLessons.filter(l => l.day === iraqiDay);
                  if (dayLessons.length === 0) return null;

                  return (
                    <div key={iraqiDay} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-[#F5F3FF] px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-extrabold text-[#3E176D]">{iraqiDay}</span>
                        <span className="text-[10px] text-[#687084] font-semibold">{dayLessons.length} حصص مقررة</span>
                      </div>

                      <div className="divide-y divide-gray-50 bg-white">
                        {dayLessons.map((les) => (
                          <div key={les.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50">
                            
                            {/* Class info */}
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-lg bg-[#E9E6FA] text-[#3E176D]">
                                  {les.subject}
                                </span>
                                <span className="text-xs font-bold text-gray-500">
                                  الصف: {les.gradeClass}
                                </span>
                                {les.recurrence === 'weekly' && (
                                  <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-50 text-emerald-800 font-extrabold">
                                    🔄 تكرار أسبوعي مستمر
                                  </span>
                                )}
                              </div>

                              <div className="font-extrabold text-xs sm:text-sm text-[#1D2433]">
                                الموضوع: {les.lessonTitle || 'مراجعة عامة وتلخيص'}
                              </div>

                              <div className="text-[11px] text-[#687084] font-semibold flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-purple-600" />
                                <span>اسم المجموعة / الطالب: <strong className="text-[#3E176D]">{les.studentGroup}</strong></span>
                              </div>
                            </div>

                            {/* Time & Venue */}
                            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 text-right">
                              <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1 bg-slate-50 border border-gray-100 px-2 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-purple-600" />
                                {les.startTime} - {les.endTime} ({les.duration} دقيقة)
                              </span>

                              <div className="text-[10px] font-bold flex items-center gap-1 justify-end">
                                {les.locationType === 'online' ? (
                                  <span className="text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Link2 className="w-3 h-3" />
                                    أونلاين: {les.meetLink ? <a href={les.meetLink} target="_blank" rel="noopener noreferrer" className="underline font-mono text-[9px]">{les.meetLink.substring(0, 25)}...</a> : 'رابط غير مضاف'}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    حضور بمقر المعهد الخصوصي
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Operations */}
                            <div className="no-print flex items-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 justify-end">
                              <button
                                onClick={() => handleStartEdit(les)}
                                className="p-1.5 hover:bg-[#E9E6FA] rounded-lg text-[#5B2596]"
                                title="تعديل تفاصيل المحاضرة"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateLesson(les)}
                                className="p-1.5 hover:bg-[#E9E6FA] rounded-lg text-emerald-600"
                                title="تكرار ونسخ لليوم القادم"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(les.id)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600"
                                title="إلغاء وحذف الحجز"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PRINT-ONLY FLUID CONTAINER */}
      <div className="print-only hidden p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-[#3E176D] tracking-tight font-sans mb-1">تطبيق مدرسي</h1>
          <p className="text-sm text-[#687084] font-bold font-sans"># جدول المدرس الخصوصي والمحاضرات الموحدة</p>
        </div>

        <div className="border border-[#D9D3F0] p-4 rounded-xl bg-[#F5F3FF] text-xs mb-6 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[#687084] block font-bold mb-1">اسم الجدول:</span>
            <span className="text-[#1D2433] text-sm font-bold">{activeScheduleObj?.name || '—'}</span>
          </div>
          <div>
            <span className="text-[#687084] block font-bold mb-1">تاريخ طباعة التقرير الموحد:</span>
            <span className="text-[#1D2433] text-sm font-bold">{new Date().toLocaleDateString('ar-IQ')}</span>
          </div>
        </div>

        <table className="w-full border-collapse border border-[#D9D3F0] text-center text-xs">
          <thead>
            <tr className="bg-[#F5F3FF]">
              <th className="border border-[#D9D3F0] p-3 font-bold text-[#3E176D] w-1/4">اليوم</th>
              <th className="border border-[#D9D3F0] p-3 font-bold text-[#3E176D] w-3/4">تفاصيل المحاضرات المجدولة والطلاب</th>
            </tr>
          </thead>
          <tbody>
            {IRAQI_DAYS.map((iraqiDay) => {
              const dayLessons = activeLessons.filter(l => l.day === iraqiDay);
              if (dayLessons.length === 0) return null;

              return (
                <tr key={iraqiDay}>
                  <td className="border border-[#D9D3F0] p-3 font-bold text-[#3E176D] bg-[#F5F3FF]/30">{iraqiDay}</td>
                  <td className="border border-[#D9D3F0] p-3 text-right">
                    <div className="space-y-3">
                      {dayLessons.map((les, idx) => (
                        <div key={les.id} className="p-2 border-b border-gray-100 last:border-b-0">
                          <div className="font-extrabold text-[#3E176D] text-xs">
                            {idx + 1}. مادة {les.subject} — {les.lessonTitle || 'مراجعة وتلخيص'}
                          </div>
                          <div className="text-[10px] text-gray-600 font-bold">
                            👨‍🎓 اسم الطالب/المجموعة: {les.studentGroup} | ⏱️ التوقيت: {les.startTime} - {les.endTime} | 📍 الحضور: {les.locationType === 'online' ? 'أونلاين عبر البث' : 'حضوري بمقر المعهد'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
export default TeacherMode;
