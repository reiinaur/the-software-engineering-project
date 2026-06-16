import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, COLORS, HEX, px, py } from "../utils/scale.js";
import { authHeader, getStats, updateStats, getShopState, updateShopState } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { CATALOGUE, TAB_LABELS, EQUIP_FIELD } from "../utils/shopUtils.js";

// Tab positions (⚠️ adjust to your drawn background's tab positions)
const TAB_Y    = py(13);
const TABS_DEF = {
  accessories: { x: px(28), w: px(20), h: py(6) },
  screenTheme: { x: px(52), w: px(20), h: py(6) },
};
// Item grid area
const GRID_X     = px(5);
const GRID_Y     = py(21);
const GRID_W     = GW - px(10);
const COLS       = 4;
const ITEM_GAP   = px(1.5);
const CARD_W     = (GRID_W - ITEM_GAP * (COLS - 1)) / COLS;
const CARD_H     = py(38);

// Coin balance display (⚠️ position to match your drawn label area)
const COIN_X = px(82);
const COIN_Y = py(6);

export default class shopScene extends Phaser.Scene {
  constructor() { super("shopScene"); }

  create() {
    this._activeTab = "accessories";
    this._objects   = [];
    this._draw();
  }

  _draw() {
    this._objects.forEach((o) => o?.destroy());
    this._objects = [];
    this.cameras.main.setBackgroundColor("#ffffff");

    // ── Background ─────────────────────────────────────────────────
    this._track(this.add.image(CX, CY, "ui-shop-bg"));

    // ── Close button (top right — may already be drawn in bg) ──────
    const close = this._track(this.add.text(GW - 30, 36, "×", {
      fontFamily: "Arial", fontSize: FONT.lg, color: COLORS.dark
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    close.on("pointerdown", () => this.scene.start("menuScene"));

    // ── Back ───────────────────────────────────────────────────────
    const back = this._track(this.add.text(30, 36, "←", {
      fontFamily: "Arial", fontSize: FONT.lg, color: COLORS.dark
    }).setInteractive({ useHandCursor: true }));
    back.on("pointerdown", () => this.scene.start("menuScene"));

    // ── Coin balance ───────────────────────────────────────────────
    this._coinText = this._track(this.add.text(COIN_X, COIN_Y,
      `💰 ${gameState.coinBalance}`, {
      fontFamily: "'Roboto Mono', monospace", fontSize: FONT.sm, color: COLORS.warning
    }).setOrigin(0.5));

    // ── Tabs ───────────────────────────────────────────────────────
    Object.entries(TABS_DEF).forEach(([cat, def]) => {
      const isActive = cat === this._activeTab;
      const label = this._track(this.add.text(def.x, TAB_Y, TAB_LABELS[cat], {
        fontFamily: "Arial", fontSize: FONT.sm, fontStyle: "bold",
        color: isActive ? COLORS.dark : COLORS.muted
      }).setOrigin(0.5));

      if (!isActive) {
        // Invisible hit zone over the drawn tab area
        const zone = this._track(this.add.zone(def.x, TAB_Y, def.w, def.h)
          .setInteractive({ useHandCursor: true }));
        zone.on("pointerdown", () => { this._activeTab = cat; this._draw(); });
      }

      // Underline active tab
      if (isActive) {
        const gfx = this._track(this.add.graphics());
        gfx.lineStyle(3, HEX.dark);
        gfx.lineBetween(def.x - def.w / 2 + 10, TAB_Y + def.h / 2,
                        def.x + def.w / 2 - 10, TAB_Y + def.h / 2);
      }
    });

    // ── Item grid ──────────────────────────────────────────────────
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
    const ownedList  = gameState.shopOwned?.[cat]    ?? [];
    const equippedId = gameState.shopEquipped?.[cat] ?? null;
    const isOwned    = ownedList.includes(item.id);
    const isEquipped = equippedId === item.id;
    const canAfford  = gameState.coinBalance >= item.cost;
    const isFree     = item.cost === 0;

    const gfx = this._track(this.add.graphics());
    gfx.fillStyle(isEquipped ? 0xeef8ee : isOwned ? 0xeeeeff : 0xfafafa);
    gfx.fillRoundedRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H, 10);
    gfx.lineStyle(2, isEquipped ? 0x88cc88 : isOwned ? 0x8888cc : 0xdddddd);
    gfx.strokeRoundedRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H, 10);

    // Item image
    const imgH = py(18);
    const imgY = cy - CARD_H / 2 + imgH / 2 + 16;
    if (item.assetKey && this.textures.exists(item.assetKey)) {
      this._track(this.add.image(cx, imgY, item.assetKey).setDisplaySize(CARD_W - 50, imgH));
    } else {
      // Placeholder
      gfx.fillStyle(0xe8e8e8);
      gfx.fillRect(cx - CARD_W / 2 + 24, imgY - imgH / 2, CARD_W - 48, imgH);
      gfx.lineStyle(1, 0xcccccc);
      gfx.strokeRect(cx - CARD_W / 2 + 24, imgY - imgH / 2, CARD_W - 48, imgH);
      gfx.lineBetween(cx - CARD_W/2 + 24, imgY - imgH/2, cx + CARD_W/2 - 24, imgY + imgH/2);
      gfx.lineBetween(cx + CARD_W/2 - 24, imgY - imgH/2, cx - CARD_W/2 + 24, imgY + imgH/2);
    }

    const textY = cy - CARD_H / 2 + imgH + 30;
    this._track(this.add.text(cx - CARD_W / 2 + 16, textY, item.label, {
      fontFamily: "Arial", fontSize: FONT.sm, color: COLORS.dark, fontStyle: "bold"
    }));
    if (!isFree) {
      this._track(this.add.text(cx + CARD_W / 2 - 16, textY, `$${item.cost}`, {
        fontFamily: "'Roboto Mono', monospace", fontSize: FONT.xs, color: COLORS.muted
      }).setOrigin(1, 0));
    }
    this._track(this.add.text(cx - CARD_W / 2 + 16, textY + 38, item.desc, {
      fontFamily: "Arial", fontSize: "18px", color: COLORS.muted
    }));

    // Action button
    const btnY = cy + CARD_H / 2 - py(4);

    if (isEquipped) {
      this._track(this.add.text(cx, btnY, "✓  EQUIPPED", {
        fontFamily: "Arial", fontSize: FONT.xs, color: COLORS.success, fontStyle: "bold"
      }).setOrigin(0.5));
    } else if (isOwned || isFree) {
      this._smallBtn(cx, btnY, "EQUIP", HEX.dark, () => this._equip(item.id, cat));
    } else {
      this._smallBtn(cx, btnY,
        canAfford ? "BUY" : "🔒",
        canAfford ? HEX.accent : HEX.muted,
        canAfford ? () => this._buy(item.id, item.cost, cat) : null
      );
    }
  }

  _smallBtn(x, y, label, bgHex, cb) {
    const bg = this._track(this.add.rectangle(x, y, px(8), py(4), bgHex)
      .setInteractive({ useHandCursor: !!cb }));
    const lbl = this._track(this.add.text(x, y, label, {
      fontFamily: "Arial", fontSize: FONT.xs, color: "#ffffff"
    }).setOrigin(0.5));
    if (cb) {
      bg.on("pointerover",  () => bg.setAlpha(0.8));
      bg.on("pointerout",   () => bg.setAlpha(1));
      bg.on("pointerdown",  cb);
    }
  }

  async _buy(itemId, cost, cat) {
    try {
      const res = await axios.post("/api/shop/buy", {
        category: cat, itemId, itemCost: cost
      }, { headers: authHeader() });

      gameState.coinBalance = res.data.coinBalance;
      if (!gameState.shopOwned[cat]) gameState.shopOwned[cat] = [];
      gameState.shopOwned[cat].push(itemId);

      updateStats({ ...getStats(), coinBalance: res.data.coinBalance });
      const shop = getShopState();
      shop.owned[cat] = gameState.shopOwned[cat];
      updateShopState(shop);

      this._toast("Purchased!", COLORS.success);
      this._draw();
    } catch (err) {
      this._toast(err.response?.data?.message || "Purchase failed.", COLORS.accent);
    }
  }

  async _equip(itemId, cat) {
    try {
      await axios.post("/api/shop/equip", {
        category: EQUIP_FIELD[cat], itemId
      }, { headers: authHeader() });

      gameState.shopEquipped[cat] = itemId;
      const shop = getShopState();
      shop.equipped[cat] = itemId;
      updateShopState(shop);

      this._toast("Equipped!", COLORS.success);
      this._draw();
    } catch (err) {
      this._toast(err.response?.data?.message || "Equip failed.", COLORS.accent);
    }
  }

  _toast(msg, color) {
    if (this._toastObj) this._toastObj.destroy();
    this._toastObj = this.add.text(CX, GH - 50, msg, {
      fontFamily: "Arial", fontSize: FONT.sm, color,
      backgroundColor: "#000000bb", padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: this._toastObj, alpha: 0,
      delay: 1400, duration: 400,
      onComplete: () => { if (this._toastObj) this._toastObj.destroy(); }
    });
  }

  _track(obj) { this._objects.push(obj); return obj; }
}