// 'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		watch: {
			options: {
				nospawn: true,
				livereload: true
			},
			coffee: {
				files: ['**/*.coffee'],
				tasks: ['coffee']
			}
		},
		coffee: {
			build: {	
				files: [{
					// rather than compiling multiple files here you should
					// require them into your main .coffee file
					expand: true,
					src: '**/*.coffee',
					ext: '.js'
				}]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-coffee');


	grunt.registerTask('default', ['watch']);
};