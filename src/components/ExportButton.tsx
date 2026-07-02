import React, { useState } from 'react';
import { Download, Printer, Save, Trash2, Plus, Minus, Clock, CheckCircle, RotateCcw, Copy, Undo } from 'lucide-react';
import { Schedule } from '../types';
import { exportScheduleToPNG } from '../utils/canvasExporter';

interface ExportButtonProps {
  schedule: Schedule;
  onSave: () => void;
  onAddLesson: () => void;
  onRemoveLesson: () => void;
  onEditTimes: () => void;
  onClearAllCells: () => void;
  onMarkAllCompleted: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onDuplicate: () => void;
  isSaving: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  schedule,
  onSave,
  onAddLesson,
  onRemoveLesson,
  onEditTimes,
  onClearAllCells,
  onMarkAllCompleted,
  onUndo,
  canUndo,
  onDuplicate,
  isSaving
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const triggerToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await exportScheduleToPNG(schedule);
      const link = document.createElement('a');
      link.download = `تطبيق_مدرسي_جدول_${schedule.studentName || 'الدروس'}.png`;
      link.href = dataUrl;
      link.click();
      triggerToast('تم تصدير صورة PNG بنجاح لجدولك!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير الصورة.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
    triggerToast('تم إرسال الجدول للطباعة / التصدير بصيغة PDF!');
  };

  return (
    <div className="no-print bg-white rounded-2xl border border-[#D9D3F0] p-6 shadow-sm transition-shadow hover:shadow space-y-6">
      
      {/* Toast notification inside the card */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Exports */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#3E176D] uppercase tracking-wider">تصدير وطباعة التقرير الموحد</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Print / PDF Button */}
          <button
            id="btn-print-pdf"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] hover:opacity-95 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الجدول / تصدير PDF</span>
          </button>

          {/* PNG Export Button */}
          <button
            id="btn-export-png"
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-[#3E176D] bg-[#E9E6FA] hover:bg-[#D9D3F0] rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري تصدير الـ PNG...' : 'تصدير صورة PNG'}</span>
          </button>
        </div>

        {/* User Guide */}
        <p className="text-[10px] text-[#687084] leading-relaxed text-center bg-[#F5F3FF] p-2.5 rounded-xl border border-[#D9D3F0]">
          💡 <strong>إرشاد لطباعة A4 مثالية:</strong> عند الحفظ بصيغة <strong>PDF</strong>، نوصي بتحديد اتجاه الصفحة <strong>أفقي (Landscape)</strong> وتعيين الهوامش إلى "مخصصة أو بلا هوامش" وإلغاء خيار "الرؤوس والتذييلات" لملاءمة تامة لصفحة واحدة.
        </p>
      </div>

      {/* Grid customizations */}
      <div className="space-y-3 pt-4 border-t border-[#D9D3F0]">
        <h4 className="text-xs font-black text-[#3E176D] uppercase tracking-wider">لوحة المعاينة الحية وإدارة الخلايا</h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* [إضافة درس] */}
          <button
            id="btn-add-lesson"
            onClick={onAddLesson}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1D2433] bg-white border border-[#D9D3F0] hover:border-[#7641B4] hover:bg-[#F5F3FF] rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#5B2596]" />
            <span>إضافة درس</span>
          </button>

          {/* [تعديل] */}
          <button
            id="btn-edit-times"
            onClick={onEditTimes}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1D2433] bg-white border border-[#D9D3F0] hover:border-[#7641B4] hover:bg-[#F5F3FF] rounded-xl transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-[#5B2596]" />
            <span>تعديل التواقيت</span>
          </button>

          {/* [حذف] */}
          <button
            id="btn-remove-lesson"
            onClick={onRemoveLesson}
            disabled={schedule.lessons.length <= 1}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>حذف آخر درس</span>
          </button>

          {/* [نسخ] */}
          <button
            onClick={onDuplicate}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-gray-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#5B2596]" />
            <span>نسخ الجدول</span>
          </button>

          {/* [تراجع] */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#3E176D] bg-white border border-[#D9D3F0] hover:bg-purple-50 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <Undo className="w-3.5 h-3.5" />
            <span>تراجع</span>
          </button>

          {/* [مسح الجدول] */}
          <button
            onClick={onClearAllCells}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مسح الجدول</span>
          </button>
        </div>
      </div>

      {/* Bulk Cell operations */}
      <div className="space-y-3 pt-4 border-t border-[#D9D3F0]">
        <h4 className="text-xs font-black text-[#3E176D] uppercase tracking-wider">عمليات جماعية للمعاينة</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={onMarkAllCompleted}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer border border-emerald-200"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>إنجاز جميع الدروس</span>
          </button>
        </div>
      </div>

      {/* [حفظ الجدول] */}
      <div className="pt-4 border-t border-[#D9D3F0] flex items-center justify-between">
        <div className="text-[10px] text-[#687084] leading-relaxed">
          انقر لحفظ المسودة النهائية وتثبيتها بجهازك
        </div>
        <button
          id="btn-save-schedule"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:opacity-95 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>حفظ الجدول</span>
        </button>
      </div>

    </div>
  );
};
