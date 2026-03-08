import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, User, Stethoscope, ArrowRight, LogIn } from 'lucide-react'

export default function RoleSelectPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden
                    bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50
                    dark:bg-none dark:bg-[#060d1f]">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
        />
      </div>

      <div className="w-full max-w-2xl relative z-10">

        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-center mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.06, rotate: -4 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
          >
            <Activity className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            DermAssist AI
          </h1>
          <p className="text-gray-500 dark:text-blue-300/60 mt-2 text-base font-medium">
            How are you joining us today?
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-5">

          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            className="group flex flex-col items-center text-center p-8 rounded-3xl border-2
                       border-gray-200 dark:border-gray-700
                       bg-white/80 dark:bg-[#0d1f3c]/80 backdrop-blur-xl shadow-lg
                       hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-900/20
                       transition-all duration-200 cursor-pointer"
            style={{ boxShadow: '0 8px 32px rgba(59,130,246,0.08)' }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400
                            flex items-center justify-center shadow-lg mb-5
                            group-hover:scale-110 transition-transform duration-200">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Patient</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Scan your skin with AI, find verified dermatologists, and book appointments instantly.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-2xl
                             bg-blue-600 text-white group-hover:bg-blue-700 transition-colors shadow-md">
              Get Started <ArrowRight className="w-4 h-4" />
            </span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register/doctor')}
            className="group flex flex-col items-center text-center p-8 rounded-3xl border-2
                       border-gray-200 dark:border-gray-700
                       bg-white/80 dark:bg-[#0d1f3c]/80 backdrop-blur-xl shadow-lg
                       hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20
                       transition-all duration-200 cursor-pointer"
            style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.08)' }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400
                            flex items-center justify-center shadow-lg mb-5
                            group-hover:scale-110 transition-transform duration-200">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Doctor</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Register your practice and connect with patients who need dermatology care near you.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-2xl
                             bg-emerald-600 text-white group-hover:bg-emerald-700 transition-colors shadow-md">
              Join as Doctor <ArrowRight className="w-4 h-4" />
            </span>
          </motion.button>

        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center mt-8 text-sm"
        >
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            <LogIn className="w-4 h-4" /> Already have an account? Sign in
          </button>
        </motion.div>

      </div>
    </div>
  )
}