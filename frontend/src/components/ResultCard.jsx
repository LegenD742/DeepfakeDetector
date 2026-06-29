const VERDICT_STYLES = {
  authentic: {
    bg: '#f0faf4',
    border: '#b6dfc8',
    color: '#2a7a50',
    icon: '✓',
  },
  suspicious: {
    bg: '#fffbf0',
    border: '#f0d080',
    color: '#8a6000',
    icon: '?',
  },
  ai_generated: {
    bg: '#fff2f2',
    border: '#f5c0c0',
    color: '#a02020',
    icon: '✕',
  },
}

export default function ResultCard({ result }) {
  const { verdict, label, score, processing_ms } = result
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.suspicious
  const confidence = Math.round(
    verdict === 'authentic' ? (1 - score) * 100 : score * 100
  )

  return (
    <div
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: style.border,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color: style.color,
          flexShrink: 0,
        }}
      >
        {style.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 500, fontSize: 17, color: style.color, marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ fontSize: 13, color: '#888' }}>
          {confidence}% confidence · {processing_ms}ms
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 28, fontWeight: 600, color: style.color }}>
          {Math.round(score * 100)}
        </p>
        <p style={{ fontSize: 12, color: '#aaa' }}>risk score</p>
      </div>
    </div>
  )
}
