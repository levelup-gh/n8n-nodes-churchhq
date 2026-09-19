import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveOperation } from '../nodes/ChurchHq/operations.ts';

const reader = (values) => (name, fallback) => (name in values ? values[name] : fallback);
const fail = (message) => {
	throw new Error(message);
};

test('person create sends the required names, the duplicate rule, and only filled optional fields', () => {
	const call = resolveOperation('person', 'create', reader({ firstName: 'Ana', lastName: 'Ruiz', additionalFields: { email: 'ana@example.com', mobile_phone: '' } }), fail);
	assert.deepEqual(call, { method: 'POST', path: '/people', body: { first_name: 'Ana', last_name: 'Ruiz', on_duplicate: 'reject', email: 'ana@example.com' } });
});

test('ids and tags are URL-encoded into the path', () => {
	const call = resolveOperation('person', 'removeTag', reader({ personId: 'p-1', tag: 'Small Group/2' }), fail);
	assert.equal(call.path, '/people/p-1/tags/Small%20Group%2F2');
});

test('list endpoints are marked for paging with their filters', () => {
	const call = resolveOperation('person', 'getAll', reader({ filters: { search: 'Ruiz', include_archived: false, updated_since: '' } }), fail);
	assert.deepEqual(call, { method: 'GET', path: '/people', qs: { search: 'Ruiz', include_archived: false }, paged: true });
});

test('a message maps its audiences and drops the subject for SMS', () => {
	const call = resolveOperation('message', 'send', reader({
		channel: 'sms', subject: 'ignored', body: 'Hi {{first_name}}',
		audiences: { audience: [{ audience_type: 'smart_list', reference_id: 'list-1' }] },
	}), fail);
	assert.deepEqual(call.body, { channel: 'sms', body: 'Hi {{first_name}}', audiences: [{ audience_type: 'smart_list', reference_id: 'list-1' }] });
});

test('inbound events parse their JSON data and refuse invalid JSON', () => {
	const call = resolveOperation('inboundEvent', 'send', reader({ eventName: 'n8n.signup', data: '{"email":"a@b.c"}', relatedPersonId: '' }), fail);
	assert.deepEqual(call.body, { event_name: 'n8n.signup', data: { email: 'a@b.c' } });
	assert.throws(() => resolveOperation('inboundEvent', 'send', reader({ eventName: 'x', data: '{bad' }), fail), /not valid JSON/);
});

test('an unknown operation is an error, never a guessed request', () => {
	assert.throws(() => resolveOperation('person', 'delete', reader({}), fail), /Unsupported operation/);
});
