import { NextResponse } from 'next/server'
import { sheetCsvUrl, parseLeadsCsv, parseCostCsv } from '@/lib/data'

export const revalidate = 900 // 15 min cache

export async function GET() {
  try {
    const [leadsRes, googleRes, metaRes] = await Promise.all([
      fetch(sheetCsvUrl('Base Looker'), { next: { revalidate: 900 } }),
      fetch(sheetCsvUrl('Custo_Campanha-Googleads'), { next: { revalidate: 900 } }),
      fetch(sheetCsvUrl('Custo_Campanha-Metaads'), { next: { revalidate: 900 } }),
    ])

    const [leadsCsv, googleCsv, metaCsv] = await Promise.all([
      leadsRes.text(),
      googleRes.text(),
      metaRes.text(),
    ])

    const leads = parseLeadsCsv(leadsCsv)
    const googleCosts = parseCostCsv(googleCsv, 'google')
    const metaCosts = parseCostCsv(metaCsv, 'meta')

    return NextResponse.json({ leads, googleCosts, metaCosts })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Falha ao carregar dados' }, { status: 500 })
  }
}
