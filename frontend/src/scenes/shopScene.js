// Same ShopScene from the previous guide — adapted to use axios and authHeader()
// instead of fetch(), to match the rest of your codebase.
 
import Phaser from "phaser";
import axios from "axios";
import { authHeader, getStats, updateStats } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
 
const CATALOGUE = {
  accessories: [
    { id: "sillyHat",     label: "Silly Hat",     cost: 80  },
    { id: "detectiveCap", label: "Detective Cap", cost: 120 },
    { id: "googlyEyes",   label: "Googly Eyes",   cost: 60  },
  ],
  colours: [
    { id: "blue", label: "Blue Ink", cost: 50 },
    { id: "red",  label: "Red Ink",  cost: 50 },
  ],
  decor: [
    { id: "coffeeCup", label: "Coffee Cup",  cost: 40 },
    { id: "plant1",    label: "Desk Plant",  cost: 40 },
  ],
  screenTheme: [
    { id: "matchaGreen", label: "Matcha Green", cost: 100 },
    { id: "dustyDark",   label: "Dusty Dark",   cost: 100 },
  ],
};
 
const TAB_LABELS = {
  accessories: "ACCESSORIES",
  colours:     "COLOURS",
  decor:       "DECOR",
  screenTheme: "THEMES",
};
 
export default class shopScene extends Phaser.Scene {
  constructor() { super("shopScene"); }
 
  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
 
    this._activeCategory = "accessories";
    // Local copies of ownership data — avoids querying the server on every render
    this._owned    = {};
    this._equipped = {};
 
    this._drawBackground();
    this._drawHeader();
    this._drawTabs();
    this._drawGrid();
  }
 
  _drawBackground() {
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x1a1a2e);
  }
 
  _drawHeader() {
    this.add.text(this.W / 2, 38, "NEWSROOM SHOP", {
      fontSize: "28px", fill: "#e94560", fontStyle: "bold"
    }).setOrigin(0.5);
 
    this._coinText = this.add.text(this.W - 20, 15,
      `💰 ${gameState.coinBalance}`, {
      fontSize: "18px", fill: "#ffaa00"
    }).setOrigin(1, 0);
 
    this.add.text(25, 15, "← Back", {
      fontSize: "16px", fill: "#aaaaaa"
    }).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("menuScene"));
  }
 
  _drawTabs() {
    if (this._tabObjs) this._tabObjs.forEach(o => o.destroy());
    this._tabObjs = [];
 
    const cats    = Object.keys(CATALOGUE);
    const tabW    = 148;
    const startX  = this.W / 2 - (cats.length * tabW) / 2 + tabW / 2;
    const tabY    = 88;
 
    cats.forEach((cat, i) => {
      const isActive = cat === this._activeCategory;
      const x = startX + i * tabW;
 
      const bg = this.add.rectangle(x, tabY, tabW - 6, 32,
        isActive ? 0xe94560 : 0x2a2a4a
      ).setInteractive({ useHandCursor: true });
 
      const lbl = this.add.text(x, tabY, TAB_LABELS[cat], {
        fontSize: "13px", fill: isActive ? "#fff" : "#888888"
      }).setOrigin(0.5);
 
      bg.on("pointerdown", () => {
        this._activeCategory = cat;
        this._drawTabs();
        this._drawGrid();
      });
 
      this._tabObjs.push(bg, lbl);
    });
  }
 
  _drawGrid() {
    if (this._gridObjs) this._gridObjs.forEach(o => o.destroy());
    this._gridObjs = [];
 
    const items  = CATALOGUE[this._activeCategory];
    const cardW  = 170;
    const cardH  = 190;
    const cols   = 4;
    const startX = this.W / 2 - ((cols - 1) * (cardW + 14)) / 2;
    const startY = 200;
 
    items.forEach((item, i) => {
      const x = startX + (i % cols)         * (cardW + 14);
      const y = startY + Math.floor(i / cols) * (cardH + 14);
      this._drawCard(item, x, y, cardW, cardH);
    });
  }
 
  _drawCard(item, x, y, cardW, cardH) {
    const cat        = this._activeCategory;
    const ownedList  = this._owned[cat]    || [];
    const equippedId = this._equipped[cat] || null;
    const isOwned    = ownedList.includes(item.id);
    const isEquipped = equippedId === item.id;
    const canAfford  = gameState.coinBalance >= item.cost;
 
    const bg = this.add.rectangle(x, y, cardW, cardH,
      isEquipped ? 0x1a3a1a : isOwned ? 0x1a1a3a : 0x1e1e30
    ).setStrokeStyle(2, isEquipped ? 0x44aa77 : isOwned ? 0x4466bb : 0x333355);
    this._gridObjs.push(bg);
 
    const nameT = this.add.text(x, y - 68, item.label, {
      fontSize: "14px", fill: "#fff", align: "center", wordWrap: { width: cardW - 16 }
    }).setOrigin(0.5);
    this._gridObjs.push(nameT);
 
    // Item preview placeholder — replace with this.add.image() once you have sprites
    const preview = this.add.rectangle(x, y - 8, 70, 70, 0x2a2a4a)
      .setStrokeStyle(1, 0x444466);
    this._gridObjs.push(preview);
 
    if (isEquipped) {
      const badge = this.add.text(x, y + 62, "✓ EQUIPPED", {
        fontSize: "12px", fill: "#44aa77", fontStyle: "bold"
      }).setOrigin(0.5);
      this._gridObjs.push(badge);
 
    } else if (isOwned) {
      const [bg2, lbl] = this._cardBtn(x, y + 62, "EQUIP", 0x4466bb, () => this._equip(item.id, cat));
      this._gridObjs.push(bg2, lbl);
 
    } else {
      const costT = this.add.text(x, y + 42, `💰 ${item.cost}`, {
        fontSize: "14px", fill: canAfford ? "#ffaa00" : "#555555"
      }).setOrigin(0.5);
      this._gridObjs.push(costT);
 
      const [bg2, lbl] = this._cardBtn(
        x, y + 72,
        canAfford ? "BUY" : "🔒",
        canAfford ? 0xe94560 : 0x333333,
        canAfford ? () => this._buy(item.id, item.cost, cat) : null
      );
      this._gridObjs.push(bg2, lbl);
    }
  }
 
  async _buy(itemId, itemCost, category) {
    try {
      const res = await axios.post("/api/shop/buy", {
        category, itemId, itemCost
      }, { headers: authHeader() });
 
      gameState.coinBalance = res.data.coinBalance;
      this._coinText.setText(`💰 ${gameState.coinBalance}`);
      updateStats({ ...getStats(), coinBalance: res.data.coinBalance });
 
      if (!this._owned[category]) this._owned[category] = [];
      this._owned[category].push(itemId);
 
      this._toast("Purchase successful!", "#44aa77");
      this._drawGrid();
 
    } catch (err) {
      const msg = err.response?.data?.message || "Purchase failed.";
      this._toast(msg, "#e94560");
    }
  }
 
  async _equip(itemId, category) {
    // equippedAccessories / equippedColours etc.
    const fieldMap = {
      accessories: "equippedAccessories",
      colours:     "equippedColours",
      decor:       "equippedDecor",
      screenTheme: "equippedScreenTheme",
    };
 
    try {
      await axios.post("/api/shop/equip", {
        category: fieldMap[category], itemId
      }, { headers: authHeader() });
 
      this._equipped[category] = itemId;
      this._toast("Item equipped!", "#44aa77");
      this._drawGrid();
 
    } catch (err) {
      this._toast(err.response?.data?.message || "Equip failed.", "#e94560");
    }
  }
 
  _cardBtn(x, y, label, colour, callback) {
    const bg = this.add.rectangle(x, y, 96, 28, colour)
      .setInteractive({ useHandCursor: !!callback });
    const lbl = this.add.text(x, y, label, { fontSize: "13px", fill: "#fff" }).setOrigin(0.5);
    if (callback) {
      bg.on("pointerover",  () => bg.setAlpha(0.8));
      bg.on("pointerout",   () => bg.setAlpha(1.0));
      bg.on("pointerdown",  callback);
    }
    return [bg, lbl];
  }
 
  _toast(message, colour) {
    if (this._toastObj) this._toastObj.destroy();
    this._toastObj = this.add.text(this.W / 2, this.H - 40, message, {
      fontSize: "16px", fill: colour,
      backgroundColor: "#000000bb", padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setDepth(10);
 
    this.tweens.add({
      targets: this._toastObj, alpha: 0,
      delay: 1200, duration: 400,
      onComplete: () => { if (this._toastObj) this._toastObj.destroy(); }
    });
  }
}