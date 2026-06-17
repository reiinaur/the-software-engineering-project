import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, colours, HEX, px, py } from "../utils/scale.js";
import { authHeader, getStats, updateStats, getShopState, updateShopState } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { CATALOGUE, TAB_LABELS, EQUIP_FIELD } from "../utils/shopUtils.js";

const TAB_Y    = py(13);
const TABS_DEF = {
  accessories: { x: px(23.5), w: px(20), h: py(6) },
  screenTheme: { x: px(43.5), w: px(20), h: py(6) },
};

// ── RECALIBRATED 3-COLUMN GRID CONTAINMENT AREA ──────────────────
const GRID_X     = px(19.5);             
const GRID_Y     = py(26);            
const GRID_W     = GW - px(40);       
const COLS       = 3;                 
const ITEM_GAP   = px(2.5);           
const CARD_W     = (GRID_W - ITEM_GAP * (COLS - 1)) / COLS;
const CARD_H     = py(32);            

const COIN_X = px(78);
const COIN_Y = py(12);

export default class shopScene extends Phaser.Scene {
  constructor() { super("shopScene"); }

  create() {
    this._activeTab = "accessories";
    this._objects   = [];
    this._draw();
  }

  init() {
    const savedShop = getShopState(); 
    const savedStats = getStats();

    if (savedStats) {
      gameState.coins = savedStats.coinBalance;
      gameState.coinBalance = savedStats.coinBalance;
    }
    
    if (savedShop && savedShop.owned) {
      gameState.shopOwned = savedShop.owned;
      gameState.shopEquipped = savedShop.equipped || {};
      
      // Flatten arrays into a single fast lookup array for checking item ownership
      gameState.ownedItems = [
        ...(savedShop.owned.accessories || []),
        ...(savedShop.owned.screenTheme || [])
      ];
    }
  }

  _draw() {
    this._objects.forEach((o) => o?.destroy());
    this._objects = [];
    this.cameras.main.setBackgroundColor("#ffffff");

    this._track(this.add.image(CX, CY, "shop-bg"));

    const btnBack = this._track(this.add
      .image(CX - 810, CY - 440, "btn-go-back")
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(0.09)
      .setInteractive({ useHandCursor: true }));

    btnBack.on("pointerover", () => btnBack.setScale(0.11));
    btnBack.on("pointerout", () => btnBack.setScale(0.09));
    btnBack.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 }); 
      this.scene.start("menuScene");
    });

    const currentCoins = gameState.coins !== undefined ? gameState.coins : (gameState.coinBalance || 0);
    this._coinText = this._track(this.add.text(COIN_X, COIN_Y,
      `COINS: ${currentCoins}`, {
      fontFamily: "custom-font", fontSize: FONT.sm, color: colours.main
    }).setOrigin(0.5));

    Object.entries(TABS_DEF).forEach(([cat, def]) => {
      const isActive = cat === this._activeTab;
      this._track(this.add.text(def.x, TAB_Y, TAB_LABELS[cat], {
        fontFamily: "custom-font", fontSize: FONT.sm, fontStyle: "bold",
        color: isActive ? colours.main : colours.muted
      }).setOrigin(0.5));

      if (!isActive) {
        const zone = this._track(this.add.zone(def.x, TAB_Y, def.w, def.h)
          .setInteractive({ useHandCursor: true }));
        zone.on("pointerdown", () => { 
          this.sound.play("click", { volume: 0.2 }); 
          this._activeTab = cat; 
          this._draw(); 
        });
      }

      if (isActive) {
        const gfx = this._track(this.add.graphics());
        gfx.lineStyle(2, HEX.main);
        
        const halfUnderlineWidth = 25; 
        gfx.lineBetween(
          def.x - halfUnderlineWidth, TAB_Y + def.h / 2,
          def.x + halfUnderlineWidth, TAB_Y + def.h / 2
        );
      }
    });

    const items = CATALOGUE[this._activeTab] ?? [];
    items.forEach((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx  = GRID_X + CARD_W / 2 + col * (CARD_W + ITEM_GAP);
      const cy  = GRID_Y + CARD_H / 2 + row * (CARD_H + ITEM_GAP);
      this._drawCard(item, cx, cy);
    });
  }

  _drawCard(item, cx, cy) {
    const cat        = this._activeTab;
    
    // Resolve dynamic item ownership
    const ownedList  = gameState.ownedItems || gameState.shopOwned?.[cat] || [];
    const equippedId = cat === "accessories" 
      ? (gameState.shopEquipped?.accessories || gameState.equipped?.accessory || "none") 
      : (gameState.shopEquipped?.screenTheme || gameState.equipped?.theme || "default");

    // Base free elements are treated as inherently owned
    const isOwned    = ownedList.includes(item.id) || item.cost === 0 || item.id === "none" || item.id === "default";
    const isEquipped = equippedId === item.id;
    const currentCoins = gameState.coins !== undefined ? gameState.coins : (gameState.coinBalance || 0);
    const canAfford  = currentCoins >= item.cost;
    const isFree     = item.cost === 0;

    // ── DRAW OUTLINE ONLY ─────────────────────────────────────────
    const gfx = this._track(this.add.graphics());
    
    // Set line thickness to 2px and choose outline color based on state
    // Equipped = Calm Green, Owned = Muted Indigo, Unowned = Light Gray
    const strokeColor = isEquipped ? 0x88cc88 : isOwned ? 0x8888cc : 0xdddddd;
    gfx.lineStyle(2, strokeColor);
    
    // Draw the rounded border outline (no fillStyle underneath!)
    gfx.strokeRoundedRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H, 10);
    // ──────────────────────────────────────────────────────────────

    const imgY = cy - CARD_H / 2 + py(11); 
    
    let itemImg = null;
    if (item.assetKey && this.textures.exists(item.assetKey)) {
      itemImg = this.add.image(cx, imgY, item.assetKey);
    } else if (this.textures.exists(`${item.id}-calm`)) {
      itemImg = this.add.image(cx, imgY, `${item.id}-calm`);
    }

    if (itemImg) {
      this._track(itemImg);
      const maxW = CARD_W - 40;
      const maxH = py(14);
      const scale = Math.min(maxW / itemImg.width, maxH / itemImg.height);
      itemImg.setScale(scale);
    } else {
      // Small minimal dash placeholder line if asset texture is missing
      gfx.lineStyle(1, 0xcccccc);
      gfx.strokeRect(cx - CARD_W / 2 + 20, imgY - py(7), CARD_W - 40, py(14));
    }

    const textY = cy - CARD_H / 2 + py(20);
    this._track(this.add.text(cx - CARD_W / 2 + 16, textY, item.label, {
      fontFamily: "custom-font", fontSize: "20px", color: colours.main, fontStyle: "bold"
    }));
    if (!isFree) {
      this._track(this.add.text(cx + CARD_W / 2 - 16, textY, `$${item.cost}`, {
        fontFamily: "'Roboto Mono', monospace", fontSize: "16px", color: colours.muted
      }).setOrigin(1, 0));
    }
    
    this._track(this.add.text(cx - CARD_W / 2 + 16, textY + 26, item.desc, {
      fontFamily: "custom-font", fontSize: "14px", color: colours.muted,
      wordWrap: { width: CARD_W - 32 }
    }));

    const btnY = cy + CARD_H / 2 - py(3.5);

    if (isEquipped) {
      this._track(this.add.text(cx, btnY, "✓   EQUIPPED", {
        fontFamily: "custom-font", fontSize: "16px", color: colours.success, fontStyle: "bold"
      }).setOrigin(0.5));
    } else if (isOwned) {
      this._smallBtn(cx, btnY, "EQUIP", HEX.main, () => this._equip(item.id, cat));
    } else {
      this._smallBtn(cx, btnY,
        canAfford ? "BUY" : "icon-lock",
        canAfford ? HEX.main : HEX.muted,
        canAfford ? () => this._buy(item.id, item.cost, cat) : null
      );
    }
  }

  _smallBtn(x, y, label, bgHex, cb) {
    const bg = this._track(this.add.rectangle(x, y, px(8.5), py(3.5), bgHex)
      .setInteractive({ useHandCursor: !!cb }));
    const lbl = this._track(this.add.text(x, y, label, {
      fontFamily: "custom-font", fontSize: "15px", color: "#ffffff", fontStyle: "bold"
    }).setOrigin(0.5));
    if (cb) {
      bg.on("pointerover",  () => bg.setAlpha(0.8));
      bg.on("pointerout",   () => bg.setAlpha(1));
      bg.on("pointerdown",  () => {
        this.sound.play("click", { volume: 0.2 }); 
        cb();
      });
    }
  }

  async _buy(itemId, cost, cat) {
    try {
      // Clean request directly sends 'accessories' or 'screenTheme' to backend
      const res = await axios.post("/api/shop/buy", {
        category: cat, itemId, itemCost: cost
      }, { headers: authHeader() });

      gameState.coins = res.data.coinBalance;
      gameState.coinBalance = res.data.coinBalance;
      
      if (!gameState.ownedItems) gameState.ownedItems = [];
      gameState.ownedItems.push(itemId);

      if (!gameState.shopOwned) gameState.shopOwned = {};
      if (!gameState.shopOwned[cat]) gameState.shopOwned[cat] = [];
      gameState.shopOwned[cat].push(itemId);

      updateStats({ ...getStats(), coinBalance: res.data.coinBalance });
      this._toast("Purchased!", colours.success);
      this._draw();
    } catch (err) {
      this._toast(err.response?.data?.message || "Purchase failed.", colours.accent);
    }
  }

  async _equip(itemId, cat) {
    try {
      await axios.post("/api/shop/equip", {
        category: cat, 
        itemId: itemId
      }, { headers: authHeader() });

      if (!gameState.shopEquipped) {
        gameState.shopEquipped = { accessories: null, screenTheme: null };
      }
      gameState.shopEquipped[cat] = itemId;

      if (!gameState.equipped) gameState.equipped = {};
      if (cat === "accessories") {
        gameState.equipped.accessory = itemId;
      } else if (cat === "screenTheme") {
        gameState.equipped.theme = itemId;
      }

      const shop = getShopState() || { owned: {}, equipped: {} };
      shop.equipped = shop.equipped || {};
      shop.equipped[cat] = itemId;
      updateShopState(shop);

      this._toast("Equipped!", colours.success);
      this._draw();
    } catch (err) {
      this._toast(err.response?.data?.message || "Equip failed.", colours.accent);
    }
  }

  _toast(msg, color) {
    if (this._toastObj) this._toastObj.destroy();
    
    this._toastObj = this.add.text(CX, GH - 50, msg, {
      fontFamily: "custom-font", 
      fontSize: FONT.sm, 
      color: color
    }).setOrigin(0.5).setDepth(20);
    
    this.tweens.add({
      targets: this._toastObj, 
      alpha: 0,
      delay: 1400, 
      duration: 400,
      onComplete: () => { if (this._toastObj) this._toastObj.destroy(); }
    });
  }

  _track(obj) { this._objects.push(obj); return obj; }
}