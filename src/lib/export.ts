export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export type ExportItem = { title: string; body: string };

export async function exportPdf(items: ExportItem[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth() - 96;
  let y = 64;
  for (const it of items) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    if (y > 760) { doc.addPage(); y = 64; }
    doc.text(it.title, 48, y); y += 22;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    for (const line of doc.splitTextToSize(it.body, w) as string[]) {
      if (y > 790) { doc.addPage(); y = 64; }
      doc.text(line, 48, y); y += 16;
    }
    y += 18;
  }
  return doc.output("blob");
}

export async function exportDocx(items: ExportItem[]) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");
  const children = items.flatMap((it) => [
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(it.title)] }),
    ...it.body.split("\n").map((l) => new Paragraph({ children: [new TextRun(l)] })),
    new Paragraph(""),
  ]);
  return Packer.toBlob(new Document({ sections: [{ children }] }));
}
