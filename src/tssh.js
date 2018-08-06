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