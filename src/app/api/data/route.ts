import { NextResponse } from 'next/server'
import { sheetCsvUrl, parseLeadsCsv, parseGoogleCostCsv, parseMetaCostCsv, parseCostCsv } from '@/lib/data'

export const revalidate = 0

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID!

async function fetchAllLeads(): Promise<string> {
  const chunks: string[] = []
  let header = ''
  
  const ranges = [
    'A1:S5000',
    'A5001:S10000', 
    'A10001:S15000',
    'A15001:S20000',
  ]
  
  for (let i = 0; i < ranges.length; i++) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=Base_Looker&range=${ranges[i]}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) break
    const text = await res.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length <= 1) break
    
    if (i === 0) {
      header = lines[0]
      chunks.push(...lines.slice(1))
    } else {
      // Skip header row in subsequent chunks
      chunks.push(...lines.slice(1))
    }
  }
  
  return [header, ...chunks].join('\n')
}

export async function GET() {
  try {
    const [leadsCsv, googleCsv, metaCsv] = await Promise.all([
      fetchAllLeads(),
      fetch(sheetCsvUrl('Custo_Campanha-Googleads'), { cache: 'no-store' }).then(r => r.text()),
      fetch(sheetCsvUrl('Custo_Campanha-Metaads'), { cache: 'no-store' }).then(r => r.text()),
    ])

    const leads = parseLeadsCsv(leadsCsv)
    const googleCosts = parseGoogleCostCsv(googleCsv)
    const metaCosts = parseMetaCostCsv(metaCsv)
    const googleCostsSimple = parseCostCsv(googleCsv, 'google')
    const metaCostsSimple = parseCostCsv(metaCsv, 'meta')

    return NextResponse.json({ leads, googleCosts, metaCosts, googleCostsSimple, metaCostsSimple })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Falha ao carregar dados' }, { status: 500 })
  }
}