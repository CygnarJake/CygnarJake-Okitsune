/*:
 * @plugindesc Built for 古今東西おきつね物語. WEBGL/CANVAS renderer toggle, custom Voice Volume, and configurable Options rows.
 * @author CygnarJake
 *
 * @help
 * - Adds a renderer toggle (WEBGL/CANVAS). Leaving Options restarts the game if changed.
 * - New "Voice Volume" option; only SE files listed in the parameter are controlled by it.
 *   All other SEs use regular "SE Volume".
 * - Number of visible rows in Options is configurable.
 * - Canvas mode forces screen effects OFF.
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

(() => {
    'use strict';

	const pluginName = 'Okitsune_Options';
	const params = PluginManager.parameters(pluginName);
	const optionsRows = Number(params.OptionsWindowRows);
	const voiceLabel = params.VoiceOptionName;
	const voiceSet = new Set(JSON.parse(params.VoiceFileList || '[]'));

	const renderLabel = '描画モード';
	const filterLabel = 'フィルター効果';
	const renderModes = ['webgl', 'canvas'];
    const renderNames  = {webgl: 'WEBGL', canvas: 'CANVAS'};

    let originalRenderer = null;

    //=================================================================================
    // ConfigManager - renderer preference and voice volume
    //=================================================================================

	{
		let chosenRenderer = 'webgl';
		try {
			const savedConfig = StorageManager.load(-1);
			if (savedConfig && JSON.parse(savedConfig).preferredRenderer === 'canvas') {
				chosenRenderer = 'canvas';
			}
		} catch (error) {
			console.warn(`${pluginName}: renderer config parse error:`, error);
		}
		ConfigManager.preferredRenderer = chosenRenderer;
	}

	ConfigManager.voiceVolume = 100;

	const _ConfigManager_applyData = ConfigManager.applyData;
	ConfigManager.applyData = function (config) {
		_ConfigManager_applyData.call(this, config);
		this.preferredRenderer = config.preferredRenderer === 'canvas' ? 'canvas' : 'webgl';
		this.voiceVolume = this.readVolume(config, 'voiceVolume');
	};

	const _ConfigManager_makeData = ConfigManager.makeData;
	ConfigManager.makeData = function () {
		const data = _ConfigManager_makeData.call(this);
		data.preferredRenderer = this.preferredRenderer;
		data.voiceVolume = this.voiceVolume;
		return data;
	};

    //=================================================================================
    // SceneManager - renderer type
    //=================================================================================

    SceneManager.preferableRendererType = function() {
        return ConfigManager.preferredRenderer === 'canvas' ? 'canvas' : 'webgl';
    };

    //=================================================================================
    // Window_Options - command list, status text, input handling
    //=================================================================================

	if (Window_Options.prototype.addTKMFilterOptions) {
		Window_Options.prototype.addTKMFilterOptions = function () {};
	}

	Window_Options.prototype.numVisibleRows = function () {
		return optionsRows;
	};

	const _Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
	Window_Options.prototype.makeCommandList = function () {
		_Window_Options_makeCommandList.call(this);

		// Entries in desired order
		const managedSymbols = ['preferredRenderer', 'TKMFilterEnabledAll', 'voiceVolume'];
		this._list = this._list.filter(command => !managedSymbols.includes(command.symbol));

		this.addCommand(renderLabel, 'preferredRenderer');
		this.addCommand(filterLabel, 'TKMFilterEnabledAll');
		this.addCommand(voiceLabel, 'voiceVolume');

		// Move voiceVolume to directly after seVolume
		const seIndex = this._list.findIndex(command => command.symbol === 'seVolume');
		const voiceIndex = this._list.findIndex(command => command.symbol === 'voiceVolume');
		if (seIndex >= 0 && voiceIndex >= 0 && voiceIndex !== seIndex + 1) {
			const [voiceCommand] = this._list.splice(voiceIndex, 1);
			this._list.splice(seIndex + 1, 0, voiceCommand);
		}
	};

	const _Window_Options_isVolumeSymbol = Window_Options.prototype.isVolumeSymbol;
	Window_Options.prototype.isVolumeSymbol = function (symbol) {
		return symbol === 'voiceVolume' || _Window_Options_isVolumeSymbol?.call(this, symbol) || false;
	};

	if (typeof Window_Options.prototype.volumeStatus !== 'function') {
		Window_Options.prototype.volumeStatus = function (symbol) {
			const volume = this.getConfigValue ? this.getConfigValue(symbol) : (ConfigManager[symbol] || 0);
			return `${Math.round(volume)}%`;
		};
	}

	if (typeof Window_Options.prototype.volumeOffset !== 'function') {
		Window_Options.prototype.volumeOffset = function () {
			return 20;
		};
	}

	const _Window_Options_processOk = Window_Options.prototype.processOk;
	Window_Options.prototype.processOk = function () {
		const symbol = this.commandSymbol(this.index());
		if (symbol === 'preferredRenderer') {
			const currentIndex = renderModes.indexOf(ConfigManager.preferredRenderer);
			const nextRenderer = renderModes[(Math.max(currentIndex, 0) + 1) % renderModes.length];
			this.changeValue(symbol, nextRenderer);
			SoundManager.playOk();
			ConfigManager.save();
			const selectedIndex = this.index();
			this.refresh();
			this.select(selectedIndex);
		} else if (symbol === 'TKMFilterEnabledAll') {
			if (ConfigManager.preferredRenderer === 'canvas') {
				SoundManager.playBuzzer();
			} else {
				_Window_Options_processOk.call(this);
			}
		} else {
			_Window_Options_processOk.call(this);
		}
	};

	const _Window_Options_statusText = Window_Options.prototype.statusText;
	Window_Options.prototype.statusText = function (index) {
		const symbol = this.commandSymbol(index);
		if (symbol === 'preferredRenderer') {
			return renderNames[ConfigManager.preferredRenderer] || 'WEBGL';
		}
		if (symbol === 'voiceVolume') {
			const volume = this.getConfigValue ? this.getConfigValue('voiceVolume') : ConfigManager.voiceVolume;
			return `${Math.round(volume)}%`;
		}
		return _Window_Options_statusText.call(this, index);
	};

	const _Window_Options_changeValue = Window_Options.prototype.changeValue;
	Window_Options.prototype.changeValue = function (symbol, value) {
		if (symbol === 'preferredRenderer' && typeof value !== 'string')
			return;
		_Window_Options_changeValue.call(this, symbol, value);
		if (symbol === 'preferredRenderer') {
			ConfigManager.preferredRenderer = value;
			this.redrawItem(this.findSymbol(symbol));
		}
	};

	const _Window_Options_isCommandEnabled = Window_Options.prototype.isCommandEnabled;
	Window_Options.prototype.isCommandEnabled = function (index) {
		const symbol = this.commandSymbol(index);
		if (symbol === 'TKMFilterEnabledAll')
			return ConfigManager.preferredRenderer === 'webgl';
		return _Window_Options_isCommandEnabled?.call(this, index) ?? true;
	};

	const _Window_Options_update = Window_Options.prototype.update;
	Window_Options.prototype.update = function () {
		_Window_Options_update?.call(this);
		if (ConfigManager.preferredRenderer === 'canvas' && ConfigManager.TKMFilterEnabledAll) {
			ConfigManager.TKMFilterEnabledAll = false;
			this.redrawItem(this.findSymbol('TKMFilterEnabledAll'));
		}
	};

	// Disable left/right cursor cycling on renderer row
	const noCycleSymbols = ['preferredRenderer'];

	const _Window_Options_cursorRight = Window_Options.prototype.cursorRight;
	Window_Options.prototype.cursorRight = function (wrap) {
		if (noCycleSymbols.includes(this.commandSymbol(this.index()))) {
			SoundManager.playCursor();
			return;
		}
		_Window_Options_cursorRight.call(this, wrap);
	};

	const _Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
	Window_Options.prototype.cursorLeft = function (wrap) {
		if (noCycleSymbols.includes(this.commandSymbol(this.index()))) {
			SoundManager.playCursor();
			return;
		}
		_Window_Options_cursorLeft.call(this, wrap);
	};

    //=================================================================================
    // Scene_Options - track original renderer, restart on change
    //=================================================================================

	const _Scene_Options_create = Scene_Options.prototype.create;
	Scene_Options.prototype.create = function () {
		_Scene_Options_create.call(this);
		originalRenderer ??= ConfigManager.preferredRenderer;
	};

	const _Scene_Options_popScene = Scene_Options.prototype.popScene;
	Scene_Options.prototype.popScene = function () {
		if (ConfigManager.preferredRenderer !== originalRenderer) {
			ConfigManager.save();
			localStorage.setItem('Okitsune_Restart', 'true');
			if (Utils.isNwjs()) {
				nw.Window.get().reload();
			} else {
				SceneManager.goto(Scene_Boot);
			}
			originalRenderer = null;
			return;
		}
		_Scene_Options_popScene.call(this);
	};

    //=================================================================================
    // AudioManager - route voice SE files through voice volume
    //=================================================================================

    const _AudioManager_updateSeParameters = AudioManager.updateSeParameters;
    AudioManager.updateSeParameters = function(buffer, se) {
        if (voiceSet.has(se.name)) {
            this.updateBufferParameters(buffer, ConfigManager.voiceVolume, se);
        } else {
            _AudioManager_updateSeParameters.call(this, buffer, se);
        }
    };

})();