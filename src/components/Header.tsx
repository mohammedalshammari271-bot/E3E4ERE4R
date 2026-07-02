import React from 'react';
import { Sparkles, Calendar, Plus, FolderOpen } from 'lucide-react';
import { Schedule } from '../types';

interface HeaderProps {
  currentSchedule: Schedule | null;
  onNewSchedule: () => void;
  onOpenList: () => void;
  savedSchedulesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentSchedule,
  onNewSchedule,
  onOpenList,
  savedSchedulesCount
}) => {
  return (
    <header className="no-print bg-white border-b border-[#D9D3F0] sticky top-0 z-40 transition-shadow hover:shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Right side: App Name as elegant text only, without any logo */}
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] bg-clip-text text-transparent">
              <span className="font-extrabold text-2xl tracking-tight font-sans">
                تطبيق مدرسي
              </span>
            </div>
            <div className="hidden md:flex items-center bg-[#E9E6FA] text-[#3E176D] px-2.5 py-0.5 rounded-full text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 ml-1" />
              منظّم الجداول الذكي
            </div>
          </div>

          {/* Left side: Operations */}
          <div className="flex items-center gap-3">
            <button
              id="btn-open-schedules"
              onClick={onOpenList}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#687084] hover:text-[#3E176D] bg-[#F5F3FF] hover:bg-[#E9E6FA] rounded-xl border border-[#D9D3F0] transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              <span>جداولي ({savedSchedulesCount})</span>
            </button>

            <button
              id="btn-create-new-schedule"
              onClick={onNewSchedule}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3E176D] via-[#5B2596] to-[#7641B4] hover:opacity-95 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>جدول جديد</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
