(function(){
	"use strict";

//////////////////////////////////////////////////////////////////////
 // *
 // *	tkujs.js
 // *
 // *	tkujs is used for tk unversal js utils. This file depends on
 // *	jQuery.
 // *
//////////////////////////////////////////////////////////////////////
 /** 
  *	图云地图SDK的命名根空间
  *	
  *	@module TMap 
  */
var TMap = window.TMap = {
	domain: "http://" + window.location.host,
	timeout: 10000,
	// private: {},
};

var TMapEngine = {
	private: {},
};// = new tkMapEngine();	//引擎对象

function Extends(obj, sup, arg) {
	if (arg) 
		$.extend(obj, new sup(arg[0]));
	else
		$.extend(obj, new sup());
	for (var k in sup.prototype) 
		if (obj[k]) delete obj[k];
}
function extendsFrom(cls, abcls) {
	for (var f in abcls.prototype) {
		if (cls.prototype[f] == null) {
			cls.prototype[f] = abcls.prototype[f];
		}
	}
}

function inherit(cls, sup, opt) {
	cls.prototype = $.extend(cls.prototype, sup.prototype, opt);
}

if (Set.prototype.entries == null) {
	Set.prototype.merge = function(set) {
		if (set instanceof Set) {
			for (var k in set) {
				this.add(k);
			}
		}
	}
} else {
	Set.prototype.merge = function(set) {
		if (set instanceof Set) {
			var value, iter = set.entries();
			value = iter.next();
			while (value.value) {
				this.add(value.value[0]);
				value = iter.next();
			}	
		}
	}
}

String.prototype.visualLength = function(style) { 
	var ruler = $("#tkm-text-ruler"); 
	if (style) {
		ruler.css(style);
	}
	ruler.text(this); 
	return ruler.width(); 
} 

Date.prototype.format = function(format) {
	var o = {
		"M+": this.getMonth()+1,	//month
		"d+": this.getDate(),		//day
		"h+": this.getHours(),		//hour
		"m+": this.getMinutes(),	//minute
		"s+": this.getSeconds(),	//second
		"q+": Math.floor((this.getMonth()+3)/3),  //quarter
		"S+": this.getMilliseconds()//millisecond
	}

	if(/(y+)/.test(format)) 
		format = format.replace(RegExp.$1, 
								(this.getFullYear()+"").substr(4 - RegExp.$1.length));

	for(var k in o)
		if (new RegExp("("+ k +")").test(format))
			format = format.replace(RegExp.$1,
									RegExp.$1.length == 1? o[k]:
										("00" + o[k]).substr(("" + o[k]).length));
	return format;
}

function factoryWrap(cls, func) {
	return (function() {
		var obj = new cls();
		if (typeof(func) == 'function')
			func(obj);
		return obj;
	});
}

function benchmark() {
	this.count = 0;
	this.elapse= 0;
	this.average=0;
	this.maximum=0;
}
benchmark.prototype = {
	begin: function(){
		this.tick = Date.now();
	},
	end: function() {
		var delta = Date.now() - this.tick;
		if (delta > this.maximum) this.maximum = delta;
		this.elapse += delta;
		this.average = this.elapse / ++this.count;
	},
	reset: function() {
		this.count = 0;
		this.elapse= 0;
		this.average=0;
		this.maximum=0;
	},
};

function tkEventTarget() {}
tkEventTarget.prototype = {
	_addListener: function(func, e) {
		var arrlisteners = this._listeners[e];
		if (arrlisteners == null) {
			this._listeners[e] = arrlisteners = [];
		} 
		arrlisteners.push({id: this._listeners._count, f: func});
	},
	addListener: function(func, events, runImmediately) {
		if (this._listeners == null) 
			this._listeners = {};
		
		if (this._listeners._count == null) 
			this._listeners._count = 0;
		++this._listeners._count;

		if (events instanceof Array) {
			for (var i = 0, l = events.length; i < l; ++i) {
				this._addListener(func, events[i]);
			}
		} else {
			this._addListener(func, events);
		}
		if (runImmediately) func();
		return this._listeners._count;
	},
	removeListener: function(listener) {
		if (listener == 0 || this._listeners == null) 
			return; 
		var id = 0;
		for (var k in this._listeners) {
			var arr = this._listeners[k], idx = -1;
			if (arr instanceof Array) {
				for (var i = 0, l = arr.length; i < l; ++i) {
					if (arr[i].id == listener || arr[i].f == listener) {
						id = arr[i].id;
						idx = i;
						break;
					}
				}
				if (idx >= 0) {
					arr.splice(idx, 1);
				}
			}
		}
		return id;
	},
	_notifyListener: function(e, options) {
		var arrlisteners = this._listeners[e];
		if (arrlisteners == null) 
			return;

		if (options == null) 
			options = {};
		if (options.target == null)
			options.target = this._listenerTargetGetter? this._listenerTargetGetter(this): this;
		if (options.type == null)
			options.type = e;
		for (var i = 0, l; l = arrlisteners[i++]; ) {
			l.f(options);
		}
	},
	listenerNotify: function(e, options) {
		if (this._listeners == null) 
			return;
		
		if (e instanceof Array) {
			for (var i in e) {
				this._notifyListener(e[i], options);
			}
		} else {
			this._notifyListener(e, options);
		}
		
	},
};


function tkEnvironment(){
	var u = navigator.userAgent, app = navigator.appVersion;
	var uu = u.toLowerCase();

	// browser kernel type
	this.trident = u.indexOf("Trident") > -1; //IE内核
	this.presto = u.indexOf("Presto") > -1; //opera内核
	this.tasman = u.indexOf("Tasman") > -1; //是否Tasman内核
	this.webKit = u.indexOf("AppleWebKit") > -1; //苹果、谷歌内核
	this.khtml = u.indexOf("KHTML") > -1;
	this.gecko = u.indexOf("Gecko") > -1 && !this.khtml; //火狐内核
	this.webApp = u.indexOf("Safari") == -1; //是否web程序，没有头部与底部
	
	// browser type
	this.msie = u.indexOf("MSIE") > -1;
	this.edge = u.indexOf("Edge") > -1;
	this.firefox = u.indexOf("Firefox") > -1;
	this.opera = u.indexOf("Opera") > -1;
	this.safari = u.indexOf("Safari") > -1;
	this.chrome = u.indexOf("Chrome") > -1 || (0);

	this.microsoft = this.msie || this.edge;
	
	// OS type
	this.ios = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
	this.android = u.indexOf("Android") > -1 || u.indexOf("Linux") > -1; //android终端或者uc浏览器
	this.linux = u.indexOf("Linux") > -1;
	this.windows = u.indexOf("Windows") > -1;

	// Device type
	this.macintosh = u.indexOf("Macintosh") > -1;
	this.mobile = !!u.match(/AppleWebKit.*Mobile.*/) || !!u.match(/AppleWebKit/); //是否为移动终端
	this.iPhone = u.indexOf("iPhone") > -1 || u.indexOf("Mac") > -1; //是否为iPhone或者QQHD浏览器
	this.iPad = u.indexOf("iPad") > -1; //是否iPad

	this.language = (navigator.browserLanguage || navigator.language).toLowerCase();

};


//////////////////////////////////////////////////////////////////////
 // *
 // *	anime.js
 // *
 // *	anime is pronounciation for "animation" in Japanese. We use this to
 // * 	confuse our readers who want hack back.
 // *
//////////////////////////////////////////////////////////////////////
 // root is tkMapCanvasDynamic instance
 // anmFunc is expected to have functions modeChange, render; properties
 //		 frameCount, bbox, drawing
 // kanimate object provides some functions pause, animating, clear, 
 //		 isInBBox, isRectIntersect, initContext;
 //		 variables context, sv, width, height
(function(){

/**
 * 绘制数据集
 * @class  Dataset
 * @constructor
 * @namespace TMap
 * @param {object} data 数据
 * @param {function} func 数据处理方法
 */
TMap.Dataset = function Dataset(data, func) {
	
	/**
	 * 最大值
	 * @property {number} maxVal 
	 */
	this.maxVal = 20;

	/**
	 * 数据帧数
	 * @property {Number} frameCount
	 */
	this.frameCount = 1;
	var me = this;
	if (func) {
		me.data = func(data);	
	} else {
		me.data = data;	
	}

	this.get = function() {
		return {
			cur: 0,
			next: function() {
				if (this.cur < me.data.length) {
					var item = {};
					$.extend(item, me.data[this.cur++]);
					if (item.x == null) {
						var tmp = me._owner.pointToPixel(item);
						item.x = tmp.x;
						item.y = tmp.y;
					}
					return item;
				}
				return null;
			}
		}
	};
}
/**
 * 获取数据集迭代器
 * @method get
 * @return {TMap.DatasetIterator} 返回当前数据集迭代器
 */
TMap.Dataset.prototype.get = function() {
	return null;
}

//////////////////////////////////////////////////////////////////////////////////
/**
 * 数据集迭代器
 * @class  DatasetIterator
 * @namespace TMap
 */
/**
 * 获取下一个数据集记录项
 * @method next
 * @return {TMap.DatasetEntry} 下一个数据集记录项，如果为结尾，则返回null
 */

//////////////////////////////////////////////////////////////////////////////////
/**
 * 数据集记录项
 * @class  DatasetEntry
 * @namespace TMap
 */
/**
 * X轴坐标值，可以是经度或是屏幕X轴坐标值
 * @property {number} x 
 */
/**
 * Y轴坐标值，可以是经度或是屏幕X轴坐标值
 * @property {number} y
 */
/**
 * 计数值，可以是经度或是屏幕X轴坐标值
 * @property {number} count
 */



/**
 * 
 * @class  DrawerAgent
 * @namespace TMap
 */

TMap.Animater = {};	
TMapEngine.private.kanimate = 
function kanimate(root, anmFunc, dataset, options) { "use strict";
var tkmapview = root._owner, context = root.context, mapMode = tkmapview.mapMode;
var KA = {}, imageCache={}, AFR;
var timer, animateTimer = null;
var setuped, kav_stutter;
var mx, my, hw, hh, s, ss, ssa,ssb,ssc,ssd;

function init() {
	timer = 0;
	setuped= false, 
	kav_stutter=true;
	KA._animeIsNotPausedButPlaying = false;
	/**
	 * 绘制上下文
	 * @property {CanvasRenderingContext2D} context
	 */
	KA.context = context;
	KA.sv = tkmapview.mapsv;
	AFR = new anmFunc(KA);
	root.start(true);
}

function listening() {
	s = 23-mapMode.z;
	mx = mapMode.mctX<<s;
	my = mapMode.mctY<<s;
	hw = mapMode.width/2;
	hh = mapMode.height/2;
	
	/**
	 * 绘图上下文的宽度
	 * @property {number} width
	 */
	KA.width = mapMode.width;
	
	/**
	 * 绘图上下文的高度
	 * @property {number} height
	 */
	KA.height = mapMode.height;

	ss = mapMode.scale/(1<<s);

	if (mapMode.rotate) {
		ssa = ss*mapMode.cos0,
		ssb = ss*mapMode.sin0,
		ssc = -ssb,
		ssd = ssa;
	}

	var brr = AFR.bbox;
	if (brr) {
		var rr = mapMode.calcRange();
		for (var i =0; i < 4; ++i) rr[i]<<=s;
		if (brr.xl > rr[1] || brr.xr < rr[0] || brr.yt > rr[3] || brr.yb <rr[2])
			AFR.drawing = false;
		else
			AFR.drawing = true;	
	}
	
	KA.DBox = rr;
	KA.dataset = dataset;

	imageCache ={};
	AFR.modeChange();
}

function animating() {
	if (!setuped || kav_stutter || AFR.frameCount < 1)
		return;
	if (AFR.frameCount == 1) {
		triggerRender();
	} else {
		if (!animateTimer)
			animateTimer = setInterval(animating, root.interval || 125);

		triggerRender();
		if (KA._animeIsNotPausedButPlaying && ++timer >= AFR.frameCount) 
			timer = 0;
		AFR.update && AFR.update(timer);
	}
}

function triggerRender() {
	if (AFR.drawing) {
		var buffered = imageCache[timer];

		if (buffered) {
			context.putImageData(buffered,0,0);
		} else {
			clear();
			AFR.render(timer);
			imageCache[timer] = context.getImageData(0, 0, KA.width, KA.height);
		}
	} else {
		clear();
	}
	root._notifyFrameCallback(timer);
}

function show() {
	KA._animeIsNotPausedButPlaying = true;
	KA.animating();
}

function hide(noClean) {
	KA._animeIsNotPausedButPlaying = false;
	if (!noClean) setTimeout(clear, 35);
}

function stutter() {
	if (!setuped) return;
	kav_stutter = true;
}

function checkStutter() {
	if (!setuped) return;
	
	kav_stutter = false;
	if (KA._animeIsNotPausedButPlaying) KA.animating();	
	
}
function pause() {
	KA._animeIsNotPausedButPlaying = !KA._animeIsNotPausedButPlaying;	
	if (KA._animeIsNotPausedButPlaying) {
		animating();
	} else {
		clearInterval(animateTimer);
		animateTimer = null;
	}
}

function clear() {
	context.setTransform(1,0,0,1,0,0);
	context.clearRect(0,0,mapMode.width,mapMode.height);
}

function initContext(c,site) {
	if (mapMode.rotate) {
		var x = (site.x-mx)*ss,
			y = (site.y-my)*ss;
		var x1= x*mapMode.cos0 - y*mapMode.sin0 + hw,
			y1= x*mapMode.sin0 + y*mapMode.cos0 + hh;
		
		context.setTransform(ssa, ssb, ssc, ssd, x1, y1);
	} else {
		var x = (site.x-mx)*ss + hw,
			y = (site.y-my)*ss + hh;
		context.setTransform(ss, 0, 0, ss, x, y);
	}	
}
function isInBBox(x,y){
	return this.DBox[0]<= x && x<=this.DBox[1] && this.DBox[2] <=y && y<=this.DBox[3];
}
function isRectIntersect(bbox){
	return !(this.DBox[1] < bbox[0] || this.DBox[0] > bbox[1] || this.DBox[2] > bbox[3] || this.DBox[3] < bbox[2]);
}
function setTimer(t) {
	if (0 <= t && t < AFR.frameCount) {
		timer = t;
	}
}
function getTimer() {
	if (AFR.frameCount == 1) 
		return 0;
	else if (timer == 0)
		return AFR.frameCount - 1;
	else
		return timer - 1;
}

function setTimerInterval(v) {
	root.interval = v;
	clearInterval(animateTimer);
	animateTimer = null;
	if (KA._animeIsNotPausedButPlaying) animating();
}

	
	KA.setTimer = setTimer;
	KA.show = show;
	KA.hide = hide;
	KA.pause = pause;
	KA.stutter = stutter;
	KA.checkStutter = checkStutter;
	KA.clear = clear;
	KA.listening = listening;
	KA.animating = animating;
	KA.initContext = initContext;
	KA.isInBBox = isInBBox;
	KA.isRectIntersect = isRectIntersect;
	KA.mapMode = mapMode;
	/**
	 * dataset数据集
	 * @property {object}	dataset
	 */
	KA.dataset = dataset;
	/**
	 * 附加选项
	 * @property {object} options
	 */
	KA.options = options;

	root.start = function(freezen) {
		setuped = true;
		kav_stutter = false;

		if (KA.kaListener == null)
			KA.kaListener = mapMode.addListener(KA.listening, ["zoom", "move", "rotate", "resize"], true);

		root.show();
		if (freezen) {
			KA._animeIsNotPausedButPlaying = false;	
			triggerRender();
		} else {
			KA._animeIsNotPausedButPlaying = true;	
			KA.animating();
		}
	};
	root.setTimer = function setTimer(t) {
		if (0 <= t && t < AFR.frameCount) {
			timer = t;
			triggerRender();
		}
	};
	root.getTimer = getTimer;

	root.getFrameCount = function() {
		return AFR.frameCount;
	};
	root.pause = pause;
	root.isPausing = function(){return KA._animeIsNotPausedButPlaying;}
	root.stop = KA.hide;
	root.stutter = KA.stutter;
	root.checkStutter = KA.checkStutter;
	root.setTimerInterval = setTimerInterval;
	root.uninstall = function() {
		mapMode.removeListener(KA.kaListener);
		clearInterval(animateTimer);

		setuped = false;
		kav_stutter = true;
		KA._animeIsNotPausedButPlaying = false;
		AFR.drawing = false;
	
		imageCache = null;
		AFR = null;
		KA = null;
		delete root.getFrameCount;
		delete root.isPausing;
		delete root.setTimer;
		delete root.start;
		delete root.pause;
		delete root.stop;
		delete root.stutter;
		delete root.checkStutter;
		delete root.uninstall;
		delete root.setTimerInterval;
	}
	init();
}

	/**
	 * Animater 
	 * @class Animater
	 * @namespace TMap
	 */
	

//////////////////////////////////
 // *	Voronoi diagram
//////////////////////////////////
/**
 * Voronoi 动态图
 * @method Voronoi
 * @param {TMap.DrawerAgent} ka 动态图描述对象
 */
TMap.Animater.Voronoi =  
function animeVoronoi(ka) {
var sites = [];
var nsites;
var sliderButton;
var imageCache={};
var rulerData;
var timeUnit=10;

var bbox= {xl:1795215321,xr:1797133859,yt:880059313,yb:881988333};
	this.DBox = null;
	this.drawing = true;
	var AV_me = this;
function addControlPanel(sv) {
	var ruler = $("<canvas>").attr({width:"150px",height:"220px"}).css({position:"absolute",left:"5px",top:"5px"});
	var btndiv = $("<div>").attr({width:50,style:"position:absolute;left:55px;bottom:5px;background-color:rgb(246,172,22);"}).text("暂停").click(function(){
		ka.pause();
		if (btndiv.text()=="暂停") {
			btndiv.text("继续");
		} else {
			btndiv.text("暂停");
		}
	});

	drawRuler(ruler[0].getContext("2d"));

	var div = $("<div>").attr({class:"tkm-animate-control-panel"}).hide().append(ruler, btndiv);
	sv.append(div);
}

function addSliderPanel(sv) {
	var div = $("<div>").attr({class:"tkm-animate-control-slider"}).hide().append($("<div>").attr({class:"tkm-animate-control-slot"}),sliderButton=$("<div>").attr({class:"tkm-animate-control-button"}));
	sv.append(div);
	for (var i = 0; i <= 8; ++i) {
		var mk = $("<div>").attr({class:"tkm-animate-control-slotmark"}).css({left: (10+i*200/8)+"px"});
		div.append(mk);
	}


	$(function(){  
		var btn = sliderButton;
		var isRuning;
		var _move=false;//移动标记  
		var _x;//鼠标离控件左上角的相对位置  
		var updater = null;

		btn.click(function(){  
		//alert("click");//点击（松开后触发）  
		}).mousedown(function(e){  
			_move=true;  
			_x=e.pageX-parseInt(btn.css("left"));  
			// ka.stutter();
			isRuning = ka._animeIsNotPausedButPlaying;
			ka._animeIsNotPausedButPlaying = false;
		});  
		$(document).mousemove(function(e){  
			if(_move){  
				var x=e.pageX-_x;//移动时根据鼠标位置计算控件左上角的绝对位置  
				if (x < 0) x = 0;
				else if (x > 194) x = 194;

				btn.css({left:x});//控件新位置
				
				ka.setTimer((80-1)*x/194);
				if (!updater) {
					updater = setTimeout(function() {
											updater = null;
											render();
										}, 66);
				} 
			}  
		}).mouseup(function(){ 
			if (_move) {
				_move = false;  
				// ka.checkStutter();
				ka._animeIsNotPausedButPlaying = isRuning;
				isRuning && ka.animating();
			}
		});  
	});  
}

function drawRuler(c) {
	c.textBaseline =  "top";
	c.fillText("平湖溃堤淹没点图例",0,0);
	c.translate(0,20);

	var height = 200, unit = height/4;
	var grd = c.createLinearGradient(0,height,0,0);
	grd.addColorStop(0, 'rgba(0,255,0,0)');
	grd.addColorStop(0.25, 'yellow');
	grd.addColorStop(0.5, 'blue');
	grd.addColorStop(0.75, 'red');
	grd.addColorStop(1, 'black');
	c.fillStyle = grd;
	c.fillRect(0,0,20,height);
	c.strokeRect(0,0,20,height);

	c.beginPath();
	for (var i = 0; i < 5; ++i) {
		c.moveTo(20, i*unit);
		c.lineTo(23, i*unit);
	}
	c.stroke();
	c.closePath();

	c.fillStyle = "green";
	c.textBaseline =  "bottom";
	c.fillText("0米", 25, height);
	c.fillStyle = "yellow";
	c.textBaseline =  "middle";
	c.fillText("1米", 25, unit*3);
	c.fillStyle = "blue";
	c.fillText("2米", 25, unit*2);
	c.fillStyle = "red";
	c.fillText("3米", 25, unit);
	c.fillStyle = "black";
	c.textBaseline =  "top";
	c.fillText("4米及以上", 25, 0);
	
}


function color(v) {
	if (v <= 0) return null;
	if (v >= 5) return "#000";
	var x = ((256 * v / 5)|0)<<2;
	var alpha = x < 256? x/255: 1;
	return "rgba("+ rulerData[x]+ "," + rulerData[x+1]+","+ rulerData[x+2]+","+ alpha+ ")";
}
function value(site,timer) {
	var v = Math.floor(timer / timeUnit);
	var vv = timer % timeUnit;
	if (vv && v < 7) {
		var va = site.data[v], vb = site.data[v+1];
		vv /= timeUnit;
		return va + (vb-va) * vv;
	} else {
		return site.data[v];	
	}
}

function render(timer) {
	ka.clear();
	var context = ka.context;
	
	for (var i = 0; i < nsites; ++i) {
		// if (kav_stutter) return;
		var site = sites[i];
		var clr = color(value(site,timer));
		if (clr == null) continue;

		var bound = site.bound;
		ka.initContext(context, site);
		context.beginPath();			
		context.moveTo((bound[0]),(bound[1]));
		for (var j=2, l = bound.length; j<l; j+=2) {
			context.lineTo((bound[j]), (bound[j+1]));
		}
		context.fillStyle = clr;
		context.fill();
		context.closePath();
	}
}
function update(timer) {
	sliderButton.css({left: (200/80 *timer)+"px"});
}

function buildRuler() {
	var can = document.createElement("canvas");
	can.height = 1;
	can.width = 256;
	var c = can.getContext("2d");

	var grd = c.createLinearGradient(0,0,256,0);
	grd.addColorStop(0, 'green');
	grd.addColorStop(0.25, 'yellow');
	grd.addColorStop(0.5, 'blue');
	grd.addColorStop(0.75, 'red');
	grd.addColorStop(1, 'black');
	c.fillStyle = grd;
	c.fillRect(0,0,256,1);

	return c.getImageData(0, 0, 256, 1).data;
}

function modechange() {
	var ashow = ka.dataset;
	sites = [];
	for (var i = 0, l = ashow.length; i < l; ++i) {
		var site = ashow[i];
		var bound = site.bound;
		if (bound && ka.isInBBox(site.x, site.y)) {
			sites.push(site);
		}
	}
	nsites = sites.length;

	imageCache={};
}
	this.modeChange = modechange;
	this.render = render;
	this.frameCount = 80;
	this.bbox = bbox;
	this.update = update;

	addControlPanel(ka.sv);
	addSliderPanel(ka.sv);
	rulerData = buildRuler();
}

//////////////////////////////////
 // *	Scatter diagram
////////////////////////////////// 

/**
 * 散点动态图
 * @method scatter
 * @param {TMap.DrawerAgent} ka 动态图描述对象
 */
TMap.Animater.scatter =
function scatterAnime(ka) {
var dataset = ka.dataset;
var options = ka.options;
var drawer = new TMap.Drawer.scattermap(ka, dataset, options);
	this.modeChange = function() {

	};
	this.render = function(timer){
		dataset.sec = timer;
		drawer.render();
	}
 	this.frameCount = dataset.frameCount;
 	this.bbox = [-Infinity, Infinity, -Infinity, Infinity];
 	this.drawing = true;
}
//////////////////////////////////
 // *	Heatmap diagram
//////////////////////////////////
/**
 * 热力动态图
 * @method heatmap
 * @param {TMap.DrawerAgent} ka 动态图描述对象
 */
TMap.Animater.heatmap =
function heatmapKanime(ka) {
// var dataset = ka.dataset;
var drawer;

// var bbox = {xl:1795215321,xr:1797133859,yt:880059313,yb:881988333};
	this.DBox = null;
	this.drawing = true;

function render(timer) {
	// dataset.timer = timer>10? 20-timer: timer;
	ka.dataset.sec = timer;
	drawer.render();
}

function modechange() {
	drawer = new TMap.Drawer.heatmap(ka, ka.dataset, ka.options); 	
}

	this.modeChange = modechange;
	this.render = render;
	this.frameCount = ka.dataset.frameCount;
	// this.bbox = bbox;
}


///////////////////////////////////////////////////
//	weibo
///////////////////////////////////////////////////
function weiboKanime(ka) {
const M2PI = Math.PI*2;
var backgroud;
var dataset1, dataset2, dataset3;
var cdata1, cdata2, cdata3;

var bbox = {xl:0, xr:Infinity, yt:0, yb: Infinity };
	this.DBox = null;
	this.drawing = true;
	var AV_me = this;

function render(timer) {
	var context = ka.context, ratio = ka.mapMode.ratio;
	if (backgroud == null) {
		context.setTransform(ratio,0,0,ratio,0,0);
		context.beginPath()
		for (var i =0, a, l= cdata1.length; i < l; ++i) {
			a = cdata1[i];
			context.moveTo(a[0],a[1]);
			context.arc(a[0],a[1],0.7*ratio,0,M2PI);
		}
		context.fillStyle='rgba(200, 200, 0, 0.8)';
		context.fill();
		context.closePath();

		context.beginPath()
		for (var i =0, a, l= cdata2.length; i < l; ++i) {
			a = cdata2[i];
			context.moveTo(a[0],a[1]);
			context.arc(a[0],a[1],0.7*ratio,0,M2PI);
		}
		context.fillStyle='rgba(255, 250, 0, 0.8)';
		context.fill();
		context.closePath();

		context.beginPath()
		for (var i =0, a, l= cdata3.length; i < l; ++i) {
			a = cdata3[i];
			context.moveTo(a[0],a[1]);
			context.arc(a[0],a[1],0.7*ratio,0,M2PI);
		}
		context.fillStyle='rgba(255, 250, 250, 0.6)';
		context.fill();
		context.closePath();


		background=context.getImageData(0,0, ka.width,ka.height);
	} else {
		context.putImageData(backgroud,0,0);
	}


	context.beginPath()
	for (var i = 0, a, l =200, ll = cdata2.length; i < l; ++i) {
		a = cdata2[ (Math.random()*ll) | 0];
		context.moveTo(a[0],a[1]);
		context.arc(a[0],a[1],1.1*ratio,0,M2PI);
	}
	context.fillStyle='rgba(255, 250, 250, 0.9)';
	context.fill();
	context.closePath();

}

function modechange() {
	var e;
	cdata1 = [];
	for (var i =0, a, l= dataset1.length; i < l; ++i) {
		a = dataset1[i];
		e = ka.mapMode.pointAtLonlat(a[0],a[1]);
		if (e[0]<0 || e[0]>ka.width || e[1]<0 || e[1]>ka.height) continue;
		cdata1.push(e);
	}
	
	cdata2 = [];
	for (var i =0, a, l= dataset2.length; i < l; ++i) {
		a = dataset2[i];
		e = ka.mapMode.pointAtLonlat(a[0],a[1]);
		if (e[0]<0 || e[0]>ka.width || e[1]<0 || e[1]>ka.height) continue;
		cdata2.push(e);
	}

	cdata3 = [];
	for (var i =0, a, l= dataset3.length; i < l; ++i) {
		a = dataset3[i];
		e = ka.mapMode.pointAtLonlat(a[0],a[1]);
		if (e[0]<0 || e[0]>ka.width || e[1]<0 || e[1]>ka.height) continue;
		cdata3.push(e);
	}	
	
	backgroud = null;
}
	$.get("weibo.json", function(rs){
	    var data1 = [];
        var data2 = [];
        var data3 = [];

		for (var i = 0; i < rs[0].length; i++) {
            var geoCoord = rs[0][i].geoCoord;
            data1.push(geoCoord);
        }

        for (var i = 0; i < rs[1].length; i++) {
            var geoCoord = rs[1][i].geoCoord;
            data2.push(geoCoord);
        }

        for (var i = 0; i < rs[2].length; i++) {
            var geoCoord = rs[2][i].geoCoord;
            data3.push(geoCoord);
        }
        dataset1 = data1, dataset2 = data2, dataset3 = data3;
	});

	this.modeChange = modechange;
	this.render = render;
	this.frameCount = 10;
	this.bbox = bbox;
}

})();
//////////////////////////////////////////////////////////////////////
 // *
 // *	chirisugaku.js
 // *
 // *	chirisugaku is pronounciation for "geographical mathematic" in 
 // *	Japanese. We use this to confuse our readers who want hack back.
 // *
//////////////////////////////////////////////////////////////////////
(function(){
const M_PI = Math.PI, M_PI_2 = Math.PI/2, M_2PI = Math.PI*2, M_4PI = Math.PI*4;
const M_RPD = M_PI/180.0, M_DPR = 180.0/M_PI;
const TK_EARTH_RADIUS = 6378137.0;
const TK_EARTH_PERIMETER = TK_EARTH_RADIUS*M_2PI;
const INF = 16331239353195370;

	/**
	 * 地理信息计算工具类
	 * @namespace GeoUtils
	 * @namespace TMap
	 */
	var GeoUtils = window.TMap.GeoUtils = window.TMap.GeoUtils || function(){};

	/**
	 *  经纬度转为墨卡托坐标
	 *  @method ll2mct
	 *  @namespace TMap.GeoUtils
	 *  @param {number} lon [description]
	 *  @param {number} lat [description]
	 *  @param {number} z [description]
	 *  
	 */
	var ll2mct = GeoUtils.ll2mct = function (lon,lat,z) {
		var scale = 256 * (1 << z);
		return [(lon+180.0)/360.0*scale, ((M_2PI - Math.log(2.0 / (1.0 - Math.sin(lat * M_RPD)) - 1.0))/M_4PI) * scale];
	},
	/**
	 *  墨卡托坐标转为经纬度
	 *  
	 */
	mct2ll = GeoUtils.mct2ll = function (mx,my,z) {
		var scale = 1.0 / (256 * (1 << z));
		return [mx*360*scale-180, Math.asin(1-2/(1 + Math.exp(M_2PI-M_4PI*my*scale)))*M_DPR];
	},
	/**
	 *  瓦片行列号转为经纬度
	 *  
	 */
	t2ll = GeoUtils.t2ll = function (mx,my,z) {
		var scale = 1.0 / (1 << z);
		return [mx*360*scale-180, Math.asin(1-2/(1 + Math.exp(M_2PI-M_4PI*my*scale)))*M_DPR];
	},
	/**
	 *  墨卡托坐标转为WMT像素坐标
	 *  
	 */
	mct2wmt = GeoUtils.mct2wmt = function (mx,my,z) {
		var scale = 1.0 / (256 * (1 << z));
		var lon = mx*360*scale-180, lat = Math.asin(1-2/(1 + Math.exp(M_2PI-M_4PI*my*scale)))*M_DPR;
		scale = (1<<z)/360.0;
		return [((lon+180.0)*scale), ((90.0-lat)*scale)];
	},
	/**
	 *  WMT像素坐标转为墨卡托坐标
	 *  
	 */
	wmt2mct = GeoUtils.wmt2mct = function (x,y,z) {
		var k = 1<<z, os = 360.0/k, scale = 256 * k;;
		var lon = (x*os)-180.0;
		lon = (lon+180.0)/360.0*scale;
		if (y == 0) return [lon, 0];
		else if (y+y == k) return [lon, k<<8];
		var lat = 90.0- y*os;
		return [lon, ((M_2PI - Math.log(2.0 / (1.0 - Math.sin(lat * M_RPD)) - 1.0))/M_4PI) * scale];
	};

	/**
	 *  经度（弧度）转为-pi~pi
	 *  
	 */
	var fixrlon = GeoUtils.fixrlon = function(lon) {
		return (((lon %M_2PI)+M_PI)%M_2PI)-M_PI;
	},
	/**
	 *  纬度（弧度）转为-pi/2~pi/2
	 *  
	 */
	fixrlat = GeoUtils.fixrlat = function (lat) {
		return (((lat % M_PI)+M_PI_2)%M_PI)-M_PI_2;
	},
	/**
	 *  经度（角度）转为-180~180
	 *  
	 */
	fixlon = GeoUtils.fixlon = function (lon) {
		return (((lon % 360)+180)%360)-180;
	},
	/**
	 *  纬度（弧度）转为-90~90
	 *  
	 */	
	fixlat = GeoUtils.fixlat = function (lat) {
		return (((lat % 180)+90)%180)-90;
	};

	/**
	 *  生成二维莫顿码
	 *
	 */
	var morton = GeoUtils.morton = function (x,y) {
		var mor = 0, bit = 0;
		while (x || y) {
			mor |= (x&1)<<bit++, x>>=1;
			mor |= (y&1)<<bit++, y>>=1;
		}
		return mor;
	},

	/**
	 *  生成瓦片主键
	 *
	 */
	makekey = GeoUtils.makekey = function (x,y,z) {
		var mor = 0, bit = 0, head, post, mid;
		while (x || y) {
			mor |= (x&1)<<bit++, x>>=1;
			mor |= (y&1)<<bit++, y>>=1;
			if (bit>29) {
				head = (mor % 32) ^ z;
				head = (head).toString(32);
				post= (mor).toString(32);
				mor = bit = 0;
			}
		}
		mid = mor? (mor).toString(32):"";
		if (head==null) {
			head = (mor % 32) ^ z;
			head = (head).toString(32);
		}
		if (post == null) post = mor?"":"0";
		return head+mid+post;
	};

/**
 *  将v值夹在l和r之间即：[l, r)
 *  @param v
 */
GeoUtils.clamp = function (v, l, r) {   
	if (v < l) v = l;
	if (v >= r) v = r-1; 
	return v;
};
/**
 *  将v值限制在T周期中即：[0, T)
 *
 */
GeoUtils.cloop = function (v, T) {  
	if (v < 0) v += T;
	if (v >= T) v -= T; 
	return v;
};
/**
 *  地球半径
 */
GeoUtils.TK_EARTH_RADIUS = TK_EARTH_RADIUS;
GeoUtils.rightCoordinateSystem = function (lon, lat) {
	lon *= M_RPD, lat *= M_RPD;
	var x = R*Math.cos(lon)*Math.cos(lat);
	var y = R*Math.sin(lon)*Math.cos(lat);
	var z = R*Math.sin(lat);
	return [x,-z,y];
};
GeoUtils.nor_points = function (lon1, lat1, lon2, lat2) {
	if (lat1 == lat2) {
		if (lon1 == lon2) return null;
		if (lat1 == 0) return [0,M_PI_2];	
	} 
	lon1 *= M_RPD, lat1 *= M_RPD, lon2 *= M_RPD, lat2 *= M_RPD;
	var tlat1 = Math.tan(lat1), tlat2 = Math.tan(lat2);
	if (-INF < tlat1 && tlat1 < INF && -INF < tlat2 && tlat2 < INF) {
		var deno = tlat2 * Math.sin(lon1) - tlat1 * Math.sin(lon2);
		var lon = Math.atan((tlat1 * Math.cos(lon2) - tlat2 * Math.cos(lon1)) / deno);
		var tanlat = tlat1 != 0? -Math.cos(lon1 - lon) / tlat1: -Math.cos(lon2 - lon) / tlat2;
		return [lon, Math.atan(tanlat)];
	} else {
		if (tlat1 == tlat2) 
			return null;
		if (-INF < tlat1 && tlat1 < INF) 
			return [lon2+M_PI_2, 0];
		if (-INF < tlat2 && tlat2 < INF) 
			return [lon1+M_PI_2, 0];
		return null;
	}
};

GeoUtils.dis_point_curveseg = function(lon, lat, lon1, lat1, lon2, lat2){
	var vec = GeoUtils.nor_points(lon1, lat1, lon2, lat2);
	var arc = GeoUtils.arc_points(lon, lat, vec[0], vec[1]);
	return Math.abs(arc - M_PI_2) * TK_EARTH_RADIUS;
};

GeoUtils.arc_points = function(lon1, lat1, lon2, lat2) {
	var rlon1 = lon1*M_RPD, rlat1 = lat1*M_RPD, rlon2=lon2*M_RPD, rlat2 = lat2 *M_RPD;
	var vcos = Math.cos(rlat1) * Math.cos(rlat2) * Math.cos(rlon1 - rlon2) + Math.sin(rlat1) * Math.sin(rlat2);
	if (vcos > 1) return 0;
	else if (vcos < -1) return M_PI;
	vcos = Math.acos(vcos);
	return vcos < 0? vcos + M_PI: vcos;
};

GeoUtils.dis_points = function (pt1, pt2) {
	return GeoUtils.arc_points(pt1.lon, pt1.lat, pt2.lon, pt2.lat) * TK_EARTH_RADIUS;
};


/**
 *  计算rect的bbox的r1和r2的交集
 *  @param r1和r2均为[l, r, t, b]
 *  @return {} r1和r2交集bbox，形式变为[l, r, t, b]
 */
GeoUtils.rect_intersect = function(r1, r2) {
	var rect = [];
	rect[0] = r1[0]>r2[0]? r1[0]: r2[0];
	rect[1] = r1[1]<r2[1]? r1[1]: r2[1];
	rect[2] = r1[2]>r2[2]? r1[2]: r2[2];
	rect[3] = r1[3]<r2[3]? r1[3]: r2[3];
	return rect;
};

GeoUtils.is_rect_in_rect = function(r1, r2) {
	return r1[0]>=r2[0] && r1[1]<=r2[1] && r1[2]>=r2[2] && r1[3]<=r2[3];
};
GeoUtils.is_rect_away_rect = function(r1, r2) {
	return r1[0]>=r2[1] || r1[1]<=r2[0] || r1[2]>=r2[3] || r1[3]<=r2[2];
};


GeoUtils.rect_get_area = function(rect) {
	return (rect[1]-rect[0])*(rect[3]-rect[2]);
}


var tk_distance_between_points = function (p1, p2) {
		var dx = p1.x - p2.x, dy = p1.y - p2.y;
		return Math.sqrt(dx * dx + dy * dy);
	}, 

	tk_gmeta_distance_between_point_and_linesegment = function (p, p1, p2) {
		var cross = (p2.x - p1.x) * (p.x - p1.x) + (p2.y - p1.y) * (p.y - p1.y);
		if (cross <= 0)
			return tk_distance_between_points(p1, p);
		
		var d2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
		if (cross >= d2)
			return tk_distance_between_points(p2, p);
		
		var r = cross / d2;
		var px = p1.x + (p2.x - p1.x) * r;
		var py = p1.y + (p2.y - p1.y) * r;
		return Math.sqrt((px - p.x) * (px - p.x) + (py - p.y) * (py - p.y));
	},

	tk_gmeta_position_in_line = function (p, p1, p2, dis) {
		if (p1.x == p.x && p1.y == p.y)
			return 1;
		if (p2.x == p.x && p2.y == p.y)
			return 2;
		
	//	if (p1.x == p2.x) {
	//		int d = abs(p.x - p2.x);
	//		if (d == 0) return 3;
	//		if (d <= dis) return 0;
	//		return -1;
	//	}
		
		var dist = tk_gmeta_distance_between_point_and_linesegment(p, p1, p2);
		if (dist > dis) return -1;
		if (dist == 0) return 3;
		return 0;
	},

	tk_gmeta_position_in_lineseq = function (point, points, dist) {
		for (var i = 0, l = points.length - 1; i < l; ++i) {
			var ret = tk_gmeta_position_in_line(point, points[i], points[i+1], dist);
			if (ret >= 0) return ret;
		}
		return -1;
	},


	tk_point_in_line = GeoUtils.point_in_line = function (point, points, dist) {
		var pts = [];
		for (var i = 0, l = points.length; i < l; i += 2) {
			pts.push({x: points[i], y: points[i+1]});
		}

		return tk_gmeta_position_in_lineseq({x: point[0], y: point[1]}, pts, dist);
	},

	tk_vector_cross_product = function(dx1, dy1, dx2, dy2){return dx1 * dy2 - dy1 * dx2;},
	/** 注意:
	 * 1. 点列的时针顺序不影响结果
	 * 2. 此多边形是只有一个边界点列的复杂多边形
	 * </PRE>
	 * @param point 测试点
	 * @param polygon 多边形点列(需要形成环)
	 * @return 点与多边形的具体关系
	 * <PRE>
	 *  1   =>  多边形边界内部
	 *  2   =>  多边形顶点
	 * </PRE>
	 */
	tk_gmeta_position_in_polygon_kernel = function(p, x, y, a, b, o) {
		var Mx, My, nx, ny, clock;
		if (p[a].y >= p[b].y) 
			Mx = p[a].x, My = p[a].y, nx = p[b].x, ny = p[b].y;
		else 
			Mx = p[b].x, My = p[b].y, nx = p[a].x, ny = p[a].y;
		
		if (y < ny || My < y);
		else if (ny < y && y < My) {
			if (nx < x) {
				if (Mx < x) o = !o;
				else {
					clock = tk_vector_cross_product(x - nx, y - ny, Mx - x, My - y);
					if (clock > 0) o = !o;
					else if(clock == 0) return 1;
				}
			} else {
				if (Mx <= x) {
					clock = tk_vector_cross_product(x - nx, y - ny, Mx - x, My - y);
					if (clock > 0) o = !o;
					else if (clock == 0) return 1;
				}
			}
		} else if (My == y) {
			if (ny == y) {
				if ((Mx < x && x < nx) || (nx < x && x < Mx)) return 1;
				else if (Mx == x || nx == x) return 2;
			} else {
				if (Mx == x) return 2;
				if (Mx < x) o = !o;
			}
		}
		return [o];
	},


	/** 注意:
	 * 1. 点列的时针顺序不影响结果
	 * 2. 此多边形是只有一个边界点列的复杂多边形
	 * </PRE>
	 * @param point 测试点
	 * @param polygon 多边形点列(需要形成环)
	 * @return 点与多边形的具体关系
	 * <PRE>
	 * -1   =>  多边形外部
	 *  0   =>  多边形内部
	 *  1   =>  多边形边界内部
	 *  2   =>  多边形顶点
	 * </PRE>
	 */

	tk_gmeta_position_in_polygon = function(point, polygon) {
		var x = point.x, y = point.y;
		var i, l = polygon.length, j = l - 1, odd = 0;
		
		for (i = 0; i < l; j = i++) {
			var ret = tk_gmeta_position_in_polygon_kernel(polygon, x, y, i, j, odd);
			if (ret instanceof Array) {
				odd = ret[0];
			} else return ret;
		}
		return odd? 0: -1;
	},

	tk_point_in_polygon = GeoUtils.point_in_polygon = function(point, points) {
		var pts = [];
		for (var i = 0, l = points.length; i < l; i += 2) {
			pts.push({x: points[i], y: points[i+1]});
		}

		return tk_gmeta_position_in_polygon({x: point[0], y: point[1]}, pts);
	};


	/***********************************
	 *
	 *		PUBLIC
	 *
	 ***********************************/ 


GeoUtils.degreeToRad = function(deg){
	return deg * M_RPD;
};
GeoUtils.getDistance = function(point1, point2) {
	//判断类型
	if(!(point1 instanceof TMap.Point) ||
		!(point2 instanceof TMap.Point)){
		return 0;
	}

	return GeoUtils.dis_points(point1, point2);
};

/**
 * 计算多边形面或点数组构建图形的面积,注意：坐标类型只能是经纬度，且不适合计算自相交多边形的面积
 *
 * @method getPolygonArea
 * @param {Polygon|Array<Point>} polygon 多边形面对象或者点数组
 * @return {Number} 多边形面或点数组构成图形的面积
 */
GeoUtils.getPolygonArea = function(polygon){
	//检查类型
	if(!(polygon instanceof TMap.Polygon) &&
		!(polygon instanceof Array)){
		return 0;
	}
	var pts;
	if(polygon instanceof TMap.Polygon){
		pts = polygon.lonlats;// getPath();
	}else{
		pts = polygon;	
	}
	
	if(pts.length < 3){//小于3个顶点，不能构建面
		return 0;
	}
	
	var totalArea = 0;//初始化总面积
	var LowX = 0.0;
	var LowY = 0.0;
	var MiddleX = 0.0;
	var MiddleY = 0.0;
	var HighX = 0.0;
	var HighY = 0.0;
	var AM = 0.0;
	var BM = 0.0;
	var CM = 0.0;
	var AL = 0.0;
	var BL = 0.0;
	var CL = 0.0;
	var AH = 0.0;
	var BH = 0.0;
	var CH = 0.0;
	var CoefficientL = 0.0;
	var CoefficientH = 0.0;
	var ALtangent = 0.0;
	var BLtangent = 0.0;
	var CLtangent = 0.0;
	var AHtangent = 0.0;
	var BHtangent = 0.0;
	var CHtangent = 0.0;
	var ANormalLine = 0.0;
	var BNormalLine = 0.0;
	var CNormalLine = 0.0;
	var OrientationValue = 0.0;
	var AngleCos = 0.0;
	var Sum1 = 0.0;
	var Sum2 = 0.0;
	var Count2 = 0;
	var Count1 = 0;
	var Sum = 0.0;
	var Radius = 6378137.0;//,WGS84椭球半径 
	var Count = pts.length;		
	for (var i = 0; i < Count; i++) {
		if (i == 0) {
			LowX = pts[Count - 1].lon * M_RPD;
			LowY = pts[Count - 1].lat * M_RPD;
			MiddleX = pts[0].lon * M_RPD;
			MiddleY = pts[0].lat * M_RPD;
			HighX = pts[1].lon * M_RPD;
			HighY = pts[1].lat * M_RPD;
		}
		else if (i == Count - 1) {
			LowX = pts[Count - 2].lon * M_RPD;
			LowY = pts[Count - 2].lat * M_RPD;
			MiddleX = pts[Count - 1].lon * M_RPD;
			MiddleY = pts[Count - 1].lat * M_RPD;
			HighX = pts[0].lon * M_RPD;
			HighY = pts[0].lat * M_RPD;
		}
		else {
			LowX = pts[i - 1].lon * M_RPD;
			LowY = pts[i - 1].lat * M_RPD;
			MiddleX = pts[i].lon * M_RPD;
			MiddleY = pts[i].lat * M_RPD;
			HighX = pts[i + 1].lon * M_RPD;
			HighY = pts[i + 1].lat * M_RPD;
		}
		AM = Math.cos(MiddleY) * Math.cos(MiddleX);
		BM = Math.cos(MiddleY) * Math.sin(MiddleX);
		CM = Math.sin(MiddleY);
		AL = Math.cos(LowY) * Math.cos(LowX);
		BL = Math.cos(LowY) * Math.sin(LowX);
		CL = Math.sin(LowY);
		AH = Math.cos(HighY) * Math.cos(HighX);
		BH = Math.cos(HighY) * Math.sin(HighX);
		CH = Math.sin(HighY);
		CoefficientL = (AM * AM + BM * BM + CM * CM) / (AM * AL + BM * BL + CM * CL);
		CoefficientH = (AM * AM + BM * BM + CM * CM) / (AM * AH + BM * BH + CM * CH);
		ALtangent = CoefficientL * AL - AM;
		BLtangent = CoefficientL * BL - BM;
		CLtangent = CoefficientL * CL - CM;
		AHtangent = CoefficientH * AH - AM;
		BHtangent = CoefficientH * BH - BM;
		CHtangent = CoefficientH * CH - CM;
		AngleCos = (AHtangent * ALtangent + BHtangent * BLtangent + CHtangent * CLtangent) / (Math.sqrt(AHtangent * AHtangent + BHtangent * BHtangent + CHtangent * CHtangent) * Math.sqrt(ALtangent * ALtangent + BLtangent * BLtangent + CLtangent * CLtangent));
		AngleCos = Math.acos(AngleCos);			
		ANormalLine = BHtangent * CLtangent - CHtangent * BLtangent;
		BNormalLine = 0 - (AHtangent * CLtangent - CHtangent * ALtangent);
		CNormalLine = AHtangent * BLtangent - BHtangent * ALtangent;
		if (AM != 0)
			OrientationValue = ANormalLine / AM;
		else if (BM != 0)
			OrientationValue = BNormalLine / BM;
		else
			OrientationValue = CNormalLine / CM;
		if (OrientationValue > 0) {
			Sum1 += AngleCos;
			Count1++;
		}
		else {
			Sum2 += AngleCos;
			Count2++;
		}
	}		
	var tempSum1, tempSum2;
	tempSum1 = Sum1 + (2 * M_PI * Count2 - Sum2);
	tempSum2 = (2 * M_PI * Count1 - Sum1) + Sum2;
	if (Sum1 > Sum2) {
		if ((tempSum1 - (Count - 2) * M_PI) < 1)
			Sum = tempSum1;
		else
			Sum = tempSum2;
	}
	else {
		if ((tempSum2 - (Count - 2) * M_PI) < 1)
			Sum = tempSum2;
		else
			Sum = tempSum1;
	}
	totalArea = (Sum - (Count - 2) * M_PI) * Radius * Radius;

	return totalArea; //返回总面积
}

})();
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
/*\
|*|
|*|  :: tkDaemon ::
|*|
|*|   Original source is MiniDaemon
|*|
|*|  Revision #2 - September 26, 2014
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/window.setInterval
|*|  https://developer.mozilla.org/User:fusionchess
|*|  https://github.com/madmurphy/minidaemon.js
|*|
|*|  This framework is released under the GNU Lesser General Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/lgpl-3.0.html
|*|
\*/
 
function tkDaemon (oOwner, fTask, nRate, nLen) {
  if (!(this && this instanceof tkDaemon)) { return; }
  if (arguments.length < 2) { throw new TypeError('tkDaemon - not enough arguments'); }
  if (oOwner) { this.owner = oOwner; }
  this.task = fTask;
  if (isFinite(nRate) && nRate > 0) { this.rate = Math.floor(nRate); }
  if (nLen > 0) { this.length = Math.floor(nLen); }
}
 
tkDaemon.prototype.owner = null;
tkDaemon.prototype.task = null;
tkDaemon.prototype.rate = 100;
tkDaemon.prototype.length = Infinity;
 
  /* These properties should be read-only */
 
tkDaemon.prototype.SESSION = -1;
tkDaemon.prototype.INDEX = 0;
tkDaemon.prototype.PAUSED = true;
tkDaemon.prototype.BACKW = true;
 
  /* Global methods */
 
tkDaemon.forceCall = function (oDmn) {
  oDmn.INDEX += oDmn.BACKW ? -1 : 1;
  if (oDmn.task.call(oDmn.owner, oDmn.INDEX, oDmn.length, oDmn.BACKW) === false || oDmn.isAtEnd()) { oDmn.pause(); return false; }
  return true;
};
 
  /* Instances methods */
 
tkDaemon.prototype.isAtEnd = function () {
  return this.BACKW ? isFinite(this.length) && this.INDEX < 1 : this.INDEX + 1 > this.length;
};
 
tkDaemon.prototype.synchronize = function () {
  if (this.PAUSED) { return; }
  clearInterval(this.SESSION);
  this.SESSION = setInterval(tkDaemon.forceCall, this.rate, this);
};
 
tkDaemon.prototype.pause = function () {
  clearInterval(this.SESSION);
  this.PAUSED = true;
};
 
tkDaemon.prototype.start = function (bReverse) {
  var bBackw = Boolean(bReverse);
  if (this.BACKW === bBackw && (this.isAtEnd() || !this.PAUSED)) { return; }
  this.BACKW = bBackw;
  this.PAUSED = false;
  this.synchronize();
};
//////////////////////////////////////////////////////////////////////
 // *
 // *	gl.js
 // *
 // *	this module is webgl map canvas related.
 // *
//////////////////////////////////////////////////////////////////////


(function(){

const vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uComponentOffsetMatrix;
uniform mat4 uTileOffsetMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * uTileOffsetMatrix * uComponentOffsetMatrix * aVertexPosition;//
	vTextureCoord = aTextureCoord;
}
`;

  // Fragment shader program

const fsSource = `
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
	gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;
const tileTextureArray = new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ]);

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl) {

  // Create a buffer for the square's positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  // 
  const positions = [
     0.0,  0.0,
     256,  0.0,
     256,  256,
     0.0,  256,
  ];
  
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tileTextureArray, gl.STATIC_DRAW);


  // const indexBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // // This array defines each face as two triangles, using the
  // // indices into the vertex array to specify each triangle's
  // // position.

  // const indices = [0,  1,  2,  0,  3,  2];

  // // Now send the element array to GL
  // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    // indices: indexBuffer,
  };
}

function genTextureCoord(rct, w, h) {
	var x = rct.x / w, y = 1-rct.y / h, x1 = (rct.x+rct.w)/w, y1 = 1-(rct.y+rct.h)/h;
	// return new Float32Array([
	// 	0,  0,
	// 	1,  0,
	// 	1,  0.5,
	// 	0,  0.5,
	// ]);

	return new Float32Array([
		x,  y1,
		x1,  y1,
		x1,  y,
		x,  y,
	]);
}

	TMap.Canvas.MapCanvasGL.prototype.glInit = function() {
		var gl = this.gl;
		if (gl == null || this.glShaderInfo != null)
			return null;

		const shader = initShaderProgram(gl, vsSource, fsSource);
		if (shader == null)
			return null; 

		const buffers = initBuffers(gl);

		this.glShaderInfo = {
			program: shader,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shader, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shader, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shader, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shader, 'uModelViewMatrix'),
				tileMatrix: gl.getUniformLocation(shader, 'uTileOffsetMatrix'),
				componentMatrix: gl.getUniformLocation(shader, 'uComponentOffsetMatrix'),
				uSampler: gl.getUniformLocation(shader, 'uSampler'),
			},
			buffers: buffers,
		};

		this._cur =0;
	};

	TMap.Canvas.MapCanvasGL.prototype.glGenTextureCoord = function(rct, w, h) {
		var gl = this.gl;
		const textureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
		var x = rct.x / w, y = rct.y / h, x1 = (rct.x+rct.w)/w, y1 = (rct.y+rct.h)/h;

		const textureCoordinates = [
			x,  y,
			x1,  y,
			x1,  y1,
			x,  y1,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
		return textureCoordBuffer;
	}

	TMap.Canvas.MapCanvasGL.prototype.glGenTexture = function(canvas, texture) {
		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		var gl = this.gl;
		// if (texture == null) 
			texture = gl.createTexture();

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		texture.gl = gl;

		return texture;
	}

	TMap.Canvas.MapCanvasGL.prototype.glClear = function(mm){
		var gl = this.gl, programInfo = this.glShaderInfo;//, buffers = this.glShaderInfo.buffers;
		gl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing  
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// Clear the canvas before we start drawing on it.
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.useProgram(programInfo.program);



		{
			gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.buffers.position);
			gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
		}

		{
			gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.buffers.textureCoord);
			gl.bufferData(gl.ARRAY_BUFFER, tileTextureArray, gl.STATIC_DRAW);
			gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
		}

		gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

		const fieldOfView = 60 * Math.PI / 180;   // in radians
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const zNear = 1024;//0.1;
		const zFar = 2048;//100.0;
		const zMiddle = 1500;
		const halfWidth = mm.halfWidth/ mm.ratio;
		const halfHeight = mm.halfHeight/ mm.ratio;
		const projectionMatrix = mat4.create();
		const modelViewMatrix = mat4.create();

		gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, modelViewMatrix);

		mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
		projectionMatrix[0] = zMiddle / halfWidth;
		projectionMatrix[5] = zMiddle / halfHeight;
		
		// mat4.frustum(projectionMatrix, -halfWidth, halfWidth, -halfHeight, halfHeight, zNear, zFar);
		
		gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

		// mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);  // amount to translate
		// gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

		// const modelViewMatrix = mat4.create();
		mat4.scale(modelViewMatrix, modelViewMatrix, [mm.scale/mm.ratio, mm.scale/mm.ratio, 1]);
		
		mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -zMiddle]);  // amount to translate
		if (mm.tilt != 0) 
			mat4.rotate(modelViewMatrix, modelViewMatrix, mm.tilt, [1, 0, 0]);
		if (mm.rotate != 0)
			mat4.rotate(modelViewMatrix, modelViewMatrix, -mm.rotate, [0, 0, 1]);
			// mat4.rotate(modelViewMatrix, modelViewMatrix, this._cur, [0, 0, 1]);
			// this._cur += 0.1;

		gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

		gl.activeTexture(gl.TEXTURE0);


	}

	TMap.Canvas.MapCanvasGL.prototype.glDraw = function(tiles, mm) { 
		var gl = this.gl, programInfo = this.glShaderInfo;

		for (var i = 0, tile, l = tiles.length; i < l; ++i) {
			tile = tiles[i];
			if (tile.tex == null)
				continue;
			gl.bindTexture(gl.TEXTURE_2D, tile.tex);

			const tileMatrix = mat4.create();
			const matTile = tile.layer.glMatrix(mm, tile);
			
			mat4.translate(tileMatrix, tileMatrix, matTile[0]);
			matTile[1] && mat4.scale(tileMatrix, tileMatrix, matTile[1]); 

			gl.uniformMatrix4fv(programInfo.uniformLocations.tileMatrix, false, tileMatrix);      

			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
		}
	}

	TMap.Canvas.MapCanvasGL.prototype.glDrawLabel = function(tiles, mm) { 
		var gl = this.gl, programInfo = this.glShaderInfo, rscale = mm.ratio/mm.scale;

		for (var i = 0, tile, l = tiles.length; i < l; ++i) {
			tile = tiles[i];
			if (tile.l && tile.z == mm.z) {
				const tileMatrix = mat4.create();
				const matTile = tile.layer.glMatrix(mm, tile)[0];
				mat4.translate(tileMatrix, tileMatrix, matTile);
				gl.uniformMatrix4fv(programInfo.uniformLocations.tileMatrix, false, tileMatrix);      
			
				var translater = [0, 0, 0];
				for (var j = 0, lbl, ll = tile.l.length; j < ll; ++j) {
					lbl = tile.l[j];

					// if (lbl.glElems == null) return;
					// for (var gi = 0, elem; elem = lbl.glElems[gi]; ++gi) {
					// 	gl.bufferData(gl.ARRAY_BUFFER, genTextureCoord(elem.rect, elem.iw, elem.ih), gl.STATIC_DRAW);
					// 	gl.bindTexture(gl.TEXTURE_2D, elem.tex || tile.ltex);

					// 	const comMatrix = mat4.create();
					// 	mat4.translate(comMatrix, comMatrix, elem.pos );

					// 	if (mm.tilt != 0) 
					// 		mat4.rotate(comMatrix, comMatrix, -mm.tilt, [1, 0, 0]);
					// 	if (mm.rotate != 0)
					// 		mat4.rotate(comMatrix, comMatrix, mm.rotate, [0, 0, 1]);

					// 	mat4.scale(comMatrix, comMatrix, [elem.rect.w*rscale/512.0, elem.rect.h*rscale/512.0, 1]); 

					// 	gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, comMatrix);      

					// 	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
					// }

					if (lbl.imgInfo != null && lbl.img != null) {
						gl.bufferData(gl.ARRAY_BUFFER, genTextureCoord(lbl.imgInfo, lbl.img.width, lbl.img.height), gl.STATIC_DRAW);
						gl.bindTexture(gl.TEXTURE_2D, lbl.tex);

						const comMatrix = mat4.create();
						translater[0] = lbl.a[0]-lbl.imgInfo.w/4;
						translater[1] = 256-lbl.a[1]-lbl.imgInfo.h/4;
						mat4.translate(comMatrix, comMatrix, translater);

						if (mm.tilt != 0) 
							mat4.rotate(comMatrix, comMatrix, -mm.tilt, [1, 0, 0]);
						if (mm.rotate != 0)
							mat4.rotate(comMatrix, comMatrix, mm.rotate, [0, 0, 1]);

						mat4.scale(comMatrix, comMatrix, [lbl.imgInfo.w*rscale/512.0, lbl.imgInfo.h*rscale/512.0, 1]); 

						gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, comMatrix);      

						gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
					}

					if (lbl.rect) {
						gl.bufferData(gl.ARRAY_BUFFER, genTextureCoord(lbl.rect, 512, 512), gl.STATIC_DRAW);
						gl.bindTexture(gl.TEXTURE_2D, tile.ltex);

						const comMatrix = mat4.create();
						translater[0] = lbl.a[0]+26;
						translater[1] = 256-lbl.a[1];
						mat4.translate(comMatrix, comMatrix, translater);

						if (mm.tilt != 0) 
							mat4.rotate(comMatrix, comMatrix, -mm.tilt, [1, 0, 0]);
						if (mm.rotate != 0)
							mat4.rotate(comMatrix, comMatrix, mm.rotate, [0, 0, 1]);

						mat4.scale(comMatrix, comMatrix, [lbl.rect.w*rscale/512.0, lbl.rect.h*rscale/512.0, 1]); 

						gl.uniformMatrix4fv(programInfo.uniformLocations.componentMatrix, false, comMatrix);      

						gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
					}
						
				}
			}
		}
	}

})();
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


//////////////////////////////////////////////////////////////////////
 // *
 // *	egaki.js
 // *
 // *	egaki is pronounciation for 'draw' in Japanese. We use this to
 // * 	confuse our readers who want hack back.
 // *
//////////////////////////////////////////////////////////////////////
(function (){
	TMapEngine.private.egaki = 
function(root, tile_pl) {"use strict";
var imgNull = new Image();

const tkTileSize = 256;
const funcArr = [
function (c,m,style) {},

function (c,m,style) {
	var rate = m.ratio / m.scale;
	if (style.w >= 0) {
		if (style.wlw == null) {
			style.wlw = (style.l||0)+(style.w||0)*2;
			if (style.wlw == 0) style.wlw = 1;
		}

		c.lineWidth = style.wlw * rate;
		c.strokeStyle = style.s;
		c.setLineDash([]);
		c.stroke();
	}
	if (style.l >= 0) {
		c.lineWidth = style.l * rate;
		c.strokeStyle = style.f;
		c.setLineDash(style.d||[]);
		c.stroke();	
	}	
},

function (c,m,style) {
	c.fillStyle = style.f;
	c.fill();
},

function (c,m,style) {
	c.fillStyle = style.f;
	c.fill();
}];


function renderFunc(d) {
	return funcArr[d.t];
}

imgNull.src ="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAEL0lEQVR4Xu2dYXKdMAyE/U6W9GQvOVmaXqwZBUjJm8zUSDvIRl9+tgiLZd9qsYW5tdb+Nv7KInBbCfDeWvvtQOGptWbn8MTacMTn4fds+G8EeG2tvTgIcF8J4Im14YhfCJCBn415hwB5NyD7ByAhgEM0CBkEAQgwyI3ISkNCAGr4vCUEAhQ3oRAAAvAUULmESRQgy8AwbhwBCBDHcOozSAhQWUKzJ3Ki40MATCAmsLKCfVMAW83bVvRsYWiTl32R++nfbTXvz7qYYWD+73j7//159quBR8bdzmNj2qrWfjXyyHkq5/9m2P20HLytTD2uUPHvC72vgoP9aMLLwVPb4OLJYwIxgZhATODaEkZHkK8ezEwgSgAlIF4CfL8bokZAQKIAI1wIOfgQkBBg5hoYnUufPR4C4AHiHgAFoCcw7cWG2SU4O39JCfDZD6JGQAACjHAXEnOQEAAPcBEPQD/A8qJqpX4GST+ANVTYq+UmJ57+gX1DiGed3W7ar4eGkCPnqZy/pB+AEnCREuBdDUz0MAwdREBiAoM5EJ6IgIQAlIDiJQACQACmgpP2+IlOJVMCWA2MrwYmehiGDiIgUYBgDoQnIiAhACYQE4gJxATm7HQZdcHV4ykBPAXwFJDowdKHluwPYFdx5H18jv9337Nxox9g3a6+aj8D/QB4gLgHYB6AeQDmASrPA6RbWRJwIyCZB3CPTmA6AhIC4AHwAHiAyh4ABUABUIDKCpDuZEjAjYDEBLpHJzAdAQkB8AB4ADxAZQ+AAlxEAdgfgP0Bvj66cOT9enMyHL/4udlwkPQDpFtZEnAjwFMADSE0hFQ2sSgACoACoADBL4a4HQiB6QhISkD6VZCAGwEJASpL6OzvFkIATCAmsLKCoQAoQFwB3A6EwHQEJAqQfhUk4EZAQoDKNfRSTwH0A9AP4OoHqLzfvknozN87kPQDUAIu0hLG9wLcXmraQIkJnPbqSfyzhe1+C64GUgKKlwAIAAF4MYQXQ9gq9vGTeb0WI1NBJR6g90I5bjwEIMB49+TUjCQEyJSw2efis/OHAPQDMA9QWcFQABQgrgCnuhYGkyLA9wJWOLP37bcytP87Kx++F8D3AtoTi0HzzuVHHyMxgZjAuAms/BgV/QVmx0sUQGpLOdmpCECAU+EebzAJASgB85pICIAJxARWVjAUAAWIK8B41oaMehGQKEDvYBw3HgISAlSuodkTOdHxIQAeIO4BUICLzAOwPwD7A7j2B7A6NNs++Y8vcVTNX7I/wHjelox6EcAEYgIxgZVNLAqAAqAAKEBwh5Bew8Fx4yEgKQHjXRYZ9SIgIUBlCY3OxWfHQwBMICawsoKhAChAXAF6DQfHjYeARAHGuywy6kXgGwHeW/taDew9gR233y37SNx2LPFLP4GtzHn+Ivg92/3b3g72DE7MBRD4AB+X7j1A9PfvAAAAAElFTkSuQmCC";
function drawBackgroundGrid(c,mm){
	c.setLineDash([1,3]);
	c.strokeStyle = "#7f7f7f";
	c.lineWidth = mm.ratio/mm.scale;
	c.beginPath();
	for (var i = 0; i <= tkTileSize; i+=16) {
		c.moveTo(0, i);
		c.lineTo(tkTileSize, i);
	}
	for (var i = 0; i <= tkTileSize; i+=16) {
		c.moveTo(i, 0);
		c.lineTo(i, tkTileSize);
	}
	c.stroke();
	c.closePath();
}

	if (tile_pl) {
		root.vectorDraw = function(c, mm, tiles) {
			var tile = tiles[0];
			if (tile == null) return;

			var ratio = mm.ratio, backColor = tile[mm.z > 7?'f':'s'];
			if (backColor) {
				c.fillStyle = backColor;

				c.beginPath();
				c.rect(0, 0, mm.width, mm.height);
				c.fill();
			}
			
			c.lineCap = "butt";
			c.lineJoin = "round";
			c.miterLimit = 2;

			var zarrays = new Set();
			for (var ti = 0, tllen = tiles.length; ti < tllen; ++ti) {
				zarrays.merge(tiles[ti].zIndexKeys);
			}
			zarrays = Array.from(zarrays).sort();

			for (var zi = 0, zindex, zlen = zarrays.length; zi < zlen; ++zi) {
				zindex = zarrays[zi];
				var theStyle, goon_run = true, style_seq = new Set();

				while (goon_run) {
					theStyle = null;
					goon_run = false;

					c.beginPath();
					for (var ti = 0, tllen = tiles.length; ti < tllen; ++ti) {	
						var tile = tiles[ti], array;

						if (tile.g == null) 
							continue;
						array = tile.g[zindex];
						if (array == null || array.length <= 0) 
							continue;

						c.save();
						mm.initTransform(c, tile);
						for (var dd, i = 0, len = array.length; i < len; ++i) {
							var style = array[i], st_hash = style.hash();

							if (theStyle == null) {
								if (style_seq.has(st_hash)) 
									continue;
								theStyle = style;
								style_seq.add(st_hash);
							} else if (theStyle.hash() != st_hash) {
								if (!style_seq.has(st_hash)) {
									goon_run = true;
								}
								continue;
							}

							dd = style.a;
							for (var j = 0, dlen = dd.length; j < dlen; ++j) {
								for (var de = dd[j], l = 0, delen = de.length; l < delen; l += 2) {
									if (l == 0) 
										c.moveTo(de[l], de[l+1]);
									else 
										c.lineTo(de[l], de[l+1]);
								}
							}
						}
						c.restore();
					}

					c.setTransform(ratio, 0, 0, ratio, 0, 0);
					renderFunc(theStyle)(c, mm, theStyle);
				}
				
				// c.closePath();
			}

			var geos = this.boldGeos;
			if (geos != null) {
				var preTile = null;
				c.beginPath();
				for (var gi = 0, glen = geos.length; gi < glen; ++gi) {	
					var geo = geos[gi], array = geo[1];

					if (preTile != geo[0]) {
						if (preTile)
							c.restore();
						c.save();
						mm.initTransform(c, geo[0]);
						preTile = geo[0];
					}
					
					for (var ali = 0, arlen = array.length; ali < arlen; ali += 2) {
						if (ali == 0) 
							c.moveTo(array[ali], array[ali+1]);
						else 
							c.lineTo(array[ali], array[ali+1]);
					}
				}
				if (preTile) c.restore();

				c.setTransform(ratio, 0, 0, ratio, 0, 0);
				renderFunc(geos)(c, mm, geos);
			}
		};

		// root.vectorDraw = function(c, mm, tiles) {
		// 	// var can = this._owner.canvases[0];
		// 	// can.glDraw(tiles, mm);
		// }
	} else //tkStyle
	{
		root.vectorDraw = function(c, mm, tile) {
			if (tile == null || tile.zIndexKeys == null) return;

			var ratio = 2, backColor = tile[mm.z > 7?'f':'s'];
			if (backColor) {
				c.fillStyle = backColor;

				c.beginPath();
				c.rect(0, 0, mm.width, mm.height);
				c.fill();
			}
			
			c.lineCap = "butt";
			c.lineJoin = "round";
			c.miterLimit = 2;

			var zarrays = Array.from(tile.zIndexKeys).sort();

			for (var zi = 0, zindex, zlen = zarrays.length; zi < zlen; ++zi) {
				zindex = zarrays[zi];
				var theStyle, goon_run = true, style_seq = new Set();

				while (goon_run) {
					theStyle = null;
					goon_run = false;

					c.beginPath();
					// for (var ti = 0, tllen = tiles.length; ti < tllen; ++ti) {	
					// 	var tile = tiles[ti], array;

					if (tile.g == null) 
						continue;
					array = tile.g[zindex];
					if (array == null || array.length <= 0) 
						continue;

					c.save();
					// mm.initTransform(c, tile);
					for (var dd, i = 0, len = array.length; i < len; ++i) {
						var style = array[i], st_hash = style.hash();

						if (theStyle == null) {
							if (style_seq.has(st_hash)) 
								continue;
							theStyle = style;
							style_seq.add(st_hash);
						} else if (theStyle.hash() != st_hash) {
							if (!style_seq.has(st_hash)) {
								goon_run = true;
							}
							continue;
						}

						dd = style.a;
						for (var j = 0, dlen = dd.length; j < dlen; ++j) {
							for (var de = dd[j], l = 0, delen = de.length; l < delen; l += 2) {
								if (l == 0) 
									c.moveTo(de[l], de[l+1]);
								else 
									c.lineTo(de[l], de[l+1]);
							}
						}
					}
					c.restore();
				// }

					c.setTransform(ratio, 0, 0, ratio, 0, 0);
					renderFunc(theStyle)(c, mm, theStyle);
				}
				
				// c.closePath();
			}

			var geos = this.boldGeos;
			if (geos != null) {
				var preTile = null;
				c.beginPath();
				for (var gi = 0, glen = geos.length; gi < glen; ++gi) {	
					var geo = geos[gi], array = geo[1];

					if (preTile != geo[0]) {
						if (preTile)
							c.restore();
						c.save();
						mm.initTransform(c, geo[0]);
						preTile = geo[0];
					}
					
					for (var ali = 0, arlen = array.length; ali < arlen; ali += 2) {
						if (ali == 0) 
							c.moveTo(array[ali], array[ali+1]);
						else 
							c.lineTo(array[ali], array[ali+1]);
					}
				}
				if (preTile) c.restore();

				c.setTransform(ratio, 0, 0, ratio, 0, 0);
				renderFunc(geos)(c, mm, geos);
			}
		};
	}
}
})();
//////////////////////////////////////////////////////////////////////
/// *
/// *	fukaku.js
/// *
/// *	fukaku is pronounciation for "style" in Japanese. We use this to
/// * 	confuse our readers who want hack back.
/// *
//////////////////////////////////////////////////////////////////////
(function() {
var Drawer = TMap.Drawer || (TMap.Drawer = {});

///////////////////////////////
/// *
/// *	drawer = {
/// *		.adjustSize = function(),
/// *		.render = function(),
/// *	}
/// *
/// *********************
/// *	parameters:
/// *	
/// *	KA = {
/// *		
/// *	}
/// *	dataset = {
/// *	#require:
/// *		.maxVal = 0,
/// *		.get() = {
/// *			.next() = {
/// *				.x = x,
/// *				.y = y,	
/// *				.count = count,
/// *			}
/// *		}
/// *	}
/// *
/// *	options = {
/// *		.gradient = {0.25: "blue", 0.55: "green", 0.8: "yellow", 1.0: "red"},
/// *		.
/// *	}
///////////////////////////////
const M2PI = Math.PI * 2;
//////////////////////////////////////////////////////////////////////

/**
 * @class Drawer
 * @namespace TMap
 *
 */

function autoKA(ka) {
	if (ka.mapMode == null && ka._owner) {
		return {
			context: ka.context,
			mapMode: ka._owner.mapMode,
			width: ka._owner.mapMode.width,
			height: ka._owner.mapMode.height,
		};	
	} else {
		return ka;
	}
}

/**
 * [scattermap description]
 * @class scattermap
 * @param  {TMap.DrawerAgent | TMap.Canvas}   ka      [description]
 * @param  {TMap.Dataset}   dataset [description]
 * @param  {object}   options [description]
 */
Drawer.scattermap = function(ka, dataset, options) /* extends drawer */ {
ka = autoKA(ka);
var ctx = ka.context, ratio = ka.mapMode.ratio;
	options = options || {};

	var adjustSize = this.adjustSize = function () {

	},
	render = this.render = function () {
		var iter = dataset.get(), item;
    	var radius = (options.size || 0.7) * ratio;

		ctx.setTransform(ratio,0,0,ratio,0,0);
		ctx.beginPath();
		while ((item = iter.next()) != null) {
			var x = item.x, y = item.y;
			ctx.moveTo(x, y);
			ctx.arc(x, y, radius, 0, M2PI);
		}
		ctx.fillStyle = options.fillStyle || 'red';// 'rgba(200, 200, 0, 0.8)';
		ctx.fill();
		ctx.closePath();
	};
}


//////////////////////////////////////////////////////////////////////
/**
 * [heatmap description]
 * @class heatmap
 * @param  {[type]} ka      [description]
 * @param  {[type]} dataset [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
Drawer.heatmap = function (ka, dataset, options) /* extends drawer */ {
ka = autoKA(ka);
var shad_disradius = (ka.width+ka.height)*2;
var acan = document.createElement("canvas");
var actx =  acan.getContext("2d");
var _rulerData;
	options = options || {};

	function render() {
		var ratio = ka.mapMode.ratio;
		
		actx.setTransform(1, 0, 0, 1, 0, 0);
		actx.clearRect(0, 0, ka.width, ka.height);
		actx.translate(shad_disradius, shad_disradius);
	    actx.scale(ratio,ratio);

	    var iter = dataset.get(), item;
	    var maxVal = dataset.maxVal;
	    // var r1=5*ratio, r2=30*ratio, r0=20*ratio;
		while ((item = iter.next()) != null) {
			var x = item.x, y = item.y, weight=(item.count||0)/maxVal;
			var shadow = 'rgba(0,0,0,' + ((weight)? weight: '0.1') + ')';
			
			// var grd = actx.createRadialGradient(x,y,r1,x,y,r2);
			// grd.addColorStop(0, shadow);
			// grd.addColorStop(1, 'rgba(0,0,0,0.05)');
			// actx.fillStyle = grd;

			// actx.beginPath();
			// actx.arc(x, y, r0, 0, M2PI, true);
			// actx.fill();
			// actx.closePath();

			actx.beginPath();
			actx.arc(x, y, 16*ratio, 0, M2PI, true);
			actx.shadowColor = shadow;//('rgba(0,0,0,'+((site.count)?(site.count/6):'0.1')+')');
			actx.fill();
			actx.closePath();
		}

		var imgd = actx.getImageData(0, 0, ka.width, ka.height);
		colorize(imgd);
		ka.context.putImageData(imgd, 0, 0);
	}
	function colorize(imageData) {
		var data = imageData.data;
		var i, l, a, maxv = 0;
		for (i = 3, a, l = data.length; i < l; i += 4) {
			if ((a = data[i]) > maxv) {
				maxv = a;
			}
		}
		if (maxv > 0) {
			var rate = 255 / maxv;
			for (i = 3, a, l = data.length; i < l; i += 4) {
				if ((a = data[i]) > 0) {
					data[i] = a = (a * rate) | 0;
					a <<= 2;
					data[i-3] = _rulerData[a];
					data[i-2] = _rulerData[a+1];
					data[i-1] = _rulerData[a+2];
				}
			}	
		}
		
		return imageData;
	}
	function adjustSize() {
		var ratio = ka.mapMode.ratio;
		acan.width = ka.width;
		acan.height = ka.height;
		acan.style.width = ka.width/ratio;
		acan.style.width = ka.width/ratio;

		shad_disradius = (ka.width+ka.height)*200;
	 	actx.shadowOffsetX = -shad_disradius; 
		actx.shadowOffsetY = -shad_disradius; 
	    actx.shadowBlur = 25*ratio; 
	    // actx.shadowColor = "#000";	
	}
	function buildRuler() {
		acan.height = 1;
		acan.width = 256;
		
		var grdData = options.gradient || {0.25: "blue", 0.55: "green", 0.8: "yellow", 1.0: "red"};
		var grd = actx.createLinearGradient(0, 0, 256, 1);
		for (var i in grdData) {
			grd.addColorStop(parseFloat(i), grdData[i]);
		}

		actx.fillStyle = grd;
		actx.fillRect(0,0,256,1);
		_rulerData = actx.getImageData(0, 0, 256, 1).data;
	}

	buildRuler();
	adjustSize();

	this.adjustSize = adjustSize;
	this.render = render;
}

//////////////////////////////////////////////////////////////////////
})();
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
//////////////////////////////////////////////////////////////////////
 // *
 // *	util.js
 // *
 // *	'util' is short for 'utilities'. Here, it infers label.
 // *	We use this to confuse our readers who want hack back.
 // *
//////////////////////////////////////////////////////////////////////

// (function(){
	




 /********************************
  *	class tkRect				 *
  ********************************/
function tkRect(t,b,l,r,m) {
	this.margin = m; 
	this.top = t-m;
	this.bottom = b+m;
	this.left = l-m;
	this.right = r+m;
}
// TMapEngine.private.tkRect = tkRect;
tkRect.prototype = {

	intersect: function(r) {
		return this.left<=r.right && r.left<=this.right && 
				this.top<=r.bottom && r.top<=this.bottom;
	},

	inrect: function(x,y) {
		return this.left<=x && x <= this.right &&
				this.top<=y && y <= this.bottom;
	},

	incore: function(pt) {
		var x = pt.x, y = pt.y;
		return this.left<=x-this.margin && x+this.margin <= this.right &&
				this.top<=y-this.margin && y+this.margin <= this.bottom;
	},
};



 /********************************
  *	class tkGrid				 *
  ********************************/
function tkGrid(w,h){
	this.w = w = (w>>8)+(w&0xff?1:0);
	this.h = h = (h>>8)+(h&0xff?1:0);
	this.arr = [];
	for (var i = 0; i < w*h; ++i) {
		this.arr.push([]);
	}
}
// TMapEngine.private.tkGrid = tkGrid;
tkGrid.prototype = {
	enumerate: function(r, func) {
		var i,j,rsi, sx = r.left>>8, ex = r.right>>8, sy = r.top>>8, ey = r.bottom>>8;
		if (sx < 0) sx = 0;
		if (ex >= this.w) ex = this.w-1;
		if (sy < 0) sy = 0;
		if (ey >= this.h) ey = this.h-1;
		if (ex < 0 || sx >= this.w || ey < 0 || sy >= this.h) 
			return;

		for (i = sy; i <= ey; ++i) {
			for (rsi = i * this.w, j = sx; j <= ex; ++j) {
				if (func(this.arr[rsi+j], r)) 
					return;
			}
		}
	},
	putrect: function (r) {
		this.enumerate(r, function(arr,r){
			arr.push(r);
			return 0;
		});
	},
	puttable: function(r) {
		if (r==null) return 0;
		var ret = 1, show = 0;
		this.enumerate(r, function(arr,r){
			show = 1;
			for (var i = arr.length - 1; i >= 0; i--) {
				if (r.intersect(arr[i])) 
					return ret = 0;
			}
			return 0;
		});
		return show && ret;
	},
	pointed: function(pt) {
		var i = pt.x>>8, j = pt.y>>8;
		if (i < 0 || i >= this.w || j<0 || j>=this.h) return;
		var arr = this.arr[j * this.w+i];
		for (i = 0, j = arr.length; i < j; ++i) {
			if (arr[i].incore(pt)) {
				return arr[i];
			}
		}
	},
};




function tkLRUCache(capacity){
	this.capacity = capacity || 256;
	this.cache = {};
	this.size = 0;
	this.header = {};
	this.header.next = this.header;
	this.header.prev = this.header; 
	this.delFunc = null;
}
tkLRUCache.prototype = {
	get: function(key, justCheck) {
		var v = this.cache[key]; 
		if (v != null && !justCheck) {
			var header = this.header;

			v.prev.next = v.next;
			v.next.prev = v.prev;
			v.next = header;
			v.prev = header.prev;
			header.prev.next = v;
			header.prev = v;			
		}
		return v;
	},
	setObject: function(res){
		if(!res.key) 
			return;
		var header = this.header;
		var old = this.cache[res.key];
		if (old) {
			old.prev.next = old.next;
  			old.next.prev = old.prev;
		}

		res.next = header;
		res.prev = header.prev;
		header.prev.next = res;
		header.prev = res;

		this.cache[res.key] = res;
		
		if(++this.size > this.capacity){
			old = header.next;
			header.next = old.next;
			old.next.prev = header;
			delete this.cache[old.key];

			if (this.delFunc) {
				this.delFunc(old)
			}
			--this.size;
		}
	},
	clear: function() {
		var node = this.header.next, prev_node = node.next;
		this.cache = {};
		this.size = 0;
		this.header.next = this.header;
		this.header.prev = this.header;
		while (node != this.header) {
			node.next = null;
			node.prev = null;

			if (this.delFunc) {
				this.delFunc(node)
			}

			node = prev_node;
			prev_node = node.next;
		}
	},
	filtObjects: function(func) {
		var header = this.header, node = header.next;
		while (node != header) {
			if (func(node)) {
				node.next.prev = node.prev;
				node.prev.next = node.next;
				delete this.cache[node.key];

				if (this.delFunc) {
					this.delFunc(node)
				}
			}
			node = node.next;
		}
	},
	replaceObjects: function(func) {
		var header = this.header, node = header.prev, new_node;
		while (node != header) {
			new_node = func(node);
			if (new_node) {
				// node.next.prev = node.prev;
				// node.prev.next = node.next;
				// // delete this.cache[node.key];

				// new_node.next = header;
				// new_node.prev = header.prev;
				// header.prev.next = new_node;
				// header.prev = new_node;

				node.next.prev = new_node;//node.prev;
				node.prev.next = new_node;//node.next;
				// delete this.cache[node.key];
				if (this.delFunc) {
					this.delFunc(node)
				}

				new_node.next = node.next;
				new_node.prev = node.prev;
				// header.prev.next = new_node;
				// header.prev = new_node;

				this.cache[new_node.key] = new_node;
			}
			node = node.prev;
		}
	},
};


// })();
//////////////////////////////////////////////////////////////////////
 // *
 // *	shiori.js
 // *
 // *	shiori is pronounciation for 'bookmark' in Japanese. Here, it 
 // *	infers label. We use this to confuse our readers who want hack back.
 // *
//////////////////////////////////////////////////////////////////////
// (function() {
// 	TMapEngine.private.tkShiori = 
function tkShiori(root, mode, tSb) { "use strict";
const fillText="fillText", strokeText="strokeText", white="#fff", margin= 10, fontUnit="px 黑体";
const M_PI = Math.PI, M_45 = M_PI/4, M_SQR2 = Math.SQRT2;
const rotateAngs = [-M_PI, M_PI/2, 0, -M_PI/2];

var layers = root.owner().layers;

function tkLabelsController(w, h) {
	this.grid = new tkGrid(w,h);
	this.shownSet = new Set();
	this.shownLabels = [];
}
tkLabelsController.prototype = {
	_couldShow: function(l, rect) {
		if (rect == null)
			return false;
		if (l.j != 4 && this.shownSet.has(l.r))
			return false;
		if (rect && !this.grid.puttable(rect))
			return false;
		return true;
	},
	_prepare: function(l,rect) {
		if (l.j != 4) this.shownSet.add(l.r);
		this.grid.putrect(rect);
		this.shownLabels.push([l,,[rect]]);
	},
	snapLabels: function(ctx) {
		for (var i = 0, l, len = this.shownLabels.length; i < len; ++i) {
			l = this.shownLabels[i];
			var rects = l[2];
			l[1] = rects.map(function(e){
				var ratio = mode.ratio;
				var el = e.label, w = e.right-e.left-e.margin*2,h = e.bottom-e.top-e.margin*2;
				var x = e.left+e.margin, y = e.top+e.margin;
				return {
					image: ctx.getImageData(x*ratio, y*ratio, w*ratio, h*ratio),
					sx: el? el.x-x: w/2, 
					sy: el? el.y-y: h/2 
				};
			});
		}
	},
	putSnap: function(ctx) {
		for (var i = 0, l, lbl, len = this.shownLabels.length; i < len; ++i) {
			l = this.shownLabels[i];
			lbl = l[0];

			lbl.fixXY();
			var rects = l[2];
			var imgs = l[1];
			if (rects.length == 1) {
				im = imgs[0];
				ctx.putImageData(im.image, (lbl.x-im.sx)*mode.ratio, (lbl.y-im.sy)*mode.ratio);
			} else {
				for (var j = 0, im, rct, jlen = rects.length; j < jlen; ++j) {
					im = imgs[j], rct = rects[j];
					fixXYRect(lbl, rct);
					ctx.putImageData(im.image, (rct.x-im.sx)*mode.ratio, (rct.y-im.sy)*mode.ratio);
				}	
			}
		}
	}
};

 /********************************
  *	class tkLabel				 *
  ********************************/

/////////////////////////////////////////////////
 // *	
 // *		json member
 // * ---------------------------
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
 // *
 // *
 // *
 // *		local extended
 // * ---------------------------
 // *	ll 	:= 文本的宽度
 // *	hh 	:= 文本的高度
 // *	rr 	:= 分行显示的文本
 // *	rrl	:= 分行显示的文本各行宽度
 // *	iw 	:= 图标显示宽度
 // *	ih 	:= 图标显示高度
/////////////////////////////////////////////////

function treatLabel(l,c,tile,lc) {
	var budgetFuncArr = [0,budget_dot9,_budget,_budget,budget_iconOnly,budget_text];
	var drawFuncArr = [0,draw_dot9,_draw,_draw,draw_iconOnly,draw_text];
	
	// tdx = , tdy = t.ty-mode.tileY;

	l.tile = tile;
	// l.tdx = tile.tx - mode.tileX, l.tdy = tile.ty - mode.tileY;
	l.context = c;
	c.textAlign = 'left';
	l.lctrl = lc;

	l.fixXY = fixXY0;
	l.textTrim = textTrim;
	
	if (l.j == 5 && l.a.length>=2){
		if (l.r && l.r.length && !lc.shownSet.has(l.r)) 
			drawMultiLabelWithParam.bind(l)();
	} else {
		l.budget = budgetFuncArr[l.j];
		l.draw = drawFuncArr[l.j];
	
		if (!isSkipDraw(l))
			l.draw();
	}
}
function resetTransform(l) {
	l.context.setTransform(mode.ratio,0,0,mode.ratio,0,0);
}
function vecFixXY(l,x,y) {
	var rate = mode.scale;
	var sx = rate*(x+(l.tdx<<tSb)), sy = rate*(y+(l.tdy<<tSb));

	return [(mode.x + sx*mode.cos0 - sy*mode.sin0)/mode.ratio,
			(mode.y + sx*mode.sin0 + sy*mode.cos0)/mode.ratio];
}

function fixXY(i) {
	var rate = mode.scale;
	// l.tdx = tile.tx - mode.tileX, l.tdy = tile.ty - mode.tileY;
	this.tdx = this.tile.tx - mode.tileX, this.tdy = this.tile.ty - mode.tileY;
	var sx = rate*(this.a[i]+(this.tdx<<tSb)), sy = rate*(this.a[i+1]+(this.tdy<<tSb));

	this.x = (mode.x + sx*mode.cos0 - sy*mode.sin0)/mode.ratio,
	this.y = (mode.y + sx*mode.sin0 + sy*mode.cos0)/mode.ratio;
}
function fixXY0() {
	var rate = mode.scale;
	var a = this.a;
	this.tdx = this.tile.tx - mode.tileX, this.tdy = this.tile.ty - mode.tileY;
	var sx = rate*(a[0]+(this.tdx<<tSb)), sy = rate*(this.a[1]+(this.tdy<<tSb));

	this.x = (mode.x + sx*mode.cos0 - sy*mode.sin0)/mode.ratio,
	this.y = (mode.y + sx*mode.sin0 + sy*mode.cos0)/mode.ratio;
}
function fixXYRect(l,rct) {
	var rate = mode.scale;
	
	l.tdx = l.tile.tx - mode.tileX, l.tdy = l.tile.ty - mode.tileY;
	var sx = rate*(rct.x+(l.tdx<<tSb)), sy = rate*(rct.y+(l.tdy<<tSb));

	rct.x = (mode.x + sx*mode.cos0 - sy*mode.sin0)/mode.ratio,
	rct.y = (mode.y + sx*mode.sin0 + sy*mode.cos0)/mode.ratio;
}

function textTrim() {
	if (this.ll) return;
	if (this.n == null) this.n = 10;
	var len = this.r.length,nl,s = this.n;
	var ctx = this.context;
	ctx.font = this.n + fontUnit;
	if ((nl = this.r.indexOf("\n"))>0) {
		this.rr=[this.r.substr(0,nl),this.r.substr(nl+1)];
		this.rrl = this.rr.map(function(i){return ctx.measureText(i).width;});
		this.ll = Math.max.apply(null, this.rrl), this.hh = s+s;
	} else if (len > 10) {
		nl= Math.ceil(len/2.0);
		this.rr=[this.r.substr(0,nl),this.r.substr(nl)];
		this.rrl = this.rr.map(function(i){return ctx.measureText(i).width;});
		this.ll = Math.max.apply(null, this.rrl), this.hh = s+s;
	} else {
		this.ll = ctx.measureText(this.r).width, this.hh = s;
	}
}
function isSkipDraw(l) {
	var rt;
	if (l.j && l.lctrl._couldShow(l, rt = l.budget())){
		l.lctrl._prepare(l, rt);
		return 0;	
	}
	return 1;
}

function _budget() {
	if (this.r == null || this.r.length == 0 || !this.imgInfo)
		return;
	
	this.fixXY();
	this.textTrim();
	var x = this.x, y = this.y, ll = this.ll, hh = this.hh;
	this.iw = this.imgInfo.iw, this.ih = this.imgInfo.ih;
	
	var rect =new tkRect(y-hh/2, y+hh/2, x-this.iw/2, x+this.iw/2+ll+3,margin);
	rect.label = this;
	return rect;
}


function _draw() {
	var c = this.context;
	var x = this.x, y = this.y;
	var ii = this.imgInfo, mgn = 0;
	if(ii && ii.t == 0 && ii.img) {
		c.drawImage(ii.img, ii.x, ii.y, ii.w, ii.h, x-this.iw/2, y-this.ih/2, ii.iw, ii.ih);
		mgn= this.iw/2+3;	
	} 
	
	c.font = this.n+fontUnit;
	if (!this.imgInfo || this.imgInfo.t==0) {
		c.lineWidth = (this.w||(this.w = 1))*2;
		c.strokeStyle = this.s||white;
		drawTextLeft(this,mgn,strokeText);
	}
	
	c.fillStyle = this==root.poiLabel? "#f00": this.f;
	drawTextLeft(this, mgn, fillText);
}

function budget_text() {
	this.fixXY();
	this.textTrim();
	var x = this.x, y = this.y, rw = (this.ll||0)/2, rh=(this.hh||0)/2;
	var rect = new tkRect(y-rh, y+rh, x-rw, x+rw, margin);
	rect.label = this;
	return rect;
}
function draw_text() {
	var c = this.context;
	var x = this.x, y = this.y;
	
	c.font = this.n+fontUnit;
	c.lineWidth = (this.w || (this.w = 2))*2;
	c.strokeStyle = this.s || white;
	drawTextMiddle(this,0,strokeText);
	
	c.fillStyle = this==root.poiLabel? "#f00":this.f;
	drawTextMiddle(this, 0, fillText);
}


function budget_dot9() {
	this.fixXY();
	this.textTrim();
	var x = this.x, y = this.y, rw = this.ll/2+5, rh = this.hh/2+5;
	// if (!this.imgInfo) {
	// 	this.imgInfo = iconInfo[this.i];
	// }
	return new tkRect(y-rh, y+rh, x-rw, x+rw, margin);
}
/*******************************
 *	draw_dot9
 *	绘制带.9背景图的标注
 *
 *	
 *******************************/
function draw_dot9() {
	var c = this.context;
	var x = this.x, y = this.y, ii = this.imgInfo;
	if (ii && ii.t == 9 && ii.img) {
		c.drawImage(ii.img, ii.x, ii.y, ii.w, ii.h, x-this.ll/2-5, y-this.hh/2-5, this.ll+10, this.hh+10);
		x -= this.ll / 2;
	}

	c.font = this.n+fontUnit;
	c.fillStyle = this.f;
	drawTextMiddle(this,0,fillText);
}

/*******************************
 *	draw_iconOnly
 *	绘制带.9背景图的标注
 *
 *	
 *******************************/
function budget_iconOnly() {
	this.fixXY();
	var x = this.x, y = this.y, rw, rh;
	// if (this.imgInfo == null) {
	// 	this.imgInfo = iconInfo[this.i];
	// 	if (this.imgInfo) {
	// 		this.iw = this.imgInfo.iw, this.ih = this.imgInfo.ih;
	// 	}
	// }
	rw = (this.iw||0)/2, rh=(this.ih||0)/2;
	return new tkRect(y-rh, y+rh, x-rw, x+rw, margin);
}
function draw_iconOnly() {
	var c = this.context;
	var x = this.x, y = this.y, ii = this.imgInfo;
	if (ii && ii.t == 0 && ii.img) {
		c.drawImage(ii.img, ii.x, ii.y, ii.w, ii.h, x-this.iw/2, y-this.ih/2, ii.iw, ii.ih);	
	}
	if (root.poiLabel == this) {
		;
	}
}

function drawTextLeft(l,c,f) {
	var x = l.x+c , y = l.y;
	var ctx = l.context;
	if (l.rr) {
		y -= l.n*(l.rr.length-1)/2;
		for (var i = 0,len = l.rr.length; i < len; ++i) {
			ctx[f](l.rr[i], x, y);
			y += l.n;
		}	
	} else {
		ctx[f](l.r, x, y);
	}
}

function drawTextMiddle(l,c,f) {
	var x = l.x , y = l.y+c;
	var ctx = l.context;
	if (l.rr) {
		if (c == 0) y -= l.n*(l.rr.length-1)/2;
		for (var i = 0,len = l.rr.length; i < len; ++i) {
			ctx[f](l.rr[i], x-l.rrl[i]/2, y);
			y += l.n;
		}
	} else {
		ctx[f](l.r, x-l.ll/2, y);
	}
}

function drawTextRight(l,c,f) {
	var x = l.x-c, y = l.y;
	var ctx = l.context;
	if (l.rr) {
		y -= l.n*(l.rr.length-1)/2;
		for (var i = 0,len = l.rr.length; i < len; ++i) {
			ctx[f](l.rr[i], x-l.rrl[i], y);
			y += l.n;
		}
	} else {
		ctx[f](l.r, x-l.ll, y);
	}
}

function drawChar(l,t,x,y,c,f) {
	l.context[f](t, x, y);
}



/****************************************************************
 *		multipoint label related stuff
 ****************************************************************/


function disArrAtIndex(arr,index) {
    var dx = arr[index]-arr[index+2], dy = arr[index+1]-arr[index+3];
    return Math.sqrt(dx * dx + dy * dy);
}
function nextPt(label,x0,y0,arr,index,klen) {
	var aidx = index<<1, dx = arr[aidx]-x0, dy = arr[aidx+1]-y0;
    var r = Math.sqrt(dx*dx+dy*dy);
    if (r >= klen) {
        var rate = klen/r, lx = x0+dx*rate, ly = y0+dy*rate;
        var pta = vecFixXY(label,lx,ly);
        var x = pta[0], y = pta[1];
        return {
            "sx": x, "sy": y, "x": lx, "y": ly, "index": index,
            "rect": new tkRect(y-klen,y+klen,x-klen,x+klen,0),
        };
    }
}

function drawMultiLabelWithParam() {
    var len = this.r.length, klen = this.n*M_SQR2;
    var dis = disArrAtIndex(this.a, 0), i = 1, grid = this.lctrl.grid;
    var x = this.a[0], y = this.a[1];
    var arr=[], lcount = len, plen = this.a.length>>1;

    this.tdx = this.tile.tx - mode.tileX, this.tdy = this.tile.ty - mode.tileY;
    while (lcount) {
        var res = nextPt(this, x, y, this.a, i, klen);
        if (res && grid.puttable(res.rect)) {
            x = res.x, y = res.y;
            res.rect.x = x, res.rect.y = y;
            i = res.index;
            arr.push(res);
            --lcount;
            // tiadd = true;
        } else {
        	if (++i >= plen) return;
        	arr = [];
        	lcount = len;
        }
    }

    var apt = arr[0], bpt, cnts = [0,0,0,0];
    for (i = 1; i < len; ++i) {
    	bpt = arr[i];
		var d = Math.atan2(apt.sy-bpt.sy, apt.sx-bpt.sx);
		var dd = Math.round(d / M_PI*2 + 6) % 4;
		cnts[dd]++;
		bpt.ang = d;
		if (i == 1) {
			cnts[dd]++;
			apt.ang = d;
		}
       	apt = bpt;
    }

    var tD = 3;
    for(var j = 0, t = 0; j < 4; ++j)
    	if (t < cnts[j]) t = cnts[tD = j];
    tD = rotateAngs[tD];

    --len;
    var rev = Math.atan2(arr[0].sy -arr[len].sy, arr[0].sx -arr[len].sx);
    rev = (-M_45 < rev && rev <= 3*M_45);
    
    klen /= 2;
    var c = this.context, lro =[this,,[]];
	c.font = this.n+fontUnit;
	c.lineWidth = (this.w||(this.w = 2))*2;
	c.strokeStyle = this.s||white;
	c.fillStyle = this.f;
	c.textAlign = 'center';
    for (i = len; i >= 0; --i) {
    	var chr = this.r.charAt(i);
    	var apt = arr[ rev? len-i: i];
    	grid.putrect(apt.rect);
    	lro[2].push(apt.rect);

        x = apt.sx, y = apt.sy;
        c.translate(x,y);
        c.rotate(apt.ang+tD);
        
        drawChar(this,chr,0,0,0,strokeText);
        drawChar(this,chr,0,0,0,fillText);
        resetTransform(this);
    }
    this.lctrl.shownSet.add(this.r);
    this.lctrl.shownLabels.push(lro);
}


function makeLimg() {
	return [];
}

function textWidth(str){
	var matched = str.match(/[^ -~]/g);
	return matched==null? str.length: str.length + matched.length; 
}

/*****************************
 *
 *	Output functions
 *
 *****************************/
function drawLabels(c) {
	c.clearRect(0,0,mode.width, mode.height);
	var lc = new tkLabelsController(mode.width, mode.height);
	c.save();
	c.lineCap = c.lineJoin = "round";
	c.miterLimit = 2;
	c.textBaseline = 'middle';
	c.setTransform(mode.ratio, 0, 0, mode.ratio, 0, 0);
	for (var lyr, li = 0, ll = layers.length; li < ll; ++li) {
		lyr = layers[li];
		if (lyr.hasLabel && lyr.showLabel) {
			var drawTiles = lyr.drawTiles;
			for (var t, j = 0, lj = drawTiles.length; j < lj; ++j) {
				t = drawTiles[j];
				if (!t.l) continue;

				for (var d,i = 0, len = t.l.length; i < len; ++i) {
					treatLabel(t.l[i],c,t,lc);
				}
			}		
		}
	}
	
	c.restore();
	return lc;
}
	root.shiori = drawLabels;
};
// })();
//////////////////////////////////////////////////////////////////////
 // *
 // *	tssh.js
 // *
 // *	tssh is short for tsushin, which is pronounciation for 
 // *	"communication" in Japanese. We use this to confuse our readers
 // * 	who want hack back.
 // *
//////////////////////////////////////////////////////////////////////
function tssh(root, func) { "use strict";
var mapDatUrl = TMap.domain + "/perseus/webmap";

function tkMapDataMessager(pool) {
	var msg = this;
	this.dataPool = pool;
	this.queue = [];
	this.proqueue = new Set();
}
tkMapDataMessager.prototype = {
	setTaskQueue: function(queue) {},
	startQuery: function(){},
};

function tkMapDataMessagerXHR() {
	Extends(this, tkMapDataMessager, arguments);

	if (!window.XMLHttpRequest && !window.ActiveXObject) { // code for all new browsers
		alert("Your browser does not support XMLHttpRequest.");
		return;
	}
	this.XHR = true;
	this.netWorking = false;
}
inherit(tkMapDataMessagerXHR, tkMapDataMessager, {
	loadData: function(param, needFresh) {
		var msgr = this;
		msgr.netWorking = true;
		$.ajax({
			type: "POST",
			url: mapDatUrl,
			timeout: TMap.timeout,
			data: param,
			dataType: "json",
			success:function(data, textStatus, jqXHR){
				if (data) {
					if (data instanceof Array) {
						for (var r in data) {
							msgr.dataPool.setObject(data[r]);
						}
					} else if (data) {
						msgr.dataPool.setObject(data);
					}
					needFresh && func();
				}
			},
			complete: function(jqXHR, textStatus) {
				msgr.netWorking = false;
				if (textStatus != "success") {
					console.log("fuck");
				}
			},
		});
	},

	setTaskQueue: function(queue) {
		if (this.queue && this.queue.queryIndex == queue.queryIndex)
			return;
		this.queue = queue;
		if (this.netWorking) 
			return;
		if (this.queue.length>0) {
			this.startQuery();
		}
	},

	startQuery: function() {
		var param = [], obj;
		this.proqueue.clear();
		for (var i = 0; i < 4 && this.queue.length > 0;) {
			obj = this.queue.pop();
			if (this.proqueue.has(obj.key) || root.get(obj.key))
				continue;
			this.proqueue.add(obj.key);
			param.push(obj.key);
			++i;
		}
		if (param.length) {
			param = "at=wm&v=1&key=" + param.join("-");
			this.loadData(param, this.queue.needDraw);
		} else {
			this.netWorking = false;
		}
	},
});

function tkMapDataMessagerImage() {
	Extends(this, tkMapDataMessager, arguments);
	this.downloadCount = 0;
	this.netWorking = 0;
}
inherit(tkMapDataMessagerImage, tkMapDataMessager, {
	setTaskQueue: function(queue) {
		this.queue = queue;
		if (this.netWorking < 1 && this.queue.length>0) {
			this.startQuery();
		}
	},
	startQuery: function() {
		var obj = this.queue.pop();
		while ((root.get(obj.key) || this.proqueue.has(obj.key)) && this.queue.length > 0) {
			obj = this.queue.pop();
		}
		if (root.get(obj.key) || this.proqueue.has(obj.key))
			return;

		++this.netWorking;
		this.proqueue.add(obj.key);
		var msgr = this;
		var needDraw = this.queue.needDraw;
		var img = new Image();
		img.onerror = function() {
			--msgr.netWorking;
		};

		img.onload = function() {
			obj.img.crossOrigin = "anonymous";

			if (obj.layer._owner.canvases[0].glGenTexture)
				obj.tex = obj.layer._owner.canvases[0].glGenTexture(obj.img);

			msgr.dataPool.setTile(obj);
			msgr.proqueue.delete(obj.key);
			if (msgr.queue.length > 0) {
				
			}
			--msgr.netWorking;
			needDraw && func();	
		};
		img.crossOrigin = "anonymous";
		obj.img = img;
		obj.svr = this.downloadCount++%8;
		obj.layer.send(obj);
	},
});

	root.tssh = {
		gMsg: new tkMapDataMessagerXHR(root),
		grMsg: new tkMapDataMessagerImage(root),
	};
};
// (function(){
//     var TMap = window.TMap = TMap || {};
    /**
     * 获取一个扩展的视图范围，把上下左右都扩大一样的像素值。
     * @param {Map} map TMap.Map的实例化对象
     * @param {TMap.Bounds} bounds TMap.Bounds的实例化对象
     * @param {Number} gridSize 要扩大的像素值
     *
     * @return {TMap.Bounds} 返回扩大后的视图范围。
     */
    var getExtendedBounds = function(map, bounds, gridSize) {
        bounds = cutBoundsInRange(bounds);
        var pixelNE = map.pointToPixel(bounds.getNorthEast());
        var pixelSW = map.pointToPixel(bounds.getSouthWest()); 
        pixelNE.x += gridSize;
        pixelNE.y -= gridSize;
        pixelSW.x -= gridSize;
        pixelSW.y += gridSize;
        var newNE = map.pixelToPoint(pixelNE);
        var newSW = map.pixelToPoint(pixelSW);
        return new TMap.Bounds(newSW, newNE);
    };

    /**
     * 按照百度地图支持的世界范围对bounds进行边界处理
     * @param {TMap.Bounds} bounds TMap.Bounds的实例化对象
     *
     * @return {TMap.Bounds} 返回不越界的视图范围
     */
    var cutBoundsInRange = function (bounds) {
        var maxX = getRange(bounds.getNorthEast().lon, -180, 180);
        var minX = getRange(bounds.getSouthWest().lon, -180, 180);
        var maxY = getRange(bounds.getNorthEast().lat, -74, 74);
        var minY = getRange(bounds.getSouthWest().lat, -74, 74);
        return new TMap.Bounds(new TMap.Point(minX, minY), new TMap.Point(maxX, maxY));
    }; 

    /**
     * 对单个值进行边界处理。
     * @param {Number} i 要处理的数值
     * @param {Number} min 下边界值
     * @param {Number} max 上边界值
     * 
     * @return {Number} 返回不越界的数值
     */
    var getRange = function (i, mix, max) {
        mix && (i = Math.max(i, mix));
        max && (i = Math.min(i, max));
        return i;
    };

    /**
     * 判断给定的对象是否为数组
     * @param {Object} source 要测试的对象
     *
     * @return {Boolean} 如果是数组返回true，否则返回false
     */
    var isArray = function (source) {
        return '[object Array]' === Object.prototype.toString.call(source);
    };

    /**
     * 返回item在source中的索引位置
     * @param {Object} item 要测试的对象
     * @param {Array} source 数组
     *
     * @return {Number} 如果在数组内，返回索引，否则返回-1
     */
    var indexOf = function(item, source){
        var index = -1;
        if(isArray(source)){
            if (source.indexOf) {
                index = source.indexOf(item);
            } else {
                for (var i = 0, m; m = source[i]; i++) {
                    if (m === item) {
                        index = i;
                        break;
                    }
                }
            }
        }        
        return index;
    };

    function genStyle(n) {
        if (n < 5) {
            return {
                "background-image": 'url("img/m0.png")',
                color: "black", 
                width: "53px", 
                height: "53px",
                "line-height": "53px",
            };
        } else if (n < 20) {
            return {
                "background-image": 'url("img/m1.png")',
                color: "black", 
                width: "56px", 
                height: "56px",
                "line-height": "56px",
            };
        } else if (n < 100) {
            return {
                "background-image": 'url("img/m2.png")',
                color: "black", 
                width: "66px", 
                height: "66px",
                "line-height": "66px",
            };
        } else if (n < 400) {
            return {
                "background-image": 'url("img/m3.png")',
                color: "black", 
                width: "78px", 
                height: "78px",
                "line-height": "78px",
            };
        } else {
            return {
                "background-image": 'url("img/m4.png")',
                color: "black", 
                width: "90px", 
                height: "90px",
                "line-height": "90px",
            };
        }
    }

    var MarkerClusterer =  
        /**
         * 用来解决加载大量点要素到地图上产生覆盖现象的问题，并提高性能
         * 
         * @class MarkerClusterer
         * @constructor
         * @param {Map} map 地图的一个实例。
         * @param {Json Object} options 可选参数，可选项包括：<br />
         *    markers {Array<Marker>} 要聚合的标记数组<br />
         *    girdSize {Number} 聚合计算时网格的像素大小，默认60<br />
         *    maxZoom {Number} 最大的聚合级别，大于该级别就不进行相应的聚合<br />
         *    minClusterSize {Number} 最小的聚合数量，小于该数量的不能成为一个聚合，默认为2<br />
         *    isAverangeCenter {Boolean} 聚合点的落脚位置是否是所有聚合在内点的平均值，默认为否，落脚在聚合内的第一个点<br />
         *    styles {Array<IconStyle>}  自定义聚合后的图标风格，请参考TextIconOverlay类<br />
         *
         * @example
         *
         *      var markers = [new TMap.Marker(120, 30), new TMap.Marker(122, 29.5)];
         *      new TMap.MarkerClusterer(map, {markers: markers});
         */
        TMap.MarkerClusterer = function(map, options){
            if (!map){
                return;
            }
            this._map = map;
            this._markers = [];
            this._clusters = [];
            
            var opts = options || {};
            this._gridSize = opts["gridSize"] || 90;
            this._maxZoom = opts["maxZoom"] || 18;
            this._minClusterSize = opts["minClusterSize"] || 2;           
            this._genStyle = opts["styler"] || genStyle;
            this._isAverageCenter = true;
            if (opts['isAverageCenter'] != undefined) {
                this._isAverageCenter = opts['isAverageCenter'];
            }    
            this._styles = opts["styles"] || [];
        
            var that = this;
            this._listener = this._map.addEventListener(function(){
                that._redraw();     
            }, ["zoomend", "moveend"]);
   
            var mkrs = opts["markers"];
            isArray(mkrs) && this.addMarkers(mkrs);
        };


MarkerClusterer.prototype = {
    /**
     * 添加要聚合的标记数组。
     * @method addMarkders
     * @param {Array<Marker>} markers 要聚合的标记数组
     *
     * @return 无返回值。
     */

    addMarkers: function(markers) {
        for(var i = 0, len = markers.length; i <len ; i++){
            this._pushMarkerTo(markers[i]);
        }
        this._createClusters();   
    },

    /**
     * 把一个标记添加到要聚合的标记数组中
     * @param {TMap.Marker} marker 要添加的标记
     *
     * @return 无返回值。
     */
    _pushMarkerTo: function(marker) {
        var index = indexOf(marker, this._markers);
        if(index === -1){
            marker.isInCluster = false;
            this._markers.push(marker);//Marker拖放后enableDragging不做变化，忽略
        }
    },

    /**
     * 添加一个聚合的标记。
     * @method addMarker
     * @param {TMap.Marker} marker 要聚合的单个标记。
     * @return 无返回值。
     */
    addMarker: function(marker) {
        this._pushMarkerTo(marker);
        this._createClusters();
    },

    /**
     * 根据所给定的标记，创建聚合点
     * @return 无返回值
     */
    _createClusters: function(){
        var mapBounds = this._map.getBounds();
        var extendedBounds = getExtendedBounds(this._map, mapBounds, this._gridSize);
        for(var i = 0, marker; marker = this._markers[i]; i++){
            if(!marker.isInCluster && extendedBounds.containsPoint(marker.getPoint()) ){ 
                this._addToClosestCluster(marker);
            }
        }   
    },

    /**
     * 根据标记的位置，把它添加到最近的聚合中
     * @param {TMap.Marker} marker 要进行聚合的单个标记
     *
     * @return 无返回值。
     */
    // _addToClosestCluster: function (marker){
    //     var distance = 4000000;
    //     var clusterToAddTo = null;
    //     var position = marker.getPoint();
    //     for(var i = 0, cluster; cluster = this._clusters[i]; i++){
    //         var center = cluster.getCenter();
    //         if(center){
    //             var d = TMap.GeoUtils.getDistance(center, marker.getPoint())
    //             // var d = this._map.getDistance(center, marker.getPoint());
    //             if(d < distance){
    //                 distance = d;
    //                 clusterToAddTo = cluster;
    //             }
    //         }
    //     }
    
    //     if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)){
    //         clusterToAddTo.addMarker(marker);
    //     } else {
    //         var cluster = new Cluster(this);
    //         cluster.addMarker(marker);            
    //         this._clusters.push(cluster);
    //     }    
    // },

     _addToClosestCluster: function (marker){
        // var distance = 4000000;
        var clusterToAddTo = null;
        var position = marker.getPoint();
        for(var i = 0, cluster; cluster = this._clusters[i]; i++){
            if (cluster.isMarkerInClusterBounds(marker)) {
                cluster.addMarker(marker);
                return;
            }
            // var center = cluster.getCenter();
            // if(center){
            //     var d = TMap.GeoUtils.getDistance(center, marker.getPoint())
            //     // var d = this._map.getDistance(center, marker.getPoint());
            //     if(d < distance){
            //         distance = d;
            //         clusterToAddTo = cluster;
            //     }
            // }
        }
    
        // if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)){
        //     clusterToAddTo.addMarker(marker);
        // } else {
            var cluster = new Cluster(this);
            cluster.addMarker(marker);            
            this._clusters.push(cluster);
        // }    
    },

    /**
     * 清除上一次的聚合的结果
     * @return 无返回值。
     */
    _clearLastClusters: function(){
        for(var i = 0, cluster; cluster = this._clusters[i]; i++){            
            cluster.remove();
        }
        this._clusters = [];//置空Cluster数组
        this._removeMarkersFromCluster();//把Marker的cluster标记设为false
    },

    /**
     * 清除某个聚合中的所有标记
     * @return 无返回值
     */
    _removeMarkersFromCluster: function(){
        for(var i = 0, marker; marker = this._markers[i]; i++){
            marker.isInCluster = false;
        }
    },
   
    /**
     * 把所有的标记从地图上清除
     * @return 无返回值
     */
    _removeMarkersFromMap: function(){
        for(var i = 0, marker; marker = this._markers[i]; i++){
            marker.isInCluster = false;
            this._map.removeOverlay(marker);       
        }
    },

    /**
     * 删除单个标记
     * @param {TMap.Marker} marker 需要被删除的marker
     *
     * @return {Boolean} 删除成功返回true，否则返回false
     */
    _removeMarker: function(marker) {
        var index = indexOf(marker, this._markers);
        if (index === -1) {
            return false;
        }
        this._map.removeOverlay(marker);
        this._markers.splice(index, 1);
        return true;
    },

    /**
     * 删除单个标记
     * @method removeMarker
     * @param {TMap.Marker} marker 需要被删除的marker
     *
     * @return {Boolean} 删除成功返回true，否则返回false
     */
    removeMarker: function(marker) {
        var success = this._removeMarker(marker);
        if (success) {
            this._clearLastClusters();
            this._createClusters();
        }
        return success;
    },
    
    /**
     * 删除一组标记
     * @method removeMarkers
     * @param {Array<TMap.Marker>} markers 需要被删除的marker数组
     *
     * @return {Boolean} 删除成功返回true，否则返回false
     */
    removeMarkers: function(markers) {
        var success = false;
        for (var i = 0; i < markers.length; i++) {
            var r = this._removeMarker(markers[i]);
            success = success || r; 
        }

        if (success) {
            this._clearLastClusters();
            this._createClusters();
        }
        return success;
    },

    /**
     * 从地图上彻底清除所有的标记
     * @method clearMarkers
     * @return 无返回值
     */
    clearMarkers: function() {
        this._clearLastClusters();
        this._removeMarkersFromMap();
        this._markers = [];
    },

    /**
     * 重新生成，比如改变了属性等
     * @return 无返回值
     */
    _redraw: function () {
        this._clearLastClusters();
        this._createClusters();
    },

    // _show: function() {
    //     for (var i = 0, l = this._clusters.length; i < l; ++i) {
    //         console.log(this._clusters[i])
    //     }
    // },
    /**
     * 获取网格大小
     * @method getGridSize
     * @return {Number} 网格大小
     */
    getGridSize: function() {
        return this._gridSize;
    },

    /**
     * 设置网格大小
     * @method setGridSize
     * @param {Number} size 网格大小
     * @return 无返回值
     */
    setGridSize: function(size) {
        this._gridSize = size;
        this._redraw();
    },

    /**
     * 获取聚合的最大缩放级别。
     * @method getMaxZoom
     * @return {Number} 聚合的最大缩放级别。
     */
    getMaxZoom: function() {
        return this._maxZoom;       
    },

    /**
     * 设置聚合的最大缩放级别
     * @method setMaxZoom
     * @param {Number} maxZoom 聚合的最大缩放级别
     * @return 无返回值
     */
    setMaxZoom: function(maxZoom) {
        this._maxZoom = maxZoom;
        this._redraw();
    },

    /**
     * 获取聚合的样式风格集合
     * @method getStyles
     * @return {Array<IconStyle>} 聚合的样式风格集合
     */
    getStyles: function() {
        return this._styles;
    },

    /**
     * 设置聚合的样式风格集合
     * @method setStyles
     * @param {Array<IconStyle>} styles 样式风格数组
     * @return 无返回值
     */
    setStyles: function(styles) {
        this._styles = styles;
        this._redraw();
    },

    /**
     * 获取单个聚合的最小数量。
     * @method getMinClusterSize
     * @return {Number} 单个聚合的最小数量。
     */
    getMinClusterSize: function() {
        return this._minClusterSize;
    },

    /**
     * 设置单个聚合的最小数量。
     * @method setMinClusterSize
     * @param {Number} size 单个聚合的最小数量。
     * @return 无返回值。
     */
    setMinClusterSize: function(size) {
        this._minClusterSize = size;
        this._redraw();
    },

    /**
     * 获取单个聚合的落脚点是否是聚合内所有标记的平均中心。
     * @method isAverageCenter
     * @return {Boolean} true或false。
     */
    isAverageCenter: function() {
        return this._isAverageCenter;
    },

    /**
     * 获取聚合的Map实例。
     * @method getMap
     * @return {TMap.Map} Map的示例。
     */
    getMap: function() {
      return this._map;
    },

    /**
     * 获取所有的标记数组。
     * @method getMarkers
     * @return {Array<Marker>} 标记数组。
     */
    getMarkers: function() {
        return this._markers;
    },

    /**
     * 获取聚合的总数量。
     * @method getClustersCount
     * @return {Number} 聚合的总数量。
     */
    getClustersCount: function() {
        var count = 0;
		for(var i = 0, cluster; cluster = this._clusters[i]; i++){
            cluster.isReal() && count++;     
        }
		return count;
    },

    /**
     * 卸载数据
     * @method uninstall
     */
    uninstall: function() {
        this.clearMarkers();
        this._map.removeListener(this._listener);
    }
};

    /**
     * 表示一个聚合对象，该聚合，包含有N个标记，这N个标记组成的范围，并有予以显示在Map上的TextIconOverlay等。
     * 
     * @class Cluster
     * @constructor
     * @param {MarkerClusterer} markerClusterer 一个标记聚合器示例。
     */
    function Cluster(markerClusterer){
        this._markerClusterer = markerClusterer;
        this._map = markerClusterer.getMap();
        this._minClusterSize = markerClusterer.getMinClusterSize();
        this._isAverageCenter = markerClusterer.isAverageCenter();
        this._center = null;//落脚位置
        this._markers = [];//这个Cluster中所包含的markers
        this._gridBounds = null;//以中心点为准，向四边扩大gridSize个像素的范围，也即网格范围
		this._isReal = false; //真的是个聚合
    
        this._clusterMarker = new TMap.TextIconOverlay(this._center, this._markers.length, {"styles":this._markerClusterer.getStyles()});
    }
   
    
Cluster.prototype = {
    /**
     * 向该聚合添加一个标记。
     * @method addMarker
     * @param {Marker} marker 要添加的标记。
     * @return 无返回值。
     */
    addMarker: function(marker){
        if(this.isMarkerInCluster(marker)){
            return false;
        }//也可用marker.isInCluster判断,外面判断OK，这里基本不会命中
    
        if (!this._center){
            this._center = marker.getPoint();
            this.updateGridBounds();//
        } else {
            if (this._isAverageCenter) {
                var l = this._markers.length + 1, pt = marker.getPoint();
                var lat = (this._center.lat * (l - 1) + pt.lat) / l;
                var lon = (this._center.lon * (l - 1) + pt.lon) / l;
                this._center = new TMap.Point(lon, lat);
                this.updateGridBounds();
            }//计算新的Center
        }
    
        marker.isInCluster = true;
        this._markers.push(marker);
    
        var len = this._markers.length;
        if (len < this._minClusterSize){     
            this._map.addOverlay(marker);
            return true;
        } else if (len === this._minClusterSize) {
            for (var i = 0; i < len; i++) {
                this._map.removeOverlay(this._markers[i]);
                // this._markers[i].getMap() && this._map.removeOverlay(this._markers[i]);
            }
        } 

		this._isReal = true;
        this.updateClusterMarker();
        return true;
    },
    
    /**
     * 判断一个标记是否在该聚合中。
     * @method isMarkerInCluster
     * @param {Marker} marker 要判断的标记。
     * @return {Boolean} true或false。
     */
    isMarkerInCluster: function(marker){
        if (this._markers.indexOf) {
            return this._markers.indexOf(marker) != -1;
        } else {
            for (var i = 0, m; m = this._markers[i]; i++) {
                if (m === marker) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * 判断一个标记是否在该聚合网格范围中。
     * @method isMarkerInClusterBounds
     * @param {Marker} marker 要判断的标记。
     * @return {Boolean} true或false。
     */
    isMarkerInClusterBounds: function(marker) {
        return this._gridBounds.containsPoint(marker.getPoint());
    },
	
	isReal: function(marker) {
        return this._isReal;
    },

    /**
     * 更新该聚合的网格范围。
     * @method updateGridBounds
     * @return 无返回值。
     */
    updateGridBounds: function() {
        var bounds = new TMap.Bounds(this._center, this._center);
        this._gridBounds = getExtendedBounds(this._map, bounds, this._markerClusterer.getGridSize());
    },

    /**
     * 更新该聚合的显示样式，也即TextIconOverlay。
     * @method updateClusterMarker
     * @return 无返回值。
     */
    updateClusterMarker: function () {
        if (this._map.getZoom() > this._markerClusterer.getMaxZoom()) {
            this._map.removeOverlay(this._clusterMarker);
            for (var i = 0, marker; marker = this._markers[i]; ++i) {
                this._map.addOverlay(marker);
            }
            return;
        }

        if (this._markers.length < this._minClusterSize) {
            this._clusterMarker.hide();
            return;
        }

        this._map.addOverlay(this._clusterMarker);
        this._clusterMarker._sv.css(this._markerClusterer._genStyle(this._markers.length));
        this._clusterMarker.setPoint(this._center);
        this._clusterMarker.setText(this._markers.length);

        var self = this;
        this._clusterMarker.click(function(event) {
            self._map.setViewport(self.getBounds());
        });
    },

    /**
     * 删除该聚合。
     * @method remove
     * @return 无返回值。
     */
    remove: function(){
        for (var i = 0, m; m = this._markers[i]; i++) {
            this._map.removeOverlay(this._markers[i]);
                // this._markers[i].getMap() && this._map.removeOverlay(this._markers[i]);
        }//清除散的标记点
        this._map.removeOverlay(this._clusterMarker);
        this._markers.length = 0;
        delete this._markers;
    },

    /**
     * 获取该聚合所包含的所有标记的最小外接矩形的范围。
     * @method getBounds
     * @return {TMap.Bounds} 计算出的范围。
     */
    getBounds: function() {
        var bounds = new TMap.Bounds(this._center,this._center);
        for (var i = 0, marker; marker = this._markers[i]; i++) {
            bounds.extend(marker.getPoint());
        }
        return bounds;
    },

    /**
     * 获取该聚合的落脚点。
     * @method getCenter
     * @return {TMap.Point} 该聚合的落脚点。
     */
    getCenter: function() {
        return this._center;
    },


};

// })();
})();