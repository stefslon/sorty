(function ($) {

	var methods = {
		init : function( options ) { 
			this.modal();
			console.log("Init " + options);
			this.on('shown', options);
		},
		shown : function( ) {
			// IS
		},
		hidden : function( ) { 
			// GOOD
		}
	};

	$.fn.modalbox = function(options) {
		console.log("Main");
		console.log(options);

		// extend the options from pre-defined values:
		var settings = {
			shown: function() {},
			hidden: function() {}
		};

		if (options) { $.extend(settings, options); }

		this.modal();
		console.log("Init");
		console.log(settings);

		var parentElement = this;
		this.on('shown', settings.shown.call(this));
		this.on('hidden', settings.hidden.call(this));

		return this;

		// call the callback and apply the scope
    	//options.shown.call(this);


		// Method calling logic
		// if ( methods[method] ) {
		// 	return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		// } else if ( typeof method === 'object' || ! method ) {
		// 	return methods.init.apply( this, arguments );
		// } else {
		// 	$.error( 'Method ' +  method + ' does not exist on jQuery.modalbox' );
		// }    
	};

})(jQuery);

/* Usage example */
/*

*/