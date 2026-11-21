import React, { useState } from 'react'
import { FeedbackData } from '../types.ts'

interface ContactViewProps {
  onStartGame: () => void
}

export const ContactView: React.FC<ContactViewProps> = ({ onStartGame }) => {
  const [formData, setFormData] = useState<FeedbackData>({
    name: '',
    email: '',
    category: 'feedback',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.message.trim()) {
      alert('Vui lòng điền họ tên và nội dung lời nhắn!')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmittedStatus('Cảm ơn bạn! Đóng góp ý kiến đã được gửi thành công đến đội ngũ phát triển Brickland.')
      setFormData({ name: '', email: '', category: 'feedback', message: '' })
    }, 600)
  }

  return (
    <div className="contact-view">
      {/* Tiêu đề phần liên hệ */}
      <div className="contact-hero-banner">
        <div className="contact-tag">
          <span>📬 KẾT NỐI VÀ HỖ TRỢ</span>
        </div>
        <h3>Liên Hệ & Góp Ý Phát Triển Game</h3>
        <p>
          Chúng tôi luôn lắng nghe phản hồi của người chơi để hoàn thiện thế giới Lego Brickland.
          Hãy gửi cho chúng tôi bất kỳ ý tưởng, báo lỗi hoặc đề xuất nào của bạn!
        </p>
      </div>

      <div className="contact-content-grid">
        {/* Form gửi liên hệ */}
        <div className="contact-form-panel">
          <h4>Gửi lời nhắn cho nhóm phát triển</h4>

          {submittedStatus ? (
            <div className="contact-success-box">
              <span className="success-icon">🎉</span>
              <p>{submittedStatus}</p>
              <button
                type="button"
                className="motion-secondary-btn"
                onClick={() => setSubmittedStatus(null)}
              >
                Gửi thêm ý kiến khác
              </button>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="contact-name">Họ và tên phi công <span className="req">*</span></label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Xuân Hòa..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-email">Email liên hệ <small>(để nhận phản hồi)</small></label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="email@example.com..."
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-category">Chủ đề đóng góp</label>
                <select
                  id="contact-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                >
                  <option value="feedback">💡 Góp ý tính năng mới</option>
                  <option value="bug">🐛 Báo lỗi máy bay / địa hình</option>
                  <option value="feature">🧱 Đề xuất loại gạch & vùng đất mới</option>
                  <option value="praise">❤️ Khen ngợi & Động viên tác giả</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contact-msg">Nội dung chi tiết <span className="req">*</span></label>
                <textarea
                  id="contact-msg"
                  rows={4}
                  required
                  placeholder="Chia sẻ cảm nhận, ý tưởng hoặc mô tả chi tiết lỗi bạn gặp phải..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="contact-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : '🚀 Gửi đóng góp ngay'}
              </button>
            </form>
          )}
        </div>

        {/* Thông tin kết nối & cộng đồng */}
        <div className="contact-info-panel">
          <div className="info-card">
            <span className="info-icon">🐙</span>
            <div>
              <strong>KHO MÃ NGUỒN GITHUB</strong>
              <p>Mã nguồn mở dự án trên GitHub</p>
              <a
                href="https://github.com/UMISORA09/RPG2.5"
                target="_blank"
                rel="noreferrer"
                className="external-link"
              >
                github.com/UMISORA09/RPG2.5 ↗
              </a>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">💬</span>
            <div>
              <strong>CỘNG ĐỒNG PHI CÔNG LEGO</strong>
              <p>Giao lưu, chia sẻ kỷ lục bay và hình ảnh chụp phong cảnh</p>
              <span className="community-tag">Kênh Discord & Diễn đàn</span>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📧</span>
            <div>
              <strong>EMAIL HỖ TRỢ TRỰC TIẾP</strong>
              <p>Hỗ trợ kỹ thuật & hợp tác phát triển</p>
              <span className="email-text">umisora09@github.com</span>
            </div>
          </div>

          <div className="info-card faq-card">
            <span className="info-icon">❓</span>
            <div>
              <strong>HỎI ĐÁP NHANH (FAQ)</strong>
              <small><b>Hỏi:</b> Game có mất phí không?</small>
              <p><b>Đáp:</b> Hoàn toàn miễn phí, không quảng cáo và mã nguồn mở.</p>
              <small><b>Hỏi:</b> Làm sao để lưu vị trí đã bay?</small>
              <p><b>Đáp:</b> Hãy đăng ký tài khoản phi công để tự động lưu số chuyến bay và 7 miền đất đã khám phá.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ContactView
