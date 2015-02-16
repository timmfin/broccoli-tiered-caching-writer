var Filter = require('broccoli-filter');
var CachingWriter = require('broccoli-caching-writer');


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
  newOptions = {};

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

  // Intentionally don't pass along the input tree to the composed filter instance,
  // we'll never be calling `write()` on it. However, still pass through all
  // other options (with extensions/targetExtensions likely set)
  this.filter = new this.FilterConstructor(undefined, newOptions);

  // Make The processString method on this prototype available to the composed filter instance
  if (this.processString !== undefined) {
    this.filter.processString = this.processString.bind(this);
  }
};

TieredCachingWriter.prototype.updateCache = function (srcDir, destDir) {
  return this.filter.processAllFilesIn(srcDir, destDir);
};


module.exports = TieredCachingWriter;
