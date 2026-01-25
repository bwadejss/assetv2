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
  sisThreshold: number; 
  complianceThreshold: number;
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
  photos: string[]; 
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
 * Calculates maintenance compliance metrics based on requested logic.
 * 1. Total Assets Checked = [Total Pass Clicks] + [Total Unique Failed Assets]
 * 2. Compliance % (Breadth) = (Pass Clicks / Total Assets Checked) * 100
 * 3. SIS (Depth) = Total Raw Defects / Total Assets Checked
 */
export const calculateCompliance = (data: InspectionData) => {
  const maintenanceCategories = [
    AssetCategory.PUMPS, 
    AssetCategory.MOTORS, 
    AssetCategory.COMPRESSORS, 
    AssetCategory.ELECTRICAL_PANELS
  ];
  
  let totalPassClicks = 0;
  let totalRawDefects = 0;
  const uniqueFailedMaintenanceAssets = new Set<string>();

  maintenanceCategories.forEach(cat => {
    // 1. Sum up all 'Pass' button clicks
    totalPassClicks += (data.compliantCounts[cat] || 0);
    
    // 2. Process observations for this category
    const catObs = data.observations.filter(o => o.category === cat);
    catObs.forEach(obs => {
      // Sum raw defects (Defect Qty) for SIS score (depth)
      totalRawDefects += obs.nonComplianceCount;
      // Track unique assets that failed for Compliance % (breadth)
      const assetKey = `${obs.assetName}-${obs.assetId || 'no-id'}`;
      uniqueFailedMaintenanceAssets.add(assetKey);
    });
  });

  // Total Population = Successful Checks + Failed Checks
  const totalAssetsChecked = totalPassClicks + uniqueFailedMaintenanceAssets.size;
  
  // Compliance %: Breadth score
  const compliancePercentage = totalAssetsChecked === 0 
    ? 100 
    : Math.round((totalPassClicks / totalAssetsChecked) * 100);
  
  // SIS Score: Depth score (Defect Density)
  const siteIssueScore = totalAssetsChecked === 0 
    ? "0.000" 
    : (totalRawDefects / totalAssetsChecked).toFixed(3);
  
  return {
    compliancePercentage,
    siteIssueScore,
    totalAssetsChecked,
    totalNC_Sum: totalRawDefects
  };
};