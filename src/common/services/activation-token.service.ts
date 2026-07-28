import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { ActivationToken } from '../../entity/activation-token.entity';
import { ExceptionFactory } from '../exceptions/exception-factory';

interface GeneratedToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class ActivationTokenService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Génère un token brut (envoyé par email) et son hash (stocké en base).
   * Ne persiste rien — à utiliser avec createAndSave() ou dans une transaction existante.
   */
  generate(validityHours = 24): GeneratedToken {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000);
    return { rawToken, tokenHash, expiresAt };
  }

  private hash(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Génère et persiste un token pour un user donné.
   * Accepte un EntityManager optionnel pour s'insérer dans une transaction existante
   * (ex: création d'étudiant dans un queryRunner).
   */
  async createAndSave(
    userId: string,
    manager?: EntityManager,
    validityHours = 24,
  ): Promise<string> {
    const repo = manager
      ? manager.getRepository(ActivationToken)
      : this.dataSource.getRepository(ActivationToken);

    const { rawToken, tokenHash, expiresAt } = this.generate(validityHours);

    const token = repo.create({ userId, tokenHash, expiresAt });
    await repo.save(token);

    return rawToken; // c'est ce qu'on met dans le lien envoyé par email
  }

  /**
   * Vérifie un token reçu et retourne le userId associé si valide.
   * Marque le token comme utilisé.
   */
  async consume(rawToken: string, manager?: EntityManager): Promise<string> {
    const repo = manager
      ? manager.getRepository(ActivationToken)
      : this.dataSource.getRepository(ActivationToken);

    const tokenHash = this.hash(rawToken);
    const activationToken = await repo.findOne({
      where: { tokenHash, used: false },
    });

    if (!activationToken)
      ExceptionFactory.notFound("Lien d'activation invalide ou déjà utilisé");

    if (activationToken.expiresAt < new Date())
      ExceptionFactory.businessConflict(
        'ActivationToken',
        'Ce lien a expiré, veuillez en demander un nouveau',
      );

    await repo.update(activationToken.id, { used: true });

    return activationToken.userId;
  }

  buildActivationLink(rawToken: string): string {
    return `${process.env.FRONTEND_URL}/activation?token=${rawToken}`;
  }
}
