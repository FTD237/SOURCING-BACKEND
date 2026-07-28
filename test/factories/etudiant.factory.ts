// test/factories/etudiant.factory.ts

import { Statut } from '../../src/common/enum/statut.enum';
import { Etudiant } from '../../src/etudiant/etudiant.entity';

export const buildEtudiant = (overrides: Partial<Etudiant> = {}): Etudiant =>
  ({
    id: 'etu-1',
    userId: 'us-1',
    promotionId: 'prom-1',
    matricule: 'matricule-test',
    annee_acad: '2026-2027',
    is_job_seeker: false,
    star_rate: 2,
    statut: Statut.ACTIF,
    create_by: 'admin-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as Etudiant;
