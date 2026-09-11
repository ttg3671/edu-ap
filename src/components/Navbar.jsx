import { useState } from 'react';
import { FaDumbbell, FaBars, FaTimes, FaChevronDown, FaChevronUp, FaSignOutAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { logoutUser as logoutUserAction } from '../redux/user/user.actions';
import axiosInstance from '../api/axios';

function Navbar({ dispatchLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.get('/api/v1/logout/admin', {                                                             
        headers: {},                                                                                          
        withCredentials: true  
      })

      // console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API fails
    } finally {
      // Clear Redux state
      dispatchLogout();

      // Close sidebar
      if (isSidebarOpen) toggleSidebar();

      // Navigate to login page
      navigate('/', { replace: true });
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/home' },
    { name: 'Top Navigation Menu', path: '/nav-pills' },
    { name: 'Collections', path: '/collections' },
    { name: 'Category Groups', path: '/category-groups' },
    { 
      name: 'Mappings', 
      items: [
        { label: 'Nav Pill -> Collections', path: '/nav-pill-collections' },
        { label: 'Collection -> Modules', path: '/collection-modules' },
        { label: 'Home Page Config', path: '/home-page-setup' }
      ] 
    },
    { name: 'Modules', path: '/modules/view-all' },
    { name: 'Users', path: '/users/view-all' },
    { name: 'Plans', path: '/plans/view-all' },
    { name: 'Notifications', path: '/notifications' }
    // { 
    //   name: 'Content', 
    //   items: [
    //     { label: 'Modules', path: '/modules/view-all' },
    //     { label: 'Users', path: '/users/view-all' },
    //     { label: 'Plans', path: '/plans/view-all' }
    //   ] 
    // }
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-emerald-600 text-white shadow-lg z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/home" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <FaDumbbell className="text-2xl mr-2" />
              <span className="text-xl font-bold">Fitness Admin</span>
            </Link>

            {/* Hamburger Icon */}
            <button
              onClick={toggleSidebar}
              className="text-white hover:text-emerald-200 transition-colors p-2 cursor-pointer"
              aria-label="Toggle menu"
            >
              <FaBars className="text-2xl" />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 cursor-pointer"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Left Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FaDumbbell className="text-2xl mr-2" />
            <span className="text-xl font-bold">Menu</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-emerald-200 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
          <nav className="space-y-2">
            {menuItems.map((menu) => (
              <div key={menu.name} className="border-b border-gray-200 pb-2">
                {menu.path ? (
                  /* Direct Link */
                  <Link
                    to={menu.path}
                    className="w-full flex items-center px-4 py-3 text-black hover:bg-emerald-50 rounded-lg transition-colors font-semibold cursor-pointer"
                    onClick={toggleSidebar}
                  >
                    <span>{menu.name}</span>
                  </Link>
                ) : (
                  /* Dropdown Menu */
                  <>
                    <button
                      onClick={() => toggleDropdown(menu.name)}
                      className="w-full flex items-center justify-between px-4 py-3 text-black hover:bg-emerald-50 rounded-lg transition-colors font-semibold cursor-pointer"
                    >
                      <span>{menu.name}</span>
                      {openDropdown === menu.name ? (
                        <FaChevronUp className="text-emerald-600" />
                      ) : (
                        <FaChevronDown className="text-gray-400" />
                      )}
                    </button>

                    {/* Dropdown Items */}
                    {openDropdown === menu.name && menu.items && (
                      <div className="mt-1 ml-4 space-y-1">
                        {menu.items.map((item) => (
                          <Link
                            key={item.label}
                            to={item.path}
                            className="block px-4 py-2 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            onClick={toggleSidebar}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-start px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold mt-4 cursor-pointer"
            >
              <FaSignOutAlt className="mr-2" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

const mapDispatchToProps = (dispatch) => ({
  dispatchLogout: () => dispatch(logoutUserAction())
});

export default connect(null, mapDispatchToProps)(Navbar);
