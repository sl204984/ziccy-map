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
(function () {

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

		this.get = function () {
			return {
				cur: 0,
				next: function () {
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
	TMap.Dataset.prototype.get = function () {
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
		function kanimate(root, anmFunc, dataset, options) {
			"use strict";
			var tkmapview = root._owner,
				context = root.context,
				mapMode = tkmapview.mapMode;
			var KA = {},
				imageCache = {},
				AFR;
			var timer, animateTimer = null;
			var setuped, kav_stutter;
			var mx, my, hw, hh, s, ss, ssa, ssb, ssc, ssd;

			function init() {
				timer = 0;
				setuped = false,
					kav_stutter = true;
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
				s = 23 - mapMode.z;
				mx = mapMode.mctX << s;
				my = mapMode.mctY << s;
				hw = mapMode.width / 2;
				hh = mapMode.height / 2;

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

				ss = mapMode.scale / (1 << s);

				if (mapMode.rotate) {
					ssa = ss * mapMode.cos0,
						ssb = ss * mapMode.sin0,
						ssc = -ssb,
						ssd = ssa;
				}

				var brr = AFR.bbox;
				if (brr) {
					var rr = mapMode.calcRange();
					for (var i = 0; i < 4; ++i) rr[i] <<= s;
					if (brr.xl > rr[1] || brr.xr < rr[0] || brr.yt > rr[3] || brr.yb < rr[2])
						AFR.drawing = false;
					else
						AFR.drawing = true;
				}

				KA.DBox = rr;
				KA.dataset = dataset;

				imageCache = {};
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
						context.putImageData(buffered, 0, 0);
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
				context.setTransform(1, 0, 0, 1, 0, 0);
				context.clearRect(0, 0, mapMode.width, mapMode.height);
			}

			function initContext(c, site) {
				if (mapMode.rotate) {
					var x = (site.x - mx) * ss,
						y = (site.y - my) * ss;
					var x1 = x * mapMode.cos0 - y * mapMode.sin0 + hw,
						y1 = x * mapMode.sin0 + y * mapMode.cos0 + hh;

					context.setTransform(ssa, ssb, ssc, ssd, x1, y1);
				} else {
					var x = (site.x - mx) * ss + hw,
						y = (site.y - my) * ss + hh;
					context.setTransform(ss, 0, 0, ss, x, y);
				}
			}

			function isInBBox(x, y) {
				return this.DBox[0] <= x && x <= this.DBox[1] && this.DBox[2] <= y && y <= this.DBox[3];
			}

			function isRectIntersect(bbox) {
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

			root.start = function (freezen) {
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

			root.getFrameCount = function () {
				return AFR.frameCount;
			};
			root.pause = pause;
			root.isPausing = function () {
				return KA._animeIsNotPausedButPlaying;
			}
			root.stop = KA.hide;
			root.stutter = KA.stutter;
			root.checkStutter = KA.checkStutter;
			root.setTimerInterval = setTimerInterval;
			root.uninstall = function () {
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
			var imageCache = {};
			var rulerData;
			var timeUnit = 10;

			var bbox = {
				xl: 1795215321,
				xr: 1797133859,
				yt: 880059313,
				yb: 881988333
			};
			this.DBox = null;
			this.drawing = true;
			var AV_me = this;

			function addControlPanel(sv) {
				var ruler = $("<canvas>").attr({
					width: "150px",
					height: "220px"
				}).css({
					position: "absolute",
					left: "5px",
					top: "5px"
				});
				var btndiv = $("<div>").attr({
					width: 50,
					style: "position:absolute;left:55px;bottom:5px;background-color:rgb(246,172,22);"
				}).text("暂停").click(function () {
					ka.pause();
					if (btndiv.text() == "暂停") {
						btndiv.text("继续");
					} else {
						btndiv.text("暂停");
					}
				});

				drawRuler(ruler[0].getContext("2d"));

				var div = $("<div>").attr({
					class: "tkm-animate-control-panel"
				}).hide().append(ruler, btndiv);
				sv.append(div);
			}

			function addSliderPanel(sv) {
				var div = $("<div>").attr({
					class: "tkm-animate-control-slider"
				}).hide().append($("<div>").attr({
					class: "tkm-animate-control-slot"
				}), sliderButton = $("<div>").attr({
					class: "tkm-animate-control-button"
				}));
				sv.append(div);
				for (var i = 0; i <= 8; ++i) {
					var mk = $("<div>").attr({
						class: "tkm-animate-control-slotmark"
					}).css({
						left: (10 + i * 200 / 8) + "px"
					});
					div.append(mk);
				}


				$(function () {
					var btn = sliderButton;
					var isRuning;
					var _move = false; //移动标记  
					var _x; //鼠标离控件左上角的相对位置  
					var updater = null;

					btn.click(function () {
						//alert("click");//点击（松开后触发）  
					}).mousedown(function (e) {
						_move = true;
						_x = e.pageX - parseInt(btn.css("left"));
						// ka.stutter();
						isRuning = ka._animeIsNotPausedButPlaying;
						ka._animeIsNotPausedButPlaying = false;
					});
					$(document).mousemove(function (e) {
						if (_move) {
							var x = e.pageX - _x; //移动时根据鼠标位置计算控件左上角的绝对位置  
							if (x < 0) x = 0;
							else if (x > 194) x = 194;

							btn.css({
								left: x
							}); //控件新位置

							ka.setTimer((80 - 1) * x / 194);
							if (!updater) {
								updater = setTimeout(function () {
									updater = null;
									render();
								}, 66);
							}
						}
					}).mouseup(function () {
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
				c.textBaseline = "top";
				c.fillText("平湖溃堤淹没点图例", 0, 0);
				c.translate(0, 20);

				var height = 200,
					unit = height / 4;
				var grd = c.createLinearGradient(0, height, 0, 0);
				grd.addColorStop(0, 'rgba(0,255,0,0)');
				grd.addColorStop(0.25, 'yellow');
				grd.addColorStop(0.5, 'blue');
				grd.addColorStop(0.75, 'red');
				grd.addColorStop(1, 'black');
				c.fillStyle = grd;
				c.fillRect(0, 0, 20, height);
				c.strokeRect(0, 0, 20, height);

				c.beginPath();
				for (var i = 0; i < 5; ++i) {
					c.moveTo(20, i * unit);
					c.lineTo(23, i * unit);
				}
				c.stroke();
				c.closePath();

				c.fillStyle = "green";
				c.textBaseline = "bottom";
				c.fillText("0米", 25, height);
				c.fillStyle = "yellow";
				c.textBaseline = "middle";
				c.fillText("1米", 25, unit * 3);
				c.fillStyle = "blue";
				c.fillText("2米", 25, unit * 2);
				c.fillStyle = "red";
				c.fillText("3米", 25, unit);
				c.fillStyle = "black";
				c.textBaseline = "top";
				c.fillText("4米及以上", 25, 0);

			}


			function color(v) {
				if (v <= 0) return null;
				if (v >= 5) return "#000";
				var x = ((256 * v / 5) | 0) << 2;
				var alpha = x < 256 ? x / 255 : 1;
				return "rgba(" + rulerData[x] + "," + rulerData[x + 1] + "," + rulerData[x + 2] + "," + alpha + ")";
			}

			function value(site, timer) {
				var v = Math.floor(timer / timeUnit);
				var vv = timer % timeUnit;
				if (vv && v < 7) {
					var va = site.data[v],
						vb = site.data[v + 1];
					vv /= timeUnit;
					return va + (vb - va) * vv;
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
					var clr = color(value(site, timer));
					if (clr == null) continue;

					var bound = site.bound;
					ka.initContext(context, site);
					context.beginPath();
					context.moveTo((bound[0]), (bound[1]));
					for (var j = 2, l = bound.length; j < l; j += 2) {
						context.lineTo((bound[j]), (bound[j + 1]));
					}
					context.fillStyle = clr;
					context.fill();
					context.closePath();
				}
			}

			function update(timer) {
				sliderButton.css({
					left: (200 / 80 * timer) + "px"
				});
			}

			function buildRuler() {
				var can = document.createElement("canvas");
				can.height = 1;
				can.width = 256;
				var c = can.getContext("2d");

				var grd = c.createLinearGradient(0, 0, 256, 0);
				grd.addColorStop(0, 'green');
				grd.addColorStop(0.25, 'yellow');
				grd.addColorStop(0.5, 'blue');
				grd.addColorStop(0.75, 'red');
				grd.addColorStop(1, 'black');
				c.fillStyle = grd;
				c.fillRect(0, 0, 256, 1);

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

				imageCache = {};
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
			this.modeChange = function () {

			};
			this.render = function (timer) {
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
		const M2PI = Math.PI * 2;
		var backgroud;
		var dataset1, dataset2, dataset3;
		var cdata1, cdata2, cdata3;

		var bbox = {
			xl: 0,
			xr: Infinity,
			yt: 0,
			yb: Infinity
		};
		this.DBox = null;
		this.drawing = true;
		var AV_me = this;

		function render(timer) {
			var context = ka.context,
				ratio = ka.mapMode.ratio;
			if (backgroud == null) {
				context.setTransform(ratio, 0, 0, ratio, 0, 0);
				context.beginPath()
				for (var i = 0, a, l = cdata1.length; i < l; ++i) {
					a = cdata1[i];
					context.moveTo(a[0], a[1]);
					context.arc(a[0], a[1], 0.7 * ratio, 0, M2PI);
				}
				context.fillStyle = 'rgba(200, 200, 0, 0.8)';
				context.fill();
				context.closePath();

				context.beginPath()
				for (var i = 0, a, l = cdata2.length; i < l; ++i) {
					a = cdata2[i];
					context.moveTo(a[0], a[1]);
					context.arc(a[0], a[1], 0.7 * ratio, 0, M2PI);
				}
				context.fillStyle = 'rgba(255, 250, 0, 0.8)';
				context.fill();
				context.closePath();

				context.beginPath()
				for (var i = 0, a, l = cdata3.length; i < l; ++i) {
					a = cdata3[i];
					context.moveTo(a[0], a[1]);
					context.arc(a[0], a[1], 0.7 * ratio, 0, M2PI);
				}
				context.fillStyle = 'rgba(255, 250, 250, 0.6)';
				context.fill();
				context.closePath();


				background = context.getImageData(0, 0, ka.width, ka.height);
			} else {
				context.putImageData(backgroud, 0, 0);
			}


			context.beginPath()
			for (var i = 0, a, l = 200, ll = cdata2.length; i < l; ++i) {
				a = cdata2[(Math.random() * ll) | 0];
				context.moveTo(a[0], a[1]);
				context.arc(a[0], a[1], 1.1 * ratio, 0, M2PI);
			}
			context.fillStyle = 'rgba(255, 250, 250, 0.9)';
			context.fill();
			context.closePath();

		}

		function modechange() {
			var e;
			cdata1 = [];
			for (var i = 0, a, l = dataset1.length; i < l; ++i) {
				a = dataset1[i];
				e = ka.mapMode.pointAtLonlat(a[0], a[1]);
				if (e[0] < 0 || e[0] > ka.width || e[1] < 0 || e[1] > ka.height) continue;
				cdata1.push(e);
			}

			cdata2 = [];
			for (var i = 0, a, l = dataset2.length; i < l; ++i) {
				a = dataset2[i];
				e = ka.mapMode.pointAtLonlat(a[0], a[1]);
				if (e[0] < 0 || e[0] > ka.width || e[1] < 0 || e[1] > ka.height) continue;
				cdata2.push(e);
			}

			cdata3 = [];
			for (var i = 0, a, l = dataset3.length; i < l; ++i) {
				a = dataset3[i];
				e = ka.mapMode.pointAtLonlat(a[0], a[1]);
				if (e[0] < 0 || e[0] > ka.width || e[1] < 0 || e[1] > ka.height) continue;
				cdata3.push(e);
			}

			backgroud = null;
		}
		$.get("weibo.json", function (rs) {
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