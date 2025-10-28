import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { search, highlightSelectionMatches } from '@codemirror/search';
import { themes, type Theme } from '../lib/themes';
import './Editor.css';
// Function to generate editor theme based on the selected theme
const createEditorTheme = (theme: Theme) => {
  // Selection uses native ::selection via CSS; keep only search/match accents
  
  // Debug logs removed for performance

  return EditorView.theme({
    '&': { 
      background: '#ffffff', 
      color: '#333333' 
    },
    '.cm-content': {
      backgroundColor: '#ffffff',
      color: '#333333',
    },
    '.cm-focused': {
      outline: 'none',
    },
    '.cm-editor': {
      backgroundColor: '#ffffff',
    },
    '.cm-scroller': {
      backgroundColor: '#ffffff',
    },
    '.cm-gutters': {
      backgroundColor: '#f5f5f5',
      borderRight: '1px solid #e1e1e1',
    },
    '.cm-lineNumbers': {
      color: '#333333',
      opacity: 0.6,
    },
    '.cm-cursor': { 
      borderLeft: `2px solid ${theme.accent}` 
    },
    '.cm-activeLine': { 
      background: '#f5f5f5' 
    },
    '.cm-selectionMatch': {
      background: theme.accent,
      borderRadius: '2px',
    },
    '.cm-matchingBracket': {
      background: 'rgba(0,0,0,0.06)',
      outline: `1px solid ${theme.accent}`,
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: 'rgba(215, 58, 73, 0.3)',
      outline: '1px solid #d73a49',
    },
    '.cm-panels': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-panels-top': {
      borderBottom: '1px solid #e1e1e1',
      backgroundColor: '#f5f5f5',
    },
     '.cm-panel.cm-search': {
       backgroundColor: '#ffffff',
       borderRadius: '8px',
       padding: '12px 16px',
       margin: '8px 12px',
       boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
       border: '1px solid #e1e1e1',
       display: 'flex',
       flexWrap: 'wrap',
       alignItems: 'center',
       gap: '10px',
       fontSize: '13px',
     },
     '.cm-panel.cm-search input': {
       backgroundColor: '#ffffff',
       border: '1px solid #e1e1e1',
       borderRadius: '6px',
       padding: '8px 12px',
       color: '#333333',
       fontFamily: 'JetBrains Mono, monospace',
       fontSize: '13px',
       width: '220px',
       transition: 'all 0.2s ease',
       boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
     },
     '.cm-panel.cm-search input:focus': {
       border: '2px solid #007acc',
       outline: 'none',
       boxShadow: '0 0 0 3px rgba(0, 122, 204, 0.1), inset 0 1px 2px rgba(0,0,0,0.05)',
       backgroundColor: '#ffffff',
     },
     '.cm-panel.cm-search button': {
       backgroundColor: '#007acc',
       border: '1px solid #007acc',
       borderRadius: '6px',
       color: '#ffffff',
       padding: '8px 16px',
       fontSize: '12px',
       cursor: 'pointer',
       fontWeight: '600',
       transition: 'all 0.2s ease',
       boxShadow: '0 2px 4px rgba(0, 122, 204, 0.3)',
       textTransform: 'uppercase',
       letterSpacing: '0.5px',
     },
     '.cm-panel.cm-search button:hover': {
       backgroundColor: '#005a99',
       borderColor: '#005a99',
       opacity: 1,
       transform: 'translateY(-1px)',
       boxShadow: '0 4px 8px rgba(0, 122, 204, 0.3)',
     },
     '.cm-panel.cm-search button:active': {
       backgroundColor: '#004080',
       borderColor: '#004080',
       transform: 'translateY(0)',
       boxShadow: '0 2px 4px rgba(0, 122, 204, 0.3)',
       opacity: 1,
     },
    '.cm-panel.cm-search button:focus-visible': {
      outline: '2px solid #007acc',
      outlineOffset: '1px',
    },
    '.cm-panel.cm-search button[name="replace"], .cm-panel.cm-search button[name="replaceAll"]': {
      backgroundColor: '#28a745',
      borderColor: '#28a745',
    },
    '.cm-panel.cm-search button[name="replace"]:hover, .cm-panel.cm-search button[name="replaceAll"]:hover': {
      backgroundColor: '#22863a',
      borderColor: '#22863a',
    },
     '.cm-panel.cm-search button[name="close"]': {
       background: 'none',
       border: 'none',
       color: '#333333',
       opacity: 0.6,
       fontSize: '18px',
       padding: '4px 8px',
       boxShadow: 'none',
       borderRadius: '4px',
       transition: 'all 0.2s ease',
     },
     '.cm-panel.cm-search button[name="close"]:hover': {
       backgroundColor: '#f5f5f5',
       color: '#333333',
       opacity: 1,
       transform: 'scale(1.1)',
       boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
     },
     '.cm-panel.cm-search label': {
       color: '#333333',
       fontSize: '12px',
       display: 'inline-flex',
       alignItems: 'center',
       gap: '4px',
       cursor: 'pointer',
       userSelect: 'none',
       whiteSpace: 'nowrap',
       fontWeight: '500',
     },
    '.cm-panel.cm-search input[type="checkbox"]': {
      width: '13px',
      height: '13px',
      cursor: 'pointer',
      accentColor: theme.accent,
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(0, 122, 204, 0.4)',
      outline: '2px solid #007acc',
      borderRadius: '2px',
      boxShadow: '0 0 0 1px rgba(0, 122, 204, 0.3)',
    },
     '.cm-searchMatch-selected': {
       backgroundColor: '#007acc',
       color: '#ffffff',
       outline: '2px solid #005a99',
       boxShadow: '0 0 4px rgba(0, 122, 204, 0.5)',
     },
     
     // Ultra-aggressive CodeMirror button overrides
     '.cm-panel button, .cm-search button, .cm-panel.cm-search button, button[name="next"], button[name="prev"], button[name="select"], button[name="replace"], button[name="replaceAll"]': {
       backgroundColor: '#007acc !important',
       border: '1px solid #007acc !important',
       color: '#ffffff !important',
       borderRadius: '6px !important',
       padding: '8px 16px !important',
       fontSize: '12px !important',
       fontWeight: '600 !important',
       textTransform: 'uppercase !important',
       letterSpacing: '0.5px !important',
     },
     
     // Hover states with maximum specificity
     '.cm-panel button:hover, .cm-search button:hover, .cm-panel.cm-search button:hover, button[name="next"]:hover, button[name="prev"]:hover, button[name="select"]:hover, button[name="replace"]:hover, button[name="replaceAll"]:hover': {
       backgroundColor: '#005a99 !important',
       borderColor: '#005a99 !important',
     },
     
     // Nuclear option - target every possible button selector
     'button[class*="cm-"], button[class*="search"], .cm-editor button, .CodeMirror button': {
       backgroundColor: '#007acc !important',
       border: '1px solid #007acc !important',
       color: '#ffffff !important',
     },
  });
};

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: string;
  editorRef?: React.RefObject<EditorView | null>;
  onEditorChange?: () => void;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, theme, editorRef: externalEditorRef, onEditorChange }) => {
  const internalEditorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Get the current theme object - default to Standard Light for light mode
  const currentTheme = themes.find(t => t.name === theme) || themes.find(t => t.name === 'Standard Light') || themes[0];
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Expose editorRef to external ref
  useEffect(() => {
    if (externalEditorRef) {
      externalEditorRef.current = viewRef.current;
      // Ref update; no logging to avoid noise while typing
    }
  }, [externalEditorRef]);
  
  useEffect(() => {
    if (!internalEditorRef.current || viewRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        markdown({ codeLanguages: languages }),
        search(),
        highlightSelectionMatches(),
        keymap.of([indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            onChangeRef.current(newValue);
          }
          // Notify only on content changes (not selection) to reduce churn
          if (update.docChanged) onEditorChange?.();
        }),
        EditorView.theme({
          '&': {
            fontSize: '14px',
            height: '100%',
          },
          '.cm-content': {
            padding: '16px',
            fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%',
            overflow: 'hidden',
          },
          '.cm-focused': {
            outline: 'none',
          },
          '.cm-editor': {
            height: '100%',
          },
          '.cm-scroller': {
            fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%',
          },
          '.cm-selectionMatch': {
            background: '#007acc',
            borderRadius: '2px',
          },
        }),
        createEditorTheme(currentTheme),
        // Ensure default token colors load after theme so they aren't overridden
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: internalEditorRef.current,
    });

    viewRef.current = view;
    // Ensure external ref points to the created view (fixes preview sync)
    if (externalEditorRef) {
      externalEditorRef.current = view;
    }

    // Force selection styling after editor is created
    // Removed forced style injection

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      if (externalEditorRef) {
        externalEditorRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme]);
  useEffect(() => {
    if (!viewRef.current) return;
    
    const currentValue = viewRef.current.state.doc.toString();
    if (currentValue !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div className="editor-container">
      <div ref={internalEditorRef} style={{ height: '100%', width: '100%' }} />
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Global CodeMirror button overrides - nuclear option */
          .cm-panel button,
          .cm-search button,
          .cm-panel.cm-search button,
          button[name="next"],
          button[name="prev"],
          button[name="select"],
          button[name="replace"],
          button[name="replaceAll"],
          .CodeMirror button,
          .cm-editor button {
            background-color: #007acc !important;
            background: #007acc !important;
            border: 1px solid #007acc !important;
            border-color: #007acc !important;
            color: #ffffff !important;
            border-radius: 6px !important;
            padding: 8px 16px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
          
          .cm-panel button:hover,
          .cm-search button:hover,
          .cm-panel.cm-search button:hover,
          button[name="next"]:hover,
          button[name="prev"]:hover,
          button[name="select"]:hover,
          button[name="replace"]:hover,
          button[name="replaceAll"]:hover,
          .CodeMirror button:hover,
          .cm-editor button:hover {
            background-color: #005a99 !important;
            background: #005a99 !important;
            border-color: #005a99 !important;
          }
          
          /* Exception for close button */
          button[name="close"] {
            background: none !important;
            background-color: transparent !important;
            border: none !important;
            color: #333333 !important;
            padding: 4px 8px !important;
          }
          
          button[name="close"]:hover {
            background-color: #f5f5f5 !important;
            background: #f5f5f5 !important;
          }
          
          /* Jump highlight animation */
          .cm-jump-highlight {
            background: rgba(122, 162, 247, 0.3) !important;
            animation: fadeOut 0.8s forwards;
          }
          
          @keyframes fadeOut {
            to { background: transparent !important; }
          }
          
          /* Selection uses native ::selection; keep search match styling only */
          .cm-selectionMatch,
          .cm-editor .cm-selectionMatch,
          .cm-content .cm-selectionMatch {
            background: #007acc !important;
            background-color: #007acc !important;
          }
        `
      }} />
    </div>
  );
};
