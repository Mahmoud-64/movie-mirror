import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { stdTimeFunctions } from 'pino';

export function buildPinoConfig(config: ConfigService): Params {
  const pretty =
    config.get<string>('LOG_PRETTY', 'false') === 'true' ||
    config.get<string>('NODE_ENV') !== 'production';

  return {
    pinoHttp: {
      level: config.get<string>('LOG_LEVEL', 'info'),
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      customProps: () => ({ context: 'HTTP' }),
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      ...(pretty
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
          }
        : {
            timestamp: stdTimeFunctions.isoTime,
            formatters: { level: (label: string) => ({ level: label }) },
          }),
    },
  };
}
