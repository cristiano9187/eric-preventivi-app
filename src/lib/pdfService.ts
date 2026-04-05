import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { Quote, CompanySettings } from "../types";
import { formatCurrency } from "./utils";

export const generateQuotePDF = (quote: Quote, settings: CompanySettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  if (settings.logo) {
    doc.addImage(settings.logo, "PNG", 10, 10, 30, 30);
  }

  doc.setFontSize(20);
  doc.text("PREVENTIVO", pageWidth - 10, 20, { align: "right" });
  doc.setFontSize(10);
  doc.text(`# ${quote.quoteNumber}`, pageWidth - 10, 28, { align: "right" });

  // Company Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(settings.companyName.toUpperCase(), 10, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(settings.address, 10, 56);
  doc.text(`P.IVA / SIRET: ${settings.vatNumber}`, 10, 62);

  // Client Info
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", 120, 50);
  doc.setFont("helvetica", "normal");
  doc.text(quote.clientName, 120, 56);
  doc.text("Data: " + format(new Date(quote.date), "dd/MM/yyyy"), 120, 62);
  doc.text("Valido fino a: " + format(new Date(quote.validUntil), "dd/MM/yyyy"), 120, 68);

  // Work Description
  let tableStartY = 80;
  if (quote.workDescription) {
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIZIONE DELLA FORNITURA/LAVORI:", 10, 80);
    doc.setFont("helvetica", "normal");
    const splitDescription = doc.splitTextToSize(quote.workDescription, pageWidth - 20);
    doc.text(splitDescription, 10, 86);
    tableStartY = 86 + (splitDescription.length * 5) + 10;
  }

  // Table
  const tableData = quote.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.quantity * item.unitPrice),
    `${item.taxRate}%`,
  ]);

  (doc as any).autoTable({
    startY: tableStartY,
    head: [["DESCRIZIONE", "QUANTITÀ", "PREZZO", "SUBTOTALE", "IVA"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Totals
  const totalsX = pageWidth - 60;
  doc.text("SUBTOTALE:", totalsX, finalY + 10);
  doc.text(formatCurrency(quote.totalAmount), pageWidth - 10, finalY + 10, { align: "right" });

  doc.text("IVA:", totalsX, finalY + 18);
  doc.text(formatCurrency(quote.totalTax), pageWidth - 10, finalY + 18, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTALE:", totalsX, finalY + 28);
  doc.text(formatCurrency(quote.grandTotal), pageWidth - 10, finalY + 28, { align: "right" });

  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Grazie per la vostra fiducia!", 10, doc.internal.pageSize.getHeight() - 20);

  doc.save(`Preventivo_${quote.quoteNumber}.pdf`);
};
