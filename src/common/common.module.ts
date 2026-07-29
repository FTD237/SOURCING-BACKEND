import { ActivationTokenService } from './services/activation-token.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [ActivationTokenService /* autres services */],
  exports: [ActivationTokenService], // ⚠️ ajoute cette ligne si manquante
})
export class CommonModule {}
