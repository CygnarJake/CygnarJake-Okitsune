/*:
 * @plugindesc Built for 古今東西おきつね物語.
 * Kokkuri-san on-screen board (hiragana, numbers, YES/NO) with scriptable matches.
 * @author CygnarJake
 * @help
 * Opens a Kokkuri-san style selection UI. The player navigates a grid of
 * hiragana and numbers (0–9) plus 「はい」 and 「いいえ」 using the game controls.
 *
 * - Current entered text is shown at the top.
 * - Selecting 「いいえ」 clears the text.
 * - Selecting 「はい」 tries to match the entered text with any configured
 *   "Text" entry below. If a match is found, its "Script" is executed.
 *
 * -------------------------
 * Plugin Command:
 *   KokkuriSan
 *     -> Opens the Kokkuri-san board scene.
 *
 * -------------------------
 * Notes:
 * - Matching is exact.
 * - Script and Text can use $gameVariables, $gameSwitches, etc.
 *
 * @param MaxLength
 * @type number
 * @min 1
 * @max 200
 * @desc Maximum number of characters the player can input.
 * @default 16
 *
 * @param Entries
 * @type struct<Entry>[]
 * @desc List of "Text"/"Script" pairs. If entered text matches Text, Script runs when 「はい」 is selected.
 * @default []
 */

/*~struct~Entry:
 * @param Text
 * @type string
 * @desc When entered, triggers the script. Evaluates as JavaScript.
 * @default
 *
 * @param Script
 * @type note
 * @desc JavaScript code to run when the Text matches on 「はい」.
 * @default ""
 */
(function () {
    "use strict";
    const PLUGIN_NAME = "Okitsune_Kokkuri-san";
    const KOKKURI_BG_ALPHA = 0.95;
    const KOKKURI_TEXT_COLOR = '#FFFFFF';
    const KOKKURI_ENTRY_TEXT_COLOR = '#FFFFFF';
    const KOKKURI_ENTRY_FONT_SIZE = 36;
    function parseParam(param) {
        try {
            const data = JSON.parse(param);
            if (Array.isArray(data)) {
                return data.map(e => {
                    const obj = JSON.parse(e);
                    if (typeof obj.Script === "string" && obj.Script.startsWith("\"")) {
                        try {
                            obj.Script = JSON.parse(obj.Script);
                        } catch (_) {}
                    }
                    return obj;
                });
            } else if (data && typeof data === "object") {
                return data;
            }
            return data;
        } catch (_) {
            return param;
        }
    }
    const params = PluginManager.parameters(PLUGIN_NAME);
    const MAX_LEN = Number(params.MaxLength || 16);
    const ENTRIES = parseParam(params.Entries || "[]").map(e => ({
                text: (e.Text || "").trim(),
                script: (e.Script || "")
            }));
    function evalEntryText(expr) {
        try {
            return String(Function("return (" + expr + ")")());
        } catch (e) {
            console.error(`${PLUGIN_NAME}: Text eval failed:`, expr, e);
            return null;
        }
    }
    const TILE_YES = "はい";
    const TILE_NO = "いいえ";
    const COLS = ["わ ん を", "らりるれろ", "や ゆ よ", "まみむめも", "はひふへほ", "なにぬねの", "たちつてと", "さしすせそ", "かきくけこ", "あいうえお"];
    const NUMS = "0123456789";
    function spacer() {
        return {
            text: "",
            enabled: false
        };
    }
    function cell(ch) {
        return {
            text: ch,
            enabled: true
        };
    }
    function buildSymbolObjects() {
        const list = [];
        list.push(spacer());
        list.push(cell(TILE_NO));
        list.push(spacer());
        list.push(spacer());
        list.push(spacer());
        list.push(spacer());
        list.push(spacer());
        list.push(spacer());
        list.push(cell(TILE_YES));
        list.push(spacer());
        const cols = COLS.map(s => s.split(""));
        const maxH = Math.max.apply(null, cols.map(c => c.length));
        for (let row = 0; row < maxH; row++) {
            for (let c = 0; c < cols.length; c++) {
                const ch = cols[c][row];
                list.push(ch && ch !== " " ? cell(ch) : spacer());
            }
        }
        for (let i = 0; i < 10; i++) {
            list.push(cell(NUMS[i]));
        }
        return list;
    }
    const SYMBOL_OBJS = buildSymbolObjects();
    function _attachWindowPictureBg(win, pictureName) {
        win.frameOpacity = 0;
        win.backOpacity = 0;
        const bmp = ImageManager.loadPicture(pictureName);
        const spr = new Sprite(bmp);
        spr.alpha = KOKKURI_BG_ALPHA;
        win._kokkuriBgSprite = spr;
        function fit() {
            if (!spr.bitmap || spr.bitmap.width === 0)
                return;
            spr.x = 0;
            spr.y = 0;
            spr.scale.x = win.width / spr.bitmap.width;
            spr.scale.y = win.height / spr.bitmap.height;
        }
        if (bmp.isReady())
            fit();
        else
            bmp.addLoadListener(fit);
        win.addChildAt(spr, 0);
    }
    function Scene_KokkuriSan() {
        this.initialize.apply(this, arguments);
    }
    Scene_KokkuriSan.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_KokkuriSan.prototype.constructor = Scene_KokkuriSan;
    Scene_KokkuriSan.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
        this._currentText = "";
    };
    Scene_KokkuriSan.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createInputWindow();
        this.createBoardWindow();
    };
    Scene_KokkuriSan.prototype.createInputWindow = function () {
        const wx = 0;
        const wy = this._goldWindow ? this._goldWindow.y + this._goldWindow.height : 0;
        const ww = Graphics.boxWidth;
        const temp = new Window_Base(0, 0, 0, 0);
        const wh = temp.fittingHeight(2);
        temp.close();
        this._inputWindow = new Window_KokkuriInput(wx, wy, ww, wh);
        this._inputWindow.setText(this._currentText);
        this.addWindow(this._inputWindow);
    };
    Scene_KokkuriSan.prototype.createBoardWindow = function () {
        const wx = 0;
        const wy = this._inputWindow.y + this._inputWindow.height;
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy;
        this._boardWindow = new Window_KokkuriBoard(wx, wy, ww, wh);
        this._boardWindow.setHandler("ok", this.onBoardOk.bind(this));
        this._boardWindow.setHandler("cancel", this.onCancel.bind(this));
        this.addWindow(this._boardWindow);
        this._boardWindow.activate();
        this._boardWindow.selectFirstEnabled();
    };
    Scene_KokkuriSan.prototype.onBoardOk = function () {
        const sym = this._boardWindow.currentSymbol();
        if (sym === TILE_NO) {
            SoundManager.playCancel();
            this._currentText = "";
            this._inputWindow.setText(this._currentText);
            this._boardWindow.activate();
            return;
        }
        if (sym === TILE_YES) {
            this.trySubmit();
            return;
        }
        if (this._currentText.length >= MAX_LEN) {
            SoundManager.playBuzzer();
        } else {
            SoundManager.playOk();
            this._currentText += sym;
            this._inputWindow.setText(this._currentText);
        }
        this._boardWindow.activate();
    };
    Scene_KokkuriSan.prototype.onCancel = function () {
        SoundManager.playCancel();
        this.popScene();
    };
    Scene_KokkuriSan.prototype.trySubmit = function () {
        const entered = this._currentText;
        if (!entered) {
            SoundManager.playBuzzer();
            this._boardWindow.activate();
            return;
        }
        const hit = ENTRIES.find(e => evalEntryText(e.text) === entered);
        if (hit && hit.script) {
            try {
                new Function(hit.script)();
                SoundManager.playLoad();
                this._inputWindow.flashBlueThen(() => {
                    this._currentText = "";
                    this._inputWindow.setText(this._currentText);
                });
            } catch (err) {
                console.error(`${PLUGIN_NAME}: script error for text "${hit.text}"`, err);
                SoundManager.playBuzzer();
            }
            this._boardWindow.activate();
        } else {
            SoundManager.playBuzzer();
            this._boardWindow.activate();
        }
    };
    function Window_KokkuriInput() {
        this.initialize.apply(this, arguments);
    }
    Window_KokkuriInput.prototype = Object.create(Window_Base.prototype);
    Window_KokkuriInput.prototype.constructor = Window_KokkuriInput;
    Window_KokkuriInput.prototype.initialize = function (x, y, w, h) {
        Window_Base.prototype.initialize.call(this, x, y, w, h);
        this.opacity = 0;
        this.contentsOpacity = 255;
        _attachWindowPictureBg(this, "Kokkuri-san_Top");
        this._text = "";
        this.refresh();
    };
    Window_KokkuriInput.prototype.setText = function (text) {
        if (this._text !== text) {
            this._text = text;
            this.refresh();
        }
    };
    Window_KokkuriInput.prototype.flashBlueThen = function (callback) {
        this._kokkuriTintColor = '#4aa3ff';
        this._kokkuriFlashTimer = 30;
        this._kokkuriAfter = callback;
        this.refresh();
    };
    Window_KokkuriInput.prototype.update = function () {
        Window_Base.prototype.update.call(this);
        if (this._kokkuriFlashTimer > 0) {
            this._kokkuriFlashTimer--;
            if (this._kokkuriFlashTimer === 0) {
                this._kokkuriTintColor = null;
                const cb = this._kokkuriAfter;
                this._kokkuriAfter = null;
                if (cb)
                    cb();
                this.refresh();
            }
        }
    };
    Window_KokkuriInput.prototype.refresh = function () {
        this.contents.clear();
        const prevSize = this.contents.fontSize;
        this.changeTextColor(this._kokkuriTintColor || KOKKURI_ENTRY_TEXT_COLOR);
        this.contents.fontSize = KOKKURI_ENTRY_FONT_SIZE;
        this.drawText(this._text, 0, 0, this.contents.width, "center");
        this.contents.fontSize = prevSize;
        this.resetTextColor();
    };
    function _kokkuriIconSize() {
        return {
            w: Window_Base._iconWidth,
            h: Window_Base._iconHeight
        };
    }
    function _kokkuriIconSet() {
        return ImageManager.loadSystem('IconSet');
    }
    function _kokkuriIconFrame(iconIndex) {
        const {
            w,
            h
        } = _kokkuriIconSize();
        return {
            sx: (iconIndex % 16) * w,
            sy: Math.floor(iconIndex / 16) * h,
            sw: w,
            sh: h
        };
    }
    function Window_KokkuriBoard() {
        this.initialize.apply(this, arguments);
    }
    Window_KokkuriBoard.prototype = Object.create(Window_Selectable.prototype);
    Window_KokkuriBoard.prototype.constructor = Window_KokkuriBoard;
    Window_KokkuriBoard.prototype.initialize = function (x, y, w, h) {
        this._symbols = SYMBOL_OBJS.slice();
        Window_Selectable.prototype.initialize.call(this, x, y, w, h);
        this.opacity = 0;
        this.contentsOpacity = 255;
        _attachWindowPictureBg(this, "Kokkuri-san_Bottom");
        this._cursorIconIndex = 41;
        this._cursorIconSprite = new Sprite(_kokkuriIconSet());
        const f = _kokkuriIconFrame(this._cursorIconIndex);
        this._cursorIconSprite.setFrame(f.sx, f.sy, f.sw, f.sh);
        this._cursorIconSprite.anchor.set(0.5, 0.5);
        this.addChild(this._cursorIconSprite);
        this.refresh();
    };
    Window_KokkuriBoard.prototype.maxItems = function () {
        return (this._symbols && this._symbols.length) || 0;
    };
    Window_KokkuriBoard.prototype.maxCols = function () {
        return 10;
    };
    Window_KokkuriBoard.prototype.spacing = function () {
        return 6;
    };
    Window_KokkuriBoard.prototype.itemHeight = function () {
        return this.lineHeight() + 8;
    };
    Window_KokkuriBoard.prototype.isEnabledIndex = function (i) {
        const s = this._symbols[i];
        return !!(s && s.enabled);
    };
    Window_KokkuriBoard.prototype.isCurrentItemEnabled = function () {
        return this.isEnabledIndex(this.index());
    };
    Window_KokkuriBoard.prototype.currentSymbol = function () {
        const s = this._symbols[this.index()];
        return s ? s.text : "";
    };
    Window_KokkuriBoard.prototype.drawItem = function (index) {
        const rect = this.itemRect(index);
        const s = this._symbols[index];
        const txt = s ? s.text : "";
        this.resetTextColor();
        this.changeTextColor(KOKKURI_TEXT_COLOR);
        this.drawText(txt, rect.x, rect.y, rect.width, "center");
        this.resetTextColor();
    };
    Window_KokkuriBoard.prototype.refresh = function () {
        this.createContents();
        for (let i = 0; i < this.maxItems(); i++) {
            this.drawItem(i);
        }
    };
    Window_KokkuriBoard.prototype._wrapCol = function (col) {
        const cols = this.maxCols();
        return (col + cols) % cols;
    };
    Window_KokkuriBoard.prototype._indexToRC = function (i) {
        const cols = this.maxCols();
        return {
            r: Math.floor(i / cols),
            c: i % cols
        };
    };
    Window_KokkuriBoard.prototype._rcToIndex = function (r, c) {
        return r * this.maxCols() + c;
    };
    Window_KokkuriBoard.prototype._nextEnabledRight = function (from, wrap) {
        const cols = this.maxCols();
        let {
            r,
            c
        } = this._indexToRC(from);
        const startC = c;
        for (; ; ) {
            c = this._wrapCol(c + 1);
            if (c === 0) {
                if (!wrap)
                    return from;
            }
            const i = this._rcToIndex(r, c);
            if (i < this.maxItems() && this.isEnabledIndex(i))
                return i;
            if (c === startC)
                return from;
        }
    };
    Window_KokkuriBoard.prototype._nextEnabledLeft = function (from, wrap) {
        const cols = this.maxCols();
        let {
            r,
            c
        } = this._indexToRC(from);
        const startC = c;
        for (; ; ) {
            c = this._wrapCol(c - 1);
            if (c === cols - 1) {
                if (!wrap)
                    return from;
            }
            const i = this._rcToIndex(r, c);
            if (i < this.maxItems() && this.isEnabledIndex(i))
                return i;
            if (c === startC)
                return from;
        }
    };
    Window_KokkuriBoard.prototype._nextEnabledDown = function (from, wrap) {
        const cols = this.maxCols();
        const max = this.maxItems();
        let {
            r,
            c
        } = this._indexToRC(from);
        const startR = r;
        for (; ; ) {
            r++;
            let i = this._rcToIndex(r, c);
            if (i >= max) {
                if (!wrap)
                    return from;
                r = 0;
                i = this._rcToIndex(r, c);
            }
            if (this.isEnabledIndex(i))
                return i;
            if (r === startR)
                return from;
        }
    };
    Window_KokkuriBoard.prototype._nextEnabledUp = function (from, wrap) {
        const cols = this.maxCols();
        const max = this.maxItems();
        let {
            r,
            c
        } = this._indexToRC(from);
        const startR = r;
        for (; ; ) {
            r--;
            if (r < 0) {
                if (!wrap)
                    return from;
                r = Math.floor((max - 1) / cols);
            }
            const i = this._rcToIndex(r, c);
            if (i < max && this.isEnabledIndex(i))
                return i;
            if (r === startR)
                return from;
        }
    };
    Window_KokkuriBoard.prototype.cursorRight = function (wrap) {
        if (this.isCursorMovable()) {
            const i = this._nextEnabledRight(this.index(), wrap);
            if (i !== this.index())
                this.select(i);
        }
    };
    Window_KokkuriBoard.prototype.cursorLeft = function (wrap) {
        if (this.isCursorMovable()) {
            const i = this._nextEnabledLeft(this.index(), wrap);
            if (i !== this.index())
                this.select(i);
        }
    };
    Window_KokkuriBoard.prototype.cursorDown = function (wrap) {
        if (this.isCursorMovable()) {
            const i = this._nextEnabledDown(this.index(), wrap);
            if (i !== this.index())
                this.select(i);
        }
    };
    Window_KokkuriBoard.prototype.cursorUp = function (wrap) {
        if (this.isCursorMovable()) {
            const i = this._nextEnabledUp(this.index(), wrap);
            if (i !== this.index())
                this.select(i);
        }
    };
    Window_KokkuriBoard.prototype.selectFirstEnabled = function () {
        for (let i = 0; i < this.maxItems(); i++) {
            if (this.isEnabledIndex(i)) {
                this.select(i);
                return;
            }
        }
        this.select(0);
    };
    Window_KokkuriBoard.prototype._updateCursorIconPos = function () {
        const i = this.index();
        if (i < 0 || i >= this.maxItems()) {
            this._cursorIconSprite.visible = false;
            return;
        }
        const rect = this.itemRect(i);
        this._cursorIconSprite.visible = true;
        this._cursorIconSprite.x = rect.x + rect.width / 2;
        this._cursorIconSprite.y = rect.y + rect.height / 2;
    };
    Window_KokkuriBoard.prototype.update = function () {
        Window_Selectable.prototype.update.call(this);
        if (this._cursorIconSprite)
            this._updateCursorIconPos();
    };
    const _KokBoard_select = Window_KokkuriBoard.prototype.select;
    Window_KokkuriBoard.prototype.select = function (index) {
        _KokBoard_select.call(this, index);
        if (this._cursorIconSprite)
            this._updateCursorIconPos();
    };
    const _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _pluginCommand.call(this, command, args);
        if (!command)
            return;
        switch (command.toLowerCase()) {
        case "kokkurisan":
            SceneManager.push(Scene_KokkuriSan);
            break;
        }
    };
})();