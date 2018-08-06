//////////////////////////////////////////////////////////////////////
 // *
 // *	chizu.js
 // *
 // *	chizu is pronounciation for "atlas" in Japanese. We use this to
 // * 	confuse our readers who want hack back.
 // *
//////////////////////////////////////////////////////////////////////

(function (){ 'use strict';
const tkTileSizeBit = 8;
const tkTileSize = 1<<tkTileSizeBit;
const tkScaleMarkUnit = [2e7,1e7,5e6,2e6,1e6,5e5,2e5,1e5,5e4,2.5e4,1e4,5e3,2e3,1e3,5e2,2e2,1e2,50,25,10,5,2.5];
const tkScaleMarkText = tkScaleMarkUnit.map(humanDistance);
const M_PI = Math.PI, M_PI_2 = Math.PI/2, M_2PI = Math.PI*2, M_4PI = Math.PI*4;
const M_RPD = M_PI/180.0, M_DPR = 180.0/M_PI, M_LOG2 = Math.log(2);
const TK_EARTH_RADIUS = 6378137.0;
const TK_EARTH_PERIMETER = TK_EARTH_RADIUS*M_2PI;
var GeoUtils = TMap.GeoUtils;
var ll2mct = GeoUtils.ll2mct,
	mct2ll = GeoUtils.mct2ll,
	wmt2mct = GeoUtils.wmt2mct,
	rect_intersect = GeoUtils.rect_intersect;


var env = new tkEnvironment();
const AnimaCount = env.microsoft? 2: 5;





function tkMapEngine(options) {
	if (TMapEngine._initialized) return;
	TMapEngine._initialized = true;
	$.extend(TMapEngine, tkMapEngine.prototype);	

	options = options || {};
	TMapEngine.bbox = options.bbox;
	TMapEngine.pullEngineConfig();

	TMapEngine.mapViews = [];
	TMapEngine.ratio = 2;
	TMapEngine.dataPool = new tkDataPool();
	TMapEngine.styler = new TMap.Styler.tkStyler(TMapEngine);

	TMapEngine.displayTechVersion = "canvas";
	// tkCanvas();
	// tkLayer(TMapEngine);

	var bbox = TMapEngine.bbox;
	TMapEngine.layerMgr = {
		"horae": factoryWrap(TMap.Layer.LayerVector, function(lyr){
						lyr.name = "horae";
						lyr.lonlatBox = bbox;
					}),
		"satellite": factoryWrap(TMap.Layer.LayerWMTS, function(lyr) {
						lyr.name = "satellite";
						lyr.lonlatBox = bbox;
						lyr.urlPattern = TMap.domain+"/perseus/cors?url=http://t%{svr}.tianditu.cn/img_c/wmts?service=wmts&style=default&format=tiles&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=c&TileMatrix=%{z}&TileRow=%{y}&TileCol=%{x}";
						lyr.visible = false;
					}),
	};

	if (options.layerFactories) {
		$.extend(TMapEngine.layerMgr, options.layerFactories);
	}
	
	var pre = document.createElement("pre");
	pre.id = "tkm-text-ruler";
	document.body.appendChild(pre);
	
}

tkMapEngine.prototype = {
	pullEngineConfig: function() {
		var czJson = $.ajax({
			type: "POST",
			url: TMap.domain+"/perseus/webmap",
			timeout: TMap.timeout,
			data: "at=cz",
			async: false,
			dataType: "json",
		}).responseJSON;

		if (czJson) {
			if (this.bbox == null)
				this.bbox = czJson.bbox;
			
			if (czJson.city) {
				var citys = czJson.city;
				var city = {}, state = {count:0};
				for (var c in citys) {
					if (citys[c].length > 2) {
						city[c] = {
							name: citys[c][0],
							parent: citys[c][1],
							lon: citys[c][2],
							lat: citys[c][3],
							zoom: citys[c][4],
						}
						if (state[city[c].parent] == null) {
							state.count++;
							state[city[c].parent] = c;
						}
					}
				}
				this.cityConfig = {city: city, province: state};
			}
		}
	},

	getGLContext: function(){
		if (this.mapViews && this.mapViews[0] && this.mapViews[0].canvases && this.mapViews[0].canvases[0]) {
			return this.mapViews[0].canvases[0].gl;
		}
		return null;
	},
	getGLCanvas: function(){
		if (this.displayTechVersion === "webgl" && this.mapViews && this.mapViews[0] && this.mapViews[0].canvases) {
			return this.mapViews[0].canvases[0];
		}
		return null;
	},
};


 /********************************
  *	class tkMapView				 *
  ********************************/
function tkMapView(param) {
	$.extend(this, param);

	this.mode = 0;
	if (this.container == document.body) {
		this.fullScreen = true;
	}

	if (this.fullScreen) {
		this.width = window.innerWidth;
		this.height = window.innerHeight;	
	} else {
		var container = $(this.container);
		this.width = $(container).width();
		this.height = $(container).height();	
	}
	ensureResize(this);

	this.mapMode = new tkMapMode(this.width, this.height, TMapEngine.ratio);
	this.mapMode.view = this;
	this.mapMode._listenerTargetGetter = function(mm){return mm.view._map;};

	if (param.center) {
		this.mapMode.lon = param.center.lon;
		this.mapMode.lat = param.center.lat;
	} else if (TMapEngine.cityConfig) {
		var v = TMapEngine.cityConfig.city[1];
		if (v) {
			this.mapMode.lon = v.lon;
			this.mapMode.lat = v.lat;	
			this.mapMode.z = v.zoom;
		}
	}
	
	var view = this, d;
	this.layers = (this.layers || ["satellite", "horae"]).map(function(o){var l = TMapEngine.layerMgr[o](); l._owner = view; return l;});
	var lyr = this.basicLayer = this.getLayer("horae");
	this.imageLayer = this.getLayer("satellite");
	var mrc = TMapEngine.styler.mapRenderConfig[lyr.mapPackage];
	if (mrc) lyr.setStyleView( param.defaultView || mrc.defaultView);

	this.overlays = [];
	this.markers = [];
	
	var DIV = "<div>";
	var mapsv = $(DIV).addClass("tkm-map-mainview");
	this.mapsv = mapsv;
	this.container.appendChild(mapsv[0]);

	var domsv = $(DIV).addClass("tkm-map-domtag-container");
	this.domsv = domsv;
	this.mapsv.append(domsv);
	
	
	do {	// add canvas
		this.canvases = [];
		if (TMapEngine.displayTechVersion === "canvas") {
			this.canvases.push(new TMap.Canvas.MapCanvasBasic(this));
		} else {
			this.canvases.push(new TMap.Canvas.MapCanvasGL(this));	
		}
		
		

		if (!this.noDynamicShow) {
			this.dynamicCanvas = new TMap.Canvas.MapCanvasDynamic(this);
			this.canvases.push(this.dynamicCanvas);	
			this.dynamicCanvas.hide();

			this.mapMode.addListener(function(e) {
				view.dynamicCanvas.stutter &&view.dynamicCanvas.stutter();
			}, ["move", "zoom", "rotate"]);
			
			this.mapMode.addListener(function(e) {
				view.dynamicCanvas.checkStutter && view.dynamicCanvas.checkStutter();
			}, ["moveend", "zoomend", "rotateend"]);
		}

		this.labelCanvas = new TMap.Canvas.MapCanvasLabel(this);
		this.canvases.push(this.labelCanvas);

		this.overlayCanvas = new TMap.Canvas.MapCanvasOverlay(this);
		this.canvases.push(this.overlayCanvas);

		this.annotationCanvas = new TMap.Canvas.MapCanvasOverlay(this);
		this.canvases.push(this.annotationCanvas);
		this.annotationCanvas.hide();
		this.resizeCanvases();
	} while(0);

	
	if (!this.noZoomButtons) {	// add zoom buttons
		var zooms = $(DIV).addClass("tkm-button-zooms");
		mapsv.append(zooms);

		zooms.append($(DIV).addClass("tkm-button-zoomin").click(function(){view.zoomIn();}),
					 $(DIV).addClass("tkm-button-zoomout").click(function(){view.zoomOut();}));
	}

	d = $(DIV).addClass("tkm-locmark");
	mapsv.append(d);
	this.locationMark = d[0];

	d = $(DIV).addClass("tkm-button-locate").click(function(e){
		view.moveToLocation();
	});
	mapsv.append(d);

	d = $(DIV).addClass("tkm-button-compass").click(function(){view.rotateNorth();});
	mapsv.append(d);
	this.compassView = d[0];
	this.mapMode.addListener(function(){
		var mm = view.mapMode;
		view.compassView.style.visibility = (mm.rotate == 0)? "hidden": "visible";
		view.compassView.style.transform = "rotate("+(mm.rotate*M_DPR)+"deg)";
	}, "rotate");

	this._scrollWheelZooming = true;

	var me = this, mm = this.mapMode;
	d = $(DIV).addClass("tkm-logo");
	mapsv.append(d);

	d = $(DIV).addClass("tkm-scale")
			  .append($("<center>").append(this.scaleText=$(DIV).addClass("tkm-scale-text")),
					  $(DIV).addClass("tkm-scale-line"));
	mapsv.append(d);
	this.scaleView = d[0];
	this.scaleText = this.scaleText[0];

	// add Event Listener	
	touches(mapsv, this);
	mouses(mapsv, this);
	addLocatingEvent(this);

	TMapEngine.mapViews.push(this);

	this.mapMode.fixToLonlat();
	this.mapMode.listenerNotify("init");
	this.queryDatasource();
	this.lastDrawTick = 0;

	this.daemon = new tkDaemon(this, this.dataDaemon, 100);
	this.daemon.start(true);
	this.benchmark = new benchmark();
	this.fitContainerSize();

	if (TMapEngine.displayTechVersion === "webgl") {
		this.canvases[0].startDraw();
	} else {
		this.rotateLock = true;
		this.tiltLock = true;
	}
		

	this._queryDataIndex = 0;
}

tkMapView.prototype = {	
	dataDaemon: function() {
		this.queryDatasource();
	},
	onDrawFrame: function(e) {
		this.benchmark.begin();
		var t = Date.now();
		if (e === undefined) {
			if (t - this.lastDrawTick > this.benchmark.average * 2) {
				var mm = this.mapMode, xyR = 1<<23-mm.z;

				this.originState = {
					x: mm.mctX*xyR, 
					y: mm.mctY*xyR, 
					z: mm.z, 
					s: (1<<mm.z)*mm.scale/mm.ratio, 
					w: mm.width,
					h: mm.height,
					scale: mm.scale, 
					rotate: mm.rotate
				};
				// this.oldCanvs = null;

				this.canvasesForEach("_drawNew");
				// this.canvasesForEach("_snapView");
				this.lastDrawTick = t;
			}
		} else if (e == 0) {
			this.canvasesForEach("_snapView");
			return;
		} else if (e == 1) {
			this.canvasesForEach("_drawSnap");
		}
		
		var mm = this.mapMode;
		var pt = mm.pointAtLonlat(mm.locateLon, mm.locateLat); 

		this.locationMark.style.left = (pt[0] - 8)+"px";
		this.locationMark.style.top = (pt[1] - 8)+"px";

		this.scaleView.style.width = mm.lengthInScreen(tkScaleMarkUnit[mm.z])+"px";
		this.scaleText.innerHTML = tkScaleMarkText[mm.z];

		if (this.debugInfo) {
			this.debugInfo.innerHTML = mm.lon+","+mm.lat+"<br>"+deg2string(mm.lon)+","
									  +deg2string(mm.lat)+"@ "+mm.z+"<br>"+mm.mctX+","
									  +mm.mctY+"<br>"+pt[0]+","+pt[1];
		}
		this.benchmark.end();
	},
	onClick: function(pt) {
		if (this.funcClickPoint) {
			this.funcClickPoint(pt);
		}
		if (this.clickProcs && this.clickProcs.length) {
			var point = new TMap.Point(pt);
			for (var i = 0, l = this.clickProcs.length; i < l; ++i) {
				this.clickProcs[i](point);
			}
		}
	},
	toggleMeasureMode:function(mode) {
		var func = mode == 1? TMap.Map.func_press_for_measure: TMap.Map.func_press_for_measure_area;

		if (this.funcClickPoint) {
			this.funcClickPoint(null);
		}
		if (this.mode == mode) {
			this.mode = 0;
			this.funcClickPoint = null;
		} else {
			this.mode = mode;
			this.funcClickPoint = func;
		}
	},
	togglePickPin: function() {
		if (this.funcClickPoint) {
			this.funcClickPoint(null);
		}

		if (this.mode == 3) {
			this.mode = 0;
			this.funcClickPoint = null;
		} else {
			this.mode = 3;
			this.funcClickPoint = TMap.Map.func_press_for_pin_mark;
		}
	},
	toggleQueryMode: function(){
		if (this.funcClickPoint) {
			this.funcClickPoint(null);
		}

		if (this.mode == 4) {
			this.mode = 0;
			this.mapsv.css({cursor:"-webkit-grab"});
			this.funcClickPoint = null;
		} else {
			this.mode = 4;
			this.mapsv.css({cursor:"help"});
			this.funcClickPoint = TMap.Map.func_press_for_query;
		}
	},

	canvasesForEach: function(f) {
		for (var i = 0, l = this.canvases.length; i < l; ++i) {
			var c = this.canvases[i];
			if (c.visible()) c[f]();
			// if (c.visible()) c._drawNew();
		}
	},

	refreshMap: function() {
		if (this.animation) return;
		this.queryDatasource();
		this.lastDrawTick = 0;
		this.onDrawFrame();
	},
	refreshMapForTiles: function(tiles) {
		if (this.animation) return;
		this.queryDatasource();
		var needDraw = false;
		for (var i = 0, l = tiles.length; i < l; ++i) {
			if (tiles);
		}
		if (needDraw) {
			this.lastDrawTick = 0;
			this.onDrawFrame();	
		}
		
	},
	queryDatasource: function() {
		var range = this.mapMode.bboxRange();
		var z = this.mapMode.z;
		var dataCompleted = true;
		++this._queryDataIndex;
		for (var i = 0, len = this.layers.length; i < len; ++i) {
			var rts = [], layer = this.layers[i];
			if ((layer.visible || layer == this.basicLayer) && layer.minZ <= z && z <= layer.maxZ) {
				var rng = layer._transrange(range, z), bbox = layer._bbox(z);
				rng = rect_intersect(rng, bbox);
				var dts = layer._seek(rng, z, rts, false);
				if (rts.length > 0) {
					rts.needDraw = true;
					dataCompleted = false;
					rts.queryIndex= this._queryDataIndex;
					layer._request(rts);		
				}
			}
		}
		
		if (dataCompleted) {
			this.mapMode.listenerNotify("tileready");

			var rts = [], layer = this.basicLayer;
			var w = range[1] - range[0], h = range[3] - range[2];
			range[0] -= w, range[1] += w, range[2] -= h, range[3] += h;
			
			var rng = layer._transrange(range, z), bbox = layer._bbox(z);
			rng = rect_intersect(rng, bbox);
			layer._seek(rng, z, rts, true);
			
			if (z > this.mapMode.minZ) {
				--z, w /= 2, h /= 2;
				range[0] -= w, range[1] += w, range[2] -= h, range[3] += h;
				range[0]>>= 1, range[1]>>= 1, range[2]>>= 1, range[3]>>= 1;
			
				rng = layer._transrange(range, z), bbox = layer._bbox(z);
				rng = rect_intersect(rng, bbox);
				layer._seek(rng, z, rts, true);
			}
			if (rts.length > 0) layer._request(rts);	
		}
	},

	zoomIn: function() {
		var self = this;
		this.startAnimation(function () {
			self.mapMode.zoomDelta(0.2);
		}, function() {
			self.mapMode.listenerNotify("zoomend");
		});
	},

	zoomOut: function() {
		var self = this;
		this.startAnimation(function () {
			self.mapMode.zoomDelta(-0.2);
		}, function() {
			self.mapMode.listenerNotify("zoomend");
		});
	},
	moveToLocation: function() {
		if (this.mapMode.locateLon == undefined) {
			alert("暂未获得定位信息");
		} else {
			var self = this;
			this.startAnimation(function () {
				var mm = self.mapMode;
				var pt = mm.pointAtLonlat(mm.locateLon, mm.locateLat); 
				var x = self.width/2-pt[0], y = self.height/2-pt[1];
				mm.moveDelta(x/2, y/2);
			}, 
			function () {
				var mm = self.mapMode;
				var pt = mm.pointAtLonlat(mm.locateLon, mm.locateLat); 
				var x = self.width/2-pt[0], y = self.height/2-pt[1];
				mm.moveDelta(x, y);
				self.mapMode.listenerNotify("moveend");
			});
		}
	},
	rotateNorth: function() {
		var self = this;
		this.startAnimation(function () {
			var rot = M_PI > self.mapMode.rotate? 0: M_PI;
			self.mapMode.rotateDelta(rot-self.mapMode.rotate/2.0);

			if (self.mapMode.tilt) {
				self.mapMode.tiltDelta(-self.mapMode.tilt/2.0);
			}
		}, function() {
			self.mapMode.rotateDelta(-self.mapMode.rotate);
			if (self.mapMode.tilt) {
				self.mapMode.tiltDelta(-self.mapMode.tilt);
			}
		});
	},
	startAnimation: function(func, endfunc) {
		if (this.animation) return;
		var interval = 66;
		var obj = this;
		this.onDrawFrame(0);
		this.animationCnt = AnimaCount;//5;
		this.animation = setInterval(function() {
			var view = obj;
			if (--view.animationCnt) {
				func();
				view.onDrawFrame(1);
			} else {
				func();
				if (endfunc) endfunc();
				clearInterval(view.animation);
				view.animation = null;
				view.onDrawFrame();
			}			
		}, interval);
	},
	featureAtPoint: function(pt) {
		var x = pt.x, y = pt.y, z = this.mapMode.z, k, td, ox, oy;
		var pt = this.mapMode.mercatorAtPoint(x, y);
		x = pt[0]>>tkTileSizeBit, y = pt[1]>>tkTileSizeBit;
		ox = pt[0]%tkTileSize, oy = pt[1]%tkTileSize;
		for (var lyr, i = this.layers.length - 1; i >= 0; --i) {
			lyr = this.layers[i];
			if (lyr instanceof TMap.Layer.LayerVector) {
				lyr.boldGeo = null;
				k = lyr.keygen(x, y, z);
				td = TMapEngine.dataPool.get(k);
				if (td == null || td.zIndexKeys == null) continue;

				var zarrays = Array.from(td.zIndexKeys).sort(function (a, b) { return b-a;});
				for (var zi = 0, zlen = zarrays.length; zi < zlen; ++zi) {
					var geos = td.g[zarrays[zi]];
					for (var gi = 0, geo, glen = geos.length; gi < glen; ++gi) {
						geo = geos[gi];
						var width = geo.l+geo.w*2, func;
						if (geo.t == 1) {
							func = GeoUtils.point_in_line;
						} else if (geo.t == 2) {
							func = GeoUtils.point_in_polygon;
						} else continue;

						for (var ai = 0, al = geo.a.length; ai < al; ++ai) {
							var ret = func([ox,oy], geo.a[ai], width);
							if (ret >= 0) {
								lyr.boldGeo = geo.a[ai].geo;
								return geo.a[ai].geo;
							}
						}
					}
				}
			}
		}
	},
	clearBoldFeature: function(){
		for (var lyr, i = this.layers.length - 1; i >= 0; --i) {
			lyr = this.layers[i];
			if (lyr instanceof TMap.Layer.LayerVector) {
				lyr.boldGeo = null;
			}
		}
	},

	resizeCanvases: function() {
		var resizeCanvas = function(mm,canvas) {
			canvas.width = mm.width;
			canvas.height = mm.height;
			canvas.style.width = (mm.width / mm.ratio)+"px";
			canvas.style.height= (mm.height / mm.ratio)+"px";
		}
		
		for (var i = 0, l = this.canvases.length; i < l; ++i) {
			resizeCanvas(this.mapMode, this.canvases[i].canvas);			
		}
	},
	getBounds: function(){

		var rng = this.mapMode.bboxRange();
		var pt1 = mct2ll(rng[0], rng[3], this.mapMode.z),
			pt2 = mct2ll(rng[1], rng[2], this.mapMode.z);
		return [pt1, pt2];
	},
	pointAtLonlat: function(lon,lat) {
		return this.mapMode.pointAtLonlat(lon,lat);
	},
	resize: function (w,h) {
		var mm = this.mapMode;
		this.width = w, this.height = h;
		var cpt = mm.mercatorAtPoint(w/2,h/2);
		mm.mctX = cpt[0], mm.mctY = cpt[1];
		mm.width = w *mm.ratio, mm.height = h *mm.ratio;
		mm.halfWidth = mm.width/2, mm.halfHeight = mm.height / 2;
		mm.radius = Math.sqrt(mm.width*mm.width + mm.height*mm.height) / 2;
		mm.fixToMercator();
		mm.listenerNotify("resize");
		this.mapsv.css({width:w+"px",height:h+"px"});
		this.resizeCanvases();
		this.queryDatasource();
		this.refreshMap();

		var pt = this.getBodyOffset();
		this.windowBounds = [pt.x, pt.x+w, pt.y,pt.y+h];
	},
	fitContainerSize: function(){
		if (this.fullScreen) {	// this.container == document.body 
			this.resize(window.innerWidth, window.innerHeight);
		} else {
			var con = $(this.container);
			this.resize(con.width(), con.height());
		}
	},
	viewStyleChange: function(svn) {
		if (this.basicLayer.styleViewName != svn) {
			this.imageLayer.setVisible(svn == "satellite");
			this.basicLayer.setVisible(true);
			// this.basicLayer.setVisible(false);
			this.basicLayer.setStyleView(svn);
			this.queryDatasource();
			this.onDrawFrame();
		}
	},
	getLayer: function(name) {
		var lyr = null;
		for (var i = 0, l = this.layers.length; i < l; ++i) {
			lyr = this.layers[i];
			if (lyr.name == name)
				break;
		}
		return lyr;
	},
	getBodyOffset: function() {
		return getSpecifiedViewOffset(this.mapsv[0]);
	},
};



 /********************************
  *	class tkMapMode				 *
  ********************************/
function tkMapMode(w,h,s) {
	this.z=14;
	this.maxZ=18;
	this.minZ=4;
	this.lat=39.904156;
	this.lon=116.39777;
	this.locateLon = 116.30542;
	this.locateLat = 40.052443;

	this.scale = s;
	this.ratio = s;
	this.x=0;	//中心瓦片的绘图原点
	this.y=0;
	this.mctX=0;
	this.mctY=0;
	this.tileX=0;
	this.tileY=0;
	this.deltaX=0;
	this.deltaY=0;
	this.rotate=0;
	this.tilt=0;
	this.cos0=1.0;
	this.sin0=0;
	this.bbox=null;//[-400,400,-90,90];
	this.projection = "Mercator";
	this.mctUpper = 1<<(this.z+8);

	this.width = w*s;
	this.height = h*s;
	this.halfWidth = this.width/2;
	this.halfHeight = this.height/2;
	this.radius = Math.sqrt(this.width*this.width+this.height*this.height)/2;

	var mm = this;
	this.addListener(function(){
		mm._moving = false;
	}, "moveend");
	this.addListener(function(){
		mm._zooming = false;
	}, "zoomend");
	this.addListener(function(){
		mm._rotating = false;
	}, "rotateend");
}

tkMapMode.prototype = {
	initTransform: function(ctx,tile) {
		var ocX = this.x, ocY = this.y, ocS;
		var dx, dy, dz = tile.z - this.z;
		if (dz == 0) {
			dx = tile.tx - this.tileX, dy = tile.ty - this.tileY;
			ocS = this.scale;
		} else if (dz < 0){
			dx = (tile.tx<<1) - this.tileX, dy = (tile.ty<<1) - this.tileY;	
			ocS = this.scale*2;
		} else if (dz > 0){
			dx = (tile.tx>>1) - this.tileX, dy = (tile.ty>>1) - this.tileY;	
			// if (tile.tx & 1) dx+=0.5;
			// if (tile.ty & 1) dy+=0.5;
			ocS = this.scale;///2;
		}
		if (dx || dy) {
			dx = (dx<<tkTileSizeBit)*this.scale, dy = (dy<<tkTileSizeBit)*this.scale;

			ocX += dx*this.cos0 - dy*this.sin0,
			ocY += dx*this.sin0 + dy*this.cos0;
		}
		ctx.setTransform(1,0,0,1,0,0);
		ctx.translate(ocX, ocY);
		ctx.scale(ocS, ocS);
		ctx.rotate(this.rotate);
		ctx.lineCap = ctx.lineJoin = "round";
		ctx.miterLimit = 2;
	},

	initTransformR: function(ctx,tile) {
		var ocX=this.x, ocY=this.y;
		var dz = tile.z-this.z;
		var ml = wmt2mct(tile.tx, tile.ty, tile.z);
		var nl = wmt2mct(tile.tx+1, tile.ty+1, tile.z);
		var dx = ml[0] - this.mctX, dy = ml[1] - this.mctY;
		var hr = nl[1] - ml[1];

		var hf = this.mctUpper/2;
		if (dx > hf) {
			dx -= this.mctUpper;
		} else if (dx < -hf) {
			dx += this.mctUpper;
		}

		var ocS = this.scale;
		dx *= this.scale, dy *= this.scale;//

		ocX += dx*this.cos0 - dy*this.sin0,
		ocY += dx*this.sin0 + dy*this.cos0;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.translate(ocX, ocY);
		ctx.rotate(this.rotate);
		ctx.scale(ocS, ocS);
		return hr;
	},


	setPoint: function(a1,a2,a3) {
		// this.listenerNotify("move");
		this.lon = a1;
		this.lat = a2;
		this.z = a3 != null? a3: this.z;
		this.fixToLonlat();

		this.listenerNotify("move");
		this.listenerNotify("moveend");
	},
	identiteContext: function(ctx) {
		ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
	},
	fixToMercator: function(force) {
		var aa = mct2ll(this.mctX, this.mctY, this.z);
		this.lon = aa[0], this.lat = aa[1];

		this.deltaX = this.mctX%tkTileSize;
		this.deltaY = this.mctY%tkTileSize;
		var ntx = this.mctX>>tkTileSizeBit, nty = this.mctY>>tkTileSizeBit;
		if (ntx != this.tileX || nty != this.tileY || force) {
			this.tileX = ntx;
			this.tileY = nty;	
			this.fixXY();		
		}
	},
	fixToLonlat: function() {
		var aa = ll2mct(this.lon, this.lat, this.z);
		this.mctX = aa[0], this.mctY = aa[1];
		this.tileX = this.mctX>>tkTileSizeBit;
		this.tileY = this.mctY>>tkTileSizeBit;
		this.deltaX = this.mctX%tkTileSize;
		this.deltaY = this.mctY%tkTileSize;
		this.mctUpper = 1<<(this.z+8);
		this.fixXY();
	},	
	fixXY: function(){
		if (this.rotate == 0) {
			this.x = this.halfWidth-this.deltaX*this.scale;
			this.y = this.halfHeight-this.deltaY*this.scale;
		} else {
			this.x = this.halfWidth-this.deltaX*this.scale*this.cos0+this.deltaY*this.scale*this.sin0;
			this.y = this.halfHeight-this.deltaX*this.scale*this.sin0-this.deltaY*this.scale*this.cos0;
		}
	},
	calcRange: function() {
		var w=this.width/this.ratio, h=this.height/this.ratio, wh=w/h, rate = 1.0/this.scale;
		if (wh>2 || wh<0.5) {
			if (this.rotate == 0) {
				w = this.halfWidth*rate, h = this.halfHeight*rate;
			} else {
				var hh = Math.abs((this.sin0/this.cos0*w+h)*this.cos0)/2,
					hw = Math.abs((this.cos0/this.sin0*w-h)*this.sin0)/2,
					gh = Math.abs((this.sin0/this.cos0*w-h)*this.cos0)/2,
					gw = Math.abs((this.cos0/this.sin0*w+h)*this.sin0)/2;

				w = hw>gw?hw:gw, h = hh>gh?hh:gh;
			}
		} else 
			w = h = this.radius*rate;
		return [this.mctX-w, this.mctX+w, this.mctY-h, this.mctY+h];
	},
	calcSize: function() {
		var w = this.width/this.ratio, h=this.height/this.ratio, wh=w/h, rate = 1.0/this.scale;
		
		if (this.rotate == 0) {
			w = this.halfWidth*rate, h = this.halfHeight*rate;
		} else {
			if (wh>2 || wh<0.5) {
				var hh = Math.abs((this.sin0/this.cos0*w+h)*this.cos0)/2,
					hw = Math.abs((this.cos0/this.sin0*w-h)*this.sin0)/2,
					gh = Math.abs((this.sin0/this.cos0*w-h)*this.cos0)/2,
					gw = Math.abs((this.cos0/this.sin0*w+h)*this.sin0)/2;

				w = hw>gw?hw:gw, h = hh>gh?hh:gh;
			} else 
				w = h = this.radius*rate;
		}
		
		return [w, h];
	},
	bboxRange: function() {
		var w, h, rate = 1.0/this.scale;
		
		if (this.rotate == 0) {
			w = this.halfWidth * rate, h = this.halfHeight * rate;		
		} else {
			// w = this.width / this.ratio, h = this.height / this.ratio;
			w = this.width * rate, h = this.height * rate;
			var hh = Math.abs((this.sin0/this.cos0*w+h)*this.cos0)/2,
				hw = Math.abs((this.cos0/this.sin0*w-h)*this.sin0)/2,
				gh = Math.abs((this.sin0/this.cos0*w-h)*this.cos0)/2,
				gw = Math.abs((this.cos0/this.sin0*w+h)*this.sin0)/2;
			w = hw>gw? hw: gw, h = hh>gh? hh: gh;
		}
		
		return [this.mctX-w, this.mctX+w, this.mctY-h, this.mctY+h];
	},
	
	pointAtLonlat: function(lon,lat) {
		var mct = ll2mct(lon, lat, this.z), hr = this.mctUpper>>1;
		var dx = mct[0]-this.mctX, dy = mct[1]-this.mctY;
		if (dx > hr) {
			dx -= this.mctUpper;
		} else if (dx < -hr) {
			dx += this.mctUpper;
		}
		if (this.rotate == 0) {
			return [(this.halfWidth+this.scale*dx)/this.ratio,
					(this.halfHeight+this.scale*dy)/this.ratio];
		} else {
			return [(this.halfWidth+this.scale*dx*this.cos0 - this.scale*dy*this.sin0)/this.ratio,
					(this.halfHeight+this.scale*dx*this.sin0 + this.scale*dy*this.cos0)/this.ratio];
		}
	},

	pixelAtLonlat: function(lon, lat) {
		var mct = ll2mct(lon, lat, this.z), hr = this.mctUpper>>1;
		var dx = mct[0]-this.mctX, dy = mct[1]-this.mctY;
	
		if (dx > hr) {
			dx -= this.mctUpper;
		} else if (dx < -hr) {
			dx += this.mctUpper;
		}
		if (this.rotate == 0) {
			return {x:this.halfWidth+this.scale*dx,
					y:this.halfHeight+this.scale*dy};
		} else {
			return {x:this.halfWidth+this.scale*dx*this.cos0 - this.scale*dy*this.sin0,
					y:this.halfHeight+this.scale*dx*this.sin0 + this.scale*dy*this.cos0};
		}
	},

	lonlatAtPoint: function(x, y) {
		var arr = this.mercatorAtPoint(x,y);
		return mct2ll(arr[0], arr[1], this.z);
	},

	mercatorAtPoint: function(x, y) {
		var dx = (x*this.ratio - this.halfWidth)/this.scale, dy = (y*this.ratio - this.halfHeight)/this.scale;
		if (this.rotate != 0) {
			var dis = Math.sqrt(dx*dx+dy*dy), alpha=Math.atan2(dy,dx);
			dx = Math.sin(this.rotate - alpha)*dis;
			dy = Math.cos(this.rotate - alpha)*dis;
		}
		return [dx+this.mctX, dy+this.mctY];
	},
	
	moveDelta: function(dx, dy) {
		if (this.view.moveLock)
			return;
		dx *= this.ratio, dy *=this.ratio;
		var aw = this.mctUpper;
		var rate = 1 / this.scale;

		if (this.bbox && this.bbox[this.z]) {
			var bb = this.bbox[this.z];
			var sz = this.calcSize();
			sz[0]/=2,sz[1]/=2;
			var tddx = dx * rate, tddy = dy * rate;
			var cbb = [this.mctX -sz[0], this.mctX +sz[0], this.mctY - sz[1], this.mctY + sz[1]];
			var wbb = [cbb[0] - tddx, cbb[1] - tddx, cbb[2] - tddy, cbb[3] - tddy];
			wbb = GeoUtils.rect_intersect(wbb, bb), cbb = GeoUtils.rect_intersect(cbb, bb);
			var a1 = GeoUtils.rect_get_area(cbb), a2 = GeoUtils.rect_get_area(wbb);
			if (a1 > a2) return;
		}

		this.x += dx, this.y += dy;
		dx *= rate, dy *= rate;
		if (this.rotate) {
			this.mctX -= dx*this.cos0 + dy*this.sin0;
			this.mctY += dx*this.sin0 - dy*this.cos0;	
		} else {
			this.mctX -= dx;
			this.mctY -= dy;
		}
		
		if (this.mctX > aw) this.mctX -= aw;
		else if (this.mctX < 0) this.mctX += aw;


		this.fixToMercator();
		this.view.queryDatasource();

		if (!this._moving) {
			this.listenerNotify("movebegin");
			this._moving = true;
		}	
		this.listenerNotify("move");
	},

	zoomDelta: function(delta,point) {
		if (this.view.zoomLock || delta == 0)
			return;

		var ns = this.scale * Math.pow(2, delta), nz = this.z + delta;
		if (nz >= this.maxZ) {
			ns = Math.pow(2,this.maxZ-this.z)*this.ratio;
		}
		if (nz <= this.minZ) {
			ns = Math.pow(2,this.minZ-this.z)*this.ratio;
		}
		if (ns == this.scale) return;

		var os = this.scale, rate = ns / this.ratio;
		this.scale = ns;
		if (point) {			
			var or = 1/os - 1/this.scale;
			var x, y, dx = point.x*this.ratio - this.halfWidth, dy = point.y*this.ratio - this.halfHeight;
			if (this.rotate) {
				x = (dx*this.cos0 + dy*this.sin0)*or;
				y = (-dx*this.sin0 + dy*this.cos0)*or;
			} else {
				x = dx*or;
				y = dy*or;
			}
			this.mctX += x;
			this.mctY += y;
		}
		
		while (rate >= 1.5) {
			this.mctUpper <<= 1;
			this.scale /= 2;			
			this.mctX *= 2;
			this.mctY *= 2;
			++this.z;	
			rate /= 2;
		} 
		while (rate < 0.75) {
			this.mctUpper >>= 1;
			this.scale *= 2;
			this.mctX /= 2;
			this.mctY /= 2;
			--this.z;
			rate *= 2;
		} 

		this.fixToMercator(true);
		this.view.queryDatasource();

		if (!this._zooming) {
			this.listenerNotify("zoombegin");
			this._zooming = true;
		}
		this.listenerNotify("zoom");
	},
	
	rotateDelta: function(delta) {
		if (this.view.rotateLock || delta == 0)
			return;

		var cx = this.halfWidth, cy = this.halfHeight;
		var ox = cx-this.x, oy = cy-this.y;
		var cos0=Math.cos(delta), sin0=Math.sin(delta);
		this.rotate+=delta;
		if (this.rotate > M_2PI) this.rotate-=M_2PI;
		else if (this.rotate < 0) this.rotate+=M_2PI;

		if (-1e-2 <= this.rotate && this.rotate<=1e-2) {
			delta -= this.rotate;
			this.rotate = this.sin0 = 0, this.cos0 = 1;
			cos0=Math.cos(delta), sin0=Math.sin(delta);
		} else {
			this.cos0=Math.cos(this.rotate);
			this.sin0=Math.sin(this.rotate);
		}

		this.x = cx-ox*cos0+oy*sin0;
		this.y = cy-ox*sin0-oy*cos0;
		
		this.view.queryDatasource();

		if (!this._rotating) {
			this.listenerNotify("rotatebegin");
			this._rotating = true;
		}
		this.listenerNotify("rotate");
	},

	tiltDelta: function(dt) {
		if (this.view.tiltLock)
			return;
		var ndt =this.tilt + dt;
		if (ndt >= -1e-2) ndt = 0;
		if (ndt < -M_PI/4) ndt = -M_PI/4;

		this.tilt = ndt;
		// dx *= this.ratio, dy *=this.ratio;
		// var aw = this.mctUpper;
		// var rate = 1 / this.scale;

		// if (this.bbox && this.bbox[this.z]) {
		// 	var bb = this.bbox[this.z];
		// 	var sz = this.calcSize();
		// 	sz[0]/=2,sz[1]/=2;
		// 	var tddx = dx * rate, tddy = dy * rate;
		// 	var cbb = [this.mctX -sz[0], this.mctX +sz[0], this.mctY - sz[1], this.mctY + sz[1]];
		// 	var wbb = [cbb[0] - tddx, cbb[1] - tddx, cbb[2] - tddy, cbb[3] - tddy];
		// 	wbb = GeoUtils.rect_intersect(wbb, bb), cbb = GeoUtils.rect_intersect(cbb, bb);
		// 	var a1 = GeoUtils.rect_get_area(cbb), a2 = GeoUtils.rect_get_area(wbb);
		// 	if (a1 > a2) return;
		// }

		// this.x += dx, this.y += dy;
		// dx *= rate, dy *= rate;
		// if (this.rotate) {
		// 	this.mctX -= dx*this.cos0 + dy*this.sin0;
		// 	this.mctY += dx*this.sin0 - dy*this.cos0;	
		// } else {
		// 	this.mctX -= dx;
		// 	this.mctY -= dy;
		// }
		
		// if (this.mctX > aw) this.mctX -= aw;
		// else if (this.mctX < 0) this.mctX += aw;

		this.fixToMercator();
		this.view.queryDatasource();

		if (!this._tilting) {
			this.listenerNotify("tiltbegin");
			this._tilting = true;
		}	
		this.listenerNotify("tilt");
	},

	lengthInScreen: function(l) {
		return l/this.ratio*this.scale/(TK_EARTH_PERIMETER/(1<<(this.z+8)) * Math.cos(this.lat*M_RPD));
	},
	setViewport: function(lon1, lon2, lat1, lat2) {
		var sw = ll2mct(lon1, lat1, 23), 
			ne = ll2mct(lon2, lat2, 23);
		var dx = Math.log( (ne[0] - sw[0]) * this.ratio / (this.width - 20) ) / M_LOG2, 
			dy = Math.log( (sw[1] - ne[1]) * this.ratio / (this.height - 20)) / M_LOG2;
		var zv = 23 - (dx > dy? dx: dy);

		if (zv < this.minZ) zv = this.minZ;
		else if (zv > this.maxZ) zv = this.maxZ;

		this.lon = (lon1+lon2)/2, this.lat = (lat1+lat2)/2;
		this.z = Math.round(zv);
		this.fixToLonlat();	
		this.zoomDelta(this.z - zv);
		this.listenerNotify("moveend");
		this.listenerNotify("zoomend");
	},
	setZoom: function(val) {
		val |= 0;
		if (this.z != val && this.minZ <= val && val <= this.maxZ) {
			var aa = mct2ll(this.mctX, this.mctY, this.z);
			this.lon = aa[0], this.lat = aa[1];
			this.z = val;
			this.fixToLonlat();	
			this.listenerNotify("zoomend");
		}
	},
	setZoomUpper: function(val) {
		if (val < this.z) 
			this.setZoom(val);
		this.maxZ = val;
	},
	setZoomLower: function(val) {
		if (val > this.z) 
			this.setZoom(val);
		this.minZ = val;
	},
	setBorderBounds: function(bd) {
		this.bounds = bd;
		this.bbox = [];
		for (var i = 0, p1, p2; i < 20; ++i) {
			p1 = ll2mct(bd.ne.lon, bd.ne.lat, i);
			p2 = ll2mct(bd.sw.lon, bd.sw.lat, i);
			this.bbox.push([p2[0],p1[0], p1[1],p2[1]]);
		}
	},
};
extendsFrom(tkMapMode, tkEventTarget);



/********************************
  *	class tkDataPool			 *
  ********************************/
function viewsUpdater(){
	var views = TMapEngine.mapViews;
	for (var i = views.length-1; i >= 0; --i)
		views[i].refreshMap();
}

function tkDataPool() {
	this.cache = new tkLRUCache(900);	//风格化后的数据
	this.scache = new tkLRUCache(900);	//源数据

	this.cache.delFunc = function(obj){
		if (obj && obj.tex && obj.tex.gl) {
			obj.tex.gl.deleteTexture(obj.tex);
			delete obj.tex;
		}
	}
	
	tssh(this, viewsUpdater);	
}

tkDataPool.prototype = {
	get: function(key, justCheck) {
		return this.cache.get(key, justCheck);
	},
	setObject: function(res) {
		if (res.key != null) {
			this.scache.setObject(res);
		}
	},
	setTile: function(res) {
		if (res.key != null) {
			this.cache.setObject(res);
		}	
	},
	setRequestTiles: function(rts) {
		var rqts = [];
		var messager = rts[0].layer instanceof TMap.Layer.LayerVector? this.tssh.gMsg: this.tssh.grMsg;
		
		for (var i = 0, r = rts[0]; r; r = rts[++i]) {
			if (messager.XHR && r.okey) {	
				var srcdat = this.scache.get(r.okey);
				if (srcdat != null) {
					srcdat = TMapEngine.styler._styling(srcdat, r.layer, r.z);
					this.setTile(srcdat);
					continue;
				} else {
					r.key = r.okey;
				}
			} 	
		
			rqts.push(r);
		}

		if (rqts.length > 0) {
			rqts.needDraw = rts.needDraw;
			rqts.queryIndex = rts.queryIndex;
			messager.setTaskQueue(rqts);
		} else {
			viewsUpdater();
		}
	},
	clearTiles: function(filter) {
		if (filter) {
			this.cache.filtObjects(filter);
		} else {
			this.cache.clear();
		}
	},
	updateTiles: function(func) {
		this.cache.replaceObjects(func);
	},
};


function ensureResize(obj){
	var actualResizeHandler = function () {
		obj.fitContainerSize();
	}, viewResizeAction= function() {
		if ( !obj.resizeTimeout ) {
			obj.resizeTimeout = setTimeout(function() {
				obj.resizeTimeout = null;
				actualResizeHandler();
			}, 66);
		}
	};
	
	window.addEventListener("resize", viewResizeAction);
}

function touches(obj,view){
	var defaults = {touching:false, ox:0, oy:0, nx:0, ny:0, lx:0, ly:0};

	var touchUpdateHandle = null;
	obj.on("touchstart",function() {
		defaults.lx = event.targetTouches[0].pageX;
		defaults.ly = event.targetTouches[0].pageY;
		defaults.nx = defaults.lx;
		defaults.ny = defaults.ly;
		if (event.targetTouches > 1) {
			defaults.num = 2;
		}
		// defaults.touching = true;
		view.onDrawFrame(0);
		touchUpdateHandle = setInterval(function (){
			if (defaults.button) {
				view.onDrawFrame();
				view.onDrawFrame(0);
			}
		}, 250);
	});
	obj.on("touchmove",function() {
		event.preventDefault();
		defaults.nx = event.targetTouches[0].pageX;
		defaults.ny = event.targetTouches[0].pageY;

		view.mapMode.moveDelta(defaults.nx - defaults.lx,
								defaults.ny - defaults.ly); 
		view.onDrawFrame(1);	

		defaults.lx = defaults.nx,defaults.ly = defaults.ny;
	});

	obj.on("touchend",function() {
		// defaults.touching = false;
		clearInterval(touchUpdateHandle);
	});
}

function mouses(obj,view) {
	var defaults = {x:0, y:0, // 当前鼠标位置
		lx:0, ly:0, // 上次鼠标的位置
		tick:0,
		button:0, dragMove:false};
	
	var mousedownUpdateHandle = null;
	obj.mousedown(function(event) {
		if (event.target.tagName.toLowerCase() != "canvas")
			return;

		defaults.x=defaults.lx=event.offsetX,
		defaults.y=defaults.ly=event.offsetY;
		defaults.button = 1;
		defaults.tick = Date.now();
		view.onDrawFrame(0);

		view.daemon.pause();

		if (view.geoPicker) {
			view.geoPicker.mousedown_proc && view.geoPicker.mousedown_proc(defaults);
		} else {
			mousedownUpdateHandle = setInterval(function (){
				if (defaults.button) {
					view.onDrawFrame();
					view.onDrawFrame(0);
				}
			}, 250);	
		}
	});

	var mouseupFunc;
	obj.mouseup(mouseupFunc = function(event) {
		var tick = Date.now() - defaults.tick;
		defaults.button = 0;
		defaults.tick = 0;
		view.dragging = false;
		view.daemon.start(true);

		clearInterval(mousedownUpdateHandle);
		mousedownUpdateHandle = null;

		if (view.geoPicker) {
			view.geoPicker.mouseup_proc && view.geoPicker.mouseup_proc(defaults);
			if (view.geoPicker && view.geoPicker.click_proc && tick <= 400 && event.target.tagName.toLowerCase() == "canvas") {
				var pt = view.mapMode.lonlatAtPoint(defaults.x, defaults.y);
				view.geoPicker.click_proc(pt);
			}
			return;
		}

		if (tick <= 400 && event.target.tagName.toLowerCase() == "canvas") {
			var pt = view.mapMode.lonlatAtPoint(defaults.x, defaults.y);
			view.onClick(pt);
		}
		
		if (defaults.dragMove) {
			defaults.dragMove = false;	
			view.mapMode.listenerNotify("moveend");
		}
		view.onDrawFrame();
	});

	obj.mouseout(function(event) {
		if (!event.target.class !='tkm-map-')
		if (view.geoPicker == null) {
			defaults.button = 0;
			view.dragging = false;
			view.onDrawFrame();	
		}
	});

	obj.mousemove(function(event) {
		defaults.lx = defaults.x, defaults.ly = defaults.y;
		defaults.x = event.offsetX, defaults.y = event.offsetY;
		if (view.geoPicker) {
			view.geoPicker.mousemove_proc && view.geoPicker.mousemove_proc(defaults);
		} else if (event.buttons) {
			if (defaults.button) {
				view.mapMode.moveDelta(defaults.x - defaults.lx,
										defaults.y - defaults.ly);
				view.dragging = true;
				view.onDrawFrame(1);
				defaults.dragMove = true;
				// view.refreshMap();
			}
		} else {
			if (defaults.button) 
				mouseupFunc(event);
			view.labelCanvas.highlightPOILabel(defaults);
		}
	});

	// var scrollDefaults = {delay: 0, handle: null, delta: 0, type: null};
	// var scrollFunc = function(event) {
	// 	if (event.target.className.substr(0,8) != "tkm-map-")
	// 		return;
	// 	var t = Date.now(), e = event || window.event;
	// 	var value = e.wheelDelta || -150 * e.detail;
	// 	scrollDefaults.delta += value;
		
	// 	if (e.ctrlKey) {
	// 		e.returnValue = false;
	// 	}
		
	// 	if (scrollDefaults.handle == null) {
	// 		if (e.altKey && view.scrollWheelZoom) 	
	// 			scrollDefaults.type = "rotate";
	// 		else if (!e.altKey && view._scrollWheelZooming) 
	// 			scrollDefaults.type = "zoom";
			
	// 		if (scrollDefaults.type) {
	// 			view.daemon.pause();
	// 			view.lastDrawTick = 0;
	// 			view.onDrawFrame();
	// 			view.onDrawFrame(0);
	// 		}
	// 	} else 
	// 		clearTimeout(scrollDefaults.handle);

	// 	scrollDefaults.handle = setTimeout(scrollEndFunc, 200);

	// 	var rate = env.edge? 8: 1;
	// 	if (t - scrollDefaults.delay > view.benchmark.average*rate) { //  200
	// 		scrollDefaults.delay = t;
	// 	} else return;

	// 	if (scrollDefaults.delta) {
	// 		var sgn = scrollDefaults.delta>0? 1: -1;
	// 		scrollDefaults.delta = sgn*Math.log(sgn*scrollDefaults.delta)/10;

	// 		if (scrollDefaults.type == "rotate") {
	// 			view.mapMode.rotateDelta(scrollDefaults.delta);	
	// 		} else if (scrollDefaults.type == "zoom") {
	// 			view.mapMode.zoomDelta(scrollDefaults.delta, getEventPointInElement(e, view.mapsv[0]));
	// 		}

	// 		if (scrollDefaults.type) {
	// 			view.onDrawFrame(1);
	// 			view.queryDatasource();
	// 		}
	// 		scrollDefaults.delta = 0;
	// 	}
	// }, 
	// scrollEndFunc = function() {
	// 	scrollDefaults.handle = null;
	// 	view.daemon.start(true);
	// 	scrollDefaults.delta = 0;
	// 	view.onDrawFrame();
	// 	view.onDrawFrame(0);
	// 	if (scrollDefaults.type) {
	// 		view.mapMode.listenerNotify(scrollDefaults.type + "end");
	// 		scrollDefaults.type = null;	
	// 	}
	// };



	var scrollDefaults = {delay: 0, handle: null, delta: 0, type: null};
	var scrollFunc = function(event) {
		if (event.target.className.substr(0,8) != "tkm-map-")
			return;
		var t = Date.now(), e = event || window.event;
		var value = e.wheelDelta || -150 * e.detail;
		scrollDefaults.delta += value;
		
		if (e.ctrlKey) {
			e.returnValue = false;
		}
		
		if (scrollDefaults.handle == null) {
			if (e.altKey && view._scrollWheelZooming) 	
				scrollDefaults.type = "rotate";
			else if (e.shiftKey && !e.altKey && view._scrollWheelZooming) 
				scrollDefaults.type = "tilt";
			else if (!e.altKey && !e.shiftKey && view._scrollWheelZooming) 
				scrollDefaults.type = "zoom";

			if (scrollDefaults.type) {
				view.daemon.pause();
				view.lastDrawTick = 0;
				view.onDrawFrame();
				view.onDrawFrame(0);
			}
		} else 
			clearTimeout(scrollDefaults.handle);

		scrollDefaults.handle = setTimeout(scrollEndFunc, 200);

		var rate = env.edge? 8: 1;
		if (t - scrollDefaults.delay > view.benchmark.average*rate) { //  200
			scrollDefaults.delay = t;
		} else return;

		if (scrollDefaults.delta) {
			var sgn = scrollDefaults.delta>0? 1: -1;
			scrollDefaults.delta = sgn*Math.log(sgn*scrollDefaults.delta)/10;

			if (scrollDefaults.type == "rotate") {
				view.mapMode.rotateDelta(scrollDefaults.delta);	
			} else if (scrollDefaults.type == "zoom") {
				view.mapMode.zoomDelta(scrollDefaults.delta/2, getEventPointInElement(e, view.mapsv[0]));
			}  else if (scrollDefaults.type == "tilt") {
				view.mapMode.tiltDelta(scrollDefaults.delta/2);
				// view.mapMode.zoomDelta(scrollDefaults.delta/2, getEventPointInElement(e, view.mapsv[0]));
			}

			if (scrollDefaults.type) {
				view.onDrawFrame(1);
				// view.onDrawFrame();
				view.queryDatasource();
			}
			scrollDefaults.delta = 0;
		}
	}, 
	scrollEndFunc = function() {
		scrollDefaults.handle = null;
		view.daemon.start(true);
		scrollDefaults.delta = 0;
		view.onDrawFrame();
		view.onDrawFrame(0);
		if (scrollDefaults.type) {
			view.mapMode.listenerNotify(scrollDefaults.type + "end");
			scrollDefaults.type = null;	
		}
	};

	if (document.addEventListener) {
		document.addEventListener("DOMMouseScroll", scrollFunc, false);
	}
	window.onmousewheel = document.onmousewheel = scrollFunc;
}

function getSpecifiedViewOffset(element) {
	var pt = {x: element.offsetLeft, y: element.offsetTop}, parent = element.offsetParent;
	while (parent != document.body && parent) {
		pt.x += parent.offsetLeft, pt.y += parent.offsetTop;
		parent = parent.offsetParent;
	}
	return pt;
}

function getEventPointInElement(event, element) {
	var pt = {x: event.pageX, y: event.pageY};
	var ox = element.offsetLeft, oy = element.offsetTop, parent = element.offsetParent;
	while (parent != document.body && parent) {
		ox += parent.offsetLeft, oy += parent.offsetTop;
		parent = parent.offsetParent;
	}
	pt.x -= ox, pt.y -= oy;
	return pt;
}

function addLocatingEvent(view) {
	if (!navigator.geolocation) 
		return;
	var getPositionSuccess = function(position) {
		view.locationMark.style.display = "block";
		view.mapMode.locateLat = position.coords.latitude;
		view.mapMode.locateLon = position.coords.longitude;
	},
	getPositionError = function(error) {
		view.locationMark.style.display = "none";
	};
	
	navigator.geolocation.watchPosition(getPositionSuccess, getPositionError);
}

function getPixelRatio(c) {
	var backingStore = c.backingStorePixelRatio ||
	c.webkitBackingStorePixelRatio ||
	c.mozBackingStorePixelRatio ||
	c.msBackingStorePixelRatio ||
	c.oBackingStorePixelRatio || 1;
	return (window.devicePixelRatio || 1) / backingStore;
};

function deg2string(deg) {
	var t = Math.floor(deg);
	var text = t+"°", min = 60*(deg-t);
	t=Math.floor(min), min-=t;
	text+=t+"'";
	text+=(Math.floor(min*600)/10)+"\"";
	return text;
}
function humanDistance(meter) {
	if (meter>=1000)
		return (meter/1000)+"千米";
	return meter+"米";
}

function hrArea(meter) {
	if (meter>=1e6)
		return (meter/1e6).toFixed(2)+"平方千米";
	return meter.toFixed(2)+"平方米";
}
function hrDistance(meter) {
	if (meter>=1000)
		return (meter/1000).toFixed(2)+"千米";
	return meter.toFixed(2)+"米";
}


////////////////////////////////////////////////////////
function tkMapPicker(m,v,t) {
	this.points = [];
	this.Map = m;
	this.type = t;
	this.view = v;

	if (t == null) t = "free";

	this.mousedown_proc = tkMapPicker["mdp_"+t];
	this.mousemove_proc = tkMapPicker["mmp_"+t];
	this.mouseup_proc = tkMapPicker["mup_"+t];
	this.exit_proc = tkMapPicker["ep_"+t];

	this.rate = this.view.mapMode.ratio;
	this.view.annotationCanvas.context.setTransform(this.rate, 0, 0, this.rate, 0, 0);
	this.view.annotationCanvas.show();
}
tkMapPicker.prototype.exit = function() {
	return this.exit_proc();
}
////////////////////////////////////////////////////////
tkMapPicker.mdp_free = function(defaults) {
	this.points.push({x: defaults.x, y: defaults.y, headmark: 1});
	var vr = this.view.annotationCanvas.context;
	vr.beginPath();
	vr.strokeStyle = "red";
	vr.lineWidth = 4;
	vr.moveTo(defaults.x, defaults.y);
}
tkMapPicker.mmp_free = function(defaults) {
	if (defaults.button && this.points.length > 0) {
		var pt = this.points[this.points.length-1]
		if (defaults.x != pt.x || defaults.y != pt.y) {
			this.points.push({x: defaults.x, y: defaults.y});
			var vr = this.view.annotationCanvas.context;
			vr.lineTo(defaults.x, defaults.y);
			vr.stroke();		
		}	
	}
}
tkMapPicker.mup_free = function(defaults) {}
tkMapPicker.ep_free = function() {
	var poly = null;
	if (this.points.length > 0) {
		var me = this.Map;
		poly = new TMap.Polyline(this.points.map(function(e){
			var pt = me.pixelToPoint(e);
			$.extend(pt, e);
			return pt;
		}));
	}
	return poly;
}

////////////////////////////////////////////////////////
tkMapPicker.mdp_circle = function(defaults) {
	this.points.push({x: defaults.x, y: defaults.y, headmark: 1});

	if (this.result_circle == null) {
		var r = 1;
		this.circle_mask=$("<div>").addClass("tkm-map-mask").css({"border-radius": "1px",left: (defaults.x-r)+"px", top: (defaults.y-r)+"px", width:(r*2)+"px", height:(r*2)+"px"});
		this.view.mapsv.append(this.circle_mask);
	}
}
tkMapPicker.mmp_circle = function(defaults) {
	if (defaults.button && this.points.length == 1) {
		var pt = this.points[0];
		var dx=defaults.x-pt.x,dy=defaults.y-pt.y;
		var r = (Math.sqrt(dx*dx+dy*dy) - 4) | 0;
		if (r <= 0) r = 2;
		this.circle_mask.css({"border-radius": r+"px", left: (pt.x-r)+"px", top: (pt.y-r)+"px", width:(r*2)+"px", height:(r*2)+"px"});
	}
}
tkMapPicker.mup_circle = function(defaults) {
	if (this.points.length == 1) {
		this.points.push({x: defaults.x, y: defaults.y});

		var me = this.Map;
		var pt = me.pixelToPoint(this.points[0]), pt2, dis;

		pt2 = me.pixelToPoint(this.points[1]);
		dis = pt.distance(pt2);
		
		this.result_circle = new TMap.Circle(me.pixelToPoint(this.points[0]), dis);

		if (this.autoExit) {
			this.autoExit(me);
		}
	}
}
tkMapPicker.ep_circle = function() {
	var poly = null;
	if (this.result_circle) {
		poly = this.result_circle;
	} else if (this.points.length > 0) {
		var me = this.Map;
		var pt = me.pixelToPoint(this.points[0]), pt2, dis;
		if (this.points.length > 1) {
			pt2 = me.pixelToPoint(this.points[1]);
			dis = pt.distance(pt2);
		} else {
			var pp = this.points[0];
			pt2= {x: pp.x, y: pp.y+5};
			dis = pt.distance(me.pixelToPoint(pt2));
		}

		poly = new TMap.Circle(me.pixelToPoint(this.points[0]), dis);
	}
	this.circle_mask && this.circle_mask.detach();
	return poly;
}

////////////////////////////////////////////////////////
tkMapPicker.mdp_rectangle = function(defaults) {
	this.points.push({x: defaults.x, y: defaults.y, headmark: 1});

	if (this.result_rectangle == null) {
		this.rectangle_mask = $("<div>").addClass("tkm-map-mask")
										.css({
											left: (defaults.x)+"px", 
											top: (defaults.y)+"px", 
											width: "2px", 
											height: "2px"
										});
		this.view.mapsv.append(this.rectangle_mask);
	}
}
tkMapPicker.mmp_rectangle = function(defaults) {
	if (defaults.button && this.points.length == 1) {
		var pt = this.points[0];
		var dx = defaults.x - pt.x, dy = defaults.y - pt.y;
		
		this.rectangle_mask.css({
			left: (dx >= 0? pt.x: pt.x+dx)+"px", 
			top: (dy >= 0? pt.y: pt.y+dy)+"px", 
			width: Math.abs(dx)+"px", 
			height: Math.abs(dy)+"px"
		});
	}
}
tkMapPicker.mup_rectangle = function(defaults) {
	if (this.points.length == 1) {
		var pts = [], me = this.Map, ptscr = {x: defaults.x, y: defaults.y};
		this.points.push(ptscr);

		pts.push(me.pixelToPoint(ptscr));
		
		ptscr.y = this.points[0].y;
		pts.push(me.pixelToPoint(ptscr));
		
		ptscr.x = this.points[0].x;
		pts.push(me.pixelToPoint(ptscr));

		ptscr.y = defaults.y;
		pts.push(me.pixelToPoint(ptscr));

		this.result_rectangle = new TMap.Polygon(pts);

		if (this.autoExit) {
			this.autoExit(me);
		}
	}
}
tkMapPicker.ep_rectangle = function() {
	var poly = null;
	if (this.result_rectangle) {
		poly = this.result_rectangle;
	} else if (this.points.length > 0) {
		// var me = this.Map;
		// var pt = me.pixelToPoint(this.points[0]), pt2, dis;
		// if (this.points.length > 1) {
		// 	pt2 = me.pixelToPoint(this.points[1]);
		// 	dis = pt.distance(pt2);
		// } else {
		// 	var pp = this.points[0];
		// 	pt2= {x: pp.x, y: pp.y+5};
		// 	dis = pt.distance(me.pixelToPoint(pt2));
		// }

		// poly = new TMap.Circle(me.pixelToPoint(this.points[0]), dis);
	}
	this.rectangle_mask && this.rectangle_mask.detach();
	return poly;
}
////////////////////////////////////////////////////////






	// TMap class
/**
 * MapOptions 此类作为map.getViewport与map.setViewport方法的可选参数，不可实例化。
 * 
 * @class	MapOptions
 *
 * @namespace TMap
 *
 */

/** 
 * 地图的容器
 * 
 * @property {string | HTMLElement} container
 */

/**
 * @property {number}  players       - The default number of players.
 * @property {string}  level         - The default level for the party.
 * @property {object}  treasure      - The default treasure.
 * @property {number}  gold - How much gold the party starts with.
 */

/**
 *	TMap地图视图主类
 * 
 *	@class Map
 *	@constructor 
 *	@namespace TMap
 *	@param {MapOptions} options - 地图选项
 */	
TMap.Map = function(param) {
	if (!TMapEngine._initialized) {
		tkMapEngine(param? param.engineOption: null);
	}
	if (param.container == null) 
		return;

	if (typeof param.container == "string") {
		param.container = document.getElementById(param.container);
	} 
	
	this.view = new tkMapView(param);
	this.view._map = this;
};

TMap.Map.func_press_for_measure = function(pt) {
	if (pt == null) {
		if (this.measureTip) {
			this.measureTip._removeFromView();
			this.measureTip = null;	
		} 
		if (this._messureOverlay) {
			var idx = this.overlays.indexOf(this._messureOverlay);
			this.overlays.splice(idx, 1);
			this._messureOverlay = null;
			this.refreshMap();	
		}
		
		if (this.mapPinArray) {
			for (var i = 0, l = this.mapPinArray.length; i < l; ++i) {
				this.mapPinArray[i]._removeFromView(this);
			}
			this.mapPinArray = null;
		}
		return;
	}

	var self = this, overlay;
	if (this._messureOverlay == null) {
		this._messureOverlay = new TMap.Polyline([]);
		this._messureOverlay._addToView(this);
		this.overlays.push(this._messureOverlay);

		this.measureTip = new TMap.InfoWindow();
		this.measureTip._addToView(this);
		this.measureTip.hide();
	}
		
	overlay = self._messureOverlay;
	overlay.addPoint(pt);

	var txt = hrDistance(overlay.getLength());
	this.measureTip.text(txt);

	if (this.mapPinArray == null)
		this.mapPinArray = [];
	var pin = new TMap.Marker(pt);
	pin.setImage("img/node.png");
	pin._addToView(this);
	pin.click(function(e) {
		self.measureTip.text(txt);
		self.measureTip.setPoint(pt);
		self.measureTip.update();
	});
	this.mapPinArray.push(pin);

	this.measureTip.show();
	this.measureTip.setPoint(pt);
	this.measureTip.update();
	this.refreshMap();
};
TMap.Map.func_press_for_measure_area = function(pt) {
	if (pt == null) {
		if (this.measureTip) {
			this.measureTip._removeFromView();
			this.measureTip = null;	
		} 

		if (this._messureOverlay) {
			var idx = this.overlays.indexOf(this._messureOverlay);
			this.overlays.splice(idx, 1);
			this._messureOverlay = null;
			this.refreshMap();	
		}

		if (this.mapPinArray) {
			for (var i = 0, l = this.mapPinArray.length; i < l; ++i) {
				this.mapPinArray[i]._removeFromView(this);
			}
			this.mapPinArray = null;
		}
		return;
	}

	var self = this, overlay;
	if (this._messureOverlay == null) {
		this._messureOverlay = new TMap.Polygon([]);
		this._messureOverlay._addToView(this);
		this.overlays.push(this._messureOverlay);

		this.measureTip = new TMap.InfoWindow();
		this.measureTip._addToView(this);
		this.measureTip.hide();
	}
	overlay = this._messureOverlay;
	overlay.addPoint(pt);

	var s = TMap.GeoUtils.getPolygonArea(overlay);
	this.measureTip.text(hrArea(s));

	this.measureTip.show();
	this.measureTip.setPoint(pt);
	this.measureTip.update();
	this.refreshMap();
}

TMap.Map.func_press_for_pin_mark = function(pt) {
	if (pt == null) {
		if (this.mapPinArray) {
			for (var i = 0, l = this.mapPinArray.length; i < l; ++i) {
				this.mapPinArray[i]._removeFromView(this);
			}
		}
		this.mapPinArray = null;
		return;
	}

	if (this.mapPinArray == null) {
		this.mapPinArray = [];
	}

	var pin = new TMap.Bubble(pt);
	pin._addToView(this);
	this.mapPinArray.push(pin);
	var no = this.mapPinArray.length;

	pin.click(function(){
		alert(no);
	});
	pin.setStyle(no%6);
}

TMap.Map.func_press_for_query = function(pt) {
	if (pt == null) {
		this.clearBoldFeature();
		if (this.featureTip) {
			this.featureTip._removeFromView();
			this.featureTip = null;
			this.refreshMap();	
		} 
		return;
	}

	var point = this.mapMode.pixelAtLonlat(pt[0], pt[1]);
	point.x /= this.mapMode.ratio;
	point.y /= this.mapMode.ratio;
	var ft = this.featureAtPoint(point);

	this.featureTip && this.featureTip._removeFromView();
	if (ft) {
		this.featureTip = new TMap.InfoWindow();
		this.featureTip._addToView(this);
		this.featureTip.text(ft[3] || "无名要素");
		this.featureTip.setPoint(pt);
		this.featureTip.update();

		var featip = this.featureTip;
		var url = TMap.domain + "/detail/query?at=dt&v=1&c_x="+pt[0]+"&c_y="+pt[1]+"&tn=horae&tp="+((ft[0]>>1)+1)+"&name="+(ft[3] || "");
		$.ajax({
			type: "GET",
			url: url,
			timeout: 10000,
			dataType: "json",
			success: function(data, textStatus, jqXHR) {
				var arr = [], kkarr;
				for (var k in data) {
					kkarr = k.split('_');
					if (kkarr.length < 2) 
						continue;
					arr.push([parseInt(kkarr.pop()), kkarr.join("_"), data[k]]);
				}
				arr.sort(function (a,b){return a[0]-b[0];});
				var i, table = $("<table>").css({"border-collapse":"collapse","border-spacing":0,"border-left":"1px solid #888","border-top":"1px solid #888"});
				var tdcss = {"border-right":"1px solid #888","border-bottom":"1px solid #888",padding:"2px 2px"};
				for (i = 0; i < arr.length; ++i) {
					table.append($("<tr>").append($("<td>").css(tdcss).text(arr[i][1]),$("<td>"), $("<td>").css(tdcss).text(arr[i][2])));
				}
				var box, boxHeight;
				featip.contentBox.append(box = $("<div>").css({width: 120, overflow: "scroll"}).
					append(table));
				boxHeight = table.height()+2;
				if (boxHeight > 300) boxHeight = 300;
				box.css({height: boxHeight});
				featip._resize(120+20, boxHeight + 40);
				featip.update();
				// console.log(arr.join(","));
			},
		});

		this.refreshMap();
	} else {
		this.featureTip = null;

		if (this._featurePicked)
			this.refreshMap();
	}

	this._featurePicked = ft;
}


	
TMap.Map.prototype = {
	/**
	 *	获取地图尺寸
	 *	@method getSize
	 *	@return {Size} - 地图尺寸
	 */
	getSize: function() {
		var mm = this.view.mapMode;
		return new TMap.Size(mm.width, mm.height);
	},

	/**
	 *	获取地图边界
	 *	@method getBounds
	 *	@return {Bounds} - 地图边界
	 */
	getBounds: function() {
		var bd = this.view.getBounds();
		// var sw = new TMap.Point(), ne = new TMap.Point(bd[1]);
		return new TMap.Bounds(bd[0], bd[1]);
	},

	/**
	 *	地图尺寸
	 *	@method pointToOverlayPixel
	 *	@return {Pixel}
	 */
	pointToOverlayPixel: function(pt) {
		var px = this.view.pointAtLonlat(pt.lon, pt.lat);
		return new TMap.Pixel(px[0], px[1]);
	},

	/**
	 *	移动中心点并缩放
	 * 
	 * @method centerAndZoom
	 * @param  {Point} pt 中心点经纬度
	 * @param  {number} z  缩放级别
	 */
	centerAndZoom:function(pt, z) {
		var map = this.view, mm = map.mapMode;
		mm.lon = pt.lon;
		mm.lat = pt.lat;
		mm.z = z;
		mm.fixToLonlat();
		mm.listenerNotify(["move","zoom"]);
		map.refreshMap();
	},
	/**
	 * 可以使用滚轮缩放
	 * @method enableScrollZooming
	 */
	enableScrollZooming: function() {
		this.view._scrollWheelZooming = true;
	},
	/**
	 * 禁用滚轮缩放
	 * @method disableScrollZooming
	 */
	disableScrollZooming: function() {
		this.view._scrollWheelZooming = false;
	},

	panTo:function(pt) {
		var map = this.view, mm = map.mapMode;
		mm.lon = pt.lon;
		mm.lat = pt.lat;
		mm.fixToLonlat();
		mm.listenerNotify("move");
		map.refreshMap();
	},
	/**
	 *	获取缩放级别
	 *	@method zoom
	 *	@return {number} 当前缩放级别
	 */
	zoom: function() {
		return this.view.mapMode.z;
	},
	/**
	 *	获取缩放级别
	 *	@method getZoom
	 *	@return {number} 当前缩放级别
	 */
	getZoom: function() {
		return this.view.mapMode.z;
	},
	/**
	 *	设置缩放级别
	 *	@method setZoom
	 *	@param {number} zoom - 设置缩放级别
	 */
	setZoom:function(z) {
		var map = this.view, mm = map.mapMode;
		mm.z = z;
		mm.fixToLonlat();
		mm.listenerNotify("zoom");
		map.refreshMap();
	},
	/**
	 *	设置地图中心
	 *	@method setCenter
	 *	@param {Point} pt 	地图中心点经纬度
	 */
	setCenter: function() {
		var vm = this.view;
		var mm = this.view.mapMode;
		var x = null, y;
		if (arguments.length == 2) {
			x = arguments[0];
			y = arguments[1];
		} else if (arguments.length == 1) {
			var pt = arguments[0];
			if (pt.lon != null && pt.lat != null) {
				x = pt.lon, y = pt.lat;
			} else if (pt instanceof Array && pt.length == 2) {
				x = pt[0], y = pt[1];
			} 
		}

		if (x != null) {
			mm.lon = x, mm.lat = y;
			mm.fixToLonlat();
			mm.listenerNotify("move");
			vm.refreshMap();
		}
	},
	/**
	 * 获取地图中心经纬度
	 * @method getCenter
	 * @return {Point} 地图中心经纬度
	 */
	getCenter: function() {
		var mm = this.view.mapMode;
		return new TMap.Point(mm.lon, mm.lat);
	},
	/**
	 * 获取地图缩放最大级别
	 * @method maxZoom
	 * @return {number}	地图缩放最大级别
	 */
	maxZoom: function() {
		return this.view.mapMode.maxZ;
	},
	/**
	 * 设置地图缩放最大级别
	 * @method setMaxZoom
	 * @param {number} maxZoom
	 */
	setMaxZoom: function(z) {
		z |= 0;
		if (this.view.mapMode.minZ <= z && z <= 23) {
			if (this.view.mapMode.z > z) {
				this.setZoom(z);
			}
			this.view.mapMode.maxZ = z;
		}
	},
	/**
	 * 获取地图缩放最小级别
	 * @method minZoom
	 * @return {number}
	 */
	minZoom: function() {
		return this.view.mapMode.minZ;
	},

	/**
	 * 设置地图缩放最小级别
	 * @method setMinZoom
	 * @param {number} minZoom
	 */
	setMinZoom: function(z) {
		z |= 0;
		if (0 <= z <= this.view.mapMode.maxZ) {
			if (this.view.mapMode.z < z) {
				this.setZoom(z);
			}
			this.view.mapMode.minZ = z;
		}
	},

	/**
	 * 获取地图的显示限制边界
	 * @method getBorderBounds
	 * @return {TMap.Bounds}        地图的显示限制边界。无边界限制时返回null
	 */
	getBorderBounds: function() {
		return this.view.mapMode.bounds;
	},

	/**
	 * 设置地图的显示限制边界
	 * @method setBorderBounds
	 * @param {TMap.Bounds} bounds 地图的显示限制边界
	 */
	setBorderBounds: function(bounds) {
		this.view.mapMode.setBorderBounds(bounds);
	},

	enableDragging:function(){},

	/**
	 * 向地图中添加覆盖物
	 * @method addOverlay
	 * @param {Overlay} overlay 	待添加的覆盖物
	 * @param {boolean} silent	是否为静默添加。静默添加在不重绘地图时，覆盖物不会显示
	 */
	addOverlay: function(overlay, silent) {
		if (overlay._map) return;
		overlay._addToView(this.view);
		this.view.overlays.push(overlay);
		if (overlay._draw != null && !silent)
			this.view.onDrawFrame();
	},
	/**
	 * 从地图中移徐指定覆盖物
	 * @method removeOverlay
	 * @param  {Overlay} overlay 	待删除的覆盖物。该覆盖物须在之前添加到地图中。
	 * @param  {boolean =false} silent	是否为静默删除。静默删除在不重绘地图时，覆盖物不会消失
	 */
	removeOverlay: function(overlay, silent) {
		if (overlay._map != this) return;
		var idx = this.view.overlays.indexOf(overlay);
		if (idx >= 0) {
			this.view.overlays.splice(idx, 1);
			overlay._removeFromView();
		} else {
			for (var i = 0, l = this.view.overlays.length; i < l; ++i) {
				if (this.view.overlays[i]._id == overlay._id) {
					continue;
				}
			}
		}
		if (overlay._draw != null && !silent)
			this.view.onDrawFrame();
	},
	/**
	 * 清除所有覆盖物
	 * 
	 * @method clearOverlays
	 */
	clearOverlays: function() {
		for (var i = 0, overlay, l = this.view.overlays.length; i < l; ++i) {
			overlay = this.view.overlays[i];
			if (overlay && overlay._removeFromView) 
				overlay._removeFromView();
		}	
		this.view.overlays = [];
	},

	/**
	 * 添加事件监听器
	 *
	 * @method addEventListener
	 * @param {function} func 	事件的响应函数
	 * @param {string | Array<string> } events 	事件名称
	 * @return {number} 事件监听器的索引号
	 */
	addEventListener: function(func, events) {
		return this.view.mapMode.addListener(func, events);
	},

	/**
	 * 删除事件监听器
	 * 
	 * @method removeEventListener
	 * @param  {number | function}       listener 事件监听器索引号或者事件响应函数本身
	 * @return {number}                删除的事件响应器索引号。如果删除失败，则返回0
	 */
	removeEventListener: function(listener) {
		return this.view.mapMode.removeListener(listener);
	},

	/**
	 * 获取经纬度在屏幕上显示位置的像素坐标
	 * 
	 * @method pointToPixel
	 * @param  {Point}     pt 	指定的经纬度
	 * @return {Pixel}        经纬度对应的屏幕上的像素坐标
	 */
	pointToPixel: function(pt) {
		var ret = this.view.mapMode.pointAtLonlat(pt.lon,pt.lat);
		return new TMap.Pixel(ret[0]|0, ret[1]|0);
	},
	/**
	 * 获取屏幕上的像素坐标上的地图对应的经纬度
	 * 
	 * @method pixelToPoint
	 * @param  {Pixel}     px 屏幕上的像素坐标
	 * @return {Point}        经纬度
	 */
	pixelToPoint: function(px) {
		var ret = this.view.mapMode.lonlatAtPoint(px.x, px.y);
		return new TMap.Point(ret[0], ret[1]);
	},	

	/**
	 * 设置地图视图的视图窗口大小
	 * 
	 * @method setViewport
	 * @param  {TMap.Bounds}    bounds 地图视图大小的描述
	 */
	setViewport: function(bounds) {
		this.view.mapMode.setViewport(bounds.sw.lon, bounds.ne.lon, bounds.sw.lat, bounds.ne.lat);
		this.view.refreshMap();
	},

	getViewport: function() {

	},

	/**
	 * 获取地图图层序列
	 * 
	 * @method getLayers
	 * @return {Array <TMap.Layer>}  地图图层数组，下标低者位于图层下层，逐着下标的增长，图层不断上移
	 */
	getLayers: function() {
		return this.view.layers;
	},

	/**
	 * 获取地图的基础矢量图层
	 * @method getBasicLayer
	 * @return {TMap.Layer.LayerVector}      地图的基础矢量图层
	 */
	getBasicLayer: function() {
		return this.view.basicLayer;
	},
	/**
	 * 获取地图的卫星图层
	 * @method getImageLayer
	 * @return {TMap.Layer.LayerBase}      地图的卫星栅格图层
	 */
	getImageLayer: function() {
		return this.view.imageLayer;
	},

	/**
	 * 获取动态画布
	 * @method getDynamicCanvas
	 * @param  {number}         index 索引编号
	 * @return {TMap.Canvas.MapCanvasDynamic}             动态画布对象
	 */
	getDynamicCanvas: function(index) {
		for (var i = 0, l = this.view.layers.length; i < l; ++i) {
			if (this.view.layers[i] instanceof TMap.Canvas.MapCanvasDynamic) {
				if (index-- == 0) {
					return this.view.layers[i];
				}
			}
		}
		return null;
	},

	/**
	 * 进入绘制模式。绘制模式下，地图会被锁死，
	 * @method enterDrawMode
	 *
	 * @param {string} type 	绘制类型，可选值如下：
	 * * null	自由绘制
	 * * "circle"	画圆
	 * * "rectangle"	矩形框
	 * 
	 * @param {object} options 绘制选项
	 * - autoExit
	 *
	 * @example
	 *
	 * 		_map.enterDrawMode("rectangle", {
	 *	  		autoExit: function(map) {
	 *		   		var poly = map.exitDrawMode();
	 *		     	map.addOverlay(poly);
	 *	        },
	 *      });
	 */
	enterDrawMode: function(type, options) {
		this.lockMap();
		if (this.view.geoPicker == null) {
			this.view.geoPicker = new tkMapPicker(this, this.view, type);
			if (options) $.extend(this.view.geoPicker, options);
		}
	},


	/**
	 * 退出绘制模式。退出绘制模式后会将在地图绘出的图形返回
	 * @method exitDrawMode
	 * @return {TMap.Shape}     绘制模式下绘制的图形
	 */
	exitDrawMode: function() {
		var ret = null;
		if (this.view.geoPicker) {
			ret = this.view.geoPicker.exit();
			delete this.view.geoPicker;
			this.unlockMap();
		}
		return ret;
	},

	/**
	 * 添加点击响应函数
	 * @method click
	 * @param  {function} func 点击响应函数
	 */
	click: function(func) {
		if (this.view.clickProcs == null)
			this.view.clickProcs = [];
		this.view.clickProcs.push(func);
	},

	/**
	 * 移除点击响应函数
	 * @method removeClick
	 * @param  {number | function}    clk 点击响应的函数
	 */
	removeClick: function(clk) {
		if (this.view.clickProcs) {
			if (typeof clk == 'number') {
				if (clk >= 0 && clk < this.view.clickProcs.length)
					this.view.clickProcs.splice(clk)
			} else {
				clk = this.view.clickProcs.index(clk);	
				if (clk >= 0) this.view.clickProcs.splice(clk);
			}

			if (this.view.clickProcs.length == 0) 
				delete this.view.clickProcs;
		}
	},

	/**
	 * 强制刷新地图
	 * @method refresh
	 */
	refresh: function() {
		this.view.refreshMap();
	},

	lockMap: function() {
		this._oldLockFlag = [this.view.moveLock, this.view.zoomLock, this.view.rotateLock];
		this.view.moveLock = 
		this.view.zoomLock =
		this.view.rotateLock = true;
	},
	unlockMap: function() {
		this.view.moveLock = this._oldLockFlag[0];
		this.view.zoomLock = this._oldLockFlag[1];
		this.view.rotateLock = this._oldLockFlag[2];
	},
};

/**
 * 地图初始化事件，仅在地图对象被创建后触发一次
 *
 * @event init
 * @param {object} event 事件对象，event.type="init"; event.target = map;
 */

/**
 * 地图初始化就绪事件，仅在地图对象被创建后，地图开始正常的渲染显示时触发一次
 *
 * @event ready
 * @param {object} event 事件对象，event.type="ready"; event.target = map;
 */

/**
 * 地图尺寸改变事件
 *
 * * 浏览器窗口尺寸发生改变，地图尺寸逐之改变时触发；
 * * 调用地图API改变其尺寸后触发；
 * 
 * @event resize
 * @param {object} event 事件对象，event.type="resize"; event.target = map;
 */

/**
 * 地图数据就位事件
 * 
 * @event tileready
 * @param {object} event 事件对象，event.type="tileready"; event.target = map;
 */

/**
 * 地图缩放事件
 *
 * * 无论以何种方式，使地图发生缩放比例、级别改变时均会触发。
 * 
 * @event zoom
 * @param {object} event 事件对象，event.type="zoom"; event.target = map;
 */

/**
 * 地图缩放开始事件
 *
 * * 当地图缩放API调用条件下，缩放开始时触发；<br>
 * * 当点击地图上的缩放按钮条件下，鼠标点击（长按不予响应）后松开时触发；<br>
 * * 当鼠标滚轮滚动缩放动地图条件下，在上次滚动结束后，鼠标滚轮第一次发生滚动时触发；<br>
 * * 当移动设备或支持多点触摸的设备上，两个（及以上）手指触摸后，第一次手指聚拢或分开的动作被识别时触发。
 * 
 * @event zoombegin
 * @param {object} event 事件对象，event.type="zoombegin"; event.target = map;
 */

/**
 * 地图缩放结束事件
 * 
 * * 当地图缩放API调用条件下，缩放级别、比例到达目标级别、比例，缩放动作结束时触发；<br>
 * * 当点击地图上的缩放按钮条件下，鼠标点击后，地图缩放动画结束时触发；<br>
 * * 当鼠标滚轮滚动缩放动地图条件下，在上次滚动发生后200毫秒内没有再发生滚动时触发；<br>
 * * 当移动设备或支持多点触摸的设备上，两个（及以上）手指触摸后，上次手指聚拢或分开的动作的被识后200毫秒内没有再发生类似的操作时触发。
 * 
 * @event zoomend
 * @param {object} event 事件对象，event.type="zoomend"; event.target = map;
 */

/**
 * 地图移动事件
 *
 * * 无论以何种方式，使地图发生中心点改变时均会触发。
 * 
 * @event move
 * @param {object} event 事件对象，event.type="move"; event.target = map;
 */

/**
 * 地图移动开始事件
 *
 * * 当地图移动API调用条件下，移动开始时触发；<br>
 * * 当鼠标拖动地图移动条件下，鼠标左键按下后，第一次发生位置移动时触发；<br>
 * * 当移动设备上，触摸拖动地图时，手指按下屏幕后，第一次发生识别位置改变时触发。
 * 
 * @event movebegin
 * @param {object} event 事件对象，event.type="movebegin"; event.target = map;
 */

/**
 * 地图移动结束事件。
 * 
 * * 当地图移动API调用条件下，移动完成，地图中心点到达目标经纬度时触发；<br>
 * * 当鼠标拖动地图移动条件下，鼠标左键松开时触发；<br>
 * * 当移动设备上，触摸拖动地图时，手离开屏幕时触发。
 * 
 * @event moveend
 * @param {object} event 事件对象，event.type="moveend"; event.target = map;
 */




})();

