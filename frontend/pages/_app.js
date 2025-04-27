import React from 'react';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from '../components/Layout';

// Material-UI Theme erstellen
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Dunkelblau (Assetto Corsa Farbe)
    },
    secondary: {
      main: '#d32f2f', // Rot (Assetto Corsa Sekundärfarbe)
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Assetto Corsa Server Manager</title>
        <meta name="description" content="Verwaltungsanwendung für Assetto Corsa Server" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout title={pageProps.title || 'Assetto Corsa Server Manager'}>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
} 