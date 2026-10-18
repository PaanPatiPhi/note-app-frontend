import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--marker)",
        "primary-foreground": "var(--page)",
        secondary: "var(--paper)",
        "secondary-foreground": "var(--ink)",
        destructive: "var(--danger)",
        "destructive-foreground": "var(--page)",
        muted: "var(--rule)",
        "muted-foreground": "var(--ink-muted)",
        ring: "var(--marker)",
        border: "var(--rule)",
        foreground: "var(--ink)",
      },
    },
  },
};

export default config;