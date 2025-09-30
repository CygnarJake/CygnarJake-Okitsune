/*:
 * @plugindesc (v3.1.2025) Built for 古今東西おきつね物語. Allows choice of WEBGL vs. CANVAS.
 * Adds a scene explaining these modes.
 * @author CygnarJake
 *
 * @help
 * This plugin allows the player to choose the rendering mode: WEBGL or CANVAS,
 * defaulting to WEBGL.
 * In the Options window, an option to switch between WEBGL and CANVAS is added.
 * - If the player changes the mode, leaving the options window restarts the game.
 * - An information tab is added below. Also informs the player if the game will restart.
 *
 * Screen effects are forced OFF under Canvas mode.
 * At "Window_Options overrides" (in the file for now), set number of items displayed in options window.
 * Make sure FilterController.js has `enabledAll-ShowInOptionMenu = false`.
 */

(function() {
    // Early load config
    (function() {
        const raw = StorageManager.load(-1);
        let chosen = "webgl";
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed.preferredRenderer === "canvas") chosen = "canvas";
            } catch(e) {
                console.warn("RendererChoice parse error:", e);
            }
        }
        ConfigManager.preferredRenderer = chosen;
    })();

    // Extend ConfigManager
    const _Cfg_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _Cfg_applyData.call(this, config);
        this.preferredRenderer = (config.preferredRenderer === "canvas") ? "canvas" : "webgl";
    };
    const _Cfg_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const data = _Cfg_makeData.call(this);
        data.preferredRenderer = this.preferredRenderer;
        return data;
    };

    // Force chosen mode
    const _SceneMgr_renderType = SceneManager.preferableRendererType;
    SceneManager.preferableRendererType = function() {
        return (ConfigManager.preferredRenderer === "canvas") ? "canvas" : "webgl";
    };

    // Window_Options overrides
    if (Window_Options.prototype.addTKMFilterOptions) {
        Window_Options.prototype.addTKMFilterOptions = function() {};
    }
    Window_Options.prototype.numVisibleRows = function() { return 9; };

    const RENDER_LABEL  = "描画モード";
    const ABOUT_LABEL   = " ※これは何？";
    const FILTER_LABEL  = "フィルター効果";
    const RENDER_MODES  = ["webgl","canvas"];
    const DISPLAY_NAMES = { webgl:"WEBGL", canvas:"CANVAS" };
    let _originalRenderer = null;

    const _Opt_makeList = Window_Options.prototype.makeCommandList;
    Window_Options.prototype.makeCommandList = function() {
        _Opt_makeList.call(this);
        this._list = this._list.filter(cmd => !["preferredRenderer","aboutRenderer","TKMFilterEnabledAll"].includes(cmd.symbol));
        this.addCommand(RENDER_LABEL, "preferredRenderer");
        this.addCommand(ABOUT_LABEL,  "aboutRenderer");
        this.addCommand(FILTER_LABEL, "TKMFilterEnabledAll");
    };

    const _Opt_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        const i = this.index(), sym = this.commandSymbol(i);
        if (sym === "preferredRenderer") {
            let cur = ConfigManager.preferredRenderer, idx = RENDER_MODES.indexOf(cur);
            if (idx < 0) idx = 0;
            const val = RENDER_MODES[(idx+1)%RENDER_MODES.length];
            this.changeValue(sym, val);
            SoundManager.playOk(); ConfigManager.save();
            const last = this.index(); this.refresh(); this.select(last);
        } else if (sym === "aboutRenderer") {
            SoundManager.playOk();
            SceneManager.push(Scene_AboutRenderer);
        } else if (sym === "TKMFilterEnabledAll") {
            if (ConfigManager.preferredRenderer === "canvas") SoundManager.playBuzzer();
            else _Opt_processOk.call(this);
        } else {
            _Opt_processOk.call(this);
        }
    };

    const _Opt_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const sym = this.commandSymbol(index);
        if (sym === "preferredRenderer") {
            return DISPLAY_NAMES[ConfigManager.preferredRenderer] || "WEBGL";
        }
        if (sym === "aboutRenderer") {
            if (!_originalRenderer) return "再起動されない";
            const changed = (ConfigManager.preferredRenderer !== _originalRenderer);
            return changed ? "再起動される" : "再起動されない";
        }
        return _Opt_statusText.call(this, index);
    };

    const _Opt_changeVal = Window_Options.prototype.changeValue;
    Window_Options.prototype.changeValue = function(symbol, value) {
        _Opt_changeVal.call(this, symbol, value);
        if (symbol === "preferredRenderer") {
            ConfigManager.preferredRenderer = value;
            this.redrawItem(this.findSymbol(symbol));
        }
    };

    const _Opt_cmdEnabled = Window_Options.prototype.isCommandEnabled;
    Window_Options.prototype.isCommandEnabled = function(index) {
        const sym = this.commandSymbol(index);
        if (sym === "TKMFilterEnabledAll") {
            return (ConfigManager.preferredRenderer === "webgl");
        }
        return _Opt_cmdEnabled ? _Opt_cmdEnabled.call(this, index) : true;
    };

    const _Opt_update = Window_Options.prototype.update;
    Window_Options.prototype.update = function() {
        if (_Opt_update) _Opt_update.call(this);
        if (ConfigManager.preferredRenderer === "canvas" && ConfigManager.TKMFilterEnabledAll) {
            ConfigManager.TKMFilterEnabledAll = false;
            this.redrawItem(this.findSymbol("TKMFilterEnabledAll"));
        }
    };

    // Auto‐restart
    const _ScOpt_create = Scene_Options.prototype.create;
    Scene_Options.prototype.create = function() {
        _ScOpt_create.call(this);
        if (!_originalRenderer) _originalRenderer = ConfigManager.preferredRenderer;
    };
	const _Scene_Options_popScene = Scene_Options.prototype.popScene;
	Scene_Options.prototype.popScene = function() {
		const now = ConfigManager.preferredRenderer;
		if (now !== _originalRenderer) {
			ConfigManager.save();

			// Mark that a renderer-based restart is happening
			localStorage.setItem("Okitsune_Restart", "true");

			if (Utils.isNwjs()) {
				nw.Window.get().reload();
			} else {
				SceneManager.goto(Scene_Boot);
			}
			_originalRenderer = null;
			return;
		}
		_Scene_Options_popScene.call(this);
	};

    // Scene_AboutRenderer
    function Scene_AboutRenderer() { this.initialize(...arguments); }
    Scene_AboutRenderer.prototype = Object.create(Scene_Base.prototype);
    Scene_AboutRenderer.prototype.constructor = Scene_AboutRenderer;

    Scene_AboutRenderer.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
    };
    Scene_AboutRenderer.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this._orig = _originalRenderer || ConfigManager.preferredRenderer;
        this._sel  = ConfigManager.preferredRenderer;
        this._will = (this._orig !== this._sel);
        this.createBackground();
        this.createAboutWindow();
    };
    Scene_AboutRenderer.prototype.createBackground = function() {
        this._bgSprite = new Sprite();
        this._bgSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._bgSprite);
    };
    Scene_AboutRenderer.prototype.createAboutWindow = function() {
        const ww = 854, wh = 380;
        const wx = (Graphics.boxWidth  - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2;
        const r  = new Rectangle(wx, wy, ww, wh);
        this._aboutWindow = new Window_AboutRenderer(r);
        this._aboutWindow.setupData(this._orig, this._sel, this._will);
        this.addChild(this._aboutWindow);
    };
    Scene_AboutRenderer.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
            SoundManager.playCancel(); SceneManager.pop();
        }
    };

    // Window_AboutRenderer
    function Window_AboutRenderer() { this.initialize(...arguments); }
    Window_AboutRenderer.prototype = Object.create(Window_Base.prototype);
    Window_AboutRenderer.prototype.constructor = Window_AboutRenderer;

    Window_AboutRenderer.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect.x, rect.y, rect.width, rect.height);
        // Make background match other windows
        this.setBackgroundType(0);

        this.contents.fontSize = 22;
        this._orig = "webgl";
        this._sel  = "webgl";
        this._will = false;
        this.refresh();
    };
    Window_AboutRenderer.prototype.setupData = function(orig, sel, will) {
        this._orig = orig;
        this._sel  = sel;
        this._will = will;
        this.refresh();
    };
    Window_AboutRenderer.prototype.lineHeight = function() { return 38; };
    Window_AboutRenderer.prototype.refresh = function() {
        this.contents.clear();
        const c  = this._orig.toUpperCase();
        const s  = this._sel.toUpperCase();
        let line;
        if (this._will) line = " ■ゲームが再起動されます！";
        else            line = " ■ゲームは再起動されません。";

        const lines = [
            "モードを変更してオプション画面を閉じると、ゲームが再起動されます。",
            " ■現在は " + c + " モードで、選択中は " + s + " モードです。",
            null,
            //"WebGL は多くの PC で最適な体験を提供します。",
			"",
            "Canvas は低スペックの PC で安定する場合があります。",
            " ■Canvas モードではフィルター効果が無効になります。",
            "F2 キー（または Shift＋F2）で FPS を表示できます。",
            ""
        ];
        let y = 0;
        for (let i=0; i<lines.length; i++) {
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
    Window_AboutRenderer.prototype.drawSpecialLine = function(text, will, x, y) {
        this.resetFontSettings();
        if (will) {
            this.contents.fontBold = true;
            this.contents.fontSize += 2;
            this.changeTextColor("#948DDF");
        } else {
            this.changeTextColor("#C7C2BB");
        }
        this.drawText(text, x, y, this.contentsWidth(), "left");
        this.contents.fontBold = false;
        this.contents.fontSize = 22;
        this.resetTextColor();
    };

    // Smaller label for the “aboutRenderer” line, plus color logic
    const _Opt_drawItem = Window_Options.prototype.drawItem;
    Window_Options.prototype.drawItem = function(index) {
        const sym  = this.commandSymbol(index);
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
            this.drawText(st, rect.x+tw, rect.y, sw, "right");
            this.resetFontSettings();
        } else {
            _Opt_drawItem.call(this, index);
        }
    };

    // ──────────────────────────────────────────────────────────────
    //   Ignore ← / → on “preferredRenderer” and “aboutRenderer”
    // ──────────────────────────────────────────────────────────────
    (function() {
        const NO_CYCLE = ["preferredRenderer", "aboutRenderer"];

        // block cursor ►
        const _right = Window_Options.prototype.cursorRight;
        Window_Options.prototype.cursorRight = function(wrap) {
            if (NO_CYCLE.includes(this.commandSymbol(this.index()))) {
                SoundManager.playCursor();
                return;
            }
            _right.call(this, wrap);
        };

        // block cursor ◄
        const _left = Window_Options.prototype.cursorLeft;
        Window_Options.prototype.cursorLeft = function(wrap) {
            if (NO_CYCLE.includes(this.commandSymbol(this.index()))) {
                SoundManager.playCursor();
                return;
            }
            _left.call(this, wrap);
        };

        // safety: abort if renderer value is not a string
        const _chg = Window_Options.prototype.changeValue;
        Window_Options.prototype.changeValue = function(symbol, value) {
            if (symbol === "preferredRenderer" && typeof value !== "string") return;
            _chg.call(this, symbol, value);
        };
    })();
	
})();

