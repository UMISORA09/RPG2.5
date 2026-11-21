import React from 'react'

export interface UserStats {
  totalFlights: number
  biomesDiscovered: string[]
}

export interface UserProfile {
  id: string
  username: string
  email?: string
  avatar: string
  isGuest?: boolean
  stats?: UserStats
}

export interface HomePageProps {
  user: UserProfile | null
  hasStartedOnce: boolean
  audioMuted: boolean
  onStartGame: () => void
  onNavigate: (page: 'login' | 'register') => void
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

export const HomePage: React.FC<HomePageProps> = ({
  user,
  hasStartedOnce,
  audioMuted,
  onStartGame,
  onNavigate,
  onToggleAudio,
  onOpenHelp,
  onResetWorld,
  onLogout,
  onGuestLogin,
}) => {
  const flights = user?.stats?.totalFlights ?? 0
  const discovered = user?.stats?.biomesDiscovered ?? []
  const rank = flights >= 10 ? 'Cơ trưởng Vàng 🌟' : flights >= 3 ? 'Phi công Bạc ⭐' : 'Phi công Tập sự'

  return (
    <div className="page-container light-sweep-effect">
      {/* Header & Logo Thương hiệu */}
      <div className="page-header">
        <div className="brand-pill">
          <span className="brick-icon" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <span>THẾ GIỚI LEGO 3D · PHIÊU LƯU TÍ HON</span>
        </div>
        <h1 className="page-title">
          BRICKLAND
          <span>KHÁM PHÁ VÙNG ĐẤT LEGO</span>
        </h1>
        <p className="page-subtitle">
          Lướt nhẹ trên đôi cánh máy bay tí hon qua những cánh rừng rực rỡ, dòng sông ngọc bích và đồi cát kỳ vĩ được ghép từ hàng vạn viên gạch lego.
        </p>
      </div>

      {/* Thẻ Phi công / Đăng nhập Spotlight */}
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

      {/* Các nút tùy chọn phụ */}
      <div className="secondary-btn-grid">
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

      {/* 7 Vùng sinh thái đặc sắc */}
      <div className="biomes-showcase">
        <div className="biomes-header-line">
          <span>7 MIỀN ĐẤT SINH THÁI ĐẶC SẮC</span>
          <span style={{ fontSize: '8.5px', color: '#688c79', fontWeight: 400 }}>Tự do khám phá không giới hạn</span>
        </div>
        <div className="biomes-flex-grid">
          {BIOMES_LIST.map((b) => {
            const isFound = discovered.includes(b.id)
            return (
              <span
                key={b.id}
                className={`biome-card-pill ${isFound ? 'is-discovered' : ''}`}
                title={isFound ? 'Đã khám phá!' : 'Chưa khám phá'}
              >
                {b.name}
              </span>
            )
          })}
        </div>
      </div>

      {/* Gợi ý điều khiển chân trang */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#557766', lineHeight: 1.5 }}>
        <span>💡 <b>Cách chơi:</b> Dùng phím <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: '#ffffff', border: '1px solid #cce3d4' }}>W</kbd><kbd style={{ padding: '1px 5px', borderRadius: '4px', background: '#ffffff', border: '1px solid #cce3d4' }}>A</kbd><kbd style={{ padding: '1px 5px', borderRadius: '4px', background: '#ffffff', border: '1px solid #cce3d4' }}>S</kbd><kbd style={{ padding: '1px 5px', borderRadius: '4px', background: '#ffffff', border: '1px solid #cce3d4' }}>D</kbd> để lái theo trực quan màn hình · Nhấn <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: '#ffffff', border: '1px solid #cce3d4' }}>Esc</kbd> để về lại Trang chủ</span>
      </div>
    </div>
  )
}
export default HomePage
