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