'use client'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { LeadRow, CostRow, formatBRL } from '@/lib/data'

interface Props { leads: LeadRow[]; costs: CostRow[] }
const FONT = "'DM Sans', sans-serif"
const NUM: React.CSSProperties = { fontFamily: FONT, fontWeight: 700 }

function CT({ active, payload, label, isBRL }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color, fontWeight:700, fontSize:13, marginTop:2, fontFamily:FONT }}>
          {p.name}: {isBRL ? formatBRL(p.value) : p.value?.toLocaleString('pt-BR')}
        </div>
      ))}
    </div>
  )
}

export default function GoogleTab({ leads, costs }: Props) {
  const totalLeads = leads.reduce((s,r) => s+r.leads, 0)
  const totalInvest = costs.reduce((s,r) => s+r.valorGasto, 0)
  const cpl = totalLeads>0 ? totalInvest/totalLeads : 0

  // Cost by campaign ID
  const costByCampId = costs.reduce((acc,r) => {
    acc[r.idCampanha] = (acc[r.idCampanha]||0) + r.valorGasto
    return acc
  }, {} as Record<string,number>)

  // Campaign name by ID from costs
  const campNameById = costs.reduce((acc,r) => {
    if (!acc[r.idCampanha]) acc[r.idCampanha] = r.nomeCampanha
    return acc
  }, {} as Record<string,string>)

  // By campaign (match by campanha ID)
  const byCampaign = Object.entries(
    leads.reduce((acc,r) => {
      const id = r.campanha||'sem-id'
      if (!acc[id]) acc[id] = 0
      acc[id] += r.leads
      return acc
    }, {} as Record<string,number>)
  ).map(([id, leadsVal]) => ({
    id, nome: campNameById[id]||id,
    leads: leadsVal,
    invest: costByCampId[id]||0,
    cpl: leadsVal>0&&(costByCampId[id]||0)>0 ? (costByCampId[id]||0)/leadsVal : 0,
    convRate: totalLeads>0 ? (leadsVal/totalLeads)*100 : 0,
  })).sort((a,b) => b.leads-a.leads).slice(0,15)
  const maxLeads = byCampaign[0]?.leads||1

  // By placement/keyword
  const byPlacement = Object.entries(
    leads.reduce((acc,r) => { const k=r.placement||r.keywordTerm||'Desconhecido'; acc[k]=(acc[k]||0)+r.leads; return acc }, {} as Record<string,number>)
  ).map(([kw,leads]) => ({kw,leads})).sort((a,b)=>b.leads-a.leads).slice(0,10)

  // By ad with cost matching via campaign
  const adLeadsMap = leads.reduce((acc,r) => {
    const a = r.anuncio||'Sem anúncio'
    if (!acc[a]) acc[a] = { leads:0, campIds: new Set<string>() }
    acc[a].leads += r.leads
    if (r.campanha) acc[a].campIds.add(r.campanha)
    return acc
  }, {} as Record<string,{leads:number, campIds:Set<string>}>)

  // All ads with invest and CPL
  const allAds = Object.entries(adLeadsMap).map(([ad,v]) => {
    const invest = Array.from(v.campIds).reduce((s,id) => s+(costByCampId[id]||0), 0)
    return { ad, leads: v.leads, invest, cpl: v.leads>0&&invest>0 ? invest/v.leads : 0 }
  }).sort((a,b) => b.leads-a.leads)

  const top5Ads = allAds.slice(0,5)

  // By day
  const byDay = Object.entries(
    leads.reduce((acc,r) => { acc[r.data]=(acc[r.data]||0)+r.leads; return acc }, {} as Record<string,number>)
  ).sort(([a],[b]) => a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
   .map(([date,leadsVal]) => {
     const dayCost = costs.filter(c=>c.dateObj.toLocaleDateString('pt-BR')===date).reduce((s,c)=>s+c.valorGasto,0)
     return { date:date.slice(0,5), leads:leadsVal, invest:dayCost, cpl:leadsVal>0&&dayCost>0?dayCost/leadsVal:0 }
   })

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid animate-fadeUp animate-delay-1">
        {[
          { label:'Leads Google', value:totalLeads.toLocaleString('pt-BR'), sub:'período selecionado', color:'google' },
          { label:'Investimento', value:formatBRL(totalInvest), sub:'Google Ads', color:'accent' },
          { label:'CPL Google', value:formatBRL(cpl), sub:'custo por lead', color:'orange' },
          { label:'Campanhas Ativas', value:byCampaign.length.toString(), sub:'com leads no período', color:'green' },
          { label:'Keywords', value:byPlacement.length.toString(), sub:'termos com leads', color:'accent' },
        ].map((k,i) => (
          <div key={i} className={`kpi-card ${k.color}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ ...NUM, fontSize: k.value.includes('R$')?22:28 }}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="section-label animate-fadeUp animate-delay-2">Evolução Diária</div>
      <div className="chart-card animate-fadeUp animate-delay-2" style={{ marginBottom:16 }}>
        <div className="chart-header"><div><div className="chart-title">Leads & Investimento Diário — Google</div><div className="chart-subtitle">Volume de leads e custo por dia</div></div></div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={byDay} margin={{top:5,right:10,left:0,bottom:5}}>
            <defs>
              <linearGradient id="gL2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2}/><stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/></linearGradient>
              <linearGradient id="gI2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
            <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:11,fontFamily:FONT}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="left" tick={{fill:'#7A90B0',fontSize:11,fontFamily:FONT}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="right" orientation="right" tick={{fill:'#7A90B0',fontSize:11,fontFamily:FONT}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
            <Tooltip content={<CT />}/>
            <Legend wrapperStyle={{fontSize:12,color:'#3D5070',fontFamily:FONT}}/>
            <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#22D3EE" strokeWidth={2} fill="url(#gL2)" dot={false}/>
            <Area yAxisId="right" type="monotone" dataKey="invest" name="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#gI2)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 Ads */}
      <div className="section-label animate-fadeUp animate-delay-3">Top Anúncios</div>
      <div className="table-card animate-fadeUp animate-delay-3" style={{ marginBottom:24 }}>
        <div className="table-header"><div className="table-title">Top 5 Anúncios — Google Ads</div></div>
        <table className="data-table">
          <thead><tr><th>#</th><th>Anúncio</th><th>Leads</th><th>Investimento</th><th>CPL</th></tr></thead>
          <tbody>
            {top5Ads.map((a,i) => (
              <tr key={a.ad}>
                <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                <td style={{color:'var(--text)',maxWidth:320,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:FONT}}>{a.ad||'—'}</td>
                <td style={{...NUM,color:'var(--google)'}}>{a.leads}</td>
                <td style={{color:'var(--text)',fontFamily:FONT}}>{a.invest>0?formatBRL(a.invest):<span style={{color:'var(--text3)'}}>—</span>}</td>
                <td style={{color:a.cpl>0?(a.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:FONT}}>{a.cpl>0?formatBRL(a.cpl):'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All Ads */}
      <div className="table-card animate-fadeUp animate-delay-3" style={{ marginBottom:24 }}>
        <div className="table-header">
          <div className="table-title">Todos os Anúncios — Google Ads</div>
          <div style={{fontSize:12,color:'var(--text3)',fontFamily:FONT}}>{allAds.length} anúncios</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Anúncio</th><th>Leads</th><th>Investimento</th><th>CPL</th><th>% Conv.</th></tr></thead>
            <tbody>
              {allAds.map((a,i) => (
                <tr key={a.ad}>
                  <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                  <td style={{color:'var(--text)',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:FONT}}>{a.ad||'—'}</td>
                  <td style={{...NUM,color:'var(--google)'}}>{a.leads}</td>
                  <td style={{color:'var(--text)',fontFamily:FONT}}>{a.invest>0?formatBRL(a.invest):<span style={{color:'var(--text3)'}}>—</span>}</td>
                  <td style={{color:a.cpl>0?(a.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:FONT}}>{a.cpl>0?formatBRL(a.cpl):'—'}</td>
                  <td style={{color:'var(--text2)',fontFamily:FONT}}>{totalLeads>0?((a.leads/totalLeads)*100).toFixed(1):0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keywords */}
      <div className="section-label animate-fadeUp animate-delay-3">Keywords</div>
      <div className="table-card animate-fadeUp animate-delay-3" style={{ marginBottom:24 }}>
        <div className="table-header"><div className="table-title">Top Keywords por Leads</div></div>
        <table className="data-table">
          <thead><tr><th>#</th><th>Keyword / Placement</th><th>Leads</th><th>% do Total Google</th><th style={{minWidth:140}}>Distribuição</th></tr></thead>
          <tbody>
            {byPlacement.map((kw,i) => (
              <tr key={kw.kw}>
                <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                <td style={{color:'var(--text)',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:FONT}}>{kw.kw}</td>
                <td style={{...NUM,color:'var(--google)'}}>{kw.leads}</td>
                <td style={{color:'var(--text2)',fontFamily:FONT}}>{totalLeads>0?((kw.leads/totalLeads)*100).toFixed(1):0}%</td>
                <td><div className="bar-inline-track"><div className="bar-inline-fill" style={{width:`${(kw.leads/(byPlacement[0]?.leads||1))*100}%`,background:'linear-gradient(90deg,#22D3EE,#67E8F9)'}}/></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Campaigns */}
      <div className="section-label animate-fadeUp animate-delay-4">Campanhas</div>
      <div className="table-card animate-fadeUp animate-delay-4">
        <div className="table-header">
          <div className="table-title">Performance por Campanha — Google</div>
          <div style={{fontSize:12,color:'var(--text3)',fontFamily:FONT}}>{byCampaign.length} campanhas</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Campanha</th><th>Leads</th><th>Investimento</th><th>CPL</th><th>Taxa Conv.</th><th style={{minWidth:120}}>Volume</th></tr></thead>
            <tbody>
              {byCampaign.map((c,i) => (
                <tr key={c.id}>
                  <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                  <td style={{color:'var(--text)',maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:FONT}} title={c.nome}>{c.nome}</td>
                  <td style={{...NUM,color:'var(--google)'}}>{c.leads}</td>
                  <td style={{color:'var(--text)',fontFamily:FONT}}>{c.invest>0?formatBRL(c.invest):<span style={{color:'var(--text3)'}}>—</span>}</td>
                  <td style={{color:c.cpl>0?(c.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:FONT}}>{c.cpl>0?formatBRL(c.cpl):'—'}</td>
                  <td style={{color:'var(--text2)',fontFamily:FONT}}>{c.convRate.toFixed(1)}%</td>
                  <td><div className="bar-inline-track"><div className="bar-inline-fill" style={{width:`${(c.leads/maxLeads)*100}%`,background:'linear-gradient(90deg,#22D3EE,#67E8F9)'}}/></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
