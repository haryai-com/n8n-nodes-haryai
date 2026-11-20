import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class HaryAiApi implements ICredentialType {
	name = 'haryAiApi';

	displayName = 'HaryAI API';

	icon: Icon = { light: 'file:../icons/haryai.svg', dark: 'file:../icons/haryai.svg' };

	documentationUrl = 'https://haryai.com/docs/video.md';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your HaryAI key, from the account page on haryai.com',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.haryai.com/api/v3',
			description: 'Leave as is',
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

	// Listing tasks is free, so the credential test never starts a paid job.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/contents/generations/tasks',
			qs: { page_size: 1 },
			method: 'GET',
		},
	};
}
