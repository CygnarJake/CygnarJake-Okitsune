// --------------------------------------------------------------------------
//
// SaveMax
//
// Copyright (c) 2016 hatonekoe
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//
// 2016/09/12 ver1.0.0 first release
// 2016/09/10 ver0.0.1 開発開始
//
// --------------------------------------------------------------------------
/*:
 * @plugindesc セーブ最大数を変更します
 * @author ハトネコエ - http://hato-neko.x0.com
 *
 * @help
 * セーブできる最大数を変更します。デフォルトは 20 です
 *
 * @param Max Quantity
 * @desc セーブ最大数
 * @default 20
 *
 */

(function() {

	var pluginName = "HTN_SaveMax";

	var parameters = PluginManager.parameters(pluginName);
	var saveMax = Number(parameters["Max Quantity"]);

	DataManager.maxSavefiles = function() {
		return saveMax;
	};

})();
