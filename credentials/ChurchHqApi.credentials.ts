import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ChurchHqApi implements ICredentialType {
	name = 'churchHqApi';

	displayName = 'Church HQ API';

	icon: Icon = { light: 'file:../icons/churchhq.svg', dark: 'file:../icons/churchhq.dark.svg' };

	documentationUrl = 'https://github.com/levelup-gh/n8n-nodes-churchhq#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'A Church HQ API key. An Owner or Administrator creates one in Church HQ under Administration > Integrations > Connect n8n.',
		},
		{
			displayName: 'API URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://texpzexdkwcpyydbeowl.supabase.co/functions/v1/api-v1',
			required: true,
			description: 'The Church HQ API address shown on the Connect n8n screen',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '/me',
			method: 'GET',
		},
	};
}
