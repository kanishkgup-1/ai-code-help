/**
 * Pure JavaScript PDF Generator (PDF 1.4 compliant)
 * Zero external dependencies. Works in both browser and Node.js.
 */

function escapePdf(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E\n\r\t]/g, " "); // Replace non-ascii with spaces
}

function wrapText(text, maxCharsPerLine = 85) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generateSuggestionsPdf({ suggestions = [], filterType = "all", sessionDate = new Date() }) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Filter suggestions if requested
  const items = filterType === "all" 
    ? suggestions 
    : suggestions.filter((s) => (s.type || "").toLowerCase() === filterType.toLowerCase());

  // Group by type for type-wise presentation
  const grouped = {
    syntax: items.filter((s) => (s.type || "").toLowerCase() === "syntax"),
    quality: items.filter((s) => (s.type || "").toLowerCase() === "quality"),
    improvement: items.filter((s) => (s.type || "").toLowerCase() === "improvement"),
    other: items.filter((s) => !["syntax", "quality", "improvement"].includes((s.type || "").toLowerCase()))
  };

  const pages = [];
  let currentOps = [];
  let y = pageHeight - margin;

  function newPage() {
    if (currentOps.length > 0) {
      pages.push(currentOps.join("\n"));
    }
    currentOps = [];
    y = pageHeight - margin;
  }

  function checkSpace(needed) {
    if (y - needed < margin + 20) {
      newPage();
    }
  }

  function drawText(text, size, x, isBold = false, rgb = [0.1, 0.1, 0.1]) {
    currentOps.push("BT");
    currentOps.push(`/${isBold ? "F2" : "F1"} ${size} Tf`);
    currentOps.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg`);
    currentOps.push(`${x} ${y} Td`);
    currentOps.push(`(${escapePdf(text)}) Tj`);
    currentOps.push("ET");
  }

  function drawRect(x, rectY, w, h, fillRgb = null, strokeRgb = null) {
    if (fillRgb) {
      currentOps.push(`${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg`);
      currentOps.push(`${x} ${rectY} ${w} ${h} re`);
      currentOps.push("f");
    }
    if (strokeRgb) {
      currentOps.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG`);
      currentOps.push(`${x} ${rectY} ${w} ${h} re`);
      currentOps.push("s");
    }
  }

  // Draw Header Banner on First Page
  drawRect(margin, y - 50, contentWidth, 54, [0.05, 0.1, 0.2], [0.2, 0.4, 0.7]);
  y -= 22;
  drawText("AI CODE HELP - SESSION SUGGESTIONS REPORT", 16, margin + 14, true, [0.4, 0.8, 1]);
  y -= 18;
  const dateStr = sessionDate instanceof Date ? sessionDate.toLocaleString() : String(sessionDate);
  drawText(`Generated on: ${dateStr}   |   Filter: ${filterType.toUpperCase()}   |   Total: ${items.length}`, 9, margin + 14, false, [0.8, 0.85, 0.9]);
  y -= 35;

  const sectionOrder = [
    { key: "syntax", title: "SYNTAX ISSUES", rgb: [0.85, 0.2, 0.2] },
    { key: "improvement", title: "ALGORITHMIC & COMPLEXITY IMPROVEMENTS", rgb: [0.2, 0.7, 0.6] },
    { key: "quality", title: "CODE QUALITY & BEST PRACTICES", rgb: [0.9, 0.65, 0.15] },
    { key: "other", title: "OTHER SUGGESTIONS", rgb: [0.5, 0.5, 0.6] }
  ];

  if (items.length === 0) {
    checkSpace(60);
    drawRect(margin, y - 40, contentWidth, 40, [0.95, 0.96, 0.98], [0.8, 0.85, 0.9]);
    y -= 25;
    drawText("No suggestions were recorded in this session.", 11, margin + 20, false, [0.4, 0.4, 0.4]);
    y -= 30;
  }

  for (const sec of sectionOrder) {
    const list = grouped[sec.key];
    if (!list || list.length === 0) continue;

    checkSpace(50);
    // Section Header
    drawRect(margin, y - 20, contentWidth, 24, [0.92, 0.94, 0.97], null);
    drawRect(margin, y - 20, 4, 24, sec.rgb, null); // Left accent bar
    y -= 16;
    drawText(`${sec.title} (${list.length})`, 11, margin + 12, true, [0.1, 0.15, 0.25]);
    y -= 18;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const messageLines = wrapText(item.message || "", 80);
      const cardHeight = 36 + messageLines.length * 13;

      checkSpace(cardHeight + 10);

      // Card background
      drawRect(margin, y - cardHeight, contentWidth, cardHeight, [0.98, 0.99, 1], [0.88, 0.9, 0.93]);

      // Severity badge
      const isErr = (item.severity || "").toLowerCase() === "error";
      const isWarn = (item.severity || "").toLowerCase() === "warning";
      const badgeRgb = isErr ? [0.85, 0.2, 0.2] : isWarn ? [0.85, 0.6, 0.1] : [0.1, 0.6, 0.5];

      drawText(`[${(item.severity || "info").toUpperCase()}]`, 8, margin + 12, true, badgeRgb);
      drawText(item.title || "Untitled Suggestion", 10, margin + 65, true, [0.15, 0.15, 0.2]);

      let lineYOffset = 18;
      for (const line of messageLines) {
        y -= lineYOffset;
        drawText(line, 9, margin + 12, false, [0.35, 0.38, 0.45]);
        lineYOffset = 13;
      }

      y -= 24;
    }

    y -= 10;
  }

  // Push final page
  if (currentOps.length > 0) {
    pages.push(currentOps.join("\n"));
  }

  const pageCount = pages.length;
  const objects = [];

  // 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  // 2: Pages container
  const kids = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj`);

  const fontNormId = 3 + pageCount * 2;
  const fontBoldId = fontNormId + 1;

  for (let i = 0; i < pageCount; i++) {
    const pageObjId = 3 + i * 2;
    const contentObjId = pageObjId + 1;
    let streamContent = pages[i];

    // Add page number at footer
    streamContent += `\nBT\n/F1 8 Tf\n0.5 0.5 0.5 rg\n${pageWidth / 2 - 20} 25 Td\n(Page ${i + 1} of ${pageCount}) Tj\nET`;

    const byteLen = typeof Buffer !== "undefined" 
      ? Buffer.byteLength(streamContent) 
      : new TextEncoder().encode(streamContent).length;

    objects.push(`${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontNormId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`);
    objects.push(`${contentObjId} 0 obj\n<< /Length ${byteLen} >>\nstream\n${streamContent}\nendstream\nendobj`);
  }

  objects.push(`${fontNormId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);
  objects.push(`${fontBoldId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);

  let body = "%PDF-1.4\n";
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];

  for (let i = 0; i < objects.length; i++) {
    const pos = typeof Buffer !== "undefined"
      ? Buffer.byteLength(body)
      : new TextEncoder().encode(body).length;
    xref.push(`${String(pos).padStart(10, "0")} 00000 n `);
    body += objects[i] + "\n";
  }

  const startxref = typeof Buffer !== "undefined"
    ? Buffer.byteLength(body)
    : new TextEncoder().encode(body).length;

  body += xref.join("\n") + "\n";
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

  return body;
}

/**
 * Browser-friendly download trigger
 */
export function downloadSuggestionsPdf({ suggestions, filterType = "all", filename = "code-review-suggestions.pdf" }) {
  const pdfString = generateSuggestionsPdf({ suggestions, filterType });
  const bytes = new Uint8Array(pdfString.length);
  for (let i = 0; i < pdfString.length; i++) {
    bytes[i] = pdfString.charCodeAt(i) & 0xff;
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
