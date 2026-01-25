import * as docx from 'docx';
import { AssetCategory, InspectionData, Observation, calculateCompliance, RiskLevel, NON_MAINTENANCE_CATEGORY } from '../types.ts';

const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, TextRun, ImageRun } = docx;

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

const REPORT_FONT = "Arial Nova";

export const generateInspectionWordDoc = async (data: InspectionData) => {
  const stats = calculateCompliance(data);
  const categories = data.config.categories;
  const maintObs = data.observations.filter(o => categories.includes(o.category));
  const nonMaintObs = data.observations.filter(o => o.category === NON_MAINTENANCE_CATEGORY);
  
  const totalNonMaintDefects = nonMaintObs.reduce((s, o) => s + o.nonComplianceCount, 0);

  const generateRow = (label: string, value: any, isHeader = false) => new TableRow({
    children: [
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: REPORT_FONT })] })], 
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: isHeader ? { fill: "F2F2F2" } : undefined
      }),
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: value !== undefined && value !== "" && value !== null ? `${value}` : "", size: 20, font: REPORT_FONT })] })], 
        width: { size: 60, type: WidthType.PERCENTAGE },
      }),
    ]
  });

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
      children: [new TextRun({ text: `${data.siteName} (${data.siteType})`, bold: true, size: 36, font: REPORT_FONT })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: `MAINTENANCE COMPLIANCE AUDIT • ${data.date}`, size: 18, color: "555555", bold: true, font: REPORT_FONT })]
    }),

    new Paragraph({ text: "1. Audit Summary", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
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
      rows: [
        new TableRow({
          children: [
            new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Compliant", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Non-Compliant", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ shading: { fill: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Total Inspected", bold: true, font: REPORT_FONT })] })] } as any }),
          ]
        }),
        ...categories.map(cat => {
          const pass = data.compliantCounts[cat] || 0;
          const fail = data.observations.filter(o => o.category === cat).length;
          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cat, font: REPORT_FONT })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${pass}`, font: REPORT_FONT })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${fail}`, font: REPORT_FONT })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${pass + fail}`, font: REPORT_FONT })] })] }),
            ]
          });
        })
      ]
    }),

    new Paragraph({ text: "3. Detailed Maintenance Findings", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
  ];

  const addObsToDoc = async (obs: Observation, index: number) => {
    children.push(new Paragraph({ 
      text: `Observation #${index + 1}: ${obs.category}`, 
      heading: HeadingLevel.HEADING_3, 
      spacing: { before: 300, after: 150 } 
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Asset Name / Description", bold: true, font: REPORT_FONT })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: obs.assetName || "", font: REPORT_FONT })] })] })
          ]
        }),
        generateRow("Asset ID / Barcode", obs.assetId),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Risk Level", bold: true, font: REPORT_FONT })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (obs.risk || "").toUpperCase(), color: getRiskColor(obs.risk), bold: true, font: REPORT_FONT })] })] })
          ]
        }),
        generateRow("Defect Count", obs.nonComplianceCount),
        generateRow("Previously Seen", obs.previouslySeen),
        generateRow("Findings", obs.feedbackNotes),
        generateRow("Short Term Fix", obs.shortTermFix),
        generateRow("Long Term Fix", obs.longTermFix),
        generateRow("Report Feedback", ""),
        generateRow("Action Owner", ""),
      ],
    }));

    if (obs.photos.length > 0) {
      const imgRuns: any[] = [];
      for (const p of obs.photos) {
        const uint8 = base64ToUint8Array(p);
        if (uint8) {
          // Fixed TS2345: Argument of type... is not assignable to parameter of type 'IImageOptions'
          // Using type assertion as IMediaOptions | any to satisfy the complex Union type in docx v9
          imgRuns.push(new ImageRun({ 
            data: uint8, 
            transformation: { width: 180, height: 135 } 
          } as any));
          imgRuns.push(new TextRun({ text: "  " }));
        }
      }
      children.push(new Paragraph({ children: imgRuns, spacing: { before: 100, after: 200 } }));
    }
  };

  for (let i = 0; i < maintObs.length; i++) await addObsToDoc(maintObs[i], i);
  
  if (nonMaintObs.length > 0) {
    children.push(new Paragraph({ text: "4. Non-Maintenance Oriented Findings", heading: HeadingLevel.HEADING_2, spacing: { before: 600, after: 200 } }));
    for (let i = 0; i < nonMaintObs.length; i++) await addObsToDoc(nonMaintObs[i], maintObs.length + i);
  }

  const doc = new Document({ 
    styles: {
      default: {
        document: {
          run: {
            font: REPORT_FONT,
          },
        },
      },
    },
    sections: [{ children }] 
  });
  
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.siteName}_Report_${data.date.replace(/\//g, '-')}.docx`;
  link.click();
  
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};