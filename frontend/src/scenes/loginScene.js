import Phaser from "phaser";
import axios from "axios";
import { saveSession } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
 
export default class loginScene extends Phaser.Scene {
  constructor() {
    super("loginScene");
  }
 
  // Phaser passes scene init data as the first argument to create().
  // When menuScene calls this.scene.start("loginScene", { mode: "login" }),
  // that object arrives here as `sceneData`.
  create(sceneData) {
    // FIX: was `const isSignUp = data.mode === "signup"` but `data` was not defined.
    // sceneData is the correct parameter name matching what Phaser provides.
    // Fallback to 'login' if mode isn't provided.
    const mode     = sceneData?.mode || 'login';
    const isSignUp = mode === 'signup';
 
    this.add.text(400, 60, isSignUp ? "CREATE ACCOUNT" : "WELCOME BACK", {
      fontSize: "34px", fill: "#e94560", fontStyle: "bold"
    }).setOrigin(0.5);
 
    // Build the correct HTML form based on mode.
    // We use a single create() and build form HTML dynamically — this replaces
    // having two create() methods, which is illegal in JavaScript classes.
    const formHTML = isSignUp ? this._signUpFormHTML() : this._loginFormHTML();
 
    // this.add.dom() injects real HTML into the DOM overlay Phaser created.
    // The (400, 330) coordinates centre the form on the canvas.
    const domContainer = this.add.dom(400, 330).createFromHTML(formHTML);
 
    // Store domContainer on `this` so the submit handler can destroy it
    this._dom = domContainer;
 
    document.getElementById("submit-btn").addEventListener("click", () => {
      if (isSignUp) {
        this._handleSignUp();
      } else {
        this._handleLogin();
      }
    });
 
    document.getElementById("back-btn").addEventListener("click", () => {
      this._cleanup();
      this.scene.start("menuScene");
    });
  }
 
  // ── Form HTML templates ───────────────────────────────────────────────────
 
  _loginFormHTML() {
    return `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <input type="text"     id="userName"  placeholder="Username" /><br/>
        <input type="password" id="passInput" placeholder="Password" /><br/>
        <button id="submit-btn" class="form-btn">Sign In</button><br/>
        <span   id="back-btn"  class="form-link">← Back to menu</span>
        <p id="error-msg" style="color:#e94560; font-size:14px; min-height:20px;"></p>
      </div>
    `;
  }
 
  _signUpFormHTML() {
    return `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <input type="text"     id="name"        placeholder="Full Name" /><br/>
        <input type="text"     id="userName"    placeholder="Username" /><br/>
        <input type="email"    id="userEmail"   placeholder="Email" /><br/>
        <input type="password" id="passInput"   placeholder="Password" /><br/>
        <input type="password" id="confirmPass" placeholder="Confirm Password" /><br/>
        <button id="submit-btn" class="form-btn">Create Account</button><br/>
        <span   id="back-btn"  class="form-link">← Back to menu</span>
        <p id="error-msg" style="color:#e94560; font-size:14px; min-height:20px;"></p>
      </div>
    `;
  }
 
  // ── Submit handlers ───────────────────────────────────────────────────────
 
  async _handleLogin() {
    const userName  = document.getElementById("userName")?.value.trim();
    const passInput = document.getElementById("passInput")?.value;
 
    if (!userName || !passInput) {
      document.getElementById("error-msg").textContent = "Please fill in all fields.";
      return;
    }
 
    try {
      // axios.post sends a JSON body and returns the parsed response as res.data.
      // The Vite proxy forwards /api/... to http://localhost:5000/api/...
      const res = await axios.post("/api/auth/login", {
        username: userName,
        password: passInput,
      });
 
      this._onAuthSuccess(res.data);
 
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      document.getElementById("error-msg").textContent = msg;
    }
  }
 
  async _handleSignUp() {
    const name        = document.getElementById("name")?.value.trim();
    const userName    = document.getElementById("userName")?.value.trim();
    const userEmail   = document.getElementById("userEmail")?.value.trim();
    const passInput   = document.getElementById("passInput")?.value;
    const confirmPass = document.getElementById("confirmPass")?.value;
 
    if (!name || !userName || !userEmail || !passInput || !confirmPass) {
      document.getElementById("error-msg").textContent = "Please fill in all fields.";
      return;
    }
 
    if (passInput !== confirmPass) {
      document.getElementById("error-msg").textContent = "Passwords do not match.";
      return;
    }
 
    try {
      // FIX: was only sending username+password. Now sends all required fields.
      await axios.post("/api/auth/signup", {
        name,
        username:    userName,
        email:       userEmail,
        password:    passInput,
        confirmPass: confirmPass,
      });
 
      // After signup, automatically log in so the user lands on the menu
      const loginRes = await axios.post("/api/auth/login", {
        username: userName,
        password: passInput,
      });
 
      this._onAuthSuccess(loginRes.data);
 
    } catch (err) {
      const msg = err.response?.data?.message || "Sign-up failed. Try a different username or email.";
      document.getElementById("error-msg").textContent = msg;
    }
  }
 
  // ── Shared post-auth handler ──────────────────────────────────────────────
 
  _onAuthSuccess(data) {
    // Save token and user data to localStorage for persistence across page refreshes
    saveSession(data.token, {
      userId: data.userId,
      name:   data.name,
      role:   data.role,
    }, data.playerStats);
 
    // Populate gameState so the next scene has immediate access
    Object.assign(gameState, {
      userId:      data.userId,
      name:        data.name,
      role:        data.role,
      rankLevel:   data.playerStats.rankLevel,
      xpTotal:     data.playerStats.xpTotal,
      coinBalance: data.playerStats.coinBalance,
      finLevels:   data.playerStats.finLevels,
      PBs:         data.playerStats.PBs,
    });
 
    this._cleanup();
    this.scene.start("menuScene");
  }
 
  // ── Cleanup ───────────────────────────────────────────────────────────────
 
  _cleanup() {
    // IMPORTANT: destroys the DOM element when leaving the scene.
    // Without this, the HTML form persists on top of the next scene.
    if (this._dom) this._dom.destroy();
  }
 
  // Phaser calls shutdown() when a scene stops. Use it to guarantee cleanup
  // even if the scene transitions happen unexpectedly.
  shutdown() {
    this._cleanup();
  }
}