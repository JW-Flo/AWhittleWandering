import { Request, Response, NextFunction } from 'express';

function redactIp(ip: string): string {
  if (!ip) return ip;
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = 'xxx';
      return parts.join('.');
    }
  }
  // IPv6 simple: replace last group
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 0) {
      parts[parts.length - 1] = 'xxxx';
      return parts.join(':');
    }
  }
  return ip;
}

function redactUserAgent(ua: string | undefined): string {
  if (!ua) return '';
  if (ua.length <= 50) return ua;
  return ua.slice(0, 50) + '...';
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const path = req.path;
    const status = res.statusCode;
    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] as string | undefined || '';
    const redactedIp = redactIp(typeof ip === 'string' ? ip : Array.isArray(ip) ? ip[0] : '');
    const userAgent = req.get('User-Agent') || '';
    const redactedUa = redactUserAgent(userAgent);
    console.log({
      method,
      path,
      status,
      responseTime: `${duration}ms`,
      ip: redactedIp,
      userAgent: redactedUa,
    });
  });
  next();
}
