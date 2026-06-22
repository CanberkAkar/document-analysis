import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserRole } from './user.entity';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// ─── DTOs ────────────────────────────────────────────────────
class LoginDto {
  email: string;
  password: string;
}

class CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  birthDate: string;
  barAssociation: string;
}

class UpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  birthDate?: string;
  barAssociation?: string;
  isActive?: boolean;
}

// ─── Controller ──────────────────────────────────────────────
@ApiTags('Auth (Kimlik Doğrulama)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Kullanıcı girişi — JWT token döndürür.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Giriş yapmış kullanıcının profil bilgileri.' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('create-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni kullanıcı oluşturur (Sadece Admin).' })
  async createUser(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateUserDto,
  ) {
    return this.authService.createUser(
      req.user.role,
      dto.email,
      dto.password,
      dto.fullName,
      dto.birthDate,
      dto.barAssociation,
    );
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm kullanıcıları listeler (Sadece Admin).' })
  async listUsers(@Request() req: AuthenticatedRequest) {
    return this.authService.listUsers(req.user.role);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı bilgilerini günceller (Sadece Admin).' })
  async updateUser(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateUser(req.user.role, id, dto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcıyı siler (Sadece Admin).' })
  async deleteUser(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.authService.deleteUser(req.user.role, id);
  }

  @Post('impersonate/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kullanıcıyı taklit ederek giriş yapar (Sadece Admin).',
  })
  async impersonate(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.authService.impersonate(req.user.role, id);
  }
}
