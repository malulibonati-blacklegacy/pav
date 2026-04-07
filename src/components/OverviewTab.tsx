'use client'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { LeadRow, CostRow, formatBRL } from '@/lib/data'

interface Props {
  leads: LeadRow[]
  googleCosts: CostRow[]
  metaCosts: CostRow[]
}

function CustomTooltip({ active, payload, label, formatVal }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontWeight: 700, fontSize: 13, marginTop: 2 }}>
          {p.name}: {formatVal ? formatBRL(p.value) : p.value.toLocaleString('pt-BR')}
        </div>
      ))}
    </div>
  )
}

export default function OverviewTab({ leads, googleCosts, metaCosts }: Props) {
  const totalLeads = leads.reduce((s, r) => s + r.leads, 0)
  const totalGoogle = googleCosts.reduce((s, r) => s + r.valorGasto, 0)
  const totalMeta = metaCosts.reduce((s, r) => s + r.valorGasto, 0)
  const totalInvest = totalGoogle + totalMeta
  const cpl = totalLeads > 0 ? totalInvest / totalLeads : 0

  // Leads by day
  const byDay = Object.entries(
    leads.reduce((acc, r) => {
      const k = r.data
      acc[k] = (acc[k] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).sort(([a], [b]) => {
    const pa = a.split('/').reverse().join('')
    const pb = b.split('/').reverse().join('')
    return pa.localeCompare(pb)
  }).map(([date, leads]) => ({ date: date.slice(0, 5), leads }))

  // Combined leads + invest by day
  const allCosts = [...googleCosts, ...metaCosts]
  const costByDay = allCosts.reduce((acc, r) => {
    const k = r.dateObj.toLocaleDateString('pt-BR')
    acc[k] = (acc[k] || 0) + r.valorGasto
    return acc
  }, {} as Record<string, number>)

  const combinedByDay = Object.entries(
    leads.reduce((acc, r) => {
      acc[r.data] = (acc[r.data] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).sort(([a], [b]) => {
    const pa = a.split('/').reverse().join('')
    const pb = b.split('/').reverse().join('')
    return pa.localeCompare(pb)
  }).map(([date, leadsVal]) => ({
    date: date.slice(0, 5),
    leads: leadsVal,
    invest: costByDay[date] || 0,
    cpl: leadsVal > 0 ? (costByDay[date] || 0) / leadsVal : 0,
  }))

  // By platform
  const byPlatform = Object.entries(
    leads.reduce((acc, r) => {
      const p = r.plataforma || 'Outros'
      acc[p] = (acc[p] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // By course (top 10)
  const byCourse = Object.entries(
    leads.reduce((acc, r) => {
      const c = r.tituloLP || r.curso || 'Desconhecido'
      acc[c] = (acc[c] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).map(([name, leads]) => ({ name, leads }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10)

  const maxCourse = byCourse[0]?.leads || 1

  // By week
  const byWeek = Object.entries(
    leads.reduce((acc, r) => {
      acc[r.semanaAno] = (acc[r.semanaAno] || 0) + r.leads
      return acc
    }, {} as Record<string, number>)
  ).sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, leads]) => ({ week: week.replace('2026-', '').replace('2025-', ''), leads }))

  const PIE_COLORS = ['#0EA5E9', '#A78BFA', '#34D399', '#FB923C', '#F87171', '#FBBF24']

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid animate-fadeUp animate-delay-1">
        <div className="kpi-card accent">
          <div className="kpi-label">Leads Totais</div>
          <div className="kpi-value">{totalLeads.toLocaleString('pt-BR')}</div>
          <div className="kpi-sub">período selecionado</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Investimento Total</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatBRL(totalInvest)}</div>
          <div className="kpi-sub">Google + Meta</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">CPL Geral</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatBRL(cpl)}</div>
          <div className="kpi-sub">custo por lead</div>
        </div>
        <div className="kpi-card google">
          <div className="kpi-label">Invest. Google</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatBRL(totalGoogle)}</div>
          <div className="kpi-sub">{totalInvest > 0 ? ((totalGoogle / totalInvest) * 100).toFixed(0) : 0}% do total</div>
        </div>
        <div className="kpi-card meta">
          <div className="kpi-label">Invest. Meta</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatBRL(totalMeta)}</div>
          <div className="kpi-sub">{totalInvest > 0 ? ((totalMeta / totalInvest) * 100).toFixed(0) : 0}% do total</div>
        </div>
      </div>

      {/* Leads + Invest por dia */}
      <div className="section-label animate-fadeUp animate-delay-2">Evolução Diária</div>
      <div className="chart-grid animate-fadeUp animate-delay-2" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Leads & Investimento por Dia</div>
              <div className="chart-subtitle">Volume de leads e valor investido no período</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={combinedByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gInvest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" />
              <XAxis dataKey="date" tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#7A90B0' }} />
              <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#0EA5E9" strokeWidth={2} fill="url(#gLeads)" dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="invest" name="Investimento" stroke="#34D399" strokeWidth={2} fill="url(#gInvest)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform + Weekly */}
      <div className="chart-grid col2 animate-fadeUp animate-delay-3">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Leads por Plataforma</div>
              <div className="chart-subtitle">Distribuição de origens</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={byPlatform} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {byPlatform.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {byPlatform.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{p.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{totalLeads > 0 ? ((p.value / totalLeads) * 100).toFixed(0) : 0}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Leads por Semana</div>
              <div className="chart-subtitle">Volume semanal de leads</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byWeek} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#3D5070', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#3D5070', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" name="Leads" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CPL by day */}
      <div className="chart-grid animate-fadeUp animate-delay-3" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">CPL por Dia</div>
              <div className="chart-subtitle">Custo por lead diário (dias com investimento)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={combinedByDay.filter(d => d.invest > 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" />
              <XAxis dataKey="date" tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#3D5070', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toFixed(0)}`} />
              <Tooltip content={<CustomTooltip formatVal />} />
              <Line type="monotone" dataKey="cpl" name="CPL" stroke="#FB923C" strokeWidth={2} dot={{ fill: '#FB923C', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top cursos */}
      <div className="section-label animate-fadeUp animate-delay-4">Performance por Curso</div>
      <div className="table-card animate-fadeUp animate-delay-4">
        <div className="table-header">
          <div className="table-title">Top Cursos por Volume de Leads</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{byCourse.length} cursos</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Curso</th>
              <th>Leads</th>
              <th>% do Total</th>
              <th style={{ minWidth: 160 }}>Distribuição</th>
            </tr>
          </thead>
          <tbody>
            {byCourse.map((c, i) => (
              <tr key={c.name}>
                <td><span className={`rank-badge rank-${i < 3 ? i + 1 : 'n'}`}>{i + 1}</span></td>
                <td style={{ color: 'var(--text)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                <td style={{ color: 'var(--accent2)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{c.leads}</td>
                <td style={{ color: 'var(--text2)' }}>{totalLeads > 0 ? ((c.leads / totalLeads) * 100).toFixed(1) : 0}%</td>
                <td>
                  <div className="bar-inline-track">
                    <div className="bar-inline-fill" style={{ width: `${(c.leads / maxCourse) * 100}%`, background: 'linear-gradient(90deg, #0EA5E9, #38BDF8)' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
