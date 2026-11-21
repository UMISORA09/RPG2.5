import React, { useState } from 'react'
import { HomeTab, UserProfile, OpenWorldOptions } from './types.ts'
import OverviewView from './views/OverviewView.tsx'
import AboutGameView from './views/AboutGameView.tsx'
import OpenWorldView from './views/OpenWorldView.tsx'
import MiniPreviewView from './views/MiniPreviewView.tsx'
import ContactView from './views/ContactView.tsx'

export interface HomePageProps {
  user: UserProfile | null
  hasStartedOnce: boolean
  audioMuted: boolean
  initialTab?: HomeTab
  selectedAircraftColor?: string
  experience?: any
  onStartGame: () => void
  onNavigate: (page: 'login' | 'register') => void
  onTabChange?: (tab: HomeTab) => void
  onLaunchOpenWorld?: (options: OpenWorldOptions) => void
  onAircraftColorChange?: (colorHex: string) => void
  onTakeoffWithColor?: (colorHex: string) => void
  onToggleAudio: () => void
  onOpenHelp: () => void
  onResetWorld: () => void
  onLogout: () => void
  onGuestLogin: () => void
}

const NAV_TABS = [
  { id: 'overview' as HomeTab, label: 'Tổng quan', icon: '🚀' },
  { id: 'about' as HomeTab, label: 'Giới thiệu game', icon: '📖' },
  { id: 'modes' as HomeTab, label: 'Chế độ chơi mở', icon: '🎮' },
  { id: 'preview3d' as HomeTab, label: 'Mô hình 3D', icon: '✈️' },
  { id: 'contact' as HomeTab, label: 'Liên hệ', icon: '📬' },
]

export const HomePage: React.FC<HomePageProps> = ({
  user,
  hasStartedOnce,
  audioMuted,
  initialTab = 'overview',
  selectedAircraftColor = '#f59e0b',
  experience,
  onStartGame,
  onNavigate,
  onTabChange,
  onLaunchOpenWorld,
  onAircraftColorChange,
  onTakeoffWithColor,
  onToggleAudio,
  onOpenHelp,
  onResetWorld,
  onLogout,
  onGuestLogin,
}) => {
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab)

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const handleTabSwitch = (tab: HomeTab) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const isWideLayout = activeTab !== 'overview'

  return (
    <div className={`page-container portal-container ${isWideLayout ? 'portal-wide' : 'portal-compact'} light-sweep-effect`}>
      {/* Thanh điều hướng Portal (Navbar 2 tầng sang trọng) */}
      <header className="portal-navbar">
        <div className="portal-navbar-top">
          {/* Logo & Tên game */}
          <div className="portal-logo" onClick={() => handleTabSwitch('overview')} role="button" tabIndex={0}>
            <div className="brick-logo-icon" aria-hidden="true">
              <span className="lego-dot yellow" />
              <span className="lego-dot red" />
              <span className="lego-dot blue" />
              <span className="lego-dot green" />
            </div>
            <div className="portal-logo-text">
              <strong>BRICKLAND</strong>
              <small>THẾ GIỚI LEGO 3D</small>
            </div>
          </div>

          {/* Góc phải: Nút cất cánh & hồ sơ nhanh */}
          <div className="portal-right-actions">
            {user ? (
              <div className="navbar-pilot-chip" onClick={() => handleTabSwitch('overview')} title="Xem hồ sơ phi công">
                <span className="pilot-chip-avatar">{user.avatar || '👨‍✈️'}</span>
                <span className="pilot-chip-name">{user.username}</span>
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <button
                  type="button"
                  className="navbar-login-btn"
                  onClick={() => onNavigate('login')}
                >
                  Đăng nhập
                </button>
              </div>
            )}

            <button
              type="button"
              className="navbar-quick-play-btn"
              onClick={onStartGame}
              title="Cất cánh bay ngay"
            >
              <span>✈️ Cất cánh</span>
            </button>
          </div>
        </div>

        {/* Danh sách tab route đầy đủ */}
        <nav className="portal-nav-tabs" aria-label="Điều hướng chính">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`portal-nav-btn ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => handleTabSwitch(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.id && <span className="tab-active-indicator" />}
            </button>
          ))}
        </nav>
      </header>

      {/* Nội dung tương ứng theo Tab */}
      <main className="portal-main-content">
        {activeTab === 'overview' && (
          <OverviewView
            user={user}
            hasStartedOnce={hasStartedOnce}
            audioMuted={audioMuted}
            onStartGame={onStartGame}
            onNavigate={onNavigate}
            onSwitchTab={handleTabSwitch}
            onToggleAudio={onToggleAudio}
            onOpenHelp={onOpenHelp}
            onResetWorld={onResetWorld}
            onLogout={onLogout}
            onGuestLogin={onGuestLogin}
          />
        )}

        {activeTab === 'about' && (
          <AboutGameView
            onStartGame={onStartGame}
            onSwitchTab={handleTabSwitch}
          />
        )}

        {activeTab === 'modes' && (
          <OpenWorldView
            onLaunchOpenWorld={(opts) => {
              if (onLaunchOpenWorld) {
                onLaunchOpenWorld(opts)
              } else {
                onStartGame()
              }
            }}
            onSwitchTab={handleTabSwitch}
          />
        )}

        {activeTab === 'preview3d' && (
          <MiniPreviewView
            experience={experience}
            selectedColor={selectedAircraftColor}
            onColorChange={(color) => onAircraftColorChange?.(color)}
            onTakeoffWithColor={(color) => {
              if (onTakeoffWithColor) {
                onTakeoffWithColor(color)
              } else {
                onStartGame()
              }
            }}
            onSwitchTab={handleTabSwitch}
          />
        )}

        {activeTab === 'contact' && (
          <ContactView
            onStartGame={onStartGame}
          />
        )}
      </main>
    </div>
  )
}
export default HomePage
