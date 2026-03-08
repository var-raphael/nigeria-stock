// backend/dashboard.ts

export type Holding = {
  symbol: string;
  name: string;
  shares: number;
  avgBuy: number;
  price: number;
};

export type Mover = {
  symbol: string;
  changePct: number;
  price: number;
};

export type Transaction = {
  type: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
  eth: number;
  date: string;
};

export type DashboardSummary = {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPct: number;
  totalETH: number;
  ethBalance: number;
  chartData: number[];
};

export type DashboardData = {
  holdings: Holding[];
  movers: Mover[];
  transactions: Transaction[];
  summary: DashboardSummary;
};

// ── Mock data ─────────────────────────────────────────────────────────────
// Replace these arrays with real DB/API calls inside getDashboardData()

const HOLDINGS: Holding[] = [
  { symbol: "MTNN",       name: "MTN Nigeria",    shares: 120, avgBuy: 720.0,  price: 780.0  },
  { symbol: "DANGCEM",    name: "Dangote Cement", shares: 30,  avgBuy: 760.0,  price: 799.9  },
  { symbol: "GTCO",       name: "GT Holding Co.", shares: 500, avgBuy: 110.0,  price: 118.0  },
  { symbol: "AIRTELAFRI", name: "Airtel Africa",  shares: 15,  avgBuy: 2400.0, price: 2270.0 },
  { symbol: "ZENITHBANK", name: "Zenith Bank",    shares: 800, avgBuy: 42.0,   price: 48.5   },
];

const MOVERS: Mover[] = [
  { symbol: "MTNN",       changePct:  4.00, price: 780.0  },
  { symbol: "BUAFOODS",   changePct:  2.10, price: 845.0  },
  { symbol: "CONOIL",     changePct:  1.81, price: 169.0  },
  { symbol: "AIRTELAFRI", changePct: -0.50, price: 2270.0 },
  { symbol: "INTBREW",    changePct: -1.33, price: 14.8   },
];

const TRANSACTIONS: Transaction[] = [
  { type: "BUY",  symbol: "MTNN",       shares: 40,  price: 740.0, eth: 0.0821, date: "Feb 28" },
  { type: "BUY",  symbol: "GTCO",       shares: 200, price: 112.0, eth: 0.0490, date: "Feb 25" },
  { type: "SELL", symbol: "ACCESSCORP", shares: 100, price: 26.1,  eth: 0.0057, date: "Feb 22" },
  { type: "BUY",  symbol: "DANGCEM",    shares: 10,  price: 758.0, eth: 0.0334, date: "Feb 20" },
];

// ── Derived summary ────────────────────────────────────────────────────────
// Computed here so the frontend receives ready-to-use numbers

function buildSummary(holdings: Holding[]): DashboardSummary {
  const totalValue  = holdings.reduce((s, h) => s + h.shares * h.price, 0);
  const totalCost   = holdings.reduce((s, h) => s + h.shares * h.avgBuy, 0);
  const totalPnL    = totalValue - totalCost;
  const totalPnLPct = (totalPnL / totalCost) * 100;
  const totalETH    = totalValue / 4_500_000;
  const chartData   = [1_820_000, 1_855_000, 1_910_000, 1_890_000, 1_935_000, 1_972_000, totalValue];

  return {
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPct,
    totalETH,
    ethBalance: 0.2341,   // replace with real wallet balance later
    chartData,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────
// This is the only function the API route calls.
// When you're ready for real data, only this function changes.

export async function getDashboardData(): Promise<DashboardData> {
  // TODO: replace with e.g. prisma.holding.findMany(), fetch("https://..."), etc.
  return {
    holdings:     HOLDINGS,
    movers:       MOVERS,
    transactions: TRANSACTIONS,
    summary:      buildSummary(HOLDINGS),
  };
}
