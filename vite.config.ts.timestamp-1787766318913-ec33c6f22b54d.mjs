// vite.config.ts
import { defineConfig } from "file:///C:/Users/Yu/Documents/ChatGPT/nuomi/SullyOS888-workspace/SullyOS888-master/node_modules/.pnpm/vite@5.4.21_@types+node@25.9.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Yu/Documents/ChatGPT/nuomi/SullyOS888-workspace/SullyOS888-master/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@25.9.0_/node_modules/@vitejs/plugin-react/dist/index.js";
import { execSync } from "node:child_process";

// server/bake-voice-middleware.ts
var DOMESTIC_BASE = "https://api.minimaxi.com";
var OVERSEAS_BASE = "https://api.minimax.io";
var resolveMinimaxUrls = (req, bodyRegion) => {
  const bodyR = typeof bodyRegion === "string" ? bodyRegion.trim().toLowerCase() : "";
  const headerRaw = req.headers["x-minimax-region"];
  const headerR = typeof headerRaw === "string" ? headerRaw.trim().toLowerCase() : "";
  const envR = typeof process.env.MINIMAX_REGION === "string" ? process.env.MINIMAX_REGION.trim().toLowerCase() : "";
  const region = bodyR || headerR || envR;
  const base = region === "overseas" ? OVERSEAS_BASE : DOMESTIC_BASE;
  return {
    t2a: `${base}/v1/t2a_v2`,
    upload: `${base}/v1/files/upload`,
    clone: `${base}/v1/voice_clone`
  };
};
var CLONE_SOURCE_TEXT = "\u5728\u4E00\u4E2A\u9633\u5149\u660E\u5A9A\u7684\u65E9\u6668\uFF0C\u5C0F\u9E1F\u5728\u679D\u5934\u6B22\u5FEB\u5730\u6B4C\u5531\uFF0C\u5FAE\u98CE\u8F7B\u8F7B\u62C2\u8FC7\u8138\u5E9E\uFF0C\u5E26\u6765\u4E86\u82B1\u6735\u7684\u82AC\u82B3\u3002\u8FDC\u5904\u7684\u5C71\u5CE6\u5728\u8584\u96FE\u4E2D\u82E5\u9690\u82E5\u73B0\uFF0C\u5B9B\u5982\u4E00\u5E45\u6C34\u58A8\u753B\u3002\u4EBA\u4EEC\u6F2B\u6B65\u5728\u6797\u836B\u5C0F\u9053\u4E0A\uFF0C\u4EAB\u53D7\u7740\u8FD9\u96BE\u5F97\u7684\u5B81\u9759\u65F6\u5149\u3002\u5B69\u5B50\u4EEC\u5728\u8349\u5730\u4E0A\u5954\u8DD1\u5B09\u620F\uFF0C\u7B11\u58F0\u56DE\u8361\u5728\u7A7A\u6C14\u4E2D\uFF0C\u8BA9\u4EBA\u611F\u5230\u65E0\u6BD4\u6E29\u6696\u548C\u5E78\u798F\u3002";
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
async function bakeVoiceMiddleware(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-MiniMax-Region");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }
  try {
    const body = JSON.parse(await readBody(req));
    const { apiKey, voiceId, model, ttsPayload, groupId, region } = body;
    if (!apiKey) throw new Error("Missing apiKey");
    if (!voiceId) throw new Error("Missing voiceId");
    if (!ttsPayload) throw new Error("Missing ttsPayload");
    const urls = resolveMinimaxUrls(req, region);
    const t2aBody = {
      ...ttsPayload,
      text: CLONE_SOURCE_TEXT,
      stream: false,
      output_format: "url",
      audio_setting: { format: "mp3", sample_rate: 32e3, bitrate: 128e3, channel: 1 }
    };
    if (groupId) t2aBody.group_id = groupId;
    console.log("[bake-voice] step 1: synthesizing long audio sample...", { target: urls.t2a });
    const t2aRes = await fetch(urls.t2a, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(t2aBody)
    });
    const t2aData = await t2aRes.json();
    const t2aStatus = t2aData?.base_resp?.status_code;
    if (typeof t2aStatus === "number" && t2aStatus !== 0) {
      throw new Error(`T2A failed: ${t2aData?.base_resp?.status_msg || "unknown"}`);
    }
    const audioRaw = t2aData?.data?.audio;
    if (!audioRaw || typeof audioRaw !== "string") {
      throw new Error("T2A returned no audio");
    }
    let audioBuffer;
    if (/^https?:\/\//i.test(audioRaw.trim())) {
      const audioRes = await fetch(audioRaw.trim());
      if (!audioRes.ok) throw new Error(`Audio download failed: HTTP ${audioRes.status}`);
      audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    } else {
      const cleanHex = audioRaw.trim().replace(/^0x/i, "");
      audioBuffer = Buffer.from(cleanHex, "hex");
    }
    console.log(`[bake-voice] step 1 done: ${audioBuffer.length} bytes`);
    const boundary = `----BakeVoice${Date.now()}`;
    const parts = [];
    parts.push(Buffer.from(
      `--${boundary}\r
Content-Disposition: form-data; name="file"; filename="voice_sample.mp3"\r
Content-Type: audio/mpeg\r
\r
`
    ));
    parts.push(audioBuffer);
    parts.push(Buffer.from("\r\n"));
    parts.push(Buffer.from(
      `--${boundary}\r
Content-Disposition: form-data; name="purpose"\r
\r
voice_clone\r
`
    ));
    parts.push(Buffer.from(`--${boundary}--\r
`));
    const multipartBody = Buffer.concat(parts);
    console.log("[bake-voice] step 2: uploading audio for cloning...");
    const uploadRes = await fetch(urls.upload, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
    });
    const uploadData = await uploadRes.json();
    const fileId = uploadData?.file?.file_id;
    if (!fileId) {
      const msg = uploadData?.base_resp?.status_msg || JSON.stringify(uploadData);
      throw new Error(`Upload failed: ${msg}`);
    }
    console.log(`[bake-voice] step 2 done: file_id=${fileId}`);
    console.log("[bake-voice] step 3: cloning voice...");
    const cloneRes = await fetch(urls.clone, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        file_id: fileId,
        voice_id: voiceId,
        model: model || "speech-2.8-hd",
        text: "\u4F60\u597D\uFF0C\u8FD9\u662F\u56FA\u5B9A\u540E\u7684\u58F0\u97F3\uFF0C\u542C\u542C\u770B\u6548\u679C\u600E\u4E48\u6837\uFF1F",
        need_noise_reduction: false,
        need_volumn_normalization: true
      })
    });
    const cloneData = await cloneRes.json();
    const cloneStatus = cloneData?.base_resp?.status_code;
    if (typeof cloneStatus === "number" && cloneStatus !== 0) {
      throw new Error(`Clone failed: ${cloneData?.base_resp?.status_msg || JSON.stringify(cloneData)}`);
    }
    console.log(`[bake-voice] step 3 done: voice_id=${voiceId}`);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      success: true,
      file_id: fileId,
      voice_id: voiceId,
      clone_data: cloneData
    }));
  } catch (err) {
    console.error("[bake-voice] error:", err?.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || "bake-voice failed" }));
  }
}

// vite.config.ts
var RELEASE_BRANCHES = /* @__PURE__ */ new Set(["main", "master"]);
var UTC8_OFFSET_MS = 8 * 60 * 60 * 1e3;
function formatBuildTimeUtc8(date = /* @__PURE__ */ new Date()) {
  const utc8Date = new Date(date.getTime() + UTC8_OFFSET_MS);
  return `${utc8Date.toISOString().slice(0, 19).replace("T", " ")} UTC+8`;
}
function readBranch() {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  if (process.env.VERCEL_GIT_COMMIT_REF) return process.env.VERCEL_GIT_COMMIT_REF;
  if (process.env.CF_PAGES_BRANCH) return process.env.CF_PAGES_BRANCH;
  if (process.env.BRANCH) return process.env.BRANCH;
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
}
function readCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7);
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
}
var gitInfo = { branch: readBranch(), commit: readCommit() };
var buildTime = formatBuildTimeUtc8();
var isReleaseBranch = RELEASE_BRANCHES.has(gitInfo.branch);
var showBuildBadge = !isReleaseBranch;
if (process.env.VITE_HIDE_BUILD_BADGE === "1") showBuildBadge = false;
if (process.env.VITE_SHOW_BUILD_BADGE === "1") showBuildBadge = true;
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "bake-voice-middleware",
      configureServer(server) {
        server.middlewares.use("/api/minimax/bake-voice", bakeVoiceMiddleware);
      }
    }
  ],
  define: {
    __BUILD_BRANCH__: JSON.stringify(gitInfo.branch),
    __BUILD_COMMIT__: JSON.stringify(gitInfo.commit),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_BADGE_VISIBLE__: JSON.stringify(showBuildBadge)
  },
  // GitHub Pages 发布时使用相对路径，避免仓库子路径导致资源 404
  base: process.env.GITHUB_PAGES ? "./" : "/",
  esbuild: {
    // 只剥 debugger，保留 console.* —— 部署后按 F12 仍能看到运行时日志，方便排查。
    drop: ["debugger"]
  },
  server: {
    // 固定本地开发端口，strictPort 下被占用会直接报错而不是静默换端口，
    // 保证预览地址永远不变（http://localhost:5173）。
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/minimax/t2a": {
        target: "https://api.minimaxi.com",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/v1/t2a_v2",
        // Route to 国服 / 海外 based on X-MiniMax-Region header sent by the client.
        router: (req) => {
          const region = String(req.headers["x-minimax-region"] || "").toLowerCase();
          return region === "overseas" ? "https://api.minimax.io" : "https://api.minimaxi.com";
        }
      },
      "/api/minimax/get-voice": {
        target: "https://api.minimaxi.com",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/v1/get_voice",
        router: (req) => {
          const region = String(req.headers["x-minimax-region"] || "").toLowerCase();
          return region === "overseas" ? "https://api.minimax.io" : "https://api.minimaxi.com";
        }
      },
      "/api/minimax/music": {
        target: "https://api.minimaxi.com",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/v1/music_generation",
        router: (req) => {
          const region = String(req.headers["x-minimax-region"] || "").toLowerCase();
          return region === "overseas" ? "https://api.minimax.io" : "https://api.minimaxi.com";
        }
      },
      // 鱼声 Fish Audio TTS：转发到 https://api.fish.audio/v1/tts（返回二进制音频）
      "/api/fishaudio/tts": {
        target: "https://api.fish.audio",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/v1/tts"
      }
    }
  },
  preview: {
    // 固定构建产物预览端口，与 open-local-web.bat / local-static-server.cjs 保持一致
    host: "127.0.0.1",
    port: 4173,
    strictPort: true
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // 关闭 vite 的 emptyOutDir 行为。WorkBuddy 沙箱的 trash 包装（genie-safe-delete.cjs）
    // 在 trash dist 下的 worker/JS bundle 时会偶发 abort 失败，让 vite 构建直接挂掉。
    // 关闭后 vite 不再清空 dist，新文件直接覆盖、保留旧的 hash 化文件名；
    // HTML 入口永远指向新 hash，旧文件残留但不再被引用，不影响功能。
    // 想要彻底清理时手动 `Remove-Item dist -Recurse -Force`（一次性同意批量删除即可）。
    emptyOutDir: false,
    chunkSizeWarningLimit: 2e3,
    rollupOptions: {
      // 关键修复：将这些包排除在打包之外，让浏览器通过 index.html 的 importmap 加载
      external: ["pdfjs-dist", "katex"],
      onwarn(warning, defaultHandler) {
        if (warning.message?.includes("dynamic import will not move module into another chunk")) return;
        defaultHandler(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("untitled-pixi-live2d-engine")) {
              return "live2d-runtime";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
              return "vendor-react";
            }
            if (id.includes("@phosphor-icons")) {
              return "vendor-icons";
            }
            if (id.includes("@capacitor")) {
              return "vendor-capacitor";
            }
            return "vendor";
          }
          if (id.includes("utils/memoryPalace")) {
            return "memory-palace";
          }
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL2Jha2Utdm9pY2UtbWlkZGxld2FyZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFl1XFxcXERvY3VtZW50c1xcXFxDaGF0R1BUXFxcXG51b21pXFxcXFN1bGx5T1M4ODgtd29ya3NwYWNlXFxcXFN1bGx5T1M4ODgtbWFzdGVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxZdVxcXFxEb2N1bWVudHNcXFxcQ2hhdEdQVFxcXFxudW9taVxcXFxTdWxseU9TODg4LXdvcmtzcGFjZVxcXFxTdWxseU9TODg4LW1hc3RlclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvWXUvRG9jdW1lbnRzL0NoYXRHUFQvbnVvbWkvU3VsbHlPUzg4OC13b3Jrc3BhY2UvU3VsbHlPUzg4OC1tYXN0ZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdub2RlOmNoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgeyBiYWtlVm9pY2VNaWRkbGV3YXJlIH0gZnJvbSAnLi9zZXJ2ZXIvYmFrZS12b2ljZS1taWRkbGV3YXJlJztcclxuXHJcbi8vIFx1Njc4NFx1NUVGQVx1NjVGNlx1NjI5MyBnaXQgXHU1MjA2XHU2NTJGICsgc2hvcnQgY29tbWl0ICsgVVRDKzggXHU2Nzg0XHU1RUZBXHU2NUY2XHU5NUY0XHVGRjBDXHU2Q0U4XHU1MTY1XHU1MjMwXHU3MjQ4XHU2NzJDXHU0RkUxXHU2MDZGXHU2NjNFXHU3OTNBXHUzMDAyXHJcbi8vIFx1OTc1RSBnaXQgXHU3M0FGXHU1ODgzXHVGRjA4XHU1QkI5XHU1NjY4XHUzMDAxdGFyYmFsbCBcdTkwRThcdTdGNzJcdUZGMDlcdTkwMDBcdTUzMTZcdTYyMTAgJ3Vua25vd24nXHVGRjBDXHU0RTBEXHU1RjcxXHU1NENEXHU2Nzg0XHU1RUZBXHUzMDAyXHJcbi8vXHJcbi8vIFx1NjYzRVx1NzkzQVx1ODlDNFx1NTIxOVx1RkYxQVxyXG4vLyAgIC0gXHU5RUQ4XHU4QkE0XHU1NzI4IG1haW4gLyBtYXN0ZXIgXHU0RTBBXHU5NjkwXHU4NUNGXHVGRjA4XHU4OUM2XHU0RTNBXHU2QjYzXHU1RjBGXHU1M0QxXHU1RTAzXHVGRjA5XHVGRjBDXHU1MTc2XHU0RUQ2XHU1MjA2XHU2NTJGXHU2NjNFXHU3OTNBXHJcbi8vICAgLSBDSSBkZXRhY2hlZCBIRUFEIFx1NEYxOFx1NTE0OFx1OEJGQiBHSVRIVUJfUkVGX05BTUUgLyBWRVJDRUxfR0lUX0NPTU1JVF9SRUYgLyBDRl9QQUdFU19CUkFOQ0ggLyBCUkFOQ0goTmV0bGlmeSlcclxuLy8gICAtIFZJVEVfSElERV9CVUlMRF9CQURHRT0xIFx1NUYzQVx1NTIzNlx1OTY5MFx1ODVDRlx1RkYwOFx1ODk4Nlx1NzZENlx1OUVEOFx1OEJBNFx1RkYwOVxyXG4vLyAgIC0gVklURV9TSE9XX0JVSUxEX0JBREdFPTEgXHU1RjNBXHU1MjM2XHU2NjNFXHU3OTNBXHVGRjA4XHU1NzI4IG1hc3RlciBcdTY3MkNcdTU3MzBcdThDMDNcdThCRDVcdTc1MjhcdUZGMDlcclxuY29uc3QgUkVMRUFTRV9CUkFOQ0hFUyA9IG5ldyBTZXQoWydtYWluJywgJ21hc3RlciddKTtcclxuY29uc3QgVVRDOF9PRkZTRVRfTVMgPSA4ICogNjAgKiA2MCAqIDEwMDA7XHJcblxyXG5mdW5jdGlvbiBmb3JtYXRCdWlsZFRpbWVVdGM4KGRhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcclxuICBjb25zdCB1dGM4RGF0ZSA9IG5ldyBEYXRlKGRhdGUuZ2V0VGltZSgpICsgVVRDOF9PRkZTRVRfTVMpO1xyXG4gIHJldHVybiBgJHt1dGM4RGF0ZS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDE5KS5yZXBsYWNlKCdUJywgJyAnKX0gVVRDKzhgO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkQnJhbmNoKCk6IHN0cmluZyB7XHJcbiAgaWYgKHByb2Nlc3MuZW52LkdJVEhVQl9SRUZfTkFNRSkgcmV0dXJuIHByb2Nlc3MuZW52LkdJVEhVQl9SRUZfTkFNRTtcclxuICBpZiAocHJvY2Vzcy5lbnYuVkVSQ0VMX0dJVF9DT01NSVRfUkVGKSByZXR1cm4gcHJvY2Vzcy5lbnYuVkVSQ0VMX0dJVF9DT01NSVRfUkVGO1xyXG4gIGlmIChwcm9jZXNzLmVudi5DRl9QQUdFU19CUkFOQ0gpIHJldHVybiBwcm9jZXNzLmVudi5DRl9QQUdFU19CUkFOQ0g7XHJcbiAgaWYgKHByb2Nlc3MuZW52LkJSQU5DSCkgcmV0dXJuIHByb2Nlc3MuZW52LkJSQU5DSDtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGV4ZWNTeW5jKCdnaXQgcmV2LXBhcnNlIC0tYWJicmV2LXJlZiBIRUFEJywgeyBzdGRpbzogWydpZ25vcmUnLCAncGlwZScsICdpZ25vcmUnXSB9KS50b1N0cmluZygpLnRyaW0oKTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiAndW5rbm93bic7XHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIHJlYWRDb21taXQoKTogc3RyaW5nIHtcclxuICBpZiAocHJvY2Vzcy5lbnYuR0lUSFVCX1NIQSkgcmV0dXJuIHByb2Nlc3MuZW52LkdJVEhVQl9TSEEuc2xpY2UoMCwgNyk7XHJcbiAgaWYgKHByb2Nlc3MuZW52LlZFUkNFTF9HSVRfQ09NTUlUX1NIQSkgcmV0dXJuIHByb2Nlc3MuZW52LlZFUkNFTF9HSVRfQ09NTUlUX1NIQS5zbGljZSgwLCA3KTtcclxuICBpZiAocHJvY2Vzcy5lbnYuQ0ZfUEFHRVNfQ09NTUlUX1NIQSkgcmV0dXJuIHByb2Nlc3MuZW52LkNGX1BBR0VTX0NPTU1JVF9TSEEuc2xpY2UoMCwgNyk7XHJcbiAgaWYgKHByb2Nlc3MuZW52LkNPTU1JVF9SRUYpIHJldHVybiBwcm9jZXNzLmVudi5DT01NSVRfUkVGLnNsaWNlKDAsIDcpO1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gZXhlY1N5bmMoJ2dpdCByZXYtcGFyc2UgLS1zaG9ydCBIRUFEJywgeyBzdGRpbzogWydpZ25vcmUnLCAncGlwZScsICdpZ25vcmUnXSB9KS50b1N0cmluZygpLnRyaW0oKTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiAndW5rbm93bic7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBnaXRJbmZvID0geyBicmFuY2g6IHJlYWRCcmFuY2goKSwgY29tbWl0OiByZWFkQ29tbWl0KCkgfTtcclxuY29uc3QgYnVpbGRUaW1lID0gZm9ybWF0QnVpbGRUaW1lVXRjOCgpO1xyXG5jb25zdCBpc1JlbGVhc2VCcmFuY2ggPSBSRUxFQVNFX0JSQU5DSEVTLmhhcyhnaXRJbmZvLmJyYW5jaCk7XHJcbmxldCBzaG93QnVpbGRCYWRnZSA9ICFpc1JlbGVhc2VCcmFuY2g7XHJcbmlmIChwcm9jZXNzLmVudi5WSVRFX0hJREVfQlVJTERfQkFER0UgPT09ICcxJykgc2hvd0J1aWxkQmFkZ2UgPSBmYWxzZTtcclxuaWYgKHByb2Nlc3MuZW52LlZJVEVfU0hPV19CVUlMRF9CQURHRSA9PT0gJzEnKSBzaG93QnVpbGRCYWRnZSA9IHRydWU7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6ICdiYWtlLXZvaWNlLW1pZGRsZXdhcmUnLFxyXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9taW5pbWF4L2Jha2Utdm9pY2UnLCBiYWtlVm9pY2VNaWRkbGV3YXJlKTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgXSxcclxuICBkZWZpbmU6IHtcclxuICAgIF9fQlVJTERfQlJBTkNIX186IEpTT04uc3RyaW5naWZ5KGdpdEluZm8uYnJhbmNoKSxcclxuICAgIF9fQlVJTERfQ09NTUlUX186IEpTT04uc3RyaW5naWZ5KGdpdEluZm8uY29tbWl0KSxcclxuICAgIF9fQlVJTERfVElNRV9fOiBKU09OLnN0cmluZ2lmeShidWlsZFRpbWUpLFxyXG4gICAgX19CVUlMRF9CQURHRV9WSVNJQkxFX186IEpTT04uc3RyaW5naWZ5KHNob3dCdWlsZEJhZGdlKSxcclxuICB9LFxyXG4gIC8vIEdpdEh1YiBQYWdlcyBcdTUzRDFcdTVFMDNcdTY1RjZcdTRGN0ZcdTc1MjhcdTc2RjhcdTVCRjlcdThERUZcdTVGODRcdUZGMENcdTkwN0ZcdTUxNERcdTRFRDNcdTVFOTNcdTVCNTBcdThERUZcdTVGODRcdTVCRkNcdTgxRjRcdThENDRcdTZFOTAgNDA0XHJcbiAgYmFzZTogcHJvY2Vzcy5lbnYuR0lUSFVCX1BBR0VTID8gJy4vJyA6ICcvJyxcclxuICBlc2J1aWxkOiB7XHJcbiAgICAvLyBcdTUzRUFcdTUyNjUgZGVidWdnZXJcdUZGMENcdTRGRERcdTc1NTkgY29uc29sZS4qIFx1MjAxNFx1MjAxNCBcdTkwRThcdTdGNzJcdTU0MEVcdTYzMDkgRjEyIFx1NEVDRFx1ODBGRFx1NzcwQlx1NTIzMFx1OEZEMFx1ODg0Q1x1NjVGNlx1NjVFNVx1NUZEN1x1RkYwQ1x1NjVCOVx1NEZCRlx1NjM5Mlx1NjdFNVx1MzAwMlxyXG4gICAgZHJvcDogWydkZWJ1Z2dlciddLFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICAvLyBcdTU2RkFcdTVCOUFcdTY3MkNcdTU3MzBcdTVGMDBcdTUzRDFcdTdBRUZcdTUzRTNcdUZGMENzdHJpY3RQb3J0IFx1NEUwQlx1ODhBQlx1NTM2MFx1NzUyOFx1NEYxQVx1NzZGNFx1NjNBNVx1NjJBNVx1OTUxOVx1ODAwQ1x1NEUwRFx1NjYyRlx1OTc1OVx1OUVEOFx1NjM2Mlx1N0FFRlx1NTNFM1x1RkYwQ1xyXG4gICAgLy8gXHU0RkREXHU4QkMxXHU5ODg0XHU4OUM4XHU1NzMwXHU1NzQwXHU2QzM4XHU4RkRDXHU0RTBEXHU1M0Q4XHVGRjA4aHR0cDovL2xvY2FsaG9zdDo1MTczXHVGRjA5XHUzMDAyXHJcbiAgICBob3N0OiAnMTI3LjAuMC4xJyxcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGkvbWluaW1heC90MmEnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcGkubWluaW1heGkuY29tJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6ICgpID0+ICcvdjEvdDJhX3YyJyxcclxuICAgICAgICAvLyBSb3V0ZSB0byBcdTU2RkRcdTY3MEQgLyBcdTZENzdcdTU5MTYgYmFzZWQgb24gWC1NaW5pTWF4LVJlZ2lvbiBoZWFkZXIgc2VudCBieSB0aGUgY2xpZW50LlxyXG4gICAgICAgIHJvdXRlcjogKHJlcSkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgcmVnaW9uID0gU3RyaW5nKHJlcS5oZWFkZXJzWyd4LW1pbmltYXgtcmVnaW9uJ10gfHwgJycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICByZXR1cm4gcmVnaW9uID09PSAnb3ZlcnNlYXMnID8gJ2h0dHBzOi8vYXBpLm1pbmltYXguaW8nIDogJ2h0dHBzOi8vYXBpLm1pbmltYXhpLmNvbSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgJy9hcGkvbWluaW1heC9nZXQtdm9pY2UnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcGkubWluaW1heGkuY29tJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6ICgpID0+ICcvdjEvZ2V0X3ZvaWNlJyxcclxuICAgICAgICByb3V0ZXI6IChyZXEpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHJlZ2lvbiA9IFN0cmluZyhyZXEuaGVhZGVyc1sneC1taW5pbWF4LXJlZ2lvbiddIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlZ2lvbiA9PT0gJ292ZXJzZWFzJyA/ICdodHRwczovL2FwaS5taW5pbWF4LmlvJyA6ICdodHRwczovL2FwaS5taW5pbWF4aS5jb20nO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgICcvYXBpL21pbmltYXgvbXVzaWMnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcGkubWluaW1heGkuY29tJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6ICgpID0+ICcvdjEvbXVzaWNfZ2VuZXJhdGlvbicsXHJcbiAgICAgICAgcm91dGVyOiAocmVxKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZWdpb24gPSBTdHJpbmcocmVxLmhlYWRlcnNbJ3gtbWluaW1heC1yZWdpb24nXSB8fCAnJykudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgIHJldHVybiByZWdpb24gPT09ICdvdmVyc2VhcycgPyAnaHR0cHM6Ly9hcGkubWluaW1heC5pbycgOiAnaHR0cHM6Ly9hcGkubWluaW1heGkuY29tJztcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBcdTlDN0NcdTU4RjAgRmlzaCBBdWRpbyBUVFNcdUZGMUFcdThGNkNcdTUzRDFcdTUyMzAgaHR0cHM6Ly9hcGkuZmlzaC5hdWRpby92MS90dHNcdUZGMDhcdThGRDRcdTU2REVcdTRFOENcdThGREJcdTUyMzZcdTk3RjNcdTk4OTFcdUZGMDlcclxuICAgICAgJy9hcGkvZmlzaGF1ZGlvL3R0cyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5maXNoLmF1ZGlvJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6ICgpID0+ICcvdjEvdHRzJyxcclxuICAgICAgfSxcclxuICAgIH1cclxuICB9LFxyXG4gIHByZXZpZXc6IHtcclxuICAgIC8vIFx1NTZGQVx1NUI5QVx1Njc4NFx1NUVGQVx1NEVBN1x1NzI2OVx1OTg4NFx1ODlDOFx1N0FFRlx1NTNFM1x1RkYwQ1x1NEUwRSBvcGVuLWxvY2FsLXdlYi5iYXQgLyBsb2NhbC1zdGF0aWMtc2VydmVyLmNqcyBcdTRGRERcdTYzMDFcdTRFMDBcdTgxRjRcclxuICAgIGhvc3Q6ICcxMjcuMC4wLjEnLFxyXG4gICAgcG9ydDogNDE3MyxcclxuICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxyXG4gICAgLy8gXHU1MTczXHU5NUVEIHZpdGUgXHU3Njg0IGVtcHR5T3V0RGlyIFx1ODg0Q1x1NEUzQVx1MzAwMldvcmtCdWRkeSBcdTZDOTlcdTdCQjFcdTc2ODQgdHJhc2ggXHU1MzA1XHU4OEM1XHVGRjA4Z2VuaWUtc2FmZS1kZWxldGUuY2pzXHVGRjA5XHJcbiAgICAvLyBcdTU3MjggdHJhc2ggZGlzdCBcdTRFMEJcdTc2ODQgd29ya2VyL0pTIGJ1bmRsZSBcdTY1RjZcdTRGMUFcdTUwNzZcdTUzRDEgYWJvcnQgXHU1OTMxXHU4RDI1XHVGRjBDXHU4QkE5IHZpdGUgXHU2Nzg0XHU1RUZBXHU3NkY0XHU2M0E1XHU2MzAyXHU2Mzg5XHUzMDAyXHJcbiAgICAvLyBcdTUxNzNcdTk1RURcdTU0MEUgdml0ZSBcdTRFMERcdTUxOERcdTZFMDVcdTdBN0EgZGlzdFx1RkYwQ1x1NjVCMFx1NjU4N1x1NEVGNlx1NzZGNFx1NjNBNVx1ODk4Nlx1NzZENlx1MzAwMVx1NEZERFx1NzU1OVx1NjVFN1x1NzY4NCBoYXNoIFx1NTMxNlx1NjU4N1x1NEVGNlx1NTQwRFx1RkYxQlxyXG4gICAgLy8gSFRNTCBcdTUxNjVcdTUzRTNcdTZDMzhcdThGRENcdTYzMDdcdTU0MTFcdTY1QjAgaGFzaFx1RkYwQ1x1NjVFN1x1NjU4N1x1NEVGNlx1NkI4Qlx1NzU1OVx1NEY0Nlx1NEUwRFx1NTE4RFx1ODhBQlx1NUYxNVx1NzUyOFx1RkYwQ1x1NEUwRFx1NUY3MVx1NTRDRFx1NTI5Rlx1ODBGRFx1MzAwMlxyXG4gICAgLy8gXHU2MEYzXHU4OTgxXHU1RjdCXHU1RTk1XHU2RTA1XHU3NDA2XHU2NUY2XHU2MjRCXHU1MkE4IGBSZW1vdmUtSXRlbSBkaXN0IC1SZWN1cnNlIC1Gb3JjZWBcdUZGMDhcdTRFMDBcdTZCMjFcdTYwMjdcdTU0MENcdTYxMEZcdTYyNzlcdTkxQ0ZcdTUyMjBcdTk2NjRcdTUzNzNcdTUzRUZcdUZGMDlcdTMwMDJcclxuICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMjAwMCxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgLy8gXHU1MTczXHU5NTJFXHU0RkVFXHU1OTBEXHVGRjFBXHU1QzA2XHU4RkQ5XHU0RTlCXHU1MzA1XHU2MzkyXHU5NjY0XHU1NzI4XHU2MjUzXHU1MzA1XHU0RTRCXHU1OTE2XHVGRjBDXHU4QkE5XHU2RDRGXHU4OUM4XHU1NjY4XHU5MDFBXHU4RkM3IGluZGV4Lmh0bWwgXHU3Njg0IGltcG9ydG1hcCBcdTUyQTBcdThGN0RcclxuICAgICAgZXh0ZXJuYWw6IFsncGRmanMtZGlzdCcsICdrYXRleCddLFxyXG4gICAgICBvbndhcm4od2FybmluZywgZGVmYXVsdEhhbmRsZXIpIHtcclxuICAgICAgICAvLyBcdTYyOTFcdTUyMzZcdTUyQThcdTYwMDFcdTVCRkNcdTUxNjVcdTRFMEVcdTk3NTlcdTYwMDFcdTVCRkNcdTUxNjVcdTZERjdcdTU0MDhcdTc2ODRcdTY1RTBcdTVCQjNcdThCNjZcdTU0NEFcclxuICAgICAgICBpZiAod2FybmluZy5tZXNzYWdlPy5pbmNsdWRlcygnZHluYW1pYyBpbXBvcnQgd2lsbCBub3QgbW92ZSBtb2R1bGUgaW50byBhbm90aGVyIGNodW5rJykpIHJldHVybjtcclxuICAgICAgICBkZWZhdWx0SGFuZGxlcih3YXJuaW5nKTtcclxuICAgICAgfSxcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSBDdWJpc20gYWRhcHRlciB0aHJvd3MgZHVyaW5nIG1vZHVsZSBpbml0aWFsaXphdGlvbiB1bmxlc3MgdGhlXHJcbiAgICAgICAgICAgIC8vIHByb3ByaWV0YXJ5IEN1YmlzbSBDb3JlIGhhcyBhbHJlYWR5IGJlZW4gbG9hZGVkLiBLZWVwIGl0IG91dCBvZlxyXG4gICAgICAgICAgICAvLyB0aGUgc3RhcnR1cCB2ZW5kb3IgY2h1bms7IGxpdmUyZENvcmUgbG9hZHMgaXQgb24gZGVtYW5kLlxyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3VudGl0bGVkLXBpeGktbGl2ZTJkLWVuZ2luZScpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICdsaXZlMmQtcnVudGltZSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygnc2NoZWR1bGVyJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1yZWFjdCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcGhvc3Bob3ItaWNvbnMnKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLWljb25zJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0BjYXBhY2l0b3InKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLWNhcGFjaXRvcic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCd1dGlscy9tZW1vcnlQYWxhY2UnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ21lbW9yeS1wYWxhY2UnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcWXVcXFxcRG9jdW1lbnRzXFxcXENoYXRHUFRcXFxcbnVvbWlcXFxcU3VsbHlPUzg4OC13b3Jrc3BhY2VcXFxcU3VsbHlPUzg4OC1tYXN0ZXJcXFxcc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxZdVxcXFxEb2N1bWVudHNcXFxcQ2hhdEdQVFxcXFxudW9taVxcXFxTdWxseU9TODg4LXdvcmtzcGFjZVxcXFxTdWxseU9TODg4LW1hc3RlclxcXFxzZXJ2ZXJcXFxcYmFrZS12b2ljZS1taWRkbGV3YXJlLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ZdS9Eb2N1bWVudHMvQ2hhdEdQVC9udW9taS9TdWxseU9TODg4LXdvcmtzcGFjZS9TdWxseU9TODg4LW1hc3Rlci9zZXJ2ZXIvYmFrZS12b2ljZS1taWRkbGV3YXJlLnRzXCI7aW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSAnaHR0cCc7XG5cbmNvbnN0IERPTUVTVElDX0JBU0UgPSAnaHR0cHM6Ly9hcGkubWluaW1heGkuY29tJztcbmNvbnN0IE9WRVJTRUFTX0JBU0UgPSAnaHR0cHM6Ly9hcGkubWluaW1heC5pbyc7XG5cbnR5cGUgTWluaW1heFVybHMgPSB7IHQyYTogc3RyaW5nOyB1cGxvYWQ6IHN0cmluZzsgY2xvbmU6IHN0cmluZyB9O1xuXG5jb25zdCByZXNvbHZlTWluaW1heFVybHMgPSAocmVxOiBJbmNvbWluZ01lc3NhZ2UsIGJvZHlSZWdpb246IHVua25vd24pOiBNaW5pbWF4VXJscyA9PiB7XG4gIGNvbnN0IGJvZHlSID0gdHlwZW9mIGJvZHlSZWdpb24gPT09ICdzdHJpbmcnID8gYm9keVJlZ2lvbi50cmltKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuICBjb25zdCBoZWFkZXJSYXcgPSByZXEuaGVhZGVyc1sneC1taW5pbWF4LXJlZ2lvbiddO1xuICBjb25zdCBoZWFkZXJSID0gdHlwZW9mIGhlYWRlclJhdyA9PT0gJ3N0cmluZycgPyBoZWFkZXJSYXcudHJpbSgpLnRvTG93ZXJDYXNlKCkgOiAnJztcbiAgY29uc3QgZW52UiA9IHR5cGVvZiBwcm9jZXNzLmVudi5NSU5JTUFYX1JFR0lPTiA9PT0gJ3N0cmluZydcbiAgICA/IHByb2Nlc3MuZW52Lk1JTklNQVhfUkVHSU9OLnRyaW0oKS50b0xvd2VyQ2FzZSgpXG4gICAgOiAnJztcbiAgY29uc3QgcmVnaW9uID0gYm9keVIgfHwgaGVhZGVyUiB8fCBlbnZSO1xuICBjb25zdCBiYXNlID0gcmVnaW9uID09PSAnb3ZlcnNlYXMnID8gT1ZFUlNFQVNfQkFTRSA6IERPTUVTVElDX0JBU0U7XG4gIHJldHVybiB7XG4gICAgdDJhOiBgJHtiYXNlfS92MS90MmFfdjJgLFxuICAgIHVwbG9hZDogYCR7YmFzZX0vdjEvZmlsZXMvdXBsb2FkYCxcbiAgICBjbG9uZTogYCR7YmFzZX0vdjEvdm9pY2VfY2xvbmVgLFxuICB9O1xufTtcblxuY29uc3QgQ0xPTkVfU09VUkNFX1RFWFQgPSAnXHU1NzI4XHU0RTAwXHU0RTJBXHU5NjMzXHU1MTQ5XHU2NjBFXHU1QTlBXHU3Njg0XHU2NUU5XHU2NjY4XHVGRjBDXHU1QzBGXHU5RTFGXHU1NzI4XHU2NzlEXHU1OTM0XHU2QjIyXHU1RkVCXHU1NzMwXHU2QjRDXHU1NTMxXHVGRjBDXHU1RkFFXHU5OENFXHU4RjdCXHU4RjdCXHU2MkMyXHU4RkM3XHU4MTM4XHU1RTlFXHVGRjBDXHU1RTI2XHU2NzY1XHU0RTg2XHU4MkIxXHU2NzM1XHU3Njg0XHU4MkFDXHU4MkIzXHUzMDAyXHU4RkRDXHU1OTA0XHU3Njg0XHU1QzcxXHU1Q0U2XHU1NzI4XHU4NTg0XHU5NkZFXHU0RTJEXHU4MkU1XHU5NjkwXHU4MkU1XHU3M0IwXHVGRjBDXHU1QjlCXHU1OTgyXHU0RTAwXHU1RTQ1XHU2QzM0XHU1OEE4XHU3NTNCXHUzMDAyXHU0RUJBXHU0RUVDXHU2RjJCXHU2QjY1XHU1NzI4XHU2Nzk3XHU4MzZCXHU1QzBGXHU5MDUzXHU0RTBBXHVGRjBDXHU0RUFCXHU1M0Q3XHU3NzQwXHU4RkQ5XHU5NkJFXHU1Rjk3XHU3Njg0XHU1QjgxXHU5NzU5XHU2NUY2XHU1MTQ5XHUzMDAyXHU1QjY5XHU1QjUwXHU0RUVDXHU1NzI4XHU4MzQ5XHU1NzMwXHU0RTBBXHU1OTU0XHU4REQxXHU1QjA5XHU2MjBGXHVGRjBDXHU3QjExXHU1OEYwXHU1NkRFXHU4MzYxXHU1NzI4XHU3QTdBXHU2QzE0XHU0RTJEXHVGRjBDXHU4QkE5XHU0RUJBXHU2MTFGXHU1MjMwXHU2NUUwXHU2QkQ0XHU2RTI5XHU2Njk2XHU1NDhDXHU1RTc4XHU3OThGXHUzMDAyJztcblxuZnVuY3Rpb24gcmVhZEJvZHkocmVxOiBJbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcbiAgICByZXEub24oJ2RhdGEnLCAoY2h1bms6IEJ1ZmZlcikgPT4gY2h1bmtzLnB1c2goY2h1bmspKTtcbiAgICByZXEub24oJ2VuZCcsICgpID0+IHJlc29sdmUoQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKCd1dGYtOCcpKSk7XG4gICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFZpdGUgZGV2IG1pZGRsZXdhcmU6IFBPU1QgL2FwaS9taW5pbWF4L2Jha2Utdm9pY2VcbiAqXG4gKiAxLiBTeW50aGVzaXplcyBhIGxvbmcgYXVkaW8gc2FtcGxlIHVzaW5nIFQyQSB3aXRoIHVzZXIncyB0aW1iZXJfd2VpZ2h0c1xuICogMi4gVXBsb2FkcyB0aGUgYXVkaW8gdG8gTWluaU1heCAvdjEvZmlsZXMvdXBsb2FkXG4gKiAzLiBDYWxscyAvdjEvdm9pY2VfY2xvbmUgdG8gY3JlYXRlIGEgcGVybWFuZW50IHZvaWNlX2lkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiYWtlVm9pY2VNaWRkbGV3YXJlKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlKSB7XG4gIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnUE9TVCxPUFRJT05TJyk7XG4gIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnQ29udGVudC1UeXBlLFgtTWluaU1heC1SZWdpb24nKTtcblxuICBpZiAocmVxLm1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgcmVzLnN0YXR1c0NvZGUgPSAyMDQ7XG4gICAgcmVzLmVuZCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICByZXMuc3RhdHVzQ29kZSA9IDQwNTtcbiAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKGF3YWl0IHJlYWRCb2R5KHJlcSkpO1xuICAgIGNvbnN0IHsgYXBpS2V5LCB2b2ljZUlkLCBtb2RlbCwgdHRzUGF5bG9hZCwgZ3JvdXBJZCwgcmVnaW9uIH0gPSBib2R5O1xuXG4gICAgaWYgKCFhcGlLZXkpIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBhcGlLZXknKTtcbiAgICBpZiAoIXZvaWNlSWQpIHRocm93IG5ldyBFcnJvcignTWlzc2luZyB2b2ljZUlkJyk7XG4gICAgaWYgKCF0dHNQYXlsb2FkKSB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgdHRzUGF5bG9hZCcpO1xuXG4gICAgY29uc3QgdXJscyA9IHJlc29sdmVNaW5pbWF4VXJscyhyZXEsIHJlZ2lvbik7XG5cbiAgICAvLyBTdGVwIDE6IFN5bnRoZXNpemUgbG9uZyBhdWRpbyB3aXRoIHRpbWJlcl93ZWlnaHRzXG4gICAgY29uc3QgdDJhQm9keSA9IHtcbiAgICAgIC4uLnR0c1BheWxvYWQsXG4gICAgICB0ZXh0OiBDTE9ORV9TT1VSQ0VfVEVYVCxcbiAgICAgIHN0cmVhbTogZmFsc2UsXG4gICAgICBvdXRwdXRfZm9ybWF0OiAndXJsJyxcbiAgICAgIGF1ZGlvX3NldHRpbmc6IHsgZm9ybWF0OiAnbXAzJywgc2FtcGxlX3JhdGU6IDMyMDAwLCBiaXRyYXRlOiAxMjgwMDAsIGNoYW5uZWw6IDEgfSxcbiAgICB9O1xuICAgIGlmIChncm91cElkKSB0MmFCb2R5Lmdyb3VwX2lkID0gZ3JvdXBJZDtcblxuICAgIGNvbnNvbGUubG9nKCdbYmFrZS12b2ljZV0gc3RlcCAxOiBzeW50aGVzaXppbmcgbG9uZyBhdWRpbyBzYW1wbGUuLi4nLCB7IHRhcmdldDogdXJscy50MmEgfSk7XG4gICAgY29uc3QgdDJhUmVzID0gYXdhaXQgZmV0Y2godXJscy50MmEsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7YXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodDJhQm9keSksXG4gICAgfSk7XG4gICAgY29uc3QgdDJhRGF0YSA9IGF3YWl0IHQyYVJlcy5qc29uKCkgYXMgYW55O1xuICAgIGNvbnN0IHQyYVN0YXR1cyA9IHQyYURhdGE/LmJhc2VfcmVzcD8uc3RhdHVzX2NvZGU7XG4gICAgaWYgKHR5cGVvZiB0MmFTdGF0dXMgPT09ICdudW1iZXInICYmIHQyYVN0YXR1cyAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUMkEgZmFpbGVkOiAke3QyYURhdGE/LmJhc2VfcmVzcD8uc3RhdHVzX21zZyB8fCAndW5rbm93bid9YCk7XG4gICAgfVxuICAgIGNvbnN0IGF1ZGlvUmF3ID0gdDJhRGF0YT8uZGF0YT8uYXVkaW87XG4gICAgaWYgKCFhdWRpb1JhdyB8fCB0eXBlb2YgYXVkaW9SYXcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1QyQSByZXR1cm5lZCBubyBhdWRpbycpO1xuICAgIH1cblxuICAgIGxldCBhdWRpb0J1ZmZlcjogQnVmZmVyO1xuICAgIGlmICgvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KGF1ZGlvUmF3LnRyaW0oKSkpIHtcbiAgICAgIGNvbnN0IGF1ZGlvUmVzID0gYXdhaXQgZmV0Y2goYXVkaW9SYXcudHJpbSgpKTtcbiAgICAgIGlmICghYXVkaW9SZXMub2spIHRocm93IG5ldyBFcnJvcihgQXVkaW8gZG93bmxvYWQgZmFpbGVkOiBIVFRQICR7YXVkaW9SZXMuc3RhdHVzfWApO1xuICAgICAgYXVkaW9CdWZmZXIgPSBCdWZmZXIuZnJvbShhd2FpdCBhdWRpb1Jlcy5hcnJheUJ1ZmZlcigpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2xlYW5IZXggPSBhdWRpb1Jhdy50cmltKCkucmVwbGFjZSgvXjB4L2ksICcnKTtcbiAgICAgIGF1ZGlvQnVmZmVyID0gQnVmZmVyLmZyb20oY2xlYW5IZXgsICdoZXgnKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coYFtiYWtlLXZvaWNlXSBzdGVwIDEgZG9uZTogJHthdWRpb0J1ZmZlci5sZW5ndGh9IGJ5dGVzYCk7XG5cbiAgICAvLyBTdGVwIDI6IFVwbG9hZCBhdWRpbyBmb3IgY2xvbmluZ1xuICAgIGNvbnN0IGJvdW5kYXJ5ID0gYC0tLS1CYWtlVm9pY2Uke0RhdGUubm93KCl9YDtcbiAgICBjb25zdCBwYXJ0czogQnVmZmVyW10gPSBbXTtcbiAgICBwYXJ0cy5wdXNoKEJ1ZmZlci5mcm9tKFxuICAgICAgYC0tJHtib3VuZGFyeX1cXHJcXG5Db250ZW50LURpc3Bvc2l0aW9uOiBmb3JtLWRhdGE7IG5hbWU9XCJmaWxlXCI7IGZpbGVuYW1lPVwidm9pY2Vfc2FtcGxlLm1wM1wiXFxyXFxuQ29udGVudC1UeXBlOiBhdWRpby9tcGVnXFxyXFxuXFxyXFxuYFxuICAgICkpO1xuICAgIHBhcnRzLnB1c2goYXVkaW9CdWZmZXIpO1xuICAgIHBhcnRzLnB1c2goQnVmZmVyLmZyb20oJ1xcclxcbicpKTtcbiAgICBwYXJ0cy5wdXNoKEJ1ZmZlci5mcm9tKFxuICAgICAgYC0tJHtib3VuZGFyeX1cXHJcXG5Db250ZW50LURpc3Bvc2l0aW9uOiBmb3JtLWRhdGE7IG5hbWU9XCJwdXJwb3NlXCJcXHJcXG5cXHJcXG52b2ljZV9jbG9uZVxcclxcbmBcbiAgICApKTtcbiAgICBwYXJ0cy5wdXNoKEJ1ZmZlci5mcm9tKGAtLSR7Ym91bmRhcnl9LS1cXHJcXG5gKSk7XG4gICAgY29uc3QgbXVsdGlwYXJ0Qm9keSA9IEJ1ZmZlci5jb25jYXQocGFydHMpO1xuXG4gICAgY29uc29sZS5sb2coJ1tiYWtlLXZvaWNlXSBzdGVwIDI6IHVwbG9hZGluZyBhdWRpbyBmb3IgY2xvbmluZy4uLicpO1xuICAgIGNvbnN0IHVwbG9hZFJlcyA9IGF3YWl0IGZldGNoKHVybHMudXBsb2FkLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogYG11bHRpcGFydC9mb3JtLWRhdGE7IGJvdW5kYXJ5PSR7Ym91bmRhcnl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBtdWx0aXBhcnRCb2R5LFxuICAgIH0pO1xuICAgIGNvbnN0IHVwbG9hZERhdGEgPSBhd2FpdCB1cGxvYWRSZXMuanNvbigpIGFzIGFueTtcbiAgICBjb25zdCBmaWxlSWQgPSB1cGxvYWREYXRhPy5maWxlPy5maWxlX2lkO1xuICAgIGlmICghZmlsZUlkKSB7XG4gICAgICBjb25zdCBtc2cgPSB1cGxvYWREYXRhPy5iYXNlX3Jlc3A/LnN0YXR1c19tc2cgfHwgSlNPTi5zdHJpbmdpZnkodXBsb2FkRGF0YSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVwbG9hZCBmYWlsZWQ6ICR7bXNnfWApO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgW2Jha2Utdm9pY2VdIHN0ZXAgMiBkb25lOiBmaWxlX2lkPSR7ZmlsZUlkfWApO1xuXG4gICAgLy8gU3RlcCAzOiBDbG9uZSB2b2ljZVxuICAgIGNvbnNvbGUubG9nKCdbYmFrZS12b2ljZV0gc3RlcCAzOiBjbG9uaW5nIHZvaWNlLi4uJyk7XG4gICAgY29uc3QgY2xvbmVSZXMgPSBhd2FpdCBmZXRjaCh1cmxzLmNsb25lLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgZmlsZV9pZDogZmlsZUlkLFxuICAgICAgICB2b2ljZV9pZDogdm9pY2VJZCxcbiAgICAgICAgbW9kZWw6IG1vZGVsIHx8ICdzcGVlY2gtMi44LWhkJyxcbiAgICAgICAgdGV4dDogJ1x1NEY2MFx1NTk3RFx1RkYwQ1x1OEZEOVx1NjYyRlx1NTZGQVx1NUI5QVx1NTQwRVx1NzY4NFx1NThGMFx1OTdGM1x1RkYwQ1x1NTQyQ1x1NTQyQ1x1NzcwQlx1NjU0OFx1Njc5Q1x1NjAwRVx1NEU0OFx1NjgzN1x1RkYxRicsXG4gICAgICAgIG5lZWRfbm9pc2VfcmVkdWN0aW9uOiBmYWxzZSxcbiAgICAgICAgbmVlZF92b2x1bW5fbm9ybWFsaXphdGlvbjogdHJ1ZSxcbiAgICAgIH0pLFxuICAgIH0pO1xuICAgIGNvbnN0IGNsb25lRGF0YSA9IGF3YWl0IGNsb25lUmVzLmpzb24oKSBhcyBhbnk7XG4gICAgY29uc3QgY2xvbmVTdGF0dXMgPSBjbG9uZURhdGE/LmJhc2VfcmVzcD8uc3RhdHVzX2NvZGU7XG4gICAgaWYgKHR5cGVvZiBjbG9uZVN0YXR1cyA9PT0gJ251bWJlcicgJiYgY2xvbmVTdGF0dXMgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xvbmUgZmFpbGVkOiAke2Nsb25lRGF0YT8uYmFzZV9yZXNwPy5zdGF0dXNfbXNnIHx8IEpTT04uc3RyaW5naWZ5KGNsb25lRGF0YSl9YCk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBbYmFrZS12b2ljZV0gc3RlcCAzIGRvbmU6IHZvaWNlX2lkPSR7dm9pY2VJZH1gKTtcblxuICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZmlsZV9pZDogZmlsZUlkLFxuICAgICAgdm9pY2VfaWQ6IHZvaWNlSWQsXG4gICAgICBjbG9uZV9kYXRhOiBjbG9uZURhdGEsXG4gICAgfSkpO1xuICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tiYWtlLXZvaWNlXSBlcnJvcjonLCBlcnI/Lm1lc3NhZ2UpO1xuICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnI/Lm1lc3NhZ2UgfHwgJ2Jha2Utdm9pY2UgZmFpbGVkJyB9KSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ2EsU0FBUyxvQkFBb0I7QUFDN2IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZ0JBQWdCOzs7QUNBekIsSUFBTSxnQkFBZ0I7QUFDdEIsSUFBTSxnQkFBZ0I7QUFJdEIsSUFBTSxxQkFBcUIsQ0FBQyxLQUFzQixlQUFxQztBQUNyRixRQUFNLFFBQVEsT0FBTyxlQUFlLFdBQVcsV0FBVyxLQUFLLEVBQUUsWUFBWSxJQUFJO0FBQ2pGLFFBQU0sWUFBWSxJQUFJLFFBQVEsa0JBQWtCO0FBQ2hELFFBQU0sVUFBVSxPQUFPLGNBQWMsV0FBVyxVQUFVLEtBQUssRUFBRSxZQUFZLElBQUk7QUFDakYsUUFBTSxPQUFPLE9BQU8sUUFBUSxJQUFJLG1CQUFtQixXQUMvQyxRQUFRLElBQUksZUFBZSxLQUFLLEVBQUUsWUFBWSxJQUM5QztBQUNKLFFBQU0sU0FBUyxTQUFTLFdBQVc7QUFDbkMsUUFBTSxPQUFPLFdBQVcsYUFBYSxnQkFBZ0I7QUFDckQsU0FBTztBQUFBLElBQ0wsS0FBSyxHQUFHLElBQUk7QUFBQSxJQUNaLFFBQVEsR0FBRyxJQUFJO0FBQUEsSUFDZixPQUFPLEdBQUcsSUFBSTtBQUFBLEVBQ2hCO0FBQ0Y7QUFFQSxJQUFNLG9CQUFvQjtBQUUxQixTQUFTLFNBQVMsS0FBdUM7QUFDdkQsU0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDdEMsVUFBTSxTQUFtQixDQUFDO0FBQzFCLFFBQUksR0FBRyxRQUFRLENBQUMsVUFBa0IsT0FBTyxLQUFLLEtBQUssQ0FBQztBQUNwRCxRQUFJLEdBQUcsT0FBTyxNQUFNLFFBQVEsT0FBTyxPQUFPLE1B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QVE7QUFBQSxRQUNSLFNBQVMsTUFBTTtBQUFBLFFBQ2YsUUFBUSxDQUFDLFFBQVE7QUFDZixnQkFBTSxTQUFTLE9BQU8sSUFBSSxRQUFRLGtCQUFrQixLQUFLLEVBQUUsRUFBRSxZQUFZO0FBQ3pFLGlCQUFPLFdBQVcsYUFBYSwyQkFBMkI7QUFBQSxRQUM1RDtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsc0JBQXNCO0FBQUEsUUFDcEIsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxNQUFNO0FBQUEsTUFDakI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBO0FBQUEsSUFFUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1YLGFBQWE7QUFBQSxJQUNiLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQTtBQUFBLE1BRWIsVUFBVSxDQUFDLGNBQWMsT0FBTztBQUFBLE1BQ2hDLE9BQU8sU0FBUyxnQkFBZ0I7QUFFOUIsWUFBSSxRQUFRLFNBQVMsU0FBUyx3REFBd0QsRUFBRztBQUN6Rix1QkFBZSxPQUFPO0FBQUEsTUFDeEI7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGFBQWEsSUFBSTtBQUNmLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUkvQixnQkFBSSxHQUFHLFNBQVMsNkJBQTZCLEdBQUc7QUFDOUMscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDaEYscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLGlCQUFpQixHQUFHO0FBQ2xDLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxZQUFZLEdBQUc7QUFDN0IscUJBQU87QUFBQSxZQUNUO0FBQ0EsbUJBQU87QUFBQSxVQUNUO0FBQ0EsY0FBSSxHQUFHLFNBQVMsb0JBQW9CLEdBQUc7QUFDckMsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
