/**
 * @file
 * SEARCH AUTOCOMPLETE javascript mechanism.
 * 
 * Sponsored by:
 * www.axiomcafe.fr
 */

(function ($) {

  // Autocomplete
  $.ui.autocomplete.prototype._renderItem = function (ul, item) {
    var term = this.term;
    var first = ("group" in item)  ? 'first' : '';
    var innerHTML = '<div class="ui-autocomplete-fields ' + first + '">';
    if (item.fields) {
      $.each(item.fields, function(key, value) {
        var regex = new RegExp('(' + $.trim(term) + ')', 'gi');
        var output = value;
        if (value.indexOf('src=') == -1 && value.indexOf('href=') == -1) {
          output = value.replace(regex, "<span class='ui-autocomplete-field-term'>$1</span>");
        }
        innerHTML += ('<div class="ui-autocomplete-field-' + key + '">' + output + '</div>');
      });
    } else {
      innerHTML += ('<div class="ui-autocomplete-field">' + item.label + '</div>');
    }
    innerHTML += '</div>';

    var group = '';
    if ("group" in item) {
    	groupId = typeof(item.group.group_id) !== 'undefined' ? item.group.group_id : '';
    	groupName = typeof(item.group.group_name) !== 'undefined' ? item.group.group_name : '';
      group += ('<div class="ui-autocomplete-field-group ' + groupId + '">' + groupName + '</div>');
      $(group).appendTo(ul);
    }
    var elem =  $("<li class=ui-menu-item-" + first + "></li>" )
    .append("<a>" + innerHTML + "</a>");   
    if (item.value == '') {
    	elem = $("<li class='ui-state-disabled ui-menu-item-" + first + " ui-menu-item'>" + item.label + "</li>" );
    }
		elem.data("item.autocomplete", item)
    .appendTo(ul);
    
    //Drupal.attachBehaviors(elem); seems this retriggers already registered behaviours. is it needed ? .availability doesent have own js triggers.
    return elem;
  };

  $.ui.autocomplete.prototype._resizeMenu = function() {
    var ul = this.menu.element;
    ul.outerWidth(Math.max(ul.width("").outerWidth() + 5, this.options.position.of == null ? this.element.outerWidth() : this.options.position.of.outerWidth()));
  };

  Drupal.behaviors.search_autocomplete = {
    attach: function(context) {
      if (Drupal.settings.search_autocomplete) {
        $.each(Drupal.settings.search_autocomplete, function(key, value) {
        	var no_results = Drupal.settings.search_autocomplete[key].no_results;
        	var all_results = Drupal.settings.search_autocomplete[key].all_results;
          $(Drupal.settings.search_autocomplete[key].selector).bind("mouseover", function() {
             $(Drupal.settings.search_autocomplete[key].selector).addClass('ui-autocomplete-processed ui-theme-' + Drupal.settings.search_autocomplete[key].theme).autocomplete({
            	 	minLength: Drupal.settings.search_autocomplete[key].minChars,
            	 	source: function(request, response) {
		              // External URL:
		              if (Drupal.settings.search_autocomplete[key].type == 'external') {
		                $.getJSON(Drupal.settings.search_autocomplete[key].datas, { q: request.term }, function (results) {
		                  // Only return the number of values set in the settings.
		                  if (!results.length && no_results) {
		                      results = [jQuery.parseJSON(no_results.replace(/\[search-phrase\]/g, request.term))];
		                  } else {
		                  	results.slice(0, Drupal.settings.search_autocomplete[key].max_sug);
	                  		results.push(jQuery.parseJSON(all_results.replace(/\[search-phrase\]/g, request.term)));
		                  }
		                  response(results);
		                });
		              }
		              // Internal URL:
		              else if (Drupal.settings.search_autocomplete[key].type == 'internal' || Drupal.settings.search_autocomplete[key].type == 'view') {
		                 if ($('#edit-search-type-1:checked').val() && window.location.hostname != 'langelandbibliotek.dk') {
                                $.getJSON(Drupal.settings.search_autocomplete[key].datas + request.term, { }, function (results) {
		                  // Only return the number of values set in the settings.
		                  if (!results.length && no_results) {
		                      results = [jQuery.parseJSON(no_results.replace(/\[search-phrase\]/g, request.term))];
		                  } else {
		                  	results.slice(0, Drupal.settings.search_autocomplete[key].max_sug);
	                  		results.push(jQuery.parseJSON(all_results.replace(/\[search-phrase\]/g, request.term)));
		                  }
		                  response(results);
		                });
		              }
                              else if ($('#edit-search-type-0:checked').val()) {
                                    $.getJSON(Drupal.settings.basePath + 'ting/autocomplete/' + request.term + "/" ,{},response);
                                }
                            }
		              // Static resources:
		              else if (Drupal.settings.search_autocomplete[key].type == 'static') {
		                var results = $.ui.autocomplete.filter(Drupal.settings.search_autocomplete[key].datas, request.term);
	                  if (!results.length && no_results) {
	                  	results = [jQuery.parseJSON(no_results.replace(/\[search-phrase\]/g, request.term))];
	                  } else {
	                  	results.slice(0, Drupal.settings.search_autocomplete[key].max_sug);
	                		results.push(jQuery.parseJSON(all_results.replace(/\[search-phrase\]/g, request.term)));
	                  }
	                  response(results);
		              }
		            },
		            open: function(event, ui) {
		              $(".ui-autocomplete li.ui-menu-item:odd").addClass("ui-menu-item-odd");
		              $(".ui-autocomplete li.ui-menu-item:even").addClass("ui-menu-item-even");
		            },
		            select: function(event, ui) {
                               $('<div class="search-overlay--wrapper"><div class="search-overlay--inner"><span class="icon-spinner icon-spin search-overlay--icon"></span><p class="search-overlay--text">' + Drupal.t('Searching please wait...') + '</p><p class="cancel"><a href="#">' + Drupal.t('Cancel') + '</a></p></div></div>').prependTo('body');
		              if (Drupal.settings.search_autocomplete[key].auto_redirect == 1 && ui.item.link) {
		                document.location.href = ui.item.link;
		              } else if (Drupal.settings.search_autocomplete[key].auto_submit == 1 && ui.item.value && event.which != 13) {
		                  $(this).val(ui.item.value);
		                  $(this).closest("form").submit();
		              }
                              else if(event.which == 13) //submit form on enter press.
                              {
                                  $(this).closest("form").submit();
                              }
//		              } else {
//			            	event.preventDefault();
//		              }
		            },
		            focus: function (event, ui) {
		              if (ui.item.label === no_results) {
		                  event.preventDefault();
		              }
		            },
		            appendTo: $(Drupal.settings.search_autocomplete[key].selector).parent(),
             }).autocomplete("widget").attr("id", "ui-theme-" + Drupal.settings.search_autocomplete[key].theme);
        	});
          $(Drupal.settings.search_autocomplete[key].selector).trigger('mouseover');
       });
      }
    }
  };
})(jQuery);