#!/usr/bin/env node
/**
 * check-env.js — Pre-deploy environment variable validator
 *
 * Run before starting in production to catch missing or insecure config:
 *   node check-env.js
 *
 * Exits with code 1 if any check fails so CI/CD pipelines can gate deploys.
 */

import dotenv from 'dotenv';
dotenv.config();

const errors   = [];
const warnings = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fail = (msg) => errors.push(`  ✗  ${msg}`);
const warn = (msg) => warnings.push(`  ⚠  ${msg}`);
const ok   = (msg) => console.log(`  ✓  ${msg}`);

// ── Required vars ─────────────────────────────────────────────────────────────
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'EMAIL_FROM',
  'CORS_ORIGIN',
  'CLIENT_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    fail(`${key} is not set`);
  }
}

// ── JWT secrets ───────────────────────────────────────────────────────────────
const jwtSecret        = process.env.JWT_SECRET        ?? '';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? '';

if (jwtSecret.length < 64) {
  fail(`JWT_SECRET is too short (${jwtSecret.length} chars — need ≥ 64)`);
} else {
  ok('JWT_SECRET length OK');
}

if (jwtRefreshSecret.length < 64) {
  fail(`JWT_REFRESH_SECRET is too short (${jwtRefreshSecret.length} chars — need ≥ 64)`);
} else {
  ok('JWT_REFRESH_SECRET length OK');
}

if (jwtSecret === jwtRefreshSecret) {
  fail('JWT_SECRET and JWT_REFRESH_SECRET must be different values');
} else if (jwtSecret && jwtRefreshSecret) {
  ok('JWT secrets are distinct');
}

// Detect placeholder values
const placeholders = ['REPLACE_WITH', 'your-secret', 'changeme', 'secret'];
for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
  const val = process.env[key] ?? '';
  if (placeholders.some((p) => val.toLowerCase().includes(p.toLowerCase()))) {
    fail(`${key} looks like a placeholder — replace with a real value`);
  }
}

// ── NODE_ENV ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  warn(`NODE_ENV is "${process.env.NODE_ENV}" — should be "production" for deploy`);
} else {
  ok('NODE_ENV=production');
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX ?? '500');
if (rateLimitMax === 0) {
  fail('RATE_LIMIT_MAX=0 disables rate limiting — never deploy with this in production');
} else if (rateLimitMax > 1000) {
  warn(`RATE_LIMIT_MAX=${rateLimitMax} is very high — consider 500 or lower`);
} else {
  ok(`RATE_LIMIT_MAX=${rateLimitMax}`);
}

// ── Trust proxy ───────────────────────────────────────────────────────────────
const trustProxy = parseInt(process.env.TRUST_PROXY ?? '0');
if (trustProxy === 0) {
  warn('TRUST_PROXY=0 — set to 1 if running behind nginx or a load balancer');
} else {
  ok(`TRUST_PROXY=${trustProxy}`);
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN ?? '';
if (corsOrigin.includes('localhost')) {
  warn(`CORS_ORIGIN includes "localhost" (${corsOrigin}) — should be your production domain`);
} else if (corsOrigin) {
  ok(`CORS_ORIGIN=${corsOrigin}`);
}

// ── Email ─────────────────────────────────────────────────────────────────────
const emailFrom = process.env.EMAIL_FROM ?? '';
if (!emailFrom || emailFrom.includes('localhost') || emailFrom.includes('example')) {
  warn(`EMAIL_FROM="${emailFrom}" — password reset emails may fail or look suspicious`);
} else {
  ok(`EMAIL_FROM=${emailFrom}`);
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  warn('EMAIL_USER or EMAIL_PASSWORD not set — will fall back to Ethereal (dev/test only)');
} else {
  ok('Email credentials set');
}

// ── Log level ─────────────────────────────────────────────────────────────────
if (process.env.LOG_LEVEL === 'debug' && process.env.NODE_ENV === 'production') {
  warn('LOG_LEVEL=debug in production can expose sensitive data — use "info" or "warn"');
} else {
  ok(`LOG_LEVEL=${process.env.LOG_LEVEL ?? 'default'}`);
}

// ── MongoDB URI ───────────────────────────────────────────────────────────────
const mongoUri = process.env.MONGODB_URI ?? '';
if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
  warn('MONGODB_URI points to localhost — use MongoDB Atlas or a replica set in production');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('══════════════════════════════════════');
console.log(' Environment Check Results');
console.log('══════════════════════════════════════');

if (warnings.length) {
  console.log('\n⚠  Warnings:');
  warnings.forEach((w) => console.log(w));
}

if (errors.length) {
  console.log('\n❌ Errors (must fix before deploying):');
  errors.forEach((e) => console.log(e));
  console.log('');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed — ready to deploy');
  console.log('');
}
