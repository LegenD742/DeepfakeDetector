import { useRef, useState } from 'react'

const s = {
  zone: (drag) => ({
    border: `2px dashed ${drag ? '#555' : '#ccc'}`,
    borderRadius: 12,
    padding: '3rem 2rem',
    textAlign: 'center',
    cursor: 'pointer',
    background: drag ? '#f0f0ee' : '#fafaf8',
    transition: 'all 0.15s',
  }),
  icon: {
    fontSize: 36,
    marginBottom: 12,
    color: '#999',
    display: 'block',
  },
  label: {
    fontSize: 15,
    color: '#555',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: '#aaa',
  },
  btn: {
    marginTop: 16,
    padding: '8px 20px',
    border: '1px solid #ccc',
    borderRadius: 8,
    background: 'white',
    fontSize: 13,
    cursor: 'pointer',
    color: '#333',
  },
}

export default function UploadZone({ onFile }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)

  const handle = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onFile(file)
  }

  return (
    <div
      style={s.zone(drag)}
      onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
    >
      <span style={s.icon}>⬆</span>
      <p style={s.label}>Drop an image here</p>
      <p style={s.sub}>JPG, PNG, WEBP — max 20 MB</p>
      <button style={s.btn} onClick={(e) => e.stopPropagation() || ref.current.click()}>
        Browse files
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handle(e.target.files[0])}
      />
    </div>
  )
}
