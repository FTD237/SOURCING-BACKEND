import { ApiProperty } from '@nestjs/swagger';
import { IsValidUrl } from '../../common/validators/is-valid-url.validator';

export class LiensUtilesDto {
  @ApiProperty({ example: 'https://github.com' })
  @IsValidUrl()
  github: string;

  @ApiProperty({ example: 'https://linkedn.com' })
  @IsValidUrl()
  linkedin: string;

  @ApiProperty({ example: 'https://mon-portfolio.com' })
  @IsValidUrl()
  portfolio: string;
}
