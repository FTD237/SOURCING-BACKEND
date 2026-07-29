// test/factories/user.factory.ts
import { User } from '../../src/user/user.entity';
import { Statut } from '../../src/common/enum/statut.enum';

export const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'us-1',
    email: 'etudiant.test@example.com',
    password: process.env.TEST_HASHED_PASSWORD,
    nom: 'Doe',
    prenom: 'Jane',
    id_role: 'role-etudiant-1',
    statut: Statut.EN_ATTENTE_ACTIVATION,
    create_by: 'admin-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as User;
