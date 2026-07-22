// experience.steps.ts
import { Given, When, Then, Before } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ExperienceService } from '../../../src/experience/experience.service';
import { Experience } from '../../../src/experience/experience.entity';
import { Statut } from '../../../src/common/enum/statut.enum';
import {
  CreateExperienceDto,
  UpdateExperienceDto,
} from '../../../src/experience/experience.dto';

// ── Typed interfaces ────────────────────────────────────────

interface FindOptions {
  where?: {
    id?: string;
    student_id?: string;
  };
}

interface MockRepository {
  create: (dto: Partial<Experience>) => Partial<Experience>;
  save: (exp: Partial<Experience>) => Experience;
  find: (options?: FindOptions) => Experience[];
  findOne: (options: FindOptions) => Experience | null;
}

// Map English feature status values to backend enum values
const statusMap: Record<string, string> = {
  ACTIVE: Statut.ACTIF,
  INACTIVE: Statut.INACTIF,
  DELETED: Statut.SUPPRIME,
  ACTIF: Statut.ACTIF,
  INACTIF: Statut.INACTIF,
  SUPPRIME: Statut.SUPPRIME,
};

const mapStatus = (status: string): string => {
  return statusMap[status.toUpperCase()] ?? status;
};

let service: ExperienceService;
let repoMock: MockRepository;
let store: Experience[] = [];
let result: Experience | Experience[] | undefined;
let error: Error | undefined;

Before(async function () {
  store = [];
  result = undefined;
  error = undefined;

  repoMock = {
    create: (dto: Partial<Experience>): Partial<Experience> => ({ ...dto }),
    save: (exp: Partial<Experience>): Experience => {
      const id = exp.id ?? `exp-${store.length + 1}`;
      const saved = { ...exp, id } as Experience;
      const idx = store.findIndex((e) => e.id === id);
      if (idx >= 0) store[idx] = saved;
      else store.push(saved);
      return saved;
    },
    find: (options?: FindOptions): Experience[] => {
      const studentId = options?.where?.student_id;
      if (studentId) {
        return store.filter((e) => e.student_id === studentId);
      }
      return store;
    },
    findOne: (options: FindOptions): Experience | null => {
      return store.find((e) => e.id === options.where?.id) ?? null;
    },
  };

  const module = await Test.createTestingModule({
    providers: [
      ExperienceService,
      { provide: getRepositoryToken(Experience), useValue: repoMock },
    ],
  }).compile();

  service = module.get<ExperienceService>(ExperienceService);
});

// ── Background ──────────────────────────────────────────────

Given('a student {string} exists', function (studentId: string) {
  this.studentId = studentId;
});

// ── List all experiences ────────────────────────────────────

Given('several experiences are registered', function () {
  store.push(
    { id: 'exp-1', student_id: 'etu-1', statut: Statut.ACTIF } as Experience,
    { id: 'exp-2', student_id: 'etu-2', statut: Statut.ACTIF } as Experience,
  );
});

// ── Search by student ───────────────────────────────────────

Given(
  'student {string} has {int} registered experiences',
  function (studentId: string, count: number) {
    for (let i = 0; i < count; i++) {
      store.push({
        id: `exp-${i}`,
        student_id: studentId,
        statut: Statut.ACTIF,
      } as Experience);
    }
  },
);

Given('student {string} has no experience', function (studentId: string) {
  const studentExperiences = store.filter((e) => e.student_id === studentId);
  assert.equal(studentExperiences.length, 0);
});

// ── Single experience setup ────────────────────────────────

Given('an experience {string} exists', function (id: string) {
  store.push({ id, student_id: 'etu-1', statut: Statut.ACTIF } as Experience);
});

Given(
  'an experience {string} exists with status {string}',
  function (id: string, statut: string) {
    store.push({
      id,
      student_id: 'etu-1',
      statut: mapStatus(statut) as Statut,
    } as Experience);
  },
);

// ── When steps ──────────────────────────────────────────────

When(
  'I create an experience for student {string}',
  async function (studentId: string) {
    result = await service.create({
      student_id: studentId,
    } as CreateExperienceDto);
  },
);

When('I request the list of all experiences', async function () {
  result = await service.findAll();
});

When(
  'I search for experiences of student {string}',
  async function (studentId: string) {
    result = await service.findByEtudiant(studentId);
  },
);

When('I view experience {string}', async function (id: string) {
  try {
    result = await service.findOne(id);
  } catch (e: unknown) {
    error = e instanceof Error ? e : new Error('Unknown error');
  }
});

When(
  'I update the status of experience {string} to {string}',
  async function (id: string, statut: string) {
    result = await service.update(id, {
      statut: mapStatus(statut),
    } as UpdateExperienceDto);
  },
);

When('I update experience {string}', async function (id: string) {
  try {
    result = await service.update(id, {});
  } catch (e: unknown) {
    error = e instanceof Error ? e : new Error('Unknown error');
  }
});

When('I delete experience {string}', async function (id: string) {
  try {
    await service.remove(id);
    result = store.find((e) => e.id === id);
  } catch (e: unknown) {
    error = e instanceof Error ? e : new Error('Unknown error');
  }
});

// ── Then steps ──────────────────────────────────────────────

Then('the experience is saved successfully', function () {
  assert.ok(result);
});

Then(
  'the experience is associated with student {string}',
  function (studentId: string) {
    if (!result || Array.isArray(result)) {
      assert.fail('Expected a single experience');
    }
    assert.equal(result.student_id, studentId);
  },
);

Then('I receive the complete list with student information', function () {
  if (!Array.isArray(result)) {
    assert.fail('Expected result to be an array');
  }
  assert.ok(result.length > 0);
});

Then(
  'I receive {int} experiences linked to this student',
  function (count: number) {
    if (!Array.isArray(result)) {
      assert.fail('Expected result to be an array');
    }
    assert.equal(result.length, count);
  },
);

Then('I receive an empty list', function () {
  assert.deepEqual(result, []);
});

Then('I receive the details of experience {string}', function (id: string) {
  if (!result || Array.isArray(result)) {
    assert.fail('Expected a single experience');
  }
  assert.equal(result.id, id);
});

Then('I receive a {string} error', function (errorType: string) {
  assert.ok(error);

  const errorTypeMap: Record<string, new (...args: never[]) => Error> = {
    'not found': NotFoundException,
  };

  const ExpectedClass = errorTypeMap[errorType.toLowerCase()];

  if (ExpectedClass) {
    assert.ok(
      error instanceof ExpectedClass,
      `Expected ${ExpectedClass.name} but got ${error.constructor.name}`,
    );
  } else {
    assert.match(error.message, new RegExp(errorType, 'i'));
  }
});

Then(
  'experience {string} has the status {string}',
  function (id: string, statut: string) {
    const exp = store.find((e) => e.id === id);
    assert.ok(exp);
    assert.equal(exp.statut, mapStatus(statut));
  },
);

Then('experience {string} has a deletion date set', function (id: string) {
  const exp = store.find((e) => e.id === id);
  assert.ok(exp);
  assert.ok(exp.dte_suppression instanceof Date);
});
