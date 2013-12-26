/*

  S.Slonevskiy
  November 2012-2013

*/

// Notes:
// Elastic scroll tricks:
// http://blog.stevensanderson.com/2011/10/05/full-height-app-layouts-a-css-trick-to-make-it-easier/



var container_name;
var container_count;
var container_size;
var item_name;

var elemHeight = 24; // approximate element height for container sizing


$(document).ready(function(){

	// Check if there is a previously saved work
	var prevWork = $.jStorage.get('containers', '');
	if (prevWork !== '') {
		// There is some previous work. Restore and bypass Wizard
		var allowClose = false;
		$("#wndwContProj").modal({ keyboard: false });
		$("#wndwContProj").on('hide', function(e) {
			if (allowClose) {
				return true;
			} else {
				return false;
			}
		});
		$('#wndwContProj').on('shown', function() {
			var parentContainer = $(this);
			$("#wndwContProj").one('keydown.return', function() {
				$("#btn-continue", parentContainer).trigger('click'); return false;
			});

			$("#wndwContProj").one('keydown.esc', function() {
				$("#btn-restart", parentContainer).trigger('click'); return false;
			});

			$("#btn-continue", parentContainer).one('click',function() {
				// User confirmed
				allowClose = true;
				$('#sortyspace').html(prevWork);
				$('#itemspace').html($.jStorage.get('items'));
				container_name = $.jStorage.get('container_name');
				container_count = $.jStorage.get('container_count');
				container_size = $.jStorage.get('container_size');
				item_name = $.jStorage.get('item_name');

				// Reset container positions
				resetContainerPositions();
				
				newAlert("success","Restored previous work");

				enableWorkspace();
				
				parentContainer.modal('hide');
				return false;
			});

			$("#btn-restart", parentContainer).one('click',function() {
				// User declined
				allowClose = true;
				$.jStorage.deleteKey('containers');
				startNewProject();
				
				parentContainer.modal('hide');
				return false;
			});

		});
	}
	else {
		startNewProject();
	}


	function startNewProject() {
		container_name = $('#container_name').val().toLowerCase();
		item_name = $('#item_name').val().toLowerCase();
		updatePlaceholders();

		$("#wndwNew").modal({ keyboard: false });
		// modal box events
		$('#wndwNew').on('hide', function(e) {
			if(container_size>0) {
				// Allow to hide if form has been filled out
				return true;
			} else {
				return false;
			}
		});
		$('#wndwNew').on('shown', function() {
			var parentElement = $("#wndwNew");
			// select first item in the list (highlight all text)
			$("#item_name", parentElement).focus().select();
			// bind all input boxes to handle keyboard return
			$("input", parentElement).one('keydown.return', function() {
				$("#btn-ok", parentElement).trigger('click'); return false;
			});
			// Handle field updates: anytime a name of item or container changes, dialog is adjusted
			$("input", parentElement).live('keyup', function(e) {
				container_name = $('#container_name', parentElement).val().toLowerCase();
				item_name = $('#item_name', parentElement).val().toLowerCase();
				$(".container_name_placeholder").text((container_name));
				$(".item_name_placeholder").text((item_name));
			});
			// Triggers keyup on the initial dialog open
			$("input", parentElement).trigger('keyup');

			// modal box handles
			$("#btn-ok",parentElement).one('click',function() {
				// All questions answered, create containers
				container_name = $("#container_name",parentElement).val().toLowerCase();
				container_count = $("#container_count",parentElement).val();
				container_size = $("#container_size",parentElement).val();
				item_name = $("#item_name",parentElement).val().toLowerCase();
				for (var ii = 0; ii < container_count; ii++) {
					createContainer(ii, '', container_size);
				}

				// Reset container positions
				resetContainerPositions();

				// Add "Add Item" help text
				var tipItem = $('<div id="add_item_tip">Add ' + titleCaps(item_name) + '</div>');
				tipItem.hide();
				$("body").append(tipItem);
				tipItem.delay(1000).fadeIn(2000);
				tipItem.one('click',function() {
					$("#menuAddItem").trigger('click');
				});

				// Enable jQuery sorting, dragging, etc.
				enableWorkspace();

				$(document).focus(); // need to reset, otherwise can't catch keypresses
				parentElement.modal('hide');
				return false;
			});
		});
	}


	// Enable sorting
	function enableWorkspace() {
		makeSortable();
		
		$(".bucket").draggable({ snap: true });


		// Add ability to change the name of individual containers
		$(".bucket-header").disableSelection();
		$(".bucket-header").live('dblclick', function(e) {

			var parentContainer = $(this).parent();  console.log(parentContainer);
			var oldSize = getContainerSize(parentContainer);
			var oldName = getContainerName(parentContainer);

			if(oldName!="") {
				// In-inline container editing
				var inpField = $('<input class="bucket-name-input" type="text" id="inpNewName" name="inpNewName" value="' + oldName.replace(/\"/g, "") + '" />');
				$("#name",$(this)).html(inpField);
				$(inpField).focus().select();
				
				$(inpField).one('keydown.return', function() {
					// Accepted new value
					$(inpField).trigger('blur'); return false;
				});
				$(inpField).one('keydown.esc', function() {
					// Cancelled new value (restore old name)
					$(inpField).remove();
					$("#name",parentContainer).html(oldName); return false;
				});

				$(inpField).blur(function() {
					// Accepted new value
					if($(this).val().length){
						// Has a valid name
						modifyContainer(parentContainer, oldSize, $(this).val());
					}
					else {
						// No valid name provided, ask if want to delete
						var allowClose = false; 
						$("#name",parentContainer).html("* * *");
						$("#wndwDeleteContainer").modal({ keyboard: false });
						// modal box events
						$('#wndwDeleteContainer').on('hide', function() {
							if (allowClose) {
								return true;
							} else {
								return false;
							}
						});
						$('#wndwDeleteContainer').on('shown', function() {
							//var parentContainer = $(this);
							var parentWindow = $(this);
							// Return or Delete confirmed
							parentWindow.one('keydown.return', function() {
								$("#btn-delete", parentWindow).trigger('click'); return false;
							});
							$("#btn-delete", parentWindow).off();
							$("#btn-delete", parentWindow).one('click',function() {
								// Remove container
								allowClose 	= true;
								console.log("parentContainer: ");
								console.log(parentContainer);

								removeContainer(parentContainer);
								parentWindow.modal('hide');
								return false;
							});

							// Escape or cancel 
							parentWindow.one('keydown.esc', function() {
								$("#btn-cancel", parentWindow).trigger('click'); return false;
							});
							$("#btn-cancel", parentWindow).off();
							$("#btn-cancel", parentWindow).one('click',function() {
								// Restore old name, do not delete container
								allowClose 	= true;
								$("#name",parentContainer).html(oldName);
								parentWindow.modal('hide');
								return false;
							});
						});
					}
				});
			}
		});

		// Add ability to change the capacity of individual containers
		$("#avail",".bucket-header").disableSelection();
		$("#avail",".bucket-header").live('dblclick', function(e) {
			
			var availElement = this;
			var parentContainer = $(this).parent().parent();
			var oldSize = getContainerSize(parentContainer);
			var oldAvail = getContainerAvailable(parentContainer);
			var oldUsed = oldSize-oldAvail;

			// In-inline container editing
			var inpField = $('<input class="bucket-size-input" type="text" id="inpNewSize" name="inpNewSize" value="' + oldSize + '" />');
			$(availElement).html(inpField);
			$(inpField).focus().select();
			
			$(inpField).one('keydown.return', function() {
				// Accepted new value
				$(inpField).trigger('blur'); return false;
			});
			$(inpField).one('keydown.esc', function() {
				// Cancelled new value (restore old name)
				$(availElement).text(oldAvail); return false;
			});

			$(inpField).blur(function() {
				// Accepted new value
				var newSize = $(this).val();
				if(newSize.length>0){
					// Has a valid size
					if(newSize<oldUsed) {
						// New size will not fit all assigned elements
						newSize = oldUsed;
					}
					$("#size",parentContainer).text(newSize);
					updateContainer(parentContainer);
				}
				else {
					// No valid name provided, ask if want to delete
					$(availElement).text(oldAvail);
				}
			});

			// Stop propagating
			return false;
		});



		// Add ability to change item names
		$("li.item").live('dblclick', function(e) {
			var clickedItem = $(this);
			var oldName = $(this).text();

			if(oldName!="") {
				// In-inline container editing
				var inpField = $('<input class="item-name-input" type="text" id="inpNewName" name="inpNewName" value="' + oldName.replace(/\"/g, "") + '" />');
				$("a",clickedItem).html(inpField);
				$(inpField).focus().select();
				
				$(inpField).one('keydown.return', function() {
					// Accepted new value
					$(inpField).trigger('blur'); return false;
				});
				$(inpField).one('keydown.esc', function() {
					// Cancelled new value (restore old name)
					$("a",clickedItem).html(oldName); return false;
				});

				$(inpField).blur(function() {
					// Accepted new value
					if($(this).val().length){
						// Has a valid name
						$("a",clickedItem).text($(this).val());
					}
					else {
						// No valid name provided, ask if want to delete
						var allowClose = false;
						$("a",clickedItem).html("* * *");
						$("#wndwDeleteItem").modal({ keyboard: false });
						// modal box events
						$('#wndwDeleteItem').on('hide', function() {
							if (allowClose) {
								return true;
							} else {
								return false;
							}
						});
						$('#wndwDeleteItem').on('shown', function() {
							var parentContainer = $("#wndwDeleteItem");
							// Return or Delete confirmed
							parentContainer.one('keydown.return', function() {
								$("#btn-delete", parentContainer).trigger('click'); return false;
							});
							$("#btn-delete", parentContainer).off();
							$("#btn-delete", parentContainer).one('click',function() {
								// Remove item
								allowClose = true;
								removeItem(clickedItem);
								parentContainer.modal('hide');
								return false;
							});

							// Escape or cancel 
							parentContainer.one('keydown.esc', function() {
								$("#btn-cancel", parentContainer).trigger('click'); return false;
							});
							$("#btn-cancel", parentContainer).off();
							$("#btn-cancel", parentContainer).one('click',function() {
								// Restore old name, do not delete them
								allowClose = true;
								$("a",clickedItem).html(oldName);
								parentContainer.modal('hide');
								return false;
							});
						});
					}
				});
			}
		});
		
		// Update toolbar tips
		updateToolbar();

		// Update place holders
		updatePlaceholders();
		
		// Update status
		updateStatus();
	}


	// Make sortable LIs
	function makeSortable() {
		var oldList, newList, item;
		$(".selection-list").sortable({
			connectWith: ".enabled",
			cursor: "move",
			forcePlaceholderSize: false,
			helper:    function(event, ui) { 
				return $(ui).clone().appendTo('body').show();
			},
			start: function(event, ui) {
				ui.placeholder.height(ui.helper.outerHeight());
				item = ui.item;
				newList = oldList = ui.item.parent().parent();
			},
			change: function(event, ui) {
				if (ui.sender) newList = ui.placeholder.parent().parent();
			},
			beforeStop: function(e, ui) {
				ui.placeholder.parent().parent().removeClass("hover");
			},
			stop: function(e, ui) {
				updateContainer(oldList);
				updateContainer(newList);
				updateStatus();
			},
			over: function(e, ui) {
				ui.placeholder.parent().parent().addClass("hover");
			},
			out: function(e, ui) {
				ui.placeholder.parent().parent().removeClass("hover");
			}
		});
		$(".selection-list").disableSelection();
	}


	// Create item
	function createItem(name) {
		$("#itemspace").append('<li class="item"><a>' + name + '</a></li>');
		updateStatus();
	}


	// Remove item
	function removeItem(item) {
		// Find out who the parent is and force its update
		var parentContainer = item.parent().parent();
		item.animate({opacity:0},500, function() { $(this).remove(); updateContainer(parentContainer); updateStatus(); });
	}



	// Create container
	function createContainer(id, name, size, setAbsolute) {
		if (name==='') {
			var name = titleCaps(container_name.substring(0,container_name.length-1)) + ' #' + (id + 1);
		}
		var newContainer = '<div id="container' + id + '" class="bucket">\n';
		newContainer    += '	<h5 class="bucket-header"><span id="name">' + name + '</span><span class="badge badge-success pull-right" id="avail">' + size + '</span><span id="size">' + size + '</span></h5>\n';
		//newContainer  += '<span class="avail">Avail: <span id="avail">' + size + '</span> / <span id="size" class="size">' + size + '</span></span></div>\n';
		//newContainer    += '	<div class="bucket-content">\n';
		newContainer    += '	<ul class="bucket-content selection-list enabled" style="min-height:' + (elemHeight*size) +'px;"></ul>\n';
		newContainer    += '</div>\n\n';
		jNewContainer    = $(newContainer);
		jNewContainer.invisible();
		jNewContainer.draggable({ snap: true });
		$("#sortyspace").append(jNewContainer);

		updateContainer(jNewContainer);
		updateStatus();
		makeSortable();

		// Setup absolute CSS position only if requested
		if ((setAbsolute!==undefined) & (setAbsolute)) {
			jNewContainer.css({
				position: "absolute",
				marginLeft: 0,
				marginTop: 0,
				top: 10,
				left: 20
			});

			// Keep moving newly created object, until no collision is detected
			var stepX 	= 47;
			var stepY 	= 61;
			var numIter = 0;
			while ( (overlaps( jNewContainer, ".bucket" )) && numIter<1500 ) {
				var pos = jNewContainer.position();
				var newLeft = pos.left+stepX;
				var newTop = pos.top;
				if ( (newLeft+jNewContainer.width())>$("#sortyspace").width() ) {
					newLeft = 0;
					newTop = pos.top+stepY;
				}
				//console.log(" moving " + newTop + " " + newLeft);
				jNewContainer.css({ top: newTop, left: newLeft});
				numIter++;
			}
		}

		jNewContainer.hide().visible().fadeIn(1000);
	}


	// Update container information upon some event (add, remove, etc.)
	function updateContainer(container) {
		if ( container.attr('id') != 'workarea' ) {
			// Update any container except for sortyspace
			var allChildren = $("li", container);
			// Count items (if there is a "&"" in the name this is a couple so there are two)
			var numChildren = 0;
			allChildren.each(function(idx,val){
				if ($(val).html().indexOf("&amp;") != -1) {
					numChildren+=2;
				} else {
					numChildren++;
				}
			});
			var totSize = $("#size", container).text();
			var numAvail = totSize - numChildren; //allChildren.length;
			console.log("updateContainer: "+totSize+", "+numAvail);
			//console.log('Update container ' +allChildren.length+ ' out of ' +totSize);
			$(".selection-list",container).animate({"min-height": elemHeight*totSize},500);
			container.find("#avail").text(numAvail);
			if (numAvail === 0) {
				// Give color cues on the number of spots left
				container.find("#avail").removeClass("badge-warning").removeClass("badge-success").addClass("badge-important");
				// No room left in this container. Disable sorting.
				container.find("ul").removeClass("enabled");
				container.addClass("full");
			}
			else {
				// Give color cues on the number of spots left
				if (numAvail === 1) {
					container.find("#avail").removeClass("badge-success").removeClass("badge-important").addClass("badge-warning");
				}
				else {
					container.find("#avail").removeClass("badge-important").removeClass("badge-warning").addClass("badge-success");
				}
				// There is room, keep sorting enabled.
				container.find("ul").addClass("enabled");
				container.removeClass("full");
			}
		}
		else {
			removeHelpText();
		}
		updateStatus();
	}

	// Remove container
	function removeContainer(container) {
		// Remove supplied container
		// But first find all items assigned to it and move them into items panel
		var itemsPanel = $("#itemspace");
		container.find("li").each(function(idx,val) {
			itemsPanel.append(val);
		});
		container.animate({opacity:0},1000, function() { container.remove(); updateStatus(); });
		updateStatus();
	}


	// Resize and/or rename container
	function modifyContainer(container, size, name) {
		container.find("#size").text(size);
		container.find("#name").text(name);
		updateContainer(container);
	}


	// Walk through all created container and get their position
	// Then reset CSS positioning to absolute
	// This ensures that created container do no overlap each other
	function resetContainerPositions() {
		ii=0;
		var xpos = [];
		var ypos = [];
		$(".bucket").each(function(idx,val) {
			xpos[ii] = $(val).position().top;
			ypos[ii] = $(val).position().left;
			ii++;
		});
		ii=0;
		$(".bucket").each(function(idx,val) {
			$(val).css({ position: "absolute",
				marginLeft: 0, marginTop: 0,
				top: xpos[ii], left: ypos[ii] });
			ii++;
		});
	}


	// Fetch current container size
	function getContainerSize(container) {
		return container.find("#size").text();
	}


	// Fetch number of available spots
	function getContainerAvailable(container) {
		return container.find("#avail").text();
	}


	// Fetch current container name
	function getContainerName(container) {
		return container.find("#name").text();
	}


	function updateStatus() {
		// Gather all the information
		var totalCapacity = 0;
		var availCapacity = 0;
		var totalContainers = 0;
		var unassignedItems = 0;
		var assignedItems = 0;
		$(".bucket").each(function(idx,val) {
			totalCapacity += Number(getContainerSize($(val)));
			availCapacity += Number(getContainerAvailable($(val)));
			totalContainers += 1;
		});
		$("li.item").each(function(idx,val) {
			var container = $(val).parent();
			if (container.attr('id') !== 'itemspace') assignedItems += 1;
			else unassignedItems += 1;
		});
		var statusText = '';
		statusText += 'Total of ' + totalContainers + ' ' + container_name + ' can fit ' + totalCapacity + ' ' + item_name + ', with ' + availCapacity + ' spots still available ';
		statusText += 'Out of ' + (unassignedItems+assignedItems) + ' ' + item_name + ', ' + assignedItems + ' are already assigned and ' + unassignedItems + ' unassigned';
		$("#menuStatus").html(statusText);
	}


	// Fade out help text (for add items)
	function removeHelpText() {
		$("#add_item_tip").animate({opacity:0},500, function() { $(this).remove(); });
	}
	

	function updatePlaceholders() {
		$(".container_name_placeholder").text((container_name));
		$(".item_name_placeholder").text((item_name));
		
		$(".container_singular_name_placeholder").text(container_name.substring(0,container_name.length-1));
		$(".item_singular_name_placeholder").text(item_name.substring(0,container_name.length-1));
	}

	
	/********************************************************
		Toolbar functionality
	*********************************************************/
	function updateToolbar() {
		//$(".container_name_placeholder").text(titleCaps(container_name.substring(0,container_name.length-1)));
		//$(".item_name_placeholder").text(titleCaps(item_name));
		$("#menuAddItem").attr("title","Add "+titleCaps(item_name)+" [ctrl+a]");
		$("#menuAddContainer").attr("title","Add "+titleCaps(container_name.substring(0,container_name.length-1))+" [ctrl+q]");
		$("#menuEditContainer").attr("title","Edit "+titleCaps(container_name.substring(0,container_name.length-1))+"s [ctrl+e]");
	}


	// Save action
	$(document).bind('keydown.ctrl_s', function() {
		$("#menuSave").trigger('click'); return false;
	});
	$("#menuSave").live('click',function() {
		//console.log($('#containers_panel').html());
		$.jStorage.set('containers', $('#sortyspace').html());
		$.jStorage.set('items', $('#itemspace').html());
		$.jStorage.set('container_name', container_name);
		$.jStorage.set('container_count', container_count);
		$.jStorage.set('container_size', container_size);
		$.jStorage.set('item_name', item_name);
		newAlert("info","Your workspace has been saved!");
		return false;
	});
	

	// Create new container action
	$(document).bind('keydown.ctrl_q', function() {
		$("#menuAddContainer").trigger('click'); return false;
	});
	$("#menuAddContainer").live('click',function() {
		// TODO: Would be nice here, if newly created container would
		//		 automatically find a good spot for itself where it doesn't
		//		 overlap any of the other containers.
		var newID = $('.bucket').length;
		createContainer(newID, '', container_size, true);
		return false;
	});
	

	// Add new item action
	$(document).bind('keydown.ctrl_a', function() {
		$("#menuAddItem").trigger('click'); return false;
	});
	$("#menuAddItem").live('click',function() {
		var allowClose = false;
		// Reset contents now, before the box is shown
		$("#item_list", $("#wndwAddItems")).val("");
		// Add another item(s)
		$("#wndwAddItems").find(".item_name_placeholder").text(titleCaps(item_name));
		$("#wndwAddItems").modal({ keyboard: false });
		// modal box events
		$('#wndwAddItems').on('hide', function() {
			if (allowClose) {
				return true;
			} else {
				return false;
			}
		});
		$('#wndwAddItems').on('shown', function() {
			var parentElement = $(this);
			// select first item in the list (highlight all text)
			$("#item_list", parentElement).focus().select();	

			// add
			$("#btn-add", parentElement).off();
			$("#btn-add", parentElement).one('click',function() {
				allowClose = true;
				removeHelpText();
				var item_list = $("#item_list").val();
				if(item_list.length>0) {
					$.each(item_list.split("\n"), function(idx,val) {
						if (deblank(val) !== "") {
							createItem(val);
						}
					});
				}
				$(document).focus(); // need to reset, otherwise can't catch keypresses
				parentElement.modal('hide');
				return false;
			});

			// cancel
			$("textarea", parentElement).one('keydown.esc', function() {
				$(document).focus(); // need to reset, otherwise can't catch keypresses
				$("#btn-cancel", parentElement).trigger('click'); 
				return false;
			});
			$("#btn-cancel", parentElement).off();
			$("#btn-cancel", parentElement).one('click',function() {
				allowClose = true;
				$(document).focus(); // need to reset, otherwise can't catch keypresses
				parentElement.modal('hide');
				return false;
			});

		});
		return false;
	});


	// Export all assignments
	$(document).bind('keydown.ctrl_p', function(e) {
		$("#menuExport").trigger('click'); return false;
	});
	$("#menuExport").live('click',function() {
		// Generate export list

		// Simple export (for now anyway):
		// Each item with a container assignment after it

		var exportText = '';
		var exportUnassigned = '';
		$(".item").each(function(idx,val) {
			var container = $(val).parent().parent();
			if (container.attr('id') !== 'workarea') {
				// These are assigned
				exportText = exportText + deblank($(val).text()) + '\t' + getContainerName(container) + '\n';
			}
			else {
				// These are not assigned
				exportUnassigned = exportUnassigned + deblank($(val).text()) + '\n';
			}
		});

		exportText = exportText + '\n' + titleCaps(item_name) + ' not assigned to any ' + container_name + ':\n';
		exportText = exportText + exportUnassigned;

		//console.log(exportText);
		$("#export_text",$("#wndwExport")).text(exportText);
		
		$("#wndwExport").modal({ keyboard: false });

		$("#wndwExport").one('shown', function() {
			var parentElement = $(this);
			// select first item in the list (highlight all text)
			$("#export_text", parentElement).focus().select();

			// bind all input boxes to handle keyboard return
			$("textarea", parentElement).one('keydown.esc', function(e) {
				$("#btn-ok", parentElement).trigger('click'); return false;
			});
			$("#btn-ok", parentElement).off();
			$("#btn-ok", parentElement).one('click', function() {
				$(document).focus(); // need to reset, otherwise can't catch keypresses
				parentElement.modal('hide'); 
				return false;
			});
		});

		return false;
	});


	// Start from scratch
	$("#menuRestart").live('click',function() {
		// Clear out everything stored
		$("#wndwRestart").modal({ keyboard: false });

		$("#wndwRestart").on("shown",function() {
			var parentContainer = $(this);
			// Return or Delete confirmed
			parentContainer.one('keydown.return', function() {
				$("#btn-delete", parentContainer).trigger('click'); return false;
			});
			$("#btn-delete", parentContainer).off();
			$("#btn-delete", parentContainer).one('click',function() {
				// Remove all saved data, reload page
				$.jStorage.deleteKey('containers');
				location.reload();
				return true;
			});

			// Escape or cancel 
			parentContainer.one('keydown.esc', function() {
				$("#btn-cancel", parentContainer).trigger('click'); return false;
			});
			$("#btn-cancel", parentContainer).off();
			$("#btn-cancel", parentContainer).one('click',function() {
				parentContainer.modal('hide');
				return false;
			});
		});

		return false;
	});


	// Mass-edit Containers
	$(document).bind('keydown.ctrl_e', function(e) {
		$("#menuEditContainer").trigger('click'); return false;
	});
	$("#menuEditContainer").live('click',function() {

		// Put together a list of existing containers
		var editString = '';
		$(".bucket").each(function(idx,val) {
			contName    = getContainerName($(val));
			contSize    = Number(getContainerSize($(val)));
			editString += contName + ',' + contSize + '\n';
		});
		$("#containers_changes",$("#wndwEditContainers")).text(editString);

		var allowClose = false;
		// Show edit dialog
		$("#wndwEditContainers").modal({ keyboard: false });
		$('#wndwEditContainers').on('hide', function() {
			if (allowClose) {
				return true;
			} else {
				return false;
			}
		});
		$("#wndwEditContainers").on("shown",function(){
			var parentElement = $(this);
			$("#containers_changes",parentElement).focus().select();

			// change
			$("#btn-change", parentElement).off();
			$("#btn-change", parentElement).one('click',function() {
				allowClose = true;
				var containers_changes = $("#containers_changes",parentElement).val();

				// Parse new input
				// First remove all existing containers
				$(".bucket").each(function(idx,val) {
					removeContainer($(val));
				});
				// Now add all new containers
				$.each(containers_changes.split("\n"), function(idx,val) {
					if (deblank(val) !== "") {
						ret = val.split(/[\t,]+/);
						contName = ret[0];
						contSize = Number(ret[1]);
						if ((contName!=='') & (contSize!=='') & (!isNaN(contSize))) createContainer(idx, contName, contSize);
					}
				});

				// Reset all newly created containers
				resetContainerPositions();

				$(document).focus(); // need to reset, otherwise can't catch keypresses
				parentElement.modal('hide');
				return false;
			});

			// cancel
			$("textarea", parentElement).one('keydown.esc', function() {
				$(document).focus(); // need to reset, otherwise can't catch keypresses
				$("#btn-cancel", parentElement).trigger('click'); 
				return false;
			});
			$("#btn-cancel", parentElement).off();
			$("#btn-cancel", parentElement).one('click',function() {
				allowClose = true;
				$(document).focus(); // need to reset, otherwise can't catch keypresses
				parentElement.modal('hide');
				return false;
			});

			return false;
		});

		return false;
	});


	// Export data to PDF and print
	$("#menuPrint").live('click',function() {
		// Some options
		var widthMargin = 15; 	// pts
		var heightMargin = 15;  // pts

		// Get max width and max height
		var maxWidth = 0;
		var maxHeight = 0;
		$(".bucket").each(function(idx,val) {
			if($(val).position().left+$(val).width()>maxWidth) {
				maxWidth = $(val).position().left+$(val).width();
			}
			if($(val).position().top+$(val).height()>maxHeight) {
				maxHeight = $(val).position().top+$(val).height();
			}
		});

		// Start new PDF document
		var doc = new jsPDF('l','pt',[maxWidth+2*widthMargin,maxHeight+2*heightMargin]);

		// Standard output header
		doc.setFontSize(7);
		var d = new Date();
		var dstr = d.getMonth()+"/"+d.getDate()+"/"+d.getFullYear()+" "+d.getHours()+":"+d.getMinutes();
		doc.text(2, 8, "Generated by Sorty on "+moment().format('MMMM Do YYYY, h:mm:ss a')+"");
		doc.setFontSize(8);
		doc.text(2, 16, "http://www.nesbc.com/sorty");
		doc.setFontSize(10);

		// Go through all buckets and draw them one by one
		$(".bucket").each(function(idx,val) {
			var bucketX = $(val).position().left+widthMargin;
			var bucketY = $(val).position().top+heightMargin;
			doc.setFillColor(100,100,100);
			doc.roundedRect(bucketX+1.5, bucketY+1.5, $(val).width()+1.5, $(val).height()+1.5, 10, 10, 'F'); // shadow
			doc.setFillColor(255,255,255);
			doc.roundedRect(bucketX, bucketY, $(val).width(), $(val).height(), 10, 10, 'FD'); // empty square
			
			// Add container name
			doc.setFontType("bold");
			doc.text(bucketX+8, bucketY+16, getContainerName($(val)));
			doc.setFontType("normal");

			// Add container size
			doc.setFillColor(255,255,255);
			//doc.circle(bucketX+$(val).width()-10, bucketY+10, 8, 'FD');
			doc.setFontSize(10);
			//doc.text(bucketX+$(val).width()/1.5-10-4, bucketY+10+4, "Fits " + getContainerSize($(val)));
			doc.text(bucketX+$(val).width()/1.2-10-4, bucketY+16, "Fits " + getContainerSize($(val)));
			doc.setFontSize(10);

			doc.line(bucketX, bucketY+25, bucketX+$(val).width(), bucketY+25);

			// Go through all items in the bucket
			var itemNum = 1;
			$(".item",$(val)).each(function(idx2,val2) {
				doc.text(bucketX+$(val2).position().left, bucketY+$(val2).position().top, itemNum+". "+$(val2).text());
				itemNum = itemNum+1;
			});

		});

		try {
			// Output as Data URI in a new window
			window.open(doc.output('dataurlstring'), 'PDF');
		} catch (e) {}

	});
		

	/***********************************************************************
								Modal dialogs actions
	************************************************************************/
	$("#menuAbout").click(function() {
		$('#wndwAbout').modal({
			keyboard: true
		});
		// modal box handles
		$("#btn-ok",$('#wndwAbout')).off();
		$("#btn-ok",$('#wndwAbout')).one('click',function() {
			$("#wndwAbout").modal('hide');
		});
		return false;
	});


});





/***********************************************************************
						Utility Functions
************************************************************************/
// Credit: http://ejohn.org/blog/title-capitalization-in-javascript/
(function() {
	var small = "(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v[.]?|via|vs[.]?)";
	var punct = "([!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]*)";

	this.titleCaps = function(title) {
		var parts = [],
		split = /[:.;?!] |(?: |^)["Ò]/g,
		index = 0;

		while (true) {
			var m = split.exec(title);

			parts.push(title.substring(index, m ? m.index : title.length).replace(/\b([A-Za-z][a-z.'Õ]*)\b/g, function(all) {
				return (/[A-Za-z]\.[A-Za-z]/).test(all) ? all : upper(all);
			}).replace(RegExp("\\b" + small + "\\b", "ig"), lower).replace(RegExp("^" + punct + small + "\\b", "ig"), function(all, punct, word) {
				return punct + upper(word);
			}).replace(RegExp("\\b" + small + punct + "$", "ig"), upper));

			index = split.lastIndex;

			if (m) parts.push(m[0]);
			else break;
		}

		return parts.join("").replace(/ V(s?)\. /ig, " v$1. ").replace(/(['Õ])S\b/ig, "$1s").replace(/\b(AT&T|Q&A)\b/ig, function(all) {
			return all.toUpperCase();
		});
	};

	function lower(word) {
		return word.toLowerCase();
	}

	function upper(word) {
		return word.substr(0, 1).toUpperCase() + word.substr(1);
	}
})();


// Remove spaces and other non-printable characters from the string
function deblank(someText) {
	return someText.replace(/(\r\n|\n|\r)/gm,"");
}


// Alert function
function newAlert(type, message) {
	// Possible types:
	//	- error
	// 	- success
	// 	- info
	// Stays on screen for 2 seconds
	$("body").append($("<div id='alert-area'><div class='container'><div class='alert alert-" + type + " fade in center'>" + message + "</div></div></div>"));
	$("#alert-area").delay(2000).fadeOut("slow", function () { $(this).remove(); });
}


// Turn on navigation bar tooltips
$('.navbar-inner').tooltip({
	selector: "a[rel=tooltip]"
});


// Simple overlap/collision test
// Source: http://jsfiddle.net/98sAG/
var overlaps = (function () {
	function getPositions( elem ) {
		var pos, width, height;
		pos = $( elem ).position();
		width = $( elem ).width();
		height = $( elem ).height();
		return [ [ pos.left, pos.left + width ], [ pos.top, pos.top + height ] ];
	}

	function comparePositions( p1, p2 ) {
		var r1, r2;
		r1 = p1[0] < p2[0] ? p1 : p2;
		r2 = p1[0] < p2[0] ? p2 : p1;
		return r1[1] > r2[0] || r1[0] === r2[0];
	}

	return function ( me, other ) {
		var pos1 = getPositions( me );
		//console.log("overlap func, pos1=" + pos1);
		var returnVal = false;
		$(other).each(function(idx,val) {
			if (!me.is(val)) {
				var pos2 = getPositions( $(val) );
				//console.log("overlap func, pos2=" + pos2);
				returnVal = (returnVal) || ( comparePositions( pos1[0], pos2[0] ) && comparePositions( pos1[1], pos2[1] ) );
			}
		});

		return returnVal;
	};
})();


// Use these instead of show()/hide() because show and hide use display: none, which removes the element from the document, 
// so it is not available for change even though the markup is there. Use visibility: hidden; to hide the element rather than remove it.
// Source: http://forum.jquery.com/topic/how-do-i-get-position-left-of-a-hidden-element
// Source: http://stackoverflow.com/questions/9614622/equivalent-of-jquery-hide-to-set-visibility-hidden
jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};

jQuery.fn.visibilityToggle = function() {
    return this.css('visibility', function(i, visibility) {
        return (visibility == 'visible') ? 'hidden' : 'visible';
    });
};