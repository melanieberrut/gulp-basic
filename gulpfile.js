/*
	Reminder: 
		- define the env variable: export NODE_ENV=production 
		- read the env variable: echo $NODE_ENV 

*/

var gulp = require('gulp'),
	newer = require('gulp-newer'),
  	imagemin = require('gulp-imagemin'),
  	htmlclean = require('gulp-htmlclean'),
  	concat = require('gulp-concat'),
	deporder = require('gulp-deporder'),
	stripdebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	sass = require('gulp-sass'),
	postcss = require('gulp-postcss'),
	assets = require('postcss-assets'),
	autoprefixer = require('autoprefixer'),
	mqpacker = require('css-mqpacker'),
	sourcemaps = require('gulp-sourcemaps'),
	cssnano = require('cssnano'),
	debug = require('gulp-debug'),
	gutil = require('gulp-util'),
	browserSync = require('browser-sync').create(),
	devBuild = (process.env.NODE_ENV !== 'production'), 
	folder = {
		src: './src/',
		build: './build/',
		images: 'images/**/*',
		html: '**/*.html',
		js: 'js/**/*',
		css: 'scss/**/*'
	};

// image processing
gulp.task('images', function() {
	var output = folder.build + 'images/';
	return gulp.src(folder.src + folder.images)
			   .pipe(newer(output))
			   .pipe(imagemin({ optimizationLevel: 5 }))
			   .pipe(gulp.dest(output));
});

// html processing
// * dependency on images task to be completed before html task.
gulp.task('html',['images'], function(){
	var output = folder.build,
		page =  gulp.src(folder.src + folder.html)
					.pipe(newer(output));

	// minify production code
	if(!devBuild) {
		page = page.pipe(htmlclean());
	}

	return page.pipe(gulp.dest(output))
				.pipe(browserSync.stream());
});

// js processing
gulp.task('js', function(){
	var output = folder.build + 'js/',
		scripts = gulp.src(folder.src + folder.js)
						.pipe(newer(output));

	if(!devBuild) {
		scripts = scripts
					.pipe(uglify())
					.pipe(sourcemaps.init({ loadMaps: true }))
					.on('error', gutil.log)
					.pipe(sourcemaps.write('./'))
	}

	return scripts.pipe(sourcemaps.init({ loadMaps: true }))
					.on('error', gutil.log)
					.pipe(sourcemaps.write('./'))
					.pipe(gulp.dest('./build/js/'))
					.pipe(browserSync.stream());
});

// styles processing
gulp.task('css', ['images'], function(){
	var postCssOpts = [
		assets({ loadPaths: ['images/'] }),
		autoprefixer({ browsers: ['last 2 versions', '> 2%'] }),
		mqpacker
	];

	// minify production code
	if(!devBuild) {
		postCssOpts.push(cssnano);
	}

	return gulp.src(folder.src + 'scss/styles.scss')
				.pipe(sass({
					outputStyle: 'nested',
					imagePath: 'images/',
					precision: 3,
					errLogToConsole: true
				}))
				.pipe(sourcemaps.init())
				.pipe(postcss(postCssOpts))
				.on('error', sass.logError)
				.pipe(sourcemaps.write('./'))
				.pipe(gulp.dest(folder.build + 'css/'))
				.pipe(browserSync.stream());
});

// watch for changes
gulp.task('watch', function(){
	// images
	gulp.watch(folder.src + folder.images, ['images']);
	// html
	gulp.watch(folder.src + folder.html, ['html']);
	// js
	gulp.watch(folder.src + folder.js, ['js']);
	// css
	gulp.watch(folder.src + folder.css, ['css']);
});

gulp.task('serve', function(){
	browserSync.init({
		server: {
			baseDir: "./build/"
		}
	})
	gulp.watch(folder.src + folder.css, ['css']);
	gulp.watch(folder.src + folder.html).on('change', browserSync.reload);
});

// run all tasks
gulp.task('default', ['run', 'watch', 'serve']);

// * images task is not needed as it is a dependency on 'html' & 'css' tasks
gulp.task('run', ['html', 'css', 'js']);
