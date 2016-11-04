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
			.contactfield {
				display: block;
			}

			/* Ideally this would be 690px, but leave a 15px error margin in case there's a scroll bar */
			@media (min-width: 705px) {
				.contact {
					margin: 14px;
					width: 300px;
					max-width: 100%;
					display: inline-block;
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
			.o-header__logo--ft abbr {
	background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkwIiBoZWlnaHQ9IjM5MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnPgogIDxlbGxpcHNlIHJ5PSI1My41IiByeD0iNTMuNSIgY3k9IjgzLjUiIGN4PSI3NiIgc3R5bGU9ImZpbGw6IHJnYigyNTUsMjQxLDIyNCk7Ii8+CiAgPHBhdGggZD0ibTExLjAwNzUwMywyNjQuOTI2ODY1bDY1LjAwMDAwMSwtMjIzLjAwMDAzMWw2NS4wMDAwMDEsMjIzLjAwMDAzMWwtMTMwLjAwMDAwMiwweiIgc3R5bGU9ImZpbGw6IHJnYigyNTUsMjQxLDIyNCk7Ii8+CiAgPGVsbGlwc2Ugcnk9IjUzLjUiIHJ4PSI1My41IiBjeT0iMTc2LjUiIGN4PSIxOTUiIHN0eWxlPSJmaWxsOiByZ2IoMjU1LDI0MSwyMjQpOyIvPgogIDxwYXRoIGQ9Im0xMzAuMDA3NSwzNTcuOTI2ODZsNjUsLTIyMy4wMDAwM2w2NS4wMDAwMSwyMjMuMDAwMDNsLTEzMC4wMDAwMSwweiIgc3R5bGU9ImZpbGw6IHJnYigyNTUsMjQxLDIyNCk7Ii8+CiAgPGVsbGlwc2Ugcnk9IjUzLjUiIHJ4PSI1My41IiBjeT0iODMuNSIgY3g9IjMxNiIgc3R5bGU9ImZpbGw6IHJnYigyNTUsMjQxLDIyNCk7Ii8+CiAgPHBhdGggZD0ibTI1MS4wMDc1LDI2NC45MjY4Nmw2NSwtMjIzLjAwMDAzbDY1LjAwMDAxLDIyMy4wMDAwM2wtMTMwLjAwMDAxLDB6IiBzdHlsZT0iZmlsbDogcmdiKDI1NSwyNDEsMjI0KTsiLz4KIDwvZz4KPC9zdmc+Cg==);
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

		<form id="filter" action="/" method="get">
			<div class="o-forms-group">
				<div class="o-grid-container">
					<div class="o-grid-row">
						<div data-o-grid-colspan="3">
							<label class="o-forms__label" for="dataItemID">URL</label>
							<input name="dataItemID" value="{{dataItemID}}" class="o-forms__text" id="dataItemID"></input>
						</div>
						<div data-o-grid-colspan="3">
							<label class="o-forms__label" for="name">Name</label>
							<input name="name" value="{{name}}" class="o-forms__text" id="name"></input>
						</div>
						<div data-o-grid-colspan="3">
							<label class="o-forms__label" for="slack">Slack Channel</label>
							<input name="slack" value="{{slack}}" class="o-forms__text" id="slack"></input>
						</div>
						<div data-o-grid-colspan="3">
							<label class="o-forms__label" for="email">Email</label>
							<input name="email" value="{{email}}" class="o-forms__text" id="email"></input>
						</div>
						<div data-o-grid-colspan="3">
							<label class="o-forms__label" for="phone">Phone</label>
							<input name="phone" value="{{phone}}" class="o-forms__text" id="phone"></input>
						</div>
						<div data-o-grid-colspan="3">
							<label class="o-forms__label" for="programme">Programme</label>
							<input name="programme" value="{{programme}}" class="o-forms__text" id="programme"></input>
						</div>
					</div>
				</div>
				<input type='submit' class="o-buttons o-buttons--standout " value='Filter (blanks show whole index) ' />
			</div>
		</form>



		<div id='content'>
			{{#contacts}}
				<div class='contact'>
					<img class='avatar' src="{{avatar}}" />
					<span class='details'>
						<h3><a href="/contacts/{{contactid}}">{{name}}</a></h3>
						{{#slack}}<span class='contactfield'>Slack: <a href="https://financialtimes.slack.com/messages/{{slack}}" target="__blank">#{{slack}}</a></span>{{/slack}}
						{{#email}}<span class='contactfield'>Email: <a href="mailto:{{email}}">{{email}}</a></span>{{/email}}
						{{#phone}}<span class='contactfield'>Phone Number: <a href="tel:{{phone}}">{{phone}}</a></span>{{/phone}}
						{{#supportRota}}<form action="{{supportRota}}" target="_blank"><button class="o-buttons o-buttons--standout o-buttons--small">View Support Rota</button></form>{{/supportRota}}
						{{#contactPref}}<span class='contactfield'>Preferred contact method: {{contactPref}}</span>{{/contactPref}}
						{{#programme}}<span class='contactfield'>Programme: {{programme}}</span>{{/programme}}
					</span>

					<form action="/contacts/{{contactid}}"><input type='submit' class="o-buttons edit-button" value='Edit' /></form>
				</div>
			{{/contacts}}
			<form id='new' action="/new"><input type='submit' class="o-buttons o-buttons--standout" value="Add New Contact"></form>

		</div>
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3"></script>
	</body>
</html>
