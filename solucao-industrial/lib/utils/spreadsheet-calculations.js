const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  let normalized = raw.replace(/\s+/g, '');
  const hasDot = normalized.includes('.');
  const hasComma = normalized.includes(',');

  if (hasDot && hasComma) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = normalized.replace(',', '.');
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function sum(values) {
  return round2(values.reduce((acc, v) => acc + toNumber(v), 0));
}

function monthKey(month) {
  if (typeof month === 'number') return MONTHS[Math.max(0, Math.min(11, month - 1))];
  const m = String(month || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 3);

  if (m === 'mar') return 'mar';
  return m;
}

function calculateTotal(consumo, custoUnitario) {
  return round2(toNumber(consumo) * toNumber(custoUnitario));
}

function calculateMonthlyLineCosts(entries) {
  const result = Object.fromEntries(MONTHS.map((m) => [m, 0]));

  for (const entry of entries || []) {
    const key = monthKey(entry.mes || entry.month);
    if (!result.hasOwnProperty(key)) continue;

    const total = calculateTotal(entry.consumo, entry.custoUnitario || entry.custoKg || entry.valorUnitario);
    result[key] = round2(result[key] + total);
  }

  return result;
}

function calculateVariableCostsByMonth({ agua = {}, energia = {}, telefonia = {} }) {
  const total = {};
  for (const m of MONTHS) {
    total[m] = round2(toNumber(agua[m]) + toNumber(energia[m]) + toNumber(telefonia[m]));
  }

  return {
    agua: MONTHS.reduce((acc, m) => ({ ...acc, [m]: round2(toNumber(agua[m])) }), {}),
    energia: MONTHS.reduce((acc, m) => ({ ...acc, [m]: round2(toNumber(energia[m])) }), {}),
    telefonia: MONTHS.reduce((acc, m) => ({ ...acc, [m]: round2(toNumber(telefonia[m])) }), {}),
    total,
  };
}

function normalizeMonthValues(values = {}) {
  const out = Object.fromEntries(MONTHS.map((m) => [m, 0]));
  for (const [k, v] of Object.entries(values || {})) {
    const mk = monthKey(k);
    if (Object.prototype.hasOwnProperty.call(out, mk)) out[mk] = round2(v);
  }
  return out;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + toNumber(months));
  return d;
}

function diffDays(a, b) {
  const ms = new Date(a).setHours(0, 0, 0, 0) - new Date(b).setHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000);
}

function excelSerialToDate(serial) {
  const n = toNumber(serial);
  if (!n) return null;
  const utcDays = Math.floor(n - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
}

function parseDateInput(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return excelSerialToDate(value);
  const n = toNumber(value);
  if (String(value).trim() && String(value).trim() === String(n) && n > 30000) {
    return excelSerialToDate(n);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calculateInvestment(entry, today = new Date()) {
  const dataInicio = parseDateInput(entry.data || entry.dataInicio);
  const depreciacaoMeses = Math.max(1, toNumber(entry.depreciacaoMeses));
  const investimento = toNumber(entry.investimento || entry.investimentoTotal || entry.valorInvestido);

  if (!dataInicio) {
    return {
      ...entry,
      vencimento: null,
      diasRestantes: 0,
      valorMes: 0,
      ativo: false,
      erro: 'Data inválida',
    };
  }

  const vencimento = addMonths(dataInicio, depreciacaoMeses);
  const diasRestantes = diffDays(vencimento, today);
  const valorMes = diasRestantes >= 1 ? round2(investimento / depreciacaoMeses) : 0;

  return {
    ...entry,
    vencimento,
    diasRestantes,
    valorMes,
    ativo: diasRestantes >= 1,
  };
}

function calculateInvestmentsTotal(entries, today = new Date()) {
  const detalhado = (entries || []).map((e) => calculateInvestment(e, today));
  return {
    items: detalhado,
    totalMensal: sum(detalhado.map((i) => i.valorMes)),
    ativos: detalhado.filter((i) => i.ativo).length,
  };
}

function calculateMonthlyAverageCost(rows, periodMonths = 13) {
  const totals = Object.fromEntries(MONTHS.map((m) => [m, 0]));

  for (const row of rows || []) {
    for (const m of MONTHS) {
      totals[m] = round2(totals[m] + toNumber(row[m]));
    }
  }

  const media = Object.fromEntries(
    MONTHS.map((m) => [m, round2(totals[m] / Math.max(1, toNumber(periodMonths)))])
  );

  return { totals, media };
}

function calculateTransportTotal(rows) {
  const totals = Object.fromEntries(MONTHS.map((m) => [m, 0]));
  for (const row of rows || []) {
    for (const m of MONTHS) {
      totals[m] = round2(totals[m] + toNumber(row[m]));
    }
  }
  return totals;
}

function calculateMaintenanceAverage(rows, divisor = 13) {
  const totals = calculateTransportTotal(rows);
  const media = Object.fromEntries(
    MONTHS.map((m) => [m, round2(totals[m] / Math.max(1, toNumber(divisor)))])
  );
  return { totals, media };
}

function calculateOtherCostsAverage(rows, divisor = 13) {
  return calculateMaintenanceAverage(rows, divisor);
}

function calculateLaborCost(params) {
  const {
    salarioMensal,
    horasBaseMes = 220,
    inssPct = 0.1,
    fgtsPct = 0.08,
    feriasDivisor = 12,
    decimoDivisor = 12,
    horasExtra50 = 0,
    horasExtra100 = 0,
    extra50Multiplier = 1.5,
    extra100Multiplier = 2,
    adicionalExtraFixo1 = 0,
    adicionalExtraFixo2 = 0,
    porFora = 0,
    temInsalubridade = false,
    salarioMinimo = 1412,
    insalubridadePct = 0.2,
  } = params;

  const salMes = toNumber(salarioMensal);
  const salHora = round2(salMes / Math.max(1, toNumber(horasBaseMes)));

  const inss = round2(salMes * toNumber(inssPct));
  const fgts = round2(salMes * toNumber(fgtsPct));
  const ferias = round2(salMes / Math.max(1, toNumber(feriasDivisor)));
  const umTercoFerias = round2(ferias / 3);
  const decimoTerceiro = round2(salMes / Math.max(1, toNumber(decimoDivisor)));

  const totalBase = sum([salMes, inss, fgts, ferias, umTercoFerias, decimoTerceiro]);

  const valorHora50 = round2(
    (salHora * toNumber(extra50Multiplier)) +
    (salHora * toNumber(adicionalExtraFixo1)) +
    (salHora * toNumber(adicionalExtraFixo2))
  );
  const valorHora100 = round2(
    (salHora * toNumber(extra100Multiplier)) +
    (salHora * toNumber(adicionalExtraFixo1)) +
    (salHora * toNumber(adicionalExtraFixo2))
  );

  const totalExtra50 = round2(valorHora50 * toNumber(horasExtra50));
  const totalExtra100 = round2(valorHora100 * toNumber(horasExtra100));
  const totalExtra = sum([totalExtra50, totalExtra100]);

  const adicionalInsalubridade = temInsalubridade
    ? round2(toNumber(salarioMinimo) * toNumber(insalubridadePct))
    : 0;

  const totalGeral = sum([totalBase, totalExtra, toNumber(porFora), adicionalInsalubridade]);

  return {
    salHora,
    inss,
    fgts,
    ferias,
    umTercoFerias,
    decimoTerceiro,
    totalBase,
    totalExtra50,
    totalExtra100,
    totalExtra,
    adicionalInsalubridade,
    totalGeral,
  };
}

function calculateLaborSheet(rows, config = {}) {
  const detalhado = (rows || []).map((row) => ({
    ...row,
    calculo: calculateLaborCost({ ...config, ...row }),
  }));

  return {
    items: detalhado,
    totalFolha: sum(detalhado.map((r) => r.calculo.totalGeral)),
  };
}

function calculateLaborCostExcelStyle(params) {
  const {
    salarioMensal,
    horasBaseMes = 220,
    inssPct = 0.1,
    fgtsPct = 0.08,
    feriasDivisor = 12,
    decimoDivisor = 12,
    horasExtra50 = 0,
    horasExtra100 = 0,
    extra50Multiplier = 0.5,
    extra100Multiplier = 1,
    adicionalExtraFixo1 = 0,
    adicionalExtraFixo2 = 0,
    porFora = 0,
    insalubridadeAtiva = 0,
    salarioMinimo = 1412,
    insalubridadePct = 0.2,
  } = params;

  const d = round2(salarioMensal);
  const c = round2(d / Math.max(1, toNumber(horasBaseMes)));
  const e = round2(d * toNumber(inssPct));
  const f = round2(d * toNumber(fgtsPct));
  const g = round2(d / Math.max(1, toNumber(feriasDivisor)));
  const h = round2(g / 3);
  const i = round2(d / Math.max(1, toNumber(decimoDivisor)));
  const j = sum([d, e, f, g, h, i]);

  const m = round2(((c * toNumber(extra50Multiplier)) + (c * toNumber(adicionalExtraFixo1)) + (c * toNumber(adicionalExtraFixo2))) * toNumber(horasExtra50));
  const n = round2(((c * toNumber(extra100Multiplier)) + (c * toNumber(adicionalExtraFixo1)) + (c * toNumber(adicionalExtraFixo2))) * toNumber(horasExtra100));
  const o = sum([m, n]);

  const q = toNumber(insalubridadeAtiva) === 1 ? round2(toNumber(salarioMinimo) * toNumber(insalubridadePct)) : 0;
  const r = sum([j, o, toNumber(porFora), q]);

  return {
    salHora: c,
    salarioMensal: d,
    inss: e,
    fgts: f,
    ferias: g,
    umTercoFerias: h,
    decimoTerceiro: i,
    totalBase: j,
    totalExtra50: m,
    totalExtra100: n,
    totalExtra: o,
    insalubridade: q,
    totalGeral: r,
  };
}

module.exports = {
  MONTHS,
  toNumber,
  sum,
  monthKey,
  calculateTotal,
  calculateMonthlyLineCosts,
  normalizeMonthValues,
  calculateVariableCostsByMonth,
  excelSerialToDate,
  calculateInvestment,
  calculateInvestmentsTotal,
  calculateMonthlyAverageCost,
  calculateTransportTotal,
  calculateMaintenanceAverage,
  calculateOtherCostsAverage,
  calculateLaborCost,
  calculateLaborCostExcelStyle,
  calculateLaborSheet,
};
