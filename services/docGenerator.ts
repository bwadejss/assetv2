import * as docx from 'docx';
import { AssetCategory, InspectionData, Observation, RiskLevel, calculateCompliance } from '../types';

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
    case RiskLevel.LOW: return "EAB308"; // Yellow-500
    case RiskLevel.MED: return "F97316"; // Orange-500
    case RiskLevel.HI: return "EF4444"; // Red-500
    default: return "000000";
  }
};

export const generateInspectionWordDoc = async (data: InspectionData) => {
  const maintenanceObs = data.observations.filter(o => o.category !== AssetCategory.NON_MAINTENANCE);
  const nonMaintenanceObs = data.observations.filter(o => o.category === AssetCategory.NON_MAINTENANCE);
  const totalNonMaintNC = nonMaintenanceObs.reduce((sum, obs) => sum + obs.nonComplianceCount, 0);
  const prevSeenCount = data.observations.filter(o => o.previouslySeen === 'Yes').length;
  
  const { 
    siteIssueScore, 
    totalAssetsChecked, 
    totalNC_Sum, 
    compliancePercentage 
  } = calculateCompliance(data);

  const assetCategories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];

  const generateRow = (label: string, value: any) => new TableRow({
    children: [
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22 })] })], 
        width: { size: 45, type: WidthType.PERCENTAGE },
      }),
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: `${value}`, size: 22 })] })], 
        width: { size: 55, type: WidthType.PERCENTAGE },
      }),
    ]
  });

  const sectionsChildren: any[] = [
    // Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: `${data.siteName} (${data.siteType})`, bold: true, size: 36 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: `MAINTENANCE AUDIT REPORT • ${data.date}`, size: 24, color: "555555" })]
    }),

    new Paragraph({ 
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
      children: [new TextRun({ text: "1. Inspection Summary", bold: true, size: 28 })]
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        generateRow("Inspector Name", data.userName),
        generateRow("Site Reference", data.siteName),
        generateRow("Asset Class", data.siteType),
        generateRow("Visit Date", data.date),
        generateRow("Assets Verified", totalAssetsChecked),
        generateRow("Total Defects Found", totalNC_Sum),
        generateRow("Previous Issues Outstanding", prevSeenCount),
        generateRow("Non-Maintenance Items", totalNonMaintNC),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SITE ISSUE SCORE (SIS)", bold: true, size: 24 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${siteIssueScore}`, bold: true, size: 28, color: Number(siteIssueScore) > 0.5 ? "FF0000" : "000000" })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MAINTENANCE COMPLIANCE %", bold: true, size: 24 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${compliancePercentage}%`, bold: true, size: 28, color: compliancePercentage < 75 ? "FF0000" : "008000" })] })] }),
          ]
        })
      ]
    }),

    new Paragraph({ 
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: "2. Compliance Statistics", bold: true, size: 28 })]
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Compliant", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Failed Assets", bold: true })] })] }),
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
      spacing: { before: 600, after: 200 },
      children: [new TextRun({ text: `Observation #${index + 1}: ${obs.category}`, bold: true, color: "CC0000", size: 24 })] 
    }));

    sectionsChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        generateRow("Asset Name", obs.assetName),
        generateRow("Asset ID", obs.assetId || "N/A"),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Risk Level", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: obs.risk, size: 22, color: getRiskColor(obs.risk), bold: true })] })] }),
          ]
        }),
        generateRow("Seen Before?", obs.previouslySeen),
        generateRow("Defect Count", `${obs.nonComplianceCount}`),
        generateRow("Inspector Notes", obs.notes || "No notes provided."),
        generateRow("Corrective Action (Short)", ""),
        generateRow("Corrective Action (Long)", ""),
      ],
    }));

    if (obs.photos && obs.photos.length > 0) {
      sectionsChildren.push(new Paragraph({ text: "Evidence Photos:", spacing: { before: 200, after: 100 }, children: [new TextRun({ bold: true, size: 18 })] }));
      
      const photoParts: any[] = [];
      for (const photo of obs.photos) {
        const uint8 = base64ToUint8Array(photo);
        if (uint8) {
          photoParts.push(new ImageRun({ 
            data: uint8, 
            transformation: { width: 180, height: 135 } 
          } as any));
          photoParts.push(new TextRun({ text: "  " }));
        }
      }
      if (photoParts.length > 0) {
        sectionsChildren.push(new Paragraph({ children: photoParts }));
      }
    }
  };

  if (maintenanceObs.length > 0) {
    sectionsChildren.push(new Paragraph({ 
      heading: HeadingLevel.HEADING_2, 
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: "3. Maintenance Defect Log", bold: true, size: 28 })]
    }));
    for (let i = 0; i < maintenanceObs.length; i++) await addObservationToDoc(maintenanceObs[i], i);
  }

  if (nonMaintenanceObs.length > 0) {
    sectionsChildren.push(new Paragraph({ 
      heading: HeadingLevel.HEADING_2, 
      spacing: { before: 600, after: 200 },
      children: [new TextRun({ text: "4. Safety & Non-Maint Log", bold: true, size: 28 })]
    }));
    for (let i = 0; i < nonMaintenanceObs.length; i++) await addObservationToDoc(nonMaintenanceObs[i], maintenanceObs.length + i);
  }

  const doc = new Document({
    sections: [{
      properties: { 
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } 
      },
      children: sectionsChildren
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = `${data.siteName}_${data.siteType}_Audit_${data.date.replace(/\//g, '-')}.docx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 2000);
};