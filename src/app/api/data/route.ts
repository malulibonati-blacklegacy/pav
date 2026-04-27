import { NextResponse } from 'next/server'
import { sheetCsvUrl, parseLeadsCsv, parseGoogleCostCsv, parseMetaCostCsv, parseCostCsv } from '@/lib/data'

export const revalidate = 0

async function fetchAllLeads(sheetName: string): Promise<string> {
  // Fetch in chunks using range parameter
  const baseUrl = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  
  // First fetch to get header + first batch
  const res1 = await fetch(`${baseUrl}&range=A1:S5001`, { cache: 'no-store' })
  const text1 = await res1.text()
  const lines1 = text1.split('\n').filter(l => l.trim())
  const header = lines1[0]
  
  // Second fetch (rows 5002-10001)
  const res2 = await fetch(`${baseUrl}&range=A5002:S10001`, { cache: 'no-store' })
  const text2 = await res2.text()
  const lines2 = text2.split('\n').filter(l => l.trim())
  
  // Third fetch (rows 10002-15001)
  const res3 = await fetch(`${baseUrl}&range=A10002:S15001`, { cache: 'no-store' })
  const text3 = await res3.text()
  const lines3 = text3.split('\n').filter(l => l.trim())

  // Combine: header + data from all chunks
  const allLines = [
    header,
    ...lines1.slice(1),
    ...lines2, // no header in range fetches
    ...lines3,
  ]
  
  return allLines.join('\n')
}

export async function GET() {
  try {
    const [leadsCsv, googleCsv, metaCsv] = await Promise.all([
      fetchAllLeads('Base_Looker'),
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