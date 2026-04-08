'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { LeadRow, CostRow, formatBRL } from '@/lib/data'

interface Props { leads: LeadRow[]; googleCosts: CostRow[]; metaCosts: CostRow[] }

const FONT = "'DM Sans', sans-serif"
const NUM_STYLE: React.CSSProperties = { fontFamily: FONT, fontWeight: 700 }

function CT({ active, payload, label, isBRL }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontWeight: 700, fontSize: 13, marginTop: 2, fontFamily: FONT }}>
          {p.name}: {isBRL ? formatBRL(p.value) : p.value?.toLocaleString('pt-BR')}
        </div>
      ))}
    </div>
  )
}

const PIE_COLORS = ['#0EA5E9','#A78BFA','#34D399','#FB923C','#F87171','#FBBF24','#22D3EE']
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export default function OverviewTab({ leads, googleCosts, metaCosts }: Props) {
  const totalLeads = leads.reduce((s,r) => s + r.leads, 0)
  const totalGoogle = googleCosts.reduce((s,r) => s + r.valorGasto, 0)
  const totalMeta = metaCosts.reduce((s,r) => s + r.valorGasto, 0)
  const totalInvest = totalGoogle + totalMeta
  const cpl = totalLeads > 0 ? totalInvest / totalLeads : 0

  // By day
  const allCosts = [...googleCosts, ...metaCosts]
  const costByDay = allCosts.reduce((acc,r) => {
    const k = r.dateObj.toLocaleDateString('pt-BR')
    acc[k] = (acc[k]||0) + r.valorGasto
    return acc
  }, {} as Record<string,number>)

  const byDay = Object.entries(
    leads.reduce((acc,r) => { acc[r.data] = (acc[r.data]||0) + r.leads; return acc }, {} as Record<string,number>)
  ).sort(([a],[b]) => a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
   .map(([date, leadsVal]) => ({ date: date.slice(0,5), leads: leadsVal, invest: costByDay[date]||0, cpl: leadsVal>0&&(costByDay[date]||0)>0 ? (costByDay[date]||0)/leadsVal : 0 }))

  // By week with date range label
  const byWeekMap = leads.reduce((acc,r) => {
    const w = r.semanaAno
    if (!acc[w]) acc[w] = { leads: 0, dates: [] }
    acc[w].leads += r.leads
    acc[w].dates.push(r.dateObj)
    return acc
  }, {} as Record<string,{leads:number,dates:Date[]}>)

  const byWeek = Object.entries(byWeekMap).sort(([a],[b]) => a.localeCompare(b)).map(([week,v]) => {
    const sorted = v.dates.sort((a,b) => a.getTime()-b.getTime())
    const first = sorted[0]
    const last = sorted[sorted.length-1]
    const label = `${first.getDate().toString().padStart(2,'0')}/${(first.getMonth()+1).toString().padStart(2,'0')}-${last.getDate().toString().padStart(2,'0')}/${(last.getMonth()+1).toString().padStart(2,'0')}`
    return { week: label, leads: v.leads }
  })

  // By day of week
  const byDayOfWeek = leads.reduce((acc,r) => {
    const d = r.diaSemanaNum
    acc[d] = (acc[d]||0) + r.leads
    return acc
  }, {} as Record<number,number>)
  const dayOfWeekData = [0,1,2,3,4,5,6].map(d => ({ dia: DIAS[d], leads: byDayOfWeek[d]||0 }))

  // By platform
  const byPlatform = Object.entries(
    leads.reduce((acc,r) => { acc[r.plataforma||'Outros'] = (acc[r.plataforma||'Outros']||0) + r.leads; return acc }, {} as Record<string,number>)
  ).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value)

  // By course top 10
  const byCourse = Object.entries(
    leads.reduce((acc,r) => { const c = r.tituloLP||r.curso||'Desconhecido'; acc[c]=(acc[c]||0)+r.leads; return acc }, {} as Record<string,number>)
  ).map(([name,leads]) => ({ name, leads })).sort((a,b) => b.leads-a.leads).slice(0,10)
  const maxCourse = byCourse[0]?.leads||1

  // Top 5 ads (anuncio) with cost and leads
  const adMap = leads.reduce((acc,r) => {
    const a = r.anuncio||'Sem anúncio'
    if (!acc[a]) acc[a] = { leads:0, invest:0 }
    acc[a].leads += r.leads
    return acc
  }, {} as Record<string,{leads:number,invest:number}>)

  // Match cost to ad via campanha
  const campCostMap = allCosts.reduce((acc,r) => {
    acc[r.idCampanha] = (acc[r.idCampanha]||0) + r.valorGasto
    return acc
  }, {} as Record<string,number>)

  const top5Ads = Object.entries(adMap)
    .map(([ad,v]) => ({ ad, leads: v.leads, invest: 0, cpl: 0 }))
    .sort((a,b) => b.leads-a.leads).slice(0,5)

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid animate-fadeUp animate-delay-1">
        {[
          { label:'Leads Totais', value: totalLeads.toLocaleString('pt-BR'), sub:'período selecionado', color:'accent' },
          { label:'Investimento Total', value: formatBRL(totalInvest), sub:'Google + Meta', color:'green' },
          { label:'CPL Geral', value: formatBRL(cpl), sub:'custo por lead', color:'orange' },
          { label:'Invest. Google', value: formatBRL(totalGoogle), sub: `${totalInvest>0?((totalGoogle/totalInvest)*100).toFixed(0):0}% do total`, color:'google' },
          { label:'Invest. Meta', value: formatBRL(totalMeta), sub: `${totalInvest>0?((totalMeta/totalInvest)*100).toFixed(0):0}% do total`, color:'meta' },
        ].map((k,i) => (
          <div key={i} className={`kpi-card ${k.color}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ ...NUM_STYLE, fontSize: k.value.includes('R$') ? 22 : 28 }}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Leads + Invest por dia */}
      <div className="section-label animate-fadeUp animate-delay-2">Evolução Diária</div>
      <div className="chart-card animate-fadeUp animate-delay-2" style={{ marginBottom:16 }}>
        <div className="chart-header">
          <div><div className="chart-title">Leads & Investimento por Dia</div><div className="chart-subtitle">Volume de leads e valor investido no período</div></div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={byDay} margin={{ top:5, right:10, left:0, bottom:5 }}>
            <defs>
              <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2}/><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gInvest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
            <XAxis dataKey="date" tick={{ fill:'#7A90B0', fontSize:11, fontFamily:FONT }} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="left" tick={{ fill:'#7A90B0', fontSize:11, fontFamily:FONT }} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="right" orientation="right" tick={{ fill:'#7A90B0', fontSize:11, fontFamily:FONT }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<CT />}/>
            <Legend wrapperStyle={{ fontSize:12, color:'#3D5070', fontFamily:FONT }}/>
            <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#0EA5E9" strokeWidth={2} fill="url(#gLeads)" dot={false}/>
            <Area yAxisId="right" type="monotone" dataKey="invest" name="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#gInvest)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Platform + Weekly + Day of Week */}
      <div className="chart-grid col2 animate-fadeUp animate-delay-3">
        <div className="chart-card">
          <div className="chart-header"><div><div className="chart-title">Leads por Plataforma</div><div className="chart-subtitle">Distribuição de origens</div></div></div>
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={byPlatform} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {byPlatform.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'#fff', border:'1px solid #D1DCE8', borderRadius:8, fontSize:12, fontFamily:FONT }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {byPlatform.map((p,i) => (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }}/>
                  <div style={{ flex:1, fontSize:12, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:FONT }}>{p.name}</div>
                  <div style={{ fontSize:13, ...NUM_STYLE, color:'var(--text)' }}>{p.value}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', fontFamily:FONT }}>{totalLeads>0?((p.value/totalLeads)*100).toFixed(0):0}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header"><div><div className="chart-title">Leads por Semana</div><div className="chart-subtitle">Volume semanal com período</div></div></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byWeek} margin={{ top:5, right:5, left:-20, bottom:5 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" vertical={false}/>
              <XAxis dataKey="week" tick={{ fill:'#7A90B0', fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#7A90B0', fontSize:10, fontFamily:FONT }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT />}/>
              <Bar dataKey="leads" name="Leads" fill="#0EA5E9" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day of week */}
      <div className="chart-card animate-fadeUp animate-delay-3" style={{ marginBottom:16 }}>
        <div className="chart-header"><div><div className="chart-title">Leads por Dia da Semana</div><div className="chart-subtitle">Melhores dias para geração de leads</div></div></div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dayOfWeekData} margin={{ top:5, right:10, left:0, bottom:5 }} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" vertical={false}/>
            <XAxis dataKey="dia" tick={{ fill:'#7A90B0', fontSize:12, fontFamily:FONT }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:'#7A90B0', fontSize:11, fontFamily:FONT }} axisLine={false} tickLine={false}/>
            <Tooltip content={<CT />}/>
            <Bar dataKey="leads" name="Leads" radius={[6,6,0,0]}>
              {dayOfWeekData.map((d,i) => {
                const max = Math.max(...dayOfWeekData.map(x=>x.leads))
                return <Cell key={i} fill={d.leads===max ? '#0EA5E9' : '#B8D8F0'}/>
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 Anúncios */}
      <div className="section-label animate-fadeUp animate-delay-4">Top Anúncios</div>
      <div className="table-card animate-fadeUp animate-delay-4" style={{ marginBottom:24 }}>
        <div className="table-header">
          <div className="table-title">Top 5 Anúncios — Visão Geral</div>
        </div>
        <table className="data-table">
          <thead><tr><th>#</th><th>Anúncio</th><th>Leads</th><th>% do Total</th></tr></thead>
          <tbody>
            {top5Ads.map((a,i) => (
              <tr key={a.ad}>
                <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                <td style={{ color:'var(--text)', maxWidth:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:FONT }}>{a.ad||'—'}</td>
                <td style={{ ...NUM_STYLE, color:'var(--accent)' }}>{a.leads}</td>
                <td style={{ color:'var(--text2)', fontFamily:FONT }}>{totalLeads>0?((a.leads/totalLeads)*100).toFixed(1):0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top cursos */}
      <div className="section-label animate-fadeUp animate-delay-4">Performance por Curso</div>
      <div className="table-card animate-fadeUp animate-delay-4">
        <div className="table-header">
          <div className="table-title">Top Cursos por Volume de Leads</div>
          <div style={{ fontSize:12, color:'var(--text3)', fontFamily:FONT }}>{byCourse.length} cursos</div>
        </div>
        <table className="data-table">
          <thead><tr><th>#</th><th>Curso</th><th>Leads</th><th>% do Total</th><th style={{ minWidth:160 }}>Distribuição</th></tr></thead>
          <tbody>
            {byCourse.map((c,i) => (
              <tr key={c.name}>
                <td><span className={`rank-badge rank-${i<3?i+1:'n'}`}>{i+1}</span></td>
                <td style={{ color:'var(--text)', maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:FONT }}>{c.name}</td>
                <td style={{ ...NUM_STYLE, color:'var(--accent)' }}>{c.leads}</td>
                <td style={{ color:'var(--text2)', fontFamily:FONT }}>{totalLeads>0?((c.leads/totalLeads)*100).toFixed(1):0}%</td>
                <td><div className="bar-inline-track"><div className="bar-inline-fill" style={{ width:`${(c.leads/maxCourse)*100}%`, background:'linear-gradient(90deg,#0EA5E9,#38BDF8)' }}/></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
