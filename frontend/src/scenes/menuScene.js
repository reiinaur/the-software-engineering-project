import Phaser from "phaser";

export default class menuScene extends Phaser.Scene {
  constructor() {
    super("menuScene");
  }

  create() {
    this.add.text(400, 150, "THE TYPING TIMES", { fontSize: "42px", fill: "#fff" }).setOrigin(0.5);

    // login button
    const logIn = this.add.text(400, 300, "- login", { fontSize: "28px", fill: "#ffffff", cursor: "pointer" }).setOrigin(0.5);
    logIn.setInteractive({ useHandCursor: true });
    logIn.on("pointerdown", () => {
      this.scene.start("loginScene", { mode: "login" }); // Passes data to the next scene
    });
    
    // Create a text button for Sign Up
    const signUp = this.add.text(400, 380, "- start new game", { fontSize: "28px", fill: "#ffffff", cursor: "pointer" }).setOrigin(0.5);
    signUp.setInteractive({ useHandCursor: true });
    signUp.on("pointerdown", () => {
      this.scene.start("loginScene", { mode: "signup" });
    });

  }
}
