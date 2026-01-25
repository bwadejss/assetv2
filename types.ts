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

export interface ScoringConfig {
  sisThreshold: number; // Score above which turns red
  complianceThreshold: number; // Percentage below which turns red
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
  config: ScoringConfig;
}

export type AppView = 'SETUP' | 'DASHBOARD' | 'OBSERVATION_FORM';

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  sisThreshold: 0.5,
  complianceThreshold: 75
};

/**
 * Calculates site metrics based on maintenance compliance.
 * Risk weights are ignored in calculations per requirements.
 * Total Assets Checked = [Total Pass Clicks] + [Total Number of Assets with Issues logged]
 */
export const calculateCompliance = (data: InspectionData) => {
  const categories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];
  let totalPassClicks = 0;
  let totalRawDefects = 0;
  let uniqueMaintenanceAssetsWithIssues = new Set<string>();

  categories.forEach(cat => {
    totalPassClicks += (data.compliantCounts[cat] || 0);
    const catObs = data.observations.filter(o => o.category === cat);
    
    catObs.forEach(obs => {
      totalRawDefects += obs.nonComplianceCount;
      // We assume assetName + assetId uniquely identifies the machine for the "Depth" calc
      uniqueMaintenanceAssetsWithIssues.add(`${obs.assetName}-${obs.assetId || ''}`);
    });
  });

  const totalAssetsChecked = totalPassClicks + uniqueMaintenanceAssetsWithIssues.size;
  
  // Site Issue Score (SIS): Raw Defects per Asset.
  const siteIssueScore = totalAssetsChecked === 0 ? "0.000" : (totalRawDefects / totalAssetsChecked).toFixed(3);
  
  // Compliance percentage: Percentage of assets that were completely compliant
  const compliancePercentage = totalAssetsChecked === 0 ? 100 : Math.round((totalPassClicks / totalAssetsChecked) * 100);
  
  return {
    compliancePercentage,
    siteIssueScore,
    totalAssetsChecked,
    totalNC_Sum: totalRawDefects
  };
};