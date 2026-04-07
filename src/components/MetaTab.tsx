'use client'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import { LeadRow, CostRow, formatBRL } from '@/lib/data'

interface Props {
  leads: LeadRow[]
  costs: CostRow[]
}

function CustomTooltip({ active, payload, label, formatVal }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontWeight: 700, fontSize: 13, marginTop: 2 }}>
          {p.name}: {formatVal ? formatBRL(p.value) : typeof p.value === 'number' ? p.value.toLocaleString('pt-BR') : p.value}
        </div>
      ))}
    </div>
  )
}

export default function MetaTab({ leads, costs }: Props) {
  const totalLeads = leads.reduce((s, r) => s + r.leads, 0)
  const totalInvest = costs.reduce((s, r) => s + r.valorGasto, 0)
  const cpl = totalLeads > 0 ? totalInvest / totalLeads : 0

  // By campaign
  const byCampaign = Object.entries(
    leads.reduce((acc, r) => {
      const c = r.campanha || 'Sem campanha'
      if (!acc[c]) acc[c] = { leads: 0 }
      acc[c].leads += r.leads
      return acc
    }, {} as Record<string, { leads: number }>)
  ).map(([campanha, v]) => {
    const campCost = costs.filter(c => c.idCampanha === campanha || c.nomeCampanha === campanha)
      .reduce((s, c) => s + c.valorGasto, 0)
    const nameCost = costs.find(c => c.idCampanha === campanha)
    return {
      campanha,
      nome: nameCost?.nomeCampanha || campanha,
      leads: v.leads,
      invest: campCost,
      cpl: v.leads > 0 && campCost > 0 ? campCost / v.leads : 0,
      convRate: totalLeads > 0 ? (v.leads / totalLeads) * 100 : 0,
    }
  }).sort((a, b) => b.leads - a.leads).slice(0, 15)

  const maxLeads = byCampaign[0]?.leads || 1

  // By placement (Instagram Feed, Stories, etc.)
  const byPlacement = Object.entries(
    leads.reduce((acc, r) => {
      const k = r.placement || 'Desconhecido'
      acc[k] = (acc[k] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).map(([placement, leads]) => ({ placement, leads }))
    .sort((a, b) => b.leads - a.leads)

  // By course
  const byCourse = Object.entries(
    leads.reduce((acc, r) => {
      const c = r.tituloLP || r.curso || 'Desconhecido'
      acc[c] = (acc[c] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).map(([curso, leads]) => ({ curso, leads }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10)

  // By day
  const byDay = Object.entries(
    leads.reduce((acc, r) => {
      acc[r.data] = (acc[r.data] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).sort(([a], [b]) => {
    return a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join(''))
  }).map(([date, leadsVal]) => {
    const dayCost = costs.filter(c => c.dateObj.toLocaleDateString('pt-BR') === date)
      .reduce((s, c) => s + c.valorGasto, 0)
    return { date: date.slice(0, 5), leads: leadsVal, invest: dayCost, cpl: leadsVal > 0 && dayCost > 0 ? dayCost / leadsVal : 0 }
  })

  const PIE_COLORS = ['#A78BFA', '#C4B5FD', '#7C3AED', '#6D28D9', '#DDD6FE', '#8B5CF6']

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid animate-fadeUp animate-delay-1">
        <div className="kpi-card meta">
          <div className="kpi-label">Leads Meta</div>
          <div className="kpi-value">{totalLeads.toLocaleString('pt-BR')}</div>
          <div className="kpi-sub">período selecionado</div>
        </div>
        <div className="kpi-card accent">
          <div className="kpi-label">Investimento</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatBRL(totalInvest)}</div>
          <div className="kpi-sub">Meta Ads</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">CPL Meta</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatBRL(cpl)}</div>
          <div className="kpi-sub">custo por lead</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Campanhas Ativas</div>
          <div className="kpi-value">{byCampaign.length}</div>
          <div className="kpi-sub">com leads no período</div>
        </div>
        <div className="kpi-card meta">
          <div className="kpi-label">Placements</div>
          <div className="kpi-value">{byPlacement.length}</div>
          <div className="kpi-sub">posicionamentos</div>
        </div>
      </div>

      {/* Leads + invest by day */}
      <div className="section-label animate-fadeUp animate-delay-2">Evolução Diária</div>
      <div className="chart-grid animate-fadeUp animate-delay-2" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Leads & Investimento Diário — Meta</div>
              <div className="chart-subtitle">Volume de leads e custo por dia</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={byDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="mL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" />
              <XAxis dataKey="date" tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#7A90B0' }} />
              <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#A78BFA" strokeWidth={2} fill="url(#mL)" dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="invest" name="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#mI)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Placement + CPL */}
      <div className="chart-grid col2 animate-fadeUp animate-delay-3">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Leads por Placement</div>
              <div className="chart-subtitle">Feed, Stories, Reels etc.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width={160} height={180}>
              <PieChart>
                <Pie data={byPlacement.slice(0, 6)} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="leads" paddingAngle={3}>
                  {byPlacement.slice(0, 6).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {byPlacement.slice(0, 6).map((p, i) => (
                <div key={p.placement} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.placement}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{p.leads}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">CPL Diário — Meta</div>
              <div className="chart-subtitle">Custo por lead ao longo do tempo</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDay.filter(d => d.cpl > 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" />
              <XAxis dataKey="date" tick={{ fill: '#3D5070', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#3D5070', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toFixed(0)}`} />
              <Tooltip content={<CustomTooltip formatVal />} />
              <Line type="monotone" dataKey="cpl" name="CPL" stroke="#A78BFA" strokeWidth={2} dot={{ fill: '#A78BFA', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top cursos Meta */}
      <div className="section-label animate-fadeUp animate-delay-3">Performance por Curso</div>
      <div className="chart-card animate-fadeUp animate-delay-3" style={{ marginBottom: 24 }}>
        <div className="chart-header">
          <div>
            <div className="chart-title">Top 10 Cursos — Meta Ads</div>
            <div className="chart-subtitle">Volume de leads por curso no período</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCourse} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#3D5070', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="curso" tick={{ fill: '#7A90B0', fontSize: 10 }} axisLine={false} tickLine={false} width={180}
              tickFormatter={v => v.length > 26 ? v.slice(0, 26) + '…' : v} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="leads" name="Leads" fill="#A78BFA" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign table */}
      <div className="section-label animate-fadeUp animate-delay-4">Campanhas</div>
      <div className="table-card animate-fadeUp animate-delay-4">
        <div className="table-header">
          <div className="table-title">Performance por Campanha — Meta</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{byCampaign.length} campanhas</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Campanha</th>
                <th>Leads</th>
                <th>Investimento</th>
                <th>CPL</th>
                <th>Taxa Conv.</th>
                <th style={{ minWidth: 120 }}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {byCampaign.map((c, i) => (
                <tr key={c.campanha}>
                  <td><span className={`rank-badge rank-${i < 3 ? i + 1 : 'n'}`}>{i + 1}</span></td>
                  <td style={{ color: 'var(--text)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={c.nome !== c.campanha ? c.nome : undefined}>
                    {c.nome !== c.campanha ? c.nome : c.campanha.slice(0, 24) + (c.campanha.length > 24 ? '…' : '')}
                  </td>
                  <td style={{ color: 'var(--meta)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{c.leads}</td>
                  <td style={{ color: 'var(--text)' }}>{c.invest > 0 ? formatBRL(c.invest) : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                  <td style={{ color: c.cpl > 0 ? (c.cpl < cpl ? 'var(--green)' : 'var(--orange)') : 'var(--text3)' }}>
                    {c.cpl > 0 ? formatBRL(c.cpl) : '—'}
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{c.convRate.toFixed(1)}%</td>
                  <td>
                    <div className="bar-inline-track">
                      <div className="bar-inline-fill" style={{ width: `${(c.leads / maxLeads) * 100}%`, background: 'linear-gradient(90deg, #A78BFA, #C4B5FD)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
