//////////////////////////////////////////////////////////////////////
 // *
 // *	mapapi.js
 // *
 // *	mapapi is pronounciation for "atlas" in Japanese. We use this to
 // * 	confuse our readers who want hack back.
 // *	
//////////////////////////////////////////////////////////////////////
(function() { 'use strict';
const tagDIV = "<DIV>";
const M_PI = Math.PI;
const M_2PI = 2*M_PI, M_RPD = M_PI/180.0, M_DPR = 180.0/M_PI;
const TK_EARTH_PERIMETER = 6378137.0;

var GeoUtils = TMap.GeoUtils;
var gCS = GeoUtils;// || {};

/**
 * Point类，此类表示一个地理坐标点。
 * 
 * @class Point
 * @constructor	
 * @namespace TMap
 * @param {number} lon 地理经度
 * @param {number} lat 地理纬度
 */ 
TMap.Point = function() {
	if (arguments.length == 1) {
		var arr = arguments[0];
		if (arr instanceof Array) {
			this.lon = arr[0];
			this.lat = arr[1];	
		} else {
			this.lon = arr.lon;
			this.lat = arr.lat;
		}
	} else {
		this.lon = arguments[0];
		this.lat = arguments[1];
		if (arguments.length > 2) {
			this.headmark = 1;
		}
	}
	/**
	*   地理经度
	*	@property {Number} lon
	*/
 
	this.lon = gCS.fixlon(this.lon);
	
	/**
	*   地理纬度
	*	@property {Number} lat
	*/
	this.lat = gCS.fixlat(this.lat);
}

TMap.Point.prototype = {
	/**
    * 	判断是否相等
    *
    * 	@method equals
    *	@param {TMap.Point} other -
    *	@return {boolean} 是否相等 
    */
	equals: function(pt) {
		return this.lon == pt.lon && this.lat == pt.lat;
	},

	/**
	 * 计算与另一个经纬度之间的距离，单位米
	 * @method distance
	 * @param  {TMap.Point | number} p 经度或是经纬度对象
	 * @param  {number} v 纬度，当p为经纬度对象时，该参数会被忽略
	 * @return {number}   两个经纬度之间的距离
	 */
	distance: function(p,v) {
		var lon, lat;
		if (p instanceof Number && v instanceof Number) {
			lon = p, lat = v;
		} else if (p instanceof TMap.Point) {
			lon = p.lon; lat = p.lat;
		}	
		return gCS.arc_points(this.lon,this.lat,lon,lat)*gCS.TK_EARTH_RADIUS;
	},

	normalize:function() {
		this.lon = gCS.fixlon(this.lon);
		this.lat = gCS.fixlat(this.lat);
	},
	
};
/**
 * 将数组、参数对组合成Point对象
 * @method toPoint
 * @return {TMap.Point} 组合后的Point对象
 */
var toPoint = TMap.Point.toPoint = function(){
	if (arguments.length) {
		var e = arguments[0], f = null;
		if (e == null) return null;
		if (arguments.length >= 2) f = arguments[1];	
		
		if (typeof e === 'number' && typeof f === 'number')
			return new TMap.Point(e, f);

		if (e.lon != null && e.lat != null) 
			return e;

		if (e instanceof Array) {
			if (e.length>2 && !(typeof e[0] === 'number'))
				return e.map(toPoint);
			return new TMap.Point(e);	
		}
	}
	return null;
};

/**
 * Pixel类，此类表示地图上的一点，单位为像素。
 * 
 * @class Pixel
 * @constructor 
 * @param {number | Array}	x    X轴坐标
 * @param {number}	y     Y轴坐标
 */
TMap.Pixel = function() {
	if (arguments.length == 1) {
		var arr = arguments[0];
		if (arr instanceof Array) {
			this.x = arr[0];
			this.y = arr[1];	
		} else {
			this.x = arr.x;
			this.y = arr.y;
		}
	} else {
		/**
		*   X轴坐标
		*	@property {Number} x
		*/
		this.x = arguments[0];
		/**
		*   Y轴坐标
		*	@property {Number} y
		*/
		this.y = arguments[1];
		// if (arguments.length > 2) {
		// 	this.headmark = 1;
		// }
	}
};
TMap.Pixel.prototype = {
	/**
    * 判断Pixel对象是否相等
    * 
    * @method equals
    * @param {TMap.Pixel} px 待比较的Pixel对象
    * @return {boolean}  是否相同
    */
	equals: function(px) {
		return this.x == px.x && this.y == px.y;
	},
};
/**
 * 将数组、参数对组合成Pixel对象
 * @method toPixel
 * @return {TMap.Pixel} 组合后的Pixel对象
 */
var toPixel = TMap.Pixel.toPixel = function(){
	if (arguments.length) {
		var e = arguments[0], f = null;
		if (e == null) return null;
		if (arguments.length >= 2) f = arguments[1];	
		
		if (typeof e === 'number' && typeof f === 'number')
			return new TMap.Pixel(e, f);

		if (e.x != null && e.y != null) 
			return e;

		if (e instanceof Array) {
			if (e.length > 2 && !(typeof e[0] === 'number'))
				return e.map(toPixel);
			return new TMap.Pixel(e);	
		}
	}
	return null;
};

/**
 * Size类，此类以像素表示一个矩形区域的大小。
 * 
 * @class Size
 * @constructor
 * @param {number} width    矩形区域有宽度
 * @param {number} height    矩形区域有高度
 */
TMap.Size = function(w, h){
	/** 
	 * 宽度数值
	 * 
	 * @property {number} width
	 */
	this.width = w;
	/** 
	 * 高度数值
	 * @property {number} height 
	 */
	this.height = h;
};
TMap.Size.prototype = {
	/**
    * 判断Size对象是否相等
    *
    * @method equals 
    * @param {TMap.Size} Other 待比较的Size对象
    * @return {boolean} 是否相等
    */	
	equals: function(sz) {
		return this.width == sz.width && this.height == sz.height;
	},
};

/**
 * Bounds类，此类表示地理坐标的矩形区域。
 * 
 * @class Bounds
 * @constructor
 * @param {TMap.Point} sw 西南点经纬度
 * @param {TMap.Point} ne 东北点经纬度
 */
TMap.Bounds = function(sw,ne) {
	this.sw = new TMap.Point(sw);
	this.ne = new TMap.Point(ne);
};
TMap.Bounds.prototype = {
	/**
    * 判断Bounds对象是否相等
    *
    * @method equals
    * @param {TMap.Bounds} bd 待比较的Bounds对象
    * @return {boolean} 是否相等
    */	
	equals: function(bd) {
		return bd instanceof TMap.Bounds && this.sw.equals(bd.sw) && this.ne.equals(bd.ne);
	},
	/**
    * 判断Point经纬度对象是在Bounds范围内
    *
    * @method containsPoint
    * @param {TMap.Point} pt 待比较的Point对象
    * @return {boolean} 是否在范围内
    */	
	containsPoint: function(pt) {
		return this.sw.lon <= pt.lon && pt.lon <= this.ne.lon &&
				this.sw.lat <= pt.lat && pt.lat <= this.ne.lat;
	},
	/**
    * 获取Bounds对象的中心点经纬度
    *
    * @method getCenter
    * @return {TMap.Point} 中心点经纬度对象
    */	
	getCenter: function() {//	Point	返回矩形的中心点
		return new TMap.Point((this.sw.lon+this.ne.lon)/2,(this.sw.lat+this.ne.lat)/2);
	},

	/**
    * 判断Bounds对象是否为空
    *
    * @method isEmpty
    * @return {boolean} 是否为空
    */	
	isEmpty: function() {
		return false;
	},

	/**
    * 获取Bounds对象的西南点经纬度
    *
    * @method getSouthWest
    * @return {TMap.Point} 西南点经纬度
    */	
	getSouthWest: function(){
		return this.sw;
	},

	/**
    * 获取Bounds对象的东北点经纬度
    *
    * @method getNorthEast
    * @return {TMap.Point} 东北点经纬度
    */	
	getNorthEast: function(){
		return this.ne;
	},

	/**
    * 获取Bounds对象的跨度
    *
    * @method toSpan
    * @return {TMap.Size} Bounds对象的跨度
    */	
	toSpan: function() {
		return new TMap.Size(this.ne.lon - this.sw.lon, this.ne.lat - this.sw.lat);
	},

	/**
    * 扩展Bounds对象所覆盖的范围，当经纬度不在其范围内时， Bounds对象会自动扩展为能覆盖原范围和经纬度的最小范围
    *
    * @method extend
    * @param {TMap.Point} 待扩展的经纬度
    */	
	extend: function(pt) {
		if (this.sw.lon > pt.lon) this.sw.lon = pt.lon;
		if (this.sw.lat > pt.lat) this.sw.lat = pt.lat;
		if (this.ne.lon < pt.lon) this.ne.lon = pt.lon;
		if (this.ne.lat < pt.lat) this.ne.lat = pt.lat;
	}
};



var overlayIndex = 0;
/**
 * Overlay类，地图覆盖物类。该类不能被直接实现化使用
 * 
 * @class Overlay 
 */
TMap.Overlay = function() {
	this._visible = true;
	this._owner = null;
	this._map = null;
	this._id = overlayIndex++;
};
TMap.Overlay.prototype = {
	_addToView: function(view) {
		this._owner = view;
		this._map = view._map;
	},
	_removeFromView: function() {
		this._owner = null;
		this._map = null;
	},
	/**
    * 将覆盖物可见属性设为显示
    * @method show
    */	
	show: function() {
		this._visible = true;
	},
	/**
    * 将覆盖物可见属性设为隐藏
    * @method hide
    */	
	hide: function() {
		this._visible = false;
	},
	/**
    * 将覆盖物可见属性在显示与隐藏之间切换
    * @method toggle
    */	
	toggle:function(){
		if (this._visible)
			this.hide();
		else 
			this.show();
	},
	/**
    * 获取覆盖物可见属性
    * @method getVisible
    * @return {boolean} 是否可见，true为显示；false为隐藏
    */
	getVisible: function() {
		return this._visible;
	},
	/**
    * 获取地图
    * @method getMap
    * @return {boolean} 是否相等
    */
	getMap: function() {
		return this._map;
	},
};	

/**
 * Shape类，图形覆盖物类，该类不可直接被实例化。
 * @class Shape
 * @extends {TMap.Overlay}
 * 
 */
TMap.Shape = function() {
	Extends(this, TMap.Overlay, arguments);

	/**
	 * Shape类覆盖物的主色
	 * @property {String} color
	 * @default #ff8800
	 */
	this.color = '#ff8800';
};
inherit(TMap.Shape, TMap.Overlay, {
	_draw: function(c,z) {

	},
	_resetTransform: function(c) {
		var ratio = this._owner.mapMode.ratio;
		c.setTransform(ratio, 0, 0, ratio, 0, 0);
	},
});

/**
 * Circle类，用于在地图上标注圆形覆盖物
 * @class Circle
 * @constructor
 * @extends TMap.Shape
 * 
 * @param  {TMap.Point} pt   圆形覆盖物中心点经纬度
 * @param  {number} r    半径长度，单位米。注意半径太大会有明显的误差
 * @param  {object} opts 其他描述信息
 */
TMap.Circle = function(pt, r, opts) {
	Extends(this, TMap.Shape, arguments);
	/**
	 * Circle类覆盖物的中心点经纬度
	 * @property {TMap.Point} point
	 */	
	this.point = TMap.Point.toPoint(pt);

	/**
	 * Circle类覆盖物的半径，单位为米
	 * @property {number} radius
	 */
	this.radius = r;
	r /= TK_EARTH_PERIMETER * M_RPD;
	this._Point = {lon: pt.lon, lat: pt.lat - r};
	this.mctPoint = {};
	this.mctLength = {};

	/**
	 * Circle类覆盖物的描边宽度
	 * @property {number} width
	 * @default 3
	 */
	this.width = 3; 

	/**
	 * dash属性，用于描圆形覆盖物的描边线的虚线线型。默认为[]，表示为实线；例如，[5,5]表示为5像素实，5像素虚的虚线线型
	 * @property {Array} dash
	 * @default []
	 */
	
	/**
	 * color属性，用于描述圆形的描边颜色。为null时不描边。
	 * @property {String} color
	 * @default  #ff0000
	 */
	this.color = "#ff0000";

	/**
	 * fillColor属性，用于描述圆形覆盖物的填充颜色。为null时不填充
	 * @property {string} fillColor
	 * @default #ff8800
	 */
	this.fillColor = "rgba(255,192,0,0.2)";

	if (opts) {
		$.extend(this, opts);
	}
};

inherit(TMap.Circle, TMap.Shape, {
	_draw: function(c,z) {
		if (this._visible) {
			var pt = this.getMctPt(z);
			var r = this.mctLength[z] * this._map.view.mapMode.scale / this._map.view.mapMode.ratio;

			c.beginPath();
			c.arc(pt[0], pt[1], r, 0, M_2PI);
		
			this._resetTransform(c);
			if (this.color) {
				c.setLineDash(this.dash || []);
				c.lineWidth = this.width;
				c.strokeStyle = this.color;
				c.stroke();	
			}

			if (this.fillColor) {
				c.fillStyle = this.fillColor;
				c.fill();
			}
			c.closePath();
		}
	},
	getMctPt: function(z) {
		var pt = this.mctPoint[z];
		if (pt == null) {
			var opt = gCS.ll2mct(this._Point.lon, this._Point.lat, z);
			pt = gCS.ll2mct(this.point.lon, this.point.lat, z);
			this.mctPoint[z] = pt;
			this.mctLength[z] = opt[1] - pt[1];
		}			
		return pt;
	},
});



/**
 * MultiPoint类，地图上的多点覆盖物。主要用于多个经纬度点的离散地图绘制。
 * 
 * @class MultiPoint
 * @constructor
 * @extends {TMap.Shape}
 * @param  {Array<Point>}   array 点列的经纬度数组
 */
TMap.MultiPoint = function(array) {
	Extends(this, TMap.Shape, arguments);
	
	this.lonlats = (array||[]).map(toPoint);
	this.mctPoint = {};
	this.continuous = false;
}
inherit(TMap.MultiPoint, TMap.Shape, {
	getMctPts: function(z) {
		var pts = this.mctPoint[z];
		if (pts) return pts;
		pts = [];
		if (this.continuous) {
			var eachfunc = function(e) {
				var l = pts.length;
				if (e instanceof Array) {
					e.forEach(eachfunc);
					if(pts[l]) pts[l].push(0);
				} else if (e instanceof TMap.Point){
					var pt = gCS.ll2mct(e.lon, e.lat, z);
					if (e.headmark) {
						pt.push(0);
					}
					pts.push(pt);	
				}
			}
			this.lonlats.forEach(eachfunc);
		} else {
			var set = new Set(this.lonlats.map(function(e) {
													var arr=gCS.ll2mct(e.lon, e.lat, z);
													return (arr[0]|0)+","+(arr[1]|0);
												}));
			pts = Array.from(set).map(function(e){
										var ss = e.split(","); return [+ss[0],+ss[1]];
									});

		}
		
		this.mctPoint[z] = pts;
		return pts;
	},
	_draw: function(c, z) {
		if (this._visible) {
			var data = this.getMctPts(z), pt;
			if (data.length > 0) {
				c.beginPath();
				for (var i = 0, l = data.length; i < l; ++i) {
					pt = data[i];
					c.arc(pt[0], pt[1], 1, 0, M_2PI);
				}
				c.fillStyle = this.color;
				c.fill();
				c.closePath();	
			}
			
		}
	},
	addPoint: function(pt) {
		this.lonlats.push(toPoint(pt));
		this.mctPoint = {};
	},
});

/**
 * Polyline类，折线覆盖物类。用于在地图绘制直线、多段折线。
 * 
 * @class Polyline
 * @constructor
 * @extends {TMap.MultiPoint}
 */
TMap.Polyline = function() {
	Extends(this, TMap.MultiPoint, arguments);
	this.continuous = true;
	
	/**
	 * color属性，用于描述折线形的描边颜色。
	 * @property {String} color
	 * @default #ff8800
	 */
	
	/**
	 * width属性，用于描述多边形覆盖物的描边线型的宽度。默认为3
	 * @property {number} width
	 * @default 3
	 */
	this.width = 3;

	/**
	 * dash属性，用于描述多边形覆盖物的描边线的虚线线型。默认为[]，表示为实线；例如，[5,5]表示为5像素实，5像素虚的虚线线型
	 * @property {Array} dash
	 * @default []
	 */
	this.dash = [];
}
inherit(TMap.Polyline, TMap.MultiPoint, {
	_draw: function(c, z) {
		if (this._visible) {
			var data = this.getMctPts(z);
			if (data.length > 0) {
				var pt = data[0];
				c.beginPath();
				c.moveTo(pt[0], pt[1]);
				for (var i = 1, l = data.length; i < l; ++i) {
					pt = data[i];
					if (pt.length > 2) 
						c.moveTo(pt[0], pt[1]);
					else
						c.lineTo(pt[0], pt[1]);
				}
				
				this._resetTransform(c);
				c.setLineDash(this.dash || []);
				c.lineWidth = this.width;
				c.strokeStyle = this.color;
				c.stroke();
				c.closePath();
			}
		}
	},
	getLength: function() {
		// if (this.length != undefined) 
		// 	return this.length;
		var lensum = 0;
		for (var i = 0, l = this.lonlats.length-1; i < l; ++i) {
			lensum += GeoUtils.getDistance(this.lonlats[i],this.lonlats[i+1]);
		}
		return lensum;
		// this.length = 1;
	},
});

/**
 * Polygon类，多边形覆盖物类。主要用于地图的多边形覆盖显示。
 * @class Polygon
 * @constructor
 * @extends {TMap.MultiPoint}
 *
 * @example
 * 
 *		polygon = new TMap.Polygon([{lon:120,lat:30}, {lon:121, lat:31}, {lon:121, lat:30}]);
 *		map.addOverlay(polygon);
 */
TMap.Polygon = function() {
	Extends(this, TMap.MultiPoint, arguments);
	this.continuous = true;
	
	/**
	 * color属性，用于描述多边形的填充颜色。
	 * @property {String} color
	 * @default #ff8800
	 */
	
	/**
	 * strokeColor属性，用于描述多边形覆盖物的描边颜色。默认为#ff0000
	 * @property {String} strokeColor
	 * @default #ff0000
	 */
	this.strokeColor = "red";

	/**
	 * width属性，用于描述多边形覆盖物的描边线型的宽度。默认为3
	 * @property {number} width
	 * @default 3
	 */
	
	/**
	 * dash属性，用于描述多边形覆盖物的描边线的虚线线型。默认为[]，表示为实线；例如，[5,5]表示为5像素实，5像素虚的虚线线型
	 * @property {Array} dash
	 * @default []
	 */
	
	this.color = "rgba(255,192,0,0.2)";
}
inherit(TMap.Polygon, TMap.MultiPoint, {
	_draw: function(c, z) {
		if (this._visible) {
			var data = this.getMctPts(z);
			if (data.length == 0) 
				return;

			var pt = data[0], stIdx = 0;
			c.beginPath();
			c.moveTo(pt[0], pt[1]);
			for (var i = 1, l = data.length; i < l; ++i) {
				pt = data[i];
				if (pt.length > 2) {
					var po = data[stIdx];
					c.lineTo(po[0], po[1]);						
					c.moveTo(pt[0], pt[1]);
					stIdx = i;
				} else {
					c.lineTo(pt[0], pt[1]);						
				}
			}
			pt = data[stIdx];
			c.lineTo(pt[0], pt[1]);

			this._resetTransform(c);
			if (this.strokeColor) {
				c.setLineDash(this.dash || []);
				c.lineWidth = this.width || 3;
				c.strokeStyle = this.strokeColor;
				c.stroke();
			}
			if (this.color) {
				c.mozFillRule = 'evenodd';			
				c.fillStyle = this.color;
				c.fill('evenodd');
			}
			c.closePath();
		}
	},
});

/**
 * DOMTagOverlay类，地图点标抽象类，不可直接实例化。
 * @class DOMTagOverlay
 * @extends {TMap.Overlay}
 * @param  {TMap.Point}      pt 标注位置的经纬度
 */
TMap.DOMTagOverlay = function(pt) {
	Extends(this, TMap.Overlay, arguments);

	this.point = TMap.Point.toPoint(pt);
	this.listener = 0;
	this._sv = null;
	this._attached = false;
	this._clickProc = null;
	this.width = this.height = 10;
}
inherit(TMap.DOMTagOverlay, TMap.Overlay, {
	/**
	 * 设置点标注的经纬度
	 * @method setPoint
	 * @param  {TMap.Point} pt 标注位置的经纬度
	 */
	setPoint: function(pt) {
		var p = toPoint(pt);
		if (p) this.point = p;
	},
	/**
	 * 获取点标注的经纬度
	 * @method getPoint
	 * @return {TMap.Point} 标注位置的经纬度
	 */
	getPoint: function() {
		return this.point;
	},
	// setPoint: function(pt) {
	// 	this.point = TMap.Point.toPoint(pt);
	// },
	_addToView: function(v) {
		if (this._owner) return;
		TMap.Overlay.prototype._addToView.bind(this)(v);
		// this._sv.appendTo(v.mapsv);
		this._sv.appendTo(v.domsv);
		this._attached = true;
		this.update();

		if (this._clickProc) this.click(this._clickProc);

		var me = this;
		this.listener = v.mapMode.addListener(function(){
			me.update();
		}, ["zoom", "move", "rotate", "resize"]);

		this._sv.mouseover(function() {
			me._oldzindex = me._sv.css("z-index");
			me._sv.css({"z-index":100});
		}).mouseout(function() {
			me._sv.css({"z-index": me._oldzindex || 20});
		});
	},
	_removeFromView: function() {
		this._sv.detach();
		this._sv._attached = false;
		this._owner && this._owner.mapMode.removeListener(this.listener);
		this.listener = 0;
		this._owner = null;
		this._sv.unbind();
		TMap.Overlay.prototype._removeFromView.bind(this)();
	},
	getUpdatedPosition: function() {
		if (this._owner && this.point) {
			// var offset = this._owner.getBodyOffset();
			var ret = this._owner.mapMode.pointAtLonlat(this.point.lon, this.point.lat);
			// ret[0] += offset.x;
			// ret[1] += offset.y;
			ret.push(ret[0] + this.width);
			ret.push(ret[1] + this.height);
			return ret;
		} 
	},
	update: function(){
		if (this._owner && this.point) {
			var pt = this.getUpdatedPosition(), wb = this._owner;
			var attach = pt[2] > 0 && pt[3] > 0 && pt[0] < wb.width && pt[1] < wb.height;
			if (attach) {
				if (!this._attached) {
					// this._sv.appendTo(this._owner.mapsv);
					this._sv.appendTo(this._owner.domsv);
				} 
				this._sv.css({ left: pt[0], top: pt[1]});
			} else {
				if (this._attached) 
					this._sv.detach();
			}
			this._attached = attach; 
		}
	},
	hide: function(){this._sv.hide(); this._visible = false;},
	show: function(){this._sv.show(); this._visible = true;},
	/**
	 * 添加点击事件响应函数
	 * @method click
	 * @param  {function} func 待添加的鼠标点击事件函数
	 */
	click: function(func) {
		this._clickProc = func;
		this._sv.unbind('click');
		this._sv.bind('click', func);
	},
});


/**
 * 	Marker类，此类表示地图上一个标点用图像标注。
 * 	
 *	@class Marker
 *	@constructor
 *	@extends TMap.DOMTagOverlay
 *	@param {TMap.Point} point 	标注点的经纬度
 */
TMap.Marker = function(pt) {
	Extends(this, TMap.DOMTagOverlay, arguments);
	this._sv =  $(tagDIV).attr({class:"tkm-map-pin"});

	/**
	 * width属性，用于描述Marker覆盖物的展示图形的宽度。该属性不要直接修改，如有修改需要，请使用setSize方法。
	 * @property {number} width
	 */
	/**
	 * height属性，用于描述Marker覆盖物的展示图形的高度。该属性不要直接修改，如有修改需要，请使用setSize方法。
	 * @property {number} height
	 */
	this.width = this.height = 16;

	/**
	 * offsetX属性，用于描述Marker覆盖物的展示图形相对锚点的X轴上的偏移量。该属性不要直接修改，如有修改需要，请使用setOffset方法。
	 * @property {number} offsetX
	 * @default 0
	 */
	/**
	 * offsetY属性，用于描述Marker覆盖物的展示图形相对锚点的Y轴上的偏移量。该属性不要直接修改，如有修改需要，请使用setOffset方法。
	 * @property {number} offsetY
	 * @default 0
	 */
	this.offsetX = this.offsetY = 0;
	this._getAnchor = this._getCenter0;
	this._anchor = 0;
	this.onclick = null;
}

inherit(TMap.Marker, TMap.DOMTagOverlay, {
	_getCenter0: function() {
		return [-this.width/2, -this.height/2];
	},
	_getCenter1: function() {
		return [-this.width/2, -this.height];
	},
	_getCenter2: function() {
		return [0, -this.height];
	},
	_getCenter3: function() {
		return [0, -this.height/2];
	},
	_getCenter4: function() {
		return [0, 0];
	},
	_getCenter5: function() {
		return [-this.width/2, 0];
	},
	_getCenter6: function() {
		return [-this.width, 0];
	},
	_getCenter7: function() {
		return [-this.width, -this.height/2];
	},
	_getCenter8: function() {
		return [-this.width, -this.height];
	},

	/**
	 * 	设置图片
	 *
	 * 	@method setImage
	 *	@param {string} url 	图片的URL
	 */
	setImage: function(url) {
		this._sv.css({"background-image": 'url("'+url+'")'});
		var self = this;
		var image = new Image();
		image.onload = function() {
			self._sizeSet || self.setSize(image.width, image.height);
		};
		image.src = url;
	},
	/**
	 * 	设置图片
	 *
	 * 	@method getImage
	 *	@return {string} 图片的URL
	 */
	getImage: function() {
		return this._sv.css("background-image");
	},

	/**
	 * 设置Marker的尺寸大小
	 * 
	 * @method setSize
	 * @param  {number} width 宽度
	 * @param  {number} height 高度
	 */
	setSize: function(w,h) {
		this.width = w;
		this.height = h;
		this._sizeSet = true;
		this._sv.css({width: w+'px', height: h+"px"});
		this.update();
	},

	/**
	 * 设置对锚点的偏移量
	 * @method setOffset
	 * @param  {TMap.Pixel | number}  ox 偏移对象或X轴上相对锚点的偏移量
	 * @param  {number}  oy Y轴上相对锚点的偏移量；当第一个参数为Pixel对象时，此参数会被忽略
	 */
	setOffset: function(ox, oy) {
		if (typeof ox.x == 'number') {
			this.offsetX = ox.x;
			this.offsetY = ox.y;			
		} else {
			this.offsetX = ox;
			this.offsetY = oy;			
		}

		this.update();
	},

	/**
	 * 获取相对锚点的偏移量
	 * @method getOffset
	 * @return {TMap.Pixel}  Marker相对锚点的偏移量
	 */
	getOffset: function() {
		return new TMap.Pixel(this.offsetX, this.offsetY);
	},

	/**
	 * 设置__锚点类型__
	 * 
	 * <table border="1">
	 * <tr><th>类型值&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>类型含义</th></tr>
	 * <tr><td>0</td><td>锚点位于中心点</td></tr>
	 * <tr><td>1</td><td>锚点位于正下方</td></tr>
	 * <tr><td>2</td><td>锚点位于左上角</td></tr>
	 * <tr><td>3</td><td>锚点位于正左方</td></tr>
	 * <tr><td>4</td><td>锚点位于左上角</td></tr>
	 * <tr><td>5</td><td>锚点位于正上方</td></tr>
	 * <tr><td>6</td><td>锚点位于右上角</td></tr>
	 * <tr><td>7</td><td>锚点位于正右方</td></tr>
	 * <tr><td>8</td><td>锚点位于右下角</td></tr>
	 * </table>
	 * 
	 * @method setAnchor
	 * @param  {number}  anchor 锚点类型
	 */
	setAnchor: function(anchor) {
		this._anchor = anchor;
		this._getAnchor = this["_getCenter"+anchor];
	},

	/**
	 * 获取__锚点类型__
	 * @method getAnchor
	 * @see  setAnchor
	 * @return {number}  锚点类型，与setAnchor相同
	 */
	getAnchor: function() {
		return this._anchor;
	},

	getUpdatedPosition: function() {
		if (this._owner && this.point) {
			// var offset = this._owner.getBodyOffset();
			var anc = this._getAnchor();
			var ret = this._owner.mapMode.pointAtLonlat(this.point.lon, this.point.lat);

			ret[0] += anc[0] + this.offsetX;//offset.x + 
			ret[1] += anc[1] + this.offsetY;//offset.y + 

			ret.push(ret[0] + this.width);
			ret.push(ret[1] + this.height);
			return ret;
		} 
	},

});




/**
 * TextIconOverlay类，地图点标抽象类，不可直接实例化。
 * @class TextIconOverlay
 * @extends {TMap.Marker}
 * @param  {TMap.Point}      pt 标注位置的经纬度
 * @param  {string}      文本内容
 * @param  {object}      pt 标注位置的经纬度
 */
TMap.TextIconOverlay = function(pt, txt, opts) {
	Extends(this, TMap.Marker, arguments);
	this._sv = $(tagDIV).text(txt).attr({class:"tkm-pin-overlay"}).css({
		"font-size": "10px",
		"font-family": "Arial, sans-serif",
		"font-weight": "bold",
	});

	this._sv.css({"line-height": this._sv.css("height")});
}
inherit(TMap.TextIconOverlay, TMap.DOMTagOverlay, {
	// update: function(){
	// 	var pt = this.getUpdatedPosition();
	// 	if (pt) {
	// 		console.log(pt);
	// 		this._sv.css({left: pt[0]-this._sv.width()/2, top: pt[1]-this._sv.height()/2});
	// 	}
	// },
	setPoint: function(pt) {
		this.point = TMap.Point.toPoint(pt);
		this.update();
	},
	setText: function(txt) {
		this._sv.text(txt);
	},
});

/**
 *	方便简单使用的地图标点气泡
 * 
 *	@class Bubble
 *	@constructor
 *	@extends TMap.Marker
 *	@param {TMap.Point} point  	标注点的经纬度
 */
TMap.Bubble = function(pt) {
	Extends(this, TMap.Marker, arguments);
	this._style = 1;
	this.width = 26.9, this.height = 40;
	// this.width = 31, this.height = 46;
	this._sv =  $(tagDIV).attr({class:"tkm-map-pin"}).css({"background-image": 'url("img/mappin-'+this._style+'.png")', width: this.width+"px", height: this.height+"px"});
	this.onclick = null;
	this.setAnchor(1);
}
inherit(TMap.Bubble, TMap.Marker, {
	// update: function(){
	// 	var pt = TMap.DOMTagOverlay.prototype.update.bind(this)();
	// 	if (pt) {
	// 		this._sv.css({left: pt[0]-this.width/2, top: pt[1]-this.height});
	// 	}
	// },

	/**
	 * 	获取气泡风格
	 *
	 *  @method getStyle
	 *	@return {number} 气泡风格编号
	 */
	getStyle: function() {
		return this._style;
	},

	/**
	 * 	设置气泡风格
	 *
	 *  @method setStyle
	 *	@param {number} 气泡风格编号
	 */
	setStyle: function(style) {
		if (0 < style && style <= 6) {
			this._style = style;
			this._sv.css({"background-image": 'url("img/mappin-'+this._style+'.png")'});	
		}
	},
});
	

/**
 *  InfoWindow类，地图信息窗类，此类表示地图上包含信息的窗口。
 *  
 *	@class InfoWindow
 *	@constructor
 *	@extends TMap.DOMTagOverlay
 *	@param {TMap.Point} point  	标注点的经纬度
 */
TMap.InfoWindow = function(pt) {
	Extends(this, TMap.DOMTagOverlay, arguments);

	this.arrow = $("<tktrs>").append($("<tktri>"));
	/**
	 *	HTMLElement要素的jQuery对象
	 *	
	 *	@property {jQuery} contentBox 
	 */
	this.contentBox = $(tagDIV).attr({class:"tkm-bubble-content"});
	this._sv = $(tagDIV).attr({class:"tkm-bubble"}).append(this.contentBox, this.arrow);
	
	this.width = this.height = 40;
	this._resize(100, 40);
	this.offset = 0;
}

inherit(TMap.InfoWindow, TMap.DOMTagOverlay, {
	getUpdatedPosition: function() {
		var pt = TMap.DOMTagOverlay.prototype.getUpdatedPosition.bind(this)();
		if (pt) {
			pt[0] += -this.width/2, pt[1] += -this.height-this.offset-12;
			return pt;
		}
	},
	/**
	 * 设置文本
	 * 
	 * @method text
	 * @param  {string} txt InfoWindow上要显示的文本内容
	 */
	text: function(txt) {
		var font = {"font-size":"14px"};
		this.contentBox.text(txt);
		this.contentBox.css(font);
		var a = txt.visualLength(font);
		this._resize(a+20, 40);
	},

	/**
	 * 设置InfoWindow尺寸大小
	 * 
	 * @method setSize
	 * @param  {TMap.Size | number} w 	尺寸对象或InfoWindow的宽度
	 * @param  {number} h InfoWindow的高度，当第一个参数为尺寸对象时，该参数会被忽略
	 */
	setSize: function(w, h) {
		if (w.x);
		this._resize(w,h);
		this.update();
	},
	/**
	 * 获取InfoWindow尺寸大小
	 * 
	 * @method getSize
	 * @return {TMap.Size} InfoWindow尺寸大小对象
	 */
	getSize: function() {
		return new TMap.Size(this.width, this.height);
	},

	/**
	 * 获取偏移距离
	 * 
	 * @method getOffset
	 * @return {number}  偏移距离
	 */
	getOffset: function() {
		return this.offset;
	},
	/**
	 * 设置偏移距离
	 * 
	 * @method setOffset
	 * @param  {number}  offset 待设置偏移点
	 */
	setOffset: function(off) {
		this.offset = off || 0;
		this.update();
	},

	_resize: function(w, h) {
		if (w <= 40) w = 40;
		this.width = w;
		this.height = h;
		this._sv.css({width: w+"px", height: h+"px"});
		this.arrow.css({left: (w/2-10)+"px"});
	},
});

// 接口

// 图层控制
// 绘制接口

// 事件：覆盖物、地图
// 标注：mark

// 生成配图两步

})();