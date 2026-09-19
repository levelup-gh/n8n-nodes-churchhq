import type { IDataObject, IHttpRequestMethods } from 'n8n-workflow';

/** One Church HQ API call, described without performing it (so it can be unit-tested). */
export interface ApiCall {
	method: IHttpRequestMethods;
	path: string;
	body?: IDataObject | IDataObject[];
	qs?: IDataObject;
	/** A list endpoint: follow limit/offset paging and return one n8n item per record. */
	paged?: boolean;
	/** A list endpoint without paging: return one n8n item per record. */
	list?: boolean;
}

export type ParameterReader = (name: string, fallback?: unknown) => unknown;

/** Raises a user-facing error; the node passes one that throws NodeOperationError. */
export type Fail = (message: string) => never;

/** Drops empty strings and nulls so an unset optional field is simply not sent. */
export function compact(fields: Record<string, unknown>): IDataObject {
	return Object.fromEntries(
		Object.entries(fields).filter(([, value]) => value !== '' && value !== null && value !== undefined),
	) as IDataObject;
}

function parseJson(value: unknown, field: string, fail: Fail): unknown {
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		return fail(`${field} is not valid JSON`);
	}
}

const encode = (value: unknown) => encodeURIComponent(String(value));

export function resolveOperation(resource: string, operation: string, parameter: ParameterReader, fail: Fail): ApiCall {
	const key = `${resource}.${operation}`;
	switch (key) {
		case 'person.create':
			return {
				method: 'POST',
				path: '/people',
				body: compact({
					first_name: parameter('firstName'),
					last_name: parameter('lastName'),
					on_duplicate: parameter('onDuplicate', 'reject'),
					...(parameter('additionalFields', {}) as IDataObject),
				}),
			};
		case 'person.get':
			return { method: 'GET', path: `/people/${encode(parameter('personId'))}` };
		case 'person.getAll':
			return { method: 'GET', path: '/people', qs: compact(parameter('filters', {}) as IDataObject), paged: true };
		case 'person.update':
			return { method: 'PATCH', path: `/people/${encode(parameter('personId'))}`, body: compact(parameter('updateFields', {}) as IDataObject) };
		case 'person.getTags':
			return { method: 'GET', path: `/people/${encode(parameter('personId'))}/tags`, list: true };
		case 'person.addTag':
			return { method: 'POST', path: `/people/${encode(parameter('personId'))}/tags`, body: { tag: parameter('tag') as string } };
		case 'person.removeTag':
			return { method: 'DELETE', path: `/people/${encode(parameter('personId'))}/tags/${encode(parameter('tag'))}` };

		case 'household.create':
			return {
				method: 'POST',
				path: '/households',
				body: compact({ name: parameter('name'), ...(parameter('additionalFields', {}) as IDataObject) }),
			};
		case 'household.get':
			return { method: 'GET', path: `/households/${encode(parameter('householdId'))}` };
		case 'household.getAll':
			return { method: 'GET', path: '/households', qs: compact({ updated_since: parameter('updatedSince', '') }), paged: true };
		case 'household.update':
			return {
				method: 'PATCH',
				path: `/households/${encode(parameter('householdId'))}`,
				body: compact(parameter('updateFields', {}) as IDataObject),
			};

		case 'task.create':
			return {
				method: 'POST',
				path: '/tasks',
				body: compact({ title: parameter('title'), ...(parameter('additionalFields', {}) as IDataObject) }),
			};
		case 'task.complete':
			return { method: 'POST', path: `/tasks/${encode(parameter('taskId'))}/complete` };
		case 'task.getAll':
			return { method: 'GET', path: '/tasks', qs: { status: parameter('status', 'open') as string }, list: true };

		case 'event.get':
			return { method: 'GET', path: `/events/${encode(parameter('eventId'))}` };
		case 'event.getAll':
			return { method: 'GET', path: '/events', qs: compact({ from: parameter('from', ''), to: parameter('to', '') }), paged: true };

		case 'attendance.create':
			return {
				method: 'POST',
				path: '/attendance',
				body: compact({
					campus_id: parameter('campusId'),
					attendance_date: parameter('attendanceDate'),
					...(parameter('additionalFields', {}) as IDataObject),
				}),
			};
		case 'attendance.getAll':
			return {
				method: 'GET',
				path: '/attendance',
				qs: compact({ from: parameter('fromDate', ''), to: parameter('toDate', '') }),
				paged: true,
			};

		case 'form.getAll':
			return { method: 'GET', path: '/forms', list: true };
		case 'form.getSubmissions':
			return {
				method: 'GET',
				path: `/forms/${encode(parameter('formId'))}/submissions`,
				qs: compact({ submitted_since: parameter('submittedSince', '') }),
				paged: true,
			};

		case 'smartList.getAll':
			return { method: 'GET', path: '/smart-lists', list: true };
		case 'smartList.getMembers':
			return { method: 'GET', path: `/smart-lists/${encode(parameter('smartListId'))}/members`, paged: true };

		case 'message.send': {
			const audiences = ((parameter('audiences', {}) as IDataObject).audience as IDataObject[] | undefined) ?? [];
			return {
				method: 'POST',
				path: '/messages',
				body: compact({
					channel: parameter('channel'),
					subject: parameter('channel') === 'email' ? parameter('subject', '') : '',
					body: parameter('body'),
					audiences: audiences.map((audience) => ({ audience_type: audience.audience_type, reference_id: audience.reference_id })),
				}),
			};
		}

		case 'donation.getAll':
			return { method: 'GET', path: '/donations', qs: compact({ given_since: parameter('givenSince', '') }), paged: true };

		case 'backgroundCheck.create':
			return {
				method: 'POST',
				path: '/background-checks',
				body: compact({
					person_id: parameter('personId'),
					provider: parameter('provider'),
					status: parameter('checkStatus'),
					...(parameter('additionalFields', {}) as IDataObject),
				}),
			};
		case 'backgroundCheck.getForPerson':
			return { method: 'GET', path: `/people/${encode(parameter('personId'))}/background-checks`, list: true };

		case 'inboundEvent.send':
			return {
				method: 'POST',
				path: '/inbound-events',
				body: compact({
					event_name: parameter('eventName'),
					data: parseJson(parameter('data', '{}'), 'Data', fail) as IDataObject,
					person_id: parameter('relatedPersonId', ''),
				}),
			};

		case 'externalLink.upsert':
			return {
				method: 'POST',
				path: '/external-links',
				body: {
					local_table: parameter('localTable') as string,
					local_record_id: parameter('localRecordId') as string,
					external_system: parameter('externalSystem') as string,
					external_record_id: parameter('externalRecordId') as string,
				},
			};
		case 'externalLink.find':
			return {
				method: 'GET',
				path: '/external-links',
				qs: compact({
					external_system: parameter('externalSystem', ''),
					local_table: parameter('localTable', ''),
					local_record_id: parameter('localRecordId', ''),
					external_record_id: parameter('externalRecordId', ''),
				}),
				paged: true,
			};
		case 'externalLink.delete':
			return { method: 'DELETE', path: `/external-links/${encode(parameter('linkId'))}` };

		case 'syncJob.start':
			return {
				method: 'POST',
				path: '/sync-jobs',
				body: { external_system: parameter('externalSystem') as string, job_type: parameter('jobType') as string },
			};
		case 'syncJob.recordEvents':
			return {
				method: 'POST',
				path: `/sync-jobs/${encode(parameter('syncJobId'))}/events`,
				body: { events: parseJson(parameter('events', '[]'), 'Events', fail) as IDataObject[] },
			};
		case 'syncJob.finish':
			return {
				method: 'POST',
				path: `/sync-jobs/${encode(parameter('syncJobId'))}/finish`,
				body: compact({
					status: parameter('jobStatus'),
					summary: parseJson(parameter('summary', '{}'), 'Summary', fail) as IDataObject,
					error_detail: parameter('errorDetail', ''),
				}),
			};

		default:
			return fail(`Unsupported operation: ${key}`);
	}
}
