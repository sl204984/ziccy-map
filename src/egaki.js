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