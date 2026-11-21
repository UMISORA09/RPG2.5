const STORAGE_ACCOUNTS_KEY = 'brickland_accounts'
const STORAGE_USER_KEY = 'brickland_current_user'

export const DEFAULT_AVATARS = [
  { id: 'pilot_m', emoji: '👨‍✈️', label: 'Cơ trưởng' },
  { id: 'pilot_f', emoji: '👩‍✈️', label: 'Cơ phó' },
  { id: 'hero', emoji: '🦸', label: 'Siêu nhân' },
  { id: 'wizard', emoji: '🧙', label: 'Phù thủy' },
  { id: 'robot', emoji: '🤖', label: 'Người máy' },
  { id: 'cowboy', emoji: '🤠', label: 'Cao bồi' },
]

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `h_${Math.abs(hash).toString(16)}_${password.length}`
}

function createMemoryStorage() {
  const store = new Map()
  return {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
  }
}

export default class AuthManager {
  constructor(storage = globalThis.localStorage ?? null) {
    this.storage = storage ?? createMemoryStorage()
  }

  getAccounts() {
    try {
      const raw = this.storage.getItem(STORAGE_ACCOUNTS_KEY)
      return raw ? JSON.parse(raw) : []
    }
    catch {
      return []
    }
  }

  getCurrentUser() {
    try {
      const raw = this.storage.getItem(STORAGE_USER_KEY)
      return raw ? JSON.parse(raw) : null
    }
    catch {
      return null
    }
  }

  register({ username, email = '', password, avatar = '👨‍✈️' }) {
    const cleanUsername = String(username ?? '').trim()
    const cleanEmail = String(email ?? '').trim().toLowerCase()
    const cleanPassword = String(password ?? '')

    if (cleanUsername.length < 2) {
      return { success: false, error: 'Tên phi công phải có ít nhất 2 ký tự' }
    }
    if (cleanUsername.length > 20) {
      return { success: false, error: 'Tên phi công không được quá 20 ký tự' }
    }
    if (cleanPassword.length < 4) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 4 ký tự' }
    }

    const accounts = this.getAccounts()
    const lowerUser = cleanUsername.toLowerCase()

    const exists = accounts.some(acc =>
      acc.username.toLowerCase() === lowerUser ||
      (cleanEmail && acc.email && acc.email.toLowerCase() === cleanEmail),
    )

    if (exists) {
      return { success: false, error: 'Tên người dùng hoặc email đã tồn tại' }
    }

    const newUser = {
      id: `pilot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: hashPassword(cleanPassword),
      avatar: avatar || '👨‍✈️',
      createdAt: new Date().toISOString(),
      stats: {
        totalFlights: 0,
        biomesDiscovered: [],
      },
    }

    accounts.push(newUser)
    try {
      this.storage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts))
      this.storage.setItem(STORAGE_USER_KEY, JSON.stringify(this._sanitizeUser(newUser)))
    }
    catch (err) {
      return { success: false, error: 'Không thể lưu trữ tài khoản vào bộ nhớ' }
    }

    return { success: true, user: this._sanitizeUser(newUser) }
  }

  login({ usernameOrEmail, password }) {
    const input = String(usernameOrEmail ?? '').trim().toLowerCase()
    const cleanPassword = String(password ?? '')

    if (!input) {
      return { success: false, error: 'Vui lòng nhập tên tài khoản hoặc email' }
    }
    if (!cleanPassword) {
      return { success: false, error: 'Vui lòng nhập mật khẩu' }
    }

    const accounts = this.getAccounts()
    const account = accounts.find(acc =>
      acc.username.toLowerCase() === input ||
      (acc.email && acc.email.toLowerCase() === input),
    )

    if (!account) {
      return { success: false, error: 'Tài khoản không tồn tại' }
    }

    if (account.passwordHash !== hashPassword(cleanPassword)) {
      return { success: false, error: 'Mật khẩu không chính xác' }
    }

    const sanitized = this._sanitizeUser(account)
    try {
      this.storage.setItem(STORAGE_USER_KEY, JSON.stringify(sanitized))
    }
    catch {}

    return { success: true, user: sanitized }
  }

  playAsGuest() {
    const guestUser = {
      id: 'guest',
      username: 'Khách khám phá',
      avatar: '🧭',
      isGuest: true,
      stats: {
        totalFlights: 0,
        biomesDiscovered: [],
      },
    }
    try {
      this.storage.setItem(STORAGE_USER_KEY, JSON.stringify(guestUser))
    }
    catch {}
    return guestUser
  }

  logout() {
    try {
      this.storage.removeItem(STORAGE_USER_KEY)
    }
    catch {}
    return { success: true }
  }

  recordFlightStart() {
    const user = this.getCurrentUser()
    if (!user || user.isGuest) return 0
    const accounts = this.getAccounts()
    const account = accounts.find(a => a.id === user.id)
    if (account) {
      account.stats.totalFlights = (account.stats.totalFlights || 0) + 1
      this.storage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts))
      this.storage.setItem(STORAGE_USER_KEY, JSON.stringify(this._sanitizeUser(account)))
      return account.stats.totalFlights
    }
    return 0
  }

  recordBiome(biomeId) {
    if (!biomeId) return false
    const user = this.getCurrentUser()
    if (!user || user.isGuest) return false
    const accounts = this.getAccounts()
    const account = accounts.find(a => a.id === user.id)
    if (account) {
      account.stats.biomesDiscovered = account.stats.biomesDiscovered || []
      if (!account.stats.biomesDiscovered.includes(biomeId)) {
        account.stats.biomesDiscovered.push(biomeId)
        this.storage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts))
        this.storage.setItem(STORAGE_USER_KEY, JSON.stringify(this._sanitizeUser(account)))
        return true
      }
    }
    return false
  }

  _sanitizeUser(account) {
    const { passwordHash, ...rest } = account
    return rest
  }
}
