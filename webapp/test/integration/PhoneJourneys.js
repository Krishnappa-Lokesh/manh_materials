jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"manh/test/integration/NavigationJourneyPhone",
		"manh/test/integration/NotFoundJourneyPhone",
		"manh/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});