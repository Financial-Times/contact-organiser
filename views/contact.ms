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
					{{#saved}}
					<div class="o-forms-message o-forms-message--highlight" id='saved'>
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
					</div>
					{{/saved}}

					<div class="o-forms o-forms--wide {{#dependerror}}o-forms--error{{/dependerror}}">
						<label class="o-forms__label o-forms__label--required" for="name">Name</label>
						<small class="o-forms__additional-info">Can be a team name or an individual.  Names should be clear to people working outside of your programme.</small>
						<input type="text" name="name" value="{{name}}" placeholder="Name of Contact" class="o-forms__text" id="name" required></input>
						{{#dependerror}}<div class="o-forms__errortext">{{dependerror}}</div>{{/dependerror}}
					</div>

					<div class="o-forms--wide o-forms__wrapper o-forms__wrapper--highlight">
						<div class="o-forms o-forms--wide {{#iderror}}o-forms--error{{/iderror}}">
							<label class="o-forms__label" for="id">ID</label>
							<small class="o-forms__additional-info">A unique identification for the contact (defaults to name).</small>
							{{#id}}{{^iderror}}<small class="o-forms__additional-info">Can't be edited after creation.  If incorrect, create a new contact and delete the old one.</small>{{/iderror}}{{/id}}
							<input type="text" name="id" value="{{id}}" placeholder="{{name}}" default="{{name}}" class="o-forms__text" id="id" {{#id}}{{^iderror}}disabled{{/iderror}}{{/id}}></input>
							{{#iderror}}<div class="o-forms__errortext">{{iderror}}</div>{{/iderror}}
						</div>
					</div>

					<div class="o-forms o-forms--wide">
						<label class="o-forms__label o-forms__label--required" for="contactType">Contact Type</label>
						<small class="o-forms__additional-info">Is this a person, team, company or programme?</small>
						<select class="o-forms__select" id="contactType" name="contactType" data-bind="contactType">
							{{#ctypeList}}<option value="{{value}}" default="Team" {{#selected}}selected{{/selected}}>{{name}}</option>{{/ctypeList}}
						</select>
					</div>

					<div class="o-forms o-forms--wide">
						<label class="o-forms__label o-forms__label--required" for="status">Status</label>
						<small class="o-forms__additional-info">Is this contact type active or retired/left the company?</small>
						<select class="o-forms__select" id="status" name="status" data-bind="status">
							{{#statusList}}<option value="{{value}}" default="Active" {{#selected}}selected{{/selected}}>{{name}}</option>{{/statusList}}
						</select>
					</div>

					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="slack">Slack Channel</label>
						<div class="o-forms-affix-wrapper">
							<span class="o-forms-prefix">#</span>
							<input type="text" name="slack" value="{{slack}}" placeholder="teamname-support" class="o-forms__text" id="slack" pattern="[a-z0-9\-_]{1,21}"></input>
							<div class="o-forms__errortext">Slack channel names are limited to 21 lowercase alphanumeric characters or hyphens.</div>
						</div>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="email">Email</label>
						<input type="email" name="email" value="{{email}}" placeholder="contact.name@ft.com" class="o-forms__text" id="email"></input>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="phone">Phone number</label>
						<input type="tel" name="phone" value="{{phone}}" placeholder="0780 1234 5678" class="o-forms__text" id="phone" pattern="\+?[0-9\s\-]+"></input>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="supportRota">Support Rota</label>
						<small class="o-forms__additional-info">The URL of your support rota (eg a Google doc).  Make sure the operations teams have permissions to view.</small>
						<input type="url" name="supportRota" value="{{supportRota}}" placeholder="link to spreadsheet" class="o-forms__text" id="supportRota"></input>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="contactPref">Preferred contact method</label>
						<small class="o-forms__additional-info">How you'd prefer operations to contact you (free text field)</small>
						<input type="text" name="contactPref" value="{{contactPref}}" placeholder="eg Slack 10am-6pm; email out-of-hours" class="o-forms__text" id="contactPref"></input>
					</div>
					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="programme">Programme</label>
						<small class="o-forms__additional-info">The programme this contacted is associated with, or Undefined.</small>
						<select class="o-forms__select" id="programme" name="programme" data-bind="programme">
							{{#programmeList}}<option value="{{value}}" default="Undefined" {{#selected}}selected{{/selected}}>{{name}}</option>{{/programmeList}}
						</select>
					</div>

					<div class="o-forms o-forms--wide">
						<label class="o-forms__label" for="programme">Related Items({{relationships.length}})</label>
						{{#relationships}}
						<div class="o-grid-container">
							<div class="o-grid-row">
								<div data-o-grid-colspan="3">
									{{reltype}}
								</div>
								<div data-o-grid-colspan="3">
									{{#relitemlink}}<a href="{{relitemlink}}">{{/relitemlink}}{{relitem}}{{#relitemlink}}</a>{{/relitemlink}}
								</div>
							</div>
						</div>
						{{/relationships}}
						{{^relationships}}<div class="empty">This contact is not being referenced</div>{{/relationships}}
					</div>


					{{#lastUpdate}}<div class="last-update">Contact Last Updated: {{lastUpdate}}</div>{{/lastUpdate}}

					<div id="save"><input type='submit' class="o-buttons o-buttons--standout save-button" value='Save' /></div>
				</form>
			</div>

			{{#id}}
			{{^relationships}}
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
			{{/relationships}}
			{{/id}}
		</div>
		<script src="https://build.origami.ft.com/v2/bundles/js?modules=o-labels@^2.0.0,o-table@^5.0.0,o-header-services@^1.0.0,o-buttons@^4.0.0,o-forms@^2.0.3,o-grid@^4.2.1,o-icons@^v5.1.3"></script>
	</body>
</html>
