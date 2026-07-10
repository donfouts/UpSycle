-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('SHIP', 'PICKUP');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "offersLocalPickup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "shippingAddressId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "fulfillmentMethod" "FulfillmentMethod" NOT NULL DEFAULT 'SHIP';
