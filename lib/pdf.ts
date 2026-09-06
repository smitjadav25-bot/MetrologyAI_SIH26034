import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Inspection } from '@/types/inspection';
import { generateQrCodeDataUrl } from './qr';
import fs from 'fs';
import path from 'path';

// Clean RGB color constants
const NAVY = rgb(0.08, 0.15, 0.35); // #142659
const DARK_SLATE = rgb(0.12, 0.16, 0.22); // #1f2937
const MUTED_GRAY = rgb(0.45, 0.50, 0.58); // #738094
const LIGHT_BG = rgb(0.96, 0.97, 0.98); // #f5f7fa
const BORDER_COLOR = rgb(0.85, 0.88, 0.92);
const SUCCESS_GREEN = rgb(0.09, 0.63, 0.36); // #16a05c
const DANGER_RED = rgb(0.86, 0.15, 0.15); // #dc2626
const WARNING_AMBER = rgb(0.85, 0.55, 0.05);
const WHITE = rgb(1, 1, 1);

function sanitizeForPdf(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/₹/g, 'Rs. ')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, '*')
    .replace(/✓/g, '[OK]')
    .replace(/✕/g, '[X]')
    .replace(/•/g, '*')
    .replace(/[^\x00-\x7F]/g, ' ');
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [''];
  const clean = sanitizeForPdf(text);
  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateComplianceCertificatePdf(
  inspection: Inspection,
  baseUrl?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 size: 595.28 x 841.89 points
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 40;

  const rawDrawText = page.drawText.bind(page);
  page.drawText = (text: string, options?: Parameters<typeof page.drawText>[1]) => {
    return rawDrawText(sanitizeForPdf(text), options);
  };

  // Header Banner
  page.drawRectangle({
    x: margin,
    y: height - 100,
    width: width - margin * 2,
    height: 60,
    color: NAVY
  });

  page.drawText('METROLOGYAI', {
    x: margin + 18,
    y: height - 62,
    size: 20,
    font: fontBold,
    color: WHITE
  });

  page.drawText('LEGAL METROLOGY (PACKAGED COMMODITIES) COMPLIANCE ASSESSMENT', {
    x: margin + 18,
    y: height - 80,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.8, 0.88, 1)
  });

  // Certificate Status Pill
  const certId = inspection.certificateId || `CERT-${inspection.inspectionId}`;
  const isFullPass = inspection.finalStatus === 'PASS' && inspection.complianceScore === 100;
  const statusLabel = isFullPass
    ? 'STATUS: PASS'
    : inspection.finalStatus === 'WARNING'
      ? 'STATUS: ADVISORY'
      : 'STATUS: NON-COMPLIANT';
  const pillColor = isFullPass
    ? SUCCESS_GREEN
    : inspection.finalStatus === 'WARNING'
      ? WARNING_AMBER
      : DANGER_RED;

  page.drawRectangle({
    x: width - margin - 155,
    y: height - 85,
    width: 140,
    height: 30,
    color: pillColor
  });

  page.drawText(statusLabel, {
    x: width - margin - 145,
    y: height - 68,
    size: 9.5,
    font: fontBold,
    color: WHITE
  });

  page.drawText(`Score: ${inspection.complianceScore}/100`, {
    x: width - margin - 145,
    y: height - 80,
    size: 8.5,
    font: fontRegular,
    color: WHITE
  });

  // Certificate Document Title
  let y = height - 125;
  page.drawText('COMPLIANCE ASSESSMENT CERTIFICATE', {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: NAVY
  });

  y -= 15;
  page.drawText(`Certificate ID: ${certId}  |  Inspection Ref: ${inspection.inspectionId}  |  Issued: ${new Date(inspection.createdAt).toLocaleString('en-IN')}`, {
    x: margin,
    y,
    size: 9,
    font: fontRegular,
    color: MUTED_GRAY
  });

  // Inspector details
  y -= 16;
  page.drawText(`Authorized Inspector: ${inspection.inspector.name} (${inspection.inspector.id})  |  Jurisdiction: ${inspection.inspector.jurisdiction}`, {
    x: margin,
    y,
    size: 8.5,
    font: fontRegular,
    color: DARK_SLATE
  });

  // Section: Verified Packaging Declarations
  y -= 25;
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: width - margin * 2,
    height: 20,
    color: LIGHT_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1
  });
  page.drawText('VERIFIED PACKAGING DECLARATIONS', {
    x: margin + 10,
    y: y,
    size: 9.5,
    font: fontBold,
    color: NAVY
  });

  const rd = inspection.reviewedData;
  const verifiedRows = [
    { label: 'Commodity Name', val: rd.product_name?.value || 'N/A', modified: rd.product_name?.modifiedByInspector },
    { label: 'Manufacturer Name', val: rd.manufacturer_name?.value || 'N/A', modified: rd.manufacturer_name?.modifiedByInspector },
    { label: 'Manufacturer Address', val: rd.manufacturer_address?.value || 'N/A', modified: rd.manufacturer_address?.modifiedByInspector },
    { label: 'Net Quantity', val: `${rd.net_quantity?.value || ''} ${rd.unit_of_measurement?.value || ''}`.trim() || 'N/A', modified: rd.net_quantity?.modifiedByInspector },
    { label: 'Maximum Retail Price (MRP)', val: `${rd.mrp?.value || 'N/A'} (${rd.mrp_tax_declaration?.value || 'incl. all taxes'})`, modified: rd.mrp?.modifiedByInspector },
    { label: 'Country of Origin', val: rd.country_of_origin?.value || 'N/A', modified: rd.country_of_origin?.modifiedByInspector },
    { label: 'Mfg / Packing Date', val: rd.date_of_manufacture?.value || rd.date_of_packing?.value || 'N/A', modified: rd.date_of_manufacture?.modifiedByInspector },
    { label: 'Consumer Helpline / Email', val: `${rd.consumer_care_phone?.value || ''} | ${rd.consumer_care_email?.value || ''}`.trim().replace(/^\||\|$/g, '') || 'N/A', modified: rd.consumer_care_phone?.modifiedByInspector },
    { label: 'Batch / Lot Number', val: rd.batch_or_lot_no?.value || 'N/A', modified: rd.batch_or_lot_no?.modifiedByInspector }
  ];

  y -= 20;
  for (const row of verifiedRows) {
    page.drawText(row.label, {
      x: margin + 10,
      y,
      size: 8.5,
      font: fontBold,
      color: DARK_SLATE
    });

    const displayVal = row.val.length > 65 ? row.val.substring(0, 62) + '...' : row.val;
    page.drawText(displayVal, {
      x: margin + 170,
      y,
      size: 8.5,
      font: fontRegular,
      color: DARK_SLATE
    });

    if (row.modified) {
      page.drawText('[Verified/Modified by Inspector]', {
        x: width - margin - 130,
        y,
        size: 7,
        font: fontRegular,
        color: rgb(0.1, 0.4, 0.8)
      });
    }

    y -= 15;
  }

  // Section: Rules Evaluated
  y -= 10;
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: width - margin * 2,
    height: 20,
    color: LIGHT_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1
  });
  page.drawText('EVALUATED STATUTORY REQUIREMENTS CHECKLIST', {
    x: margin + 10,
    y: y,
    size: 9.5,
    font: fontBold,
    color: NAVY
  });

  y -= 18;
  for (const rule of inspection.ruleResults) {
    const isPass = rule.status === 'PASS';
    const isWarn = rule.status === 'WARNING';
    const symbol = isPass ? '[OK]' : isWarn ? '[!]' : '[-]';
    const symbolColor = isPass ? SUCCESS_GREEN : isWarn ? WARNING_AMBER : DANGER_RED;

    page.drawText(symbol, {
      x: margin + 10,
      y,
      size: 8,
      font: fontBold,
      color: symbolColor
    });

    page.drawText(rule.ruleName, {
      x: margin + 35,
      y,
      size: 8,
      font: fontBold,
      color: DARK_SLATE
    });

    page.drawText(`: ${rule.observedValue.substring(0, 55)}`, {
      x: margin + 250,
      y,
      size: 8,
      font: fontRegular,
      color: MUTED_GRAY
    });

    y -= 13;
  }

  // Section: Inspector Remarks & Signature Block
  y -= 10;
  page.drawText('INSPECTOR REMARKS:', {
    x: margin + 10,
    y,
    size: 8.5,
    font: fontBold,
    color: DARK_SLATE
  });

  const remarks = inspection.inspectorRemarks?.trim() || 'All statutory declarations were visually inspected, verified, and found compliant with the configured Legal Metrology (Packaged Commodities) Rules, 2011.';
  const wrappedRemarks = wrapText(remarks, 65);
  let remY = y - 12;
  for (const line of wrappedRemarks.slice(0, 3)) {
    page.drawText(line, {
      x: margin + 10,
      y: remY,
      size: 8,
      font: fontRegular,
      color: DARK_SLATE
    });
    remY -= 11;
  }

  // Signature Block & QR Code
  const qrBoxY = 85;
  const verifyUrl = `${baseUrl || process.env.APP_BASE_URL || ''}/verify/${certId}`;
  try {
    const qrDataUrl = await generateQrCodeDataUrl(verifyUrl);
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, {
      x: margin + 10,
      y: qrBoxY,
      width: 65,
      height: 65
    });

    page.drawText('SCAN TO VERIFY', {
      x: margin + 10,
      y: qrBoxY - 10,
      size: 7,
      font: fontBold,
      color: NAVY
    });
  } catch (err) {
    console.error('Error embedding QR into certificate:', err);
  }

  // Official Signature Box
  page.drawRectangle({
    x: width - margin - 200,
    y: qrBoxY,
    width: 190,
    height: 65,
    borderColor: BORDER_COLOR,
    borderWidth: 1
  });
  page.drawText('INSPECTOR SIGNATURE & SEAL', {
    x: width - margin - 190,
    y: qrBoxY + 52,
    size: 7.5,
    font: fontBold,
    color: MUTED_GRAY
  });
  page.drawText(`Inspector: ${inspection.inspector.name}`, {
    x: width - margin - 190,
    y: qrBoxY + 18,
    size: 8,
    font: fontBold,
    color: DARK_SLATE
  });
  page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, {
    x: width - margin - 190,
    y: qrBoxY + 8,
    size: 7.5,
    font: fontRegular,
    color: MUTED_GRAY
  });

  // Footer Disclaimer (Mandatory)
  page.drawText('PROTOTYPE DOCUMENT — This compliance assessment does not constitute an officially issued government certificate unless authorized by the competent authority.', {
    x: margin,
    y: 35,
    size: 6.5,
    font: fontBold,
    color: MUTED_GRAY
  });
  page.drawText('MetrologyAI provides an automated assessment based on the configured rules and information visible in the submitted product images. Final legal/enforcement decisions remain with the competent authority and authorized inspector.', {
    x: margin,
    y: 26,
    size: 6.5,
    font: fontRegular,
    color: MUTED_GRAY
  });

  return await pdfDoc.save();
}

export async function generateNonComplianceNoticePdf(
  inspection: Inspection,
  baseUrl?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 40;

  const rawDrawText = page.drawText.bind(page);
  page.drawText = (text: string, options?: Parameters<typeof page.drawText>[1]) => {
    return rawDrawText(sanitizeForPdf(text), options);
  };

  // Header Banner
  page.drawRectangle({
    x: margin,
    y: height - 100,
    width: width - margin * 2,
    height: 60,
    color: rgb(0.4, 0.08, 0.08) // Deep Crimson
  });

  page.drawText('METROLOGYAI', {
    x: margin + 18,
    y: height - 62,
    size: 20,
    font: fontBold,
    color: WHITE
  });

  page.drawText('NON-COMPLIANCE NOTICE / INSPECTION REPORT (PROTOTYPE)', {
    x: margin + 18,
    y: height - 80,
    size: 8.5,
    font: fontRegular,
    color: rgb(1, 0.85, 0.85)
  });

  // Notice Status Pill
  const noticeId = inspection.noticeId || `NOTICE-${inspection.inspectionId}`;
  page.drawRectangle({
    x: width - margin - 150,
    y: height - 85,
    width: 135,
    height: 30,
    color: DANGER_RED
  });

  page.drawText('STATUS: NON-COMPLIANT', {
    x: width - margin - 146,
    y: height - 68,
    size: 9.5,
    font: fontBold,
    color: WHITE
  });

  page.drawText(`Score: ${inspection.complianceScore}/100`, {
    x: width - margin - 146,
    y: height - 80,
    size: 8.5,
    font: fontRegular,
    color: WHITE
  });

  // Notice Reference
  let y = height - 125;
  page.drawText('STATUTORY NON-COMPLIANCE INSPECTION REPORT', {
    x: margin,
    y,
    size: 13,
    font: fontBold,
    color: DANGER_RED
  });

  y -= 15;
  page.drawText(`Notice ID: ${noticeId}  |  Inspection Ref: ${inspection.inspectionId}  |  Date: ${new Date(inspection.createdAt).toLocaleString('en-IN')}`, {
    x: margin,
    y,
    size: 9,
    font: fontRegular,
    color: MUTED_GRAY
  });

  y -= 16;
  page.drawText(`Inspecting Officer: ${inspection.inspector.name} (${inspection.inspector.id})  |  Jurisdiction: ${inspection.inspector.jurisdiction}`, {
    x: margin,
    y,
    size: 8.5,
    font: fontRegular,
    color: DARK_SLATE
  });

  // Product Particulars
  y -= 25;
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: width - margin * 2,
    height: 18,
    color: LIGHT_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 1
  });
  page.drawText('PRODUCT PARTICULAR DETAILS', {
    x: margin + 10,
    y: y,
    size: 9,
    font: fontBold,
    color: DARK_SLATE
  });

  const rd = inspection.reviewedData;
  y -= 16;
  page.drawText(`Product: ${rd.product_name?.value || 'Unidentified Commodity'}`, { x: margin + 10, y, size: 8.5, font: fontBold, color: DARK_SLATE });
  page.drawText(`Declared Net Qty: ${rd.net_quantity?.value || 'None'} ${rd.unit_of_measurement?.value || ''}`.trim(), { x: margin + 280, y, size: 8.5, font: fontRegular, color: DARK_SLATE });
  
  y -= 14;
  page.drawText(`Manufacturer: ${rd.manufacturer_name?.value || 'Not Declared'}`, { x: margin + 10, y, size: 8.5, font: fontRegular, color: DARK_SLATE });
  page.drawText(`Declared MRP: ${rd.mrp?.value || 'None'}`, { x: margin + 280, y, size: 8.5, font: fontRegular, color: DARK_SLATE });

  // Section: Non-Compliances Identified Table
  y -= 22;
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: width - margin * 2,
    height: 18,
    color: rgb(0.98, 0.92, 0.92),
    borderColor: rgb(0.9, 0.7, 0.7),
    borderWidth: 1
  });
  page.drawText('NON-COMPLIANCES IDENTIFIED (STATUTORY DEFICIENCIES)', {
    x: margin + 10,
    y: y,
    size: 9,
    font: fontBold,
    color: DANGER_RED
  });

  const failedRules = inspection.ruleResults.filter(r => r.status === 'FAIL');

  y -= 18;
  for (const rule of failedRules.slice(0, 4)) {
    page.drawText(`• ${rule.ruleName}`, {
      x: margin + 10,
      y,
      size: 8.5,
      font: fontBold,
      color: DANGER_RED
    });

    if (rule.severity) {
      page.drawText(`[${rule.severity}]`, {
        x: margin + 280,
        y,
        size: 7.5,
        font: fontBold,
        color: DANGER_RED
      });
    }

    if (rule.sourceImage) {
      page.drawText(`Evidence: ${rule.sourceImage}`, {
        x: width - margin - 110,
        y,
        size: 7.5,
        font: fontRegular,
        color: MUTED_GRAY
      });
    }

    y -= 12;
    page.drawText(`Observed: ${rule.observedValue.substring(0, 65)}`, {
      x: margin + 20,
      y,
      size: 8,
      font: fontRegular,
      color: DARK_SLATE
    });

    y -= 12;
    page.drawText(`Issue: ${rule.issue ? rule.issue.substring(0, 85) : rule.explanation.substring(0, 85)}`, {
      x: margin + 20,
      y,
      size: 8,
      font: fontRegular,
      color: rgb(0.6, 0.1, 0.1)
    });

    y -= 12;
    page.drawText(`Expected: ${rule.expectedCondition ? rule.expectedCondition.substring(0, 85) : rule.requirement.substring(0, 85)}`, {
      x: margin + 20,
      y,
      size: 8,
      font: fontRegular,
      color: MUTED_GRAY
    });

    y -= 15;
  }

  // Evidence Image Embedding
  // Embed the actual uploaded product image if available in inspection.images
  if (inspection.images && inspection.images.length > 0) {
    y -= 5;
    page.drawText('ACTUAL PACKAGING EVIDENCE (ORIGINAL PRODUCT IMAGE):', {
      x: margin + 10,
      y,
      size: 8.5,
      font: fontBold,
      color: NAVY
    });

    y -= 10;
    try {
      const firstImage = inspection.images[0];
      let imageBytes: Uint8Array | null = null;
      let isPng = firstImage.url.toLowerCase().startsWith('data:image/png');

      if (firstImage.url.startsWith('data:image/')) {
        const commaIndex = firstImage.url.indexOf(',');
        if (commaIndex !== -1) {
          const metadata = firstImage.url.slice(0, commaIndex);
          isPng = metadata.toLowerCase().startsWith('data:image/png');
          imageBytes = Buffer.from(firstImage.url.slice(commaIndex + 1), 'base64');
        }
      } else {
        const imagePath = path.join(process.cwd(), 'public', firstImage.url.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
          imageBytes = fs.readFileSync(imagePath);
          isPng = firstImage.url.toLowerCase().endsWith('.png');
        }
      }

      if (imageBytes) {
        const embeddedImg = isPng
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        const imgWidth = 140;
        const imgHeight = 90;
        page.drawImage(embeddedImg, {
          x: margin + 10,
          y: y - imgHeight,
          width: imgWidth,
          height: imgHeight
        });

        page.drawText(`Evidence Ref: ${firstImage.id} (${firstImage.originalName})`, {
          x: margin + 10,
          y: y - imgHeight - 10,
          size: 7,
          font: fontRegular,
          color: MUTED_GRAY
        });

        // Beside the image: Corrective Action & Remarks
        const actionX = margin + 165;
        page.drawText('RECOMMENDED CORRECTIVE ACTION:', {
          x: actionX,
          y: y - 5,
          size: 8,
          font: fontBold,
          color: DARK_SLATE
        });

        const actionText = inspection.recommendedAction || 'Remedy non-compliant packaging declarations before retail distribution.';
        const actionLines = wrapText(actionText, 45);
        let actY = y - 18;
        for (const line of actionLines.slice(0, 3)) {
          page.drawText(line, { x: actionX, y: actY, size: 7.5, font: fontRegular, color: DARK_SLATE });
          actY -= 10;
        }

        page.drawText('INSPECTOR REMARKS:', {
          x: actionX,
          y: actY - 5,
          size: 8,
          font: fontBold,
          color: DARK_SLATE
        });

        const remarksText = inspection.inspectorRemarks || 'Packaged commodity fails mandatory declarations specified in Legal Metrology Rules, 2011.';
        const remLines = wrapText(remarksText, 45);
        let rY = actY - 18;
        for (const line of remLines.slice(0, 3)) {
          page.drawText(line, { x: actionX, y: rY, size: 7.5, font: fontRegular, color: DARK_SLATE });
          rY -= 10;
        }

        y -= (imgHeight + 25);
      }
    } catch (imgErr) {
      console.error('Error embedding evidence image in notice PDF:', imgErr);
    }
  }

  // QR Code & Inspector Signature Block
  const qrBoxY = 85;
  const verifyUrl = `${baseUrl || process.env.APP_BASE_URL || ''}/verify/notice/${noticeId}`;
  try {
    const qrDataUrl = await generateQrCodeDataUrl(verifyUrl);
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, {
      x: margin + 10,
      y: qrBoxY,
      width: 65,
      height: 65
    });

    page.drawText('SCAN TO VERIFY NOTICE', {
      x: margin + 10,
      y: qrBoxY - 10,
      size: 7,
      font: fontBold,
      color: DANGER_RED
    });
  } catch (err) {
    console.error('Error embedding QR into notice:', err);
  }

  // Signature Block
  page.drawRectangle({
    x: width - margin - 200,
    y: qrBoxY,
    width: 190,
    height: 65,
    borderColor: BORDER_COLOR,
    borderWidth: 1
  });
  page.drawText('INSPECTING OFFICER SIGNATURE', {
    x: width - margin - 190,
    y: qrBoxY + 52,
    size: 7.5,
    font: fontBold,
    color: MUTED_GRAY
  });
  page.drawText(`Officer: ${inspection.inspector.name}`, {
    x: width - margin - 190,
    y: qrBoxY + 18,
    size: 8,
    font: fontBold,
    color: DARK_SLATE
  });
  page.drawText(`Notice Issued: ${new Date().toLocaleDateString('en-IN')}`, {
    x: width - margin - 190,
    y: qrBoxY + 8,
    size: 7.5,
    font: fontRegular,
    color: MUTED_GRAY
  });

  // Footer Disclaimer (Mandatory)
  page.drawText('PROTOTYPE DOCUMENT — This assessment/report is generated by MetrologyAI and does not itself constitute an officially issued government notice unless authorized by the competent authority.', {
    x: margin,
    y: 35,
    size: 6,
    font: fontBold,
    color: MUTED_GRAY
  });
  page.drawText('MetrologyAI provides an automated compliance assessment based on the configured rules and information visible in the submitted product images. Final legal and enforcement decisions remain with the competent authority and authorized inspector.', {
    x: margin,
    y: 26,
    size: 6,
    font: fontRegular,
    color: MUTED_GRAY
  });

  return await pdfDoc.save();
}
