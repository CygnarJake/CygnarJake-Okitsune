/*:
 * @plugindesc Built for 古今東西おきつね物語. Options: WEBGL/CANVAS (+optional info row), custom Voice Volume, and configurable Options rows.
 * @author CygnarJake
 *
 * @help
 * - Adds a renderer toggle (WEBGL/CANVAS). Leaving Options restarts the game if changed.
 * - Optional “What is this?” row opens an info window about renderers.
 * - New “Voice Volume” option; only SE files listed in the parameter are controlled by it.
 *   All other SEs use regular “SE Volume”.
 * - Number of visible rows in Options is configurable.
 * - Canvas mode forces screen effects OFF.
 *
 * @param ShowRendererInfo
 * @type boolean
 * @on Show
 * @off Hide
 * @default true
 * @desc Show the "What is this?" line that opens the explanation window.
 *
 * @param OptionsWindowRows
 * @type number
 * @min 1
 * @default 9
 * @desc Number of rows to show in the Options window.
 *
 * @param VoiceOptionName
 * @type string
 * @default Voice Volume
 * @desc Label for the extra volume option.
 *
 * @param VoiceFileList
 * @type file[]
 * @dir audio/se/
 * @default []
 * @desc SE files controlled by Voice Volume instead of SE Volume.
 */
(function () {
    "use strict";
    const pluginName = "Okitsune_Options";
    const Params = PluginManager.parameters(pluginName);
    const SHOW_ABOUT = String(Params.ShowRendererInfo || "true") === "true";
    const OPTIONS_ROWS = Math.max(1, Number(Params.OptionsWindowRows || 9));
    const VOICE_LABEL = String(Params.VoiceOptionName || "Voice Volume");
    const VOICE_FILES_RAW = JSON.parse(Params.VoiceFileList || "[]");
    const stripBaseNoExt = s => String(s || "").split(/[\/\\]/).pop().replace(/\.[^.]+$/, "");
    const VOICE_SET = new Set(VOICE_FILES_RAW.map(stripBaseNoExt));
    (function () {
        const raw = StorageManager.load(-1);
        let chosen = "webgl";
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed.preferredRenderer === "canvas")
                    chosen = "canvas";
            } catch (e) {
                console.warn("RendererChoice parse error:", e);
            }
        }
        ConfigManager.preferredRenderer = chosen;
    })();
    ConfigManager.voiceVolume = 100;
    const _Cfg_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function (config) {
        _Cfg_applyData.call(this, config);
        this.preferredRenderer = (config.preferredRenderer === "canvas") ? "canvas" : "webgl";
        this.voiceVolume = this.readVolume(config, "voiceVolume");
    };
    const _Cfg_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function () {
        const data = _Cfg_makeData.call(this);
        data.preferredRenderer = this.preferredRenderer;
        data.voiceVolume = this.voiceVolume;
        return data;
    };
    const _SceneMgr_renderType = SceneManager.preferableRendererType;
    SceneManager.preferableRendererType = function () {
        return (ConfigManager.preferredRenderer === "canvas") ? "canvas" : "webgl";
    };
    if (Window_Options.prototype.addTKMFilterOptions) {
        Window_Options.prototype.addTKMFilterOptions = function () {};
    }
    Window_Options.prototype.numVisibleRows = function () {
        return OPTIONS_ROWS;
    };
    const RENDER_LABEL = "描画モード";
    const ABOUT_LABEL = " ※これは何？";
    const FILTER_LABEL = "フィルター効果";
    const RENDER_MODES = ["webgl", "canvas"];
    const DISPLAY_NAMES = {
        webgl: "WEBGL",
        canvas: "CANVAS"
    };
    let _originalRenderer = null;
    const _Opt_makeList = Window_Options.prototype.makeCommandList;
    Window_Options.prototype.makeCommandList = function () {
        _Opt_makeList.call(this);
        this._list = this._list.filter(cmd => !["preferredRenderer", "aboutRenderer", "TKMFilterEnabledAll"].includes(cmd.symbol));
        this.addCommand(RENDER_LABEL, "preferredRenderer");
        if (SHOW_ABOUT)
            this.addCommand(ABOUT_LABEL, "aboutRenderer");
        this.addCommand(FILTER_LABEL, "TKMFilterEnabledAll");
        this.addCommand(VOICE_LABEL, "voiceVolume");
        const seIndex = this._list.findIndex(c => c.symbol === "seVolume");
        const vvIndex1 = this._list.findIndex(c => c.symbol === "voiceVolume");
        if (seIndex >= 0 && vvIndex1 >= 0 && vvIndex1 !== seIndex + 1) {
            const [cmd] = this._list.splice(vvIndex1, 1);
            this._list.splice(seIndex + 1, 0, cmd);
        }
    };
    const _isVol = Window_Options.prototype.isVolumeSymbol;
    Window_Options.prototype.isVolumeSymbol = function (symbol) {
        return symbol === "voiceVolume" || (_isVol ? _isVol.call(this, symbol) : false);
    };
    if (typeof Window_Options.prototype.volumeStatus !== "function") {
        Window_Options.prototype.volumeStatus = function (symbol) {
            const v = this.getConfigValue ? this.getConfigValue(symbol) : (ConfigManager[symbol] || 0);
            return Math.round(v) + "%";
        };
    }
    if (typeof Window_Options.prototype.volumeOffset !== "function") {
        Window_Options.prototype.volumeOffset = function () {
            return 20;
        };
    }
    const _Opt_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function () {
        const i = this.index(),
        sym = this.commandSymbol(i);
        if (sym === "preferredRenderer") {
            let cur = ConfigManager.preferredRenderer,
            idx = RENDER_MODES.indexOf(cur);
            if (idx < 0)
                idx = 0;
            const val = RENDER_MODES[(idx + 1) % RENDER_MODES.length];
            this.changeValue(sym, val);
            SoundManager.playOk();
            ConfigManager.save();
            const last = this.index();
            this.refresh();
            this.select(last);
        } else if (sym === "aboutRenderer") {
            SoundManager.playOk();
            SceneManager.push(Scene_AboutRenderer);
        } else if (sym === "TKMFilterEnabledAll") {
            if (ConfigManager.preferredRenderer === "canvas")
                SoundManager.playBuzzer();
            else
                _Opt_processOk.call(this);
        } else {
            _Opt_processOk.call(this);
        }
    };
    const _Opt_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function (index) {
        const sym = this.commandSymbol(index);
        if (sym === "preferredRenderer")
            return DISPLAY_NAMES[ConfigManager.preferredRenderer] || "WEBGL";
        if (sym === "aboutRenderer") {
            if (!_originalRenderer)
                return "再起動されない";
            const changed = (ConfigManager.preferredRenderer !== _originalRenderer);
            return changed ? "再起動される" : "再起動されない";
        }
        if (sym === "voiceVolume") {
            const v = this.getConfigValue ? this.getConfigValue("voiceVolume") : ConfigManager.voiceVolume;
            return Math.round(v) + "%";
        }
        return _Opt_statusText.call(this, index);
    };
    const _Opt_changeVal = Window_Options.prototype.changeValue;
    Window_Options.prototype.changeValue = function (symbol, value) {
        _Opt_changeVal.call(this, symbol, value);
        if (symbol === "preferredRenderer") {
            ConfigManager.preferredRenderer = value;
            this.redrawItem(this.findSymbol(symbol));
        }
    };
    const _Opt_cmdEnabled = Window_Options.prototype.isCommandEnabled;
    Window_Options.prototype.isCommandEnabled = function (index) {
        const sym = this.commandSymbol(index);
        if (sym === "TKMFilterEnabledAll")
            return (ConfigManager.preferredRenderer === "webgl");
        return _Opt_cmdEnabled ? _Opt_cmdEnabled.call(this, index) : true;
    };
    const _Opt_update = Window_Options.prototype.update;
    Window_Options.prototype.update = function () {
        if (_Opt_update)
            _Opt_update.call(this);
        if (ConfigManager.preferredRenderer === "canvas" && ConfigManager.TKMFilterEnabledAll) {
            ConfigManager.TKMFilterEnabledAll = false;
            this.redrawItem(this.findSymbol("TKMFilterEnabledAll"));
        }
    };
    const _ScOpt_create = Scene_Options.prototype.create;
    Scene_Options.prototype.create = function () {
        _ScOpt_create.call(this);
        if (!_originalRenderer)
            _originalRenderer = ConfigManager.preferredRenderer;
    };
    const _Scene_Options_popScene = Scene_Options.prototype.popScene;
    Scene_Options.prototype.popScene = function () {
        const now = ConfigManager.preferredRenderer;
        if (now !== _originalRenderer) {
            ConfigManager.save();
            localStorage.setItem("Okitsune_Restart", "true");
            if (Utils.isNwjs())
                nw.Window.get().reload();
            else
                SceneManager.goto(Scene_Boot);
            _originalRenderer = null;
            return;
        }
        _Scene_Options_popScene.call(this);
    };
    function Scene_AboutRenderer() {
        this.initialize(...arguments);
    }
    Scene_AboutRenderer.prototype = Object.create(Scene_Base.prototype);
    Scene_AboutRenderer.prototype.constructor = Scene_AboutRenderer;
    Scene_AboutRenderer.prototype.initialize = function () {
        Scene_Base.prototype.initialize.call(this);
    };
    Scene_AboutRenderer.prototype.create = function () {
        Scene_Base.prototype.create.call(this);
        this._orig = _originalRenderer || ConfigManager.preferredRenderer;
        this._sel = ConfigManager.preferredRenderer;
        this._will = (this._orig !== this._sel);
        this.createBackground();
        this.createAboutWindow();
    };
    Scene_AboutRenderer.prototype.createBackground = function () {
        this._bgSprite = new Sprite();
        this._bgSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._bgSprite);
    };
    Scene_AboutRenderer.prototype.createAboutWindow = function () {
        const ww = 854,
        wh = 380;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2;
        const r = new Rectangle(wx, wy, ww, wh);
        this._aboutWindow = new Window_AboutRenderer(r);
        this._aboutWindow.setupData(this._orig, this._sel, this._will);
        this.addChild(this._aboutWindow);
    };
    Scene_AboutRenderer.prototype.update = function () {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
            SoundManager.playCancel();
            SceneManager.pop();
        }
    };
    function Window_AboutRenderer() {
        this.initialize(...arguments);
    }
    Window_AboutRenderer.prototype = Object.create(Window_Base.prototype);
    Window_AboutRenderer.prototype.constructor = Window_AboutRenderer;
    Window_AboutRenderer.prototype.initialize = function (rect) {
        Window_Base.prototype.initialize.call(this, rect.x, rect.y, rect.width, rect.height);
        this.setBackgroundType(0);
        this.contents.fontSize = 22;
        this._orig = "webgl";
        this._sel = "webgl";
        this._will = false;
        this.refresh();
    };
    Window_AboutRenderer.prototype.setupData = function (orig, sel, will) {
        this._orig = orig;
        this._sel = sel;
        this._will = will;
        this.refresh();
    };
    Window_AboutRenderer.prototype.lineHeight = function () {
        return 38;
    };
    Window_AboutRenderer.prototype.refresh = function () {
        this.contents.clear();
        const c = this._orig.toUpperCase();
        const s = this._sel.toUpperCase();
        let line = this._will ? " ■ゲームが再起動されます！" : " ■ゲームは再起動されません。";
        const lines = ["モードを変更してオプション画面を閉じると、ゲームが再起動されます。", " ■現在は " + c + " モードで、選択中は " + s + " モードです。", null, "", "Canvas は低スペックの PC で安定する場合があります。", " ■Canvas モードではフィルター効果が無効になります。", "F2 キー（または Shift＋F2）で FPS を表示できます。", ""];
        let y = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === null) {
                this.drawSpecialLine(line, this._will, 0, y);
                y += this.lineHeight();
            } else {
                this.resetFontSettings();
                this.changeTextColor(this.normalColor());
                this.drawText(lines[i], 0, y, this.contentsWidth(), "left");
                y += this.lineHeight();
            }
        }
        this.resetFontSettings();
        this.changeTextColor(this.normalColor());
        this.drawText("ESCキーで戻ります", 0, y, this.contentsWidth(), "center");
    };
    Window_AboutRenderer.prototype.drawSpecialLine = function (text, will, x, y) {
        this.resetFontSettings();
        if (will) {
            this.contents.fontBold = true;
            this.contents.fontSize += 2;
            this.changeTextColor("#948DDF");
        } else
            this.changeTextColor("#C7C2BB");
        this.drawText(text, x, y, this.contentsWidth(), "left");
        this.contents.fontBold = false;
        this.contents.fontSize = 22;
        this.resetTextColor();
    };
    const _Opt_drawItem = Window_Options.prototype.drawItem;
    Window_Options.prototype.drawItem = function (index) {
        const sym = this.commandSymbol(index);
        const rect = this.itemRectForText(index);
        if (sym === "aboutRenderer") {
            this.contents.fontSize -= 6;
            const sw = this.statusWidth() || 120;
            const tw = rect.width - sw;
            this.resetTextColor();
            this.changePaintOpacity(this.isCommandEnabled(index));
            this.drawText(this.commandName(index), rect.x, rect.y, tw);
            const st = this.statusText(index);
            const changed = (st === "再起動される");
            const col = changed ? "#948DDF" : "#C7C2BB";
            this.changeTextColor(col);
            this.drawText(st, rect.x + tw, rect.y, sw, "right");
            this.resetFontSettings();
        } else {
            _Opt_drawItem.call(this, index);
        }
    };
    (function () {
        const NO_CYCLE = ["preferredRenderer", "aboutRenderer"];
        const _right = Window_Options.prototype.cursorRight;
        Window_Options.prototype.cursorRight = function (wrap) {
            if (NO_CYCLE.includes(this.commandSymbol(this.index()))) {
                SoundManager.playCursor();
                return;
            }
            _right.call(this, wrap);
        };
        const _left = Window_Options.prototype.cursorLeft;
        Window_Options.prototype.cursorLeft = function (wrap) {
            if (NO_CYCLE.includes(this.commandSymbol(this.index()))) {
                SoundManager.playCursor();
                return;
            }
            _left.call(this, wrap);
        };
        const _chg = Window_Options.prototype.changeValue;
        Window_Options.prototype.changeValue = function (symbol, value) {
            if (symbol === "preferredRenderer" && typeof value !== "string")
                return;
            _chg.call(this, symbol, value);
        };
    })();
    const _AM_updateSeParameters = AudioManager.updateSeParameters;
    AudioManager.updateSeParameters = function (buffer, se) {
        const name = se && se.name ? se.name : "";
        if (VOICE_SET.has(name)) {
            this.updateBufferParameters(buffer, ConfigManager.voiceVolume, se);
        } else {
            _AM_updateSeParameters.call(this, buffer, se);
        }
    };
})();