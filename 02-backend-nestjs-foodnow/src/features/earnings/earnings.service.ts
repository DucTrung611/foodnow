import { Injectable } from '@nestjs/common';
import { EarningsRepository } from './earnings.repository';

@Injectable()
export class EarningsService {
  constructor(private readonly earningsRepository: EarningsRepository) {}
}
