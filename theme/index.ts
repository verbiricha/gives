import { createTheme, ThemeOptions } from '@mui/material/styles'

const getDesignTokens = (mode: string) =>
  <ThemeOptions>{
    typography: {
      fontFamily: ['StrikeDiatype', 'system-ui', 'sans-serif'].join(','),
      h1: {
        fontSize: '96px',
        lineHeight: '88px',
        fontWeight: 500,
      },
      h2: {
        fontSize: '72px',
        lineHeight: '64px',
        fontWeight: 500,
      },
      h3: {
        fontSize: '48px',
        lineHeight: '48px',
        fontWeight: 500,
      },
      h4: {
        fontSize: '32px',
        lineHeight: '36px',
        fontWeight: 500,
      },
      h5: {
        fontSize: '24px',
        lineHeight: '28px',
        fontWeight: 500,
      },
      h6: {
        fontSize: '18px',
        lineHeight: '20px',
        fontWeight: 500,
      },
      body1: {
        fontSize: '20px',
        lineHeight: '28px',
        fontWeight: 400,
      },
      body2: {
        fontSize: '16px',
        lineHeight: '24px',
        fontWeight: 400,
      },
    },

    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // palette values for light mode
            primary: {
              main: '#000000',
            },
            background: {
              default: '#FFFFFF',
              paper: '#FFFFFF',
            },
          }
        : {
            // palette values for dark mode
            primary: {
              main: '#FFFFFF',
            },
            background: {
              default: '#000000',
              paper: '#000000',
            },
          }),
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: `
        @font-face {
          font-family: 'StrikeDiatype';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('StrikeDiatype'), local('StrikeDiatype'), format('woff2');
        }
        @font-face {
          font-family: 'StrikeDiatype';
          font-style: normal;
          font-display: swap;
          font-weight: 500;
          src: local('StrikeDiatype-Medium'), local('StrikeDiatype-Medium'), format('woff2');
        }
      `,
      },
    },
  }

export const theme = createTheme(getDesignTokens('dark'))
