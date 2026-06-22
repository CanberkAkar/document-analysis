import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  OnModuleInit,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Uygulama başladığında admin hesabı yoksa oluşturur.
   */
  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hukuk.ai';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existing = await this.userRepository.findOne({
      where: { email: adminEmail },
    });
    if (existing) {
      this.logger.log(`Admin hesabı zaten mevcut: ${adminEmail}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      fullName: 'Sistem Yöneticisi',
      role: UserRole.ADMIN,
      isActive: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(`✅ Admin hesabı oluşturuldu: ${adminEmail}`);
  }

  /**
   * Login — email + şifre ile JWT token üretir.
   */
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hesabınız devre dışı bırakılmış.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  /**
   * Profil — JWT token'dan kullanıcı bilgilerini döndürür.
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  async createUser(
    adminRole: UserRole,
    email: string,
    password: string,
    fullName: string,
    birthDate: string,
    barAssociation: string,
  ) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Sadece yöneticiler kullanıcı oluşturabilir.',
      );
    }

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      birthDate: birthDate ? new Date(birthDate) : null,
      barAssociation,
      role: UserRole.USER,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(`Yeni kullanıcı oluşturuldu: ${email}`);

    return {
      userId: saved.id,
      email: saved.email,
      fullName: saved.fullName,
      birthDate: saved.birthDate,
      barAssociation: saved.barAssociation,
      role: saved.role,
    };
  }

  /**
   * Tüm kullanıcıları listele — Sadece admin.
   */
  async listUsers(adminRole: UserRole) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Sadece yöneticiler kullanıcıları listeleyebilir.',
      );
    }

    const users = await this.userRepository.find({
      select: {
        id: true,
        email: true,
        fullName: true,
        birthDate: true,
        barAssociation: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => ({
      userId: u.id,
      email: u.email,
      fullName: u.fullName,
      birthDate: u.birthDate,
      barAssociation: u.barAssociation,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }

  /**
   * Kullanıcı güncelleme — Sadece admin.
   */
  async updateUser(
    adminRole: UserRole,
    userId: string,
    data: {
      fullName?: string;
      email?: string;
      password?: string;
      birthDate?: string;
      barAssociation?: string;
      isActive?: boolean;
    },
  ) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Sadece yöneticiler kullanıcı güncelleyebilir.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ConflictException('Kullanıcı bulunamadı.');
    }

    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.email !== undefined) {
      if (data.email !== user.email) {
        const existing = await this.userRepository.findOne({
          where: { email: data.email },
        });
        if (existing) {
          throw new ConflictException(
            'Bu e-posta adresi zaten başka bir kullanıcı tarafından kullanılıyor.',
          );
        }
        user.email = data.email;
      }
    }
    if (data.password !== undefined && data.password !== '') {
      user.password = await bcrypt.hash(data.password, 10);
    }
    if (data.birthDate !== undefined) {
      user.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }
    if (data.barAssociation !== undefined)
      user.barAssociation = data.barAssociation;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    const saved = await this.userRepository.save(user);
    return {
      userId: saved.id,
      email: saved.email,
      fullName: saved.fullName,
      birthDate: saved.birthDate,
      barAssociation: saved.barAssociation,
      role: saved.role,
      isActive: saved.isActive,
    };
  }

  /**
   * Kullanıcı silme — Sadece admin.
   */
  async deleteUser(adminRole: UserRole, userId: string) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Sadece yöneticiler kullanıcı silebilir.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ConflictException('Kullanıcı bulunamadı.');
    }

    await this.userRepository.remove(user);
    return { success: true, message: 'Kullanıcı başarıyla silindi.' };
  }

  /**
   * Kullanıcıyı taklit etme (Impersonate) — Sadece admin.
   */
  async impersonate(adminRole: UserRole, targetUserId: string) {
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Sadece yöneticiler doğrudan giriş yapabilir.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new ConflictException('Hedef kullanıcı bulunamadı.');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Bu kullanıcı pasif durumda olduğu için giriş yapılamaz.',
      );
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
