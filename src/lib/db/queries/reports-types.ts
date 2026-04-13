// Shared types for reports module — safe for client imports (no DB)

export type InventorySnapshotRow = {
  id: string;
  currentValue: string | null;
  date: string | null;
  quarter: string | null;
  year: number | null;
};

export type VendorPricingRow = {
  id: string;
  partId: string;
  partName: string;
  brandName: string | null;
  vendorId: string;
  vendorName: string;
  price: string | null;
  comment: string | null;
  link: string | null;
  lastUpdate: string | null;
};

export type StockAuditRow = {
  id: string;
  partName: string;
  auditCount: number;
  currentStock: number | null;
  discrepancy: number | null;
  status: string;
  comment: string | null;
  createdAt: string | null;
};

export type ReportKPIs = {
  totalParts: number;
  totalVendorLinks: number;
  totalAudits: number;
  latestValuation: string | null;
};
