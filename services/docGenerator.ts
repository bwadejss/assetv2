import * as docx from 'docx';
import { AssetCategory, InspectionData, Observation, calculateCompliance, RiskLevel, NON_MAINTENANCE_CATEGORY } from '../types.ts';

const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, TextRun, ImageRun, TableLayoutType, BorderStyle } = docx;

/**
 * Sanitizes strings to ensure they don't contain characters that break the OpenXML schema.
 * Word Desktop and Teams are extremely sensitive to control characters in XML.
 */
function sanitize(str: any): string {
  if (str === undefined || str === null) return "";
  const text = String(str);
  // Removes control characters that are invalid in XML (except tab, cr, lf)
  // and replaces common problematic characters.
  return text.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, "");
}

function base64ToUint8Array(base64: string): Uint8Array | null {
  try {
    if (!base64 || !base64.includes('base64,')) return null;
    const parts = base64.split(';base64,');
    if (parts.length < 2) return null;
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return uInt8Array;
  } catch (e) {
    console.error("Base64 conversion failed", e);
    return null;
  }
}

const getRiskColor = (risk: RiskLevel) => {
  switch (risk) {
    case RiskLevel.LOW: return "EAB308";
    case RiskLevel.MED: return "F97316";
    case RiskLevel.HI: return "EF4444";
    default: return "000000";
  }
};

// Calibri is the most native Microsoft Word font, reducing recovery prompts.
const REPORT_FONT = "Calibri";

export const generateInspectionWordDoc = async (data: InspectionData, triggerDownload = false): Promise<Blob> => {
  const stats = calculateCompliance(data);
  const categories = data.config.categories;
  const maintObs = data.observations.filter(o => categories.includes(o.category));
  const nonMaintObs = data.observations.filter(o => o.category === NON_MAINTENANCE_CATEGORY);
  
  const totalNonMaintDefects = nonMaintObs.reduce((s, o) => s + o.nonComplianceCount, 0);

  const generateRow = (label: string, value: any, isHeader = false) => new TableRow({
    children: [
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: sanitize(label), bold: true, size: 22, font: REPORT_FONT })] })], 
        width: { size: 4000, type: WidthType.DXA },
        shading: isHeader ? { fill: "F2F2F2" } : undefined
      }),
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: sanitize(value), size: 22, font: REPORT_FONT })] })], 
        width: { size: 6000, type: WidthType.DXA },
      }),
    ]
  });

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
      children: [new TextRun({ text: `${sanitize(data.siteName)} (${sanitize(data.siteType)})`, bold: true, size: 36, font: REPORT_FONT })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: `MAINTENANCE COMPLIANCE AUDIT • ${sanitize(data.date)}`, size: 18, color: "555555", bold: true, font: REPORT_FONT })]
    }),

    new Paragraph({ text: "1. Audit Summary", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        generateRow("Inspector", data.userName),
        generateRow("Site Reference", data.siteName),
        generateRow("Facility Type", data.siteType),
        generateRow("Audit Date", data.date),
        generateRow("Total Assets Checked", stats.totalAssetsChecked),
        generateRow("Total Maintenance Defects Found", stats.totalMechanicalDefects),
        generateRow("Total Non-Maintenance Defects Found", totalNonMaintDefects),
        generateRow("Mechanical SIS (Depth)", stats.siteIssueScore),
        generateRow("Compliance (Breadth)", `${stats.compliancePercentage}%`),
      ]
    }),

    new Paragraph({ text: "2. Compliance Breakdown by Category", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Compliant", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Non-Compliant", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Total Inspected", bold: true, font: REPORT_FONT })] })] }),
          ]
        }),
        ...categories.map(cat => {
          const pass = data.compliantCounts[cat] || 0;
          const fail = data.observations.filter(o => o.category === cat).length;
          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sanitize(cat), font: REPORT_FONT })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sanitize(pass), font: REPORT_FONT })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sanitize(fail), font: REPORT_FONT })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sanitize(pass + fail), font: REPORT_FONT })] })] }),
            ]
          });
        })
      ]
    }),

    new Paragraph({ text: "3. Detailed Maintenance Findings", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
  ];

  const addObsToDoc = async (obs: Observation, index: number) => {
    children.push(new Paragraph({ 
      text: `Observation #${index + 1}: ${sanitize(obs.category)}`, 
      heading: HeadingLevel.HEADING_3, 
      spacing: { before: 300, after: 150 } 
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Asset Name / Description", bold: true, font: REPORT_FONT })] })], width: { size: 3000, type: WidthType.DXA } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sanitize(obs.assetName), font: REPORT_FONT })] })], width: { size: 7000, type: WidthType.DXA } })
          ]
        }),
        generateRow("Asset ID / Barcode", obs.assetId),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Risk Level", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sanitize(obs.risk).toUpperCase(), color: getRiskColor(obs.risk), bold: true, font: REPORT_FONT })] })] })
          ]
        }),
        generateRow("Defect Count", obs.nonComplianceCount),
        generateRow("Previously Seen", obs.previouslySeen),
        generateRow("Findings", obs.feedbackNotes),
        generateRow("Short Term Fix", obs.shortTermFix),
        generateRow("Long Term Fix", obs.longTermFix),
        generateRow("Action Owner", obs.actionOwner),
      ],
    }));

    if (obs.photos.length > 0) {
      const imgParts: any[] = [];
      for (const p of obs.photos) {
        const uint8 = base64ToUint8Array(p);
        if (uint8) {
          imgParts.push(new ImageRun({ 
            data: uint8 as any, 
            transformation: { width: 220, height: 165 },
            type: "png" // Force standard type mapping
          } as any));
          // Word Online handles wrapping better with a TextRun separator
          imgParts.push(new TextRun({ text: "  " }));
        }
      }
      if (imgParts.length > 0) {
        children.push(new Paragraph({ children: imgParts, spacing: { before: 200, after: 400 } }));
      }
    }
  };

  for (let i = 0; i < maintObs.length; i++) await addObsToDoc(maintObs[i], i);
  
  if (nonMaintObs.length > 0) {
    children.push(new Paragraph({ text: "4. Non-Maintenance Oriented Findings", heading: HeadingLevel.HEADING_2, spacing: { before: 600, after: 200 } }));
    for (let i = 0; i < nonMaintObs.length; i++) await addObsToDoc(nonMaintObs[i], maintObs.length + i);
  }

  const doc = new Document({ 
    creator: "Site Inspector",
    title: sanitize(data.siteName),
    description: "Asset Inspection Audit",
    styles: {
      default: {
        document: {
          run: {
            font: REPORT_FONT,
            size: 22,
          },
        },
      },
    },
    sections: [{ children }] 
  });
  
  const blob = await Packer.toBlob(doc);

  if (triggerDownload) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.siteName.replace(/\s+/g, '_')}_Report_${data.date.replace(/\//g, '-')}.docx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return blob;
};
