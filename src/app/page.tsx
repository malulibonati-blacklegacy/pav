'use client'
import { useState, useEffect, useCallback } from 'react'
import OverviewTab from '@/components/OverviewTab'
import GoogleTab from '@/components/GoogleTab'
import MetaTab from '@/components/MetaTab'
import { LeadRow, CostRow } from '@/lib/data'

type Tab = 'overview' | 'google' | 'meta'

interface DashData {
  leads: LeadRow[]
  googleCosts: CostRow[]
  metaCosts: CostRow[]
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setLoading(false)
    if (res.ok) { onLogin() }
    else { setErr('Senha incorreta. Tente novamente.') }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="brand">UNINASSAU</div>
          <div className="sub">Performance Dashboard</div>
        </div>
        <form onSubmit={submit}>
          <div className="login-field">
            <label>Senha de acesso</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
            />
          </div>
          <button className="btn-login" type="submit" disabled={loading || !pw}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
          {err && <div className="login-error">{err}</div>}
        </form>
      </div>
    </div>
  )
}

export default function Home() {
  const [auth, setAuth] = useState(false)
  const [checked, setChecked] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Date filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fonte, setFonte] = useState('all')
  const [plataforma, setPlataforma] = useState('all')

  useEffect(() => {
    // Check cookie
    const hasCookie = document.cookie.includes('auth=true')
    setAuth(hasCookie)
    setChecked(true)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data')
      const json = await res.json()
      // Restore date objects (serialized as strings from API)
      json.leads = json.leads.map((r: LeadRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      json.googleCosts = json.googleCosts.map((r: CostRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      json.metaCosts = json.metaCosts.map((r: CostRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      setData(json)
      setLastUpdate(new Date())
    } catch {
      console.error('Erro ao buscar dados')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (auth) fetchData()
  }, [auth, fetchData])

  if (!checked) return null
  if (!auth) return <LoginScreen onLogin={() => { setAuth(true) }} />

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: 'overview', icon: '◈', label: 'Visão Geral' },
    { id: 'google',   icon: '◉', label: 'Google Ads' },
    { id: 'meta',     icon: '◎', label: 'Meta Ads' },
  ]

  // Compute filter options
  const fontes = data ? ['all', ...Array.from(new Set(data.leads.map(r => r.fonte))).filter(Boolean).sort()] : ['all']
  const plataformas = data ? ['all', ...Array.from(new Set(data.leads.map(r => r.plataforma))).filter(Boolean).sort()] : ['all']

  // Apply filters
  const filterLeads = (rows: LeadRow[]) => rows.filter(r => {
    if (dateFrom && r.dateObj < new Date(dateFrom)) return false
    if (dateTo && r.dateObj > new Date(dateTo + 'T23:59:59')) return false
    if (fonte !== 'all' && r.fonte !== fonte) return false
    if (plataforma !== 'all' && r.plataforma !== plataforma) return false
    return true
  })
  const filterCosts = (rows: CostRow[]) => rows.filter(r => {
    if (dateFrom && r.dateObj < new Date(dateFrom)) return false
    if (dateTo && r.dateObj > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const filteredLeads = data ? filterLeads(data.leads) : []
  const filteredGoogle = data ? filterCosts(data.googleCosts) : []
  const filteredMeta = data ? filterCosts(data.metaCosts) : []

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="brand">UNINASSAU</div>
          <div className="sub">Pós ao Vivo</div>
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="sidebar-bottom">
          {lastUpdate && (
            <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.5 }}>
              <div className="live-dot">Conectado</div>
              <div style={{ marginTop: 4 }}>
                {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
          <button
            onClick={fetchData}
            style={{
              marginTop: 10, width: '100%', padding: '7px 0',
              background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
              borderRadius: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s'
            }}
            disabled={loading}
          >
            {loading ? '...' : '↻ Atualizar'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-title">
            {tab === 'overview' ? 'Visão Geral' : tab === 'google' ? 'Google Ads' : 'Meta Ads'}
          </div>
          <div className="topbar-filters">
            <div className="filter-group">
              <label>De</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Até</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {tab === 'overview' && (
              <>
                <div className="filter-group">
                  <label>Fonte</label>
                  <select value={fonte} onChange={e => setFonte(e.target.value)}>
                    {fontes.map(f => <option key={f} value={f}>{f === 'all' ? 'Todas' : f}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Plataforma</label>
                  <select value={plataforma} onChange={e => setPlataforma(e.target.value)}>
                    {plataformas.map(p => <option key={p} value={p}>{p === 'all' ? 'Todas' : p}</option>)}
                  </select>
                </div>
              </>
            )}
            {(dateFrom || dateTo || fonte !== 'all' || plataforma !== 'all') && (
              <button className="btn-reset" onClick={() => { setDateFrom(''); setDateTo(''); setFonte('all'); setPlataforma('all') }}>
                ✕ Limpar
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="page-content">
          {loading && !data ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 120 }} />
              ))}
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <OverviewTab leads={filteredLeads} googleCosts={filteredGoogle} metaCosts={filteredMeta} />
              )}
              {tab === 'google' && (
                <GoogleTab
                  leads={filteredLeads.filter(r => r.plataforma.toLowerCase().includes('google'))}
                  costs={filteredGoogle}
                />
              )}
              {tab === 'meta' && (
                <MetaTab
                  leads={filteredLeads.filter(r => r.plataforma.toLowerCase().includes('meta') || r.plataforma.toLowerCase().includes('facebook') || r.plataforma.toLowerCase().includes('instagram'))}
                  costs={filteredMeta}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
