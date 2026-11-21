import * as THREE from 'three/webgpu'
import { createDogfightState, stepDogfight } from './dogfight.js'

const BOT_TINTS = {
  red: new THREE.Color('#e74c3c'),
  orange: new THREE.Color('#e67e22'),
  purple: new THREE.Color('#9b59b6'),
}

export default class DogfightSystem {
  /**
   * @param {import('../../app/Experience.js').default} experience
   * @param {object} [options]
   */
  constructor(experience, options = {}) {
    this.experience = experience
    this.group = new THREE.Group()
    this.group.name = 'DogfightSystem'

    this.worldConfig = options.config ?? experience.config ?? {}
    const dogfightConfig = this.worldConfig.dogfight ?? {}
    this.enabled = dogfightConfig.enabled !== false

    const initialPos = { x: 36, y: 5.5, z: 36 }
    this.state = createDogfightState({ playerPosition: initialPos, playerYaw: 0 }, dogfightConfig)

    this.botMeshes = new Map() // botId -> { group, root, model }
    this.bulletMeshes = new Map() // bulletId -> mesh
    this.bulletGroup = new THREE.Group()
    this.bulletGroup.name = 'DogfightBullets'
    this.group.add(this.bulletGroup)

    this.bulletGeo = new THREE.SphereGeometry(0.2, 8, 8)
    this.playerBulletMat = new THREE.MeshBasicMaterial({ color: 0xffe600 })
    this.botBulletMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 })

    this.disposed = false
    this.built = false

    this._buildBots()
  }

  _buildBots() {
    if (this.built || !this.enabled) return
    const asset = this.experience.resources?.items?.playerAircraftModel
    const sourceScene = asset?.scene
    if (!sourceScene) return

    for (const bot of this.state.bots) {
      const botGroup = new THREE.Group()
      botGroup.name = `Bot_${bot.id}`

      const model = sourceScene.clone(true)
      model.rotation.y = Math.PI / 2

      const tintColor = BOT_TINTS[bot.color] || BOT_TINTS.red
      model.traverse((node) => {
        if (node.isMesh && node.material) {
          if (Array.isArray(node.material)) {
            node.material = node.material.map(mat => {
              const m = mat.clone()
              if (m.color) m.color.lerp(tintColor, 0.72)
              return m
            })
          }
          else {
            const m = node.material.clone()
            if (m.color) m.color.lerp(tintColor, 0.72)
            node.material = m
          }
          node.castShadow = true
        }
      })

      botGroup.add(model)
      botGroup.position.set(bot.x, bot.y, bot.z)
      botGroup.rotation.y = bot.yaw
      this.group.add(botGroup)

      this.botMeshes.set(bot.id, { group: botGroup, model })
    }

    this.built = true
  }

  update() {
    if (this.disposed || !this.enabled) return
    if (!this.built) {
      this._buildBots()
    }

    const playerAircraft = this.experience.world?.playerAircraft
    const isPaused = this.experience.platformPaused
      || playerAircraft?.paused
      || Boolean(this.experience.ui?.isHomeScreen)
      || Boolean(this.experience.ui?.dialog?.open)

    if (isPaused) return

    const playerPos = playerAircraft?.state?.position ?? { x: 0, y: 5.5, z: 0 }
    const playerYaw = playerAircraft?.state?.yaw ?? 0
    const isFiring = playerAircraft?.input?.isFiring?.() ?? false

    const delta = this.experience.time?.getDelta?.() ?? 0.016

    stepDogfight(
      this.state,
      {
        playerPosition: playerPos,
        playerYaw,
        isFiring,
      },
      delta,
    )

    // Đồng bộ vị trí mô hình bot
    for (const bot of this.state.bots) {
      const meshEntry = this.botMeshes.get(bot.id)
      if (!meshEntry) continue
      const { group } = meshEntry
      group.visible = bot.isAlive
      if (bot.isAlive) {
        group.position.set(bot.x, bot.y, bot.z)
        group.rotation.y = bot.yaw
      }
    }

    // Đồng bộ đạn
    const activeBulletIds = new Set()
    for (const bullet of this.state.bullets) {
      activeBulletIds.add(bullet.id)
      let mesh = this.bulletMeshes.get(bullet.id)
      if (!mesh) {
        const mat = bullet.owner === 'player' ? this.playerBulletMat : this.botBulletMat
        mesh = new THREE.Mesh(this.bulletGeo, mat)
        mesh.name = `Bullet_${bullet.id}`
        this.bulletGroup.add(mesh)
        this.bulletMeshes.set(bullet.id, mesh)
      }
      mesh.position.set(bullet.x, bullet.y, bullet.z)
    }

    // Dọn các mesh đạn đã biến mất
    for (const [id, mesh] of this.bulletMeshes.entries()) {
      if (!activeBulletIds.has(id)) {
        this.bulletGroup.remove(mesh)
        this.bulletMeshes.delete(id)
      }
    }
  }

  getAliveBots() {
    if (!this.state?.bots) return []
    return this.state.bots.filter(b => b.isAlive)
  }

  getState() {
    return this.state
  }

  setVisible(visible) {
    this.group.visible = Boolean(visible)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true

    for (const [, entry] of this.botMeshes) {
      this.group.remove(entry.group)
      entry.model?.traverse?.(node => {
        if (node.isMesh) {
          if (Array.isArray(node.material)) node.material.forEach(m => m.dispose())
          else node.material?.dispose?.()
        }
      })
    }
    this.botMeshes.clear()

    for (const [, mesh] of this.bulletMeshes) {
      this.bulletGroup.remove(mesh)
    }
    this.bulletMeshes.clear()

    this.bulletGeo?.dispose?.()
    this.playerBulletMat?.dispose?.()
    this.botBulletMat?.dispose?.()

    this.group.clear()
  }
}
