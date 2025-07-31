import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaStore } from 'react-icons/fa';
import { login, register, registerSeller, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const Login = () => {
  // Form type state: 'login', 'register', 'seller'
  const [formType, setFormType] = useState('login');
  
  // Form data states
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [sellerData, setSellerData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [timeoutError, setTimeoutError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // Parse redirect param from query string
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect');
  const from = redirect || location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      // Show success message based on form type
      if (formType === 'login') {
        toast.success('Login successful!');
      } else if (formType === 'register') {
        toast.success('Registration successful!');
      } else if (formType === 'seller') {
        toast.success('Seller registration submitted! You can use the website as a regular user while waiting for admin approval.');
      }
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, formType]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setTimeoutError('Request is taking too long. Please try again.');
      }, 10000);
    } else {
      setTimeoutError('');
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const validateForm = (data, type) => {
    const newErrors = {};

    if (type === 'login') {
      if (!data.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(data.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!data.password) {
        newErrors.password = 'Password is required';
      } else if (data.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else if (type === 'register') {
      if (!data.name) {
        newErrors.name = 'Name is required';
      }

      if (!data.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(data.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!data.password) {
        newErrors.password = 'Password is required';
      } else if (data.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (data.password !== data.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (type === 'seller') {
      if (!data.name) {
        newErrors.name = 'Name is required';
      }

      if (!data.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(data.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!data.phone) {
        newErrors.phone = 'Phone number is required';
      }

      if (!data.password) {
        newErrors.password = 'Password is required';
      } else if (data.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (data.password !== data.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    
    if (formType === 'login') {
      setLoginData(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'register') {
      setRegisterData(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'seller') {
      setSellerData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let isValid = false;
    let data = {};

    if (formType === 'login') {
      isValid = validateForm(loginData, 'login');
      data = loginData;
    } else if (formType === 'register') {
      isValid = validateForm(registerData, 'register');
      data = registerData;
    } else if (formType === 'seller') {
      isValid = validateForm(sellerData, 'seller');
      data = sellerData;
    }

    if (isValid) {
      try {
        if (formType === 'login') {
          await dispatch(login(data)).unwrap();
          // Success toast will be handled by the component that uses this
        } else if (formType === 'register') {
          const { confirmPassword, ...registerPayload } = data;
          await dispatch(register(registerPayload)).unwrap();
          // Success toast will be handled by the component that uses this
        } else if (formType === 'seller') {
          const { confirmPassword, ...sellerPayload } = data;
          await dispatch(registerSeller(sellerPayload)).unwrap();
          // Success toast will be handled by the component that uses this
        }
      } catch (error) {
        // Error is already handled in useEffect for known errors
        if (!error || typeof error !== 'string') {
          toast.error('Network error. Please check your connection or try again later.');
        }
      }
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login coming soon!`);
  };

  const renderForm = () => {
    if (formType === 'login') {
      return (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={loginData.email}
              onChange={(e) => handleInputChange(e, 'login')}
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={loginData.password}
                onChange={(e) => handleInputChange(e, 'login')}
                className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-400" />
                ) : (
                  <FaEye className="text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      );
    } else if (formType === 'register') {
      return (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={registerData.name}
              onChange={(e) => handleInputChange(e, 'register')}
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={registerData.email}
              onChange={(e) => handleInputChange(e, 'register')}
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={registerData.password}
                onChange={(e) => handleInputChange(e, 'register')}
                className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Create a password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-400" />
                ) : (
                  <FaEye className="text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={registerData.confirmPassword}
                onChange={(e) => handleInputChange(e, 'register')}
                className={`form-input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="text-gray-400" />
                ) : (
                  <FaEye className="text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      );
    } else if (formType === 'seller') {
      return (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={sellerData.name}
              onChange={(e) => handleInputChange(e, 'seller')}
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={sellerData.email}
              onChange={(e) => handleInputChange(e, 'seller')}
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={sellerData.phone}
              onChange={(e) => handleInputChange(e, 'seller')}
              className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Business Name Field */}
          <div>
            <label htmlFor="businessName" className="form-label">
              Business Name (Optional)
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              value={sellerData.businessName}
              onChange={(e) => handleInputChange(e, 'seller')}
              className="form-input"
              placeholder="Enter your business name"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={sellerData.password}
                onChange={(e) => handleInputChange(e, 'seller')}
                className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Create a password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-400" />
                ) : (
                  <FaEye className="text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={sellerData.confirmPassword}
                onChange={(e) => handleInputChange(e, 'seller')}
                className={`form-input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="text-gray-400" />
                ) : (
                  <FaEye className="text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <FaStore className="text-blue-600 mt-1 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Seller Registration</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your application will be reviewed by our admin team. You can use the website as a regular user while waiting for approval.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Submitting application...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FaStore className="mr-2" />
                  Submit Seller Application
                </div>
              )}
            </button>
          </div>
        </form>
      );
    }
  };

  const getFormTitle = () => {
    switch (formType) {
      case 'login':
        return 'Welcome back';
      case 'register':
        return 'Create your account';
      case 'seller':
        return 'Become a Seller';
      default:
        return 'Welcome back';
    }
  };

  const getFormSubtitle = () => {
    switch (formType) {
      case 'login':
        return "Don't have an account?";
      case 'register':
        return 'Already have an account?';
      case 'seller':
        return 'Want to sell on our platform?';
      default:
        return "Don't have an account?";
    }
  };

  const getFormLink = () => {
    switch (formType) {
      case 'login':
        return { text: 'Sign up here', action: () => setFormType('register') };
      case 'register':
        return { text: 'Sign in here', action: () => setFormType('login') };
      case 'seller':
        return { text: 'Sign in here', action: () => setFormType('login') };
      default:
        return { text: 'Sign up here', action: () => setFormType('register') };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{getFormTitle()}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {getFormSubtitle()}{' '}
            <button
              type="button"
              onClick={getFormLink().action}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {getFormLink().text}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Form Type Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setFormType('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formType === 'login'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setFormType('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formType === 'register'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setFormType('seller')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formType === 'seller'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaStore className="inline mr-1" />
              Seller
            </button>
          </div>

          {/* Form Content */}
          {renderForm()}

          {/* Social Login (only for login form) */}
          {formType === 'login' && (
            <>
              {/* Divider */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <FaGoogle className="text-red-500" />
                    <span className="ml-2">Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Facebook')}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <FaFacebook className="text-blue-600" />
                    <span className="ml-2">Facebook</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Error Display */}
          {(error || timeoutError) && (
            <div className="mt-4 text-red-600 text-center text-sm">{error || timeoutError}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 