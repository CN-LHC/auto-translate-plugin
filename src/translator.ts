import * as vscode from 'vscode'
import axios from 'axios'
import * as crypto from 'crypto'

/**
 * MyMemory Translation API 响应类型
 */
interface TranslationResponse {
  responseStatus: number
  responseData?: {
    translatedText: string
  }
}

/**
 * 检测文本语言（简单检测：包含中文字符为中文，否则为英文）
 */
function detectLanguage(text: string): 'zh' | 'en' {
  const chineseRegex = /[\u4e00-\u9fa5]/
  return chineseRegex.test(text) ? 'zh' : 'en'
}

/**
 * 使用免费翻译API进行翻译
 * 这里使用百度翻译API（需要申请API key）或使用免费的Google Translate API
 */
async function translateWithBaidu(text: string, from: string, to: string): Promise<string> {
  // 注意：这里需要配置API密钥
  // 可以在设置中配置，或使用环境变量
  const config = vscode.workspace.getConfiguration('autoTranslate')
  const appId = config.get<string>('baiduAppId', '')
  const appKey = config.get<string>('baiduAppKey', '')

  if (!appId || !appKey) {
    throw new Error('请先配置百度翻译API密钥（App ID 和 App Key）')
  }

  const salt = Date.now().toString()
  const sign = crypto
    .createHash('md5')
    .update(appId + text + salt + appKey)
    .digest('hex')

  const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
  const params = {
    q: text,
    from: from,
    to: to,
    appid: appId,
    salt: salt,
    sign: sign
  }

  try {
    const response = await axios.get(url, { params })
    if (response.data.trans_result && response.data.trans_result.length > 0) {
      return response.data.trans_result[0].dst
    }
    throw new Error('翻译结果为空')
  } catch (error: any) {
    throw new Error(`翻译API调用失败: ${error.message}`)
  }
}

/**
 * 将语言代码转换为 MyMemory API 需要的格式
 */
function convertLangCodeForMyMemory(lang: string): string {
  // MyMemory API 需要完整的语言代码
  if (lang === 'zh') {
    return 'zh-CN'
  }
  return lang
}

/**
 * 使用 MyMemory Translation API (免费，无需API密钥)
 */
async function translateWithMyMemory(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  try {
    // 转换语言代码为 MyMemory API 需要的格式
    const fromLangCode = convertLangCodeForMyMemory(fromLang)
    const toLangCode = convertLangCodeForMyMemory(toLang)

    const encodedText = encodeURIComponent(text)
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${fromLangCode}|${toLangCode}`

    const response = await axios.get(url)

    if (!response.data) {
      throw new Error(`翻译API请求失败: 响应数据为空`)
    }

    const data = response.data as TranslationResponse

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    } else {
      throw new Error(`翻译API返回错误: ${data.responseStatus || '未知错误'}`)
    }
  } catch (error: any) {
    throw new Error(`翻译服务不可用: ${error.message || String(error)}`)
  }
}

/**
 * 将语言代码转换为 Google Translate API 需要的格式
 */
function convertLangCodeForGoogle(lang: string): string {
  // Google Translate API 需要完整的语言代码
  if (lang === 'zh') {
    return 'zh-CN'
  }
  return lang
}

/**
 * 使用免费的Google Translate API（无需API密钥）
 * 注意：这个方法可能不稳定，建议使用官方API
 */
async function translateWithGoogleFree(text: string, from: string, to: string): Promise<string> {
  // 转换语言代码为 Google Translate API 需要的格式
  const fromLangCode = convertLangCodeForGoogle(from)
  const toLangCode = convertLangCodeForGoogle(to)

  const url = `https://translate.googleapis.com/translate_a/single`
  const params = {
    client: 'gtx',
    sl: fromLangCode,
    tl: toLangCode,
    dt: 't',
    q: text
  }

  try {
    const response = await axios.get(url, { params })
    if (response.data && response.data[0] && response.data[0][0]) {
      return response.data[0].map((item: any[]) => item[0]).join('')
    }
    throw new Error('翻译结果为空')
  } catch (error: any) {
    throw new Error(`翻译失败: ${error.message}`)
  }
}

/**
 * 翻译服务类型
 */
type TranslationService = 'mymemory' | 'google' | 'baidu'

/**
 * 英文格式类型
 */
type EnglishCaseFormat = 'pascal' | 'camel' | 'snake' | 'space' | 'none'

/**
 * 检测文本是否为驼峰格式（PascalCase 或 camelCase）
 */
function isCamelCase(text: string): boolean {
  // 检查是否包含大写字母，且没有空格、下划线或连字符
  // 例如：HelloWorld, helloWorld, getUserName
  return /^[a-z]+[A-Z]/.test(text) || /^[A-Z][a-z]+[A-Z]/.test(text)
}

/**
 * 将驼峰格式的文本拆分为单词数组
 */
function splitCamelCase(text: string): string[] {
  // 使用正则表达式匹配：小写字母+大写字母的边界，或连续的大写字母
  // 例如：HelloWorld -> [Hello, World]
  //      helloWorld -> [hello, World]
  //      getUserName -> [get, User, Name]
  //      XMLHttpRequest -> [XML, Http, Request]
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // 在小写和大写之间插入空格
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // 在连续大写字母和后面小写字母之间插入空格
    .split(/\s+/)
    .filter(word => word.length > 0)
}

/**
 * 将驼峰格式的英文文本转换为空格分隔的格式，以便翻译服务正确理解
 */
function normalizeEnglishForTranslation(text: string): string {
  // 如果文本是驼峰格式，先拆分成单词
  if (isCamelCase(text)) {
    const words = splitCamelCase(text)
    return words.join(' ').toLowerCase()
  }
  // 如果不是驼峰格式，保持原样
  return text
}

/**
 * 将英文文本转换为指定格式
 */
function formatEnglishText(text: string, format: EnglishCaseFormat): string {
  if (format === 'none') {
    return text
  }

  // 将文本分割成单词（处理各种分隔符和大小写）
  // 匹配单词边界，包括空格、连字符、下划线等
  const words = text
    .trim()
    .split(/[\s\-_]+/)
    .filter(word => word.length > 0)
    .map(word => word.toLowerCase())

  if (words.length === 0) {
    return text
  }

  switch (format) {
    case 'pascal':
      // 大驼峰：每个单词首字母大写
      return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')

    case 'camel':
      // 小驼峰：第一个单词小写，后续单词首字母大写
      return (
        words[0] +
        words
          .slice(1)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('')
      )

    case 'snake':
      // 下划线：单词之间用下划线连接，全部小写
      return words.join('_')

    case 'space':
      // 空格：单词之间用空格连接，首字母大写
      return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

    default:
      return text
  }
}

/**
 * 根据配置获取翻译服务优先级列表
 */
function getTranslationServices(): TranslationService[] {
  const config = vscode.workspace.getConfiguration('autoTranslate')
  const services = config.get<TranslationService[]>('translationServices', [
    'mymemory',
    'google',
    'baidu'
  ])
  // 过滤无效的服务名称
  return services.filter(
    (service): service is TranslationService =>
      service === 'mymemory' || service === 'google' || service === 'baidu'
  )
}

/**
 * 获取英文格式配置
 */
function getEnglishCaseFormat(): EnglishCaseFormat {
  const config = vscode.workspace.getConfiguration('autoTranslate')
  const format = config.get<EnglishCaseFormat>('englishCaseFormat', 'none')
  // 验证格式是否有效
  if (
    format === 'pascal' ||
    format === 'camel' ||
    format === 'snake' ||
    format === 'space' ||
    format === 'none'
  ) {
    return format
  }
  return 'none'
}

/**
 * 主翻译函数
 */
export async function translateText(text: string): Promise<string> {
  const detectedLang = detectLanguage(text)
  const targetLang = detectedLang === 'zh' ? 'en' : 'zh'
  const from = detectedLang === 'zh' ? 'zh' : 'en'
  const to = targetLang === 'zh' ? 'zh' : 'en'

  // 如果是英文且是驼峰格式，先转换为空格分隔的格式以便翻译
  let textToTranslate = text
  if (from === 'en' && isCamelCase(text)) {
    textToTranslate = normalizeEnglishForTranslation(text)
  }

  // 获取配置的翻译服务优先级列表
  const services = getTranslationServices()

  // 如果没有配置任何服务，使用默认顺序
  if (services.length === 0) {
    services.push('mymemory', 'google', 'baidu')
  }

  // 按配置的优先级顺序尝试翻译服务
  const errors: string[] = []
  let translatedText = ''

  for (const service of services) {
    try {
      switch (service) {
        case 'mymemory':
          translatedText = await translateWithMyMemory(textToTranslate, from, to)
          break
        case 'google':
          translatedText = await translateWithGoogleFree(textToTranslate, from, to)
          break
        case 'baidu':
          translatedText = await translateWithBaidu(textToTranslate, from, to)
          break
      }
      // 如果翻译成功，跳出循环
      break
    } catch (error: any) {
      errors.push(`${service}: ${error.message}`)
      // 继续尝试下一个服务
      continue
    }
  }

  // 如果所有服务都失败了，抛出错误
  if (!translatedText) {
    throw new Error(`所有翻译服务都不可用：\n${errors.join('\n')}\n\n请检查网络连接或配置API密钥`)
  }

  // 如果是从中文翻译到英文，应用格式设置
  if (from === 'zh' && to === 'en') {
    const format = getEnglishCaseFormat()
    return formatEnglishText(translatedText, format)
  }

  return translatedText
}
