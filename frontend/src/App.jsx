import { useState, useCallback } from 'react'
import UploadZone from './components/UploadZone'
import ResultCard from './components/ResultCard'
import SignalBars from './components/SignalBars'

const API = 'http://localhost:8000'

const s = {
  page: {
    minHeight: '100vh',
    background: '#f7f7f5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 1rem 4rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    color: '#111',
    letterSpacing: '-0.5px',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: '#888',
  },
  card: {
    background: 'white',
    borderRadius: 16,
    border: '1px solid #e8e8e6',
    padding: '1.75rem',
    width: '100%',
    maxWidth: 700,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#aaa',
    marginBottom: 12,
  },
  imageRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 8,
  },
  imgWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #eee',
    background: '#f5f5f3',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgLabel: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 6,
  },
  spinner: {
    display: 'inline-block',
    width: 20,
    height: 20,
    border: '2px solid #ddd',
    borderTopColor: '#555',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  analyzing: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '1rem',
    color: '#666',
    fontSize: 14,
  },
  resetBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '7px 16px',
    fontSize: 13,
    color: '#555',
    cursor: 'pointer',
    marginTop: 8,
  },
  error: {
    background: '#fff5f5',
    border: '1px solid #fcc',
    borderRadius: 10,
    padding: '1rem',
    color: '#c00',
    fontSize: 14,
  },
}

export default function App() {
  const [preview, setPreview]   = useState(null)
  const [elaImg, setElaImg]     = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleFile = useCallback(async (file) => {
    setResult(null)
    setElaImg(null)
    setError(null)

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setLoading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/analyze`, { method: 'POST', body: form })
      if (!res.ok) {
        const detail = (await res.json()).detail || 'Server error'
        throw new Error(detail)
      }
      const data = await res.json()
      setElaImg(data.ela_image)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = () => {
    setPreview(null)
    setElaImg(null)
    setResult(null)
    setError(null)
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>Deepfake detector</h1>
          <p style={s.sub}>FFT · ELA · CNN — no external API calls</p>
        </div>

        {!preview && (
          <div style={s.card}>
            <UploadZone onFile={handleFile} />
          </div>
        )}

        {preview && (
          <div style={s.card}>
            <p style={s.sectionLabel}>Image analysis</p>
            <div style={s.imageRow}>
              <div>
                <div style={s.imgWrap}>
                  <img src={preview} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <p style={s.imgLabel}>Original</p>
              </div>
              <div>
                <div style={s.imgWrap}>
                  {elaImg
                    ? <img src={elaImg} alt="ELA map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 12, color: '#ccc' }}>ELA map</span>
                  }
                </div>
                <p style={s.imgLabel}>Error level analysis</p>
              </div>
            </div>
            <button style={s.resetBtn} onClick={reset}>Analyse another image</button>
          </div>
        )}

        {loading && (
          <div style={s.card}>
            <div style={s.analyzing}>
              <div style={s.spinner} />
              Analysing image…
            </div>
          </div>
        )}

        {error && (
          <div style={{ ...s.card, padding: 0, background: 'none', border: 'none' }}>
            <div style={s.error}>{error}</div>
          </div>
        )}

        {result && !loading && (
          <div style={s.card}>
            <p style={s.sectionLabel}>Verdict</p>
            <ResultCard result={result} />

            <div style={{ marginTop: '1.75rem' }}>
              <p style={s.sectionLabel}>Signal breakdown</p>
              <SignalBars signals={result.signals} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
