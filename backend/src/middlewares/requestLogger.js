export function requestLogger(write = console.log) {
  return (request, response, next) => {
    const startedAt = performance.now();
    const path = request.path.replace(/[\r\n\t]/g, '');

    response.once('finish', () => {
      const duration = Math.round(performance.now() - startedAt);
      write(`${request.method} ${path} -> ${response.statusCode} - ${duration} ms`);
    });

    next();
  };
}
