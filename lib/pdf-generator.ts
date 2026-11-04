import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// PCH Hire Brand Colors
export const PCH_RED: [number, number, number] = [215, 25, 32];      // #D71920 Primary
export const PCH_DARK_RED: [number, number, number] = [181, 20, 26]; // #B5141A Accent
export const PCH_BLACK: [number, number, number] = [21, 21, 21];     // #151515 Dark Charcoal
export const PCH_GRAY: [number, number, number] = [107, 114, 128];   // Neutral Gray
export const PCH_LIGHT_BG: [number, number, number] = [254, 242, 242]; // Red-50 soft tint
export const TEXT_DARK: [number, number, number] = [31, 41, 55];    // Gray-800
export const BORDER_COLOR: [number, number, number] = [229, 231, 235]; // Gray-200

// Helper to format values cleanly
function val(value: any, fallback: any = "—"): string {
  if (value === null || value === undefined) return String(fallback);
  if (typeof value === "boolean") return value ? "YES" : "NO";
  const str = String(value).trim();
  return str === "" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined" ? String(fallback) : str;
}

function curr(amount: any): string {
  if (amount === null || amount === undefined || amount === "") return "£0.00";
  const num = parseFloat(String(amount).replace(/[^0-9.-]/g, ""));
  return isNaN(num) ? "£0.00" : `£${num.toFixed(2)}`;
}

// Universal Header
export function addPCHHeader(doc: jsPDF, title: string, claimId: string, pageNum?: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Red Brand Stripe
  doc.setFillColor(...PCH_RED);
  doc.rect(0, 0, pageWidth, 22, "F");

  // PCH Logo / Name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("PCH HIRE", 14, 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ACCIDENT MANAGEMENT & FLEET HIRE", 48, 15);

  // Claim ID Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`CLAIM ${claimId}`, pageWidth - 14, 15, { align: "right" });

  // Sub-banner with Document Title
  doc.setFillColor(...PCH_BLACK);
  doc.rect(0, 22, pageWidth, 9, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 14, 28);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`ISSUED: ${today.toUpperCase()}`, pageWidth - 14, 28, { align: "right" });
}

// Universal Footer
export function addPCHFooter(doc: jsPDF, pageNum: number = 1, totalPages: number = 1) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

  doc.setTextColor(140, 140, 140);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "PCH Hire Ltd • Replacement Vehicle Specialists • Tel: 0121 000 0000 • Web: pchhire.co.uk",
    14,
    pageHeight - 6.5
  );

  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 6.5, { align: "right" });
}

// Universal Signature Box Renderer
function renderSignatureBox(
  doc: jsPDF,
  label: string,
  sigUrlOrData: string | null | undefined,
  x: number,
  y: number,
  width: number = 55,
  height: number = 24
) {
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, "FD");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PCH_BLACK);
  doc.text(label.toUpperCase(), x + 2.5, y + 4);

  if (sigUrlOrData && (sigUrlOrData.startsWith("data:image") || sigUrlOrData.startsWith("http"))) {
    try {
      doc.addImage(sigUrlOrData, "PNG", x + 3, y + 5.5, width - 6, height - 7.5);
    } catch {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("Signed Electronically", x + width / 2, y + height / 2 + 1, { align: "center" });
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("Pending Signature", x + width / 2, y + height / 2 + 1, { align: "center" });
  }
}

// ============================================================================
// 1. RENTAL AGREEMENT PDF (Complete & Branded)
// ============================================================================
export function generateRentalAgreementPDF(claimId: string, data: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let currentPage = 1;

  // --- PAGE 1: Parties, Vehicle & Declarations ---
  addPCHHeader(doc, "Vehicle Hire Agreement", claimId, 1, 2);

  // 1. Hirer Details
  autoTable(doc, {
    startY: 36,
    margin: { left: 14, right: 14 },
    head: [["1. HIRER IDENTIFICATION & DRIVING LICENCE", "", "", ""]],
    body: [
      ["Full Name", `${val(data.title, "")} ${val(data.hirer_name)}`.trim(), "Date of Birth", val(data.dob)],
      ["Permanent Address", val(data.hirer_address || data.permanent_address), "Postcode", val(data.postcode)],
      ["Contact Telephone", val(data.hirer_phone || data.mobile_tel || data.home_tel), "Email Address", val(data.hirer_email)],
      ["National Insurance No", val(data.ni_number), "Occupation", val(data.occupation)],
      ["Employer Name", val(data.employer_name), "Employer Address", val(data.employer_address)],
      ["Driving Licence No", val(data.driving_licence_no), "Licence Issue / Expiry", `${val(data.licence_issue_date)} — ${val(data.licence_expiry_date)}`],
      ["Issuing Authority", val(data.licence_country || data.issuing_authority, "DVLA / UK"), "Additional Driver", val(data.additional_driver_name, "None")]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold", halign: "left" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 38 },
      3: { cellWidth: 51 }
    }
  });

  // 2. Hire Vehicle Details
  let currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["2. HIRE VEHICLE DETAILS & RATES", "", "", ""]],
    body: [
      ["Vehicle Registration", val(data.hire_vehicle_reg).toUpperCase(), "Make & Model", `${val(data.hire_vehicle_make, "")} ${val(data.hire_vehicle_model, "")}`.trim()],
      ["Vehicle Group", val(data.hire_vehicle_group, "Standard"), "Daily Rate", curr(data.daily_rate || data.hire_vehicle_rate_per_day)],
      ["Hire Start Date / Time", `${val(data.hire_start_date)} ${val(data.hire_vehicle_time_out, "")}`.trim(), "Hire End Date / Time", `${val(data.hire_end_date)} ${val(data.hire_vehicle_time_in, "")}`.trim()],
      ["Mileage Out / In", `${val(data.miles_out, "0")} / ${val(data.miles_in, "0")}`, "Fuel Level Out / In", `${val(data.fuel_out, "Full")} / ${val(data.fuel_in, "—")}`],
      ["Insurance Excess", curr(data.excess_amount), "Own Insurance Opted?", val(data.own_insurance_confirm, "NO")]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 38 },
      3: { cellWidth: 51 }
    }
  });

  // 3. Declarations Matrix
  currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["3. INSURANCE & MEDICAL DECLARATIONS", "DECLARATION ANSWER"]],
    body: [
      ["1. Any motoring convictions, points or endorsements in the past 3 years?", val(data.motoring_offence_3yrs, "NO")],
      ["2. Disqualified from driving in the past 5 years?", val(data.disqualified_5yrs, "NO")],
      ["3. Any road traffic accidents or claims in the past 3 years?", val(data.accident_3yrs, "NO")],
      ["4. Any motor insurance declined, cancelled or special terms imposed in past 5 years?", val(data.insurance_declined_5yrs, "NO")],
      ["5. Any criminal convictions involving fraud, theft, or dishonesty?", val(data.dishonesty_conviction, "NO")],
      ["6. Any physical or mental health conditions affecting ability to safely drive?", val(data.medical_condition1, "NO")]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.6 },
    columnStyles: {
      0: { cellWidth: 145 },
      1: { halign: "center", fontStyle: "bold", cellWidth: 37 }
    }
  });

  // Page 1 Footer
  addPCHFooter(doc, 1, 2);

  // --- PAGE 2: Financials & Signatures ---
  doc.addPage();
  currentPage = 2;
  addPCHHeader(doc, "Vehicle Hire Agreement — Charges & Execution", claimId, 2, 2);

  // 4. Vehicle Swaps (if applicable)
  const swapHistory = Array.isArray(data.change_vehicle_history) ? data.change_vehicle_history : [];
  if (swapHistory.length > 0) {
    const swapRows = swapHistory.map((s: any, idx: number) => [
      `Vehicle ${idx + 1}`,
      val(s.vehicle_reg).toUpperCase(),
      `${val(s.vehicle_make)} ${val(s.vehicle_model)}`,
      `${val(s.date_out)} to ${val(s.date_in)}`,
      `${val(s.miles_out)} - ${val(s.miles_in)}`,
      curr(s.rate_per_day)
    ]);

    autoTable(doc, {
      startY: 36,
      margin: { left: 14, right: 14 },
      head: [["SWAP RECORD", "REGISTRATION", "MAKE & MODEL", "PERIOD", "MILEAGE", "RATE/DAY"]],
      body: swapRows,
      theme: "striped",
      headStyles: { fillColor: PCH_BLACK, fontSize: 7.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  } else {
    currentY = 36;
  }

  // 5. Financial Charges Breakdown
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["5. FINANCIAL SUMMARY & ITEMIZED HIRE CHARGES", "AMOUNT"]],
    body: [
      [`Daily Hire Rate (${val(data.total_days, 1)} day(s) @ ${curr(data.daily_rate)}/day)`, curr(data.subtotal || data.total_cost)],
      ["Collision Damage Waiver (CDW)", curr(data.cdw_per_day)],
      ["Administration & Documentation Fee", curr(data.admin_fee)],
      ["Delivery & Collection Charge", curr(data.delivery_charge)],
      ["Refuelling / Fuel Charges", curr(data.refuelling_total)],
      ["Subtotal (Excl. VAT)", curr(data.subtotal || data.total_cost)],
      ["Value Added Tax (VAT @ 20%)", curr(data.vat)],
      ["TOTAL AMOUNT PAYABLE", curr(data.total_cost)]
    ],
    theme: "grid",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 135 },
      1: { halign: "right", fontStyle: "bold", cellWidth: 47 }
    }
  });

  // 6. Signatures Grid
  currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PCH_BLACK);
  doc.text("6. AUTHORISATION & STATUTORY SIGNATURES", 14, currentY);

  currentY += 4;
  const sigRow1Y = currentY;
  renderSignatureBox(doc, "Hirer Agreement (Terms)", data.hirer_signature_terms, 14, sigRow1Y, 57, 26);
  renderSignatureBox(doc, "Company Signature (PCH)", data.company_signature, 77, sigRow1Y, 57, 26);
  renderSignatureBox(doc, "Insurance Proposal", data.hirer_signature_insurance, 140, sigRow1Y, 56, 26);

  const sigRow2Y = sigRow1Y + 30;
  renderSignatureBox(doc, `Hirer Declaration (${val(data.declaration_date, "Date")})`, data.declaration_signature, 14, sigRow2Y, 88, 26);
  renderSignatureBox(doc, `Statement of Liability s.172 (${val(data.liability_date, "Date")})`, data.liability_signature, 108, sigRow2Y, 88, 26);

  // Statutory Liability Text
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const liabilityText =
    "I acknowledge that as the hirer of the vehicle I am liable as the owner in respect of any fixed penalty offences committed under section 172 of the Road Traffic Act 1988, excess parking charges, bus lane fines and congestion charges incurred during the period of hire.";
  doc.text(doc.splitTextToSize(liabilityText, 182), 14, sigRow2Y + 31);

  addPCHFooter(doc, 2, 2);

  // Save PDF
  doc.save(`PCH_Hire_Agreement_Claim_${claimId}.pdf`);
}

// ============================================================================
// 2. RTA ACCIDENT CLAIM FORM PDF (With Sketch Canvas & Witnesses)
// ============================================================================
export function generateAccidentClaimPDF(claimId: string, data: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // --- PAGE 1: Accident Circumstances & Vehicle Comparison ---
  addPCHHeader(doc, "Accident Claim (RTA) Incident Report", claimId, 1, 2);

  // 1. Incident Overview
  autoTable(doc, {
    startY: 36,
    margin: { left: 14, right: 14 },
    head: [["1. INCIDENT CIRCUMSTANCES & ROAD ENVIRONMENT", "", "", ""]],
    body: [
      ["Date & Time of Accident", `${val(data.accident_date)} at ${val(data.accident_time)}`, "Estimated Speed", val(data.speed_before_impact, "Stationary / Low")],
      ["Exact Incident Location", val(data.accident_location), "Liability Assessment", val(data.fault_opinion, "Non-Fault Claim")],
      ["Weather Conditions", val(data.weather_conditions, "Clear"), "Road Surface", val(data.road_conditions, "Dry")],
      ["Road Type / Layout", val(data.road_type, "Single Carriageway"), "Visibility & Lights", `${val(data.visibility, "Good")} / ${val(data.street_lighting, "Lit")}`],
      ["Traffic Density", val(data.traffic_conditions, "Moderate"), "Police Force & Ref", `${val(data.police_attended === "Yes" ? val(data.police_station) : "Did Not Attend")} (${val(data.police_ref, "N/A")})`]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 38 },
      3: { cellWidth: 51 }
    }
  });

  // 2. Client vs Third Party Comparison
  let currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["2. VEHICLE & DRIVER COMPARISON", "CLIENT (PCH)", "THIRD PARTY"]],
    body: [
      ["Driver Full Name", val(data.driver_full_name || data.client_name), val(data.third_party_name)],
      ["Driver Address", val(data.driver_address), val(data.third_party_address)],
      ["Contact Telephone", val(data.driver_telephone), val(data.third_party_phone)],
      ["Vehicle Registration", val(data.client_registration).toUpperCase(), val(data.third_party_registration).toUpperCase()],
      ["Vehicle Make & Model", `${val(data.client_make, "")} ${val(data.client_model, "")}`.trim(), `${val(data.third_party_vehicle_make, "")} ${val(data.third_party_vehicle_model, "")}`.trim()],
      ["Insurance Provider", val(data.client_policy_holder || "PCH / Client Policy"), val(data.third_party_policy_no || "TPI Details Pending")],
      ["Vehicle Drivable / Damage", `${val(data.vehicle_drivable, "NO")} (${val(data.client_damage_desc, "Moderate")})`, val(data.third_party_damage_desc, "Damage Recorded")]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
      1: { cellWidth: 70 },
      2: { cellWidth: 70 }
    }
  });

  // 3. Safety Checklists
  currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["3. SAFETY & INVESTIGATION CHECKLIST", "STATUS", "CHECKPOINT", "STATUS"]],
    body: [
      ["Police Attended Scene?", val(data.police_attended, "NO"), "Airbags Deployed?", val(data.airbags_deployed, "NO")],
      ["Ambulance / Medical Attended?", val(data.ambulance_attended, "NO"), "Seatbelts Worn by All?", val(data.seatbelts_worn, "YES")],
      ["CCTV Camera Available?", val(data.cctv_available, "NO"), "Dashcam Footage Available?", val(data.dashcam_footage, "NO")],
      ["Photos Taken at Scene?", val(data.photos_taken, "YES"), "Repairs Commenced?", val(data.repairs_commenced, "NO")]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.6 },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { fontStyle: "bold", halign: "center", cellWidth: 29 },
      2: { cellWidth: 62 },
      3: { fontStyle: "bold", halign: "center", cellWidth: 29 }
    }
  });

  addPCHFooter(doc, 1, 2);

  // --- PAGE 2: Narrative, Drawing Sketch & Signatures ---
  doc.addPage();
  addPCHHeader(doc, "Accident Claim (RTA) Incident Report", claimId, 2, 2);

  // 4. Narrative Description
  autoTable(doc, {
    startY: 36,
    margin: { left: 14, right: 14 },
    head: [["4. STATEMENT OF ACCIDENT CIRCUMSTANCES"]],
    body: [[val(data.accident_description, "Detailed driver description on file.")]],
    theme: "striped",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK, cellPadding: 3 }
  });

  // 5. Incident Sketch Canvas (if present)
  currentY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PCH_BLACK);
  doc.text("5. ACCIDENT CIRCUMSTANCE SKETCH DIAGRAM", 14, currentY);

  currentY += 2;
  const sketchHeight = 52;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, currentY, 182, sketchHeight, 1.5, 1.5, "FD");

  if (data.circumstance_drawing && data.circumstance_drawing.startsWith("data:image")) {
    try {
      doc.addImage(data.circumstance_drawing, "PNG", 16, currentY + 2, 178, sketchHeight - 4);
    } catch {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Accident Sketch Embedded in System", 105, currentY + sketchHeight / 2, { align: "center" });
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text("No Circumstance Sketch Diagram Provided", 105, currentY + sketchHeight / 2, { align: "center" });
  }

  // 6. Witnesses
  currentY += sketchHeight + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["6. INDEPENDENT WITNESS DETAILS", "NAME & CONTACT DETAILS"]],
    body: [
      ["Witness 1", `${val(data.witness1_name)} • ${val(data.witness1_phone)} • ${val(data.witness1_address)}`],
      ["Witness 2", `${val(data.witness2_name)} • ${val(data.witness2_phone)} • ${val(data.witness2_address)}`]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 144 }
    }
  });

  // 7. Statement of Truth Signature
  currentY = (doc as any).lastAutoTable.finalY + 6;
  renderSignatureBox(doc, "Client Statement of Truth Signature", data.client_signature, 14, currentY, 95, 25);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const truthStatement =
    "I confirm that the facts stated in this incident report are true and accurate to the best of my knowledge and belief. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement without an honest belief in its truth.";
  doc.text(doc.splitTextToSize(truthStatement, 82), 114, currentY + 6);

  addPCHFooter(doc, 2, 2);

  doc.save(`PCH_Accident_Claim_RTA_${claimId}.pdf`);
}

// ============================================================================
// 3. PRE-INSPECTION CHECKLIST PDF (30-Point Matrix & Diagram)
// ============================================================================
export function generatePreInspectionPDF(claimId: string, data: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // --- PAGE 1: Details & 30 Inspection Points ---
  addPCHHeader(doc, "Vehicle Pre-Inspection & Condition Checklist", claimId, 1, 2);

  // 1. Handover Info
  autoTable(doc, {
    startY: 36,
    margin: { left: 14, right: 14 },
    head: [["1. HANDOVER & APPOINTMENT DETAILS", "", "", ""]],
    body: [
      ["Vehicle Registration", val(data.vehicle_reg).toUpperCase(), "Make & Model", val(data.make_model)],
      ["Detailer / Inspector", val(data.detailer), "Customer Name", val(data.customer_name || data.customer)],
      ["Date & Time Out", `${val(data.date_out)} ${val(data.time_out, "")}`.trim(), "Order / Reference No", val(data.order_number)],
      ["Recorded Mileage", `${val(data.mileage_out, 0)} miles`, "Fuel Tank Out", val(data.fuel_level_out, "Full")]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 38 },
      3: { cellWidth: 51 }
    }
  });

  // 2. 30-Point Checklist Matrix (Split into 2 Columns of 15)
  const checklistLabels = [
    "Windscreen & Front Glass", "Bonnet / Engine Hood", "Front Bumper & Grille", "Front Number Plate",
    "Headlights & Indicators", "Driver Front Wing", "Driver Front Wheel & Tire", "Driver Front Door",
    "Driver Wing Mirror", "Driver Sill & Underbody", "Driver Rear Door", "Driver Rear Quarter Panel",
    "Driver Rear Wheel & Tire", "Roof & Aerial", "Rear Window & Tailgate", "Rear Bumper & Diffuser",
    "Rear Number Plate & Light", "Taillights & Reflectors", "Passenger Rear Quarter", "Passenger Rear Wheel & Tire",
    "Passenger Rear Door", "Passenger Sill & Underside", "Passenger Front Door", "Passenger Wing Mirror",
    "Passenger Front Wing", "Passenger Front Wheel & Tire", "Spare Wheel, Jack & Tool Kit", "Dashboard & Console Controls",
    "Seats, Belts & Upholstery", "Cleanliness & Vehicle Odour"
  ];

  const checkpointRows: any[] = [];
  for (let i = 0; i < 15; i++) {
    const leftIdx = i + 1;
    const rightIdx = i + 16;
    const leftVal = val(data[`condition_${leftIdx}`], "Good");
    const rightVal = val(data[`condition_${rightIdx}`], "Good");
    checkpointRows.push([
      `${leftIdx}. ${checklistLabels[i]}`,
      leftVal,
      `${rightIdx}. ${checklistLabels[i + 15]}`,
      rightVal
    ]);
  }

  let currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["INSPECTION CHECKPOINT (1-15)", "STATUS", "INSPECTION CHECKPOINT (16-30)", "STATUS"]],
    body: checkpointRows,
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 6.5, textColor: TEXT_DARK, cellPadding: 1.4 },
    columnStyles: {
      0: { cellWidth: 63 },
      1: { halign: "center", fontStyle: "bold", cellWidth: 28 },
      2: { cellWidth: 63 },
      3: { halign: "center", fontStyle: "bold", cellWidth: 28 }
    }
  });

  addPCHFooter(doc, 1, 2);

  // --- PAGE 2: Diagram & Signatures ---
  doc.addPage();
  addPCHHeader(doc, "Vehicle Pre-Inspection & Condition Checklist", claimId, 2, 2);

  // 3. Vehicle Defect & Damage Diagram
  currentY = 36;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PCH_BLACK);
  doc.text("2. VEHICLE EXTERIOR DEFECT & DAMAGE DIAGRAM", 14, currentY);

  currentY += 3;
  const diagramHeight = 90;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, currentY, 182, diagramHeight, 2, 2, "FD");

  if (data.damage_diagram && data.damage_diagram.startsWith("data:image")) {
    try {
      doc.addImage(data.damage_diagram, "PNG", 24, currentY + 3, 162, diagramHeight - 6);
    } catch {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Damage Diagram Recorded", 105, currentY + diagramHeight / 2, { align: "center" });
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("No Damage Stamped on Inspection", 105, currentY + diagramHeight / 2, { align: "center" });
  }

  // 4. Detailer Notes
  currentY += diagramHeight + 6;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["3. INSPECTION NOTES & REMARKS"]],
    body: [[val(data.notes || data.detailer_notes, "Vehicle inspected in roadworthy condition. Clean and free of pre-existing unrecorded structural damage.")]],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 2.5 }
  });

  // 5. Signatures
  currentY = (doc as any).lastAutoTable.finalY + 8;
  renderSignatureBox(doc, "Detailer / Inspector Signature", data.detailer_signature, 14, currentY, 88, 26);
  renderSignatureBox(doc, "Customer Acceptance Signature", data.customer_signature, 108, currentY, 88, 26);

  addPCHFooter(doc, 2, 2);

  doc.save(`PCH_Pre_Inspection_Checklist_${claimId}.pdf`);
}

// ============================================================================
// 4. STORAGE & RECOVERY FORM PDF (Itemized Financials & Compound Selector)
// ============================================================================
export function generateStoragePDF(claimId: string, data: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addPCHHeader(doc, "Storage & Recovery Assessment Notice", claimId, 1, 1);

  // 1. Client & Reference Details
  autoTable(doc, {
    startY: 36,
    margin: { left: 14, right: 14 },
    head: [["1. CLIENT & CLAIM DETAILS", "", "", ""]],
    body: [
      ["Client Full Name", val(data.client_name), "Claim Reference", val(data.claim_ref || claimId)],
      ["Postal Address", val(data.client_address), "Contact Telephone", val(data.client_phone)],
      ["Email Address", val(data.client_email), "Compound Facility", val(data.compound_location || data.compound_address, "PCH Compound #1")]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 38 },
      3: { cellWidth: 51 }
    }
  });

  // 2. Vehicle & Movement Dates
  let currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["2. VEHICLE DETAILS & STORAGE LOG", "", "", ""]],
    body: [
      ["Vehicle Registration", val(data.vehicle_reg).toUpperCase(), "Make & Model", `${val(data.make, "")} ${val(data.model, "")}`.trim()],
      ["Vehicle Colour", val(data.colour, "—"), "Engine Size / VIN", `${val(data.engine_size, "—")} / ${val(data.vin, "—")}`],
      ["Date In (Storage Start)", `${val(data.date_in)} ${val(data.time_in, "")}`.trim(), "Date Out (Release Date)", `${val(data.date_out)} ${val(data.time_out, "")}`.trim()],
      ["Total Inclusive Days", `${val(data.total_days, 1)} Days`, "Recovery From / To", `${val(data.recovery_from, "Scene")} → ${val(data.delivery_to, "Secure Compound")}`]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 38 },
      3: { cellWidth: 51 }
    }
  });

  // 3. Itemized Financial Charges
  currentY = (doc as any).lastAutoTable.finalY + 4;
  const days = parseInt(String(data.total_days || 1)) || 1;
  const rate = parseFloat(String(data.storage_rate_per_day || 35)) || 35;
  const totalStorageFee = days * rate;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["3. STORAGE & RECOVERY CHARGES BREAKDOWN", "RATE / UNIT", "TOTAL (£)"]],
    body: [
      ["Accident Scene Recovery Fee", "Per Occurrence", curr(data.recovery_charge || 150)],
      [`Secure Storage Fee (${days} Day(s))`, `${curr(rate)} / Day`, curr(totalStorageFee)],
      ["Specialist Towing & Mileage Charges", "Standard Transit", curr(data.mileage_charge || 0)],
      ["Compound Handling & Administration Fee", "Standard", curr(data.admin_fee || 50)],
      ["Subtotal (Exclusive of VAT)", "", curr(data.subtotal || totalStorageFee + 200)],
      ["Value Added Tax (VAT @ 20%)", "20% Standard", curr(data.vat || (totalStorageFee + 200) * 0.2)],
      ["TOTAL AMOUNT PAYABLE", "Gross Total", curr(data.total_cost || (totalStorageFee + 200) * 1.2)]
    ],
    theme: "grid",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 110 },
      1: { halign: "center", cellWidth: 36 },
      2: { halign: "right", fontStyle: "bold", cellWidth: 36 }
    }
  });

  // 4. Signatures
  currentY = (doc as any).lastAutoTable.finalY + 8;
  renderSignatureBox(doc, "Compound Manager / Operator Signature", data.operator_signature || data.owner_signature, 14, currentY, 88, 26);
  renderSignatureBox(doc, "Client / Vehicle Owner Authorisation", data.client_signature, 108, currentY, 88, 26);

  addPCHFooter(doc, 1, 1);
  doc.save(`PCH_Storage_Recovery_${claimId}.pdf`);
}

// ============================================================================
// 5. CANCELLATION NOTICE FORM PDF (Statutory 14-Day Notice)
// ============================================================================
export function generateCancellationPDF(claimId: string, data: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addPCHHeader(doc, "Statutory Notice of Cancellation", claimId, 1, 1);

  // 1. Statutory Notice Box
  autoTable(doc, {
    startY: 36,
    margin: { left: 14, right: 14 },
    head: [["RIGHT TO CANCEL UNDER CONSUMER CONTRACTS REGULATIONS 2013"]],
    body: [[
      "Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, you have the right to cancel this contract within 14 calendar days without giving any reason. The cancellation period will expire after 14 days from the day on which the contract was entered into or the hire vehicle was received."
    ]],
    theme: "striped",
    headStyles: { fillColor: PCH_RED, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK, cellPadding: 2.8 }
  });

  // 2. Cancellation Details
  let currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["1. CONTRACT & CLIENT IDENTIFICATION", "", "", ""]],
    body: [
      ["Client Full Name", val(data.client_name), "Claim Reference", val(data.claim_ref || claimId)],
      ["Postal Address", val(data.client_address), "Contact Phone", val(data.client_phone)],
      ["Email Address", val(data.client_email), "Vehicle Registration", val(data.vehicle_reg).toUpperCase()],
      ["Agreement Date", val(data.agreement_date), "Delivery Date", val(data.delivery_date)]
    ],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 38 },
      3: { cellWidth: 51 }
    }
  });

  // 3. Reason for Cancellation
  currentY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["2. CANCELLATION STATEMENT & REASON"]],
    body: [[
      `I / We hereby give notice that I / we cancel my / our contract for the hire of the above replacement vehicle.\n\nReason: ${val(data.cancellation_reason, "Hirer exercised statutory right to cancel.")}`
    ]],
    theme: "striped",
    headStyles: { fillColor: PCH_BLACK, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK, cellPadding: 3 }
  });

  // 4. Signature & Date
  currentY = (doc as any).lastAutoTable.finalY + 8;
  renderSignatureBox(doc, "Client Cancellation Signature", data.client_signature, 14, currentY, 95, 26);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PCH_BLACK);
  doc.text(`Cancellation Date: ${val(data.cancellation_date || new Date().toLocaleDateString("en-GB"))}`, 115, currentY + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Submission of this notice formally terminates vehicle hire services under this claim.", 115, currentY + 16);

  addPCHFooter(doc, 1, 1);
  doc.save(`PCH_Cancellation_Notice_${claimId}.pdf`);
}

// Unified Export
export function generateFormPDF(formType: string, claimId: string, data: any) {
  switch (formType) {
    case "rental-agreement":
      return generateRentalAgreementPDF(claimId, data);
    case "accident-claim":
      return generateAccidentClaimPDF(claimId, data);
    case "pre-inspection":
      return generatePreInspectionPDF(claimId, data);
    case "storage-recovery":
      return generateStoragePDF(claimId, data);
    case "cancellation":
      return generateCancellationPDF(claimId, data);
    default:
      console.error(`Unknown form type: ${formType}`);
  }
}
