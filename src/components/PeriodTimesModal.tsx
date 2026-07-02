import React, { useState, useEffect } from 'react';
import { X, Clock, Save } from 'lucide-react';

interface PeriodTimesModalProps {
  isOpen: boolean;
  lessons: string[];
  initialTimes: { start: string; end: string }[];
  onClose: () => void;
  onSave: (updatedTimes: { start: string; end: string }[]) => void;
}

export const PeriodTimesModal: React.FC<PeriodTimesModalProps> = ({
  isOpen,
  lessons,
  initialTimes,
  onClose,
  onSave
}) => {
  const [times, setTimes] = useState<{ start: string; end: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimes([...initialTimes]);
    }
  }, [isOpen, initialTimes]);

  if (!isOpen) return null;

  const handleTimeChange = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...times];
    if (!updated[index]) {
      updated[index] = { start: '08:00', end: '08:45' };
    }
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setTimes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(times);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3E176D]/45 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#D9D3F0] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D9D3F0] bg-[#F5F3FF]">
          <div>
            <h3 className="font-bold text-lg text-[#3E176D] font-sans">
              تعديل أوقات الدروس الدراسية
            </h3>
            <p className="text-xs text-[#687084] mt-0.5">
              حدد مواعيد بداية ونهاية كل درس في اليوم الدراسي.
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
        <form onSubmit={handleSubmit} className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {lessons.map((lesson, index) => {
              const time = times[index] || { start: '08:00', end: '08:45' };
              return (
                <div key={index} className="flex items-center justify-between gap-4 p-3 bg-[#F5F3FF]/40 rounded-xl border border-[#D9D3F0]/60">
                  <div className="text-xs font-bold text-[#3E176D] w-1/3">
                    {lesson}
                  </div>
                  <div className="flex items-center gap-2 w-2/3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-[#687084] mb-0.5">البداية</label>
                      <input
                        type="time"
                        value={time.start}
                        onChange={(e) => handleTimeChange(index, 'start', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-[#D9D3F0] focus:border-[#7641B4] outline-none font-mono"
                      />
                    </div>
                    <span className="text-xs text-[#687084] mt-4">إلى</span>
                    <div className="flex-1">
                      <label className="block text-[10px] text-[#687084] mb-0.5">النهاية</label>
                      <input
                        type="time"
                        value={time.end}
                        onChange={(e) => handleTimeChange(index, 'end', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-[#D9D3F0] focus:border-[#7641B4] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 p-5 border-t border-[#D9D3F0] bg-[#F5F3FF]/20">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التوقيتات الجديدة</span>
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
