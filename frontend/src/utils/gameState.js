export const gameState = {
  // user data
  userId:      null,
  name:        null,
  role:        null,      // "player" | "admin"

  // stats
  rankLevel:   1,
  xpTotal:     0,
  coinBalance: 0,
  finLevels:   [],
  PBs:         {},        // { "1": 72, "2": 65, ... }

  // current level state
  selectedLevel:  null,
  passage:        "",
  articleTitle:   "",
  timerDuration:  60,

  // last game result
  lastResult: {
    wpm:         0,
    accuracy:    0,
    xpGain:      0,
    coinsEarned: 0,
    isPB:        false,
    deadlineMet: false,
    levelNumber: null,
  },

  // cosmetics
  shopOwned: {
    accessories: [],   
    decor:       [],   
    screenTheme: [],    
  },
  shopEquipped: {
    accessories: null,  
    decor:       null,  
    screenTheme: null,  
  },
};