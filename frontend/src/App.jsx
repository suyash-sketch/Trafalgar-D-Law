import { useEffect, useMemo, useRef, useState } from 'react'
import { predictDigit } from './api'
import './index.css'
function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState('')
  const [showResult, setShowResult] = useState(false)
  const inputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Support paste-to-upload from clipboard
  useEffect(() => {
    const onPaste = (e) => {
      if (!e.clipboardData) return
      const items = Array.from(e.clipboardData.items || [])
      const imgItem = items.find((it) => it.type && it.type.startsWith('image/'))
      if (imgItem) {
        const pastedFile = imgItem.getAsFile()
        if (pastedFile) {
          setError('')
          setPrediction(null)
          setShowResult(false)
          setFile(pastedFile)
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const canSubmit = useMemo(() => !!file && !isLoading, [file, isLoading])

  const onPick = () => inputRef.current?.click()
  const onChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setError('')
      setPrediction(null)
      setShowResult(false)
      setFile(f)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setError('')
      setPrediction(null)
      setShowResult(false)
      setFile(f)
    }
    setIsDragOver(false)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    if (!isDragOver) setIsDragOver(true)
  }
  const onDragLeave = () => setIsDragOver(false)

  const onSubmit = async () => {
    if (!file) return
    setIsLoading(true)
    setError('')
    setPrediction(null)
    setShowResult(false)
    try {
      const res = await predictDigit(file)
      setPrediction(res)
      setTimeout(() => setShowResult(true), 500)
    } catch (err) {
      setError(err?.message || 'Failed to predict')
    } finally {
      setIsLoading(false)
    }
  }

  const onReset = () => {
    setFile(null)
    setPreviewUrl('')
    setPrediction(null)
    setShowResult(false)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const probs = prediction && Array.isArray(prediction.probs) ? prediction.probs : null

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-6xl">
        {/* Header with glassmorphism */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Digit Recognition
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Upload a handwritten digit and watch our AI predict it with confidence scores
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Section */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              Upload Image
            </h2>
              
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group ${
                  isDragOver 
                    ? 'border-purple-400 bg-purple-500/20 scale-105' 
                    : 'border-white/30 hover:border-purple-400/50 hover:bg-white/5'
                }`}
                onDrop={onDrop} 
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave}
                onClick={onPick}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-white">
                      {file ? file.name : 'Drop your image here'}
                    </p>
                    <p className="text-slate-400 mt-2">
                      or click to browse • PNG, JPG, GIF up to 10MB
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      💡 Tip: You can also paste with Ctrl+V
                    </p>
                  </div>
                </div>
                
                {isDragOver && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center">
                    <div className="text-2xl font-bold text-white animate-bounce">Drop it! 🎯</div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-2xl animate-shake mt-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.332 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 my-8">
            <button
              className={`flex-1 relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              disabled={!canSubmit}
              onClick={onSubmit}
            >
              <div className="flex items-center justify-center gap-3 relative z-10">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Predict Digit
                  </>
                )}
              </div>
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 animate-pulse"></div>
              )}
            </button>

            <button
              onClick={onReset}
              disabled={isLoading && !file}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Preview Section */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Preview
            </h3>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[200px] flex items-center justify-center">
              {previewUrl ? (
                <div className="relative group">
                  <img 
                    src={previewUrl} 
                    alt="preview" 
                    className="max-w-full max-h-64 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-medium">No image selected</p>
                  <p className="text-sm text-slate-500 mt-1">Upload an image to see the preview</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            {(prediction || isLoading) && (
              <div className={`mt-8 transform transition-all duration-500 ${showResult ? 'scale-100 opacity-100' : 'scale-95 opacity-80'}`}>
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  AI Prediction
                </h3>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="text-lg font-medium animate-pulse">Analyzing your digit...</p>
                  </div>
                ) : prediction && (
                  <div className="space-y-6">
                    {/* Predicted Digit */}
                    {'digit' in prediction && (
                      <div className={`text-center transform transition-all duration-700 ${showResult ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <div className="inline-flex items-center gap-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl px-8 py-4">
                          <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent animate-bounce">
                            {prediction.digit}
                          </div>
                          <div>
                            <p className="text-sm text-slate-300">Predicted Digit</p>
                            <p className="text-lg font-semibold">
                              {probs ? `${Math.round(probs[prediction.digit] * 100)}% confidence` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Probability Chart */}
                    {probs && (
                      <div className={`space-y-3 transform transition-all duration-700 delay-300 ${showResult ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <h4 className="font-semibold text-slate-300 mb-4">Confidence Scores</h4>
                        {probs.map((prob, digit) => {
                          const percentage = Math.round(prob * 100)
                          const isHighest = digit === (prediction.digit ?? -1)
                          
                          return (
                            <div key={digit} className="flex items-center gap-4">
                              <div className="w-8 h-8 flex items-center justify-center font-bold text-slate-300 bg-white/10 rounded-lg">
                                {digit}
                              </div>
                              
                              <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ease-out ${
                                    isHighest 
                                      ? 'bg-gradient-to-r from-green-400 to-blue-500 shadow-lg shadow-green-500/50' 
                                      : 'bg-gradient-to-r from-slate-500 to-slate-400'
                                  }`}
                                  style={{ 
                                    width: showResult ? `${percentage}%` : '0%',
                                    transitionDelay: `${digit * 100}ms`
                                  }}
                                />
                              </div>
                              
                              <div className="w-12 text-right font-medium text-slate-300">
                                {percentage}%
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-400">
          <div className="inline-flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Powered by AI • Built with React
          </div>
        </footer>

      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </>
  )
}

export default App