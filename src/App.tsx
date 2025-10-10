import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { ThemePicker } from './components/ThemePicker';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { debounce } from './lib/utils/debounce';
import demoContent from './demo-content.md?raw';
import './App.css';
import type { EditorView } from '@codemirror/view';

function App() {
  const [content, setContent] = useState(demoContent);
  const [theme, setTheme] = useState('GitHub Dark');
  const [codeTheme, setCodeTheme] = useState('nord');
  const [isLoaded, setIsLoaded] = useState(false);
  const [splitSize, setSplitSize] = useState(50);
  const [renderContent, setRenderContent] = useState(demoContent);
  const editorRef = useRef<EditorView | null>(null);
  const [editorChangeHandler, setEditorChangeHandler] = useState<(() => void) | null>(null);

  const handleEditorChange = useCallback(() => {
    editorChangeHandler?.();
  }, [editorChangeHandler]);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to demo content? This will clear your current work.')) {
      setContent(demoContent);
      localStorage.removeItem('scribble-data');
    }
  };
  const handleResize = debounce((...args: unknown[]) => {
    const layout = args[0] as number[];
    if (layout && layout.length > 0) {
      setSplitSize(layout[0]);
    }
  }, 150);
  useEffect(() => {
    const saved = localStorage.getItem('scribble-data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setContent(data.content);
        setTheme(data.theme || 'GitHub Dark');
        setCodeTheme(data.settings?.codeTheme || 'nord');
        setSplitSize(data.settings?.splitSize || 50);
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
    setIsLoaded(true);
  }, []);
  const saveState = useMemo(() => debounce((payload: unknown) => {
    try {
      localStorage.setItem('scribble-data', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, 300), []);

  useEffect(() => {
    if (isLoaded) {
      const data = {
        content,
        theme,
        settings: {
          codeTheme,
          splitSize,
          lineHeight: 1.6,
          fontFamily: 'JetBrains Mono'
        }
      };
      saveState(data);
    }
  }, [content, theme, codeTheme, splitSize, isLoaded, saveState]);

  const debouncedPaint = useMemo(() => debounce((s: unknown) => setRenderContent(String(s)), 120), []);
  useEffect(() => { debouncedPaint(content); }, [content, debouncedPaint]);

  if (!isLoaded) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="loading-logo">Scribble</div>
        <div className="loading-spinner" aria-hidden></div>
        <p className="loading-hint">Warming up Shiki and Mermaid…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mobile-blocker">
        <div className="mobile-blocker-card">
          <div className="mobile-icon" aria-hidden>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="7" y="8" width="10" height="4" rx="1" ry="1" fill="currentColor" opacity="0.15"/>
              <path d="M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2>Scribble is optimized for desktop</h2>
          <p>Please open on a larger screen for the best editing experience.</p>
        </div>
      </div>
      <div className="app">
      <div className="app-header">
        <h1>Scribble</h1>
        <div className="app-controls">
          <ThemePicker 
            currentTheme={theme} 
            onThemeChange={setTheme}
            currentCodeTheme={codeTheme}
            onCodeThemeChange={setCodeTheme}
            content={content}
            onReset={handleReset}
          />
        </div>
      </div>

      <div className="app-content">
        <PanelGroup direction="horizontal" onLayout={handleResize}>
          <Panel defaultSize={splitSize} minSize={20} maxSize={80} className="editor-panel">
            <div className="panel-header">Editor</div>
            <Editor
              value={content}
              onChange={setContent}
              theme={theme}
              editorRef={editorRef}
              onEditorChange={handleEditorChange}
            />
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          <Panel defaultSize={100 - splitSize} minSize={20} maxSize={80} className="preview-panel">
            <div className="panel-header">Preview</div>
            <Preview
              content={renderContent}
              theme={theme}
              codeTheme={codeTheme}
              editorRef={editorRef}
              onEditorChangeHandlerChange={setEditorChangeHandler}
            />
          </Panel>
        </PanelGroup>
      </div>
      </div>
    </>
  );
}

export default App;