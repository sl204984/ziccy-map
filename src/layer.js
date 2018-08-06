//////////////////////////////////////////////////////////////////////
 // *
 // *	layer.js
 // *
 // *	this module is map layer related.
 // *
//////////////////////////////////////////////////////////////////////

(function tkLayer() {'use strict';
var eng = TMapEngine;
/**
 *	定义了图层相关的内容
 * @namespace Layer
 * @namespace TMap
 */
var Layer = TMap.Layer = {};
const tkTileSizeBit = 8, tkTileSize = 1<<tkTileSizeBit;
var GeoUtils = TMap.GeoUtils;
var ll2mct = GeoUtils.ll2mct,
	mct2ll = GeoUtils.mct2ll,
	t2ll = GeoUtils.t2ll,
	wmt2mct = GeoUtils.wmt2mct,
	mct2wmt = GeoUtils.mct2wmt,
	morton = GeoUtils.morton,
	t2ll = GeoUtils.t2ll,
	clamp = GeoUtils.clamp,
	cloop = GeoUtils.cloop,
	makekey = GeoUtils.makekey,
	rect_intersect = GeoUtils.rect_intersect;

 /**
  * LayerBase类，抽象类，不可直接实例化
  *	@class LayerBase		 
  *
  * @namespace TMap.Layer
  */
function LayerBase() {
	/**
	 * 图层名称
	 * 
	 * @property {string} name 		
	 */
	this.name = arguments[0] || "unknown";
	
	this.model = null;
	this.dataComplete = true;
	this.shouldDraw = new Set();
	this.lonlatBox = [71, 128, 3, 54];
	this.bboxDict = {};

	
	/**
	 * 图层可见性
	 * 
	 * @property {boolean} visible
	 * @default true
	 */
	this.visible = true;

	/**
	 * 图层最小可见级别
	 * 
	 * @property {number} minZ
	 * @default 4
	 */
	this.minZ = 4;
	/**
	 * 图层最大可见级别
	 * 
	 * @property {number} maxZ
	 * @default 19
	 */
	this.maxZ = 19;

	this.transparent = false;
}
LayerBase.prototype = {
	// _draw the canvas for this layer
	_draw: function(mm){},
	// _seek the tiles related to this condition
	_seek: function(rng, z, rts, isPreScan){},
	// transform the range from mercter pixel to source tile coordinate
	_transrange: function(rng, z){
		var T = 1<<z;
		var stx = rng[0]>>tkTileSizeBit, etx = (rng[1]+256)>>tkTileSizeBit, sty = clamp(rng[2]>>tkTileSizeBit,0,T), ety = clamp((rng[3]+256)>>tkTileSizeBit,0,T);
		return [stx, etx, sty, ety];
	},
	// set _request content
	_request: function(){},
	// _send request to get tile data
	_send: function(){},
	// the _bbox of tile row column
	_bbox: function(z){
		var bb = this.bboxDict[z];
		if (bb) return bb;
		var sw, ne;
		if (z > 7) {
			sw = ll2mct(this.lonlatBox[0], this.lonlatBox[2], z),
			ne = ll2mct(this.lonlatBox[1], this.lonlatBox[3], z);
		} else {
			sw = ll2mct(71, 3, z),
			ne = ll2mct(128, 54, z);
		}

		bb = [sw[0], ne[0], ne[1], sw[1]];
		bb = this._transrange(bb, z);
		this.bboxDict[z] = bb;
		return bb;
	},
	_tilegen: function(x,y,z){},
	keygen: makekey,
	setVisible: function(v) {
		this.visible = v;
	},
	glMatrix: function(mm, tile) {
		if (mm.z == tile.z) {
			return [[(tile.tx-mm.tileX)*256.0 - mm.deltaX, (mm.tileY-tile.ty - 1)*256.0 +mm.deltaY, 0]];	
		} else {
			var dz = mm.z - tile.z;
			var dx = (tile.tx << dz) - mm.tileX, dy = mm.tileY - ((tile.ty + 1) << dz);
			return [
				[dx * 256.0 - mm.deltaX, dy * 256.0 + mm.deltaY, 0],
				[Math.pow(2, dz), Math.pow(2, dz), 1]
			];
		}
		
	},
};

/**
 * LayerVector类，矢量地图数据图层。所有以矢量形式绘制展示的图层，均以此类图层，展现在地图上。
 * 
 * @class LayerVector
 * @extends TMap.Layer.LayerBase
 * @constructor
 * @param {string} name
 * @namespace TMap.Layer
 */
function LayerVector() {
	Extends(this, LayerBase, arguments);
	
	this.filters = new Set();
	this.bolds = {};
	TMapEngine.private.egaki(this, tkTileSize);
	
	this.hasLabel = true;
	this.showLabel = true;
	this.drawTiles = [];
	
	this.mapPackage = "horae";
	this.styleViewName = "";//vector-sm";
	this.viewId = 0;
}
Layer.LayerVector = LayerVector;
inherit(LayerVector, LayerBase, {
	_draw: function(mm, c) {
		if (this.boldGeo != null) {
			this.boldGeos = eng.styler.filtBoldFeature(this, this.drawTiles);	
		} else 
			this.boldGeos = null;
		
		this.vectorDraw(c, mm, this.drawTiles);
	},
	//,
	// _send: function() {},
	// _transrange: function(rng,z) {}
	_request: function(rts) {
		eng.dataPool.setRequestTiles(rts);
		// this.source.setTaskQueue(rts);
	},
		
	_seekOtherLevel: function(x, y, z, setts, dts, isPreScan){
		for (var dt, nk, ii = x>>1, jj = y>>1, zz=z-1; zz>= this.minZ; ii >>=1, jj >>=1, --zz) {
			if (!setts.has(nk = this.keygen(ii, jj, zz)) && null != (dt = eng.dataPool.get(nk, isPreScan))) {
				dts.push(dt);
				setts.add(nk);
				return;
			}

			if (this.transparent) 
				return;
		}
	},

	_seek: function(rng, z, rts, isPreScan) {
		var dts = [], setts = new Set();
		var i, j, dt, de, x, y, T = 1<<z;
		var stx = rng[0], etx = rng[1], sty = rng[2], ety = rng[3];
		var shouldDraw = new Set();
		for (i = stx; i <= etx; ++i) {
			x = cloop(i, T);
			for (j = sty; j <= ety; ++j) {
				de = this._tilegen(x, j, z);
				shouldDraw.add(de.key);
				dt = eng.dataPool.get(de.key, isPreScan);
				if (dt) {
					dts.push(dt);
					setts.add(dt.key);
				} else {
					rts.push(de);
					this._seekOtherLevel(x, j, z, setts, dts, isPreScan);
				}
			}
		}
	
		if (rts.length > 0 ) {
			var cx = (stx + etx)>>1, cy = (sty + ety)>>1;
			rts = rts.sort(function(b, a){
				return Math.abs(a.tx - cx) + Math.abs(a.ty - cy) - Math.abs(b.tx - cx) - Math.abs(b.ty - cy);
			});	
			this.dataComplete = false;
		} else 
			this.dataComplete = true;
	
		if (!isPreScan) {
			this.drawTiles = dts.sort(function(a, b) {
				return a.z - b.z;
			});
			this.shouldDraw = shouldDraw;
		}
	},
	_tilegen: function(x, y, z) {
		var tg = {
			tx: x, 
			ty: y, 
			z: z, 
			okey: makekey(x, y, z), 
			layer: this,
		};

		tg.key = tg.okey + "z" + this.viewId;
		return tg;
	},
	keygen: function(x, y, z) {
		return makekey(x, y, z) + "z" + this.viewId;
	},

	_updateStyleTiles: function() {
		var layerPostfix = "z" + this.viewId, lyr = this;
		eng.dataPool.updateTiles(function(tile) {
			if (tile.key && tile.key.endsWith(layerPostfix)) {
				var originData = eng.dataPool.scache.get(tile.okey);
				if (originData != null) {
					return eng.styler._styling(originData, lyr, tile.z);					
				}
			}
			return null;
		});
	},

	/**
	 * 切换过滤器
	 * 
	 * @method toggleFilter
	 * @param {string} type 	需要切换过滤的地物类型
	 */	
	toggleFilter: function(t) {
		var lyr = this, funcSingle = function(t) {
			if (lyr.filters.has(t)) {
				lyr.filters.delete(t);
			} else {
				lyr.filters.add(t);
			}
		};

		if (t instanceof Array) {
			for (var i in t) {
				funcSingle(t[i]);
			}
		} else funcSingle(t);
		
		this._updateStyleTiles();
	},

	/**
	 * 判断指定类型地物是否要被过滤
	 * 
	 * @method checkFilter
	 * @param {string} type 类型是否要被过滤
	 * @return {boolean} 指定的地物类型是否被过滤掉
	 */	
	checkFilter: function(t) {
		return this.filters.has(t);
	},

	/**
	 * 高亮指定类型地物
	 * 
	 * @method boldFeature
	 * @param {string} type 待比较的Bounds对象
	 */	
	boldFeature: function(t) {
		var lyr = this, funcSingle = function(t) {
			if (!lyr.bolds[t]) {
				lyr.bolds[t] = {f:"red"};
			} else {
				delete lyr.bolds[t];
			}
		};

		if (t instanceof Array) {
			for (var i in t) {
				funcSingle(t[i]);
			}
		} else funcSingle(t);
		
		this._updateStyleTiles();
	},

	/**
	 * 检查地物类型是否需要高亮显示
	 * 
	 * @method checkBoldFeature
	 * @param  {string}         type  待检查的地物类型
	 * @return {boolean}           是否是需要高亮显示
	 */
	checkBoldFeature: function(t) {
		return this.bolds[t];
	},

	/**
	 * 自定义地物显示风格
	 * 
	 * @method customStyle
	 * @param  {string}    type     待定义的地物类型
	 * @param  {object}    param {offset, value}
	 */
	customStyle: function(t, param) {
		var renderConfig = eng.styler.getRenderConfig(this.mapPackage);
		renderConfig.duplicateView(this.styleViewName, this.styleViewName+"-origin");
		renderConfig.setStyle({
			view: this.styleViewName,
			offset: param.offset || "fillColor",
			value: param.value,
			typeCode: t
		});

		this._updateStyleTiles();
	},
	/**
	 * 清除当前视图的所有自定义风格
	 * 
	 * @method clearCustomStyle
	 */
	clearCustomStyle: function(){
		var renderConfig = eng.styler.getRenderConfig(this.mapPackage);
		if (renderConfig.views[this.styleViewName+"-origin"] == null)
			return;

		renderConfig.deleteView(this.styleViewName);
		renderConfig.duplicateView(this.styleViewName+"-origin", this.styleViewName);

		this._updateStyleTiles();
	},

	/**
	 * 获取视图名称列表
	 * @method styleViewNames
	 * @return {Array}	       视图名称列表
	 */
	styleViewNames: function() {
		var result = [];
		for (var name in eng.styler.mapRenderConfig[this.mapPackage].views) {
			result.push(name);
		}
		return name;
	},
	/**
	 * 设置当前风格视图名
	 * @method setStyleView
	 * @param  {string}     svn 地图风格名称
	 */
	setStyleView: function(svn) {
		var vi = eng.styler.mapRenderConfig[this.mapPackage].views[svn];
		if (vi != null) {
			this.styleViewName = svn;
			this.viewId = vi.index;
		}
	},
});



// 	class LayerRaster
function LayerRaster() {
	Extends(this, LayerBase, arguments);
}
inherit(LayerRaster, LayerBase, {
	_request: function(rts) {
		eng.dataPool.setRequestTiles(rts);
		// this.source.setTaskQueue(rts);
	},
	_send: function(obj) {
		obj.img.crossOrigin = "anonymous";	// this line is very important, or there will be CORS error when getImageData
		obj.img.src = this.getTileURL(obj);
	},
	getTileURL: function(param) {return "";},
	_tilegen: function(x, y, z) {
		var tg = {
			tx: x, 
			ty: y, 
			z: z, 
			key: makekey(x, y, z) + "z"+this.name, 
			img: false,
			layer: this,
		};
		return tg;
	},
	keygen: function(x, y, z) {
		return makekey(x, y, z) + "z"+this.name;
	},
});
Layer.LayerRaster = LayerRaster;

/**
 * LayerWMTS类，用于实现标准WMTS的服务的地图图层。
 * 
 * @class LayerWMTS
 * @extends TMap.Layer.LayerBase
 * @constructor
 * @param {string} name 		用于初始化name属性
 * @param {string} urlPattern  用于初始化urlPattern属性
 * @namespace TMap.Layer
 */
function LayerWMTS() {
	Extends(this, LayerRaster, arguments);
	/**
	 * WMTS地图服务的URL接口模板。模板中的标识说明如下：
	 *
	 * * %{svr}	: 地图的服务器编号 0~8
	 * * %{x} : 地图瓦片的Column属性
	 * * %{y} : 地图瓦片的Row属性
	 * * %{z} : 地图瓦片的Matrix属性
	 * 
	 * @property {string} urlPattern
	 * @example
	 * 
	 *		lyr = new TMap.Layer.LayerWMTS("layer", "http://t%{svr}.ditu.net/wmts/%{z}/%{x}/%{y}");
	 *		map.getLayers().push(lyr);
	 */
	this.urlPattern = null;
}
Layer.LayerWMTS = LayerWMTS;
inherit(LayerWMTS, LayerRaster, {
	_draw: function(mm, c) {
		for (var i = 0, len = this.drawTiles.length; i < len; ++i) {	
			this._rasterDraw(c, mm, this.drawTiles[i]);
		}
	},
	getTileURL: function(obj) {
		return this.urlPattern.replace("%{svr}", obj.svr).replace("%{z}", obj.z).replace("%{x}", obj.tx).replace("%{y}", obj.ty);
	},
	// _send: function(obj) {},
	// _request: function(rts) {},
	
	_transrange: function(rng, z) {
		var T = 1<<z;
		var lt = mct2wmt(rng[0], rng[2], z), rb = mct2wmt(rng[1], rng[3], z);
		var stx = Math.floor(lt[0]), etx = Math.ceil(rb[0]), sty = clamp(Math.floor(lt[1]),0,T), ety = clamp(Math.ceil(rb[1]),0,T);
		return [stx,etx,sty,ety];
	},

	_seekOtherLevel: LayerVector.prototype._seekOtherLevel,
	_seek: function(rng, z, rts, isPreScan) {
		var setts = new Set(), dts = [];
		var i, j, dt, de, x, y, T = 1<<z;
		var stx = rng[0], etx = rng[1], sty = rng[2], ety = rng[3];
		var shouldDraw = new Set();
		for (i = stx; i <= etx; ++i) {
			x = cloop(i, T);
			for (j = sty; j <= ety; ++j) {
				de = this._tilegen(x, j, z);

				dt = eng.dataPool.get(de.key);
				shouldDraw.add(de.key);
				if (dt) {
					dts.push(dt);
					setts.add(dt.key);
				} else {
					rts.push(de);

					this._seekOtherLevel(x,j,z,setts,dts);
					// var nk, ii = x>>1, jj = j>>1, zz=z-1;
					// nk = this.keygen(ii, jj, zz);
					// if (!setts.has(nk)) {
					// 	dt = eng.dataPool.get(nk);
					// 	if (dt) {
					// 		dts.push(dt);
					// 		setts.add(nk);
					// 	} else {
					// 	}
					// }
				}
			}
		}

		if (rts.length> 0 ) {
			var cx = (stx+etx)>>1, cy = (sty+ety)>>1;
			rts = rts.sort(function(b,a){
				return Math.abs(a.tx - cx) + Math.abs(a.ty - cy) - Math.abs(b.tx - cx) - Math.abs(b.ty - cy);
			});	
		} 

		if (!isPreScan) {
			this.drawTiles = dts.sort(function(a, b) {
				return a.z - b.z;
			});
			this.shouldDraw = shouldDraw;
		}
	},
	// update: function(dts) {
	// 	this.drawTiles = dts;
	// },
	// _bbox: function(z){},
	_rasterDraw: function (c,mm,tile) {
		if (!tile.img) 
			return;

		c.save();
		var hr = mm.initTransformR(c,tile);
		tile.img.crossOrigin = "anonymous";
		c.drawImage(tile.img, mm.deltaX, mm.deltaY, tkTileSize, hr);	 
		c.restore();
	},

	glMatrix: function(mm, tile) {
		var dx, dy, dz = mm.z - tile.z;
		var ml = wmt2mct(tile.tx, tile.ty, tile.z);
		var nl = wmt2mct(tile.tx+1, tile.ty+1, tile.z);
		ml[0] <<= dz, ml[1] <<= dz;
		nl[0] <<= dz, nl[1] <<= dz;
		
		var dx = ml[0] - mm.mctX, dy = mm.mctY - nl[1];
		var hr = nl[1] - ml[1];

		var hf = mm.mctUpper/2;
		if (dx > hf) {
			while (dx > hf) dx -= mm.mctUpper;
		} else if (dx < -hf) {
			while(dx < -hf) dx += mm.mctUpper;
		}

		return [[dx, dy, 0], [Math.pow(2.0, dz), hr/256.0, 1]];
	},
});


////////////////////////////////////
//
// 	class LayerWMS
//	BE CAREFUL, THIS IS LAYER FOR WMS NOT WMTS
//
//	this class could be used as TMC
////////////////////////////////////

/**
 * LayerWMS类
 * @class LayerWMS
 * 
 * @extends TMap.Layer.LayerBase
 * @constructor
 * @param {string} name  	用于初始化name属性
 * @param {string} urlpattern 	用于初始化urlPattern属性
 * @namespace TMap.Layer
 */
function LayerWMS() {
	Extends(this, LayerRaster, arguments);

	/**
	 * WMS地图服务的URL接口模板。模板中的标识说明如下：
	 *
	 * * %{svr}	: 地图的服务器编号 0~8
	 * * %{lon} : 地图显示区域西侧的经度
	 * * %{LON} : 地图显示区域东侧的经度
	 * * %{lat} : 地图显示区域南侧的纬度
	 * * %{LAT} : 地图显示区域北侧的纬度
	 * 
	 * @property {string} urlPattern
	 * @example
	 * 
	 *		lyr = new TMap.Layer.LayerWMTS("layer", "http://t%{svr}.ditu.net/wms?_bbox=%{lon},%{LON},%{lat},%{LAT}");
	 *		map.getLayers().push(lyr);
	 */	
	this.urlPattern = null;
}
inherit(LayerWMS, LayerRaster, {
	_getTileURL: function(obj) {
		var nw = t2ll(obj.tx,obj.ty,obj.z),
		se = t2ll(obj.tx+1,obj.ty+1,obj.z);
		return this.urlPattern.replace("%{svr}", obj.svr)
							  .replace("%{lon}", nw[0])
							  .replace("%{LON}", se[0])
							  .replace("%{lat}", se[1])
							  .replace("%{LAT}", nw[1]);
	},
	_draw: function(mm, c) {
		for (var i = 0, len = this.drawTiles.length; i < len; ++i) {	
			this._rasterDraw(c, mm, this.drawTiles[i]);
		}
	},

	_seekOtherLevel: LayerVector.prototype._seekOtherLevel,
	_seek: LayerVector.prototype._seek,
	_rasterDraw: function (c,mm,tile) {
		if (!tile.img) 
			return;

		c.save();
		mm.initTransform(c, tile);
		tile.img.crossOrigin = "Anonymous";
		c.drawImage(tile.img, 0, 0, tkTileSize, tkTileSize);	 
		c.restore();
	},
});
Layer.LayerWMS = LayerWMS;



})();