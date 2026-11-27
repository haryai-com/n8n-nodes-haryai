import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const MODELS = {
	seedream: 'dola-seedream-5-5-261028',
	nanoBanana21: 'gemini-nano-banana-2.1',
	nanoBanana2: 'gemini-3.1-flash-image',
};
const SIZES: Record<keyof typeof MODELS, string[]> = {
	seedream: ['1K', '1.5K', '2K'],
	nanoBanana21: ['1K', '2K', '4K'],
	nanoBanana2: ['1K', '2K', '4K'],
};
// Seedream's pixels per size at 1:1; 1.5K stays under the 2.61 MP price step.
const SEEDREAM_PIXELS: Record<string, number> = { '1K': 1024 * 1024, '1.5K': 2_330_000, '2K': 2048 * 2048 };

/** WIDTHxHEIGHT for Seedream at a ratio and size, in multiples of 16. */
function seedreamSize(ratio: string, size: string): string {
	const [rw, rh] = ratio.split(':').map(Number);
	const w = Math.sqrt((SEEDREAM_PIXELS[size] * rw) / rh);
	const r16 = (x: number) => Math.max(16, Math.floor(x / 16) * 16);
	return `${r16(w)}x${r16((w * rh) / rw)}`;
}

function mimeOf(data: Buffer): string {
	if (data[0] === 0x89 && data[1] === 0x50) return 'image/png';
	if (data[0] === 0xff && data[1] === 0xd8) return 'image/jpeg';
	return 'image/webp';
}

/** A reference image's bytes. Fetched without the HaryAI key: the URL can be anyone's. */
async function referenceBytes(this: IExecuteFunctions, url: string): Promise<Buffer> {
	if (url.startsWith('data:')) return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
	return Buffer.from((await this.helpers.httpRequest({ method: 'GET', url, encoding: 'arraybuffer' })) as ArrayBuffer);
}

export class HaryAiImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HaryAI Image',
		name: 'haryAiImage',
		icon: { light: 'file:haryai.svg', dark: 'file:haryai.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["model"]}}',
		description: 'Make and edit images with Seedream 5.5 and Nano Banana through HaryAI',
		defaults: { name: 'HaryAI Image' },
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
						name: 'Generate Image',
						value: 'generate',
						action: 'Generate an image',
						description: 'Make images from a prompt, optionally following or editing reference images',
					},
				],
				default: 'generate',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: '',
				description: 'What to draw, or what to change in the reference images. Refer to them as Image 1, Image 2.',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{ name: 'Seedream 5.5', value: 'seedream' },
					{ name: 'Nano Banana 2.1', value: 'nanoBanana21' },
					{ name: 'Nano Banana 2', value: 'nanoBanana2' },
				],
				default: 'seedream',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				options: ['1K', '1.5K', '2K', '4K'].map((s) => ({ name: s, value: s })),
				default: '1K',
				description: 'Seedream: 1K, 1.5K, 2K. Nano Banana: 1K, 2K, 4K.',
			},
			{
				displayName: 'Aspect Ratio',
				name: 'ratio',
				type: 'options',
				options: ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '3:2', '21:9'].map((r) => ({ name: r, value: r })),
				default: '1:1',
			},
			{
				displayName: 'Number of Images',
				name: 'count',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 4 },
				default: 1,
				description: 'Seedream only; Nano Banana makes one image',
				displayOptions: { show: { model: ['seedream'] } },
			},
			{
				displayName: 'Reference Images',
				name: 'images',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Image',
				default: {},
				description: 'Image URLs or data URIs to follow or edit, up to 14. Each is billed for Seedream.',
				options: [
					{
						name: 'image',
						displayName: 'Image',
						values: [{ displayName: 'URL', name: 'url', type: 'string', default: '' }],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('haryAiApi');
				const origin = new URL((credentials.baseUrl as string) || 'https://api.haryai.com').origin;
				const prompt = this.getNodeParameter('prompt', i) as string;
				const model = this.getNodeParameter('model', i) as keyof typeof MODELS;
				const size = this.getNodeParameter('size', i) as string;
				const ratio = this.getNodeParameter('ratio', i) as string;
				if (!SIZES[model].includes(size)) {
					throw new NodeOperationError(this.getNode(), `This model has ${SIZES[model].join(', ')} only`, { itemIndex: i });
				}
				const refs = (((this.getNodeParameter('images', i, {}) as IDataObject).image ?? []) as IDataObject[])
					.map((im) => (im.url as string)?.trim())
					.filter(Boolean);
				if (refs.length > 14) throw new NodeOperationError(this.getNode(), 'At most 14 reference images', { itemIndex: i });

				let reply: IDataObject;
				if (model === 'seedream') {
					reply = (await this.helpers.httpRequestWithAuthentication.call(this, 'haryAiApi', {
						method: 'POST',
						url: `${origin}/v1/images/generations`,
						json: true,
						body: {
							model: MODELS.seedream,
							prompt,
							n: this.getNodeParameter('count', i, 1) as number,
							size: seedreamSize(ratio, size),
							response_format: 'b64_json',
							watermark: false,
							...(refs.length ? { image: refs } : {}),
						},
					})) as IDataObject;
				} else if (refs.length) {
					// Nano Banana edits take uploaded files (multipart), as OpenAI's /images/edits.
					const boundary = `haryai${Date.now().toString(16)}`;
					const parts: Buffer[] = [];
					const field = (name: string, value: string) =>
						parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
					field('model', MODELS[model]);
					field('prompt', prompt);
					field('aspect_ratio', ratio);
					field('image_size', size);
					for (const [k, url] of refs.entries()) {
						const data = await referenceBytes.call(this, url);
						parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="ref-${k}"\r\nContent-Type: ${mimeOf(data)}\r\n\r\n`));
						parts.push(data, Buffer.from('\r\n'));
					}
					parts.push(Buffer.from(`--${boundary}--\r\n`));
					const raw = await this.helpers.httpRequestWithAuthentication.call(this, 'haryAiApi', {
						method: 'POST',
						url: `${origin}/v1/images/edits`,
						headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
						body: Buffer.concat(parts),
					});
					reply = (typeof raw === 'string' ? JSON.parse(raw) : raw) as IDataObject;
				} else {
					reply = (await this.helpers.httpRequestWithAuthentication.call(this, 'haryAiApi', {
						method: 'POST',
						url: `${origin}/v1/images/generations`,
						json: true,
						body: { model: MODELS[model], prompt, aspect_ratio: ratio, image_size: size },
					})) as IDataObject;
				}

				const data = (reply.data ?? []) as IDataObject[];
				if (!data.length) throw new NodeOperationError(this.getNode(), `No image in the reply: ${JSON.stringify(reply)}`, { itemIndex: i });
				const item: INodeExecutionData = { json: { model: MODELS[model], images: data.length, usage: reply.usage ?? null }, binary: {}, pairedItem: i };
				for (const [k, d] of data.entries()) {
					const bytes = Buffer.from(d.b64_json as string, 'base64');
					const mime = mimeOf(bytes);
					item.binary![k === 0 ? 'data' : `data_${k}`] = await this.helpers.prepareBinaryData(bytes, `image-${k + 1}.${mime.split('/')[1]}`, mime);
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
