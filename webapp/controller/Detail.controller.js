/*global location */
sap.ui.define([
		"manh/controller/BaseController",
		"sap/m/MessageToast",
		"sap/ui/model/json/JSONModel",
		"manh/model/formatter"
	], function (BaseController, MessageToast, JSONModel, formatter) {
		"use strict";

		return BaseController.extend("manh.controller.Detail", {

			formatter: formatter,
			//Comment
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0,
					lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
				});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "detailView");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			onShareEmailPress : function () {
				var oViewModel = this.getModel("detailView");

				sap.m.URLHelper.triggerEmail(
					null,
					oViewModel.getProperty("/shareSendEmailSubject"),
					oViewModel.getProperty("/shareSendEmailMessage")
				);
			},

			/**
			 * Event handler when the share in JAM button has been clicked
			 * @public
			 */
			onShareInJamPress : function () {
				var oViewModel = this.getModel("detailView"),
					oShareDialog = sap.ui.getCore().createComponent({
						name : "sap.collaboration.components.fiori.sharing.dialog",
						settings : {
							object :{
								id : location.href,
								share : oViewModel.getProperty("/shareOnJamTitle")
							}
						}
					});

				oShareDialog.open();
			},

			/**
			 * Updates the item count within the line item table's header
			 * @param {object} oEvent an event containing the total number of items in the list
			 * @private
			 */
			onListUpdateFinished : function (oEvent) {
				var sTitle,
					iTotalItems = oEvent.getParameter("total"),
					oViewModel = this.getModel("detailView");

				// only update the counter if the length is final
				if (this.byId("materialUomsList").getBinding("items").isLengthFinal()) {
					if (iTotalItems) {
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
					} else {
						//Display 'Line Items' instead of 'Line items (0)'
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
					}
					oViewModel.setProperty("/lineItemListTitle", sTitle);
				}
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("materialSet", {
						Material :  sObjectId
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("detailView");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sObjectPath,
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("detailObjectNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}

				var sPath = oElementBinding.getPath(),
					oResourceBundle = this.getResourceBundle(),
					oObject = oView.getModel().getObject(sPath),
					sObjectId = oObject.Material,
					sObjectName = oObject.Material,
					oViewModel = this.getModel("detailView");

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

				oViewModel.setProperty("/saveAsTileTitle",oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
				oViewModel.setProperty("/shareOnJamTitle", sObjectName);
				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
					
				//-->> Enable save button
				var oSaveButton = this.byId("saveButton");
				oSaveButton.setEnabled(true);
			},

			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("detailView"),
					oLineItemTable = this.byId("materialUomsList"),
					iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);
				oViewModel.setProperty("/lineItemTableDelay", 0);

				oLineItemTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for line item table
					oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
				});

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
				
				
				var sEntityType = "uom";
				this._sUomsChangeGroup = this._sUomsChangeGroup || ("materialUoms-" + jQuery.sap.uid());
				
				// make sure we have a change group
				var mChangeGroups = this.getOwnerComponent().getModel().getChangeGroups();
				var oEntityType = {name: sEntityType};
				
				
				// if there is no change group for the entity type yet, create one
				if (!mChangeGroups[oEntityType.name]) {
					mChangeGroups[oEntityType.name] = {
					groupId: this._sUomsChangeGroup,
					single: false
				};
				this.getOwnerComponent().getModel().setChangeGroups(mChangeGroups);

				// important: the group has to be deferred so
				this.getOwnerComponent().getModel().setDeferredGroups([this._sUomsChangeGroup]);
			}				
				
				
				
			},
			
			// Custom functions  
			onEdit: function() {
				
			},
			onSave: function(oEvent) {
				var oSaveButton = oEvent.getSource();
				
					//Disable Save button to avoid multiple press by user
					oSaveButton.setEnabled(false);


					var oModel = this.getModel();
					var oTable = this.byId("materialUomsList");
					var aItems = oTable.getItems();
					if (!oModel.hasPendingChanges()) {
						for ( var itemIndex in aItems ) { 
							var oItemLine = aItems[itemIndex];
							var oItemContextPath = oItemLine.getBindingContextPath();
							//var oItemObject = oModel.getProperty(oItemContextPath);
							oItemContextPath = oItemContextPath+"/TreatAsLoose";  
							oModel.setProperty(oItemContextPath, true );
						};
						
					};
					
	
					// Save data
					this.getModel().submitChanges({
						// Success Message
						success: function() {
							MessageToast.show("Data is saved!", {
								duration: 3000, // default
								width: "15em", // default
								my: sap.ui.core.Popup.Dock.CenterCenter,
								at: sap.ui.core.Popup.Dock.CenterCenter,
								of: window, // default
								offset: "0 0", // default
								collision: "fit fit", // default
								onClose: null, // default
								autoClose: false, // default
								animationTimingFunction: "ease", // default
								animationDuration: 1000, // default
								closeOnBrowserNavigation: true // default
							});
						}
					}, {
						//Error Message
						error: function() {
							MessageToast.show("Error updating record");
						}
					});


			},
			onCancel: function() {
			var oModel = this.getModel();
			if (oModel.hasPendingChanges()) {
				oModel.resetChanges();
				oModel.refresh();
				//this._oDialog.open();

				
			}
				
			}

		});

	}
);