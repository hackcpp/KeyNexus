# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KeyNexus is a cloud-based secret management tool for developers, deployed on Vercel with Supabase for storage. It implements a **zero-knowledge architecture**: all sensitive data is encrypted in the browser before leaving the device, and the server never sees plaintext keys.

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: Supabase (Auth + Database)
- **Authentication**: Google OAuth via Supabase Auth
- **Encryption**: AES-GCM with PBKDF2 key derivation (client-side only)

## Architecture

### Security Model

- Master password is never sent to the server
- PBKDF2-HMAC-SHA256 derives a 256-bit key from master password
- AES-GCM encryption ensures ciphertext integrity
- Row-Level Security (RLS) on Supabase ensures multi-tenant isolation

### Database Schema

```
api_keys table:
- id: UUID (primary key)
- user_id: UUID (linked to auth.users)
- name: String (service name, plaintext)
- type: String ('simple' | 'pair')
- encrypted_payload: Text (Base64 encoded ciphertext)
- iv: Text (Base64 encoded 12-byte IV)
- salt: Text (Base64 encoded PBKDF2 salt)
- created_at: Timestamp
```

## Entry Points

- `/app` - Next.js App Router pages
- Components and utilities will be in standard Next.js directories

## Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run lint        # Run ESLint

# Testing
npm test            # Run tests
npm run test:watch  # Watch mode
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Key Patterns

- All encryption/decryption happens client-side
- Master password stored in sessionStorage (cleared on tab close)
- Two credential modes: Simple Key (single) and ID+Secret (pair)
- Sensitive data never logged or exposed in error messages
