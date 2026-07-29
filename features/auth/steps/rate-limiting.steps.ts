import { Given, When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import request from 'supertest';
import { CustomWorld, getServer } from '../../support/world';

const TEST_INVALID_PASSWORD =
  process.env.TEST_INVALID_PASSWORD || 'invalid pass';

interface LoginErrorBody {
  message?: string;
}

async function attemptLogin(world: CustomWorld): Promise<void> {
  world.response = await request(getServer(world))
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: TEST_INVALID_PASSWORD });
}

Given(
  'a client makes {int} login attempts within 1 minute',
  async function (this: CustomWorld, count: number) {
    for (let i = 0; i < count; i++) {
      await attemptLogin(this);
    }
  },
);

When(
  /^the client makes an? \d+(?:st|nd|rd|th) login attempt$/,
  async function (this: CustomWorld) {
    await attemptLogin(this);
  },
);
Then(
  'the response status should be {int}',
  function (this: CustomWorld, statusCode: number) {
    assert.equal(this.response.statusCode, statusCode);
  },
);

Then(
  /^the response should contain a rate limit error message$/,
  function (this: CustomWorld) {
    const body = this.response.body as LoginErrorBody;
    const message = body.message?.toLowerCase() ?? '';
    assert.ok(
      message.includes('trop de requêtes') || message.includes('réessaie'),
    );
  },
);
