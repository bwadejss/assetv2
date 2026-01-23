
export enum SiteType {
  WTW = 'WTW',
  STW = 'STW'
}

export enum RiskLevel {
  LOW = 'Low',
  MED = 'Med',
  HI = 'Hi'
}

export enum AssetCategory {
  PUMPS = 'Pumps',
  MOTORS = 'Motors',
  COMPRESSORS = 'Compressors',
  ELECTRICAL_PANELS = 'Electrical Panels',
  NON_MAINTENANCE = 'Non-Maintenance'
}

export interface Observation {
  id: string;
  category: AssetCategory;
  assetName: string;
  assetId?: string;
  risk: RiskLevel;
  nonComplianceCount: number;
  previouslySeen: 'Yes' | 'No';
  notes: string;
  photos: string[]; // Base64 strings
  timestamp: number;
}

export interface InspectionData {
  userName: string;
  siteName: string;
  siteType: SiteType;
  date: string;
  compliantCounts: Record<string, number>;
  observations: Observation[];
}

export type AppView = 'SETUP' | 'DASHBOARD' | 'OBSERVATION_FORM';

/**
 * Calculates site metrics.
 * The Site Issue Score is (Sum of all NC counts) / (Total Assets Checked).
 * Total Assets Checked = Compliant clicks + Number of assets with observations.
 * A score of 0 is perfect.
 */
export const calculateCompliance = (data: InspectionData) => {
  const categories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];
  let totalCompliant = 0;
  let totalNC_Sum = 0;
  let maintenanceAssetWithIssuesCount = 0;

  categories.forEach(cat => {
    totalCompliant += (data.compliantCounts[cat] || 0);
    const catObs = data.observations.filter(o => o.category === cat);
    maintenanceAssetWithIssuesCount += catObs.length;
    catObs.forEach(obs => {
      totalNC_Sum += obs.nonComplianceCount;
    });
  });

  const totalAssetsChecked = totalCompliant + maintenanceAssetWithIssuesCount;
  
  // Site Issue Score (SIS): Defects per Asset. 
  // Lower is better. 0 is perfect.
  const siteIssueScore = totalAssetsChecked === 0 ? 0 : (totalNC_Sum / totalAssetsChecked).toFixed(3);
  
  // Legacy compliance percentage (Percentage of assets that had NO issues)
  const compliancePercentage = totalAssetsChecked === 0 ? 100 : Math.round((totalCompliant / totalAssetsChecked) * 100);
  
  return {
    compliancePercentage,
    siteIssueScore,
    totalAssetsChecked,
    totalNC_Sum,
    maintenanceAssetWithIssuesCount
  };
};
