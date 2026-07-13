import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectCurrentUser } from "../../features/auth/authSlice";

export const RoleProtectedRoute = ({ allowedRoles }) => {
  const user = useSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const hasRole = allowedRoles.includes(user.role);

  if (!hasRole) {
    // Redirect to default dashboard for user role if unauthorized
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === "organizer") {
      return <Navigate to="/organizer/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
