import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaArrowRight, 
  FaStar, 
  FaShoppingCart, 
  FaHeart,
  FaTruck,
  FaShieldAlt,
  FaHeadset,
  FaCreditCard
} from 'react-icons/fa';
import { fetchFeaturedProducts, fetchProducts } from '../redux/slices/productSlice';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { formatINR } from '../utils/formatCurrency';
import productAPI from '../api/productAPI';
import CategoriesGrid from '../components/common/CategoriesGrid';
import HeroCarousel from '../components/common/HeroCarousel';
import EventBanner from '../components/common/EventBanner';
import ProductCard from '../components/common/ProductCard';
import { fetchWishlist, addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';

const Home = () => {
  const dispatch = useDispatch();
  const { featuredProducts, loading, products } = useSelector((state) => state.products);
  const [categories, setCategories] = useState([]);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const store = useStore();

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchProducts());
    productAPI.getCategories().then(res => setCategories(res.data)).catch(() => setCategories([]));
  }, [dispatch]);

  // Fetch wishlist on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  // Save cart to localStorage on every change (optional, for parity with ProductList)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      localStorage.setItem('cart', JSON.stringify(state.cart));
    });
    return unsubscribe;
  }, []);

  // Wishlist logic
  const isInWishlist = (productId) => wishlistItems.some((item) => String(item._id) === String(productId));
  const handleWishlist = (product) => {
    if (!isAuthenticated) {
      alert('Please login to use wishlist!');
      return;
    }
    if (isInWishlist(product._id)) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product._id));
    }
  };

  const handleAddToCart = (product) => {
    dispatch(addToCartAsync({ product, quantity: 1 }));
  };

  const features = [
    {
      icon: <FaTruck className="text-3xl" />,
      title: 'Free Shipping',
      description: 'Free shipping on orders over ₹500'
    },
    {
      icon: <FaShieldAlt className="text-3xl" />,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: <FaHeadset className="text-3xl" />,
      title: '24/7 Support',
      description: 'Round the clock customer support'
    },
    {
      icon: <FaCreditCard className="text-3xl" />,
      title: 'Easy Returns',
      description: '30-day money back guarantee'
    }
  ];

  // Helper to slugify product name
  const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  // Helper to get image for product
  const getProductImage = (name) => `/product-images/${slugify(name)}.jpg`;

  // Filter only main categories (no parentCategory)
  const mainCategories = categories.filter(cat => !cat.parentCategory).slice(0, 6);

  // Debug: log main category names
  // console.log('Main categories:', mainCategories.map(cat => cat.name));
  // if (mainCategories.length) {
  //   mainCategories.forEach(cat => console.log('Category name:', cat.name));
  // }

  // Fetch discover and recommended products from backend
  const [discoverProducts, setDiscoverProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  useEffect(() => {
    productAPI.getDiscoverProducts().then(res => setDiscoverProducts(res.data)).catch(() => setDiscoverProducts([]));
    productAPI.getRecommendedProducts().then(res => setRecommendedProducts(res.data)).catch(() => setRecommendedProducts([]));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroCarousel />

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-lg text-gray-600">Experience the best shopping with our premium services</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 text-center group">
                <div className="text-green-500 mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-center w-full md:w-auto">Shop by Category</h2>
            <Link
              to="/categories"
              className="hidden md:flex items-center text-primary-600 hover:text-primary-700 font-semibold ml-4"
              style={{ whiteSpace: 'nowrap' }}
            >
              View All Categories <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <CategoriesGrid categories={mainCategories} />
          <div className="flex justify-center mt-8 md:hidden">
            <Link
              to="/categories"
              className="flex items-center text-green-600 hover:text-green-700 font-semibold text-lg"
            >
              View All Categories <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              View All
              <FaArrowRight className="ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
              {(Array.isArray(featuredProducts) ? featuredProducts : []).slice(0, 12).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isInWishlist={isInWishlist}
                  handleWishlist={handleWishlist}
                  handleAddToCart={() => handleAddToCart(product)}
                  showWishlist={true}
                  showAddToCart={true}
                  showRating={true}
                  showPrice={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Banner Section */}
      <EventBanner />

      {/* Discover More Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Discover More Products</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              View All Products
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
            {discoverProducts.slice(0, 12).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isInWishlist={isInWishlist}
                handleWishlist={handleWishlist}
                handleAddToCart={() => handleAddToCart(product)}
                showWishlist={true}
                showAddToCart={true}
                showRating={true}
                showPrice={true}
              />
            ))}
          </div>
        </div>
      </section>

   
    

      {/* Products You Might Like Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Products You Might Like</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              View All Products
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isInWishlist={isInWishlist}
                handleWishlist={handleWishlist}
                handleAddToCart={() => handleAddToCart(product)}
                showWishlist={true}
                showAddToCart={true}
                showRating={true}
                showPrice={true}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of vendors and start your e-commerce journey today.
          </p>
          <Link
            to="/login"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Become a Vendor
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 