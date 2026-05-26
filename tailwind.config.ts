import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: false,
    extend: {
      fontFamily: {
        display: ['"Anton"', "Impact", "system-ui", "sans-serif"],
        body: ['"Familjen Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        "paper-3": "var(--paper-3)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-4": "var(--ink-4)",
        hot: "var(--hot)",
        "hot-deep": "var(--hot-deep)",
        "hot-tint": "var(--hot-tint)",
        cobalt: "var(--cobalt)",
        "cobalt-tint": "var(--cobalt-tint)",
        warm: "var(--warm)",
        "warm-tint": "var(--warm-tint)",
        mute: "var(--mute)",
      },
      letterSpacing: {
        caption: "0.18em",
        sticker: "0.14em",
        display: "-0.02em",
        button: "0.06em",
      },
      borderWidth: {
        rule: "4px",
      },
      transitionTimingFunction: {
        out4: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "stamp-in": {
          "0%": { opacity: "0", transform: "rotate(0deg) scale(1.08)" },
          "100%": { opacity: "1", transform: "var(--stamp-rest, rotate(-2deg) scale(1))" },
        },
        "press-down": {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(2px, 2px)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "stamp-in": "stamp-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
