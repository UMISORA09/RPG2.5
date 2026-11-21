import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const COLOR_PALETTE = [
  { id: 'yellow', name: 'Hoàng Gia Lego', hex: '#f59e0b', emissive: '#78350f' },
  { id: 'red', name: 'Hỏa Long Nitro', hex: '#ef4444', emissive: '#7f1d1d' },
  { id: 'blue', name: 'Thiên Hà Cyber', hex: '#2563eb', emissive: '#1e3a8a' },
  { id: 'green', name: 'Lục Bảo Rừng Già', hex: '#10b981', emissive: '#064e3b' },
  { id: 'black', name: 'Bóng Đêm Stealth', hex: '#1e293b', emissive: '#0f172a' },
  { id: 'white', name: 'Bạch Mã Tuyết Sơn', hex: '#f8fafc', emissive: '#475569' },
]

interface MiniAircraftCanvasProps {
  experience?: any
  selectedColor?: string
  onColorChange?: (colorHex: string) => void
  onTakeoffWithColor?: (colorHex: string) => void
}

export const MiniAircraftCanvas: React.FC<MiniAircraftCanvasProps> = ({
  experience,
  selectedColor = '#f59e0b',
  onColorChange,
  onTakeoffWithColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentColor, setCurrentColor] = useState(selectedColor)
  const [autoRotate, setAutoRotate] = useState(true)
  const [thrusterGlow, setThrusterGlow] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)

  const aircraftGroupRef = useRef<THREE.Group | null>(null)
  const thrustersRef = useRef<THREE.Mesh[]>([])
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // Lưu trữ màu được chọn
  const handleSelectColor = (hex: string) => {
    setCurrentColor(hex)
    onColorChange?.(hex)
    applyColorToMiniModel(hex)
  }

  // Áp dụng màu cho mô hình trong mini preview
  const applyColorToMiniModel = useCallback((hex: string) => {
    if (!aircraftGroupRef.current) return
    const targetColor = new THREE.Color(hex)

    aircraftGroupRef.current.traverse((node: any) => {
      if (node.isMesh && node.material) {
        // Tránh đổi màu kính chắn gió hoặc vòi phun phản lực đen
        const matName = (node.material.name || '').toLowerCase()
        const nodeName = (node.name || '').toLowerCase()
        if (matName.includes('glass') || matName.includes('windshield') || nodeName.includes('glass')) {
          return
        }
        if (nodeName.includes('engine') || nodeName.includes('thruster') || matName.includes('emissive')) {
          return
        }

        if (Array.isArray(node.material)) {
          node.material = node.material.map((m: any) => {
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
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let animationFrameId: number
    const width = container.clientWidth || 400
    const height = 300

    // Khởi tạo Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 1.35, 2.7)
    camera.lookAt(0, 0.35, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Ánh sáng nổi bật phong cách Lego Studio
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff7ea, 2.2)
    keyLight.position.set(3, 5, 4)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8)
    rimLight.position.set(-3, 2, -3)
    scene.add(rimLight)

    const bottomGlow = new THREE.PointLight(0x22c55e, 1.0, 6)
    bottomGlow.position.set(0, 0.1, 0)
    scene.add(bottomGlow)

    // Nhóm xoay trung tâm chứa máy bay & bệ đỡ Lego
    const rootPivot = new THREE.Group()
    scene.add(rootPivot)

    // Bục đỡ Lego (Pedestal)
    const pedestalGroup = new THREE.Group()
    const baseGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.25, 32)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.2,
    })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    baseMesh.position.y = -0.125
    baseMesh.receiveShadow = true
    pedestalGroup.add(baseMesh)

    // 8 Nút gạch Lego (Studs) trên bục
    const studGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16)
    const studMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
    })
    const studRadius = 0.95
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const stud = new THREE.Mesh(studGeo, studMat)
      stud.position.set(Math.cos(angle) * studRadius, 0.06, Math.sin(angle) * studRadius)
      stud.castShadow = true
      pedestalGroup.add(stud)
    }

    // Vòng phát sáng xung quanh chân bục
    const ringGeo = new THREE.RingGeometry(1.65, 1.75, 36)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.y = -0.24
    pedestalGroup.add(ringMesh)

    rootPivot.add(pedestalGroup)

    // Nhóm chứa máy bay bay lơ lửng phía trên bục
    const aircraftGroup = new THREE.Group()
    aircraftGroup.position.y = 0.6
    rootPivot.add(aircraftGroup)
    aircraftGroupRef.current = aircraftGroup

    // Thêm ngọn lửa phản lực phụ trợ phía sau
    const thrusterGeo = new THREE.ConeGeometry(0.1, 0.35, 16)
    thrusterGeo.rotateX(Math.PI / 2)
    const thrusterMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    })
    const leftFlame = new THREE.Mesh(thrusterGeo, thrusterMat)
    const rightFlame = new THREE.Mesh(thrusterGeo, thrusterMat.clone())
    leftFlame.position.set(-0.25, 0.05, -0.7)
    rightFlame.position.set(0.25, 0.05, -0.7)
    aircraftGroup.add(leftFlame)
    aircraftGroup.add(rightFlame)
    thrustersRef.current = [leftFlame, rightFlame]

    // Hàm gắn model máy bay
    const setupAircraftModel = (sourceScene: THREE.Group) => {
      const cloned = sourceScene.clone(true)
      cloned.rotation.y = Math.PI / 2 // Căn chỉnh hướng phi cơ
      cloned.scale.setScalar(1.9)
      cloned.traverse((node: any) => {
        if (node.isMesh) {
          node.castShadow = true
          node.receiveShadow = true
        }
      })
      aircraftGroup.add(cloned)
      applyColorToMiniModel(currentColor)
      setIsLoading(false)
    }

    // Kiểm tra xem model đã được load trong Experience chưa
    const preloadedModel = experience?.resources?.items?.playerAircraftModel?.scene
    if (preloadedModel) {
      setupAircraftModel(preloadedModel)
    } else {
      // Fallback: Tải từ GLTFLoader
      const loader = new GLTFLoader()
      loader.load(
        'model/player/fly.glb',
        (gltf) => {
          setupAircraftModel(gltf.scene)
        },
        undefined,
        (err) => {
          console.warn('[MiniAircraftCanvas] Failed to load GLTF, creating procedural proxy:', err)
          // Fallback máy bay lego hình khối procedural
          const proxyGroup = new THREE.Group()
          const fuselage = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.35, 1.2),
            new THREE.MeshStandardMaterial({ color: currentColor })
          )
          const wing = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.08, 0.4),
            new THREE.MeshStandardMaterial({ color: currentColor })
          )
          wing.position.y = 0.05
          proxyGroup.add(fuselage)
          proxyGroup.add(wing)
          aircraftGroup.add(proxyGroup)
          setIsLoading(false)
        }
      )
    }

    // Xử lý tương tác kéo xoay bằng chuột & cảm ứng
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let targetRotationY = 0.4
    let targetRotationX = 0.15

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      targetRotationY += deltaX * 0.012
      targetRotationX += deltaY * 0.008
      targetRotationX = Math.max(-0.25, Math.min(0.6, targetRotationX))
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onPointerUp = () => {
      isDragging = false
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return
      const w = containerRef.current.clientWidth
      const h = 300
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Render loop
    const clock = new THREE.Clock()
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      const delta = clock.getDelta()

      // Tự động xoay chậm nếu bật autoRotate và không kéo chuột
      if (autoRotate && !isDragging) {
        targetRotationY += 0.008
      }

      // Xoay với quán tính mượt
      rootPivot.rotation.y += (targetRotationY - rootPivot.rotation.y) * 0.1
      rootPivot.rotation.x += (targetRotationX - rootPivot.rotation.x) * 0.1

      // Hiệu ứng bập bênh lượn sóng của máy bay (Hover Bobbing)
      if (aircraftGroupRef.current) {
        aircraftGroupRef.current.position.y = 0.6 + Math.sin(elapsed * 2.2) * 0.06
        aircraftGroupRef.current.rotation.z = Math.sin(elapsed * 1.5) * 0.04
        aircraftGroupRef.current.rotation.x = Math.cos(elapsed * 1.8) * 0.03
      }

      // Nhấp nháy luồng phản lực
      if (thrusterGlow) {
        const flamePulse = 0.8 + Math.sin(elapsed * 25) * 0.25
        thrustersRef.current.forEach((t) => {
          t.visible = true
          t.scale.set(flamePulse, flamePulse, flamePulse * 1.3)
        })
      } else {
        thrustersRef.current.forEach((t) => {
          t.visible = false
        })
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [experience, applyColorToMiniModel, autoRotate, thrusterGlow])

  // Cập nhật zoom camera
  useEffect(() => {
    if (!cameraRef.current) return
    cameraRef.current.position.z = 2.7 / zoomLevel
    cameraRef.current.updateProjectionMatrix()
  }, [zoomLevel])

  return (
    <div className="mini-preview-card" ref={containerRef}>
      <div className="mini-preview-header">
        <div className="mini-preview-title">
          <span className="mini-icon">✈️</span>
          <div>
            <strong>MÔ HÌNH PHI CƠ LEGO 3D THU NHỎ</strong>
            <small>Kéo chuột để xoay 360° · Chọn màu sơn yêu thích</small>
          </div>
        </div>
        <div className="mini-preview-badges">
          <span className="badge-3d">WebGL 3D Demo</span>
          <span className="badge-scale">Tỉ lệ 1:24</span>
        </div>
      </div>

      <div className="mini-canvas-wrapper">
        <canvas ref={canvasRef} className="mini-aircraft-canvas" />
        {isLoading && (
          <div className="mini-canvas-loading">
            <span className="spinner" />
            <p>Đang chuẩn bị mô hình Lego 3D…</p>
          </div>
        )}

        {/* Nút điều khiển nhanh trên Canvas */}
        <div className="canvas-overlay-controls">
          <button
            type="button"
            className={`canvas-btn ${autoRotate ? 'is-active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Tạm dừng xoay' : 'Tự động xoay 360°'}
          >
            🔄 {autoRotate ? 'Đang xoay' : 'Xoay'}
          </button>
          <button
            type="button"
            className={`canvas-btn ${thrusterGlow ? 'is-active' : ''}`}
            onClick={() => setThrusterGlow(!thrusterGlow)}
            title="Bật/Tắt luồng phản lực"
          >
            🔥 {thrusterGlow ? 'Phản lực BẬT' : 'Phản lực TẮT'}
          </button>
          <div className="zoom-btn-group">
            <button
              type="button"
              className="canvas-btn zoom-btn"
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
              title="Phóng to"
            >
              ➕
            </button>
            <button
              type="button"
              className="canvas-btn zoom-btn"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
              title="Thu nhỏ"
            >
              ➖
            </button>
          </div>
        </div>
      </div>

      {/* Bảng chọn màu sắc phi cơ */}
      <div className="aircraft-color-selector">
        <span className="selector-label">Màu sơn phi cơ:</span>
        <div className="color-chips-row">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`color-chip ${currentColor === c.hex ? 'is-selected' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => handleSelectColor(c.hex)}
              title={c.name}
              aria-label={c.name}
            >
              {currentColor === c.hex && <span className="chip-check">✓</span>}
            </button>
          ))}
        </div>
        <span className="selected-color-name">
          {COLOR_PALETTE.find((c) => c.hex === currentColor)?.name || 'Tùy chỉnh'}
        </span>
      </div>

      {/* Bảng thông số phi cơ */}
      <div className="aircraft-specs-grid">
        <div className="spec-item">
          <small>VẬT LIỆU</small>
          <strong>Nhựa ABS Lego</strong>
        </div>
        <div className="spec-item">
          <small>HỆ ĐỘNG LỰC</small>
          <strong>Twin-Jet Phản lực</strong>
        </div>
        <div className="spec-item">
          <small>TỐC ĐỘ TỐI ĐA</small>
          <strong>28 km/h (Lego)</strong>
        </div>
        <div className="spec-item">
          <small>ĐỘ CƠ ĐỘNG</small>
          <strong>Khí động học 96%</strong>
        </div>
      </div>

      {/* Nút Áp dụng màu & Bay ngay */}
      <button
        type="button"
        className="apply-color-takeoff-btn"
        onClick={() => onTakeoffWithColor?.(currentColor)}
      >
        <span>🚀 Áp dụng màu sơn & Cất cánh bay ngay</span>
        <span className="btn-arrow">→</span>
      </button>
    </div>
  )
}
export default MiniAircraftCanvas
