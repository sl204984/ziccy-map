var _map;
if (!window.applicationCache) {
	alert("老虎地图需要支持HTML5的浏览器才能使用，请升级或更换你的浏览器。\n推荐使用Chrome 50, Firefox 28或其以上的版本。");
} else

var featureType = 0;
//POI:1
//地名：2
//交通：3
//绿地：4
//水系：5
//居民地：6
//境界：7


//
// //  zhejiang
// var featureTypeDict = {
// 1:[16,17,3,18,8,19,20,21,36,37,38,39,40,41],
// 2:[3,18,12,22],
// 3:[2,9,23,26,42,43,44,45,46,47,48,49,50,51],
// 4:[4,34],
// 5:[1,6,13,24,29,33],
// 6:[5,11,35],
// 7:[0,14,30]
// };

//
// shandong
//var featureTypeDict = {
//1:	[11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,41,42,43,44,45,46,47,48,49,50,51],
//2:	[38,39,40,56],
//3:	[2,3,4,5,6,7,8,9,10],
//4:	[0],
//5:	[1,54],
//6:	[53,58,59],
//7:	[55]
//};

// guangzhou
var featureTypeDict = {
1:	[11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,41,42,43,44,45,46,47,48,49,50,51],
2:	[38,39,40,56],
3:	[2,3,4,5,6,7,8,9,10],
4:	[0],
5:	[1,54],
6:	[53,58,59],
7:	[55]
};

function initDict(){
	for (var i in featureTypeDict) {
		featureTypeDict[i] = featureTypeDict[i].map(function (e) {return e.toString(32);});
	}
}

$(function() {
	initDict();
	_map = new TMap.Map({
		container: document.body,//"map",//
		// layers: ["satellite", "horae", "tmc", "tm0", "tm1", "tm2"],
		// rotateLock: true,
		dynamicShow: true,

		// engineOption: {
		// 	layerFactories: {
		// 		tmc: function(name) {
		// 				var lyr = new TMap.Layer.LayerWMS(name);
		//  				lyr.name = "tmc";
		//  				lyr.lonlatBox = [118.01526,123.171035,27.036882,31.186128],
		//  				lyr.urlPattern = TMap.domain+"/perseus/cors?url=http://www.map.zj.cn:8899/geoserver/zjplatform/RTIC_POLYLINE/ows?LAYERS=RTIC_POLYLINE&VERSION=1.1.1&TRANSPARENT=TRUE&SERVICE=WMS&REQUEST=GetMap&STYLES=&FORMAT=image%2Fpng&SRS=EPSG%3A4326&BBOX=%{lon},%{lat},%{LON},%{LAT}&WIDTH=256&HEIGHT=256";
		//  				lyr.visible = false;
		//  				lyr.minZ = 8;
		// 		 		return lyr;
		// 		 	},
		// 		tm0: function(name) {
		//  				var lyr = new TMap.Layer.LayerWMTS(name);
		//  				lyr.name = "tm0";
		//  				lyr.lonlatBox = [120.37308965798331, 122.87389346256805, 27.10415104612412, 30.91994080435971];
		//  				lyr.urlPattern = TMap.domain+"/perseus/cors?url=http://ditu.zj.cn/services/wmts/D369004?layer=D369004&style=default&tilematrixset=default028mm&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpg&TileMatrix=%{z}&TileCol=%{x}&TileRow=%{y}";
		//  				lyr.visible = false;
		//  				lyr.minZ = 8;
		//  				return lyr;
		//  			},
		// 		tm1: function(name) {
		// 		 		var lyr = new TMap.Layer.LayerWMS(name);
		//  				lyr.name = "tm1";
		//  				lyr.lonlatBox = [120.26692345873198, 122.26048875578306, 27.041128654984117, 30.757886557974214];
		//  				lyr.urlPattern = TMap.domain+"/perseus/cors?url=http://121.41.28.227:8080/geoserver/haiyang/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=haiyang%3A1&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4326&STYLES=&FORMAT_OPTIONS=dpi%3A180&BBOX=%{lat},%{lon},%{LAT},%{LON}";
		//  				lyr.visible = false;
		//  				lyr.minZ = 8;
		//  				return lyr;
		//  			}, 
		// 		tm2: function(name) {
		// 		 		var lyr = new TMap.Layer.LayerWMTS(name);
		//  				lyr.name = "tm2";
		//  				lyr.lonlatBox = [120.32590468053826, 122.60257984225933, 27.072644279526635, 30.74774908659627];
		//  				lyr.urlPattern = TMap.domain+"/perseus/cors?url=http://ditu.zj.cn/services/wmts/D373972?layer=D373972&style=default&tilematrixset=default028mm&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpg&TileMatrix=%{z}&TileCol=%{x}&TileRow=%{y}";
		//  				lyr.visible = false;
		//  				lyr.minZ = 8;
		//  				return lyr;
		//  			},
		// 	},
		// },
	});

	_map.setZoom(8);
	_map.addEventListener(function(){
		viewStyleCheck('vector-sm');
	}, "ready");

	// _map.getBasicLayer().lonlatBox = _map.view.imageLayer.lonlatBox = [114.793643, 122.732077, 34.348206, 38.350043];
	// var a=TMap.Point.toPoint(120,30);

	// MarkerClusterer test
	// var pins = [], pin = new TMap.Bubble([116.994, 36.6661]);
	// pins.push(pin);
	// pin = new TMap.Bubble([116.993, 36.6661]);
	// pin.setStyle(2);
	// pins.push(pin);
	// pin = new TMap.Bubble([116.994, 36.66]);
	// pin.setStyle(5);
	// pins.push(pin);
	// var mc = new TMap.MarkerClusterer(_map, {
	//     markers: pins,
	//     // maxZoom: 17,
	// });


	// Shape Overlay test
	// var poly = new TMap.Polygon([[116.994, 36.6661],[116.994, 36.66],
	// 	[116.9945, 36.66],[116.9945, 36.6658],[116.995, 36.6658],[116.995, 36.66],
	// 	[116.9955, 36.66],[116.9955, 36.6658],[116.996, 36.6658],[116.996, 36.66],
	// 	[116.9965, 36.66],[116.9965, 36.6658],[116.997, 36.6658],[116.997, 36.66],
	// 	[116.9975, 36.66],[116.9975, 36.6658],[116.998, 36.6658],[116.998, 36.66],
	// 	[116.9985, 36.66],[116.9985, 36.6658],[116.999, 36.6658],[116.999, 36.66],
	// 	[117, 36.66],[117, 36.6661]]);
	// _map.addOverlay(poly);
	// poly = new TMap.Polyline([[116.993, 36.6663],[116.993, 36.658],
	// 	[117.001, 36.658],[117.001, 36.6663]]);
	// _map.addOverlay(poly);
	// var cir = new TMap.Circle([116.994, 36.6661], 5000);
	// cir.fillColor = "rgba(0,0,255,0.6)";
	// _map.addOverlay(cir);

	// var arr = [];
	// for (var i = 0; i < 200; ++i) {
	// 	// arr.push(new TMap.Bubble({
	// 	// 	x: 116.9945 + Math.random(),
	// 	// 	y: 36.66 + Math.random()
	// 	// }));
	// 	_map.addOverlay(new TMap.Bubble({
	// 		lon: 116.9945 + Math.random(),
	// 		lat: 36.66 + Math.random()
	// 	}));
	// }


	colorPicker('colorpicker', setColor);
	$("#colorpicker").hide();

	var view = _map.view;
	_map.click(function(p){
		console.log(p);
	});
});



function showcolorpick(t) {
	featureType = t;

	var left = (window.innerWidth - 565) / 2, top = (window.innerHeight - 335) / 2;
	var right = left + 565, bottom = top + 335;
	var ov = $("#colorpicker").css({left: left+"px", top:top+"px"}).show();
	
	var click = function(e) {
		var x = e.clientX, y = e.clientY;
		var target = $(e.target);
		if (ov.is(":visible") && (left > x || right < x || top > y || bottom < y)) {
			ov.hide();
			$('body').unbind('click', click);
		}
	};
	$('body').bind('click', click);
}

function setColor(color) {
	if (color) {
		console.log(color);
		_map.getBasicLayer().customStyle(featureTypeDict[featureType], {value: color});
		_map.refresh();
	}
	$("#colorpicker").hide();
}

function clearColorStyle(){
	_map.getBasicLayer().clearCustomStyle();
	_map.refresh();
}
function toggleFeatureVisibilty(img, t) {
	var innerTypes = featureTypeDict[t], inType = innerTypes instanceof Array? innerTypes[0]: innerTypes; 
	_map.getBasicLayer().toggleFilter(innerTypes);
	_map.refresh();
	img.src = 'img/out/eye'+(_map.getBasicLayer().checkFilter(inType)? "1": "")+'.png';
}
function toggleFeatureBold(img, t) {
	var innerTypes = featureTypeDict[t], inType = innerTypes instanceof Array? innerTypes[0]: innerTypes; 

	_map.getBasicLayer().boldFeature(innerTypes);
	_map.refresh();
	img.src = 'img/out/sun'+(_map.getBasicLayer().checkBoldFeature(inType) == null? "": "1")+'.png';
}
function viewStyleCheck(vs) {
	var dv = $(".dropdown-view i").attr("class", "fa fa-square-o fa-fw");
	var n = {'vector-sm':0,'vector':1,'vector-eu':2,'vector-night':3,'satellite':4}[vs];
	dv = dv[n];
	$(dv).attr("class", "fa fa-check-square-o fa-fw");

	_map.view.viewStyleChange(vs);

	_map.refresh();
}
function toggleThemeLayer(t) {
	var lyr = _map.view.getLayer("tm"+t);
	lyr.visible = !lyr.visible;
	_map.refresh();

	var dv = $(".dropdown-theme i");
	if (t < dv.length) 
		$(dv[t]).attr("class", lyr.visible? "fa fa-check-square-o fa-fw": "fa fa-square-o fa-fw");
}

var drawingFree = null;
function drawFree() {
	if (drawingFree) {
		_map.addOverlay(_map.exitDrawMode());
		drawingFree = null;
	} else {
		_map.enterDrawMode();
		drawingFree = 999;
	}
}

function drawShape(type) {
	_map.enterDrawMode(type, {
		autoExit: function(m) {
			m.addOverlay(m.exitDrawMode());
		}
	});
}

function clearDraw() {
	_map.clearOverlays();
	_map.refresh();
}
