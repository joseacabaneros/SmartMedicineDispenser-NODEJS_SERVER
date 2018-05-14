$(document).ready(function(){
	$("#serial").mask("*****-*****-*****-*****-*****", {
		placeholder : " "
	});
	
	$('[data-toggle=confirmation]').confirmation({
	  rootSelector: '[data-toggle=confirmation]',
	  btnOkLabel: "Sí",
	  btnOkClass: "btn-xs btn-primary",
	  btnCancelClass: "btn-xs btn-default"
	});
});