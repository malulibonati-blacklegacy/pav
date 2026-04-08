'use client'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { LeadRow, CostRow, formatBRL } from '@/lib/data'

interface Props { leads: LeadRow[]; costs: CostRow[] }
const FONT = "'DM Sans', sans-serif"
const NUM: React.CSSProperties = { fontFamily: FONT, fontWeight: 700 }
const PIE_COLORS = ['#A78BFA','#C4B5FD','#7C3AED','#6D28D9','#DDD6FE','#8B5CF6','#F0ABFC']

function CT({ active, payload, label, isBRL }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{color:p.color,fontWeight:700,fontSize:13,marginTop:2,fontFamily:FONT}}>
          {p.name}: {isBRL?formatBRL(p.value):p.value?.toLocaleString('pt-BR')}
        </div>
      ))}
    </div>
  )
}

export default function MetaTab({ leads, costs }: Props) {
  const totalLeads = leads.reduce((s,r) => s+r.leads, 0)
  const totalInvest = costs.reduce((s,r) => s+r.valorGasto, 0)
  const cpl = totalLeads>0 ? totalInvest/totalLeads : 0

  // Cost by campaign ID
  const costByCampId = costs.reduce((acc,r) => {
    acc[r.idCampanha] = (acc[r.idCampanha]||0) + r.valorGasto
    return acc
  }, {} as Record<string,number>)

  const campNameById = costs.reduce((acc,r) => {
    if (!acc[r.idCampanha]) acc[r.idCampanha] = r.nomeCampanha
    return acc
  }, {} as Record<string,string>)

  // By campaign matched by ID
  const byCampaign = Object.entries(
    leads.reduce((acc,r) => {
      const id = r.campanha||'sem-id'
      acc[id] = (acc[id]||0) + r.leads
      return acc
    }, {} as Record<string,number>)
  ).map(([id,leadsVal]) => ({
    id, nome: campNameById[id]||id,
    leads: leadsVal,
    invest: costByCampId[id]||0,
    cpl: leadsVal>0&&(costByCampId[id]||0)>0 ? (costByCampId[id]||0)/leadsVal : 0,
    convRate: totalLeads>0 ? (leadsVal/totalLeads)*100 : 0,
  })).sort((a,b) => b.leads-a.leads).slice(0,15)
  const maxLeads = byCampaign[0]?.leads||1

  // By placement
  const byPlacement = Object.entries(
    leads.reduce((acc,r) => { const k=r.placement||'Desconhecido'; acc[k]=(acc[k]||0)+r.leads; return acc }, {} as Record<string,number>)
  ).map(([placement,leads]) => ({placement,leads})).sort((a,b)=>b.leads-a.leads)

  // By course
  const byCourse = Object.entries(
    leads.reduce((acc,r) => { const c=r.tituloLP||r.curso||'Desconhecido'; acc[c]=(acc[c]||0)+r.leads; return acc }, {} as Record<string,number>)
  ).map(([curso,leads]) => ({curso,leads})).sort((a,b)=>b.leads-a.leads).slice(0,10)

  // By day
  const byDay = Object.entries(
    leads.reduce((acc,r) => { acc[r.data]=(acc[r.data]||0)+r.leads; return acc }, {} as Record<string,number>)
  ).sort(([a],[b]) => a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
   .map(([date,leadsVal]) => {
     const dayCost = costs.filter(c=>c.dateObj.toLocaleDateString('pt-BR')===date).reduce((s,c)=>s+c.valorGasto,0)
     return { date:date.slice(0,5), leads:leadsVal, invest:dayCost, cpl:leadsVal>0&&dayCost>0?dayCost/leadsVal:0 }
   })

  // Ads with cost matching
  const adMap = leads.reduce((acc,r) => {
    const a = r.anuncio||'Sem anúncio'
    if (!acc[a]) acc[a] = { leads:0, campIds:new Set<string>() }
    acc[a].leads += r.leads
    if (r.campanha) acc[a].campIds.add(r.campanha)
    return acc
  }, {} as Record<string,{leads:number,campIds:Set<string>}>)

  const allAds = Object.entries(adMap).map(([ad,v]) => {
    const invest = Array.from(v.campIds).reduce((s,id) => s+(costByCampId[id]||0), 0)
    return { ad, leads:v.leads, invest, cpl:v.leads>0&&invest>0?invest/v.leads:0 }
  }).sort((a,b) => b.leads-a.leads)

  const top5Ads = allAds.slice(0,5)

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid animate-fadeUp animate-delay-1">
        {[
          { label:'Leads Meta', value:totalLeads.toLocaleString('pt-BR'), sub:'período selecionado', color:'meta' },
          { label:'Investimento', value:formatBRL(totalInvest), sub:'Meta Ads', color:'accent' },
          { label:'CPL Meta', value:formatBRL(cpl), sub:'custo por lead', color:'orange' },
          { label:'Campanhas Ativas', value:byCampaign.length.toString(), sub:'com leads no período', color:'green' },
          { label:'Placements', value:byPlacement.length.toString(), sub:'posicionamentos', color:'meta' },
        ].map((k,i) => (
          <div key={i} className={`kpi-card ${k.color}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{...NUM, fontSize:k.value.includes('R$')?22:28}}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="section-label animate-fadeUp animate-delay-2">Evolução Diária</div>
      <div className="chart-card animate-fadeUp animate-delay-2" style={{marginBottom:16}}>
        <div className="chart-header"><div><div className="chart-title">Leads & Investimento Diário — Meta</div><div className="chart-subtitle">Volume de leads e custo por dia</div></div></div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={byDay} margin={{top:5,right:10,left:0,bottom:5}}>
            <defs>
              <linearGradient id="mL2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2}/><stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/></linearGradient>
              <linearGradient id="mI2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
            <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:11,fontFamily:FONT}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="left" tick={{fill:'#7A90B0',fontSize:11,fontFamily:FONT}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="right" orientation="right" tick={{fill:'#7A90B0',fontSize:11,fontFamily:FONT}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
            <Tooltip content={<CT />}/>
            <Legend wrapperStyle={{fontSize:12,color:'#3D5070',fontFamily:FONT}}/>
            <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#A78BFA" strokeWidth={2} fill="url(#mL2)" dot={false}/>
            <Area yAxisId="right" type="monotone" dataKey="invest" name="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#mI2)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Placement + Course */}
      <div className="chart-grid col2 animate-fadeUp animate-delay-3">
        <div className="chart-card">
          <div className="chart-header"><div><div className="chart-title">Leads por Placement</div><div className="chart-subtitle">Feed, Stories, Reels etc.</div></div></div>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <ResponsiveContainer width={160} height={180}>
              <PieChart>
                <Pie data={byPlacement.slice(0,6)} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="leads" paddingAngle={3}>
                  {byPlacement.slice(0,6).map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#fff',border:'1px solid #D1DCE8',borderRadius:8,fontSize:12,fontFamily:FONT}}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {byPlacement.slice(0,6).map((p,i) => (
                <div key={p.placement} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/>
                  <div style={{flex:1,fontSize:11,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:FONT}}>{p.placement}</div>
                  <div style={{fontSize:13,...NUM,color:'var(--text)'}}>{p.leads}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header"><div><div className="chart-title">Top Cursos — Meta</div><div className="chart-subtitle">Volume de leads por curso</div></div></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCourse} layout="vertical" margin={{top:5,right:20,left:0,bottom:5}} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" horizontal={false}/>
              <XAxis type="number" tick={{fill:'#7A90B0',fontSize:10,fontFamily:FONT}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="curso" tick={{fill:'#7A90B0',fontSize:10,fontFamily:FONT}} axisLine={false} tickLine={false} width={150} tickFormatter={v=>v.length>22?v.slice(0,22)+'…':v}/>
              <Tooltip content={<CT />}/>
              <Bar dataKey="leads" name="Leads" fill="#A78BFA" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Ads */}
      <div className="section-label animate-fadeUp animate-delay-3">Top Anúncios</div>
      <div className="table-card animate-fadeUp animate-delay-3" style={{marginBottom:24}}>
        <div className="table-header"><div className="table-title">Top 5 Anúncios — Meta Ads</div></div>
        <table className="data-table">
          <thead><tr><th>#</th><th>Anúncio</th><th>Leads</th><th>Investimento</th><th>CPL</th></tr></thead>
          <tbody>
            {top5Ads.map((a,i) => (
              <tr key={a.ad}>
                <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                <td style={{color:'var(--text)',maxWidth:320,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:FONT}}>{a.ad||'—'}</td>
                <td style={{...NUM,color:'var(--meta)'}}>{a.leads}</td>
                <td style={{color:'var(--text)',fontFamily:FONT}}>{a.invest>0?formatBRL(a.invest):<span style={{color:'var(--text3)'}}>—</span>}</td>
                <td style={{color:a.cpl>0?(a.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:FONT}}>{a.cpl>0?formatBRL(a.cpl):'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All Ads */}
      <div className="table-card animate-fadeUp animate-delay-3" style={{marginBottom:24}}>
        <div className="table-header">
          <div className="table-title">Todos os Anúncios — Meta Ads</div>
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
                  <td style={{...NUM,color:'var(--meta)'}}>{a.leads}</td>
                  <td style={{color:'var(--text)',fontFamily:FONT}}>{a.invest>0?formatBRL(a.invest):<span style={{color:'var(--text3)'}}>—</span>}</td>
                  <td style={{color:a.cpl>0?(a.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:FONT}}>{a.cpl>0?formatBRL(a.cpl):'—'}</td>
                  <td style={{color:'var(--text2)',fontFamily:FONT}}>{totalLeads>0?((a.leads/totalLeads)*100).toFixed(1):0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaigns */}
      <div className="section-label animate-fadeUp animate-delay-4">Campanhas</div>
      <div className="table-card animate-fadeUp animate-delay-4">
        <div className="table-header">
          <div className="table-title">Performance por Campanha — Meta</div>
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
                  <td style={{...NUM,color:'var(--meta)'}}>{c.leads}</td>
                  <td style={{color:'var(--text)',fontFamily:FONT}}>{c.invest>0?formatBRL(c.invest):<span style={{color:'var(--text3)'}}>—</span>}</td>
                  <td style={{color:c.cpl>0?(c.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:FONT}}>{c.cpl>0?formatBRL(c.cpl):'—'}</td>
                  <td style={{color:'var(--text2)',fontFamily:FONT}}>{c.convRate.toFixed(1)}%</td>
                  <td><div className="bar-inline-track"><div className="bar-inline-fill" style={{width:`${(c.leads/maxLeads)*100}%`,background:'linear-gradient(90deg,#A78BFA,#C4B5FD)'}}/></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
