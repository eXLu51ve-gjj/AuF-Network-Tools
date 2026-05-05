/**
 * Utility for loading SVG icons
 */

// Cache for loaded SVG content
const iconCache: Record<string, string> = {};

/**
 * Load an SVG icon by name
 */
export const loadIcon = async (name: string): Promise<string> => {
  // Check cache first
  if (iconCache[name]) {
    return iconCache[name];
  }
  
  try {
    // Dynamically import the SVG file
    const iconPath = `/src/renderer/assets/icons/${name}.svg`;
    const response = await fetch(iconPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load icon: ${name}`);
    }
    
    const svgContent = await response.text();
    iconCache[name] = svgContent;
    return svgContent;
  } catch (error) {
    console.error(`Error loading icon ${name}:`, error);
    
    // Return a fallback SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>`;
  }
};

/**
 * Preload multiple icons
 */
export const preloadIcons = async (iconNames: string[]): Promise<void> => {
  await Promise.all(iconNames.map(name => loadIcon(name)));
};

/**
 * Get icon names available in the assets directory
 */
export const getAvailableIcons = (): string[] => {
  return [
    'ping',
    'traceroute',
    'wifi',
    'ssh',
    'port-scan',
    'dns',
    'settings',
  ];
};