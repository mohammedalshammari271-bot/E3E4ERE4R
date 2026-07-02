import React from 'react';
import { User, GraduationCap, FileText, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { Schedule } from '../types';
import { DateRangePicker } from './DateRangePicker';

interface StudentInfoEditorProps {
  schedule: Schedule;
  onChange: (updated: Partial<Schedule>) => void;
}

export const StudentInfoEditor: React.FC<StudentInfoEditorProps> = ({
  schedule,
  onChange
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#D9D3F0] p-6 shadow-sm transition-shadow hover:shadow space-y-5">
      <div className="border-b border-[#D9D3F0] pb-3">
        <h3 className="font-extrabold text-base sm:text-lg text-[#3E176D] font-sans flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#5B2596]" />
          بيانات الطالب والجدول الدراسي
        </h3>
        <p className="text-xs text-[#687084] mt-0.5">
          تظهر هذه البيانات مباشرة في ترويسة الجدول ومعاينات التصدير وصور PNG المطبوعة.
        </p>
      </div>

      <div className="space-y-4">
        {/* Student Name */}
        <div>
          <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-[#5B2596]" />
            اسم الطالب
          </label>
          <input
            type="text"
            value={schedule.studentName}
            onChange={(e) => onChange({ studentName: e.target.value })}
            placeholder="مثال: كرار علي الحلي"
            className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] text-xs bg-[#F5F3FF]/30 outline-none transition-all"
          />
        </div>

        {/* Class/Grade */}
        <div>
          <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-[#5B2596]" />
            الصف الدراسي
          </label>
          <input
            type="text"
            value={schedule.gradeClass}
            onChange={(e) => onChange({ gradeClass: e.target.value })}
            placeholder="مثال: السادس العلمي"
            className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] text-xs bg-[#F5F3FF]/30 outline-none transition-all"
          />
        </div>

        {/* Schedule Name */}
        <div>
          <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-[#5B2596]" />
            اسم الجدول الدراسي
          </label>
          <input
            type="text"
            value={schedule.scheduleName}
            onChange={(e) => onChange({ scheduleName: e.target.value })}
            placeholder="مثال: جدول الدروس للمستوى السادس"
            className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] text-xs bg-[#F5F3FF]/30 outline-none transition-all"
          />
        </div>

        {/* Schedule Type */}
        <div>
          <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#5B2596]" />
            نوع وجدولة الدراسة
          </label>
          <select
            value={schedule.scheduleType}
            onChange={(e) => onChange({ scheduleType: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] text-xs bg-white outline-none transition-all cursor-pointer font-semibold"
          >
            <option value="جدول أسبوعي ذكي">جدول أسبوعي ذكي</option>
            <option value="جدول يومي ذكي">جدول يومي ذكي</option>
            <option value="خطة مراجعة مخصصة">خطة مراجعة مخصصة</option>
            <option value="خطة امتحانات وزارية">خطة امتحانات وزارية</option>
            <option value="خطة طوارئ مكثفة">خطة طوارئ مكثفة</option>
            <option value="جدول يدوي مخصص">جدول يدوي مخصص</option>
          </select>
        </div>

        {/* Interactive Date Range Picker */}
        <div>
          <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#5B2596]" />
            تاريخ ونطاق الخطة المدرسية
          </label>
          <DateRangePicker
            startDate={schedule.startDate || ''}
            endDate={schedule.endDate || ''}
            onChange={(start, end) => {
              onChange({
                startDate: start,
                endDate: end,
                timePeriod: start && end ? `من ${start} إلى ${end}` : start || end || '—'
              });
            }}
            onClear={() => {
              onChange({
                startDate: '',
                endDate: '',
                timePeriod: 'غير محدد'
              });
            }}
          />
        </div>

        {/* Creation Date */}
        <div>
          <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#5B2596]" />
            تاريخ الإنشاء
          </label>
          <input
            type="date"
            value={schedule.createdAt}
            onChange={(e) => onChange({ createdAt: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] text-xs bg-[#F5F3FF]/30 outline-none transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Notes Field */}
      <div>
        <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-[#5B2596]" />
          إرشادات وتنبيهات أسفل الجدول (اختياري)
        </label>
        <textarea
          value={schedule.notes || ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="إرشادات إضافية تظهر أسفل الجدول للتشجيع والدراسة المنظمة..."
          rows={3}
          className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] text-xs bg-[#F5F3FF]/30 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );
};
