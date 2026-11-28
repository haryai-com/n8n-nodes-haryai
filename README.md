# n8n-nodes-haryai: Seedance 2.5, Seedream and Nano Banana in n8n

[中文](README.zh-CN.md)

n8n community nodes for ByteDance's Seedance 2.5 video and for Seedream 5.5 and Nano Banana images, through [HaryAI](https://haryai.com/en/seedance-2-5-comfyui?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai). Seedance 2.5 costs 12% less than BytePlus's official price, Seedream 20% less and Nano Banana 50% less. No BytePlus or Google account needed.

The **HaryAI Seedance** node:

- **Generate Video**: submit a task, wait for it and return the video as binary data plus its URL
- **Submit Task** and **Get Task**: for long jobs, submit now and read the result later
- text to video, first and last frame, reference images (up to 30; Flash 10), reference videos and audio by URL, generated sound and spoken lines with lip sync
- usable as a tool by the n8n AI Agent

The **HaryAI Image** node:

- Seedream 5.5, Nano Banana 2.1 and Nano Banana 2: text to image, or follow or edit up to 14 reference images (URLs or data URIs)
- returns the images as binary data (`data`, `data_1`, …)
- usable as a tool by the n8n AI Agent

## Install

In n8n: **Settings > Community Nodes > Install**, enter `n8n-nodes-haryai`. For self-hosted n8n from the command line:

```sh
cd ~/.n8n/nodes && npm install n8n-nodes-haryai
```

## Credentials

Create a **HaryAI API** credential with your key from the [HaryAI account page](https://haryai.com/en/dashboard?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai). Leave Base URL as it is. The credential test lists your tasks, which is free.

## Example

Manual Trigger, then HaryAI Seedance with Generate Video:

- Prompt: `A paper boat sailing down a rain gutter, close up, morning light`
- Model: Seedance 2.5 Flash, 480p, 16:9, 5 seconds

The output item has the task (status, `content.video_url`, `usage`) and the mp4 in binary property `data`, ready for Write Binary File, Google Drive, S3 or a social upload node.

For image to video, add an image with role First Frame and an image URL (or a data URI from an earlier node).

## Cost

From your HaryAI balance. Video per second: Seedance 2.5 at 720p $0.203, Seedance 2.5 Flash at 480p $0.059. Images: Seedream 5.5 1K $0.016, Nano Banana 2.1 1K $0.0168. A failed or moderated request is not charged. All prices: [pricing](https://haryai.com/en/pricing?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai).

## Related

- [seedance-2.5-api](https://github.com/haryai-com/seedance-2.5-api): the API, curl examples, Q&A
- [seedance-comfyui](https://github.com/haryai-com/seedance-comfyui): the same in ComfyUI
- [seedance-skill](https://github.com/haryai-com/seedance-skill): Seedance 2.5 as a Claude Code and Codex skill
- [nano-banana-api](https://github.com/haryai-com/nano-banana-api): Nano Banana 2.1 and 2 through the OpenAI images API or Gemini's own format
- API reference: [docs/video.md](https://haryai.com/docs/video.md), [docs/image.md](https://haryai.com/docs/image.md)

MIT. Prices as of 2026-11-28.
