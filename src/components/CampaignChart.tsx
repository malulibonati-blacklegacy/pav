'use client'
import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { LeadRow, CostRow, formatBRL } from '@/lib/data'

interface Props {
  leads: LeadRow[]
  costs: CostRow[]
  color: string
  colorSecondary: string
}

const FONT = "'DM Sans', sans-serif"
const NUM: React.CSSProperties = { fontFamily: FONT, fontWeight: 700 }

function CT({ active, payload, label, isBRL }: any) {
  if (!active||!payload?.length) return null
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

export default function CampaignChart({ leads, costs, color, colorSecondary }: Props) {
  // Build campaign list
  const costByCampId = costs.reduce((acc,r)=>{ acc[r.idCampanha]=(acc[r.idCampanha]||0)+r.valorGasto; return acc },{} as Record<string,number>)
  const campNameById = costs.reduce((acc,r)=>{ if(!acc[r.idCampanha]) acc[r.idCampanha]=r.nomeCampanha; return acc },{} as Record<string,string>)

  const campaigns = Object.entries(
    leads.reduce((acc,r)=>{ const id=r.campanha||'sem-id'; acc[id]=(acc[id]||0)+r.leads; return acc },{} as Record<string,number>)
  ).map(([id,leadsVal])=>({
    id, nome:campNameById[id]||id,
    leads:leadsVal,
    invest:costByCampId[id]||0,
  })).sort((a,b)=>b.leads-a.leads)

  const [selectedId, setSelectedId] = useState(campaigns[0]?.id||'')
  const selected = campaigns.find(c=>c.id===selectedId)||campaigns[0]

  if (!selected) return null

  const campLeads = leads.filter(r=>r.campanha===selected.id)

  // By day for selected campaign
  const campCostByDay = costs.filter(r=>r.idCampanha===selected.id).reduce((acc,r)=>{
    const k=r.dateObj.toLocaleDateString('pt-BR')
    acc[k]=(acc[k]||0)+r.valorGasto
    return acc
  },{} as Record<string,number>)

  const byDay = Object.entries(
    campLeads.reduce((acc,r)=>{ acc[r.data]=(acc[r.data]||0)+r.leads; return acc },{} as Record<string,number>)
  ).sort(([a],[b])=>a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')))
   .map(([date,leadsVal])=>({
     date:date.slice(0,5), leads:leadsVal,
     invest:campCostByDay[date]||0,
     cpl:leadsVal>0&&(campCostByDay[date]||0)>0?(campCostByDay[date]||0)/leadsVal:0
   }))

  const campTotalLeads = campLeads.reduce((s,r)=>s+r.leads,0)
  const campTotalInvest = selected.invest
  const campCPL = campTotalLeads>0&&campTotalInvest>0?campTotalInvest/campTotalLeads:0

  return (
    <div>
      {/* Dropdown */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <label style={{fontSize:12,color:'var(--text2)',fontWeight:600,fontFamily:FONT}}>Campanha:</label>
        <select
          value={selectedId}
          onChange={e=>setSelectedId(e.target.value)}
          style={{background:'#F0F4F8',border:'1px solid #D1DCE8',borderRadius:8,padding:'7px 12px',fontSize:13,color:'var(--text)',fontFamily:FONT,cursor:'pointer',outline:'none',minWidth:280,maxWidth:500}}
        >
          {campaigns.map(c=>(
            <option key={c.id} value={c.id}>{c.nome!==c.id?c.nome:c.id} ({c.leads} leads)</option>
          ))}
        </select>
      </div>

      {/* KPIs da campanha */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Leads',value:campTotalLeads.toLocaleString('pt-BR'),color},
          {label:'Investimento',value:formatBRL(campTotalInvest),color:'#34D399'},
          {label:'CPL',value:campCPL>0?formatBRL(campCPL):'—',color:'#FB923C'},
        ].map((k,i)=>(
          <div key={i} style={{background:'#F0F4F8',borderRadius:10,padding:'14px 16px',border:'1px solid #D1DCE8'}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text3)',fontFamily:FONT,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:22,...NUM,color:k.color}}>{k.value}</div>
            <div style={{fontSize:11,color:'var(--text2)',fontFamily:FONT,marginTop:4}}>período filtrado</div>
          </div>
        ))}
      </div>

      {/* Charts side by side */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)',fontFamily:FONT,marginBottom:12}}>Leads & Investimento por Dia</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={byDay} margin={{top:5,right:5,left:0,bottom:5}}>
              <defs>
                <linearGradient id={`cL${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.2}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient>
                <linearGradient id={`cI${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
              <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="left" tick={{fill:'#7A90B0',fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="right" orientation="right" tick={{fill:'#7A90B0',fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
              <Tooltip content={<CT/>}/>
              <Legend wrapperStyle={{fontSize:11,color:'#3D5070',fontFamily:FONT}}/>
              <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke={color} strokeWidth={2} fill={`url(#cL${color})`} dot={false}/>
              <Area yAxisId="right" type="monotone" dataKey="invest" name="Investimento" stroke="#34D399" strokeWidth={2} fill={`url(#cI${color})`} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)',fontFamily:FONT,marginBottom:12}}>CPL por Dia</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDay.filter(d=>d.cpl>0)} margin={{top:5,right:5,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5"/>
              <XAxis dataKey="date" tick={{fill:'#7A90B0',fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#7A90B0',fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v.toFixed(0)}`}/>
              <Tooltip content={<CT isBRL/>}/>
              <Line type="monotone" dataKey="cpl" name="CPL" stroke="#FB923C" strokeWidth={2.5} dot={{fill:'#FB923C',r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
