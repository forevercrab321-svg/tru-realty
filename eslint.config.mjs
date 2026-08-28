import next from "eslint-config-next";

/**
 * Flat config for Next.js 16 + TypeScript.
 * Two rules are relaxed deliberately — see comments.
 */
const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "scripts/**", "gateway/**"],
  },
  {
    rules: {
      // Property and project imagery is static SVG served from /public. next/image
      // adds no value for these and would require dangerouslyAllowSVG.
      "@next/next/no-img-element": "off",
      // Recharts tooltip render props are untyped by the library.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
