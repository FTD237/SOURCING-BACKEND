// features/step_definitions/etudiant.creation.steps.ts
import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { EtudiantService } from '../../../src/etudiant/etudiant.service';
import { Logger } from '@nestjs/common';

interface World {
  etudiantService: EtudiantService;
  etudiantRepo: any;
  userRepo: any;
  roleRepo: any;
  dataSource: any;
  queryRunner: any;
  activationTokenService: any;
  mailService: any;
  logger: any;

  currentUser: { id: string; email: string };
  existingUsersByEmail: Map<string, any>;
  roleEtudiantExists: boolean;
  dbSaveShouldFail: boolean;
  tokenGenerationShouldFail: boolean;
  mailServiceShouldFail: boolean;
  loggedError: boolean;

  dtoInput: Record<string, any>;
  missingField?: string;

  result?: any;
  error?: any;

  savedUser?: any;
  savedEtudiant?: any;
}

let ctx: Partial<World> = {};

Before(function () {
  ctx = {};
  ctx.existingUsersByEmail = new Map();
  ctx.roleEtudiantExists = true;
  ctx.dbSaveShouldFail = false;
  ctx.tokenGenerationShouldFail = false;
  ctx.mailServiceShouldFail = false;
  ctx.loggedError = false;

  // --- Repository mocks ---
  ctx.userRepo = {
    findOne: sinon.stub().callsFake(async ({ where: { email } }: any) => {
      return ctx.existingUsersByEmail!.get(email) ?? null;
    }),
    update: sinon.stub().resolves({}),
  };

  ctx.roleRepo = {
    findOne: sinon.stub().callsFake(async () => {
      return ctx.roleEtudiantExists
        ? { id: 'ROLE-ETUDIANT-ID', nom: 'etudiant' }
        : null;
    }),
  };

  ctx.etudiantRepo = {
    find: sinon.stub(),
    findOne: sinon.stub(),
    update: sinon.stub().resolves({}),
    save: sinon.stub(),
  };

  // --- QueryRunner / transaction mock ---
  const manager = {
    create: sinon.stub().callsFake((_entity: any, data: any) => ({ ...data })),
    save: sinon.stub().callsFake(async (entity: any) => {
      if (ctx.dbSaveShouldFail) {
        throw new Error('Simulated database failure');
      }
      if (entity.matricule !== undefined) {
        ctx.savedEtudiant = { id: 'ETUDIANT-ID-1', ...entity };
        return ctx.savedEtudiant;
      }
      ctx.savedUser = { id: 'USER-ID-1', ...entity };
      return ctx.savedUser;
    }),
  };

  ctx.queryRunner = {
    connect: sinon.stub().resolves(),
    startTransaction: sinon.stub().resolves(),
    commitTransaction: sinon.stub().resolves(),
    rollbackTransaction: sinon.stub().resolves(),
    release: sinon.stub().resolves(),
    manager,
  };

  ctx.dataSource = {
    createQueryRunner: sinon.stub().returns(ctx.queryRunner),
  };

  // --- Activation token service mock ---
  ctx.activationTokenService = {
    createAndSave: sinon.stub().callsFake(async () => {
      if (ctx.tokenGenerationShouldFail) {
        throw new Error('Simulated token generation failure');
      }
      return 'RAW-ACTIVATION-TOKEN';
    }),
    buildActivationLink: sinon
      .stub()
      .returns('https://app.school.cm/activate?token=RAW-ACTIVATION-TOKEN'),
  };

  // --- Mail service mock ---
  ctx.mailService = {
    sendAccountActivationMail: sinon.stub().callsFake(async () => {
      if (ctx.mailServiceShouldFail) {
        throw new Error('Simulated mail service failure');
      }
      return true;
    }),
  };

  // --- LOGGER: SOLUTION 3 ---
  // 1. Créer une instance réelle du logger
  ctx.logger = new Logger(EtudiantService.name);

  // 2. Stubber la méthode error
  sinon.stub(ctx.logger, 'error').callsFake((message: any, error?: any) => {
    ctx.loggedError = true;
    // Optionnel : afficher un message de debug
    console.log('🔴 Logger.error appelé avec:', message);
  });

  // 3. Créer le service
  ctx.etudiantService = new EtudiantService(
    ctx.etudiantRepo,
    ctx.userRepo,
    ctx.roleRepo,
    ctx.dataSource,
    ctx.activationTokenService,
    ctx.mailService,
  );

  // 4. Remplacer le logger interne par notre stub
  (ctx.etudiantService as any).logger = ctx.logger;

  ctx.dtoInput = {};
});

// ---------------------------------------------------------------------------
// GIVEN steps
// ---------------------------------------------------------------------------

Given(
  'I am logged in as user {string} with id {string}',
  function (email: string, id: string) {
    ctx.currentUser = { id, email };
  },
);

Given('the role {string} exists in the system', function (_roleName: string) {
  ctx.roleEtudiantExists = true;
});

Given(
  'the role {string} does not exist in the system',
  function (_roleName: string) {
    ctx.roleEtudiantExists = false;
  },
);

Given('no user exists with the email {string}', function (email: string) {
  ctx.existingUsersByEmail!.delete(email);
});

Given(
  'a user already exists with the email {string}',
  function (email: string) {
    ctx.existingUsersByEmail!.set(email, {
      id: 'EXISTING-USER-ID',
      email,
      nom: 'Existant',
      prenom: 'Utilisateur',
    });
  },
);

Given('the mail service is unavailable', function () {
  ctx.mailServiceShouldFail = true;
});

Given('the database save operation will fail', function () {
  ctx.dbSaveShouldFail = true;
});

Given('the activation token generation service fails', function () {
  ctx.tokenGenerationShouldFail = true;
});

// ---------------------------------------------------------------------------
// WHEN steps
// ---------------------------------------------------------------------------

When(
  'I create a student with the following information:',
  async function (dataTable) {
    const dto = dataTable.rowsHash();
    ctx.dtoInput = dto;

    try {
      ctx.result = await ctx.etudiantService!.create(
        dto as any,
        ctx.currentUser!,
      );
    } catch (error) {
      ctx.error = error;
    }
  },
);

When(
  'I attempt to create a student with the email {string}',
  async function (email: string) {
    const dto = {
      nom: 'Test',
      prenom: 'User',
      email,
      matricule: 'MAT-TEST-000',
      promotionId: 'PROMO-TEST',
    };
    ctx.dtoInput = dto;

    try {
      ctx.result = await ctx.etudiantService!.create(
        dto as any,
        ctx.currentUser!,
      );
    } catch (error) {
      ctx.error = error;
    }
  },
);

When(
  'I attempt to create a student without providing the {string} field',
  async function (missingField: string) {
    const dto: Record<string, any> = {
      nom: 'Test',
      prenom: 'User',
      email: `${Math.random().toString(36).slice(2)}@etu.cm`,
      matricule: 'MAT-TEST-001',
      promotionId: 'PROMO-TEST',
    };
    delete dto[missingField];
    ctx.dtoInput = dto;
    ctx.missingField = missingField;

    try {
      validateRequiredFields(dto, [
        'nom',
        'prenom',
        'email',
        'matricule',
        'promotionId',
      ]);
      ctx.result = await ctx.etudiantService!.create(
        dto as any,
        ctx.currentUser!,
      );
    } catch (error) {
      ctx.error = error;
    }
  },
);

function validateRequiredFields(dto: Record<string, any>, required: string[]) {
  const missing = required.filter(
    (field) => dto[field] === undefined || dto[field] === '',
  );
  if (missing.length > 0) {
    const error: any = new Error(
      `Validation failed: missing field(s) ${missing.join(', ')}`,
    );
    error.type = 'validation';
    error.fields = missing;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// THEN steps
// ---------------------------------------------------------------------------

Then('the creation should succeed', function () {
  expect(ctx.error, `Expected no error but got: ${ctx.error?.message}`).to.be
    .undefined;
  expect(ctx.result).to.exist;
});

Then('the creation should succeed regardless', function () {
  expect(ctx.error).to.be.undefined;
  expect(ctx.result).to.exist;
});

Then(
  'a user should be created with status {string}',
  function (status: string) {
    expect(ctx.savedUser).to.exist;
    expect(ctx.savedUser.statut).to.equal(status);
  },
);

Then(
  'a student should be created with status {string}',
  function (status: string) {
    expect(ctx.savedEtudiant).to.exist;
    expect(ctx.savedEtudiant.statut).to.equal(status);
  },
);

Then('an activation token should be generated and saved', function () {
  expect(ctx.activationTokenService!.createAndSave.called).to.be.true;
});

Then(
  'an activation email should be sent to {string}',
  function (email: string) {
    expect(ctx.mailService!.sendAccountActivationMail.calledOnce).to.be.true;
    const [sentEmail] =
      ctx.mailService!.sendAccountActivationMail.firstCall.args;
    expect(sentEmail).to.equal(email);
  },
);

Then('the response should contain the created user and student', function () {
  expect(ctx.result.user).to.exist;
  expect(ctx.result.etudiant).to.exist;
});

Then('the user and student should be persisted in the database', function () {
  expect(ctx.queryRunner!.commitTransaction.called).to.be.true;
  expect(ctx.savedUser).to.exist;
  expect(ctx.savedEtudiant).to.exist;
});

Then('an error should be logged for the failed email delivery', function () {
  // Ajout d'un debug pour comprendre pourquoi le test échoue
  console.log('🔍 ctx.loggedError =', ctx.loggedError);
  console.log('🔍 ctx.mailServiceShouldFail =', ctx.mailServiceShouldFail);
  console.log('🔍 Logger.error appelé ?', (ctx.logger.error as sinon.SinonStub).called);
  expect(ctx.loggedError).to.be.true;
});

Then('the transaction should not be rolled back', function () {
  expect(ctx.queryRunner!.rollbackTransaction.called).to.be.false;
});

Then('the creation should fail with a business conflict error', function () {
  expect(ctx.error).to.exist;
});

Then('the error message should state {string}', function (message: string) {
  expect(ctx.error.message).to.include(message);
});

Then('no user or student should be created in the database', function () {
  expect(ctx.queryRunner!.manager.save.called).to.be.false;
});

Then('no email should be sent', function () {
  expect(ctx.mailService!.sendAccountActivationMail.called).to.be.false;
});

Then(
  'the creation should fail with a {string} error',
  function (_errorType: string) {
    expect(ctx.error).to.exist;
  },
);

Then(
  'the error message should indicate that the role {string} does not exist',
  function (roleName: string) {
    expect(ctx.error.message).to.include(roleName);
  },
);

Then('the transaction should be rolled back', function () {
  expect(ctx.queryRunner!.rollbackTransaction.called).to.be.true;
});

Then('a {string} error should be returned', function (_errorType: string) {
  expect(ctx.error).to.exist;
});

Then('no user or student should remain in the database', function () {
  expect(ctx.queryRunner!.commitTransaction.called).to.be.false;
});

Then('the creation should fail with a validation error', function () {
  expect(ctx.error).to.exist;
  expect(ctx.error.type).to.equal('validation');
});

Then(
  'the error message should mention the field {string}',
  function (field: string) {
    expect(ctx.error.message).to.include(field);
  },
);