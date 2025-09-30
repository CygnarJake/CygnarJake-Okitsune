/*:
 * @plugindesc Based on set outfit variable, will look for alternative images corresponding with set outfits.
 * @author CygnarJake
 *
 * @param OutfitVariableId
 * @text Outfit Variable
 * @type variable
 * @default 0
 * @desc Game variable that stores an array: [langID, ch1ID, ch2ID, …]
 *
 * @param Channels
 * @text Channel List
 * @type struct<Channel>[]
 * @default []
 * @desc Each element = one channel (index ≥ 1). Inside it list outfits.
 *
 * @help
 * Choose a variable to be the outfit variable.
 * It should be set as an array. [4,7,8,1,1] for example.
 *
 * Set channels and outfits within them.
 * The index yo set for a channel will correspond to the 
 * element of the same index in the array outfit variable.
 * The ID of the outfits within the channels is what that element
 * must be equal to in order to be active.
 *
 * Example: [5,6,2,4]
 * The outfit of ID 5 in the channel of index 0 will be active.
 * The outfit of ID 6 in the channel of index 1 will be active.
 * The outfit of ID 2 in the channel of index 2 will be active.
 * The outfit of ID 4 in the channel of index 3 will be active.
 * ===================================
 * PLUGIN COMMAND:
 * ===================================
 *
 * OpenOutfits      Opens the outfit-selection scene.
 *─────────────────────────────────────────────────────────────────
 * 
 */

/*~struct~Channel:
 * @param index
 * @text Channel Index
 * @type number
 * @min 0
 *
 * @param name
 * @text Channel Name
 * @type string
 *
 * @param preview
 * @text Channel Preview (img/pictures)
 * @type file
 * @dir img/pictures
 *
 * @param blurb
 * @text Channel Text
 * @type multiline_string
 *
 * @param outfits
 * @text Outfits
 * @type struct<Outfit>[]
 * @default []
 */

/*~struct~Outfit:
 * @param id
 * @text Outfit ID
 * @type number
 * @min 1
 *
 * @param prefix
 * @text File Prefix
 * @type string
 *
 * @param preview
 * @text Preview Image (img/pictures)
 * @type file
 * @dir img/pictures
 *
 * @param blurb
 * @text Preview Text
 * @type multiline_string
 *
 * @param requirement
 * @text Requirement
 * @type string
 * @default true
 * @desc JS condition that must evaluate to true once in game-play to unlock the outfit
 *
 * @param hint
 * @text Unlock Hint
 * @type multiline_string
 * @default
 */


(() => {
'use strict';
/* ------------------------------------------------------------------ */
/*  1  Parameters + prefix map                                         */
/* ------------------------------------------------------------------ */
const P        = PluginManager.parameters('Okitsune_Outfits');
const VAR_ID   = Number(P.OutfitVariableId || 0);

/* --------------------------------------------------------------- */
/*  read / write the outfit variable                 */
/* --------------------------------------------------------------- */
function currentArray() {
  const v = $gameVariables.value(VAR_ID);
  return Array.isArray(v) ? v.slice() : [0];   // clone or fallback
}
function writeArray(arr) {
  $gameVariables.setValue(VAR_ID, JsonEx.makeDeepCopy(arr));
}

/* channel array (sorted, gaps removed) */
const CHANNELS = JSON.parse(P.Channels || '[]')
  .map(s => JSON.parse(s))
  // keep every entry that has a numeric index (0,1,2,…)
  .filter(c => !isNaN(Number(c.index)))
  .sort((a, b) => a.index - b.index);

const PREFIX_MAP  = {};              // "ch:id" or "id" → prefix
const PREVIEW_MAP = {};              // "ch"   or "ch:id" → preview info
const REQ_MAP  = {};   // "ch:id"  → JS string (condition)
const HINT_MAP = {};   // "ch:id"  → unlock hint text


CHANNELS.forEach(ch => {
  const chIdx = Number(ch.index);
  PREVIEW_MAP[`ch${chIdx}`] = { img: ch.preview || '', blurb: ch.blurb || '' };

  JSON.parse(ch.outfits || '[]')
    .map(s => JSON.parse(s))
    .forEach(o => {
        const id  = Number(o.id || 0);
        const pre = (o.prefix || '').trim();
        const req = (o.requirement || 'true').trim();
        const hint= (o.hint || '').trim();

        if (id && pre) {
            PREFIX_MAP[`${chIdx}:${id}`] = pre;
            if (!PREFIX_MAP[id]) PREFIX_MAP[id] = pre;

            PREVIEW_MAP[`${chIdx}:${id}`] = { img:o.preview||'', blurb:o.blurb||'' };
            REQ_MAP   [`${chIdx}:${id}`]  = req;
            HINT_MAP  [`${chIdx}:${id}`]  = hint;
        }
    });
});

/* ---------- global unlock store -------------------------------- */
ConfigManager.outfitsUnlocked = ConfigManager.outfitsUnlocked || [];

(function(){
  const _make = ConfigManager.makeData;
  ConfigManager.makeData = function(){
      const data = _make.call(this);
      data.outfitsUnlocked = this.outfitsUnlocked.slice();
      return data;
  };

  const _apply = ConfigManager.applyData;
  ConfigManager.applyData = function(data){
      _apply.call(this,data);
      this.outfitsUnlocked = data.outfitsUnlocked || [];
  };
})();

function rememberUnlock(key){
  if (!ConfigManager.outfitsUnlocked.includes(key)){
      ConfigManager.outfitsUnlocked.push(key);
      ConfigManager.save();               // write to config.rpgsave now
  }
}

function isUnlocked(ch,id){
  const key = `${ch}:${id}`;
  if (ConfigManager.outfitsUnlocked.includes(key)) return true;

  const cond = REQ_MAP[key] || 'true';
  let ok = false;
  try   { ok = !!eval(cond); }    // run user condition once
  catch(e){ console.error(e); }

  if (ok) rememberUnlock(key);
  return ok;
}

function channelHasUnlocked(chIdx){
  return CHANNELS.some(c=>{
      if (Number(c.index)!==chIdx) return false;
      return JSON.parse(c.outfits||'[]').some(o=>{
          const id = Number(JSON.parse(o).id||0);
          return id && isUnlocked(chIdx,id);
      });
  });
}

/* ------------------------------------------------------------------ */
/*  2  Runtime: build active prefix list                               */
/* ------------------------------------------------------------------ */
Game_System.prototype.refreshOutfitPrefixes = function(){
  this._outfitPrefixes=[];
  const arr=$gameVariables.value(VAR_ID);
  if(!Array.isArray(arr)) return;
  for(let i=arr.length-1;i>=0;i--){
    const id = Number(arr[i]||0);
    if(!id) continue;
    const pre = PREFIX_MAP[`${i}:${id}`]||PREFIX_MAP[id];
    if(pre) this._outfitPrefixes.push(pre+'_');
  }
};
Game_System.prototype.outfitPrefixes=function(){
  if(!this._outfitPrefixes) this.refreshOutfitPrefixes();
  return this._outfitPrefixes;
};
/* auto-refresh when the variable changes */
const _setVal=Game_Variables.prototype.setValue;
Game_Variables.prototype.setValue=function(i,v){
  _setVal.call(this,i,v);
  if(i===VAR_ID&&$gameSystem) $gameSystem.refreshOutfitPrefixes();
};

/* ------------------------------------------------------------------ */
/*  3  ImageManager override (unchanged from v1.1 except helper name)  */
/* ------------------------------------------------------------------ */
const fs = window.require?window.require('fs'):null;
const path = window.require?window.require('path'):null;
const _loadBmp = ImageManager.loadBitmap;
ImageManager.loadBitmap=function(folder,filename,hue,smooth){
  if(!filename) return _loadBmp.call(this,folder,filename,hue,smooth);
  const prefixes=$gameSystem?$gameSystem.outfitPrefixes():[];
  const build=(pre,f)=>{const m=/^([!$]{1,2})(.*)$/.exec(f);return m?m[1]+pre+m[2]:pre+f;};
  for(const p of prefixes){
    const cand=build(p,filename);
    if(this._okFileExists(folder,cand))
      return _loadBmp.call(this,folder,cand,hue,smooth);
  }
  return _loadBmp.call(this,folder,filename,hue,smooth);
};
ImageManager._okFileExists=function(folder,name){
  if(!fs||!path) return false;
  const root=path.dirname(process.mainModule.filename);
  return fs.existsSync(path.join(root,folder,name+'.png'));
};

/* ------------------------------------------------------------------ */
/*  4  Plugin command                                                 */
/* ------------------------------------------------------------------ */
const _cmd = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(c, a) {
  _cmd.call(this, c, a);
  if (c === 'OpenOutfits') {
    SceneManager.push(Scene_OutfitChannels);
  }
  else if (c === 'WipeOutfits') {
    ConfigManager.outfitsUnlocked = [];
    ConfigManager.save();

    // Clear all channels except index 0 (language)
    let arr = currentArray();
    for (let i = 1; i < arr.length; i++) arr[i] = 0;
    writeArray(arr);
  }
};

/* ╭──────────────────────────────────────────────────────────────╮
 * │  two-stage selector – channels  →  outfits                   │
 * ╰──────────────────────────────────────────────────────────────╯ */

const PREVIEW_SIDE = () => Graphics.boxHeight - Window_Base.prototype.fittingHeight(3);
const darkSprite = () => { const s=new Sprite(new Bitmap(PREVIEW_SIDE(),PREVIEW_SIDE()));
                           s.bitmap.fillAll('#000'); s.opacity=160; return s; };
function scaleInsideSquare(sp){const b=sp.bitmap;const s=Math.min(PREVIEW_SIDE()/b.width,PREVIEW_SIDE()/b.height,1);sp.scale.set(s,s);}

// === WORD-WRAP + <br> SUPPORT FOR OUTFIT BLURBS ===
Window_Base.prototype.drawTextExWrapped = function(text, x, y, maxWidth) {
    if (!text) return 0;
    // Accept <br>, <line break>, or real \n as line breaks
    text = text.replace(/<br\s*\/?>|<line break>/gi, '\n');
    let lines = text.split('\n');
    let totalHeight = 0;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        // Use YEP_MessageCore word wrap if available
        if (Imported.YEP_MessageCore && Window_Base.prototype.processWordWrap) {
            let y0 = y + totalHeight;
            let max = maxWidth || this.contentsWidth();
            totalHeight += this.processWordWrap(line, x, y0, max);
        } else {
            this.drawTextEx(line, x, y + totalHeight);
            totalHeight += this.lineHeight();
        }
    }
    return totalHeight;
};

/* ---------- Scene_OutfitChannels ---------------------------------- */
function Scene_OutfitChannels(){this.initialize(...arguments);}
Scene_OutfitChannels.prototype = Object.create(Scene_MenuBase.prototype);
Scene_OutfitChannels.prototype.constructor = Scene_OutfitChannels;
Scene_OutfitChannels.prototype.create = function(){
  Scene_MenuBase.prototype.create.call(this);

  /* grid */
  const gH = Window_Base.prototype.fittingHeight(3);
  this._grid = new Window_ChannelGrid(0,Graphics.boxHeight-gH,Graphics.boxWidth,gH);
  this._grid.setHandler('ok',    this.onOk.bind(this));
  this._grid.setHandler('cancel',this.popScene.bind(this));
  this._grid.setHandler('move',  this.refreshPreview.bind(this));
  this.addWindow(this._grid); this._grid.activate();
  
  /* put the cursor on the first cell before we activate it */
  this._grid.select(0);
  this._grid.activate();

  /* preview + blurb */
  this._prevBack  = darkSprite(); this.addChild(this._prevBack);
  this._prevImage = new Sprite(); this._prevImage.anchor.set(.5,.5);
  this._prevImage.x = this._prevImage.y = PREVIEW_SIDE()/2; this.addChild(this._prevImage);
  this._blurb     = new Window_Base(PREVIEW_SIDE(),0,Graphics.boxWidth-PREVIEW_SIDE(),PREVIEW_SIDE());
  this.addWindow(this._blurb);

  this.refreshPreview();
};
Scene_OutfitChannels.prototype.onOk = function () {
  const d = this._grid.currentData();        // ← declare FIRST
  if (!d) return;                            // safety

  /* 1) Global “No Outfit” row  ---------------------------------- */
  if (d.id === -1) {                         // select the special row
    const a = currentArray();
    for (let i = 1; i < a.length; i++) a[i] = 0;   // clear every channel
    writeArray(a);

    this._grid.refresh();
    this._grid.select(0);
    this._grid.activate();
    this.refreshPreview();
    return;
  }

  /* 2) Normal channel rows  ------------------------------------- */
  // We ALWAYS allow the player to enter the channel, even if
  // nothing is unlocked yet – they’ll see the “???” outfits there.
  SceneManager.push(Scene_ChannelOutfits);
  SceneManager.prepareNextScene(d.channel);
};
Scene_OutfitChannels.prototype.refreshPreview = function(){
  const d=this._grid.currentData();
  this._prevImage.bitmap=null;
  this._blurb.contents.clear();
  if (!d || d.id === -1) return;                    // nothing to preview

  const key       = `ch${d.channel}`;               // channel-wide preview entry
  const pv        = PREVIEW_MAP[key] || {};         // { img , blurb }
  const unlocked  = channelHasUnlocked(d.channel);  // at least one outfit met

  /* -----  image  --------------------------------*/
  if (pv.img) {
    const bmp = ImageManager.loadPicture(pv.img);
    this._prevImage.bitmap = bmp;
    bmp.addLoadListener(() => scaleInsideSquare(this._prevImage));

    /* grey-out if the whole channel is still locked */
    if (!unlocked) {
      this._prevImage.setColorTone([-255, -255, -255, 0]);   // desaturate
      this._prevImage.opacity = 80;                          // fade
    } else {
      this._prevImage.setColorTone([0, 0, 0, 0]);
      this._prevImage.opacity = 255;
    }
  }

  /* -----  text  ---------------------------------*/
  if (unlocked && pv.blurb) {
    this._blurb.contents.clear();
	this._blurb.drawTextExWrapped(pv.blurb, 0, 0, this._blurb.contentsWidth());
  } else if (!unlocked) {
    // Simple default hint; feel free to change or localise
    this._blurb.drawTextExWrapped('??', 0, 0, this._blurb.contentsWidth());
  }
};

/* ---------- Window_ChannelGrid ------------------------------------ */
function Window_ChannelGrid(){this.initialize(...arguments);}
Window_ChannelGrid.prototype = Object.create(Window_Selectable.prototype);
Window_ChannelGrid.prototype.constructor = Window_ChannelGrid;
Window_ChannelGrid.prototype.initialize=function(x,y,w,h){
  this._data = [];
  Window_Selectable.prototype.initialize.call(this,x,y,w,h);
  this.refresh();
};

/* correct paging for the channel list --------------------------------- */
Window_ChannelGrid.prototype.maxPageRows   = function () {
  return this.numVisibleRows();          // exactly 3, never 4
};
Window_ChannelGrid.prototype.maxPageItems = function () {
  return this.maxPageRows() * this.maxCols();  // 3 × 4 = 12
};

Window_ChannelGrid.prototype.maxCols = ()=>4;
Window_ChannelGrid.prototype.numVisibleRows = ()=>3;
Window_ChannelGrid.prototype.spacing = ()=>4;
Window_ChannelGrid.prototype.makeItemList=function(){
  this._data = [{ id:-1, label:'No Outfit', channel:-1 }];
  CHANNELS.forEach(c => {
    if (Number(c.index) === 0) return;          // skip language channel in UI
    this._data.push({
      id:0,
      label:c.name || `Ch ${c.index}`,
      channel:Number(c.index)
    });
  });
};
Window_ChannelGrid.prototype.maxItems=function(){return this._data.length;};

Window_ChannelGrid.prototype.itemRect = function(index) {
  const topIndex = this.topIndex();
  const visibleIndex = index - topIndex;

  const cols = this.maxCols();
  const col = visibleIndex % cols;
  const row = Math.floor(visibleIndex / cols);

  const innerW = this.contentsWidth();
  const w = Math.floor((innerW - (cols - 1) * this.spacing()) / cols);
  const h = this.itemHeight();
  const x = col * (w + this.spacing());
  const y = row * this.rowHeight();
  return new Rectangle(x, y, w, h);
};
Window_OutfitGrid.prototype.itemRect = Window_ChannelGrid.prototype.itemRect;
Window_ChannelGrid.prototype.drawItem = function (i) {
  const d = this._data[i];
  if (!d) return;                     // safety

  /* -------- unlocked? -------------------------------------- */
  //  – “No Outfit” row is always available
  //  – every other row depends on channelHasUnlocked()
  const unlocked = (d.id === -1) ? true : channelHasUnlocked(d.channel);

  /* -------- label text ------------------------------------- */
  //  show real name when unlocked, otherwise "???"
  const label = unlocked ? d.label : '???';

  /* -------- colour (white / grey) -------------------------- */
  //  If it’s locked → always grey.
  //  If it’s unlocked → use the old “active” highlight logic.
  if (!unlocked) {
    this.changeTextColor(this.textColor(8));      // dark-grey for locked
  } else {
    const arr = currentArray();
    const active = (d.id === -1)
      ? arr.slice(1).every(v => !v)               // “No Outfit” = white only when
      : !!(arr[d.channel] || 0);                  //  the channel has something set
    this.changeTextColor(active ? this.normalColor()
                                : this.textColor(8));
  }

  /* -------- draw ------------------------------------------- */
  const r = this.itemRect(i);
  this.drawText(label, r.x, r.y, r.width, 'center');
};
Window_ChannelGrid.prototype.refresh=function(){this.makeItemList(); Window_Selectable.prototype.refresh.call(this);};
Window_ChannelGrid.prototype.currentData=function(){return this._data[this.index()];};
['cursorDown','cursorUp','cursorLeft','cursorRight'].forEach(fn=>{
  const base=Window_ChannelGrid.prototype[fn];
  Window_ChannelGrid.prototype[fn]=function(w){base.call(this,w);this.callHandler('move');};
});

/* ---------- Scene_ChannelOutfits ---------------------------------- */
function Scene_ChannelOutfits(){this.initialize(...arguments);}
Scene_ChannelOutfits.prototype = Object.create(Scene_MenuBase.prototype);
Scene_ChannelOutfits.prototype.constructor = Scene_ChannelOutfits;
Scene_ChannelOutfits.prototype.prepare=function(ch){this._ch=ch;};
Scene_ChannelOutfits.prototype.create=function(){
  Scene_MenuBase.prototype.create.call(this);
  const gH=Window_Base.prototype.fittingHeight(3);
  this._grid=new Window_OutfitGrid(0,Graphics.boxHeight-gH,Graphics.boxWidth,gH,this._ch);
  this._grid.setHandler('ok',this.onOk.bind(this));
  this._grid.setHandler('cancel',this.popScene.bind(this));
  this._grid.setHandler('move',this.refreshPreview.bind(this));
  this.addWindow(this._grid);
  this._grid.select(0); 
  this._grid.activate();

  this._prevBack=darkSprite(); this.addChild(this._prevBack);
  this._prevImage=new Sprite(); this._prevImage.anchor.set(.5,.5);
  this._prevImage.x=this._prevImage.y=PREVIEW_SIDE()/2; this.addChild(this._prevImage);
  this._blurb=new Window_Base(PREVIEW_SIDE(),0,Graphics.boxWidth-PREVIEW_SIDE(),PREVIEW_SIDE());
  this.addWindow(this._blurb); this.refreshPreview();
};
Scene_ChannelOutfits.prototype.onOk=function(){
  const d=this._grid.currentData(); if(!d) return;
  const arr=currentArray(); while(arr.length<=this._ch) arr.push(0);
  if(d.id===-1) arr[this._ch]=0; else arr[this._ch]=(arr[this._ch]===d.id)?0:d.id;
  writeArray(arr); this._grid.refresh(); this.refreshPreview(); this._grid.reselect(); this._grid.activate();
};
Scene_ChannelOutfits.prototype.refreshPreview = function(){
  const d = this._grid.currentData();
  this._prevImage.bitmap = null;
  this._blurb.contents.clear();
  // If nothing or global "No Outfit", clear everything and return
  if (!d) return;
  
  // --- "No Outfit" for this channel ---
  if (d.id === -1) {
    // Show the channel preview image (if it exists)
    const key = `ch${this._ch}`;
    const pv = PREVIEW_MAP[key] || {};
    const unlocked = channelHasUnlocked(this._ch);
    if (pv.img) {
      const bmp = ImageManager.loadPicture(pv.img);
      this._prevImage.bitmap = bmp;
      bmp.addLoadListener(() => scaleInsideSquare(this._prevImage));
      if (!unlocked) {
        this._prevImage.setColorTone([-255, -255, -255, 0]);
        this._prevImage.opacity = 80;
      } else {
        this._prevImage.setColorTone([0, 0, 0, 0]);
        this._prevImage.opacity = 255;
      }
    }
    // No text at all for "No Outfit" in this context
    return;
  }

  // --- Normal Outfit ---
  const key = `${this._ch}:${d.id}`;
  const pv = PREVIEW_MAP[key] || {};
  const unlocked = isUnlocked(this._ch, d.id);
  if (pv.img) {
    const bmp = ImageManager.loadPicture(pv.img);
    this._prevImage.bitmap = bmp;
    bmp.addLoadListener(() => scaleInsideSquare(this._prevImage));
    if (!unlocked) {
      this._prevImage.setColorTone([-255, -255, -255, 0]);
      this._prevImage.opacity = 80;
    } else {
      this._prevImage.setColorTone([0, 0, 0, 0]);
      this._prevImage.opacity = 255;
    }
  }
  if (unlocked && pv.blurb) {
    this._blurb.contents.clear();
    this._blurb.drawTextExWrapped(pv.blurb, 0, 0, this._blurb.contentsWidth());
  } else if (!unlocked) {
    const hint = HINT_MAP[key] || '??';
    this._blurb.contents.clear();
    this._blurb.drawTextExWrapped(hint, 0, 0, this._blurb.contentsWidth());
  }
};

/*─────────────────────────────────────────────────────────────
 *  Proper scrolling for the CHANNEL selector
 *     – keeps the cursor where it is
 *     – always shows three visible rows (3 × 4 = 12 cells)
 *     – never draws blank rows when you reach the end
 *────────────────────────────────────────────────────────────*/

/* how many rows and items are on one “page” (i.e. in view) */
Window_ChannelGrid.prototype.maxPageRows  = function () {
  return this.numVisibleRows();            // → 3
};
Window_ChannelGrid.prototype.maxPageItems = function () {
  return this.maxPageRows() * this.maxCols();   // 3 × 4 = 12
};

/* let the stock helpers do the scrolling -------------------------------- */

/* keep the cursor in view whenever it moves */
Window_ChannelGrid.prototype.ensureCursorVisible = function () {
  const row = Math.floor(this.index() / this.maxCols());
  // scroll up
  if (row < this.topRow())             { this.setTopRow(row); }
  // scroll down
  if (row > this.topRow() + this.numVisibleRows() - 1) {
    this.setTopRow(row - (this.numVisibleRows() - 1));
  }
};

/* hook the four cursor-movement keys so the helper above is called */
['cursorDown','cursorUp','cursorRight','cursorLeft'].forEach(fn=>{
  const _base = Window_ChannelGrid.prototype[fn];
  Window_ChannelGrid.prototype[fn] = function (wrap) {
    _base.call(this, wrap);
    this.ensureCursorVisible();
  };
});

/* ---------- Window_OutfitGrid ------------------------------------ */
function Window_OutfitGrid(){this.initialize(...arguments);}
Window_OutfitGrid.prototype = Object.create(Window_Selectable.prototype);
Window_OutfitGrid.prototype.constructor = Window_OutfitGrid;
Window_OutfitGrid.prototype.initialize=function(x,y,w,h,ch){
  this._ch = ch;
  this._data = [];
  Window_Selectable.prototype.initialize.call(this,x,y,w,h);
  this.refresh();
};
Window_OutfitGrid.prototype.maxCols=Window_ChannelGrid.prototype.maxCols;
Window_OutfitGrid.prototype.numVisibleRows  = ()=>2;
Window_OutfitGrid.prototype.spacing=Window_ChannelGrid.prototype.spacing;

/* ──────────────────────────────
 * one grid-cell = 1 text line
 * ──────────────────────────── */
Window_ChannelGrid.prototype.itemHeight = function () {
  return this.lineHeight();          // 36 px (default)
};
/* Channel table: each row is exactly one text line – no extra gap */
Window_ChannelGrid.prototype.rowHeight = function () {
  return this.itemHeight();    // 36 px (fits 3 rows in 108 px)
};

/* copy the same geometry over to the outfit grid */
Window_OutfitGrid.prototype.itemHeight = Window_ChannelGrid.prototype.itemHeight;
Window_OutfitGrid.prototype.rowHeight  = Window_ChannelGrid.prototype.rowHeight;

Window_OutfitGrid.prototype.makeItemList=function(){
  this._data=[{id:-1,label:'No Outfit',channel:this._ch}];
  const row=CHANNELS.find(r=>Number(r.index)===this._ch);
  if(row){
    JSON.parse(row.outfits||'[]').map(s=>JSON.parse(s)).forEach(o=>{
      this._data.push({id:Number(o.id),label:o.prefix||`ID ${o.id}`,channel:this._ch});
    });
  }
};
Window_OutfitGrid.prototype.maxItems=function(){return this._data.length;};
Window_OutfitGrid.prototype.drawItem = function (i) {
  const d = this._data[i];
  if (!d) return;                                       // safety

  const r = this.itemRect(i);

  /* -------- unlocked? ------------------------------------------ */
  //  – “No Outfit” row (id -1) is always available
  //  – every other row depends on isUnlocked(channel , outfitId)
  const unlocked = (d.id === -1) ? true
                                 : isUnlocked(this._ch, d.id);

  /* -------- label text ----------------------------------------- */
  //  show real name when unlocked, otherwise "???"
  const label = unlocked ? d.label : '???';

  /* -------- colour (white / grey) ------------------------------ */
  if (!unlocked) {
    // locked → always grey
    this.changeTextColor(this.textColor(8));
  } else {
    // unlocked → keep the old “active” highlight logic
    const a = currentArray();
    const active = (d.id === -1)
      ? !(a[this._ch] || 0)                      // “No Outfit” is white only when
      : (a[this._ch] === d.id);                 //  nothing (or this one) is equipped
    this.changeTextColor(active ? this.normalColor()
                                : this.textColor(8));
  }

  /* -------- draw ----------------------------------------------- */
  this.drawText(label, r.x, r.y, r.width, 'center');
};
Window_OutfitGrid.prototype.refresh=function(){this.makeItemList(); Window_Selectable.prototype.refresh.call(this);};
Window_OutfitGrid.prototype.currentData=function(){return this._data[this.index()];};
['cursorDown','cursorUp','cursorLeft','cursorRight'].forEach(fn=>{
  const base=Window_OutfitGrid.prototype[fn];
  Window_OutfitGrid.prototype[fn]=function(w){base.call(this,w);this.callHandler('move');};
});

Window_OutfitGrid.prototype.processOk = function() {
    const d = this.currentData();
    if (d.id !== -1 && !isUnlocked(this._ch, d.id)) {
        SoundManager.playBuzzer();
        this.activate();
        return;
    }
    Window_Selectable.prototype.processOk.call(this);
};

/* prepare helper */
SceneManager.prepareNextScene = function(ch){this._nextScene._prepared=true;this._nextScene.prepare(ch);};

})();   /* EOF */
