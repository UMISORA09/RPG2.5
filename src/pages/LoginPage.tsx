import React, { useState } from 'react'

export interface LoginPageProps {
  onLogin: (credentials: { usernameOrEmail: string; password: string }) => { success: boolean; error?: string; user?: any }
  onGuestLogin: () => void
  onNavigate: (page: 'home' | 'register') => void
  onClose: () => void
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onGuestLogin,
  onNavigate,
  onClose,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFillDemo = () => {
    setUsernameOrEmail('XuanHoa')
    setPassword('pass1234')
    setErrorMessage('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Vui lòng nhập tên phi công hoặc email')
      return
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu')
      return
    }

    const res = onLogin({ usernameOrEmail, password })
    if (!res.success) {
      setErrorMessage(res.error || 'Đăng nhập không thành công')
    }
  }

  return (
    <div className="page-container light-sweep-effect">
      {/* Nút quay lại trang chủ */}
      <button
        type="button"
        className="page-close-button"
        onClick={onClose}
        title="Quay lại Trang chủ"
      >
        ✕
      </button>

      {/* Header trang Đăng nhập */}
      <div className="page-header">
        <div className="brand-pill">
          <span className="brick-icon" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <span>BRICKLAND AUTHENTICATION</span>
        </div>
        <h2 className="page-title" style={{ fontSize: '26px' }}>
          ĐĂNG NHẬP PHI CÔNG
          <span>BƯỚC VÀO BUỒNG LÁI TÍ HON</span>
        </h2>
        <p className="page-subtitle">
          Nhập tài khoản để tiếp tục lưu giữ hành trình và kỷ lục bay qua các miền sinh thái.
        </p>
      </div>

      {/* Banner tài khoản mẫu nhanh */}
      <div className="demo-account-banner" style={{ marginBottom: '14px' }}>
        <span>💡 Tài khoản mẫu sẵn có: <b>XuanHoa</b> (MK: <b>pass1234</b>)</span>
        <button
          type="button"
          className="quick-fill-btn"
          onClick={handleFillDemo}
        >
          Điền mẫu
        </button>
      </div>

      {/* Banner báo lỗi */}
      {errorMessage && (
        <div className="motion-error-alert" style={{ marginBottom: '14px' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Form Đăng nhập */}
      <form className="auth-motion-form" onSubmit={handleSubmit}>
        <div className="form-field-group">
          <label htmlFor="login-username-input">
            Tên phi công hoặc Email <span className="required-star">*</span>
          </label>
          <div className="neon-input-wrapper">
            <input
              id="login-username-input"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên phi công hoặc email..."
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field-group">
          <label htmlFor="login-password-input">
            Mật khẩu <span className="required-star">*</span>
          </label>
          <div className="neon-input-wrapper">
            <input
              id="login-password-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu của bạn..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="pwd-toggle-action"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" className="neon-submit-button">
          <span>Đăng nhập cất cánh ngay ➔</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', color: '#6e9680', fontSize: '9.5px', fontWeight: 700, letterSpacing: '1px' }}>
          <span style={{ flex: 1, borderBottom: '1px solid #dbeef1' }} />
          <span style={{ padding: '0 10px' }}>HOẶC TRẢI NGHIỆM</span>
          <span style={{ flex: 1, borderBottom: '1px solid #dbeef1' }} />
        </div>

        <button
          type="button"
          className="motion-secondary-btn"
          style={{ padding: '11px', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
          onClick={onGuestLogin}
        >
          <span>🚀 Chơi ngay với tư cách Khách</span>
        </button>

        <div className="auth-nav-line">
          Chưa có tài khoản?
          <button
            type="button"
            className="auth-nav-link-btn"
            onClick={() => onNavigate('register')}
          >
            Đăng ký mới tại đây ➔
          </button>
        </div>
      </form>
    </div>
  )
}
export default LoginPage
