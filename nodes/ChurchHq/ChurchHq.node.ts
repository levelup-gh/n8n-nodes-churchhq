import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { PROPERTIES } from './descriptions';
import { resolveOperation } from './operations';
import { churchHqApiRequest, churchHqApiRequestAllItems } from './transport';

/**
 * Church HQ actions over the Enterprise API: people, households, tasks, events and attendance,
 * forms, Smart Lists, messages, gifts, background checks, starting Church HQ workflows, and the
 * sync pattern (external links and sync jobs). Every call runs as the API key's issuer, limited by
 * the key's permissions, so this node can never see or change more than the key allows.
 */
export class ChurchHq implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Church HQ',
		name: 'churchHq',
		icon: { light: 'file:../../icons/churchhq.svg', dark: 'file:../../icons/churchhq.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Read and update Church HQ',
		defaults: {
			name: 'Church HQ',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'churchHqApi',
				required: true,
			},
		],
		properties: PROPERTIES,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const call = resolveOperation(
					resource,
					operation,
					(name, fallback) => this.getNodeParameter(name, itemIndex, fallback),
					(message) => {
						throw new NodeOperationError(this.getNode(), message, { itemIndex });
					},
				);

				let records: IDataObject[];
				if (call.paged) {
					const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
					const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
					records = await churchHqApiRequestAllItems.call(this, call.path, call.qs ?? {}, returnAll, limit);
				} else {
					const response = await churchHqApiRequest.call(this, call.method, call.path, call.body, call.qs ?? {});
					const data = response?.data;
					if (call.list || Array.isArray(data)) records = (data as IDataObject[]) ?? [];
					else records = [(data as IDataObject) ?? { success: true }];
				}

				results.push(
					...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(records), {
						itemData: { item: itemIndex },
					}),
				);
			} catch (error) {
				if (this.continueOnFail()) {
					results.push({ json: { error: (error as Error).message }, pairedItem: { item: itemIndex } });
					continue;
				}
				// API errors arrive as NodeApiError carrying Church HQ's own explanation (see transport.ts).
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [results];
	}
}
