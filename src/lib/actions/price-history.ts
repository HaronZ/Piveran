"use server";

import {
  getLaborPriceHistory as _getLaborPriceHistory,
  getPartPriceHistory as _getPartPriceHistory,
  type PriceHistoryEntry,
} from "@/lib/db/queries/price-history";

export async function fetchLaborPriceHistory(laborTypeId: string): Promise<PriceHistoryEntry[]> {
  return _getLaborPriceHistory(laborTypeId);
}

export async function fetchPartPriceHistory(partId: string): Promise<PriceHistoryEntry[]> {
  return _getPartPriceHistory(partId);
}
