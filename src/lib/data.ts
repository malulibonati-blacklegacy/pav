export const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID!

export function sheetCsvUrl(sheetName: string) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
}

export interface LeadRow {
  data: string
  hora: string
  ano: number
  mesNum: number
  mesAno: string
  semanaAno: string
  diaSemanaNum: number
  diaSemana: string
  hora_num: number
  plataforma: string
  placement: string
  campanha: string
  anuncio: string
  keywordTerm: string
  curso: string
  fonte: string
  tituloLP: string
  leads: number
  url: string
  dateObj: Date
}

export interface GoogleCostRow {
  data: string
  nomeCampanha: string
  idCampanha: string
  status: string           // ENABLED, PAUSED, REMOVED
  tipoCampanha: string     // SEARCH, DEMAND_GEN, etc
  valorGasto: number
  impressoes: number
  cliques: number
  ctr: number              // decimal ex: 0.09 = 9%
  cpcMedio: number
  cpmMedio: number
  plataforma: 'google'
  dateObj: Date
}

export interface MetaCostRow {
  data: string
  nomeCampanha: string
  idCampanha: string
  valorGasto: number
  alcance: number
  impressoes: number
  cliquesLink: number
  ctr: number              // decimal
  cpm: number
  cpc: number
  plataforma: 'meta'
  dateObj: Date
}

// Legacy unified type for backward compat in Overview
export interface CostRow {
  data: string
  nomeCampanha: string
  idCampanha: string
  valorGasto: number
  plataforma: 'google' | 'meta'
  dateObj: Date
}

function parseDate(str: string): Date {
  if (!str) return new Date(0)
  const s = str.trim().split(' ')[0]
  const parts = s.split('/')
  if (parts.length === 3 && parts[2].length === 4) {
    // DD/MM/YYYY — força meio-dia para evitar bug de timezone
    return new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}T12:00:00`)
  }
  const parts2 = s.split('-')
  if (parts2.length === 3 && parts2[0].length === 4) {
    return new Date(`${parts2[0]}-${parts2[1]}-${parts2[2]}T12:00:00`)
  }
  return new Date(0)
}

export function parseBRL(val: string): number {
  if (!val) return 0
  const clean = val.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim()
  return parseFloat(clean) || 0
}

function parseNum(val: string): number {
  if (!val) return 0
  const clean = val.replace(/\./g, '').replace(',', '.').trim()
  return parseFloat(clean) || 0
}

export function parseLeadsCsv(text: string): LeadRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line)
    const data = cols[0] || ''
    return {
      data,
      hora: cols[1] || '',
      ano: Number(cols[2]) || 0,
      mesNum: Number(cols[3]) || 0,
      mesAno: cols[4] || '',
      semanaAno: cols[5] || '',
      diaSemanaNum: Number(cols[6]) || 0,
      diaSemana: cols[7] || '',
      hora_num: Number(cols[8]) || 0,
      plataforma: cols[9] || '',
      placement: cols[10] || '',
      campanha: (cols[11] || '').trim().replace(/\.0$/, ''),
      anuncio: cols[12] || '',
      keywordTerm: cols[13] || '',
      curso: cols[14] || '',
      fonte: cols[15] || '',
      tituloLP: cols[16] || '',
      leads: Number(cols[17]) || 1,
      url: cols[18] || '',
      dateObj: parseDate(data),
    }
  }).filter(r => r.data && r.dateObj.getTime() > 0)
}

export function parseGoogleCostCsv(text: string): GoogleCostRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line)
    const data = cols[0] || ''
    return {
      data,
      nomeCampanha: cols[1] || '',
      idCampanha: (cols[2] || '').trim().replace(/\.0$/, ''),
      status: cols[3] || '',
      tipoCampanha: cols[4] || '',
      valorGasto: parseBRL(cols[5] || '0'),
      impressoes: parseNum(cols[6] || '0'),
      cliques: parseNum(cols[7] || '0'),
      ctr: parseNum(cols[8] || '0'),
      cpcMedio: parseBRL(cols[9] || '0'),
      cpmMedio: parseBRL(cols[10] || '0'),
      plataforma: 'google' as const,
      dateObj: parseDate(data),
    }
  }).filter(r => r.data && r.dateObj.getTime() > 0)
}

export function parseMetaCostCsv(text: string): MetaCostRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line)
    const data = cols[0] || ''
    return {
      data,
      nomeCampanha: cols[1] || '',
      idCampanha: (cols[2] || '').trim().replace(/\.0$/, ''),
      valorGasto: parseBRL(cols[3] || '0'),
      alcance: parseNum(cols[4] || '0'),
      impressoes: parseNum(cols[5] || '0'),
      cliquesLink: parseNum(cols[6] || '0'),
      ctr: parseNum(cols[7] || '0'),
      cpm: parseBRL(cols[8] || '0'),
      cpc: parseBRL(cols[9] || '0'),
      plataforma: 'meta' as const,
      dateObj: parseDate(data),
    }
  }).filter(r => r.data && r.dateObj.getTime() > 0)
}

// Legacy parseCostCsv for Overview (simplified)
export function parseCostCsv(text: string, plataforma: 'google' | 'meta'): CostRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const costColIndex = plataforma === 'google' ? 5 : 3
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line)
    const data = cols[0] || ''
    return {
      data,
      nomeCampanha: cols[1] || '',
      idCampanha: (cols[2] || '').trim().replace(/\.0$/, ''),
      valorGasto: parseBRL(cols[costColIndex] || '0'),
      plataforma,
      dateObj: parseDate(data),
    }
  }).filter(r => r.data && r.dateObj.getTime() > 0)
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function formatBRL(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatNum(val: number): string {
  return val.toLocaleString('pt-BR')
}

export function formatPct(val: number): string {
  return `${(val * 100).toFixed(2)}%`
}

export function formatK(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
  return val.toLocaleString('pt-BR')
}
