'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
        // Task configuration.
        // watch: {
        //     all: {
        //         files: ['src/**/*.*', 'test/**/*.*'],
        //         tasks: ['default']
        //     },
        // },
        jasmine_node: {
            options: {
                forceExit: true,
                specNameMatcher: 'spec'
            },
            all: ['test/server/']
        },
        jshint: {
            all: ['Gruntfile.js', 'client/public/js/**/*.js','server/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: '.jshintrc',
            }
        },
        // browserify: {
        //     main: {
        //         src: ['./src/browser/App.js'],
        //         dest: 'dist/app_bundle_main.js',
        //         options: {
        //             alias: ["./src/browser/App.js:SampleApp"],
        //             ignore: ['src/node/**/*.js'],
        //         },
        //     },
        //     src: {
        //         src: ['src/common/**/*.js', 'src/browser/**/*.js'],
        //         dest: 'dist/app_bundle.js',
        //         options: {
        //             alias: ["./src/browser/App.js:SampleApp", ],
        //             aliasMappings: [{
        //                 cwd: 'src',
        //                 src: ['common/**/*.js', "browser/**/*.js"],
        //                 dest: 'lib',
        //             }, ],
        //             ignore: ['src/node/**/*.js'],
        //         }
        //     },
        //     test: {
        //         src: ['test/spec/common/**/*.js', 'test/spec/browser/**/*.js'],
        //         dest: 'dist/test_bundle.js',
        //         options: {
        //             external: ['./src/**/*.js'],
        //             ignore: ['./node_modules/underscore/underscore.js'],
        //         }
        //     },
        // },
        // jasmine: {
        //     src: 'dist/app_bundle.js',
        //     options: {
        //         specs: 'dist/test_bundle.js',
        //         vendor: ['libs/jquery-1.9.1.js', 'libs/underscore.js']
        //     }
        // },
        // uglify: {
        //     all: {
        //         files: {
        //             'dist/app_bundle_min.js': ['dist/app_bundle.js']
        //         }
        //     },
        //     main: {
        //         files: {
        //             'dist/app_bundle_main_min.js': ['dist/app_bundle_main.js']
        //         }
        //     }
        // }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jasmine-node');

    // Default task.
    //grunt.registerTask('default', ['jshint', 'jasmine_node', 'browserify', 'jasmine', 'uglify']);
    grunt.registerTask('default', ['jshint', 'jasmine_node']);
};