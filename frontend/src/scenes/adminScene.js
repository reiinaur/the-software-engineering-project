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
    btnBack.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      this.scene.start("menuScene");
    });

    this.add.text(CX - 45, CY - 220, "Admin / Vocab Editor", {
      fontFamily: "custom-font",
      fontSize: "80px",
      color: "#5d5384",
      fontWeight: "bold"
    }).setOrigin(0.5);

    // 2. State & UI Tracking Variables
    this._topicsList = [];
    this._selectedTopic = ""; 
    this._dropdownOpen = false;
    this._cursorVisible = true;
    this._vocabWords = [];
    this._vocabDefs = [];
    this._listScrollIndex = 0;
    this._selectedIndex = -1; 
    this._isEditMode = false;  

    this._inputValues = { newWord: "", newDef: "" };
    this._activeField = ""; 

    const baseTextStyle = { fontFamily: "custom-font", fontSize: "28px", color: "#5d5384" };
    const labelStyle = { fontFamily: "custom-font", fontSize: "24px", color: "#666" };

    // 3. Native Select Dropdown Components
    this.add.text(CX - 400, CY - 150, "topic", labelStyle).setOrigin(0, 0.5);
    
    this.dropdownBar = this.add.rectangle(CX - 30, CY - 110, 750, 44, 0xffffff, 0).setStrokeStyle(1.5, 0x5d5384).setInteractive({ useHandCursor: true });
    this.dropdownText = this.add.text(CX - 390, CY - 110, "Select a topic...", baseTextStyle).setOrigin(0, 0.5);
    this.dropdownArrow = this.add.text(CX + 320, CY - 110, "▼", baseTextStyle).setOrigin(0.5);
    
    this.dropdownContainer = this.add.container(0, 0).setDepth(20);
    
    this.dropdownBar.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 }); 
      this._toggleDropdown();
    });

    // 4. Vocabulary Words Native List Render Container
    this.add.text(CX - 400, CY - 40, "vocabulary", { ...baseTextStyle, fontWeight: "bold" }).setOrigin(0, 0.5);
    
    this.btnAdd = this.add.text(CX + 260, CY - 40, "+", { ...baseTextStyle, fontSize: "32px", color: "#999999" }).setOrigin(0.5);
    this.btnEdit = this.add.text(CX + 300, CY - 40, "✏", { ...baseTextStyle, fontSize: "26px", color: "#999999" }).setOrigin(0.5);
    this.btnDelete = this.add.text(CX + 340, CY - 40, "🗑", { ...baseTextStyle, fontSize: "26px", color: "#999999" }).setOrigin(0.5);

    this.btnAdd.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      if (!this._selectedTopic) return;
      this._isEditMode = false;
      this._toggleAddForm(true);
    });

    this.btnEdit.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      if (this._selectedIndex === -1) return;
      this._isEditMode = true;
      this._inputValues.newWord = this._vocabWords[this._selectedIndex];
      this._inputValues.newDef = this._vocabDefs[this._selectedIndex];
      this._toggleAddForm(true);
    });

    this.btnDelete.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      this._deleteWord();
    });

    this.listTextGroup = [];
    for (let i = 0; i < 5; i++) {
      let txt = this.add.text(CX - 400, CY + 10 + (i * 40), "", baseTextStyle)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      txt.on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 });
        const targetIndex = this._listScrollIndex + i;
        if (targetIndex < this._vocabWords.length) {
          this._selectedIndex = targetIndex;
          this._renderVocabList();
          this._updateToolbarButtons();
        }
      });

      this.listTextGroup.push(txt);
    }

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

    // 5. Form Elements (MODAL BOUND TO GRAPHIC CANVAS ASSET)
    this.formContainer = this.add.container(0, 0).setVisible(false);
    
    const formBgAsset = this.add.image(CX - 30, CY + 280, "flashcard").setScale(0.85);
    
    this.wordInputBg = this.add.rectangle(CX + 11, CY + 118, 540, 40, 0xffffff, 0).setStrokeStyle(1, 0xcccccc).setInteractive({ useHandCursor: true });
    this.defInputBg = this.add.rectangle(CX + 11, CY + 280, 540, 230, 0xffffff, 0).setStrokeStyle(1, 0xcccccc).setInteractive({ useHandCursor: true });
    
    const inputTextStyle = {
      fontFamily: "custom-font",
      fontSize: "26px",
      color: "#8c7ec0",
      lineSpacing: 14,
      wordWrap: { width: 540, useAdvancedWrap: true }
    };

    this.wordInputText = this.add.text(CX - 245, CY + 105, "word (max 50 chars)", inputTextStyle).setOrigin(0, 0);
    this.defInputText = this.add.text(CX - 249, CY + 165, "definition", inputTextStyle).setOrigin(0, 0);

    this.wordInputBg.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      this._switchInputField("newWord");
    });
    this.defInputBg.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      this._switchInputField("newDef");
    });

    const btnSave = this.add.rectangle(CX + 10, CY + 440, 160, 44, 0x5d5384).setInteractive({ useHandCursor: true });
    const btnSaveTxt = this.add.text(CX + 10, CY + 440, "Save", { ...baseTextStyle, color: "#ffffff" }).setOrigin(0.5);
    
    const btnCancel = this.add.rectangle(CX + 190, CY + 440, 160, 44, 0xffffff).setStrokeStyle(1.5, 0xccccee).setInteractive({ useHandCursor: true });
    const btnCancelTxt = this.add.text(CX + 190, CY + 440, "Cancel", { ...baseTextStyle, color: "#666666" }).setOrigin(0.5);

    btnSave.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      this._saveWord();
    });
    btnCancel.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      this._toggleAddForm(false);
    });

    this.formContainer.add([formBgAsset, this.wordInputBg, this.defInputBg, this.wordInputText, this.defInputText, btnSave, btnSaveTxt, btnCancel, btnCancelTxt]);

    this.statusText = this.add.text(CX - 30, CY + 500, "Please select a topic to view or add vocabulary.", { fontFamily: "custom-font", fontSize: "22px", color: "#8c7ec0" }).setOrigin(0.5);

    this.time.addEvent({
      delay: 530,
      callback: () => {
        this._cursorVisible = !this._cursorVisible;
        this._updateInputVisuals();
      },
      loop: true
    });

    this.input.keyboard.on("keydown", (e) => this._handleFormTyping(e));

    await this._fetchAllTopics();
    this._renderVocabList();
  }

  // --- ENGINE LOGIC OPERATIONS ---

  async _fetchAllTopics() {
    try {
      const res = await axios.get("/api/vocab/all");
      this._topicsList = res.data;
    } catch (err) {
      this._updateStatus("Failed to load list.", colours.accent || "#ff0000");
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
      const optionY = CY - 82 + (idx * 46);
      
      const itemBg = this.add.rectangle(CX - 30, optionY, 750, 44, 0xeee8ee, 1).setStrokeStyle(1, 0xeeeeee).setInteractive({ useHandCursor: true });
      const itemTxt = this.add.text(CX - 390, optionY, topicName, { fontFamily: "custom-font", fontSize: "24px", color: "#5d5384" }).setOrigin(0, 0.5);

      itemBg.on("pointerover", () => itemBg.setFillStyle(0xdcd5dc, 1));
      itemBg.on("pointerout", () => itemBg.setFillStyle(0xeee8ee, 1));
      
      itemBg.on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 });
        if (this._topicsList.length > 0) {
          this._selectedTopic = topicName;
          this._selectedIndex = -1; 
          this.dropdownText.setText(topicName).setColor("#5d5384");
          
          this.btnAdd.setColor("#5d5384").setInteractive({ useHandCursor: true });
          this._updateToolbarButtons();
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
      this._updateStatus(`Loaded ${this._vocabWords.length} terms.`, colours.success || "#00ff00");
    } catch (err) {
      this._updateStatus("Error downloading data.", colours.accent || "#ff0000");
    }
  }

  _renderVocabList() {
    this.listTextGroup.forEach((textObj, index) => {
      const actualDataIndex = this._listScrollIndex + index;

      textObj.setOrigin(0, 0.5);

      if (!this._selectedTopic) {
        textObj.setText(index === 0 ? "Select a topic above to view words." : "").setColor("#999999");
        return;
      }

      if (actualDataIndex < this._vocabWords.length) {
        const word = this._vocabWords[actualDataIndex];
        const rawDef = this._vocabDefs[actualDataIndex] || "";
        const clippedDef = rawDef.length > 35 ? rawDef.slice(0, 32) + "..." : rawDef;
        
        textObj.setText(`• ${word} (${clippedDef})`);
        textObj.setInteractive({ useHandCursor: true });

        if (actualDataIndex === this._selectedIndex) {
          textObj.setColor("#5d5384").setFontStyle("normal");
        } else {
          textObj.setColor("#858585").setFontStyle("normal");
        }
      } else {
        textObj.setText(actualDataIndex === 0 ? "No words yet — click + to add one." : "").setColor("#999999");
        textObj.disableInteractive();
      }
    });
  }

  _updateToolbarButtons() {
    if (this._selectedIndex !== -1) {
      this.btnEdit.setColor("#5d5384").setInteractive({ useHandCursor: true });
      this.btnDelete.setColor(colours.accent || "#ff0000").setInteractive({ useHandCursor: true });
    } else {
      this.btnEdit.setColor("#999999").disableInteractive();
      this.btnDelete.setColor("#999999").disableInteractive();
    }
  }

  _toggleAddForm(show) {
    if (show && !this._selectedTopic) return;

    this.formContainer.setVisible(show);
    if (!show) {
      this._switchInputField("");
      this._inputValues.newWord = "";
      this._inputValues.newDef = "";
      this._isEditMode = false;
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
      const limit = this._activeField === "newWord" ? 50 : 300;
      if (currentString.length < limit) {
        currentString += event.key;
      }
    }

    this._inputValues[this._activeField] = currentString;
    this._updateInputVisuals();
  }

  _updateInputVisuals() {
    const blink = this._cursorVisible ? "|" : " ";

    if (this._inputValues.newWord === "") {
      this.wordInputText.setText(this._activeField === "newWord" ? blink : "word (max 50 chars)").setColor(this._activeField === "newWord" ? "#5d5384" : "#999999");
    } else {
      this.wordInputText.setText(this._inputValues.newWord + (this._activeField === "newWord" ? blink : "")).setColor("#5d5384");
    }

    if (this._inputValues.newDef === "") {
      this.defInputText.setText(this._activeField === "newDef" ? blink : "definition").setColor(this._activeField === "newDef" ? "#5d5384" : "#999999");
    } else {
      this.defInputText.setText(this._inputValues.newDef + (this._activeField === "newDef" ? blink : "")).setColor("#5d5384");
    }
  }

  async _saveWord() {
    const topic = this._selectedTopic;
    const word = this._inputValues.newWord.trim();
    const def = this._inputValues.newDef.trim();

    if (!topic) { this._updateStatus("Select a topic first.", colours.accent || "#ff0000"); return; }
    if (!word || !def) { this._updateStatus("All fields required.", colours.accent || "#ff0000"); return; }

    try {
      if (this._isEditMode) {
        const originalWord = this._vocabWords[this._selectedIndex];
        await axios.put("/api/vocab/admin/update-word", {
          topicName: topic, targetWord: originalWord, newWord: word, newDefinition: def
        }, { headers: authHeader() });
        this._updateStatus(`✓ "${word}" updated successfully!`, colours.success || "#00ff00");
      } else {
        await axios.post("/api/vocab/admin/add-word", {
          topicName: topic, newWord: word, newDefinition: def
        }, { headers: authHeader() });
        this._updateStatus(`✓ "${word}" added successfully!`, colours.success || "#00ff00");
      }

      this._selectedIndex = -1; 
      this._toggleAddForm(false);
      this._updateToolbarButtons();
      await this._loadTopicData();
    } catch (err) {
      this._updateStatus(err.response?.data?.message || "Error saving word.", colours.accent || "#ff0000");
    }
  }

  async _deleteWord() {
    if (this._selectedIndex === -1) return;
    const wordToDelete = this._vocabWords[this._selectedIndex];

    if (!confirm(`Are you sure you want to permanently delete "${wordToDelete}"?`)) return;

    try {
      await axios.post("/api/vocab/admin/delete-word", {
        topicName: this._selectedTopic, targetWord: wordToDelete
      }, { headers: authHeader() });

      this._updateStatus(`🗑 "${wordToDelete}" deleted successfully.`, colours.success || "#00ff00");
      this._selectedIndex = -1;
      this._updateToolbarButtons();
      await this._loadTopicData();
    } catch (err) {
      this._updateStatus("Error removing word.", colours.accent || "#ff0000");
    }
  }

  _updateStatus(msg, hexColor) {
    this.statusText.setText(msg).setColor(hexColor);
  }
}