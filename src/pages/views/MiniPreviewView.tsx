import React from 'react'
import MiniAircraftCanvas from '../components/MiniAircraftCanvas.tsx'

interface MiniPreviewViewProps {
  experience?: any
  selectedColor: string
  onColorChange: (colorHex: string) => void
  onTakeoffWithColor: (colorHex: string) => void
  onSwitchTab: (tab: 'modes' | 'about') => void
}

export const MiniPreviewView: React.FC<MiniPreviewViewProps> = ({
  experience,
  selectedColor,
  onColorChange,
  onTakeoffWithColor,
  onSwitchTab,
}) => {
  return (
    <div className="mini-preview-view">
      {/* Giới thiệu tính năng xem trước mô hình 3D */}
      <div className="preview-intro-banner">
        <div className="preview-badge">
          <span>🔬 PHÒNG THỬ NGHIỆM KHÍ ĐỘNG HỌC 3D (3D DEMO SHOWCASE)</span>
        </div>
        <h3>Trực Quan Hóa Mô Hình Phi Cơ Lego 3D</h3>
        <p>
          Khám phá cận cảnh từng khối gạch cấu thành chiếc phi cơ thám hiểm của bạn.
          Bạn có thể xoay 360 độ, kiểm tra luồng phản lực neon, đổi màu sơn yêu thích và áp dụng ngay vào chuyến bay thực tế!
        </p>
      </div>

      {/* Canvas 3D tương tác */}
      <MiniAircraftCanvas
        experience={experience}
        selectedColor={selectedColor}
        onColorChange={onColorChange}
        onTakeoffWithColor={onTakeoffWithColor}
      />

      {/* Thông tin thiết kế & cấu trúc gạch Lego */}
      <div className="aircraft-lore-box">
        <h4>CẤU TRÚC KỸ THUẬT PHI CƠ THÁM HIỂM</h4>
        <div className="lore-items-grid">
          <div className="lore-item">
            <span className="lore-icon">🧱</span>
            <div>
              <strong>Thiết kế khí động học Lego Voxel</strong>
              <p>Thân máy bay được ghép từ hơn 180 khối gạch lego siêu nhẹ với bề mặt nhẵn bóng giảm thiểu tối đa lực cản gió.</p>
            </div>
          </div>
          <div className="lore-item">
            <span className="lore-icon">⚡</span>
            <div>
              <strong>Động cơ Twin-Turbine thế hệ mới</strong>
              <p>Ống xả phản lực kép trang bị tinh thể phát quang mang lại gia tốc tức thời khi rẽ ngoặt hoặc tăng tốc đột ngột.</p>
            </div>
          </div>
          <div className="lore-item">
            <span className="lore-icon">🎯</span>
            <div>
              <strong>Hệ thống định vị toàn cảnh</strong>
              <p>Tích hợp radar thu nhỏ đồng bộ trực tiếp với bản đồ mini ở góc phải màn hình, hỗ trợ phát hiện các kỳ quan cổ đại.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default MiniPreviewView
