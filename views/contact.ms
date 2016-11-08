<!DOCTYPE html>
<html>
  	{{> _head }}
	<body>
		{{> _header }}
		<div id='content' class="o-grid-container">
			<div class="o-grid-row" data-o-grid-colspan="9">
				<form action="{{localpath}}" method="post">
					<div class='link-all'><a href="/"><i class="o-icons-icon o-icons-icon--arrow-left"></i>View all Contacts</a></div>
					<h1>{{^id}}Add New{{/id}}{{#id}}Edit{{/id}} Contact</h1>
					{{#saved}}<div class="o-forms-message o-forms-message--highlight" id='saved'>
						<p class='success'>Contact data saved succesfully</p>
						<aside data-collapse='true'>
							<h3>How can I automate this action?</h3>
							<div>
								<p>If you're using javascript, use the <a href="https://github.com/Financial-Times/cmdb.js">cmdb.js</a> library as follows:</p>
								<pre>cmdb.putItem({{locals}}, "contact", "{{contactid}}", {{json}});</pre>
								<p>Alternatively, make a HTTP PUT request to <a href="{{url}}">{{url}}</a> with the following body:</p><pre>{{json}}</pre>
								<p>NB: both these methods will require an <a href="https://cmdb-key-manager-prod.herokuapp.com/">API Key</a></p>
							</div>
						</aside>
					</div>{{/saved}}

					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="name">Name</label>
						<small class="o-forms__additional-info">Can be a team name or an individual.  Names should be clear to people working outside of your programme.</small>
						<input type="text" name="name" value="{{name}}" placeholder="Name of Contact" class="o-forms__text" id="name" required></input>
					</div>

					<div class="o-forms-wrapper o-forms-wrapper--highlight">
						<div class="o-forms o-forms--wide {{#iderror}}o-forms--error{{/iderror}}">
							<label class="o-forms__label" for="id">ID</label>
							<small class="o-forms__additional-info">A unique identification for the contact (defaults to name).</small>
							{{#id}}<small class="o-forms__additional-info">Can't be edited after creation.  If incorrect, create a new contact and delete the old one.</small>{{/id}}
							<input type="text" name="id" value="{{id}}" placeholder="{{name}}" default="{{name}}" class="o-forms__text" id="id" {{#id}}disabled{{/id}}></input>
							{{#iderror}}<div class="o-forms-errortext">{{iderror}}</div>{{/iderror}}
						</div>
					</div>

					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="slack">Slack Channel</label>
						<div class="o-forms-affix-wrapper">
							<span class="o-forms-prefix">#</span>
							<input type="text" name="slack" value="{{slack}}" placeholder="teamname-support" class="o-forms__text" id="slack" pattern="[a-z0-9\-_]{1,21}"></input>
						</div>
						<div class="o-forms-errortext">Please enter a valid slack channel</div>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="email">Email</label>
						<input type="email" name="email" value="{{email}}" placeholder="contact.name@ft.com" class="o-forms__text" id="email"></input>
						<div class="o-forms-errortext">Please enter a valid email address</div>
					</div>
					<div cclass="o-forms o-forms--wide">
						<label class="o-forms__label" for="phone">Phone number</label>
						<input type="tel" name="phone" value="{{phone}}" placeholder="0780 1234 5678" class="o-forms__text" id="phone" pattern="\+?[0-9\s\-]+"></input>
						<div class="o-forms-errortext">Please enter a valid phone number</div>
					</div>
					<div cclass="o-forms o-forms--wide">
						<label class="o-forms__label" for="supportRota">Support Rota</label><small class="o-forms__additional-info">The URL of your support rota (eg a Google doc).  Make sure the operations teams have permissions to view.</small>
						<input type="url" name="supportRota" value="{{supportRota}}" placeholder="link to spreadsheet" class="o-forms__text" id="supportRota"></input>
						<div class="o-forms-errortext">Please enter a valid URL</div>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="contactPref">Preferred contact method</label>
						<small class="o-forms__additional-info">How you'd prefer operations to contact you (free text field)</small>
						<input type="text" name="contactPref" value="{{contactPref}}" placeholder="eg Slack 10am-6pm; email out-of-hours" class="o-forms__text" id="contactPref"></input>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="programme">Programme</label>
							<small class="o-forms__additional-info">Experimental field, may change in future</small>
						<input type="text" name="programme" value="{{programme}}" placeholder="Programme" class="o-forms__text" id="programme"></input>
					</div>

					<div id="save"><input type='submit' class="o-buttons o-buttons--standout save-button" value='Save' /></div>
				</form>
			</div>

			{{#id}}
			<div class='o-grid-row' data-o-grid-colspan="9">
				<div class='delete-notice-container'>
					<h2><i class="o-icons-icon o-icons-icon--warning o-icons--big"></i>Delete this record</h2>
					<p><strong>Warning:</strong> this action cannot be undone</p>
					<div>
						<form id="delete" action="{{localpath}}/delete" method="post">
							<input type='submit' class="o-buttons o-buttons--standout delete-button o-buttons--big" value='Delete' />
						</form>
					</div>
				</div>
			</div>
			{{/id}}
		</div>
		{{#lastUpdate}}<div class="last-update">Contact Last Updated: {{lastUpdate}}</div>{{/lastUpdate}}
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-header-services@^1.0.0,o-buttons@^4.0.0,o-forms@^2.0.3,o-grid@^4.2.1"></script>
	</body>
</html>
