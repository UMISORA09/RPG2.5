import FlightJoystick from './FlightJoystick.js'
import TerrainMinimap from './TerrainMinimap.js'

const ICONS = {
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-7h6v7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
  fullscreen: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  leaf: '<path d="M20 4C8 1 2 8 5 15s16 5 15-11ZM4 21 15 10"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6M16 15l6-6"/>',
  plane: '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>',
  restart: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
}
const BIOMES = {
  forest: 'Rừng xanh tươi', autumnForest: 'Rừng cây lá vàng', desert: 'Đồi cát vàng',
  volcano: 'Thung lũng dung nham', snowForest: 'Rừng tuyết trắng', meadow: 'Đồng cỏ hoa', wetland: 'Vùng đất ngập nước',
}
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`
const button = (action, icon, label, extra = '') => `<button type="button" class="icon-button" data-action="${action}" title="${label}" aria-label="${label}" ${extra}>${svg(icon)}</button>`
const CLOUD_REVEAL_MS = 750
const CLOUD_PUFFS = [
  ['16%', '24%', '46vw', '26vw', '-38vw', '-22vh'],
  ['50%', '12%', '52vw', '24vw', '2vw', '-34vh'],
  ['86%', '22%', '44vw', '26vw', '40vw', '-20vh'],
  ['6%', '52%', '38vw', '30vw', '-44vw', '2vh'],
  ['32%', '46%', '34vw', '22vw', '-26vw', '-4vh'],
  ['70%', '48%', '34vw', '22vw', '28vw', '2vh'],
  ['96%', '54%', '40vw', '28vw', '46vw', '6vh'],
  ['18%', '80%', '46vw', '26vw', '-30vw', '32vh'],
  ['52%', '88%', '54vw', '26vw', '4vw', '36vh'],
  ['86%', '78%', '42vw', '24vw', '36vw', '30vh'],
]
const cloudVeilMarkup = () => {
  const puffs = CLOUD_PUFFS.map(([x, y, w, h, dx, dy]) => `<span class="puff" style="--x:${x};--y:${y};--w:${w};--h:${h};--dx:${dx};--dy:${dy}"></span>`).join('')
  return `<div class="cloud-veil" aria-hidden="true"><div class="cloud-sky"></div><div class="cloud-burst"></div><div class="cloud-field">${puffs}</div></div>`
}

export default class ExplorerUI {
  constructor(root, experience) {
    this.root = root
    this.experience = experience
    this.ready = false
    this.flightPaused = false
    this.isHomeScreen = true
    this._hasStartedOnce = false
    this.mapExpanded = false
    this.lastUpdate = -Infinity
    this.events = new AbortController()
    root.className = 'explorer-ui'
    root.innerHTML = `
      <header class="hud-header">
        <div class="brand hud-part">
          <span class="brick-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <div><h1>Thế Giới Lego<span>BRICKLAND</span></h1><p>Chuyến phiêu lưu tí hon không hồi kết</p></div>
        </div>
        <div class="header-tools">
          <span class="explore-badge hud-part"><i></i><span data-flight-status>Tự do khám phá</span></span>
        </div>
      </header>
      <section class="surface location-card hud-part flight-panel" aria-label="Thông tin chuyến bay">
        <div class="eyebrow">ĐANG KHÁM PHÁ <span class="live-dot"></span></div>
        <h2>${svg('leaf')}<span data-biome>Vùng hoang sơ</span></h2>
        <div class="flight-readings"><div><strong data-speed>0.0</strong><span>ô / giây</span></div><div class="coordinates"><span>X <b data-x>—</b></span><span>Z <b data-z>—</b></span></div></div>
        <div class="speed-track" aria-hidden="true"><i data-speed-bar></i></div>
      </section>
      <div class="surface control-hint hud-part flight-panel" aria-label="Gợi ý điều khiển">
        <span class="key-cluster"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span>
        <span class="hint-copy"><b>W: Tiến lên · S: Lùi xuống · A / D: Trái / Phải</b><span>Dùng được cả phím mũi tên · Camera tự động bám theo</span></span>
        <button type="button" data-action="help" class="text-button">Hướng dẫn <span>↗</span></button>
      </div>
      <div class="hud-right-panel hud-part flight-panel">
        <aside class="surface map-card" aria-label="Bản đồ địa hình xung quanh">
          <div class="map-heading"><div><span>Bản đồ khu vực</span><span class="eyebrow">BẢN ĐỒ</span></div><button type="button" class="map-expand" data-action="map" aria-label="Phóng to bản đồ" title="Phóng to bản đồ" aria-expanded="false">${svg('fullscreen')}</button></div>
          <canvas class="terrain-minimap" aria-label="Địa hình đã khám phá xung quanh và hướng bay"></canvas>
          <div class="map-footer"><span><i></i> Vị trí của bạn</span><span data-seed></span></div>
        </aside>
        <nav class="surface action-bar" aria-label="Công cụ khám phá">
          ${button('pause', 'pause', 'Tạm dừng bay (Phím cách)', 'aria-pressed="false" disabled')}
          ${button('home', 'home', 'Về điểm xuất phát', 'disabled')}
          <span class="tool-divider"></span>
          ${button('sound', 'sound', 'Tắt âm thanh (M)', 'aria-pressed="false"')}
          ${button('help', 'help', 'Hướng dẫn điều khiển', 'disabled')}
          ${button('fullscreen', 'fullscreen', 'Chuyển toàn màn hình')}
          ${button('cinema', 'eye', 'Ẩn giao diện (H)', 'aria-pressed="false"')}
        </nav>
      </div>
      <div class="surface flight-joystick hud-part flight-panel" data-flight-joystick role="group" aria-label="Cần điều khiển bay, kéo theo hướng nào máy bay sẽ bay theo hướng đó" hidden>
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="50" cy="50" r="30" stroke-dasharray="1 4" opacity=".55"/>
          <path d="m46 15 4-4 4 4m-8 70 4 4 4-4M15 46l-4 4 4 4m70-8 4 4-4 4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="flight-joystick-thumb" aria-hidden="true"></span>
      </div>
      ${cloudVeilMarkup()}
      <div class="loading-card surface" role="status"><span class="eyebrow">THẾ GIỚI NHỎ, PHIÊU LƯU LỚN</span><h2>Vùng đất đang hình thành</h2><p data-stage>Đang đánh thức thế giới nhỏ này…</p><div class="loading-track"><i></i></div></div>
      <div class="hud-toast surface" role="status" hidden></div>
      <section class="home-screen" data-home-screen aria-label="Trang chủ trò chơi">
        <div class="home-backdrop"></div>
        <div class="home-card surface">
          <div class="home-badge">
            <span class="brick-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <span>THẾ GIỚI LEGO 3D · CHUYẾN PHIÊU LƯU TÍ HON</span>
          </div>
          <h1 class="home-title">
            BRICKLAND
            <span>KHÁM PHÁ VÙNG ĐẤT LEGO</span>
          </h1>
          <p class="home-description">
            Lướt nhẹ trên đôi cánh máy bay tí hon qua những cánh rừng rực rỡ, dòng sông ngọc bích và đồi cát kỳ vĩ được ghép từ hàng vạn viên gạch lego.
          </p>

          <div class="home-actions">
            <button type="button" class="home-play-btn" data-action="start-game">
              <span class="btn-icon">${svg('plane')}</span>
              <span class="btn-text">
                <strong data-home-start-label>Bắt đầu khám phá</strong>
                <small data-home-start-sub>Nhấn để cất cánh bay lượn (Phím cách / Enter)</small>
              </span>
              <span class="btn-arrow">→</span>
            </button>

            <div class="home-secondary-actions">
              <button type="button" class="home-action-btn" data-action="help">
                ${svg('help')} <span>Hướng dẫn điều khiển</span>
              </button>
              <button type="button" class="home-action-btn" data-action="sound">
                ${svg('sound')} <span data-home-sound-text>Âm thanh & Nhạc</span>
              </button>
              <button type="button" class="home-action-btn" data-action="home-reset" data-home-resume-only hidden>
                ${svg('restart')} <span>Bay lại từ đầu</span>
              </button>
            </div>
          </div>

          <div class="home-biomes-section">
            <div class="home-biomes-header">
              <span>7 MIỀN ĐẤT SINH THÁI ĐẶC SẮC</span>
              <span class="home-biomes-sub">Tự do khám phá không giới hạn</span>
            </div>
            <div class="home-biomes-grid">
              <span class="home-biome-item">🌲 Rừng xanh tươi</span>
              <span class="home-biome-item">🍂 Rừng thu vàng</span>
              <span class="home-biome-item">🌸 Đồng cỏ hoa</span>
              <span class="home-biome-item">🏜️ Đồi cát vàng</span>
              <span class="home-biome-item">🌋 Thung lũng nham thạch</span>
              <span class="home-biome-item">❄️ Rừng tuyết trắng</span>
              <span class="home-biome-item">🌿 Đất ngập nước</span>
            </div>
          </div>

          <div class="home-footer">
            <span class="home-tip-text">💡 <b>Cách chơi:</b> Dùng phím <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> để lái theo trực quan màn hình · Nhấn <kbd>Esc</kbd> hoặc nút <b>⌂</b> bất cứ lúc nào để về Trang chủ</span>
          </div>
        </div>
      </section>
      <dialog class="help-dialog surface" aria-labelledby="help-title">
        ${button('close-help', 'close', 'Đóng hướng dẫn')}
        <span class="eyebrow">CÙNG KHÁM PHÁ</span><h2 id="help-title">Để tò mò dẫn lối</h2><p class="help-intro">Điều khiển chiếc máy bay nhỏ của bạn lướt qua những cánh rừng, dòng sông và đồi núi.</p>
        <dl class="help-keys desktop-help">
          <div><dt><kbd>W</kbd> / <kbd>↑</kbd></dt><dd>Bay lên (về phía xa màn hình)</dd></div>
          <div><dt><kbd>S</kbd> / <kbd>↓</kbd></dt><dd>Bay xuống (về gần màn hình)</dd></div>
          <div><dt><kbd>A</kbd> / <kbd>←</kbd></dt><dd>Bay sang trái màn hình</dd></div>
          <div><dt><kbd>D</kbd> / <kbd>→</kbd></dt><dd>Bay sang phải màn hình</dd></div>
          <div><dt><kbd>Space</kbd></dt><dd>Tạm dừng / Tiếp tục bay</dd></div>
          <div><dt><kbd>H</kbd> / <kbd>M</kbd></dt><dd>Ẩn hiện giao diện / Bật tắt âm thanh</dd></div>
          <div><dt>Nút góc bản đồ / <kbd>Esc</kbd></dt><dd>Phóng to / Thu nhỏ bản đồ</dd></div>
        </dl>
        <dl class="help-keys touch-help">
          <div><dt>Kéo cần gạt bên trái</dt><dd>Bay theo hướng màn hình</dd></div>
          <div><dt>Kéo càng xa</dt><dd>Bay càng nhanh</dd></div>
          <div><dt>Thả tay về giữa</dt><dd>Máy bay lướt và giảm tốc</dd></div>
        </dl>
        <p class="help-note touch-help">Gạt cần điều khiển về hướng muốn bay, máy bay sẽ nghiêng mình lượn theo. Bay càng nhanh góc cua càng rộng.</p>
        <p class="help-note">Camera sẽ tự động bám theo máy bay.</p><button type="button" class="primary-button" data-action="close-help">Bắt đầu khám phá <span>→</span></button>
      </dialog>`
    this.speed = root.querySelector('[data-speed]')
    this.speedBar = root.querySelector('[data-speed-bar]')
    this.biome = root.querySelector('[data-biome]')
    this.x = root.querySelector('[data-x]')
    this.z = root.querySelector('[data-z]')
    this.dialog = root.querySelector('dialog')
    this.minimap = new TerrainMinimap(root.querySelector('.terrain-minimap'), experience)
    this.syncAudioControl()
    root.querySelector('[data-seed]').textContent = `# ${experience.world.config.seed}`
    const options = { signal: this.events.signal }
    this.touchMedia = window.matchMedia('(pointer: coarse)')
    this.joystick = new FlightJoystick(
      root.querySelector('[data-flight-joystick]'),
      (x, y) => this.experience.world.playerAircraft?.input.setJoystick(x, y),
      options,
    )
    this.syncTouchControls()
    this.touchMedia.addEventListener('change', () => this.syncTouchControls(), options)
    window.addEventListener('blur', () => this.joystick.reset(), options)
    window.addEventListener('resize', () => this.joystick.reset(), options)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.joystick.reset()
    }, options)
    root.addEventListener('click', event => this.onAction(event.target.closest('[data-action]')?.dataset.action), options)
    window.addEventListener('keydown', event => this.onKeyDown(event), { ...options, capture: true })
    this.dialog.addEventListener('close', () => this.syncPause(), options)
    document.addEventListener('fullscreenchange', () => {
      this.joystick.reset()
      const control = root.querySelector('[data-action="fullscreen"]')
      control.setAttribute('aria-label', document.fullscreenElement ? 'Thoát toàn màn hình' : 'Chuyển toàn màn hình')
    }, options)
    if (!document.fullscreenEnabled) root.querySelector('[data-action="fullscreen"]').hidden = true
  }

  setStage(message) {
    this.root.querySelector('[data-stage]').textContent = message
  }

  playCloudReveal() {
    const sky = this.root.querySelector('.cloud-sky')
    const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!sky || reduceMotion || this.ready) return Promise.resolve()
    this.root.classList.add('is-revealing')
    return new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        sky.removeEventListener('animationend', onEnd)
        clearTimeout(timer)
        this._cancelReveal = null
        resolve()
      }
      const onEnd = (event) => {
        if (event.target === sky) finish()
      }
      const timer = setTimeout(finish, CLOUD_REVEAL_MS)
      this._cancelReveal = finish
      sky.addEventListener('animationend', onEnd)
    })
  }

  setReady() {
    this.ready = true
    this.root.classList.add('is-ready')
    this.root.classList.remove('is-revealing')
    this.root.querySelector('.cloud-veil')?.remove()
    for (const control of this.root.querySelectorAll('button[disabled]')) control.disabled = false
    if (!this.experience.world.playerAircraft?.enabled) {
      for (const control of this.root.querySelectorAll('[data-action="pause"], [data-action="home"]')) control.disabled = true
    }
    this.setHomeScreen(true)
    this.update(0)
  }

  setHomeScreen(show) {
    this.isHomeScreen = Boolean(show)
    this.root.classList.toggle('is-home', this.isHomeScreen)
    if (this.isHomeScreen) {
      if (this.mapExpanded) this.toggleMap(false)
      const hasStarted = this._hasStartedOnce
      const startLabel = this.root.querySelector('[data-home-start-label]')
      const startSub = this.root.querySelector('[data-home-start-sub]')
      const resumeOnly = this.root.querySelector('[data-home-resume-only]')
      if (startLabel) startLabel.textContent = hasStarted ? 'Tiếp tục bay' : 'Bắt đầu khám phá'
      if (startSub) startSub.textContent = hasStarted ? 'Nhấn để tiếp tục chuyến bay hiện tại (Phím cách / Enter)' : 'Nhấn để cất cánh bay lượn (Phím cách / Enter)'
      if (resumeOnly) resumeOnly.hidden = !hasStarted
    }
    else {
      this._hasStartedOnce = true
    }
    this.syncPause()
  }

  syncTouchControls() {
    const player = this.experience.world.playerAircraft
    const touch = this.touchMedia.matches
    const available = touch && this.ready && player?.enabled === true
    this.root.classList.toggle('is-touch', touch)
    this.root.classList.toggle('has-flight-joystick', available)
    this.joystick.setEnabled(available && !player.paused && !this.mapExpanded && !this.root.classList.contains('is-cinema') && !this.isHomeScreen)
  }

  syncPause() {
    const paused = this.experience.platformPaused || this.flightPaused || this.dialog.open || this.isHomeScreen
    const player = this.experience.world.playerAircraft
    this.joystick.reset()
    if (player && (this.ready || paused)) player.setPaused(paused)
    this.syncTouchControls()
    const control = this.root.querySelector('[data-action="pause"]')
    control.setAttribute('aria-pressed', String(this.flightPaused))
    control.setAttribute('aria-label', this.flightPaused ? 'Tiếp tục bay (Phím cách)' : 'Tạm dừng bay (Phím cách)')
    control.title = control.getAttribute('aria-label')
    control.innerHTML = svg(this.flightPaused ? 'play' : 'pause')
    this.root.querySelector('[data-flight-status]').textContent = !player?.enabled ? 'Ngắm cảnh' : this.isHomeScreen ? 'Trang chủ' : this.flightPaused ? 'Đã tạm dừng' : 'Tự do khám phá'
    this.root.classList.toggle('is-paused', this.flightPaused)
  }

  onAction(action) {
    if (!action) return
    const audio = this.experience.audio
    if (action === 'sound' && audio) {
      audio.setMuted(!audio.muted)
      this.syncAudioControl()
      if (!audio.muted) audio.play('click')
      return
    }
    if (action === 'start-game') {
      this.experience.audio?.play('resume')
      this.setHomeScreen(false)
      return
    }
    if (action === 'home') {
      this.setHomeScreen(true)
      this.experience.audio?.play('click')
      return
    }
    if (action === 'home-reset') {
      const player = this.experience.world.playerAircraft
      this.joystick.reset()
      player?.reset()
      this.experience.world.regenerate()
      this.experience.worldCamera.resetView(player.state.position)
      this.setHomeScreen(false)
      this.toast('Đã trở về điểm xuất phát')
      return
    }
    audio?.play(action === 'pause' ? this.flightPaused ? 'resume' : 'pause' : 'click')
    if (action === 'cinema') {
      if (this.mapExpanded) this.toggleMap(false)
      const hidden = this.root.classList.toggle('is-cinema')
      this.syncTouchControls()
      const control = this.root.querySelector('[data-action="cinema"]')
      control.setAttribute('aria-pressed', String(hidden))
      control.setAttribute('aria-label', hidden ? 'Hiện giao diện (H)' : 'Ẩn giao diện (H)')
      control.title = control.getAttribute('aria-label')
      return
    }
    if (action === 'fullscreen') {
      const operation = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
      operation.catch(() => this.toast('Trình duyệt hiện tại chưa hỗ trợ toàn màn hình'))
      return
    }
    if (!this.ready) return
    if (action === 'map') this.toggleMap()
    if (action === 'help') {
      this.dialog.showModal()
      this.syncPause()
    }
    if (action === 'close-help') this.dialog.close()
    const player = this.experience.world.playerAircraft
    if (!player?.enabled) return
    if (action === 'pause') {
      this.flightPaused = !this.flightPaused
      this.syncPause()
    }
  }

  onKeyDown(event) {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return
    if (this.dialog.open) return

    if (this.isHomeScreen) {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        this.onAction('start-game')
        return
      }
      if (event.code === 'Escape' && this._hasStartedOnce) {
        event.preventDefault()
        event.stopPropagation()
        this.setHomeScreen(false)
        return
      }
      return
    }

    if (event.code === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (this.mapExpanded) {
        this.toggleMap(false)
        this.experience.audio?.play('click')
      }
      else {
        this.setHomeScreen(true)
      }
      return
    }
    const interactive = event.target?.closest?.('button, a')
    const action = event.code === 'KeyH' ? 'cinema' : event.code === 'KeyM' ? 'sound' : event.code === 'Space' && !interactive ? 'pause' : event.key === '?' ? 'help' : null
    if (action) {
      event.preventDefault()
      event.stopPropagation()
      this.onAction(action)
    }
  }

  update(timestamp) {
    if (!this.ready || timestamp - this.lastUpdate < 100) return
    this.lastUpdate = timestamp
    if (this.root.classList.contains('is-cinema')) return
    const player = this.experience.world.playerAircraft
    if (!player) return
    const cellSize = this.experience.world.config.terrain.cellSize
    const speed = player.paused ? 0 : player.state.velocity.length()
    this.speed.textContent = (speed / cellSize).toFixed(1)
    this.speedBar.style.width = `${Math.min(100, speed / player.motionConfig.maxSpeed * 100)}%`
    this.x.textContent = String(Math.floor(player.state.position.x / cellSize)).padStart(4, '0')
    this.z.textContent = String(Math.floor(player.state.position.z / cellSize)).padStart(4, '0')
    this.minimap.update()
    const biomeId = this.minimap.getCurrentBiomeId()
    if (biomeId && this.lastBiomeId && biomeId !== this.lastBiomeId) this.experience.audio?.play('biome')
    if (biomeId) this.lastBiomeId = biomeId
    this.biome.textContent = BIOMES[biomeId] ?? 'Vùng hoang sơ'
  }

  syncAudioControl() {
    const muted = this.experience.audio?.muted ?? true
    const control = this.root.querySelector('[data-action="sound"]')
    if (control) {
      control.setAttribute('aria-pressed', String(muted))
      control.setAttribute('aria-label', muted ? 'Bật âm thanh (M)' : 'Tắt âm thanh (M)')
      control.title = control.getAttribute('aria-label')
      control.innerHTML = svg(muted ? 'muted' : 'sound')
    }
    const homeSoundText = this.root.querySelector('[data-home-sound-text]')
    if (homeSoundText) {
      homeSoundText.textContent = muted ? 'Bật âm thanh' : 'Tắt âm thanh'
    }
  }

  toggleMap(expanded = !this.mapExpanded) {
    this.mapExpanded = expanded
    this.root.classList.toggle('is-map-expanded', expanded)
    this.root.querySelector('.map-card').classList.toggle('is-expanded', expanded)
    const control = this.root.querySelector('[data-action="map"]')
    control.setAttribute('aria-expanded', String(expanded))
    control.setAttribute('aria-label', expanded ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ')
    control.title = control.getAttribute('aria-label')
    control.innerHTML = svg(expanded ? 'close' : 'fullscreen')
    this.syncTouchControls()
    this.minimap.update()
  }

  toast(message) {
    const element = this.root.querySelector('.hud-toast')
    element.textContent = message
    element.hidden = false
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { element.hidden = true }, 2600)
  }

  dispose() {
    this._cancelReveal?.()
    this.joystick.reset()
    this.events.abort()
    clearTimeout(this.toastTimer)
    if (this.dialog.open) this.dialog.close()
    this.minimap.dispose()
    this.root.replaceChildren()
  }
}
