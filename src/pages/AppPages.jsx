import React, { useState, useEffect, useMemo, useCallback } from 'react'
import HomePage from './HomePage.tsx'
import LoginPage from './LoginPage.tsx'
import RegisterPage from './RegisterPage.tsx'
import AuthManager from '../auth/AuthManager.js'
import './pages.css'

export const AppPages = ({ experience, explorerUI }) => {
  const auth = useMemo(() => explorerUI?.auth || new AuthManager(), [explorerUI])
  const [currentUser, setCurrentUser] = useState(() => auth.getCurrentUser())
  const [activePage, setActivePage] = useState('home') // 'home' | 'login' | 'register'
  const [isVisible, setIsVisible] = useState(true)
  const [hasStartedOnce, setHasStartedOnce] = useState(false)
  const [audioMuted, setAudioMuted] = useState(() => Boolean(experience?.audio?.muted ?? true))

  // Sinh các hạt bụi ánh sáng ngẫu nhiên
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i * 4.3 + Math.random() * 3) % 98}%`,
      size: `${2 + (i % 4) * 1.5}px`,
      duration: `${7 + (i % 6) * 2}s`,
      delay: `${-(i * 0.8)}s`,
      opacity: 0.3 + (i % 5) * 0.15,
    }))
  }, [])

  // Đồng bộ trạng thái từ ExplorerUI
  const syncWithExplorer = useCallback(() => {
    setCurrentUser(auth.getCurrentUser())
    if (experience?.audio) {
      setAudioMuted(experience.audio.muted)
    }
  }, [auth, experience])

  useEffect(() => {
    syncWithExplorer()
  }, [syncWithExplorer])

  // Lắng nghe sự kiện từ bên ngoài thông qua window.__bricklandApp
  useEffect(() => {
    window.__bricklandApp = {
      openHome: () => {
        syncWithExplorer()
        setActivePage('home')
        setIsVisible(true)
      },
      openLogin: () => {
        syncWithExplorer()
        setActivePage('login')
        setIsVisible(true)
      },
      openRegister: () => {
        syncWithExplorer()
        setActivePage('register')
        setIsVisible(true)
      },
      hidePages: () => {
        setIsVisible(false)
      },
      syncUser: () => {
        syncWithExplorer()
      },
      setStartedOnce: (val) => {
        setHasStartedOnce(Boolean(val))
      },
    }

    return () => {
      delete window.__bricklandApp
    }
  }, [syncWithExplorer])

  // Bắt đầu cất cánh vào game
  const handleStartGame = useCallback(() => {
    const user = auth.getCurrentUser()
    if (!user) {
      setActivePage('login')
      explorerUI?.toast?.('Vui lòng đăng nhập hoặc chọn Khách để tham gia trò chơi!')
      return
    }

    experience?.audio?.play?.('resume')
    setIsVisible(false)
    setHasStartedOnce(true)
    if (explorerUI) {
      explorerUI.setHomeScreen(false)
    }
  }, [auth, experience, explorerUI])

  // Xử lý đăng nhập
  const handleLogin = useCallback((credentials) => {
    const res = auth.login(credentials)
    if (res.success) {
      setCurrentUser(res.user)
      explorerUI?.syncUserBadge?.()
      handleStartGame()
      explorerUI?.toast?.(`Chào mừng phi công ${res.user.username} đã cất cánh!`)
    }
    return res
  }, [auth, explorerUI, handleStartGame])

  // Xử lý đăng ký
  const handleRegister = useCallback((data) => {
    const res = auth.register(data)
    if (res.success) {
      setCurrentUser(res.user)
      explorerUI?.syncUserBadge?.()
      handleStartGame()
      explorerUI?.toast?.(`Tạo tài khoản thành công! Chúc ${res.user.username} bay vui vẻ!`)
    }
    return res
  }, [auth, explorerUI, handleStartGame])

  // Chơi chế độ khách
  const handleGuestLogin = useCallback(() => {
    const guestUser = auth.playAsGuest()
    setCurrentUser(guestUser)
    explorerUI?.syncUserBadge?.()
    handleStartGame()
    explorerUI?.toast?.('Cất cánh với tư cách Khách khám phá!')
  }, [auth, explorerUI, handleStartGame])

  // Đăng xuất
  const handleLogout = useCallback(() => {
    auth.logout()
    setCurrentUser(null)
    setHasStartedOnce(false)
    explorerUI?.syncUserBadge?.()
    explorerUI?.toast?.('Đã đăng xuất tài khoản thành công')
  }, [auth, explorerUI])

  // Bật/tắt âm thanh
  const handleToggleAudio = useCallback(() => {
    if (experience?.audio) {
      const nextMuted = !experience.audio.muted
      experience.audio.setMuted(nextMuted)
      setAudioMuted(nextMuted)
      explorerUI?.syncAudioControl?.()
      if (!nextMuted) experience.audio.play?.('click')
    }
  }, [experience, explorerUI])

  // Hướng dẫn
  const handleOpenHelp = useCallback(() => {
    explorerUI?.onAction?.('help')
  }, [explorerUI])

  // Bay lại từ đầu
  const handleResetWorld = useCallback(() => {
    explorerUI?.onAction?.('home-reset')
    setIsVisible(false)
  }, [explorerUI])

  // Lắng nghe phím Space / Enter trên Home để cất cánh
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isVisible || activePage !== 'home') return
      if (e.target?.closest?.('input, textarea, select')) return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        handleStartGame()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isVisible, activePage, handleStartGame])

  return (
    <div className={`brickland-app-overlay ${isVisible ? 'is-visible' : 'is-hidden'}`}>
      {/* Hiệu ứng tia sáng & luồng ánh sáng đa sắc */}
      <div className="brickland-backdrop-lights" aria-hidden="true">
        <div className="ambient-light-blob blob-1" />
        <div className="ambient-light-blob blob-2" />
        <div className="ambient-light-blob blob-3" />
        <div className="light-ray-cone" />
        <div className="light-particles-container">
          {particles.map((m) => (
            <span
              key={m.id}
              className="light-mote"
              style={{
                left: m.left,
                width: m.size,
                height: m.size,
                animationDuration: m.duration,
                animationDelay: m.delay,
                opacity: m.opacity,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hiển thị trang tương ứng (Home / Login / Register) */}
      {activePage === 'home' && (
        <HomePage
          user={currentUser}
          hasStartedOnce={hasStartedOnce}
          audioMuted={audioMuted}
          onStartGame={handleStartGame}
          onNavigate={(page) => setActivePage(page)}
          onToggleAudio={handleToggleAudio}
          onOpenHelp={handleOpenHelp}
          onResetWorld={handleResetWorld}
          onLogout={handleLogout}
          onGuestLogin={handleGuestLogin}
        />
      )}

      {activePage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onGuestLogin={handleGuestLogin}
          onNavigate={(page) => setActivePage(page)}
          onClose={() => setActivePage('home')}
        />
      )}

      {activePage === 'register' && (
        <RegisterPage
          onRegister={handleRegister}
          onNavigate={(page) => setActivePage(page)}
          onClose={() => setActivePage('home')}
        />
      )}
    </div>
  )
}
export default AppPages
