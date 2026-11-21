import React, { useState } from 'react'
import { DEFAULT_AVATARS } from '../auth/AuthManager.js'

export interface RegisterPageProps {
  onRegister: (data: { username: string; email: string; password: string; avatar: string }) => { success: boolean; error?: string; user?: any }
  onNavigate: (page: 'home' | 'login') => void
  onClose: () => void
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegister,
  onNavigate,
  onClose,
}) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]?.emoji || '👨‍✈️')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanUsername = username.trim()
    if (cleanUsername.length < 2) {
      setErrorMessage('Tên phi công phải có ít nhất 2 ký tự')
      return
    }
    if (cleanUsername.length > 20) {
      setErrorMessage('Tên phi công không được quá 20 ký tự')
      return
    }
    if (password.length < 4) {
      setErrorMessage('Mật khẩu phải có ít nhất 4 ký tự')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp!')
      return
    }

    const res = onRegister({
      username: cleanUsername,
      email: email.trim(),
      password,
      avatar: selectedAvatar,
    })

    if (!res.success) {
      setErrorMessage(res.error || 'Đăng ký không thành công')
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

      {/* Header trang Đăng ký */}
      <div className="page-header">
        <div className="brand-pill">
          <span className="brick-icon" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <span>BRICKLAND NEW PILOT</span>
        </div>
        <h2 className="page-title" style={{ fontSize: '26px' }}>
          ĐĂNG KÝ PHI CÔNG MỚI
          <span>GHI DANH TRÊN BẢNG VÀNG</span>
        </h2>
        <p className="page-subtitle">
          Khởi tạo thẻ phi công riêng để lưu trữ số chuyến bay và 7 miền đất sinh thái đã vượt qua.
        </p>
      </div>

      {/* Banner báo lỗi */}
      {errorMessage && (
        <div className="motion-error-alert" style={{ marginBottom: '14px' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Form Đăng ký */}
      <form className="auth-motion-form" onSubmit={handleSubmit}>
        <div className="form-field-group">
          <label htmlFor="reg-username-input">
            Tên phi công <span className="required-star">*</span>
          </label>
          <div className="neon-input-wrapper">
            <input
              id="reg-username-input"
              type="text"
              placeholder="Ví dụ: XuanHoa, CaptainLego..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={2}
              maxLength={20}
              required
            />
          </div>
        </div>

        <div className="form-field-group">
          <label htmlFor="reg-email-input">
            Email <small>(không bắt buộc, dùng để khôi phục)</small>
          </label>
          <div className="neon-input-wrapper">
            <input
              id="reg-email-input"
              type="email"
              placeholder="phi-cong@brickland.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-field-group">
          <label htmlFor="reg-password-input">
            Mật khẩu <span className="required-star">*</span>
          </label>
          <div className="neon-input-wrapper">
            <input
              id="reg-password-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tối thiểu 4 ký tự..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
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

        <div className="form-field-group">
          <label htmlFor="reg-confirm-password-input">
            Xác nhận mật khẩu <span className="required-star">*</span>
          </label>
          <div className="neon-input-wrapper">
            <input
              id="reg-confirm-password-input"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={4}
              required
            />
            <button
              type="button"
              className="pwd-toggle-action"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-field-group">
          <label>Chọn biểu tượng hình đại diện</label>
          <div className="avatar-selector-grid">
            {DEFAULT_AVATARS.map((av) => {
              const isSelected = selectedAvatar === av.emoji
              return (
                <button
                  key={av.id}
                  type="button"
                  className={`avatar-choice-btn ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setSelectedAvatar(av.emoji)}
                  title={av.label}
                >
                  <span className="emoji-icon">{av.emoji}</span>
                  <span className="avatar-name">{av.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <button type="submit" className="neon-submit-button">
          <span>Tạo tài khoản & Cất cánh ➔</span>
        </button>

        <div className="auth-nav-line">
          Đã có tài khoản?
          <button
            type="button"
            className="auth-nav-link-btn"
            onClick={() => onNavigate('login')}
          >
            Đăng nhập tại đây ➔
          </button>
        </div>
      </form>
    </div>
  )
}
export default RegisterPage
