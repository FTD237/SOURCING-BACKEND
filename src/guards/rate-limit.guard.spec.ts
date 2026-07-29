import { ExecutionContext, HttpException } from '@nestjs/common';

const mockLimit = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: { fromEnv: jest.fn().mockReturnValue({}) },
}));

jest.mock('@upstash/ratelimit', () => {
  const RatelimitMock = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
  })) as unknown as { slidingWindow: jest.Mock } & jest.Mock;
  RatelimitMock.slidingWindow = jest.fn();
  return { Ratelimit: RatelimitMock };
});

import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  const setHeader = jest.fn();

  const buildContext = (
    headers: Record<string, string | string[] | undefined> = {},
    remoteAddress = '10.0.0.1',
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          socket: { remoteAddress },
        }),
        getResponse: () => ({ setHeader }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new RateLimitGuard();
  });

  afterEach(() => jest.clearAllMocks());

  it('autorise la requête et pose les headers de rate limit quand le quota est respecté', async () => {
    mockLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 7,
      reset: 123456,
    });

    const result = await guard.canActivate(buildContext());

    expect(result).toBe(true);
    expect(setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
    expect(setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '7');
    expect(setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '123456');
  });

  it('rejette avec un 429 quand le quota est dépassé', async () => {
    mockLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 123456,
    });

    await expect(guard.canActivate(buildContext())).rejects.toThrow(
      HttpException,
    );
  });

  it("utilise x-forwarded-for (chaîne) pour identifier l'IP", async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9 });

    await guard.canActivate(
      buildContext({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18' }),
    );

    expect(mockLimit).toHaveBeenCalledWith('203.0.113.5');
  });

  it('utilise x-forwarded-for (tableau) pour identifier l’IP', async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9 });

    await guard.canActivate(
      buildContext({ 'x-forwarded-for': ['203.0.113.5', '70.41.3.18'] }),
    );

    expect(mockLimit).toHaveBeenCalledWith('203.0.113.5');
  });

  it("retombe sur l'IP de la socket si x-forwarded-for est absent", async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9 });

    await guard.canActivate(buildContext({}, '198.51.100.7'));

    expect(mockLimit).toHaveBeenCalledWith('198.51.100.7');
  });
});
