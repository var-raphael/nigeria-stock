// backend/stocks.ts

export type Category = "All" | "Equities" | "Bonds" | "ETFs" | "Suspended";

export interface Stock {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  category: Category;
}

export type StocksData = {
  stocks: Stock[];
  summary: {
    totalCount: number;
    topGainer: { symbol: string; changePct: number };
    topLoser:  { symbol: string; changePct: number };
  };
};

// ── Helpers ────────────────────────────────────────────────────────────────

function categorize(sym: string): Category {
  if (/\[(DIP|BLS|RST|MRF|DWL)\]/.test(sym)) return "Suspended";
  if (/\d{4}/.test(sym))                       return "Bonds";
  if (/WTF$|ETF$/i.test(sym))                  return "ETFs";
  return "Equities";
}

// ── Mock data ──────────────────────────────────────────────────────────────
// Replace with DB / live NGX feed inside getStocksData() when ready

const RAW_STOCKS = [
  { symbol: "DANGCEM",     price: 799.9,  change:  1.3,   changePct:  0.16, volume:  445888 },
  { symbol: "MTNN",        price: 780.0,  change: 30,     changePct:  4.0,  volume: 3177328 },
  { symbol: "GTCO",        price: 118.0,  change:  1.4,   changePct:  1.2,  volume: 2100000 },
  { symbol: "AIRTELAFRI",  price: 2270.0, change: -11.5,  changePct: -0.5,  volume:  980000 },
  { symbol: "ACCESSCORP",  price: 25.9,   change:  0.1,   changePct:  0.39, volume: 5400000 },
  { symbol: "BUAFOODS",    price: 845.0,  change: 17.4,   changePct:  2.1,  volume:  760000 },
  { symbol: "ZENITHBANK",  price: 48.5,   change: -0.1,   changePct: -0.2,  volume: 4200000 },
  { symbol: "ARADEL",      price: 1094.0, change: 16.2,   changePct:  1.5,  volume:  320000 },
  { symbol: "FIDELITYBK",  price: 20.4,   change:  0.3,   changePct:  1.5,  volume: 3800000 },
  { symbol: "FIRSTHOLDCO", price: 54.0,   change: -0.5,   changePct: -0.92, volume: 1200000 },
  { symbol: "FCMB",        price: 12.4,   change:  0.15,  changePct:  1.22, volume: 2900000 },
  { symbol: "INTBREW",     price: 14.8,   change: -0.2,   changePct: -1.33, volume:  880000 },
  { symbol: "GUINNESS",    price: 350.0,  change:  5.0,   changePct:  1.45, volume:  210000 },
  { symbol: "BUACEMENT",   price: 214.5,  change: -1.5,   changePct: -0.69, volume:  540000 },
  { symbol: "CADBURY",     price: 70.75,  change:  0.75,  changePct:  1.07, volume:  390000 },
  { symbol: "DANGSUGAR",   price: 81.9,   change:  0.9,   changePct:  1.11, volume:  720000 },
  { symbol: "CONOIL",      price: 169.0,  change:  3.0,   changePct:  1.81, volume:  180000 },
  { symbol: "CUSTODIAN",   price: 70.25,  change: -0.75,  changePct: -1.06, volume:  290000 },
  { symbol: "AIICO",       price: 4.44,   change:  0.04,  changePct:  0.91, volume: 1400000 },
  { symbol: "JAIZBANK",    price: 11.11,  change:  0.11,  changePct:  1.0,  volume: 2100000 },
  { symbol: "JBERGER",     price: 274.1,  change:  4.1,   changePct:  1.52, volume:   95000 },
  { symbol: "MANSARD",     price: 15.7,   change:  0.2,   changePct:  1.29, volume:  670000 },
  { symbol: "MAYBAKER",    price: 39.0,   change: -0.5,   changePct: -1.27, volume:  430000 },
  { symbol: "BETAGLAS",    price: 498.5,  change:  8.5,   changePct:  1.73, volume:   78000 },
  { symbol: "IKEJAHOTEL",  price: 41.9,   change:  0.4,   changePct:  0.96, volume:  340000 },
  { symbol: "CORNERST",    price: 6.5,    change:  0.05,  changePct:  0.77, volume:  890000 },
  { symbol: "HONYFLOUR",   price: 23.0,   change: -0.3,   changePct: -1.29, volume:  450000 },
  { symbol: "CHAMPION",    price: 16.2,   change:  0.2,   changePct:  1.25, volume:  560000 },
  { symbol: "BERGER",      price: 74.0,   change:  1.0,   changePct:  1.37, volume:  120000 },
  { symbol: "CHAMS",       price: 4.35,   change:  0.05,  changePct:  1.16, volume: 2300000 },
  { symbol: "CAVERTON",    price: 7.05,   change: -0.05,  changePct: -0.70, volume:  980000 },
  { symbol: "ABBEYBDS",    price: 11.4,   change:  0.1,   changePct:  0.88, volume:  340000 },
  { symbol: "ACADEMY",     price: 8.4,    change:  0.1,   changePct:  1.20, volume:  210000 },
  { symbol: "CHIPLC",      price: 1.09,   change:  0.01,  changePct:  0.93, volume: 4500000 },
  { symbol: "CWG",         price: 23.0,   change:  0.5,   changePct:  2.22, volume:  760000 },
  { symbol: "CUTIX",       price: 3.95,   change: -0.05,  changePct: -1.25, volume: 1200000 },
  { symbol: "ETRANZACT",   price: 22.9,   change:  0.4,   changePct:  1.78, volume:  430000 },
  { symbol: "ETI",         price: 47.6,   change:  0.6,   changePct:  1.28, volume:  890000 },
  { symbol: "ELLAHLAKES",  price: 11.55,  change:  0.15,  changePct:  1.32, volume:  670000 },
  { symbol: "ENAMELWA",    price: 40.5,   change: -0.5,   changePct: -1.22, volume:  230000 },
  { symbol: "LINKASSURE",  price: 1.83,   change:  0.03,  changePct:  1.67, volume: 3400000 },
  { symbol: "LIVESTOCK",   price: 7.0,    change:  0.1,   changePct:  1.45, volume: 1900000 },
  { symbol: "LIVINGTRUST", price: 6.55,   change:  0.05,  changePct:  0.77, volume: 1100000 },
  { symbol: "GUINEAINS",   price: 1.42,   change:  0.02,  changePct:  1.43, volume: 5600000 },
  { symbol: "HMCALL",      price: 4.5,    change: -0.05,  changePct: -1.10, volume:  870000 },
  { symbol: "IMG",         price: 36.0,   change:  0.5,   changePct:  1.41, volume:  320000 },
  { symbol: "GREENWETF",   price: 900.0,  change:  0,     changePct:  0,    volume:   12000 },
  { symbol: "DAN2026S1TB", price: 100.0,  change:  0,     changePct:  0,    volume:    5000 },
  { symbol: "FMN2026S1",   price: 100.0,  change:  0,     changePct:  0,    volume:    3200 },
  { symbol: "LFZ2032S1",   price: 100.0,  change:  0,     changePct:  0,    volume:    2100 },
  { symbol: "DAN2027S2TA", price: 100.0,  change:  0,     changePct:  0,    volume:    1800 },
  { symbol: "AXA2027S1",   price: 100.0,  change:  0,     changePct:  0,    volume:    2400 },
  { symbol: "DUNLOP [DIP]",    price: 0.2,  change: 0, changePct: 0, volume: 0 },
  { symbol: "ETERNA [MRF]",    price: 32.5, change: 0, changePct: 0, volume: 0 },
  { symbol: "DEAPCAP [DWL]",   price: 8.35, change: 0, changePct: 0, volume: 0 },
  { symbol: "AFROMEDIA [MRF]", price: 0.24, change: 0, changePct: 0, volume: 0 },
  { symbol: "AFRINSURE [MRF]", price: 0.2,  change: 0, changePct: 0, volume: 0 },
];

// ── Derived summary ────────────────────────────────────────────────────────

function buildSummary(stocks: Stock[]) {
  const active    = stocks.filter((s) => s.change !== 0);
  const topGainer = active.reduce((best, s)  => s.changePct > best.changePct ? s : best, active[0] ?? stocks[0]);
  const topLoser  = active.reduce((worst, s) => s.changePct < worst.changePct ? s : worst, active[0] ?? stocks[0]);
  return {
    totalCount: stocks.length,
    topGainer: { symbol: topGainer.symbol, changePct: topGainer.changePct },
    topLoser:  { symbol: topLoser.symbol,  changePct: topLoser.changePct  },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────
// Only this function needs to change when switching to real data.

export async function getStocksData(): Promise<StocksData> {
  // TODO: replace with live NGX feed / DB call
  const stocks = RAW_STOCKS.map((s) => ({ ...s, category: categorize(s.symbol) }));
  return { stocks, summary: buildSummary(stocks) };
}
