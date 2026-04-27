'use client'
import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { LeadRow, GoogleCostRow, formatBRL, formatNum, formatPct, formatK } from '@/lib/data'

interface Props { leads: LeadRow[]; costs: GoogleCostRow[] }
const F = "'DM Sans', sans-serif"
const N: React.CSSProperties = { fontFamily: F, fontWeight: 700 }

function CT({ active, payload, label, fmt }: any) {
  if (!active||!payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{color:p.color,fontWeight:700,fontSize:12,marginTop:2,fontFamily:F}}>
          {p.name}: {fmt?.(p.name, p.value) ?? p.value?.toLocaleString('pt-BR')}
        </div>
      ))}
    </div>
  )
}

function statusColor(s: string) {
  if (!s) return '#7A90B0'
  const u = s.toUpperCase()
  if (u === 'ENABLED') return '#34D399'
  if (u === 'PAUSED') return '#FB923C'
  return '#F87171'
}
function statusLabel(s: string) {
  if (!s) return '—'
  const u = s.toUpperCase()
  if (u === 'ENABLED') return 'Ativa'
  if (u === 'PAUSED') return 'Pausada'
  if (u === 'REMOVED') return 'Removida'
  return s
}
function tipoCampanha(s: string) {
  if (!s) return '—'
  const map: Record<string,string> = { SEARCH:'Search', DEMAND_GEN:'Demand Gen', DISPLAY:'Display', VIDEO:'Vídeo', SHOPPING:'Shopping', PERFORMANCE_MAX:'PMax', SMART:'Smart' }
  return map[s.toUpperCase()] || s
}

export default function GoogleTab({ leads, costs }: Props) {
  const totalLeads = leads.reduce((s,r)=>s+r.leads,0)
  const totalInvest = costs.reduce((s,r)=>s+r.valorGasto,0)
  const totalImp = costs.reduce((s,r)=>s+r.impressoes,0)
  const totalCliques = costs.reduce((s,r)=>s+r.cliques,0)
  const avgCTR = totalImp > 0 ? totalCliques / totalImp : 0
  const avgCPC = totalCliques > 0 ? totalInvest / totalCliques : 0
  const cpl = totalLeads > 0 ? totalInvest / totalLeads : 0

  // Campaigns list with aggregated stats
  const campMap = costs.reduce((acc,r) => {
    const id = r.idCampanha
    if (!acc[id]) acc[id] = { id, nome:r.nomeCampanha, status:r.status, tipo:r.tipoCampanha, invest:0, imp:0, cliques:0, leads:0 }
    acc[id].invest += r.valorGasto
    acc[id].imp += r.impressoes
    acc[id].cliques += r.cliques
    if (r.status) acc[id].status = r.status // take latest status
    return acc
  }, {} as Record<string,{id:string,nome:string,status:string,tipo:string,invest:number,imp:number,cliques:number,leads:number}>)

  leads.filter(r=>r.campanha).forEach(r => {
    if (campMap[r.campanha]) campMap[r.campanha].leads += r.leads
  })

  const campaigns = Object.values(campMap).sort((a,b)=>b.leads-a.leads)

  // Campaign dropdown
  const [selId, setSelId] = useState(campaigns[0]?.id || '')
  const selCamp = campaigns.find(c=>c.id===selId) || campaigns[0]

  // By day for selected campaign
  const campCosts = costs.filter(r=>r.idCampanha===selId)
  const campLeads = leads.filter(r=>r.campanha===selId)

  const campByDay = (() => {
    const dayMap: Record<string,{invest:number,imp:number,cliques:number,leads:number,ctr:number,cpc:number}> = {}
    campCosts.forEach(r => {
      const k = r.dateObj.toLocaleDateString('pt-BR')
      if (!dayMap[k]) dayMap[k] = {invest:0,imp:0,cliques:0,leads:0,ctr:0,cpc:0}
      dayMap[k].invest += r.valorGasto
      dayMap[k].imp += r.impressoes
      dayMap[k].cliques += r.cliques
    })
    campLeads.forEach(r => {
      if (dayMap[r.data]) dayMap[r.data].leads += r.leads
    })
    return Object.entries(dayMap).sort(([a],[b])=>a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
      .map(([date,v]) => ({
        date: date.slice(0,5),
        Investimento: v.invest,
        Leads: v.leads,
        Cliques: v.cliques,
        Impressões: v.imp,
        CTR: v.imp > 0 ? (v.cliques/v.imp)*100 : 0,
        CPL: v.leads > 0 && v.invest > 0 ? v.invest/v.leads : 0,
        CPC: v.cliques > 0 ? v.invest/v.cliques : 0,
      }))
  })()

  // Overall by day
  const byDay = (() => {
    const dayMap: Record<string,{invest:number,imp:number,cliques:number,leads:number}> = {}
    costs.forEach(r => {
      const k = r.dateObj.toLocaleDateString('pt-BR')
      if (!dayMap[k]) dayMap[k] = {invest:0,imp:0,cliques:0,leads:0}
      dayMap[k].invest += r.valorGasto
      dayMap[k].imp += r.impressoes
      dayMap[k].cliques += r.cliques
    })
    leads.forEach(r => {
      if (dayMap[r.data]) dayMap[r.data].leads += r.leads
    })
    return Object.entries(dayMap).sort(([a],[b])=>a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
      .map(([date,v]) => ({
        date: date.slice(0,5),
        Investimento: v.invest,
        Leads: v.leads,
        Cliques: v.cliques,
        CPL: v.leads>0&&v.invest>0 ? v.invest/v.leads : 0,
        CTR: v.imp>0 ? (v.cliques/v.imp)*100 : 0,
      }))
  })()

  // Ads
  const adMap = leads.reduce((acc,r) => {
    const a = r.anuncio||'Sem anúncio'
    if (!acc[a]) acc[a] = {leads:0, campIds:new Set<string>()}
    acc[a].leads += r.leads; if(r.campanha) acc[a].campIds.add(r.campanha)
    return acc
  }, {} as Record<string,{leads:number,campIds:Set<string>}>)
  const campCostById = costs.reduce((acc,r)=>{ acc[r.idCampanha]=(acc[r.idCampanha]||0)+r.valorGasto; return acc },{} as Record<string,number>)
  const allAds = Object.entries(adMap).map(([ad,v])=>{
    const invest = Array.from(v.campIds).reduce((s,id)=>s+(campCostById[id]||0),0)
    return {ad, leads:v.leads, invest, cpl:v.leads>0&&invest>0?invest/v.leads:0}
  }).sort((a,b)=>b.leads-a.leads)

  const fmtVal = (name: string, val: number) => {
    if (name==='Investimento'||name==='CPL'||name==='CPC') return formatBRL(val)
    if (name==='CTR') return `${val.toFixed(2)}%`
    if (name==='Impressões') return formatK(val)
    return val.toLocaleString('pt-BR')
  }

  const kpis = [
    {label:'Leads',value:formatNum(totalLeads),sub:'período selecionado',color:'google'},
    {label:'Investimento',value:formatBRL(totalInvest),sub:'Google Ads',color:'accent'},
    {label:'CPL',value:formatBRL(cpl),sub:'custo por lead',color:'orange'},
    {label:'Impressões',value:formatK(totalImp),sub:'total de impressões',color:'green'},
    {label:'Cliques',value:formatK(totalCliques),sub:'cliques totais',color:'google'},
    {label:'CTR Médio',value:formatPct(avgCTR),sub:'taxa de cliques',color:'accent'},
    {label:'CPC Médio',value:formatBRL(avgCPC),sub:'custo por clique',color:'orange'},
  ]

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid animate-fadeUp animate-delay-1" style={{gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
        {kpis.map((k,i)=>(
          <div key={i} className={`kpi-card ${k.color}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{...N,fontSize:k.value.includes('R$')?20:k.value.length>6?20:26}}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Leads + Invest + Cliques por dia */}
      <div className="section-label animate-fadeUp animate-delay-2">Evolução Diária</div>
      <div className="chart-card animate-fadeUp animate-delay-2" style={{marginBottom:16}}>
        <div className="chart-header"><div><div className="chart-title">Leads & Investimento por Dia</div><div className="chart-subtitle">Visão consolidada do período</div></div></div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={byDay} margin={{top:5,right:10,left:0,bottom:5}}>
            <defs>
              <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2}/><stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/></linearGradient>
              <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.15}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
            <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="left" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="right" orientation="right" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<CT fmt={fmtVal}/>}/>
            <Legend wrapperStyle={{fontSize:12,color:'#3D5070',fontFamily:F}}/>
            <Area yAxisId="left" type="monotone" dataKey="Leads" stroke="#22D3EE" strokeWidth={2} fill="url(#gL)" dot={false}/>
            <Area yAxisId="right" type="monotone" dataKey="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#gI)" dot={false}/>
            <Line yAxisId="left" type="monotone" dataKey="Cliques" stroke="#A78BFA" strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* CPL + CTR por dia */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div className="chart-card animate-fadeUp animate-delay-2">
          <div className="chart-header"><div><div className="chart-title">CPL por Dia</div><div className="chart-subtitle">Custo por lead diário</div></div></div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={byDay.filter(d=>d.CPL>0)} margin={{top:5,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
              <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v.toFixed(0)}`}/>
              <Tooltip content={<CT fmt={fmtVal}/>}/>
              <Line type="monotone" dataKey="CPL" stroke="#FB923C" strokeWidth={2.5} dot={{fill:'#FB923C',r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card animate-fadeUp animate-delay-2">
          <div className="chart-header"><div><div className="chart-title">CTR por Dia</div><div className="chart-subtitle">Taxa de cliques diária (%)</div></div></div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={byDay.filter(d=>d.CTR>0)} margin={{top:5,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
              <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`${v.toFixed(1)}%`}/>
              <Tooltip content={<CT fmt={fmtVal}/>}/>
              <Line type="monotone" dataKey="CTR" stroke="#0EA5E9" strokeWidth={2.5} dot={{fill:'#0EA5E9',r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="section-label animate-fadeUp animate-delay-3">Campanhas</div>
      <div className="table-card animate-fadeUp animate-delay-3" style={{marginBottom:24}}>
        <div className="table-header">
          <div className="table-title">Performance por Campanha</div>
          <div style={{fontSize:12,color:'var(--text3)',fontFamily:F}}>{campaigns.length} campanhas</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Campanha</th><th>Tipo</th><th>Leads</th><th>Investimento</th><th>CPL</th><th>Impressões</th><th>Cliques</th><th>CTR</th><th>CPC Médio</th></tr></thead>
            <tbody>
              {campaigns.map((c,i)=>{
                const campCPL = c.leads>0&&c.invest>0?c.invest/c.leads:0
                const campCTR = c.imp>0?c.cliques/c.imp:0
                const campCPC = c.cliques>0?c.invest/c.cliques:0
                return (
                  <tr key={c.id}>
                    <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:statusColor(c.status),flexShrink:0,boxShadow:`0 0 6px ${statusColor(c.status)}66`}}/>
                        <div>
                          <div style={{color:'var(--text)',fontFamily:F,fontSize:13,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome}</div>
                          <div style={{color:'var(--text3)',fontFamily:F,fontSize:10,marginTop:1}}>{c.id} · {statusLabel(c.status)}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{background:'rgba(14,165,233,0.08)',color:'var(--accent)',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:4,fontFamily:F}}>{tipoCampanha(c.tipo)}</span></td>
                    <td style={{...N,color:'var(--google)'}}>{c.leads}</td>
                    <td style={{color:'var(--text)',fontFamily:F}}>{c.invest>0?formatBRL(c.invest):'—'}</td>
                    <td style={{color:campCPL>0?(campCPL<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:F}}>{campCPL>0?formatBRL(campCPL):'—'}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{formatK(c.imp)}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{formatK(c.cliques)}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{formatPct(campCTR)}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{campCPC>0?formatBRL(campCPC):'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ads table */}
      <div className="section-label animate-fadeUp animate-delay-3">Anúncios</div>
      <div className="table-card animate-fadeUp animate-delay-3" style={{marginBottom:24}}>
        <div className="table-header">
          <div className="table-title">Performance por Anúncio</div>
          <div style={{fontSize:12,color:'var(--text3)',fontFamily:F}}>{allAds.length} anúncios</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Anúncio</th><th>Leads</th><th>Investimento</th><th>CPL</th><th>% Conv.</th></tr></thead>
            <tbody>
              {allAds.map((a,i)=>(
                <tr key={a.ad}>
                  <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                  <td style={{color:'var(--text)',maxWidth:340,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:F}}>{a.ad||'—'}</td>
                  <td style={{...N,color:'var(--google)'}}>{a.leads}</td>
                  <td style={{color:'var(--text)',fontFamily:F}}>{a.invest>0?formatBRL(a.invest):'—'}</td>
                  <td style={{color:a.cpl>0?(a.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:F}}>{a.cpl>0?formatBRL(a.cpl):'—'}</td>
                  <td style={{color:'var(--text2)',fontFamily:F}}>{totalLeads>0?((a.leads/totalLeads)*100).toFixed(1):0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign deep dive with dropdown */}
      <div className="section-label animate-fadeUp animate-delay-4">Análise por Campanha</div>
      <div className="chart-card animate-fadeUp animate-delay-4" style={{marginBottom:24}}>
        <div className="chart-header">
          <div><div className="chart-title">Investimento × Leads × Cliques × CTR por Campanha</div><div className="chart-subtitle">Selecione a campanha para análise detalhada do período</div></div>
        </div>

        {/* Dropdown */}
        <div style={{marginBottom:20}}>
          <select value={selId} onChange={e=>setSelId(e.target.value)}
            style={{background:'#F0F4F8',border:'1px solid #D1DCE8',borderRadius:10,padding:'10px 16px',fontSize:13,color:'var(--text)',fontFamily:F,cursor:'pointer',outline:'none',width:'100%',maxWidth:600}}>
            {campaigns.map(c=>(
              <option key={c.id} value={c.id}>
                {statusLabel(c.status) === 'Ativa' ? '🟢' : statusLabel(c.status) === 'Pausada' ? '🟠' : '🔴'} {c.nome} — {c.id}
              </option>
            ))}
          </select>
        </div>

        {/* Selected campaign KPIs */}
        {selCamp && (
          <>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:statusColor(selCamp.status),boxShadow:`0 0 8px ${statusColor(selCamp.status)}88`}}/>
                <span style={{fontSize:15,fontWeight:700,color:'var(--text)',fontFamily:F}}>{selCamp.nome}</span>
                <span style={{fontSize:11,color:'var(--text3)',fontFamily:F}}>· {selCamp.id} · {statusLabel(selCamp.status)} · {tipoCampanha(selCamp.tipo)}</span>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:20}}>
              {[
                {label:'Leads',value:formatNum(selCamp.leads),color:'var(--google)'},
                {label:'Investimento',value:formatBRL(selCamp.invest),color:'var(--green)'},
                {label:'CPL',value:selCamp.leads>0&&selCamp.invest>0?formatBRL(selCamp.invest/selCamp.leads):'—',color:'#FB923C'},
                {label:'Impressões',value:formatK(selCamp.imp),color:'var(--accent)'},
                {label:'Cliques',value:formatK(selCamp.cliques),color:'#A78BFA'},
                {label:'CTR',value:selCamp.imp>0?formatPct(selCamp.cliques/selCamp.imp):'—',color:'var(--accent)'},
                {label:'CPC Médio',value:selCamp.cliques>0?formatBRL(selCamp.invest/selCamp.cliques):'—',color:'#FB923C'},
              ].map((k,i)=>(
                <div key={i} style={{background:'#F0F4F8',borderRadius:10,padding:'12px 14px',border:'1px solid #D1DCE8'}}>
                  <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text3)',fontFamily:F,marginBottom:4}}>{k.label}</div>
                  <div style={{fontSize:18,...N,color:k.color}}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Charts 2x2 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',fontFamily:F,marginBottom:8}}>Leads & Investimento</div>
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={campByDay} margin={{top:5,right:5,left:0,bottom:5}}>
                    <defs>
                      <linearGradient id="cL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2}/><stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.15}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
                    <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="l" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
                    <Tooltip content={<CT fmt={fmtVal}/>}/>
                    <Legend wrapperStyle={{fontSize:11,color:'#3D5070',fontFamily:F}}/>
                    <Area yAxisId="l" type="monotone" dataKey="Leads" stroke="#22D3EE" strokeWidth={2} fill="url(#cL)" dot={false}/>
                    <Area yAxisId="r" type="monotone" dataKey="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#cI)" dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',fontFamily:F,marginBottom:8}}>Cliques & CTR</div>
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={campByDay} margin={{top:5,right:5,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
                    <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="l" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`${v.toFixed(1)}%`}/>
                    <Tooltip content={<CT fmt={fmtVal}/>}/>
                    <Legend wrapperStyle={{fontSize:11,color:'#3D5070',fontFamily:F}}/>
                    <Bar yAxisId="l" dataKey="Cliques" fill="#A78BFA" opacity={0.7} radius={[3,3,0,0]}/>
                    <Line yAxisId="r" type="monotone" dataKey="CTR" stroke="#0EA5E9" strokeWidth={2} dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',fontFamily:F,marginBottom:8}}>CPL por Dia</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={campByDay.filter(d=>d.CPL>0)} margin={{top:5,right:5,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
                    <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v.toFixed(0)}`}/>
                    <Tooltip content={<CT fmt={fmtVal}/>}/>
                    <Line type="monotone" dataKey="CPL" stroke="#FB923C" strokeWidth={2.5} dot={{fill:'#FB923C',r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',fontFamily:F,marginBottom:8}}>CPC por Dia</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={campByDay.filter(d=>d.CPC>0)} margin={{top:5,right:5,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
                    <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v.toFixed(2)}`}/>
                    <Tooltip content={<CT fmt={fmtVal}/>}/>
                    <Line type="monotone" dataKey="CPC" stroke="#34D399" strokeWidth={2.5} dot={{fill:'#34D399',r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
