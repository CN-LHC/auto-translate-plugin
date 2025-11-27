# Auto Translate 插件

一个 VS Code/Cursor 扩展插件，可以自动翻译选中的文本（中英文互译）并替换原文本。

## 功能特性

- 🚀 快速翻译：选中文本后按快捷键即可翻译
- 🔄 自动检测语言：自动识别中文或英文
- ✨ 自动替换：翻译后自动替换选中内容
- 🎯 支持多种翻译服务：Google 翻译（免费）和百度翻译（需配置）

## 使用方法

1. **选中要翻译的文本**
2. **按快捷键翻译**：
   - Windows/Linux: `Ctrl+Shift+T`
   - Mac: `Cmd+Shift+T`
3. **或者使用命令面板**：
   - 按 `F1` 或 `Ctrl+Shift+P`
   - 输入 "翻译选中文本"
   - 回车执行

## 配置说明

### 翻译服务配置

插件支持三种翻译服务，你可以配置它们的优先级顺序：

1. **MyMemory Translation API**（免费，无需配置）- 推荐
2. **Google Translate API**（免费，可能不稳定）
3. **百度翻译 API**（需要配置 API 密钥，更稳定）

#### 配置翻译服务优先级

1. 打开设置（`Ctrl+,` 或 `Cmd+,`）
2. 搜索 "autoTranslate"
3. 找到 `autoTranslate.translationServices` 配置项
4. 设置翻译服务的优先级数组，例如：
   - `["mymemory", "google", "baidu"]` - 默认优先级
   - `["baidu", "mymemory"]` - 优先使用百度，失败后使用 MyMemory
   - `["google"]` - 只使用 Google 翻译

插件会按照配置的顺序依次尝试翻译服务，如果某个服务失败，会自动尝试下一个。

#### 使用百度翻译（可选，需要配置）

如果需要使用百度翻译 API，需要配置 API 密钥：

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册并创建应用，获取 App ID 和 App Key
3. 在 VS Code 设置中配置：
   - 打开设置（`Ctrl+,` 或 `Cmd+,`）
   - 搜索 "autoTranslate"
   - 配置 `autoTranslate.baiduAppId` 和 `autoTranslate.baiduAppKey`
   - 确保在 `autoTranslate.translationServices` 中包含 `"baidu"`

### 英文格式设置

当从中文翻译成英文时，可以设置英文单词之间的连接符格式：

1. 打开设置（`Ctrl+,` 或 `Cmd+,`）
2. 搜索 "autoTranslate"
3. 找到 `autoTranslate.englishCaseFormat` 配置项
4. 选择以下格式之一：
   - **pascal** - 大驼峰（PascalCase）：每个单词首字母大写
     - 示例：`Hello World` → `HelloWorld`
   - **camel** - 小驼峰（camelCase）：第一个单词小写，后续单词首字母大写
     - 示例：`Hello World` → `helloWorld`
   - **snake** - 下划线（snake_case）：单词之间用下划线连接
     - 示例：`Hello World` → `hello_world`
   - **space** - 空格（Space Case）：单词之间用空格连接，首字母大写
     - 示例：`hello world` → `Hello World`
   - **none** - 不格式化：保持翻译结果原样（默认）

**注意**：此设置仅在从中文翻译成英文时生效，英文翻译成中文时不会应用格式化。

## 安装方法

### 方法一：开发模式运行（推荐用于测试）

这是最简单的测试方式，适合开发和调试：

1. **安装依赖**：

   ```bash
   npm install
   ```

2. **编译代码**：

   ```bash
   npm run compile
   ```

3. **启动调试**：

   - 在 VS Code 中打开此项目
   - 按 `F5` 键，或点击菜单：`运行` → `启动调试`
   - 这会打开一个新的 VS Code 窗口（扩展开发宿主），插件已在该窗口中激活

4. **在新窗口中测试**：
   - 在新打开的窗口中打开任意文件
   - 选中一段文本
   - 按 `Ctrl+Shift+T`（Mac: `Cmd+Shift+T`）进行翻译

### 方法二：打包安装（推荐用于正式使用）

将插件打包成 `.vsix` 文件，然后安装到 VS Code：

1. **配置发布者名称**（首次打包前）：

   - 打开 `package.json`
   - 找到 `"publisher": "your-publisher-name"`
   - 将其替换为你的发布者名称（例如：你的 GitHub 用户名或组织名）
   - 发布者名称只能包含小写字母、数字、连字符和下划线

2. **安装依赖和编译**：

   ```bash
   npm install
   npm run compile
   ```

3. **打包插件**：

   ```bash
   npm run package
   ```

   这会生成一个 `auto-translate-0.0.1.vsix` 文件

4. **安装插件**：

   **方式 A - 命令行安装**：

   ```bash
   code --install-extension auto-translate-0.0.1.vsix
   ```

   **方式 B - 图形界面安装**：

   - 在 VS Code 中按 `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）
   - 输入 `Extensions: Install from VSIX...`
   - 选择生成的 `.vsix` 文件
   - 重启 VS Code

5. **验证安装**：
   - 按 `Ctrl+Shift+P` 打开命令面板
   - 输入 "翻译选中文本"，应该能看到该命令
   - 或直接使用快捷键 `Ctrl+Shift+T` 测试

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式编译
npm run watch
```

## 注意事项

- Google 翻译 API 是免费的，但可能在某些地区不稳定
- 百度翻译 API 需要申请，但更稳定可靠
- 翻译结果仅供参考，重要内容请人工校对

## 许可证

MIT
