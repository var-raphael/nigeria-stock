// backend/portfolio.ts

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgBuy: number;
  price: number;
  sector: string;
}

export interface Transaction {
  type: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
  eth: number;
  date: string;
}

export interface EnrichedHolding extends Holding {
  value: number;
  cost: number;
  pnl: number;
  pnlPct: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalETH: number;
}

export interface PortfolioData {
  holdings: EnrichedHolding[];
  transactions: Transaction[];
  summary: PortfolioSummary;
}

// ── Mock data ──────────────────────────────────────────────────────────────
// Replace with DB calls inside getPortfolioData() when ready

const RAW_HOLDINGS: Holding[] = [
  { symbol: "MTNN",       name: "MTN Nigeria Comms",  shares: 120, avgBuy: 720.0,  price: 780.0,  sector: "Telecom"   },
  { symbol: "DANGCEM",    name: "Dangote Cement",      shares: 30,  avgBuy: 760.0,  price: 799.9,  sector: "Materials" },
  { symbol: "GTCO",       name: "GT Holding Co.",      shares: 500, avgBuy: 110.0,  price: 118.0,  sector: "Finance"   },
  { symbol: "AIRTELAFRI", name: "Airtel Africa",       shares: 15,  avgBuy: 2400.0, price: 2270.0, sector: "Telecom"   },
  { symbol: "ZENITHBANK", name: "Zenith Bank",         shares: 800, avgBuy: 42.0,   price: 48.5,   sector: "Finance"   },
];

const TRANSACTIONS: Transaction[] = [
  { type: "BUY",  symbol: "MTNN",       shares: 40,  price: 740.0,  eth: 0.0821, date: "Feb 28, 2025" },
  { type: "BUY",  symbol: "GTCO",       shares: 200, price: 112.0,  eth: 0.0490, date: "Feb 25, 2025" },
  { type: "SELL", symbol: "ACCESSCORP", shares: 100, price: 26.1,   eth: 0.0057, date: "Feb 22, 2025" },
  { type: "BUY",  symbol: "DANGCEM",    shares: 10,  price: 758.0,  eth: 0.0334, date: "Feb 20, 2025" },
  { type: "BUY",  symbol: "ZENITHBANK", shares: 300, price: 41.5,   eth: 0.0273, date: "Feb 18, 2025" },
  { type: "BUY",  symbol: "AIRTELAFRI", shares: 15,  price: 2400.0, eth: 0.0800, date: "Feb 10, 2025" },
];

// ── Derived enrichment ─────────────────────────────────────────────────────

function enrichHoldings(holdings: Holding[]): EnrichedHolding[] {
  return holdings.map((h) => ({
    ...h,
    value:  h.shares * h.price,
    cost:   h.shares * h.avgBuy,
    pnl:    h.shares * (h.price - h.avgBuy),
    pnlPct: ((h.price - h.avgBuy) / h.avgBuy) * 100,
  }));
}

function buildSummary(enriched: EnrichedHolding[]): PortfolioSummary {
  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalCost  = enriched.reduce((s, h) => s + h.cost,  0);
  return {
    totalValue,
    totalCost,
    totalPnL: totalValue - totalCost,
    totalETH: totalValue / 4_500_000,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────
// Only this function changes when switching to real data.
// e.g. const holdings = await db.holding.findMany({ where: { userId } })

export async function getPortfolioData(): Promise<PortfolioData> {
  const holdings = enrichHoldings(RAW_HOLDINGS);
  return {
    holdings,
    transactions: TRANSACTIONS,
    summary: buildSummary(holdings),
  };
}
