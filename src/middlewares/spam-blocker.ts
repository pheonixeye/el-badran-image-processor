import { Request, Response, NextFunction } from 'express';

// Extremely common vulnerability scanner / bot endpoints pattern list
const spammyPatterns = [
  /^\/wp-admin/i,
  /^\/wp-login\.php/i,
  /\.env$/i,
  /\.git/i,
  /\.php$/i,
  /\.jsp$/i,
  /\.asp$/i,
  /^\/actuator/i,
  /^\/v1\/agent/i, // Consul exploits
  /^\/api\/v2\/echo/i,
];

export const spamBlocker = (req: Request, res: Response, next: NextFunction) => {
  const url = req.originalUrl;
  
  // Check if URL matches known spam patterns
  const isSpam = spammyPatterns.some(pattern => pattern.test(url));
  
  if (isSpam) {
    console.warn(`[SPAM BLOCKED] IP: ${req.ip || req.socket.remoteAddress} tried to access: ${url} (Origin: ${req.headers.origin || 'Unknown'})`);
    return res.status(403).json({
      error: "Forbidden. Resource access denied.",
    });
  }

  next();
};
