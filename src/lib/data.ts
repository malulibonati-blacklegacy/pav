export const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID!

export function sheetCsvUrl(sheetName: string) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
}

export interface LeadRow {
  data: string       // DD/MM/YYYY
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
  // DD/MM/YYYY
  const parts = str.trim().split('/')
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
  }
  // YYYY-MM-DD
  const d = new Date(str.trim())
  return isNaN(d.getTime()) ? new Date(0) : d
}

function parseBRL(val: string): number {
  if (!val) return 0
  // Remove R$, spaces, dots (thousand sep), replace comma with dot
  const clean = val.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim()
  return parseFloat(clean) || 0
}

export function parseLeadsCsv(text: string): LeadRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  // skip header
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
      campanha: cols[11] || '',
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

export function parseCostCsv(text: string, plataforma: 'google' | 'meta'): CostRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line)
    const data = cols[0] || ''
    return {
      data,
      nomeCampanha: cols[1] || '',
      idCampanha: cols[2] || '',
      valorGasto: parseBRL(cols[3] || '0'),
      plataforma,
      dateObj: parseDate(data),
    }
  }).filter(r => r.data && r.dateObj.getTime() > 0)
}

// Proper CSV line parser (handles quoted fields)
function parseCsvLine(line: string): string[] {
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

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR')
}

// Filter rows by date range
export function filterByDate<T extends { dateObj: Date }>(rows: T[], from: Date | null, to: Date | null): T[] {
  return rows.filter(r => {
    if (from && r.dateObj < from) return false
    if (to && r.dateObj > to) return false
    return true
  })
}
