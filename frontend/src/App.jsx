import { useState, useRef } from 'react'
import { predictDigit } from './api'
import CanvasBoard from './CanvasBoard'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('draw') // 'draw' or 'upload'
  const [prediction, setPrediction] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const handlePredict = async (file) => {
    if (!file) return

    setIsLoading(true)
    setError('')
    setPrediction(null)

    try {
      const res = await predictDigit(file)
      setPrediction(res)
    } catch (err) {
      setError(err.message || 'Prediction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const onCanvasPredict = async () => {
    if (!canvasRef.current) return
    const blob = await canvasRef.current.getBlob()
    if (blob) {
      handlePredict(blob)
    }
  }

  const onCanvasClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear()
      setPrediction(null)
      setError('')
    }
  }

  const onFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
      setPrediction(null)
      setError('')
      handlePredict(file)
    }
  }

  const resetUpload = () => {
    setPreviewUrl(null)
    setPrediction(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col items-center py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Digit Recognition</h1>
        <p className="text-gray-500 mt-2">Draw a digit or upload an image</p>
      </header>

      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'draw'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => { setActiveTab('draw'); setPrediction(null); setError(''); }}
          >
            Draw
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => { setActiveTab('upload'); setPrediction(null); setError(''); }}
          >
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center min-h-[350px]">

          {activeTab === 'draw' && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <CanvasBoard ref={canvasRef} />
              <div className="flex gap-3 w-full">
                <button
                  onClick={onCanvasClear}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={onCanvasPredict}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Thinking...' : 'Predict'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center w-full h-full space-y-6">
              {!previewUrl ? (
                <div
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm text-gray-500">Click to upload image</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileUpload}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center w-full space-y-4">
                  <div className="relative w-48 h-48 bg-black rounded-lg overflow-hidden shadow-inner">
                    <img
                      src={previewUrl}
                      alt="Upload preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-sm text-gray-500 hover:text-black underline"
                  >
                    Upload different image
                  </button>
                  {isLoading && <p className="text-sm text-gray-500 animate-pulse">Analyzing...</p>}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg w-full text-center">
              {error}
            </div>
          )}

          {/* Prediction Result */}
          {prediction && !isLoading && (
            <div className="mt-6 w-full pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Prediction</span>
                <span className="text-4xl font-bold text-black">{prediction.digit}</span>
              </div>

              {prediction.probs && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Confidence</p>
                  {prediction.probs.map((prob, idx) => {
                    if (prob < 0.01) return null // Hide very low probabilities
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="w-3 font-mono text-gray-500">{idx}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-600">{Math.round(prob * 100)}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-gray-400 text-sm">
        Simple Digit Recognizer
      </footer>
    </div>
  )
}

export default App