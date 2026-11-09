import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Postuler } from '../postuler/postuler.entity';
import { Offre } from '../offre/offre.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import Company from '../company/company.entity';
import { Statut } from '../common/enum/statut.enum';
import { StatisticsDto } from './statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Postuler)
    private readonly postulerRepo: Repository<Postuler>,
    @InjectRepository(Offre)
    private readonly offreRepository: Repository<Offre>,
    @InjectRepository(Etudiant)
    private readonly etudiantRepository: Repository<Etudiant>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Compte les candidatures, les offres actives, les étudiants et les
   * entreprises. Les quatre requêtes sont indépendantes : on les lance en
   * parallèle. Les enregistrements supprimés logiquement sont exclus.
   */
  async getResume(): Promise<StatisticsDto> {
    const [candidatures, offresActives, etudiants, entreprises] =
      await Promise.all([
        this.postulerRepo.count({ where: { statut: Not(Statut.SUPPRIME) } }),
        this.offreRepository.count({ where: { statut: Statut.ACTIF } }),
        this.etudiantRepository.count({
          where: { statut: Not(Statut.SUPPRIME) },
        }),
        this.companyRepository.count({
          where: { statut: Not(Statut.SUPPRIME) },
        }),
      ]);

    return { candidatures, offresActives, etudiants, entreprises };
  }
}
