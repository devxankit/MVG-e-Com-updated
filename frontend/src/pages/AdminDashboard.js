import React, { useState, useEffect } from 'react';
import { FaUsers, FaBox, FaDollarSign, FaChartLine, FaEdit, FaTrash, FaEye, FaPlus, FaStore, FaCheck, FaTimes, FaImage, FaStar as FaStarFilled, FaRegStar as FaStarOutline, FaCompass, FaRegCompass, FaThumbsUp, FaRegThumbsUp } from 'react-icons/fa';
import { formatINR } from '../utils/formatCurrency';
import sellerAPI from '../api/sellerAPI';
import productAPI from '../api/productAPI';
import axiosInstance from '../api/axiosConfig';
import { useDispatch } from 'react-redux';
import { fetchFeaturedProducts } from '../redux/slices/productSlice';
import { TextField, Button, Button as MUIButton, Grid, Card, CardContent, Typography, Select, Select as MUISelect, MenuItem, InputLabel, FormControl, Box } from '@mui/material';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorActionLoading, setVendorActionLoading] = useState(null); // vendorId or null
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalOrders: 0,
    totalVendors: 0,
    pendingVendors: 0
  });

const [editModal, setEditModal] = useState({ open: false, product: null });
const [rejectModal, setRejectModal] = useState({ open: false, product: null });
const [addProductModal, setAddProductModal] = useState({ open: false });
const [addProductForm, setAddProductForm] = useState({});
const [addProductError, setAddProductError] = useState('');
const [editForm, setEditForm] = useState({});
const [editError, setEditError] = useState('');
const [rejectReason, setRejectReason] = useState('');
const [actionLoading, setActionLoading] = useState(null);
const [imageUploadProgress, setImageUploadProgress] = useState(0);

  const [editUserModal, setEditUserModal] = useState({ open: false, user: null });
  const [editUserForm, setEditUserForm] = useState({});
  const [editUserError, setEditUserError] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', image: null });
  const [categoryError, setCategoryError] = useState('');

  const [selectedMainCat, setSelectedMainCat] = useState('');

  const [eventBanner, setEventBanner] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', description: '', endDate: '', product: '' });
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState('');

  // --- Refactor: Separate admin products and seller listings ---
  const [adminProducts, setAdminProducts] = useState([]); // Admin product templates
  const [loadingAdminProducts, setLoadingAdminProducts] = useState(false);
  const [sellerListings, setSellerListings] = useState([]); // Seller product listings
  const [loadingSellerListings, setLoadingSellerListings] = useState(false);

  // Seller Listings filter state
  const [sellerListingSearch, setSellerListingSearch] = useState('');
  const [sellerListingStatus, setSellerListingStatus] = useState('all');

  const dispatch = useDispatch();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'Completed':
        return 'text-green-600 bg-green-100';
      case 'inactive':
      case 'rejected':
      case 'Cancelled':
        return 'text-red-600 bg-red-100';
      case 'pending':
      case 'Processing':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-100';
      case 'seller':
        return 'text-blue-600 bg-blue-100';
      case 'customer':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    // Fetch users
    axiosInstance.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]));
    // Fetch orders
    axiosInstance.get('/admin/orders')
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]));
    // Fetch stats/analytics
    axiosInstance.get('/admin/analytics')
      .then(res => setStats(res.data))
      .catch(() => setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalSales: 0,
        totalOrders: 0,
        totalVendors: 0,
        pendingVendors: 0
      }));
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      try {
        const res = await sellerAPI.getAllSellers();
        setVendors(res.data);
      } catch (err) {
        // Optionally show error
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    setLoadingProducts(true);
    productAPI.getProducts()
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    setLoadingCategories(true);
    productAPI.getCategories()
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    productAPI.getEventBanner().then(res => {
      setEventBanner(res.data);
      if (res.data) {
        setEventForm({
          title: res.data.title,
          description: res.data.description,
          endDate: res.data.endDate ? res.data.endDate.slice(0, 16) : '',
          product: res.data.product?._id || ''
        });
      }
    });
  }, []);

  // --- Fetch admin products and seller listings ---
  useEffect(() => {
    if (activeTab === 'products') {
      setLoadingAdminProducts(true);
      setLoadingSellerListings(true);
      productAPI.getAdminProducts()
        .then(res => setAdminProducts(res.data))
        .catch(() => setAdminProducts([]))
        .finally(() => setLoadingAdminProducts(false));
      productAPI.adminGetAllSellerListings()
        .then(res => setSellerListings(res.data))
        .catch(() => setSellerListings([]))
        .finally(() => setLoadingSellerListings(false));
    }
  }, [activeTab]);

  const handleVendorAction = async (vendorId, action) => {
    setVendorActionLoading(vendorId + action);
    try {
      if (action === 'approve') {
        await sellerAPI.approveSeller(vendorId);
      } else if (action === 'reject') {
        const reason = window.prompt('Enter rejection reason:') || 'Rejected by admin';
        await sellerAPI.rejectSeller(vendorId, reason);
      }
      // Refresh vendor list
      const res = await sellerAPI.getAllSellers();
      setVendors(res.data);
    } catch (err) {
      // Optionally show error
    } finally {
      setVendorActionLoading(null);
    }
  };

  // Approve product
  const handleApprove = async (id) => {
    setActionLoading(id + 'approve');
    try {
      const res = await productAPI.approveProduct(id);
      setProducts(products.map(p => p._id === id ? res.data : p));
    } finally {
      setActionLoading(null);
    }
  };
  // Reject product
  const handleReject = async (id, reason) => {
    setActionLoading(id + 'reject');
    try {
      const res = await productAPI.rejectProduct(id, reason);
      setProducts(products.map(p => p._id === id ? res.data : p));
      setRejectModal({ open: false, product: null });
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  };
  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setActionLoading(id + 'delete');
    try {
      await productAPI.deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
    } finally {
      setActionLoading(null);
    }
  };
  // Edit product
  const handleEdit = (product) => {
    setEditForm({ ...product, price: product.price || '', stock: product.stock || '' });
    setEditModal({ open: true, product });
    setEditError('');
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setActionLoading(editModal.product._id + 'edit');
    try {
      const res = await productAPI.editProduct(editModal.product._id, editForm);
      setProducts(products.map(p => p._id === editModal.product._id ? res.data : p));
      setEditModal({ open: false, product: null });
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setActionLoading(null);
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setEditUserForm({ ...user });
    setEditUserModal({ open: true, user });
    setEditUserError('');
  };
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserError('');
    setUserActionLoading(editUserModal.user._id + 'edit');
    try {
      const res = await axiosInstance.put(`/admin/users/${editUserModal.user._id}`, editUserForm);
      setUsers(users.map(u => u._id === editUserModal.user._id ? res.data : u));
      setEditUserModal({ open: false, user: null });
    } catch (err) {
      setEditUserError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setUserActionLoading(null);
    }
  };
  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setUserActionLoading(id + 'delete');
    try {
      await axiosInstance.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };
  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const handleOpenCategoryModal = (category = null) => {
    setCategoryForm(category ? { ...category, image: null } : { name: '', slug: '', description: '', image: null });
    setCategoryModal({ open: true, category });
    setCategoryError('');
  };
  const handleCategoryFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setCategoryForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setCategoryForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    setCategoryError('');
    const formData = new FormData();
    formData.append('name', categoryForm.name);
    formData.append('slug', categoryForm.slug);
    formData.append('description', categoryForm.description);
    if (categoryForm.image) formData.append('image', categoryForm.image);
    try {
      if (categoryModal.category) {
        await productAPI.updateCategory(categoryModal.category._id, formData);
      } else {
        await productAPI.createCategory(formData);
      }
      // Refresh categories
      setLoadingCategories(true);
      const res = await productAPI.getCategories();
      setCategories(res.data);
      setCategoryModal({ open: false, category: null });
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Helper to check if item is a seller listing
  const isSellerListing = (item) => !!item.sellerPrice && !item.price;

  // Updated action handlers
  const handleFeatureProduct = async (item, isFeatured) => {
    setActionLoading(item._id + 'feature');
    try {
      let res;
      if (isSellerListing(item)) {
        if (isFeatured) {
          res = await productAPI.unfeatureSellerProduct(item._id);
        } else {
          res = await productAPI.featureSellerProduct(item._id);
        }
        setSellerListings(sellerListings.map(l => l._id === item._id ? res.data : l));
      } else {
        if (isFeatured) {
          res = await productAPI.unfeatureProduct(item._id);
        } else {
          res = await productAPI.featureProduct(item._id);
        }
        setAdminProducts(adminProducts.map(p => p._id === item._id ? res.data.product || res.data : p));
      }
    } finally {
      setActionLoading(null);
    }
  };
  const handleDiscoverProduct = async (item, isDiscover) => {
    setActionLoading(item._id + 'discover');
    try {
      let res;
      if (isSellerListing(item)) {
        if (isDiscover) {
          res = await productAPI.undiscoverSellerProduct(item._id);
        } else {
          res = await productAPI.discoverSellerProduct(item._id);
        }
        setSellerListings(sellerListings.map(l => l._id === item._id ? res.data : l));
      } else {
        if (isDiscover) {
          res = await productAPI.unsetDiscoverProduct(item._id);
        } else {
          res = await productAPI.setDiscoverProduct(item._id);
        }
        setAdminProducts(adminProducts.map(p => p._id === item._id ? res.data.product || res.data : p));
      }
    } finally {
      setActionLoading(null);
    }
  };
  const handleRecommendProduct = async (item, isRecommended) => {
    setActionLoading(item._id + 'recommend');
    try {
      let res;
      if (isSellerListing(item)) {
        if (isRecommended) {
          res = await productAPI.unrecommendSellerProduct(item._id);
        } else {
          res = await productAPI.recommendSellerProduct(item._id);
        }
        setSellerListings(sellerListings.map(l => l._id === item._id ? res.data : l));
      } else {
        if (isRecommended) {
          res = await productAPI.unsetRecommendedProduct(item._id);
        } else {
          res = await productAPI.setRecommendedProduct(item._id);
        }
        setAdminProducts(adminProducts.map(p => p._id === item._id ? res.data.product || res.data : p));
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Add new product
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    setAddProductError('');

    // Validation
    if (!addProductForm.name?.trim()) return setAddProductError('Product name is required');
    if (!addProductForm.description?.trim()) return setAddProductError('Short description is required');
    if (!addProductForm.productDescription?.trim()) return setAddProductError('Detailed description is required');
    if (!addProductForm.price || isNaN(Number(addProductForm.price)) || Number(addProductForm.price) <= 0) return setAddProductError('Valid price is required');
    if (addProductForm.comparePrice && isNaN(Number(addProductForm.comparePrice))) return setAddProductError('Compare price must be a number');
    if (!addProductForm.stock || isNaN(Number(addProductForm.stock)) || Number(addProductForm.stock) < 0) return setAddProductError('Valid stock quantity is required');
    if (!addProductForm.brand?.trim()) return setAddProductError('Brand is required');
    if (!addProductForm.sku?.trim()) return setAddProductError('SKU is required');
    if (!addProductForm.category || addProductForm.category.length !== 24) return setAddProductError('Main category is required');
    if (!addProductForm.subCategory || addProductForm.subCategory.length !== 24) return setAddProductError('Subcategory is required');

    setActionLoading('addProduct');
    setImageUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('name', addProductForm.name);
      formData.append('description', addProductForm.description);
      formData.append('productDescription', addProductForm.productDescription);
      formData.append('price', String(Number(addProductForm.price)));
      if (addProductForm.comparePrice) formData.append('comparePrice', String(Number(addProductForm.comparePrice)));
      formData.append('stock', String(Number(addProductForm.stock)));
      formData.append('brand', addProductForm.brand);
      formData.append('sku', addProductForm.sku);
      formData.append('category', addProductForm.category);
      formData.append('subCategory', addProductForm.subCategory);
      if (addProductForm.features) formData.append('features', addProductForm.features);
      if (addProductForm.tags) formData.append('tags', addProductForm.tags);
      if (addProductForm.imageFiles && addProductForm.imageFiles.length > 0) {
        addProductForm.imageFiles.forEach((file) => {
          formData.append('images', file);
        });
      }
      // Debug: print all FormData keys/values
      for (let pair of formData.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }
      const res = await axiosInstance.post('/admin/create-product', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setImageUploadProgress(percentCompleted);
        },
      });
      setProducts([...products, res.data.product]);
      setAddProductModal({ open: false });
      setAddProductForm({});
      setImageUploadProgress(0);
      toast.success('Product created successfully!');
    } catch (err) {
      console.error('Product creation error:', err, err?.response?.data);
      setAddProductError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();
    setEventLoading(true);
    setEventError('');
    try {
      await productAPI.createOrUpdateEventBanner(eventForm);
      await productAPI.setEventProduct(eventForm.product);
      const res = await productAPI.getEventBanner();
      setEventBanner(res.data);
    } catch (err) {
      setEventError(err.response?.data?.message || 'Failed to update event banner');
    } finally {
      setEventLoading(false);
    }
  };

  const handleDeleteEventBanner = async () => {
    if (!window.confirm('Are you sure you want to delete the event banner?')) return;
    setEventLoading(true);
    setEventError('');
    try {
      await productAPI.deleteEventBanner();
      setEventBanner(null);
      setEventForm({ title: '', description: '', endDate: '', product: '' });
    } catch (err) {
      setEventError(err.response?.data?.message || 'Failed to delete event banner');
    } finally {
      setEventLoading(false);
    }
  };

  // Filtering logic
  const filteredSellerListings = sellerListings.filter(listing => {
    const search = sellerListingSearch.toLowerCase();
    const matchesProduct = listing.product?.name?.toLowerCase().includes(search);
    const matchesSeller = listing.seller?.shopName?.toLowerCase().includes(search) || (listing.seller?._id || '').toLowerCase().includes(search);
    const matchesStatus = sellerListingStatus === 'all' || (sellerListingStatus === 'active' && listing.isListed) || (sellerListingStatus === 'unlisted' && !listing.isListed);
    return (matchesProduct || matchesSeller) && matchesStatus;
  });

  // Add dashboard summary calculation
  const totalProducts = adminProducts.length;
  const uniqueSellerIds = new Set(sellerListings.map(l => l.seller?._id || l.seller));
  const totalSellers = uniqueSellerIds.size;
  const totalActiveListings = sellerListings.filter(l => l.isListed).length;
  // Placeholder for total sales (if available)
  const totalSales = sellerListings.reduce((sum, l) => sum + (l.totalSold || 0), 0);

  // Helper: Get seller display name
  const getSellerDisplay = seller => seller?.businessName || seller?.email || seller?._id || 'N/A';
  // Helper: Get seller avatar/initials
  const getSellerAvatar = seller => seller?.businessName ? seller.businessName[0].toUpperCase() : (seller?.email ? seller.email[0].toUpperCase() : 'S');

  // Add pagination state for products and listings
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);
  const paginatedProducts = adminProducts.slice((productPage-1)*productPageSize, productPage*productPageSize);
  const productTotalPages = Math.ceil(adminProducts.length / productPageSize);

  const [listingPage, setListingPage] = useState(1);
  const [listingPageSize, setListingPageSize] = useState(10);
  const filteredListings = sellerListings.filter(listing => {
    const search = sellerListingSearch.toLowerCase();
    const matchesProduct = listing.product?.name?.toLowerCase().includes(search);
    const matchesSeller = getSellerDisplay(listing.seller).toLowerCase().includes(search);
    return matchesProduct || matchesSeller;
  });
  const paginatedListings = filteredListings.slice((listingPage-1)*listingPageSize, listingPage*listingPageSize);
  const listingTotalPages = Math.ceil(filteredListings.length / listingPageSize);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users, vendors, products, and platform analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaUsers className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{typeof stats.totalUsers === 'number' ? stats.totalUsers.toLocaleString() : '0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaStore className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-800">{typeof stats.totalVendors === 'number' ? stats.totalVendors.toLocaleString() : '0'}</p>
              <p className="text-xs text-yellow-600">{typeof stats.pendingVendors === 'number' ? stats.pendingVendors.toLocaleString() : '0'} pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaDollarSign className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatINR(typeof stats.totalSales === 'number' ? stats.totalSales * 83 : 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <FaChartLine className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{typeof stats.totalOrders === 'number' ? stats.totalOrders.toLocaleString() : '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 admin-tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vendors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vendors
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('eventBanner')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'eventBanner'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Event Banner
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Vendors</h3>
                  <div className="space-y-3">
                    {(Array.isArray(vendors) ? vendors : []).slice(0, 3).map((vendor) => (
                      <div key={vendor._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{vendor.shopName}</p>
                          <p className="text-sm text-gray-600">{vendor.userId?.name || '-'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.isApproved ? 'approved' : vendor.rejectionReason ? 'rejected' : 'pending')}`}>
                            {vendor.isApproved ? 'Approved' : vendor.rejectionReason ? 'Rejected' : 'Pending'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {(Array.isArray(orders) ? orders : []).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">${order.total}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Analytics</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">Analytics dashboard coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Vendor Management</h3>
                <div className="flex gap-2">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <FaCheck />
                    Approve All Pending
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <FaPlus />
                    Add Vendor
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Vendors</h2>
                {loadingVendors ? (
                  <div>Loading vendors...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border">Business Name</th>
                          <th className="px-4 py-2 border">Owner</th>
                          <th className="px-4 py-2 border">Email</th>
                          <th className="px-4 py-2 border">Phone</th>
                          <th className="px-4 py-2 border">Business Type</th>
                          <th className="px-4 py-2 border">Status</th>
                          <th className="px-4 py-2 border">Applied</th>
                          <th className="px-4 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(vendors) ? vendors : []).map((vendor) => (
                          <tr key={vendor._id}>
                            <td className="px-4 py-2 border">{vendor.shopName}</td>
                            <td className="px-4 py-2 border">{vendor.userId?.name || '-'}</td>
                            <td className="px-4 py-2 border">{vendor.email}</td>
                            <td className="px-4 py-2 border">{vendor.phone}</td>
                            <td className="px-4 py-2 border">{vendor.businessInfo?.businessType || '-'}</td>
                            <td className={`px-4 py-2 border ${getStatusColor(vendor.isApproved ? 'approved' : vendor.rejectionReason ? 'rejected' : 'pending')}`}>{vendor.isApproved ? 'Approved' : vendor.rejectionReason ? 'Rejected' : 'Pending'}</td>
                            <td className="px-4 py-2 border">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-2 border">
                              {!vendor.isApproved && !vendor.rejectionReason && (
                                <>
                                  <button
                                    className="bg-green-500 text-white px-2 py-1 rounded mr-2 disabled:opacity-50"
                                    onClick={() => handleVendorAction(vendor._id, 'approve')}
                                    disabled={vendorActionLoading === vendor._id + 'approve'}
                                  >
                                    {vendorActionLoading === vendor._id + 'approve' ? 'Approving...' : 'Approve'}
                                  </button>
                                  <button
                                    className="bg-red-500 text-white px-2 py-1 rounded disabled:opacity-50"
                                    onClick={() => handleVendorAction(vendor._id, 'reject')}
                                    disabled={vendorActionLoading === vendor._id + 'reject'}
                                  >
                                    {vendorActionLoading === vendor._id + 'reject' ? 'Rejecting...' : 'Reject'}
                                  </button>
                                </>
                              )}
                              {vendor.rejectionReason && (
                                <span title={vendor.rejectionReason} className="text-xs text-red-600">Rejected</span>
                              )}
                              {vendor.isApproved && (
                                <span className="text-xs text-green-600">Approved</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">User Management</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <FaPlus />
                  Add User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Join Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(users) ? users : []).map((user) => (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">{user.name}</td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>{user.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>{user.status}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="text-green-600 hover:text-green-800" onClick={() => handleEditUser(user)} disabled={userActionLoading === user._id + 'edit'}><FaEdit /></button>
                            <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteUser(user._id)} disabled={userActionLoading === user._id + 'delete'}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit User Modal */}
              {editUserModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setEditUserModal({ open: false, user: null })}>&times;</button>
                    <h2 className="text-xl font-bold mb-4">Edit User</h2>
                    {editUserError && <div className="text-red-500 mb-2">{editUserError}</div>}
                    <form onSubmit={handleEditUserSubmit} className="space-y-4">
                      <input type="text" className="form-input" placeholder="Name" value={editUserForm.name || ''} onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })} required />
                      <input type="email" className="form-input" placeholder="Email" value={editUserForm.email || ''} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} required />
                      <select className="form-input" value={editUserForm.role || ''} onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })} required>
                        <option value="">Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="seller">Seller</option>
                        <option value="customer">Customer</option>
                      </select>
                      <select className="form-input" value={editUserForm.status || ''} onChange={e => setEditUserForm({ ...editUserForm, status: e.target.value })} required>
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <button type="submit" className="btn-primary w-full">Update User</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="p-6">
              {/* Dashboard Summary */}
              <div className="mb-6 flex flex-wrap gap-6 items-center">
                <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[180px] text-center">
                  <div className="text-xs text-gray-500">Total Products</div>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[180px] text-center">
                  <div className="text-xs text-gray-500">Total Sellers</div>
                  <div className="text-2xl font-bold">{totalSellers}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[180px] text-center">
                  <div className="text-xs text-gray-500">Active Listings</div>
                  <div className="text-2xl font-bold">{totalActiveListings}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[180px] text-center">
                  <div className="text-xs text-gray-500">Total Sold</div>
                  <div className="text-2xl font-bold">{totalSales}</div>
                </div>
              </div>
              {/* Main Content: Admin Products & Seller Listings */}
              <div className="space-y-10">
                {/* Admin Product Templates Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Admin Product Templates</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2" onClick={() => setAddProductModal({ open: true })}>
                      <FaPlus /> Add Product
                </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full text-sm align-middle">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 border">Image</th>
                          <th className="px-2 py-2 border">Name</th>
                          <th className="px-2 py-2 border">Category</th>
                          <th className="px-2 py-2 border">Stock</th>
                          <th className="px-2 py-2 border">Date Added</th>
                          <th className="px-2 py-2 border">Seller Count</th>
                          <th className="px-2 py-2 border">Price Range</th>
                          <th className="px-2 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-8 text-gray-400">No products found.</td></tr>
                        ) : paginatedProducts.map(product => {
                          const sellersForProduct = sellerListings.filter(listing => listing.product?._id === product._id);
                          const prices = sellersForProduct.map(l => l.sellerPrice);
                          const minPrice = prices.length ? Math.min(...prices) : null;
                          const maxPrice = prices.length ? Math.max(...prices) : null;
                          return (
                            <tr key={product._id} className="hover:bg-gray-50">
                              <td className="px-2 py-2 border text-center"><img src={product.images?.[0]?.url || '/product-images/default.webp'} alt={product.name} className="w-8 h-8 object-contain rounded border mx-auto" /></td>
                              <td className="px-2 py-2 border font-semibold">{product.name}</td>
                              <td className="px-2 py-2 border">{typeof product.category === 'object' ? (product.category?.name || '-') : (product.category || '-')}</td>
                              <td className="px-2 py-2 border text-center">{product.stock ?? '-'}</td>
                              <td className="px-2 py-2 border text-xs text-center">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}</td>
                              <td className="px-2 py-2 border text-center">
                                <button className="text-blue-600 underline" title="View Sellers" onClick={() => setEditModal({ open: true, product, sellers: sellersForProduct })}>
                                  {sellersForProduct.length}
                                </button>
                              </td>
                              <td className="px-2 py-2 border text-center">{minPrice !== null ? `${formatINR(minPrice)} - ${formatINR(maxPrice)}` : '-'}</td>
                              <td className="px-2 py-2 border flex gap-1 justify-center">
                                <button className="text-green-600 hover:text-green-800" title="Edit" onClick={() => handleEdit(product)}><FaEdit /></button>
                                <button className="text-red-600 hover:text-red-800" title="Delete" onClick={() => handleDelete(product._id)}><FaTrash /></button>
                                <button className={product.isFeatured ? "text-yellow-500" : "text-gray-400"} title="Feature" onClick={() => handleFeatureProduct(product, product.isFeatured)}><FaStarFilled /></button>
                                <button className={product.isDiscover ? "text-blue-500" : "text-gray-400"} title="Discover" onClick={() => handleDiscoverProduct(product, product.isDiscover)}><FaCompass /></button>
                                <button className={product.isRecommended ? "text-green-500" : "text-gray-400"} title="Recommend" onClick={() => handleRecommendProduct(product, product.isRecommended)}><FaThumbsUp /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls for Products */}
                  {productTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <button className="px-2 py-1 mr-2 border rounded disabled:opacity-50" onClick={() => setProductPage(p => Math.max(1, p-1))} disabled={productPage === 1}>Prev</button>
                        <span>Page {productPage} of {productTotalPages}</span>
                        <button className="px-2 py-1 ml-2 border rounded disabled:opacity-50" onClick={() => setProductPage(p => Math.min(productTotalPages, p+1))} disabled={productPage === productTotalPages}>Next</button>
                      </div>
                      <div>
                        <label className="mr-1 text-xs">Rows per page:</label>
                        <select value={productPageSize} onChange={e => { setProductPageSize(Number(e.target.value)); setProductPage(1); }} className="border rounded px-1 py-0.5 text-xs">
                          {[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                {/* Seller Listings Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Seller Listings</h3>
                    <input type="text" className="border rounded px-2 py-1 text-sm ml-2" placeholder="Search by product or seller..." value={sellerListingSearch} onChange={e => { setListingPage(1); setSellerListingSearch(e.target.value); }} style={{ minWidth: 180 }} />
                  </div>
                  {paginatedListings.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No seller listings found.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedListings.map(listing => (
                        <div key={listing._id} className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col gap-2 hover:shadow-md transition">
                          <div className="flex items-center gap-4">
                            <img src={listing.product?.images?.[0]?.url || '/product-images/default.webp'} alt={listing.product?.name} className="w-14 h-14 object-contain rounded border" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{listing.product?.name}</div>
                              <div className="text-xs text-gray-500 truncate">Seller: {listing.seller && getSellerDisplay(listing.seller) !== 'N/A' ? (
                                <><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-bold mr-1">{getSellerAvatar(listing.seller)}</span>{getSellerDisplay(listing.seller)}</>
                              ) : <span className="text-gray-400">No Seller</span>}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 items-center mt-2 text-sm">
                            <div>Seller Price: <span className="font-bold text-blue-700">{listing.seller && getSellerDisplay(listing.seller) !== 'N/A' ? formatINR(listing.sellerPrice) : '-'}</span></div>
                            <div>Default Price: <span>{listing.product?.price ? formatINR(listing.product?.price) : '-'}</span></div>
                            <div>Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${listing.isListed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{listing.isListed ? 'Active' : 'Unlisted'}</span></div>
                            <div>Listed: <span className="text-xs">{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : '-'}</span></div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button className="text-green-600 hover:text-green-800" title="Edit" onClick={() => setEditModal({ open: true, product: listing })}><FaEdit /></button>
                            <button className={listing.isFeatured ? "text-yellow-500" : "text-gray-400"} title="Feature" onClick={() => handleFeatureProduct(listing, listing.isFeatured)}><FaStarFilled /></button>
                            <button className={listing.isDiscover ? "text-blue-500" : "text-gray-400"} title="Discover" onClick={() => handleDiscoverProduct(listing, listing.isDiscover)}><FaCompass /></button>
                            <button className={listing.isRecommended ? "text-green-500" : "text-gray-400"} title="Recommend" onClick={() => handleRecommendProduct(listing, listing.isRecommended)}><FaThumbsUp /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Pagination Controls for Seller Listings */}
                  {listingTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <button className="px-2 py-1 mr-2 border rounded disabled:opacity-50" onClick={() => setListingPage(p => Math.max(1, p-1))} disabled={listingPage === 1}>Prev</button>
                        <span>Page {listingPage} of {listingTotalPages}</span>
                        <button className="px-2 py-1 ml-2 border rounded disabled:opacity-50" onClick={() => setListingPage(p => Math.min(listingTotalPages, p+1))} disabled={listingPage === listingTotalPages}>Next</button>
                      </div>
                      <div>
                        <label className="mr-1 text-xs">Rows per page:</label>
                        <select value={listingPageSize} onChange={e => { setListingPageSize(Number(e.target.value)); setListingPage(1); }} className="border rounded px-1 py-0.5 text-xs">
                          {[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Order #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Seller</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(orders) ? orders : []).map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-blue-600">{order.orderNumber || order._id}</td>
                        <td className="py-3 px-4">{order.user?.name} <span className="text-xs text-gray-500">{order.user?.email}</span></td>
                        <td className="py-3 px-4">{order.seller?.shopName || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{order.orderItems?.map(item => `${item.product?.name || item.name} (x${item.quantity})`).join(', ')}</td>
                        <td className="py-3 px-4 font-medium">{formatINR(order.totalPrice)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800" onClick={() => handleViewOrder(order)}><FaEye /></button>
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
                    <div className="mb-2 text-sm text-gray-600">Order #: <span className="font-mono">{selectedOrder.orderNumber || selectedOrder._id}</span></div>
                    <div className="mb-2 text-sm text-gray-600">Date: {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                    <div className="mb-2 text-sm text-gray-600">Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span></div>
                    <div className="mb-2 text-sm text-gray-600">Customer: {selectedOrder.user?.name} ({selectedOrder.user?.email})</div>
                    <div className="mb-2 text-sm text-gray-600">Seller: {selectedOrder.seller?.shopName}</div>
                    <div className="mb-2 text-sm text-gray-600">Payment: {selectedOrder.paymentMethod}</div>
                    <div className="mb-2 text-sm text-gray-600">Shipping: {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}, {selectedOrder.shippingAddress?.zipCode}, {selectedOrder.shippingAddress?.country}</div>
                    <div className="mb-2 text-sm text-gray-600">Items:</div>
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
                                <img src={item.product?.images?.[0]?.url || item.image || '/product-images/default.webp'} alt={item.product?.name || item.name} className="w-12 h-12 object-cover rounded" />
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
                    <div className="text-right font-bold text-lg">Total: {formatINR(selectedOrder.totalPrice)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Main Categories */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Main Categories</h3>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    onClick={() => handleOpenCategoryModal()}
                  >
                    <FaPlus /> Add Main Category
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.filter(cat => !cat.parentCategory).map(cat => (
                    <div key={cat._id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                      {cat.image && (
                        <img src={cat.image} alt={cat.name} className="w-16 h-16 object-contain rounded-full mb-2 border shadow" />
                      )}
                      <span className="font-semibold mb-1 text-center">{cat.name}</span>
                      <span className="text-xs text-gray-500 mb-2 text-center">{cat.productCount || 0} products</span>
                      <div className="flex gap-2 mb-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleOpenCategoryModal(cat)}
                          title="Edit Category"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={async () => {
                            if (window.confirm('Delete this category?')) {
                              await productAPI.deleteCategory(cat._id);
                              setLoadingCategories(true);
                              const res = await productAPI.getCategories();
                              setCategories(res.data);
                              setLoadingCategories(false);
                            }
                          }}
                          title="Delete Category"
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleOpenCategoryModal({ parentCategory: cat._id })}
                          title="Add Subcategory"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <button
                        className={`text-xs px-2 py-1 rounded ${selectedMainCat === cat._id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setSelectedMainCat(cat._id)}
                      >
                        {selectedMainCat === cat._id ? 'Viewing Subcategories' : 'View Subcategories'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right: Subcategories */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedMainCat ? `Subcategories of ${categories.find(cat => cat._id === selectedMainCat)?.name}` : 'Select a Main Category'}
                  </h3>
                  {selectedMainCat && (
                    <button
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                      onClick={() => setSelectedMainCat('')}
                    >
                      &larr; Back
                    </button>
                  )}
                </div>
                {selectedMainCat ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.filter(cat => cat.parentCategory === selectedMainCat).map(subcat => (
                      <div key={subcat._id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
                        {subcat.image && (
                          <img src={subcat.image} alt={subcat.name} className="w-14 h-14 object-contain rounded-full mb-2 border shadow" />
                        )}
                        <span className="font-semibold mb-1 text-center">{subcat.name}</span>
                        <span className="text-xs text-gray-500 mb-2 text-center">{subcat.productCount || 0} products</span>
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleOpenCategoryModal(subcat)}
                            title="Edit Subcategory"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={async () => {
                              if (window.confirm('Delete this subcategory?')) {
                                await productAPI.deleteCategory(subcat._id);
                                setLoadingCategories(true);
                                const res = await productAPI.getCategories();
                                setCategories(res.data);
                                setLoadingCategories(false);
                              }
                            }}
                            title="Delete Subcategory"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                    {categories.filter(cat => cat.parentCategory === selectedMainCat).length === 0 && <span className="text-gray-400">No subcategories found.</span>}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center mt-8">Select a main category to view subcategories.</div>
                )}
              </div>
              {/* Category Modal (Add/Edit) with Material UI */}
              {categoryModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <Card sx={{ minWidth: 340, maxWidth: 480, width: '100%', borderRadius: 2, boxShadow: 6, position: 'relative' }}>
                    <CardContent>
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setCategoryModal({ open: false, category: null })} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', right: 12, top: 8, position: 'absolute' }}>&times;</button>
                      <Typography variant="h6" fontWeight={700} mb={2} textAlign="center">
                        {categoryModal.category && categoryModal.category._id ? 'Edit Category' : categoryModal.category && categoryModal.category.parentCategory ? 'Add Subcategory' : 'Add Main Category'}
                      </Typography>
                      <Box component="form" onSubmit={handleCategoryFormSubmit} sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Name"
                              name="name"
                              value={categoryForm.name}
                              onChange={handleCategoryFormChange}
                              fullWidth
                              required
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Slug"
                              name="slug"
                              value={categoryForm.slug}
                              onChange={handleCategoryFormChange}
                              fullWidth
                              required
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="Description"
                              name="description"
                              value={categoryForm.description}
                              onChange={handleCategoryFormChange}
                              fullWidth
                              multiline
                              minRows={2}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <MUIButton
                              variant="outlined"
                              component="label"
                              fullWidth
                              sx={{ height: 40 }}
                            >
                              Upload Image
                              <input type="file" name="image" accept="image/*" hidden onChange={handleCategoryFormChange} />
                            </MUIButton>
                            {(categoryForm.image && typeof categoryForm.image === 'object') ? (
                              <img src={URL.createObjectURL(categoryForm.image)} alt="Preview" style={{ marginTop: 8, width: 60, height: 48, objectFit: 'contain', borderRadius: 6, border: '1px solid #eee' }} />
                            ) : (categoryForm.image && typeof categoryForm.image === 'string' && categoryForm.image.startsWith('http')) ? (
                              <img src={categoryForm.image} alt="Preview" style={{ marginTop: 8, width: 60, height: 48, objectFit: 'contain', borderRadius: 6, border: '1px solid #eee' }} />
                            ) : null}
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel id="parent-category-label">Parent Category</InputLabel>
                              <MUISelect
                                labelId="parent-category-label"
                                name="parentCategory"
                                value={categoryForm.parentCategory || ''}
                                label="Parent Category"
                                onChange={handleCategoryFormChange}
                              >
                                <MenuItem value="">None (Main Category)</MenuItem>
                                {categories.filter(cat => !cat.parentCategory).map((cat) => (
                                  <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                ))}
                              </MUISelect>
                              <Typography variant="caption" color="text.secondary" mt={0.5}>
                                {categoryForm.parentCategory ? 'This will be a subcategory.' : 'This will be a main category.'}
                              </Typography>
                            </FormControl>
                          </Grid>
                        </Grid>
                        {categoryError && <Typography color="error" mt={2}>{categoryError}</Typography>}
                        <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
                          <MUIButton onClick={() => setCategoryModal({ open: false, category: null })} variant="outlined" color="secondary">Cancel</MUIButton>
                          <MUIButton type="submit" variant="contained" color="primary">Save</MUIButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Event Banner Tab */}
          {activeTab === 'eventBanner' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Event Banner Management</h3>
              <form onSubmit={handleEventFormSubmit} className="space-y-4 max-w-xl w-full">
                <div>
                  <label className="block font-medium mb-1">Event Title</label>
                  <input type="text" name="title" className="form-input w-full" value={eventForm.title} onChange={handleEventFormChange} required />
                </div>
                <div>
                  <label className="block font-medium mb-1">Event Description</label>
                  <textarea name="description" className="form-input w-full" value={eventForm.description} onChange={handleEventFormChange} required />
                </div>
                <div>
                  <label className="block font-medium mb-1">Event End Date/Time</label>
                  <input type="datetime-local" name="endDate" className="form-input w-full" value={eventForm.endDate} onChange={handleEventFormChange} required />
                </div>
                <div>
                  <label className="block font-medium mb-1">Select Product for Banner</label>
                  <select name="product" className="form-input w-full" value={eventForm.product} onChange={handleEventFormChange} required>
                    <option value="">Select a product</option>
                    {products.filter(p => p.isApproved).map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                {eventError && <div className="text-red-500">{eventError}</div>}
                <button type="submit" className="btn-primary" disabled={eventLoading}>{eventLoading ? 'Saving...' : 'Save Event Banner'}</button>
              </form>
              {eventBanner && (
                <div className="mt-8 p-4 bg-gray-50 rounded shadow w-full overflow-x-auto">
                  <h4 className="font-bold mb-2">Current Event Banner</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <div><span className="font-semibold">Title:</span> {eventBanner.title}</div>
                      <div><span className="font-semibold">Description:</span> {eventBanner.description}</div>
                      <div><span className="font-semibold">End:</span> {new Date(eventBanner.endDate).toLocaleString()}</div>
                      <div><span className="font-semibold">Product:</span> {eventBanner.product?.name}</div>
                    </div>
                    <div className="flex justify-center md:justify-end">
                      {eventBanner.product?.images && eventBanner.product.images[0]?.url && (
                        <img src={eventBanner.product.images[0].url} alt={eventBanner.product.name} className="w-32 h-24 object-contain rounded shadow" />
                      )}
                    </div>
                  </div>
                  <button
                    className="mt-6 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold shadow"
                    onClick={handleDeleteEventBanner}
                    disabled={eventLoading}
                  >
                    Delete Event Banner
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {addProductModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                <p className="text-sm text-gray-600 mt-1">Create a new product for the marketplace</p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setAddProductModal({ open: false })}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Display */}
            {addProductError && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{addProductError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                      value={addProductForm.name || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter brand name"
                      value={addProductForm.brand || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter SKU"
                      value={addProductForm.sku || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief product description"
                      value={addProductForm.description || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, description: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed product description..."
                  value={addProductForm.productDescription || ''}
                  onChange={e => setAddProductForm({ ...addProductForm, productDescription: e.target.value })}
                  required
                />
              </div>

              {/* Pricing & Stock */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      value={addProductForm.price || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compare Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Original price for discount"
                      value={addProductForm.comparePrice || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, comparePrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={addProductForm.stock || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, stock: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Category *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={addProductForm.category || ''}
                    onChange={e => setAddProductForm({ ...addProductForm, category: e.target.value, subCategory: '' })}
                      required
                  >
                      <option value="">Select main category</option>
                    {categories.filter(cat => !cat.parentCategory).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={addProductForm.subCategory || ''}
                    onChange={e => setAddProductForm({ ...addProductForm, subCategory: e.target.value })}
                    disabled={!addProductForm.category}
                      required
                  >
                      <option value="">Select subcategory</option>
                    {categories.filter(cat => cat.parentCategory === addProductForm.category).map(subcat => (
                      <option key={subcat._id} value={subcat._id}>{subcat.name}</option>
                    ))}
                    </select>
          </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                      if (files.length > 0) {
                        setAddProductForm({ ...addProductForm, imageFiles: files });
                      }
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="product-images"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setAddProductForm({ ...addProductForm, imageFiles: files });
                      }}
                    />
                    <label htmlFor="product-images" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Click to upload
                        </span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB each (max 5 images)</p>
                    </label>
                  </div>
                  
                  {/* Preview uploaded images */}
                  {addProductForm.imageFiles && addProductForm.imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {addProductForm.imageFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = addProductForm.imageFiles.filter((_, i) => i !== index);
                              setAddProductForm({ ...addProductForm, imageFiles: newFiles });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          {index === 0 && (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Features (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Feature 1, Feature 2, Feature 3"
                      value={addProductForm.features || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, features: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tag1, tag2, tag3"
                      value={addProductForm.tags || ''}
                      onChange={e => setAddProductForm({ ...addProductForm, tags: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                {actionLoading === 'addProduct' && imageUploadProgress > 0 && (
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading images...</span>
                      <span>{imageUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${imageUploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAddProductModal({ open: false })}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={actionLoading === 'addProduct'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'addProduct'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {actionLoading === 'addProduct' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Product...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setEditModal({ open: false, product: null })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            {editError && <div className="text-red-500 mb-2">{editError}</div>}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="text" className="form-input" placeholder="Product Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              <textarea className="form-input" placeholder="Description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} required />
              <input type="number" className="form-input" placeholder="Price" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} required min="0" />
              <input type="number" className="form-input" placeholder="Stock" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} required min="0" />
              <input type="text" className="form-input" placeholder="Brand" value={editForm.brand} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} required />
              <input type="text" className="form-input" placeholder="SKU" value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} required />
              <div className="flex gap-2">
                <select
                  className="form-input"
                  value={editForm.category || ''}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value, subCategory: '' })}
                  required
                >
                  <option value="">Select Main Category</option>
                  {categories.filter(cat => !cat.parentCategory).map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <select
                  className="form-input"
                  value={editForm.subCategory || ''}
                  onChange={e => setEditForm({ ...editForm, subCategory: e.target.value })}
                  required
                  disabled={!editForm.category}
                >
                  <option value="">Select Subcategory</option>
                  {categories.filter(cat => cat.parentCategory === editForm.category).map(subcat => (
                    <option key={subcat._id} value={subcat._id}>{subcat.name}</option>
                  ))}
                </select>
              </div>
              <input type="text" className="form-input" placeholder="Image URL" value={editForm.images && editForm.images[0] ? editForm.images[0].url : ''} onChange={e => setEditForm({ ...editForm, images: [{ url: e.target.value }] })} required />
              <button type="submit" className="btn-primary w-full">Update Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Reject Product Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setRejectModal({ open: false, product: null })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Reject Product</h2>
            <form onSubmit={e => { e.preventDefault(); handleReject(rejectModal.product._id, rejectReason); }} className="space-y-4">
              <textarea className="form-input" placeholder="Rejection Reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} required />
              <button type="submit" className="btn-primary w-full">Reject</button>
            </form>
          </div>
        </div>
      )}

      {/* Responsive fix for tab navigation */}
      <style>{`
        @media (max-width: 768px) {
          .admin-tabs {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .admin-tabs button {
            flex: 1 1 45%;
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard; 