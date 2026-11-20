# n8n-nodes-haryai: Seedance 2.5 in n8n

[中文](README.zh-CN.md)

An n8n community node for Seedance 2.5 and Seedance 2.5 Flash, ByteDance's video models, through [HaryAI](https://haryai.com/en/seedance-2-5-comfyui?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai). Seedance 2.5 costs 12% less than BytePlus's official price and needs no BytePlus account.

The **HaryAI Seedance** node:

- **Generate Video**: submit a task, wait for it and return the video as binary data plus its URL
- **Submit Task** and **Get Task**: for long jobs, submit now and read the result later
- text to video, first and last frame, up to 4 reference images, generated sound and spoken lines with lip sync
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

Paid per second of video from your HaryAI balance: Seedance 2.5 at 720p is $0.203 a second, Seedance 2.5 Flash at 480p is $0.059. A failed or moderated task is refunded. All prices: [Seedance API pricing](https://haryai.com/en/seedance-api-pricing?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai).

## Related

- [seedance-2.5-api](https://github.com/sunsiyuan/seedance-2.5-api): the API, curl examples, Q&A
- [seedance-comfyui](https://github.com/sunsiyuan/seedance-comfyui): the same in ComfyUI
- [seedance-skill](https://github.com/sunsiyuan/seedance-skill): Seedance 2.5 as a Claude Code and Codex skill
- API reference: [docs/video.md](https://haryai.com/docs/video.md)

MIT. Prices as of 2026-11-20.
