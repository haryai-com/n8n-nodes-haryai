import type {
	IDataObject,
	JsonObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';

const MODELS = {
	full: 'dreamina-seedance-2-5-260628',
	flash: 'dreamina-seedance-2-5-flash-261115',
};

async function api(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('haryAiApi');
	const baseURL = ((credentials.baseUrl as string) || 'https://api.haryai.com/api/v3').replace(/\/$/, '');
	return (await this.helpers.httpRequestWithAuthentication.call(this, 'haryAiApi', {
		method,
		url: `${baseURL}${path}`,
		body,
		json: true,
	})) as IDataObject;
}

export class HaryAiSeedance implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HaryAI Seedance',
		name: 'haryAiSeedance',
		icon: { light: 'file:haryai.svg', dark: 'file:haryai.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Make videos with Seedance 2.5 and Seedance 2.5 Flash through HaryAI',
		defaults: { name: 'HaryAI Seedance' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'haryAiApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate Video',
						value: 'generate',
						action: 'Generate a video and wait for it',
						description: 'Submit a task, wait until it finishes and return the video',
					},
					{
						name: 'Submit Task',
						value: 'submit',
						action: 'Submit a video task',
						description: 'Submit a task and return its ID without waiting',
					},
					{
						name: 'Get Task',
						value: 'get',
						action: 'Get a video task',
						description: 'Get the status of a task, and its video URL once it has succeeded',
					},
				],
				default: 'generate',
			},
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { operation: ['get'] } },
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: '',
				description:
					'Subject, action, camera, light, style. Put spoken lines in quotes and turn on Generate Audio.',
				displayOptions: { show: { operation: ['generate', 'submit'] } },
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{ name: 'Seedance 2.5', value: 'full' },
					{ name: 'Seedance 2.5 Flash (Cheaper, 480p and 720p)', value: 'flash' },
				],
				default: 'full',
				displayOptions: { show: { operation: ['generate', 'submit'] } },
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				options: [
					{ name: '480p', value: '480p' },
					{ name: '720p', value: '720p' },
					{ name: '1080p (Seedance 2.5 Only)', value: '1080p' },
				],
				default: '720p',
				displayOptions: { show: { operation: ['generate', 'submit'] } },
			},
			{
				displayName: 'Aspect Ratio',
				name: 'ratio',
				type: 'options',
				options: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'].map((r) => ({ name: r, value: r })),
				default: '16:9',
				displayOptions: { show: { operation: ['generate', 'submit'] } },
			},
			{
				displayName: 'Duration (Seconds)',
				name: 'duration',
				type: 'number',
				typeOptions: { minValue: 4, maxValue: 30 },
				default: 5,
				description: 'Billed per second of output',
				displayOptions: { show: { operation: ['generate', 'submit'] } },
			},
			{
				displayName: 'Generate Audio',
				name: 'generateAudio',
				type: 'boolean',
				default: false,
				description: 'Whether to generate sound, including spoken lines with lip sync',
				displayOptions: { show: { operation: ['generate', 'submit'] } },
			},
			{
				displayName: 'Images',
				name: 'images',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Image',
				default: {},
				description:
					'Image URLs or data URIs. Use a first frame (and optionally a last frame), or up to 4 reference images, not both.',
				displayOptions: { show: { operation: ['generate', 'submit'] } },
				options: [
					{
						name: 'image',
						displayName: 'Image',
						values: [
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Role',
								name: 'role',
								type: 'options',
								options: [
									{ name: 'First Frame', value: 'first_frame' },
									{ name: 'Last Frame', value: 'last_frame' },
									{ name: 'Reference Image', value: 'reference_image' },
								],
								default: 'first_frame',
							},
						],
					},
				],
			},
			{
				displayName: 'Download Video',
				name: 'download',
				type: 'boolean',
				default: true,
				description: 'Whether to return the video as binary data (property "data") as well as its URL',
				displayOptions: { show: { operation: ['generate'] } },
			},
			{
				displayName: 'Max Wait (Minutes)',
				name: 'maxWait',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 60 },
				default: 15,
				description: 'Stop waiting after this long; the task keeps running and can be read with Get Task',
				displayOptions: { show: { operation: ['generate'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'get') {
					const id = this.getNodeParameter('taskId', i) as string;
					out.push({ json: await api.call(this, 'GET', `/contents/generations/tasks/${id}`), pairedItem: i });
					continue;
				}

				const model = this.getNodeParameter('model', i) as keyof typeof MODELS;
				const resolution = this.getNodeParameter('resolution', i) as string;
				if (model === 'flash' && resolution === '1080p') {
					throw new NodeOperationError(this.getNode(), 'Seedance 2.5 Flash has 480p and 720p only', { itemIndex: i });
				}
				const images = ((this.getNodeParameter('images', i, {}) as IDataObject).image ?? []) as IDataObject[];
				const roles = images.map((im) => im.role as string);
				if (roles.includes('reference_image') && roles.some((r) => r !== 'reference_image')) {
					throw new NodeOperationError(this.getNode(), 'Use a first/last frame or reference images, not both', { itemIndex: i });
				}

				// Always send duration: without it the longest clip is held from the balance.
				const body: IDataObject = {
					model: MODELS[model],
					content: [
						{ type: 'text', text: this.getNodeParameter('prompt', i) as string },
						...images
							.filter((im) => im.url)
							.map((im) => ({ type: 'image_url', image_url: { url: im.url }, role: im.role })),
					],
					duration: this.getNodeParameter('duration', i) as number,
					resolution,
					ratio: this.getNodeParameter('ratio', i) as string,
					generate_audio: this.getNodeParameter('generateAudio', i) as boolean,
				};
				const submitted = await api.call(this, 'POST', '/contents/generations/tasks', body);
				const id = submitted.id as string;

				if (operation === 'submit') {
					out.push({ json: submitted, pairedItem: i });
					continue;
				}

				// Poll every 10 s. Failed and moderated tasks are refunded in full.
				const deadline = Date.now() + (this.getNodeParameter('maxWait', i) as number) * 60_000;
				let task: IDataObject = {};
				for (;;) {
					await sleep(10_000);
					try {
						task = await api.call(this, 'GET', `/contents/generations/tasks/${id}`);
					} catch (error) {
						if (Date.now() > deadline) throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
						continue; // a dropped connection; the task keeps running
					}
					if (task.status === 'succeeded') break;
					if (task.status === 'failed') {
						throw new NodeOperationError(this.getNode(), `Seedance task ${id} failed: ${JSON.stringify(task.error)}`, {
							itemIndex: i,
							description: 'The balance hold is refunded. Change the prompt or images and run again.',
						});
					}
					if (Date.now() > deadline) {
						throw new NodeOperationError(this.getNode(), `Task ${id} is still ${task.status}`, {
							itemIndex: i,
							description: 'Read it later with the Get Task operation.',
						});
					}
				}

				const item: INodeExecutionData = { json: task, pairedItem: i };
				if (this.getNodeParameter('download', i) as boolean) {
					// The link needs no key, redirects to storage and expires after 24 hours.
					const url = (task.content as IDataObject).video_url as string;
					const video = (await this.helpers.httpRequest({ method: 'GET', url, encoding: 'arraybuffer' })) as ArrayBuffer;
					item.binary = { data: await this.helpers.prepareBinaryData(Buffer.from(video), `${id}.mp4`, 'video/mp4') };
				}
				out.push(item);
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				if (error instanceof NodeOperationError) throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}
		return [out];
	}
}
