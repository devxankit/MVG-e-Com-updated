import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaSearch, 
  FaShoppingCart, 
  FaUser, 
  FaBars, 
  FaTimes,
  FaHeart,
  FaSignOutAlt,
  FaComments,
  FaTachometerAlt
} from 'react-icons/fa';
import { logout } from '../../redux/slices/authSlice';
import { toggleSidebar, toggleSearchModal } from '../../redux/slices/uiSlice';

import axiosInstance from '../../api/axiosConfig';
import { clearCart } from '../../redux/slices/cartSlice';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef();
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { itemCount } = useSelector((state) => state.cart);

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const drawerRef = useRef();


  // Close drawer on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);



  const fetchSuggestions = async (term) => {
    if (!term.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/products/search?query=${encodeURIComponent(term)}`);
      setSuggestions(res.data || []);
    } catch (err) {
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(e.target.value);
    }, 300);
  };

  const handleSuggestionClick = (id) => {
    setShowSuggestions(false);
    setSearchTerm('');
    setSuggestions([]);
    navigate(`/products/${id}`);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Left: Logo & Main Nav */}
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center mr-3">
              {/* <span className="font-extrabold text-primary-600 text-lg md:text-xl tracking-tight whitespace-nowrap select-none">MV Store</span> */}
              <img 
                src={process.env.PUBLIC_URL + "/images/logo.png"} 
                alt="MV Store Logo" 
                className="h-8 md:h-10 w-auto object-contain mr-2 select-none" 
                style={{ maxHeight: '2.25rem' }} // matches md:text-xl
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Link to="/" className="px-1.5 py-1 rounded transition-colors duration-200 hover:bg-primary-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200">Home</Link>
              <Link to="/products" className="px-1.5 py-1 rounded transition-colors duration-200 hover:bg-primary-50 hover:text-primary-600">Products</Link>
              <Link to="/categories" className="px-1.5 py-1 rounded transition-colors duration-200 hover:bg-primary-50 hover:text-primary-600">Categories</Link>
              {/* Conditionally render Become a Vendor */}
              {(!isAuthenticated || (user && user.role !== 'seller') || (user && user.role === 'admin')) && (
                <Link to="/login" className="px-1.5 py-1 rounded transition-colors duration-200 hover:bg-primary-50 hover:text-primary-600">Become a Vendor</Link>
              )}
            </nav>
          </div>

          {/* Center: Wider Search Bar */}
          <div className="hidden md:flex flex-1 justify-center mx-2">
            <form onSubmit={handleSearch} className="w-full max-w-lg md:max-w-2xl">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={handleBlur}
                  className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200 shadow-sm group-focus-within:shadow-md bg-gray-50"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {suggestions.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center px-4 py-2 cursor-pointer hover:bg-primary-50"
                        onMouseDown={() => handleSuggestionClick(product._id)}
                      >
                        {product.images && product.images[0]?.url && (
                          <img src={product.images[0].url} alt={product.name} className="w-10 h-10 object-cover rounded mr-3" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 truncate">{product.name}</div>
                          <div className="text-xs text-gray-500">₹{product.price}</div>
                        </div>
                        {product.numReviews > 0 && (
                          <div className="ml-2 text-xs text-yellow-600">★ {product.numReviews} reviews</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                >
                  <FaSearch />
                </button>
              </div>
            </form>
          </div>

          {/* Right: Dashboard, Icons & User */}
          <div className="flex items-center space-x-2 md:space-x-3">
          
          
            {/* Dashboard (Seller/Admin) */}
            {isAuthenticated && user?.role === 'seller' && (
              <Link to="/seller/dashboard" className="p-2 text-gray-600 hover:text-primary-600 flex items-center transition-colors duration-200">
                <FaTachometerAlt className="mr-1 text-lg" />
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="p-2 text-gray-600 hover:text-primary-600 flex items-center transition-colors duration-200">
                <FaTachometerAlt className="mr-1 text-lg" />
              </Link>
            )}
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200">
              <FaShoppingCart className="text-lg md:text-xl" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">{itemCount}</span>
              )}
            </Link>
            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200">
              <FaHeart className="text-lg md:text-xl" />
              {wishlistItems && wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">{wishlistItems.length}</span>
              )}
            </Link>
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-1 md:space-x-2 p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 focus:outline-none"
                >
                  <FaUser className="text-lg md:text-xl" />
                  <span className="hidden md:inline text-sm font-medium truncate max-w-[80px]">{user?.name}</span>
                  {user?.role && (
                    <span className={`hidden md:inline ml-1 px-2 py-0.5 rounded text-xs font-semibold transition-colors duration-200
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'Vendor' : 'Customer'}
                    </span>
                  )}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors duration-200"
                    >
                      <FaSignOutAlt className="inline mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login" className="btn-outline px-3 py-1.5 text-xs">Login</Link>
                <Link to="/register" className="btn-primary px-3 py-1.5 text-xs">Register</Link>
              </div>
            )}
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600 focus:outline-none transition-colors duration-200"
              aria-label="Open menu"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Drawer & Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Drawer */}
          <aside
            ref={drawerRef}
            className="fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white shadow-lg z-50 transform transition-transform duration-300 animate-slide-in-right"
          >
          <div className="flex justify-between items-center px-4 py-4 border-b">
            <span className="text-xl font-bold text-primary-600">Menu</span>
            <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="text-gray-600 hover:text-primary-600 text-2xl transition-colors duration-200">
              <FaTimes />
            </button>
          </div>
          <nav className="flex flex-col space-y-2 px-6 py-6 text-base font-medium">
            <Link to="/" className="nav-link px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/products" className="nav-link px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>Products</Link>
            <Link to="/categories" className="nav-link px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>Categories</Link>
            {/* Conditionally render Become a Vendor */}
            {(!isAuthenticated || (user && user.role !== 'seller') || (user && user.role === 'admin')) && (
              <Link to="/login" className="nav-link px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>Become a Vendor</Link>
            )}
           
            {isAuthenticated && user?.role === 'seller' && (
              <Link to="/seller/dashboard" className="nav-link px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>Seller Dashboard</Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="nav-link flex items-center px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                <FaTachometerAlt className="mr-1" /> Admin Dashboard
              </Link>
            )}
            <div className="border-t pt-4 mt-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="nav-link px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                  <button onClick={handleLogout} className="nav-link flex items-center w-full text-left px-2 py-2 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200">
                    <FaSignOutAlt className="mr-2" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline w-full mb-2 text-center px-3 py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="btn-primary w-full text-center px-3 py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </nav>
        </aside>
        </div>
      )}
    </header>
  );
};

export default Header; 