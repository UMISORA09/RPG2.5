/**
 * Logic thuần cho chế độ không chiến (Dogfight) — BRICKLAND
 * Hoàn toàn độc lập, không phụ thuộc THREE.js, kiểm thử được bằng node --test.
 */

export function normalizeAngle(angle) {
  let a = (angle + Math.PI) % (Math.PI * 2)
  if (a < 0) a += Math.PI * 2
  return a - Math.PI
}

export const BOT_TYPE_DEFS = {
  easy: {
    type: 'easy',
    name: 'Bot Dễ (Đỏ)',
    color: 'red',
    maxHealth: 40,
    speedMultiplier: 0.88,
    turnSpeedMultiplier: 0.65,
    fireCooldown: 1.8,
  },
  normal: {
    type: 'normal',
    name: 'Bot Thường (Cam)',
    color: 'orange',
    maxHealth: 50,
    speedMultiplier: 1.0,
    turnSpeedMultiplier: 1.0,
    fireCooldown: 1.2,
  },
  hard: {
    type: 'hard',
    name: 'Bot Khó (Tím)',
    color: 'purple',
    maxHealth: 70,
    speedMultiplier: 1.2, // Nhanh hơn 20%
    turnSpeedMultiplier: 1.35,
    fireCooldown: 1.0,
  },
}

export function calculateDifficulty(kills = 0) {
  const tier = Math.floor(Math.max(0, kills) / 5)
  const speedBonus = Math.min(30, tier * 5) // +5% mỗi 5 kill, tối đa +30%
  const multiplier = 1 + speedBonus / 100
  const level = 1 + tier
  return {
    level,
    tier,
    speedBonus,
    multiplier,
  }
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

  const botTypeKeys = ['easy', 'normal', 'hard']
  const bots = []
  for (let i = 0; i < config.botCount; i++) {
    const typeKey = botTypeKeys[i % botTypeKeys.length]
    const def = BOT_TYPE_DEFS[typeKey]
    const angle = (i * 2 * Math.PI) / config.botCount + Math.PI / 6
    const dist = 14 + (i % 2) * 2

    bots.push({
      id: `bot_${i + 1}`,
      type: def.type,
      name: def.name,
      color: def.color,
      x: playerPos.x + Math.cos(angle) * dist,
      y: playerPos.y ?? 5.5,
      z: playerPos.z + Math.sin(angle) * dist,
      yaw: angle + Math.PI,
      baseSpeed: config.botSpeed * def.speedMultiplier,
      speed: config.botSpeed * def.speedMultiplier,
      turnSpeed: config.botTurnSpeed * def.turnSpeedMultiplier,
      health: def.maxHealth,
      maxHealth: def.maxHealth,
      isAlive: true,
      isExploding: false,
      explosionTimer: 0,
      fireTimer: 0.6 + i * 0.4,
      fireCooldown: def.fireCooldown,
      respawnTimer: 0,
      isDodging: false,
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
    difficulty: calculateDifficulty(0),
    events: [],
    _nextBulletId: 1,
  }
}

export function stepDogfight(state, input = {}, delta = 0.016) {
  const dt = Math.max(0, delta)
  const config = state.config
  state.events = []

  // Cập nhật độ khó dựa trên số kills
  state.difficulty = calculateDifficulty(state.kills)

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

  // Kiểm tra đội hình: nếu cả 3 bot còn sống và ở ngoài tầm bắn 16, bay đội hình V
  const aliveBots = state.bots.filter(b => b.isAlive)
  const leaderBot = aliveBots[0]
  const distToPlayer = leaderBot ? Math.hypot(state.player.x - leaderBot.x, state.player.z - leaderBot.z) : 0
  const useFormation = aliveBots.length === 3 && distToPlayer > config.botAttackRange

  // 2. Cập nhật Bot AI
  for (let i = 0; i < state.bots.length; i++) {
    const bot = state.bots[i]

    if (bot.isAlive) {
      // Cập nhật tốc độ theo độ khó tăng dần
      bot.speed = bot.baseSpeed * state.difficulty.multiplier

      let targetX = state.player.x
      let targetZ = state.player.z
      bot.isDodging = false

      // Xử lý cơ chế đội hình khi mới xuất hiện ở xa tầm bắn
      if (useFormation && i > 0 && leaderBot) {
        // Wingman giữ vị trí chữ V sau cánh leader
        const side = i === 1 ? -3.5 : 3.5
        const back = -4.5
        const lx = Math.cos(leaderBot.yaw)
        const lz = Math.sin(leaderBot.yaw)
        // Perpendicular vector
        const px = -lz
        const pz = lx
        targetX = leaderBot.x + lx * back + px * side
        targetZ = leaderBot.z + lz * back + pz * side
      }
      // Khi tản ra vào tầm bắn: áp dụng hành vi từng loại bot
      else if (bot.type === 'hard') {
        // Bot Khó: né đạn khi có đạn tới gần trong 3 đơn vị
        let threatBullet = null
        let minBulletDist = 3.0

        for (const bullet of state.bullets) {
          if (bullet.owner !== 'player') continue
          const bDist = Math.hypot(bullet.x - bot.x, bullet.z - bot.z)
          if (bDist < minBulletDist) {
            // Kiểm tra đạn có đang bay hướng về bot không
            const toBotX = bot.x - bullet.x
            const toBotZ = bot.z - bullet.z
            const dot = bullet.vx * toBotX + bullet.vz * toBotZ
            if (dot > 0) {
              threatBullet = bullet
              minBulletDist = bDist
            }
          }
        }

        if (threatBullet) {
          // Né đạn bằng cách bẻ cua vuông góc với hướng đạn
          bot.isDodging = true
          const bulletAngle = Math.atan2(threatBullet.vz, threatBullet.vx)
          const dodgeDir = normalizeAngle(bot.yaw - bulletAngle) >= 0 ? 1 : -1
          const dodgeTargetAngle = normalizeAngle(bulletAngle + (Math.PI / 2) * dodgeDir)
          const angleDiff = normalizeAngle(dodgeTargetAngle - bot.yaw)
          bot.yaw = normalizeAngle(bot.yaw + Math.sign(angleDiff) * bot.turnSpeed * dt * 2.5)
        }
        else {
          // Bot Khó biết vòng ra sau lưng người chơi (flanking)
          const behindDist = 5.5
          targetX = state.player.x - Math.cos(state.player.yaw) * behindDist
          targetZ = state.player.z - Math.sin(state.player.yaw) * behindDist
        }
      }

      if (!bot.isDodging) {
        const dx = targetX - bot.x
        const dz = targetZ - bot.z
        const targetAngle = Math.atan2(dz, dx)

        // Xoay dần về hướng mục tiêu
        const angleDiff = normalizeAngle(targetAngle - bot.yaw)
        const maxTurn = bot.turnSpeed * dt
        if (Math.abs(angleDiff) <= maxTurn) {
          bot.yaw = targetAngle
        }
        else {
          bot.yaw += Math.sign(angleDiff) * maxTurn
        }
        bot.yaw = normalizeAngle(bot.yaw)
      }

      // Di chuyển theo góc bot.yaw
      bot.x += Math.cos(bot.yaw) * bot.speed * dt
      bot.z += Math.sin(bot.yaw) * bot.speed * dt
      bot.y = state.player.y ?? 5.5

      // Khai hỏa khi trong tầm bắn 16 và góc hình nón trước mặt
      const pDx = state.player.x - bot.x
      const pDz = state.player.z - bot.z
      const pDist = Math.hypot(pDx, pDz)
      const toPlayerAngle = Math.atan2(pDz, pDx)
      const forwardAngleDiff = Math.abs(normalizeAngle(toPlayerAngle - bot.yaw))
      const canShoot = pDist <= config.botAttackRange && forwardAngleDiff <= config.botAttackAngle && state.player.isAlive

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
        bot.fireTimer = bot.fireCooldown ?? config.botFireCooldown
        state.events.push({ type: 'bot_shoot', botId: bot.id })
      }
    }
    else {
      // Xử lý hiệu ứng nổ 0.5s trước khi ẩn hoàn toàn
      if (bot.isExploding) {
        bot.explosionTimer -= dt
        if (bot.explosionTimer <= 0) {
          bot.isExploding = false
        }
      }

      bot.respawnTimer -= dt
      if (bot.respawnTimer <= 0) {
        bot.isAlive = true
        bot.isExploding = false
        bot.health = bot.maxHealth
        const respawnAngle = Math.random() * Math.PI * 2
        const respawnDist = config.botRespawnMinDist + Math.random() * (config.botRespawnMaxDist - config.botRespawnMinDist)
        bot.x = state.player.x + Math.cos(respawnAngle) * respawnDist
        bot.z = state.player.z + Math.sin(respawnAngle) * respawnDist
        bot.yaw = normalizeAngle(respawnAngle + Math.PI)
        bot.fireTimer = (bot.fireCooldown ?? config.botFireCooldown) * 0.5
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
            bot.isExploding = true
            bot.explosionTimer = 0.5 // Hiện vụ nổ 0.5s rồi mới ẩn
            bot.respawnTimer = config.botRespawnDelay
            state.score += config.scorePerKill
            state.kills += 1
            state.difficulty = calculateDifficulty(state.kills)
            state.events.push({
              type: 'bot_killed',
              botId: bot.id,
              botType: bot.type,
              score: state.score,
              kills: state.kills,
              difficulty: state.difficulty,
            })
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
