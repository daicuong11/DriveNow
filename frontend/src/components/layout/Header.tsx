import { Layout, Dropdown, Avatar, Space } from "antd";
import { UserOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api/auth.service";

const { Header: AntHeader } = Layout;

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const items: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = async ({ key }) => {
    if (key === "logout") {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          await authService.logout(refreshToken);
        }
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        dispatch(logout());
        navigate("/login");
      }
    }
  };

  return (
    <AntHeader
      className="custom-header"
      style={{
        padding: "0 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 64
      }}
    >
      <div className="custom-header-title">
        Ứng dụng Quản lý Cho thuê Xe hơi
      </div>
      <Space>
        <Dropdown
          menu={{ items, onClick: handleMenuClick }}
          placement="bottomRight"
          overlayClassName="custom-dropdown-menu"
        >
          <Space className="custom-user-dropdown" style={{ cursor: "pointer" }} size="small">
            <Avatar className="custom-user-avatar" icon={<UserOutlined />} size={32} />
            <span className="custom-user-name">{user?.fullName || user?.username || "User"}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;

