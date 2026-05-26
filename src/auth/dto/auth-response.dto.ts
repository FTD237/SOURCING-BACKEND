import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT',
  })
  access_token: string;

  @ApiProperty({
    example: {
      id: 1,
      username: 'john_doe',
    },
    description: 'Informations utilisateur',
  })
  user: {
    id: number;
    username: string;
  };
}
