import React, { useState, useEffect, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import HomePage from './HomePage.tsx'
import LoginPage from './LoginPage.tsx'
import RegisterPage from './RegisterPage.tsx'
import AuthManager from '../auth/AuthManager.js'
import './pages.css'

export const AppPages = ({ experience, explorerUI }) => {
  const auth = useMemo(() => explorerUI?.auth || new AuthManager(), [explorerUI])
  const [currentUser, setCurrentUser] = useState(() => auth.getCurrentUser())
  const [activePage, setActivePage] = useState('home') // 'home' | 'login' | 'register'
  const [homeTab, setHomeTab] = useState('overview') // 'overview' | 'about' | 'modes' | 'preview3d' | 'contact'
  const [aircraftColor, setAircraftColor] = useState('#f59e0b')
  const [isVisible, setIsVisible] = useState(true)
  const [hasStartedOnce, setHasStartedOnce] = useState(false)
  const [audioMuted, setAudioMuted] = useState(() => Boolean(experience?.audio?.muted ?? true))

  // Đọc route từ window.location.hash lúc khởi tạo
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '')
      if (hash === 'login' || hash === 'register') {
        setActivePage(hash)
      } else if (['overview', 'about', 'modes', 'preview3d', 'contact'].includes(hash)) {
        setActivePage('home')
        setHomeTab(hash)
      }
    }
    parseHash()
    window.addEventListener('hashchange', parseHash)
    return () => window.removeEventListener('hashchange', parseHash)
  }, [])

  // Cập nhật hash khi chuyển trang
  const updateRoute = useCallback((page, tab = null) => {
    if (page === 'home') {
      const targetTab = tab || homeTab || 'overview'
      setActivePage('home')
      setHomeTab(targetTab)
      window.location.hash = `#/${targetTab}`
    } else {
      setActivePage(page)
      window.location.hash = `#/${page}`
    }
  }, [homeTab])

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
      openHome: (tab = 'overview') => {
        syncWithExplorer()
        updateRoute('home', tab)
        setIsVisible(true)
      },
      openTab: (tab) => {
        syncWithExplorer()
        updateRoute('home', tab)
        setIsVisible(true)
      },
      openLogin: () => {
        syncWithExplorer()
        updateRoute('login')
        setIsVisible(true)
      },
      openRegister: () => {
        syncWithExplorer()
        updateRoute('register')
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
      setAircraftColor: (color) => {
        setAircraftColor(color)
      },
    }

    return () => {
      delete window.__bricklandApp
    }
  }, [syncWithExplorer, updateRoute])

  // Nhuộm màu máy bay trực tiếp trong game 3D
  const applyColorToInGameAircraft = useCallback((hex) => {
    setAircraftColor(hex)
    const playerAircraft = experience?.world?.playerAircraft
    if (!playerAircraft?.modelRoot) return

    const targetColor = new THREE.Color(hex)
    playerAircraft.modelRoot.traverse((node) => {
      if (node.isMesh && node.material) {
        const matName = (node.material.name || '').toLowerCase()
        const nodeName = (node.name || '').toLowerCase()
        if (matName.includes('glass') || matName.includes('windshield') || nodeName.includes('glass')) {
          return
        }
        if (nodeName.includes('engine') || nodeName.includes('thruster') || matName.includes('emissive')) {
          return
        }

        if (Array.isArray(node.material)) {
          node.material = node.material.map((m) => {
            const cloned = m.clone()
            cloned.color.copy(targetColor)
            return cloned
          })
        } else {
          node.material = node.material.clone()
          node.material.color.copy(targetColor)
        }
      }
    })
  }, [experience])

  // Bắt đầu cất cánh vào game
  const handleStartGame = useCallback(() => {
    const user = auth.getCurrentUser()
    if (!user) {
      updateRoute('login')
      explorerUI?.toast?.('Vui lòng đăng nhập hoặc chọn Khách để tham gia trò chơi!')
      return
    }

    applyColorToInGameAircraft(aircraftColor)
    experience?.audio?.play?.('resume')
    setIsVisible(false)
    setHasStartedOnce(true)
    if (explorerUI) {
      explorerUI.setHomeScreen(false)
    }
  }, [auth, experience, explorerUI, aircraftColor, applyColorToInGameAircraft, updateRoute])

  // Cất cánh Chế độ mở (Open World Flight Launch)
  const handleLaunchOpenWorld = useCallback((options) => {
    let user = auth.getCurrentUser()
    if (!user) {
      user = auth.playAsGuest()
      setCurrentUser(user)
      explorerUI?.syncUserBadge?.()
    }

    // 1. Tinh chỉnh độ cao xuất phát
    const aircraft = experience?.world?.playerAircraft
    if (aircraft) {
      const heightMap = { low: 3.8, normal: 5.5, high: 9.5 }
      const chosenHeight = heightMap[options.altitude] || 5.5
      aircraft.motionConfig.height = chosenHeight

      // 2. Tinh chỉnh tốc độ động cơ
      const speedMap = {
        zen: { maxSpeed: 5.0, thrust: 10, drag: 2.5 },
        normal: { maxSpeed: 8.5, thrust: 18, drag: 2.0 },
        nitro: { maxSpeed: 14.0, thrust: 32, drag: 1.5 },
      }
      const speedTuning = speedMap[options.speedMode] || speedMap.normal
      aircraft.motionConfig.maxSpeed = speedTuning.maxSpeed
      aircraft.motionConfig.thrust = speedTuning.thrust
      aircraft.motionConfig.linearDrag = speedTuning.drag

      // 3. Tinh chỉnh điểm xuất phát theo vùng sinh thái
      if (options.biome && experience?.world?.config?.biomes) {
        experience.world.config.biomes.originBiome = options.biome
      }

      // Reset lại máy bay về điểm xuất phát
      aircraft.reset()
    }

    // 4. Tinh chỉnh ánh sáng bầu trời & môi trường
    const env = experience?.environment
    if (env) {
      switch (options.timeOfDay) {
        case 'dawn':
          env.directionalLight?.color?.setHex(0xffaa55)
          env.ambientLight?.color?.setHex(0xffd8b0)
          env.clearColor?.set('#e8aa78')
          break
        case 'noon':
          env.directionalLight?.color?.setHex(0xfff7ea)
          env.ambientLight?.color?.setHex(0xdcecff)
          env.clearColor?.set('#6aca97')
          break
        case 'night':
          env.directionalLight?.color?.setHex(0x5588cc)
          env.ambientLight?.color?.setHex(0x223355)
          env.clearColor?.set('#1a2638')
          break
        case 'sunset':
        default:
          env.directionalLight?.color?.setHex(0xff7733)
          env.ambientLight?.color?.setHex(0xff9966)
          env.clearColor?.set('#c85a32')
          break
      }
      if (experience?.renderer?.instance && env.clearColor) {
        experience.renderer.instance.setClearColor(env.clearColor)
      }
      env.syncBackground?.()
    }

    // Áp dụng màu phi cơ
    applyColorToInGameAircraft(aircraftColor)

    // Cất cánh
    experience?.audio?.play?.('resume')
    setIsVisible(false)
    setHasStartedOnce(true)
    if (explorerUI) {
      explorerUI.setHomeScreen(false)
    }

    const biomeLabels = {
      autumnForest: 'Rừng thu vàng',
      forest: 'Rừng xanh nhiệt đới',
      desert: 'Sa mạc Cổng Mặt Trời',
      volcano: 'Thung lũng nham thạch',
      snowForest: 'Rừng tuyết trắng',
      wetland: 'Đầm lầy đất ngập nước',
    }
    const biomeName = biomeLabels[options.biome] || options.biome
    explorerUI?.toast?.(`Cất cánh chế độ mở tại ${biomeName}!`)
  }, [auth, experience, explorerUI, aircraftColor, applyColorToInGameAircraft])

  // Xử lý cất cánh từ xem trước mô hình 3D kèm màu đã chọn
  const handleTakeoffWithColor = useCallback((colorHex) => {
    applyColorToInGameAircraft(colorHex)
    handleStartGame()
  }, [applyColorToInGameAircraft, handleStartGame])

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
      if (!isVisible || activePage !== 'home' || homeTab !== 'overview') return
      if (e.target?.closest?.('input, textarea, select')) return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        handleStartGame()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isVisible, activePage, homeTab, handleStartGame])

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

      {/* Hiển thị trang tương ứng (Home Portal / Login / Register) */}
      {activePage === 'home' && (
        <HomePage
          user={currentUser}
          hasStartedOnce={hasStartedOnce}
          audioMuted={audioMuted}
          initialTab={homeTab}
          selectedAircraftColor={aircraftColor}
          experience={experience}
          onStartGame={handleStartGame}
          onNavigate={(page) => updateRoute(page)}
          onTabChange={(tab) => updateRoute('home', tab)}
          onLaunchOpenWorld={handleLaunchOpenWorld}
          onAircraftColorChange={applyColorToInGameAircraft}
          onTakeoffWithColor={handleTakeoffWithColor}
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
          onNavigate={(page) => updateRoute(page)}
          onClose={() => updateRoute('home', 'overview')}
        />
      )}

      {activePage === 'register' && (
        <RegisterPage
          onRegister={handleRegister}
          onNavigate={(page) => updateRoute(page)}
          onClose={() => updateRoute('home', 'overview')}
        />
      )}
    </div>
  )
}
export default AppPages
