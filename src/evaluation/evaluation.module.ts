// evaluation/evaluation.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './evaluation.entity';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation])],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
