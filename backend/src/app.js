import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { createRoutes } from './routes/index.js';

export function createApp({ db, config }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigin === '*'
      ? true
      : config.corsOrigin.split(',').map((origin) => origin.trim()),
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use(createRoutes({
    db,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
  }));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

