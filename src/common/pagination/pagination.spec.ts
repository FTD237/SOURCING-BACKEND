// src/common/pagination/pagination.spec.ts
import { paginer, triAutorise } from './index';
import { PaginationDto } from './pagination.dto';

describe('paginer', () => {
  const buildDto = (overrides: Partial<PaginationDto> = {}): PaginationDto =>
    Object.assign(
      new PaginationDto(),
      { page: 1, limite: 10, ordre: 'DESC' },
      overrides,
    );

  it('assemble les données et les métadonnées à partir du couple [données, total]', () => {
    const donnees = [{ id: 1 }, { id: 2 }];
    const pagination = buildDto({ page: 1, limite: 10 });

    const result = paginer([donnees, 2], pagination);

    expect(result.donnees).toEqual(donnees);
    expect(result.meta).toEqual({
      page: 1,
      limite: 10,
      total: 2,
      totalPages: 1,
      aSuivante: false,
      aPrecedente: false,
    });
  });

  it('calcule totalPages correctement (arrondi au supérieur)', () => {
    const pagination = buildDto({ page: 1, limite: 10 });

    const result = paginer([[], 25], pagination);

    expect(result.meta.totalPages).toBe(3);
  });

  it('aSuivante est true si la page courante ne couvre pas tout le total', () => {
    const pagination = buildDto({ page: 1, limite: 10 });

    const result = paginer([[], 25], pagination);

    expect(result.meta.aSuivante).toBe(true);
  });

  it('aSuivante est false sur la dernière page même si elle est pleine', () => {
    const pagination = buildDto({ page: 2, limite: 10 });

    const result = paginer([[], 20], pagination);

    expect(result.meta.aSuivante).toBe(false);
  });

  it('aPrecedente est false sur la première page', () => {
    const pagination = buildDto({ page: 1, limite: 10 });

    const result = paginer([[], 5], pagination);

    expect(result.meta.aPrecedente).toBe(false);
  });

  it('aPrecedente est true à partir de la page 2', () => {
    const pagination = buildDto({ page: 2, limite: 10 });

    const result = paginer([[], 25], pagination);

    expect(result.meta.aPrecedente).toBe(true);
  });
});

describe('triAutorise', () => {
  const autorisees = ['nom', 'dte_creation'] as const;

  it("retourne le tri demandé s'il fait partie des colonnes autorisées", () => {
    expect(triAutorise('nom', autorisees, 'dte_creation')).toBe('nom');
  });

  it("retourne la valeur par défaut si le tri demandé n'est pas autorisé", () => {
    expect(triAutorise('mot_de_passe', autorisees, 'dte_creation')).toBe(
      'dte_creation',
    );
  });

  it("retourne la valeur par défaut si aucun tri n'est demandé", () => {
    expect(triAutorise(undefined, autorisees, 'dte_creation')).toBe(
      'dte_creation',
    );
  });
});
