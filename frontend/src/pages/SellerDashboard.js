import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaChartLine, FaBox, FaDollarSign, FaUsers, FaCog, FaTimes } from 'react-icons/fa';
import { formatINR } from '../utils/formatCurrency';
import sellerAPI from '../api/sellerAPI';
import axiosInstance from '../api/axiosConfig';
import productAPI from '../api/productAPI';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../redux/slices/orderSlice';
import VariantManager from '../components/common/VariantManager';

const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
];

// Helper to get full path for a subcategory
const getCategoryPath = (categories, subcatId) => {
  for (const cat of categories) {
    if (cat.subcategories) {
      const found = cat.subcategories.find(sub => sub._id === subcatId);
      if (found) return `${cat.name} > ${found.name}`;
    }
  }
  return '';
};

const CategoryTreeSelector = ({ categories, selected, onSelect }) => {
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const toggle = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter categories and subcategories by search
  const filteredCategories = categories
    .map(cat => {
      // If main category matches, show all its subcategories
      if (cat.name.toLowerCase().includes(search.toLowerCase())) return cat;
      // Otherwise, filter subcategories
      const filteredSubs = (cat.subcategories || []).filter(sub => sub.name.toLowerCase().includes(search.toLowerCase()));
      if (filteredSubs.length > 0) return { ...cat, subcategories: filteredSubs };
      return null;
    })
    .filter(Boolean);

  return (
    <div>
      <input
        type="text"
        className="w-full mb-2 px-2 py-1 border rounded text-sm"
        placeholder="Search category..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="border rounded p-2 bg-gray-50 max-h-60 overflow-y-auto">
        {filteredCategories.length === 0 && <div className="text-gray-400 text-sm">No categories found.</div>}
        {filteredCategories.map(cat => (
          <div key={cat._id} className="mb-1">
            <div className="flex items-center">
              {cat.subcategories && cat.subcategories.length > 0 && (
                <button type="button" className="mr-1 text-xs text-blue-600" onClick={() => toggle(cat._id)}>
                  {expanded[cat._id] ? '-' : '+'}
                </button>
              )}
              <span className="font-semibold text-gray-800">{cat.name}</span>
            </div>
            {cat.subcategories && cat.subcategories.length > 0 && expanded[cat._id] && (
              <div className="ml-4 mt-1">
                {cat.subcategories.map(subcat => (
                  <div key={subcat._id} className={`flex items-center mb-1 ${selected === subcat._id ? 'bg-blue-100 rounded px-1' : ''}`}>
                    <input
                      type="radio"
                      name="category"
                      value={subcat._id}
                      checked={selected === subcat._id}
                      onChange={() => onSelect(subcat._id)}
                      className="mr-2"
                    />
                    <span className={selected === subcat._id ? 'text-blue-700 font-semibold' : ''}>{subcat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    stock: '',
    brand: '',
    sku: '',
    mainCategory: '',
    subCategory: '',
    features: '',
    specifications: [{ key: '', value: '' }],
    images: [{ url: '' }],
  });
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [categories, setCategories] = useState([]);

  const dispatch = useDispatch();
  const { orders, loading: ordersLoading } = useSelector((state) => state.orders);

  // Coupon management state
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', discount: '', expiry: '', usageLimit: '' });
  const [couponStatus, setCouponStatus] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Seller stats state
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Add state for edit modal and form
  const [editModal, setEditModal] = useState({ open: false, product: null });
  const [editProduct, setEditProduct] = useState({});
  const [editError, setEditError] = useState('');

  // In SellerDashboard component, add state for main category selection
  const [selectedMainCat, setSelectedMainCat] = useState('');

  // Add editLoading state
  const [editLoading, setEditLoading] = useState(false);

  // Add variant management state
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Add state for soldCount editing
  const [soldCountEdits, setSoldCountEdits] = useState({});
  const [soldCountLoading, setSoldCountLoading] = useState({});

  // Add state for admin products and seller listings
  const [adminProducts, setAdminProducts] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);
  const [listingLoading, setListingLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSubCat, setSelectedSubCat] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellerPrice, setSellerPrice] = useState('');
  const [listingError, setListingError] = useState('');
  const [showListingModal, setShowListingModal] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'out-of-stock':
        return 'text-red-600 bg-red-100';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'Shipped':
        return 'text-blue-600 bg-blue-100';
      case 'Delivered':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Fetch products on mount
  useEffect(() => {
    setLoading(true);
    sellerAPI.getProducts()
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch admin products and seller listings on mount
  useEffect(() => {
    productAPI.getProducts().then(res => setAdminProducts(res.data)).catch(() => setAdminProducts([]));
    productAPI.sellerGetListings().then(res => setSellerListings(res.data)).catch(() => setSellerListings([]));
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    productAPI.getCategories().then(res => setCategories(res.data)).catch(() => setCategories([]));
  }, []);

  // Fetch coupons on mount
  useEffect(() => {
    sellerAPI.getCoupons().then(res => setCoupons(res.data)).catch(() => setCoupons([]));
  }, []);

  useEffect(() => {
    dispatch(fetchOrders({ seller: true }));
  }, [dispatch]);

  // Fetch seller stats on mount
  useEffect(() => {
    setStatsLoading(true);
    sellerAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats({ totalSales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 }))
      .finally(() => setStatsLoading(false));
  }, []);

  // Add product handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('price', newProduct.price);
    formData.append('comparePrice', newProduct.comparePrice);
    formData.append('stock', newProduct.stock);
    formData.append('brand', newProduct.brand);
    formData.append('sku', newProduct.sku);
    formData.append('category', newProduct.mainCategory);
    formData.append('subCategory', newProduct.subCategory);
    formData.append('features', newProduct.features);
    formData.append('specifications', JSON.stringify(newProduct.specifications.filter(s => s.key && s.value)));
    imageFiles.forEach((file, idx) => {
      formData.append('images', file);
    });
    try {
      const res = await sellerAPI.createProduct(formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProducts([res.data, ...products]);
      setShowModal(false);
      setNewProduct({ name: '', description: '', price: '', comparePrice: '', stock: '', brand: '', sku: '', mainCategory: '', subCategory: '', features: '', specifications: [{ key: '', value: '' }], images: [{ url: '' }] });
      setImageFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await sellerAPI.deleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
    } catch {}
  };

  const handleCouponInput = (e) => {
    const { name, value } = e.target;
    setCouponForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponStatus('');
    try {
      const res = await sellerAPI.createCoupon(couponForm);
      setCoupons([res.data, ...coupons]);
      setCouponForm({ code: '', discount: '', expiry: '', usageLimit: '' });
      setCouponStatus('Coupon created!');
    } catch (err) {
      setCouponStatus(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDeactivateCoupon = async (id) => {
    if (!window.confirm('Deactivate this coupon?')) return;
    try {
      await sellerAPI.deactivateCoupon(id);
      setCoupons(coupons.map(c => c._id === id ? { ...c, isActive: false } : c));
    } catch {}
  };

  // Handler to open order modal
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setShowOrderModal(true);
    setStatusError('');
  };

  // Handler to close order modal
  const handleCloseOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
    setStatusError('');
  };

  // Handler to update order status
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    setStatusUpdating(true);
    setStatusError('');
    try {
      const res = await axiosInstance.put(`/orders/${selectedOrder._id}/status`, { status: newStatus });
      // Update local state
      setSelectedOrder({ ...selectedOrder, orderStatus: res.data.orderStatus });
      // Also update in orders list
      dispatch(fetchOrders({ seller: true }));
      setStatusUpdating(false);
      setShowOrderModal(false);
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Failed to update status');
      setStatusUpdating(false);
    }
  };

  // Edit product handler
  const handleEditProduct = (product) => {
    setEditProduct({
      ...product,
      mainCategory: product.category?._id || product.category,
      subCategory: product.subCategory?._id || product.subCategory
    });
    setEditModal({ open: true, product });
    setEditError('');
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting edit form');
    setEditError('');
    setEditLoading(true);
    const formData = new FormData();
    formData.append('name', editProduct.name);
    formData.append('description', editProduct.description);
    formData.append('price', editProduct.price);
    formData.append('comparePrice', editProduct.comparePrice);
    formData.append('stock', editProduct.stock);
    formData.append('brand', editProduct.brand);
    formData.append('sku', editProduct.sku);
    formData.append('category', editProduct.mainCategory);
    formData.append('subCategory', editProduct.subCategory);
    formData.append('features', editProduct.features);
    formData.append('specifications', JSON.stringify(editProduct.specifications.filter(s => s.key && s.value)));
    if (editProduct.imageFile) {
      formData.append('image', editProduct.imageFile);
    } else if (editProduct.images && editProduct.images[0] && editProduct.images[0].url) {
      formData.append('images[0][url]', editProduct.images[0].url);
    }
    // Log all FormData entries for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ':', pair[1]);
    }
    try {
      const res = await sellerAPI.editProduct(editModal.product._id, formData);
      setProducts(products.map(p => p._id === editModal.product._id ? res.data : p));
      setEditModal({ open: false, product: null });
    } catch (err) {
      console.error('Edit product error:', err.response);
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).map(e => e.message).join(' | ');
        setEditError(errorMessages);
      } else {
        setEditError(err.response?.data?.message || 'Failed to update product');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleManageVariants = (product) => {
    setSelectedProductForVariants(product);
    setShowVariantModal(true);
  };

  const handleVariantUpdate = async () => {
    // Refresh the product data after variant changes
    if (selectedProductForVariants) {
      try {
        const res = await productAPI.getProductById(selectedProductForVariants._id);
        setSelectedProductForVariants(res.data);
        // Also refresh the products list
        const productsRes = await sellerAPI.getProducts();
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Failed to refresh product data:', error);
      }
    }
  };

  // Handler to update soldCount
  const handleSoldCountChange = (productId, value) => {
    setSoldCountEdits((prev) => ({ ...prev, [productId]: value }));
  };
  const handleSoldCountSave = async (productId) => {
    setSoldCountLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await axiosInstance.put(`/api/seller/products/${productId}/sold-count`, { soldCount: Number(soldCountEdits[productId]) });
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, soldCount: res.data.soldCount } : p));
    } catch (err) {
      alert('Failed to update sold count');
    }
    setSoldCountLoading((prev) => ({ ...prev, [productId]: false }));
  };

  // Handler for listing a product
  const handleListProduct = async () => {
    setListingLoading(true);
    setListingError('');
    try {
      await productAPI.sellerListProduct(selectedProduct._id, sellerPrice);
      // Refresh seller listings
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
      setStep(1);
      setSelectedMainCat('');
      setSelectedSubCat('');
      setSelectedProduct(null);
      setSellerPrice('');
    } catch (err) {
      setListingError(err.response?.data?.message || 'Failed to list product');
    } finally {
      setListingLoading(false);
    }
  };

  // Handler for updating price
  const handleUpdatePrice = async (sellerProductId, newPrice) => {
    setListingLoading(true);
    try {
      await productAPI.sellerUpdatePrice(sellerProductId, newPrice);
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
    } catch {}
    setListingLoading(false);
  };

  // Handler for unlisting
  const handleUnlist = async (sellerProductId) => {
    setListingLoading(true);
    try {
      await productAPI.sellerUnlistProduct(sellerProductId);
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
    } catch {}
    setListingLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Seller Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your products, orders, and business analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaDollarSign className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatINR(stats.totalSales)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaBox className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaChartLine className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <FaUsers className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 text-sm font-medium ${activeTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 text-sm font-medium ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`py-4 text-sm font-medium ${activeTab === 'coupons' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Coupons
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">No recent activity to display</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
                  <div className="space-y-3">
                    {products.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded mr-3"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.sales} sales</p>
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">
                          {formatINR(product.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            {formatINR(order.total)}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">My Listings</h3>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => { setShowListingModal(true); setStep(1); }}
                >
                  <FaPlus /> List New Product
                </button>
              </div>
              {/* Listing Modal */}
              {showListingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300 animate-fadeIn">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-2 relative transition-transform duration-300 animate-slideUp">
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowListingModal(false)}>&times;</button>
                    <h2 className="text-xl font-bold mb-4">List a New Product</h2>
                    {/* Stepper for listing a product - only render current step */}
                    {step === 1 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Step 1: Select Main Category</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {categories.filter(cat => !cat.parentCategory).map(cat => (
                            <button
                              key={cat._id}
                              className={`flex flex-col items-center p-4 rounded border transition-colors duration-200 ${selectedMainCat === cat._id ? 'bg-blue-100 border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
                              onClick={() => { setSelectedMainCat(cat._id); setStep(2); }}
                            >
                              {cat.image && <img src={cat.image} alt={cat.name} className="w-14 h-14 object-contain rounded-full mb-2 border" />}
                              <span className="font-semibold text-gray-800">{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Step 2: Select Subcategory</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto max-h-[320px]">
                          {categories.filter(cat => cat.parentCategory === selectedMainCat).map(subcat => (
                            <button
                              key={subcat._id}
                              className={`flex flex-col items-center p-4 rounded border transition-colors duration-200 ${selectedSubCat === subcat._id ? 'bg-blue-100 border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
                              onClick={() => { setSelectedSubCat(subcat._id); setStep(3); }}
                            >
                              {subcat.image && <img src={subcat.image} alt={subcat.name} className="w-12 h-12 object-contain rounded-full mb-2 border" />}
                              <span className="font-semibold text-gray-800">{subcat.name}</span>
                            </button>
                          ))}
                        </div>
                        <button className="mt-4 text-blue-600 underline" onClick={() => setStep(1)}>&larr; Back to Main Categories</button>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Step 3: Select Product</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[320px]">
                          {adminProducts.filter(p => p.category === selectedMainCat && p.subCategory === selectedSubCat).map(product => (
                            <button
                              key={product._id}
                              className={`flex items-center p-4 rounded border transition-colors duration-200 w-full ${selectedProduct && selectedProduct._id === product._id ? 'bg-blue-100 border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
                              onClick={() => { setSelectedProduct(product); setStep(4); setSellerPrice(product.price); }}
                            >
                              <img src={product.images && product.images[0] ? product.images[0].url : '/product-images/default.webp'} alt={product.name} className="w-16 h-16 object-contain rounded mr-4 border" />
                              <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-800">{product.name}</div>
                                <div className="text-xs text-gray-500">Default Price: {formatINR(product.price)}</div>
                                <div className="text-xs text-gray-500">Brand: {product.brand}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <button className="mt-4 text-blue-600 underline" onClick={() => setStep(2)}>&larr; Back to Subcategories</button>
                      </div>
                    )}
                    {step === 4 && selectedProduct && (
                      <div className="mb-6 max-w-md mx-auto bg-white rounded shadow p-6">
                        <h4 className="font-semibold mb-2">Step 4: Set Your Price</h4>
                        <div className="flex items-center gap-4 mb-4">
                          <img src={selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0].url : '/product-images/default.webp'} alt={selectedProduct.name} className="w-20 h-20 object-contain rounded border" />
                          <div>
                            <div className="font-semibold text-gray-800">{selectedProduct.name}</div>
                            <div className="text-xs text-gray-500">Default Price: {formatINR(selectedProduct.price)}</div>
                            <div className="text-xs text-gray-500">Brand: {selectedProduct.brand}</div>
                          </div>
                        </div>
                        <input
                          type="number"
                          className="form-input w-full mb-2"
                          placeholder="Enter your price"
                          value={sellerPrice}
                          min="0"
                          onChange={e => setSellerPrice(e.target.value)}
                        />
                        {listingError && <div className="text-red-600 mb-2">{listingError}</div>}
                        <div className="flex gap-2 justify-end">
                          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded" onClick={() => setStep(3)}>Back</button>
                          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={async () => { await handleListProduct(); setShowListingModal(false); }} disabled={listingLoading}>{listingLoading ? 'Listing...' : 'List Product'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Seller's current listings */}
              <div className="mt-8">
                <h4 className="font-semibold mb-2">Your Current Listings</h4>
                {listingLoading && <div className="text-blue-600 mb-2">Updating...</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerListings.filter(l => l.isListed).map(listing => (
                    <div key={listing._id} className="bg-white rounded shadow p-4 flex items-center gap-4">
                      <img src={listing.product.images && listing.product.images[0] ? listing.product.images[0].url : '/product-images/default.webp'} alt={listing.product.name} className="w-16 h-16 object-contain rounded border" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{listing.product.name}</div>
                        <div className="text-xs text-gray-500">Brand: {listing.product.brand}</div>
                        <div className="text-xs text-gray-500">Default Price: {formatINR(listing.product.price)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            className="form-input w-24"
                            value={listing.sellerPrice}
                            min="0"
                            onChange={e => handleUpdatePrice(listing._id, e.target.value)}
                            disabled={listingLoading}
                          />
                          <span className="text-xs text-gray-500">Your Price</span>
                          <button className="text-red-600 ml-4 underline text-xs" onClick={() => handleUnlist(listing._id)} disabled={listingLoading}>Unlist</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sellerListings.filter(l => l.isListed).length === 0 && <div className="text-gray-400">You have no active listings. List a product above!</div>}
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Shipping Address</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr><td colSpan={8} className="text-center py-6">Loading...</td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-6">No orders found</td></tr>
                    ) : orders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-blue-600">{order.orderNumber || order._id}</td>
                        <td className="py-3 px-4">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</td>
                        <td className="py-3 px-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{order.orderItems?.map(item => `${item.product?.name} (x${item.quantity})`).join(', ')}</td>
                        <td className="py-3 px-4 font-medium">{formatINR(order.total)}</td>
                        <td className="py-3 px-4 text-xs">
                          {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.pincode}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800" onClick={() => handleViewOrder(order)}><FaEye /></button>
                            <button className="text-green-600 hover:text-green-800"><FaEdit /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Details Modal */}
              {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-2 relative overflow-y-auto max-h-[90vh]">
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={handleCloseOrderModal}>&times;</button>
                    <h2 className="text-2xl font-bold mb-2">Order Details</h2>
                    <div className="mb-2 text-sm text-gray-600">Order ID: <span className="font-mono">{selectedOrder.orderNumber || selectedOrder._id}</span></div>
                    <div className="mb-2 text-sm text-gray-600">Date: {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                    <div className="mb-2 text-sm text-gray-600">Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span></div>
                    <div className="mb-2 text-sm text-gray-600">
                      Customer: {selectedOrder.user?.name || selectedOrder.user?.firstName || ''} {selectedOrder.user?.lastName || ''} {selectedOrder.user?.email ? `(${selectedOrder.user.email})` : ''}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">Payment: {selectedOrder.paymentMethod}</div>
                    <div className="mb-4 text-sm text-gray-600">Shipping: {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}, {selectedOrder.shippingAddress?.address || selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}, {selectedOrder.shippingAddress?.pincode || selectedOrder.shippingAddress?.zipCode}, {selectedOrder.shippingAddress?.country}</div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Update Status</label>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value)}
                          disabled={statusUpdating}
                        >
                          {ORDER_STATUSES.map(status => (
                            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                          ))}
                        </select>
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                          onClick={handleStatusUpdate}
                          disabled={statusUpdating || newStatus === selectedOrder.orderStatus}
                        >
                          {statusUpdating ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      {statusError && <div className="text-red-600 text-xs mt-1">{statusError}</div>}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Products</h3>
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="py-2 px-2 text-left">Image</th>
                            <th className="py-2 px-2 text-left">Name</th>
                            <th className="py-2 px-2 text-left">Price</th>
                            <th className="py-2 px-2 text-left">Qty</th>
                            <th className="py-2 px-2 text-left">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.orderItems?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-2">
                                <img src={item.product?.images?.[0]?.url || item.image || '/product-images/default.webp'} alt={item.product?.name} className="w-12 h-12 object-cover rounded" />
                              </td>
                              <td className="py-2 px-2">{item.product?.name || item.name}</td>
                              <td className="py-2 px-2">{formatINR(item.price)}</td>
                              <td className="py-2 px-2">{item.quantity}</td>
                              <td className="py-2 px-2">{formatINR(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-right font-bold text-lg">Total: {formatINR(selectedOrder.total || selectedOrder.totalPrice)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Coupon Management</h2>
              <form onSubmit={handleCreateCoupon} className="mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input type="text" name="code" value={couponForm.code} onChange={handleCouponInput} required className="px-3 py-2 border rounded w-full" placeholder="COUPON2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount (₹ or %)</label>
                  <input type="number" name="discount" value={couponForm.discount} onChange={handleCouponInput} required className="px-3 py-2 border rounded w-full" placeholder="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry</label>
                  <input type="date" name="expiry" value={couponForm.expiry} onChange={handleCouponInput} required className="px-3 py-2 border rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usage Limit</label>
                  <input type="number" name="usageLimit" value={couponForm.usageLimit} onChange={handleCouponInput} className="px-3 py-2 border rounded w-full" placeholder="1" />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Create</button>
              </form>
              {couponStatus && <div className={`mb-4 text-sm ${couponStatus.includes('created') ? 'text-green-600' : 'text-red-600'}`}>{couponStatus}</div>}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Code</th>
                      <th className="py-2 px-4 border-b">Discount</th>
                      <th className="py-2 px-4 border-b">Expiry</th>
                      <th className="py-2 px-4 border-b">Usage Limit</th>
                      <th className="py-2 px-4 border-b">Used By</th>
                      <th className="py-2 px-4 border-b">Status</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon._id}>
                        <td className="py-2 px-4 border-b font-mono">{coupon.code}</td>
                        <td className="py-2 px-4 border-b">{coupon.discount}</td>
                        <td className="py-2 px-4 border-b">{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : ''}</td>
                        <td className="py-2 px-4 border-b">{coupon.usageLimit || '∞'}</td>
                        <td className="py-2 px-4 border-b">{coupon.usedBy?.length || 0}</td>
                        <td className="py-2 px-4 border-b">
                          {coupon.isActive ? <span className="text-green-600">Active</span> : <span className="text-gray-400">Inactive</span>}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {coupon.isActive && (
                            <button onClick={() => handleDeactivateCoupon(coupon._id)} className="text-red-600 underline text-xs">Deactivate</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-lg mx-2 sm:mx-0 relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setEditModal({ open: false, product: null })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            {editError && <div className="text-red-500 mb-2">{editError}</div>}
            <form onSubmit={handleEditProductSubmit} encType="multipart/form-data" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" className="form-input" placeholder="Product Name" value={editProduct.name || ''} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} required />
                <input type="text" className="form-input" placeholder="Brand" value={editProduct.brand || ''} onChange={e => setEditProduct({ ...editProduct, brand: e.target.value })} required />
                <input type="text" className="form-input" placeholder="SKU" value={editProduct.sku || ''} onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })} required />
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Select Main Category</label>
                  <select
                    className="form-input w-full mb-2"
                    value={editProduct.mainCategory || ''}
                    onChange={e => setEditProduct({ ...editProduct, mainCategory: e.target.value, subCategory: '' })}
                    required
                  >
                    <option value="">-- Select Main Category --</option>
                    {categories.filter(cat => !cat.parentCategory).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {/* Subcategory selection as cards/pills */}
                  {editProduct.mainCategory && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categories.filter(cat => cat.parentCategory === editProduct.mainCategory).map(subcat => (
                        <button
                          type="button"
                          key={subcat._id}
                          className={`px-3 py-2 rounded border transition-colors ${editProduct.subCategory === subcat._id ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100'}`}
                          onClick={() => setEditProduct({ ...editProduct, subCategory: subcat._id })}
                        >
                          {subcat.name}
                        </button>
                      ))}
                      {categories.filter(cat => cat.parentCategory === editProduct.mainCategory).length === 0 && <span className="text-gray-400">No subcategories found.</span>}
                    </div>
                  )}
                </div>
              </div>
              <input type="number" className="form-input" placeholder="Price" value={editProduct.price || ''} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} required min="0" />
              <input type="number" className="form-input" placeholder="Original Price (MRP)" value={editProduct.comparePrice || ''} onChange={e => setEditProduct({ ...editProduct, comparePrice: e.target.value })} min="0" />
              <input type="number" className="form-input" placeholder="Stock" value={editProduct.stock || ''} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} required min="0" />
              <textarea className="form-input" placeholder="Description" value={editProduct.description || ''} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} required />
              <input type="text" className="form-input" placeholder="Key Features (comma separated)" value={editProduct.features || ''} onChange={e => setEditProduct({ ...editProduct, features: e.target.value })} />
              <div>
                {editProduct.specifications && editProduct.specifications.map((spec, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input type="text" className="form-input flex-1" placeholder="Spec Name" value={spec.key} onChange={e => {
                      const specs = [...editProduct.specifications];
                      specs[idx].key = e.target.value;
                      setEditProduct({ ...editProduct, specifications: specs });
                    }} />
                    <input type="text" className="form-input flex-1" placeholder="Spec Value" value={spec.value} onChange={e => {
                      const specs = [...editProduct.specifications];
                      specs[idx].value = e.target.value;
                      setEditProduct({ ...editProduct, specifications: specs });
                    }} />
                    <button type="button" onClick={() => {
                      const specs = editProduct.specifications.filter((_, i) => i !== idx);
                      setEditProduct({ ...editProduct, specifications: specs });
                    }} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setEditProduct({ ...editProduct, specifications: [...(editProduct.specifications || []), { key: '', value: '' }] })} className="text-blue-600 mb-2">+ Add Specification</button>
              </div>
              <input type="file" accept="image/*" onChange={e => setEditProduct({ ...editProduct, imageFile: e.target.files[0] })} />
              <button type="submit" className="btn-primary w-full" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Variant Management Modal */}
      {showVariantModal && selectedProductForVariants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Manage Variants - {selectedProductForVariants.name}</h2>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedProductForVariants(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <VariantManager
              product={selectedProductForVariants}
              onVariantUpdate={handleVariantUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard; 