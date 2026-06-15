// manages JWT and user data in localStorage.
// Every scene that needs to know "is the user logged in?" imports from here.

const TOKEN_KEY = "tt_token";
const USER_KEY  = "tt_user";
const STATS_KEY = "tt_stats";
const SHOP_KEY  = "tt_shop";

export function saveSession(token, user, playerStats, shopState = null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY,  JSON.stringify(user));
  localStorage.setItem(STATS_KEY, JSON.stringify(playerStats));
  if (shopState) localStorage.setItem(SHOP_KEY, JSON.stringify(shopState));
}

export function getToken()  { return localStorage.getItem(TOKEN_KEY); }
export function isLoggedIn(){ return !!getToken(); }

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getStats() {
  const raw = localStorage.getItem(STATS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getShopState() {
  const raw = localStorage.getItem(SHOP_KEY);
  return raw ? JSON.parse(raw) : {
    owned:    { accessories: [], decor: [], screenTheme: [] },
    equipped: { accessories: null, decor: null, screenTheme: null },
  };
}

export function updateStats(newStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
}

export function updateShopState(newShop) {
  localStorage.setItem(SHOP_KEY, JSON.stringify(newShop));
}

export function clearSession() {
  [TOKEN_KEY, USER_KEY, STATS_KEY, SHOP_KEY].forEach((k) =>
    localStorage.removeItem(k)
  );
}

// builds auth header expected by all protected Flask routes.
export function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}