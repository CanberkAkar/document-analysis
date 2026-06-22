import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_legal_key_123!', // Canlıda mutlaka env'den alınmalı
    });
  }

  validate(payload: JwtPayload) {
    // Burada gelen token payload'unu doğrulayıp kullanıcının veritabanında olup olmadığını kontrol edebilirsiniz.
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
