import React from 'react'
import { UserProfile } from '../types.ts'

interface OverviewViewProps {
  user: UserProfile | null
  hasStartedOnce: boolean
  audioMuted: boolean
  onStartGame: () => void
  onNavigate: (page: 'login' | 'register') => void
  onSwitchTab: (tab: 'about' | 'modes' | 'preview3d' | 'contact') => void
  onToggleAudio: () => void
  onOpenHelp: () => void
  onResetWorld: () => void
  onLogout: () => void
  onGuestLogin: () => void
}

const BIOMES_LIST = [
  { id: 'forest', name: '🌲 Rừng xanh tươi' },
  { id: 'autumnForest', name: '🍂 Rừng thu vàng' },
  { id: 'meadow', name: '🌸 Đồng cỏ hoa' },
  { id: 'desert', name: '🏜️ Đồi cát vàng' },
  { id: 'volcano', name: '🌋 Thung lũng nham thạch' },
  { id: 'snowForest', name: '❄️ Rừng tuyết trắng' },
  { id: 'wetland', name: '🌿 Đất ngập nước' },
]

export const OverviewView: React.FC<OverviewViewProps> = ({
  user,
  hasStartedOnce,
  audioMuted,
  onStartGame,
  onNavigate,
  onSwitchTab,
  onToggleAudio,
  onOpenHelp,
  onResetWorld,
  onLogout,
}) => {
  const flights = user?.stats?.totalFlights ?? 0
  const discovered = user?.stats?.biomesDiscovered ?? []
  const rank = flights >= 10 ? 'Cơ trưởng Vàng 🌟' : flights >= 3 ? 'Phi công Bạc ⭐' : 'Phi công Tập sự'

  return (
    <div className="overview-view">
      {/* Thẻ Phi công Spotlight */}
      {user && !user.isGuest ? (
        <div className="profile-spotlight-card">
          <div className="profile-avatar-box">
            <span>{user.avatar || '👨‍✈️'}</span>
          </div>
          <div className="profile-meta">
            <div className="profile-header-row">
              <strong className="profile-pilot-name">{user.username}</strong>
              <span className="badge-official">Chính thức</span>
              <span className="badge-rank">{rank}</span>
            </div>
            <div className="profile-stats-row">
              <span>Chuyến bay: <b>{flights}</b></span>
              <span>·</span>
              <span>Đã khám phá: <b>{discovered.length}/7</b> vùng đất</span>
            </div>
          </div>
          <div className="profile-btn-group">
            <button
              type="button"
              className="motion-secondary-btn"
              onClick={() => onNavigate('login')}
              title="Đổi tài khoản phi công"
            >
              Đổi nick
            </button>
            <button
              type="button"
              className="motion-secondary-btn"
              style={{ color: '#dc2626' }}
              onClick={onLogout}
              title="Đăng xuất tài khoản"
            >
              Thoát
            </button>
          </div>
        </div>
      ) : user && user.isGuest ? (
        <div className="profile-spotlight-card">
          <div className="profile-avatar-box">
            <span>🧭</span>
          </div>
          <div className="profile-meta">
            <div className="profile-header-row">
              <strong className="profile-pilot-name">{user.username}</strong>
              <span className="badge-guest">Khách chơi</span>
            </div>
            <div className="profile-stats-row">
              <span>Chuyến bay: <b>{flights}</b></span>
              <span>·</span>
              <span>Đã khám phá: <b>{discovered.length}/7</b> vùng đất (Tạm thời)</span>
            </div>
          </div>
          <div className="profile-btn-group">
            <button
              type="button"
              className="motion-secondary-btn"
              style={{ background: '#ecfdf5', borderColor: '#10b981', color: '#047857' }}
              onClick={() => onNavigate('register')}
            >
              Đăng ký lưu
            </button>
            <button
              type="button"
              className="motion-secondary-btn"
              onClick={() => onNavigate('login')}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-spotlight-card">
          <div className="profile-avatar-box">
            <span>👤</span>
          </div>
          <div className="profile-meta">
            <div className="profile-header-row">
              <strong className="profile-pilot-name">Chưa đăng nhập</strong>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#4b6f5d' }}>
              Đăng nhập hoặc chơi thử ngay để lưu giữ hành trình bay và khám phá 7 kỳ quan Lego.
            </p>
          </div>
          <div className="profile-btn-group">
            <button
              type="button"
              className="motion-secondary-btn"
              style={{ background: '#15803d', color: '#ffffff', borderColor: '#166534' }}
              onClick={() => onNavigate('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className="motion-secondary-btn"
              style={{ background: '#2563eb', color: '#ffffff', borderColor: '#1d4ed8' }}
              onClick={() => onNavigate('register')}
            >
              Đăng ký
            </button>
          </div>
        </div>
      )}

      {/* Nút Khám phá chính với hiệu ứng Neon */}
      <button
        type="button"
        className="glow-action-button"
        onClick={onStartGame}
        aria-label={hasStartedOnce ? 'Tiếp tục bay' : 'Bắt đầu khám phá'}
      >
        <span className="btn-icon-aura">✈️</span>
        <span className="btn-copy">
          <strong>{hasStartedOnce ? 'Tiếp tục chuyến bay' : 'Bắt đầu cất cánh'}</strong>
          <small>{hasStartedOnce ? 'Quay lại vùng trời đang khám phá' : 'Nhấn để bay lượn trên bầu trời (Phím cách / Enter)'}</small>
        </span>
        <span className="btn-arrow-glow">→</span>
      </button>

      {/* Các nút tùy chọn phụ & điều hướng nhanh */}
      <div className="secondary-btn-grid">
        <button
          type="button"
          className="motion-secondary-btn highlight-accent"
          onClick={() => onSwitchTab('modes')}
        >
          <span>🎮 Chơi chế độ mở</span>
        </button>
        <button
          type="button"
          className="motion-secondary-btn highlight-accent"
          onClick={() => onSwitchTab('preview3d')}
        >
          <span>✈️ Xem mô hình 3D</span>
        </button>
        <button
          type="button"
          className="motion-secondary-btn"
          onClick={onOpenHelp}
        >
          <span>❓ Hướng dẫn lái</span>
        </button>
        <button
          type="button"
          className="motion-secondary-btn"
          onClick={onToggleAudio}
        >
          <span>{audioMuted ? '🔇 Bật âm thanh' : '🔊 Tắt âm thanh'}</span>
        </button>
        {hasStartedOnce && (
          <button
            type="button"
            className="motion-secondary-btn"
            onClick={onResetWorld}
            style={{ color: '#166534' }}
          >
            <span>🔄 Bay lại từ đầu</span>
          </button>
        )}
      </div>

      {/* 7 Vùng đất sinh thái */}
      <div className="biomes-showcase">
        <div className="biomes-header-line">
          <strong>7 MIỀN ĐẤT SINH THÁI ĐẶC SẮC</strong>
          <small>Tự do khám phá không giới hạn</small>
        </div>
        <div className="biomes-flex-grid">
          {BIOMES_LIST.map((b) => (
            <span key={b.id} className="biome-pill">
              {b.name}
            </span>
          ))}
        </div>
      </div>

      {/* Hướng dẫn phím nhanh */}
      <div className="quick-help-footer">
        <span>💡 <b>Cách chơi:</b> Dùng phím <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> để lái máy bay theo màn hình · Nhấn <kbd>Esc</kbd> để về lại Trang chủ</span>
      </div>
    </div>
  )
}
export default OverviewView
