import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, COLORS, px, py } from "../utils/scale.js";
import { authHeader } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";

// ⚠️ Centre of the paper/form area in your clipboard drawing:
const FORM_X = px(62);
const FORM_Y = py(57);
const FORM_W = px(36);  // form field width

export default class adminScene extends Phaser.Scene {
  constructor() { super("adminScene"); }

  async create() {
    if (gameState.role !== "admin") { this.scene.start("menuScene"); return; }

    this.cameras.main.setBackgroundColor("#e8e8e8");
    this.add.image(CX, CY, "ui-admin-bg");

    // Back arrow — position over wherever you drew it on the clipboard
    const back = this.add.text(px(16), py(22), "←", {
      fontFamily: "Arial", fontSize: FONT.lg, color: "#1a1a2e"
    }).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => { this._cleanup(); this.scene.start("menuScene"); });

    // "Admin / Vocab Editor" title — if you drew this in your background, omit this line
    this.add.text(CX, py(29), "Admin / Vocab Editor", {
      fontFamily: "Georgia, serif", fontSize: FONT.lg, color: "#1a1a2e"
    }).setOrigin(0.5);

    const formHTML = `
      <div style="width:${FORM_W}px;font-family:'Roboto Mono',monospace;">
        <div style="margin-bottom:14px;">
          <label style="font-size:15px;color:#444;display:block;margin-bottom:5px;">topic</label>
          <input type="text" id="topicInput" placeholder="e.g. Object Oriented Programming"
            style="width:100%;padding:9px 14px;border:1.5px solid #333;border-radius:20px;
                   font-family:'Roboto Mono',monospace;font-size:14px;color:#1a1a2e;
                   background:white;outline:none;box-sizing:border-box;" />
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:17px;font-weight:bold;color:#1a1a2e;">vocabulary</span>
          <span id="add-btn" style="font-size:22px;color:#555;cursor:pointer;" title="Add word">+  ✏  🗑</span>
        </div>
        <div id="word-list" style="font-size:14px;color:#1a1a2e;line-height:2.2;
             max-height:180px;overflow-y:auto;padding-right:4px;">
          <span style="color:#999;">Select a topic and click Load.</span>
        </div>
        <div id="add-form" style="display:none;margin-top:12px;border-top:1px solid #ddd;padding-top:10px;">
          <input type="text" id="newWord" placeholder="word (max 50 chars)"
            style="width:100%;padding:6px 10px;border:1px solid #ccc;margin-bottom:7px;
                   font-family:'Roboto Mono',monospace;font-size:13px;outline:none;box-sizing:border-box;" />
          <input type="text" id="newDef" placeholder="definition"
            style="width:100%;padding:6px 10px;border:1px solid #ccc;margin-bottom:9px;
                   font-family:'Roboto Mono',monospace;font-size:13px;outline:none;box-sizing:border-box;" />
          <div style="display:flex;gap:9px;">
            <button id="save-btn" style="padding:7px 18px;background:#1a1a2e;color:white;
                    border:none;font-size:13px;cursor:pointer;border-radius:4px;">Save</button>
            <button id="cancel-btn" style="padding:7px 14px;background:transparent;color:#666;
                    border:1px solid #ccc;font-size:13px;cursor:pointer;border-radius:4px;">Cancel</button>
          </div>
        </div>
        <div style="display:flex;gap:9px;margin-top:13px;">
          <button id="load-btn" style="padding:7px 16px;background:#1a1a2e;color:white;
                  border:none;font-size:13px;cursor:pointer;border-radius:4px;">Load topic</button>
          <button id="new-topic-btn" style="padding:7px 14px;background:transparent;color:#555;
                  border:1px solid #aaa;font-size:13px;cursor:pointer;border-radius:4px;">New topic</button>
        </div>
        <p id="status" style="font-size:12px;min-height:16px;margin-top:8px;color:#555;"></p>
      </div>
    `;

    this._dom = this.add.dom(FORM_X, FORM_Y).createFromHTML(formHTML);

    document.getElementById("load-btn").addEventListener("click",       () => this._loadTopic());
    document.getElementById("new-topic-btn").addEventListener("click",  () => this._createTopic());
    document.getElementById("add-btn").addEventListener("click",        () => {
      document.getElementById("add-form").style.display = "block";
    });
    document.getElementById("cancel-btn").addEventListener("click",     () => {
      document.getElementById("add-form").style.display = "none";
    });
    document.getElementById("save-btn").addEventListener("click",       () => this._saveWord());
  }

  async _loadTopic() {
    const topic  = document.getElementById("topicInput")?.value.trim();
    const status = document.getElementById("status");
    if (!topic) { status.textContent = "Enter a topic first."; return; }
    status.textContent = "Loading...";
    try {
      const res = await axios.get(`/api/vocab/${encodeURIComponent(topic)}`, { headers: authHeader() });
      const el  = document.getElementById("word-list");
      if (el) {
        el.innerHTML = res.data.words.length === 0
          ? `<span style="color:#999;">No words yet — click + to add one.</span>`
          : res.data.words.map((w, i) =>
              `<div>- ${w} <span style="color:#aaa;font-size:12px;">${res.data.definitions[i] ? `(${res.data.definitions[i].slice(0, 40)}...)` : ""}</span></div>`
            ).join("");
      }
      status.textContent = `Loaded ${res.data.words.length} word(s).`;
      status.style.color = "#44aa77";
    } catch (err) {
      status.textContent = err.response?.data?.message || "Topic not found.";
      status.style.color = "#cc3333";
    }
  }

  async _saveWord() {
    const topic  = document.getElementById("topicInput")?.value.trim();
    const word   = document.getElementById("newWord")?.value.trim();
    const def    = document.getElementById("newDef")?.value.trim();
    const status = document.getElementById("status");
    if (!topic || !word || !def) { status.textContent = "All fields required."; return; }
    if (word.length > 50) { status.textContent = "Word must be ≤ 50 chars."; return; }
    try {
      await axios.post("/api/vocab/admin/add-word", {
        topicName: topic, newWord: word, newDefinition: def
      }, { headers: authHeader() });
      status.textContent = `✓ "${word}" added.`;
      status.style.color = "#44aa77";
      document.getElementById("newWord").value = "";
      document.getElementById("newDef").value  = "";
      document.getElementById("add-form").style.display = "none";
      await this._loadTopic();
    } catch (err) {
      status.textContent = err.response?.data?.message || "Error saving word.";
      status.style.color = "#cc3333";
    }
  }

  async _createTopic() {
    const topic  = document.getElementById("topicInput")?.value.trim();
    const status = document.getElementById("status");
    if (!topic) { status.textContent = "Enter a topic name first."; return; }
    try {
      await axios.post("/api/vocab/admin/create", {
        topicName: topic, words: [], definitions: []
      }, { headers: authHeader() });
      status.textContent = `✓ Topic "${topic}" created.`;
      status.style.color = "#44aa77";
    } catch (err) {
      status.textContent = err.response?.data?.message || "Error (may already exist).";
      status.style.color = "#cc3333";
    }
  }

  _cleanup() { if (this._dom) this._dom.destroy(); }
  shutdown()  { this._cleanup(); }
}