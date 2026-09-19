import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

/** Shows a property only for the given resource and operations. */
export function showFor(resource: string, operations: string[]): INodeProperties['displayOptions'] {
	return { show: { resource: [resource], operation: operations } };
}

export function idField(name: string, displayName: string, resource: string, operations: string[]): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor(resource, operations),
		description: `The Church HQ ID (UUID) of the ${displayName.replace(/ ID$/, '').toLowerCase()}`,
	};
}

export function pagingFields(resource: string, operation: string): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			displayOptions: showFor(resource, [operation]),
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: { minValue: 1 },
			default: 50,
			displayOptions: { show: { resource: [resource], operation: [operation], returnAll: [false] } },
			description: 'Max number of results to return',
		},
	];
}

export const RESOURCE_OPTIONS: INodePropertyOptions[] = [
	{ name: 'Attendance', value: 'attendance' },
	{ name: 'Background Check', value: 'backgroundCheck' },
	{ name: 'Donation', value: 'donation' },
	{ name: 'Event', value: 'event' },
	{ name: 'External Link', value: 'externalLink' },
	{ name: 'Form', value: 'form' },
	{ name: 'Household', value: 'household' },
	{ name: 'Inbound Event', value: 'inboundEvent' },
	{ name: 'Message', value: 'message' },
	{ name: 'Person', value: 'person' },
	{ name: 'Smart List', value: 'smartList' },
	{ name: 'Sync Job', value: 'syncJob' },
	{ name: 'Task', value: 'task' },
];

function operations(resource: string, options: INodePropertyOptions[], defaultValue: string): INodeProperties {
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options,
		default: defaultValue,
	};
}

const PERSON_FIELDS: INodeProperties[] = [
	{ displayName: 'Address Line 1', name: 'address_line_1', type: 'string', default: '' },
	{ displayName: 'Address Line 2', name: 'address_line_2', type: 'string', default: '' },
	{ displayName: 'Baptism Date', name: 'baptism_date', type: 'string', default: '', placeholder: 'YYYY-MM-DD' },
	{ displayName: 'Baptized', name: 'baptized', type: 'boolean', default: false },
	{ displayName: 'Birthday', name: 'birthday', type: 'string', default: '', placeholder: 'YYYY-MM-DD' },
	{ displayName: 'City', name: 'locality', type: 'string', default: '' },
	{ displayName: 'Country', name: 'country', type: 'string', default: '', placeholder: 'US' },
	{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '' },
	{ displayName: 'First Name', name: 'first_name', type: 'string', default: '' },
	{ displayName: 'Gender', name: 'gender', type: 'string', default: '' },
	{ displayName: 'Household ID', name: 'household_id', type: 'string', default: '' },
	{
		displayName: 'Household Role',
		name: 'household_role',
		type: 'options',
		options: [
			{ name: 'Child', value: 'child' },
			{ name: 'Head', value: 'head' },
			{ name: 'Other', value: 'other' },
			{ name: 'Other Adult', value: 'other_adult' },
			{ name: 'Spouse', value: 'spouse' },
		],
		default: 'other',
	},
	{ displayName: 'Last Name', name: 'last_name', type: 'string', default: '' },
	{
		displayName: 'Membership Status',
		name: 'membership_status',
		type: 'options',
		options: [
			{ name: 'Visitor', value: 'visitor' },
			{ name: 'Member', value: 'member' },
			{ name: 'Inactive', value: 'inactive' },
		],
		default: 'visitor',
	},
	{ displayName: 'Middle Name', name: 'middle_name', type: 'string', default: '' },
	{ displayName: 'Mobile Phone', name: 'mobile_phone', type: 'string', default: '', placeholder: '+15551234567' },
	{ displayName: 'Postal Code', name: 'postal_code', type: 'string', default: '' },
	{ displayName: 'Preferred Name', name: 'preferred_name', type: 'string', default: '' },
	{ displayName: 'Primary Campus ID', name: 'primary_campus_id', type: 'string', default: '' },
	{ displayName: 'Salvation Date', name: 'salvation_date', type: 'string', default: '', placeholder: 'YYYY-MM-DD' },
	{ displayName: 'State or Region', name: 'region', type: 'string', default: '' },
];

const HOUSEHOLD_FIELDS: INodeProperties[] = [
	{ displayName: 'Address Line 1', name: 'address_line_1', type: 'string', default: '' },
	{ displayName: 'Address Line 2', name: 'address_line_2', type: 'string', default: '' },
	{ displayName: 'City', name: 'locality', type: 'string', default: '' },
	{ displayName: 'Country', name: 'country', type: 'string', default: '' },
	{ displayName: 'Name', name: 'name', type: 'string', default: '' },
	{ displayName: 'Postal Code', name: 'postal_code', type: 'string', default: '' },
	{ displayName: 'Primary Campus ID', name: 'primary_campus_id', type: 'string', default: '' },
	{ displayName: 'State or Region', name: 'region', type: 'string', default: '' },
];

export const PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: RESOURCE_OPTIONS,
		default: 'person',
	},

	// Person
	operations(
		'person',
		[
			{ name: 'Add Tag', value: 'addTag', action: 'Add a tag to a person' },
			{ name: 'Create', value: 'create', action: 'Create a person' },
			{ name: 'Get', value: 'get', action: 'Get a person' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many people' },
			{ name: 'Get Tags', value: 'getTags', action: 'Get a person s tags' },
			{ name: 'Remove Tag', value: 'removeTag', action: 'Remove a tag from a person' },
			{ name: 'Update', value: 'update', action: 'Update a person' },
		],
		'create',
	),
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor('person', ['create']),
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor('person', ['create']),
	},
	{
		displayName: 'If a Duplicate Is Found',
		name: 'onDuplicate',
		type: 'options',
		options: [
			{ name: 'Stop With an Error', value: 'reject' },
			{ name: 'Create Anyway', value: 'create' },
		],
		default: 'reject',
		displayOptions: showFor('person', ['create']),
		description:
			'What to do when Church HQ finds a person with the same name and the same email, phone or birthday',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor('person', ['create']),
		options: PERSON_FIELDS.filter((field) => field.name !== 'first_name' && field.name !== 'last_name'),
	},
	idField('personId', 'Person ID', 'person', ['get', 'update', 'addTag', 'removeTag', 'getTags']),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor('person', ['update']),
		options: PERSON_FIELDS,
	},
	{
		displayName: 'Tag',
		name: 'tag',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor('person', ['addTag', 'removeTag']),
	},
	...pagingFields('person', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: showFor('person', ['getAll']),
		options: [
			{ displayName: 'Include Archived', name: 'include_archived', type: 'boolean', default: false },
			{ displayName: 'Search', name: 'search', type: 'string', default: '', description: 'Matches name or email' },
			{
				displayName: 'Updated Since',
				name: 'updated_since',
				type: 'dateTime',
				default: '',
				description: 'Only people changed after this time, oldest change first (for syncing)',
			},
		],
	},

	// Household
	operations(
		'household',
		[
			{ name: 'Create', value: 'create', action: 'Create a household' },
			{ name: 'Get', value: 'get', action: 'Get a household with its members' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many households' },
			{ name: 'Update', value: 'update', action: 'Update a household' },
		],
		'create',
	),
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor('household', ['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor('household', ['create']),
		options: HOUSEHOLD_FIELDS.filter((field) => field.name !== 'name'),
	},
	idField('householdId', 'Household ID', 'household', ['get', 'update']),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor('household', ['update']),
		options: HOUSEHOLD_FIELDS,
	},
	...pagingFields('household', 'getAll'),
	{
		displayName: 'Updated Since',
		name: 'updatedSince',
		type: 'dateTime',
		default: '',
		displayOptions: showFor('household', ['getAll']),
	},

	// Task
	operations(
		'task',
		[
			{ name: 'Complete', value: 'complete', action: 'Complete a task' },
			{ name: 'Create', value: 'create', action: 'Create a task' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many tasks' },
		],
		'create',
	),
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor('task', ['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor('task', ['create']),
		options: [
			{ displayName: 'Assigned To (Staff Membership ID)', name: 'assigned_to_membership_id', type: 'string', default: '' },
			{ displayName: 'Description', name: 'description', type: 'string', default: '' },
			{ displayName: 'Due Date', name: 'due_date', type: 'string', default: '', placeholder: 'YYYY-MM-DD' },
			{ displayName: 'Related Person ID', name: 'related_person_id', type: 'string', default: '' },
		],
	},
	idField('taskId', 'Task ID', 'task', ['complete']),
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'Open', value: 'open' },
			{ name: 'Completed', value: 'completed' },
			{ name: 'All', value: 'all' },
		],
		default: 'open',
		displayOptions: showFor('task', ['getAll']),
	},

	// Event and attendance
	operations(
		'event',
		[
			{ name: 'Get', value: 'get', action: 'Get an event' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many events' },
		],
		'getAll',
	),
	idField('eventId', 'Event ID', 'event', ['get']),
	...pagingFields('event', 'getAll'),
	{
		displayName: 'Starting From',
		name: 'from',
		type: 'dateTime',
		default: '',
		displayOptions: showFor('event', ['getAll']),
	},
	{
		displayName: 'Starting Before',
		name: 'to',
		type: 'dateTime',
		default: '',
		displayOptions: showFor('event', ['getAll']),
	},
	operations(
		'attendance',
		[
			{ name: 'Get Many', value: 'getAll', action: 'Get attendance records' },
			{ name: 'Record', value: 'create', action: 'Record a headcount' },
		],
		'create',
	),
	idField('campusId', 'Campus ID', 'attendance', ['create']),
	{
		displayName: 'Date',
		name: 'attendanceDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD',
		displayOptions: showFor('attendance', ['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor('attendance', ['create']),
		options: [
			{ displayName: 'Adults', name: 'adult_headcount', type: 'number', default: 0 },
			{ displayName: 'Baptisms', name: 'baptisms_count', type: 'number', default: 0 },
			{ displayName: 'Event ID', name: 'event_id', type: 'string', default: '' },
			{ displayName: 'Kids', name: 'kids_headcount', type: 'number', default: 0 },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '' },
			{ displayName: 'Salvations', name: 'salvations_count', type: 'number', default: 0 },
			{ displayName: 'Total', name: 'total_headcount', type: 'number', default: 0 },
		],
	},
	...pagingFields('attendance', 'getAll'),
	{
		displayName: 'From Date',
		name: 'fromDate',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		displayOptions: showFor('attendance', ['getAll']),
	},
	{
		displayName: 'To Date',
		name: 'toDate',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		displayOptions: showFor('attendance', ['getAll']),
	},

	// Forms and Smart Lists
	operations(
		'form',
		[
			{ name: 'Get Many', value: 'getAll', action: 'Get many forms' },
			{ name: 'Get Submissions', value: 'getSubmissions', action: 'Get a form s submissions' },
		],
		'getSubmissions',
	),
	idField('formId', 'Form ID', 'form', ['getSubmissions']),
	...pagingFields('form', 'getSubmissions'),
	{
		displayName: 'Submitted Since',
		name: 'submittedSince',
		type: 'dateTime',
		default: '',
		displayOptions: showFor('form', ['getSubmissions']),
	},
	operations(
		'smartList',
		[
			{ name: 'Get Many', value: 'getAll', action: 'Get many smart lists' },
			{ name: 'Get Members', value: 'getMembers', action: 'Get a smart list s members' },
		],
		'getMembers',
	),
	idField('smartListId', 'Smart List ID', 'smartList', ['getMembers']),
	...pagingFields('smartList', 'getMembers'),

	// Messages
	operations('message', [{ name: 'Send', value: 'send', action: 'Send a message' }], 'send'),
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'options',
		options: [
			{ name: 'Email', value: 'email' },
			{ name: 'SMS', value: 'sms' },
		],
		default: 'email',
		displayOptions: showFor('message', ['send']),
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['message'], operation: ['send'], channel: ['email'] } },
	},
	{
		displayName: 'Body',
		name: 'body',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		displayOptions: showFor('message', ['send']),
		description: 'Merge fields such as {{first_name}} work exactly as in Church HQ Messaging',
	},
	{
		displayName: 'Audiences',
		name: 'audiences',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Audience',
		default: {},
		displayOptions: showFor('message', ['send']),
		options: [
			{
				displayName: 'Audience',
				name: 'audience',
				values: [
					{
						displayName: 'Type',
						name: 'audience_type',
						type: 'options',
						options: [
							{ name: 'Campus', value: 'campus' },
							{ name: 'Person', value: 'individual' },
							{ name: 'Smart List', value: 'smart_list' },
							{ name: 'Team', value: 'team' },
						],
						default: 'individual',
					},
					{ displayName: 'ID', name: 'reference_id', type: 'string', default: '' },
				],
			},
		],
	},

	// Donations
	operations('donation', [{ name: 'Get Many', value: 'getAll', action: 'Get many donations' }], 'getAll'),
	...pagingFields('donation', 'getAll'),
	{
		displayName: 'Given Since',
		name: 'givenSince',
		type: 'dateTime',
		default: '',
		displayOptions: showFor('donation', ['getAll']),
	},

	// Background checks
	operations(
		'backgroundCheck',
		[
			{ name: 'Get for Person', value: 'getForPerson', action: 'Get a person s background checks' },
			{ name: 'Record', value: 'create', action: 'Record a background check result' },
		],
		'create',
	),
	idField('personId', 'Person ID', 'backgroundCheck', ['create', 'getForPerson']),
	{
		displayName: 'Provider',
		name: 'provider',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MinistrySafe',
		displayOptions: showFor('backgroundCheck', ['create']),
	},
	{
		displayName: 'Status',
		name: 'checkStatus',
		type: 'options',
		options: [
			{ name: 'Clear', value: 'clear' },
			{ name: 'Consider', value: 'consider' },
			{ name: 'Expired', value: 'expired' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Suspended', value: 'suspended' },
		],
		default: 'pending',
		displayOptions: showFor('backgroundCheck', ['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showFor('backgroundCheck', ['create']),
		options: [
			{ displayName: 'Completed At', name: 'completed_at', type: 'dateTime', default: '' },
			{ displayName: 'Expires At', name: 'expires_at', type: 'dateTime', default: '' },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '' },
			{
				displayName: 'Report Reference',
				name: 'report_reference',
				type: 'string',
				default: '',
				description: "The provider's own report ID. Sending the same reference again updates that record.",
			},
		],
	},

	// Inbound events (Church HQ's "Outside system sends an event" workflow trigger)
	operations('inboundEvent', [{ name: 'Send', value: 'send', action: 'Start church hq workflows with an event' }], 'send'),
	{
		displayName: 'Event Name',
		name: 'eventName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'n8n.new_signup',
		displayOptions: showFor('inboundEvent', ['send']),
		description: 'Church HQ workflows listening for this event name will run',
	},
	{
		displayName: 'Data (JSON)',
		name: 'data',
		type: 'json',
		default: '{}',
		displayOptions: showFor('inboundEvent', ['send']),
	},
	{
		displayName: 'Person ID',
		name: 'relatedPersonId',
		type: 'string',
		default: '',
		displayOptions: showFor('inboundEvent', ['send']),
	},

	// Sync pattern
	operations(
		'externalLink',
		[
			{ name: 'Delete', value: 'delete', action: 'Delete an external link' },
			{ name: 'Find', value: 'find', action: 'Find external links' },
			{ name: 'Create or Update', value: 'upsert', action: 'Link a church hq record to an external record' },
		],
		'upsert',
	),
	{
		displayName: 'External System',
		name: 'externalSystem',
		type: 'string',
		default: '',
		placeholder: 'mailchimp',
		displayOptions: showFor('externalLink', ['upsert', 'find']),
	},
	{
		displayName: 'Record Type',
		name: 'localTable',
		type: 'options',
		options: [
			{ name: 'Background Check', value: 'background_checks' },
			{ name: 'Donation', value: 'donations' },
			{ name: 'Event', value: 'events' },
			{ name: 'Form', value: 'forms' },
			{ name: 'Form Submission', value: 'form_submissions' },
			{ name: 'Household', value: 'households' },
			{ name: 'Person', value: 'people' },
			{ name: 'Task', value: 'tasks' },
		],
		default: 'people',
		displayOptions: showFor('externalLink', ['upsert', 'find']),
	},
	{
		displayName: 'Church HQ Record ID',
		name: 'localRecordId',
		type: 'string',
		default: '',
		displayOptions: showFor('externalLink', ['upsert', 'find']),
	},
	{
		displayName: 'External Record ID',
		name: 'externalRecordId',
		type: 'string',
		default: '',
		displayOptions: showFor('externalLink', ['upsert', 'find']),
	},
	idField('linkId', 'Link ID', 'externalLink', ['delete']),
	operations(
		'syncJob',
		[
			{ name: 'Finish', value: 'finish', action: 'Finish a sync job' },
			{ name: 'Record Events', value: 'recordEvents', action: 'Record sync events' },
			{ name: 'Start', value: 'start', action: 'Start a sync job' },
		],
		'start',
	),
	{
		displayName: 'External System',
		name: 'externalSystem',
		type: 'string',
		required: true,
		default: '',
		displayOptions: showFor('syncJob', ['start']),
	},
	{
		displayName: 'Job Type',
		name: 'jobType',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'people_export',
		displayOptions: showFor('syncJob', ['start']),
	},
	idField('syncJobId', 'Sync Job ID', 'syncJob', ['recordEvents', 'finish']),
	{
		displayName: 'Events (JSON)',
		name: 'events',
		type: 'json',
		default: '[{"action": "created", "local_record_id": "", "external_record_id": ""}]',
		displayOptions: showFor('syncJob', ['recordEvents']),
		description: 'Up to 500 of {action: created|updated|skipped|failed, local_record_id, external_record_id, detail}',
	},
	{
		displayName: 'Result',
		name: 'jobStatus',
		type: 'options',
		options: [
			{ name: 'Completed', value: 'completed' },
			{ name: 'Failed', value: 'failed' },
		],
		default: 'completed',
		displayOptions: showFor('syncJob', ['finish']),
	},
	{
		displayName: 'Summary (JSON)',
		name: 'summary',
		type: 'json',
		default: '{}',
		displayOptions: showFor('syncJob', ['finish']),
	},
	{
		displayName: 'Error Detail',
		name: 'errorDetail',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['syncJob'], operation: ['finish'], jobStatus: ['failed'] } },
	},
];
