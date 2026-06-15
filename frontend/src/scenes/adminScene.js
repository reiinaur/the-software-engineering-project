// REWRITTEN: your original adminScene was a copy of the login form.
// This is the actual vocab editor — lets admins add words to topics.
// Accessible only when gameState.role === 'admin'.
 
import Phaser from "phaser";
import axios from "axios";
import { authHeader } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
 
export default class adminScene extends Phaser.Scene {
  constructor() {
    super("adminScene");
  }
 
  async create() {
    const W = this.scale.width;
 
    // Belt-and-suspenders: redirect if non-admin somehow reaches this scene.
    // The server also enforces this via @admin_required, but checking early
    // saves an unnecessary network round trip.
    if (gameState.role !== 'admin') {
      this.scene.start("menuScene");
      return;
    }
 
    this.add.text(W / 2, 38, "ADMIN — VOCAB EDITOR", {
      fontSize: "26px", fill: "#e94560", fontStyle: "bold"
    }).setOrigin(0.5);
 
    this.add.text(25, 15, "← Back", {
      fontSize: "16px", fill: "#aaaaaa"
    }).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { this._cleanup(); this.scene.start("menuScene"); });
 
    // Load existing topics to display a summary
    await this._loadAndDisplayTopics();
 
    // Build the "add word" form
    const formHTML = `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <p style="color:#aaa; font-size:13px; margin-bottom:8px;">Add word to existing topic:</p>
        <input type="text" id="topicName" placeholder="Topic (e.g. OOP)" /><br/>
        <input type="text" id="newWord"   placeholder="New Word (max 50 chars)" /><br/>
        <input type="text" id="newDef"    placeholder="Definition" /><br/>
        <button id="add-btn"  class="form-btn" style="margin-top:6px;">ADD WORD</button>
        <button id="new-btn"  class="form-btn" style="background:#4466bb; margin-top:6px;">CREATE NEW TOPIC</button>
        <p id="status-msg" style="font-size:14px; min-height:18px; margin-top:6px;"></p>
      </div>
    `;
 
    this._dom = this.add.dom(W / 2, 430).createFromHTML(formHTML);
 
    document.getElementById("add-btn").addEventListener("click",  () => this._addWord());
    document.getElementById("new-btn").addEventListener("click",  () => this._createTopic());
  }
 
  async _loadAndDisplayTopics() {
    // This is the GET /api/vocab/<topic> endpoint — but we need all topics.
    // For now, display a static label; you can extend the backend with a GET /api/vocab/all route.
    this.add.text(400, 90, "Manage vocabulary topics below.", {
      fontSize: "14px", fill: "#666688"
    }).setOrigin(0.5);
  }
 
  async _addWord() {
    const topicName  = document.getElementById("topicName")?.value.trim();
    const newWord    = document.getElementById("newWord")?.value.trim();
    const newDef     = document.getElementById("newDef")?.value.trim();
    const statusEl   = document.getElementById("status-msg");
 
    if (!topicName || !newWord || !newDef) {
      statusEl.textContent = "All fields are required.";
      statusEl.style.color = "#e94560";
      return;
    }
    if (newWord.length > 50) {
      statusEl.textContent = "Word must be 50 characters or fewer.";
      statusEl.style.color = "#e94560";
      return;
    }
 
    try {
      await axios.post("/api/vocab/admin/add-word", {
        topicName, newWord, newDefinition: newDef
      }, { headers: authHeader() });
 
      statusEl.textContent = `✓ "${newWord}" added to ${topicName}.`;
      statusEl.style.color = "#44aa77";
      // Clear the word/def fields but keep the topic selected for rapid entry
      document.getElementById("newWord").value = "";
      document.getElementById("newDef").value  = "";
 
    } catch (err) {
      statusEl.textContent = err.response?.data?.message || "Error adding word.";
      statusEl.style.color = "#e94560";
    }
  }
 
  async _createTopic() {
    const topicName = document.getElementById("topicName")?.value.trim();
    const statusEl  = document.getElementById("status-msg");
 
    if (!topicName) {
      statusEl.textContent = "Enter a topic name first.";
      statusEl.style.color = "#e94560";
      return;
    }
 
    try {
      await axios.post("/api/vocab/admin/create", {
        topicName, words: [], definitions: []
      }, { headers: authHeader() });
 
      statusEl.textContent = `✓ Topic "${topicName}" created. Now add words to it.`;
      statusEl.style.color = "#44aa77";
 
    } catch (err) {
      statusEl.textContent = err.response?.data?.message || "Error creating topic.";
      statusEl.style.color = "#e94560";
    }
  }
 
  _cleanup() {
    if (this._dom) this._dom.destroy();
  }
 
  shutdown() {
    this._cleanup();
  }
}