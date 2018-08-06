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