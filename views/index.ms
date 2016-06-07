<!DOCTYPE html>
<html>
  	<head>
		<meta charset="UTF-8">
		<title>Team Organiser</title>
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
			}
			.team {
				margin: 1em auto;
				border: 1px solid #ccc;
    			padding: 0 14px 2em;
    			display: block;
			}
			@media (min-width: 750px) {
				.team {
					margin: 15px;
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
  		</style>

  	</head>
	<body>
		<header data-o-component="o-header" class="o-header o-header--tall">
			<div class="o-header__container">
				<div class="o-header__primary">
					<div class="o-header__primary__left">
						<a href="/" class="o-header__logo o-header__logo--ft">
							<abbr title="Financial Times">FT</abbr>
							<h1 class="o-header__title">Team Organiser</h1>
						</a>
					</div>
					<div class="o-header__primary__center"><h3 class="o-header__tagline">Organising the Custodians of our Systems</h3>
					</div>
				</div>
			</div>
		</header>
		<div id='content'>
			{{#teams}}
				<div class='team'>
					<h3>{{name}}</h3>
					Slack: #{{slack}}<br/>
					Email: {{email}}<br/>
					{{#programme}}Programme: {{programme}}{{/programme}}

					<form action="/teams/{{teamid}}"><input type='submit' class="o-buttons edit-button" value='Edit' /></form>
				</div>
			{{/teams}}
			<form id='new' action="/new"><input type='submit' class="o-buttons o-buttons--standout" value="Add New Team"></form>

		</div>
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-header@^4.0.0,o-table@^3.0.1,o-buttons@^3.0.3"></script>
	</body>
</html>
