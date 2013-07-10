#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var sys = require('sys');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://shielded-coast-8437.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};


// loads html from a file and checks it
// for exports only
function checkHtmlFile(filename, checks) {
    return checkHtml(fs.readFileSync(filename), checks);
}
function checkHtml(html, checks) {
    $ = cheerio.load(html);
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
}
// downloads html from the internet
// callback is called with two arguments: err, html
// where err is null if there is no error
function download(url, callback) {
    var resp = rest.get(url);
    resp.on('complete', function(result) {
    
	if (result instanceof Error) {
            // callback(result);
            sys.puts('Error: ' + result.message);
            this.retry(5000); // try again after 5 sec
            return;
        }
        callback(null, result);
    });
}


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-u, --url <url>', 'Path to url',  URL_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
 
       .parse(process.argv);

// this function loads checks & checks html
    function check(err, html) {
        if (err) {
            console.log('Error getting html: ' + err);
            process.exit(1);
        }
        var checks = loadChecks(program.checks);
        var checkJson = checkHtml(html, checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }

//var checks = loadChecks(program.checks);
 if (program.url) {
	// download the provided url and then check the html
        download(program.url, check);
    } else {//if (program.file) {
        // load html from a file and then check it
        fs.readFile(program.file, check);
    }
 //   var checkJson = checkHtmlFile(program.file, program.checks);
 //   var outJson = JSON.stringify(checkJson, null, 4);
 //   console.log(outJson);
} else {
    exports.loadChecks = loadChecks;
    exports.checkHtmlFile = checkHtmlFile;
}
