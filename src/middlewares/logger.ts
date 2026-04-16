import morgan from 'morgan';

// Create a custom morgan format that includes IP, request origin, method, URL, and user agent
export const requestLogger = morgan((tokens, req, res) => {
  return [
    `[${tokens.date(req, res, 'iso')}]`,
    `IP: ${tokens['remote-addr'](req, res)}`,
    `Origin: ${req.headers.origin || req.headers.host || 'Unknown'}`,
    `->`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    `-`,
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
});
