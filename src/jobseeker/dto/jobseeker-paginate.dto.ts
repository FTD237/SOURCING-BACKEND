import { ApiProperty } from '@nestjs/swagger';
import { Jobseeker } from '../jobseeker.entity';
import { MetaPaginationDto } from '../../common/swagger';

export class JobseekerPaginateDto {
  @ApiProperty({ type: () => [Jobseeker] })
  donnees: Jobseeker[];

  @ApiProperty({ type: () => MetaPaginationDto })
  meta: MetaPaginationDto;
}
