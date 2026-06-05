import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './promotion.entity';
import { PromotionCreateDto } from './dto/promotion-create.dto';
import { ExceptionFactory } from '../common/exceptions/exception-factory';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly pR: Repository<Promotion>,
  ) {}

  async create(dto: PromotionCreateDto): Promise<Promotion> {
    try {
      const exists = await this.pR.findOne({
        where: { id_formation: dto.id_formation, annee: dto.annee },
      });
      if (exists)
        ExceptionFactory.businessConflict(
          'Promotion',
          'Une promotion existe déjà pour cette année',
          {
            annee: dto.annee,
            existingId: exists.id,
          },
        );

      const promo = this.pR.create(dto);
      return this.pR.save(promo);
    } catch (error) {
      ExceptionFactory.database(error, 'Promotion');
    }
  }

  async findAll(): Promise<Promotion[]> {
    return this.pR.find({ relations: { formation: true } });
  }

  async findOne(id: string): Promise<Promotion> {
    const promo = await this.pR.findOne({
      where: { id },
      relations: { formation: true },
    });

    if (!promo) ExceptionFactory.notFound('Promotion', id);
    return promo;
  }

  async update(id: string, dto: { annee: string }): Promise<Promotion> {
    if (!dto.annee || !/^\d{4}$/.test(dto.annee)) {
      ExceptionFactory.badRequest(
        "L'année doit être au format YYYY (ex: 2023)",
      );
    }

    try {
      const promo = await this.findOne(id);
      promo.annee = dto.annee;

      return await this.pR.save(promo);
    } catch (error) {
      ExceptionFactory.database(error, 'Promotion');
    }
  }
}
