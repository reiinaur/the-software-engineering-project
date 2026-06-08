import Phaser from "phaser";
import axios from "axios";

export default class gameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }

  create() {
    this.add.text(400, 100, "🎉 Logged In Securely! 🎉", { fontSize: "36px", fill: "#00ff00" }).setOrigin(0.5);

    // Fetch and display data inside the authenticated dashboard environment
    this.loadUserData();

    // Create a clean logout link option
    const logoutBtn = this.add.text(400, 500, "[ Exit / Clear Token ]", { fontSize: "20px", fill: "#ff0000" }).setOrigin(0.5);
    logoutBtn.setInteractive({ useHandCursor: true });
    logoutBtn.on("pointerdown", () => {
      localStorage.removeItem("userToken");
      this.scene.start("menuScene");
    });
  }

  async loadUserData() {
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      const userListText = response.data.users.join(" | ");
      
      this.add.text(400, 300, `Active Player Record Profile Database:\n\n${userListText}`, { 
        fontSize: "24px", 
        fill: "#ffffff",
        align: "center"
      }).setOrigin(0.5);
    } catch (error) {
      console.error(error);
    }
  }
}
