import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { IRAQI_DAYS } from '../types';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  onClear?: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  onClear
}) => {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [error, setError] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    setStart(startDate);
    setEnd(endDate);
  }, [startDate, endDate]);

  const validateAndTrigger = (newStart: string, newEnd: string) => {
    if (!newStart) {
      setError('يرجى تحديد تاريخ البداية.');
      return;
    }
    if (newEnd && new Date(newEnd) < new Date(newStart)) {
      setError('تنبيه: تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.');
      return;
    }
    setError('');
    onChange(newStart, newEnd);
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStart(val);
    validateAndTrigger(val, end);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEnd(val);
    validateAndTrigger(start, val);
  };

  // Helper to calculate total days and weeks
  const getDurationDetails = () => {
    if (!start) return null;
    const d1 = new Date(start);
    const d2 = end ? new Date(end) : d1;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;

    let text = `${diffDays} يوماً`;
    if (weeks > 0) {
      text = `${weeks} أسبوع ${remainingDays > 0 ? `و ${remainingDays} يوم` : ''} (الإجمالي: ${diffDays} يوماً)`;
    }
    return { days: diffDays, weeks, text };
  };

  // Shortcut for a Friday-to-Thursday week starting from the chosen start date
  const setIraqiWeek = () => {
    const baseDate = start ? new Date(start) : new Date();
    // Shift start to nearest Friday if requested, or use chosen start
    // Let's set end to 6 days after start (total 7 days, e.g. Friday to Thursday)
    const nextEnd = new Date(baseDate);
    nextEnd.setDate(baseDate.getDate() + 6);
    
    const startStr = baseDate.toISOString().split('T')[0];
    const endStr = nextEnd.toISOString().split('T')[0];
    setStart(startStr);
    setEnd(endStr);
    setError('');
    onChange(startStr, endStr);
  };

  const durationInfo = getDurationDetails();

  return (
    <div className="bg-white rounded-2xl border border-[#D9D3F0] p-4 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-[#3E176D] flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5 text-[#5B2596]" />
          منتقي الفترة الزمنية التفاعلي
        </span>
        {onClear && (start || end) && (
          <button
            type="button"
            onClick={() => {
              setStart('');
              setEnd('');
              setError('');
              onClear();
            }}
            className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            <span>مسح الفترة</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 mb-1">تاريخ البدء</label>
          <input
            type="date"
            value={start}
            onChange={handleStartChange}
            className="w-full px-3 py-1.5 rounded-xl border border-[#D9D3F0] focus:ring-1 focus:ring-[#7641B4] text-xs bg-gray-50 outline-none font-medium"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 mb-1">تاريخ الانتهاء</label>
          <input
            type="date"
            value={end}
            onChange={handleEndChange}
            className="w-full px-3 py-1.5 rounded-xl border border-[#D9D3F0] focus:ring-1 focus:ring-[#7641B4] text-xs bg-gray-50 outline-none font-medium"
          />
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-semibold flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {durationInfo && !error && (
        <div className="p-2.5 bg-indigo-50/50 border border-[#D9D3F0]/60 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="text-gray-600 font-semibold">
            المدة المحتسبة: <span className="text-[#3E176D] font-extrabold">{durationInfo.text}</span>
          </div>
          <button
            type="button"
            onClick={setIraqiWeek}
            className="text-[10px] px-2.5 py-1 bg-[#E9E6FA] hover:bg-[#D9D3F0] text-[#3E176D] font-bold rounded-lg transition-colors"
          >
            ضبط كأسبوع كامل (٧ أيام)
          </button>
        </div>
      )}
    </div>
  );
};
