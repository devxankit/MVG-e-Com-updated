import axiosInstance from './axiosConfig';

const productAPI = {
  // Get all products with filters
  getProducts: (params = {}) => {
    return axiosInstance.get('/products', { params });
  },

  // Get product by ID
  getProductById: (id) => {
    return axiosInstance.get(`/products/${id}`);
  },

  // Search products
  searchProducts: (searchTerm, params = {}) => {
    return axiosInstance.get('/products/search', {
      params: { q: searchTerm, ...params }
    });
  },

  // Get featured products
  getFeaturedProducts: () => {
    return axiosInstance.get('/products/featured');
  },

  // Get products by category
  getProductsByCategory: (categoryId, params = {}) => {
    return axiosInstance.get(`/products/category/${categoryId}`, { params });
  },

  // Add product review
  addReview: (productId, reviewData) => {
    return axiosInstance.post(`/products/${productId}/reviews`, reviewData);
  },

  // Get categories
  getCategories: () => {
    return axiosInstance.get('/categories');
  },

  // Get category by ID
  getCategoryById: (id) => {
    return axiosInstance.get(`/categories/${id}`);
  },

  // Create category
  createCategory: (categoryData) => {
    return axiosInstance.post('/categories', categoryData);
  },

  // Update category
  updateCategory: (id, categoryData) => {
    return axiosInstance.put(`/categories/${id}`, categoryData);
  },

  // Delete category
  deleteCategory: (id) => {
    return axiosInstance.delete(`/categories/${id}`);
  },

  // Approve product
  approveProduct: (id) => {
    return axiosInstance.put(`/products/${id}/approve`);
  },

  // Reject product
  rejectProduct: (id, reason) => {
    return axiosInstance.put(`/products/${id}/reject`, { reason });
  },

  // Edit product
  editProduct: (id, data) => {
    return axiosInstance.put(`/products/${id}`, data);
  },

  // Delete product
  deleteProduct: (id) => {
    return axiosInstance.delete(`/products/${id}`);
  },

  // Get all reviews for a product
  getReviews: (productId) => {
    return axiosInstance.get(`/products/${productId}/reviews`);
  },

  // Update a review
  updateReview: (productId, reviewData) => {
    return axiosInstance.patch(`/products/${productId}/reviews`, reviewData);
  },

  // Delete a review
  deleteReview: (productId) => {
    return axiosInstance.delete(`/products/${productId}/reviews`);
  },

  // Variant management
  getProductVariant: (productId, variantCombination) => {
    return axiosInstance.post(`/products/${productId}/variant`, { variantCombination });
  },

  // Add variant to product
  addVariant: (productId, variantData) => {
    return axiosInstance.post(`/products/${productId}/variants`, variantData);
  },

  // Update variant option
  updateVariantOption: (productId, variantData) => {
    return axiosInstance.put(`/products/${productId}/variants`, variantData);
  },

  // Delete variant option
  deleteVariantOption: (productId, variantData) => {
    return axiosInstance.delete(`/products/${productId}/variants`, { data: variantData });
  },

  // Feature a product (admin only)
  featureProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/feature`);
  },

  // Unfeature a product (admin only)
  unfeatureProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/unfeature`);
  },

  // Set a product as event product (admin only)
  setEventProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/event-product`);
  },

  // Unset a product as event product (admin only)
  unsetEventProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/unevent-product`);
  },

  // Create or update event banner (admin only)
  createOrUpdateEventBanner: (data) => {
    return axiosInstance.post('/products/event-banner', data);
  },

  // Get event banner (public)
  getEventBanner: () => {
    return axiosInstance.get('/products/event-banner');
  },

  // Delete event banner (admin only)
  deleteEventBanner: () => {
    return axiosInstance.delete('/products/event-banner');
  },

  // Get discover products
  getDiscoverProducts: () => {
    return axiosInstance.get('/products/discover');
  },

  // Get recommended products
  getRecommendedProducts: () => {
    return axiosInstance.get('/products/recommended');
  },

  // Set/unset discover product (admin only)
  setDiscoverProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/discover`);
  },
  unsetDiscoverProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/undiscover`);
  },

  // Set/unset recommended product (admin only)
  setRecommendedProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/recommend`);
  },
  unsetRecommendedProduct: (productId) => {
    return axiosInstance.patch(`/products/${productId}/unrecommend`);
  },

  sellerListProduct: (productId, sellerPrice) => axiosInstance.post('/products/seller/list', { productId, sellerPrice }),
  sellerUpdatePrice: (sellerProductId, sellerPrice) => axiosInstance.put('/products/seller/price', { sellerProductId, sellerPrice }),
  sellerUnlistProduct: (sellerProductId) => axiosInstance.put('/products/seller/unlist', { sellerProductId }),
  sellerGetListings: () => axiosInstance.get('/products/seller/listings'),
  adminGetAllSellerListings: () => axiosInstance.get('/products/admin/seller-listings'),
  // Get all seller listings (public)
  getAllSellerListings: () => {
    return axiosInstance.get('/products/seller-listings');
  },
  // Get admin products (for seller selection)
  getAdminProducts: () => {
    return axiosInstance.get('/products/admin-products');
  },
};

export default productAPI; 