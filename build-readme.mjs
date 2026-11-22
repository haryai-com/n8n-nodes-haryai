#!/usr/bin/env node
// Writes README.md and README.zh-CN.md. The discount and per-second prices are
// read from https://haryai.com/llms.txt, so nothing here is typed twice.

import { writeFile } from "node:fs/promises";

const llms = await (await fetch("https://haryai.com/llms.txt")).text();
const share = Number(llms.match(/at (\d+)% of BytePlus's official price/)[1]);
const sec = (model, res) => llms.split("\n").find((l) => l.includes(`(${model})`)).match(new RegExp(`${res} \\$([\\d.]+)`))[1];
const full720 = sec("dreamina-seedance-2-5-260628", "720p");
const flash480 = sec("dreamina-seedance-2-5-flash-261115", "480p");
const utm = (path) => `https://haryai.com${path}?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai`;
const today = new Date().toISOString().slice(0, 10);

const en = `# n8n-nodes-haryai: Seedance 2.5 in n8n

[中文](README.zh-CN.md)

An n8n community node for Seedance 2.5 and Seedance 2.5 Flash, ByteDance's video models, through [HaryAI](${utm("/en/seedance-2-5-comfyui")}). Seedance 2.5 costs ${100 - share}% less than BytePlus's official price and needs no BytePlus account.

The **HaryAI Seedance** node:

- **Generate Video**: submit a task, wait for it and return the video as binary data plus its URL
- **Submit Task** and **Get Task**: for long jobs, submit now and read the result later
- text to video, first and last frame, up to 4 reference images, generated sound and spoken lines with lip sync
- usable as a tool by the n8n AI Agent

## Install

In n8n: **Settings > Community Nodes > Install**, enter \`n8n-nodes-haryai\`. For self-hosted n8n from the command line:

\`\`\`sh
cd ~/.n8n/nodes && npm install n8n-nodes-haryai
\`\`\`

## Credentials

Create a **HaryAI API** credential with your key from the [HaryAI account page](${utm("/en/dashboard")}). Leave Base URL as it is. The credential test lists your tasks, which is free.

## Example

Manual Trigger, then HaryAI Seedance with Generate Video:

- Prompt: \`A paper boat sailing down a rain gutter, close up, morning light\`
- Model: Seedance 2.5 Flash, 480p, 16:9, 5 seconds

The output item has the task (status, \`content.video_url\`, \`usage\`) and the mp4 in binary property \`data\`, ready for Write Binary File, Google Drive, S3 or a social upload node.

For image to video, add an image with role First Frame and an image URL (or a data URI from an earlier node).

## Cost

Paid per second of video from your HaryAI balance: Seedance 2.5 at 720p is $${full720} a second, Seedance 2.5 Flash at 480p is $${flash480}. A failed or moderated task is refunded. All prices: [Seedance API pricing](${utm("/en/seedance-api-pricing")}).

## Related

- [seedance-2.5-api](https://github.com/sunsiyuan/seedance-2.5-api): the API, curl examples, Q&A
- [seedance-comfyui](https://github.com/sunsiyuan/seedance-comfyui): the same in ComfyUI
- [seedance-skill](https://github.com/sunsiyuan/seedance-skill): Seedance 2.5 as a Claude Code and Codex skill
- [nano-banana-api](https://github.com/sunsiyuan/nano-banana-api): Nano Banana 2.1 and 2 through the OpenAI images API or Gemini's own format
- API reference: [docs/video.md](https://haryai.com/docs/video.md)

MIT. Prices as of ${today}.
`;

const zh = `# n8n-nodes-haryai：在 n8n 里用 Seedance 2.5

[English](README.md)

一个 n8n 社区节点，通过 [HaryAI](${utm("/zh/seedance-2-5-comfyui")}) 调用字节的视频模型 Seedance 2.5 和 Seedance 2.5 Flash。价格是 BytePlus 官方价 ${share} 折，不用开 BytePlus 账号。

节点名叫 **HaryAI Seedance**：

- **Generate Video**：提交任务，等它完成，把视频作为二进制数据连同地址一起输出
- **Submit Task** 和 **Get Task**：时间长的任务可以先提交，之后再取结果
- 支持文生视频、首帧和尾帧、最多 4 张参考图、生成声音以及台词配音对口型
- n8n 的 AI Agent 可以把它当工具调用

## 安装

在 n8n 里打开 **Settings > Community Nodes > Install**，填 \`n8n-nodes-haryai\`。自部署的 n8n 也可以用命令行装：

\`\`\`sh
cd ~/.n8n/nodes && npm install n8n-nodes-haryai
\`\`\`

## 凭证

新建一个 **HaryAI API** 凭证，填上 [HaryAI 账户页](${utm("/zh/dashboard")}) 里的 key。Base URL 保持不变。测试凭证时调用的是查询任务列表，不扣费。

## 示例

Manual Trigger 接 HaryAI Seedance，选 Generate Video：

- Prompt：\`雨后的排水沟里，一只纸船顺水漂下，特写，清晨的光\`
- Model：Seedance 2.5 Flash，480p，16:9，5 秒

输出里有任务信息（status、\`content.video_url\`、\`usage\`），mp4 在二进制属性 \`data\` 里，可以直接接 Write Binary File、Google Drive、S3 或社交平台上传节点。

图生视频：加一张图片，role 选 First Frame，填图片地址（或者上一个节点给出的 data URI）。

## 费用

按视频秒数从 HaryAI 余额扣费：Seedance 2.5 720p 每秒 $${full720}，Seedance 2.5 Flash 480p 每秒 $${flash480}。失败或审核没过的任务全额退款。全部价格见 [Seedance API 价格](${utm("/zh/seedance-api-pricing")})。

## 相关

- [seedance-2.5-api](https://github.com/sunsiyuan/seedance-2.5-api)：接口本身、curl 示例和常见问题
- [seedance-comfyui](https://github.com/sunsiyuan/seedance-comfyui)：在 ComfyUI 里用
- [seedance-skill](https://github.com/sunsiyuan/seedance-skill)：Claude Code 和 Codex 用的 Seedance 2.5 skill
- [nano-banana-api](https://github.com/sunsiyuan/nano-banana-api)：用 OpenAI 图片接口或 Gemini 原生格式调 Nano Banana 2.1 和 2
- 接口文档：[docs/video.md](https://haryai.com/docs/video.md)

MIT 许可。价格截至 ${today}。
`;

await writeFile("README.md", en);
await writeFile("README.zh-CN.md", zh);
console.log(`README.md, README.zh-CN.md (share ${share}%, 720p $${full720}/s, flash 480p $${flash480}/s)`);
