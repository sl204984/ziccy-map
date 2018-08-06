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