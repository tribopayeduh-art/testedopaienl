// Native Express entry point for Vercel. Internal TypeScript is bundled at build time.
import express from 'express';
import app from './build/backend.mjs';
export default app;
