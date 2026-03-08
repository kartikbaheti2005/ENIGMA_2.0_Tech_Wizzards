import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Shield, RefreshCw, Loader2, Activity, ScanLine, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = 'http://localhost:8000'

const RISK_STYLE = {
  High:     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700',
  Moderate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700',
  Low:      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700',
}

const SKIN_ALERTS = [
  { disease: 'Fungal Skin Infections',  region: 'Coastal & humid areas',       risk: 'High',     icon: '🍄', season: 'Monsoon (Jun–Oct)',  advice: 'Keep skin dry. Use antifungal powder. Avoid tight clothing in humid weather.',           related: ['unk'] },
  { disease: 'Actinic Keratosis',       region: 'All sun-exposed regions',      risk: 'High',     icon: '☀️', season: 'Summer (Mar–Jun)',   advice: 'Apply SPF 50+ sunscreen daily. Reapply every 2 hours outdoors.',                        related: ['akiec'] },
  { disease: 'Melanoma Risk Season',    region: 'Pan India (peak UV months)',   risk: 'High',     icon: '🔴', season: 'April–August',       advice: 'Avoid peak sun hours (10am–4pm). Cover exposed skin. Get moles checked annually.',       related: ['mel'] },
  { disease: 'Dermatitis Outbreaks',    region: 'North India (dry winters)',    risk: 'Moderate', icon: '⚠️', season: 'Winter (Nov–Feb)',   advice: 'Moisturize twice daily. Avoid harsh soaps. Use hypoallergenic products.',               related: ['bkl', 'df'] },
  { disease: 'Vascular Skin Lesions',   region: 'Elderly population, pan India', risk: 'Low',    icon: '🫀', season: 'Year-round',          advice: 'Monitor for changes in size, color, or bleeding. Regular skin checks recommended.',      related: ['vasc'] },
]

export default function OutbreakPage() {
  const { token } = useAuth()
  const [alerts,    setAlerts]    = useState(null)
  const [trends,    setTrends]    = useState(null)
  const [lastScan,  setLastScan]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('alerts')

  const fetchData = async () => {
    setLoading(true)
    try {
      const calls = [
        axios.get(`${API}/outbreak/alerts`).catch(() => null),
        axios.get(`${API}/outbreak/skin-trends`).catch(() => null),
      ]
      if (token) calls.push(axios.get(`${API}/user/scans`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null))
      const [a, t, s] = await Promise.all(calls)
      if (a) setAlerts(a.data)
      if (t) setTrends(t.data)
      if (s?.data?.length > 0) setLastScan(s.data[0])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Check if any alert is relevant to user's last scan
  const relevantAlert = lastScan
    ? SKIN_ALERTS.find(a => a.related.includes(lastScan.predicted_label))
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Skin Disease Alerts</h1>
              <p className="text-sm text-gray-500 dark:text-[#6b8fc2]">Seasonal & regional skin condition risks across India</p>
            </div>
          </div>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-[#1a3260] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0d1f3c] transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Personalised alert if relevant to their scan */}
      {relevantAlert && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 mb-1">
            <ScanLine className="w-4 h-4 text-red-500" />
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Relevant to your last scan ({lastScan.diagnosis_name})</p>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300">{relevantAlert.advice}</p>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'alerts', label: 'Skin Alerts', icon: AlertTriangle }, { key: 'trends', label: 'Platform Trends', icon: TrendingUp }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              tab === t.key
                ? 'text-white border-transparent'
                : 'bg-white dark:bg-[#0d1f3c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#1a3260] hover:bg-gray-50 dark:hover:bg-[#091629]'
            }`}
            style={tab === t.key ? { background: 'linear-gradient(135deg, #f97316, #ef4444)' } : {}}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {tab === 'alerts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {SKIN_ALERTS.map((alert, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0d1f3c] border border-gray-200 dark:border-[#1a3260] shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{alert.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{alert.disease}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-400 dark:text-[#4a6a9a]">{alert.region}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_STYLE[alert.risk]}`}>
                      {alert.risk} Risk
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-[#4a6a9a]">
                    <span>🗓 {alert.season}</span>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-[#091629]">
                    <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-300">{alert.advice}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 'trends' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1f3c] border border-gray-200 dark:border-[#1a3260] shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Most Scanned Conditions on DermAssist</h3>
                </div>
                {!trends || trends.total_scans === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No scan data yet. Be the first to run a scan!</p>
                ) : (
                  <div className="space-y-4">
                    {trends.trends?.map((t, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{t.name}</span>
                          <span className="text-gray-400 text-xs">{t.count} scans · {t.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-[#091629] rounded-full h-2.5">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${t.percentage}%` }}
                            transition={{ delay: i * 0.08, duration: 0.7, ease: 'easeOut' }}
                            className="h-2.5 rounded-full"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 dark:text-[#4a6a9a] pt-2 border-t border-gray-100 dark:border-[#1a3260]">
                      Based on {trends.total_scans} total scans on this platform
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}