import assert from 'node:assert/strict'
import test from 'node:test'
import AuthManager from '../src/auth/AuthManager.js'

function createMockStorage() {
  const map = new Map()
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, val) => map.set(key, String(val)),
    removeItem: key => map.delete(key),
    clear: () => map.clear(),
  }
}

test('registers new account and logs in automatically', () => {
  const storage = createMockStorage()
  const auth = new AuthManager(storage)

  const res = auth.register({ username: 'XuanHoa', email: 'hoa@test.com', password: 'secretpassword', avatar: '👨‍✈️' })
  assert.equal(res.success, true)
  assert.equal(res.user.username, 'XuanHoa')
  assert.equal(res.user.avatar, '👨‍✈️')
  assert.equal(res.user.passwordHash, undefined)

  const current = auth.getCurrentUser()
  assert.equal(current.username, 'XuanHoa')
})

test('rejects registration with short username or password', () => {
  const storage = createMockStorage()
  const auth = new AuthManager(storage)

  const shortName = auth.register({ username: 'X', password: '123' })
  assert.equal(shortName.success, false)

  const shortPass = auth.register({ username: 'ValidUser', password: '12' })
  assert.equal(shortPass.success, false)
})

test('rejects duplicate username or email', () => {
  const storage = createMockStorage()
  const auth = new AuthManager(storage)

  auth.register({ username: 'PilotOne', email: 'one@test.com', password: 'password123' })
  const dup = auth.register({ username: 'pilotone', email: 'different@test.com', password: 'password123' })
  assert.equal(dup.success, false)

  const dupEmail = auth.register({ username: 'PilotTwo', email: 'ONE@test.com', password: 'password123' })
  assert.equal(dupEmail.success, false)
})

test('authenticates valid credentials and rejects invalid credentials', () => {
  const storage = createMockStorage()
  const auth = new AuthManager(storage)

  auth.register({ username: 'Flyer', email: 'fly@sky.com', password: 'mypassword' })
  auth.logout()
  assert.equal(auth.getCurrentUser(), null)

  const wrongPass = auth.login({ usernameOrEmail: 'Flyer', password: 'wrong' })
  assert.equal(wrongPass.success, false)

  const successLogin = auth.login({ usernameOrEmail: 'fly@sky.com', password: 'mypassword' })
  assert.equal(successLogin.success, true)
  assert.equal(auth.getCurrentUser().username, 'Flyer')
})

test('supports guest mode and logout', () => {
  const storage = createMockStorage()
  const auth = new AuthManager(storage)

  const guest = auth.playAsGuest()
  assert.equal(guest.isGuest, true)
  assert.equal(auth.getCurrentUser().isGuest, true)

  auth.logout()
  assert.equal(auth.getCurrentUser(), null)
})

test('tracks flights and biomes for registered user', () => {
  const storage = createMockStorage()
  const auth = new AuthManager(storage)

  auth.register({ username: 'Explorer', password: 'password' })
  auth.recordFlightStart()
  auth.recordBiome('forest')
  auth.recordBiome('desert')
  auth.recordBiome('forest') // Duplicate should not add

  const user = auth.getCurrentUser()
  assert.equal(user.stats.totalFlights, 1)
  assert.deepEqual(user.stats.biomesDiscovered, ['forest', 'desert'])
})
