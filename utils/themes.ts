export interface Theme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  cardBackground: string;
  modalOverlay: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  inputBackground: string;
  inputBorder: string;
}

export const lightTheme: Theme = {
  background: '#f0f4f8',
  surface: '#fafbfc',
  text: '#2d3748',
  textSecondary: '#718096',
  primary: '#4299e1',
  border: '#e2e8f0',
  cardBackground: '#fafbfc',
  modalOverlay: 'rgba(0, 0, 0, 0.4)',
  accent: '#319795',
  success: '#38a169',
  warning: '#ed8936',
  error: '#e53e3e',
  inputBackground: '#f7fafc',
  inputBorder: '#cbd5e0',
};

export const darkTheme: Theme = {
  background: '#1a202c',        // Dark blue-gray
  surface: '#2d3748',           // Lighter surface
  text: '#f7fafc',              // Light text
  textSecondary: '#a0aec0',     // Muted gray for secondary text
  primary: '#63b3ed',           // Light blue accent
  border: '#4a5568',            // Subtle borders
  cardBackground: '#2d3748',    // Card background
  modalOverlay: 'rgba(26, 32, 44, 0.8)', // Dark overlay
  accent: '#4fd1c7',            // Teal accent
  success: '#48bb78',           // Green
  warning: '#ed8936',           // Orange
  error: '#f56565',             // Red
  inputBackground: '#2d3748',   // Input background
  inputBorder: '#4a5568',       // Input borders
};

export const getTheme = (themeType: 'light' | 'dark'): Theme => {
  return themeType === 'dark' ? darkTheme : lightTheme;
};
