// common/constants/file-rules.ts
export interface FileConstraints {
  mimetypes: string[];
  maxSize: number;
  maxCount?: number;
}

export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const FILE_RULES = {
  LOGO: { mimetypes: IMAGE_MIME_TYPES, maxSize: 2 * 1024 * 1024 },
  BANNER: { mimetypes: IMAGE_MIME_TYPES, maxSize: 5 * 1024 * 1024 },
  EXPERIENCE: {
    mimetypes: ['application/pdf', ...IMAGE_MIME_TYPES],
    maxSize: 10 * 1024 * 1024,
    maxCount: 5,
  },
} satisfies Record<string, FileConstraints>;
