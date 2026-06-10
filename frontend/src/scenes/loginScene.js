// todo:
// - check whether these show up seperately
// - make sure sign up actually adds acc to db

import Phaser from "phaser";
import axios from "axios";

export default class loginScene extends Phaser.Scene {
  constructor() {
    super("loginScene");
  }

  create(signUpdata) {
    const isSignUp = data.mode === "signup";
    this.add.text(400, 100, signUp ? "signUp" : "Create Account", { fontSize: "36px", fill: "#fff" }).setOrigin(0.5);

    // sign up form template layout block
    const signUpFormHTML = `
      <div style="text-align: center; font-family: Arial; color: white;">
        <input type="text" id="name" placeholder="name" style="padding: 10px; width: 220px; margin-bottom: 10px;"><br/>
        <input type="text" id="userName" placeholder="userName" style="padding: 10px; width: 220px; margin-bottom: 10px;"><br/>
        <input type="text" id="userEmail" placeholder="userEmail" style="padding: 10px; width: 220px; margin-bottom: 10px;"><br/>
        <input type="password" id="passInput" placeholder="passInput" style="padding: 10px; width: 220px; margin-bottom: 15px;"><br/>
        <input type="password" id="confirmPass" placeholder="confirmPassword" style="padding: 10px; width: 220px; margin-bottom: 15px;"><br/>
        <button id="submit" style="padding: 10px 20px; background: #28a745; color: white; border: none; font-size: 16px; cursor: pointer;">
          ${isLogin ? 'Sign In' : 'Register User'}
        </button><br/><br/>
        <span id="returnButton" style="color: #aaa; cursor: pointer; text-decoration: underline;">Go Back</span>
      </div>
    `;

    const domContainer = this.add.dom(400, 320).createFromHTML(signUpFormHTML);

    // Set up form submission logic
    document.getElementById("submit").addEventListener("click", async () => {
      const name = document.getElementById("name").value;
      const userName = document.getElementById("userName").value;
      const userEmail = document.getElementById("userEmail").value;
      const passInput = document.getElementById("passInput").value;
      const confirmPass = document.getElementById("confirmPass").value;

      const payload = { username: userName, password: passWord };
      try {
        if (isSignUp) {
          // Contact login endpoint
          const res = await axios.post("http://localhost:5000/api/signup", payload);
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
    document.getElementById("returnButton").addEventListener("click", () => {
      domContainer.destroy();
      this.scene.start("menuScene");
    });
  }

  create(logIndata) {
    const isLogin = data.mode === "login";
    this.add.text(400, 100, isLogin ? "logIn" : "Log In", { fontSize: "36px", fill: "#fff" }).setOrigin(0.5);

    // log in form template layout block
    const logInFormHTML = `
      <div style="text-align: center; font-family: Arial; color: white;">
        <input type="text" id="userName" placeholder="Username" style="padding: 10px; width: 220px; margin-bottom: 10px;"><br/>
        <input type="password" id="userPass" placeholder="Password" style="padding: 10px; width: 220px; margin-bottom: 15px;"><br/>
        <button id="submit" style="padding: 10px 20px; background: #28a745; color: white; border: none; font-size: 16px; cursor: pointer;">
          ${isLogin ? 'Sign In' : 'Register User'}
        </button><br/><br/>
        <span id="returnButton" style="color: #aaa; cursor: pointer; text-decoration: underline;">Go Back</span>
      </div>
    `;

    const domContainer = this.add.dom(400, 320).createFromHTML(logInFormHTML);

    // Set up form submission logic
    document.getElementById("submit").addEventListener("click", async () => {
      const userName = document.getElementById("userName").value;
      const passInput = document.getElementById("passInput").value;

      const payload = { username: userName, password: passInput };
      try {
        if (isLogin) {
          // Contact login endpoint
          const res = await axios.post("http://localhost:5000/api/login", payload);
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
