## Tiered Caching Writer

Give your Broccoli plug-in the "best of both worlds" caching:

  - Whole directory caching via broccoli-caching-writer if the whole input directory isn't modified
  - Individual file caching via broccoli-filter, so that only the changes files are re-processed

In many cases, using broccoli-filter is sufficient. However, if the plug-in is operating on an input tree that has hundreds/thousands of files (and it is common for the input directory to not have changed), broccoli-tiered-caching-writer prevents your plug-in from unnecessarily having to walk over the entire input directory.
