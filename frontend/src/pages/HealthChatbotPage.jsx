import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, AlertCircle, ScanLine } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const QUICK_PROMPTS = [
  { label: 'What is Melanoma?',         text: 'What is melanoma and how dangerous is it?' },
  { label: 'High Risk next steps',      text: 'My scan came back High Risk. What should I do next?' },
  { label: 'ABCDE rule explained',      text: 'Explain the ABCDE rule for identifying skin cancer' },
  { label: 'Protect from UV damage',    text: 'How can I protect my skin from UV damage daily?' },
  { label: 'When to see a doctor?',     text: 'When should I urgently see a dermatologist?' },
  { label: 'What causes skin lesions?', text: 'What are the most common causes of skin lesions?' },
]

const RISK_COLOR = {
  'High Risk':     { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/30'     },
  'Moderate Risk': { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30'   },
  'Low Risk':      { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
}

export default function HealthChatbotPage() {
  const { token } = useAuth()
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [history,  setHistory]  = useState([])
  const [lastScan, setLastScan] = useState(null)

  // KEY FIX: scroll only the chat box, NOT the whole page
  const chatBoxRef = useRef(null)
  const inputRef   = useRef(null)

  // Fetch last scan for context
  useEffect(() => {
    if (!token) return
    axios.get(`${API}/user/scans`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.data?.length > 0) setLastScan(r.data[0]) })
      .catch(() => {})
  }, [token])

  // Greeting message
  useEffect(() => {
    const greeting = lastScan
      ? `👋 Hi! I'm your DermAssist skin health assistant.\n\nI can see your latest scan showed **${lastScan.diagnosis_name}** with **${lastScan.risk_level}**.\n\nAsk me anything about your results, what they mean, or what steps to take next.`
      : `👋 Hi! I'm your DermAssist skin health assistant.\n\nI can help you with:\n• Understanding your scan results\n• Skin cancer & lesion education\n• When to see a dermatologist\n• Sun protection & skin care tips\n\nWhat would you like to know?`
    setMessages([{
      role: 'assistant',
      content: greeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
  }, [lastScan])

  // KEY FIX: scroll ONLY the chat box div, not window
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim()
    if (!userMsg || loading) return
    setInput('')
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setMessages(m => [...m, { role: 'user', content: userMsg, time: timeStr }])
    setLoading(true)

    const scanContext = lastScan
      ? ` [User's latest scan: ${lastScan.diagnosis_name}, ${lastScan.risk_level}, ${Math.round((lastScan.confidence_score || 0) * 100)}% confidence]`
      : ''

    try {
      const res = await axios.post(
        `${API}/chat`,
        { message: userMsg + scanContext, history, category: 'skin' },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      )
      setHistory(res.data.history || [])
      setMessages(m => [...m, {
        role: 'assistant',
        content: res.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch (err) {
      // Show the actual backend error message so user/dev can debug
      const detail = err?.response?.data?.detail || err?.message || 'Unknown error'
      setMessages(m => [...m, {
        role: 'assistant',
        content: `⚠️ Error: ${detail}\n\nTroubleshooting:\n1. Is uvicorn running on port 8000?\n2. Check your backend terminal for error details\n3. Make sure ANTHROPIC_API_KEY in .env is valid (get a fresh key from console.anthropic.com)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    // KEY FIX: entire page layout uses flex column with fixed height
    // so the chat box scrolls internally, not the page
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto px-4 py-6 overflow-hidden">

      {/* Header — fixed, doesn't scroll */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Skin Health Assistant</h1>
            <p className="text-xs text-gray-500 dark:text-[#6b8fc2]">Powered by Claude AI · Focused on your skin health</p>
          </div>
        </div>

        {lastScan && (
          <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${RISK_COLOR[lastScan.risk_level]?.bg || 'bg-blue-500/10'} ${RISK_COLOR[lastScan.risk_level]?.border || 'border-blue-500/20'}`}>
            <ScanLine className={`w-3.5 h-3.5 flex-shrink-0 ${RISK_COLOR[lastScan.risk_level]?.text || 'text-blue-400'}`} />
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Chat is aware of your latest scan: <strong>{lastScan.diagnosis_name}</strong>
              {' · '}<span className={RISK_COLOR[lastScan.risk_level]?.text}>{lastScan.risk_level}</span>
            </p>
          </div>
        )}
      </motion.div>

      {/* Chat card — takes remaining height, scrolls internally */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#0d1f3c] rounded-2xl border border-gray-200 dark:border-[#1a3260] shadow-sm overflow-hidden">

        {/* Messages area — KEY: overflow-y-auto with flex-1 min-h-0 */}
        <div
          ref={chatBoxRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-600 to-cyan-500'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : msg.error
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-tl-sm'
                        : 'bg-gray-100 dark:bg-[#091629] text-gray-800 dark:text-gray-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-[#091629] px-3.5 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-[#1a3260] flex gap-2 flex-wrap flex-shrink-0">
          {QUICK_PROMPTS.slice(0, 3).map((q, i) => (
            <button key={i} onClick={() => sendMessage(q.text)} disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border border-blue-100 dark:border-blue-800/50 disabled:opacity-50">
              {q.label}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-gray-100 dark:border-[#1a3260] flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about your scan, skin conditions, next steps..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1a3260] bg-gray-50 dark:bg-[#091629] text-gray-900 dark:text-white placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:opacity-50"
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl text-white transition disabled:opacity-40 flex items-center gap-2 text-sm font-medium flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* More quick prompts — below card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="mt-3 flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.slice(3).map((q, i) => (
            <button key={i} onClick={() => sendMessage(q.text)} disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#0d1f3c] text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition border border-gray-200 dark:border-[#1a3260] disabled:opacity-50">
              {q.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 flex-shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          For <strong>educational purposes only</strong>. Always consult a dermatologist for medical decisions. Emergencies: <strong>112</strong>.
        </p>
      </motion.div>
    </div>
  )
}