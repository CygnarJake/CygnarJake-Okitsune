/*:
 * @plugindesc Built for 古今東西おきつね物語. Based on set outfit variable,
 * will look for alternative images corresponding with set outfits.
 * @author CygnarJake
 *
 * @param OutfitVariableId
 * @text Outfit Variable
 * @type variable
 * @default 0
 * @desc Game variable that stores an array of integers. Ex: [1,7,2,…]
 *
 * @param Channels
 * @text Channel List
 * @type struct<Channel>[]
 * @default []
 * @desc Each index = one channel. These hold outfits.
 *
 * @param NoOutfitTexts
 * @text "No Outfit" Texts (per language)
 * @type struct<LangText>[]
 * @default []
 * @desc Label used for text to unequip outfits.
 *
 * @help
 * =========
 * PARAMETERS:
 * =========
 * Set channels and outfits within them. Typically, use channels for individual characters.
 * Each channel and each outfit can have language specific text, built around SRD_TranslationEngine.
 *
 * Choose a variable to be the outfit variable. It should be set as an array.
 * Set the value of the outfit variable to change outfits.
 * Example: [5,6,2,4]
 * The outfit of ID 5 in the channel of index 0 will be active.
 * The outfit of ID 6 in the channel of index 1 will be active.
 * The outfit of ID 2 in the channel of index 2 will be active.
 * The outfit of ID 4 in the channel of index 3 will be active.
 *
 * Currently, for 古今東西おきつね物語, channel 0 has been reserved for
 * language specific images. Special logic has been created for channel 0.
 *
 * Make sure that no two channels share the same index,
 * and that no two outfits in the same channel share an ID.
 *
 * =========
 * PLUGIN COMMANDS:
 * =========
 * "OpenOutfits"
 *     Opens the outfit-selection scene.
 *
 * "WipeOutfits A B"
 *     A = Channel index (integer)
 *     B = ID of outfit in channel A (integer)
 *     Re-locks outfit B of channel A.
 *     If no B is given, re-locks all outfits of A
 *     If no A is given, re-locks all outfits across all channels.
 *
 * "UnlockOutfits A B"
 *     A = Channel index (integer)
 *     B = ID of outfit in channel A (integer)
 *     Unlocks outfit B of channel A.
 *     If no B is given, unlocks all outfits of A
 *     If no A is given, unlocks all outfits across all channels.
 *
 * "UpdateOutfits"
 *     Updates list of unlocked otufits and saves ConfigManager.
 *
 * =========
 * SCRIPTS:
 * =========
 * 1. OkitsuneOutfits.isUnlocked(A,B)
 *     A = Channel index (integer)
 *     B = ID of outfit in channel A (integer)
 *     True/false check if B of A is unlocked.
 *
 * 2. ConfigManager.outfitsUnlocked.some(key => !key.startsWith("0:"))
 *     True/false check if any outfits are unlocked (ignores channel 0).
 *
 * ___________________________
 * END OF HELP
 */

/*~struct~Channel:
 * @param index
 * @text Channel Index
 * @type number
 * @min 0
 * @desc Integer value of this channel in relation to the outfit variable's array indices.
 *
 * @param names
 * @text Channel Names (per language)
 * @type struct<LangText>[]
 * @default []
 * @desc Names shown in outfit-selection by language.
 *
 * @param blurbTexts
 * @text Channel Texts (per language)
 * @type struct<LangText>[]
 * @default []
 * @desc Description shown in the preview panel by language.
 *
 * @param preview
 * @text Channel Preview (img/pictures)
 * @type file
 * @dir img/pictures
 * @desc Preview image shown for the channel.
 *
 * @param outfits
 * @text Outfits
 * @type struct<Outfit>[]
 * @default []
 *
 * @param coveredImages
 * @text Covered Images (folder_basename)
 * @type string[]
 * @default []
 * @desc Images that the outfits of this channel can substitute. No extensions. Put subfolder of img + "_" at start.
 */

/*~struct~LangText:
 * @param lang
 * @text Language
 * @type string
 * @desc Must match ConfigManager.getLanguage(). Ex: English
 *
 * @param text
 * @text Text
 * @type multiline_string
 * @desc Text to use when that language is active. Supports line breaks and other tags.
 */

/*~struct~Outfit:
 * @param id
 * @text Outfit ID
 * @type number
 * @min 1
 * @desc Integer ID of this outfit. Value of the element in the outfit variable array.
 *
 * @param prefix
 * @text File Prefix
 * @type string
 * @desc Used for file lookup. With "exa", when "mple.png" tries to load, will try to find "exa_mple.png".
 *
 * @param display
 * @text Display Names (per language)
 * @type struct<LangText>[]
 * @default []
 * @desc Names shown in outfit-selection by language.
 *
 * @param preview
 * @text Preview Image (img/pictures)
 * @type file
 * @dir img/pictures
 * @desc Preview image shown for the outfit.
 *
 * @param previewTexts
 * @text Preview Texts (per language)
 * @type struct<LangText>[]
 * @default []
 * @desc Description shown in the preview panel by language.
 *
 * @param requirement
 * @text Requirement
 * @type string
 * @default true
 * @desc JS condition that must evaluate to true once. Outfits stay unlocked, even across saves.
 *
 * @param unlockHints
 * @text Unlock Hints (per language)
 * @type struct<LangText>[]
 * @default []
 * @desc Hint for outfit when locked, shown in the preview panel by language.
 */

(() => {
    'use strict';
    /* ------------------------------------------------------------------ */
    /*  Parameters + prefix map                                           */
    /* ------------------------------------------------------------------ */
    const P = PluginManager.parameters('Okitsune_Outfits');
    const VAR_ID = Number(P.OutfitVariableId || 0);

    // --- "No Outfit"
    const NO_OUTFIT_TEXTS = _toLangDict(P.NoOutfitTexts || '[]');

    // --- Decision cache: (subfolder|filename|version) -> chosen candidate or null
    const DECISION_CACHE = new Map();
    let DECISION_VER = 0;

    // --- Read / write the outfit variable
    function currentArray() {
        const v = $gameVariables.value(VAR_ID);
        return Array.isArray(v) ? v.slice() : [0]; // clone or fallback
    }
    function writeArray(arr) {
        $gameVariables.setValue(VAR_ID, JsonEx.makeDeepCopy(arr));
    }

    // --- Channel array (sorted, gaps removed)
    const CHANNELS = JSON.parse(P.Channels || '[]')
        .map(s => JSON.parse(s))
        // keep every entry that has a numeric index (0,1,2,…)
        .filter(c => !isNaN(Number(c.index)))
        .sort((a, b) => a.index - b.index);

    const PREFIX_MAP = {}; // "ch:id" or "id" → prefix

    // Keep image filename in PREVIEW_MAP, but move preview text to per-language store:
    const PREVIEW_MAP = {}; // "ch" or "ch:id" → { img }
    const CHANNEL_TEXTS = {}; // "chX" → { [lang]: blurb }   (per-language)
    const CHANNEL_NAME_MAP = {}; // "chX" → { [lang]: name }    (per-language)
    const PREVIEW_TEXTS = {}; // "ch:id" → { [lang]: text }  (per-language)

    // Requirements unchanged:
    const REQ_MAP = {}; // "ch:id" → JS string (condition)

    // Unlock hints now per-language:
    const HINT_MAP = {}; // "ch:id" → { [lang]: text }  (per-language)

    // New: per-language display names
    const DISPLAY_MAP = {}; // "ch:id" → { [lang]: name }  (per-language)

    const COVERED_MAP = {}; // chIdx -> Set of basenames

    // ID lists for UI and checks (we’ll compute labels at draw time by language):
    const OUTFIT_IDS = {}; // chIdx -> number[]
    const OUTFIT_META = {}; // chIdx -> [{ id }]    (label computed later)

    function _currentLanguage() {
        // SRD_TranslationEngine; returns language name string
        return (ConfigManager.getLanguage && ConfigManager.getLanguage()) || 'English';
    }

    function _pickLang(dict) {
        if (!dict)
            return '';
        const lang = _currentLanguage();
        // exact match first
        if (dict[lang])
            return dict[lang];
        // fallbacks: try English, then first available
        if (dict['English'])
            return dict['English'];
        const keys = Object.keys(dict);
        return keys.length ? (dict[keys[0]] || '') : '';
    }

    // --- Parse an array of LangText structs (JSON strings) → { [lang]: text }
    function _toLangDict(rawArr) {
        const out = {};
        try {
            (JSON.parse(rawArr || '[]') || []).forEach(s => {
                const obj = JSON.parse(s || '{}');
                const k = String(obj.lang || '').trim();
                const v = String(obj.text || '').trim();
                if (k && v)
                    out[k] = v;
            });
        } catch (e) { /* ignore */
        }
        return out;
    }

    CHANNELS.forEach(ch => {
        const chIdx = Number(ch.index);
        // Channel preview: image only
        PREVIEW_MAP[`ch${chIdx}`] = {
            img: ch.preview || ''
        };

        // Channel name (per language)
        CHANNEL_NAME_MAP[`ch${chIdx}`] = _toLangDict(ch.names || '[]');

        // Channel text (per language)
        CHANNEL_TEXTS[`ch${chIdx}`] = _toLangDict(ch.blurbTexts || '[]');

        // Covered Images: normalize folder to lowercase; keep basename (with !/$ etc.)
        const covered = JSON.parse(ch.coveredImages || '[]')
            .map(s => (typeof s === 'string' ? s : String(s)))
            .map(s => s.replace(/^\s+|\s+$/g, ''))
            .filter(Boolean)
            .map(s => {
                const i = s.indexOf('_');
                if (i > 0) {
                    const folder = s.slice(0, i).toLowerCase();
                    const base = s.slice(i + 1);
                    return `${folder}_${base}`;
                }
                return s;
            });
        COVERED_MAP[chIdx] = new Set(covered);

        // Outfits → fill prefix/preview/requirement/hint maps
        JSON.parse(ch.outfits || '[]')
        .map(s => JSON.parse(s))
        .forEach(o => {
            const id = Number(o.id || 0);
            const pre = (o.prefix || '').trim();
            const req = (o.requirement || 'true').trim();

            if (id && pre) {
                // Prefix for file-lookup
                PREFIX_MAP[`${chIdx}:${id}`] = pre;
                if (!PREFIX_MAP[id])
                    PREFIX_MAP[id] = pre;

                // Image stays in PREVIEW_MAP
                PREVIEW_MAP[`${chIdx}:${id}`] = {
                    img: o.preview || ''
                };

                // Per-language text maps
                DISPLAY_MAP[`${chIdx}:${id}`] = _toLangDict(o.display || '[]');
                PREVIEW_TEXTS[`${chIdx}:${id}`] = _toLangDict(o.previewTexts || '[]');
                HINT_MAP[`${chIdx}:${id}`] = _toLangDict(o.unlockHints || '[]');

                // Requirement / unlock condition
                REQ_MAP[`${chIdx}:${id}`] = req;
            }
        });

        // Build fast lists for UI (labels computed per-language at draw time)
        const ids = [];
        const meta = [];
        JSON.parse(ch.outfits || '[]')
        .map(s => JSON.parse(s))
        .forEach(o => {
            const id = Number(o.id || 0);
            if (id) {
                ids.push(id);
                meta.push({
                    id
                });
            }
        });
        OUTFIT_IDS[chIdx] = ids;
        OUTFIT_META[chIdx] = meta;
    });

    /* --- GLOBAL UNLOCK STORE --------------------------- */
    ConfigManager.outfitsUnlocked = ConfigManager.outfitsUnlocked || [];

    (function () {
        const _make = ConfigManager.makeData;
        ConfigManager.makeData = function () {
            const data = _make.call(this);
            data.outfitsUnlocked = this.outfitsUnlocked.slice();
            return data;
        };

        const _apply = ConfigManager.applyData;
        ConfigManager.applyData = function (data) {
            _apply.call(this, data);
            this.outfitsUnlocked = data.outfitsUnlocked || [];
        };
    })();

    function rememberUnlock(key) {
        if (!ConfigManager.outfitsUnlocked.includes(key)) {
            ConfigManager.outfitsUnlocked.push(key);
            ConfigManager.save(); // write to config.rpgsave now
        }
    }

    function isUnlocked(ch, id) {
        const key = `${ch}:${id}`;
        if (ConfigManager.outfitsUnlocked.includes(key))
            return true;

        const cond = REQ_MAP[key] || 'true';
        let ok = false;
        try {
            ok = !!eval(cond);
        } // run user condition once
        catch (e) {
            console.error(e);
        }

        if (ok)
            rememberUnlock(key);
        return ok;
    }

    // --- Export so events/console can call it
    window.OkitsuneOutfits = window.OkitsuneOutfits || {};
    OkitsuneOutfits.isUnlocked = isUnlocked; // use: OkitsuneOutfits.isUnlocked(#,#)

    function channelHasUnlocked(chIdx) {
        const ids = OUTFIT_IDS[chIdx] || [];
        return ids.some(id => id && isUnlocked(chIdx, id));
    }

    /* ------------------------------------------------------------------ */
    /*  Runtime: build active prefix list                                 */
    /* ------------------------------------------------------------------ */
    Game_System.prototype.refreshOutfitPrefixes = function () {
        this._outfitPrefixes = [];
        this._outfitEligible = new Set();

        const arr = $gameVariables.value(VAR_ID);
        if (!Array.isArray(arr))
            return;

        for (let i = arr.length - 1; i >= 0; i--) {
            const id = Number(arr[i] || 0);
            if (!id)
                continue;

            // Prefix list
            const pre = PREFIX_MAP[`${i}:${id}`] || PREFIX_MAP[id];
            if (pre) {
                const tag = pre + '_';
                if (!this._outfitPrefixes.includes(tag))
                    this._outfitPrefixes.push(tag);
            }

            // Eligible basenames: union coverage for this channel if it has something selected
            const covered = COVERED_MAP[i];
            if (covered && covered.size) {
                covered.forEach(name => this._outfitEligible.add(name));
            }
        }

        // bump version and clear the decision cache whenever active outfits change
        DECISION_VER++;
        DECISION_CACHE.clear();
    };

    Game_System.prototype.outfitPrefixes = function () {
        if (!this._outfitPrefixes)
            this.refreshOutfitPrefixes();
        return this._outfitPrefixes;
    };

    Game_System.prototype.outfitEligibleNames = function () {
        if (!this._outfitEligible || !(this._outfitEligible instanceof Set)) {
            this.refreshOutfitPrefixes();
        }
        return this._outfitEligible;
    };

    // --- Auto-refresh when the variable changes
    const _setVal = Game_Variables.prototype.setValue;
    Game_Variables.prototype.setValue = function (i, v) {
        _setVal.call(this, i, v);
        if (i === VAR_ID && $gameSystem)
            $gameSystem.refreshOutfitPrefixes();
    };

    /* ------------------------------------------------------------------ */
    /*  3  ImageManager override                                          */
    /* ------------------------------------------------------------------ */
    const fs = (typeof window !== 'undefined' && window.require) ? window.require('fs') : null;
    const path = (typeof window !== 'undefined' && window.require) ? window.require('path') : null;

    // cache for existence checks, and project root path
    const FILE_EXISTS_CACHE = new Map();
    const ROOT_DIR = (path && typeof process !== 'undefined' && process && process.mainModule)
     ? path.dirname(process.mainModule.filename)
     : '';

    // Build safe variants for folder_basename keys
    function _of_keyVariants(subfolder, fname) {
        const key = `${subfolder}_${fname}`;
        const enc = fname
            .replace(/%/g, '%25')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29');
        const alt1 = `${subfolder}_${enc}`;
        return [key, alt1];
    }

    const _loadBmp = ImageManager.loadBitmap;
    ImageManager.loadBitmap = function (folder, filename, hue, smooth) {
        if (!filename)
            return _loadBmp.call(this, folder, filename, hue, smooth);

        // If no active outfits or no coverage configured, skip the extra checks
        const prefixes = $gameSystem ? $gameSystem.outfitPrefixes() : [];
        if (!prefixes || prefixes.length === 0) {
            return _loadBmp.call(this, folder, filename, hue, smooth);
        }

        // Build the coverage key: "<subfolder>_<basenameWithMarkers>"
        //  - folder: e.g. "img/pictures/" → "pictures"
        //  - filename: base name without extension. Leading are !/$ kept.
        const f = String(folder);
        const cut = f.lastIndexOf('/', f.length - 2);
        const subfolderRaw = (cut >= 0 ? f.slice(cut + 1) : f).replace(/[\/\\]+$/, '');
        const subfolder = subfolderRaw.toLowerCase();
        const fname = String(filename);
        const eligible = $gameSystem ? $gameSystem.outfitEligibleNames() : null;

        // --- Decision cache lookup
        const decisionKey = `${subfolder}|${fname}|${DECISION_VER}`;
        if (DECISION_CACHE.has(decisionKey)) {
            const hit = DECISION_CACHE.get(decisionKey);
            return _loadBmp.call(this, folder, (hit != null ? hit : filename), hue, smooth);
        }

        // Build foldered key variants
        const candidates = _of_keyVariants(subfolder, fname);

        let covered = false;
        if (eligible && eligible.size) {
            covered = candidates.some(k => eligible.has(k));
        }

        if (!covered) {
            DECISION_CACHE.set(decisionKey, null);
            return _loadBmp.call(this, folder, filename, hue, smooth);
        }

        // Covered → try active prefixes in priority order
        const build = (pre, f) => {
            const m = /^([!$]{1,2})(.*)$/.exec(f);
            return m ? m[1] + pre + m[2] : pre + f;
        };
        for (const p of prefixes) {
            const cand = build(p, filename);
            if (this._okFileExists(folder, cand)) {
                DECISION_CACHE.set(decisionKey, cand); // cache which one we chose
                return _loadBmp.call(this, folder, cand, hue, smooth);
            }
        }
        DECISION_CACHE.set(decisionKey, null); // remember base path used
        return _loadBmp.call(this, folder, filename, hue, smooth);

    };

    ImageManager._okFileExists = function (folder, name) {
        if (!fs || !path)
            return false;
        const key = folder + '|' + name; // no extension in key
        if (FILE_EXISTS_CACHE.has(key))
            return FILE_EXISTS_CACHE.get(key);
        const ok = fs.existsSync(path.join(ROOT_DIR, folder, name + '.png'));
        FILE_EXISTS_CACHE.set(key, ok);
        return ok;
    };

    /* ------------------------------------------------------------------ */
    /*  4  Plugin commands                                                */
    /* ------------------------------------------------------------------ */
    const _cmd = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (c, a) {
        _cmd.call(this, c, a);
        const cmd = String(c || '').toLowerCase();

        /* ---------- helpers ---------- */
        const toInt = s => {
            const n = Number(s);
            return Number.isFinite(n) ? Math.floor(n) : NaN;
        };

        function unlockChannel(chIdx) {
            const ids = OUTFIT_IDS[chIdx] || [];
            if (!ids.length)
                return;
            let changed = false;
            ids.forEach(id => {
                const key = `${chIdx}:${id}`;
                if (!ConfigManager.outfitsUnlocked.includes(key)) {
                    ConfigManager.outfitsUnlocked.push(key);
                    changed = true;
                }
            });
            if (changed)
                ConfigManager.save();
        }

        function unlockSpecific(chIdx, id) {
            const ids = OUTFIT_IDS[chIdx] || [];
            if (!ids.includes(id))
                return;
            const key = `${chIdx}:${id}`;
            if (!ConfigManager.outfitsUnlocked.includes(key)) {
                ConfigManager.outfitsUnlocked.push(key);
                ConfigManager.save();
            }
        }

        function relockChannel(chIdx) {
            const before = ConfigManager.outfitsUnlocked.length;
            ConfigManager.outfitsUnlocked =
                ConfigManager.outfitsUnlocked.filter(k => !k.startsWith(`${chIdx}:`));
            if (ConfigManager.outfitsUnlocked.length !== before)
                ConfigManager.save();

            // Clear the equipped outfit for that channel (keep language channel 0 untouched).
            if (chIdx !== 0) {
                const arr = currentArray();
                while (arr.length <= chIdx)
                    arr.push(0);
                arr[chIdx] = 0;
                writeArray(arr);
            }
        }

        function relockSpecific(chIdx, id) {
            const key = `${chIdx}:${id}`;
            const before = ConfigManager.outfitsUnlocked.length;
            ConfigManager.outfitsUnlocked =
                ConfigManager.outfitsUnlocked.filter(k => k !== key);
            if (ConfigManager.outfitsUnlocked.length !== before)
                ConfigManager.save();

            // If that exact outfit was equipped, unequip it.
            const arr = currentArray();
            while (arr.length <= chIdx)
                arr.push(0);
            if (arr[chIdx] === id) {
                arr[chIdx] = 0;
                writeArray(arr);
            }
        }

        function updateAllOutfitsAndSave() {
            // Evaluate requirements for every defined outfit; remembered unlocks persist.
            CHANNELS.forEach(ch => {
                const chIdx = Number(ch.index);
                if (isNaN(chIdx))
                    return;
                const ids = OUTFIT_IDS[chIdx] || [];
                ids.forEach(id => {
                    isUnlocked(chIdx, id);
                });
            });
            // Ensure persisted to config.rpgsave
            ConfigManager.save();
        }

        /* ---------- commands ---------- */

        // OpenOutfits
        if (cmd === 'openoutfits') {
            SceneManager.push(Scene_OutfitChannels);
            return;
        }

        // UnlockOutfits: Unlock specific outfits or all
        if (cmd === 'unlockoutfits' || cmd === 'unlockoutfit' || cmd === 'unlockoufit') {
            const ch = toInt(a && a[0]);
            const id = toInt(a && a[1]);

            // Unlock specific outfit
            if (Number.isFinite(ch) && Number.isFinite(id)) {
                unlockSpecific(ch, id);
            }
            // Unlock all outfits in a single channel
            else if (Number.isFinite(ch)) {
                unlockChannel(ch);
            }
            // Unlock every outfit across all channels
            else {
                CHANNELS.forEach(chObj => {
                    const chIdx = Number(chObj.index);
                    if (!isNaN(chIdx))
                        unlockChannel(chIdx);
                });
            }
            return;
        }

        // UpdateOutfits: evaluate requirements now and persist
        if (cmd === 'updateoutfits') {
            updateAllOutfitsAndSave();
            return;
        }

        // WipeOutfits: Re-lock specific outfits or all
        if (cmd === 'wipeoutfits' || cmd === 'wipeoutfit') {
            const ch = toInt(a && a[0]);
            const id = toInt(a && a[1]);

            if (Number.isFinite(ch) && Number.isFinite(id)) {
                relockSpecific(ch, id);
                return;
            } else if (Number.isFinite(ch)) {
                relockChannel(ch);
                return;
            }

            // Original “wipe everything” behavior (keep channel 0 selection)
            ConfigManager.outfitsUnlocked = [];
            ConfigManager.save();
            let arr = currentArray();
            for (let i = 1; i < arr.length; i++)
                arr[i] = 0;
            writeArray(arr);
            return;
        }
    };

    /* ------------------------------------------------------------------ */
    /*  4  Outfit selection scene. Two stages: – channels  →  outfits     */
    /* ------------------------------------------------------------------ */

    const PREVIEW_SIDE = () => Graphics.boxHeight - Window_Base.prototype.fittingHeight(3);
    const darkSprite = () => {
        const s = new Sprite(new Bitmap(PREVIEW_SIDE(), PREVIEW_SIDE()));
        s.bitmap.fillAll('#000');
        s.opacity = 160;
        return s;
    };
    function scaleInsideSquare(sp) {
        const b = sp.bitmap;
        const s = Math.min(PREVIEW_SIDE() / b.width, PREVIEW_SIDE() / b.height, 1);
        sp.scale.set(s, s);
    }

    // === Word-wrap + <br> support for outfit blurbs  ===
    Window_Base.prototype.drawTextExWrapped = function (text, x, y, maxWidth) {
        if (!text)
            return 0;
        // Accept line breaks
        text = text.replace(/<br\s*\/?>|<line break>/gi, '\n');
        let lines = text.split('\n');
        let totalHeight = 0;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            // Use YEP_MessageCore word wrap if available
            if (Imported.YEP_MessageCore && Window_Base.prototype.processWordWrap) {
                let y0 = y + totalHeight;
                let max = maxWidth || this.contentsWidth();
                totalHeight += this.processWordWrap(line, x, y0, max);
            } else {
                this.drawTextEx(line, x, y + totalHeight);
                totalHeight += this.lineHeight();
            }
        }
        return totalHeight;
    };

    /* ---------- Scene_OutfitChannels ---------------------------------- */
    function Scene_OutfitChannels() {
        this.initialize(...arguments);
    }
    Scene_OutfitChannels.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_OutfitChannels.prototype.constructor = Scene_OutfitChannels;
    Scene_OutfitChannels.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);

        // grid
        const gH = Window_Base.prototype.fittingHeight(3);
        this._grid = new Window_ChannelGrid(0, Graphics.boxHeight - gH, Graphics.boxWidth, gH);
        this._grid.setHandler('ok', this.onOk.bind(this));
        this._grid.setHandler('cancel', this.popScene.bind(this));
        this._grid.setHandler('move', this.refreshPreview.bind(this));
        this.addWindow(this._grid);
        this._grid.activate();

        // put the cursor on the first cell
        this._grid.select(0);
        this._grid.activate();

        // preview + blurb
        this._prevBack = darkSprite();
        this.addChild(this._prevBack);
        this._prevImage = new Sprite();
        this._prevImage.anchor.set(.5, .5);
        this._prevImage.x = this._prevImage.y = PREVIEW_SIDE() / 2;
        this.addChild(this._prevImage);
        this._blurb = new Window_Base(PREVIEW_SIDE(), 0, Graphics.boxWidth - PREVIEW_SIDE(), PREVIEW_SIDE());
        this.addWindow(this._blurb);

        this.refreshPreview();
    };
    Scene_OutfitChannels.prototype.onOk = function () {
        const d = this._grid.currentData();
        if (!d)
            return;

        /* 1) Global "No Outfit" --------------------------------------- */
        if (d.id === -1) {
            const a = currentArray();
            for (let i = 1; i < a.length; i++)
                a[i] = 0;
            writeArray(a);

            this._grid.refresh();
            this._grid.select(0);
            this._grid.activate();
            this.refreshPreview();
            return;
        }

        /* 2) Normal channel rows  ------------------------------------- */
        // Player may enter the channel, even if nothing is unlocked yet.
        SceneManager.push(Scene_ChannelOutfits);
        SceneManager.prepareNextScene(d.channel);
    };
    Scene_OutfitChannels.prototype.refreshPreview = function () {
        const d = this._grid.currentData();
        this._prevImage.bitmap = null;
        this._blurb.contents.clear();
        if (!d || d.id === -1)
            return;

        const key = `ch${d.channel}`;
        const pv = PREVIEW_MAP[key] || {};
        const unlocked = channelHasUnlocked(d.channel);

        /* -----  image  --------------------------------*/
        if (pv.img) {
            const bmp = ImageManager.loadPicture(pv.img);
            this._prevImage.bitmap = bmp;
            bmp.addLoadListener(() => scaleInsideSquare(this._prevImage));

            /* grey-out if the whole channel is still locked */
            /* THIS IS THE CHANNEL PREVIEW IMAGE GREY */
            if (!unlocked) {
                this._prevImage.setColorTone([-255, -255, -255, 0]); // desaturate
                this._prevImage.opacity = 80; // fade
            } else {
                this._prevImage.setColorTone([0, 0, 0, 0]);
                this._prevImage.opacity = 255;
            }
        }

        /* -----  text  ---------------------------------*/
        const chText = _pickLang(CHANNEL_TEXTS[`ch${d.channel}`]) || '';
        this._blurb.contents.clear();
        if (unlocked && chText) {
            this._blurb.drawTextExWrapped(chText, 0, 0, this._blurb.contentsWidth());
        } else if (!unlocked) {
            this._blurb.drawTextExWrapped('???', 0, 0, this._blurb.contentsWidth());
        }
    };

    /* ---------- Window_ChannelGrid ------------------------------------ */
    function Window_ChannelGrid() {
        this.initialize(...arguments);
    }
    Window_ChannelGrid.prototype = Object.create(Window_Selectable.prototype);
    Window_ChannelGrid.prototype.constructor = Window_ChannelGrid;
    Window_ChannelGrid.prototype.initialize = function (x, y, w, h) {
        this._data = [];
        Window_Selectable.prototype.initialize.call(this, x, y, w, h);
        this.refresh();
    };

    /* correct paging for the channel list --------------------------------- */
    Window_ChannelGrid.prototype.maxPageRows = function () {
        return this.numVisibleRows(); // exactly 3, never 4
    };
    Window_ChannelGrid.prototype.maxPageItems = function () {
        return this.maxPageRows() * this.maxCols(); // 3 × 4 = 12
    };

    Window_ChannelGrid.prototype.maxCols = () => 4;
    Window_ChannelGrid.prototype.numVisibleRows = () => 3;
    Window_ChannelGrid.prototype.spacing = () => 4;
    Window_ChannelGrid.prototype.makeItemList = function () {
        const noOut = _pickLang(NO_OUTFIT_TEXTS) || 'No Outfit';
        this._data = [{
                id: -1,
                label: noOut,
                channel: -1
            }
        ];
        CHANNELS.forEach(c => {
            if (Number(c.index) === 0)
                return;
            const key = `ch${Number(c.index)}`;
            let base = _pickLang(CHANNEL_NAME_MAP[key]) || (c.name || `Ch ${c.index}`);
            if (!CHANNEL_NAME_MAP[key] && window.SRD && SRD.TranslationEngine && SRD.TranslationEngine.translate) {
                base = SRD.TranslationEngine.translate(String(base));
            }
            this._data.push({
                id: 0,
                label: base,
                channel: Number(c.index)
            });
        });
    };

    Window_ChannelGrid.prototype.maxItems = function () {
        return this._data.length;
    };

    Window_ChannelGrid.prototype.itemRect = function (index) {
        const topIndex = this.topIndex();
        const visibleIndex = index - topIndex;

        const cols = this.maxCols();
        const col = visibleIndex % cols;
        const row = Math.floor(visibleIndex / cols);

        const innerW = this.contentsWidth();
        const w = Math.floor((innerW - (cols - 1) * this.spacing()) / cols);
        const h = this.itemHeight();
        const x = col * (w + this.spacing());
        const y = row * this.rowHeight();
        return new Rectangle(x, y, w, h);
    };
    Window_OutfitGrid.prototype.itemRect = Window_ChannelGrid.prototype.itemRect;
    Window_ChannelGrid.prototype.drawItem = function (i) {
        const d = this._data[i];
        if (!d)
            return;

        /* -------- unlocked? -------------------------------------- */
        //  – "No Outfit" is always available
        //  – Others depend on channelHasUnlocked()
        const unlocked = (d.id === -1) ? true : channelHasUnlocked(d.channel);

        /* -------- label text ------------------------------------- */
        //  When unlocked, translate through SRD_TranslationEngine's Custom table.
        let label = unlocked ? d.label : '???';
        if (unlocked && window.SRD && SRD.TranslationEngine && SRD.TranslationEngine.translate) {
            label = SRD.TranslationEngine.translate(String(label));
        }

        /* -------- colour (white / grey) -------------------------- */
        if (!unlocked) {
            this.changeTextColor(this.textColor(8)); // dark-grey for locked
        } else {
            const arr = currentArray();
            const active = (d.id === -1)
             ? arr.slice(1).every(v => !v)
             : !!(arr[d.channel] || 0);
            this.changeTextColor(active ? this.normalColor()
                 : this.textColor(8));
        }

        /* -------- draw ------------------------------------------- */
        const r = this.itemRect(i);
        this.drawText(label, r.x, r.y, r.width, 'center');
    };
    Window_ChannelGrid.prototype.refresh = function () {
        this.makeItemList();
        Window_Selectable.prototype.refresh.call(this);
    };
    Window_ChannelGrid.prototype.currentData = function () {
        return this._data[this.index()];
    };
    ['cursorDown', 'cursorUp', 'cursorLeft', 'cursorRight'].forEach(fn => {
        const base = Window_ChannelGrid.prototype[fn];
        Window_ChannelGrid.prototype[fn] = function (w) {
            base.call(this, w);
            this.callHandler('move');
        };
    });

    /* ---------- Scene_ChannelOutfits ---------------------------------- */
    function Scene_ChannelOutfits() {
        this.initialize(...arguments);
    }
    Scene_ChannelOutfits.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_ChannelOutfits.prototype.constructor = Scene_ChannelOutfits;
    Scene_ChannelOutfits.prototype.prepare = function (ch) {
        this._ch = ch;
    };
    Scene_ChannelOutfits.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        const gH = Window_Base.prototype.fittingHeight(3);
        this._grid = new Window_OutfitGrid(0, Graphics.boxHeight - gH, Graphics.boxWidth, gH, this._ch);
        this._grid.setHandler('ok', this.onOk.bind(this));
        this._grid.setHandler('cancel', this.popScene.bind(this));
        this._grid.setHandler('move', this.refreshPreview.bind(this));
        this.addWindow(this._grid);
        this._grid.select(0);
        this._grid.activate();

        this._prevBack = darkSprite();
        this.addChild(this._prevBack);
        this._prevImage = new Sprite();
        this._prevImage.anchor.set(.5, .5);
        this._prevImage.x = this._prevImage.y = PREVIEW_SIDE() / 2;
        this.addChild(this._prevImage);
        this._blurb = new Window_Base(PREVIEW_SIDE(), 0, Graphics.boxWidth - PREVIEW_SIDE(), PREVIEW_SIDE());
        this.addWindow(this._blurb);
        this.refreshPreview();
    };
    Scene_ChannelOutfits.prototype.onOk = function () {
        const d = this._grid.currentData();
        if (!d)
            return;
        const arr = currentArray();
        while (arr.length <= this._ch)
            arr.push(0);
        if (d.id === -1)
            arr[this._ch] = 0;
        else
            arr[this._ch] = (arr[this._ch] === d.id) ? 0 : d.id;
        writeArray(arr);
        this._grid.refresh();
        this.refreshPreview();
        this._grid.reselect();
        this._grid.activate();
    };
    Scene_ChannelOutfits.prototype.refreshPreview = function () {
        const d = this._grid.currentData();
        this._prevImage.bitmap = null;
        this._blurb.contents.clear();
        // If nothing or global "No Outfit", clear everything and return
        if (!d)
            return;

        // --- "No Outfit" for this channel ---
        if (d.id === -1) {
            // Show the channel preview image (if it exists)
            const key = `ch${this._ch}`;
            const pv = PREVIEW_MAP[key] || {};
            const unlocked = channelHasUnlocked(this._ch);
            if (pv.img) {
                const bmp = ImageManager.loadPicture(pv.img);
                this._prevImage.bitmap = bmp;
                bmp.addLoadListener(() => scaleInsideSquare(this._prevImage));
                if (!unlocked) {
                    this._prevImage.setColorTone([-255, -255, -255, 0]); //THIS IS THE GREY FOR "No Outfit" IN CHANNELS
                    this._prevImage.opacity = 80;
                } else {
                    this._prevImage.setColorTone([0, 0, 0, 0]);
                    this._prevImage.opacity = 255;
                }
            }
            // No text at all for "No Outfit" in this context
            return;
        }

        // --- Normal Outfit ---
        const key = `${this._ch}:${d.id}`;
        const pv = PREVIEW_MAP[key] || {};
        const unlocked = isUnlocked(this._ch, d.id);
        if (pv.img) {
            const bmp = ImageManager.loadPicture(pv.img);
            this._prevImage.bitmap = bmp;
            bmp.addLoadListener(() => scaleInsideSquare(this._prevImage));
            if (!unlocked) {
                this._prevImage.setColorTone([-255, -255, -255, 0]); //THIS IS THE GREY FOR OUTFITS IN CHANNELS
                this._prevImage.opacity = 80;
            } else {
                this._prevImage.setColorTone([0, 0, 0, 0]);
                this._prevImage.opacity = 255;
            }
        }
        // Language-specific preview text / unlock hint
        const blurb = _pickLang(PREVIEW_TEXTS[key]);
        const hint = _pickLang(HINT_MAP[key]) || '???';

        this._blurb.contents.clear();
        if (unlocked && blurb) {
            this._blurb.drawTextExWrapped(blurb, 0, 0, this._blurb.contentsWidth());
        } else if (!unlocked) {
            this._blurb.drawTextExWrapped(hint, 0, 0, this._blurb.contentsWidth());
        }
    };

    /* ------------------------------------------------------------------ */
    //  Proper scrolling for the channel selector
    //     – keeps the cursor where it is
    //     – always shows three visible rows (3 × 4 = 12 cells)
    //     – never draws blank rows (I hope)
    /* ------------------------------------------------------------------ */

    /* how many rows and items are on one “page” (i.e. in view) */
    Window_ChannelGrid.prototype.maxPageRows = function () {
        return this.numVisibleRows(); // → 3
    };
    Window_ChannelGrid.prototype.maxPageItems = function () {
        return this.maxPageRows() * this.maxCols(); // 3 × 4 = 12
    };

    /* keep the cursor in view whenever it moves */
    Window_ChannelGrid.prototype.ensureCursorVisible = function () {
        const row = Math.floor(this.index() / this.maxCols());
        // scroll up
        if (row < this.topRow()) {
            this.setTopRow(row);
        }
        // scroll down
        if (row > this.topRow() + this.numVisibleRows() - 1) {
            this.setTopRow(row - (this.numVisibleRows() - 1));
        }
    };

    /* hook the four cursor-movement keys so the helper above is called */
    ['cursorDown', 'cursorUp', 'cursorRight', 'cursorLeft'].forEach(fn => {
        const _base = Window_ChannelGrid.prototype[fn];
        Window_ChannelGrid.prototype[fn] = function (wrap) {
            _base.call(this, wrap);
            this.ensureCursorVisible();
        };
    });

    /* ---------- Window_OutfitGrid ------------------------------------ */
    function Window_OutfitGrid() {
        this.initialize(...arguments);
    }
    Window_OutfitGrid.prototype = Object.create(Window_Selectable.prototype);
    Window_OutfitGrid.prototype.constructor = Window_OutfitGrid;
    Window_OutfitGrid.prototype.initialize = function (x, y, w, h, ch) {
        this._ch = ch;
        this._data = [];
        Window_Selectable.prototype.initialize.call(this, x, y, w, h);
        this.refresh();
    };
    Window_OutfitGrid.prototype.maxCols = Window_ChannelGrid.prototype.maxCols;
    Window_OutfitGrid.prototype.numVisibleRows = () => 2; //SET VISIBLE ROWS HERE
    Window_OutfitGrid.prototype.spacing = Window_ChannelGrid.prototype.spacing;

    // One grid-cell = 1 text line
    Window_ChannelGrid.prototype.itemHeight = function () {
        return this.lineHeight(); // 36 px (default)
    };
    // Channel table: each row is one text line.
    Window_ChannelGrid.prototype.rowHeight = function () {
        return this.itemHeight(); // 36 px (fits 3 rows in 108 px)
    };

    // Copy the same geometry over to the outfit grid
    Window_OutfitGrid.prototype.itemHeight = Window_ChannelGrid.prototype.itemHeight;
    Window_OutfitGrid.prototype.rowHeight = Window_ChannelGrid.prototype.rowHeight;

    Window_OutfitGrid.prototype.makeItemList = function () {
        const noOut = _pickLang(NO_OUTFIT_TEXTS) || 'No Outfit';
        this._data = [{
                id: -1,
                label: noOut,
                channel: this._ch
            }
        ];
        const list = OUTFIT_META[this._ch] || [];
        list.forEach(o => {
            const key = `${this._ch}:${o.id}`;
            const name = _pickLang(DISPLAY_MAP[key]) || (PREFIX_MAP[key] || `ID ${o.id}`);
            this._data.push({
                id: o.id,
                label: name,
                channel: this._ch
            });
        });
    };

    Window_OutfitGrid.prototype.maxItems = function () {
        return this._data.length;
    };
    Window_OutfitGrid.prototype.drawItem = function (i) {
        const d = this._data[i];
        if (!d)
            return;

        const r = this.itemRect(i);

        /* -------- unlocked? ------------------------------------------ */
        //  – "No Outfit" (id -1) is always available
        //  – every other row depends on isUnlocked(channel , outfitId)
        const unlocked = (d.id === -1) ? true
         : isUnlocked(this._ch, d.id);

        /* -------- label text ----------------------------------------- */
        //  show real name when unlocked, otherwise "???"
        let label = unlocked ? d.label : '???';
        if (unlocked && window.SRD && SRD.TranslationEngine && SRD.TranslationEngine.translate) {
            label = SRD.TranslationEngine.translate(String(label));
        }

        /* -------- colour (white / grey) ------------------------------ */
        if (!unlocked) {
            // locked → always grey
            this.changeTextColor(this.textColor(8));
        } else {
            // unlocked
            const a = currentArray();
            const active = (d.id === -1)
             ? !(a[this._ch] || 0)
             : (a[this._ch] === d.id);
            this.changeTextColor(active ? this.normalColor()
                 : this.textColor(8));
        }

        /* -------- draw ----------------------------------------------- */
        this.drawText(label, r.x, r.y, r.width, 'center');
    };
    Window_OutfitGrid.prototype.refresh = function () {
        this.makeItemList();
        Window_Selectable.prototype.refresh.call(this);
    };
    Window_OutfitGrid.prototype.currentData = function () {
        return this._data[this.index()];
    };
    ['cursorDown', 'cursorUp', 'cursorLeft', 'cursorRight'].forEach(fn => {
        const base = Window_OutfitGrid.prototype[fn];
        Window_OutfitGrid.prototype[fn] = function (w) {
            base.call(this, w);
            this.callHandler('move');
        };
    });

    Window_OutfitGrid.prototype.processOk = function () {
        const d = this.currentData();
        if (d.id !== -1 && !isUnlocked(this._ch, d.id)) {
            SoundManager.playBuzzer();
            this.activate();
            return;
        }
        Window_Selectable.prototype.processOk.call(this);
    };

    /* prepare helper */
    SceneManager.prepareNextScene = function (ch) {
        this._nextScene._prepared = true;
        this._nextScene.prepare(ch);
    };

    /* Rebuild outfit prefix/coverage after loading a save */
    (function () {
        const _extract = DataManager.extractSaveContents;
        DataManager.extractSaveContents = function (contents) {
            _extract.call(this, contents);
            if ($gameSystem && $gameSystem.refreshOutfitPrefixes) {
                $gameSystem.refreshOutfitPrefixes(); // reconstruct Set + prefixes after load
            }
        };
    })();

    // Expose internal data for external patches
    window.OkitsuneOutfits = window.OkitsuneOutfits || {};
    Object.assign(window.OkitsuneOutfits, {
        CHANNELS,
        COVERED_MAP,
        OUTFIT_IDS,
        PREFIX_MAP
    });

})();

/* ========================================================================
 * SRD_GameUpgrade Decrypter Ignore sync
 *  - Builds every possible replacement image path and adds to ignore list.
 *  - Uses all outfit prefixes (for every outfit in every channel) and all
 *    Covered Images (folder_basename) per channel.
 *  - Keeps leading special markers (! / $ / !$) at the very front of filename.
 *  - Adds only replacement names (never the un-prefixed base).
 *  - Output format required by GameUpgrade: 'img/<folder>/<file>.png'
 * ======================================================================== */
(function () {
    'use strict';

    // ---------- build all replacement image paths ----------
    function buildAllReplacementPaths() {
        const out = new Set();

        const CH = (window.OkitsuneOutfits && window.OkitsuneOutfits.CHANNELS) || [];
        const COVER = (window.OkitsuneOutfits && window.OkitsuneOutfits.COVERED_MAP) || {};
        const IDS = (window.OkitsuneOutfits && window.OkitsuneOutfits.OUTFIT_IDS) || {};
        const PREFIX = (window.OkitsuneOutfits && window.OkitsuneOutfits.PREFIX_MAP) || {};

        CH.forEach(ch => {
            const chIdx = Number(ch.index);
            if (isNaN(chIdx))
                return;

            const coveredSet = COVER[chIdx];
            const ids = IDS[chIdx] || [];
            if (!coveredSet || coveredSet.size === 0 || ids.length === 0)
                return;

            const tags = ids
                .map(id => PREFIX[`${chIdx}:${id}`])
                .filter(Boolean)
                .map(pre => String(pre).trim() + '_');

            coveredSet.forEach(key => {
                const i = key.indexOf('_');
                if (i <= 0)
                    return;
                const folder = key.slice(0, i);
                const base = key.slice(i + 1);

                // Capture valid front markers: "!", "$", or "!$"
                const m = /^(!\$|!|\$)(.*)$/.exec(base);

                tags.forEach(tag => {
                    const name = m ? (m[1] + tag + m[2]) : (tag + base);
                    out.add(`img/${folder}/${name}.png`);
                });
            });
        });

        return out;
    }

    // ---------- merge into GameUpgrade’s Decrypter ignore list ----------
    function appendToDecrypterIgnoreList(pathsSet) {
        if (typeof Decrypter === 'undefined')
            return;
        if (!Array.isArray(Decrypter._ignoreList))
            Decrypter._ignoreList = [];

        const already = new Set(Decrypter._ignoreList.map(String));
        pathsSet.forEach(p => {
            if (!already.has(p)) {
                Decrypter._ignoreList.push(p);
                already.add(p);
            }
        });

        if (Utils.isOptionValid('test')) {
            //console.log('[OkitsuneOutfits] Added to Decrypter ignore:', pathsSet.size, 'paths');
        }
    }

    // ---------- run once after DB load ----------
    const _OO_isDB = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function () {
        const ok = _OO_isDB.call(this);
        if (ok && !DataManager._ooIgnoreSynced) {
            try {
                const paths = buildAllReplacementPaths();
                appendToDecrypterIgnoreList(paths);
            } catch (e) {
                //console.warn('[OkitsuneOutfits] Failed to build decrypter ignore list (boot):', e);
            }
            DataManager._ooIgnoreSynced = true;
        }
        return ok;
    };

    // ---------- also run once after save load ----------
    const _OO_extract = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _OO_extract.call(this, contents);
        try {
            const paths = buildAllReplacementPaths();
            appendToDecrypterIgnoreList(paths);
        } catch (e) {
            //console.warn('[OkitsuneOutfits] Failed to build decrypter ignore list (after load):', e);
        }
    };

})();
