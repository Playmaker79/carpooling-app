var gulp = require('gulp');
var nodemon = require('gulp-nodemon')
gulp.task('default',function(){
    nodemon({
         script: 'app.js',
         ext: 'js json',
        env: { 'NODE_ENV': 'development' },
        ignore:['.git','node_modules']
    })
});