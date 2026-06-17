import Phaser from "phaser";
import axios from "axios";
import { saveSession } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { px, py, CX, CY, GW, GH } from "../utils/scale.js";

export default class loginScene extends Phaser.Scene {
  constructor() {
    super("loginScene");
  }

  create(sceneData) {
    const mode = sceneData?.mode || "login";
    this._isSignUp = mode === "signup";

    // 1. Animated Background Setup
    if (!this.anims.exists("bg_animation")) {
      this.anims.create({
        key: "bg_animation",
        frames: this.anims.generateFrameNumbers("background", { start: 0, end: 6 }),
        frameRate: 5,
        repeat: -1,
      });
    }

    const bg = this.add.sprite(0, 0, "background").setOrigin(0, 0);
    bg.setDisplaySize(GW, GH);
    bg.play("bg_animation");
    bg.setDepth(-1);

    // 2. ID Card Texture Base
    const cardKey = this._isSignUp ? "signup-card" : "login-card";
    this.add.image(CX, CY, cardKey).setOrigin(0.5, 0.5).setDepth(2);

    // 3. Form Input State Configuration
    if (this._isSignUp) {
      this._inputValues = { name: "", username: "", email: "", password: "", confirmPass: "" };
      this._fieldsOrder = ["name", "username", "email", "password", "confirmPass"];
      this._activeField = "name";
    } else {
      this._inputValues = { username: "", password: "" };
      this._fieldsOrder = ["username", "password"];
      this._activeField = "username";
    }
    this._cursorVisible = true;

    // 4. Input Field Styling Parameters
    const inputStyle = {
      fontFamily: "custom-font",
      fontSize: this._isSignUp ? "18px" : "22px",
      fontWeight: "bold"
    };

    this._textObjects = {};
    this._hitZones = [];

    // Define positions dynamically based on screen state profiles
    const yOffsets = this._isSignUp 
      ? [-110, -40, 29, 98, 164] 
      : [-5, 110];               

    // Build fields dynamically
    this._fieldsOrder.forEach((fieldName, index) => {
      const yPos = CY + yOffsets[index];
      const placeholderText = "Enter " + fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

      // Create Phaser canvas text instance
      this._textObjects[fieldName] = this.add.text(CX - 10, yPos, placeholderText, { ...inputStyle, color: "#8c7ec088" })
        .setOrigin(0, 0.5)
        .setDepth(5);

      // Create matching precise interactive mouse hit zone area
      const zone = this.add.zone(CX - 10, yPos, 320, this._isSignUp ? 38 : 50)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      
      zone.on("pointerdown", () => this._switchField(fieldName));
      this._hitZones.push(zone);
    });

    // ── FIXED ERROR TEXT CONFIGURATION (WITH LEFT SHIFT & WORD WRAP) ───
    const errorY = this._isSignUp ? CY + 205 : CY + 149;
    
    this.errorText = this.add.text(CX - 10, errorY, "", { 
      fontFamily: "custom-font", 
      fontSize: "15px", 
      color: "#929292",
      wordWrap: { width: 320, useAdvancedWrap: true } // Wraps perfectly across the line width
    })
    .setOrigin(0, 0) // Shifted to left-top alignment to prevent text overlap jumps
    .setDepth(5);

    // 5. Blinking Cursor Loop Engine
    this.time.addEvent({
      delay: 530,
      callback: () => {
        this._cursorVisible = !this._cursorVisible;
        this._updateVisualTexts();
      },
      loop: true
    });

    // Set initial layout state focus safely
    this._switchField(this._activeField);

    // 6. Global Keyboard Event Interceptor
    this.input.keyboard.on("keydown", (event) => this._handleTyping(event));

    // 7. Interface Controls (Back & Submit Buttons)
    const btnBack = this.add
      .image(CX - 810, CY - 440, "btn-go-back")
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(0.09)
      .setInteractive({ useHandCursor: true });

    const buttonKey = this._isSignUp ? "btn-signup" : "btn-loginconfirm";

    const btnSubmit = this.add
      .image(CX + 270, CY + 230, buttonKey)
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    btnSubmit.on("pointerdown", () => {
      if (this._isSignUp) this._handleSignUp(); else this._handleLogin();
    });

    btnBack.on("pointerdown", () => this.scene.start("menuScene"));

    // Button animations
    btnSubmit.on("pointerover", () => btnSubmit.setScale(1.1));
    btnSubmit.on("pointerout", () => btnSubmit.setScale(1));
    btnBack.on("pointerover", () => btnBack.setScale(0.11));
    btnBack.on("pointerout", () => btnBack.setScale(0.09));
  }

  // --- CORE ENGINE UTILITIES ---

  _switchField(field) {
    this._activeField = field;
    this.errorText.setText("");
    this._updateVisualTexts();
  }

  _handleTyping(event) {
    let currentText = this._inputValues[this._activeField];

    if (event.key === "Backspace") {
      currentText = currentText.slice(0, -1);
    } else if (event.key === "Tab") {
      event.preventDefault(); 
      const currentIndex = this._fieldsOrder.indexOf(this._activeField);
      const nextIndex = (currentIndex + 1) % this._fieldsOrder.length;
      this._switchField(this._fieldsOrder[nextIndex]);
      return;
    } else if (event.key === "Enter") {
      if (this._isSignUp) this._handleSignUp(); else this._handleLogin();
      return;
    } else if (event.key.length === 1) {
      const maxLen = this._activeField === "email" ? 24 : 16;
      if (currentText.length < maxLen) {
        currentText += event.key;
      }
    }

    this._inputValues[this._activeField] = currentText;
    this._updateVisualTexts();
  }

  _updateVisualTexts() {
    const cursor = this._cursorVisible ? "|" : " ";

    this._fieldsOrder.forEach((fieldName) => {
      const rawValue = this._inputValues[fieldName];
      const textObj = this._textObjects[fieldName];
      const isPasswordType = fieldName === "password" || fieldName === "confirmPass";
      const niceLabel = "Enter " + fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

      if (rawValue === "") {
        if (this._activeField === fieldName) {
          textObj.setText(cursor).setColor("#8c7ec0");
        } else {
          textObj.setText(niceLabel).setColor("#8c7ec088");
        }
      } else {
        const displayValue = isPasswordType ? "•".repeat(rawValue.length) : rawValue;
        const completeString = displayValue + (this._activeField === fieldName ? cursor : "");
        textObj.setText(completeString).setColor("#8c7ec0");
      }
    });
  }

  // --- AUTHENTICATION ROUTERS ---

  async _handleLogin() {
    const userName = this._inputValues.username.trim();
    const passInput = this._inputValues.password;

    if (!userName || !passInput) {
      this.errorText.setText("Please fill in all fields.");
      return;
    }

    try {
      const res = await axios.post("/api/auth/login", { username: userName, password: passInput });
      this._onAuthSuccess(res.data);
    } catch (err) {
      this.errorText.setText(err.response?.data?.message || "Login failed.");
    }
  }

  async _handleSignUp() {
    const name = this._inputValues.name.trim();
    const userName = this._inputValues.username.trim();
    const userEmail = this._inputValues.email.trim();
    const passInput = this._inputValues.password;
    const confirmPass = this._inputValues.confirmPass;

    if (!name || !userName || !userEmail || !passInput || !confirmPass) {
      this.errorText.setText("Please fill in all fields.");
      return;
    }

    if (passInput !== confirmPass) {
      this.errorText.setText("Passwords do not match.");
      return;
    }

    try {
      await axios.post("/api/auth/signup", {
        name,
        username: userName,
        email: userEmail,
        password: passInput,
        confirmPass: confirmPass,
      });

      const loginRes = await axios.post("/api/auth/login", { username: userName, password: passInput });
      this._onAuthSuccess(loginRes.data);
    } catch (err) {
      this.errorText.setText(err.response?.data?.message || "Sign-up failed.");
    }
  }

  _onAuthSuccess(data) {
    saveSession(data.token, { userId: data.userId, name: data.name, role: data.role }, data.playerStats);
    Object.assign(gameState, {
      userId: data.userId, name: data.name, role: data.role,
      rankLevel: data.playerStats.rankLevel, xpTotal: data.playerStats.xpTotal,
      coinBalance: data.playerStats.coinBalance, finLevels: data.playerStats.finLevels, PBs: data.playerStats.PBs,
    });
    this.scene.start("menuScene");
  }
}