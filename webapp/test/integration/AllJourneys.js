jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 materialSet in the list
// * All 3 materialSet have at least one uoms

sap.ui.require([
	"sap/ui/test/Opa5",
	"manh/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"manh/test/integration/pages/App",
	"manh/test/integration/pages/Browser",
	"manh/test/integration/pages/Master",
	"manh/test/integration/pages/Detail",
	"manh/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "manh.view."
	});

	sap.ui.require([
		"manh/test/integration/MasterJourney",
		"manh/test/integration/NavigationJourney",
		"manh/test/integration/NotFoundJourney",
		"manh/test/integration/BusyJourney",
		"manh/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});