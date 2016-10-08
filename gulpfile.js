'use strict'

const gulp = require('gulp')
const $ = require('gulp-load-plugins')()

const srcIncludes = [
  '**/*.js',
  '!node_modules/**',
  '!coverage/**'
]

gulp.task('lint', function lintTask () {
  return gulp
    .src(srcIncludes)
    .pipe($.standard())
    .pipe($.standard.reporter('default', { breakOnError: true }))
})

gulp.task('default', ['lint'])
