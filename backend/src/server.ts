import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { prisma } from './prisma';
import { authMiddleware } from './middleware/auth';
import { errorMiddleware } from './middleware/error';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import discoveryRouter from './routes/discovery';
import swipesRouter from './routes/swipes';
import matchesRouter from './routes/matches';
import messagesRouter from './routes/messages';
import reportsRouter from './routes/reports';
import photosRouter from './routes/photos';
import devRouter from './routes/dev';
import blocksRouter from './routes/blocks';
import onboardingRouter from './routes/onboarding';

const app = express();

// Disable ETag to avoid 304 Not Modified causing client refresh loops
app.set('etag', false);

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Force no-cache on API responses to ensure clients always get fresh data
app.use((_, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/dev', devRouter); // keep dev endpoints public for local testing

// Everything below requires auth (x-user-id dev header)
app.use(authMiddleware);

app.use('/users', usersRouter);
app.use('/discovery', discoveryRouter);
app.use('/swipes', swipesRouter);
app.use('/matches', matchesRouter);
app.use('/messages', messagesRouter);
app.use('/reports', reportsRouter);
app.use('/photos', photosRouter);
app.use('/blocks', blocksRouter);
app.use('/onboarding', onboardingRouter);

app.use(errorMiddleware);

const port = Number(process.env.PORT || 4000);

async function start() {
  try {
    await prisma.$connect();
    app.listen(port, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on http://0.0.0.0:${port}`);
      console.log(`Local access: http://localhost:${port}`);
      console.log(`Network access: http://192.168.1.22:${port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
}

start();

