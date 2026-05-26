/*:
 * @plugindesc Built for 古今東西おきつね物語. Kokkuri-san on-screen board (hiragana, numbers, YES/NO) with scriptable matches.
 * @author CygnarJake
 * @help
 * Creates a Kokkuri-san style selection UI. The player navigates a grid of hiragana
 * and numbers (0–9) plus 「はい」 and 「いいえ」 and may enter some combination of them.
 *
 * - Current entered text is shown at the top.
 * - Selecting 「いいえ」 clears the text.
 * - Selecting 「はい」 runs the script of any matching configured entry.
 *
 * =========
 * Entries:
 * =========
 * Text : What the player must spell out in the board scene for the entry.
 * Script : The script that runs when the player spells out and enters the entry's text.
 *
 * =========
 * Plugin Commands:
 * =========
 * Kokkuri-san : Opens the Kokkuri-san board scene.
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
 * @default
 */

(() => {
    'use strict';

	// General configuration
    const pluginName = 'Okitsune_Kokkuri-san';
    const alphaBG = 0.95;
    const textColor = '#FFFFFF';
    const entryFontSize = 36;
	const maxInputLength = 16;
    const boardColumns = 10;

    const cell_YES = 'はい';
    const cell_NO  = 'いいえ';

    //=================================================================================
    // Parameter Parsing
    //=================================================================================

	function parseEntries(raw) {
		try {
			return JSON.parse(raw || '[]').map(entry => {
				const parsed = JSON.parse(entry);
				let script = parsed.Script || '';
				if (script.startsWith('"')) {
					try {
						script = JSON.parse(script);
					} catch (_) {}
				}
				return {
					text: (parsed.Text || '').trim(),
					script
				};
			});
		} catch (_) {
			return [];
		}
	}

	const params = PluginManager.parameters(pluginName);
	const entries = parseEntries(params.Entries);

    //=================================================================================
    // Board Symbol Data
    //=================================================================================

	const hiraganaColumns = [
		'わ ん を',
		'らりるれろ',
		'や ゆ よ',
		'まみむめも',
		'はひふへほ',
		'なにぬねの',
		'たちつてと',
		'さしすせそ',
		'かきくけこ',
		'あいうえお'
	];

	function buildSymbolObjects() {
		const spacer = {
			text: '',
			enabled: false
		};
		const cell = character => ({
			text: character,
			enabled: true
		});
		const symbols = [spacer, cell(cell_NO), spacer, spacer, spacer, spacer, spacer, spacer, cell(cell_YES), spacer];
		const columns = hiraganaColumns.map(colString => colString.split(''));
		const maxRows = Math.max(...columns.map(column => column.length));
		for (let row = 0; row < maxRows; row++) {
			for (const column of columns) {
				const character = column[row];
				symbols.push(character && character !== ' ' ? cell(character) : spacer);
			}
		}
		for (const digit of '0123456789') {
			symbols.push(cell(digit));
		}
		return symbols;
	}

	const symbolObjects = buildSymbolObjects();

    //=================================================================================
    // Helpers
    //=================================================================================

	function evalEntryText(expression) {
		try {
			return String(Function(`return (${expression})`)());
		} catch (error) {
			console.error(`${pluginName}: Text eval failed:`, expression, error);
			return null;
		}
	}

	function attachWindowPictureBg(win, pictureName) {
		win.frameOpacity = 0;
		win.backOpacity = 0;
		const bitmap = ImageManager.loadPicture(pictureName);
		const sprite = new Sprite(bitmap);
		sprite.alpha = alphaBG;
		const fit = () => {
			if (!sprite.bitmap?.width) return;
			sprite.x = 0;
			sprite.y = 0;
			sprite.scale.x = win.width / sprite.bitmap.width;
			sprite.scale.y = win.height / sprite.bitmap.height;
		};
		bitmap.isReady() ? fit() : bitmap.addLoadListener(fit);
		win.addChildAt(sprite, 0);
	}

	function kokkuriIconFrame(iconIndex) {
		const iconWidth = Window_Base._iconWidth;
		const iconHeight = Window_Base._iconHeight;
		return {
			sx: (iconIndex % 16) * iconWidth,
			sy: Math.floor(iconIndex / 16) * iconHeight,
			sw: iconWidth,
			sh: iconHeight,
		};
	}

    //=================================================================================
    // Scene_KokkuriSan
    //=================================================================================

	class Scene_KokkuriSan extends Scene_MenuBase {
		initialize() {
			super.initialize();
			this._currentText = '';
		}

		create() {
			super.create();
			this._createInputWindow();
			this._createBoardWindow();
		}

		_createInputWindow() {
			const windowHeight = new Window_Base(0, 0, 0, 0).fittingHeight(2);
			this._inputWindow = new Window_KokkuriInput(0, 0, Graphics.boxWidth, windowHeight);
			this._inputWindow.setText(this._currentText);
			this.addWindow(this._inputWindow);
		}

		_createBoardWindow() {
			const boardY = this._inputWindow.y + this._inputWindow.height;
			const boardHeight = Graphics.boxHeight - boardY;
			this._boardWindow = new Window_KokkuriBoard(0, boardY, Graphics.boxWidth, boardHeight);
			this._boardWindow.setHandler('ok', this._onBoardOk.bind(this));
			this._boardWindow.setHandler('cancel', this._onCancel.bind(this));
			this.addWindow(this._boardWindow);
			this._boardWindow.activate();
			this._boardWindow.selectFirstEnabled();
		}

		_onBoardOk() {
			const symbol = this._boardWindow.currentSymbol();
			if (symbol === cell_NO) {
				SoundManager.playCancel();
				this._currentText = '';
				this._inputWindow.setText(this._currentText);
				this._boardWindow.activate();
				return;
			}
			if (symbol === cell_YES) {
				this._trySubmit();
				return;
			}
			if (this._currentText.length >= maxInputLength) {
				SoundManager.playBuzzer();
			} else {
				SoundManager.playOk();
				this._currentText += symbol;
				this._inputWindow.setText(this._currentText);
			}
			this._boardWindow.activate();
		}

		_onCancel() {
			SoundManager.playCancel();
			this.popScene();
		}

		_trySubmit() {
			if (!this._currentText) {
				SoundManager.playBuzzer();
				this._boardWindow.activate();
				return;
			}
			const match = entries.find(entry => evalEntryText(entry.text) === this._currentText);
			if (match?.script) {
				try {
					new Function(match.script)();
					SoundManager.playLoad();
					this._inputWindow.flashBlueThen(() => {
						this._currentText = '';
						this._inputWindow.setText(this._currentText);
					});
				} catch (error) {
					console.error(`${pluginName}: script error for text "${match.text}"`, error);
					SoundManager.playBuzzer();
				}
			} else {
				SoundManager.playBuzzer();
			}
			this._boardWindow.activate();
		}
	}

    //=================================================================================
    // Window_KokkuriInput
    //=================================================================================

	class Window_KokkuriInput extends Window_Base {
		initialize(x, y, w, h) {
			super.initialize(x, y, w, h);
			this.opacity = 0;
			this.contentsOpacity = 255;
			this._text = '';
			this._tintColor = null;
			this._flashTimer = 0;
			this._flashCallback = null;
			attachWindowPictureBg(this, 'Kokkuri-san_Top');
			this.refresh();
		}

		setText(text) {
			if (this._text !== text) {
				this._text = text;
				this.refresh();
			}
		}

		flashBlueThen(callback) {
			this._tintColor = '#4aa3ff';
			this._flashTimer = 30;
			this._flashCallback = callback;
			this.refresh();
		}

		update() {
			super.update();
			if (this._flashTimer <= 0) return;
			this._flashTimer--;
			if (this._flashTimer === 0) {
				this._tintColor = null;
				const callback = this._flashCallback;
				this._flashCallback = null;
				callback?.();
				this.refresh();
			}
		}

		refresh() {
			this.contents.clear();
			const previousFontSize = this.contents.fontSize;
			this.changeTextColor(this._tintColor || textColor);
			this.contents.fontSize = entryFontSize;
			this.drawText(this._text, 0, 0, this.contents.width, 'center');
			this.contents.fontSize = previousFontSize;
			this.resetTextColor();
		}
	}

    //=================================================================================
    // Window_KokkuriBoard
    //=================================================================================

	class Window_KokkuriBoard extends Window_Selectable {
		initialize(x, y, w, h) {
			this._symbols = symbolObjects.slice();
			super.initialize(x, y, w, h);
			this.opacity = 0;
			this.contentsOpacity = 255;
			attachWindowPictureBg(this, 'Kokkuri-san_Bottom');
			const iconSet = ImageManager.loadSystem('IconSet');
			const iconSprite = new Sprite(iconSet);
			const iconFrame = kokkuriIconFrame(41);
			iconSprite.setFrame(iconFrame.sx, iconFrame.sy, iconFrame.sw, iconFrame.sh);
			iconSprite.anchor.set(0.5, 0.5);
			this._cursorIconSprite = iconSprite;
			this.addChild(this._cursorIconSprite);
			this.refresh();
		}

		maxItems() {
			return this._symbols?.length ?? 0;
		}

		maxCols() {
			return boardColumns;
		}

		spacing() {
			return 6;
		}

		isEnabledIndex(index) {
			return !!(this._symbols[index]?.enabled);
		}

		isCurrentItemEnabled() {
			return this.isEnabledIndex(this.index());
		}

		currentSymbol() {
			return this._symbols[this.index()]?.text ?? '';
		}

		drawItem(index) {
			const rect = this.itemRect(index);
			const text = this._symbols[index]?.text ?? '';
			this.resetTextColor();
			this.changeTextColor(textColor);
			this.drawText(text, rect.x, rect.y, rect.width, 'center');
			this.resetTextColor();
		}

		refresh() {
			this.createContents();
			for (let i = 0; i < this.maxItems(); i++) {
				this.drawItem(i);
			}
		}

		//---------------------------
		// Navigation helpers
		//---------------------------

		_indexToRC(index) {
			return {
				row: Math.floor(index / boardColumns),
				col: index % boardColumns
			};
		}

		_rcToIndex(row, col) {
			return row * boardColumns + col;
		}

		_wrapCol(col) {
			return (col + boardColumns) % boardColumns;
		}

		_nextEnabledRight(from, wrap) {
			let {row, col} = this._indexToRC(from);
			const startCol = col;
			while (true) {
				col = this._wrapCol(col + 1);
				if (col === 0 && !wrap)
					return from;
				const index = this._rcToIndex(row, col);
				if (index < this.maxItems() && this.isEnabledIndex(index))
					return index;
				if (col === startCol)
					return from;
			}
		}

		_nextEnabledLeft(from, wrap) {
			let {row, col} = this._indexToRC(from);
			const startCol = col;
			while (true) {
				col = this._wrapCol(col - 1);
				if (col === boardColumns - 1 && !wrap)
					return from;
				const index = this._rcToIndex(row, col);
				if (index < this.maxItems() && this.isEnabledIndex(index))
					return index;
				if (col === startCol)
					return from;
			}
		}

		_nextEnabledDown(from, wrap) {
			const maxItems = this.maxItems();
			let {row, col} = this._indexToRC(from);
			const startRow = row;
			while (true) {
				row++;
				let index = this._rcToIndex(row, col);
				if (index >= maxItems) {
					if (!wrap)
						return from;
					row = 0;
					index = this._rcToIndex(row, col);
				}
				if (this.isEnabledIndex(index))
					return index;
				if (row === startRow)
					return from;
			}
		}

		_nextEnabledUp(from, wrap) {
			const maxItems = this.maxItems();
			let {row, col} = this._indexToRC(from);
			const startRow = row;
			while (true) {
				row--;
				if (row < 0) {
					if (!wrap)
						return from;
					row = Math.floor((maxItems - 1) / boardColumns);
				}
				const index = this._rcToIndex(row, col);
				if (index < maxItems && this.isEnabledIndex(index))
					return index;
				if (row === startRow)
					return from;
			}
		}

		_moveCursor(index) {
			if (this.isCursorMovable() && index !== this.index())
				this.select(index);
		}

		cursorRight(wrap) {
			this._moveCursor(this._nextEnabledRight(this.index(), wrap));
		}

		cursorLeft(wrap) {
			this._moveCursor(this._nextEnabledLeft(this.index(), wrap));
		}

		cursorDown(wrap) {
			this._moveCursor(this._nextEnabledDown(this.index(), wrap));
		}

		cursorUp(wrap) {
			this._moveCursor(this._nextEnabledUp(this.index(), wrap));
		}

		selectFirstEnabled() {
			const firstIndex = this._symbols.findIndex(symbol => symbol.enabled);
			this.select(firstIndex >= 0 ? firstIndex : 0);
		}

		//---------------------------
		// Cursor icon
		//---------------------------

		select(index) {
			super.select(index);
			this._updateCursorIconPos();
		}

		update() {
			super.update();
			this._updateCursorIconPos();
		}

		_updateCursorIconPos() {
			if (!this._cursorIconSprite) return;
			const index = this.index();
			if (index < 0 || index >= this.maxItems()) {
				this._cursorIconSprite.visible = false;
				return;
			}
			const rect = this.itemRect(index);
			this._cursorIconSprite.visible = true;
			this._cursorIconSprite.x = rect.x + rect.width / 2;
			this._cursorIconSprite.y = rect.y + rect.height / 2;
		}
	}

    //=================================================================================
    // Plugin Command
    //=================================================================================

    const _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pluginCommand.call(this, command, args);
        if (command === 'Kokkuri-san') {
            SceneManager.push(Scene_KokkuriSan);
        }
    };

})();