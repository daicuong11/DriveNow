import { ConfigProvider, App as AntApp } from "antd";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { themeConfig } from "./config/theme";
import AppLayout from "./components/layout/AppLayout";
import AuthInitializer from "./components/auth/AuthInitializer";
import { usePermissionHub } from "./hooks/usePermissionHub";
import { useUserHub } from "./hooks/useUserHub";

function AppContent() {
  // Initialize Permission Hub for real-time permission updates
  usePermissionHub();
  // Initialize User Hub for real-time user status updates (lock/unlock)
  useUserHub();

  return (
    <>
      <AppLayout />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <BrowserRouter>
          <AuthInitializer>
            <AppContent />
          </AuthInitializer>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

