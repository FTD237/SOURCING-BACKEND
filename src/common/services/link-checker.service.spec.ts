import { BadRequestException } from '@nestjs/common';
import { LinkCheckerService } from './link-checker.service';

describe('LinkCheckerService', () => {
  let service: LinkCheckerService;
  let fetchMock: jest.Mock;
  beforeEach(() => {
    service = new LinkCheckerService();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isReachable', () => {
    it('retourne true si la requête HEAD réussit', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });

      const result = await service.isReachable('https://example.com');

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ method: 'HEAD' }),
      );
    });

    it('retombe sur GET si HEAD échoue, et retourne true si GET réussit', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('HEAD non supporté'))
        .mockResolvedValueOnce({ ok: true });

      const result = await service.isReachable('https://example.com');

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://example.com',
        expect.objectContaining({ method: 'HEAD' }),
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://example.com',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('retourne false si HEAD et GET échouent tous les deux', async () => {
      fetchMock.mockRejectedValue(new Error('Timeout'));

      const result = await service.isReachable('https://site-down.com');

      expect(result).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("retourne false si la réponse HTTP a un statut d'erreur (4xx/5xx)", async () => {
      fetchMock.mockResolvedValue({ ok: false });

      const result = await service.isReachable('https://example.com/404');

      expect(result).toBe(false);
    });
  });

  describe('validateLinksOrThrow', () => {
    it("ne lève pas d'exception si tous les liens sont accessibles", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      await expect(
        service.validateLinksOrThrow({
          linkedin: 'https://linkedin.com/in/test',
          github: 'https://github.com/test',
        }),
      ).resolves.toBeUndefined();
    });

    it('ignore les champs undefined/null/vides', async () => {
      fetchMock.mockResolvedValue({ ok: true });

      await service.validateLinksOrThrow({
        linkedin: 'https://linkedin.com/in/test',
        github: undefined,
        portfolio: null,
      });

      // Un seul appel réseau : uniquement pour "linkedin"
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('lève une BadRequestException listant les liens inaccessibles', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('linkedin')) return Promise.resolve({ ok: true });
        return Promise.reject(new Error('down'));
      });

      await expect(
        service.validateLinksOrThrow({
          linkedin: 'https://linkedin.com/in/test',
          portfolio: 'https://site-down.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("inclut le nom du champ et l'URL dans le message d'erreur", async () => {
      fetchMock.mockRejectedValue(new Error('down'));

      await expect(
        service.validateLinksOrThrow({
          portfolio: 'https://site-down.com',
        }),
      ).rejects.toThrow('portfolio (https://site-down.com)');
    });

    it("ne fait aucun appel réseau si aucun lien n'est fourni", async () => {
      await service.validateLinksOrThrow({});

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
