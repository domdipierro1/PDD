import type { ContractorRate } from "@/lib/types";

export const targetContractorRates = {
  studio_rate: 60,
  one_bed_rate: 100,
  two_bed_rate: 160,
  three_bed_rate: 200,
  four_bed_rate: 320,
  deep_clean_hourly_rate: 20,
  single_oven_rate: 35,
  double_oven_rate: 55,
  range_cooker_rate: 75,
  windows_flat_rate: 15,
  windows_house_rate: 25,
} as const;

export const customerMinimumByProperty = {
  studio_rate: 160,
  one_bed_rate: 230,
  two_bed_rate: 320,
  three_bed_rate: 430,
  four_bed_rate: 600,
} as const;

export type RateKey = keyof typeof targetContractorRates;

export function rateVariance(value: number | null | undefined, target: number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Number(value) - target;
}

export function suggestTier(rate?: ContractorRate | null) {
  if (!rate) return "Unrated";
  const values = [rate.studio_rate, rate.one_bed_rate, rate.two_bed_rate, rate.three_bed_rate].filter((v) => v !== null && v !== undefined).map(Number);
  if (values.length === 0) return "Unrated";
  const targetValues = [targetContractorRates.studio_rate, targetContractorRates.one_bed_rate, targetContractorRates.two_bed_rate, targetContractorRates.three_bed_rate].slice(0, values.length);
  const averageVariance = values.reduce((sum, value, index) => sum + (value - targetValues[index]), 0) / values.length;
  if (averageVariance <= 10) return "Core";
  if (averageVariance <= 30) return "Premium Backup";
  return "Reserve";
}

export function estimatedRateForProperty(rate: ContractorRate | null | undefined, propertySize: string | null | undefined) {
  if (!rate || !propertySize) return null;
  const key = propertySize.toLowerCase();
  if (key.includes("studio")) return rate.studio_rate;
  if (key.includes("1")) return rate.one_bed_rate;
  if (key.includes("2")) return rate.two_bed_rate;
  if (key.includes("3")) return rate.three_bed_rate;
  if (key.includes("4")) return rate.four_bed_rate;
  if (key.includes("5")) return rate.five_bed_plus_rate;
  return null;
}

export function minimumCustomerPriceForMargin(contractorCost: number | null | undefined, targetMargin = 0.4) {
  if (!contractorCost || contractorCost <= 0 || targetMargin >= 1) return null;
  return contractorCost / (1 - targetMargin);
}
