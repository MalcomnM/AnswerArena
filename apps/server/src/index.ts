import { createApp } from './app.js';
import { config } from './config.js';

const { httpServer } = createApp();

httpServer.listen(config.port, () => {
  console.log(`AnswerArena server running on port ${config.port}`);
});
