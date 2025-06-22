import { createTheme, alpha } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    neutral: Palette["primary"];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    neutral: true;
  }
}

declare module "@mui/material/TextField" {
  interface TextFieldPropsColorOverrides {
    neutral: true;
  }
}

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      light: "#3b82f6",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#7c3aed",
      light: "#8b5cf6",
      dark: "#6d28d9",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#ffffff",
    },
    neutral: {
      main: "#6b7280",
      light: "#9ca3af",
      dark: "#4b5563",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
    },
    divider: "#e5e7eb",
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: "-0.025em",
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
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      textTransform: "none",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0px 1px 2px rgba(0, 0, 0, 0.05)",
    "0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)",
    "0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)",
    "0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)",
    "0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)",
    "0px 25px 50px rgba(0, 0, 0, 0.1), 0px 10px 20px rgba(0, 0, 0, 0.04)",
    "0px 30px 60px rgba(0, 0, 0, 0.1), 0px 15px 30px rgba(0, 0, 0, 0.04)",
    "0px 35px 70px rgba(0, 0, 0, 0.1), 0px 20px 40px rgba(0, 0, 0, 0.04)",
    "0px 40px 80px rgba(0, 0, 0, 0.1), 0px 25px 50px rgba(0, 0, 0, 0.04)",
    "0px 45px 90px rgba(0, 0, 0, 0.1), 0px 30px 60px rgba(0, 0, 0, 0.04)",
    "0px 50px 100px rgba(0, 0, 0, 0.1), 0px 35px 70px rgba(0, 0, 0, 0.04)",
    "0px 55px 110px rgba(0, 0, 0, 0.1), 0px 40px 80px rgba(0, 0, 0, 0.04)",
    "0px 60px 120px rgba(0, 0, 0, 0.1), 0px 45px 90px rgba(0, 0, 0, 0.04)",
    "0px 65px 130px rgba(0, 0, 0, 0.1), 0px 50px 100px rgba(0, 0, 0, 0.04)",
    "0px 70px 140px rgba(0, 0, 0, 0.1), 0px 55px 110px rgba(0, 0, 0, 0.04)",
    "0px 75px 150px rgba(0, 0, 0, 0.1), 0px 60px 120px rgba(0, 0, 0, 0.04)",
    "0px 80px 160px rgba(0, 0, 0, 0.1), 0px 65px 130px rgba(0, 0, 0, 0.04)",
    "0px 85px 170px rgba(0, 0, 0, 0.1), 0px 70px 140px rgba(0, 0, 0, 0.04)",
    "0px 90px 180px rgba(0, 0, 0, 0.1), 0px 75px 150px rgba(0, 0, 0, 0.04)",
    "0px 95px 190px rgba(0, 0, 0, 0.1), 0px 80px 160px rgba(0, 0, 0, 0.04)",
    "0px 100px 200px rgba(0, 0, 0, 0.1), 0px 85px 170px rgba(0, 0, 0, 0.04)",
    "0px 105px 210px rgba(0, 0, 0, 0.1), 0px 90px 180px rgba(0, 0, 0, 0.04)",
    "0px 110px 220px rgba(0, 0, 0, 0.1), 0px 95px 190px rgba(0, 0, 0, 0.04)",
    "0px 115px 230px rgba(0, 0, 0, 0.1), 0px 100px 200px rgba(0, 0, 0, 0.04)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          height: "100%",
          width: "100%",
        },
        body: {
          height: "100%",
          width: "100%",
          margin: 0,
          padding: 0,
        },
        "#root": {
          height: "100%",
          width: "100%",
        },
        "input:-webkit-autofill": {
          WebkitBoxShadow: "0 0 0 1000px white inset",
          WebkitTextFillColor: "#1f2937",
        },
        "input:-webkit-autofill:focus": {
          WebkitBoxShadow: "0 0 0 1000px white inset",
          WebkitTextFillColor: "#1f2937",
        },
        "input:-webkit-autofill:hover": {
          WebkitBoxShadow: "0 0 0 1000px white inset",
          WebkitTextFillColor: "#1f2937",
        },
        "input:-webkit-autofill:active": {
          WebkitBoxShadow: "0 0 0 1000px white inset",
          WebkitTextFillColor: "#1f2937",
        },
        "::-webkit-scrollbar": {
          width: "8px",
          height: "8px",
        },
        "::-webkit-scrollbar-track": {
          background: "#f1f5f9",
          borderRadius: "8px",
        },
        "::-webkit-scrollbar-thumb": {
          background: "#cbd5e1",
          borderRadius: "8px",
          transition: "background-color 0.2s ease",
        },
        "::-webkit-scrollbar-thumb:hover": {
          background: "#94a3b8",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        contained: {
          "&:hover": {
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
          },
        },
        outlined: {
          borderWidth: "1.5px",
          "&:hover": {
            borderWidth: "1.5px",
          },
        },
        sizeSmall: {
          padding: "6px 16px",
          fontSize: "0.875rem",
        },
        sizeMedium: {
          padding: "8px 20px",
          fontSize: "0.875rem",
        },
        sizeLarge: {
          padding: "12px 24px",
          fontSize: "1rem",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha("#2563eb", 0.3),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#2563eb",
              borderWidth: "2px",
            },
          },
          "& .MuiInputLabel-root": {
            "&.Mui-focused": {
              color: "#2563eb",
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e5e7eb",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow:
              "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        },
        elevation2: {
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        },
        elevation3: {
          boxShadow:
            "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
          boxShadow: "4px 0 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 8px",
          "&:hover": {
            backgroundColor: alpha("#2563eb", 0.04),
          },
          "&.Mui-selected": {
            backgroundColor: alpha("#2563eb", 0.08),
            "&:hover": {
              backgroundColor: alpha("#2563eb", 0.12),
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 8px",
          "&:hover": {
            backgroundColor: alpha("#2563eb", 0.04),
          },
          "&.Mui-selected": {
            backgroundColor: alpha("#2563eb", 0.08),
            "&:hover": {
              backgroundColor: alpha("#2563eb", 0.12),
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid #ffffff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          border: "2px solid #ffffff",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow:
            "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiSnackbarContent-root": {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme;
