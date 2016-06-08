<!DOCTYPE html>
<html>
  	<head>
		<meta charset="UTF-8">
		<title>Contact Organiser</title>
		<link rel="stylesheet" href="https://build.origami.ft.com/v2/bundles/css?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3" />

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
				display: block;
			    background: #cfc;
			    padding: 0.5em;
			    font-weight: bold;
			    text-align: center;
			    transition: opacity 5s;
			}
			#saved.hidden {
				opacity: 0;
			}
			label {
				display: block;
			}
  		</style>

  		<script type="text/javascript">
  			<!--
  				// Hide the "saved" message after a few seconds
  				document.addEventListener("DOMContentLoaded", function() {
					window.setTimeout(function () {
						var savedmessage = document.querySelector('#saved');
						if (savedmessage) {
							savedmessage.setAttribute("class", "hidden");
						}
					}, 5000);
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
				{{#_saved}}<span id='saved'>Contact data saved</span>{{/_saved}}
				{{#_new}}<label>Contact ID: <input name="contactid" placeholder="contact-name" /> (cannot be changed after setting)</label>{{/_new}}
				<label>Name: <input name="name" value="{{name}}" placeholder="Name of Contact" /></label>
				<label>Slack Channel: #<input name="slack" value="{{slack}}" placeholder="contactname-support"/></label>
				<label>Email: <input name="email" value="{{email}}" placeholder="contact.name@ft.com"/></label>
				<label>Programme: <input name="programme" value="{{programme}}" placeholder="Programme" /></label>

				<div id="save"><input type='submit' class="o-buttons o-buttons--standout save-button" value='Save' /></div>
			</form>
			{{^_new}}<form id="delete" action="/contacts/{{contactid}}/delete" method="post">
				<input type='submit' class="o-buttons o-buttons--standout delete-button" value='Delete' />
			</form>{{/_new}}

		</div>
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3"></script>
	</body>
</html>
