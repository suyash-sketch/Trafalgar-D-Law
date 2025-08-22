import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { predictDigit } from './api'

function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState('')
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
      setFile(f)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setError('')
      setPrediction(null)
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
    try {
      const res = await predictDigit(file)
      // Expecting shape like { digit: number, probs?: number[] }
      setPrediction(res)
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
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const probs = prediction && Array.isArray(prediction.probs) ? prediction.probs : null

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Handwritten Digit Recognition</h1>
        <div className="muted">Backend: POST /predict</div>
      </div>

      <div className="panel uploader">
        <div className={`dropzone${isDragOver ? ' dragover' : ''}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
          <div>
            <p style={{ marginTop: 0, marginBottom: 8 }}>Drag & drop an image, or</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={onPick}>Choose file</button>
              {file && <span className="muted">{file.name}</span>}
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={onChange} />
            <p className="muted" style={{ marginTop: 10 }}>Tip: You can also paste an image (Ctrl/Cmd + V)</p>
          </div>
        </div>

        <div className="preview">
          {previewUrl ? (
            <img src={previewUrl} alt="preview" />
          ) : (
            <div className="muted">No image selected</div>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div className="row">
          <button className="btn" disabled={!canSubmit} onClick={onSubmit}>
            {isLoading ? 'Predicting...' : 'Predict digit'}
          </button>
          <button className="btn secondary" onClick={onReset} disabled={isLoading && !file}>Reset</button>
          {error && <span className="error">{error}</span>}
        </div>
        {prediction && (
          <div className="result">
            {'digit' in prediction ? (
              <div className="badge">Predicted: {prediction.digit}</div>
            ) : null}
            {probs ? (
              <div className="chart">
                {probs.map((p, i) => {
                  const pct = Math.max(0, Math.min(100, Math.round(p * 100)))
                  const isTop = i === (prediction.digit ?? -1)
                  return (
                    <div className="barRow" key={i}>
                      <div className="barLabel">{i}</div>
                      <div className="barTrack">
                        <div className={`barFill${isTop ? ' active' : ''}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="barPct">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* <div style={{ height: 12 }} />
      <div className="muted">Set VITE_API_BASE_URL in .env if your backend runs elsewhere.</div> */}
    </div>
  )
}

export default App
