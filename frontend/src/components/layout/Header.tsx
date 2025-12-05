import { useState } from "react";
import { Layout, Dropdown, Avatar, Space, Modal, Form, Input, message } from "antd";
import { UserOutlined, LogoutOutlined, SettingOutlined, LockOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api/auth.service";
import { showSuccess, showError } from "../../utils/notifications";
import { getErrorMessage } from "../../utils/errorHandler";

const { Password } = Input;

const { Header: AntHeader } = Layout;

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);

  const items: MenuProps["items"] = [
    {
      key: "changePassword",
      icon: <LockOutlined />,
      label: "Đổi mật khẩu",
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
    if (key === "changePassword") {
      setIsChangePasswordModalOpen(true);
    } else if (key === "logout") {
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

  const handleChangePassword = async () => {
    try {
      const values = await changePasswordForm.validateFields();
      setChangingPassword(true);
      await authService.changePassword(values.currentPassword, values.newPassword);
      showSuccess("Đổi mật khẩu thành công!");
      setIsChangePasswordModalOpen(false);
      changePasswordForm.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      showError(getErrorMessage(error, "Đổi mật khẩu thất bại. Vui lòng thử lại!"));
    } finally {
      setChangingPassword(false);
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

      <Modal
        title="Đổi mật khẩu"
        open={isChangePasswordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => {
          setIsChangePasswordModalOpen(false);
          changePasswordForm.resetFields();
        }}
        confirmLoading={changingPassword}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
      >
        <Form form={changePasswordForm} layout="vertical">
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
          >
            <Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: "Mật khẩu phải có chữ hoa, chữ thường và số",
              },
            ]}
          >
            <Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </AntHeader>
  );
};

export default Header;

