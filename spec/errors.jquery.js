"use strict";

// This jQuery plugin adds functions that make it easy to display
// friendly tips to a user based on Slowparse errors. For more information
// on Slowparse errors, see the [error specification][spec].
//
// For examples of this plugin in use, consult its [test suite][].
//
//  [spec]: spec/
//  [test suite]: https://github.com/mozilla/slowparse/blob/gh-pages/test/test-errors.jquery.js

(function(jQuery) {
  var $ = jQuery;

  // ## jQuery Extensions

  jQuery.extend({
    // **jQuery.errorTemplates** is a selection that contains all our error
    // message templates.

    errorTemplates: $(),
    // **jQuery.loadErrors(*basePath*, *names*, *cb*)** loads a set of error
    // message templates.
    //
    // * *basePath* is the relative path containing the error message
    //   template HTML files.
    //
    // * *names* is an array of template files to load. For each `name`
    //   in this array, the file `errors.name.html` will be loaded from
    //   *basePath*.
    //
    // * *cb* is a function that will be called once all the templates
    //   are loaded. Its first argument will be null only if no errors
    //   occurred.
    loadErrors: function(basePath, names, cb) {
      var reqs = names.map(function(name) {
        var url = basePath + "errors." + name + ".html";
        return jQuery.get(url);
      });
      jQuery.when.apply(jQuery, reqs).then(function() {
        reqs.forEach(function(req) {
          var div = $('<div></div>').html(req.responseText);
          $.errorTemplates = $.errorTemplates.add($(".error-msg", div));
        });
        cb(null);
      }, function() {
        cb("ERROR: At least one template file did not load.");
      });
    }
  });

  jQuery.fn.extend({
    // **jQuery.fn.errorHighlightInterval()** returns an object
    // containing `{start, end}` keys that describe the integral start and
    // end indexes of a `data-highlight` attribute on the first
    // element of the current selection.
    errorHighlightInterval: function() {
      var interval = $(this).attr("data-highlight").split(",");
      var start = parseInt(interval[0]);
      var end = interval[1] ? parseInt(interval[1]) : undefined;
      return {start: start, end: end};
    },

    // **jQuery.fn.eachErrorHighlight(*cb*)** calls the given callback on
    // every element with a `data-highlight` attribute in the current
    // selection. The callback is passed `(start, end, i)` arguments
    // which represent the integral start and end of the highlight, and
    // the array index of the element.
    eachErrorHighlight: function(cb) {
      $("[data-highlight]", this).each(function(i) {
        var interval = $(this).errorHighlightInterval();
        cb.call(this, interval.start, interval.end, i);
      });
      return this;
    },

    // **jQuery.fn.fillError(*error* [, *templates*])** fills the current selection with the
    // friendly error message for the given error object. For more
    // information on error objects, see the [error specification][spec].
    //
    // Optionally, a second argument containing a selection of all
    // available error templates can be provided. If not present, the
    // global selection of templates from `jQuery.errorTemplates` will
    // be used.
    //
    //   [spec]: spec/
    fillError: function(error, templates) {
      var selector = ".error-msg." + error.type;
      var template = (templates || $.errorTemplates).filter(selector);
      if (template.length == 0)
        throw new Error("Error template not found for " + error.type);
      this.html(_.template(template.html(), error, mustacheSettings)).show();
      return this;
    }
  });

  // We want to use "mustache"-style templating, e.g. `hello there {{name}}`.
  var mustacheSettings = {
    escape: /\{\{(.+?)\}\}/g,
    evaluate: /\[%(.+?)%\]/
  };
})(jQuery);
