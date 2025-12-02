import { ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { themeConfig } from "./config/theme";
import AppLayout from "./components/layout/AppLayout";
import AuthInitializer from "./components/auth/AuthInitializer";

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <AuthInitializer>
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
        </AuthInitializer>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

