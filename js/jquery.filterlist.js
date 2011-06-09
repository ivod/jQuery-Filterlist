/*
 *
 * jQuery filterList by Ivo Domburg
 *
 * Enables filtering of options inside a select list
 * by either value, tags or category.
 * 
 **************************************************** */

(function($) {
	
var methods = {
		
		init: function( options ) {
				
			return this.each(function(){

				var filterlist = $(this);
				
				// Default settings
				var settings = {
					json: null,
					searchfield: $("#searchfield"),
					filterupbutton: $("#filterupbutton"),
					filterlabel: $("#filterlabel"),
					filterbutton: $("#filterbutton"),
					categorypopup: $("#categorypopup"),
					categorypopuplist: $("#categorypopuplist"),
					emptycategories: true,
					showcategorylength: true,
					searchbycategoryname: true,
					searchmethod: "and",
					search: true,
					drilldown: true,
					placeholder: "Enter search criteria"
				};
				
				// Override defaults when set
				if ( options ) {
					$.extend( settings, options );
				}
				
				// Store settings
				filterlist.data( "settings", settings );
				
				if ( filterlist.data("settings").search ) {
					// Create searchfield
					if ( !filterlist.data("settings").searchfield.length ) {
						filterlist.data("settings").searchfield  = $("<input>").attr("type", "text").attr("id", "searchfield").attr("placeholder", filterlist.data("settings").placeholder);
						filterlist.before( filterlist.data("settings").searchfield );
					}
				}
				
				if ( filterlist.data("settings").drilldown ) {
					// Create filter wrapper
					if ( !$("#filter").length ) {
						var filter = $("<div>").attr("id", "filter");
						filterlist.before(filter);
					} else {
						var filter = $("#filter");
					}
					// Create filterupbutton
					if ( !filterlist.data("settings").filterupbutton.length ) {
						filterlist.data("settings").filterupbutton = $("<a>").attr("href", "#").attr("id", "filterupbutton").text("Back");
						filter.append( filterlist.data("settings").filterupbutton );
					}
					// Create filterlabel
					if ( !filterlist.data("settings").filterlabel.length ) {
						filterlist.data("settings").filterlabel = $("<span>").attr("id", "filterlabel");
						filter.append( filterlist.data("settings").filterlabel );
					}
					// Create filterbutton
					if ( !filterlist.data("settings").filterbutton.length ) {
						filterlist.data("settings").filterbutton = $("<a>").attr("href", "#").attr("id", "filterbutton").text("Drill down");
						filter.append( filterlist.data("settings").filterbutton );
					}
					// Create categorypopup
					if ( !filterlist.data("settings").categorypopup.length ) {
						filterlist.data("settings").categorypopup = $("<div>").attr("id", "categorypopup");
						filterlist.data("settings").categorypopuplist = $("<ul>").attr("id", "categorypopuplist");
						filterlist.data("settings").categorypopup.append( filterlist.data("settings").categorypopuplist );
						filter.after( filterlist.data("settings").categorypopup );
					}
				}
				
				// Init selected category id
				filterlist.data( "categoryid", 0 );
				
				var json = filterlist.data("settings").json;
				var searchfield = filterlist.data("settings").searchfield;
				var filterupbutton = filterlist.data("settings").filterupbutton;
				var filterlabel = filterlist.data("settings").filterlabel;
				var filterbutton = filterlist.data("settings").filterbutton;
				var categorypopup = filterlist.data("settings").categorypopup;
				var categorypopuplist = filterlist.data("settings").categorypopuplist;
				
				// Enable list & categorypopup
				filterlist.filterList("refresh");
												
				// Enable searchfield
				searchfield.bind("keyup.filterlist", function(){
					filterlist.filterList("refresh");
				});
				
				// Enable filter up button
				filterupbutton.bind("click.filterlist", function() {
					var parentnode = filterlist.filterList("getParentNodeById", filterlist.data("categoryid"));
					if (parentnode) {
						filterlist.data("categoryid", parentnode.id);
						filterlist.filterList("refresh");
					}
				});
				
				// Enable categorypopup
				categorypopup.hide();
				
				filterbutton.bind("click.filterlist", function(){
					categorypopup.show();
					filterbutton.addClass("active");
					$(document).bind("mouseup.filterlist", function(event){
						$(document).unbind("mouseup.filterlist");
						categorypopup.hide();
						filterbutton.removeClass("active");
					});
				});
				
			});
			
		},
		
		getNodeById: function(id) {
			var filterlist = $(this);
			var json = filterlist.data("settings").json;
			var node = undefined;
			
			_findNode(json);
			
			function _findNode(n) {
				if( n.id == id ) {
					node = n;
					return false;
				} else if( n.categories instanceof Object ) {
					$(n.categories).each( function(key,val){
						root = _findNode(val);
					});
				}
			}
			
			return node;
		},
		
		getParentNodeById: function(id) {
			var filterlist = $(this);
			var json = filterlist.data("settings").json;
			var parentnode = undefined;
			
			_findParentNode(json);
			
			function _findParentNode(n, p) {
				if( n.id == id ) {
					if (p) {
						parentnode = p;
					}
					return false;
				} else if( n.categories instanceof Object ) {
					$(n.categories).each( function(key,val){
						root = _findParentNode(val, n);
					});
				}
			}
			
			return parentnode;
		},
		
		refresh: function() {
			var filterlist = $(this);
			var searchfield = filterlist.data("settings").searchfield;
			var filterupbutton = filterlist.data("settings").filterupbutton;
			var filterlabel = filterlist.data("settings").filterlabel;
			var filterbutton = filterlist.data("settings").filterbutton;
			var categorypopuplist = filterlist.data("settings").categorypopuplist;
			
			function _recursiveFunction(val) {
				var p = filterlist.filterList("getParentNodeById", val.id);
				if (p) {
					if ( p.id == filterlist.data("categoryid") ) {
						_addCategory(val.id, val.name);
					}
				}
				if( val.categories instanceof Object ) {
					$(val.categories).each(function(key, val) {
						_recursiveFunction(val);
					});
				}
				if ( searchfield.length ) {
					var searcharray = trim(searchfield.val()).split(" ");
				} else {
					var searcharray = new Array;
				}	
				$(val.items).each(function() {
					var hits = 0;
					for ( var i = 0; i < searcharray.length; i++ ) {
						if ( searcharray[i] == "" ||
						this.name.toLowerCase().indexOf(searcharray[i].toLowerCase()) != -1 ||
						_hasTag(this, searcharray[i]) ||
						filterlist.data("settings").searchbycategoryname && val.name.toLowerCase().indexOf(searcharray[i].toLowerCase()) != -1 ) {
							hits += 1;
						}
					}
					if ( filterlist.data("settings").searchmethod == "and" && hits == searcharray.length ||
					filterlist.data("settings").searchmethod == "or" && hits > 0 ) {
						_addOption(this.name, this.name);
						_addToParentCategories(val);
					}
				});
			}
			
			function trim(s) {
				s = s.replace(/(^\s*)|(\s*$)/gi,"");
				s = s.replace(/[ ]{2,}/gi," ");
				s = s.replace(/\n /,"\n");
				return s;
			}
			
			function _hasTag( option, tag ) {
				var hastag = false;
				if ( option.tags instanceof Object) {
					//if ( $.inArray(tag, option.tags) != -1 ) {
					if ( String(option.tags).toLowerCase().indexOf(tag.toLowerCase()) != -1 ) {
						hastag = true;
					}
				}
				return hastag;
			}
			
			function _addOption( name ) {
				var option = $("<option>").attr("value",name).text(name);
				filterlist.append(option);
			}
			
			function _addCategory( id, name ) {
				var category = $("<li>").attr("id","category"+id).html(name);
				category.bind("mousedown.filterlist", function(event) {
					filterlist.filterList( "setCategory", id );
				});
				categorypopuplist.append(category);
			}
			
			function _addToParentCategories( cat ) {
				var category = $( "#category" + cat.id );
				if ( category.data("length") ) {
					category.data("length", category.data("length") + 1);
				} else {
					category.data("length", 1);
				}
				if ( filterlist.filterList("getParentNodeById", cat.id) ) {
					_addToParentCategories(filterlist.filterList("getParentNodeById", cat.id));
				}
				if ( filterlist.data("settings").showcategorylength ) {
					category.html( cat.name + " (" + category.data("length") + ")" );
				}
			}
			
			categorypopuplist.empty();
			filterlist.empty();
			
			// Set filter up button label
			var parentnode = filterlist.filterList("getParentNodeById", filterlist.data("categoryid"));
			if (parentnode) {
				filterupbutton.text( parentnode.name );
				filterupbutton.show();
			} else {
				filterupbutton.hide();
			}
			
			// Set filter label
			var rootnode = filterlist.filterList("getNodeById", filterlist.data("categoryid"));
			filterlabel.text( rootnode.name );
						
			_recursiveFunction(rootnode);
			
			if ( !filterlist.data("settings").emptycategories ) {
				categorypopuplist.find("li").each(function() {
					if ( !$(this).data("length") ) {
						$(this).remove();
					}
				});
			}
			
			if ( categorypopuplist.children().length ) {
				filterbutton.show();
			} else {
				filterbutton.hide();
			}

		},
		
		setCategory: function( id ) {
			var filterlist = $(this);
			var categorypopuplist = filterlist.data("settings").categorypopuplist;
			filterlist.data("categoryid", id);
			filterlist.filterList("refresh");
		}
}

$.fn.filterList = function( method ) {

	// Method calling logic
	if ( methods[method] ) {
		return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	} else if ( typeof method === 'object' || ! method ) {
		return methods.init.apply( this, arguments );
	} else {
		$.error( 'Method' + method + ' does not exist on jQuery.filterList' );
	}

}
	
})(jQuery);