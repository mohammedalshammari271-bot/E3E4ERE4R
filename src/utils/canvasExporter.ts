import { Schedule, SUBJECT_COLORS } from '../types';

/**
 * High-DPI Canvas exporter for "تطبيق مدرستي" schedule.
 * Renders the schedule table beautifully to PNG format.
 */
export const exportScheduleToPNG = (schedule: Schedule): Promise<string> => {
  return new Promise((resolve) => {
    // Scale up for High-DPI crisp rendering (2.0x scale factor)
    const scale = 2;
    const width = 1250 * scale;
    
    // Constants for table geometry
    const startX = 50;
    const startY = 165;
    const totalWidth = 1150;
    const rowHeight = 85; // Slightly increased for comfortable text spacing
    const colHeaderHeight = 50;
    
    const daysCount = schedule.days.length;
    const periodsCount = schedule.lessons.length;
    
    // Width of columns: 1 for periods, remaining split among days
    const colWidthPeriod = 140;
    const colWidthDay = (totalWidth - colWidthPeriod) / daysCount;

    // Calculate dynamic notes height
    let notesLinesCount = 0;
    if (schedule.notes) {
      const approxCharPerLine = 120;
      notesLinesCount = Math.ceil(schedule.notes.length / approxCharPerLine) + 1;
    }
    const notesHeight = schedule.notes ? (notesLinesCount * 24 + 40) : 0;

    // Calculate total height dynamically to prevent any clipping at the bottom
    const baseTableHeight = colHeaderHeight + (periodsCount * rowHeight);
    const canvasTotalHeightNeeded = startY + baseTableHeight + notesHeight + 100;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = width;
    canvas.height = canvasTotalHeightNeeded * scale;
    ctx.scale(scale, scale);

    // Enable RTL text rendering
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Color definitions
    const primaryColor = '#5B2596';
    const darkPurple = '#3E176D';
    const borderPurple = '#D9D3F0';
    const lightBg = '#F5F3FF';
    const textDark = '#1D2433';
    const textGray = '#687084';

    // Draw pristine white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1250, canvasTotalHeightNeeded);

    // Dynamic border accents on top and bottom
    ctx.fillStyle = lightBg;
    ctx.fillRect(0, 0, 1250, 15);
    ctx.fillRect(0, canvasTotalHeightNeeded - 15, 1250, 15);

    // Title Block (Plain text to maintain lightweight performance, strictly complying with styling rules)
    ctx.font = 'bold 34px "Tajawal", "Inter", sans-serif';
    ctx.fillStyle = darkPurple;
    ctx.fillText('تطبيق مدرسي', 1200, 65);

    ctx.font = '500 14px "Tajawal", sans-serif';
    ctx.fillStyle = textGray;
    ctx.fillText('منظّم وجدول الدروس الدراسي الذكي والمثالي للطلاب العراقيين', 1200, 102);

    // Draw Rounded Rect Helper
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fill = false, stroke = true) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    };

    // Helper to wrap and draw text beautifully within cells/notes
    const wrapAndDrawText = (
      context: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
      maxLines = 2
    ) => {
      const words = text.split(' ');
      let line = '';
      const lines: string[] = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + (line ? ' ' : '') + words[n];
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n];
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // Render up to maxLines
      const finalLines = lines.slice(0, maxLines);
      if (lines.length > maxLines && finalLines.length > 0) {
        finalLines[finalLines.length - 1] = finalLines[finalLines.length - 1].slice(0, -2) + '...';
      }

      const totalTextHeight = (finalLines.length - 1) * lineHeight;
      const startYOffset = y - (totalTextHeight / 2);

      finalLines.forEach((l, index) => {
        context.fillText(l, x, startYOffset + (index * lineHeight));
      });
    };

    // Metadata Card Box
    ctx.strokeStyle = borderPurple;
    ctx.lineWidth = 1;
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(50, 45, 620, 75, 14, true, true);

    // Draw Metadata details
    // Col 1: Student Name
    ctx.font = 'bold 11px "Tajawal", sans-serif';
    ctx.fillStyle = textGray;
    ctx.fillText('اسم الطالب:', 640, 65);
    ctx.font = 'bold 13px "Tajawal", sans-serif';
    ctx.fillStyle = textDark;
    ctx.fillText(schedule.studentName || 'غير محدد', 640, 92);

    // Col 2: Class/Grade
    ctx.font = 'bold 11px "Tajawal", sans-serif';
    ctx.fillStyle = textGray;
    ctx.fillText('الصف والمنهج:', 470, 65);
    ctx.font = 'bold 13px "Tajawal", sans-serif';
    ctx.fillStyle = textDark;
    ctx.fillText(schedule.gradeClass || 'غير محدد', 470, 92);

    // Col 3: Time Period
    ctx.font = 'bold 11px "Tajawal", sans-serif';
    ctx.fillStyle = textGray;
    ctx.fillText('الفترة الزمنية:', 280, 65);
    ctx.font = 'bold 13px "Tajawal", sans-serif';
    ctx.fillStyle = textDark;
    ctx.fillText(schedule.timePeriod || 'غير محدد', 280, 92);

    // Col 4: Progress Indicator
    ctx.font = 'bold 11px "Tajawal", sans-serif';
    ctx.fillStyle = textGray;
    ctx.fillText('نسبة الإنجاز:', 110, 65);
    ctx.font = 'bold 15px "Tajawal", sans-serif';
    ctx.fillStyle = '#10B981'; // Pristine Emerald-500
    ctx.fillText(`${schedule.completionRate || 0}%`, 110, 92);

    // Draw Schedule Info Header Line
    ctx.fillStyle = textDark;
    ctx.font = 'bold 16px "Tajawal", sans-serif';
    ctx.fillText(`الجدول: ${schedule.scheduleName || 'جدول منظم'} (نوع: ${schedule.scheduleType || 'دراسي'})`, 1200, 142);

    // Background for table header
    ctx.fillStyle = lightBg;
    ctx.fillRect(startX, startY, totalWidth, colHeaderHeight);
    
    // Draw outer boundary
    ctx.strokeStyle = borderPurple;
    ctx.lineWidth = 1.5;
    drawRoundedRect(startX, startY, totalWidth, colHeaderHeight + (periodsCount * rowHeight), 14, false, true);

    // Draw Table Headers (Days)
    ctx.font = 'bold 14px "Tajawal", sans-serif';
    ctx.fillStyle = darkPurple;
    ctx.textAlign = 'center';

    const periodHeaderX = startX + totalWidth - (colWidthPeriod / 2);
    ctx.fillText('الدروس / الأيام', periodHeaderX, startY + (colHeaderHeight / 2));

    // Vertical line between Period title col and first Day col
    ctx.strokeStyle = borderPurple;
    ctx.beginPath();
    ctx.moveTo(startX + totalWidth - colWidthPeriod, startY);
    ctx.lineTo(startX + totalWidth - colWidthPeriod, startY + colHeaderHeight + (periodsCount * rowHeight));
    ctx.stroke();

    // Days column headers
    schedule.days.forEach((day, idx) => {
      const dayX = startX + totalWidth - colWidthPeriod - (idx * colWidthDay) - (colWidthDay / 2);
      ctx.fillText(day, dayX, startY + (colHeaderHeight / 2));

      // Vertical separators
      if (idx < daysCount - 1) {
        const lineX = startX + totalWidth - colWidthPeriod - ((idx + 1) * colWidthDay);
        ctx.beginPath();
        ctx.moveTo(lineX, startY);
        ctx.lineTo(lineX, startY + colHeaderHeight + (periodsCount * rowHeight));
        ctx.stroke();
      }
    });

    // Horizontal line under headers
    ctx.beginPath();
    ctx.moveTo(startX, startY + colHeaderHeight);
    ctx.lineTo(startX + totalWidth, startY + colHeaderHeight);
    ctx.stroke();

    // 6. Draw Rows & Cells
    for (let r = 0; r < periodsCount; r++) {
      const currentY = startY + colHeaderHeight + (r * rowHeight);

      // Period Name and Time drawing
      ctx.textAlign = 'center';
      const periodName = schedule.lessons[r];
      const time = schedule.lessonTimes[r] || { start: '--:--', end: '--:--' };
      
      // Draw background for period title column
      ctx.fillStyle = '#FCFAFF';
      ctx.fillRect(startX + totalWidth - colWidthPeriod, currentY, colWidthPeriod - 1, rowHeight);

      // Label
      ctx.font = 'bold 13px "Tajawal", sans-serif';
      ctx.fillStyle = darkPurple;
      ctx.fillText(periodName, periodHeaderX, currentY + 30);

      // Time
      ctx.font = '500 12px "JetBrains Mono", sans-serif';
      ctx.fillStyle = textGray;
      ctx.fillText(`${time.start} - ${time.end}`, periodHeaderX, currentY + 56);

      // Horizontal row separator
      if (r < periodsCount - 1) {
        ctx.strokeStyle = borderPurple;
        ctx.beginPath();
        ctx.moveTo(startX, currentY + rowHeight);
        ctx.lineTo(startX + totalWidth, currentY + rowHeight);
        ctx.stroke();
      }

      // Draw cell blocks for each day
      for (let d = 0; d < daysCount; d++) {
        const cellKey = `${d}-${r}`;
        const cell = schedule.cells[cellKey];
        const dayStartX = startX + totalWidth - colWidthPeriod - ((d + 1) * colWidthDay);

        if (cell && cell.subject) {
          // Fill cell background
          ctx.fillStyle = cell.color || '#E9E6FA';
          ctx.fillRect(dayStartX + 3, currentY + 3, colWidthDay - 6, rowHeight - 6);

          // Draw small cell border
          ctx.strokeStyle = borderPurple;
          ctx.lineWidth = 1;
          drawRoundedRect(dayStartX + 3, currentY + 3, colWidthDay - 6, rowHeight - 6, 10, false, true);

          // Reset text align for content (Center inside the cell)
          ctx.textAlign = 'center';
          const cellCenterX = dayStartX + (colWidthDay / 2);

          // Find text color matching standard palette
          const colorObj = SUBJECT_COLORS.find(c => c.hexBg === cell.color);
          ctx.fillStyle = colorObj ? colorObj.hexText : '#3E176D';

          // Subject Name (Draw wrapped to 1 or 2 lines if long)
          ctx.font = 'bold 12.5px "Tajawal", sans-serif';
          const maxTextWidth = colWidthDay - 16;
          
          if (cell.topic) {
            // Draw Subject name slightly higher to fit the topic
            wrapAndDrawText(ctx, cell.subject, cellCenterX, currentY + 22, maxTextWidth, 14, 1);
            
            // Draw Topic wrapped safely to 1 line
            ctx.font = '500 10px "Tajawal", sans-serif';
            ctx.fillStyle = textGray;
            wrapAndDrawText(ctx, cell.topic, cellCenterX, currentY + 42, maxTextWidth, 12, 1);
          } else {
            // Subject name centered
            wrapAndDrawText(ctx, cell.subject, cellCenterX, currentY + 32, maxTextWidth, 15, 2);
          }

          // Lesson Type / Status badge at the bottom
          ctx.font = 'bold 8.5px "Tajawal", sans-serif';
          const badgeY = currentY + rowHeight - 15;
          if (cell.status === 'completed') {
            ctx.fillStyle = '#059669'; // Emerald-600
            ctx.fillText('✓ مكتمل', cellCenterX, badgeY);
          } else if (cell.type === 'rest') {
            ctx.fillStyle = '#3B82F6'; // Blue-500
            ctx.fillText('☕ استراحة', cellCenterX, badgeY);
          } else {
            ctx.fillStyle = '#7C3AED'; // Purple-600
            ctx.fillText(`✎ ${cell.type === 'study' ? 'دراسة' : cell.type === 'review' ? 'مراجعة' : 'واجب'}`, cellCenterX, badgeY);
          }
        } else {
          // Empty cell rendering with dotted placeholders
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(dayStartX + 5, currentY + 5, colWidthDay - 10, rowHeight - 10);
          ctx.setLineDash([]); // Reset dash array
        }
      }
    }

    // 7. Draw Notes at the bottom if present (No truncation ever!)
    if (schedule.notes) {
      const notesY = startY + colHeaderHeight + (periodsCount * rowHeight) + 35;
      ctx.textAlign = 'right';
      ctx.fillStyle = darkPurple;
      ctx.font = 'bold 14px "Tajawal", sans-serif';
      ctx.fillText('إرشادات وملاحظات تطبيق مدرسي للجدول:', 1200, notesY);

      ctx.fillStyle = textGray;
      ctx.font = '500 13px "Tajawal", sans-serif';
      
      const words = schedule.notes.split(' ');
      let line = '';
      let currentNotesY = notesY + 24;
      const maxLineWidth = 1150;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + (line ? ' ' : '') + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && n > 0) {
          ctx.fillText(line, 1200, currentNotesY);
          line = words[n];
          currentNotesY += 24;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 1200, currentNotesY);
    }

    // Convert Canvas to pristine Data URL after a short timeout
    setTimeout(() => {
      resolve(canvas.toDataURL('image/png'));
    }, 150);
  });
};

