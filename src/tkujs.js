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

