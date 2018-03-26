'use strict';
var gulp = require('gulp'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),                //多个文件合并为一个
    cleanCss = require('gulp-clean-css'),           //压缩CSS为一行；
    ugLify = require('gulp-uglify'),                //压缩js
    imageMin = require('gulp-imagemin'),            //压缩图片
    pngquant = require('imagemin-pngquant'),        //深度压缩
    cache = require('gulp-cache'),                  //缓存
    rev = require('gulp-rev'),                      //对文件名加MD5后缀
    revCollector = require('gulp-rev-collector'),   //路径替换
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
            collapseWhitespace: true,               //压缩HTML
            removeScriptTypeAttributes: true,       //删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true,    //删除<style>和<link>的type="text/css"
            minifyJS: true,                         //压缩页面JS
            minifyCSS: true                         //压缩页面CSS
        }))
        .pipe(gulp.dest('./dist'));
});

//实时编译less
gulp.task('less', function () {
    gulp.src(['./src/less/*.less'])                 //多个文件以数组形式传入
        .pipe(changed('dist/css', {hasChanged: changed.compareSha1Digest}))
        .pipe(less())                               //编译less文件
        .pipe(concat('style.min.css'))              //合并之后生成style.min.css
        .pipe(cleanCss())                           //压缩新生成的css
        .pipe(gulp.dest('dist/css/'))               //将会在css下生成style.min.css
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


//图片压缩
gulp.task('images', function () {
    gulp.src('src/images/*.{png,jpg,gif,ico}')
        .pipe(cache(imageMin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/images'));
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

gulp.task('default', ['clean', 'html', 'less', 'script', 'images','serve']);