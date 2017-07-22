const gulp = require('gulp')
const standard = require('gulp-standard')

gulp.task('test', function () {
    return gulp.src(['./test/*.js'])
        .pipe(standard())
        .pipe(standard.reporter('default', {
            breakOnError: true,
            quiet: true
        }))
})