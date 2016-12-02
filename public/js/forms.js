document.addEventListener("DOMContentLoaded", function() {
	var savedmessagetitle = document.querySelector('#saved h3');
	if (savedmessagetitle) savedmessagetitle.addEventListener('click', function () {
		savedmessagetitle.parentNode.dataset.collapse = savedmessagetitle.parentNode.dataset.collapse != "true";
	});

	/**
	 * Check the validity of a field on page load and each time the field changes 
	 **/
	function addChecks(input, group) {
		function checkValidity() {
			var classes = group.getAttribute("class") == null ? "" : group.getAttribute("class");
			if(!input.value) {
				group.setAttribute("class", classes);
			} else if(input.checkValidity()){
				group.setAttribute("class", classes + " o-forms--valid");
			} else {
				group.setAttribute("class", classes + " o-forms--error");
			}
		}
		input.addEventListener('change', checkValidity);
		checkValidity();
	}

	var nameinput = document.querySelector('#name');
	addChecks(nameinput, nameinput.parentNode);

	var emailinput = document.querySelector('#email');
	addChecks(emailinput, emailinput.parentNode);

	var phoneinput = document.querySelector('#phone');
	addChecks(phoneinput, phoneinput.parentNode);

	var slackinput = document.querySelector('#slack');
	addChecks(slackinput, slackinput.parentNode.parentNode);

	var supportrotainput = document.querySelector('#supportRota');
	addChecks(supportrotainput, supportrotainput.parentNode);
});
