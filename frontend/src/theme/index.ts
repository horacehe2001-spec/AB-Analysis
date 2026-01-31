import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e676',
      light: '#69f0ae',
      dark: '#00c853',
      contrastText: '#0a1628',
    },
    secondary: {
      main: '#00bfa5',
      light: '#64ffda',
      dark: '#00897b',
    },
    success: {
      main: '#00e676',
      light: '#69f0ae',
      dark: '#00c853',
    },
    warning: {
      main: '#ffab00',
      light: '#ffd740',
      dark: '#ff8f00',
    },
    error: {
      main: '#ff5252',
      light: '#ff8a80',
      dark: '#d50000',
    },
    background: {
      default: '#0a1628',
      paper: '#0f2035',
    },
    text: {
      primary: '#e0f2f1',
      secondary: '#80cbc4',
    },
    divider: 'rgba(0, 230, 118, 0.12)',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"PingFang SC"',
      '"Microsoft YaHei"',
    ].join(','),
    h4: {
      fontWeight: 600,
      color: '#e0f2f1',
    },
    h5: {
      fontWeight: 600,
      color: '#e0f2f1',
    },
    h6: {
      fontWeight: 600,
      color: '#e0f2f1',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a1628',
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0, 230, 118, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0, 191, 165, 0.03) 0%, transparent 50%)',
          backgroundAttachment: 'fixed',
        },
        '*::-webkit-scrollbar': {
          width: 6,
        },
        '*::-webkit-scrollbar-track': {
          background: '#0a1628',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 230, 118, 0.3)',
          borderRadius: 3,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 230, 118, 0.5)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        outlined: {
          borderColor: 'rgba(0, 230, 118, 0.4)',
          color: '#00e676',
          '&:hover': {
            borderColor: '#00e676',
            backgroundColor: 'rgba(0, 230, 118, 0.08)',
          },
        },
        contained: {
          backgroundColor: '#00e676',
          color: '#0a1628',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#00c853',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#0f2035',
          border: '1px solid rgba(0, 230, 118, 0.12)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0f2035',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 230, 118, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 230, 118, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00e676',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(0, 230, 118, 0.3)',
          color: '#80cbc4',
        },
        colorPrimary: {
          backgroundColor: 'rgba(0, 230, 118, 0.15)',
          color: '#00e676',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f2035',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 230, 118, 0.04)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0b1a30',
          borderBottom: '1px solid rgba(0, 230, 118, 0.12)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 230, 118, 0.08)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 230, 118, 0.12)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
        },
        bar: {
          backgroundColor: '#00e676',
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 230, 118, 0.2)',
          '&.Mui-active': {
            color: '#00e676',
          },
          '&.Mui-completed': {
            color: '#00e676',
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: '#80cbc4',
          '&.Mui-active': {
            color: '#00e676',
          },
          '&.Mui-completed': {
            color: '#00e676',
          },
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: 'rgba(0, 230, 118, 0.2)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0f2035',
          border: '1px solid rgba(0, 230, 118, 0.12)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 230, 118, 0.08)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardError: {
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          color: '#ff8a80',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#80cbc4',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#80cbc4',
        },
      },
    },
  },
});
