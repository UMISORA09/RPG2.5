/**
 * Logic thuần cho chế độ không chiến (Dogfight) — BRICKLAND
 * Hoàn toàn độc lập, không phụ thuộc THREE.js, kiểm thử được bằng node --test.
 */

export function normalizeAngle(angle) {
  let a = (angle + Math.PI) % (Math.PI * 2)
  if (a < 0) a += Math.PI * 2
  return a - Math.PI
}

export function normalizeDogfightConfig(config = {}) {
  return {
    enabled: config.enabled ?? true,
    botCount: Number.isFinite(config.botCount) ? Math.max(1, config.botCount) : 3,
    playerMaxHealth: Number.isFinite(config.playerMaxHealth) ? config.playerMaxHealth : 100,
    botMaxHealth: Number.isFinite(config.botMaxHealth) ? config.botMaxHealth : 50,
    playerDamage: Number.isFinite(config.playerDamage) ? config.playerDamage : 10,
    botDamage: Number.isFinite(config.botDamage) ? config.botDamage : 8,
    bulletLifetime: Number.isFinite(config.bulletLifetime) ? config.bulletLifetime : 1.2,
    bulletSpeed: Number.isFinite(config.bulletSpeed) ? config.bulletSpeed : 24,
    hitRadius: Number.isFinite(config.hitRadius) ? config.hitRadius : 1.2,
    botAttackRange: Number.isFinite(config.botAttackRange) ? config.botAttackRange : 16,
    botAttackAngle: Number.isFinite(config.botAttackAngle) ? config.botAttackAngle : Math.PI / 4, // 45°
    botFireCooldown: Number.isFinite(config.botFireCooldown) ? config.botFireCooldown : 1.2,
    playerFireCooldown: Number.isFinite(config.playerFireCooldown) ? config.playerFireCooldown : 0.18,
    botSpeed: Number.isFinite(config.botSpeed) ? config.botSpeed : 5.8,
    botTurnSpeed: Number.isFinite(config.botTurnSpeed) ? config.botTurnSpeed : 2.2,
    botRespawnDelay: Number.isFinite(config.botRespawnDelay) ? config.botRespawnDelay : 4.0,
    playerRespawnDelay: Number.isFinite(config.playerRespawnDelay) ? config.playerRespawnDelay : 3.0,
    botRespawnMinDist: Number.isFinite(config.botRespawnMinDist) ? config.botRespawnMinDist : 12,
    botRespawnMaxDist: Number.isFinite(config.botRespawnMaxDist) ? config.botRespawnMaxDist : 18,
    scorePerKill: Number.isFinite(config.scorePerKill) ? config.scorePerKill : 100,
  }
}

export function createDogfightState(options = {}, userConfig = {}) {
  const config = normalizeDogfightConfig(userConfig)
  const playerPos = options.playerPosition ?? { x: 0, y: 5.5, z: 0 }
  const playerYaw = options.playerYaw ?? 0

  const botColors = ['red', 'orange', 'purple']
  const bots = []
  for (let i = 0; i < config.botCount; i++) {
    const angle = (i * 2 * Math.PI) / config.botCount + Math.PI / 6
    const dist = 14 + (i % 2) * 2
    bots.push({
      id: `bot_${i + 1}`,
      name: `Bot ${i === 0 ? 'Đỏ' : i === 1 ? 'Cam' : 'Tím'}`,
      color: botColors[i % botColors.length],
      x: playerPos.x + Math.cos(angle) * dist,
      y: playerPos.y ?? 5.5,
      z: playerPos.z + Math.sin(angle) * dist,
      yaw: angle + Math.PI,
      speed: config.botSpeed,
      health: config.botMaxHealth,
      maxHealth: config.botMaxHealth,
      isAlive: true,
      fireTimer: 0.6 + i * 0.4,
      respawnTimer: 0,
    })
  }

  return {
    config,
    player: {
      health: config.playerMaxHealth,
      maxHealth: config.playerMaxHealth,
      isAlive: true,
      respawnTimer: 0,
      fireTimer: 0,
      x: playerPos.x,
      y: playerPos.y ?? 5.5,
      z: playerPos.z,
      yaw: playerYaw,
    },
    bots,
    bullets: [],
    score: 0,
    kills: 0,
    events: [],
    _nextBulletId: 1,
  }
}

export function stepDogfight(state, input = {}, delta = 0.016) {
  const dt = Math.max(0, delta)
  const config = state.config
  state.events = []

  // 1. Cập nhật vị trí & trạng thái Người chơi
  if (state.player.isAlive) {
    if (input.playerPosition) {
      state.player.x = input.playerPosition.x
      state.player.y = input.playerPosition.y ?? state.player.y
      state.player.z = input.playerPosition.z
    }
    if (Number.isFinite(input.playerYaw)) {
      state.player.yaw = input.playerYaw
    }

    if (state.player.fireTimer > 0) {
      state.player.fireTimer -= dt
    }

    if (input.isFiring && state.player.fireTimer <= 0) {
      const yaw = state.player.yaw
      const speed = config.bulletSpeed
      state.bullets.push({
        id: state._nextBulletId++,
        owner: 'player',
        x: state.player.x + Math.cos(yaw) * 0.8,
        y: state.player.y,
        z: state.player.z + Math.sin(yaw) * 0.8,
        vx: Math.cos(yaw) * speed,
        vz: Math.sin(yaw) * speed,
        life: config.bulletLifetime,
        damage: config.playerDamage,
      })
      state.player.fireTimer = config.playerFireCooldown
      state.events.push({ type: 'player_shoot', x: state.player.x, z: state.player.z })
    }
  }
  else {
    state.player.respawnTimer -= dt
    if (state.player.respawnTimer <= 0) {
      state.player.isAlive = true
      state.player.health = config.playerMaxHealth
      state.events.push({ type: 'player_respawn' })
    }
  }

  // 2. Cập nhật Bot AI
  for (const bot of state.bots) {
    if (bot.isAlive) {
      const dx = state.player.x - bot.x
      const dz = state.player.z - bot.z
      const dist = Math.hypot(dx, dz)
      const targetAngle = Math.atan2(dz, dx)

      // Xoay dần về phía người chơi
      const angleDiff = normalizeAngle(targetAngle - bot.yaw)
      const maxTurn = config.botTurnSpeed * dt
      if (Math.abs(angleDiff) <= maxTurn) {
        bot.yaw = targetAngle
      }
      else {
        bot.yaw += Math.sign(angleDiff) * maxTurn
      }
      bot.yaw = normalizeAngle(bot.yaw)

      // Bay thẳng theo góc bot.yaw
      bot.x += Math.cos(bot.yaw) * bot.speed * dt
      bot.z += Math.sin(bot.yaw) * bot.speed * dt
      bot.y = state.player.y ?? 5.5

      // Khai hỏa khi trong tầm bắn 16 và trong góc hình nón trước mặt
      const forwardAngleDiff = Math.abs(normalizeAngle(targetAngle - bot.yaw))
      const canShoot = dist <= config.botAttackRange && forwardAngleDiff <= config.botAttackAngle && state.player.isAlive

      if (bot.fireTimer > 0) {
        bot.fireTimer -= dt
      }

      if (canShoot && bot.fireTimer <= 0) {
        const yaw = bot.yaw
        const speed = config.bulletSpeed * 0.9
        state.bullets.push({
          id: state._nextBulletId++,
          owner: 'bot',
          botId: bot.id,
          x: bot.x + Math.cos(yaw) * 0.8,
          y: bot.y,
          z: bot.z + Math.sin(yaw) * 0.8,
          vx: Math.cos(yaw) * speed,
          vz: Math.sin(yaw) * speed,
          life: config.bulletLifetime,
          damage: config.botDamage,
        })
        bot.fireTimer = config.botFireCooldown
        state.events.push({ type: 'bot_shoot', botId: bot.id })
      }
    }
    else {
      bot.respawnTimer -= dt
      if (bot.respawnTimer <= 0) {
        bot.isAlive = true
        bot.health = bot.maxHealth
        const respawnAngle = Math.random() * Math.PI * 2
        const respawnDist = config.botRespawnMinDist + Math.random() * (config.botRespawnMaxDist - config.botRespawnMinDist)
        bot.x = state.player.x + Math.cos(respawnAngle) * respawnDist
        bot.z = state.player.z + Math.sin(respawnAngle) * respawnDist
        bot.yaw = normalizeAngle(respawnAngle + Math.PI)
        bot.fireTimer = config.botFireCooldown * 0.5
        state.events.push({ type: 'bot_respawn', botId: bot.id })
      }
    }
  }

  // 3. Cập nhật Đạn & Va chạm
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt
    bullet.z += bullet.vz * dt
    bullet.life -= dt

    if (bullet.life <= 0) continue

    if (bullet.owner === 'player') {
      for (const bot of state.bots) {
        if (!bot.isAlive) continue
        const dist = Math.hypot(bullet.x - bot.x, bullet.z - bot.z)
        if (dist <= config.hitRadius) {
          bot.health = Math.max(0, bot.health - bullet.damage)
          bullet.life = 0
          state.events.push({ type: 'hit_bot', botId: bot.id, damage: bullet.damage })
          if (bot.health <= 0) {
            bot.isAlive = false
            bot.respawnTimer = config.botRespawnDelay
            state.score += config.scorePerKill
            state.kills += 1
            state.events.push({ type: 'bot_killed', botId: bot.id, score: state.score, kills: state.kills })
          }
          break
        }
      }
    }
    else if (bullet.owner === 'bot') {
      if (state.player.isAlive) {
        const dist = Math.hypot(bullet.x - state.player.x, bullet.z - state.player.z)
        if (dist <= config.hitRadius) {
          state.player.health = Math.max(0, state.player.health - bullet.damage)
          bullet.life = 0
          state.events.push({ type: 'hit_player', damage: bullet.damage })
          if (state.player.health <= 0) {
            state.player.isAlive = false
            state.player.respawnTimer = config.playerRespawnDelay
            state.events.push({ type: 'player_killed' })
          }
        }
      }
    }
  }

  // Thu hồi đạn đã hết hạn hoặc va chạm
  state.bullets = state.bullets.filter(b => b.life > 0)

  return state
}
