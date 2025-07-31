import React, { useState, useEffect } from 'react';
import { FaStar, FaShoppingCart, FaHeart, FaShare, FaTruck, FaShieldAlt, FaUndo, FaTag, FaSyncAlt, FaCheckCircle, FaExpand } from 'react-icons/fa';
import { formatINR } from '../../utils/formatCurrency';
import { useSelector } from 'react-redux';
import productAPI from '../../api/productAPI';
import { useNavigate } from 'react-router-dom';
import VariantSelector from './VariantSelector';

const ProductDetail = ({ product, onAddToCart, onWishlist, onShare }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [currentVariantData, setCurrentVariantData] = useState({
    price: product?.price || 0,
    comparePrice: product?.comparePrice || 0,
    stock: product?.stock || 0,
    images: product?.images || []
  });
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [editingReview, setEditingReview] = useState(false);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  const handleQuantityChange = (newQuantity) => {
    const maxStock = currentVariantData.stock || product.stock || 1;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantChange = (newSelectedVariants) => {
    setSelectedVariants(newSelectedVariants);
    
    // Find the selected variant option to update current data
    if (product.variants && product.variants.length > 0) {
      let selectedOption = null;
      for (const variant of product.variants) {
        const selectedValue = newSelectedVariants[variant.name];
        if (selectedValue) {
          const option = variant.options.find(opt => opt.value === selectedValue);
          if (option) {
            selectedOption = option;
            break;
          }
        }
      }

      if (selectedOption) {
        setCurrentVariantData({
          price: selectedOption.price,
          comparePrice: selectedOption.comparePrice || 0,
          stock: selectedOption.stock,
          images: selectedOption.images && selectedOption.images.length > 0 
            ? selectedOption.images 
            : product.images || []
        });
        setSelectedImage(0);
      } else {
        setCurrentVariantData({
          price: product.price,
          comparePrice: product.comparePrice || 0,
          stock: product.stock,
          images: product.images || []
        });
      }
    }
  };

  useEffect(() => {
    if (product && product._id) {
      productAPI.getReviews(product._id)
        .then(res => setReviews(res.data))
        .catch(() => setReviews([]));
    }
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      await productAPI.addReview(product._id, { rating: reviewRating, comment: reviewText });
      setReviewSuccess('Review submitted!');
      setReviewText('');
      setReviewRating(0);
      // Refresh reviews
      const res = await productAPI.getReviews(product._id);
      setReviews(res.data);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Vertical Image Gallery and Features/Specs */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnails */}
          <div className="flex lg:flex-col gap-2 order-2 lg:order-1 mb-4 lg:mb-0">
            {currentVariantData.images && currentVariantData.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`border-2 rounded-lg overflow-hidden w-16 h-16 ${selectedImage === idx ? 'border-green-600' : 'border-gray-300'}`}
              >
                <img
                  src={img.url}
                  alt={`${product.name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          {/* Main Image and Features/Specs */}
          <div className="flex-1 order-1 lg:order-2 flex flex-col gap-6">
            <img
              src={currentVariantData.images && currentVariantData.images[selectedImage] ? currentVariantData.images[selectedImage].url : '/product-images/default.webp'}
              alt={product.name}
              className="w-full h-96 object-contain rounded-lg bg-white border"
            />
            {/* Key Features */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {Array.isArray(product.features) && product.features.length > 0 ? (
                  product.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No features provided.</li>
                )}
              </ul>
            </div>
            {/* Specifications */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(currentVariantData.specifications) && currentVariantData.specifications.length > 0 ? (
                  currentVariantData.specifications.map((spec, idx) => (
                    <div key={spec._id || idx} className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-medium text-gray-700">{spec.key}</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))
                ) : Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                  product.specifications.map((spec, idx) => (
                    <div key={spec._id || idx} className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-medium text-gray-700">{spec.key}</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No specifications provided.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{product.name}</h1>
          {product.brand && (
            <div className="text-sm text-gray-500 mb-2">Brand: <span className="font-medium text-gray-700">{product.brand}</span></div>
          )}
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-gray-600 text-sm">{product.rating || 0} ({product.numReviews || 0} reviews)</span>
          </div>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-3xl font-bold text-green-600">{formatINR(currentVariantData.price)}</span>
            {currentVariantData.comparePrice > currentVariantData.price && (
              <span className="text-lg text-gray-500 line-through">{formatINR(currentVariantData.comparePrice)}</span>
            )}
            {currentVariantData.comparePrice > currentVariantData.price && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">{Math.round(((currentVariantData.comparePrice - currentVariantData.price) / currentVariantData.comparePrice) * 100)}% OFF</span>
            )}
          </div>
          {/* Offers/Icons */}
          <div className="flex flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded text-yellow-800 text-xs font-medium"><FaTag /> Cashback Offer</div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded text-green-800 text-xs font-medium"><FaCheckCircle /> Free Delivery</div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded text-green-800 text-xs font-medium"><FaShieldAlt /> 2 Year Warranty</div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded text-gray-800 text-xs font-medium"><FaUndo /> 30 Day Returns</div>
          </div>
          <div className="mb-2">
            {currentVariantData.stock > 0 ? (
              <span className="text-green-600 font-medium">In Stock ({currentVariantData.stock} available)</span>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>
          {/* Variant Selector */}
          <VariantSelector
            product={product}
            selectedVariants={selectedVariants}
            onVariantChange={handleVariantChange}
            className="mb-4"
          />

          <div className="flex items-center gap-3 mb-4">
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <div className="flex items-center border border-gray-300 rounded-lg w-32">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
                disabled={quantity <= 1}
              >-</button>
              <span className="flex-1 text-center py-2">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
                disabled={quantity >= currentVariantData.stock}
              >+</button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button
              onClick={() => {
                console.log('Add to Cart button clicked', { onAddToCart, product, quantity, selectedVariants });
                onAddToCart && onAddToCart(product, quantity, selectedVariants);
              }}
              disabled={currentVariantData.stock <= 0}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FaShoppingCart /> Add to Cart
            </button>
            <button
              onClick={() => onWishlist && onWishlist(product)}
              className="flex-1 border border-green-600 text-green-600 py-3 px-6 rounded-lg hover:bg-green-50 flex items-center justify-center gap-2"
            >
              <FaHeart /> Wishlist
            </button>
            <button
              onClick={() => onShare && onShare(product)}
              className="px-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <FaShare />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-gray-700"><FaSyncAlt className="text-green-600" /> 10 days Service Centre Replacement</div>
            <div className="flex items-center gap-2 text-gray-700"><FaTruck className="text-green-600" /> Free Delivery</div>
            <div className="flex items-center gap-2 text-gray-700"><FaShieldAlt className="text-green-600" /> Warranty Policy</div>
            <div className="flex items-center gap-2 text-gray-700"><FaCheckCircle className="text-green-600" /> Top Brand</div>
          </div>
          {/* Reviews Section */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-2">Customer Reviews</h3>
            {reviews.length === 0 && <div className="text-gray-500">No reviews yet.</div>}
            <ul className="space-y-4 mb-6">
              {reviews.map((review, idx) => {
                if (!review || typeof review !== 'object' || Array.isArray(review)) return null;
                const safeName = (typeof review.name === 'string' || typeof review.name === 'number') ? review.name : JSON.stringify(review.name ?? '');
                const safeComment = (typeof review.comment === 'string' || typeof review.comment === 'number') ? review.comment : JSON.stringify(review.comment ?? '');
                const safeRating = (typeof review.rating === 'number') ? review.rating : Number(review.rating) || 0;
                const isUserReview = user && ((typeof review.user === 'object' ? review.user.toString() : review.user) === user._id.toString());
                return (
                  <li key={review._id || idx} className="border-b pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-700">{safeName}</span>
                      <span className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < safeRating ? 'text-yellow-400' : 'text-gray-300'} />
                        ))}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
                      {isUserReview && !editingReview && (
                        <>
                          <button className="ml-2 text-green-600 text-xs underline" onClick={() => { setEditingReview(true); setEditText(safeComment); setEditRating(safeRating); }}>Edit</button>
                          <button className="ml-2 text-red-600 text-xs underline" onClick={async () => {
                            if (window.confirm('Delete your review?')) {
                              await productAPI.deleteReview(product._id);
                              const res = await productAPI.getReviews(product._id);
                              setReviews(res.data);
                            }
                          }}>Delete</button>
                        </>
                      )}
                    </div>
                    {isUserReview && editingReview ? (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        await productAPI.updateReview(product._id, { rating: editRating, comment: editText });
                        setEditingReview(false);
                        setEditText('');
                        setEditRating(0);
                        const res = await productAPI.getReviews(product._id);
                        setReviews(res.data);
                      }} className="mt-2">
                        <div className="flex gap-1 mb-2">
                          {[1,2,3,4,5].map(star => (
                            <button type="button" key={star} onClick={() => setEditRating(star)} className={star <= editRating ? 'text-yellow-400' : 'text-gray-300'}>
                              <FaStar />
                            </button>
                          ))}
                        </div>
                        <textarea className="w-full border rounded p-2 mb-2" rows={3} value={editText} onChange={e => setEditText(e.target.value)} required />
                        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded mr-2">Save</button>
                        <button type="button" className="bg-gray-300 text-gray-700 px-3 py-1 rounded" onClick={() => setEditingReview(false)}>Cancel</button>
                      </form>
                    ) : (
                      <div className="text-gray-700">{safeComment}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            {user && !reviews.some(r => (typeof r.user === 'object' ? r.user.toString() : r.user) === user._id.toString()) && (
              <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Your Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Your Review</label>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    required
                  />
                </div>
                {reviewError && <div className="text-red-600 text-sm mb-2">{reviewError}</div>}
                {reviewSuccess && <div className="text-green-600 text-sm mb-2">{reviewSuccess}</div>}
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  disabled={reviewLoading || !reviewRating || !reviewText}
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
            {!user && <div className="text-gray-500">Login to write a review.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 