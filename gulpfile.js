var gulp = require('gulp');
var apidoc = require('gulp-apidoc');

gulp.task('docs', (done) => {
  apidoc({
      src: "src/",
      dest: "docs/",
      debug: true,
      includeFilters: [ ".*\\.js$" ]
  }, done);
});

gulp.task('default', ['docs']);
