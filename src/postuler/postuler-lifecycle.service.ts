// src/postuler/postuler-lifecycle.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { DataSource, In, Repository } from 'typeorm';
import { Postuler } from './postuler.entity';
import { Experience } from '../experience/experience.entity';
import { StatutCandidature } from '../common/enum/statut-candidature.enum';

@Injectable()
export class PostulerLifecycleService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PostulerLifecycleService.name);

  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly dataSource: DataSource,
    @InjectRepository(Postuler)
    private readonly postulerRepo: Repository<Postuler>,
  ) {}

  /** Recrée les tâches après un redémarrage. */
  async onApplicationBootstrap(): Promise<void> {
    const actives = await this.postulerRepo.find({
      where: {
        statut_candidature: In([
          StatutCandidature.ACCEPTEE,
          StatutCandidature.EN_COURS,
        ]),
      },
      relations: { offre: true },
    });
    actives.forEach((p) => this.planifier(p));
    this.logger.log(`${actives.length} candidature(s) replanifiée(s)`);
  }

  @OnEvent('postuler.acceptee')
  async onAcceptee({ postulerId }: { postulerId: string }): Promise<void> {
    const postuler = await this.postulerRepo.findOne({
      where: { id: postulerId },
      relations: { offre: true },
    });
    if (postuler) this.planifier(postuler);
  }

  @OnEvent('postuler.annulee')
  onAnnulee({ postulerId }: { postulerId: string }): void {
    this.supprimerJob(`debut-${postulerId}`);
    this.supprimerJob(`fin-${postulerId}`);
  }

  // ─── planification ───────────────────────────────────────────────

  private planifier(postuler: Postuler): void {
    const now = new Date();
    const debut = new Date(postuler.offre.dte_debut);
    const fin = new Date(postuler.offre.dte_fin);

    if (fin <= now) {
      void this.terminer(postuler.id); // offre déjà terminée
      return;
    }
    if (debut <= now) {
      void this.demarrer(postuler.id); // déjà en cours
    } else {
      this.ajouterJob(`debut-${postuler.id}`, debut, () =>
        this.demarrer(postuler.id),
      );
    }
    this.ajouterJob(`fin-${postuler.id}`, fin, () =>
      this.terminer(postuler.id),
    );
  }

  private ajouterJob(
    name: string,
    date: Date,
    handler: () => Promise<void>,
  ): void {
    this.supprimerJob(name);
    const job = new CronJob(date, () => {
      handler()
        .catch((e) => this.logger.error(`${name} a échoué`, e))
        .finally(() => this.supprimerJob(name));
    });
    this.registry.addCronJob(name, job);
    job.start();
  }

  private supprimerJob(name: string): void {
    if (this.registry.doesExist('cron', name)) {
      this.registry.deleteCronJob(name);
    }
  }

  // ─── transitions ─────────────────────────────────────────────────

  /** ACCEPTEE → EN_COURS */
  private async demarrer(postulerId: string): Promise<void> {
    await this.postulerRepo.update(
      { id: postulerId, statut_candidature: StatutCandidature.ACCEPTEE },
      { statut_candidature: StatutCandidature.EN_COURS },
    );
  }

  /** → TERMINEE + création de l'expérience (atomique et idempotent) */
  private async terminer(postulerId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const postuler = await manager.findOne(Postuler, {
        where: { id: postulerId },
        relations: { offre: true },
        lock: { mode: 'pessimistic_write', tables: ['postuler'] },
      });
      if (!postuler) return;

      const { statut_candidature: statut } = postuler;
      if (
        statut !== StatutCandidature.EN_COURS &&
        statut !== StatutCandidature.ACCEPTEE
      ) {
        return; // déjà terminée, refusée ou annulée entre-temps
      }

      const { offre } = postuler;
      await manager.save(
        manager.create(Experience, {
          student_id: postuler.etudiantId,
          company_id: offre.companyId,
          intitule: offre.titre,
          description: offre.descriptions ?? '',
          type: offre.type_offre,
          date_debut: offre.dte_debut,
          date_fin: offre.dte_fin,
          media_ids: [],
        }),
      );

      postuler.statut_candidature = StatutCandidature.TERMINEE;
      await manager.save(postuler);
    });
  }
}
