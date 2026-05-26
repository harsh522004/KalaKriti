import 'dotenv/config';
import { startServer } from './app';
import { startListeners } from './listeners';

async function main() {
  await startListeners();
  startServer(Number(process.env.PORT) || 3001);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
