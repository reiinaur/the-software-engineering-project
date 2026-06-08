import Phaser from "phaser";
import axios from "axios";

export default class loginScene extends Phaser.Scene {
  constructor() {
    super("loginScene");
  }

  create(data) {
    const isLogin = data.mode === "login";
    this.add.text(400, 100, isLogin ? "Account Login" : "Create Account", { fontSize: "36px", fill: "#fff" }).setOrigin(0.5);

    // Form template layout block
    const formHTML = `
      <div style="text-align: center; font-family: Arial; color: white;">
        <input type="text" id="auth-username" placeholder="Username" style="padding: 10px; width: 220px; margin-bottom: 10px;"><br/>
        <input type="password" id="auth-password" placeholder="Password" style="padding: 10px; width: 220px; margin-bottom: 15px;"><br/>
        <button id="auth-submit-btn" style="padding: 10px 20px; background: #28a745; color: white; border: none; font-size: 16px; cursor: pointer;">
          ${isLogin ? 'Sign In' : 'Register User'}
        </button><br/><br/>
        <span id="auth-back-btn" style="color: #aaa; cursor: pointer; text-decoration: underline;">Go Back</span>
      </div>
    `;

    const domContainer = this.add.dom(400, 320).createFromHTML(formHTML);

    // Set up form submission logic
    document.getElementById("auth-submit-btn").addEventListener("click", async () => {
      const uName = document.getElementById("auth-username").value;
      const pWord = document.getElementById("auth-password").value;

      const payload = new URLSearchParams();
      payload.append("username", uName);
      payload.append("password", pWord);

      try {
        if (isLogin) {
          // Contact login endpoint
          const res = await axios.post("http://localhost:5000/login", payload);
          localStorage.setItem("userToken", res.data.token);
          
          domContainer.destroy(); // Safely remove element layout before transition
          this.scene.start("gameScene"); // Redirect inside Phaser!
        } else {
          // Contact registration workflow endpoint (if matching your auth.py logic later)
          alert("Registration simulated successfully! Try logging in.");
          this.scene.start("menuScene");
        }
      } catch (err) {
        alert("Authentication challenge transaction rejected!");
      }
    });

    // Handle back navigational elements
    document.getElementById("auth-back-btn").addEventListener("click", () => {
      domContainer.destroy();
      this.scene.start("menuScene");
    });
  }
}
