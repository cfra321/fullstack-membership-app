/**
 * Express.js API Entry Point
 *
 * Starts the Express server with environment configuration.
 */

import dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

import { createApp } from './app';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = createApp();

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Astronacci API Server                                    ║
║                                                            ║
║   Environment: ${NODE_ENV.padEnd(40)}║
║   Port: ${String(PORT).padEnd(47)}║
║   Health: http://localhost:${PORT}/api/health${' '.repeat(17)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
