
import { InspectionData, calculateCompliance } from '../types';

/**
 * To use this, create a Power Automate "When an HTTP request is received" trigger.
 * The Excel file in SharePoint can then be updated via the "Add a row into a table" action.
 */
export const syncToExcel = async (data: InspectionData) => {
  // Fix: Destructure correct property names as defined in calculateCompliance return type (totalMechanicalDefects instead of totalNC_Sum)
  const { siteIssueScore, totalAssetsChecked, totalMechanicalDefects } = calculateCompliance(data);
  
  const WEBHOOK_URL = ""; // PASTE YOUR POWER AUTOMATE WEBHOOK URL HERE

  if (!WEBHOOK_URL) {
    console.warn("SharePoint Sync: No Webhook URL provided.");
    return { success: false, message: "Webhook URL missing." };
  }

  const payload = {
    siteName: data.siteName,
    siteType: data.siteType,
    inspector: data.userName,
    date: data.date,
    complianceScore: siteIssueScore,
    totalAssets: totalAssetsChecked,
    totalIssues: totalMechanicalDefects,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return { success: true, message: "SharePoint updated successfully!" };
    } else {
      throw new Error(`Server responded with ${response.status}`);
    }
  } catch (error) {
    console.error("Sync Error:", error);
    return { success: false, message: "Sync failed. Check connection." };
  }
};
