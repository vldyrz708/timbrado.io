
'use strict';

var browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const swPrecache = require('sw-precache');
const pkg = require('./package.json');
const path = require('path');
const {series, parallel, watch} = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const psi = require('psi');
const sass = require('gulp-sass')(require('sass'));
var del = require('del');

const $ = gulpLoadPlugins({
    rename: {
        'gulp-file-include': 'fileInclude'
    }
});

const {src, dest} = require('gulp');
const fs = require("fs");


function lint(cb) {
    return src(['src/scripts/**/*.js', '!node_modules/**'])
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

exports.lint = lint;

function images(cb) {
    return src('src/images/**/*')
        .pipe($.imagemin({
            progressive: true,
            interlaced: true
        }))
        .pipe(dest('dist/images'))
        .pipe($.size({title: 'images'}))
}

function copy(cb) {
    return src([
        'src/*',
        '!src/*.html',
    ], {
        dot: true
    }).pipe(dest('dist'))
        .pipe($.size({title: 'copy'}));
}

function copyFonts() {
    return src(['src/fonts/**/*'])
        .pipe(dest('dist/fonts'));
}

function styles() {
    const AUTOPREFIXER_BROWSERS = [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ];

// For best performance, don't add Sass partials to `gulp.src`
    return src([
        'src/**/*.scss',
        'src/**/*.css'
    ])
        // .pipe($.newer('.tmp/styles'))
        .pipe($.sourcemaps.init())
        .pipe(sass({
            precision: 10
        }).on('error', sass.logError))
        .pipe($.postcss())
        .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
        // Concatenate and minify styles
        .pipe($.if('*.css', $.cssnano()))
        .pipe($.size({title: 'styles'}))
        .pipe($.sourcemaps.write('./'))
        .pipe(dest('.tmp'))
        .pipe(dest('dist'))
        .pipe(browserSync.stream());

}

// // Concatenate and minify JavaScript. Optionally transpiles ES2015 code to ES5.
// // to enable ES2015 support remove the line `"only": "gulpfile.babel.js",` in the
// // `.babelrc` file.
function scripts() {
    return src([
        './src/**/*.js', '!./src/scripts', '!./src/scripts/*', '!./src/scripts/**/*', '!./src/*.js'
        // Other scripts
    ], {allowEmpty: true})
        // .pipe($.newer('.tmp/scripts'))
        .pipe($.debug({title: 'scripts:'}))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write())
        .pipe(dest('.tmp/scripts'))
        .pipe($.uglify())
        // Output files
        .pipe($.size({title: 'scripts'}))
        .pipe($.sourcemaps.write('.'))
        .pipe(dest('dist'))
        .pipe(dest('.tmp'));
}

function indexScript() {
    return src([
        './src/scripts/index.js'
    ])
        // .pipe($.newer('.tmp/scripts'))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write())
        .pipe(dest('.tmp/scripts'))
        .pipe($.concat('index.min.js'))
        .pipe($.uglify())
        // Output files
        .pipe($.size({title: 'scripts'}))
        .pipe($.sourcemaps.write('.'))
        .pipe(dest('dist/scripts'))
        .pipe(dest('.tmp/scripts'));
}

function scriptsVendor() {
    return src([
        // Note: Since we are not using useref in the scripts build pipeline,
        //       you need to explicitly list your scripts here in the right order
        //       to be correctly concatenated
        // here we can add vendor scripts to be minified in one single script file
        './node_modules/bootstrap/dist/js/bootstrap.bundle.js',
        './node_modules/typed.js/lib/typed.min.js',
        './node_modules/particles.js/particles.js',
        './node_modules/jquery-validation/dist/jquery.validate.js'
        // other vendor scripts
    ], {allowEmpty: true})
        // .pipe($.newer('.tmp/scripts'))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write())
        .pipe(dest('.tmp/scripts'))
        .pipe($.concat('main-vendor.min.js'))
        .pipe($.uglify())
        // Output files
        .pipe($.size({title: 'scripts'}))
        .pipe($.sourcemaps.write('.'))
        .pipe(dest('dist/scripts'))
        .pipe(dest('.tmp/scripts'));
}

// Scan your HTML for assets & optimize them
function html() {
    return src(['src/**/*.html', '!src/partials/**/*.html', '!src/partials/*.html', '!src/partials'])
        .pipe($.useref({
            searchPath: '{.tmp,app}',
            noAssets: true
        }))

        .pipe($.fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))

        // Minify any HTML
        .pipe($.if('*.html', $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true
        })))
        // Output files
        .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
        .pipe(dest('dist'));
}

function htmlDev() {
    return src(['src/**/*.html', '!src/partials/**/*.html', '!src/partials/*.html'])
        .pipe($.useref({
            searchPath: '{.tmp,app}',
            noAssets: true
        }))
        .pipe($.fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest('.tmp'))
        .pipe(browserSync.stream());
}

// Clean output directory
function clean() {
    return del(['.tmp', 'dist']);
}

exports.clean = clean;

function reloadBrowser(cb) {
    reload();
    cb();
}

// Watch files for changes & reload
function develop() {
    browserSync.init({
        notify: false,
        // Customize the Browsersync console logging prefix
        logPrefix: 'WSK',
        // Allow scroll syncing across breakpoints
        scrollElementMapping: ['main', '.mdl-layout'],
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: ['.tmp', 'src'],
        port: 3000
    });

    watch(['src/**/*.html'], series(htmlDev,styles));
    watch(['src/**/*.{scss,css}'], series(styles));
    watch(['src/**/*.js'], series(scripts, indexScript, reloadBrowser));
    watch(['src/images/**/*'], series(reloadBrowser));
}

exports.develop = series(clean, parallel(scriptsVendor, indexScript, scripts, styles, htmlDev), develop);

// Build and serve the output from the dist build
function serveDist() {
    browserSync.init({
        notify: false,
        logPrefix: 'WSK',
        // Allow scroll syncing across breakpoints
        scrollElementMapping: ['main', '.mdl-layout'],
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: 'dist',
        port: 3001
    });
}

exports.serveDist = series(serveDist);


exports.default = series(clean, styles, parallel(html, scripts, scriptsVendor, indexScript, images, copy, copyFonts), series(copySwScripts, generateServiceWorkerTask));


//
// Run PageSpeed Insights
async function pagespeedTask() {
// Update the below URL to the public URL of your site
    await psi.output('www.squars.tech', {
        strategy: 'mobile'
        // By default we use the PageSpeed Insights free (no API key) tier.
        // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
        // key: 'YOUR_API_KEY'
    });

}

exports.pagespeed = pagespeedTask;

//
// // Copy over the scripts that are used in importScripts as part of the generate-service-worker task.
function copySwScripts() {
    return src(['node_modules/sw-toolbox/sw-toolbox.js', 'src/scripts/sw/runtime-caching.js'])
        .pipe(dest('dist/scripts/sw'));
}

//
// // See http://www.html5rocks.com/en/tutorials/service-worker/introduction/ for
// // an in-depth explanation of what service workers are and why you should care.
// // Generate a service worker file that will provide offline functionality for
// // local resources. This should only be done for the 'dist' directory, to allow
// // live reload to work as expected when serving from the 'app' directory.
function generateServiceWorkerTask() {
    const rootDir = 'dist';
    const filepath = path.join(rootDir, 'service-worker.js');

    return swPrecache.write(filepath, {
        // Used to avoid cache conflicts when serving on localhost.
        cacheId: pkg.name || 'squars',
        // sw-toolbox.js needs to be listed first. It sets up methods used in runtime-caching.js.
        importScripts: [
            'scripts/sw/sw-toolbox.js',
            'scripts/sw/runtime-caching.js'
        ],
        staticFileGlobs: [
            // Add/remove glob patterns to match your directory setup.
            `${rootDir}/images/**/*`,
            `${rootDir}/scripts/**/*.js`,
            `${rootDir}/styles/**/*.css`,
            `${rootDir}/*.{html,json}`
        ],
        // Translates a static file path to the relative URL that it's served from.
        // This is '/' rather than path.sep because the paths returned from
        // glob always use '/'.
        stripPrefix: rootDir + '/'
    });
}


function packageTask(cb) {
    // require modules
    var fs = require('fs');
    var archiver = require('archiver');

// create a file to stream archive data to.
    var output = fs.createWriteStream(__dirname + '/' + pkg.name + '.zip');
    var archive = archiver('zip', {
        zlib: {level: 9}
    });

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
        console.log('Data has been drained');
    });

// good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

// good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });

// pipe archive data to the file
    archive.pipe(output);

// append files from a glob pattern
    archive.directory('dist', pkg.name);

// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
    cb();
}

exports.package = series(packageTask);
