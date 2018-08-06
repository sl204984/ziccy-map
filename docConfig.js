module.exports = {
    //扫描的文件路径
    paths: ['src/'],

    //文档页面输出路径
    outdir: 'doc/',
	

    //项目信息配置
    project: {

        //项目名称
        name: 'TMap SDK',

        description: '<h1>TMap.js</h1>'+
		'<p>&nbsp;&nbsp;&nbsp;&nbsp;TMap.js是图云空间©开发的一套Web端矢量地图开发的SDK。它迎合的市面上主流的GIS应用需求，是对自有地图数据、强GIS应用场景下定制开发模式的有效支持。</p>'+
		'<h2>应用示例</h2>'+
		'<p><a href="../Endoscopy-Map.html">小窗地图示例</a></p>'+
		'<p><a href="../Marker-Map.html">图形标注示例</a></p>'+
		'<p><a href="../Twins-Map.html">双视图示例</a></p>'+
		'<p><a href="../Shape-Map.html">图形覆盖物示例</a></p>'+
		'<p><a href="../Layers-Map.html">多图层示例</a></p>', 

        //版本信息
        version: '1.0.0',

        //地址信息
        //url: 'http://www.just.test',
        //logo地址
        logo : 'http://120.55.46.163/webmap/img/tkm_logo.png',
        //导航信息
		
        navs: [{
		name: "首页",
		url: "http://120.55.46.163/webmap"
	},{
		name: "文档",
		url: "http://120.55.46.163/SDK-site/doc"
	},{
		name: "示例",
		url: "http://120.55.46.163/SDK-site/doc"
	},{
		name: "下载",
		url: "http://120.55.46.163/SDK-site/downloads/web-sdk.zip"
	}]
		
    },

    //自定义主题路径
//    themedir: 'theme/',
//    themedir: '/Users/zhichaozhou/workspace/github/smartDoc/theme-smart/',

    //自定义helpers
//    helpers: ["/Users/zhichaozhou/workspace/github/smartDoc/theme-smart/helpers/helpers.js"]
};
