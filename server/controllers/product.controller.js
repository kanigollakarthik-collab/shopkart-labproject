import Product from '../models/product.model.js';

// Task 2: Create Product
export const createProduct = async (req, res) => {
  try {
    // We trust Mongoose to handle the validation errors (missing fields, negative price, etc.)
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Task 3, 5 & Bonus: Get All Products (with Search, Filter, and Sort)
export const getProducts = async (req, res) => {
  try {
    // 1. Destructure the query parameters from the URL
    // e.g., /products?search=phone&category=Electronics&sort=price_asc
    const { search, category, sort } = req.query; 

    // 2. Build the query object dynamically
    let query = {};
    
    // If the user typed something in the search bar, use Regex for case-insensitive matching
    if (search) {
      query.name = { $regex: search, $options: 'i' }; 
    }
    
    // If the user selected a category, add it to the query
    if (category) {
      query.category = category;
    }

    // 3. Execute the query
    let mongooseQuery = Product.find(query);

    // 4. Handle Sorting (Bonus Challenge)
    if (sort === 'price_asc') {
      mongooseQuery = mongooseQuery.sort({ price: 1 }); // 1 = Ascending
    } else if (sort === 'price_desc') {
      mongooseQuery = mongooseQuery.sort({ price: -1 }); // -1 = Descending
    }

    // 5. Await the final results
    const products = await mongooseQuery;

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Task 4: Get Single Product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    // If Mongoose fails to cast the ID (e.g., it's a badly formatted string), it throws an error
    res.status(400).json({ success: false, message: 'Invalid product ID' });
  }
};