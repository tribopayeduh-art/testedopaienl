if (process.env.VERCEL === '1') Reflect.set(process.env, 'NODE_ENV', 'production');
import { config } from 'dotenv';
// Vite uses .env.local; Express must explicitly load it as well. Process env always wins.
config({path:'.env.local',quiet:true});
config({path:'.env',quiet:true});
