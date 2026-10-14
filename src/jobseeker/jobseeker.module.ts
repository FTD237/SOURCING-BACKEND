// jobseeker/jobseeker.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jobseeker } from './jobseeker.entity';
import { JobseekerController } from './jobseeker.controller';
import { JobseekerService } from './jobseeker.service';

@Module({
  imports: [TypeOrmModule.forFeature([Jobseeker])],
  controllers: [JobseekerController],
  providers: [JobseekerService],
  // exporté pour que EtudiantModule puisse l'appeler quand is_job_seeker change
  exports: [JobseekerService],
})
export class JobseekerModule {}
