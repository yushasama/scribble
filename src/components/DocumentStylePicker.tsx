import { useState, type ReactElement } from 'react'
import { type DocumentPresentation, validBackgroundImage } from '../lib/typeset/settings'
import './DocumentStylePicker.css'

interface DocumentStylePickerProps { value: DocumentPresentation; onChange: (value: DocumentPresentation) => void }

export function DocumentStylePicker({ value, onChange }: DocumentStylePickerProps): ReactElement {
  const [error, setError] = useState('')
  const background = (update: Partial<DocumentPresentation['background']>): void => onChange({ ...value, background: { ...value.background, ...update } })
  const upload = async (file: File | undefined): Promise<void> => {
    if (!file) return
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a PNG, JPEG, WebP or GIF smaller than 2 MB.'); return }
    const reader = new FileReader()
    reader.onerror = (): void => setError('The image could not be read.')
    reader.onload = (): void => { const image = validBackgroundImage(reader.result); if (image) { background({ image }); setError('') } }
    reader.readAsDataURL(file)
  }
  return <details className="document-style-picker">
    <summary>Document Style</summary>
    <div className="document-style-options">
      <label>Typeset<select value={value.style} onChange={(event) => onChange({ ...value, style: event.target.value === 'editorial' ? 'editorial' : 'classic' })}><option value="classic">Classic</option><option value="editorial">Editorial</option></select></label>
      <label>Paragraphs<select value={value.paragraphs} onChange={(event) => onChange({ ...value, paragraphs: event.target.value === 'block' ? 'block' : 'indented' })}><option value="indented">Indented prose</option><option value="block">Block paragraphs</option></select></label>
      <label>Background image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void upload(event.target.files?.[0])} /></label>
      {value.background.image && <>
        <label>Image opacity <output>{Math.round(value.background.opacity * 100)}%</output><input type="range" min="0" max="1" step=".05" value={value.background.opacity} onChange={(event) => background({ opacity: Number(event.target.value) })} /></label>
        <label>Dimming <output>{Math.round(value.background.dimming * 100)}%</output><input type="range" min="0" max="1" step=".05" value={value.background.dimming} onChange={(event) => background({ dimming: Number(event.target.value) })} /></label>
        <label>Fit<select value={value.background.fit} onChange={(event) => background({ fit: event.target.value === 'contain' ? 'contain' : 'cover' })}><option value="cover">Cover</option><option value="contain">Contain</option></select></label>
        <label>Position<select value={value.background.position} onChange={(event) => background({ position: event.target.value === 'top' ? 'top' : event.target.value === 'bottom' ? 'bottom' : 'center' })}><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option></select></label>
        <button type="button" onClick={() => background({ image: '' })}>Remove background</button>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
  </details>
}
