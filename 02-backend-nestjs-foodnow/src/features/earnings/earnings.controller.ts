import { Controller } from '@nestjs/common';
import { EarningsService } from './earnings.service';

@Controller()
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}
}
