import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { Postuler } from '../postuler/postuler.entity';
import { Offre } from '../offre/offre.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import Company from '../company/company.entity';
import { Statut } from '../common/enum/statut.enum';

type StatutFiltre = { statut: { _type?: string; _value?: unknown } | string };

describe('StatisticsService', () => {
  let service: StatisticsService;
  const postulerRepo = { count: jest.fn() };
  const offreRepo = { count: jest.fn() };
  const etudiantRepo = { count: jest.fn() };
  const companyRepo = { count: jest.fn() };

  beforeEach(async () => {
    postulerRepo.count.mockResolvedValue(128);
    offreRepo.count.mockResolvedValue(42);
    etudiantRepo.count.mockResolvedValue(310);
    companyRepo.count.mockResolvedValue(25);

    const moduleRef = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getRepositoryToken(Postuler), useValue: postulerRepo },
        { provide: getRepositoryToken(Offre), useValue: offreRepo },
        { provide: getRepositoryToken(Etudiant), useValue: etudiantRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
      ],
    }).compile();

    service = moduleRef.get(StatisticsService);
  });

  afterEach(() => jest.resetAllMocks());

  it('renvoie les quatre compteurs', async () => {
    const result = await service.getResume();

    expect(result).toEqual({
      candidatures: 128,
      offresActives: 42,
      etudiants: 310,
      entreprises: 25,
    });
  });

  it('ne compte que les offres actives', async () => {
    await service.getResume();

    expect(offreRepo.count).toHaveBeenCalledWith({
      where: { statut: Statut.ACTIF },
    });
  });

  it.each([
    ['candidatures', postulerRepo],
    ['étudiants', etudiantRepo],
    ['entreprises', companyRepo],
  ])('exclut les %s supprimés du comptage', async (_nom, repo) => {
    await service.getResume();

    const [options] = repo.count.mock.calls[0] as [{ where: StatutFiltre }];
    expect((options.where.statut as { _type: string })._type).toBe('not');
  });

  it('renvoie 0 quand il n’y a aucune donnée', async () => {
    postulerRepo.count.mockResolvedValue(0);
    offreRepo.count.mockResolvedValue(0);
    etudiantRepo.count.mockResolvedValue(0);
    companyRepo.count.mockResolvedValue(0);

    await expect(service.getResume()).resolves.toEqual({
      candidatures: 0,
      offresActives: 0,
      etudiants: 0,
      entreprises: 0,
    });
  });

  it('propage une erreur de base de données', async () => {
    etudiantRepo.count.mockRejectedValue(new Error('db error'));

    await expect(service.getResume()).rejects.toThrow('db error');
  });
});
