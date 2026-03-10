import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
  {
    ignores: ['.next/**/*', 'node_modules/**/*', 'supabase/**/*', 'next.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.configs['core-web-vitals'],
)

