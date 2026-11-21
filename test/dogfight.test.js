import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BOT_TYPE_DEFS,
  calculateDifficulty,
  createDogfightState,
  normalizeAngle,
  normalizeDogfightConfig,
  stepDogfight,
} from '../src/world/combat/dogfight.js'

test('normalizeDogfightConfig returns valid default combat rules', () => {
  const config = normalizeDogfightConfig()
  assert.equal(config.botCount, 3)
  assert.equal(config.playerMaxHealth, 100)
  assert.equal(config.botMaxHealth, 50)
  assert.equal(config.playerDamage, 10)
  assert.equal(config.botDamage, 8)
  assert.equal(config.bulletLifetime, 1.2)
  assert.equal(config.hitRadius, 1.2)
  assert.equal(config.botRespawnDelay, 4.0)
  assert.equal(config.playerRespawnDelay, 3.0)
  assert.equal(config.scorePerKill, 100)
})

test('createDogfightState initializes 3 bot types: Easy (40 HP), Normal (50 HP), Hard (70 HP)', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  assert.equal(state.player.health, 100)
  assert.equal(state.player.maxHealth, 100)
  assert.equal(state.player.isAlive, true)
  assert.equal(state.bots.length, 3)

  // Bot 1: Dễ
  assert.equal(state.bots[0].type, 'easy')
  assert.equal(state.bots[0].health, 40)
  assert.equal(state.bots[0].maxHealth, 40)

  // Bot 2: Thường
  assert.equal(state.bots[1].type, 'normal')
  assert.equal(state.bots[1].health, 50)
  assert.equal(state.bots[1].maxHealth, 50)

  // Bot 3: Khó (nhanh hơn 20%)
  assert.equal(state.bots[2].type, 'hard')
  assert.equal(state.bots[2].health, 70)
  assert.equal(state.bots[2].maxHealth, 70)
  assert.equal(state.bots[2].baseSpeed > state.bots[1].baseSpeed, true)
  assert.equal(Math.abs(state.bots[2].baseSpeed / state.bots[1].baseSpeed - 1.2) < 0.01, true)
})

test('Hard bot dodges incoming bullets within 3 units', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  const hardBot = state.bots.find(b => b.type === 'hard')
  assert.ok(hardBot)

  hardBot.x = 10
  hardBot.z = 0
  hardBot.yaw = Math.PI // pointing left towards player

  // Spawn player bullet at distance 2.5 flying directly towards hard bot
  state.bullets.push({
    id: 88,
    owner: 'player',
    x: 7.5,
    y: 5.5,
    z: 0,
    vx: 24,
    vz: 0,
    life: 1.0,
    damage: 10,
  })

  const initialYaw = hardBot.yaw
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.05)

  // Hard bot must detect threat and activate dodge steering
  assert.equal(hardBot.isDodging, true)
  assert.notEqual(hardBot.yaw, initialYaw)
})

test('Difficulty increases after every 5 kills up to +30%', () => {
  // 0 kills -> level 1, +0%
  const d0 = calculateDifficulty(0)
  assert.equal(d0.level, 1)
  assert.equal(d0.speedBonus, 0)
  assert.equal(d0.multiplier, 1.0)

  // 4 kills -> level 1, +0%
  const d4 = calculateDifficulty(4)
  assert.equal(d4.level, 1)
  assert.equal(d4.speedBonus, 0)

  // 5 kills -> level 2, +5%
  const d5 = calculateDifficulty(5)
  assert.equal(d5.level, 2)
  assert.equal(d5.speedBonus, 5)
  assert.equal(d5.multiplier, 1.05)

  // 10 kills -> level 3, +10%
  const d10 = calculateDifficulty(10)
  assert.equal(d10.level, 3)
  assert.equal(d10.speedBonus, 10)
  assert.equal(d10.multiplier, 1.10)

  // 35 kills -> level 8, capped at +30%
  const d35 = calculateDifficulty(35)
  assert.equal(d35.level, 8)
  assert.equal(d35.speedBonus, 30)
  assert.equal(d35.multiplier, 1.30)

  // In state step
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  state.kills = 5
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.016)
  assert.equal(state.difficulty.level, 2)
  assert.equal(state.difficulty.speedBonus, 5)

  const normalBot = state.bots.find(b => b.type === 'normal')
  assert.equal(normalBot.speed, normalBot.baseSpeed * 1.05)
})

test('Destroyed bot triggers 0.5s explosion before hiding', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  const bot = state.bots[0]
  bot.x = 1
  bot.z = 0
  bot.health = 10

  state.bullets.push({
    id: 100,
    owner: 'player',
    x: 0.9,
    y: 5.5,
    z: 0,
    vx: 10,
    vz: 0,
    life: 1.0,
    damage: 10,
  })

  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.016)

  assert.equal(bot.health, 0)
  assert.equal(bot.isAlive, false)
  assert.equal(bot.isExploding, true)
  assert.equal(bot.explosionTimer <= 0.5, true)
  assert.equal(state.score, 100)
  assert.equal(state.kills, 1)

  // After 0.3s -> still exploding
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.3)
  assert.equal(bot.isExploding, true)

  // After another 0.25s -> explosion finishes
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.25)
  assert.equal(bot.isExploding, false)
})

test('player firing spawns bullet with 10 damage and 1.2s lifetime', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  assert.equal(state.bullets.length, 0)

  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: true }, 0.016)
  assert.equal(state.bullets.length, 1)
  const bullet = state.bullets[0]
  assert.equal(bullet.owner, 'player')
  assert.equal(bullet.damage, 10)
  assert.equal(bullet.life <= 1.2, true)
  assert.equal(bullet.life > 1.1, true)
})

test('bullet hitting bot reduces bot health by 10', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  const bot = state.bots[0]
  bot.x = 2
  bot.z = 0

  state.bullets.push({
    id: 99,
    owner: 'player',
    x: 1.5,
    y: 5.5,
    z: 0,
    vx: 10,
    vz: 0,
    life: 1.0,
    damage: 10,
  })

  const initialHp = bot.health
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.016)

  assert.equal(bot.health, initialHp - 10)
  assert.equal(state.bullets.find(b => b.id === 99), undefined)
})

test('dead bot respawns after 4s at 12-18 units with full maxHealth', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  const bot = state.bots[0]
  bot.isAlive = false
  bot.health = 0
  bot.respawnTimer = 4.0

  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 2.0)
  assert.equal(bot.isAlive, false)

  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 2.1)
  assert.equal(bot.isAlive, true)
  assert.equal(bot.health, bot.maxHealth)

  const dist = Math.hypot(bot.x - state.player.x, bot.z - state.player.z)
  assert.equal(dist >= 11.9 && dist <= 18.1, true)
})

test('bot bullet hitting player reduces player health by 8', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  state.player.health = 100

  state.bullets.push({
    id: 200,
    owner: 'bot',
    botId: 'bot_1',
    x: 0.5,
    y: 5.5,
    z: 0,
    vx: -10,
    vz: 0,
    life: 1.0,
    damage: 8,
  })

  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.016)
  assert.equal(state.player.health, 92)
})

test('player dying triggers 3s respawn and revives with full 100 HP', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  state.player.health = 8

  state.bullets.push({
    id: 201,
    owner: 'bot',
    botId: 'bot_1',
    x: 0.2,
    y: 5.5,
    z: 0,
    vx: -10,
    vz: 0,
    life: 1.0,
    damage: 8,
  })

  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 0.016)
  assert.equal(state.player.health, 0)
  assert.equal(state.player.isAlive, false)
  assert.equal(state.player.respawnTimer, 3.0)

  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 3.1)
  assert.equal(state.player.isAlive, true)
  assert.equal(state.player.health, 100)
})

test('normalizeAngle wraps angles into [-PI, PI]', () => {
  assert.equal(Math.abs(normalizeAngle(0)), 0)
  assert.equal(Math.abs(normalizeAngle(Math.PI * 3) - (-Math.PI)) < 1e-6, true)
  assert.equal(Math.abs(normalizeAngle(-Math.PI * 3) - (-Math.PI)) < 1e-6, true)
})
