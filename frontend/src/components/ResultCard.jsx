import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  AlertCircle, CheckCircle, AlertTriangle, Phone, Calendar,
  Heart, HelpCircle, ChevronDown, ChevronUp, Activity, Microscope
} from 'lucide-react'

const ConfidenceTooltip = () => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block ml-1.5">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="text-white/50 hover:text-white/90 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl z-50 leading-relaxed border border-white/10">
          <p className="font-semibold mb-1.5 text-white">What is the confidence score?</p>
          <p className="text-gray-300 mb-2">How certain the AI is about this prediction.</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"/><span className="text-gray-300"><span className="text-white font-medium">Above 80%</span> — High confidence</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"/><span className="text-gray-300"><span className="text-white font-medium">60–80%</span> — Moderate confidence</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"/><span className="text-gray-300"><span className="text-white font-medium">Below 60%</span> — Retake photo</span></div>
          </div>
          <p className="mt-2 text-gray-500">Always consult a dermatologist.</p>
        </div>
      )}
    </div>
  )
}

const DIAGNOSIS_MESSAGES = {
  mel:   { headline: "This needs your immediate attention.", message: `Our AI has detected visual patterns strongly associated with Melanoma — the most serious form of skin cancer. The sooner you act, the better your outcome will be. Melanoma is highly treatable when caught early, but it can spread quickly if ignored. Please book an appointment with a dermatologist or oncologist within the next few days.`, action: "Book a dermatologist appointment immediately — within this week.", urgency: "high" },
  bcc:   { headline: "Please don't ignore this.", message: `The AI has identified characteristics consistent with Basal Cell Carcinoma — the most common skin cancer. The good news is that BCC rarely spreads to other parts of the body, and it is very treatable. However, left untreated it can cause significant local damage. You need to see a dermatologist soon.`, action: "See a dermatologist within the next 1–2 weeks.", urgency: "high" },
  akiec: { headline: "This is a warning sign — please take action.", message: `The AI has flagged patterns consistent with Actinic Keratosis — a precancerous lesion caused by long-term sun damage. It is not yet cancer, but it is a direct precursor. Think of this as your body giving you an early warning. Treatment at this stage is simple, quick, and highly effective.`, action: "Consult a dermatologist soon — treatment at this stage is simple.", urgency: "high" },
  scc:   { headline: "Medical attention is needed.", message: `The AI has detected patterns consistent with Squamous Cell Carcinoma — the second most common skin cancer. SCC can spread if left untreated, making early detection and treatment critical. It is highly treatable when caught early. Please see a dermatologist promptly for a proper evaluation.`, action: "See a dermatologist within 1–2 weeks for evaluation.", urgency: "high" },
  bkl:   { headline: "Probably nothing serious, but worth checking.", message: `The AI's analysis suggests this could be Benign Keratosis — a harmless, non-cancerous skin growth very common especially as we age. Most of the time this is nothing to worry about. That said, a quick dermatologist check will confirm it's benign and give you peace of mind.`, action: "A routine dermatology checkup within the next month is recommended.", urgency: "medium" },
  df:    { headline: "Low concern, but a checkup is a good idea.", message: `The AI detected patterns consistent with a Dermatofibroma — a benign fibrous nodule that is almost always harmless. These are very common and rarely require any treatment. However, since skin conditions can sometimes resemble each other, it is always a good idea to have a dermatologist confirm this.`, action: "Schedule a routine checkup when convenient — no rush, but don't skip it.", urgency: "medium" },
  vasc:  { headline: "Likely harmless, but keep an eye on it.", message: `The AI identified visual features consistent with a Vascular Lesion — which includes common, benign conditions like cherry angiomas or hemangiomas. The vast majority are completely harmless. We recommend showing this to a dermatologist at your next checkup, especially if the lesion has recently changed.`, action: "Mention this to a dermatologist at your next routine visit.", urgency: "medium" },
  nv:    { headline: "You're in the clear — nothing to worry about.", message: `Great news! The AI has analyzed your image and the results look reassuring. The lesion appears to be a Melanocytic Nevus — a common, ordinary mole. This is one of the most benign findings possible. Just continue wearing sunscreen, avoid excessive sun exposure, and do a self-check every few months.`, action: "No action needed. Continue regular self-checks and use sunscreen.", urgency: "low" },
}

const URGENCY_CONFIG = {
  high:   { gradient: 'from-red-600 to-rose-600',     bg: 'bg-red-50 dark:bg-red-950/20',     border: 'border-red-200 dark:border-red-900/50',     barColor: '#ef4444', icon: AlertCircle,   badgeBg: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',     actionBg: 'bg-red-600',     riskLabel: 'High Risk',     riskDot: 'bg-red-500' },
  medium: { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/50', barColor: '#f59e0b', icon: AlertTriangle, badgeBg: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', actionBg: 'bg-amber-500', riskLabel: 'Moderate Risk', riskDot: 'bg-amber-400' },
  low:    { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900/50', barColor: '#10b981', icon: CheckCircle,   badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', actionBg: 'bg-emerald-600', riskLabel: 'Low Risk', riskDot: 'bg-emerald-500' },
}

const NAME_MAP = {
  mel: 'Melanoma', bcc: 'Basal Cell Carcinoma', akiec: 'Actinic Keratosis',
  bkl: 'Benign Keratosis', df: 'Dermatofibroma', nv: 'Melanocytic Nevus', vasc: 'Vascular Lesion',
  MEL: 'Melanoma', BCC: 'Basal Cell Carcinoma', AK: 'Actinic Keratosis',
  SCC: 'Squamous Cell Carcinoma', BKL: 'Benign Keratosis',
  DF: 'Dermatofibroma', NV: 'Melanocytic Nevus', VASC: 'Vascular Lesion',
}

const ResultCard = ({ result }) => {
  const [showAllScores, setShowAllScores] = useState(false)

  const isUncertain = result.diagnosis === 'unk' || result.diagnosis === 'uncertain' ||
                      (result.confidence !== undefined && result.confidence < 0.20)

  if (isUncertain) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="my-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
          <div className="bg-gray-600 dark:bg-gray-700 px-6 py-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Analysis Incomplete</p>
              <h2 className="text-white text-lg font-bold mt-0.5">Could not analyse this image confidently</h2>
            </div>
          </div>
          <div className="p-6 space-y-4 bg-white dark:bg-gray-800">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-amber-800 dark:text-amber-400 font-semibold text-sm mb-1">Why did this happen?</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">The AI model is not confident enough about this image. This happens with blurry photos, poor lighting, or images that don't show the lesion clearly.</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-blue-800 dark:text-blue-400 font-semibold text-sm mb-2">Tips for better results:</p>
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1.5">
                {['Use natural daylight — avoid flash', 'Hold camera 5–10 cm from the lesion', 'Make sure the lesion fills most of the frame', 'Keep the camera steady to avoid blur'].map(t => (
                  <li key={t} className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const diagRaw       = (result.diagnosis || 'nv').toLowerCase()
  const diagKey       = diagRaw === 'ak' ? 'akiec' : diagRaw === 'scc' ? 'scc' : ['mel','bcc','akiec','bkl','df','nv','vasc'].includes(diagRaw) ? diagRaw : 'nv'
  const diagnosisInfo = DIAGNOSIS_MESSAGES[diagKey] || DIAGNOSIS_MESSAGES['nv']
  const backendRisk   = result.risk_level || ''
  const urgency       = backendRisk === 'High Risk' ? 'high' : backendRisk === 'Moderate Risk' ? 'medium' : backendRisk === 'Low Risk' ? 'low' : diagnosisInfo.urgency
  const config        = URGENCY_CONFIG[urgency] || URGENCY_CONFIG['medium']
  const Icon          = config.icon
  const confidence    = (result.confidence * 100).toFixed(1)
  const diagnosisName = result.diagnosis_name || NAME_MAP[result.diagnosis] || result.diagnosis
  const confLevel     = parseFloat(confidence) >= 80 ? 'high' : parseFloat(confidence) >= 60 ? 'medium' : 'low'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="my-6">
      <div className={`rounded-2xl border ${config.border} overflow-hidden shadow-xl`}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${config.gradient} px-6 py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Analysis Complete</p>
                <h2 className="text-white text-lg font-bold mt-0.5 leading-tight">{diagnosisInfo.headline}</h2>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center justify-end gap-1">
                <p className="text-white/70 text-xs">Confidence</p>
                <ConfidenceTooltip />
              </div>
              <p className="text-white text-3xl font-black leading-none mt-0.5">{confidence}%</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={`${config.bg} p-6 space-y-5`}>

          {/* Diagnosis + risk badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm">
              <Microscope className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">{diagnosisName}</span>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-xs ${config.badgeBg}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${config.riskDot} animate-pulse`} />
              {config.riskLabel}
            </span>
          </div>

          {/* Confidence bar */}
          <div>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className="font-medium">AI Confidence Score</span>
              <span className="font-bold">{confidence}%</span>
            </div>
            <div className="w-full bg-white/60 dark:bg-gray-700/60 rounded-full h-2 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${confidence}%` }} transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} className="h-2 rounded-full" style={{ backgroundColor: config.barColor }} />
            </div>
            <div className="mt-2">
              {confLevel === 'high'   && <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">High confidence — result is reliable</span>}
              {confLevel === 'medium' && <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">Moderate confidence — consult a doctor to confirm</span>}
              {confLevel === 'low'    && <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">Low confidence — please retake with better lighting</span>}
            </div>
          </div>

          {/* Low confidence warning */}
          {parseFloat(confidence) < 65 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 dark:text-amber-400 font-semibold text-sm">Low confidence result</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5 leading-relaxed">The AI is not very certain. Try retaking the photo in good natural light with the lesion filling most of the frame.</p>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{diagnosisInfo.message}</p>
          </div>

          {/* Action */}
          <div className={`${config.actionBg} rounded-xl p-4 flex items-start gap-3 text-white`}>
            {urgency === 'high' ? <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" /> : urgency === 'medium' ? <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-sm">Recommended Action</p>
              <p className="text-sm mt-0.5 opacity-90">{diagnosisInfo.action}</p>
            </div>
          </div>

          {/* All scores */}
          {result.all_scores && Object.keys(result.all_scores).length > 0 && (
            <div>
              <button onClick={() => setShowAllScores(v => !v)} className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" />All class probabilities</div>
                {showAllScores ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              <AnimatePresence>
                {showAllScores && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2.5">
                      {Object.entries(result.all_scores).sort((a, b) => b[1] - a[1]).map(([cls, score], i) => {
                        const pct = Math.round(score * 100)
                        const isTop = i === 0
                        return (
                          <div key={cls}>
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className={`font-medium ${isTop ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{NAME_MAP[cls] || cls}</span>
                              <span className={`font-bold ${isTop ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }} className="h-1.5 rounded-full" style={{ backgroundColor: isTop ? config.barColor : '#94a3b8' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
            This is an AI-based screening tool, not a medical diagnosis. Always consult a qualified dermatologist for professional evaluation and treatment decisions.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default ResultCard