import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';

const ProductCard = ({
  product,
  isInWishlist,
  handleWishlist,
  handleAddToCart,
  showWishlist = true,
  showAddToCart = true,
  showRating = true,
  showPrice = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const discountPercentage = product.comparePrice && product.comparePrice > product.price 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div
      className={`relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: '4/4', // Perfect aspect ratio for product cards
        maxWidth: '250px',
        width: '100%'
      }}
    >
      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 z-20">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discountPercentage}% OFF
          </span>
        </div>
      )}
      
      {/* Add to Cart Button */}
      {showAddToCart && (
        <div className="absolute top-2 right-2 z-20">
          <button
            className="bg-white/90 hover:bg-orange-500 hover:text-white text-orange-500 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 transform hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart?.(product);
            }}
            aria-label="Add to cart"
          >
            <FaPlus className="text-xs" />
          </button>
        </div>
      )}

      {/* Product Image */}
      <Link to={`/products/${product._id}`} className="block h-full">
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={product.images && product.images[0] ? product.images[0].url : '/product-images/default.webp'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=400&q=80`;
            }}
          />
        </div>
        
        {/* Product Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1 leading-tight">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            {showPrice && (
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">
                  ₹{product.price}
                </span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="text-gray-300 text-xs line-through">
                    ₹{product.comparePrice}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;