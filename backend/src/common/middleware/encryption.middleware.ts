import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionMiddleware implements NestMiddleware {
  private readonly logger = new Logger('EncryptionMiddleware');
  private readonly key: Buffer;

  constructor() {
    const secret =
      process.env.COMMUNICATION_SECRET || 'super_secret_comm_key_123!';
    // Derive a 32-byte key from the secret using SHA-256
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  use(req: Request, res: Response, next: NextFunction) {
    // 1. Decrypt Request Body
    const contentType = req.headers['content-type'];
    const bodyObj = req.body as Record<string, unknown> | null | undefined;
    if (
      contentType &&
      contentType.includes('application/json') &&
      bodyObj &&
      typeof bodyObj === 'object' &&
      typeof bodyObj.iv === 'string' &&
      typeof bodyObj.data === 'string'
    ) {
      try {
        const decryptedStr = this.decrypt(bodyObj.iv, bodyObj.data);
        req.body = JSON.parse(decryptedStr) as unknown;
      } catch (error) {
        const stack = error instanceof Error ? error.stack : undefined;
        this.logger.error('Failed to decrypt request body', stack);
        return res.status(400).json({
          statusCode: 400,
          message: 'Hatalı şifrelenmiş veri paketi.',
        });
      }
    }

    // 2. Intercept and Encrypt Response Body
    const originalSend = res.send;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    res.send = function (body: any) {
      const responseContentType = res.getHeader('Content-Type');
      if (
        responseContentType &&
        typeof responseContentType === 'string' &&
        responseContentType.includes('application/json') &&
        body
      ) {
        try {
          let bodyStr: string;
          if (typeof body === 'string') {
            bodyStr = body;
          } else if (Buffer.isBuffer(body)) {
            bodyStr = body.toString('utf8');
          } else {
            bodyStr = JSON.stringify(body);
          }

          // Encrypt payload
          const encrypted = self.encrypt(bodyStr);
          const encryptedJson = JSON.stringify(encrypted);

          // Remove Content-Length so Express recalculates it dynamically for the new body
          res.removeHeader('content-length');

          return originalSend.call(this, encryptedJson);
        } catch (error) {
          const stack = error instanceof Error ? error.stack : undefined;
          self.logger.error('Failed to encrypt response body', stack);
        }
      }
      return originalSend.call(this, body);
    };

    next();
  }

  private encrypt(text: string): { iv: string; data: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return {
      iv: iv.toString('base64'),
      data: encrypted,
    };
  }

  private decrypt(ivBase64: string, dataBase64: string): string {
    const iv = Buffer.from(ivBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
    let decrypted = decipher.update(dataBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
