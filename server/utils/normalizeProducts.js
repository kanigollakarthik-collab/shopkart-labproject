import Product from '../models/product.model.js';

/**
 * Converts any product whose `stock` / `price` was saved as a STRING
 * (e.g. inserted manually through MongoDB Compass / Atlas UI) into a real number.
 *
 * Why this matters: Mongoose casts "11" → 11 when READING a document, so stock
 * checks look fine — but atomic queries like `{ stock: { $gte: 1 } }` run inside
 * MongoDB, where a string never matches a number. Stock would silently never
 * decrease and the product could be oversold.
 */
export const normalizeProductNumericFields = async () => {
  const toNumber = (field) => ({
    $convert: { input: `$${field}`, to: 'double', onError: 0, onNull: 0 },
  });

  const [stockResult, priceResult] = await Promise.all([
    Product.collection.updateMany({ stock: { $type: 'string' } }, [
      { $set: { stock: { $max: [0, { $floor: toNumber('stock') }] } } },
    ]),
    Product.collection.updateMany({ price: { $type: 'string' } }, [
      { $set: { price: { $max: [0, toNumber('price')] } } },
    ]),
  ]);

  const fixed = stockResult.modifiedCount + priceResult.modifiedCount;
  if (fixed > 0) {
    console.log(
      `🔧 Normalized product data: ${stockResult.modifiedCount} stock / ${priceResult.modifiedCount} price value(s) converted from string to number.`
    );
  }
};
