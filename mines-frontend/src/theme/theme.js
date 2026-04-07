"use client";

import { createTheme } from "@mui/material/styles";

// ── Color Palette ──────────────────────────────────────────────
export const palette = {
    primary: {
        main: "#1565C0",
        light: "#1E88E5",
        dark: "#0D47A1",
    },
    secondary: {
        main: "#00BCD4",
        light: "#26C6DA",
        dark: "#00838F",
    },
    background: {
        default: "#FFFFFF",
        paper: "#F5F7FA",
        dark: "#0A1128",
        darkCard: "#0D1B3E",
    },
    text: {
        primary: "#202224",
        secondary: "#001629",
        white: "#FFFFFF",
        muted: "#9CA3AF",
    },
    divider: "rgba(255, 255, 255, 0.12)",
    gradient: {
        primary: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)",
        accent: "linear-gradient(135deg, #00BCD4 0%, #1565C0 100%)",
        dark: "linear-gradient(180deg, #0A1128 0%, #0D1B3E 100%)",
    },
};

// ── MUI Theme ──────────────────────────────────────────────────
const theme = createTheme({
    palette: {
        mode: "light",
        primary: palette.primary,
        secondary: palette.secondary,
        background: {
            default: palette.background.default,
            paper: palette.background.paper,
        },
        text: {
            primary: palette.text.primary,
            secondary: palette.text.secondary,
        },
        divider: palette.divider,
    },
    typography: {
        fontFamily: "'Satoshi', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        h1: {
            fontSize: "2.5rem",
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: "2rem",
            fontWeight: 700,
            lineHeight: 1.3,
        },
        h3: {
            fontSize: "1.5rem",
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: "1.25rem",
            fontWeight: 600,
            lineHeight: 1.4,
        },
        body1: {
            fontSize: "1rem",
            lineHeight: 1.6,
        },
        body2: {
            fontSize: "0.875rem",
            lineHeight: 1.5,
        },
        button: {
            textTransform: "none",
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: "10px 24px",
                    fontSize: "0.95rem",
                },
                containedPrimary: {
                    background: palette.gradient.primary,
                    "&:hover": {
                        background: palette.gradient.accent,
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                },
            },
        },
    },
});

export default theme;
