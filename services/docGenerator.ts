
import * as docx from 'docx';
import { AssetCategory, InspectionData, Observation, calculateCompliance } from '../types.ts';

const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, TextRun, ImageRun } = docx;

/**
 * Robustly converts base64 to Uint8Array for docx.
 */
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

export const generateInspectionWordDoc = async (data: InspectionData) => {
  const maintenanceObs = data.observations.filter(o => o.category !== AssetCategory.NON_MAINTENANCE);
  const nonMaintenanceObs = data.observations.filter(o => o.category === AssetCategory.NON_MAINTENANCE);
  
  // Summing all non-maintenance non-compliance counts together as requested
  const totalNonMaintNC = nonMaintenanceObs.reduce((sum, obs) => sum + obs.nonComplianceCount, 0);

  const prevSeenCount = data.observations.filter(o => o.previouslySeen === 'Yes').length;
  const { 
    siteIssueScore, 
    totalAssetsChecked, 
    totalNC_Sum, 
    compliancePercentage 
  } = calculateCompliance(data);

  const assetCategories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];

  const generateRow = (label: string, value: any, isHeader = false) => new TableRow({
    children: [
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })], 
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: isHeader ? { fill: "F2F2F2" } : undefined
      }),
      new TableCell({ 
        children: [new Paragraph({ children: [typeof value === 'string' || typeof value === 'number' ? new TextRun({ text: `${value}` }) : value] })] 
      }),
    ]
  });

  const sectionsChildren: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
      children: [new TextRun({ text: `${data.siteName} - ${data.date}`, bold: true, size: 36 })]
    }),

    new Paragraph({ 
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Inspection Summary", bold: true, size: 28 })]
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        generateRow("Inspector", data.userName),
        generateRow("Site Name", data.siteName),
        generateRow("Site Type", data.siteType),
        generateRow("Inspection Date", data.date),
        generateRow("Total Assets Verified", totalAssetsChecked),
        generateRow("Total Maintenance Non-Compliances", totalNC_Sum),
        generateRow("Issues Seen Previously", prevSeenCount),
        generateRow("Non-Maintenance Issue Count (Sum of NC)", totalNonMaintNC),
        new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: "Site Issue Score (Perfect = 0)", bold: true })] })], 
              shading: { fill: "E0F2F1" } 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: `${siteIssueScore}`, bold: true, size: 28, color: Number(siteIssueScore) > 0.5 ? "FF0000" : "000000" })] })],
              shading: { fill: "E0F2F1" }
            }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Site Compliance %", bold: true })] })], shading: { fill: "F9FBE7" } }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: `${compliancePercentage}%`, bold: true, color: compliancePercentage < 75 ? "FF0000" : "008000" })] })],
              shading: { fill: "F9FBE7" }
            }),
          ]
        })
      ]
    }),

    new Paragraph({ 
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: "Compliance by Category", bold: true, size: 24 })]
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Asset Category", bold: true })] })], shading: { fill: "F2F2F2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Compliant", bold: true })] })], shading: { fill: "F2F2F2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Non-Compliant Assets", bold: true })] })], shading: { fill: "F2F2F2" } }),
          ],
        }),
        ...assetCategories.map(cat => 
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cat })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${data.compliantCounts[cat] || 0}` })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${data.observations.filter(o => o.category === cat).length}` })] })] }),
            ],
          })
        ),
      ],
    }),
  ];

  const addObservationToDoc = async (obs: Observation, index: number) => {
    sectionsChildren.push(new Paragraph({ 
      heading: HeadingLevel.HEADING_3, 
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: `Observation #${index + 1}: ${obs.category}`, bold: true, color: "CC0000" })] 
    }));

    sectionsChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        generateRow("Asset Description", obs.assetName),
        generateRow("Asset ID", obs.assetId || "N/A"),
        generateRow("Risk Level", obs.risk),
        generateRow("Previously Seen?", obs.previouslySeen),
        generateRow("Defects Count", `${obs.nonComplianceCount}`),
        generateRow("Notes", obs.notes || "None"),
        generateRow("Short Term Fix", ""),
        generateRow("Long Term Fix", ""),
        generateRow("Report Feedback Findings", ""),
        generateRow("Action Owner", ""),
      ],
    }));

    if (obs.photos && obs.photos.length > 0) {
      const photoParts: any[] = [];
      for (const photo of obs.photos) {
        const uint8 = base64ToUint8Array(photo);
        if (uint8) {
          photoParts.push(new ImageRun({ 
            data: uint8, 
            transformation: { width: 220, height: 160 } 
          } as any));
          photoParts.push(new TextRun({ text: "  " }));
        }
      }
      if (photoParts.length > 0) {
        sectionsChildren.push(new Paragraph({ children: photoParts, spacing: { before: 200 } }));
      }
    }
  };

  if (maintenanceObs.length > 0) {
    sectionsChildren.push(new Paragraph({ 
      heading: HeadingLevel.HEADING_2, 
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: "Asset Maintenance Observations", bold: true, size: 24 })]
    }));
    for (let i = 0; i < maintenanceObs.length; i++) await addObservationToDoc(maintenanceObs[i], i);
  }

  if (nonMaintenanceObs.length > 0) {
    sectionsChildren.push(new Paragraph({ 
      heading: HeadingLevel.HEADING_2, 
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: "Non-Maintenance Observations", bold: true, size: 24 })]
    }));
    for (let i = 0; i < nonMaintenanceObs.length; i++) await addObservationToDoc(nonMaintenanceObs[i], maintenanceObs.length + i);
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: sectionsChildren
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = `${data.siteName} - ${data.date.replace(/\//g, '-')}.docx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1000);
};
