<!DOCTYPE html>
<html>
  	<head>
		<meta charset="UTF-8">
		<title>Contact Organiser</title>
		<link rel="stylesheet" href="https://build.origami.ft.com/v2/bundles/css?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3,o-forms@^2.0.3" />
		<meta name=viewport content="width=device-width, initial-scale=1">

		<style type="text/css">
		  	body {
				margin:0;
			}
			#content {
				padding: 15px;
			}
			#save, #delete {
				margin: auto;
				padding: 0.5em 0;
				max-width: 400px;
				display: block;
				clear: both;
			}
			#save {
				padding-top: 3em;
			}
			#save input {
				width: 100%;
			}
			#delete input {
				background: #900;
				border-color: #900;
				float: right;
			}
			#saved {
			    transition: opacity 5s;
			}
			#saved.hide {
				opacity: 0;
			}
			label {
				display: block;
			}
			.o-forms-errortext {
				display: none;
			}
			.o-forms--error > .o-forms-errortext {
				display: block;
			}
			.link-all a{
				color: inherit;
				text-decoration: none;
				font-weight: bold;
				font-size: larger;
			}
			.link-all a:hover {
				text-decoration: underline;
			}
			.link-all {
				margin-bottom: 1em;
    			font-size: small;
			}
			h1 {
				text-align: center;
			}
			.last-update {
				background: #333;
				color: #fff;
				display: block;
				text-align: right;
				margin-top: 1em;
				padding: 0.4em 1em;
			}
  		</style>

  		<script type="text/javascript">
  			<!--
  				// Hide the "saved" message after a few seconds
  				document.addEventListener("DOMContentLoaded", function() {
					window.setTimeout(function () {
						var savedmessage = document.querySelector('#saved');
						if (savedmessage) {
							savedmessage.setAttribute("class", savedmessage.getAttribute("class")+" hide");
						}
					}, 5000);

					/**
					 * Check the validity of a field on page load and each time the field changes 
					 **/
					function addChecks(input, group) {
						function checkValidity() {
							if(!input.value) {
								group.setAttribute("class","o-forms-group");
							} else if(input.checkValidity()){
								group.setAttribute("class","o-forms-group o-forms--valid");
							} else {
								group.setAttribute("class","o-forms-group o-forms--error");
							}
						}
						input.addEventListener('change', checkValidity);
						checkValidity();
					}
					var emailinput = document.querySelector('#email');
					addChecks(emailinput, emailinput.parentNode);

					var phoneinput = document.querySelector('#phone');
					addChecks(phoneinput, phoneinput.parentNode);

					var slackinput = document.querySelector('#slack');
					addChecks(slackinput, slackinput.parentNode.parentNode);

					var supportrotainput = document.querySelector('#supportRota');
					addChecks(supportrotainput, supportrotainput.parentNode);
  				});
  			-->
  		</script>
  	</head>
	<body>
		<header data-o-component="o-header" class="o-header o-header--tall">
			<div class="o-header__container">
				<div class="o-header__primary">
					<div class="o-header__primary__left">
						<a href="/" class="o-header__logo o-header__logo--ft">
							<abbr title="Financial Times">FT</abbr>
							<h1 class="o-header__title">Contact Organiser</h1>
						</a>
					</div>
					<div class="o-header__primary__center"><h3 class="o-header__tagline">Organising the Custodians of our Systems</h3>
					</div>
				</div>
			</div>
		</header>
		<div id='content'>
			<form action="{{#_new}}/new{{/_new}}{{^_new}}/contacts/{{contactid}}{{/_new}}" method="post">
				<div class='link-all'><a href="/">&lt;- View all Contacts</a></div>
				<h1>{{#_new}}Add New{{/_new}}{{^_new}}Edit{{/_new}} Contact</h1>
				{{#_saved}}<div class="o-forms-message o-forms-message--highlight" id='saved'>
					<p>Contact data saved</p>
				</div>{{/_saved}}
				<div class="o-forms-wrapper o-forms-wrapper--highlight">
					<div class="o-forms-group">
						<label class="o-forms-label" for="name">Name</label>
						<small class="o-forms-additional-info">Can be a team name or an individual.  Names should be clear to people working outside of your programme.</small>
						<input type="text" name="name" value="{{name}}" placeholder="Name of Contact" class="o-forms-text" id="name" required></input>
					</div>
				</div>
				<div class="o-forms-group">
					<label class="o-forms-label" for="slack">Slack Channel</label>
					<div class="o-forms-affix-wrapper">
						<span class="o-forms-prefix">#</span>
						<input type="text" name="slack" value="{{slack}}" placeholder="teamname-support" class="o-forms-text" id="slack" pattern="[a-z0-9\-_]{1,21}"></input>
					</div>
					<div class="o-forms-errortext">Please enter a valid slack channel</div>
				</div>
				<div class="o-forms-group">
					<label class="o-forms-label" for="email">Email</label>
					<input type="email" name="email" value="{{email}}" placeholder="contact.name@ft.com" class="o-forms-text" id="email"></input>
					<div class="o-forms-errortext">Please enter a valid email address</div>
				</div>
				<div class="o-forms-group">
					<label class="o-forms-label" for="phone">Phone number</label>
					<input type="tel" name="phone" value="{{phone}}" placeholder="0780 1234 5678" class="o-forms-text" id="phone" pattern="\+?[0-9\s\-]+"></input>
					<div class="o-forms-errortext">Please enter a valid phone number</div>
				</div>
				<div class="o-forms-group">
					<label class="o-forms-label" for="supportRota">Support Rota</label><small class="o-forms-additional-info">The URL of your support rota (eg a Google doc).  Make sure the operations teams have permissions to view.</small>
					<input type="url" name="supportRota" value="{{supportRota}}" placeholder="link to spreadsheet" class="o-forms-text" id="supportRota"></input>
					<div class="o-forms-errortext">Please enter a valid URL</div>
				</div>
				<div class="o-forms-group">
					<label class="o-forms-label" for="contactPref">Preferred contact method</label>
					<small class="o-forms-additional-info">How you'd prefer operations to contact you (free text field)</small>
					<input type="text" name="contactPref" value="{{contactPref}}" placeholder="eg Slack 10am-6pm; email out-of-hours" class="o-forms-text" id="contactPref"></input>
				</div>
				<div class="o-forms-group">
					<label class="o-forms-label" for="programme">Programme</label>
						<small class="o-forms-additional-info">Experimental field, may change in future</small>
					<input type="text" name="programme" value="{{programme}}" placeholder="Programme" class="o-forms-text" id="programme"></input>
				</div>

				<div id="save"><input type='submit' class="o-buttons o-buttons--standout save-button" value='Save' /></div>
			</form>
			{{^_new}}<form id="delete" action="/contacts/{{contactid}}/delete" method="post">
				<input type='submit' class="o-buttons o-buttons--standout delete-button" value='Delete' />
			</form>{{/_new}}
		</div>

		{{#lastUpdate}}<div class="last-update">Contact Last Updated: {{lastUpdate}}</div>{{/lastUpdate}}
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3,o-forms@^2.0.3"></script>
	</body>
</html>
