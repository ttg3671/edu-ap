import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaDumbbell, FaRunning, FaUsers, FaChartLine } from 'react-icons/fa';
import axiosInstance from '../api/axios';

import { connect } from "react-redux";

import { setCurrentUser } from "../redux/user/user.actions";

const Login = ({setCurrentUser}) => {
  	const navigate = useNavigate();
	
	const [ userInput, setUserInput ] = useState({
		email: '',
		password: ''
	})

	const [ inputError, setInputError ] = useState({
		email: false,
		password: false
	})

	const [ showPassword, setShowPassword ] = useState(false);
	const [ errMsg, setErrMsg ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);

	const handleEmailChange = (e) => {
		setUserInput((prevState) => {
			return {...prevState,
			email: e.target.value}
		})
		// Clear errors when user starts typing
		if (inputError.email) {
			setInputError(prev => ({...prev, email: false}));
		}
		if (errMsg) setErrMsg('');
	}

	const handlePasswordChange = (e) => {
		setUserInput((prevState) => {
			return {...prevState,
			password: e.target.value}
		})
		// Clear errors when user starts typing
		if (inputError.password) {
			setInputError(prev => ({...prev, password: false}));
		}
		if (errMsg) setErrMsg('');
	}

	const togglePasswordVisibility = () => {
		setShowPassword((prevState) => !prevState);
	}

	const handleSubmit = async (e) => {
		e.preventDefault();

    	if (!userInput.email || !userInput.password) {
    		setInputError((prevState) => {
	    		return {
	    			...prevState,
	    			email: userInput.email === '' ? true : false,
	    			password: userInput.password === '' ? true : false
	    		}
	    	});
    		return;
    	}

	    	try {
	    		setIsLoading(true);

				const response = await axiosInstance.post('/api/v1/auth/admin/signin',
	    			{
					    email: userInput.email+"@gmail.com",
					    password: userInput.password
					},
					{
					    headers: {
							'Content-Type': 'application/json',
					    },
					    withCredentials: true,
					}
	    		);

	    		// console.log(response.data);

	    		if (response.data && response.data?.isSuccess) {
	    			setUserInput({
	    				email: '',
	    				password: ''
	    			})

	    			setCurrentUser({
					  email: userInput.email,
					  token: response.data.token
					});

	    			// After login, navigate to the home page (Netflix-style)
	    			navigate('/home', { replace: true });
	    		}

	    		else {
	    			setErrMsg(response.data?.message);
	    			window.scrollTo({ top: 0, behavior: 'smooth' });
	    		}
	    	}

	    	catch (error) {
	    		window.scrollTo({ top: 0, behavior: 'smooth' });

	    		console.log(error);
	    		if (!error?.response) {
	    			setErrMsg("Failed to Login In. Try Again...");
	    		}
	    		else if (error.response?.status === 400 && !error.response.data?.isSuccess) {
	    			setErrMsg(error.response?.data.message);
	    		}

	    		else if (error.response?.status === 401 || error.response?.status === 404) {
	    			setErrMsg(error.response?.data.message);
	    		}

	    		else {
	    			setErrMsg("Login Failed...");
	    		}
	    	}

	    	finally {
				setIsLoading(false);
		    }
	}

  return (
    <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Left Side - Welcome Section */}
          <div className="md:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center">
              <div className="mb-8">
                <FaDumbbell className="text-7xl mb-4 mx-auto animate-bounce" />
              </div>

              <h1 className="text-5xl font-bold mb-4">Welcome Eduardo</h1>
              <p className="text-2xl text-emerald-100 mb-8">Admin Panel</p>

              <div className="w-24 h-1 bg-white/50 mx-auto mb-8"></div>

              <p className="text-emerald-50 text-lg mb-8 max-w-md">
                Manage your fitness platform with ease. Access workouts, members, and analytics all in one place.
              </p>

              {/* Feature icons */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 p-4 rounded-full mb-2">
                    <FaRunning className="text-2xl" />
                  </div>
                  <span className="text-sm text-emerald-100">Workouts</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 p-4 rounded-full mb-2">
                    <FaUsers className="text-2xl" />
                  </div>
                  <span className="text-sm text-emerald-100">Members</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 p-4 rounded-full mb-2">
                    <FaChartLine className="text-2xl" />
                  </div>
                  <span className="text-sm text-emerald-100">Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
            <div className="max-w-md mx-auto w-full">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
              <p className="text-gray-500 mb-8">Enter your credentials to access the admin panel</p>

              {errMsg && (
			            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
			              <div className="flex items-center">
			                <div className="flex-shrink-0">
			                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
			                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
			                  </svg>
			                </div>
			                <div className="ml-3">
			                  <p className="text-sm text-red-700 font-medium">{errMsg}</p>
			                </div>
			              </div>
			            </div>
			          )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
                    User
                  </label>
                  <input
                    type="text"
                    id="email"
                    value={userInput.email}
                    onChange={handleEmailChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      inputError.email ? 'border-red-500' : 'border-gray-300'
                    } text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors`}
                    placeholder="admin"
                    disabled={isLoading}
                  />
                  {inputError.email && (
                    <p className="text-red-500 text-xs mt-1">User is required</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={userInput.password}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        inputError.password ? 'border-red-500' : 'border-gray-300'
                      } text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors pr-12`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-600 focus:outline-none transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                  </div>
                  {inputError.password && (
                    <p className="text-red-500 text-xs mt-1">Password is required</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Logging in...' : 'Login to Dashboard'}
                </button>

                <div className="text-center mt-6">
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                    Forgot password?
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapDispatchToProps = dispatch => ({
	setCurrentUser: user => dispatch(setCurrentUser(user))
})

export default connect(null, mapDispatchToProps)(Login);