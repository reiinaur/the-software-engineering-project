import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, colours, px, py } from "../utils/scale.js";
import { authHeader } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";

export default class adminScene extends Phaser.Scene {
  constructor() {
    super("adminScene");
  }

  async create() {
    if (gameState.role !== "admin") {
      this.scene.start("menuScene");
      return;
    }

    // 1. Scene Assets & Background Layout Setup
    this.add.image(CX, CY, "admin");

    const btnBack = this.add
      .image(CX - 810, CY - 440, "btn-go-back")
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(0.09)
      .setInteractive({ useHandCursor: true });

    btnBack.on("pointerover", () => btnBack.setScale(0.11));
    btnBack.on("pointerout", () => btnBack.setScale(0.09));
    btnBack.on("pointerdown", () => this.scene.start("menuScene"));

    // COMBINED NEW HEADER CHANGES HERE:
    this.add.text(CX - 45, CY - 220, "Admin / Vocab Editor", {
      fontFamily: "custom-font",
      fontSize: "80px",
      color: "#5d5384",
      fontWeight: "bold"
    }).setOrigin(0.5);

    // 2. State & UI Tracking Variables
    this._topicsList = [];
    this._selectedTopic = ""; // Initially empty — locks the Add vocabulary capabilities
    this._dropdownOpen = false;
    this._cursorVisible = true;
    this._vocabWords = [];
    this._vocabDefs = [];
    this._listScrollIndex = 0;

    this._inputValues = { newWord: "", newDef: "" };
    this._activeField = ""; // Tracks which manual add form input is selected

    const baseTextStyle = { fontFamily: "custom-font", fontSize: "16px", color: "#1a1a2e" };
    const labelStyle = { fontFamily: "custom-font", fontSize: "14px", color: "#666" };

    // 3. Native Select Dropdown Components
    this.add.text(CX - 180, CY - 150, "topic", labelStyle).setOrigin(0, 0.5);
    
    // Main Selection Box Bar
    this.dropdownBar = this.add.rectangle(CX, CY - 110, 360, 36, 0xffffff).setStrokeStyle(1.5, 0x333333).setInteractive({ useHandCursor: true });
    this.dropdownText = this.add.text(CX - 170, CY - 110, "Select a topic...", baseTextStyle).setOrigin(0, 0.5);
    this.dropdownArrow = this.add.text(CX + 150, CY - 110, "▼", baseTextStyle).setOrigin(0.5);
    
    this.dropdownContainer = this.add.container(0, 0).setDepth(20);

    this.dropdownBar.on("pointerdown", () => this._toggleDropdown());

    // 4. Vocabulary Words Native List Render Container
    this.add.text(CX - 180, CY - 60, "vocabulary", { ...baseTextStyle, fontWeight: "bold" }).setOrigin(0, 0.5);
    
    // List Toolbar Action Triggers — Locks visual color representation initially
    this.addBtn = this.add.text(CX + 110, CY - 60, "+", { ...baseTextStyle, fontSize: "20px", color: "#999999" }).setOrigin(0.5);
    this.editBtn = this.add.text(CX + 135, CY - 60, "✏", { ...baseTextStyle, fontSize: "16px", color: "#999999" }).setOrigin(0.5);
    this.deleteBtn = this.add.text(CX + 160, CY - 60, "🗑", { ...baseTextStyle, fontSize: "16px", color: "#999999" }).setOrigin(0.5);

    this.addBtn.on("pointerdown", () => {
      if (!this._selectedTopic) return;
      this._toggleAddForm(true);
    });

    this.listTextGroup = [];
    for (let i = 0; i < 5; i++) {
      let txt = this.add.text(CX - 180, CY - 25 + (i * 24), "", baseTextStyle).setOrigin(0, 0.5);
      this.listTextGroup.push(txt);
    }

    // Scroll Input Interactions via Mouse Wheel on Canvas
    this.input.on("pointerwheel", (pointer, overGameObjects, deltaX, deltaY) => {
      if (this._vocabWords.length <= 5) return;
      if (deltaY > 0 && this._listScrollIndex < this._vocabWords.length - 5) {
        this._listScrollIndex++;
        this._renderVocabList();
      } else if (deltaY < 0 && this._listScrollIndex > 0) {
        this._listScrollIndex--;
        this._renderVocabList();
      }
    });

    // 5. Interactive Modal Elements for Adding Words
    this.formContainer = this.add.container(0, 0).setVisible(false);
    
    this.formContainer.add(this.add.rectangle(CX, CY + 145, 360, 110, 0xfafafa).setStrokeStyle(1, 0xdddddd));
    
    // Manual Native Inputs
    this.wordInputBg = this.add.rectangle(CX, CY + 115, 340, 26, 0xffffff).setStrokeStyle(1, 0xcccccc).setInteractive({ useHandCursor: true });
    this.defInputBg = this.add.rectangle(CX, CY + 150, 340, 26, 0xffffff).setStrokeStyle(1, 0xcccccc).setInteractive({ useHandCursor: true });
    
    this.wordInputText = this.add.text(CX - 160, CY + 115, "word (max 50 chars)", { ...baseTextStyle, fontSize: "13px", color: "#999999" }).setOrigin(0, 0.5);
    this.defInputText = this.add.text(CX - 160, CY + 150, "definition", { ...baseTextStyle, fontSize: "13px", color: "#999999" }).setOrigin(0, 0.5);

    this.wordInputBg.on("pointerdown", () => this._switchInputField("newWord"));
    this.defInputBg.on("pointerdown", () => this._switchInputField("newDef"));

    // Save and Cancel Buttons
    const btnSave = this.add.rectangle(CX - 110, CY + 185, 80, 24, 0x1a1a2e).setInteractive({ useHandCursor: true });
    const btnSaveTxt = this.add.text(CX - 110, CY + 185, "Save", { ...baseTextStyle, fontSize: "13px", color: "#ffffff" }).setOrigin(0.5);
    
    const btnCancel = this.add.rectangle(CX - 20, CY + 185, 80, 24, 0xffffff).setStrokeStyle(1, 0xccccee).setInteractive({ useHandCursor: true });
    const btnCancelTxt = this.add.text(CX - 20, CY + 185, "Cancel", { ...baseTextStyle, fontSize: "13px", color: "#666666" }).setOrigin(0.5);

    btnSave.on("pointerdown", () => this._saveWord());
    btnCancel.on("pointerdown", () => this._toggleAddForm(false));

    this.formContainer.add([this.wordInputBg, this.defInputBg, this.wordInputText, this.defInputText, btnSave, btnSaveTxt, btnCancel, btnCancelTxt]);

    // Bottom Status Tracker Text Element
    this.statusText = this.add.text(CX, CY + 225, "Please select a topic to view or add vocabulary.", { fontFamily: "custom-font", fontSize: "13px", color: "#8c7ec0" }).setOrigin(0.5);

    // 6. Typing Event Handlers & Blink Loops
    this.time.addEvent({
      delay: 530,
      callback: () => {
        this._cursorVisible = !this._cursorVisible;
        this._updateInputVisuals();
      },
      loop: true
    });

    this.input.keyboard.on("keydown", (e) => this._handleFormTyping(e));

    // Fetch initial data
    await this._fetchAllTopics();
    this._renderVocabList(); // Initially renders placeholder notice
  }

  // --- COMPONENT LOGIC ENGINE OPERATIONS ---

  async _fetchAllTopics() {
    try {
      const res = await axios.get("/api/vocab/all");
      this._topicsList = res.data;
    } catch (err) {
      this._updateStatus("Failed to load list.", "#cc3333");
    }
  }

  _toggleDropdown() {
    this._dropdownOpen = !this._dropdownOpen;
    this.dropdownContainer.removeAll(true);

    if (!this._dropdownOpen) {
      this.dropdownArrow.setText("▼");
      return;
    }

    this.dropdownArrow.setText("▲");
    
    const displayedOptions = this._topicsList.length > 0 ? this._topicsList : ["No topics found"];

    displayedOptions.forEach((topicName, idx) => {
      const optionY = CY - 92 + (idx * 30);
      
      const itemBg = this.add.rectangle(CX, optionY, 360, 30, 0xffffff).setStrokeStyle(1, 0xeeeeee).setInteractive({ useHandCursor: true });
      const itemTxt = this.add.text(CX - 170, optionY, topicName, { fontFamily: "custom-font", fontSize: "14px", color: "#1a1a2e" }).setOrigin(0, 0.5);

      itemBg.on("pointerover", () => itemBg.setFillStyle(0xeeeeff));
      itemBg.on("pointerout", () => itemBg.setFillStyle(0xffffff));
      
      itemBg.on("pointerdown", () => {
        if (this._topicsList.length > 0) {
          this._selectedTopic = topicName;
          this.dropdownText.setText(topicName).setColor("#1a1a2e");
          
          // Unlock Add Vocabulary button once a topic is verified and chosen
          this.addBtn.setColor("#1a1a2e").setInteractive({ useHandCursor: true });
          
          this._loadTopicData();
        }
        this._toggleDropdown();
      });

      this.dropdownContainer.add([itemBg, itemTxt]);
    });
  }

  async _loadTopicData() {
    if (!this._selectedTopic) return;
    this._updateStatus("Loading content...", "#555555");

    try {
      const res = await axios.get(`/api/vocab/${encodeURIComponent(this._selectedTopic)}`);
      this._vocabWords = res.data.words || [];
      this._vocabDefs = res.data.definitions || [];
      this._listScrollIndex = 0;
      this._renderVocabList();
      this._updateStatus(`Loaded ${this._vocabWords.length} terms.`, "#44aa77");
    } catch (err) {
      this._updateStatus("Error downloading data.", "#cc3333");
    }
  }

  _renderVocabList() {
    this.listTextGroup.forEach((textObj, index) => {
      const actualDataIndex = this._listScrollIndex + index;

      if (!this._selectedTopic) {
        textObj.setText(index === 0 ? "Select a topic above to view words." : "").setColor("#999999");
        return;
      }

      if (actualDataIndex < this._vocabWords.length) {
        const word = this._vocabWords[actualDataIndex];
        const rawDef = this._vocabDefs[actualDataIndex] || "";
        const clippedDef = rawDef.length > 25 ? rawDef.slice(0, 22) + "..." : rawDef;
        
        textObj.setText(`• ${word} (${clippedDef})`).setColor("#1a1a2e");
      } else {
        textObj.setText(actualDataIndex === 0 ? "No words yet — click + to add one." : "");
        if (actualDataIndex === 0) textObj.setColor("#999999");
      }
    });
  }

  _toggleAddForm(show) {
    if (show && !this._selectedTopic) return;

    this.formContainer.setVisible(show);
    if (!show) {
      this._switchInputField("");
      this._inputValues.newWord = "";
      this._inputValues.newDef = "";
    } else {
      this._switchInputField("newWord");
    }
  }

  _switchInputField(field) {
    this._activeField = field;
    this._updateInputVisuals();
  }

  _handleFormTyping(event) {
    if (!this._activeField || !this.formContainer.visible) return;

    let currentString = this._inputValues[this._activeField];

    if (event.key === "Backspace") {
      currentString = currentString.slice(0, -1);
    } else if (event.key === "Tab") {
      event.preventDefault();
      this._switchInputField(this._activeField === "newWord" ? "newDef" : "newWord");
      return;
    } else if (event.key === "Enter") {
      this._saveWord();
      return;
    } else if (event.key.length === 1) {
      const limit = this._activeField === "newWord" ? 50 : 150;
      if (currentString.length < limit) {
        currentString += event.key;
      }
    }

    this._inputValues[this._activeField] = currentString;
    this._updateInputVisuals();
  }

  _updateInputVisuals() {
    const blink = this._cursorVisible ? "|" : " ";

    // Handle Word Field Render states
    if (this._inputValues.newWord === "") {
      this.wordInputText.setText(this._activeField === "newWord" ? blink : "word (max 50 chars)").setColor(this._activeField === "newWord" ? "#1a1a2e" : "#999999");
    } else {
      this.wordInputText.setText(this._inputValues.newWord + (this._activeField === "newWord" ? blink : "")).setColor("#1a1a2e");
    }

    // Handle Definition Field Render states
    if (this._inputValues.newDef === "") {
      this.defInputText.setText(this._activeField === "newDef" ? blink : "definition").setColor(this._activeField === "newDef" ? "#1a1a2e" : "#999999");
    } else {
      this.defInputText.setText(this._inputValues.newDef + (this._activeField === "newDef" ? blink : "")).setColor("#1a1a2e");
    }
  }

  async _saveWord() {
    const topic = this._selectedTopic;
    const word = this._inputValues.newWord.trim();
    const def = this._inputValues.newDef.trim();

    if (!topic) { this._updateStatus("Select a topic first.", "#cc3333"); return; }
    if (!word || !def) { this._updateStatus("All fields required.", "#cc3333"); return; }

    try {
      await axios.post("/api/vocab/admin/add-word", {
        topicName: topic, newWord: word, newDefinition: def
      }, { headers: authHeader() });

      this._updateStatus(`✓ "${word}" added successfully!`, "#44aa77");
      this._toggleAddForm(false);
      await this._loadTopicData();
    } catch (err) {
      this._updateStatus(err.response?.data?.message || "Error saving word.", "#cc3333");
    }
  }

  _updateStatus(msg, hexColor) {
    this.statusText.setText(msg).setColor(hexColor);
  }
}