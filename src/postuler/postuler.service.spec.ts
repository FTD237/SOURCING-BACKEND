// src/postuler/postuler.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulerService } from './postuler.service';
import { Postuler } from './postuler.entity';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { CreatePostulerDto } from './dto/create-postuler.dto';
import { UpdatePostulerStatutDto } from './dto/update-postuler-statut.dto';
import { StatutCandidature } from '../common/enum/statut-candidature.enum';
import { Statut } from '../common/enum/statut.enum';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../common/enum/notification-type.enum';

describe('PostulerService', () => {
  let service: PostulerService;
  let notificationService: jest.Mocked<NotificationService>;
  let repository: jest.Mocked<Repository<Postuler>>;

  const currentUser = { id: 'user-1', email: 'user@test.com' };

  const mockPostuler: Postuler = {
    id: 'postuler-1',
    offreId: 'offre-1',
    etudiantId: 'etudiant-1',
    date_candidature: new Date(),
    statut_candidature: StatutCandidature.EN_ATTENTE,
  } as Postuler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostulerService,
        {
          provide: getRepositoryToken(Postuler),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostulerService>(PostulerService);
    notificationService = module.get(NotificationService);
    repository = module.get(getRepositoryToken(Postuler));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreatePostulerDto = {
      offreId: 'offre-1',
      etudiantId: 'etudiant-1',
    };

    const withRelations: Postuler = {
      ...mockPostuler,
      offre: {
        descriptions: 'Développeur Backend',
        company: { user_id: 'company-user-1' },
      },
      etudiant: { userId: 'etudiant-1' },
    } as Postuler;

    it("crée une candidature et notifie l'entreprise quand aucune candidature n'existe déjà", async () => {
      repository.findOne
        .mockResolvedValueOnce(null) // vérification d'existence
        .mockResolvedValueOnce(withRelations); // rechargement avec relations
      repository.create.mockReturnValue(mockPostuler);
      repository.save.mockResolvedValue(mockPostuler);

      const result = await service.create(dto, currentUser);

      expect(repository.findOne).toHaveBeenNthCalledWith(1, {
        where: { offreId: dto.offreId, etudiantId: dto.etudiantId },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockPostuler);
      expect(result).toEqual(mockPostuler);

      expect(notificationService.create).toHaveBeenCalledWith({
        userId: 'company-user-1',
        type: NotificationType.CANDIDATURE_RECUE,
        titre: 'Nouvelle candidature reçue',
        message:
          'Vous avez reçu une nouvelle candidature pour l\'offre "Développeur Backend".',
        data: { offreId: withRelations.offreId, postulerId: mockPostuler.id },
      });
    });

    it('lève un conflit si la candidature existe déjà et ne notifie pas', async () => {
      repository.findOne.mockResolvedValue(mockPostuler);
      const conflictSpy = jest
        .spyOn(ExceptionFactory, 'conflict')
        .mockImplementation(() => {
          throw new Error('conflict');
        });

      await expect(service.create(dto, currentUser)).rejects.toThrow(
        'conflict',
      );
      expect(conflictSpy).toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(notificationService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retourne toutes les candidatures avec relations', async () => {
      repository.find.mockResolvedValue([mockPostuler]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: { offre: true, etudiant: true },
        order: { date_candidature: 'DESC' },
      });
      expect(result).toEqual([mockPostuler]);
    });
  });

  describe('findOne', () => {
    it('retourne la candidature si trouvée', async () => {
      repository.findOne.mockResolvedValue(mockPostuler);

      const result = await service.findOne('postuler-1');

      expect(result).toEqual(mockPostuler);
    });

    it("lève une 404 si la candidature n'existe pas", async () => {
      repository.findOne.mockResolvedValue(null);
      const notFoundSpy = jest
        .spyOn(ExceptionFactory, 'notFound')
        .mockImplementation(() => {
          throw new Error('not found');
        });

      await expect(service.findOne('unknown')).rejects.toThrow('not found');
      expect(notFoundSpy).toHaveBeenCalled();
    });
  });

  describe('findByOffre', () => {
    it('retourne les candidatures pour une offre', async () => {
      repository.find.mockResolvedValue([mockPostuler]);

      const result = await service.findByOffre('offre-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { offreId: 'offre-1' },
        relations: { etudiant: true },
        order: { date_candidature: 'DESC' },
      });
      expect(result).toEqual([mockPostuler]);
    });
  });

  describe('findByEtudiant', () => {
    it("retourne les candidatures d'un étudiant", async () => {
      repository.find.mockResolvedValue([mockPostuler]);

      const result = await service.findByEtudiant('etudiant-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { etudiantId: 'etudiant-1' },
        relations: { offre: true },
        order: { date_candidature: 'DESC' },
      });
      expect(result).toEqual([mockPostuler]);
    });
  });

  describe('updateStatut', () => {
    const postulerAvecRelations: Postuler = {
      ...mockPostuler,
      offre: { descriptions: 'Développeur Backend' },
      etudiant: { userId: 'etudiant-1' },
    } as Postuler;

    it('met à jour le statut, audite le user et notifie en cas de statut ACCEPTEE', async () => {
      repository.findOne.mockResolvedValue({ ...postulerAvecRelations });
      repository.save.mockImplementation((p) => Promise.resolve(p as Postuler));

      const dto: UpdatePostulerStatutDto = {
        statut: StatutCandidature.ACCEPTEE,
      };
      const result = await service.updateStatut('postuler-1', dto, currentUser);

      expect(result.statut_candidature).toBe(StatutCandidature.ACCEPTEE);
      expect(result.updated_by).toBe(currentUser.id);
      expect(repository.save).toHaveBeenCalled();

      expect(notificationService.create).toHaveBeenCalledWith({
        userId: 'etudiant-1',
        type: NotificationType.CANDIDATURE_ACCEPTEE,
        titre: 'Candidature acceptée',
        message: 'Votre candidature pour "Développeur Backend" a été acceptée.',
        data: {
          offreId: postulerAvecRelations.offreId,
          postulerId: 'postuler-1',
        },
      });
    });

    it('notifie avec le bon message en cas de statut REFUSEE', async () => {
      repository.findOne.mockResolvedValue({ ...postulerAvecRelations });
      repository.save.mockImplementation((p) => Promise.resolve(p as Postuler));

      const dto: UpdatePostulerStatutDto = {
        statut: StatutCandidature.REFUSEE,
      };
      await service.updateStatut('postuler-1', dto, currentUser);

      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.CANDIDATURE_REFUSEE,
          titre: 'Candidature refusée',
        }),
      );
    });

    it('ne notifie pas si le statut reste EN_ATTENTE', async () => {
      repository.findOne.mockResolvedValue({ ...postulerAvecRelations });
      repository.save.mockImplementation((p) => Promise.resolve(p as Postuler));

      const dto: UpdatePostulerStatutDto = {
        statut: StatutCandidature.EN_ATTENTE,
      };
      await service.updateStatut('postuler-1', dto, currentUser);

      expect(notificationService.create).not.toHaveBeenCalled();
    });

    it("ne notifie pas si la candidature n'a pas de relation étudiant chargée", async () => {
      repository.findOne.mockResolvedValue({ ...mockPostuler }); // pas de `etudiant`
      repository.save.mockImplementation((p) => Promise.resolve(p as Postuler));

      const dto: UpdatePostulerStatutDto = {
        statut: StatutCandidature.ACCEPTEE,
      };
      await service.updateStatut('postuler-1', dto, currentUser);

      expect(notificationService.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('effectue un soft delete sans notifier', async () => {
      repository.findOne.mockResolvedValue({ ...mockPostuler });
      repository.save.mockResolvedValue({} as Postuler);

      await service.remove('postuler-1', currentUser);

      const savedArg = repository.save.mock.calls[0][0] as Postuler;
      expect(savedArg.statut).toBe(Statut.SUPPRIME);
      expect(savedArg.dte_suppression).toBeInstanceOf(Date);
      expect(savedArg.updated_by).toBe(currentUser.id);
      expect(notificationService.create).not.toHaveBeenCalled();
    });

    it('capture une erreur DB via ExceptionFactory.database', async () => {
      repository.findOne.mockResolvedValue({ ...mockPostuler });
      repository.save.mockRejectedValue(new Error('db error'));
      const dbSpy = jest
        .spyOn(ExceptionFactory, 'database')
        .mockImplementation(() => {
          throw new Error('database error');
        });

      await expect(service.remove('postuler-1', currentUser)).rejects.toThrow(
        'database error',
      );
      expect(dbSpy).toHaveBeenCalled();
    });
  });
});
