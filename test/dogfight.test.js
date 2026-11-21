import assert from 'node:assert/strict'
import test from 'node:test'
import {
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

test('createDogfightState initializes player and 3 alive bots', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  assert.equal(state.player.health, 100)
  assert.equal(state.player.maxHealth, 100)
  assert.equal(state.player.isAlive, true)
  assert.equal(state.bots.length, 3)
  assert.equal(state.score, 0)
  assert.equal(state.kills, 0)

  for (const bot of state.bots) {
    assert.equal(bot.health, 50)
    assert.equal(bot.maxHealth, 50)
    assert.equal(bot.isAlive, true)
  }
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

  // Spawn player bullet moving directly towards bot
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
  // Bullet consumed upon hit
  assert.equal(state.bullets.find(b => b.id === 99), undefined)
})

test('bot death awards +100 score, records kill, and sets 4s respawn timer', () => {
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
  assert.equal(bot.respawnTimer, 4.0)
  assert.equal(state.score, 100)
  assert.equal(state.kills, 1)
})

test('dead bot respawns after 4s at 12-18 units with full 50 HP', () => {
  const state = createDogfightState({ playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0 })
  const bot = state.bots[0]
  bot.isAlive = false
  bot.health = 0
  bot.respawnTimer = 4.0

  // Advance by 2s -> still dead
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 2.0)
  assert.equal(bot.isAlive, false)

  // Advance by another 2.1s -> respawns
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 2.1)
  assert.equal(bot.isAlive, true)
  assert.equal(bot.health, 50)

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

  // Step 3.1s -> revives
  stepDogfight(state, { playerPosition: { x: 0, y: 5.5, z: 0 }, playerYaw: 0, isFiring: false }, 3.1)
  assert.equal(state.player.isAlive, true)
  assert.equal(state.player.health, 100)
})

test('normalizeAngle wraps angles into [-PI, PI]', () => {
  assert.equal(Math.abs(normalizeAngle(0)), 0)
  assert.equal(Math.abs(normalizeAngle(Math.PI * 3) - (-Math.PI)) < 1e-6, true)
  assert.equal(Math.abs(normalizeAngle(-Math.PI * 3) - (-Math.PI)) < 1e-6, true)
})
