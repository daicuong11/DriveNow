import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { restoreAuth } from "../../store/slices/authSlice";

/**
 * Component to initialize authentication state on app load
 * Checks for persisted tokens and restores auth state
 */
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Restore auth from persisted tokens
    dispatch(restoreAuth());
  }, [dispatch]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;

