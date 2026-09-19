import {
	NodeApiError,
	NodeConnectionTypes,
	type JsonObject,
	type IDataObject,
	type IHookFunctions,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { churchHqApiRequest } from '../ChurchHq/transport';
import { SIGNATURE_HEADER, verifyChurchHqSignature } from './signature';

interface TriggerStaticData {
	endpointId?: string;
	signingSecret?: string;
}

/**
 * Starts a workflow when something happens in Church HQ. On activation it registers this
 * workflow's webhook URL with Church HQ (POST /webhook-endpoints) and keeps the signing secret
 * Church HQ returns once; every delivery is then verified (signature and timestamp) before the
 * workflow runs, and anything unsigned or stale is refused with 401. Deactivating removes the
 * registration. What reaches n8n is limited by the API key's permissions: an event carrying giving,
 * child-safety, prayer or background-check data is only sent if the key allows that data.
 */
export class ChurchHqTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Church HQ Trigger',
		name: 'churchHqTrigger',
		icon: { light: 'file:../../icons/churchhq.svg', dark: 'file:../../icons/churchhq.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when an event happens in Church HQ',
		defaults: {
			name: 'Church HQ Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'churchHqApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Names or IDs',
				name: 'events',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getEventTypes',
				},
				required: true,
				default: [],
				description:
					'The Church HQ events that start this workflow. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Include Test Events',
				name: 'includeTestEvents',
				type: 'boolean',
				default: true,
				description: 'Whether test events sent from Church HQ (Send test) also start the workflow',
			},
		],
	};

	methods = {
		loadOptions: {
			async getEventTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await churchHqApiRequest.call(this, 'GET', '/webhook-event-types');
				return ((response.data as IDataObject[]) ?? []).map((type) => ({
					name: String(type.label),
					value: String(type.key),
					description: String(type.description ?? ''),
				}));
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
				if (!staticData.endpointId) return false;
				const response = await churchHqApiRequest.call(this, 'GET', '/webhook-endpoints');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const exists = ((response.data as IDataObject[]) ?? []).some(
					(endpoint) => endpoint.id === staticData.endpointId && endpoint.url === webhookUrl && endpoint.active === true,
				);
				if (!exists) {
					delete staticData.endpointId;
					delete staticData.signingSecret;
				}
				return exists;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
				const events = this.getNodeParameter('events') as string[];
				const response = await churchHqApiRequest.call(this, 'POST', '/webhook-endpoints', {
					url: this.getNodeWebhookUrl('default'),
					description: `n8n: ${this.getWorkflow().name ?? 'workflow'}`,
					events,
				});
				const created = response.data as IDataObject;
				staticData.endpointId = String(created.id);
				staticData.signingSecret = String(created.signing_secret);
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
				if (staticData.endpointId) {
					try {
						await churchHqApiRequest.call(this, 'DELETE', `/webhook-endpoints/${staticData.endpointId}`);
					} catch (error) {
						// Already removed in Church HQ (404) leaves nothing to clean up; anything else surfaces.
						if (String((error as { httpCode?: string }).httpCode) !== '404') {
							throw new NodeApiError(this.getNode(), error as JsonObject);
						}
					}
				}
				delete staticData.endpointId;
				delete staticData.signingSecret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
		const request = this.getRequestObject();
		const response = this.getResponseObject();
		const rawBody = request.rawBody ? request.rawBody.toString('utf8') : JSON.stringify(request.body);
		const header = this.getHeaderData()[SIGNATURE_HEADER] as string | undefined;

		const check = verifyChurchHqSignature(staticData.signingSecret ?? '', header, rawBody, Math.floor(Date.now() / 1000));
		if (!staticData.signingSecret || !check.valid) {
			response.status(401).json({ error: 'Invalid Church HQ signature' });
			return { noWebhookResponse: true };
		}

		const payload = this.getBodyData() as IDataObject;
		if (payload.test === true && !(this.getNodeParameter('includeTestEvents') as boolean)) {
			return { webhookResponse: { received: true, ignored: 'test event' } };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(payload)],
		};
	}
}
