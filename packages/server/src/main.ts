import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    // Allow all origins for local development (you can restrict this in production)
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow localhost and local network IPs
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Allow any 192.168.x.x IP
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/, // Allow any 10.x.x.x IP (common local network)
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/, // Allow 172.16-31.x.x IPs
      ];

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });

      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
