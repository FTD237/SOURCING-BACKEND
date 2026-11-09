import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: "Connexion d'un utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Email ou mot de passe incorect' })
  async login(@Body() loginDto: LoginDto): Promise<{
    access_token: string;
    user: { id: string; nom: string; email: string };
  }> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiResponse({
    status: 200,
    description:
      'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto.email);

    return {
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Réinitialisation du mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  @Post('activate-account')
  @ApiOperation({ summary: "Activer le compte d'un utilisateur" })
  @ApiResponse({
    status: 400,
    description: "Ce compte n'est pas en attente d'activation",
  })
  async activateAccount(@Body() activateAccountDto: ActivateAccountDto) {
    await this.authService.activateAccount(
      activateAccountDto.token,
      activateAccountDto.password,
    );
  }

  @Post('resend-activation')
  @ApiOperation({
    summary: "Renvoyer le mail d'activation pour un compte précis.",
  })
  async resendActivation(@Body() resendActivation: ResendActivationDto) {
    await this.authService.resendActivation(resendActivation.email);
  }
}
