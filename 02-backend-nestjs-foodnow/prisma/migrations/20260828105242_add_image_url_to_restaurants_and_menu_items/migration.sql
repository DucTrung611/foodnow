-- DropIndex
DROP INDEX "idx_addresses_location";

-- DropIndex
DROP INDEX "idx_restaurants_location";

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "image_url" TEXT;
