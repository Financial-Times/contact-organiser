<!DOCTYPE html>
<html>
  	<head>
		<meta charset="UTF-8">
		<title>Contact Organiser</title>
		<meta name=viewport content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="https://build.origami.ft.com/v2/bundles/css?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3" />

		<style type="text/css">
		  	body {
				margin:0;
			}
			#content {
				padding: 15px;
			}
			.edit-button {
				float: right;
				clear: both;
				margin: 5px;
			}
			.contact {
				margin: 1em auto;
				border: 1px solid #ccc;
    			display: block;
    			overflow: hidden;
			}

			/* Ideally this would be 690px, but leave a 15px error margin in case there's a scroll bar */
			@media (min-width: 705px) {
				.contact {
					margin: 14px;
					width: 300px;
					max-width: 100%;
					float: left;
				}
			}
			#new {
				margin: auto;
				padding: 3em 0;
				max-width: 400px;
				display: block;
				clear: both;
			}
			#new input {
				width: 100%;
			}
			.avatar {
				float: right;
				width: 40px;
				margin: 5px;
			}
			.details {
				margin: 0 14px 2em;
				display: block;
			}
			h3 > a {
				color: inherit;
				text-decoration: inherit;
			}
  		</style>

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
			{{#contacts}}
				<div class='contact'>
					<img class='avatar' src="{{avatar}}" />
					<span class='details'>
						<h3><a href="/contacts/{{contactid}}">{{name}}</a></h3>
						{{#slack}}Slack: <a href="https://financialtimes.slack.com/messages/{{slack}}" target="__blank">#{{slack}}</a>{{/slack}}<br/>
						{{#email}}Email: <a href="mailto:{{email}}">{{email}}</a>{{/email}}<br/>
						{{#phone}}Phone Number: <a href="tel:{{phone}}">{{phone}}</a>{{/phone}}<br/>
						{{#contactPref}}Preferred contact method: {{contactPref}}{{/contactPref}}
						<br/>
						{{#programme}}Programme: {{programme}}{{/programme}}
					</span>

					<form action="/contacts/{{contactid}}"><input type='submit' class="o-buttons edit-button" value='Edit' /></form>
				</div>
			{{/contacts}}
			<form id='new' action="/new"><input type='submit' class="o-buttons o-buttons--standout" value="Add New Contact"></form>

		</div>
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3"></script>
	</body>
</html>
