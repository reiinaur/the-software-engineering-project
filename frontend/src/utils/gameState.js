export const gameState = {
  // user data
  userId:      null,
  name:        null,
  role:        null,      

  // stats
  rankLevel:   1,
  xpTotal:     0,
  coinBalance: 0,
  finLevels:   [],
  PBs:         {},       

  // current level state
  selectedLevel:  null,
  passage:        "",
  articleTitle:   "",
  articleTopic: "",
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
    screenTheme: [],    
  },
  shopEquipped: {
    accessories: null,   
    screenTheme: null,  
  },
};