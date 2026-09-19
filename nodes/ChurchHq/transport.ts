import { NodeApiError } from 'n8n-workflow';
import type {
	IDataObject,
	JsonObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

type ApiContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

interface ChurchHqErrorBody {
	error?: { code?: string; message?: string };
}

interface HttpErrorShape {
	response?: { data?: ChurchHqErrorBody; body?: ChurchHqErrorBody };
	cause?: { response?: { data?: ChurchHqErrorBody } };
}

/** The API's own { error: { code, message } } from a failed request, wherever n8n's HTTP helper put it. */
function apiErrorBody(error: HttpErrorShape): ChurchHqErrorBody['error'] | undefined {
	return (error.response?.data ?? error.response?.body ?? error.cause?.response?.data)?.error;
}

const PAGE_SIZE = 200;

/** Calls the Church HQ Enterprise API with the node's credential. Errors come back as
 * { error: { code, message } } and are raised with that message by n8n's request helper. */
export async function churchHqApiRequest(
	this: ApiContext,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject | IDataObject[],
	qs: IDataObject = {},
): Promise<IDataObject> {
	const credentials = await this.getCredentials('churchHqApi');
	const baseUrl = String(credentials.baseUrl).replace(/\/+$/, '');
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${path}`,
		qs,
		json: true,
	};
	if (body !== undefined) options.body = body;
	try {
		return (await this.helpers.httpRequestWithAuthentication.call(this, 'churchHqApi', options)) as IDataObject;
	} catch (error) {
		// Church HQ explains every refusal ("This key needs the giving:read permission", "A person with
		// this name ... already exists"); keep that message instead of a generic HTTP status text.
		// n8n's helper usually raises a NodeApiError already, with a generic status message
		// ("Forbidden - perhaps check your credentials?") and Church HQ's own explanation as its
		// description. NodeApiError hands an existing instance back unchanged, so the explanation is
		// promoted to the message here.
		const apiMessage =
			apiErrorBody(error as HttpErrorShape)?.message ??
			(error instanceof NodeApiError && typeof error.description === 'string' ? error.description : undefined);
		if (error instanceof NodeApiError && apiMessage) error.message = apiMessage;
		throw new NodeApiError(this.getNode(), error as JsonObject, apiMessage ? { message: apiMessage } : {});
	}
}

/** Follows the API's limit/offset paging until the end, or until `limit` items when not returning all. */
export async function churchHqApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	path: string,
	qs: IDataObject,
	returnAll: boolean,
	limit: number,
): Promise<IDataObject[]> {
	const items: IDataObject[] = [];
	let offset = 0;
	for (;;) {
		const pageSize = returnAll ? PAGE_SIZE : Math.min(PAGE_SIZE, limit - items.length);
		const response = await churchHqApiRequest.call(this, 'GET', path, undefined, {
			...qs,
			limit: pageSize,
			offset,
		});
		const page = (response.data as IDataObject[]) ?? [];
		items.push(...page);
		const paging = response.paging as IDataObject | undefined;
		if (!paging || !paging.has_more || (!returnAll && items.length >= limit)) break;
		offset += page.length;
	}
	return returnAll ? items : items.slice(0, limit);
}
