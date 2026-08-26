import { Module } from '@nestjs/common';
import { MenuItemsController } from './menu-items.controller';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsRepository } from './restaurants.repository';
import { RestaurantsService } from './restaurants.service';

@Module({
  controllers: [RestaurantsController, MenuItemsController],
  providers: [RestaurantsService, RestaurantsRepository],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
