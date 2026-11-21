import React, { useState } from 'react'
import { OpenWorldOptions } from '../types.ts'

interface OpenWorldViewProps {
  onLaunchOpenWorld: (options: OpenWorldOptions) => void
  onSwitchTab: (tab: 'preview3d') => void
}

const SPAWN_BIOMES = [
  {
    id: 'autumnForest',
    name: '🍂 Rừng thu vàng',
    desc: 'Lá phong vàng rực rỡ, cây cối cổ thụ và dòng suối hiền hòa',
    badge: 'Mặc định',
  },
  {
    id: 'forest',
    name: '🌲 Rừng xanh nhiệt đới',
    desc: 'Bạt ngàn thông xanh mát mắt và đồi cỏ phì nhiêu',
    badge: 'Thanh bình',
  },
  {
    id: 'desert',
    name: '🏜️ Sa mạc Cổng Mặt Trời',
    desc: 'Cát vàng óng ả, cự thạch hùng vĩ và kỳ quan Sun Gate',
    badge: 'Kỳ quan',
  },
  {
    id: 'volcano',
    name: '🌋 Thung lũng nham thạch',
    desc: 'Dòng dung nham rực đỏ chảy quanh hẻm đá bazan đen tuyền',
    badge: 'Kịch tính',
  },
  {
    id: 'snowForest',
    name: '❄️ Rừng tuyết trắng',
    desc: 'Đỉnh núi phủ tuyết trắng tinh khôi và cây lá kim đóng băng',
    badge: 'Băng giá',
  },
  {
    id: 'wetland',
    name: '🌿 Đầm lầy đất ngập nước',
    desc: 'Vùng đầm lầy xanh tươi, cây rễ nước và đầm hoa sen tí hon',
    badge: 'Bí ẩn',
  },
]

export const OpenWorldView: React.FC<OpenWorldViewProps> = ({
  onLaunchOpenWorld,
  onSwitchTab,
}) => {
  const [selectedBiome, setSelectedBiome] = useState('autumnForest')
  const [altitude, setAltitude] = useState<'low' | 'normal' | 'high'>('normal')
  const [speedMode, setSpeedMode] = useState<'zen' | 'normal' | 'nitro'>('normal')
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'noon' | 'sunset' | 'night'>('sunset')

  const handleLaunch = () => {
    onLaunchOpenWorld({
      biome: selectedBiome,
      altitude,
      speedMode,
      timeOfDay,
    })
  }

  return (
    <div className="open-world-view">
      {/* Giới thiệu Chế độ Chơi Mở */}
      <div className="open-world-banner">
        <div className="open-world-badge">
          <span>🌐 KHÁM PHÁ TỰ DO THẾ GIỚI MỞ (OPEN WORLD)</span>
        </div>
        <h3>Tùy Chỉnh Chuyến Bay Khám Phá Của Bạn</h3>
        <p>
          Chọn vùng xuất phát ưa thích, tinh chỉnh độ cao và tốc độ cất cánh để bắt đầu hành trình tự do
          không rào cản trên bầu trời Lego.
        </p>
      </div>

      {/* 1. Chọn vùng xuất phát (Spawn Biome) */}
      <div className="customizer-section">
        <label className="section-title">
          <span>1. Chọn điểm xuất phát trên bản đồ</span>
          <small>Hệ sinh thái sẽ tập trung quanh vị trí cất cánh</small>
        </label>
        <div className="biome-select-grid">
          {SPAWN_BIOMES.map((b) => (
            <div
              key={b.id}
              className={`biome-select-card ${selectedBiome === b.id ? 'is-selected' : ''}`}
              onClick={() => setSelectedBiome(b.id)}
            >
              <div className="biome-card-top">
                <strong>{b.name}</strong>
                <span className="card-badge">{b.badge}</span>
              </div>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Tinh chỉnh thông số bay */}
      <div className="customizer-row-grid">
        {/* Độ cao cất cánh */}
        <div className="customizer-col">
          <label className="section-title">
            <span>2. Độ cao ban đầu</span>
          </label>
          <div className="option-button-group">
            <button
              type="button"
              className={`option-btn ${altitude === 'low' ? 'is-active' : ''}`}
              onClick={() => setAltitude('low')}
            >
              🌱 Sát đất (3.8m)
            </button>
            <button
              type="button"
              className={`option-btn ${altitude === 'normal' ? 'is-active' : ''}`}
              onClick={() => setAltitude('normal')}
            >
              ✈️ Chuẩn (5.5m)
            </button>
            <button
              type="button"
              className={`option-btn ${altitude === 'high' ? 'is-active' : ''}`}
              onClick={() => setAltitude('high')}
            >
              ☁️ Mây cao (9.5m)
            </button>
          </div>
        </div>

        {/* Tốc độ động cơ */}
        <div className="customizer-col">
          <label className="section-title">
            <span>3. Tốc độ động cơ</span>
          </label>
          <div className="option-button-group">
            <button
              type="button"
              className={`option-btn ${speedMode === 'zen' ? 'is-active' : ''}`}
              onClick={() => setSpeedMode('zen')}
            >
              🍃 Lướt chậm (5m/s)
            </button>
            <button
              type="button"
              className={`option-btn ${speedMode === 'normal' ? 'is-active' : ''}`}
              onClick={() => setSpeedMode('normal')}
            >
              🚀 Tiêu chuẩn (8.5m/s)
            </button>
            <button
              type="button"
              className={`option-btn ${speedMode === 'nitro' ? 'is-active' : ''}`}
              onClick={() => setSpeedMode('nitro')}
            >
              ⚡ Siêu tốc Nitro (14m/s)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Thời gian / Ánh sáng môi trường */}
      <div className="customizer-section">
        <label className="section-title">
          <span>4. Ánh sáng bầu trời & Khung giờ</span>
        </label>
        <div className="time-button-group">
          <button
            type="button"
            className={`time-btn ${timeOfDay === 'dawn' ? 'is-active' : ''}`}
            onClick={() => setTimeOfDay('dawn')}
          >
            🌅 Bình minh ấm
          </button>
          <button
            type="button"
            className={`time-btn ${timeOfDay === 'noon' ? 'is-active' : ''}`}
            onClick={() => setTimeOfDay('noon')}
          >
            ☀️ Trưa rực rỡ
          </button>
          <button
            type="button"
            className={`time-btn ${timeOfDay === 'sunset' ? 'is-active' : ''}`}
            onClick={() => setTimeOfDay('sunset')}
          >
            🌇 Hoàng hôn ráng vàng
          </button>
          <button
            type="button"
            className={`time-btn ${timeOfDay === 'night' ? 'is-active' : ''}`}
            onClick={() => setTimeOfDay('night')}
          >
            🌙 Đêm trăng huyền ảo
          </button>
        </div>
      </div>

      {/* Nút Khởi động chế độ mở */}
      <button
        type="button"
        className="glow-action-button open-world-launch-btn"
        onClick={handleLaunch}
      >
        <span className="btn-icon-aura">🌍</span>
        <span className="btn-copy">
          <strong>CẤT CÁNH CHẾ ĐỘ MỞ NGAY</strong>
          <small>
            Điểm xuất phát: {SPAWN_BIOMES.find((b) => b.id === selectedBiome)?.name} · Độ cao: {altitude === 'low' ? '3.8m' : altitude === 'normal' ? '5.5m' : '9.5m'}
          </small>
        </span>
        <span className="btn-arrow-glow">→</span>
      </button>

      {/* Giới thiệu các Chế độ chơi đặc sắc khác */}
      <div className="other-modes-box">
        <h4 className="other-modes-title">CÁC CHẾ ĐỘ CHƠI MỞ RỘNG</h4>
        <div className="modes-cards-grid">
          <div className="mode-card">
            <span className="mode-icon">🏆</span>
            <div>
              <strong>Thử Thách Cổng Mặt Trời</strong>
              <p>Lượn lách qua các vòng cổng vàng trên sa mạc để ghi điểm kỷ lục.</p>
            </div>
          </div>
          <div className="mode-card">
            <span className="mode-icon">🧘</span>
            <div>
              <strong>Ngắm Cảnh Thư Giãn (Zen)</strong>
              <p>Chế độ bay êm ái không lo va chạm, hòa mình vào bản giao hưởng thiên nhiên.</p>
            </div>
          </div>
          <div className="mode-card">
            <span className="mode-icon">📸</span>
            <div>
              <strong>Nhiếp Ảnh Bầu Trời (Photo Drone)</strong>
              <p>Khóa góc bay, tự do ngắm nhìn và chụp lại những kiệt tác Lego từ trên cao.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default OpenWorldView
