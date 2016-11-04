<!DOCTYPE html>
<html>
  	{{> _head }}
	<body>
		{{> _header }}
		<div id='content' class="o-grid-container">
			<form id="filter" action="/" method="get">
				<div class="o-forms-group">
					<div class="o-grid-container">
						<div class="o-grid-row">
							<div data-o-grid-colspan="3">
								<label class="o-forms-label" for="dataItemID">URL</label>
								<input name="dataItemID" value="{{dataItemID}}" class="o-forms-text" id="dataItemID"></input>
							</div>
							<div data-o-grid-colspan="3">
								<label class="o-forms-label" for="name">Name</label>
								<input name="name" value="{{name}}" class="o-forms-text" id="name"></input>
							</div>
							<div data-o-grid-colspan="3">
								<label class="o-forms-label" for="slack">Slack Channel</label>
								<input name="slack" value="{{slack}}" class="o-forms-text" id="slack"></input>
							</div>
							<div data-o-grid-colspan="3">
								<label class="o-forms-label" for="email">Email</label>
								<input name="email" value="{{email}}" class="o-forms-text" id="email"></input>
							</div>
							<div data-o-grid-colspan="3">
								<label class="o-forms-label" for="phone">Phone</label>
								<input name="phone" value="{{phone}}" class="o-forms-text" id="phone"></input>
							</div>
							<div data-o-grid-colspan="3">
								<label class="o-forms-label" for="programme">Programme</label>
								<input name="programme" value="{{programme}}" class="o-forms-text" id="programme"></input>
							</div>
						</div>
					</div>
					<input type='submit' class="o-buttons o-buttons--standout " value='Filter (blanks show whole index) ' />
				</div>
			</form>

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
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-header-services@^1.0.0,o-buttons@^4.0.0,o-forms@^2.0.3,o-grid@^4.2.1"></script>
	</body>
</html>
