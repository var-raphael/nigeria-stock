// backend/ticker.ts

export interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  week52High: number;
  week52Low: number;
  about: string;
  sector: string;
  chart: number[];
}

// ── Mock data ──────────────────────────────────────────────────────────────

const STOCK_DB: Record<string, StockDetail> = {
  DANGCEM:    { symbol:"DANGCEM",    name:"Dangote Cement Plc",                price:799.9,  change:1.3,   changePct:0.16,  open:798.6,  high:803.0,  low:796.0,  volume:445888,  marketCap:13_620_000_000_000, week52High:920.0,  week52Low:610.0,  sector:"Building Materials", about:"Dangote Cement is Africa's largest cement producer, with a pan-African presence across 10 countries. Headquartered in Lagos, it operates integrated plants and grinding stations with a combined capacity exceeding 51 million tonnes per annum.",                chart:[740,758,772,769,781,793,799.9] },
  MTNN:       { symbol:"MTNN",       name:"MTN Nigeria Communications Plc",    price:780.0,  change:30.0,  changePct:4.0,   open:752.0,  high:784.5,  low:749.0,  volume:3177328, marketCap:15_900_000_000_000, week52High:310.0,  week52Low:198.0,  sector:"Telecommunications", about:"MTN Nigeria is the country's largest mobile network operator by subscribers, providing voice, data, digital and financial services to over 76 million customers. It is a subsidiary of the MTN Group, headquartered in Johannesburg.",                                   chart:[680,695,710,724,740,758,780.0] },
  GTCO:       { symbol:"GTCO",       name:"Guaranty Trust Holding Company Plc",price:118.0,  change:1.4,   changePct:1.2,   open:116.6,  high:119.5,  low:115.8,  volume:2100000, marketCap:3_470_000_000_000,  week52High:145.0,  week52Low:38.0,   sector:"Financial Services", about:"GTCO is a pan-African financial services group offering retail, corporate and investment banking through Guaranty Trust Bank, as well as payments, asset management and pension services. It operates in 10 countries across Africa and the UK.",                        chart:[112,113,114,115,116,117,118.0] },
  AIRTELAFRI: { symbol:"AIRTELAFRI", name:"Airtel Africa Plc",                 price:2270.0, change:-11.5, changePct:-0.5,  open:2281.5, high:2292.0, low:2260.0, volume:980000,  marketCap:8_540_000_000_000,  week52High:2650.0, week52Low:1480.0, sector:"Telecommunications", about:"Airtel Africa is a leading provider of telecommunications and mobile money services across 14 countries in sub-Saharan Africa. It offers voice, data, and Airtel Money services to over 140 million customers.",                                                        chart:[2320,2310,2295,2285,2278,2275,2270.0] },
  ZENITHBANK: { symbol:"ZENITHBANK", name:"Zenith Bank Plc",                   price:48.5,   change:-0.1,  changePct:-0.2,  open:48.6,   high:49.2,   low:48.0,   volume:4200000, marketCap:1_520_000_000_000,  week52High:62.0,   week52Low:22.0,   sector:"Financial Services", about:"Zenith Bank is one of Nigeria's largest financial institutions by tier-1 capital, serving retail, corporate and public sector customers across Nigeria and internationally with a network of over 500 branches.",                                                      chart:[49.2,49.0,48.8,48.7,48.6,48.55,48.5] },
  BUAFOODS:   { symbol:"BUAFOODS",   name:"BUA Foods Plc",                     price:845.0,  change:17.4,  changePct:2.1,   open:827.6,  high:849.0,  low:825.0,  volume:760000,  marketCap:15_200_000_000_000, week52High:960.0,  week52Low:410.0,  sector:"Consumer Goods",     about:"BUA Foods is one of Nigeria's largest integrated food companies, producing sugar, flour, pasta, and edible oils. Its brands are household names across Nigeria with manufacturing plants in major states.",                                                           chart:[790,800,812,820,828,836,845.0] },
  ACCESSCORP: { symbol:"ACCESSCORP", name:"Access Holdings Plc",               price:25.9,   change:0.1,   changePct:0.39,  open:25.8,   high:26.3,   low:25.6,   volume:5400000, marketCap:930_000_000_000,    week52High:32.0,   week52Low:14.0,   sector:"Financial Services", about:"Access Holdings is the parent company of Access Bank, one of Africa's largest banks by total assets, operating across multiple African countries and internationally.",                                                                                                  chart:[24.5,24.8,25.0,25.2,25.5,25.7,25.9] },
  FIDELITYBK: { symbol:"FIDELITYBK", name:"Fidelity Bank Plc",                 price:20.4,   change:0.3,   changePct:1.5,   open:20.1,   high:20.7,   low:20.0,   volume:3800000, marketCap:680_000_000_000,    week52High:26.0,   week52Low:9.0,    sector:"Financial Services", about:"Fidelity Bank is a full-service commercial bank in Nigeria, providing retail and corporate banking services across its network of over 250 business offices nationwide.",                                                                                                  chart:[18.5,18.9,19.2,19.5,19.8,20.1,20.4] },
  GUINNESS:   { symbol:"GUINNESS",   name:"Guinness Nigeria Plc",               price:350.0,  change:5.0,   changePct:1.45,  open:345.0,  high:354.0,  low:344.0,  volume:210000,  marketCap:780_000_000_000,    week52High:420.0,  week52Low:220.0,  sector:"Consumer Goods",     about:"Guinness Nigeria is a leading beverage company producing and marketing Guinness Stout, Malta Guinness, Harp Lager and other brands across Nigeria.",                                                                                                                 chart:[328,332,337,340,344,347,350.0] },
  BUACEMENT:  { symbol:"BUACEMENT",  name:"BUA Cement Plc",                     price:214.5,  change:-1.5,  changePct:-0.69, open:216.0,  high:217.5,  low:213.0,  volume:540000,  marketCap:7_100_000_000_000,  week52High:260.0,  week52Low:150.0,  sector:"Building Materials", about:"BUA Cement is one of Nigeria's largest cement manufacturers, operating integrated cement plants with a combined annual production capacity of over 11 million metric tonnes.",                                                                                             chart:[222,220,218,217,216,215,214.5] },
  ARADEL:     { symbol:"ARADEL",     name:"Aradel Holdings Plc",                price:1094.0, change:16.2,  changePct:1.5,   open:1078.0, high:1100.0, low:1074.0, volume:320000,  marketCap:2_100_000_000_000,  week52High:1250.0, week52Low:700.0,  sector:"Energy",             about:"Aradel Holdings is an integrated energy company with upstream oil and gas operations, downstream petroleum marketing, and power generation assets across Nigeria.",                                                                                                   chart:[1040,1050,1062,1070,1078,1085,1094.0] },
};

function buildFallback(ticker: string): StockDetail {
  return {
    symbol: ticker, name: ticker + " Plc",
    price: 100.0, change: 0.5, changePct: 0.5,
    open: 99.5, high: 101.2, low: 99.0, volume: 500000, marketCap: 50_000_000_000,
    week52High: 120.0, week52Low: 80.0, sector: "Equities",
    about: "Real-time data for this stock will be available once connected to the iTick API.",
    chart: [97, 98, 98.5, 99, 99.2, 99.8, 100.0],
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Fetch detail for a single ticker — used by [ticker] page and /api/compare */
export async function getStockDetail(ticker: string): Promise<StockDetail> {
  const symbol = ticker.toUpperCase();
  // TODO: replace with DB/API call e.g. fetch(`https://itick.api/stocks/${symbol}`)
  return STOCK_DB[symbol] ?? buildFallback(symbol);
}

/** All known symbols — used by the compare picker dropdown */
export async function getCompareSymbols(): Promise<string[]> {
  // TODO: replace with db.stock.findMany({ select: { symbol: true } })
  return Object.keys(STOCK_DB);
}
