import jsPDF from "jspdf";
import "jspdf-autotable";
import { LeaveApplication, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from "@/types/leave";
import brraLogoUrl from "@/assets/brra-logo.jpg";

// Extend jsPDF type for autoTable plugin
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateLeavePDF(app: LeaveApplication): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Colors
  const gold = [184, 134, 11] as [number, number, number];
  const darkGray = [51, 51, 51] as [number, number, number];
  const lightGray = [150, 150, 150] as [number, number, number];
  const greenColor = [34, 197, 94] as [number, number, number];

  // --- HEADER ---
  // Try to load and add logo
  try {
    const logoImg = await loadImage(brraLogoUrl);
    doc.addImage(logoImg, "JPEG", margin, y, 18, 18);
  } catch {
    // Logo failed to load, skip it
  }

  // Header text
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gold);
  doc.text("BUSINESS REGULATORY REVIEW AGENCY", margin + 22, y + 7);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...lightGray);
  doc.text("Republic of Zambia", margin + 22, y + 13);
  doc.text("www.brra.org.zm", margin + 22, y + 17);

  y += 25;

  // Gold line under header
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- TITLE ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("LEAVE APPLICATION FORM", pageWidth / 2, y, { align: "center" });
  y += 5;

  // Status badge
  const statusText = LEAVE_STATUS_LABELS[app.status] || app.status;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  if (app.status === "approved") {
    doc.setTextColor(...greenColor);
  } else if (app.status === "rejected") {
    doc.setTextColor(239, 68, 68);
  } else {
    doc.setTextColor(...gold);
  }
  doc.text(`Status: ${statusText.toUpperCase()}`, pageWidth / 2, y + 5, { align: "center" });
  y += 12;

  // --- EMPLOYEE DETAILS TABLE ---
  doc.setTextColor(...darkGray);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEE DETAILS", margin, y);
  y += 2;

  const employeeName = app.employee?.full_name || app.employee_profile?.full_name || "—";
  const employeeNumber = app.employee?.employee_number || app.employee_profile?.employee_number || "—";
  const departmentName = app.department?.name || "—";
  const positionTitle = app.position?.title || "—";

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: gold, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: darkGray },
    alternateRowStyles: { fillColor: [250, 248, 240] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: contentWidth / 2 - 22.5 },
      2: { fontStyle: "bold", cellWidth: 45 },
      3: { cellWidth: contentWidth / 2 - 22.5 },
    },
    body: [
      ["Employee Name:", employeeName, "Employee No:", employeeNumber],
      ["Department:", departmentName, "Position:", positionTitle],
    ],
  });

  y = doc.lastAutoTable.finalY + 8;

  // --- LEAVE DETAILS TABLE ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("LEAVE DETAILS", margin, y);
  y += 2;

  const leaveTypeLabel = LEAVE_TYPE_LABELS[app.leave_type] || app.leave_type;

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: gold, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: darkGray },
    alternateRowStyles: { fillColor: [250, 248, 240] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: contentWidth / 2 - 22.5 },
      2: { fontStyle: "bold", cellWidth: 45 },
      3: { cellWidth: contentWidth / 2 - 22.5 },
    },
    body: [
      ["Leave Type:", leaveTypeLabel, "Application Date:", formatDate(app.application_date)],
      ["Start Date:", formatDate(app.start_date), "End Date:", formatDate(app.end_date)],
      [
        "Days Requested:",
        String(app.requested_days),
        "Days Approved:",
        app.approved_days != null ? String(app.approved_days) : "—",
      ],
      ["Leave Address:", app.leave_address || "—", "Leave Balance:", app.leave_balance != null ? String(app.leave_balance) : "—"],
    ],
  });

  y = doc.lastAutoTable.finalY + 8;

  // --- LEAVE RATE & ACCRUAL ---
  if (app.leave_rate || app.days_accrued || app.last_leave_end_date || app.months_since_last_leave) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("ACCRUAL INFORMATION", margin, y);
    y += 2;

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: gold, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: darkGray },
      alternateRowStyles: { fillColor: [250, 248, 240] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
        1: { cellWidth: contentWidth / 2 - 22.5 },
        2: { fontStyle: "bold", cellWidth: 45 },
        3: { cellWidth: contentWidth / 2 - 22.5 },
      },
      body: [
        [
          "Leave Rate:",
          app.leave_rate ? `${app.leave_rate} days/month` : "—",
          "Days Accrued:",
          app.days_accrued != null ? String(app.days_accrued) : "—",
        ],
        [
          "Last Leave Ended:",
          formatDate(app.last_leave_end_date),
          "Months Since:",
          app.months_since_last_leave != null ? String(app.months_since_last_leave) : "—",
        ],
      ],
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // --- APPROVAL WORKFLOW ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("APPROVAL WORKFLOW", margin, y);
  y += 2;

  const approvalRows: string[][] = [];

  // H.o.D
  if (app.hod_name || app.hod_recommendation) {
    approvalRows.push([
      "Head of Department:",
      app.hod_name || "—",
      "Recommendation:",
      app.hod_recommendation === "recommended"
        ? "RECOMMENDED"
        : app.hod_recommendation === "not_recommended"
        ? "NOT RECOMMENDED"
        : "Pending",
    ]);
    if (app.hod_comment) {
      approvalRows.push(["H.o.D Comment:", app.hod_comment, "H.o.D Date:", formatDate(app.hod_date)]);
    }
  }

  // Executive Director / Approver
  if (app.ed_name || app.approver_id) {
    approvalRows.push([
      "Executive Director:",
      app.ed_name || "—",
      "Decision:",
      app.status === "approved" ? "APPROVED" : app.status === "rejected" ? "REJECTED" : "Pending",
    ]);
    if (app.approver_comment) {
      approvalRows.push(["ED Comment:", app.approver_comment, "Approval Date:", formatDate(app.approval_date)]);
    }
    if (app.rejection_reason) {
      approvalRows.push(["Rejection Reason:", app.rejection_reason, "", ""]);
    }
  }

  if (approvalRows.length === 0) {
    approvalRows.push(["Status:", "Awaiting review", "", ""]);
  }

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: gold, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: darkGray },
    alternateRowStyles: { fillColor: [250, 248, 240] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: contentWidth / 2 - 22.5 },
      2: { fontStyle: "bold", cellWidth: 45 },
      3: { cellWidth: contentWidth / 2 - 22.5 },
    },
    body: approvalRows,
  });

  y = doc.lastAutoTable.finalY + 15;

  // --- SIGNATURES SECTION ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text("SIGNATURES", margin, y);
  y += 8;

  const sigBoxWidth = contentWidth / 3 - 4;
  const sigBoxHeight = 25;

  // Draw 3 signature boxes
  const sigLabels = ["Employee", "Head of Department", "Executive Director"];
  const sigNames = [employeeName, app.hod_name || "________________", app.ed_name || "________________"];
  const sigDates = [formatDate(app.application_date), formatDate(app.hod_date), formatDate(app.approval_date)];

  for (let i = 0; i < 3; i++) {
    const x = margin + i * (sigBoxWidth + 6);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(x, y, sigBoxWidth, sigBoxHeight);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...lightGray);
    doc.text(sigLabels[i], x + 3, y + 4);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkGray);
    doc.text(sigNames[i], x + 3, y + 12);

    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.text(`Date: ${sigDates[i]}`, x + 3, y + 20);
  }

  y += sigBoxHeight + 12;

  // --- FOOTER ---
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...lightGray);
  doc.text("Business Regulatory Review Agency (BRRA) — Staff Portal", pageWidth / 2, y, { align: "center" });
  doc.text("This is a system-generated document.", pageWidth / 2, y + 4, { align: "center" });
  doc.text(`Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth / 2, y + 8, { align: "center" });

  // Save
  const fileName = `Leave_${LEAVE_TYPE_LABELS[app.leave_type]?.replace(/\s/g, "_") || app.leave_type}_${formatDate(app.start_date).replace(/\s/g, "_")}.pdf`;
  doc.save(fileName);
}
