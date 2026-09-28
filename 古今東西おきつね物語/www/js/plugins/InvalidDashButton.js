(function() {
    'use strict';

    Game_Player.prototype.isDashButtonPressed = function() {
        return ConfigManager.alwaysDash;
    };
})();
