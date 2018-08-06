//////////////////////////////////////////////////////////////////////
 // *
 // *	canvas.js
 // *
 // *	this module is map canvas related.
 // *
//////////////////////////////////////////////////////////////////////

(function() {
	
var Canvas = TMap.Canvas = {};
const tkTileSizeBit = 8, tkTileSize = 1<<tkTileSizeBit;
//////////////////////////////////
  // *	class tkMapCanvas			
//////////////////////////////////
/**
 * 地图画布，不要直接调用进行实例化
 * @class MapCanvas
 * @constructor
 * @param  {MapKernel}    owner 地图
 * @namespace TMap.Canvas
 */
function tkMapCanvas(owner) {
	this._owner = owner;
	this._visible = true;

	var sv = $("<canvas>").addClass("tkm-map-canvas").css({"z-index":owner.canvases.length});
	var canvas = sv[0];
	this._zMarker = $("<div>");
	owner.mapsv.append(canvas, this._zMarker);

	this._zMarker =this._zMarker[0];
	this.canvas = canvas;
	// this.originImage = {};
}
tkMapCanvas.prototype = {
	_drawNew: function() {
		// var owner = this._owner, mm = owner.mapMode, xyR = 1<<23-mm.z;
		delete this.oldCanvas;
	},
	_snapView: function() { 
		// var owner = this._owner, mm = owner.mapMode, xyR = 1<<23-mm.z;
		// // this.originImage = c.getImageData(0, 0, mm.width, mm.height);
		// var n = this.canvas;
		// n && (n.parentNode && n.parentNode.removeChild(n), this._preAnimationDiv = null),
		// this._preAnimationDiv = this._animationDiv = n.cloneNode(!0),
		// t.platform.insertBefore(this._animationDiv, t.platform.firstChild)

		// this.originState = {
		// 	x: mm.mctX*xyR, 
		// 	y: mm.mctY*xyR, 
		// 	z: mm.z, 
		// 	s: (1<<mm.z)*mm.scale/mm.ratio, 
		// 	scale: mm.scale, 
		// 	rotate: mm.rotate
		// };
	},
	_drawSnap: function() {
		var owner = this._owner, mm = owner.mapMode, zoff = 23-mm.z, xyR = 1<<zoff;

		if (this.oldCanvas == null) {
			var n = this.canvas;
			n && (n.parentNode && n.parentNode.removeChild(n), this.canvas = null),
			this.canvas = n.cloneNode(!0),
			owner.mapsv[0].insertBefore(this.canvas, this._zMarker);

			this.context = this.canvas.getContext('2d');
			this.oldCanvas = n;
		}

		var tos = {
			x: mm.mctX*xyR, 
			y: mm.mctY*xyR, 
			z: mm.z, 
			s: (1<<mm.z)*mm.scale/mm.ratio, 
			scale: mm.scale, 
			rotate: mm.rotate
		};
		
		var oos = owner.originState, dx = oos.x - tos.x, dy = oos.y - tos.y;	
		this.context.clearRect(0, 0, mm.width, mm.height);
		if (oos.z === tos.z && tos.s == oos.s) {
			this.context.drawImage(this.oldCanvas, dx>>zoff, dy>>zoff);	
		} else {
			var sdif = tos.s/oos.s
			var x = (oos.x - oos.w/2 / oos.scale * mm.ratio * (1 << 23-oos.z) - (tos.x-mm.width/2 / tos.scale * mm.ratio *(1<<23-mm.z)))/ (1<<23-mm.z);
			var y = (oos.y - oos.h/2 / oos.scale * mm.ratio * (1 << 23-oos.z) - (tos.y-mm.height/2 / tos.scale * mm.ratio *(1<<23-mm.z)))/ (1<<23-mm.z);
			this.context.drawImage(this.oldCanvas, x, y, mm.width * sdif, mm.height*sdif);
		}
		
		

		// this.originState = {
		// 	x: mm.mctX*xyR, 
		// 	y: mm.mctY*xyR, 
		// 	z: mm.z, 
		// 	s: (1<<mm.z)*mm.scale/mm.ratio, 
		// 	scale: mm.scale, 
		// 	rotate: mm.rotate
		// };
	},

	___snapView: function() {
		var c = this.context, owner = this._owner, mm = owner.mapMode, xyR = 1<<23-mm.z;
		this.originImage = c.getImageData(0, 0, mm.width, mm.height);

		this.originState = {
			x: mm.mctX*xyR, 
			y: mm.mctY*xyR, 
			z: mm.z, 
			s: (1<<mm.z)*mm.scale/mm.ratio, 
			scale: mm.scale, 
			rotate: mm.rotate
		};
	},
	___drawSnap: function() {
		// if (this.originState == null)
		 return;
		var c = this.context, owner = this._owner, mm = owner.mapMode, o = this.originState;
		// c.setTransform(mm.ratio,0,0,mm.ratio,0,0);
		c.clearRect(0, 0, mm.width, mm.height);

		var xyR = 1 << 23 - mm.z, x = mm.mctX * xyR, y= mm.mctY * xyR;
		var s = (1 << mm.z) * mm.scale / mm.ratio;
		var ds = o.s - s, dx = o.x - x, dy = o.y - y;
		var dz = o.z - mm.z, dr = o.rotate-mm.rotate;

		if (ds == 0 && dr == 0) {
			dx = (dx>>23-o.z)*o.scale;
			dy = (dy>>23-o.z)*o.scale;
			if (mm.rotate) {
				var DX = mm.cos0*dx -mm.sin0*dy, DY = mm.sin0*dx +mm.cos0*dy;
				c.putImageData(this.originImage, DX, DY);
			} else {
				c.putImageData(this.originImage, dx, dy);
			}
		} else if (ds && dr == 0) {
			var ss = s/ o.s;
			dx = (dx/(1<<23-mm.z))*mm.scale;
			dy = (dy/(1<<23-mm.z))*mm.scale;
			dx += mm.halfWidth*(1-ss), dy += mm.halfHeight*(1-ss);
			if (mm.rotate) {
				var x = mm.cos0*dx -mm.sin0*dy;
				var y = mm.sin0*dx +mm.cos0*dy;
				var image = this.stretch(ss);
				c.putImageData(image, x, y);
			} else {
				if (ss < 1) 
					c.putImageData(this._stretch(ss), dx, dy);
				else 
					// c.putImageData(this.stretch(1/ss), dx, dy);
					c.putImageData(this._stretchEx(ss, dx, dy), 0, 0);
			}
		}
	},

	_stretch: function (rate) {
		var mm = this._owner.mapMode, W = mm.width, H = mm.height;
		var w = Math.ceil(rate*W), h = Math.ceil(rate*H);
		var data = this.originImage.data;
		var imgdat = this.context.createImageData(w, h);
		var strip = W*4, dtrip = w * 4, urate = 1/rate;
		for (var i = 0, on = 0, y, dy = 0; i < h && (y = dy | 0) < H; ++i, on += dtrip, dy += urate) {
			var om = strip * y;
			for (var j = 0, x, dx = 0; j < w && (x = dx | 0) < W; ++j, dx += urate) {
				var n = on+(j<<2), m = om+(x<<2);
				imgdat.data[n] = data[m];
				imgdat.data[n+1] = data[m+1];
				imgdat.data[n+2] = data[m+2];
				imgdat.data[n+3] = data[m+3];
			}
		}
		return imgdat;
	},

	_stretchEx: function (rate, ofx, ofy) {
		var mm = this._owner.mapMode, W = mm.width, H = mm.height;
		var w = Math.ceil(rate*W), h = Math.ceil(rate*H);
		var data = this.originImage.data;
		
		var imgdat = this.context.createImageData(W, H);
		var strip = W*4, dtrip = strip, urate = 1/rate;
		ofx *= -urate; ofy *= -urate;
	
		for (var i = 0, on = 0, y, dy = ofy; i < H && (y = dy | 0) < H; ++i, on += dtrip, dy += urate) {
			if (y < 0) continue;
			var om = strip * y;
			for (var j = 0, x, dx = ofx; j < W && (x = dx | 0) < W; ++j, dx += urate) {
				if (x < 0) continue;
				var n = on+(j<<2), m = om+(x<<2);
				imgdat.data[n] = data[m];
				imgdat.data[n+1] = data[m+1];
				imgdat.data[n+2] = data[m+2];
				imgdat.data[n+3] = data[m+3];
			}
		}
		return imgdat;
	},

	/**
	 * 清空画布
	 * @method clear
	 */
	clear: function() {
		var ctx = this.context, can = this.canvas;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, can.width, can.height);
	},
	/**
	 * 返回MapKernel对象
	 * @method owner
	 * @return {MapKernel} [description]
	 */
	owner: function(){
		return this._owner;
	},
	/**
	 * 获取画布是否可见
	 * @method visible
	 * @return {boolean} 是否可见
	 */
	visible: function(){
		return this._visible;
	},
	/**
	 * 设置画布可见性
	 * @method setVisible
	 * @param  {boolean}   visible 是否可见
	 */
	setVisible: function(v) {
		v = !!v;
		if (this._visible != v) {
			this._visible = v;
			this.canvas.style.display = this._visible? "block": "none";
		}
	},
	/**
	 * 隐藏画布
	 * @method hide
	 */
	hide: function() {
		this.canvas.style.display = "none";
		this._visible = false;
	},
	/**
	 * 显示画布
	 * @method show
	 */
	show: function() {
		this.canvas.style.display = "block";
		this._visible = true;
	},
	/**
	 * 切换可见度
	 * @method toggle
	 */
	toggle: function() {
		this._visible = !this._visible;
		this.canvas.style.display = this._visible? "block": "none";
	},
};


// 	class tkMapCanvasBasic
/**
 * 用于绘制底图的基础画布
 * @class MapCanvasBasic
 * @extends TMap.Canvas.MapCanvas
 */
function tkMapCanvasBasic() {
	Extends(this, tkMapCanvas, arguments);
	this.context = this.canvas.getContext('2d');
}
inherit(tkMapCanvasBasic, tkMapCanvas, {
	_drawNew: function() {
		tkMapCanvas.prototype._drawNew.apply(this);
		this.drawLayers();
	},
	drawLayers: function() {
		var owner = this._owner, c = this.context, mm = owner.mapMode;
		c.clearRect(0, 0, mm.width, mm.height);
		c.save();
		for (var i = 0, len = owner.layers.length, lyr; i < len; ++i) {
			lyr = owner.layers[i];
			if (lyr.visible) lyr._draw(mm, c);
		}
		c.restore();
	},
});
Canvas.MapCanvasBasic = tkMapCanvasBasic;


/**
 * 用于绘制底图的基础画布
 * @class MapCanvasGL
 * @extends TMap.Canvas.MapCanvas
 */
function tkMapCanvasGL() {
	Extends(this, tkMapCanvas, arguments);
	var gl = this.canvas.getContext('webgl');
	
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}
	this.gl = this.context = gl;

	$(this.canvas).addClass("test-GL");
	this.glInit();
}
inherit(tkMapCanvasGL, tkMapCanvas, {
	startDraw: function(){
		if (this.started)
			return;
		var me = this;

		me.started = true;
		function frame(){
			var mm = me._owner.mapMode;

			me.glClear(mm);
			for (var layers = me._owner.layers, i = 0, l = layers.length; i < l; ++i) {
				if (layers[i].visible && layers[i].drawTiles) {
					me.glDraw(layers[i].drawTiles, mm);	
				}				
			}
			

			for (var layers = me._owner.layers, i = 0, l = layers.length; i < l; ++i) {
				if (layers[i].visible && layers[i].drawTiles) {
					me.glDrawLabel(layers[i].drawTiles, mm);	
				}				
			}
			

			if (me._owner.animation) {
				me.renderTimer = requestAnimationFrame(frame);
			} else {
				me.started = false;
				// if (me.renderTimer) 
					cancelAnimationFrame(me.renderTimer);
			}
		}
		// requestAnimationFrame(frame);
		frame();
	},
	_drawNew: function() {
		this.startDraw();
	},
	_drawSnap: function(){
		this.startDraw();
	},
	_snapView: function(){},

	// drawLayers: function() {
	// 	var owner = this._owner, c = this.context, mm = owner.mapMode;
	// 	c.clearRect(0, 0, mm.width, mm.height);
	// 	c.save();
	// 	for (var i = 0, len = owner.layers.length, lyr; i < len; ++i) {
	// 		lyr = owner.layers[i];
	// 		if (lyr.visible) lyr.draw(mm, c);
	// 	}
	// 	c.restore();
	// },
});
Canvas.MapCanvasGL = tkMapCanvasGL;



// 	class tkMapCanvasOverlay
/**
 * 用于绘制覆盖物的画布
 * @class MapCanvasOverlay
 * @extends TMap.Canvas.MapCanvas
 */
function tkMapCanvasOverlay(){
	Extends(this, tkMapCanvas, arguments);
	this.context = this.canvas.getContext('2d');
}
inherit(tkMapCanvasOverlay, tkMapCanvas, {
	_drawNew: function() {
		tkMapCanvas.prototype._drawNew.apply(this);
		var owner = this._owner;
		if (owner.overlays && owner.overlays.length)
			this.drawOverlay();
		else if (this.needClear) {
			this.needClear = false;
			this.clearOverlay();
		}
	},
	drawOverlay: function() {
		var owner = this._owner, c = this.context, m = owner.mapMode;
		c.clearRect(0, 0, m.width, m.height);
		c.save();
		m.initTransform(c, {z:m.z, tx:0, ty:0});
		for (var i = 0, ol, l = owner.overlays.length; i < l; ++i) {
			ol = owner.overlays[i];
			if (ol.draw != null) {				
				c.save();
				ol.draw(c, m.z);
				c.restore();
			}
			this.needClear = true;
		}
		c.restore();
	},
	/**
	 * 清除覆盖物
	 * @method clearOverlay
	 */
	clearOverlay: function() {
		var c = this.context, m = this._owner.mapMode;
		c.clearRect(0, 0, m.width, m.height);
	},
});
Canvas.MapCanvasOverlay = tkMapCanvasOverlay;



// 	class tkMapCanvasLabel
/**
 * 用于绘制底图的基础画布
 * @class MapCanvasLabel
 * @extends TMap.Canvas.MapCanvas
 * @return {[type]}         [description]
 */
function tkMapCanvasLabel() {
	Extends(this, tkMapCanvas, arguments);
	this.context = this.canvas.getContext('2d');
	// TMapEngine.private.
	tkShiori(this, this._owner.mapMode, tkTileSizeBit);

	// this._visible = false;
}
inherit(tkMapCanvasLabel, tkMapCanvas, {
	_drawNew: function() {
		tkMapCanvas.prototype._drawNew.apply(this);
		this.labels = this.shiori(this.context);
	},
	// _snapView:function(){
	// 	tkMapCanvas.prototype._snapView.apply(this);
	// 	this.labels.snapLabels(this.context);
	// 	// _drawSnap
	// },
	// _drawSnap:function(){
	// 	var owner = this._owner;
	// 	if (this.originState.z == owner.mapMode.z && this.originState.scale == owner.mapMode.scale) {
	// 		tkMapCanvas.prototype._drawSnap.apply(this);
	// 		console.log("dfsdf");
	// 	} else {
	// 		this.context.clearRect(0,0, this._owner.mapMode.width, this._owner.mapMode.height);
	// 		this.labels.putSnap(this.context, this._owner.mapMode);	
	// 	}
	// },
	highlightPOILabel: function(pt) {
		if (this.labels) {
			var mm = this._owner.mapMode;
			var pr = this.labels.grid.pointed(pt);
			var pl = this.poiLabel;
			var ctx = this.context;

			ctx.save();
			ctx.lineCap = ctx.lineJoin = "round";
			ctx.miterLimit = 2;
			ctx.textBaseline = "middle";
			ctx.setTransform(mm.ratio,0,0, mm.ratio,0,0);

			if (!pr) {
				this.poiLabel = null;
				pl&&pl.draw();
			} else if (pr.label && pr.label != pl) {
				this.poiLabel = pr.label;
				
				this.poiLabel.draw();
				pl&&pl.draw();
			}
			ctx.restore();
		}
	},
});
Canvas.MapCanvasLabel = tkMapCanvasLabel;

// 	class tkMapCanvasDynamic
/**
 * 动态画布类，用于绘制动态更新的数据的展示载体
 * @class MapCanvasDynamic
 * @extends TMap.Canvas.MapCanvas
 * @constructor
 */
function tkMapCanvasDynamic() {
	Extends(this, tkMapCanvas, arguments);
	this.context = this.canvas.getContext("2d");
}
inherit(tkMapCanvasDynamic, tkMapCanvas, {
	_drawNew: function() {
		tkMapCanvas.prototype._drawNew.apply(this);
		// this.checkStutter();
	},
	_snapView: function() {
		this.stutter && this.stutter();
		tkMapCanvas.prototype._snapView.apply(this);
	},
	/**
	 * 清空当前画布
	 * @method clear
	 * @return {[type]} [description]
	 */
	clear: function() {
		var mm = this._owner.mapMode;
		this.context.setTransform(1, 0, 0, 1, 0, 0);
		this.context.clearRect(0, 0, mm.width, mm.height);
	},
	/**
	 * 设置动画
	 * @method setAnimation
	 * @param  {function}     func    动画对象
	 * @param  {dataset}     dataset 数据集
	 * @param  {object}     options 动画选项
	 *
	 * @example
	 *
	 * 		// 设置单帧的热力图
	 * 		var canvas = _map.view.dynamicCanvas;
	 *		var arrayData = [];
	 *		for (var i = 0; i < 1000; ++i) {
	 *			arrayData.push({			
	 *				lon: 120.15 + Math.random()* 0.2 - 0.1,
	 *				lat: 30.27 + Math.random()* 0.20 - 0.1,
	 *				count: Math.random()* 10
	 *			});
	 *		}
	 *		canvas.setAnimation(TMap.Animater.heatmap, new TMap.Dataset(arrayData));
	 *		canvas.start();
	 *
	 *
	 */
	setAnimation: function(func, dataset, options) {
		this.clearAnimation();
		dataset._owner = this._owner._map;
		TMapEngine.private.kanimate(this, func, dataset, options);
	},
	/**
	 * 清除动画
	 * @method clearAnimation
	 * @param  {boolean}       preserved 清除动画的同时是否清空画布
	 */
	clearAnimation: function(preserved) {
		this.stop && this.stop(preserved);
		this.uninstall && this.uninstall();
	},

	/**
	 * 添加帧绘制回调
	 * @method addFrameCallback
	 * @param  {function}         func 帧回调，回调时会以帧编号传入函数
	 * @return {number} 回调索引编号
	 */
	addFrameCallback: function(func) {
		if (func) {
			if (this._animeCursorCB == null) {
				this._animeCursorCB = [];
				this._animeCursorCB.top = 0;
			} else for (var i = 0, l = this._animeCursorCB.length; i < l; ++i) {
				if (this._animeCursorCB[i].f == func) {
					return this._animeCursorCB[i].id;
				}
			}
			this._animeCursorCB.push({id: ++this._animeCursorCB.top, f: func});
			return this._animeCursorCB.top;
		}
		return null;
	},

	/**
	 * 移除帧回调
	 * @method removeFrameCallback
	 * @param  {number}            funcId 添加帧回调时的索引
	 */
	removeFrameCallback: function(funcId) {
		if (funcId && this._animeCursorCB) {
			for (var i = 0, l = this._animeCursorCB.length; i < l; ++i) {
				if (this._animeCursorCB[i].id == funcId) {
					this._animeCursorCB.splice(i, 1);
					break;
				}
			}
		}
	},
	_notifyFrameCallback: function(timer) {
		if (this._animeCursorCB)
			for (var i = 0, l = this._animeCursorCB.length; i < l; ++i) {
				this._animeCursorCB[i].f(timer);
			}
	},
});
Canvas.MapCanvasDynamic = tkMapCanvasDynamic;

// 	class tkMapCanvasHeat
function tkMapCanvasHeat() {
	Extends(this, tkMapCanvas, arguments);
}
inherit(tkMapCanvasHeat, tkMapCanvas, {
	_drawNew: function() {
		
	},
	_snapView: function() {},
	_drawSnap: function() {},
});

})();