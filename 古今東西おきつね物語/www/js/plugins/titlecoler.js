(function() {
    'use strict';
    var colorNumber = 0;

    Window_TitleCommand.prototype.resetTextColor = function() {
        this.changeTextColor(this.textColor(colorNumber));
    };
})();