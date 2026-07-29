import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

interface MockCommand {
  input: Record<string, unknown>;
}

const mockSend = jest.fn<Promise<void>, [MockCommand]>();

jest.mock('@aws-sdk/client-s3', () => {
  const actual =
    jest.requireActual<typeof import('@aws-sdk/client-s3')>(
      '@aws-sdk/client-s3',
    );
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://r2.example/signed-url'),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  const configServiceMock = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        R2_ACCOUNT_ID: 'test-account',
        R2_BUCKET_NAME: 'test-bucket',
        R2_ACCESS_KEY_ID: 'test-key',
        R2_SECRET_ACCESS_KEY: 'test-secret',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => jest.clearAllMocks());

  it('téléverse le contenu du fichier via PutObjectCommand', async () => {
    mockSend.mockResolvedValue(undefined);

    await service.upload('key.pdf', Buffer.from('contenu'), 'application/pdf');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const command = mockSend.mock.calls[0][0];
    expect(command.input).toEqual(
      expect.objectContaining({
        Bucket: 'test-bucket',
        Key: 'key.pdf',
        ContentType: 'application/pdf',
      }),
    );
  });

  it('supprime un objet via DeleteObjectCommand', async () => {
    mockSend.mockResolvedValue(undefined);

    await service.delete('key.pdf');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const command = mockSend.mock.calls[0][0];
    expect(command.input).toEqual(
      expect.objectContaining({ Bucket: 'test-bucket', Key: 'key.pdf' }),
    );
  });

  it('génère une URL signée avec le nom de fichier en Content-Disposition', async () => {
    const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<
      typeof getSignedUrl
    >;

    const url = await service.getSignedDownloadUrl('key.pdf', 'cv final.pdf');

    expect(url).toBe('https://r2.example/signed-url');
    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);

    const [, command, options] = mockedGetSignedUrl.mock.calls[0];
    const commandInput = (command as unknown as MockCommand).input;
    expect(commandInput.Bucket).toBe('test-bucket');
    expect(commandInput.Key).toBe('key.pdf');
    expect(commandInput.ResponseContentDisposition).toContain(
      encodeURIComponent('cv final.pdf'),
    );
    expect(options).toEqual({ expiresIn: 300 });
  });
});
