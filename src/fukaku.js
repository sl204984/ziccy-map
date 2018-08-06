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