'use strict';
var gulp = require('gulp'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),                //多个文件合并为一个
    autoprefixer = require('gulp-autoprefixer'),
    cleanCss = require('gulp-clean-css'),           //压缩CSS为一行；
    ugLify = require('gulp-uglify'),                //压缩js
    spriter = require('gulp-css-spriter'),
    runSequence = require('run-sequence'),
    rev = require('gulp-rev'),                      //对文件名加MD5后缀
    revC = require('gulp-rev-collector'),           //路径替换
    RevAll = require('gulp-rev-all'),
    cssMin = require('gulp-csso'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    fileinclude = require('gulp-file-include'),     //html模板
    htmlMin = require('gulp-htmlmin'),              //压缩html
    changed = require('gulp-changed'),              //检查改变状态
    del = require('del'),
    browserSync = require('browser-sync').create(); //浏览器实时刷新

//删除dist下的所有文件
gulp.task('clean', function () {
    return del.sync('./dist');
});

// html整合+模板引入+压缩html
gulp.task('html', function () {
    return gulp.src('./src/template/*.html')
        .pipe(fileinclude())
        .pipe(changed('./dist', {hasChanged: changed.compareSha1Digest}))
        .pipe(htmlMin({
            removeComments: true,                   //清除HTML注释
            collapseWhitespace: false,               //压缩HTML
            removeScriptTypeAttributes: true,       //删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true,    //删除<style>和<link>的type="text/css"
            minifyJS: true,                         //压缩页面JS
            minifyCSS: true                         //压缩页面CSS
        }))
        .pipe(gulp.dest('./dist'));
});

//编译less 合并图片 合并css
gulp.task('less', function () {
    var timestamp = +new Date();
    return gulp.src(['./src/less/**/*.less'])//比如recharge.css这个样式里面什么都不用改，是你想要合并的图就要引用这个样式。 很重要 注意(recharge.css)这个是我的项目。别傻到家抄我一样的。
        .pipe(spriter({
            'spriteSheet': './dist/images/spritesheet' + timestamp + '.png', //这是雪碧图自动合成的图。 很重要
            'pathToSpriteSheetFromCSS': '../images/spritesheet' + timestamp + '.png', //这是在css引用的图片路径，很重要
            'spritesmithOptions': {
                padding: 10
            }
        }))
        .pipe(less())
        .pipe(changed('dist/css', {hasChanged: changed.compareSha1Digest}))
        .pipe(concat('strong.min.css'))              //合并之后生成style.min.css
        .pipe(cleanCss())                           //压缩新生成的css
        .pipe(autoprefixer({
            browsers: ['last 2 Chrome versions', 'Safari >0', 'Explorer >0', 'Edge >0', 'Opera >0', 'Firefox >=20'],
            cascade: false,
            remove: false,
        }))
        .pipe(gulp.dest('./dist/css')) //最后生成出来
        .pipe(browserSync.reload({stream: true}));
});

//压缩js
gulp.task("script", function () {
    gulp.src(['src/js/jquery-1.9.1.min.js', 'src/js/**/*.js'])//控制js引入时的顺序
        .pipe(changed('dist/js', {hasChanged: changed.compareSha1Digest}))
        .pipe(concat('strong.min.js'))
        .pipe(ugLify())
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({stream: true}));
});

//定义css、js、html源文件路径
var cssSrc = 'dist/css/*.min.css',
    jsSrc = 'dist/js/*.min.js',
    htmlSrc = 'src/*.html';

// css打版本
gulp.task('revCss', function () {
    return gulp.src(cssSrc)       //指定获取到src下的所有css文件。
        .pipe(cssMin())     //执行压缩操作
        .pipe(RevAll.revision({hashLength: 10}))
        .pipe(gulp.dest('./dist/css'));//生成目标压缩css文件
});

//生成css版本修改中间文件
gulp.task('cssPathUpdate', function () {
    return gulp.src(cssSrc)       //指定获取到src下的所有css文件。
        .pipe(cssMin())     //执行压缩操作
        .pipe(rev())
        .pipe(rev.manifest())
        .pipe(gulp.dest('./dist/css'));
});

// js打版本
gulp.task('revJs', function () {
    return gulp.src(jsSrc)        //指定获取到src下的所有js文件。
        .pipe(uglify())         //执行压缩操作
        .pipe(RevAll.revision({hashLength: 10}))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('./dist/js'));//生成目标压缩js文件
});

//生成js版本修改中间文件
gulp.task('jsPathUpdate', function () {
    return gulp.src(jsSrc)       //指定获取到src下的所有js文件。
        .pipe(uglify())        //执行压缩操作
        .pipe(rev())
        .pipe(rev.manifest())
        .pipe(gulp.dest('./dist/js'));
});

//Html替换css、js引用文件版本
gulp.task('revHtml', function () {
    return gulp.src(['dist/**/*.json', htmlSrc])
        .pipe(revC())
        .pipe(gulp.dest('dist'));
});

//开发构建
gulp.task('dev', function (done) {
    runSequence(
        ['revCss'],
        ['revJs'],
        ['cssPathUpdate'],
        ['jsPathUpdate'],
        ['revHtml'],
        done);
});



// 配置服务器
gulp.task('serve', function () {
    browserSync.init({
        server: {
            baseDir: './dist'
        },
        port: 8000
    });
    // 监听变化内容
    gulp.watch('./src/template/**/*.html', ['html']).on('change', browserSync.reload);
    gulp.watch('./src/less/**/*.*', ['less']).on('change', browserSync.reload);
    gulp.watch('./src/js/**/*.js', ['script']).on('change', browserSync.reload);
});

gulp.task('default', ['clean', 'html', 'less', 'script', 'dev', 'serve']);

//另外需要修改gulp-rev-all目录下revisioner.js文件第333行，修改为
//
// filename = filename + '_' + file.revHash.substr(0, this.options.hashLength) + ext;

//修改/rev-path/index.js第10行，修改为
//
// return filename + '_' + hash + '.min' + ext;

//修改gulp-rev-collector/index.js第11行，修改为
//
// revSuffix: '_[0-9a-f]{8,10}-?.min'