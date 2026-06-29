const SIGNALS = {
  fft: {
    label: 'Frequency analysis (FFT)',
    desc: 'AI images have unnaturally smooth frequency spectra',
  },
  ela: {
    label: 'Error level analysis (ELA)',
    desc: 'Manipulation leaves inconsistent compression residuals',
  },
  cnn: {
    label: 'Neural network (CNN)',
    desc: 'EfficientNet-B0 trained on 120k real and AI images',
  },
}

function barColor(v) {
  if (v < 0.35) return '#4caf7d'
  if (v < 0.60) return '#f0a500'
  return '#e05252'
}

export default function SignalBars({ signals }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(SIGNALS).map(([key, { label, desc }]) => {
        const val = signals[key]
        const pct = Math.round(val * 100)
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{label}</span>
              <span style={{ fontSize: 13, color: barColor(val), fontWeight: 500 }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: '#eee', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barColor(val),
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{desc}</p>
          </div>
        )
      })}
    </div>
  )
}
