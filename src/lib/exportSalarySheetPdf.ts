import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SalaryRecord, Employee, LeaveEntry } from '@/lib/types';
import { formatCurrency, getMonthName } from '@/lib/types';

export type RecordWithEmployee = SalaryRecord & { employee?: Employee };

// Invoice-style: black, white, grey
const C = {
  black: [0, 0, 0] as [number, number, number],
  grey: [100, 100, 100] as [number, number, number],
  light: [240, 240, 240] as [number, number, number],
  dark: [60, 60, 60] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function formatLeaveDate(iso: string): string {
  try {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Draw a simple wave shape at bottom of page (invoice-style flourish) */
function drawWaveFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const h = pageHeight;
  const w = pageWidth;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  // Upper wave (lighter)
  for (let x = 0; x <= w + 5; x += 3) {
    const y1 = h - 18 + Math.sin((x / w) * Math.PI * 2) * 4;
    const y2 = h - 18 + Math.sin(((x + 3) / w) * Math.PI * 2) * 4;
    doc.line(x, y1, x + 3, y2);
  }
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.5);
  // Lower wave (darker)
  for (let x = 0; x <= w + 5; x += 4) {
    const y1 = h - 10 + Math.sin((x / w) * Math.PI * 2.5 + 0.5) * 5;
    const y2 = h - 10 + Math.sin(((x + 4) / w) * Math.PI * 2.5 + 0.5) * 5;
    doc.line(x, y1, Math.min(x + 4, w), y2);
  }
}

export function exportSalarySheetPdf(
  shopName: string,
  month: number,
  year: number,
  records: RecordWithEmployee[],
  leaveEntriesMap?: Record<string, LeaveEntry[]>,
  singleEmployeeName?: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  if (records.length === 0) {
    drawInvoiceHeader(doc, pageWidth, margin, shopName, month, year, y);
    y = 38;
    doc.setFontSize(10);
    doc.setTextColor(...C.grey);
    doc.text('No salary records for this period.', margin, y);
    doc.setTextColor(...C.black);
    drawWaveFooter(doc, pageWidth, pageHeight);
    doc.save(safeFilename(`Salary_Sheet_${shopName}_${getMonthName(month)}_${year}.pdf`));
    return;
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const emp = record.employee;
    const empName = emp?.name ?? '—';
    const empId = emp?.employee_id ?? '—';

    // —— Invoice-style header (compact) ——
    drawInvoiceHeader(doc, pageWidth, margin, shopName, month, year, 0);
    y = 36;

    // Employee block (like Billed to / From)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.black);
    doc.text('Employee Name:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(empName, margin + 32, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Employee ID:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(empId, margin + 32, y);
    y += 10;

    // Salary table (invoice itemized style – compact)
    const leaveEntries = (leaveEntriesMap?.[record.id] ?? []).slice().sort(
      (a, b) => a.leave_date.localeCompare(b.leave_date)
    );
    const head = [['Field', 'Value']];
    const body: [string, string][] = [
      ['Period', `${getMonthName(month)} ${year}`],
      ['Base Salary', formatCurrency(Number(emp?.base_salary ?? 0))],
      ['Attendance (days)', `${record.attendance_days} / 30`],
      ['Leave (Unpaid)', `${record.leave_unpaid} day(s)${leaveEntries.length > 0 ? ' — see below' : ''}`],
      ['Bonus', formatCurrency(Number(record.bonus))],
      ['Advance', formatCurrency(Number(record.advance_taken))],
      ['Penalty', formatCurrency(Number(record.penalty))],
      ['Increment', formatCurrency(Number(record.increment_adjustment))],
      ['Total', formatCurrency(Number(record.total_calculated))],
      ['Status', record.status],
    ];

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: margin, right: margin },
      theme: 'plain',
      headStyles: {
        fillColor: C.light,
        textColor: C.black,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: { top: 3.5, right: 5, bottom: 3.5, left: 6 },
        lineWidth: 0.2,
        lineColor: C.light,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: C.black,
        cellPadding: { top: 3, right: 5, bottom: 3, left: 6 },
        lineWidth: 0.15,
        lineColor: [230, 230, 230],
      },
      columnStyles: {
        0: { cellWidth: 46, fontStyle: 'bold', textColor: C.dark },
        1: { cellWidth: 'auto' },
      },
      tableLineColor: [230, 230, 230],
      tableLineWidth: 0.2,
    });

    y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 6;

    // Leave details (only if present, very compact)
    if (leaveEntries.length > 0 && y < pageHeight - 55) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.dark);
      doc.text('Leave details (date & reason)', margin, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Leave date', 'Reason']],
        body: leaveEntries.map((e) => [formatLeaveDate(e.leave_date), e.reason?.trim() || '—']),
        margin: { left: margin, right: margin },
        theme: 'plain',
        headStyles: {
          fillColor: C.light,
          textColor: C.black,
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: { top: 2.5, right: 4, bottom: 2.5, left: 4 },
          lineWidth: 0.15,
          lineColor: [235, 235, 235],
        },
        bodyStyles: { fontSize: 8, cellPadding: { top: 2, right: 4, bottom: 2, left: 4 }, lineColor: [235, 235, 235], lineWidth: 0.1 },
        columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 'auto' } },
        tableLineColor: [235, 235, 235],
        tableLineWidth: 0.15,
      });
      y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 6;
    }

    // Signature at bottom (same page)
    const sigY = pageHeight - 28;
    if (y > sigY - 5) y = sigY - 18;
    doc.setDrawColor(...C.grey);
    doc.setLineWidth(0.3);
    const sigW = 50;
    const sigX = pageWidth - margin - sigW;
    doc.line(sigX, sigY, sigX + sigW, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.grey);
    doc.text('Authorized Signature', sigX + sigW / 2, sigY + 4, { align: 'center' });

    // Decorative wave at very bottom
    drawWaveFooter(doc, pageWidth, pageHeight);

    // If multiple employees, next page
    if (i < records.length - 1) {
      doc.addPage();
      y = margin;
    }
  }

  function drawInvoiceHeader(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    shopName: string,
    month: number,
    year: number,
    startY: number
  ): void {
    const y = startY;
    doc.setTextColor(...C.black);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(shopName, margin, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('SALARY SHEET', margin, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.grey);
    doc.text(`Date: ${getMonthName(month)} ${year}`, margin, y + 26);
    doc.setTextColor(...C.black);
  }

  const baseName = singleEmployeeName
    ? `Salary_Sheet_${shopName}_${singleEmployeeName}_${getMonthName(month)}_${year}.pdf`
    : `Salary_Sheet_${shopName}_${getMonthName(month)}_${year}.pdf`;
  doc.save(safeFilename(baseName));
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._\-\s]/g, '_').replace(/\s+/g, '_');
}
