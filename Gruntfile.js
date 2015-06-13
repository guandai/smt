/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
        // Task configuration.
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: ['src/<%= pkg.name %>.js', 'src/**/*.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>',
                sourceMap: true
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: false,
                unused: false,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib_test: {
                src: ['src/**/*.js', 'spec/**/*.js', '!src/main.js']
            }
        },
        qunit: {
            files: ['spec/**/*.html'],
            urls:['http://tempwork.dz/smt/spec/qunit_spec.html']
        },
        jasmine: {
            src: ['src/**/*.js', '!src/main.js'],
            options: {
                specs: 'spec/*jasmine_spec.js',
                helpers: 'spec/*Helper.js'
            }

        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib_test: {
                files: '<%= jshint.lib_test.src %>',
                tasks: ['jshint:lib_test', 'qunit']
            }
        },
        jasmine_node: {
            options: {
                forceExit: true,
                match: '.*',
                "match_is_prefix_all_ignore_case": "",
                matchall: false,
                extensions: 'js',
                specNameMatcher: 'jasmine_node_Spec',
                "specNameMatcher_is_suffix_all_ignore_case": "",
                coffee: false,
                specFolders: [], 
                onComplete: null, 
                isVerbose: true, 
                showColors: true,
                teamcity: false, 
                useRequireJs: false, 
                regExpSpec: null, 
                "based_on_other_options_" : "match + specNameMatcher + extensions (ignore case)",
                gowl: false, 
                junitreport: {
                    report: false,
                    savePath: './reports/',
                    useDotNotation: true,
                    consolidate: true
                },
                includeStackTrace: false,
                growl: false
            },
            all: ['spec/'] 
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-node-new');


    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    // Default task.
    
    grunt.registerTask('default', ['jshint', 'qunit:files', 'concat', 'uglify']);
    grunt.registerTask('jasbr', ['jasmine']);
    grunt.registerTask('jasnd', ['jasmine_node']);
    grunt.registerTask('qu', ['qunit']);
};
