import type { Request, Response } from 'express';
import app from '../server';

export default function handler(req: Request, res: Response) {
  // Ensure process.env.VERCEL is set
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1';
  }

  // If Vercel rewrote the path to /api/index, restore the original URL
  // so Express route handlers (/api/students, /api/classes, etc.) match correctly.
  const originalUrl = 
    (req.headers['x-matched-path'] as string) || 
    (req.headers['x-forwarded-uri'] as string) ||
    req.url;

  if (originalUrl && originalUrl.startsWith('/api/') && req.url === '/api/index') {
    req.url = originalUrl;
  }

  try {
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Handler Error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Terjadi kesalahan pada fungsi serverless backend: ' + (err?.message || 'Server Error'),
        success: false
      });
    }
  }
}

