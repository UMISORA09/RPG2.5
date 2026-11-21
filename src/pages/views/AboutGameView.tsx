import React from 'react'

interface AboutGameViewProps {
  onStartGame: () => void
  onSwitchTab: (tab: 'modes' | 'preview3d') => void
}

export const AboutGameView: React.FC<AboutGameViewProps> = ({ onStartGame, onSwitchTab }) => {
  return (
    <div className="about-game-view">
      {/* Giới thiệu tổng quan sản phẩm */}
      <div className="about-hero-box">
        <div className="about-hero-tag">
          <span className="sparkle">✨</span> SẢN PHẨM GAME 3D WEBGPU THẾ HỆ MỚI
        </div>
        <h3>Thế Giới Lego Kỳ Diệu Dưới Cánh Bay Tí Hon</h3>
        <p>
          <b>Brickland</b> là tựa game phiêu lưu ngắm cảnh thế giới mở độc đáo, được xây dựng hoàn toàn
          từ hàng vạn viên gạch Lego sống động. Người chơi sẽ hóa thân thành phi công điều khiển chiếc máy bay
          nhỏ nhắn, tự do lướt qua những cánh rừng rực rỡ, hẻm núi nham thạch kỳ bí, đồi cát sa mạc lấp lánh và
          những công trình cổ xưa ẩn giấu.
        </p>
      </div>

      {/* 4 Trụ cột công nghệ nổi bật của sản phẩm */}
      <div className="tech-pillars-grid">
        <div className="tech-pillar-card">
          <div className="pillar-icon">⚡</div>
          <h4>Công nghệ WebGPU & Three.js TSL</h4>
          <p>
            Ứng dụng kiến trúc đồ họa WebGPU tiên tiến kết hợp ngôn ngữ shader Three.js TSL, mang lại
            hiệu năng 60 FPS mượt mà cùng hiệu ứng ánh sáng, bóng đổ mềm và khúc xạ bề mặt gạch chân thực ngay trên trình duyệt.
          </p>
        </div>

        <div className="tech-pillar-card">
          <div className="pillar-icon">🧱</div>
          <h4>Voxel Procedural Terrain</h4>
          <p>
            Địa hình dạng khối gạch được sinh theo thuật toán thủ tục (Procedural Generation) với Web Workers chạy ngầm,
            cho phép thế giới mở rộng vô tận không tải trang và không gây nghẽn khung hình.
          </p>
        </div>

        <div className="tech-pillar-card">
          <div className="pillar-icon">🌿</div>
          <h4>7 Miền Sinh Thái Đa Dạng</h4>
          <p>
            Khí hậu và thảm thực vật chuyển tiếp tự nhiên: từ Rừng già lá kim, Rừng thu rực sắc vàng, Đồng cỏ hoa thơm ngát,
            cho đến Sa mạc Cổng Mặt Trời và Thung lũng nham thạch rực lửa.
          </p>
        </div>

        <div className="tech-pillar-card">
          <div className="pillar-icon">🎧</div>
          <h4>Âm Thanh Thiên Nhiên 3D</h4>
          <p>
            Hệ thống âm thanh tương tác theo thời gian thực mô phỏng tiếng gió rít qua cánh máy bay, tiếng chim rừng
            và tiếng sóng vỗ theo vị trí không gian 3D của người chơi.
          </p>
        </div>
      </div>

      {/* Bảng so sánh thông số kỹ thuật sản phẩm */}
      <div className="specs-table-card">
        <div className="specs-table-header">
          <strong>THÔNG SỐ KỸ THUẬT & TRẢI NGHIỆM SẢN PHẨM</strong>
        </div>
        <div className="specs-row">
          <span className="spec-label">Nền tảng</span>
          <span className="spec-val">Trình duyệt Web hiện đại (Chrome, Edge, Firefox, Safari)</span>
        </div>
        <div className="specs-row">
          <span className="spec-label">Cài đặt</span>
          <span className="spec-val highlight-green">0 MB · Không cần cài đặt, mở là chơi ngay</span>
        </div>
        <div className="specs-row">
          <span className="spec-label">Tốc độ khung hình</span>
          <span className="spec-val">Tối ưu 60 FPS ổn định với WebGPU Renderer</span>
        </div>
        <div className="specs-row">
          <span className="spec-label">Cơ chế điều khiển</span>
          <span className="spec-val">Bàn phím W-A-S-D trực quan, cần gạt cảm ứng Touch Joystick</span>
        </div>
        <div className="specs-row">
          <span className="spec-label">Bản quyền & Công nghệ</span>
          <span className="spec-val">Mã nguồn mở RPG2.5 · Three.js r185 · React 19 · Vite 5</span>
        </div>
      </div>

      {/* Nút hành động kêu gọi */}
      <div className="about-action-footer">
        <button
          type="button"
          className="motion-secondary-btn view-3d-btn"
          onClick={() => onSwitchTab('preview3d')}
        >
          <span>✈️ Khám phá mô hình 3D thu nhỏ</span>
          <span className="btn-arrow">→</span>
        </button>
        <button
          type="button"
          className="glow-action-button compact-btn"
          onClick={onStartGame}
        >
          <span className="btn-icon-aura">🚀</span>
          <span className="btn-copy">
            <strong>Vào game bay ngay</strong>
            <small>Trải nghiệm trọn vẹn thế giới Lego</small>
          </span>
          <span className="btn-arrow-glow">→</span>
        </button>
      </div>
    </div>
  )
}
export default AboutGameView
