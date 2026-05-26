/*:
 * @plugindesc Built for 古今東西おきつね物語. Outfit system allowing players to change into outfits with gold and item requirements.
 * @author CygnarJake
 *
 * @help
 * One may configure various 'outfits' per actor which apply to an image override at the bottom of the plugin file.
 * An outfit menu is added from which the play may select which actor they wish to choose an outfit for, then which outfit for that actor to activate.
 * An image cache is used to store already determined image replacements.
 *
 * =========
 * Main Parameters:
 * =========
 * Actor Outfits - Configure actors who should have outfits and their outfits.
 *
 * No Outfit Text - The display text for the window option that deactivates (unequips) all outfits, actor specific or global.
 *
 * Outfit Change SE - The sound effect that applies upon leaving the outfit scene there's a change in which outfits are active.
 *
 * Unlock Variable ID - Which game variable the game should use to hold which outfits that player has unlocked.
 * Should not be changed anywhere outside of plugin functions.
 *
 * Persist New Game - Boolean which, when true, will unlock all previously unlocked outfits for the player when the start a new game.
 * They will also start with the most recently activated outfit active (none if deactivation was the most recent action).
 *
 * Encrypted Images - Boolean choice to indicate whether the game uses unencrypted .png images or encrypted .rpgmvp
 *
 * =========
 * Outfits:
 * =========
 * Name: Name that displays in the outfit selection menu.
 *
 * Preview Image: Picture shown for an iamge in the outfit selection menu.
 *
 * File Suffix: A string to append to the end of a "default" file, with which the loadBitmap override then checks if such an image exists and loads that instead.
 * 	Example: Outfit "A" with file suffix "_[example]" is active.
 *	Game goes to load img/pictures/A1.png, and img/pictures/A1_[example].png exists. 
 *	img/pictures/A1_[example].png is loaded in place of the base file.
 *
 * Gold Cost: The amount of gold the player must have to purchase an outfit.
 *
 * Item Requirements: Any items and their amounts that the player must have to purchase the outfit. Only regular items are taken upon a purchase.
 *
 * Condition: Any additional condition, input as a string and evaluated, you might want to set for the outfit. Shows up as "???" in the requirements window.
 *
 * =========
 * Plugin Commands:
 * =========
 * OpenOutfits - Opens the outfit selection scene.
 * UnlockOutfit - UnlockOutfit actorID outfitName
 * RelockOutfit - RelockOutfit actorID outfitName
 * UnlockAllOutfits
 * RelockAllOutfits
 * ActivateOutfit - ActivateOutfit actorID outfitName
 * DeactivateOutfit - DeactivateOutfit actorID outfitName
 * DeactivateAllOutfits
 *
 * =========
 * Accesible Window Functions:
 * =========
 * Okitsune.OutfitSystem.
 * 	actorOutfits
 * 	getActorOutfits(actorId)
 *	getActorPreviewImage(actorId)
 *	getOutfit(actorId, name)
 *	isUnlocked(actorId, name)
 *	getUnlockedOutfits(actorId)
 *	hasAnyUnlockedOutfit()
 *	getActiveOutfit(actorId)
 *	unlockAndActivateOutfit(actorId, name)
 *	deactivateOutfit(actorId)
 *	deactivateAllOutfits()
 *	canAfford(actorId, name)
 *	invalidateImageCache()
 *
 * ===========================
 * OUTFIT CREDITS:
 * ===========================
 * Nanashi - Standing pictures {Kohaku: [Bunbuku, SSR Maid, Shika-no-Yu, Lamia], Kokuri: SSR Maid}
 * Mutya - Standing pictures {Kohaku: Niko, Kokuri: Niko} & all sprites
 * Memories - Standing pictures {Kohaku: Kris}
 * Qkonsan - Design {Kokuri: SSR Japanese Maid}
 *
 * @param ActorOutfits
 * @type struct<ActorEntry>[]
 * @desc Assign outfits to specific actors.
 * @default []
 *
 * @param NoOutfitText
 * @type string
 * @desc Text to display in the unequip cell.
 * @default No Outfits
 *
 * @param OutfitChangeSE
 * @type file
 * @dir audio/se
 * @desc Sound effect to play when the active outfit changes upon closing the menu.
 * @default
 *
 * @param UnlockVariableId
 * @type variable
 * @desc Game variable ID used to store this save file's unlocked outfits.
 * @default 1
 *
 * @param PersistNewGame
 * @type boolean
 * @desc If on, outfits unlocked in any save file will be available from the start of a new game.
 * @default true
 *
 * @param EncryptedImages
 * @type boolean
 * @on .rpgmvp
 * @off .png
 * @desc Does the game use encrypted .rpgmvp image files or unencrypted .png files?
 * @default false
 *
 */

/*~struct~ActorEntry:
 * @param actorId
 * @type actor
 * @desc The actor these outfits belong to.
 * @default 1
 *
 * @param previewImage
 * @type file
 * @dir img
 * @desc Default preview image for this actor.
 * @default
 *
 * @param outfits
 * @type struct<Outfit>[]
 * @desc The outfits available to this actor.
 * @default []
 */

/*~struct~Outfit:
 * @param name
 * @type string
 * @desc The display name of the outfit.
 * @default New Outfit
 *
 * @param previewImage
 * @type file
 * @dir img
 * @desc Preview image for this outfit (PNG, no extension).
 * @default
 *
 * @param fileSufix
 * @type string
 * @desc The file sufix used for this outfit's assets.
 * @default _[text]
 *
 * @param goldCost
 * @type number
 * @desc The gold required to equip this outfit.
 * @default 0
 *
 * @param itemRequirements
 * @type struct<ItemRequirement>[]
 * @desc Items required to equip this outfit.
 * @default []
 *
 * @param condition
 * @type string
 * @desc Optional script condition that must evaluate to true to unlock. Leave blank for no extra condition.
 * @default
 */

/*~struct~ItemRequirement:
 * @param itemId
 * @type item
 * @desc The required item.
 * @default 0
 *
 * @param amount
 * @type number
 * @min 1
 * @max 99
 * @desc The amount of this item required.
 * @default 1
 */

(() => {
	'use strict';

    const pluginName = "Okitsune_Outfits";
    const parameters = PluginManager.parameters(pluginName);

    //=================================================================================
    // Outfit Class
    //=================================================================================

	class Outfit {
		constructor(name, goldCost, fileSufix, previewImage, itemRequirements, condition) {
			this.name = name;
			this.goldCost = goldCost;
			this.fileSufix = fileSufix;
			this.previewImage = previewImage;
			this.itemRequirements = itemRequirements;
			this.condition = condition;
		}
		
		 meetsCondition() {
            if (!this.condition) return true;
            try {
                return !!eval(this.condition);
            } catch(e) {
                console.warn(`${pluginName}: Condition eval failed for outfit "${this.name}": ${e}`);
                return false;
            }
        }

		canAfford() {
			if ($gameParty.gold() < this.goldCost) return false;
            if (!this.meetsCondition()) return false;
			return this.itemRequirements.every(req => {
				const item = $dataItems[req.itemId];
				return $gameParty.numItems(item) >= req.amount;
			});
		}

		deductCosts() {
			$gameParty.loseGold(this.goldCost);
			this.itemRequirements.forEach(req => {
				const item = $dataItems[req.itemId];
				// Deduct only Regular Items
				if (item && item.itypeId === 1) {
					$gameParty.loseItem(item, req.amount);
				}
			});
		}

		requirementLines() {
			const lines = [];
			if (this.goldCost > 0) {
				const have = $gameParty.gold();
				const haveColor = have >= this.goldCost ? '\\C[3]' : '\\C[8]';
				lines.push(`\\I[1]${haveColor}${have}\\C[0] / ${this.goldCost}`);
			}
			this.itemRequirements.forEach(req => {
				const item = $dataItems[req.itemId];
				if (!item) return;
				const have = $gameParty.numItems(item);
				const haveColor = have >= req.amount ? '\\C[1]' : '\\C[8]';
				lines.push(`\\I[${item.iconIndex}]${haveColor}${have}\\C[0] / ${req.amount}`);
			});
			if (this.condition) {
				lines.push(this.meetsCondition() ? '\\C[5]???' : '\\C[15]???');
			}
			return lines;
		}
	}

    //=================================================================================
    // Parameter Parsing
    //=================================================================================

	function parseItemRequirements(rawJson) {
		if (!rawJson || rawJson === '[]') return [];
		return JSON.parse(rawJson).map(entry => {
			const data = JSON.parse(entry);
			return {
				itemId: Number(data.itemId),
				amount: Number(data.amount)
			};
		});
	}

	function parseOutfits(rawJson) {
		if (!rawJson || rawJson === '[]') return [];
		return JSON.parse(rawJson).map(entry => {
			const data = JSON.parse(entry);
			return new Outfit(data.name, Number(data.goldCost), data.fileSufix || '', data.previewImage || '', parseItemRequirements(data.itemRequirements), data.condition);
		});
	}

	function parseActorOutfits(rawJson) {
		if (!rawJson || rawJson === '[]') return {};
		const result = {};
		JSON.parse(rawJson).forEach(entry => {
			const data = JSON.parse(entry);
			const actorId = Number(data.actorId);
			result[actorId] = {
				outfits: parseOutfits(data.outfits),
				previewImage: data.previewImage || ''
			};
		});
		return result;
	}


    //=================================================================================
    // Initialization
    //=================================================================================

    const actorOutfits = parseActorOutfits(parameters['ActorOutfits']);
	const actorOrder = JSON.parse(parameters['ActorOutfits'] || '[]').map(entry => Number(JSON.parse(entry).actorId));
	const noOutfitText = parameters['NoOutfitText'];
	const outfitChangeSE = parameters['OutfitChangeSE'] || '';
	const unlockVariableId = Number(parameters['UnlockVariableId']);
	const persistNewGame = parameters['PersistNewGame'] === 'true';
	const imgExtension = parameters['EncryptedImages'] === 'true' ? '.rpgmvp' : '.png';
	
	//=================================================================================
    // Core Functions for Outfit Status and Storage
    //=================================================================================

	const _ConfigManager_makeData = ConfigManager.makeData;
	ConfigManager.makeData = function () {
		const config = _ConfigManager_makeData.call(this);
		config.OkitsuneOutfits = {
			permanentUnlocks: this.OkitsuneOutfits?.permanentUnlocks ?? [],
			permanentActives: this.OkitsuneOutfits?.permanentActives ?? {}
		};
		return config;
	};

	const _ConfigManager_applyData = ConfigManager.applyData;
	ConfigManager.applyData = function (config) {
		_ConfigManager_applyData.call(this, config);
		this.OkitsuneOutfits = {
			permanentUnlocks: Array.isArray(config.OkitsuneOutfits?.permanentUnlocks) ? config.OkitsuneOutfits.permanentUnlocks : [],
			permanentActives: typeof config.OkitsuneOutfits?.permanentActives === 'object' ? config.OkitsuneOutfits.permanentActives : {}
		};
	};

	function getPermanentUnlocks() {
		return ConfigManager.OkitsuneOutfits?.permanentUnlocks ?? [];
	}

	function addToPermanentUnlocks(actorId, name) {
		const permanent = getPermanentUnlocks();
		if (!permanent.some(e => e.actorId === actorId && e.name === name)) {
			permanent.push({
				actorId,
				name
			});
			ConfigManager.save();
		}
	}

	function setPermanentActive(actorId, name) {
        ConfigManager.OkitsuneOutfits.permanentActives[actorId] = name;
        ConfigManager.save();
    }

	//---------------------------
	// Save specific unlock and active storage.
	//  * Unlocks save with designated game variable.
	//---------------------------

	function getSaveStore() {
		if (!$gameVariables) return [];
		const raw = $gameVariables.value(unlockVariableId);
		return Array.isArray(raw) ? raw : [];
	}

	function setSaveStore(arr) {
		if (!$gameVariables) return;
		$gameVariables.setValue(unlockVariableId, arr);
	}

	function isOutfitUnlocked(actorId, name) {
		return getSaveStore().some(e => e.actorId === actorId && e.name === name);
	}

	function unlockOutfit(actorId, name) {
		if (!isOutfitUnlocked(actorId, name)) {
			const store = getSaveStore();
			store.push({
				actorId,
				name
			});
			setSaveStore(store);
			addToPermanentUnlocks(actorId, name);
		}
	}

	function relockOutfit(actorId, name) {
		setSaveStore(getSaveStore().filter(e => !(e.actorId === actorId && e.name === name)));
	}

	function unlockAllOutfits() {
		Object.entries(actorOutfits).forEach(([actorId, entry]) => {
			entry.outfits.forEach(o => unlockOutfit(Number(actorId), o.name));
		});
	}

	function relockAllOutfits() {
		setSaveStore([]);
		deactivateAllOutfits();
	}

	function getActiveStore() {
		$gameSystem._okitsuneActiveOutfits ??= {};
		return $gameSystem._okitsuneActiveOutfits;
	}

	function setActiveStore(obj) {
		$gameSystem._okitsuneActiveOutfits = obj;
	}

	function getActiveOutfit(actorId) {
		return getActiveStore()[actorId] || null;
	}

	function activateOutfit(actorId, name) {
		const store = getActiveStore();
		store[actorId] = name;
		setActiveStore(store);
		setPermanentActive(actorId, name);
		invalidateOutfitImageCache();
	}

	function deactivateOutfit(actorId) {
		const store = getActiveStore();
		store[actorId] = null;
		setActiveStore(store);
		setPermanentActive(actorId, null);
		invalidateOutfitImageCache();
	}

	function deactivateAllOutfits() {
		const store = {};
		Object.keys(actorOutfits).forEach(actorId => {
			store[actorId] = null;
			setPermanentActive(Number(actorId), null);
		});
		setActiveStore(store);
		invalidateOutfitImageCache();
	}

	//---------------------------
	// Seed New Game from permanent unlocks.
	// Refresh image cache before game load.
	//---------------------------

	const _DataManager_setupNewGame = DataManager.setupNewGame;
	DataManager.setupNewGame = function () {
		_DataManager_setupNewGame.call(this);
		if (persistNewGame) {
			setSaveStore(getPermanentUnlocks().slice());
			const permanentActives = ConfigManager.OkitsuneOutfits?.permanentActives ?? {};
			Object.entries(permanentActives).forEach(([actorId, name]) => {
				if (name) activateOutfit(Number(actorId), name);
			});
		}
	};

    const _DataManager_loadGame = DataManager.loadGame;
    DataManager.loadGame = function(savefileId) {
        const result = _DataManager_loadGame.call(this, savefileId);
        invalidateOutfitImageCache();
        return result;
    };

    //=================================================================================
    // Plugin Commands
    //=================================================================================

    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
		switch (command) {
			case 'OpenOutfits':
                SceneManager.push(Scene_OkitsuneOutfits);
                break;
            case 'UnlockOutfit':            // UnlockOutfit 1 Kohaku Komachi
                unlockOutfit(Number(args[0]), args.slice(1).join(' '));
                break;
            case 'RelockOutfit':            // RelockOutfit 1 Kohaku Komachi
                relockOutfit(Number(args[0]), args.slice(1).join(' '));
                break;
            case 'UnlockAllOutfits':
                unlockAllOutfits();
                break;
            case 'RelockAllOutfits':
                relockAllOutfits();
                break;
            case 'ActivateOutfit':          // ActivateOutfit 1 Kohaku Komachi
                unlockOutfit(Number(args[0]), args.slice(1).join(' '));
				activateOutfit(Number(args[0]), args.slice(1).join(' '));
                break;
            case 'DeactivateOutfit':        // DeactivateOutfit 1
                deactivateOutfit(Number(args[0]));
                break;
            case 'DeactivateAllOutfits':
                deactivateAllOutfits();
                break;
        }
    };

    //=================================================================================
    // API
    //=================================================================================
	window.Okitsune = window.Okitsune || {};
	Okitsune.OutfitSystem = {
			actorOutfits,

			getActorOutfits(actorId) {
				return actorOutfits[actorId] ? actorOutfits[actorId].outfits : [];
			},

			getActorPreviewImage(actorId) {
				return actorOutfits[actorId] ? actorOutfits[actorId].previewImage : '';
			},

			getOutfit(actorId, name) {
				return this.getActorOutfits(actorId).find(o => o.name === name) || null;
			},

			isUnlocked(actorId, name) {
				return isOutfitUnlocked(actorId, name);
			},

			getUnlockedOutfits(actorId) {
				return this.getActorOutfits(actorId).filter(o => isOutfitUnlocked(actorId, o.name));
			},

			hasAnyUnlockedOutfit() {
				return getSaveStore().length > 0;
			},

			getActiveOutfit(actorId) {
				return getActiveOutfit(actorId);
			},

			activateOutfit(actorId, name) {
				unlockOutfit(actorId, name);
				activateOutfit(actorId, name);
			},

			deactivateOutfit(actorId) {
				deactivateOutfit(actorId);
			},

			deactivateAllOutfits() {
				deactivateAllOutfits();
			},

			canAfford(actorId, name) {
				const outfit = this.getOutfit(actorId, name);
				return outfit ? outfit.canAfford() : false;
			},

			invalidateImageCache() {
				invalidateOutfitImageCache();
			}
		};

	//=================================================================================
    // Outfit Menu
    //=================================================================================

    class Scene_OkitsuneOutfits extends Scene_MenuBase {
        create() {
            super.create();
            this._snapshotOutfitState();
            this._createSelectWindow();
			this._createPreviewWindow();
            this._createRequirementsWindow();
        }

        // Snapshot active outfits at open so we can compare on close
        _snapshotOutfitState() {
            this._outfitStateOnOpen = {};
            actorOrder.forEach(id => {
                this._outfitStateOnOpen[id] = getActiveOutfit(id);
            });
        }

		_createSelectWindow() {
			this._selectWindow = new Window_OkitsuneOutfitSelect(0, 0, Graphics.boxWidth);
			this._selectWindow.setHandler('ok', this._onSelectOk.bind(this));
			this._selectWindow.setHandler('cancel', this._onSelectCancel.bind(this));
			this._selectWindow.setModeActor();
			this.addWindow(this._selectWindow);
		}

        _createPreviewWindow() {
            const bottom = this._selectWindow.y + this._selectWindow.height;
            this._previewWindow = new Window_OkitsuneOutfitPreview(bottom);
            this.addWindow(this._previewWindow);
        }

        _createRequirementsWindow() {
            const bottom = this._selectWindow.y + this._selectWindow.height;
            this._requirementsWindow = new Window_OkitsuneOutfitRequirements();
            this._requirementsWindow._selectWindowBottom = bottom;
            this.addChild(this._requirementsWindow); // bypass WindowLayer
        }

        update() {
            super.update();
            this._updatePreview();
            this._updateRequirements();
        }

        _updatePreview() {
            const item = this._selectWindow.currentItem();
            if (!item) { this._previewWindow.clearPreview(); return; }

            if (item.type === 'noOutfit' && this._selectWindow._mode === 'actor') {
                this._previewWindow.clearPreview();
                return;
            }

            if (item.type === 'actor') {
                const active = getActiveOutfit(item.actorId);
                let imagePath = actorOutfits[item.actorId]?.previewImage ?? '';
                if (active) {
                    const activeOutfit = Okitsune.OutfitSystem.getOutfit(item.actorId, active);
                    if (activeOutfit && activeOutfit.previewImage) imagePath = activeOutfit.previewImage;
                }
                this._previewWindow.setPreview(imagePath, false);
                return;
            }

            if (item.type === 'noOutfit' && this._selectWindow._mode === 'outfit') {
                const imagePath = actorOutfits[item.actorId]?.previewImage ?? '';
                this._previewWindow.setPreview(imagePath, false);
                return;
            }

            if (item.type === 'outfit') {
                const locked = !isOutfitUnlocked(item.actorId, item.outfit.name);
                this._previewWindow.setPreview(item.outfit.previewImage, locked);
            }
        }

        _updateRequirements() {
            const item = this._selectWindow.currentItem();
            if (!item || item.type !== 'outfit') {
                this._requirementsWindow.clear();
                return;
            }
            const locked = !isOutfitUnlocked(item.actorId, item.outfit.name);
            if (!locked) {
                this._requirementsWindow.clear();
                return;
            }
            const bottom = this._selectWindow.y + this._selectWindow.height;
            this._requirementsWindow.setOutfit(item.outfit, bottom);
        }

        _onSelectOk() {
            const item = this._selectWindow.currentItem();
            if (!item) {
				this._selectWindow.activate();
				return;
			}

            if (this._selectWindow._mode === 'actor') {
                if (item.type === 'noOutfit') {
                    deactivateAllOutfits();
                    this._selectWindow.refresh();
                    this._selectWindow.activate();
                } else {
                    this._selectWindow.setModeOutfit(item.actorId);
                }
                return;
            }

            // Outfit mode
            if (item.type === 'noOutfit') {
                deactivateOutfit(item.actorId);
                this._selectWindow.refresh();
                this._selectWindow.activate();
                return;
            }

            const outfit = item.outfit;
            const actorId = item.actorId;
            const locked = !isOutfitUnlocked(actorId, outfit.name);

			if (locked) {
				if (outfit.canAfford()) {
					outfit.deductCosts();
					unlockOutfit(actorId, outfit.name);
					activateOutfit(actorId, outfit.name);
					SoundManager.playShop();
					this._selectWindow.refresh();
					this._requirementsWindow.clear();
				} else {
					SoundManager.playBuzzer();
				}
				this._selectWindow.activate();
				return;
			}

            // Already unlocked - just activate
            activateOutfit(actorId, outfit.name);
            this._selectWindow.refresh();
            this._selectWindow.activate();
        }

        _onSelectCancel() {
            if (this._selectWindow._mode === 'outfit') {
				this._previewWindow.clearPreview();
                this._selectWindow.setModeActor();
            } else {
                this._checkOutfitChangeAndClose();
            }
        }

		_checkOutfitChangeAndClose() {
			const changed = actorOrder.some(id => {
				const before = this._outfitStateOnOpen[id] || null;
				const after = getActiveOutfit(id) || null;
				return before !== after;
			});
			if (changed) {
				//invalidateOutfitImageCache(); Already handled inside activate and deactivate outfit functions.
				AudioManager.playSe({name: outfitChangeSE, volume: 90, pitch: 100, pan: 0});
			}
			this.popScene();
		}
    }
	
	//---------------------------
    // Outfit Selection (Top-Window)
    //---------------------------

	class Window_OkitsuneOutfitSelect extends Window_Selectable {
		constructor(x, y, width) {
			const rowCount = 2;
			const height = Window_OkitsuneOutfitSelect.windowHeight(rowCount);
			super(x, y, width, height);
			this[Window_Command._id] = true; // register as SRD-translatable command window
			this._translatedNoOutfitText = okitsuneTranslateCMD(noOutfitText);
			this._mode = 'actor';
			this._selectedActorId = null;
			this._items = [];
			this.refresh();
		}
		
		currentName() {
			const item = this.currentItem();
			if (!item) return null;
			if (item.type === 'noOutfit')
				return this._translatedNoOutfitText;
			if (item.type === 'actor')
				return item.label;
			if (item.type === 'outfit')
				return item.outfit.name;
			return null;
		}

		static windowHeight(rows) {
			return Window_Base.prototype.fittingHeight(rows);
		}

		maxCols() {
			return 4;
		}

		maxItems() {
			return this._items ? this._items.length : 0;
		}

		numVisibleRows() {
			return 2;
			//const totalActors = actorOrder.length;
			//return (this._mode === 'actor' && totalActors < 4) ? 1 : 2;
		}

		updateWindowHeight() {
			const rows = this.numVisibleRows();
			this.height = this.fittingHeight(rows);
		}

		setModeActor() {
			this._mode = 'actor';
			this._selectedActorId = null;
			this.updateWindowHeight();
			this.refresh();
			this.select(0);
			this.activate();
		}

		setModeOutfit(actorId) {
			this._mode = 'outfit';
			this._selectedActorId = actorId;
			this.updateWindowHeight();
			this.refresh();
			this.select(0);
			this.activate();
		}

		currentItem() {
			return this._items[this.index()] || null;
		}

		refresh() {
			this._items = this._buildItems();
			this.createContents();
			this.drawAllItems();
		}

		_buildItems() {
			if (this._mode === 'actor') {
				return this._buildActorItems();
			} else {
				return this._buildOutfitItems();
			}
		}

		_buildActorItems() {
			const noOutfitItem = {
				type: 'noOutfit',
				label: this._translatedNoOutfitText
			};
			const actorItems = actorOrder.map(actorId => {
				const actor = $gameActors.actor(actorId);
				return {
					type: 'actor',
					actorId,
					label: actor ? actor.name() : `Actor ${actorId}`
				};
			});
			return [noOutfitItem, ...actorItems];
		}

		_buildOutfitItems() {
			const outfits = actorOutfits[this._selectedActorId] ? actorOutfits[this._selectedActorId].outfits : [];
			const noOutfitItem = {
				type: 'noOutfit',
				label: this._translatedNoOutfitText,
				actorId: this._selectedActorId
			};
			const outfitItems = outfits.map(outfit => ({
						type: 'outfit',
						actorId: this._selectedActorId,
						outfit,
						label: isOutfitUnlocked(this._selectedActorId, outfit.name) ? okitsuneTranslateCMD(outfit.name) : '???'
					}));
			return [noOutfitItem, ...outfitItems];
		}

		drawItem(index) {
			const item = this._items[index];
			if (!item) return;
			const rect = this.itemRectForText(index);
			this.resetTextColor();
			const greyColor = '#888888';
			if (item.type === 'noOutfit') {
				const anyActive = this._mode === 'actor' ? Object.keys(actorOutfits).some(id => getActiveOutfit(Number(id))) : getActiveOutfit(item.actorId);
				if (anyActive) this.changeTextColor(greyColor);
				this.drawText(this._translatedNoOutfitText, rect.x, rect.y, rect.width, 'center');
			} else if (item.type === 'actor') {
				const hasActive = !!getActiveOutfit(item.actorId);
				if (!hasActive) this.changeTextColor(greyColor);
				this.drawText(item.label, rect.x, rect.y, rect.width, 'center');
			} else if (item.type === 'outfit') {
				const active = getActiveOutfit(item.actorId);
				const isActive = active === item.outfit.name;
				if (!isActive) this.changeTextColor(greyColor);
				this.drawText(item.label, rect.x, rect.y, rect.width, 'center');
			}
			this.resetTextColor();
		}
	}
	
	//---------------------------
    // Outfit Preview Area (Bottom-Window)
    //---------------------------

	class Window_OkitsuneOutfitPreview extends Window_Base {
		constructor(selectWindowBottom) {
			const x = 0;
			const y = selectWindowBottom;
			const width = Graphics.boxWidth;
			const height = Graphics.boxHeight - selectWindowBottom;
			super(x, y, width, height);
			this.setBackgroundType(1);
			this._imagePath = null;
			this._locked = false;
			this._previewSprite = new Sprite();
			this.addChild(this._previewSprite);
		}

		setPreview(imagePath, locked) {
			this._locked = locked;
			if (this._imagePath === imagePath) {
				this._applyTone();
				return;
			}
			this._imagePath = imagePath;
			if (!imagePath) {
				this._previewSprite.bitmap = null;
				this._applyTone();
				return;
			}
			const bmp = ImageManager.loadBitmap('img/', imagePath);
			bmp.addLoadListener(() => {
				this._previewSprite.bitmap = bmp;
				if (this._previewSprite.texture && this._previewSprite.texture.baseTexture) {
					this._previewSprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
				}
				this._scaleAndCenter();
				this._applyTone();
			});
		}

		clearPreview() {
			this._imagePath = null;
			this._locked = false;
			this._previewSprite.bitmap = null;
		}

		_scaleAndCenter() {
			const bmp = this._previewSprite.bitmap;
			if (!bmp) return;
			const aw = this.contents.width;
			const ah = this.contents.height;
			const scale = Math.min(1, aw / bmp.width, ah / bmp.height);
			this._previewSprite.scale.x = scale;
			this._previewSprite.scale.y = scale;
			// Position relative to the window's inner content area (offset by padding)
			const pad = this.standardPadding();
			this._previewSprite.x = pad + Math.floor((aw - bmp.width * scale) / 2);
			this._previewSprite.y = pad + Math.floor((ah - bmp.height * scale) / 2);
		}

		// --- Configure appearance of locked and unlocked outfit preview images ---
		_applyTone() {
			if (this._locked) {
				this._previewSprite.setColorTone([-255, -255, -255, 0]);
				this._previewSprite.opacity = 170;
			} else {
				const bmp = this._previewSprite.bitmap;
				this._previewSprite.bitmap = null;
				this._previewSprite.bitmap = bmp;
				this._previewSprite.setColorTone([0, 0, 0, 0]);
				this._previewSprite.opacity = 255;
			}
			if (this._previewSprite.texture && this._previewSprite.texture.baseTexture) {
				this._previewSprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
			}
		}
	}
	
	//---------------------------
    // Outfit Requirements (in Bottom-Window)
    //---------------------------

	class Window_OkitsuneOutfitRequirements extends Window_Base {
		constructor() {
			super(0, 0, 320, 128);
			this.setBackgroundType(1);
			this.opacity = 0;
			this.backOpacity = 0;
			this._outfit = null;
			this.hide();
		}

		setOutfit(outfit, selectWindowBottom) {
			this._outfit = outfit;
			this._selectWindowBottom = selectWindowBottom;
			this.refresh();
		}

		clear() {
			this._outfit = null;
			this.hide();
		}

		refresh() {
			if (!this._outfit) return;
			this.contents.clear();
			const lines = this._buildLines();
			const newHeight = this.fittingHeight(lines.length);
			const newWidth = 320;
			this.width = newWidth;
			this.height = newHeight;
			this.x = (Graphics.boxWidth - newWidth) / 2;
			const idealY = (Graphics.boxHeight - newHeight) / 2;
			this.y = Math.max(this._selectWindowBottom, idealY);
			this.createContents();
			this.opacity = 0;
			this.backOpacity = 255;
			this.show();
			lines.forEach((line, i) => {
				this.drawTextEx(line, 0, i * this.lineHeight());
			});
		}

        _buildLines() {
            return this._outfit.requirementLines();
        }
	}
	
	//=================================================================================
    // Image Override
    //=================================================================================

    const fs = require('fs'), path = require('path');
    const basePath = path.dirname(process.mainModule.filename);
    const outfitImageCache = new Map();
	let activeEntries = [];
	let lang = '', isDefaultLang = true;

	function invalidateOutfitImageCache() {
		outfitImageCache.clear();
		lang = ConfigManager.getLanguage();
		isDefaultLang = ConfigManager.isDefaultLanguage();
		if ($gameSystem)
			activeEntries = actorOrder.map(id => {
				const name = getActiveOutfit(id);
				if (!name) return null;
				const entry = actorOutfits[id];
				if (!entry) return null;
				const outfit = entry.outfits.find(o => o.name === name);
				return outfit ? outfit.fileSufix : null;
			}).filter(Boolean);
	}

    function resolveOutfitFilename(folder, filename) {
		if (!$gameSystem) return filename;

		// Check outfit overrides first
        for (const suffix of activeEntries) {
            const candidate = filename + suffix;
            const fullPath = path.join(basePath, folder, candidate + imgExtension);
            if (fs.existsSync(fullPath)) return candidate;
        }

		// Check language override from SRD_TranslationEngine
		if (!isDefaultLang) {
			const candidate = `${filename}_[${lang}]`;
			const fullPath = path.join(basePath, folder, candidate + imgExtension);
			if (fs.existsSync(fullPath)) return candidate;
		}

        return filename;
    }

    const _ImageManager_loadBitmap = ImageManager.loadBitmap;
	ImageManager.loadBitmap = function (folder, filename, hue, smooth) {
		if (!filename) return _ImageManager_loadBitmap.call(this, folder, filename, hue, smooth);
		const key = folder + filename;

		//getOrInsertComputed would fulfill the resolved logic in one line, but it is not supported in NW.js v0.103.1,
		//the most recent release for Greenworks (v0.22.0). Once Greenworks is updated, switch to this line instead.
		//const resolved = outfitImageCache.getOrInsertComputed(key, () => resolveOutfitFilename(folder, filename));

		if (!outfitImageCache.has(key)) {
			outfitImageCache.set(key, resolveOutfitFilename(folder, filename));
		}
		const resolved = outfitImageCache.get(key);

		return _ImageManager_loadBitmap.call(this, folder, resolved, hue, smooth);
	};

})();