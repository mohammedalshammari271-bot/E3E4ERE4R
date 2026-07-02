import React from 'react';
import { Clock, Edit2, Trash2, PlusCircle, CalendarDays, CheckCircle, Flame, Sparkles } from 'lucide-react';
import { Schedule, SUBJECT_COLORS, LESSON_TYPES_ARABIC, LESSON_STATUS_ARABIC } from '../types';

interface ScheduleGridProps {
  schedule: Schedule;
  onEditCell: (dayIndex: number, lessonIndex: number) => void;
  onClearCell: (dayIndex: number, lessonIndex: number) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  schedule,
  onEditCell,
  onClearCell
}) => {
  const { days, lessons, lessonTimes, cells } = schedule;

  const getCellColorStyles = (hexBg: string) => {
    const matched = SUBJECT_COLORS.find(c => c.hexBg === hexBg);
    if (matched) return { bg: matched.bg, text: matched.text, border: matched.border };
    return { bg: 'bg-white', text: 'text-[#1D2433]', border: 'border-[#D9D3F0]' };
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D9D3F0] overflow-hidden shadow-sm transition-shadow hover:shadow">
      {/* Table Header / Metadata - Print Friendly Layout */}
      <div className="p-6 border-b border-[#D9D3F0] bg-gradient-to-br from-white to-[#F5F3FF]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-[#E9E6FA] text-[#3E176D] text-xs font-bold px-2.5 py-1 rounded-lg">
                {schedule.scheduleType || 'جدول دراسي'}
              </span>
              <span className="text-xs text-[#687084] font-medium flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                تاريخ الإنشاء: {schedule.createdAt}
              </span>
              {schedule.completionRate !== undefined && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  نسبة إنجاز الجدول: {schedule.completionRate}%
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#3E176D] font-sans">
              {schedule.scheduleName || 'جدول الدروس بدون عنوان'}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-[#D9D3F0] text-xs">
            <div>
              <span className="text-[#687084] block mb-0.5">اسم الطالب</span>
              <span className="font-bold text-[#1D2433]">{schedule.studentName || '—'}</span>
            </div>
            <div>
              <span className="text-[#687084] block mb-0.5">الصف الدراسي</span>
              <span className="font-bold text-[#1D2433]">{schedule.gradeClass || '—'}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[#687084] block mb-0.5">الفترة الزمنية</span>
              <span className="font-bold text-[#1D2433]">{schedule.timePeriod || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px] text-right">
          <thead>
            <tr className="bg-[#F5F3FF] border-b border-[#D9D3F0]">
              {/* Top-Right corner */}
              <th className="p-4 text-sm font-bold text-[#3E176D] w-[150px] text-center border-l border-[#D9D3F0]">
                الدروس / الأيام
              </th>
              {days.map((day, dayIndex) => (
                <th key={dayIndex} className="p-4 text-sm font-bold text-[#3E176D] text-center border-l border-[#D9D3F0] last:border-l-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lessons.map((lessonName, lessonIndex) => {
              const time = lessonTimes[lessonIndex] || { start: '--:--', end: '--:--' };
              return (
                <tr key={lessonIndex} className="border-b border-[#D9D3F0] last:border-b-0 hover:bg-[#F5F3FF]/20 transition-colors">
                  {/* Row Header: Lesson Info */}
                  <td className="p-3 text-center bg-[#F5F3FF]/50 border-l border-[#D9D3F0] font-medium text-xs text-[#1D2433]">
                    <div className="font-bold text-[#3E176D] mb-1">{lessonName}</div>
                    <div className="flex items-center justify-center gap-1 text-[#687084] font-mono">
                      <Clock className="w-3 h-3 text-[#5B2596]" />
                      <span>{time.start} - {time.end}</span>
                    </div>
                  </td>

                  {/* Days columns */}
                  {days.map((_, dayIndex) => {
                    const cellKey = `${dayIndex}-${lessonIndex}`;
                    const cell = cells[cellKey];
                    const hasData = cell && cell.subject;

                    const style = hasData 
                      ? getCellColorStyles(cell.color)
                      : { bg: 'bg-white', text: 'text-[#687084]', border: 'border-dashed border-[#D9D3F0]' };

                    return (
                      <td 
                        key={dayIndex} 
                        className="p-2 border-l border-[#D9D3F0] last:border-l-0 align-top h-[135px] w-[13%]"
                      >
                        {hasData ? (
                          <div 
                            id={`cell-${dayIndex}-${lessonIndex}`}
                            className={`group relative h-full flex flex-col justify-between p-3 rounded-xl border ${style.bg} ${style.text} ${style.border} shadow-sm hover:shadow-md transition-all cursor-pointer`}
                            onClick={() => onEditCell(dayIndex, lessonIndex)}
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-xs sm:text-sm leading-snug truncate" title={cell.subject}>
                                {cell.subject}
                              </div>
                              {cell.topic && (
                                <div className="text-[10px] opacity-75 truncate leading-tight" title={cell.topic}>
                                  {cell.topic}
                                </div>
                              )}
                              {cell.teacher && (
                                <div className="text-[9px] opacity-80 truncate" title={cell.teacher}>
                                  مدرس: {cell.teacher}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              {/* Meta Info labels inside cell */}
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                {cell.room ? (
                                  <span className="text-[8px] font-bold px-1 py-0.5 bg-white/65 rounded border border-[#D9D3F0]">
                                    {cell.room}
                                  </span>
                                ) : <span />}

                                <div className="flex gap-1 items-center">
                                  {cell.status === 'completed' ? (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                                      مكتمل ✓
                                    </span>
                                  ) : cell.type === 'rest' ? (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-bold">
                                      راحة ☕
                                    </span>
                                  ) : cell.type ? (
                                    <span className="text-[8px] px-1 py-0.5 bg-indigo-100/60 text-indigo-800 rounded">
                                      {LESSON_TYPES_ARABIC[cell.type]?.label || cell.type}
                                    </span>
                                  ) : null}

                                  {cell.effort === 'hard' && (
                                    <span className="text-[8px] p-0.5 bg-rose-50 text-rose-600 rounded" title="صعب ومكثف">
                                      <Flame className="w-2.5 h-2.5 inline" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Hover actions */}
                              <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white/90 p-1 rounded-lg shadow border border-[#D9D3F0]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClearCell(dayIndex, lessonIndex);
                                  }}
                                  className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="مسح الدرس"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditCell(dayIndex, lessonIndex);
                                  }}
                                  className="p-1 rounded text-[#3E176D] hover:bg-[#E9E6FA] transition-colors"
                                  title="تعديل الدرس"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            id={`empty-cell-${dayIndex}-${lessonIndex}`}
                            onClick={() => onEditCell(dayIndex, lessonIndex)}
                            className="group h-full flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-[#D9D3F0] hover:border-[#7641B4] hover:bg-[#F5F3FF] transition-all cursor-pointer text-[#687084]/40 hover:text-[#7641B4]"
                          >
                            <PlusCircle className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                            <span className="text-[10px] mt-1 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">إضافة درس</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes footer */}
      {schedule.notes && (
        <div className="p-4 bg-[#F5F3FF]/40 border-t border-[#D9D3F0] text-xs text-[#687084] flex items-start gap-2">
          <span className="font-bold text-[#3E176D] shrink-0">إرشادات تطبيق مدرسي:</span>
          <p className="leading-relaxed">{schedule.notes}</p>
        </div>
      )}
    </div>
  );
};
