var gulp        = require('gulp');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var uglify      = require('gulp-uglify');
var rename      = require('gulp-rename');

gulp.task('scripts', function() {
    return browserify('./index')
        .bundle()
        .pipe(source('chemical.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('uglify', function() {
    return gulp.src('chemical.js')
        .pipe(rename('chemical.min.js'))
        .pipe(uglify({
            outSourceMap: true,
            preserveComments: 'some'
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['scripts', 'uglify']);