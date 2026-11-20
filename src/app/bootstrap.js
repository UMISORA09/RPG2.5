import Experience from './Experience.js'
import { attachPlatform } from './platform.js'

/**
 * @param {HTMLCanvasElement} canvas
 */
export async function bootstrap(canvas) {
  const experience = new Experience(canvas)

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    window.__experience = experience
  }

  try {
    const platform = await attachPlatform(experience)
    platform.reportLoading()
    await experience.init({ deferReady: true })
    experience.start()
    await experience.present()
    platform.reportLoaded()
  }
  catch (err) {
    experience.dispose()
    if (typeof window !== 'undefined' && window.__experience === experience) {
      delete window.__experience
    }
    console.error(err)
    const uiRoot = document.getElementById('explorer-ui')
    if (uiRoot) {
      uiRoot.className = 'startup-error'
      uiRoot.innerHTML = '<div class="surface error-card" role="alert"><span class="eyebrow">THÁM HIỂM LEGO</span><h1>Thế giới chưa sẵn sàng</h1><p>Không thể tải khung cảnh, vui lòng kiểm tra xem trình duyệt có hỗ trợ WebGPU hay không rồi thử lại.</p><button type="button" class="primary-button">Tải lại</button></div>'
      uiRoot.querySelector('button').addEventListener('click', () => window.location.reload())
    }
  }
}
