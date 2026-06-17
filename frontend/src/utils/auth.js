// manages the JWT and all user session data in localStorage.
// any scene that needs to know "is the user logged in?" should import from here

const TOKEN_KEY = "tt_token"; // JWT returned by the login / register endpoint
const USER_KEY = "tt_user"; // basic user info: id, name, role
const STATS_KEY = "tt_stats"; // playerStats snapshot: xp, coins, rank, etc.
const SHOP_KEY = "tt_shop"; // owned and equipped cosmetics

// persists all session data after a successful login or register response
export function saveSession(token, user, playerStats, shopState = null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(STATS_KEY, JSON.stringify(playerStats));
  if (shopState) localStorage.setItem(SHOP_KEY, JSON.stringify(shopState));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function isLoggedIn() {
  return !!getToken();
} // true if a token string exists

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getStats() {
  const raw = localStorage.getItem(STATS_KEY);
  return raw ? JSON.parse(raw) : null;
}

// returns the shop state or a safe empty default if nothing has been saved yet
export function getShopState() {
  const raw = localStorage.getItem(SHOP_KEY);
  return raw
    ? JSON.parse(raw)
    : {
        owned: { accessories: [], decor: [], screenTheme: [] },
        equipped: { accessories: null, decor: null, screenTheme: null },
      };
}

// calls function after a server response to keep local cache in sync
export function updateStats(newStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
}

export function updateShopState(newShop) {
  localStorage.setItem(SHOP_KEY, JSON.stringify(newShop));
}

// removes all session keys — called on logout
export function clearSession() {
  [TOKEN_KEY, USER_KEY, STATS_KEY, SHOP_KEY].forEach((k) =>
    localStorage.removeItem(k),
  );
}

// builds the auth header expected by all @token_required Flask routes
export function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}
