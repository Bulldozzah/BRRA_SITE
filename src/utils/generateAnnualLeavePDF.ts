import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AnnualLeaveApplication, ANNUAL_LEAVE_STATUS_LABELS } from "@/types/leave";
import brraLogoUrl from "@/assets/brra-logo.jpg";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateAnnualLeavePDF(app: AnnualLeaveApplication): void {
  try {
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
    try {
      doc.addImage(brraLogoUrl, "JPEG", margin, y, 18, 18);
    } catch {
      // Logo failed to load, skip it
    }

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

    // Gold line
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- TITLE ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("ANNUAL LEAVE APPLICATION FORM", pageWidth / 2, y, { align: "center" });
    y += 5;

    // Status badge
    const statusText = ANNUAL_LEAVE_STATUS_LABELS[app.status] || app.status;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    if (app.status === "approved") {
      doc.setTextColor(...greenColor);
    } else if (app.status === "hod_rejected" || app.status === "hr_rejected" || app.status === "rejected") {
      doc.setTextColor(239, 68, 68);
    } else {
      doc.setTextColor(...gold);
    }
    doc.text(`Status: ${statusText.toUpperCase()}`, pageWidth / 2, y + 5, { align: "center" });
    y += 12;

    // --- PART A: PERSONAL DETAILS ---
    doc.setTextColor(...darkGray);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PART A — PERSONAL & EMPLOYMENT DETAILS", margin, y);
    y += 2;

    autoTable(doc, {
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
        ["Surname:", app.surname || "—", "Other Names:", app.other_names || "—"],
        ["Personnel File No:", app.personnel_file_no || "—", "NRC No:", app.nrc_number || "—"],
        ["Department:", app.department || "—", "Position:", app.position || "—"],
        ["Grade:", app.grade || "—", "Annual Salary:", app.annual_salary ? `K${app.annual_salary.toLocaleString()}` : "—"],
      ],
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // --- LEAVE HISTORY ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("LEAVE HISTORY", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      bodyStyles: { fontSize: 9, textColor: darkGray },
      alternateRowStyles: { fillColor: [250, 248, 240] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 55 },
        1: { cellWidth: contentWidth / 2 - 27.5 },
        2: { fontStyle: "bold", cellWidth: 55 },
        3: { cellWidth: contentWidth / 2 - 27.5 },
      },
      body: [
        ["Last Leave Return Date:", formatDate(app.last_leave_return_date), "Last Leave Commuted:", formatDate(app.last_leave_commuted_date)],
        ["Last Travel Allowance:", formatDate(app.last_travel_allowance_date), "", ""],
      ],
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // --- LEAVE REQUEST DETAILS ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("LEAVE REQUEST DETAILS", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      bodyStyles: { fontSize: 9, textColor: darkGray },
      alternateRowStyles: { fillColor: [250, 248, 240] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
        1: { cellWidth: contentWidth / 2 - 22.5 },
        2: { fontStyle: "bold", cellWidth: 45 },
        3: { cellWidth: contentWidth / 2 - 22.5 },
      },
      body: [
        ["Days Applied:", String(app.leave_days_applied), "Days Commuted:", String(app.days_commuted)],
        ["Total Days Deducted:", String(app.total_days_deducted), "First Day of Leave:", formatDate(app.leave_start_date)],
        ["Resume Duty Date:", formatDate(app.resume_date), "Application Date:", formatDate(app.application_date)],
        ["Leave Address:", app.leave_address || "—", "", ""],
        ["Balance Before:", app.leave_balance_before != null ? String(app.leave_balance_before) + " days" : "—", "Balance After:", app.leave_balance_after != null ? String(app.leave_balance_after) + " days" : "—"],
      ],
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // --- APPROVAL WORKFLOW ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("APPROVAL WORKFLOW", margin, y);
    y += 2;

    const approval = app.approval;
    const approvalRows: string[][] = [];

    // H.o.D
    approvalRows.push([
      "Head of Department:",
      app.hod_approver_name || "—",
      "Recommendation:",
      approval?.hod_recommendation || "Pending",
    ]);
    if (approval?.hod_comment) {
      approvalRows.push(["H.o.D Comment:", approval.hod_comment, "H.o.D Date:", formatDate(approval.hod_date)]);
    }
    if (approval?.hod_employment_status) {
      approvalRows.push(["Employment Status:", approval.hod_employment_status, "Designation:", approval.hod_designation || "—"]);
    }

    // HR Officer
    approvalRows.push([
      "HR Officer:",
      app.hr_approver_name || "—",
      "HR Certified:",
      approval?.hr_certified ? "YES" : "Pending",
    ]);
    if (approval?.hr_comment) {
      approvalRows.push(["HR Comment:", approval.hr_comment, "HR Date:", formatDate(approval.hr_date)]);
    }
    if (approval?.hr_leave_balance != null) {
      approvalRows.push([
        "Leave Days B/F:",
        String(approval.hr_leave_days_brought_forward ?? "—"),
        "Leave Balance (HR):",
        String(approval.hr_leave_balance),
      ]);
    }
    if (approval?.hr_qualifying_service_from) {
      approvalRows.push([
        "Qualifying Service:",
        `${formatDate(approval.hr_qualifying_service_from)} — ${formatDate(approval.hr_qualifying_service_to)}`,
        "Months in Service:",
        String(approval.hr_months_in_service ?? "—"),
      ]);
    }

    // Executive Director
    approvalRows.push([
      "Executive Director:",
      app.ed_approver_name || "—",
      "Decision:",
      approval?.agency_approved === true ? "APPROVED" : approval?.agency_approved === false ? "NOT APPROVED" : "Pending",
    ]);
    if (approval?.agency_comment) {
      approvalRows.push(["ED Comment:", approval.agency_comment, "ED Date:", formatDate(approval.agency_date)]);
    }
    if (approval?.agency_leave_granted_days != null) {
      approvalRows.push([
        "Days Granted:",
        String(approval.agency_leave_granted_days),
        "Leave Type:",
        approval.agency_leave_type || "—",
      ]);
    }
    if (approval?.agency_resume_duty_date) {
      approvalRows.push(["Resume Duty Date (ED):", formatDate(approval.agency_resume_duty_date), "", ""]);
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
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

    y = (doc as any).lastAutoTable.finalY + 12;

    // --- SIGNATURES ---
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("SIGNATURES", margin, y);
    y += 8;

    const sigBoxWidth = contentWidth / 4 - 3;
    const sigBoxHeight = 28;

    const sigLabels = ["Employee", "Head of Department", "HR Officer", "Executive Director"];
    const sigNames = [
      `${app.surname} ${app.other_names}`,
      app.hod_approver_name || "________________",
      app.hr_approver_name || "________________",
      app.ed_approver_name || "________________",
    ];
    const sigDates = [
      formatDate(app.application_date),
      formatDate(approval?.hod_date),
      formatDate(approval?.hr_date),
      formatDate(approval?.agency_date),
    ];

    for (let i = 0; i < 4; i++) {
      const x = margin + i * (sigBoxWidth + 4);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(x, y, sigBoxWidth, sigBoxHeight);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...lightGray);
      doc.text(sigLabels[i], x + 2, y + 4);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkGray);
      const name = sigNames[i].length > 18 ? sigNames[i].substring(0, 18) + "..." : sigNames[i];
      doc.text(name, x + 2, y + 12);

      doc.setFontSize(6);
      doc.setTextColor(...lightGray);
      doc.text(`Date: ${sigDates[i]}`, x + 2, y + 22);
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
    doc.text("Business Regulatory Review Agency (BRRA) — Annual Leave Management", pageWidth / 2, y, { align: "center" });
    doc.text("This is a system-generated document.", pageWidth / 2, y + 4, { align: "center" });
    doc.text(`Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth / 2, y + 8, { align: "center" });

    // Save
    const fileName = `Annual_Leave_${app.surname}_${formatDate(app.leave_start_date).replace(/\s/g, "_")}.pdf`;
    doc.save(fileName);

  } catch (err: any) {
    console.error("PDF generation error:", err);
    alert("Failed to generate PDF: " + (err?.message || "Unknown error"));
  }
}
