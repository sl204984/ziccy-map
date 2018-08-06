const gulp = require('gulp'),
	minifycss = require('gulp-minify-css'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
 	gutil = require('gulp-util'),
	babel = require("gulp-babel"),	// 用于ES6转化ES5
	header = require("gulp-header"),
	del = require('del'),
	pkg = require('./package.json');
const jslist=[
	'src/.__begin__.js',
	'src/tkujs.js',
	'src/anime.js',
	'src/chirisugaku.js',
	'src/canvas.js',
	'src/layer.js',	
	'src/daemon.js',
	'src/gl.js',
	'src/styler.js',
	'src/chizu.js',
	'src/egaki.js',
	'src/fukaku.js',
	'src/mapapi.js',
	'src/util.js',
	'src/shiori.js',
	'src/tkujs.js',
	'src/tssh.js',
	'src/clusterer.js',
	'src/.__end__.js'
], csslist = [
	'src/tkmap.css'
];

function error_out(err) { 
	gutil.log(gutil.colors.red('[Error]'), err.toString()); 
}

//压缩css
gulp.task('mcss', () => {
	return gulp.src(csslist)	  //压缩的文件
		.pipe(concat('tmap.css'))
		.pipe(gulp.dest('minified'))   //输出文件夹
		.pipe(rename({suffix: '.min'}))   //rename压缩后的文件名
		.pipe(minifycss())   //执行压缩
		.on('error', error_out)	
		.pipe(header(['/**',
			' * <%= pkg.name %> - <%= pkg.description %>',
			' * @version v<%= pkg.version %>',
			' * @link <%= pkg.homepage %>',
			' * @license <%= pkg.license %>',
			' */',
			''].join('\n'), { pkg : pkg } ))
		.pipe(gulp.dest('minified'))
		.pipe(gulp.dest('.'));
});


//压缩js
gulp.task('mjs', () => {
	return gulp.src(jslist)
		.pipe(concat('tmap.js'))	//合并所有js到main.js
		.pipe(gulp.dest('minified'))	//输出main.js到文件夹
		.pipe(rename({suffix: '.min'}))   //rename压缩后的文件名
		.pipe(babel()) 
		.pipe(uglify({
			mangle: true,//类型：Boolean 默认：true 是否修改变量名
			compress: true,//类型：Boolean 默认：true 是否完全压缩
			// preserveComments: all //保留所有注释
		}))	//压缩
		.on('error', error_out)
		.pipe(header(['/**',
			' * <%= pkg.name %> - <%= pkg.description %>',
			' * @version v<%= pkg.version %>',
			' * @link <%= pkg.homepage %>',
			' * @license <%= pkg.license %>',
			' */',
			''].join('\n'), { pkg : pkg } ))
		.pipe(gulp.dest('minified'));  //输出
});

//执行压缩前，先删除文件夹里的内容
gulp.task('clean', (cb) => {
		del(['minified'], cb)
});

//默认命令，在cmd中输入gulp后，执行的就是这个命令
gulp.task('default', ['clean', 'mcss', 'mjs'], () => {
		gulp.start('mcss', 'mjs');
});
