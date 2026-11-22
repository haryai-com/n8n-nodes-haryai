# n8n-nodes-haryai：在 n8n 里用 Seedance 2.5

[English](README.md)

一个 n8n 社区节点，通过 [HaryAI](https://haryai.com/zh/seedance-2-5-comfyui?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai) 调用字节的视频模型 Seedance 2.5 和 Seedance 2.5 Flash。价格是 BytePlus 官方价 88 折，不用开 BytePlus 账号。

节点名叫 **HaryAI Seedance**：

- **Generate Video**：提交任务，等它完成，把视频作为二进制数据连同地址一起输出
- **Submit Task** 和 **Get Task**：时间长的任务可以先提交，之后再取结果
- 支持文生视频、首帧和尾帧、最多 4 张参考图、生成声音以及台词配音对口型
- n8n 的 AI Agent 可以把它当工具调用

## 安装

在 n8n 里打开 **Settings > Community Nodes > Install**，填 `n8n-nodes-haryai`。自部署的 n8n 也可以用命令行装：

```sh
cd ~/.n8n/nodes && npm install n8n-nodes-haryai
```

## 凭证

新建一个 **HaryAI API** 凭证，填上 [HaryAI 账户页](https://haryai.com/zh/dashboard?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai) 里的 key。Base URL 保持不变。测试凭证时调用的是查询任务列表，不扣费。

## 示例

Manual Trigger 接 HaryAI Seedance，选 Generate Video：

- Prompt：`雨后的排水沟里，一只纸船顺水漂下，特写，清晨的光`
- Model：Seedance 2.5 Flash，480p，16:9，5 秒

输出里有任务信息（status、`content.video_url`、`usage`），mp4 在二进制属性 `data` 里，可以直接接 Write Binary File、Google Drive、S3 或社交平台上传节点。

图生视频：加一张图片，role 选 First Frame，填图片地址（或者上一个节点给出的 data URI）。

## 费用

按视频秒数从 HaryAI 余额扣费：Seedance 2.5 720p 每秒 $0.203，Seedance 2.5 Flash 480p 每秒 $0.059。失败或审核没过的任务全额退款。全部价格见 [Seedance API 价格](https://haryai.com/zh/seedance-api-pricing?utm_source=github&utm_medium=readme&utm_campaign=n8n-nodes-haryai)。

## 相关

- [seedance-2.5-api](https://github.com/sunsiyuan/seedance-2.5-api)：接口本身、curl 示例和常见问题
- [seedance-comfyui](https://github.com/sunsiyuan/seedance-comfyui)：在 ComfyUI 里用
- [seedance-skill](https://github.com/sunsiyuan/seedance-skill)：Claude Code 和 Codex 用的 Seedance 2.5 skill
- [nano-banana-api](https://github.com/sunsiyuan/nano-banana-api)：用 OpenAI 图片接口或 Gemini 原生格式调 Nano Banana 2.1 和 2
- 接口文档：[docs/video.md](https://haryai.com/docs/video.md)

MIT 许可。价格截至 2026-11-22。
