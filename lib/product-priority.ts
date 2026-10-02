import { Prisma } from "@prisma/client";

/**
 * Moves one seller's product to `targetPriority` and shifts every product
 * between its old and new rank by one, keeping marketingPriority a dense
 * 1..N permutation with no ties or gaps. Must run inside the same
 * transaction as the caller's ownership check.
 *
 * The moved product is parked at priority 0 (never a valid rank — real ranks
 * start at 1) before the shift, so the in-between updates never collide with
 * the unique (sellerProfileId, marketingPriority) index. Shifting toward the
 * end walks ascending (each row moves into the slot just vacated below it);
 * shifting toward the start walks descending (same idea, above it).
 */
export async function reorderProductPriority(
  tx: Prisma.TransactionClient,
  sellerProfileId: string,
  productId: string,
  targetPriority: number,
) {
  const siblings = await tx.product.findMany({
    where: { sellerProfileId },
    select: { id: true, marketingPriority: true },
    orderBy: { marketingPriority: "asc" },
  });

  const current = siblings.find((p) => p.id === productId);
  if (!current) throw new Error("PRODUCT_NOT_FOUND");

  const clampedTarget = Math.min(Math.max(targetPriority, 1), siblings.length);
  if (clampedTarget === current.marketingPriority) return;

  await tx.product.update({ where: { id: productId }, data: { marketingPriority: 0 } });

  if (clampedTarget > current.marketingPriority) {
    const between = siblings
      .filter((p) => p.marketingPriority > current.marketingPriority && p.marketingPriority <= clampedTarget)
      .sort((a, b) => a.marketingPriority - b.marketingPriority);
    for (const p of between) {
      await tx.product.update({ where: { id: p.id }, data: { marketingPriority: p.marketingPriority - 1 } });
    }
  } else {
    const between = siblings
      .filter((p) => p.marketingPriority < current.marketingPriority && p.marketingPriority >= clampedTarget)
      .sort((a, b) => b.marketingPriority - a.marketingPriority);
    for (const p of between) {
      await tx.product.update({ where: { id: p.id }, data: { marketingPriority: p.marketingPriority + 1 } });
    }
  }

  await tx.product.update({ where: { id: productId }, data: { marketingPriority: clampedTarget } });
}
