"use strict";

var Filter = require('broccoli-filter');
var mkdirp = require('mkdirp');
var walkSync = require('walk-sync');
var mapSeries = require('promise-map-series');
var CachingWriter = require('broccoli-caching-writer');
var symlinkOrCopySync = require('symlink-or-copy').sync;


TieredCachingWriter.prototype = Object.create(CachingWriter.prototype);
TieredCachingWriter.prototype.constructor = TieredCachingWriter;

function TieredCachingWriter (inputTree, options) {
  if (!(this instanceof TieredCachingWriter)) {
    return new TieredCachingWriter(inputTree, options);
  }

  // Call "super" (the broccoli-caching-writer constructor)
  CachingWriter.call(this, inputTree, options);

  this.prepareInnerFilter(options);
}

TieredCachingWriter.prototype.prepareInnerFilter = function(options) {
  // Use a custom filter class if desired
  this.FilterConstructor = this.FilterConstructor || Filter;

  // Quick options clone
  var newOptions = {};

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      newOptions[key] = options[key];
    }
  }

  // Bring across extensions and targetExtension (from this prototype) if not on options
  if (options.extensions === undefined) {
    newOptions.extensions = this.extensions;
  }

  if (options.targetExtension === undefined) {
    newOptions.targetExtension = this.targetExtension;
  }

  // Intentionally don't pass along a real input tree to the composed filter
  // instance, we'll never be calling `write()` on it (and it isn't undefined
  // because broccoli-filter would throw an error) However, still pass through all
  // other options (with extensions/targetExtensions likely set)
  this.filter = new this.FilterConstructor({}, newOptions);

  // Make The processString method on this prototype available to the composed filter instance
  if (this.processString !== undefined) {
    this.filter.processString = this.processString.bind(this);
  }
};

TieredCachingWriter.prototype.updateCache = function (srcDir, destDir) {
  // In my in-progress broccoli-filter branch, I could just do this...
  // return this.filter.processAllFilesIn(srcDir, destDir);

  // But just copying out the inner part of BroccoliFilter::write, but I'd rather
  // not have to copy this (because I have to pull in several deps to do so)
  var self = this;
  var paths = walkSync(srcDir);

  return mapSeries(paths, function (relativePath) {
    if (relativePath.slice(-1) === '/') {
      mkdirp.sync(destDir + '/' + relativePath);
    } else {
      if (self.filter.canProcessFile(relativePath)) {
        return self.filter.processAndCacheFile(srcDir, destDir, relativePath);
      } else {
        symlinkOrCopySync(srcDir + '/' + relativePath, destDir + '/' + relativePath);
      }
    }
  });
};


module.exports = TieredCachingWriter;
