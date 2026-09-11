import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';

const ProtectedRoute = ({ currentUser, children }) => {
  if (!currentUser) {
    // User is not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the children components
  return children;
};

const mapStateToProps = (state) => ({
  currentUser: state.user.currentUser
});

export default connect(mapStateToProps)(ProtectedRoute);
