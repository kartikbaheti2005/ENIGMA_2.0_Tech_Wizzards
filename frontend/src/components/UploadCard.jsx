import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, X, Camera, SwitchCamera, RefreshCw, ZoomIn } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MODES = [
  { id: 'upload', label: 'Upload File', icon: Upload },
  { id: 'camera', label: 'Use Camera', icon: Camera },
]

const UploadCard = ({ onImageSelect, isLoading }) => {
  const [mode,      setMode]      = useState('upload')
  const [preview,   setPreview]   = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const streamRef    = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError,  setCameraError]  = useState(null)
  const [facingMode,   setFacingMode]   = useState('environment')
  const [flashActive,  setFlashActive]  = useState(false)
  const [capturing,    setCapturing]    = useState(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const startCamera = useCallback(async (facing = facingMode) => {
    setCameraError(null)
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err) {
      let msg = 'Camera access denied.'
      if (err.name === 'NotFoundError')    msg = 'No camera found on this device.'
      if (err.name === 'NotAllowedError')  msg = 'Camera permission denied. Allow access in browser settings.'
      if (err.name === 'NotReadableError') msg = 'Camera is already in use by another app.'
      setCameraError(msg)
    }
  }, [facingMode, stopCamera])

  useEffect(() => {
    if (mode === 'camera' && !preview) startCamera()
    return () => { if (mode !== 'camera') stopCamera() }
  }, [mode]) // eslint-disable-line

  useEffect(() => () => stopCamera(), [stopCamera])

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setCapturing(true)
    setFlashActive(true)
    await new Promise(r => setTimeout(r, 120))
    setFlashActive(false)
    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      const file   = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const dataURL = canvas.toDataURL('image/jpeg', 0.92)
      setPreview(dataURL)
      onImageSelect(file)
      stopCamera()
      setCapturing(false)
    }, 'image/jpeg', 0.92)
  }

  const handleFileChange = (file) => {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) return
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
    onImageSelect(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files[0])
  }

  const clearAll = () => {
    setPreview(null)
    onImageSelect(null)
    setCameraError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (mode === 'camera') startCamera()
  }

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return
    setPreview(null)
    onImageSelect(null)
    setCameraError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (newMode !== 'camera') stopCamera()
    setMode(newMode)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-[#0d1f3c] rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-[#1a3260]"
    >
      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-0 text-center">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
          Upload Skin Lesion Image
        </h2>
        <p className="text-sm text-gray-400 dark:text-[#6b8fc2] mb-6">
          Upload a photo or capture one live with your camera
        </p>

        {/* Mode Tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-[#091629] p-1 mb-6">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleModeSwitch(id)}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === id
                  ? 'bg-white dark:bg-[#1a3260] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-[#4a6a9a] hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 pb-8">
        <AnimatePresence mode="wait">

          {/* ── PREVIEW ── */}
          {preview ? (
            <motion.div key="preview"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="relative rounded-xl overflow-hidden bg-black">
                <img src={preview} alt="Preview" className="w-full h-72 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <button onClick={clearAll} disabled={isLoading}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-xs font-medium drop-shadow">
                    {mode === 'camera' ? 'Photo captured' : 'File selected'} — ready for analysis
                  </span>
                </div>
              </div>
              <button onClick={clearAll} disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 dark:border-[#1a3260] rounded-xl text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                <RefreshCw className="w-4 h-4" />
                {mode === 'camera' ? 'Retake Photo' : 'Choose Different Image'}
              </button>
            </motion.div>

          ) : mode === 'upload' ? (

            /* ── UPLOAD MODE ── */
            <motion.div key="upload"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}
            >
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                className={`rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 border-dashed scale-[1.01]'
                    : 'bg-gray-50 dark:bg-[#091629] border-2 border-dashed border-gray-200 dark:border-[#1a3260] hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-600 dark:hover:bg-blue-900/10'
                }`}
              >
                <motion.div animate={{ y: isDragging ? -6 : 0 }} transition={{ duration: 0.2 }}>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Upload className={`w-12 h-12 transition-colors duration-200 ${isDragging ? 'text-blue-500' : 'text-gray-300 dark:text-[#2a4a6a]'}`} />
                  </div>
                  <p className="text-lg font-semibold text-gray-600 dark:text-[#6b8fc2] mb-1">
                    {isDragging ? 'Drop it here!' : 'Drag and drop your image here'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-[#4a6a9a] mb-6">or</p>
                  <button
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                    className="px-8 py-3 rounded-xl text-white text-sm font-bold transition-all"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}
                  >
                    Choose File
                  </button>
                  <p className="text-xs text-gray-400 dark:text-[#4a6a9a] mt-4">
                    Supported formats: <span className="text-blue-400">JPEG, PNG</span> (Max 10MB)
                  </p>
                </motion.div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png"
                onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" />
            </motion.div>

          ) : (

            /* ── CAMERA MODE ── */
            <motion.div key="camera"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {cameraError ? (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-center space-y-3">
                  <Camera className="w-10 h-10 mx-auto text-red-400" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{cameraError}</p>
                  <button onClick={() => startCamera()}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />

                  {/* Flash */}
                  <AnimatePresence>
                    {flashActive && (
                      <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }} className="absolute inset-0 bg-white" />
                    )}
                  </AnimatePresence>

                  {/* Scan overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      {['top-4 left-4 border-t-2 border-l-2', 'top-4 right-4 border-t-2 border-r-2',
                        'bottom-4 left-4 border-b-2 border-l-2', 'bottom-4 right-4 border-b-2 border-r-2',
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-6 h-6 border-blue-400 rounded-sm ${cls}`} />
                      ))}
                      <motion.div
                        className="absolute left-4 right-4 h-px bg-blue-400/60"
                        style={{ boxShadow: '0 0 8px 2px rgba(96,165,250,0.5)' }}
                        animate={{ top: ['20%', '80%', '20%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  )}

                  {/* Loading */}
                  {!cameraActive && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full" />
                      <p className="text-white/70 text-xs">Starting camera…</p>
                    </div>
                  )}

                  {/* Flip button */}
                  {cameraActive && (
                    <button onClick={flipCamera}
                      className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition">
                      <SwitchCamera className="w-5 h-5" />
                    </button>
                  )}

                  {/* Camera label */}
                  {cameraActive && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white text-[10px] font-medium tracking-wide uppercase">
                        {facingMode === 'user' ? 'Front Cam' : 'Rear Cam'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Capture button */}
              {!cameraError && (
                <div className="flex items-center justify-center">
                  <motion.button onClick={capturePhoto}
                    disabled={!cameraActive || capturing || isLoading}
                    whileTap={{ scale: 0.93 }}
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${
                      cameraActive && !capturing
                        ? 'border-blue-500 bg-white hover:bg-blue-50 shadow-lg shadow-blue-200 cursor-pointer'
                        : 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    {capturing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full transition-colors ${cameraActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    )}
                  </motion.button>
                </div>
              )}

              <p className="text-center text-xs text-gray-400 dark:text-[#4a6a9a]">
                💡 Hold steady, ensure good lighting, keep the lesion centred
              </p>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom info bar ── */}
      {!preview && (
        <div className="px-8 pb-6 border-t border-gray-100 dark:border-[#1a3260]">
          <div className="flex items-center justify-center gap-6 pt-4">
            {[['🔒', 'Private & secure'], ['⚡', 'Results in seconds'], ['📱', 'Works on all devices']].map(item => (
              <div key={item[1]} className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#4a6a9a]">
                <span>{item[0]}</span><span>{item[1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default UploadCard