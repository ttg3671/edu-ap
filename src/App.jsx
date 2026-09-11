import { Routes, Route, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Login from './components/Login';
import Home from './pages/Home';
import NavPills from './pages/NavPills';
import CategoryGroups from './pages/CategoryGroups';
import CategoriesByGroup from './pages/CategoriesByGroup';
import Categories from './pages/Categories';
import Collections from './pages/Collections';
import NavPillCollections from './pages/NavPillCollections';
import CollectionModules from './pages/CollectionModules';
import HomePageConfig from './pages/HomePageConfig';
import Plans from './pages/Plans';
import Modules from './pages/Modules';
import Syllabus from './pages/Syllabus';
import Lessons from './pages/Lessons';
import UploadVideo from './pages/UploadVideo';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';

function App({ currentUser }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          currentUser ? <Navigate to="/home" replace /> : <Login />
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home-page-setup"
        element={
          <ProtectedRoute>
            <HomePageConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nav-pills"
        element={
          <ProtectedRoute>
            <NavPills />
          </ProtectedRoute>
        }
      />
      <Route
        path="/category-groups"
        element={
          <ProtectedRoute>
            <CategoryGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/category-groups/:groupId/categories"
        element={
          <ProtectedRoute>
            <CategoriesByGroup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/collections"
        element={
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nav-pill-collections"
        element={
          <ProtectedRoute>
            <NavPillCollections />
          </ProtectedRoute>
        }
      />
      <Route
        path="/collection-modules"
        element={
          <ProtectedRoute>
            <CollectionModules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans/view-all"
        element={
          <ProtectedRoute>
            <Plans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/modules"
        element={
          <ProtectedRoute>
            <Modules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/modules/view-all"
        element={
          <ProtectedRoute>
            <Modules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/modules/:moduleId/syllabus"
        element={
          <ProtectedRoute>
            <Syllabus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/modules/:moduleId/syllabus/:syllabusId/lessons"
        element={
          <ProtectedRoute>
            <Lessons />
          </ProtectedRoute>
        }
      />
      <Route
        path="/modules/:moduleId/lessons"
        element={
          <ProtectedRoute>
            <Lessons />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-video/:id"
        element={
          <ProtectedRoute>
            <UploadVideo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/view-all"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      {/* Add more protected routes here as needed */}
    </Routes>
  );
}

const mapStateToProps = (state) => ({
  currentUser: state.user.currentUser
});

export default connect(mapStateToProps)(App);
