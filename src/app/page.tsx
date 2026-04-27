'use client'
import { useState, useEffect, useCallback } from 'react'
import OverviewTab from '@/components/OverviewTab'
import GoogleTab from '@/components/GoogleTab'
import MetaTab from '@/components/MetaTab'
import { LeadRow, CostRow, GoogleCostRow, MetaCostRow } from '@/lib/data'
import { LOGO_B64 } from '@/lib/logo'

type Tab = 'overview' | 'google' | 'meta'
interface DashData {
  leads: LeadRow[]
  googleCosts: GoogleCostRow[]
  metaCosts: MetaCostRow[]
  googleCostsSimple: CostRow[]
  metaCostsSimple: CostRow[]
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)
const MetaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/>
  </svg>
)

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr('')
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    setLoading(false)
    if (res.ok) onLogin()
    else setErr('Senha incorreta. Tente novamente.')
  }
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <img src={LOGO_B64} alt="UNINASSAU" style={{ width: 200, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Performance Dashboard</div>
        </div>
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <div className="login-field">
            <label>Senha de acesso</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••••••" autoFocus />
          </div>
          <button className="btn-login" type="submit" disabled={loading || !pw}>{loading ? 'Entrando...' : 'Entrar →'}</button>
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fonte, setFonte] = useState('all')
  const [plataforma, setPlataforma] = useState('all')

  useEffect(() => { setAuth(document.cookie.includes('auth=true')); setChecked(true) }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data')
      const json = await res.json()
      json.leads = json.leads.map((r: LeadRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      json.googleCosts = json.googleCosts.map((r: GoogleCostRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      json.metaCosts = json.metaCosts.map((r: MetaCostRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      json.googleCostsSimple = json.googleCostsSimple.map((r: CostRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      json.metaCostsSimple = json.metaCostsSimple.map((r: CostRow) => ({ ...r, dateObj: new Date(r.dateObj) }))
      setData(json); setLastUpdate(new Date())
    } catch { console.error('Erro ao buscar dados') }
    setLoading(false)
  }, [])

  useEffect(() => { if (auth) fetchData() }, [auth, fetchData])

  if (!checked) return null
  if (!auth) return <LoginScreen onLogin={() => setAuth(true)} />

  const fontes = data ? ['all', ...Array.from(new Set(data.leads.map(r => r.fonte))).filter(Boolean).sort()] : ['all']
  const plataformas = data ? ['all', ...Array.from(new Set(data.leads.map(r => r.plataforma))).filter(Boolean).sort()] : ['all']

  const filterLeads = (rows: LeadRow[]) => rows.filter(r => {
    if (dateFrom) { const [y,m,d] = dateFrom.split('-').map(Number); if (r.dateObj < new Date(y,m-1,d)) return false }
    if (dateTo) { const [y,m,d] = dateTo.split('-').map(Number); if (r.dateObj > new Date(y,m-1,d,23,59,59)) return false }
    if (fonte !== 'all' && r.fonte !== fonte) return false
    if (plataforma !== 'all' && r.plataforma !== plataforma) return false
    return true
  })
  const filterCosts = <T extends { dateObj: Date }>(rows: T[]) => rows.filter(r => {
    if (dateFrom) { const [y,m,d] = dateFrom.split('-').map(Number); if (r.dateObj < new Date(y,m-1,d)) return false }
    if (dateTo) { const [y,m,d] = dateTo.split('-').map(Number); if (r.dateObj > new Date(y,m-1,d,23,59,59)) return false }
    return true
  })

  const filteredLeads = data ? filterLeads(data.leads) : []
  const filteredGoogle = data ? filterCosts(data.googleCosts) : []
  const filteredMeta = data ? filterCosts(data.metaCosts) : []
  const filteredGoogleSimple = data ? filterCosts(data.googleCostsSimple) : []
  const filteredMetaSimple = data ? filterCosts(data.metaCostsSimple) : []

  return (
    <div className="dashboard-layout">
      <aside style={{ width:220, flexShrink:0, background:'#0F1C2E', borderRight:'1px solid #1E2D45', display:'flex', flexDirection:'column', padding:'24px 0', position:'fixed', top:0, left:0, bottom:0, zIndex:100 }}>
        <div style={{ padding:'0 20px 24px', borderBottom:'1px solid #1E2D45', marginBottom:16 }}>
          <img src={LOGO_B64} alt="UNINASSAU" style={{ width:'100%', maxWidth:160, filter:'brightness(0) invert(1)' }} />
          <div style={{ fontSize:10, color:'#3D5070', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:6 }}>Pós ao Vivo</div>
        </div>
        {([
          { id:'overview', label:'Visão Geral', icon:<span style={{fontSize:16}}>◈</span> },
          { id:'google',   label:'Google Ads',  icon:<GoogleIcon /> },
          { id:'meta',     label:'Meta Ads',    icon:<MetaIcon /> },
        ] as {id:Tab,label:string,icon:React.ReactNode}[]).map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', color:tab===item.id?'#38BDF8':'#7A90B0', background:tab===item.id?'rgba(14,165,233,0.08)':'transparent', border:'none', width:'100%', textAlign:'left', cursor:'pointer', fontSize:13, fontWeight:500, fontFamily:'var(--font-body)', borderLeft:tab===item.id?'3px solid #0EA5E9':'3px solid transparent', transition:'all 0.15s' }}>
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
        <div style={{ marginTop:'auto', padding:'16px 20px 0', borderTop:'1px solid #1E2D45' }}>
          {lastUpdate && (
            <div style={{ fontSize:10, color:'#3D5070', lineHeight:1.5 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'#34D399', fontWeight:600, fontSize:11 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399' }} />Conectado
              </div>
              <div style={{ marginTop:4 }}>{lastUpdate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          )}
          <button onClick={fetchData} disabled={loading}
            style={{ marginTop:10, width:'100%', padding:'7px 0', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:6, color:'#38BDF8', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
            {loading ? '...' : '↻ Atualizar'}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title" style={{ color:'#0F1C2E', display:'flex', alignItems:'center', gap:8 }}>
            {tab==='overview'?'Visão Geral':tab==='google'?<><GoogleIcon/>Google Ads</>:<><MetaIcon/>Meta Ads</>}
          </div>
          <div className="topbar-filters">
            <div className="filter-group"><label>De</label><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></div>
            <div className="filter-group"><label>Até</label><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></div>
            {tab==='overview'&&<>
              <div className="filter-group"><label>Fonte</label><select value={fonte} onChange={e=>setFonte(e.target.value)}>{fontes.map(f=><option key={f} value={f}>{f==='all'?'Todas':f}</option>)}</select></div>
              <div className="filter-group"><label>Plataforma</label><select value={plataforma} onChange={e=>setPlataforma(e.target.value)}>{plataformas.map(p=><option key={p} value={p}>{p==='all'?'Todas':p}</option>)}</select></div>
            </>}
            {(dateFrom||dateTo||fonte!=='all'||plataforma!=='all')&&<button className="btn-reset" onClick={()=>{setDateFrom('');setDateTo('');setFonte('all');setPlataforma('all')}}>✕ Limpar</button>}
          </div>
        </div>
        <div className="page-content">
          {loading&&!data?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
              {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:120}}/>)}
            </div>
          ):<>
            {tab==='overview'&&<OverviewTab leads={filteredLeads} googleCosts={filteredGoogleSimple} metaCosts={filteredMetaSimple}/>}
            {tab==='google'&&<GoogleTab leads={filteredLeads.filter(r=>r.plataforma.toLowerCase().includes('google'))} costs={filteredGoogle}/>}
            {tab==='meta'&&<MetaTab leads={filteredLeads.filter(r=>r.plataforma.toLowerCase().includes('meta')||r.plataforma.toLowerCase().includes('facebook')||r.plataforma.toLowerCase().includes('instagram')||r.plataforma.toLowerCase()==='fb')} costs={filteredMeta}/>}
          </>}
        </div>
      </div>
    </div>
  )
}
