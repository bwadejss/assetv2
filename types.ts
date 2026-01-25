export enum SiteType {
  WTW = 'WTW',
  STW = 'STW'
}

export enum RiskLevel {
  LOW = 'Low',
  MED = 'Med',
  HI = 'Hi'
}

export type AssetCategory = string;

export const DEFAULT_CATEGORIES: AssetCategory[] = [
  'Pumps',
  'Motors',
  'Compressors',
  'Electrical Panels'
];

export const NON_MAINTENANCE_CATEGORY = 'Non-Maintenance';

export interface Observation {
  id: string;
  category: AssetCategory;
  assetName: string;
  assetId?: string;
  risk: RiskLevel;
  nonComplianceCount: number;
  previouslySeen: 'Yes' | 'No';
  shortTermFix: string;
  longTermFix: string;
  feedbackNotes: string;
  actionOwner: string;
  notes: string;
  photos: string[]; // Base64 strings
  timestamp: number;
}

export interface ScoringConfig {
  sisThreshold: number;
  complianceThreshold: number;
  categories: AssetCategory[];
  debugMode: boolean; // NEW: Toggle for on-screen debug log
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  sisThreshold: 0.5,
  complianceThreshold: 85,
  categories: [...DEFAULT_CATEGORIES],
  debugMode: false
};

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

export const calculateCompliance = (data: InspectionData) => {
  const mechanicalCategories = data.config.categories;

  let totalPassClicks = 0;
  mechanicalCategories.forEach(cat => {
    totalPassClicks += (data.compliantCounts[cat] || 0);
  });

  const mechanicalObservations = data.observations.filter(o => 
    mechanicalCategories.includes(o.category)
  );

  const assetsWithIssuesCount = mechanicalObservations.length;
  const totalMechanicalDefects = mechanicalObservations.reduce((sum, obs) => sum + obs.nonComplianceCount, 0);

  const totalAssetsChecked = totalPassClicks + assetsWithIssuesCount;
  
  const siteIssueScore = totalAssetsChecked === 0 ? "0.000" : (totalMechanicalDefects / totalAssetsChecked).toFixed(3);
  const compliancePercentage = totalAssetsChecked === 0 ? 100 : Math.round((totalPassClicks / totalAssetsChecked) * 100);
  
  return {
    compliancePercentage,
    siteIssueScore,
    totalAssetsChecked,
    totalMechanicalDefects,
    assetsWithIssuesCount
  };
};