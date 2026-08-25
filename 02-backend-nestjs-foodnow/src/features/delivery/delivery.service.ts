import { Injectable } from '@nestjs/common';
import { DeliveryRepository } from './delivery.repository';

@Injectable()
export class DeliveryService {
  constructor(private readonly deliveryRepository: DeliveryRepository) {}
}
