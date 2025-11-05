/*
NoF5Reload.js

2016/6/21 version 1.0

  利用規約
　・MITライセンスに準じます。
  ・商用・非商用問わず使えます。
　・改変公開可能
*/

/*:
 * @plugindesc This plugin disables reloading by F5 key.
 * @author sauto
 *
 * @help This plugin does not provide plugin commands.
 */

/*:ja
 * @plugindesc F5キーによるリロードを無効にします。
 * @author さうと
 *
 * @help このプラグインには、プラグインコマンドはありません。
 */

(function () {

    var parameters = PluginManager.parameters('NoF5Reload');
    //rpg_manager.js
    SceneManager.onKeyDown = function(event) {
    if (!event.ctrlKey && !event.altKey) {
        switch (event.keyCode) {
            //F5がここにあった
            case 119:   // F8
                if (Utils.isNwjs() && Utils.isOptionValid('test')) {
                    require('nw.gui').Window.get().showDevTools();
                }
                break;
        }
    }
};

})();
