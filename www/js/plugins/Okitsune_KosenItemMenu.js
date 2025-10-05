/*:
 * @plugindesc Built for 古今東西おきつね物語.
 * Performs the script of CE 213 when the player enters the Item Scene.
 * @author CygnarJake
 *
 * @help
 * This plugin automatically performs the script of CE 213 every time the
 * player opens the Item Scene. I believe I've fixed the lag during the battle,
 * but I was still having occasional issues with inputs being reversed in
 * the item menu.
 */

(function() {
    // Alias the existing Scene_Item.prototype.create function
    var _Scene_Item_create = Scene_Item.prototype.create;

    Scene_Item.prototype.create = function() {
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

    };
})();
