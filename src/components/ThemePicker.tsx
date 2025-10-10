import React, { useState, useEffect, useRef } from 'react';
import { themes, codeThemes } from '../lib/themes';
import { exportToPDF, exportToHTML, exportToMarkdown, debugPreviewPrint } from '../lib/export';

interface ThemePickerProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  currentCodeTheme: string;
  onCodeThemeChange: (codeTheme: string) => void;
  content: string;
  onReset: () => void;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ 
  currentTheme, 
  onThemeChange, 
  currentCodeTheme, 
  onCodeThemeChange,
  content,
  onReset
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeSelectRef = useRef<HTMLSelectElement>(null);
  const codeThemeSelectRef = useRef<HTMLSelectElement>(null);

  // Helper function to find NEXT theme by search term
  const findNextThemeByLetter = (letter: string, themeList: string[], currentTheme: string) => {
    const lowerLetter = letter.toLowerCase();
    const currentIndex = themeList.findIndex(theme => theme === currentTheme);
    
    // Find themes starting with the letter
    const matchingThemes = themeList
      .map((theme, index) => ({ theme, index }))
      .filter(({ theme }) => theme.toLowerCase().startsWith(lowerLetter));
    
    if (matchingThemes.length === 0) return currentTheme;
    
    // Find the next theme after current position
    const nextMatch = matchingThemes.find(({ index }) => index > currentIndex);
    
    // If no next match, wrap around to first match
    return nextMatch ? nextMatch.theme : matchingThemes[0].theme;
  };

  // Handle keyboard navigation for theme select
  const handleThemeKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    const char = e.key.toLowerCase();
    if (char.length === 1 && char.match(/[a-z]/)) {
      e.preventDefault();
      const foundTheme = findNextThemeByLetter(char, themes.map(t => t.name), currentTheme);
      if (foundTheme !== currentTheme) {
        onThemeChange(foundTheme);
      }
    }
  };

  // Handle keyboard navigation for code theme select
  const handleCodeThemeKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    const char = e.key.toLowerCase();
    if (char.length === 1 && char.match(/[a-z]/)) {
      e.preventDefault();
      const foundTheme = findNextThemeByLetter(char, codeThemes, currentCodeTheme);
      if (foundTheme !== currentCodeTheme) {
        onCodeThemeChange(foundTheme);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleExport = async (type: 'markdown' | 'html' | 'pdf' | 'debug') => {
    setShowExportDropdown(false);
    
    switch (type) {
      case 'markdown':
        exportToMarkdown(content);
        break;
      case 'html': {
        const previewElement = document.querySelector('.preview-wrapper') as HTMLElement;
        if (previewElement) {
          exportToHTML(previewElement);
        } else {
          console.error('Preview element not found');
        }
        break;
      }
      case 'pdf': {
        const previewElement = document.querySelector('.preview-wrapper') as HTMLElement;
        if (previewElement) {
          await exportToPDF(previewElement);
        } else {
          console.error('Preview element not found');
        }
        break;
      }
      case 'debug':
        await debugPreviewPrint();
        break;
    }
  };

  return (
    <div className="theme-picker">
      <div className="theme-section">
        <label htmlFor="theme-select">Preview Theme:</label>
        <select
          ref={themeSelectRef}
          id="theme-select"
          value={currentTheme}
          onChange={(e) => onThemeChange(e.target.value)}
          onKeyDown={handleThemeKeyDown}
          className="theme-select"
        >
          {themes.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="theme-section">
        <label htmlFor="code-theme-select">Codeblock Theme:</label>
        <select
          ref={codeThemeSelectRef}
          id="code-theme-select"
          value={currentCodeTheme}
          onChange={(e) => onCodeThemeChange(e.target.value)}
          onKeyDown={handleCodeThemeKeyDown}
          className="theme-select"
        >
          {codeThemes.map((codeTheme) => (
            <option key={codeTheme} value={codeTheme}>
              {codeTheme.replace('prism-', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="theme-section">
        <button onClick={onReset} className="theme-btn">
          Reset
        </button>
      </div>
      
      <div className="theme-section">
        <div className="export-dropdown" ref={dropdownRef}>
          <button 
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="theme-btn export-btn"
          >
            Export ▼
          </button>
          {showExportDropdown && (
            <div className="export-menu">
              <button onClick={() => handleExport('markdown')} className="export-option">
                Markdown
              </button>
              <button onClick={() => handleExport('html')} className="export-option">
                HTML
              </button>
              <button onClick={() => handleExport('pdf')} className="export-option">
                PDF
              </button>
              <button onClick={() => handleExport('debug')} className="export-option">
                Debug Preview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
