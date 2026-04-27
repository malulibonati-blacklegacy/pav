import { NextResponse } from 'next/server'
import { sheetCsvUrl, parseLeadsCsv, parseGoogleCostCsv, parseMetaCostCsv, parseCostCsv } from '@/lib/data'

export const revalidate = 0

export async function GET() {
  try {
    const [leadsRes, googleRes, metaRes] = await Promise.all([
      fetch(sheetCsvUrl('Base_Looker'), { cache: 'no-store' }),
      fetch(sheetCsvUrl('Custo_Campanha-Googleads'), { cache: 'no-store' }),
      fetch(sheetCsvUrl('Custo_Campanha-Metaads'), { cache: 'no-store' }),
    ])

    const [leadsCsv, googleCsv, metaCsv] = await Promise.all([
      leadsRes.text(),
      googleRes.text(),
      metaRes.text(),
    ])

    const leads = parseLeadsCsv(leadsCsv)
    const googleCosts = parseGoogleCostCsv(googleCsv)
    const metaCosts = parseMetaCostCsv(metaCsv)

    // Legacy simplified for Overview
    const googleCostsSimple = parseCostCsv(googleCsv, 'google')
    const metaCostsSimple = parseCostCsv(metaCsv, 'meta')

    return NextResponse.json({ leads, googleCosts, metaCosts, googleCostsSimple, metaCostsSimple })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Falha ao carregar dados' }, { status: 500 })
  }
}
