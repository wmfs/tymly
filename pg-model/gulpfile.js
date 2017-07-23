const gulp = require('gulp')
const standard = require('gulp-standard')
const mocha = require('gulp-mocha')

gulp.task('test', function () {
  return gulp.src(['./test/*.js'])
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('standard', function () {
  return gulp.src(['./lib/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: false
    }))
})
