export interface SSHTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  prompt: string;
  command: string;
  output: string;
  error: string;
  info: string;
  success: string;
  warning: string;
  ip: string;
  mac: string;
  port: string;
  number: string;
  keyword: string;
  path: string;
  file: string;
  directory: string;
  link: string;
  executable: string;
  permissions: string;
  user: string;
  group: string;
  date: string;
  size: string;
  description: string;
}

export const SSH_THEMES: SSHTheme[] = [
  {
    id: 'termius-dark',
    name: 'Termius Dark',
    description: 'Оригинальная тёмная тема Termius',
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#00d9ff',
    prompt: '#00d9ff',
    command: '#ffffff',
    output: '#d4d4d4',
    error: '#f44747',
    info: '#00d9ff',
    success: '#4ec9b0',
    warning: '#dcdcaa',
    ip: '#00d9ff',
    mac: '#4ec9b0',
    port: '#dcdcaa',
    number: '#b5cea8',
    keyword: '#569cd6',
    path: '#4ec9b0',
    file: '#d4d4d4',
    directory: '#569cd6',
    link: '#c586c0',
    executable: '#4ec9b0',
    permissions: '#ce9178',
    user: '#00d9ff',
    group: '#c586c0',
    date: '#808080',
    size: '#dcdcaa',
  },
  {
    id: 'termius-light',
    name: 'Termius Light',
    description: 'Светлая тема Termius',
    background: '#ffffff',
    foreground: '#383a42',
    cursor: '#0184bc',
    prompt: '#0184bc',
    command: '#383a42',
    output: '#383a42',
    error: '#e45649',
    info: '#0184bc',
    success: '#50a14f',
    warning: '#c18401',
    ip: '#0184bc',
    mac: '#50a14f',
    port: '#c18401',
    number: '#986801',
    keyword: '#a626a4',
    path: '#50a14f',
    file: '#383a42',
    directory: '#4078f2',
    link: '#a626a4',
    executable: '#50a14f',
    permissions: '#986801',
    user: '#0184bc',
    group: '#a626a4',
    date: '#a0a1a7',
    size: '#c18401',
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    description: 'Популярная тема Atom',
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    prompt: '#61afef',
    command: '#abb2bf',
    output: '#abb2bf',
    error: '#e06c75',
    info: '#61afef',
    success: '#98c379',
    warning: '#e5c07b',
    ip: '#56b6c2',
    mac: '#98c379',
    port: '#d19a66',
    number: '#d19a66',
    keyword: '#c678dd',
    path: '#98c379',
    file: '#abb2bf',
    directory: '#61afef',
    link: '#c678dd',
    executable: '#98c379',
    permissions: '#d19a66',
    user: '#56b6c2',
    group: '#c678dd',
    date: '#5c6370',
    size: '#e5c07b',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Современная ночная тема',
    background: '#1a1b26',
    foreground: '#c0caf5',
    cursor: '#c0caf5',
    prompt: '#7aa2f7',
    command: '#c0caf5',
    output: '#c0caf5',
    error: '#f7768e',
    info: '#7dcfff',
    success: '#9ece6a',
    warning: '#e0af68',
    ip: '#7dcfff',
    mac: '#9ece6a',
    port: '#e0af68',
    number: '#ff9e64',
    keyword: '#bb9af7',
    path: '#9ece6a',
    file: '#c0caf5',
    directory: '#7aa2f7',
    link: '#bb9af7',
    executable: '#9ece6a',
    permissions: '#ff9e64',
    user: '#7dcfff',
    group: '#bb9af7',
    date: '#565f89',
    size: '#e0af68',
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    description: 'Тёмная тема GitHub',
    background: '#0d1117',
    foreground: '#c9d1d9',
    cursor: '#58a6ff',
    prompt: '#58a6ff',
    command: '#c9d1d9',
    output: '#c9d1d9',
    error: '#f85149',
    info: '#58a6ff',
    success: '#3fb950',
    warning: '#d29922',
    ip: '#79c0ff',
    mac: '#3fb950',
    port: '#d29922',
    number: '#79c0ff',
    keyword: '#d2a8ff',
    path: '#3fb950',
    file: '#c9d1d9',
    directory: '#58a6ff',
    link: '#d2a8ff',
    executable: '#3fb950',
    permissions: '#ffa657',
    user: '#79c0ff',
    group: '#d2a8ff',
    date: '#8b949e',
    size: '#d29922',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'Тёмная тема с яркими акцентами',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    prompt: '#bd93f9',
    command: '#f8f8f2',
    output: '#f8f8f2',
    error: '#ff5555',
    info: '#8be9fd',
    success: '#50fa7b',
    warning: '#ffb86c',
    ip: '#8be9fd',
    mac: '#50fa7b',
    port: '#ffb86c',
    number: '#bd93f9',
    keyword: '#ff79c6',
    path: '#50fa7b',
    file: '#f8f8f2',
    directory: '#bd93f9',
    link: '#ff79c6',
    executable: '#50fa7b',
    permissions: '#ffb86c',
    user: '#8be9fd',
    group: '#ff79c6',
    date: '#6272a4',
    size: '#f1fa8c',
  },
  {
    id: 'monokai',
    name: 'Monokai',
    description: 'Классическая тема Sublime Text',
    background: '#272822',
    foreground: '#f8f8f2',
    cursor: '#f8f8f0',
    prompt: '#66d9ef',
    command: '#f8f8f2',
    output: '#f8f8f2',
    error: '#f92672',
    info: '#66d9ef',
    success: '#a6e22e',
    warning: '#fd971f',
    ip: '#66d9ef',
    mac: '#a6e22e',
    port: '#fd971f',
    number: '#ae81ff',
    keyword: '#f92672',
    path: '#a6e22e',
    file: '#f8f8f2',
    directory: '#66d9ef',
    link: '#ae81ff',
    executable: '#a6e22e',
    permissions: '#fd971f',
    user: '#66d9ef',
    group: '#ae81ff',
    date: '#75715e',
    size: '#fd971f',
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'Арктическая холодная палитра',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    prompt: '#88c0d0',
    command: '#d8dee9',
    output: '#d8dee9',
    error: '#bf616a',
    info: '#88c0d0',
    success: '#a3be8c',
    warning: '#ebcb8b',
    ip: '#88c0d0',
    mac: '#a3be8c',
    port: '#ebcb8b',
    number: '#b48ead',
    keyword: '#81a1c1',
    path: '#a3be8c',
    file: '#d8dee9',
    directory: '#81a1c1',
    link: '#b48ead',
    executable: '#a3be8c',
    permissions: '#d08770',
    user: '#88c0d0',
    group: '#b48ead',
    date: '#4c566a',
    size: '#ebcb8b',
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    description: 'Ретро тёплые тона',
    background: '#282828',
    foreground: '#ebdbb2',
    cursor: '#ebdbb2',
    prompt: '#83a598',
    command: '#ebdbb2',
    output: '#ebdbb2',
    error: '#fb4934',
    info: '#83a598',
    success: '#b8bb26',
    warning: '#fabd2f',
    ip: '#8ec07c',
    mac: '#b8bb26',
    port: '#fabd2f',
    number: '#d3869b',
    keyword: '#fe8019',
    path: '#b8bb26',
    file: '#ebdbb2',
    directory: '#83a598',
    link: '#d3869b',
    executable: '#b8bb26',
    permissions: '#fe8019',
    user: '#8ec07c',
    group: '#d3869b',
    date: '#928374',
    size: '#fabd2f',
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Классическая низкоконтрастная тема',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#839496',
    prompt: '#268bd2',
    command: '#839496',
    output: '#839496',
    error: '#dc322f',
    info: '#268bd2',
    success: '#859900',
    warning: '#b58900',
    ip: '#2aa198',
    mac: '#859900',
    port: '#b58900',
    number: '#6c71c4',
    keyword: '#d33682',
    path: '#859900',
    file: '#839496',
    directory: '#268bd2',
    link: '#d33682',
    executable: '#859900',
    permissions: '#cb4b16',
    user: '#2aa198',
    group: '#d33682',
    date: '#586e75',
    size: '#b58900',
  },
];

export const DEFAULT_THEME_ID = 'github-dark';

// Available terminal fonts
export const TERMINAL_FONTS = [
  { id: 'courier-new', name: 'Courier New', family: '"Courier New", Courier, monospace' },
  { id: 'consolas', name: 'Consolas', family: 'Consolas, "Courier New", monospace' },
  { id: 'monaco', name: 'Monaco', family: 'Monaco, Consolas, monospace' },
  { id: 'menlo', name: 'Menlo', family: 'Menlo, Monaco, Consolas, monospace' },
  { id: 'fira-code', name: 'Fira Code', family: '"Fira Code", Consolas, monospace' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', family: '"JetBrains Mono", Consolas, monospace' },
  { id: 'cascadia-code', name: 'Cascadia Code', family: '"Cascadia Code", Consolas, monospace' },
  { id: 'ubuntu-mono', name: 'Ubuntu Mono', family: '"Ubuntu Mono", monospace' },
];

export const DEFAULT_FONT_ID = 'cascadia-code';

export const getFont = (id: string) => {
  return TERMINAL_FONTS.find(f => f.id === id) || TERMINAL_FONTS[0];
};

export const getTheme = (id: string): SSHTheme => {
  return SSH_THEMES.find(t => t.id === id) || SSH_THEMES[0];
};

// Apply syntax highlighting to terminal output
export const highlightOutput = (text: string, theme: SSHTheme): Array<{ text: string; color: string }> => {
  const parts: Array<{ text: string; color: string }> = [];
  
  // IP address pattern
  const ipPattern = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d{1,2})?)/g;
  // Number pattern
  const numPattern = /\b(\d+)\b/g;
  // Path pattern
  const pathPattern = /(\/[^\s]+)/g;
  // MAC address
  const macPattern = /([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})/g;
  
  // Simple tokenizer
  let remaining = text;
  let lastIndex = 0;
  
  // Combine all patterns
  const combined = new RegExp(
    `(${ipPattern.source})|(${macPattern.source})|(${pathPattern.source})`,
    'g'
  );
  
  let match;
  let result = text;
  
  // For now, return simple colored segments
  return [{ text, color: theme.output }];
};
