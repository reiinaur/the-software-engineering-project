// single shared object that holds all runtime state for the current session
// scenes read from and write to this directly rather than passing data through scene params

export const gameState = {
  // user data
  userId:      null,
  name:        null,
  role:        null, // 'player' or 'admin'      

  // persistent player stats 
  // synced with the server after each completed run
  rankLevel:   1,
  xpTotal:     0,
  coinBalance: 0,
  finLevels:   [], // level numbers the player has completed at least once
  PBs:         {}, // personal best wpm per level       

  // current level config 
  // written by levelSelectScene before gameScene starts
  selectedLevel:  null,
  passage:        "",
  articleTitle:   "",
  articleTopic: "",
  timerDuration:  60,

  // result from the most recently completed run 
  // read by resultsScene
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
  // synced from the server's shopState on login
  shopOwned: {
    accessories: [], // owned accessory item ids     
    screenTheme: [], // owned screen theme item ids   
  },
  shopEquipped: {
    accessories: null, // currently equipped accessory id or null for none  
    screenTheme: null, // currently equipped theme id, or null for default
  },
};