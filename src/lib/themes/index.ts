import type { BundledTheme } from 'shiki';

export interface Theme {
  name: string;
  background: string;
  text: string;
  accent: string;
  codeBackground: string;
  codeText: string;
  border: string;
  shadow: string;
}

// Available Shiki themes - we'll extract colors dynamically
const shikiThemeNames = [
  // Popular Light Themes
  'github-light',
  'github-light-high-contrast',
  'vitesse-light',
  'material-theme-lighter',
  'min-light',
  'slack-ochin',
  'solarized-light',
  
  // Popular Dark Themes
  'github-dark',
  'github-dark-dimmed',
  'github-dark-high-contrast',
  'nord',
  'dracula',
  'monokai',
  'night-owl',
  'one-dark-pro',
  'tokyo-night',
  'vitesse-dark',
  'material-theme-darker',
  'material-theme-ocean',
  'material-theme-palenight',
  'min-dark',
  'slack-dark',
  'vesper',
  'solarized-dark',
  
  // Rose Pine Collection
  'rose-pine',
  'rose-pine-dawn',
  'rose-pine-moon',
  
  // Catppuccin Collection
  'catppuccin-latte',
  'catppuccin-frappe',
  'catppuccin-macchiato',
  'catppuccin-mocha'
] as const;

// Theme display names mapping
const themeDisplayNames: Record<string, string> = {
  // Light Themes
  'github-light': 'GitHub Light',
  'github-light-high-contrast': 'GitHub Light High Contrast',
  'vitesse-light': 'Vitesse Light',
  'material-theme-lighter': 'Material Lighter',
  'min-light': 'Min Light',
  'slack-ochin': 'Slack Ochin',
  'solarized-light': 'Solarized Light',
  
  // Dark Themes
  'github-dark': 'GitHub Dark',
  'github-dark-dimmed': 'GitHub Dark Dimmed',
  'github-dark-high-contrast': 'GitHub Dark High Contrast',
  'nord': 'Nord',
  'dracula': 'Dracula',
  'monokai': 'Monokai',
  'night-owl': 'Night Owl',
  'one-dark-pro': 'One Dark Pro',
  'tokyo-night': 'Tokyo Night',
  'vitesse-dark': 'Vitesse Dark',
  'material-theme-darker': 'Material Darker',
  'material-theme-ocean': 'Material Ocean',
  'material-theme-palenight': 'Material Palenight',
  'min-dark': 'Min Dark',
  'slack-dark': 'Slack Dark',
  'vesper': 'Vesper',
  'solarized-dark': 'Solarized Dark',
  
  // Rose Pine Collection
  'rose-pine': 'Rosé Pine',
  'rose-pine-dawn': 'Rosé Pine Dawn',
  'rose-pine-moon': 'Rosé Pine Moon',
  
  // Catppuccin Collection
  'catppuccin-latte': 'Catppuccin Latte',
  'catppuccin-frappe': 'Catppuccin Frappé',
  'catppuccin-macchiato': 'Catppuccin Macchiato',
  'catppuccin-mocha': 'Catppuccin Mocha'
};

// Function to get accent color from Shiki theme by analyzing syntax highlighting
const getShikiAccentColor = (themeName: string): string => {
  // This is a simplified approach - we could enhance this to actually parse
  // the Shiki theme files and extract the most prominent color
  const accentColors: Record<string, string> = {
    // Light Themes
    'github-light': '#0366d6', // Blue
    'github-light-high-contrast': '#0969da', // Blue
    'vitesse-light': '#3b82f6', // Blue
    'material-theme-lighter': '#00acc1', // Cyan
    'min-light': '#666666', // Gray
    'slack-ochin': '#3aa3e3', // Blue
    'solarized-light': '#268bd2', // Blue
    
    // Dark Themes
    'github-dark': '#fa7970', // Red
    'github-dark-dimmed': '#f85149', // Red
    'github-dark-high-contrast': '#ff6b6b', // Red
    'nord': '#88c0d0', // Cyan
    'dracula': '#bd93f9', // Purple
    'monokai': '#a6e22e', // Green
    'night-owl': '#c792ea', // Purple
    'one-dark-pro': '#61afef', // Blue
    'tokyo-night': '#7aa2f7', // Blue
    'vitesse-dark': '#7aa2f7', // Blue
    'material-theme-darker': '#89ddff', // Cyan
    'material-theme-ocean': '#80cbc4', // Teal
    'material-theme-palenight': '#bb80b3', // Purple
    'min-dark': '#666666', // Gray
    'slack-dark': '#3aa3e3', // Blue
    'vesper': '#cba6f7', // Purple
    'solarized-dark': '#268bd2', // Blue
    
    // Rose Pine Collection
    'rose-pine': '#eb6f92', // Pink
    'rose-pine-dawn': '#d7827e', // Pink
    'rose-pine-moon': '#eb6f92', // Pink
    
    // Catppuccin Collection
    'catppuccin-latte': '#1e66f5', // Blue
    'catppuccin-frappe': '#8caaee', // Blue
    'catppuccin-macchiato': '#8aadf4', // Blue
    'catppuccin-mocha': '#89b4fa' // Blue
  };
  
  return accentColors[themeName] || '#7aa2f7';
};

// Function to extract colors from Shiki theme dynamically
const extractShikiThemeColors = (themeName: string): Theme => {
  const displayName = themeDisplayNames[themeName];
  const accentColor = getShikiAccentColor(themeName);
  
  // Use proper theme colors instead of hardcoded defaults
  const themeColors: Record<string, Omit<Theme, 'name' | 'accent'>> = {
    // Light Themes
    'github-light': {
      background: '#ffffff',
      text: '#24292f',
      codeBackground: '#f6f8fa',
      codeText: '#24292f',
      border: '#d0d7de',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'github-light-high-contrast': {
      background: '#ffffff',
      text: '#0d1117',
      codeBackground: '#f6f8fa',
      codeText: '#0d1117',
      border: '#d0d7de',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'vitesse-light': {
      background: '#ffffff',
      text: '#2d3748',
      codeBackground: '#f7fafc',
      codeText: '#2d3748',
      border: '#e2e8f0',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'material-theme-lighter': {
      background: '#fafafa',
      text: '#546e7a',
      codeBackground: '#ffffff',
      codeText: '#546e7a',
      border: '#e0e0e0',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'min-light': {
      background: '#ffffff',
      text: '#333333',
      codeBackground: '#f5f5f5',
      codeText: '#333333',
      border: '#e0e0e0',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'slack-ochin': {
      background: '#ffffff',
      text: '#2c2d30',
      codeBackground: '#f8f9fa',
      codeText: '#2c2d30',
      border: '#e1e2e3',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'solarized-light': {
      background: '#fdf6e3',
      text: '#586e75',
      codeBackground: '#eee8d5',
      codeText: '#586e75',
      border: '#93a1a1',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    
    // Dark Themes
    'github-dark': {
      background: '#0d1117',
      text: '#e6edf3',
      codeBackground: '#161b22',
      codeText: '#e6edf3',
      border: '#30363d',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'github-dark-dimmed': {
      background: '#0d1117',
      text: '#adbac7',
      codeBackground: '#161b22',
      codeText: '#adbac7',
      border: '#373e47',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'github-dark-high-contrast': {
      background: '#0a0a0a',
      text: '#ffffff',
      codeBackground: '#161b22',
      codeText: '#ffffff',
      border: '#30363d',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'nord': {
      background: '#2e3440',
      text: '#d8dee9',
      codeBackground: '#3b4252',
      codeText: '#81a1c1',
      border: '#4c566a',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'dracula': {
      background: '#282a36',
      text: '#f8f8f2',
      codeBackground: '#44475a',
      codeText: '#f8f8f2',
      border: '#6272a4',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'monokai': {
      background: '#272822',
      text: '#f8f8f2',
      codeBackground: '#3e3d32',
      codeText: '#f8f8f2',
      border: '#75715e',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'night-owl': {
      background: '#011627',
      text: '#d6deeb',
      codeBackground: '#0c2132',
      codeText: '#d6deeb',
      border: '#1e3a5f',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'one-dark-pro': {
      background: '#282c34',
      text: '#abb2bf',
      codeBackground: '#21252b',
      codeText: '#abb2bf',
      border: '#3e4451',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'tokyo-night': {
      background: '#1a1b26',
      text: '#c0caf5',
      codeBackground: '#24283b',
      codeText: '#bb9af7',
      border: '#565f89',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'vitesse-dark': {
      background: '#0f1419',
      text: '#e6e1cf',
      codeBackground: '#1a1f2e',
      codeText: '#e6e1cf',
      border: '#2d3748',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'material-theme-darker': {
      background: '#212121',
      text: '#eeffff',
      codeBackground: '#2c2c2c',
      codeText: '#eeffff',
      border: '#404040',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'material-theme-ocean': {
      background: '#0f111a',
      text: '#a4a6a9',
      codeBackground: '#1a1f2e',
      codeText: '#a4a6a9',
      border: '#2d3748',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'material-theme-palenight': {
      background: '#292d3e',
      text: '#a6accd',
      codeBackground: '#32374d',
      codeText: '#a6accd',
      border: '#676e95',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'min-dark': {
      background: '#1a1a1a',
      text: '#cccccc',
      codeBackground: '#2a2a2a',
      codeText: '#cccccc',
      border: '#404040',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'slack-dark': {
      background: '#1a1d29',
      text: '#d1d2d3',
      codeBackground: '#2c2d30',
      codeText: '#d1d2d3',
      border: '#4a4d52',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'vesper': {
      background: '#1e1e2e',
      text: '#cdd6f4',
      codeBackground: '#313244',
      codeText: '#f5c2e7',
      border: '#585b70',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'solarized-dark': {
      background: '#002b36',
      text: '#93a1a1',
      codeBackground: '#073642',
      codeText: '#b58900',
      border: '#586e75',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    
    // Rose Pine Collection
    'rose-pine': {
      background: '#191724',
      text: '#e0def4',
      codeBackground: '#26233a',
      codeText: '#e0def4',
      border: '#403d52',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'rose-pine-dawn': {
      background: '#faf4ed',
      text: '#575279',
      codeBackground: '#f2ede9',
      codeText: '#575279',
      border: '#cecacd',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'rose-pine-moon': {
      background: '#232136',
      text: '#e0def4',
      codeBackground: '#2a283e',
      codeText: '#e0def4',
      border: '#44415a',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    
    // Catppuccin Collection
    'catppuccin-latte': {
      background: '#eff1f5',
      text: '#4c4f69',
      codeBackground: '#e6e9ef',
      codeText: '#4c4f69',
      border: '#ccd0da',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    'catppuccin-frappe': {
      background: '#303446',
      text: '#c6d0f5',
      codeBackground: '#414559',
      codeText: '#c6d0f5',
      border: '#626880',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'catppuccin-macchiato': {
      background: '#24273a',
      text: '#cad3f5',
      codeBackground: '#363a4f',
      codeText: '#cad3f5',
      border: '#5b6078',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'catppuccin-mocha': {
      background: '#1e1e2e',
      text: '#cdd6f4',
      codeBackground: '#313244',
      codeText: '#cdd6f4',
      border: '#585b70',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  };
  
  const colors = themeColors[themeName] || themeColors['github-dark'];
  
  return {
    name: displayName,
    accent: accentColor,
    ...colors
  };
};

// Generate themes array from Shiki themes
export const themes: Theme[] = shikiThemeNames.map(themeName => 
  extractShikiThemeColors(themeName)
);

// Legacy themes array (keeping for backward compatibility, but we should migrate away from this)
export const legacyThemes: Theme[] = [
  {
    name: 'Standard Dark',
    background: '#1e1e1e',
    text: '#d4d4d4',
    accent: '#007acc',
    codeBackground: '#2d2d30',
    codeText: '#d4d4d4',
    border: '#3e3e42',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Standard Light',
    background: '#ffffff',
    text: '#333333',
    accent: '#007acc',
    codeBackground: '#f5f5f5',
    codeText: '#333333',
    border: '#e1e1e1',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Tokyo Night',
    background: '#1a1b26',
    text: '#c0caf5',
    accent: '#7aa2f7',
    codeBackground: '#24283b',
    codeText: '#bb9af7',
    border: '#565f89',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Nord',
    background: '#2e3440',
    text: '#d8dee9',
    accent: '#88c0d0',
    codeBackground: '#3b4252',
    codeText: '#81a1c1',
    border: '#4c566a',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Solarized Dark',
    background: '#002b36',
    text: '#93a1a1',
    accent: '#268bd2',
    codeBackground: '#073642',
    codeText: '#b58900',
    border: '#586e75',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'GitHub Dark',
    background: '#0d1117',
    text: '#e6edf3',
    accent: '#f85149',
    codeBackground: '#161b22',
    codeText: '#e6edf3',
    border: '#30363d',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'GitHub Light',
    background: '#ffffff',
    text: '#24292f',
    accent: '#0969da',
    codeBackground: '#f6f8fa',
    codeText: '#24292f',
    border: '#d0d7de',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Witchhazel',
    background: '#1e1e2e',
    text: '#cdd6f4',
    accent: '#cba6f7',
    codeBackground: '#313244',
    codeText: '#f5c2e7',
    border: '#585b70',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Nord Dark',
    background: '#2e3440',
    text: '#d8dee9',
    accent: '#88c0d0',
    codeBackground: '#3b4252',
    codeText: '#81a1c1',
    border: '#4c566a',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Dracula',
    background: '#282a36',
    text: '#f8f8f2',
    accent: '#bd93f9',
    codeBackground: '#44475a',
    codeText: '#f8f8f2',
    border: '#6272a4',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Monokai',
    background: '#272822',
    text: '#f8f8f2',
    accent: '#a6e22e',
    codeBackground: '#3e3d32',
    codeText: '#f8f8f2',
    border: '#75715e',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Night Owl',
    background: '#011627',
    text: '#d6deeb',
    accent: '#c792ea',
    codeBackground: '#0c2132',
    codeText: '#d6deeb',
    border: '#1e3a5f',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Material Darker',
    background: '#212121',
    text: '#eeffff',
    accent: '#89ddff',
    codeBackground: '#2c2c2c',
    codeText: '#eeffff',
    border: '#404040',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Min Dark',
    background: '#1a1a1a',
    text: '#cccccc',
    accent: '#666666',
    codeBackground: '#2a2a2a',
    codeText: '#cccccc',
    border: '#404040',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Slack Dark',
    background: '#1a1d29',
    text: '#d1d2d3',
    accent: '#3aa3e3',
    codeBackground: '#2c2d30',
    codeText: '#d1d2d3',
    border: '#4a4d52',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Vesper',
    background: '#1e1e2e',
    text: '#cdd6f4',
    accent: '#cba6f7',
    codeBackground: '#313244',
    codeText: '#f5c2e7',
    border: '#585b70',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Vitesse Light',
    background: '#ffffff',
    text: '#2d3748',
    accent: '#3b82f6',
    codeBackground: '#f7fafc',
    codeText: '#2d3748',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Material Lighter',
    background: '#fafafa',
    text: '#546e7a',
    accent: '#00acc1',
    codeBackground: '#ffffff',
    codeText: '#546e7a',
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Min Light',
    background: '#ffffff',
    text: '#333333',
    accent: '#666666',
    codeBackground: '#f5f5f5',
    codeText: '#333333',
    border: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Slack Ochin',
    background: '#ffffff',
    text: '#2c2d30',
    accent: '#3aa3e3',
    codeBackground: '#f8f9fa',
    codeText: '#2c2d30',
    border: '#e1e2e3',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Rosé Pine',
    background: '#191724',
    text: '#e0def4',
    accent: '#eb6f92',
    codeBackground: '#26233a',
    codeText: '#e0def4',
    border: '#403d52',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Rosé Pine Dawn',
    background: '#faf4ed',
    text: '#575279',
    accent: '#d7827e',
    codeBackground: '#f2ede9',
    codeText: '#575279',
    border: '#cecacd',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Rosé Pine Moon',
    background: '#232136',
    text: '#e0def4',
    accent: '#eb6f92',
    codeBackground: '#2a283e',
    codeText: '#e0def4',
    border: '#44415a',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Catppuccin Latte',
    background: '#eff1f5',
    text: '#4c4f69',
    accent: '#1e66f5',
    codeBackground: '#e6e9ef',
    codeText: '#4c4f69',
    border: '#ccd0da',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  {
    name: 'Catppuccin Frappé',
    background: '#303446',
    text: '#c6d0f5',
    accent: '#8caaee',
    codeBackground: '#414559',
    codeText: '#c6d0f5',
    border: '#626880',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Catppuccin Macchiato',
    background: '#24273a',
    text: '#cad3f5',
    accent: '#8aadf4',
    codeBackground: '#363a4f',
    codeText: '#cad3f5',
    border: '#5b6078',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'Catppuccin Mocha',
    background: '#1e1e2e',
    text: '#cdd6f4',
    accent: '#89b4fa',
    codeBackground: '#313244',
    codeText: '#cdd6f4',
    border: '#585b70',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  {
    name: 'One Dark Pro',
    background: '#282c34',
    text: '#abb2bf',
    accent: '#61afef',
    codeBackground: '#21252b',
    codeText: '#abb2bf',
    border: '#3e4451',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
];

// Available codeblock themes (Shiki - VS Code quality)
// These must match exactly what's available in src/shiki/shiki.worker.ts
// Map theme display names to Shiki theme names - now using actual Shiki themes
const themeNameToShikiMap: Record<string, BundledTheme> = Object.fromEntries(
  shikiThemeNames.map(themeName => [themeDisplayNames[themeName], themeName as BundledTheme])
);

// Available codeblock themes - derived from themes array (single source of truth)
export const codeThemes: BundledTheme[] = themes.map(t => themeNameToShikiMap[t.name] || 'github-dark');

// Memoized theme lookup cache
const themeLookupCache = new Map<string, Theme | undefined>();

// Helper function to get theme by Shiki name (memoized for performance)
export const getThemeByShikiName = (shikiName: string): Theme | undefined => {
  if (themeLookupCache.has(shikiName)) {
    return themeLookupCache.get(shikiName);
  }
  
  const displayName = Object.keys(themeNameToShikiMap).find(key => themeNameToShikiMap[key] === shikiName);
  const theme = themes.find(t => t.name === displayName);
  themeLookupCache.set(shikiName, theme);
  return theme;
};

export const getThemeCSS = (theme: Theme): string => `
  :root {
    --bg: ${theme.background};
    --text: ${theme.text};
    --accent: ${theme.accent};
    --code-bg: ${theme.codeBackground};
    --code-text: ${theme.codeText};
    --border: ${theme.border};
    --shadow: ${theme.shadow};
  }
`;
