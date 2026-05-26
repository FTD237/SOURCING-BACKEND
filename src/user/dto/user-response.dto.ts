import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '5759456d-0ad2-4a3b-ba06-5bcac4f33481' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  name: string;

  @ApiProperty({ example: 'john_doe_doe' })
  prenom: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;
}
