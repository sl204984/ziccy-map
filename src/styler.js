//////////////////////////////////////////////////////////////////////
 // *
 // *	styler.js
 // *
 // *	styler will stylize the server responsed vector data according to
 // * 	the render_config.xml. But render_config will be precompiled into
 // *  json before being responsed from server.
 // *	
//////////////////////////////////////////////////////////////////////
(function(){"use strict";
const GEO_OFF_NAME	= 3;
const GEO_OFF_POINTS= 2;
const GEO_OFF_ID	= 1;
const GEO_OFF_TYPE	= 0;
const OFFSET_DICT	= {
	Points: "a", // 点列 
	Type: "t",	// 类型 
	Text: "r",   // 文本
 // *
 	fillColor: "f",	// 前景颜色 
 	strokeColor: "s",	// 描边颜色 
 	
 	lineDash: "d",	// dash_lens 
 	lineWidth: "l",	// 线宽 
 	strokeWidth: "w",	// 描边宽度 
 	
 	iconId: "i",	// 图标  id 
 	iconStyle: "j",	// 图标样式 (4: icon only)
 
 	fontSize: "n",	// 字号大小 
 	font: "o",	// 字体类型 

	pattern: "p",	// 填充图案
 	zIndex: "z",	// 渲染顺序号
};

var Style = TMap.Styler = {};
 // vs:{},
 // rs:{},
 // rc:{},
 // oc:{},
 // ic:{},
function tkStyler(eng) {
	this.mapRenderConfig = {};
	this.maplist = ["horae"];
	this.engine = eng;

	var memcanvas = document.createElement("canvas");
	document.body.appendChild(memcanvas);
	memcanvas.className = "tkm-map-mem-canvas";
	memcanvas.width = 512;
	memcanvas.height = 512;

	this.memcanvas = memcanvas;
	this.memcontext = memcanvas.getContext('2d');
	this.memcontext.textBaseline = 'top';

	this.needMakeTexture = TMapEngine.displayTechVersion === "webgl";
	if (this.needMakeTexture) TMapEngine.private.egaki(this);

	for (var m in this.maplist) {
		this.fillConfig(this.maplist[m]);
	}
}

tkStyler.prototype = {
	_styling: function(originTileData, lyr, z) {
		if (originTileData == null || originTileData.d == null) 
			return;
		var src_data = originTileData.d;
		var view = lyr.styleViewName, mapPackage = lyr.mapPackage;
		var mapRC = this.mapRenderConfig[mapPackage], boldStyle;
		var datasetInRC = z >= 8? mapRC.regionConfig: mapRC.outlineConfig;
		var grdFeatures = [], lblArray = [], k, typeCode, renderObj;
		var vo = mapRC.views[view];
		var tileObj = {
			key: lyr.keygen(originTileData.tx, originTileData.ty, z), //originTileData.key,//
			okey: originTileData.key,
			c: originTileData.c,
			m: originTileData.m,
			v: view,
			z: originTileData.z,
			tx: originTileData.tx,
			ty: originTileData.ty,
			g: grdFeatures,
			l: lblArray,
		};
		if (vo.f) tileObj.f = vo.f;
		if (vo.s) tileObj.s = vo.s;


		if (!src_data._prestyle) {
			for (k in src_data) {
				for (var geos = src_data[k], geo, gi = 0, glen = geos.length; gi < glen; ++gi)
					geos[gi].k = k;
			}
			src_data._prestyle = 1;
		}

		// source vector data
		for (var typeCodeStr in src_data) {
			var arr = typeCodeStr.split("x"), tcode, stcode;
			tcode = arr[1], stcode = arr[2];
			if (tcode == "") tcode = "0";
			if (stcode == "") 
				stcode = 0;
			else {
				stcode = parseInt(stcode, 32);
				if (stcode > 127) stcode -=256;
			}

			if (lyr.checkFilter(tcode))
				continue;
			boldStyle = lyr.bolds[tcode];

			var geos = src_data[typeCodeStr];
			var geoKeyNodeInDataset = datasetInRC[tcode], renderTypeKeyNodeInDataset;
			if (geoKeyNodeInDataset == null) continue;

			for (var geo, gi = 0, glen = geos.length; gi < glen; ++gi) {
				geo = geos[gi];
				renderTypeKeyNodeInDataset = geoKeyNodeInDataset[geo[GEO_OFF_TYPE]];
				if (renderTypeKeyNodeInDataset == null) continue;
				for (var renderType in renderTypeKeyNodeInDataset) {
					renderObj = renderTypeKeyNodeInDataset[renderType];
					var renderImplement = new tkRenderImpl(geo, view, renderType, renderObj, originTileData, mapRC, stcode);
					if (renderImplement.a == null)
						continue;
					
					if (boldStyle) {
						$.extend(renderImplement, boldStyle);
					}
					if (renderImplement.t) {
						grdFeatures.push(renderImplement);
					} else {
						lblArray.push(renderImplement);	
					}					
				}
			}
		}

		if (lblArray.length) {
			tileObj.l = lblArray.sort(function(a, b) {
				return a.z - b.z;				
			});
		}

		if (grdFeatures.length) {
			grdFeatures = grdFeatures.sort(tkRenderImpl.comparator);
			var groundFeatures = {}, arrayGroundFeatures, keys = new Set(), abser = grdFeatures[0];
			for (var i = 1, g, l = grdFeatures.length; i <= l; ++i) {	// notice: i must less overrides equal to l
				g = grdFeatures[i];
				if (!abser.absorb(g)) {
					arrayGroundFeatures = groundFeatures[abser.z];
					if (arrayGroundFeatures == null) {
						groundFeatures[abser.z] = arrayGroundFeatures = [];
						keys.add(abser.z);
					}
					arrayGroundFeatures.push(abser);
					delete abser._absorbed;
					abser = g;
				}
			}

			tileObj.g = groundFeatures;
			tileObj.zIndexKeys = keys;
		}
		
		tileObj.layer = lyr;

		if (this.needMakeTexture) 
			this._texturize(tileObj, lyr);

		return tileObj;
	},
	
	_texturize: function(tile, lyr) {
		var ctx = this.memcontext;
		ctx.clearRect(0, 0, 256, 256);
		this.vectorDraw(ctx, {ratio:2, scale:2, width:512, height:512, z: tile.z}, tile);
		tile.tex = this.glCanvas.glGenTexture(this.memcanvas);

		ctx.clearRect(0, 0, 256, 256);


		this._makeLabelImage(tile, lyr);

		tile.ltex = this.glCanvas.glGenTexture(this.memcanvas);

		// this.vectorDraw(ctx, {ratio:2, scale:2, width:512, height:512, z: tile.z}, tile);
	},

	_makeLabelImage: function(tile, lyr) {
		var ctx = this.memcontext, ratio = 2;
		var dstX = 0, dstY = 0, strokeWidth, textWidth, textHeight, lineHeight = 0;
		var dstEX, dstEY, x, y;
	
		ctx.textBaseline = "top";
		ctx.lineCap = ctx.lineJoin = "round";
		ctx.miterLimit = 4;

		for (var i = 0, lbl, lbls = tile.l, len = lbls.length; i < len; ++i) {
			lbl = lbls[i];
			if (!lbl.r) continue;
			
			ctx.font = (lbl.n || '10') + 'px';
			ctx.lineWidth = strokeWidth = ((lbl.w || 1) | 0) * ratio;
			
			ctx.strokeStyle = lbl.s || '#fff';
			ctx.fillStyle = lbl.f || '#000';

			if (lbl.j == 1 && lbl.imgInfo) {
				textWidth = (ctx.measureText(lbl.r).width+ 8)*ratio ;
				textHeight = (lbl.n+8)*ratio;// + strokeWidth*4;
				if (lineHeight < textHeight) 
					lineHeight = textHeight;

				dstEX = dstX + textWidth;
				dstEY = dstY + textHeight;
				if (dstEX > 512) {
					dstY += lineHeight;
					dstEY = dstY + textHeight;

					if (dstEY > 512) return;

					lineHeight = textHeight;
					dstX = 0;
					dstEX = textWidth;

				}
				
				x = (dstX) / ratio, 
				y = (dstY) / ratio;

				var ii = lbl.imgInfo;
				ctx.drawImage(lbl.img, ii.x, ii.y, ii.w, ii.h, x, y, textWidth/ratio, textHeight/ratio);;

				x+=4,y+=4;
				if (strokeWidth > 0) 
					ctx.strokeText(lbl.r, x, y);
				ctx.fillText(lbl.r, x, y);

				lbl.glElems=[];

			} else {
				textWidth = ctx.measureText(lbl.r).width*ratio + strokeWidth*2;
				textHeight = lbl.n*ratio + strokeWidth*4;
				if (lineHeight < textHeight) 
					lineHeight = textHeight;

				dstEX = dstX + textWidth;
				dstEY = dstY + textHeight;
				if (dstEX > 512) {
					dstY += lineHeight;
					dstEY = dstY + textHeight;

					if (dstEY > 512) return;

					lineHeight = textHeight;
					dstX = 0;
					dstEX = textWidth;

				}
				
				x = (dstX + strokeWidth) / ratio, 
				y = (dstY + strokeWidth) / ratio;
				
				if (strokeWidth > 0) 
					ctx.strokeText(lbl.r, x, y);
				ctx.fillText(lbl.r, x, y);
				if (lbl.img)
				lbl.glElems=[
					{
						rect: lbl.imgInfo,
						tex: lbl.tex,
						iw: lbl.img.width, 
						ih: lbl.img.height,
						pos: [lbl.a[0]-lbl.imgInfo.w/4, 256-lbl.a[1]-lbl.imgInfo.h/4,0],
					}
				];
				else lbl.glElems=[];
			}

			// textWidth = ctx.measureText(lbl.r).width*ratio + strokeWidth*2;
			// textHeight = lbl.n*ratio + strokeWidth*4;
			// if (lineHeight < textHeight) 
			// 	lineHeight = textHeight;

			// dstEX = dstX + textWidth;
			// dstEY = dstY + textHeight;
			// if (dstEX > 512) {
			// 	dstY += lineHeight;
			// 	dstEY = dstY + textHeight;

			// 	if (dstEY > 512) return;

			// 	lineHeight = textHeight;
			// 	dstX = 0;
			// 	dstEX = textWidth;

			// }
			
			// x = (dstX + strokeWidth) / ratio, 
			// y = (dstY + strokeWidth) / ratio;
			
			// if (strokeWidth > 0) 
			// 	ctx.strokeText(lbl.r, x, y);
			// ctx.fillText(lbl.r, x, y);

			lbl.rect = {
				x: dstX, 
				y: dstY, 
				w: textWidth, 
				h: textHeight
			};
			lbl.glElems.push({
						rect: lbl.rect,
						// tex:
						iw: 512, 
						ih: 512,
						pos: [lbl.a[0], 256-lbl.a[1],0],	
					});
			dstX = dstEX;
		}
	},


	getRenderConfig: function(mapPackage) {
		return this.mapRenderConfig[mapPackage];
	},
	filtBoldFeature: function(lyr, drawTiles) {
		var boldGeos = null;
		for (var i = 0, l = drawTiles.length; i < l; ++i) {
			var tile = drawTiles[i], geos, geo;
			if (tile.g == null) continue;
			for (var key in tile.g) {
				geos = tile.g[key];
				for (var gi = 0, glen = geos.length; gi < glen; ++gi) {
					geo = geos[gi];
					for (var ag, ai = 0, alen = geo.a.length; ai < alen; ++ai) {
						ag = geo.a[ai];
						if (bold(lyr, ag.geo)) {
							if (boldGeos == null) {
								boldGeos = [];
								$.extend(boldGeos, geo);
								delete boldGeos.a;
								delete boldGeos.z;
								boldGeos.f = "red";
							}
							boldGeos.push([tile, ag]);
						}
					}					
				}
			}
		}
		return boldGeos;
	},

	fillConfig: function(mapPack) {
		var mrc = this.mapRenderConfig;
		var eng = this.engine;
		var me = this;
		$.ajax({
			type: "POST",
			url: TMap.domain+"/perseus/webmap",
			timeout: TMap.timeout,
			data: "at=es&key="+mapPack,
			dataType: "json",
			success:function(data, textStatus, jqXHR){
				var rc = mrc[mapPack] = new tkRenderConfig(data, mapPack);
				for (var i = 0, lyr, mapv, l = eng.mapViews.length; i < l; ++i) {
					mapv = eng.mapViews[i];
					lyr = mapv.basicLayer;
					if (lyr.mapPackage == mapPack) {
						lyr.setStyleView(rc.defaultView);	
					}

					me.glCanvas = eng.getGLCanvas();
					// me.objGL = eng.getGLContext();
					mapv.mapMode.listenerNotify("ready");
				}
			},
			complete: function(jqXHR, textStatus) {
				if (textStatus != "success") {
					console.log("render_config failed");	
				}
			},
		});
	},
};
Style.tkStyler = tkStyler;

function bold(lyr, geo) {
	var boldGeo = lyr.boldGeo;
	if (boldGeo == geo) {
		return 1;
	} else {
		if (boldGeo[GEO_OFF_TYPE] == geo[GEO_OFF_TYPE] && boldGeo.k == geo.k && 
			((geo[GEO_OFF_NAME] && boldGeo[GEO_OFF_NAME] == geo[GEO_OFF_NAME]) || 
				(!geo[GEO_OFF_NAME] && boldGeo[GEO_OFF_ID] == geo[GEO_OFF_ID]))) 
			return 1;
	}
	return 0;
}



// {
//		typeCode: { 
// 			geoType: {
//				renderType: {
//					d: {...},
//					o: [{cond: {...}, value: {...}}, ...],
//					v: {
//						view1: {
//							r: renderTemplate,
//							d: {...},
//							o: [{cond: {...}, value: {...}}, ...],
//						}, ...
//					}, ...
//				}, ...
//			}, ...
//		}, ...
//	}


 // *	a	:= 点列 
 // *	t	:= 类型 
 // *
 // *	f	:= 前景颜色 
 // *	s	:= 描边颜色 
 // *	
 // *	l	:= 线宽 
 // *	w	:= 描边宽度 
 // *	
 // *	i	:= 图标  id 
 // *	j	:= 图标样式 (4: icon only)
 // *	
 // *	n	:= 字号大小 
 // *	o	:= 字体类型 
 // *	
 // *	z	:= 渲染顺序号
 // *	
 // *	d	:= dash_lens
 // *	
 // *	p   := 填充图案
 // *
 // *	r   := 文本


function tkRenderImpl(geo, view, renderType, render, tile, maprc, subtype) {
	var renderInCertainView = render.v[view];
	if (renderInCertainView == null) 
		return;

	var renderInTemplate = maprc.renders[renderInCertainView.r];
	if (renderInTemplate == null || renderType != renderInTemplate.t) 
		return;
	this.subtype = subtype;
	this.lv = tile.z;
	this.cid = tile.c;
	this.name = geo[GEO_OFF_NAME];

	this.extend(renderInTemplate.style);
	this.override(renderInTemplate.overrides);
	
	this.extend(render.d);
	this.override(render.o);

	this.extend(renderInCertainView.defaults);
	this.override(renderInCertainView.overrides);

	// if (this.d == "7,2")
	// 	this.d = [7,2]

	if (this.m <= this.lv && this.lv <= this.M) {
		delete this.m;
		delete this.M;
		if (renderType == "0") {
			this.t = 0;
			this.r = this.name;
			if (this.i >= 0) {
				// TODO
				// this.iconResource = maprc.
				this.imgInfo = maprc.iconConfig[this.i];
				this.img = maprc.iconConfig.img;
				this.tex = maprc.iconConfig.tex;

			} else if (!this.r) return;
		} else if (renderType == "2") {
			this.t = 2;
		} else if (renderType == "1") {
			this.t = 1;
		} else if (renderType == "3") {
			this.t = 3;
		} else return;
		delete this.name;
		this.a = geo[GEO_OFF_POINTS];	
		this.a.geo = geo;
	}
}
tkRenderImpl.comparator = function(a, b) {
	return a.z - b.z;
}
tkRenderImpl.prototype = {
	hash: function(){
		if (this.hashValue == null) {
			// "fslwdp"
			this.hashValue = this.f+','+this.s+","+this.l+","+this.w+","+this.d+","+this.p;
		}  
		return this.hashValue;
	},
	extend: function(render) {
		if (render == null) 
			return;

		var str = "Mmfslwijnozdrp";
		for (var i = 0, c, l = str.length; i < l; ++i) {
			c = str.substr(i,1);
			if (render[c] != null) this[c] = render[c];
		}
	},
	override: function(overrides) {
		if (overrides == null) 
			return;

		for (var i = 0, overrideItem, equal_cond, l = overrides.length; i < l; ++i) {
			overrideItem = overrides[i];
			equal_cond = true;
			for (var cnd in overrideItem.cond) {
				if (overrideItem.cond[cnd] != this[cnd]) {
					equal_cond = false;
					break;
				}
			}
			if (!equal_cond)
				continue;
			for (var vk in overrideItem.value) {
				this[vk] = overrideItem.value[vk];
			}
			break;
		}
	},
	absorb: function(obj) {
		if (this._absorbed == null) {
			if (this.t == 3) {
				var geo = this.a.geo;
				this.a.forEach(function(e){
					e.geo = geo;
				});
				delete this.a.geo;
			} else 
				this.a = [this.a];
			this._absorbed = true;
		}
		if (obj && this.equal(obj)) {
			if (this.t == 3) {
				var geo = obj.a.geo;
				this.a = obj.a.reduce( function(coll,item){
					coll.push(item);
					item.geo = geo;
					return coll;
				}, this.a);	
			} else 			
				this.a.push(obj.a);
			return true;
		} else 
			return false;
	},
	equal: function(obj) {
		return (this.t == obj.t && this.f == obj.f && this.s == obj.s && 
				this.l == obj.l && this.w == obj.w && this.i == obj.i &&
				this.j == obj.j && this.n == obj.n && this.o == obj.o && 
				this.d == obj.d && this.p == obj.p);
	},
	depoly: function() {

	},
};

/****************************************
 *	class render_config 
 *
 ****************************************/
function tkRenderConfig(json, mapPack) {
	this.mapPack = mapPack;
	this.views = json.vs;
	this.renders = json.rs;
	this.outlineConfig = json.oc;
	this.regionConfig = json.rc;
	this.iconConfig = json.ic; 

	this._viewsPrepare();
	this._rendersPrepare();
	this._regionConfigPrepare();
	this._outlineConfigPrepare();
	this._iconConfigPrepare();
}

tkRenderConfig._duplicateView = function(cfg, src_view, dest_view) {
	tkRenderConfig._foreachView(cfg, src_view, function(view_parent){
		view_parent[dest_view] = {};

		$.extend(view_parent[dest_view], view_parent[src_view]);
		for (var i in view_parent[dest_view]) {
			if (view_parent[dest_view][i] instanceof Object) {
				var tmp = {};
				$.extend(tmp, view_parent[dest_view][i]);
				view_parent[dest_view][i] = tmp;
			}
		}
		return false;
	});

	// var typeCode, geoType, renderType, config4Type, config4Geo, config4Geo, config4Render, config4View;
	// for (typeCode in cfg) {
	// 	config4Type = cfg[typeCode];
	// 	for (geoType in config4Type) {
	// 		config4Geo = config4Type[geoType];
	// 		for (renderType in config4Geo) {
	// 			config4Render = config4Geo[renderType];
	// 			if (config4Render && config4Render.v && config4Render.v[src_view] != null) {
	// 				config4View = config4Render.v;
	// 				config4View[dest_view] = {};
	// 				$.extend(config4View[dest_view], config4View[src_view]);
	// 			}	
	// 		}			
	// 	}
	// }
}
tkRenderConfig._deleteView = function(cfg, view) { 
	tkRenderConfig._foreachView(cfg, view, function(view_parent){
		delete view_parent[view];
		return false;
	});
	// var typeCode, geoType, renderType, config4Type, config4Geo, config4Geo, config4Render, config4View;
	// for (typeCode in cfg) {
	// 	config4Type = cfg[typeCode];
	// 	for (geoType in config4Type) {
	// 		config4Geo = config4Type[geoType];
	// 		for (renderType in config4Geo) {
	// 			config4Render = config4Geo[renderType];
	// 			if (config4Render && config4Render.v && config4Render.v[view] != null) {
	// 				delete config4Render.v[view];
	// 			}	
	// 		}			
	// 	}
	// }
}
tkRenderConfig._foreachView = function(cfg, view, func) {
	var typeCode, geoType, renderType, config4Type, config4Geo, config4Geo, config4Render, config4View;
	for (typeCode in cfg) {
		config4Type = cfg[typeCode];
		for (geoType in config4Type) {
			config4Geo = config4Type[geoType];
			for (renderType in config4Geo) {
				config4Render = config4Geo[renderType];
				if (config4Render && config4Render.v && config4Render.v[view] != null) {
					if (func(config4Render.v)) 
						return;
					// delete [view];
				}	
			}			
		}
	}
}
tkRenderConfig._setStyle = function (dataRenderConfig, typeCode, styles) {
	dataRenderConfig = dataRenderConfig[typeCode];
	if (dataRenderConfig == null) return;

	for (var geoType in dataRenderConfig) {
		var renderCompound = dataRenderConfig[geoType];
		for (var renderType in renderCompound) {
			var certainConfig = renderCompound[renderType];
			var certainViewConfig = certainConfig.v[styles.view];
			if (certainViewConfig) {
				if (certainViewConfig.defaults == null) certainViewConfig.defaults = {};
				certainViewConfig.defaults[OFFSET_DICT[styles.offset]] = styles.value;
			}
		}
	}
}

tkRenderConfig.prototype = {
	setStyle: function(styles) {
		if (styles == null)
			return;
		if (styles instanceof Array) {
			for (var i in styles)
				this.setStyle(styles[i]);
		} else {
			// if (styles.view == null) {

			// } 
			// if (styles.offset == null) {

			// }
			// if (styles.value == null) {

			// }
			// if (styles.typeCode == null) {

			// }
			var dataRenderConfig;
			if (styles.outline) {
				dataRenderConfig = this.outlineConfig;
			} else {
				dataRenderConfig = this.regionConfig;
			}
			if (dataRenderConfig == null) return;
			var typeCode = styles.typeCode;
			if (typeCode instanceof Array) {
				for(var typeCodeIndex in typeCode)
					tkRenderConfig._setStyle(dataRenderConfig, typeCode[typeCodeIndex], styles);
			} else {
				tkRenderConfig._setStyle(dataRenderConfig, typeCode, styles);
			}
			// dataRenderConfig = dataRenderConfig[styles.typeCode];
			// if (dataRenderConfig == null) return;

			// for (var geoType in dataRenderConfig) {
			// 	var renderCompound = dataRenderConfig[geoType];
			// 	for (var renderType in renderCompound) {
			// 		var certainConfig = renderCompound[renderType];
			// 		var certainViewConfig = certainConfig.v[styles.view];
			// 		if (certainViewConfig) {
			// 			if (certainViewConfig.defaults == null) certainViewConfig.defaults = {};
			// 			certainViewConfig.defaults[OFFSET_DICT[styles.offset]] = styles.value;
			// 		}
			// 	}
			// }
		}
	},

	duplicateView: function(src_view, dest_view) {
		var ssvRC = this.views[src_view], dsvRC = this.views[dest_view];
		if (ssvRC == null || dsvRC != null) return;
		
		this.views[dest_view] = dsvRC = {};
		$.extend(dsvRC, ssvRC);

		tkRenderConfig._duplicateView(this.regionConfig, src_view, dest_view);
		tkRenderConfig._duplicateView(this.outlineConfig, src_view, dest_view);
	},

	deleteView: function(view) {
		var ssvRC = this.views[view];
		if (ssvRC == null) return;
		delete this.views[view];
		
		tkRenderConfig._deleteView(this.regionConfig, view);
		tkRenderConfig._deleteView(this.outlineConfig, view);
	},


	_viewsPrepare: function() {
		var viewName, viewItem, defaultViewName, idx = 0;
		for (viewName in this.views) {
			if (defaultViewName == null) 
				defaultViewName = viewName;
			viewItem = this.views[viewName];
			if (viewItem.data) delete viewItem.data;
			viewItem.index = idx++;
		}
		this.defaultView = defaultViewName;
	},
	_rendersPrepare: function() {
		var renderName, renderItem, renderOverride;
		for (var renderName in this.renders) {
			renderItem = this.renders[renderName];
			renderOverride = this._overrideMake(renderItem[2]);
			this.renders[renderName] = {
				t: renderItem[0],
				style: renderItem[1],
			};
			if (renderOverride) {
				this.renders[renderName].overrides = renderOverride;
			}
		}
	},
	_overrideMake: function(obj) {
		if (obj instanceof Array) {
			for (var i = 0, o, l = obj.length; i < l; ++i) {
				o = obj[i];
				obj[i] = {
					cond: o[0],
					value: o[1],
				}; 
			}
		}
		return obj;
	},
	_regionConfigPrepare: function() {
		this._datasetConfigPrepare(this.regionConfig);
	},
	_outlineConfigPrepare: function() {
		this._datasetConfigPrepare(this.outlineConfig);
	},
	_iconConfigPrepare: function() {
		var iconRatio = "3", iconInfo, iconId, iconInfoItem, img, newcfg = {}, newitem;
		
		// Traverse each ratio iconConfig
		// for (iconRatio in this.iconConfig) {	
		iconInfo = this.iconConfig[iconRatio];
		newitem = newcfg;

		for (iconId in iconInfo) {
			iconInfoItem = iconInfo[iconId];
			if (iconInfoItem.length == 6) {
				newitem[iconId] = {
					x: iconInfoItem[0],
					y: iconInfoItem[1],
					w: iconInfoItem[2],
					h: iconInfoItem[3],
					iw: iconInfoItem[4],
					ih: iconInfoItem[5],
					t: 0,
				};
			} else {
				newitem[iconId] = {
					x: iconInfoItem[0],
					y: iconInfoItem[1],
					w: iconInfoItem[2],
					h: iconInfoItem[3],
					t: 9,
				};

			}
			// newitem[iconId].texCoord =  can.glGenTextureCoord(newitem[iconId], this.width, this.height);
		}

		
		var can = TMapEngine.getGLCanvas();
		newitem.img = img = new Image();
		img.father = newitem;
		img.crossOrigin = "anonymous";
		img.onload = function() {
			var iiObjs = this.father;
			for (var iconId in iiObjs) {
				iiObjs[iconId].img = this;
			}
			delete this.father;
			
			if (can != null) iiObjs.tex = can.glGenTexture(img);
		};
		img.src = TMap.domain + "/perseus/webres?rs=icon&key="+ this.mapPack + "@3";//+ iconRatio;


		// }
		this.iconConfig = newcfg;
	},
	_datasetConfigPrepare: function(cfg) {
		var typeCode, config4Type, geoType, config4Geo, newrcgs, newrender, nr, i, l, r;
		// process for each type code in configure object cfg traversal
		// typeCode is type code and config4Type is configure detail
		for (typeCode in cfg) {
			config4Type = cfg[typeCode];
			newrcgs = {};
			// geoType is geo type of render_config, config4Type is an object with all geoType as key
			// the four element array as value
			for (geoType in config4Type) {
				config4Geo = config4Type[geoType];
				newrender = {};
				for (i = 0, l = config4Geo.length; i < l; ++i) {
					r = config4Geo[i];
					nr = {};
					if (r[1]) nr.d = r[1];
					if (r[2]) nr.o = r[2];
					if (r[3]) nr.v = r[3]; 
					for (var viewName in nr.v) {
						if (nr.v[viewName].override) {
							nr.v[viewName].overrides = this._overrideMake(nr.v[viewName].override);
							delete nr.v[viewName].override;
						}
					}
					newrender[r[0]] = nr;
				}	
				newrcgs[geoType] = newrender;
			}
			$.extend(config4Type, newrcgs);
		}
	},
};

})();