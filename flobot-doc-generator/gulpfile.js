const gulp = require('gulp')
const standard = require('gulp-standard')

gulp.task('test', function () {
  return gulp.src(['./lib/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: false
    }))
})

gulp.task('standard', function () {
  return gulp.src(['./lib/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: false
    }))
})
