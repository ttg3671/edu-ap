import Navbar from '../components/Navbar';
import { FaUsers, FaDumbbell, FaLayerGroup, FaThList, FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Main Content - Add padding top to account for fixed navbar */}
      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="py-8">
            <h1 className="text-4xl font-bold text-black mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 text-lg">Quick access to manage your app content.</p>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Nav Pills Card */}
            <Link to="/nav-pills" className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Navigation</p>
                  <h3 className="text-xl font-bold text-black">Top Menu Buttons</h3>
                </div>
                <div className="bg-emerald-600 p-3 rounded-full">
                  <FaThList className="text-2xl text-white" />
                </div>
              </div>
              <p className="text-emerald-600 text-sm mt-2 font-medium">Configure top bar icons &rarr;</p>
            </Link>

            {/* Collections Card */}
            <Link to="/collections" className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Grouping</p>
                  <h3 className="text-xl font-bold text-black">Content Collections</h3>
                </div>
                <div className="bg-blue-600 p-3 rounded-full">
                  <FaLayerGroup className="text-2xl text-white" />
                </div>
              </div>
              <p className="text-blue-600 text-sm mt-2 font-medium">Manage groups & carousels &rarr;</p>
            </Link>

            {/* Workouts Card */}
            <Link to="/modules/view-all" className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Library</p>
                  <h3 className="text-xl font-bold text-black">Workouts & Programs</h3>
                </div>
                <div className="bg-purple-600 p-3 rounded-full">
                  <FaDumbbell className="text-2xl text-white" />
                </div>
              </div>
              <p className="text-purple-600 text-sm mt-2 font-medium">Edit exercise content &rarr;</p>
            </Link>

            {/* Users Card */}
            <Link to="/users/view-all" className="bg-orange-50 border border-orange-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Community</p>
                  <h3 className="text-xl font-bold text-black">Active Members</h3>
                </div>
                <div className="bg-orange-600 p-3 rounded-full">
                  <FaUsers className="text-2xl text-white" />
                </div>
              </div>
              <p className="text-orange-600 text-sm mt-2 font-medium">View user subscriptions &rarr;</p>
            </Link>

            {/* Notifications Card */}
            <Link to="/notifications" className="bg-rose-50 border border-rose-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Broadcast</p>
                  <h3 className="text-xl font-bold text-black">Notifications</h3>
                </div>
                <div className="bg-rose-600 p-3 rounded-full">
                  <FaBell className="text-2xl text-white" />
                </div>
              </div>
              <p className="text-rose-600 text-sm mt-2 font-medium">Send push alerts &rarr;</p>
            </Link>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Quick Setup Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <span className="inline-block w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full text-center leading-8 font-bold mb-3">1</span>
                <h4 className="font-bold mb-2">Setup Menu</h4>
                <p className="text-gray-600 text-sm">Create "Top Menu Buttons" like 'Workouts' or 'Nutrition'.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <span className="inline-block w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-center leading-8 font-bold mb-3">2</span>
                <h4 className="font-bold mb-2">Create Collections</h4>
                <p className="text-gray-600 text-sm">Create collections like 'Newest Releases' or 'Leg Day'.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <span className="inline-block w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-center leading-8 font-bold mb-3">3</span>
                <h4 className="font-bold mb-2">Map Content</h4>
                <p className="text-gray-600 text-sm">Use 'Content Mapping' to decide which collection appears under which menu button.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
