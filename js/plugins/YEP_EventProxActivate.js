//=============================================================================
// Yanfly Engine Plugins - Event Proximity Activate
// YEP_EventProxActivate.js
//=============================================================================

var Imported = Imported || {};
Imported.YEP_EventProxActivate = true;

var Yanfly = Yanfly || {};
Yanfly.EvPrAc = Yanfly.EvPrAc || {};
Yanfly.EvPrAc.version = 1.01;

//=============================================================================
 /*:ja
 * @plugindesc v1.01 イベントのトリガーが反応する範囲を拡張します
 * @author Yanfly Engine Plugins
 *
 * @help
 * 翻訳:ムノクラ
 * https://fungamemake.com/
 * https://twitter.com/munokura/
 *
 * ===========================================================================
 * 導入
 * ===========================================================================
 *
 * RPGツクールMVでは、イベントはプレイヤーがそれらの隣に立っている時、
 * またはそれらの上に立っている時にのみトリガーになります。
 * 遠くからいくつかのイベントをトリガーを入れるための方法はありません。
 * このプラグインを使用すると、
 * イベントの周囲の正方形領域、半径、行中心、列中心を使用して、
 * 特定のイベントを遠くからトリガーにすることができます。
 * これらの新しい有効トリガー範囲は、
 *   決定ボタン
 *   プレーヤーから接触
 *   イベントから接触
 *   自動実行
 *   並列処理
 * を通じてイベントのトリガーと組み合わせることができ、
 * イベントのトリガーにする方法を提供します。
 * これらは全て、注釈タグをイベントページに追加するだけで実行できます。
 *
 * ===========================================================================
 * 注釈タグ
 * ===========================================================================
 *
 * デフォルトでは、各イベントページには近接機能がありません。
 * 注釈タグを使用して、イベントページ毎に手動で追加する必要があります。
 * 以下の注釈タグで、各イベントページに有効トリガー範囲を設定できます。
 *
 * ---
 *
 * 注釈タグ:
 *
 *   <Activation Square: x>
 *   - イベントの周囲にトリガー範囲を四角形の形で作成します。
 *   x は、イベントの左、右、上、下にタイルを張ります。
 *   これによりトリガー範囲は正方形のように見えます。
 *
 *   <Activation Radius: x>
 *   - イベントの周囲に x タイルのトリガー範囲を作成します
 *   （xとyの位置の差）。
 *   これをダイヤマークのように考えてください。
 *
 *   <Activation Row: x>
 *   - イベントから水平方向に広がるトリガー範囲を作成します。
 *   水平方向の範囲はマップ全体ですが、
 *   垂直方向の範囲はイベントの上下に x タイルです。
 *   xが0の場合、イベントと同じ垂直方向タイル上だけがトリガーになります。
 *
 *   <Activation Column: x>
 *   - イベントから垂直方向に広がるトリガー範囲を作成します。
 *   垂直方向の範囲はマップ全体ですが、
 *   水平方向の範囲はイベントの左右に x タイルです。
 *   xが0の場合、イベントと同じ水平方向タイル上だけがトリガーになります。
 *
 * ---
 *
 * イベントのトリガー反応はそのページのトリガー形式によって動作が異なります。
 * トリガーに基づいてイベントページがトリガーになる方法は次のとおりです。
 *
 *   決定ボタン
 *   - プレーヤーがイベントの近接範囲内にいる限り、
 *   決定ボタンを押すとイベントが有効になります。
 *
 *   プレイヤーから接触
 *   - プレイヤーがイベントの近接範囲内で移動した場合、
 *   イベントは自動的に有効になります。
 *   ただし、イベントがプレーヤーの範囲内に移動しても、
 *   これは発生しません。
 *   プレイヤーはイベントをトリガーするために決定ボタンを押すこともできます。
 *
 *   イベントから接触
 *   - プレイヤーがイベントの近接範囲内で移動した場合、
 *   イベントは自動的にトリガーになります。
 *   プレイヤーはイベントをトリガーするために決定ボタンを押すこともできます。
 *
 *   自動実行
 *   - プレイヤーがイベントの近接範囲内で移動した場合、
 *   イベントは自動的にトリガーになります。
 *   あなたがそれをオフにする方法がない限り、
 *   この自動実行を回避することはありません。
 *
 *   並列処理
 *   - プレイヤーがイベントの近接範囲内で移動した場合、またはその逆の場合、
 *   イベントは自動的にトリガーになります。
 *   プレイヤーは、並列処理がループする度に数フレームの移動を許可されます。
 *
 * ===========================================================================
 * Changelog
 * ===========================================================================
 *
 * Version 1.01:
 * - Fixed a bug where parallel events don't loop.
 *
 * Version 1.00:
 * - Finished Plugin!
 *
 * ===========================================================================
 * End of Helpfile
 * ===========================================================================
 */
/*:
 * @plugindesc v1.01 Allows events to activate by being in range of them
 * instead of needing to be exactly next to or on top of them.
 * @author Yanfly Engine Plugins
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * In RPG Maker MV, events can only activate when you are either standing next
 * to them or on top of them. There is no activation proximity range that can
 * be used to activate some events from afar. This plugin gives you multiple
 * ways to activate certain events from a distance, through means of a square
 * area around an event, a radius, row-centric, or column-centric. These new
 * activation proximity ranges can be coupled with an event's triggers: through
 * the Action Button, Player Touch, Event Touch, Autorun, and Parallels giving
 * multitudes of ways to activate events. And these can all be done by simply
 * adding Comment Tags into an event page.
 *
 * ============================================================================
 * Comment Tags
 * ============================================================================
 *
 * By default, each event page has zero proximity features. They have to be
 * added manually per event page using comment tags. You can use the following
 * comment tags to give each event page a proximity activation range.
 *
 * ---
 *
 * Comment Tags:
 *
 *   <Activation Square: x>
 *   - Creates an activation range around the event in the form of a square,
 *   x tiles to the left, right, above, and below the event. This makes the
 *   activation range look like a square.
 *
 *   <Activation Radius: x>
 *   - Creates an activation range around the event requiring the player to be
 *   within x tiles of the event (difference of x and y positions). Think of
 *   this more like a diamond.
 *
 *   <Activation Row: x>
 *   - Creates an activation range spanning horizontally from the event. The
 *   row's horizontal range is the whole map, but the vertical range is x tiles
 *   above and below the event. If x is 0, then the player must be exactly on
 *   the same vertical tile as the event.
 *
 *   <Activation Column: x>
 *   - Creates an activation range spanning vertically from the event. The
 *   row's vertical range is the whole map, but the horizontal range is x tiles
 *   left and right of the event. If x is 0, then the player must be exactly on
 *   the same horizontal tile as the event.
 *
 * ---
 *
 * Event proximity activations behave differently depending on the event page's
 * trigger type. Here is how the event page will activate based on the trigger:
 *
 *   Action Button
 *   - As long as the player is within the event's proximity range, pressing
 *   the OK button will activate the event.
 *
 *   Player Touch
 *   - If the player moves within the event's proximity range, the event will
 *   automatically activate. This will not occur if the event moves into range
 *   of the player, however. The player can also press the OK button to trigger
 *   the event.
 *
 *   Event Touch
 *   - If the player moves within the event's proximity range or vice versa,
 *   the event will automatically activate. The player can also press the OK
 *   button to trigger the event.
 *
 *   Autorun
 *   - If the player moves within the event's proximity range or vice versa,
 *   the event will automatically activate. There is no escaping this autorun
 *   unless you have a way of turning it off.
 *
 *   Parallel
 *   - If the player moves within the event's proximity range or vice versa,
 *   the event will automatically activate. The player is granted a few frames
 *   of movement each time the parallel process loops.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.01:
 * - Fixed a bug where parallel events don't loop.
 *
 * Version 1.00:
 * - Finished Plugin!
 *
 * ============================================================================
 * End of Helpfile
 * ============================================================================
 */
//=============================================================================

//=============================================================================
// Game_CharacterBase
//=============================================================================

Yanfly.EvPrAc.Game_CharacterBase_increaseSteps =
  Game_CharacterBase.prototype.increaseSteps;
Game_CharacterBase.prototype.increaseSteps = function() {
  Yanfly.EvPrAc.Game_CharacterBase_increaseSteps.call(this);
  this.eventProximityIncreaseSteps();
};

Game_CharacterBase.prototype.eventProximityIncreaseSteps = function() {
};

//=============================================================================
// Game_Player
//=============================================================================

Yanfly.EvPrAc.Game_Player_startMapEvent = Game_Player.prototype.startMapEvent;
Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
  Yanfly.EvPrAc.Game_Player_startMapEvent.call(this, x, y, triggers, normal);
  if (!$gameMap.isEventRunning() && !$gameMap.isAnyEventStarting()) {
    this.startProximityEvent(triggers, normal);
  }
};

Game_Player.prototype.startProximityEvent = function(triggers, normal) {
  var events = $gameMap.events();
  var length = events.length;
  for (var i = 0; i < length; ++i) {
    var ev = events[i];
    if (!ev) continue;
    if (!ev.isTriggerIn(triggers)) continue;
    if (!ev._activationType || ev._activationType === 'none') continue;
    if (this.meetPlayerProximityConditions(ev)) ev.start();
  }
};

Game_Player.prototype.meetPlayerProximityConditions = function(ev) {
  if (ev._activationType === 'radius') {
    var x1 = this.x;
    var y1 = this.y;
    var x2 = ev.x;
    var y2 = ev.y;
    var radius = $gameMap.distance(x1, y1, x2, y2);
    return ev._activationDist >= radius
  } else if (ev._activationType === 'square') {
    return ev._activationDist >= Math.abs(ev.deltaXFrom(this.x)) &&
           ev._activationDist >= Math.abs(ev.deltaYFrom(this.y));
  } else if (ev._activationType === 'row') {
    return ev._activationDist >= Math.abs(ev.deltaYFrom(this.y));
  } else if (ev._activationType === 'column') {
    return ev._activationDist >= Math.abs(ev.deltaXFrom(this.x));
  } else {
    return false;
  }
};

//=============================================================================
// Game_Event
//=============================================================================

Yanfly.EvPrAc.Game_Event_setupPage = Game_Event.prototype.setupPage;
Game_Event.prototype.setupPage = function() {
  this._initialAutoTriggerBypass = true;
  Yanfly.EvPrAc.Game_Event_setupPage.call(this);
  this._initialAutoTriggerBypass = false;
  this.setupEventProximitySettings();
};

Game_Event.prototype.setupEventProximitySettings = function() {
  this.initEventProximitySettings();
  this.setupEventProximityCommentTags();
};

Game_Event.prototype.initEventProximitySettings = function() {
  this._activationDist = 0;
  this._activationType = 'none';
};

Game_Event.prototype.setupEventProximityCommentTags = function() {
  if (!this.page()) return;
  var note1 = /<ACTIVATION SQUARE: (\d+)>/i;
  var note2 = /<ACTIVATION (?:RADIUS|PROXIMITY): (\d+)>/i;
  var note3 = /<ACTIVATION (?:ROW|X|HORIZONTAL): (\d+)>/i;
  var note4 = /<ACTIVATION (?:COLUMN|Y|VERTICAL): (\d+)>/i;
  var list = this.list();
  var length = list.length;
  for (var i = 0; i < length; ++i) {
    var ev = list[i];
    if ([108, 408].contains(ev.code)) {
      if (ev.parameters[0].match(note1)) {
        this._activationDist = parseInt(RegExp.$1);
        this._activationType = 'square';
      } else if (ev.parameters[0].match(note2)) {
        this._activationDist = parseInt(RegExp.$1);
        this._activationType = 'radius';
      } else if (ev.parameters[0].match(note3)) {
        this._activationDist = parseInt(RegExp.$1);
        this._activationType = 'row';
      } else if (ev.parameters[0].match(note4)) {
        this._activationDist = parseInt(RegExp.$1);
        this._activationType = 'column';
      }
    }
  }
};

Game_Event.prototype.eventProximityIncreaseSteps = function() {
  if (!$gameMap.isEventRunning() && !$gameMap.isAnyEventStarting()) {
    $gamePlayer.startProximityEvent([2], this.isNormalPriority());
  }
};

Yanfly.EvPrAc.Game_Event_checkEventTriggerAuto =
  Game_Event.prototype.checkEventTriggerAuto;
Game_Event.prototype.checkEventTriggerAuto = function() {
  if (this._trigger !== 3) return;
  if (this._initialAutoTriggerBypass) return;
  if (!this.meetEventProximityConditions(false)) return;
  Yanfly.EvPrAc.Game_Event_checkEventTriggerAuto.call(this);
};

Yanfly.EvPrAc.Game_Event_updateParallel = Game_Event.prototype.updateParallel;
Game_Event.prototype.updateParallel = function() {
  if (!this._interpreter) return;
  if (!this.meetEventProximityConditions(true)) return;
  Yanfly.EvPrAc.Game_Event_updateParallel.call(this);
};

Game_Event.prototype.meetEventProximityConditions = function(parallel) {
  if (!parallel && $gameMap.isEventRunning()) return false;
  if (!parallel && $gameMap.isAnyEventStarting()) return false;
  if (!this._activationType || this._activationType === 'none') return true;
  return $gamePlayer.meetPlayerProximityConditions(this);
};

//=============================================================================
// End of File
//=============================================================================