/*:
 * @plugindesc Built for 古今東西おきつね物語.
 * Contains an number of patches/addons for other plugin functions.
 * @author CygnarJake
 *
 * @help
 * Some modifications may be present in the actual files of the below plugins.
 * Said modifications should be marked with "OKITSUNE" where they are present.
 */
 
//=============================================================================
// ** YEP_CoreEngine
//=============================================================================
(function () {
    const MULTIPLIER_SYMBOL = "\u00D7";
    const _numberWidth = Window_ItemList.prototype.numberWidth;
    Window_ItemList.prototype.numberWidth = function () {
        return this.textWidth(MULTIPLIER_SYMBOL + "000");
    };
    const _drawItemNumber = Window_ItemList.prototype.drawItemNumber;
    Window_ItemList.prototype.drawItemNumber = function (item, x, y, width) {
        if (this.needsNumber()) {
            this.drawText(MULTIPLIER_SYMBOL, x, y, width - this.textWidth('00'), 'right');
            this.drawText($gameParty.numItems(item), x, y, width, 'right');
        }
    };
    // Use a freeze trigger rather than blanking it and redefining it in common events every time.
    const _updateEvents = Game_Map.prototype.updateEvents;
    Game_Map.prototype.updateEvents = function () {
        if ($gameTemp._freezeMap)
            return;
        _updateEvents.call(this);
    };
})();

//=============================================================================
// ** MessageWindowHidden
//=============================================================================
(function () {
    // Unhide message window with arrow keys + Escape
    const EXTRA_KEYS = ["up", "down", "left", "right", "escape"];
    const _Window_Message_isTriggeredHidden = Window_Message.prototype.isTriggeredHidden;
    Window_Message.prototype.isTriggeredHidden = function () {
        if (_Window_Message_isTriggeredHidden.call(this)) {
            return true;
        }
        if (!this.isHidden() || this.disableWindowHidden()) {
            return false;
        }
        return EXTRA_KEYS.some(key => Input.isTriggered(key));
    };
})();

//=============================================================================
// ** SceneGlossary
//=============================================================================
 //* Language-specific description tags
 //* <SG説明:...> / <SGDescription:...>          ← source-language
 //* <SG説明_English:...>   <SGDescription_English:...>
 //* <SG説明_Português:...> <SGDescription_Português:...>  etc.
 //* The suffix must match ConfigManager.getLanguage().
(function () {
    'use strict';
    const _origGetDesc = Window_Glossary.prototype.getDescription;
    Window_Glossary.prototype.getDescription = function (pageIdx) {
        const lang = ConfigManager.getLanguage();
        const desc = this.getMetaContents([`説明_${lang}`, `Description_${lang}`], pageIdx);
        if (desc)
            return this._postProcessDescription(desc);
        return _origGetDesc.call(this, pageIdx);
    };
    Window_Glossary.prototype._postProcessDescription = Window_Glossary.prototype._postProcessDescription || function (text) {
        const data = this._itemData;
        text = text.replace(/\x1bEFFECT_TYPE\[(\d+)]/gi, () => Window_Glossary.effectCodeDesc[data.effects[+RegExp.$1].code]);
        text = text.replace(/\x1bDATA\[(\w+)]/gi, () => data[RegExp.$1]);
        text = text.replace(/\x1bSCRIPT{(.+)}/gi, () => eval(RegExp.$1));
        text = text.replace(/\x1bCOMMON\[(\d+)]/gi, () => {
            this._itemData = $dataItems[+RegExp.$1];
            const c = this.getCommonDescription();
            this._itemData = data;
            return c;
        });
        if (this._enemy)
            text = this.convertEnemyData(text);
        return text;
    };

})();
//___________________________
// * Replaced "Game_Party.prototype.isSameGlossaryType" function in the main plugin file with a new version directly below the original.
// * Replaced "typeof TranslationManager !== 'undefined'" checks in "Scene_Glossary.prototype.updateHelp" and "Window_Glossary.prototype.drawItemText" with simply "(false)" as I was getting issues with the function not being defined suddenyl, and after checking the unaltered vanilla files, it indeed is not defined anywhere so I'm not sure why I'm only now getting errors for it. Oh well.

//=============================================================================
// ** TitleImageChange and TitleCall + GameTitle
//=============================================================================
// Game Title transaltion and Title Screen sound effects
(function () {
    'use strict';
    const TITLE_LANG = {
        "日本語": {
            GameTitle: "古今東西おきつね物語",
            SEFiles: ["title_02", "title_03", "title_04", "title_05", "title_06", "Title_kokuri", "Title_kokuri2", "Title_kokuri3"]
        },
        "English": {
            GameTitle: "Nine-Tailed Okitsune Tale",
            SEFiles: ["title_kohaku", "title_kohaku", "title_monini"]
        },
        "Español": {
            GameTitle: "Nine-Tailed Okitsune Tale",
            SEFiles: ["title_kohaku", "title_kohaku", "title_monini"]
        },
        "Português": {
            GameTitle: "Nine-Tailed Okitsune Tale",
            SEFiles: ["title_kohaku", "title_kohaku", "title_monini"]
        },
        "한국어": {
            GameTitle: "마케몬!: 아홉 꼬리 여우의 이야기",
            SEFiles: ["Title_Empty"]
        },
        "简体中文": {
            GameTitle: "古今东西狐狸物语",
            SEFiles: ["Okitune_CN"]
        }
    };
	// Apply localized Game Title
    function applyLocalizedTitle() {
        const lang = ConfigManager.getLanguage();
        const data = TITLE_LANG[lang];
        if (!data || !data.GameTitle)
            return;
        if ($gameSystem)
            $gameSystem._gameTitle = data.GameTitle;
        document.title = data.GameTitle;
        if (Graphics._updateTitle)
            Graphics._updateTitle();
    }
    
    const _ConfigManager_load = ConfigManager.load;
    ConfigManager.load = function () {
        _ConfigManager_load.apply(this, arguments);
        applyLocalizedTitle();
    };
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.apply(this, arguments);
        applyLocalizedTitle();
    };
    const _Scene_Title_start = Scene_Title.prototype.start;
    Scene_Title.prototype.start = function () {
        _Scene_Title_start.apply(this, arguments);
        applyLocalizedTitle();
    };
	// TitleCall SE Override
    const tcParam = PluginManager.parameters('TitleCall') || {};
    Scene_Title.prototype.playTitleCall = function () {
        if (this.isReturnToTitle && this.isReturnToTitle())
            return;
        if (tcParam.condition && !eval(tcParam.condition))
            return;
        const lang = ConfigManager.getLanguage();
        const data = TITLE_LANG[lang];
        let name = null;
        if (data && data.SEFiles && data.SEFiles.length) {
            name = data.SEFiles[Math.randomInt(data.SEFiles.length)];
        } else if (tcParam.randomList && tcParam.randomList.length) {
            name = tcParam.randomList[Math.randomInt(tcParam.randomList.length)];
        } else {
            name = tcParam.name;
        }
        if (!name)
            return;
        const se = {
            name: name,
            volume: Number(tcParam.volume || 90),
            pitch: Number(tcParam.pitch || 100),
            pan: Number(tcParam.pan || 0)
        };
        if (tcParam.delay) {
            setTimeout(() => AudioManager.playSe(se), Number(tcParam.delay));
        } else {
            AudioManager.playSe(se);
        }
    };
    // Make newest savefile timestamp take priority in TitleImageChange
    DataManager._compareOrderForGradeVariable = function (a, b) {
        if (!a)
            return 1;
        if (!b)
            return -1;
        return (b.timestamp || 0) - (a.timestamp || 0);
    };
})();

//=============================================================================
// ** TMMoveEx
//=============================================================================
(function () {
    const params = PluginManager.parameters("TMMoveEx");
    const DONT_PASS_REGION_ID = Number(params.dontPassRegionId || 252);
    const _Game_Event_isMapPassable = Game_Event.prototype.isMapPassable;
    // If this event has the tag <Through_dontPassFIX> and Through is ON, allow stepping into tiles marked with dontPassRegionId.
    Game_Event.prototype.isMapPassable = function (x, y, d) {
        if (this.isThrough() && this.loadTagParam && this.loadTagParam("Through_dontPassFIX")) {
            const x2 = $gameMap.roundXWithDirection(x, d);
            const y2 = $gameMap.roundYWithDirection(y, d);
            if ($gameMap.regionId(x2, y2) === DONT_PASS_REGION_ID) {
                return true;
            }
        }
        return _Game_Event_isMapPassable.call(this, x, y, d);
    };
})();

//=============================================================================
// ** SRD_TranslationEngine
//=============================================================================
(function ($) {
    if (!$) return;
    // Switch the whole game to the language's default font.
    Game_System.prototype.applyLanguageFont = function () {
        const lang = (typeof ConfigManager.getLanguage === "function") ? ConfigManager.getLanguage() : ConfigManager.language;
        let font = "GameFont";
        if ($.langFonts && $.langFonts[lang]) {
            font = $.langFonts[lang];
        } else if (typeof Yanfly !== "undefined" && Yanfly.Param && Yanfly.Param.MSGFontName) {
            font = Yanfly.Param.MSGFontName;
        } else if (typeof Yanfly !== "undefined" && Yanfly.Param && Yanfly.Param.DefaultFont) {
            font = Yanfly.Param.DefaultFont;
        }
        this.setMessageFontName(font);
        if (typeof Yanfly !== "undefined" && Yanfly.Param) {
            Yanfly.Param.DefaultFont = font;
        }
        if (typeof Bitmap !== "undefined") {
            Bitmap.prototype.fontFace = font;
        }
    };
    // Apply once on New Game.
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        _Game_System_initialize.apply(this, arguments);
        this.applyLanguageFont();
    };
    // React when language changes.
    const descriptor = Object.getOwnPropertyDescriptor(ConfigManager, "language");
    Object.defineProperty(ConfigManager, "language", {
        configurable: true,
        get: descriptor && descriptor.get ? descriptor.get : function () {
            return this._language || 0;
        },
        set(value) {
            if (descriptor && descriptor.set) {
                descriptor.set.call(this, value);
            } else {
                this._language = value;
            }
            if ($gameSystem && $gameSystem.applyLanguageFont) {
                $gameSystem.applyLanguageFont();
            }
        }
    });
    // Re-apply after loading save.
    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManager_extractSaveContents.call(this, contents);
        if ($gameSystem && $gameSystem.applyLanguageFont) {
            $gameSystem.applyLanguageFont();
        }
    };
})(SRD.TranslationEngine);

// === Currency Unit ===
(function () {
    const UNITS = {
        "日本語": "銭",
        "English": "SEN",
        "Español": "SEN",
        "Português": "SEN",
        "한국어": "전",
        "简体中文": "钱"
    };
    Object.defineProperty(TextManager, "currencyUnit", {
        configurable: true,
        get() {
            const lang = ConfigManager.getLanguage() || "日本語";
            return UNITS[lang] || UNITS["日本語"];
        }
    });
})();

// Steamworks Language Detect
(function () {
	// Map Steam API language codes to SRD_TranslationEngine language names
	// https://partner.steamgames.com/doc/store/localization/languages
    const STEAM_MAP = {
        japanese: "日本語",
        english: "English",
        latam: "Español",
        brazilian: "Português",
        koreana: "한국어",
        schinese: "简体中文"
    };
    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function (config) {
        _ConfigManager_applyData.apply(this, arguments);
        if (config && config.language !== undefined) {
            return;
        }
        if (typeof steamworks === "undefined" || typeof steamworks.getCurrentGameLanguage !== "function") {
            return;
        }
        const steamLang = steamworks.getCurrentGameLanguage();
        const mapped = STEAM_MAP[steamLang];
        if (!mapped)
            return;
        const langs = SRD.TranslationEngine.languages;
        if (langs && langs.includes(mapped)) {
            this.language = langs.indexOf(mapped) + 1;
        } else if (mapped === SRD.TranslationEngine.sourceName) {
            this.language = 0;
        }
    };
})();

//___________________________
// * Made several edits in the main plugin file in places so that the correct font is always applied.

//=============================================================================
// ** SRD_TimerUpgrade
//=============================================================================
(function () {
    const HIDE_SWITCH_ID = 11;
    const _Scene_Base_createTimer = Scene_Base.prototype.createTimer;
    Scene_Base.prototype.createTimer = function () {
        _Scene_Base_createTimer.call(this);
        if (!this._timerSprite) return;
        // Initial visibility
		this._timerSprite.visible = !$gameSwitches.value(HIDE_SWITCH_ID);
        // Correct layer
        if (this._timerSprite && this._spriteset) {
            const ss = this._spriteset;
            for (let i = ss.children.length - 1; i >= 0; i--) {
                if (ss.children[i]instanceof Sprite_Timer) {
                    ss.removeChildAt(i);
                }
            }
            if (this.children.includes(this._timerSprite)) {
                this.removeChild(this._timerSprite);
            }
            this._spriteset.addChildAt(this._timerSprite, 1);
        }
    };
    // Dynamic Visibility
    const _Sprite_Timer_updateVisibility = Sprite_Timer.prototype.updateVisibility;
    Sprite_Timer.prototype.updateVisibility = function () {
        _Sprite_Timer_updateVisibility.call(this);
        this.visible = !$gameSwitches.value(HIDE_SWITCH_ID);
    };
    
    window.Okitsune = window.Okitsune || {};
    Okitsune.TU_Param = function (parameter) {
        switch (parameter) {
        // COLOR
        case SRD.TimerUpgrade.color:
            if ($gameSwitches.value(221))
                return "#ED6A76";
            if ($gameSwitches.value(222))
                return "#8AEF75";
            if ($gameSwitches.value(223))
                return "#8DAAF4";
            return parameter;
            break;
            // FORMAT
        case SRD.TimerUpgrade.format:
            return Okitsune.Dictionary._commandTranslate($gameVariables.value(102)) + " " + parameter;
            break;
            // FONT
        case SRD.TimerUpgrade.font:
            return SRD.TranslationEngine.langFonts[ConfigManager.getLanguage()] || parameter;
            break;
        default:
            return parameter;
        }
    };
})();

//___________________________
// * Editted the "Sprite_Timer.prototype.createBackground" function in the main plugin file so that the timer's color can be changed by script calls.
// * Set "SRD.TimerUpgrade.bg1" and "SRD.TimerUpgrade.bg2" to rgba values.
// * Used the function 'Okitsune.TU_Param' in some places within main plugin file to better configure timer visual.

//=============================================================================
// ** SRD_WindowUpgrade
//=============================================================================
// Make 'cancel' button exit the choice menu
(function () {
    Window_ChoiceBase.prototype.isCancelEnabled = function () {
        return true;
    };
    Window_ChoiceBase.prototype.processCancel = function () {
        SoundManager.playCancel();
        this.deactivate();
        this.close();
    };
})();

    //==============================
    // * Okitsune Dictionary
    //==============================
(function () {
    window.Okitsune = window.Okitsune || {};
    const Dictionary = {
        entries: Object.freeze(["やめる", "漢字", "平仮名", "片仮名", "仮名+", "名前+", "おきつね", "おみくじ", "お願い", "くノ一", "なすび", "九尾", "侘び寂び", "俳句", "凶", "分福", "千本", "参道", "古今東西", "可愛い", "和敬静寂", "団子", "城下町", "塾", "変貌", "大吉", "大明神", "天使", "天冠", "天狐", "奉納", "妖力", "妖怪", "妖術", "寺子屋", "小吉", "小槌", "巫女", "布団", "幻影", "幽魂", "弁当", "式神", "御伽", "御神火祭", "忍び", "忍法", "悪霊", "憑依", "手水舎", "押入れ", "掛け軸", "文書", "旅館", "暖簾", "本殿", "殺生石", "温泉", "湯", "爆花", "物語", "犬張子", "狐", "狐狗狸さん", "狗神", "狛犬", "狸", "甘味処", "田", "畳", "白無垢", "祓", "神", "神体", "神具", "神社", "祠", "笛竹", "算盤", "絵馬", "袴", "襖", "賽銭", "賽銭箱", "通りゃんせ", "道具屋", "邪神", "酒", "銭", "陰陽師", "陰陽道", "雪山", "霊魂録", "頂上", "駆星", "鳥居", "鹿", "鹿威し"]),
        _commandTranslate(text) {
            const lang = ConfigManager.getLanguage();
            if ($dataTranslations.cmd[text] && $dataTranslations.cmd[text][lang]) {
                return $dataTranslations.cmd[text][lang];
            }
            return text;
        },
        _buildIndex() {
            const fixedCount = 6;	//Number of dicitionary entries to not sort.
            const fixed = this.entries.slice(0, fixedCount).map((v, i) => ({
                        originalIndex: i,
                        original: v,
                        translated: this._commandTranslate(v)
                    }));
            const rest = this.entries.slice(fixedCount).map((v, i) => ({
                        originalIndex: i + fixedCount,
                        original: v,
                        translated: this._commandTranslate(v)
                    })).sort((a, b) => a.translated.localeCompare(b.translated, "en", {
                        sensitivity: "base"
                    }));
            return fixed.concat(rest);
        },
        getChoiceList() {
            return this._buildIndex().map(entry => entry.translated);
        },
        getOriginalByChoice(index) {
            const entry = this._buildIndex()[index];
            return entry ? entry.original : null;
        }
    };
    Okitsune.Dictionary = Dictionary;
})();
//___________________________
// * Editted the main plugin file fix an issue where an extra space was appended to the last entry of choice windows.
// * Manually set choice window width within the main plugin file, overwriting logic that set it up. Temporary for now.

//=============================================================================
// ** YEP_SaveCore
//=============================================================================
// SaveInfo – Translated Location
(function () {
    const _drawLocation = Window_SaveInfo.prototype.drawLocation;
    Window_SaveInfo.prototype.drawLocation = function (dx, dy, dw) {
        const id = this._saveContents.map._mapId;
        let text = "";
        if (Yanfly.Param.SaveMapDisplayName) {
            text = this._saveContents.map.locationDisplayName || "";
            if (!text && $dataMapInfos[id]) {
                text = $dataMapInfos[id].name;
            }
        } else if ($dataMapInfos[id]) {
            text = $dataMapInfos[id].name;
        }
        if (Imported["SumRndmDde Translation Engine"]) {
            text = SRD.TranslationEngine.translate(text);
        }
        text = text.replace(/\s+$/, "");
        if (Yanfly.Param.SaveVocabLocation.length > 0) {
            this.changeTextColor(this.systemColor());
            this.drawText(Yanfly.Param.SaveVocabLocation, dx, dy, dw, "left");
            this.changeTextColor(this.normalColor());
            this.drawText(text, dx, dy, dw, "right");
        } else {
            this.drawText(text, dx, dy, dw, "center");
        }
    };
})();

// SaveInfo – Variable (string support)
(function () {
    Window_SaveInfo.prototype.drawVariable = function (id, dx, dy, dw) {
        const raw = this._saveContents.variables.value(id);
        const text = typeof raw === "number" ? Yanfly.Util.toGroup(raw) : String(raw);
        this.drawText(text, dx, dy, dw, "center");
    };
})();

// SaveInfo – Kohaku State Display
(function () {
    Window_SaveInfo.prototype.drawState = function (pos, dx, dy, dw) {
        const states = this._saveContents.actors._data[1]._states;
        for (let i = 0; i < states.length; i++)
            if ($dataStates[states[i]].iconIndex === 33)
                return this.drawText($dataStates[states[i]].name, dx, dy, dw, "center");
        this.drawText("-", dx, dy, dw, "center");
    };
})();

// SaveInfo – Gold (formatting)
(function () {
    const _drawGoldCount = Window_SaveInfo.prototype.drawGoldCount;
    Window_SaveInfo.prototype.drawGoldCount = function (dx, dy, dw) {
        const rawLabel = Yanfly.Param.SaveVocabGoldCount;
        if (!rawLabel) {
            _drawGoldCount.call(this, dx, dy, dw);
            return;
        }
        const gold = Yanfly.Util.toGroup(this._saveContents.party._gold);
        let label = Window_Base.prototype.convertEscapeCharacters.call(this, rawLabel);
        label = label.format(TextManager.currencyUnit);
        this._drawData = true;
        const labelWidth = this.textWidthEx(label);
        this.drawTextEx(label, dx, dy);
        this._drawData = false;
        this.changeTextColor(this.normalColor());
        this.drawText(gold, dx, dy, dw - labelWidth - 4, "right");
    };
})();

// SaveInfo – Slot Background Customization
/**
 * COLORS: background fill color per save slot (1–7).
 * IMAGES: images to show from /img/pictures/ per slot (1–7).
 * OPACITY: how transparent the save background images are (0–255).
 * CROP_RATIO: what % of image width to display (0.0–1.0).
 * COLOR_WIDTH: how many pixels wide the background color fill should be.
 */
(function () {
    const COLORS = ["#D5C8D4", "#EDBADB", "#FFE693", "#C24F5C", "#C9CCAF", "#A3AABA", "#DFF3F2"];
    const IMAGES = ["save1", "save2", "save3", "save4", "save5", "save6", "save7"];
    const OPACITY = 220;
    const CROP_RATIO = 0.755;
    const COLOR_WIDTH = 774;
    const _refresh = Window_SaveInfo.prototype.refresh;
    Window_SaveInfo.prototype.refresh = function () {
        this._prepareSlotBackground();
        _refresh.call(this);
    };
    Window_SaveInfo.prototype._prepareSlotBackground = function () {
        const slot = ((this.savefileId() - 1) % 7);
        if (!this._customBackBitmap) {
            this._customBackBitmap = new Bitmap(this.width, this.height);
            this._windowBackSprite.bitmap = this._customBackBitmap;
        }
        this._customBackBitmap.clear();
        const color = COLORS[slot];
        const image = IMAGES[slot];
        if (color) {
            this._customBackBitmap.fillRect(0, 0, COLOR_WIDTH, this.height, color);
        }
        if (!image)
            return;
        const bitmap = ImageManager.loadPicture(image);
        bitmap.addLoadListener(() => {
            if (!this._customBackBitmap)
                return;
            const cropped = Math.floor(bitmap.width * CROP_RATIO);
            this._customBackBitmap.paintOpacity = OPACITY;
            this._customBackBitmap.blt(bitmap, 0, 0, cropped, bitmap.height, 0, 0);
            this._customBackBitmap.paintOpacity = 255;
        });
    };
})();

// Max 99 saves, must fill to increase beyond 7
DataManager._dynamicMaxSavefiles = null;
DataManager.maxSavefiles = function () {
    if (this._dynamicMaxSavefiles) {
        return this._dynamicMaxSavefiles;
    }
    const MAX_CAP = 99;
    const BASE = 7; //Yanfly.Param.SaveMaxFiles;
    let nonEmpty = 0;
    let highest = 0;
    for (let i = 1; i <= MAX_CAP; i++) {
        if (StorageManager.exists(i)) {
            nonEmpty++;
            highest = i;
        }
    }
    if (SceneManager._scene instanceof Scene_Load) {
        this._dynamicMaxSavefiles = Math.min(MAX_CAP, Math.max(highest, BASE));
    } else {
        this._dynamicMaxSavefiles = Math.min(MAX_CAP, Math.max(nonEmpty + 1, highest, BASE));
    }
    return this._dynamicMaxSavefiles;
};
const _Scene_File_onSaveSuccess = Scene_File.prototype.onSaveSuccess;
Scene_File.prototype.onSaveSuccess = function () {
    DataManager._dynamicMaxSavefiles = null;
    $gameVariables.setValue(94, this.savefileId());
    _Scene_File_onSaveSuccess.call(this);
    this._listWindow.refresh();
};
const _Scene_File_performActionDelete = Scene_File.prototype.performActionDelete;
Scene_File.prototype.performActionDelete = function () {
    _Scene_File_performActionDelete.call(this);
    DataManager._dynamicMaxSavefiles = null;
    DataManager._globalInfo = null;
    DataManager._globalInfoPruned = false;
    const w = this._listWindow;
    w.refresh();
    w.select(Math.min(w.index(), w.maxItems() - 1, 98));
    if (SceneManager._scene instanceof Scene_Load && !DataManager.isAnySavefileExists()) {
        SceneManager.goto(Scene_Title);
    }
};
const _Scene_File_create = Scene_File.prototype.create;
Scene_File.prototype.create = function () {
    DataManager._dynamicMaxSavefiles = null;
    _Scene_File_create.call(this);
    const w = this._listWindow;
    w.select(Math.min(w.index(), w.maxItems() - 1, 98));
};

// rpgsave.bak files aren't used, disable them
StorageManager.backup = function () {};

// If no actual save files exist, wipe globalInfo to reduce lag
DataManager._globalInfoPruned = false;
const _DataManager_loadGlobalInfo = DataManager.loadGlobalInfo;
DataManager.loadGlobalInfo = function () {
    const info = _DataManager_loadGlobalInfo.call(this) || [];
    if (!this._globalInfoPruned) {
        let changed = false;
        for (let i = 1; i < info.length; i++) {
            if (info[i] && !StorageManager.exists(i)) {
                info[i] = null;
                changed = true;
            }
        }
        let last = info.length - 1;
        while (last > 0 && !info[last]) {
            last--;
        }
        info.length = last + 1;
        if (changed) {
            this._globalInfo = info;
            try {
                StorageManager.save(0, JSON.stringify(info));
            } catch (e) {
                console.error(e);
            }
        }
        this._globalInfoPruned = true;
    }
    return info;
};
//___________________________
// * Editted the main plugin file in some places, load preferences and changes.
// * State [n] is now a valid entry in Data Columns. Returns name of state affecting Kohaku if its icon is 33.

//=============================================================================
// ** YEP_X_MessageBacklog
//=============================================================================
(function () {
    "use strict";
    if (!window.Window_MessageBacklog || !Window_MessageBacklog.prototype)
        return;
    const HALT_SWITCH_ID = 392;
    const HALT_FRAMES = 15;

    // Utilities
    const fontForLanguage = (lang) => {
        const map = {
            "日本語": "GameFont_2",
            "English": "GameFont_2",
            "Español": "GameFont_4",
            "Português": "GameFont_4",
            "한국어": "GameFont_3",
            "简体中文": "GameFont"
        };
        return Object.prototype.hasOwnProperty.call(map, lang) ? map[lang] : "GameFont";
    };
    const currentLanguage = () => {
        if (typeof ConfigManager !== "undefined") {
            if (typeof ConfigManager.getLanguage === "function")
                return String(ConfigManager.getLanguage());
            if (ConfigManager.language !== undefined)
                return String(ConfigManager.language);
        }
        return "日本語";
    };
    const isHaltActive = () => $gameSwitches && $gameSwitches.value(HALT_SWITCH_ID);
    const swallowBacklogKeyIfHalt = () => {
        if (!isHaltActive())
            return false;
        if (Input.isTriggered(Yanfly.Param.MsgBacklogKeyButton)) {
            Input.clear();
            TouchInput.clear();
            return true;
        }
        return false;
    };

    // Background picture selection (based on last accessed save).
    Window_MessageBacklog.prototype._okitsuneBacklogPictureFilename = function () {
        const n = ((DataManager.lastAccessedSavefileId() - 1) % 7) + 1;
        return "save" + n;
    };
    const _createBackgroundPicture = Window_MessageBacklog.prototype.createBackgroundPicture;
    Window_MessageBacklog.prototype.createBackgroundPicture = function () {
        const filename = this._okitsuneBacklogPictureFilename();
        if (!filename)
            return;
        if (!this._backgroundPicture) {
            this._backgroundPicture = new Sprite();
            this._backgroundPicture.anchor.x = 0.5;
            this._backgroundPicture.anchor.y = 0.5;
            this._backgroundPicture.x = this.width / 2;
            this._backgroundPicture.y = this.height / 2;
            this.addChildAt(this._backgroundPicture, 0);
        }
        if (this._backgroundPicture._filename !== filename) {
            this._backgroundPicture.bitmap = ImageManager.loadPicture(filename, 0);
            this._backgroundPicture._filename = filename;
            const bmp = this._backgroundPicture.bitmap;
            bmp.addLoadListener(() => {
                if (this.stretchBgPicture)
                    this.stretchBgPicture();
            });
        }
        this._backgroundPicture.opacity = 0;
    };
    const _stretchBgPicture = Window_MessageBacklog.prototype.stretchBgPicture;
    Window_MessageBacklog.prototype.stretchBgPicture = function () {
        if (typeof _stretchBgPicture === "function") {
            _stretchBgPicture.call(this);
            return;
        }
        if (!this._backgroundPicture || !Yanfly.Param.MsgBacklogPicStretch)
            return;
        const bw = Math.max(1, this._backgroundPicture.width);
        const bh = Math.max(1, this._backgroundPicture.height);
        if (bw < Graphics.boxWidth)
            this._backgroundPicture.scale.x = Graphics.boxWidth / bw;
        if (bh < Graphics.boxHeight)
            this._backgroundPicture.scale.y = Graphics.boxHeight / bh;
    };
    const _setBgPictureOpacity = Window_MessageBacklog.prototype.setBgPictureOpacity;
    Window_MessageBacklog.prototype.setBgPictureOpacity = function (opacity) {
        if (typeof _setBgPictureOpacity === "function") {
            _setBgPictureOpacity.call(this, opacity);
        } else if (this._backgroundPicture) {
            this._backgroundPicture.opacity = opacity;
            if (this.stretchBgPicture)
                this.stretchBgPicture();
        }
    };

    //Dim layer for picture background type.
    Window_MessageBacklog.prototype._okitsuneEnsureDim = function () {
        const w = Graphics.boxWidth;
        const h = Graphics.boxHeight;
        if (!this._backgroundDim) {
            this._backgroundDim = new Sprite(new Bitmap(w, h));
            this._backgroundDim.opacity = 0;
            const idx = this.children.indexOf(this._backgroundPicture);
            this.addChildAt(this._backgroundDim, Math.max(0, idx) + 1);
        } else {
            const bmp = this._backgroundDim.bitmap;
            if (!bmp || bmp.width !== w || bmp.height !== h) {
                this._backgroundDim.bitmap = new Bitmap(w, h);
            }
        }
    };
    Window_MessageBacklog.prototype._okitsuneRefreshDim = function () {
        if (!this._backgroundDim || !this._backgroundDim.bitmap)
            return;
        const bmp = this._backgroundDim.bitmap;
        bmp.clear();
        if (bmp.gradientFillRect) {
            bmp.gradientFillRect(0, 0, Graphics.boxWidth, Graphics.boxHeight, this.dimColor1(), this.dimColor2(), true);
        } else {
            bmp.fillAll(this.dimColor1());
        }
    };

    // Halt (Switch 392 + countdown)
    Window_MessageBacklog.prototype._okitsuneStartHaltFrames = function (frames) {
        if (!$gameSwitches)
            return;
        $gameSwitches.setValue(HALT_SWITCH_ID, true);
        this._okitsuneHaltCountdown = Math.max(0, frames | 0);
    };
    const _fullActivate = Window_MessageBacklog.prototype.fullActivate;
    Window_MessageBacklog.prototype.fullActivate = function () {
        const scn = SceneManager._scene;
        const mw = scn && scn._messageWindow;
        this._okitsuneOpenedDuringPause = !!(mw && mw.pause);
        if (typeof _fullActivate === "function")
            _fullActivate.call(this);
        if (typeof Yanfly !== "undefined" && Yanfly.Param && Yanfly.Param.MsgBacklogBgType === 2) {
            this.createBackgroundPicture();
            if (this._backgroundPicture)
                this.setBgPictureOpacity(Yanfly.Param.MsgBacklogPicOpacity);
            this._okitsuneEnsureDim();
            this._okitsuneRefreshDim();
            if (this._backgroundDim)
                this._backgroundDim.opacity = 255;
        }
        if ($gameSwitches && !$gameSwitches.value(HALT_SWITCH_ID)) {
            this._okitsuneStartHaltFrames(HALT_FRAMES);
        }
    };
    const _fullDeactivate = Window_MessageBacklog.prototype.fullDeactivate;
    Window_MessageBacklog.prototype.fullDeactivate = function () {
        if (typeof _fullDeactivate === "function")
            _fullDeactivate.call(this);
        if (this._backgroundDim)
            this._backgroundDim.opacity = 0;
        this._okitsuneStartHaltFrames(HALT_FRAMES);
        if (this._okitsuneOpenedDuringPause && $gameMessage) {
            if (typeof $gameMessage.clearAlignLast === "function") {
                $gameMessage.clearAlignLast();
            }
        }
        this._okitsuneOpenedDuringPause = false;
        const scn = SceneManager._scene;
        const mw = scn && scn._messageWindow;
        if (mw) {
            if (typeof mw.isAnySubWindowActive === "function") {
                if (!mw.isAnySubWindowActive())
                    mw.activate();
            } else {
                mw.activate();
            }
        }
        Input.clear();
        TouchInput.clear();
    };
    const _update = Window_MessageBacklog.prototype.update;
    Window_MessageBacklog.prototype.update = function () {
        if (typeof _update === "function")
            _update.call(this);
        if (this._okitsuneHaltCountdown > 0) {
            this._okitsuneHaltCountdown--;
            if (this._okitsuneHaltCountdown <= 0 && $gameSwitches) {
                $gameSwitches.setValue(HALT_SWITCH_ID, false);
            }
        }
    };

    // Input handling tweaks
    Window_MessageBacklog.prototype.processHandling = function () {
        if (!this.isOpenAndActive())
            return;
        if (Input.isTriggered(Yanfly.Param.MsgBacklogKeyButton)) {
            if (isHaltActive())
                return;
            this.processCancel();
            return;
        }
        Window_Command.prototype.processHandling.call(this);
    };
    // Disable PageUp behaviors
    Window_MessageBacklog.prototype.cursorPageup = function () {};
    if (window.Window_Selectable && Window_Selectable.prototype) {
        Window_Selectable.prototype.processPageup = function () {};
        Window_Selectable.prototype.cursorPageup = function () {};
    }
    // Block backlog opening while halt active
    if (window.Window_Message && Window_Message.prototype) {
        const _openBacklogWindow = Window_Message.prototype.openBacklogWindow;
        Window_Message.prototype.openBacklogWindow = function () {
            if (isHaltActive())
                return;
            _openBacklogWindow.call(this);
        };
    }
    const patchBacklogInput = (proto, name) => {
        if (!proto || typeof proto[name] !== "function")
            return;
        const _fn = proto[name];
        proto[name] = function () {
            if (swallowBacklogKeyIfHalt())
                return;
            _fn.call(this);
        };
    };
    if (window.Window_Message && Window_Message.prototype) {
        patchBacklogInput(Window_Message.prototype, "updateBacklogInput");
    }
    if (window.Window_ChoiceList && Window_ChoiceList.prototype) {
        patchBacklogInput(Window_ChoiceList.prototype, "updateBacklogInput");
    }
    if (window.Window_NumberInput && Window_NumberInput.prototype) {
        patchBacklogInput(Window_NumberInput.prototype, "updateBacklogInput");
    }
    if (window.Window_EventItem && Window_EventItem.prototype) {
        patchBacklogInput(Window_EventItem.prototype, "updateBacklogInput");
    }
    // Ensure OK/Cancel clears buffered inputs
    const _processOk = Window_MessageBacklog.prototype.processOk;
    Window_MessageBacklog.prototype.processOk = function () {
        _processOk.call(this);
        Input.clear();
        TouchInput.clear();
    };
    const _processCancel = Window_MessageBacklog.prototype.processCancel;
    Window_MessageBacklog.prototype.processCancel = function () {
        _processCancel.call(this);
        Input.clear();
        TouchInput.clear();
    };
    
    // Remove extra message-only codes
    const _removeCodes = Window_MessageBacklog.prototype.removeMessageBoxOnlyCodes;
    Window_MessageBacklog.prototype.removeMessageBoxOnlyCodes = function (text) {
        text = _removeCodes.call(this, text);
        text = text.replace(/\\SE\[[^\]]*]/gi, "");
        text = text.replace(/\\>/g, "");
        text = text.replace(/\\</g, "");
        text = text.replace(/\\\^/g, "");
        text = text.replace(/\\!/g, "");
        text = text.replace(/\\\./g, "");
        text = text.replace(/\\\|/g, "");
        text = text.replace(/\\\{/g, "");
        text = text.replace(/\\\}/g, "");
        text = text.replace(/\\S\[[^\]]*]/gi, "");
        // Strip empty lines
        const out = [];
        const lines = String(text || "").split("\n");
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i] || "";
            line = line.replace(/^(?:\\[\u3000 ]+)+/, "");
            line = line.replace(/^((?:\\(?:[A-Za-z]+(?:\[[^\]]*])?|.))+)[\u3000 ]+/, "$1");
            line = line.replace(/^[\s\u3000]+/, "");
            const clean = line.replace(/\\[>^|!]+/g, "").replace(/\\[A-Za-z]+\[[^\]]*]/g, "").replace(/\\[A-Za-z]+/g, "").trim();
            if (clean.length > 0)
                out.push(line);
        }
        return out.join("\n");
    };
    
    // Language's font backlog storage
    if (window.Game_System && Game_System.prototype) {
        const _addMessageBacklog = Game_System.prototype.addMessageBacklog;
        Game_System.prototype.addMessageBacklog = function (text) {
            if (typeof this.isMessageBacklogLoggingEnabled === "function" && !this.isMessageBacklogLoggingEnabled()) {
                return;
            }
            if (typeof this.convertMessageBacklogText === "function") {
                text = this.convertMessageBacklogText(text);
            }
            const lang = currentLanguage();
            const fontName = fontForLanguage(lang);
            const lines = String(text || "").split("\n").map(line => {
                return line && line.length > 0 ? ("\\fn<" + fontName + ">" + line) : line;
            });
            text = lines.join("\n");
            if (typeof _addMessageBacklog === "function") {
                _addMessageBacklog.call(this, text);
                return;
            }
            this._messageBacklog = this._messageBacklog || [];
            this._messageBacklog.push(text);
            const max = (Yanfly.Param && Yanfly.Param.MsgBacklogMaxEntries) || 20;
            while (this._messageBacklog.length > max) {
                this._messageBacklog.shift();
            }
        };
    }
})();

//=============================================================================
// ** RS_MessageAlign
//=============================================================================
 // Choice window support
(function () {
    'use strict';
    const _RSMA_drawItem = Window_ChoiceList.prototype.drawItem;
    Window_ChoiceList.prototype.drawItem = function (index) {
        const raw = $gameMessage.choices()[index] || '';
        let align = 'left';
        const trimmed = raw.replace(/^[ \t]*(?:\\|¥)TA\[(\d)\]/i, (_, n) => {
            align = (n === '1') ? 'center' : (n === '2' ? 'right' : 'left');
            return '';
        }).replace(/^[ \t]*<(LEFT|CENTER|RIGHT)>/i, (_, dir) => {
            align = dir.toLowerCase() === 'center' ? 'center' : (dir.toLowerCase() === 'right' ? 'right' : 'left');
            return '';
        });
        const text = this.convertEscapeCharacters(trimmed);
        const tw = Window_Base.prototype.textWidthEx.call(this, text);
        const rect = this.itemRectForText(index);
        let dx = rect.x;
        if (align === 'center') {
            dx += Math.max(0, (this.contentsWidth() - tw) / 2);
        } else if (align === 'right') {
            dx += Math.max(0, this.contentsWidth() - tw);
        }
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawTextEx(text, dx, rect.y);
    };
})();
//___________________________
// * Added and update to 'text' in the "Window_Base.prototype.drawTextEx" function in the main plugin file so that SRD Translation Engine translates it.

//=============================================================================
// ** Kosen battle helpers
//=============================================================================
(function () {
    const REVERSE_SWITCH_ID = 105;
	//==============================
    // * Scene_Item logic (mimic CE 213)
    //==============================
    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function () {
        _Scene_Item_create.call(this);
        const storedKeyMapper = $gameVariables.value(99);
        if (storedKeyMapper) {
            Input.keyMapper = JSON.parse(JSON.stringify(storedKeyMapper));
        }
        const storedGamepadMapper = $gameVariables.value(100);
        if (storedGamepadMapper) {
            Input.gamepadMapper = JSON.parse(JSON.stringify(storedGamepadMapper));
        }
        Input._currentState['left'] = false;
        Input._currentState['right'] = false;
        Input._currentState['up'] = false;
        Input._currentState['down'] = false;
        $gameSwitches.setValue(REVERSE_SWITCH_ID, false);
    };
	
	//==============================
    // * MOG_Footsteps extension
    //==============================
    const NO_FOOTSTEP_ACTORS = [5, 6, 7];
    const HY0I_REGION_ID = REVERSE_SWITCH_ID;
    const HY0I_STEP_VAR = 119;
    const _createFS = FootStepsSprites.prototype.createFootSteps;
    FootStepsSprites.prototype.createFootSteps = function () {
        _createFS.call(this);
        const s = this._footsprites[this._footsprites.length - 1];
        if (!s) return;
		// Actors that should not leave footsteps
        const actor = this._character.actor && this._character.actor();
        if (actor && NO_FOOTSTEP_ACTORS.includes(actor.actorId())) {
            s.opacity = 0;
            return;
        }
		// Hyoi Pass 2 special logic
        if ($gameMap.mapId() === 18) {
            const isPlayer = this._character === $gamePlayer;
            const inRegion = $gamePlayer.regionId() === HY0I_REGION_ID;
            const reversed = $gameSwitches.value(REVERSE_SWITCH_ID);
            if (isPlayer && inRegion && reversed) {
                const maxSteps = Math.max(10, $gameVariables.value(HY0I_STEP_VAR));
                const ratio = $gameParty.steps() / maxSteps;
                const v = Math.min(1, Math.max(0, ratio));
                s.setColorTone([255 * v, 0, 0, 0]);
            } else {
                s.opacity = 0;
            }
        }
    };
    // Overwrite, only increase steps while reversed.
    Game_Party.prototype.increaseSteps = function () {
        if ($gameSwitches.value(REVERSE_SWITCH_ID)) {
            this._steps++;
        }
    };
})();

//=============================================================================
// ** Okitsune
//=============================================================================
/*
(function () {
    // Okitsune_Options, go full screen on restarts.
    const _SceneManager_initialize = SceneManager.initialize;
    SceneManager.initialize = function () {
        _SceneManager_initialize.call(this);
        if (localStorage.getItem("Okitsune_Restart") === "true") {
            Graphics._requestFullScreen();
            localStorage.setItem("Okitsune_Restart", "false");
        }
    };
})();
    // Restart Detection
    const _SceneManager_initialize = SceneManager.initialize;
    SceneManager.initialize = function () {
        Okitsune.MadeWithMV._skipSplash = localStorage.getItem("Okitsune_Restart") === "true";
        _SceneManager_initialize.call(this);
    };
*/

// Values can be any type. Example usage in Control Variable script section: omikujiValues(1.5, 1.15, 0.5, 1);
function omikujiValues(daikichiValue, shoukichiValue, kyouValue, defaultValue) {
    if ($gameSwitches.value(221)) return daikichiValue;
    if ($gameSwitches.value(222)) return shoukichiValue;
    if ($gameSwitches.value(223)) return kyouValue;
    return defaultValue;
}

// 'reverseAllowed' is a Boolean. Example usage, called from custom route of a monini: moniniPatrol(this, true);
// Used for most but not all monini and some monimole during Risen's boss battle. Used when they must patrol between region tiles where tiles in-between the endpoints is impossible.
function regionPatrol(mamono, reverseAllowed) {
    if (mamono.regionId())
        mamono._RegionDir = mamono.regionId();   // Monini or monimole will always start on 2, 4, 6 or 8 so never undefined.
    if (mamono._InverseDir === undefined)
        mamono._InverseDir = reverseAllowed && Math.random() < 0.5;
    if (mamono._InverseDir) {
        mamono.moveStraight({2:4, 4:8, 8:6, 6:2}[mamono._RegionDir]);
    } else {
        mamono.moveStraight(mamono._RegionDir);
    }
}

// The monini or monimole will always start on the first tile of cornerTiles, an array of xy coordinate arrays.
// The next cornerTile destination will always be on either the same row (y) or the same column (x) as the active one (a straight line from one to the next).
// Currently only used for monimole, not for monini.
// Example usage, called from custom route of a monimole: monimolePatrol(this, [[25,53], [21,53], [21,58]]);
function tilePatrol(mamono, cornerTiles) {
    mamono._target = mamono._target || 0;
    if (mamono._path === undefined) {
        const path = [];
        // Forward traversal
        for (let i = 0; i < cornerTiles.length - 1; i++) {
            const [x1, y1] = cornerTiles[i];
            const [x2, y2] = cornerTiles[i + 1];
            const [dx, dy] = [x2 - x1, y2 - y1];
            const steps = Math.abs(dx || dy);
            const stepX = Math.sign(dx);
            const stepY = Math.sign(dy);
            for (let s = 0; s < steps; s++)
                path.push([x1 + stepX * s, y1 + stepY * s]);
        }
        // Endpoint
        path.push(cornerTiles[cornerTiles.length - 1]);
        // Reverse traversal
        for (let i = path.length - 2; i > 0; i--) {
            path.push(path[i]);
        }
        mamono._path = path;
    }
    const target = mamono._path[mamono._target];
    mamono.moveStraight(mamono.findDirectionTo(target[0], target[1]));
    if (mamono.x === target[0] && mamono.y === target[1])
        mamono._target = (mamono._target + 1) % mamono._path.length;
}
    //==============================
    // * Miscellaneous
    //==============================

// Source - https://stackoverflow.com/a/12646864
// Posted by Laurens Holst, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-08, License - CC BY-SA 4.0
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

//=============================================================================
// ** List of other plugins with modifications to them not already mentioned in this assistance plugin
//=============================================================================
/*
	* Community_Basic - Commented out "SceneManager.preferableRendererType" function.
    * DTextPicture - Commented out a portion of the "Game_Screen.prototype.setDTextPicture" function in the main plugin file.
	* Mano_InputConfig - Many changes, mainly support for more keyboard layouts and text corrections.
	* Torigoya_EasyStaffRoll - Expanded to be able to create multiple staff rolls based on SRD's ConfigManager.getLanguage(). Has font selection logic within the file that would need to be editted if new languages are added.
*/