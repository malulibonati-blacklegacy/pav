'use client'
import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { LeadRow, MetaCostRow, formatBRL, formatNum, formatPct, formatK } from '@/lib/data'

interface Props { leads: LeadRow[]; costs: MetaCostRow[] }
const F = "'DM Sans', sans-serif"
const N: React.CSSProperties = { fontFamily: F, fontWeight: 700 }
const PIE_COLORS = ['#A78BFA','#C4B5FD','#7C3AED','#6D28D9','#DDD6FE','#8B5CF6','#F0ABFC']

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

export default function MetaTab({ leads, costs }: Props) {
  const totalLeads = leads.reduce((s,r)=>s+r.leads,0)
  const totalInvest = costs.reduce((s,r)=>s+r.valorGasto,0)
  const totalImp = costs.reduce((s,r)=>s+r.impressoes,0)
  const totalAlcance = costs.reduce((s,r)=>s+r.alcance,0)
  const totalCliques = costs.reduce((s,r)=>s+r.cliquesLink,0)
  const avgCTR = totalImp>0?totalCliques/totalImp:0
  const avgCPM = totalImp>0?(totalInvest/totalImp)*1000:0
  const avgCPC = totalCliques>0?totalInvest/totalCliques:0
  const cpl = totalLeads>0?totalInvest/totalLeads:0

  // Campaign map
  const campMap = costs.reduce((acc,r)=>{
    const id=r.idCampanha
    if(!acc[id]) acc[id]={id,nome:r.nomeCampanha,invest:0,alcance:0,imp:0,cliques:0,leads:0}
    acc[id].invest+=r.valorGasto; acc[id].alcance+=r.alcance; acc[id].imp+=r.impressoes; acc[id].cliques+=r.cliquesLink
    return acc
  },{} as Record<string,{id:string,nome:string,invest:number,alcance:number,imp:number,cliques:number,leads:number}>)
  leads.filter(r=>r.campanha).forEach(r=>{ if(campMap[r.campanha]) campMap[r.campanha].leads+=r.leads })
  const campaigns = Object.values(campMap).sort((a,b)=>b.leads-a.leads)

  const [selId, setSelId] = useState(campaigns[0]?.id||'')
  const selCamp = campaigns.find(c=>c.id===selId)||campaigns[0]

  const campCosts = costs.filter(r=>r.idCampanha===selId)
  const campLeads = leads.filter(r=>r.campanha===selId)

  const campByDay = (() => {
    const dayMap: Record<string,{invest:number,alcance:number,imp:number,cliques:number,leads:number}> = {}
    campCosts.forEach(r=>{
      const k=r.dateObj.toLocaleDateString('pt-BR')
      if(!dayMap[k]) dayMap[k]={invest:0,alcance:0,imp:0,cliques:0,leads:0}
      dayMap[k].invest+=r.valorGasto; dayMap[k].alcance+=r.alcance; dayMap[k].imp+=r.impressoes; dayMap[k].cliques+=r.cliquesLink
    })
    campLeads.forEach(r=>{if(dayMap[r.data]) dayMap[r.data].leads+=r.leads})
    return Object.entries(dayMap).sort(([a],[b])=>a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
      .map(([date,v])=>({
        date:date.slice(0,5),
        Investimento:v.invest, Leads:v.leads, Cliques:v.cliques, Alcance:v.alcance,
        CTR:v.imp>0?(v.cliques/v.imp)*100:0,
        CPL:v.leads>0&&v.invest>0?v.invest/v.leads:0,
        CPM:v.imp>0?(v.invest/v.imp)*1000:0,
      }))
  })()

  const byDay = (() => {
    const dayMap: Record<string,{invest:number,imp:number,cliques:number,alcance:number,leads:number}> = {}
    costs.forEach(r=>{
      const k=r.dateObj.toLocaleDateString('pt-BR')
      if(!dayMap[k]) dayMap[k]={invest:0,imp:0,cliques:0,alcance:0,leads:0}
      dayMap[k].invest+=r.valorGasto; dayMap[k].imp+=r.impressoes; dayMap[k].cliques+=r.cliquesLink; dayMap[k].alcance+=r.alcance
    })
    leads.forEach(r=>{if(dayMap[r.data]) dayMap[r.data].leads+=r.leads})
    return Object.entries(dayMap).sort(([a],[b])=>a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
      .map(([date,v])=>({
        date:date.slice(0,5),
        Investimento:v.invest, Leads:v.leads, Cliques:v.cliques,
        CPL:v.leads>0&&v.invest>0?v.invest/v.leads:0,
        CTR:v.imp>0?(v.cliques/v.imp)*100:0,
        CPM:v.imp>0?(v.invest/v.imp)*1000:0,
      }))
  })()

  const byPlacement = Object.entries(
    leads.reduce((acc,r)=>{ const k=r.placement||'Desconhecido'; acc[k]=(acc[k]||0)+r.leads; return acc },{} as Record<string,number>)
  ).map(([placement,leads])=>({placement,leads})).sort((a,b)=>b.leads-a.leads)

  const byCourse = Object.entries(
    leads.reduce((acc,r)=>{ const c=r.tituloLP||r.curso||'Desconhecido'; acc[c]=(acc[c]||0)+r.leads; return acc },{} as Record<string,number>)
  ).map(([curso,leads])=>({curso,leads})).sort((a,b)=>b.leads-a.leads).slice(0,8)

  const campCostById = costs.reduce((acc,r)=>{ acc[r.idCampanha]=(acc[r.idCampanha]||0)+r.valorGasto; return acc },{} as Record<string,number>)
  const adMap = leads.reduce((acc,r)=>{
    const a=r.anuncio||'Sem anúncio'
    if(!acc[a]) acc[a]={leads:0,campIds:new Set<string>()}
    acc[a].leads+=r.leads; if(r.campanha) acc[a].campIds.add(r.campanha)
    return acc
  },{} as Record<string,{leads:number,campIds:Set<string>}>)
  const allAds = Object.entries(adMap).map(([ad,v])=>{
    const invest=Array.from(v.campIds).reduce((s,id)=>s+(campCostById[id]||0),0)
    return {ad,leads:v.leads,invest,cpl:v.leads>0&&invest>0?invest/v.leads:0}
  }).sort((a,b)=>b.leads-a.leads)

  const fmtVal = (name: string, val: number) => {
    if (['Investimento','CPL','CPC','CPM'].includes(name)) return formatBRL(val)
    if (name==='CTR') return `${val.toFixed(2)}%`
    if (['Impressões','Alcance','Cliques'].includes(name)) return formatK(val)
    return val.toLocaleString('pt-BR')
  }

  const kpis = [
    {label:'Leads',value:formatNum(totalLeads),sub:'período selecionado',color:'meta'},
    {label:'Investimento',value:formatBRL(totalInvest),sub:'Meta Ads',color:'accent'},
    {label:'CPL',value:formatBRL(cpl),sub:'custo por lead',color:'orange'},
    {label:'Alcance',value:formatK(totalAlcance),sub:'pessoas alcançadas',color:'green'},
    {label:'Impressões',value:formatK(totalImp),sub:'total',color:'meta'},
    {label:'Cliques',value:formatK(totalCliques),sub:'cliques no link',color:'accent'},
    {label:'CTR',value:formatPct(avgCTR),sub:'taxa de cliques',color:'orange'},
    {label:'CPM',value:formatBRL(avgCPM),sub:'custo por mil imp.',color:'green'},
    {label:'CPC',value:formatBRL(avgCPC),sub:'custo por clique',color:'meta'},
  ]

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid animate-fadeUp animate-delay-1" style={{gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>
        {kpis.map((k,i)=>(
          <div key={i} className={`kpi-card ${k.color}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{...N,fontSize:k.value.includes('R$')?18:k.value.length>6?18:24}}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily overview */}
      <div className="section-label animate-fadeUp animate-delay-2">Evolução Diária</div>
      <div className="chart-card animate-fadeUp animate-delay-2" style={{marginBottom:16}}>
        <div className="chart-header"><div><div className="chart-title">Leads & Investimento por Dia</div><div className="chart-subtitle">Visão consolidada do período</div></div></div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={byDay} margin={{top:5,right:10,left:0,bottom:5}}>
            <defs>
              <linearGradient id="mL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2}/><stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/></linearGradient>
              <linearGradient id="mI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.15}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
            <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="left" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="right" orientation="right" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<CT fmt={fmtVal}/>}/>
            <Legend wrapperStyle={{fontSize:12,color:'#3D5070',fontFamily:F}}/>
            <Area yAxisId="left" type="monotone" dataKey="Leads" stroke="#A78BFA" strokeWidth={2} fill="url(#mL)" dot={false}/>
            <Area yAxisId="right" type="monotone" dataKey="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#mI)" dot={false}/>

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Impressões x Cliques x CTR */}
      <div className="chart-card animate-fadeUp animate-delay-2" style={{marginBottom:16}}>
        <div className="chart-header"><div><div className="chart-title">Impressões & Cliques & CTR por Dia</div><div className="chart-subtitle">Volume de impressões, cliques e taxa de cliques</div></div></div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={byDay} margin={{top:5,right:10,left:0,bottom:5}}>
            <defs>
              <linearGradient id="mImp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C4B5FD" stopOpacity={0.2}/><stop offset="95%" stopColor="#C4B5FD" stopOpacity={0}/></linearGradient>
              <linearGradient id="mCliq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22D3EE" stopOpacity={0.15}/><stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
            <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="left" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>formatK(v)}/>
            <YAxis yAxisId="right" orientation="right" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`${v.toFixed(1)}%`}/>
            <Tooltip content={<CT fmt={fmtVal}/>}/>
            <Legend wrapperStyle={{fontSize:12,color:'#3D5070',fontFamily:F}}/>
            <Area yAxisId="left" type="monotone" dataKey="Impressões" stroke="#A78BFA" strokeWidth={2} fill="url(#mImp)" dot={false}/>
            <Area yAxisId="left" type="monotone" dataKey="Cliques" stroke="#22D3EE" strokeWidth={2} fill="url(#mCliq)" dot={false}/>
            <Line yAxisId="right" type="monotone" dataKey="CTR" stroke="#FB923C" strokeWidth={2} dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* CPL + CTR */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div className="chart-card animate-fadeUp animate-delay-2">
          <div className="chart-header"><div><div className="chart-title">CPL & Investimento por Dia</div><div className="chart-subtitle">Custo por lead e investimento diário</div></div></div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={byDay.filter(d=>d.CPL>0)} margin={{top:5,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
              <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="left" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v.toFixed(0)}`}/>
              <YAxis yAxisId="right" orientation="right" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
              <Tooltip content={<CT fmt={fmtVal}/>}/>
              <Legend wrapperStyle={{fontSize:11,color:'#3D5070',fontFamily:F}}/>
              <Line yAxisId="left" type="monotone" dataKey="CPL" stroke="#FB923C" strokeWidth={2.5} dot={{fill:'#FB923C',r:3}} activeDot={{r:5}}/>
              <Line yAxisId="right" type="monotone" dataKey="Investimento" stroke="#34D399" strokeWidth={2} dot={false} strokeDasharray="4 2"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card animate-fadeUp animate-delay-2">
          <div className="chart-header"><div><div className="chart-title">CTR & CPM por Dia</div><div className="chart-subtitle">Taxa de cliques e custo por mil impressões</div></div></div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={byDay.filter(d=>d.CTR>0)} margin={{top:5,right:10,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
              <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="l" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`${v.toFixed(1)}%`}/>
              <YAxis yAxisId="r" orientation="right" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v.toFixed(0)}`}/>
              <Tooltip content={<CT fmt={fmtVal}/>}/>
              <Legend wrapperStyle={{fontSize:11,color:'#3D5070',fontFamily:F}}/>
              <Line yAxisId="l" type="monotone" dataKey="CTR" stroke="#0EA5E9" strokeWidth={2} dot={false}/>
              <Line yAxisId="r" type="monotone" dataKey="CPM" stroke="#F87171" strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Placement + Course */}
      <div className="chart-grid col2 animate-fadeUp animate-delay-3">
        <div className="chart-card" style={{display:'flex',flexDirection:'column'}}>
          <div className="chart-header"><div><div className="chart-title">Leads por Placement</div><div className="chart-subtitle">Feed, Stories, Reels etc.</div></div></div>
          <div style={{display:'flex',alignItems:'center',gap:20,flex:1}}>
            <div style={{flexShrink:0}}>
              <ResponsiveContainer width={130} height={150}>
                <PieChart>
                  <Pie data={byPlacement.slice(0,6)} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="leads" paddingAngle={3}>
                    {byPlacement.slice(0,6).map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#fff',border:'1px solid #D1DCE8',borderRadius:8,fontSize:12,fontFamily:F}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{flex:1}}>
              {byPlacement.slice(0,6).map((p,i)=>(
                <div key={p.placement} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/>
                  <div style={{flex:1,fontSize:11,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:F}}>{p.placement}</div>
                  <div style={{fontSize:13,...N,color:'var(--text)'}}>{p.leads}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header"><div><div className="chart-title">Top Cursos — Meta</div><div className="chart-subtitle">Volume de leads por curso</div></div></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byCourse} layout="vertical" margin={{top:5,right:20,left:0,bottom:5}} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" horizontal={false}/>
              <XAxis type="number" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="curso" tick={{fill:'#7A90B0',fontSize:10,fontFamily:F}} axisLine={false} tickLine={false} width={150} tickFormatter={v=>v.length>22?v.slice(0,22)+'…':v}/>
              <Tooltip content={<CT fmt={fmtVal}/>}/>
              <Bar dataKey="leads" name="Leads" fill="#A78BFA" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="section-label animate-fadeUp animate-delay-3" style={{marginTop:16}}>Campanhas</div>
      <div className="table-card animate-fadeUp animate-delay-3" style={{marginBottom:24}}>
        <div className="table-header">
          <div className="table-title">Performance por Campanha</div>
          <div style={{fontSize:12,color:'var(--text3)',fontFamily:F}}>{campaigns.length} campanhas</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Campanha</th><th>Leads</th><th>Investimento</th><th>CPL</th><th>Alcance</th><th>Impressões</th><th>Cliques</th><th>CTR</th><th>CPM</th><th>CPC</th></tr></thead>
            <tbody>
              {campaigns.map((c,i)=>{
                const campCPL=c.leads>0&&c.invest>0?c.invest/c.leads:0
                const campCTR=c.imp>0?c.cliques/c.imp:0
                const campCPM=c.imp>0?(c.invest/c.imp)*1000:0
                const campCPC=c.cliques>0?c.invest/c.cliques:0
                return (
                  <tr key={c.id}>
                    <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                    <td>
                      <div style={{color:'var(--text)',fontFamily:F,fontSize:13,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome}</div>
                      <div style={{color:'var(--text3)',fontFamily:F,fontSize:10,marginTop:1}}>{c.id}</div>
                    </td>
                    <td style={{...N,color:'var(--meta)'}}>{c.leads}</td>
                    <td style={{color:'var(--text)',fontFamily:F}}>{c.invest>0?formatBRL(c.invest):'—'}</td>
                    <td style={{color:campCPL>0?(campCPL<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:F}}>{campCPL>0?formatBRL(campCPL):'—'}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{formatK(c.alcance)}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{formatK(c.imp)}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{formatK(c.cliques)}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{formatPct(campCTR)}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{campCPM>0?formatBRL(campCPM):'—'}</td>
                    <td style={{color:'var(--text2)',fontFamily:F}}>{campCPC>0?formatBRL(campCPC):'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ads */}
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
                  <td style={{color:'var(--text)',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:F}}>{a.ad||'—'}</td>
                  <td style={{...N,color:'var(--meta)'}}>{a.leads}</td>
                  <td style={{color:'var(--text)',fontFamily:F}}>{a.invest>0?formatBRL(a.invest):'—'}</td>
                  <td style={{color:a.cpl>0?(a.cpl<cpl?'var(--green)':'var(--orange)'):'var(--text3)',fontFamily:F}}>{a.cpl>0?formatBRL(a.cpl):'—'}</td>
                  <td style={{color:'var(--text2)',fontFamily:F}}>{totalLeads>0?((a.leads/totalLeads)*100).toFixed(1):0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign deep dive */}
      <div className="section-label animate-fadeUp animate-delay-4">Análise por Campanha</div>
      <div className="chart-card animate-fadeUp animate-delay-4" style={{marginBottom:24}}>
        <div className="chart-header">
          <div><div className="chart-title">Investimento × Leads × Cliques × CTR por Campanha</div><div className="chart-subtitle">Selecione a campanha para análise detalhada</div></div>
        </div>

        <div style={{marginBottom:20}}>
          <select value={selId} onChange={e=>setSelId(e.target.value)}
            style={{background:'#F0F4F8',border:'1px solid #D1DCE8',borderRadius:10,padding:'10px 16px',fontSize:13,color:'var(--text)',fontFamily:F,cursor:'pointer',outline:'none',width:'100%',maxWidth:600}}>
            {campaigns.map(c=>(
              <option key={c.id} value={c.id}>🔵 {c.nome} — {c.id}</option>
            ))}
          </select>
        </div>

        {selCamp && (
          <>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#A78BFA',boxShadow:'0 0 8px #A78BFA88'}}/>
              <span style={{fontSize:15,fontWeight:700,color:'var(--text)',fontFamily:F}}>{selCamp.nome}</span>
              <span style={{fontSize:11,color:'var(--text3)',fontFamily:F}}>· {selCamp.id}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10,marginBottom:20}}>
              {[
                {label:'Leads',value:formatNum(selCamp.leads),color:'var(--meta)'},
                {label:'Investimento',value:formatBRL(selCamp.invest),color:'var(--green)'},
                {label:'CPL',value:selCamp.leads>0&&selCamp.invest>0?formatBRL(selCamp.invest/selCamp.leads):'—',color:'#FB923C'},
                {label:'Alcance',value:formatK(selCamp.alcance),color:'var(--accent)'},
                {label:'Impressões',value:formatK(selCamp.imp),color:'#A78BFA'},
                {label:'Cliques',value:formatK(selCamp.cliques),color:'var(--google)'},
                {label:'CTR',value:selCamp.imp>0?formatPct(selCamp.cliques/selCamp.imp):'—',color:'var(--accent)'},
                {label:'CPM',value:selCamp.imp>0?formatBRL((selCamp.invest/selCamp.imp)*1000):'—',color:'#F87171'},
              ].map((k,i)=>(
                <div key={i} style={{background:'#F0F4F8',borderRadius:10,padding:'12px 14px',border:'1px solid #D1DCE8'}}>
                  <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text3)',fontFamily:F,marginBottom:4}}>{k.label}</div>
                  <div style={{fontSize:17,...N,color:k.color}}>{k.value}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',fontFamily:F,marginBottom:8}}>Leads & Investimento</div>
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={campByDay} margin={{top:5,right:5,left:0,bottom:5}}>
                    <defs>
                      <linearGradient id="cmL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2}/><stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cmI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.15}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
                    <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="l" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
                    <Tooltip content={<CT fmt={fmtVal}/>}/>
                    <Legend wrapperStyle={{fontSize:11,color:'#3D5070',fontFamily:F}}/>
                    <Area yAxisId="l" type="monotone" dataKey="Leads" stroke="#A78BFA" strokeWidth={2} fill="url(#cmL)" dot={false}/>
                    <Area yAxisId="r" type="monotone" dataKey="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#cmI)" dot={false}/>
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
                    <Bar yAxisId="l" dataKey="Cliques" fill="#22D3EE" opacity={0.7} radius={[3,3,0,0]}/>
                    <Line yAxisId="r" type="monotone" dataKey="CTR" stroke="#A78BFA" strokeWidth={2} dot={false}/>
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
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',fontFamily:F,marginBottom:8}}>CPM por Dia</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={campByDay.filter(d=>d.CPM>0)} margin={{top:5,right:5,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
                    <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#7A90B0',fontSize:9,fontFamily:F}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v.toFixed(0)}`}/>
                    <Tooltip content={<CT fmt={fmtVal}/>}/>
                    <Line type="monotone" dataKey="CPM" stroke="#F87171" strokeWidth={2.5} dot={{fill:'#F87171',r:3}}/>
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
