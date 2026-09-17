export type DispatchSlipLine = {
  patientName: string;
  fileId: string;
  investigation: string;
};

export type DispatchSlip = {
  dispatchNumber: string;
  issuedDate: string;
  clinicName: string;
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  vialCount: number;
  labName: string;
  labAddress: string;
  issuedPersonName: string;
  lines: DispatchSlipLine[];
};

function slipHtml(slip: DispatchSlip): string {
  const rows = slip.lines
    .map(
      (line, i) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${i + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${escapeHtml(line.patientName)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace">${escapeHtml(line.fileId)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${escapeHtml(line.investigation)}</td>
        </tr>`
    )
    .join("");
  return `<!DOCTYPE html><html><head><title>${escapeHtml(slip.dispatchNumber)}</title>
    <style>body{font-family:Georgia,serif;color:#00334f;padding:24px} table{width:100%;border-collapse:collapse;font-size:13px}
    h1{font-size:18px;margin:0} .muted{color:#64748b;font-size:12px}</style></head><body>
    <h1>Sample Dispatch File ${escapeHtml(slip.dispatchNumber)}</h1>
    <p class="muted">${escapeHtml(slip.clinicName)} · Issued ${escapeHtml(slip.issuedDate)}</p>
    <p>Driver: <b>${escapeHtml(slip.driverName)}</b> · Phone: ${escapeHtml(slip.driverPhone)} · Vehicle: <b>${escapeHtml(slip.vehicleNo)}</b><br/>
    Vials: <b>${slip.vialCount}</b> · Lab: ${escapeHtml(slip.labName)} ${slip.labAddress ? `(${escapeHtml(slip.labAddress)})` : ""}<br/>
    Issued person: <b>${escapeHtml(slip.issuedPersonName)}</b></p>
    <table><thead><tr style="text-align:left;background:#f8fafc">
      <th style="padding:6px 8px">#</th><th style="padding:6px 8px">Patient name</th>
      <th style="padding:6px 8px">File ID</th><th style="padding:6px 8px">Investigation</th>
    </tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;
}

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printDispatchSlip(slip: DispatchSlip) {
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) {
    alert("Allow pop-ups to print this dispatch file.");
    return;
  }
  w.document.write(slipHtml(slip));
  w.document.close();
  w.focus();
  w.print();
}

function pdfEscape(text: string): string {
  return String(text || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Minimal text PDF so reception can download the dispatch file without extra libraries. */
export function downloadDispatchSlipPdf(slip: DispatchSlip) {
  const lines = [
    `Sample Dispatch File ${slip.dispatchNumber}`,
    `${slip.clinicName}  |  Issued ${slip.issuedDate}`,
    `Driver: ${slip.driverName}    Phone: ${slip.driverPhone}    Vehicle: ${slip.vehicleNo}`,
    `Vials: ${slip.vialCount}    Lab: ${slip.labName}`,
    `Issued person: ${slip.issuedPersonName}`,
    "",
    "Patient name / File ID / Investigation",
    ...slip.lines.map(
      (line, i) => `${i + 1}. ${line.patientName}  |  ${line.fileId}  |  ${line.investigation}`
    ),
  ];
  const commands: string[] = [];
  let y = 800;
  lines.forEach((line, idx) => {
    const size = idx === 0 ? 14 : 10;
    commands.push(`BT /F1 ${size} Tf 48 ${y} Td (${pdfEscape(line.slice(0, 110))}) Tj ET`);
    y -= idx === 0 ? 22 : 16;
  });
  const stream = commands.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let offset = 9;
  const xref = ["0000000000 65535 f "];
  const body = objects
    .map((obj) => {
      const line = `${obj}\n`;
      xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
      offset += line.length;
      return line;
    })
    .join("");
  const pdf = `%PDF-1.4\n${body}xref\n0 6\n${xref.join("\n")}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slip.dispatchNumber || "sample-dispatch"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function draftDispatchNumber(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `SD-${n}`;
}
