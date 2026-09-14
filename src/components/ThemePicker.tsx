import React, { useEffect, useRef, useState } from 'react'
import { exportPDF, exportToHTML, exportToMarkdown } from '../lib/export'
import { codeThemes, themes } from '../lib/themes'

interface ThemePickerProps {
  currentTheme: string
  onThemeChange: (theme: string) => void
  currentCodeTheme: string
  onCodeThemeChange: (codeTheme: string) => void
  content: string
  onReset: () => void
}

type ExportAction = 'markdown' | 'html' | 'pdf'
type ExportState = { message: string; tone: 'idle' | 'working' | 'success' | 'error' }

const exportLabels: Record<ExportAction, string> = {
  markdown: 'Markdown downloaded',
  html: 'HTML downloaded',
  pdf: 'PDF downloaded',
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ currentTheme, onThemeChange, currentCodeTheme, onCodeThemeChange, content, onReset }) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [exportState, setExportState] = useState<ExportState>({ message: '', tone: 'idle' })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const statusTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowExportDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current)
    }
  }, [])

  const findNextThemeByLetter = (letter: string, themeList: string[], selectedTheme: string): string => {
    const currentIndex = themeList.findIndex((theme) => theme === selectedTheme)
    const matchingThemes = themeList.map((theme, index) => ({ theme, index })).filter(({ theme }) => theme.toLowerCase().startsWith(letter.toLowerCase()))
    if (matchingThemes.length === 0) return selectedTheme
    return matchingThemes.find(({ index }) => index > currentIndex)?.theme ?? matchingThemes[0].theme
  }

  const handleThemeKeyDown = (event: React.KeyboardEvent<HTMLSelectElement>): void => {
    if (!/^[a-z]$/i.test(event.key)) return
    event.preventDefault()
    onThemeChange(findNextThemeByLetter(event.key, themes.map((theme) => theme.name), currentTheme))
  }

  const handleCodeThemeKeyDown = (event: React.KeyboardEvent<HTMLSelectElement>): void => {
    if (!/^[a-z]$/i.test(event.key)) return
    event.preventDefault()
    onCodeThemeChange(findNextThemeByLetter(event.key, codeThemes, currentCodeTheme))
  }

  const showStatus = (state: ExportState): void => {
    setExportState(state)
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current)
    if (state.tone === 'working') return
    statusTimerRef.current = window.setTimeout(() => setExportState({ message: '', tone: 'idle' }), 2600)
  }

  const getPreview = (): HTMLElement => {
    const preview = document.querySelector<HTMLElement>('.preview-wrapper')
    if (!preview) throw new Error('The preview is not ready yet.')
    return preview
  }

  const handleExport = async (action: ExportAction): Promise<void> => {
    setShowExportDropdown(false)
    showStatus({ message: 'Preparing export…', tone: 'working' })
    try {
      if (action === 'markdown') exportToMarkdown(content)
      if (action === 'html') exportToHTML(getPreview())
      if (action === 'pdf') await exportPDF(getPreview())
      showStatus({ message: exportLabels[action], tone: 'success' })
    } catch (error) {
      console.error('Export failed:', error)
      showStatus({ message: error instanceof Error ? error.message : 'Export failed', tone: 'error' })
    }
  }

  return (
    <div className="theme-picker">
      <div className="theme-section">
        <label htmlFor="theme-select">Color Theme:</label>
        <select id="theme-select" value={currentTheme} onChange={(event) => onThemeChange(event.target.value)} onKeyDown={handleThemeKeyDown} className="theme-select">
          {themes.map((theme) => <option key={theme.name} value={theme.name}>{theme.name}</option>)}
        </select>
      </div>

      <div className="theme-section">
        <label htmlFor="code-theme-select">Codeblock Theme:</label>
        <select id="code-theme-select" value={currentCodeTheme} onChange={(event) => onCodeThemeChange(event.target.value)} onKeyDown={handleCodeThemeKeyDown} className="theme-select">
          {codeThemes.map((codeTheme) => <option key={codeTheme} value={codeTheme}>{codeTheme.replace('prism-', '').split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>)}
        </select>
      </div>

      <div className="theme-section"><button onClick={onReset} className="theme-btn">Reset</button></div>

      <div className="theme-section export-section">
        <div className="export-dropdown" ref={dropdownRef} onKeyDown={(event) => { if (event.key === 'Escape') setShowExportDropdown(false) }}>
          <button type="button" onClick={() => setShowExportDropdown((visible) => !visible)} className="theme-btn export-btn" aria-haspopup="menu" aria-expanded={showExportDropdown}>
            <ExportIcon />
            Export
            <span className="export-chevron" aria-hidden>⌄</span>
          </button>
          {showExportDropdown && (
            <div className="export-menu" role="menu" aria-label="Export document">
              <div className="export-menu-heading">Take it with you</div>
              <ExportOption title="PDF" detail="Paginated document" icon="PDF" onClick={() => void handleExport('pdf')} />
              <ExportOption title="HTML" detail="Standalone webpage" icon="HTML" onClick={() => void handleExport('html')} />
              <ExportOption title="Markdown" detail="Original source file" icon="MD" onClick={() => void handleExport('markdown')} />
            </div>
          )}
        </div>
        <span className={`export-status export-status-${exportState.tone}`} role="status" aria-live="polite">{exportState.message}</span>
      </div>
    </div>
  )
}

function ExportOption({ title, detail, icon, onClick }: { title: string; detail: string; icon: string; onClick: () => void }): React.ReactElement {
  return (
    <button type="button" className="export-option" role="menuitem" onClick={onClick}>
      <span className="export-option-icon" aria-hidden>{icon}</span>
      <span className="export-option-copy"><strong>{title}</strong><small>{detail}</small></span>
      <span className="export-option-arrow" aria-hidden>↗</span>
    </button>
  )
}

function ExportIcon(): React.ReactElement {
  return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 16v3h14v-3"/></svg>
}
