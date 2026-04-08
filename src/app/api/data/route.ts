import { NextResponse } from 'next/server'
import { sheetCsvUrl, parseLeadsCsv, parseCostCsv } from '@/lib/data'

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
    const googleCosts = parseCostCsv(googleCsv, 'google')
    const metaCosts = parseCostCsv(metaCsv, 'meta')

    return NextResponse.json({ leads, googleCosts, metaCosts })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Falha ao carregar dados' }, { status: 500 })
  }
}