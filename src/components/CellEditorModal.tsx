import React, { useState, useEffect } from 'react';
import { X, BookOpen, User, MapPin, Check, AlignRight, Flame, Layers, Eye } from 'lucide-react';
import { ScheduleCell, SUBJECT_COLORS, LessonType, LessonStatus, EffortLevel, LESSON_TYPES_ARABIC, LESSON_STATUS_ARABIC } from '../types';
import { SUBJECTS_BY_GRADE } from '../constants/subjects';

interface CellEditorModalProps {
  isOpen: boolean;
  dayName: string;
  lessonName: string;
  initialCell: ScheduleCell | null;
  gradeClass: string;
  onClose: () => void;
  onSave: (cell: ScheduleCell) => void;
}

export const CellEditorModal: React.FC<CellEditorModalProps> = ({
  isOpen,
  dayName,
  lessonName,
  initialCell,
  gradeClass,
  onClose,
  onSave
}) => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<LessonType>('study');
  const [status, setStatus] = useState<LessonStatus>('upcoming');
  const [effort, setEffort] = useState<EffortLevel>('medium');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0].hexBg);
  const [notes, setNotes] = useState('');

  // Get dynamic suggestions based on grade
  const suggestions = SUBJECTS_BY_GRADE[gradeClass] || SUBJECTS_BY_GRADE['السادس العلمي'] || [];

  useEffect(() => {
    if (isOpen) {
      if (initialCell) {
        setSubject(initialCell.subject || '');
        setTopic(initialCell.topic || '');
        setType(initialCell.type || 'study');
        setStatus(initialCell.status || 'upcoming');
        setEffort(initialCell.effort || 'medium');
        setTeacher(initialCell.teacher || '');
        setRoom(initialCell.room || '');
        setColor(initialCell.color || SUBJECT_COLORS[0].hexBg);
        setNotes(initialCell.notes || '');
      } else {
        setSubject('');
        setTopic('');
        setType('study');
        setStatus('upcoming');
        setEffort('medium');
        setTeacher('');
        setRoom('');
        setColor(SUBJECT_COLORS[0].hexBg);
        setNotes('');
      }
    }
  }, [isOpen, initialCell]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    onSave({
      subject: subject.trim(),
      topic: topic.trim(),
      type,
      status,
      effort,
      teacher: teacher.trim(),
      room: room.trim(),
      color,
      notes: notes.trim()
    });
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3E176D]/45 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#D9D3F0] w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D9D3F0] bg-[#F5F3FF] sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-lg text-[#3E176D] font-sans">
              تعديل درس دراسي
            </h3>
            <p className="text-xs text-[#687084] mt-0.5">
              {dayName} — {lessonName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#687084] hover:text-[#3E176D] hover:bg-[#E9E6FA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold text-[#1D2433] mb-2 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#5B2596]" />
              اسم المادة الدراسية *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: الرياضيات، الفيزياء، قواعد اللغة العربية..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] bg-[#F5F3FF]/50 text-sm outline-none transition-all"
            />

            {/* Quick choices based on student grade */}
            {suggestions.length > 0 && (
              <div className="mt-2.5">
                <span className="text-[10px] text-[#687084] block mb-1">مواد صفك الدراسي المعتمدة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubject(sub)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-[#D9D3F0] hover:border-[#7641B4] hover:bg-[#E9E6FA]/40 text-[#687084] hover:text-[#3E176D] transition-all"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Topic / Chapter Name */}
          <div>
            <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
              <AlignRight className="w-3.5 h-3.5 text-[#5B2596]" />
              عنوان الموضوع أو الفصل
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: الفصل الأول: الأعداد المركبة"
              className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] bg-[#F5F3FF]/50 text-sm outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lesson Type */}
            <div>
              <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#5B2596]" />
                نوع النشاط
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LessonType)}
                className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] text-xs outline-none transition-all bg-white"
              >
                {Object.entries(LESSON_TYPES_ARABIC).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Lesson Status */}
            <div>
              <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#5B2596]" />
                الحالة المنجزة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LessonStatus)}
                className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] text-xs outline-none transition-all bg-white"
              >
                {Object.entries(LESSON_STATUS_ARABIC).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Effort Level */}
            <div>
              <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#5B2596]" />
                مستوى الجهد والتركيز
              </label>
              <select
                value={effort}
                onChange={(e) => setEffort(e.target.value as EffortLevel)}
                className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] text-xs outline-none transition-all bg-white"
              >
                <option value="easy">سهل ومريح ☕</option>
                <option value="medium">متوسط التركيز ⚡</option>
                <option value="hard">مكثف ومجهد 🔥</option>
              </select>
            </div>
          </div>

          {/* Teacher and Room */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#5B2596]" />
                اسم المدرس أو المحاضر
              </label>
              <input
                type="text"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                placeholder="أ. علي الحسيني"
                className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] bg-[#F5F3FF]/50 text-xs outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1D2433] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#5B2596]" />
                مكان الدراسة / القاعة
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="قاعة التفوق / غرفة المكتب"
                className="w-full px-3 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] focus:ring-1 focus:ring-[#7641B4] bg-[#F5F3FF]/50 text-xs outline-none transition-all"
              />
            </div>
          </div>

          {/* Color Chooser */}
          <div>
            <label className="block text-xs font-bold text-[#1D2433] mb-2.5">
              تحديد لون التمييز في الجدول
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUBJECT_COLORS.map((col) => {
                const isSelected = color === col.hexBg;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => setColor(col.hexBg)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-semibold transition-all ${col.bg} ${col.text} ${
                      isSelected ? 'ring-2 ring-[#5B2596] border-[#5B2596] scale-[1.02]' : 'border-[#D9D3F0] hover:scale-[1.01]'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#D9D3F0]">
                      {isSelected && <Check className="w-2.5 h-2.5 text-[#5B2596]" />}
                    </span>
                    <span className="truncate">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#1D2433] mb-1.5">
              ملاحظات مخصصة لهذا الدرس
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: مراجعة الدفتر مع حل الأسئلة الوزارية لعام 2024 دور أول..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-[#D9D3F0] focus:border-[#7641B4] text-xs outline-none transition-all bg-[#F5F3FF]/50"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#D9D3F0]">
            <button
              type="submit"
              disabled={!subject.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] hover:opacity-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              حفظ تفاصيل الدرس
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#687084] hover:text-[#3E176D] bg-white border border-[#D9D3F0] hover:bg-[#F5F3FF] transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
