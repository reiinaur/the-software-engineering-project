import Phaser from "phaser";
import axios from "axios";
import { saveSession } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { px, py, CX, CY, GW, GH } from "../utils/scale.js";

export default class loginScene extends Phaser.Scene {
  constructor() {
    super("loginScene");
  }

  // sceneData.mode determines whether to show the login or signup form
  create(sceneData) {
    const mode = sceneData?.mode || "login";
    this._isSignUp = mode === "signup";

    // animated background
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

    // id card image that frames the input fields
    const cardKey = this._isSignUp ? "signup-card" : "login-card";
    this.add.image(CX, CY, cardKey).setOrigin(0.5, 0.5).setDepth(2);

    // set up the input state object and field order depending on mode
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

    const inputStyle = {
      fontFamily: "custom-font",
      fontSize: this._isSignUp ? "18px" : "22px",
      fontWeight: "bold"
    };

    this._textObjects = {};
    this._hitZones = [];

    // vertical offsets from CY for each field — different sets for login vs signup
    const yOffsets = this._isSignUp 
      ? [-110, -40, 29, 98, 164] 
      : [-5, 110];              

    // build one canvas text object and one invisible click zone per field
    this._fieldsOrder.forEach((fieldName, index) => {
      const yPos = CY + yOffsets[index];
      const placeholderText = "Enter " + fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

      this._textObjects[fieldName] = this.add.text(CX - 10, yPos, placeholderText, { ...inputStyle, color: "#8c7ec088" })
        .setOrigin(0, 0.5)
        .setDepth(5);

      // invisible zone over each row so the player can click to focus that field
      const zone = this.add.zone(CX - 10, yPos, 320, this._isSignUp ? 38 : 50)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      
      zone.on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 }); 
        this._switchField(fieldName);
      });
      this._hitZones.push(zone);
    });

    // error text shown below the form for validation and server errors
    const errorY = this._isSignUp ? CY + 205 : CY + 149;
    
    this.errorText = this.add.text(CX - 10, errorY, "", { 
      fontFamily: "custom-font", 
      fontSize: "15px", 
      color: "#929292",
      wordWrap: { width: 320, useAdvancedWrap: true } 
    })
    .setOrigin(0, 0) 
    .setDepth(5);

    // blinking cursor loop — toggles visibility and re-renders all field texts
    this.time.addEvent({
      delay: 530,
      callback: () => {
        this._cursorVisible = !this._cursorVisible;
        this._updateVisualTexts();
      },
      loop: true
    });

    // focus the first field on load
    this._switchField(this._activeField);

    // global keyboard listener routes all keypresses through _handleTyping
    this.input.keyboard.on("keydown", (event) => this._handleTyping(event));

    // back button
    const btnBack = this.add
      .image(CX - 810, CY - 440, "btn-go-back")
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(0.09)
      .setInteractive({ useHandCursor: true });

    // submit button — key varies between login and signup
    const buttonKey = this._isSignUp ? "btn-signup" : "btn-loginconfirm";
    const btnSubmit = this.add
      .image(CX + 270, CY + 230, buttonKey)
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    btnSubmit.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 }); 
      if (this._isSignUp) this._handleSignUp(); else this._handleLogin();
    });

    btnBack.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      this.scene.start("menuScene");
    });

    btnSubmit.on("pointerover", () => btnSubmit.setScale(1.1));
    btnSubmit.on("pointerout", () => btnSubmit.setScale(1));
    btnBack.on("pointerover", () => btnBack.setScale(0.11));
    btnBack.on("pointerout", () => btnBack.setScale(0.09));
  }

  _switchField(field) {
     // focus a different field and clear any existing error message
    this._activeField = field;
    this.errorText.setText("");
    this._updateVisualTexts();
  }

  _handleTyping(event) {
    let currentText = this._inputValues[this._activeField];

    if (event.key === "Backspace") {
      currentText = currentText.slice(0, -1);
    } else if (event.key === "Tab") {
      event.preventDefault(); // prevent the browser's default focus shift
      // cycle to the next field in order, wrapping back to the first
      const currentIndex = this._fieldsOrder.indexOf(this._activeField);
      const nextIndex = (currentIndex + 1) % this._fieldsOrder.length;
      this._switchField(this._fieldsOrder[nextIndex]);
      return;
    } else if (event.key === "Enter") {
      this.sound.play("click", { volume: 0.2 }); 
      if (this._isSignUp) this._handleSignUp(); else this._handleLogin();
      return;
    } else if (event.key.length === 1) {
      // enforce a character limit — email fields get a slightly longer cap
      const maxLen = this._activeField === "email" ? 24 : 16;
      if (currentText.length < maxLen) {
        currentText += event.key;
      }
    }

    this._inputValues[this._activeField] = currentText;
    this._updateVisualTexts();
  }

  _updateVisualTexts() {
    // re-renders every field's display text including the blinking cursor on the active field
    const cursor = this._cursorVisible ? "|" : " ";

    this._fieldsOrder.forEach((fieldName) => {
      // empty field shows placeholder in faded colour, or just the cursor if it's focused
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
        // password fields are masked with bullet characters
        const displayValue = isPasswordType ? "•".repeat(rawValue.length) : rawValue;
        const completeString = displayValue + (this._activeField === fieldName ? cursor : "");
        textObj.setText(completeString).setColor("#8c7ec0");
      }
    });
  }

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
      if (res.data.status === "success") {
        const user = {
          userId: res.data.userId,
          name: res.data.name,
          role: res.data.role
        };

        saveSession(res.data.token, user, res.data.playerStats, res.data.shopState);

        // sync shop state to gameState immediately after login
        gameState.coins = res.data.playerStats.coinBalance;
        gameState.coinBalance = res.data.playerStats.coinBalance;
        gameState.shopOwned = res.data.shopState.owned;
        gameState.shopEquipped = res.data.shopState.equipped;

        // flatten owned items into a single array for fast ownership checks in the shop
        gameState.ownedItems = [
          ...(res.data.shopState.owned.accessories || []),
          ...(res.data.shopState.owned.screenTheme || [])
        ];
        this.scene.start("menuScene");
      }
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
      // register the account then immediately log in so the player lands on the menu
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
    // write auth data and player stats into both localStorage and the live gameState object
    saveSession(data.token, { userId: data.userId, name: data.name, role: data.role }, data.playerStats);
    Object.assign(gameState, {
      userId: data.userId, name: data.name, role: data.role,
      rankLevel: data.playerStats.rankLevel, xpTotal: data.playerStats.xpTotal,
      coinBalance: data.playerStats.coinBalance, finLevels: data.playerStats.finLevels, PBs: data.playerStats.PBs,
    });
    this.scene.start("menuScene");
  }
}