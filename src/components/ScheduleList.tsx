import React from 'react';
import { Trash2, Calendar, FileText, X, Check, Copy } from 'lucide-react';
import { Schedule } from '../types';

interface ScheduleListProps {
  isOpen: boolean;
  schedules: Schedule[];
  currentScheduleId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (schedule: Schedule) => void;
  onClose: () => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  isOpen,
  schedules,
  currentScheduleId,
  onSelect,
  onDelete,
  onDuplicate,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3E176D]/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative bg-white w-full max-w-sm h-full shadow-2xl border-r border-[#D9D3F0] flex flex-col animate-in slide-in-from-left duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-[#D9D3F0] bg-[#F5F3FF] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-[#3E176D] font-sans">
              قائمة جداول تطبيق مدرسي
            </h3>
            <p className="text-xs text-[#687084] mt-0.5">
              إجمالي الجداول المحفوظة: {schedules.length}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#687084] hover:text-[#3E176D] hover:bg-[#E9E6FA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {schedules.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <Calendar className="w-12 h-12 text-[#7641B4]/40 mx-auto" />
              <p className="text-sm font-bold text-[#3E176D]">لا توجد جداول محفوظة</p>
              <p className="text-xs text-[#687084]">اضغط على "جدول جديد" لبدء تنظيم يومك الدراسي.</p>
            </div>
          ) : (
            schedules.map((sch) => {
              const isSelected = sch.id === currentScheduleId;
              return (
                <div
                  key={sch.id}
                  onClick={() => onSelect(sch.id)}
                  className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-[#E9E6FA]/40 border-[#5B2596] shadow-sm' 
                      : 'bg-white border-[#D9D3F0] hover:border-[#7641B4] hover:bg-[#F5F3FF]/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 max-w-[80%]">
                      <h4 className="font-bold text-sm text-[#3E176D] truncate">
                        {sch.scheduleName || 'جدول بدون اسم'}
                      </h4>
                      <div className="text-xs text-[#687084] space-y-0.5">
                        <p>الطالب: <span className="text-[#1D2433] font-medium">{sch.studentName || '—'}</span></p>
                        <p>الصف: <span className="text-[#1D2433] font-medium">{sch.gradeClass || '—'}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="bg-[#E9E6FA] text-[#3E176D] p-1 rounded-lg" title="الجدول النشط حالياً">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date and hover tools */}
                  <div className="mt-3 pt-2.5 border-t border-[#D9D3F0]/60 flex items-center justify-between text-[10px] text-[#687084]">
                    <span>تاريخ: {sch.createdAt}</span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(sch);
                        }}
                        className="p-1 rounded hover:bg-[#E9E6FA] text-[#5B2596] transition-colors"
                        title="نسخ الجدول"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      
                      {schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(sch.id);
                          }}
                          className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
                          title="حذف الجدول"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#D9D3F0] bg-[#F5F3FF]/60 text-[11px] text-[#687084] text-center">
          تطبيق مدرسي يتم حفظ كافة التغييرات محلياً وتلقائياً.
        </div>
      </div>
    </div>
  );
};
