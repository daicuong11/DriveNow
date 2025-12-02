import { ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import { themeConfig } from "./config/theme";
import AppLayout from "./components/layout/AppLayout";

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

