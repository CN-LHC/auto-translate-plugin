import * as vscode from 'vscode';
import { translateText } from './translator';

export function activate(context: vscode.ExtensionContext) {
    console.log('Auto Translate 插件已激活');

    // 注册翻译命令
    let disposable = vscode.commands.registerCommand('autoTranslate.translate', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showWarningMessage('请先打开一个文件');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText || selectedText.trim().length === 0) {
            vscode.window.showWarningMessage('请先选中要翻译的文本');
            return;
        }

        try {
            // 显示进度提示
            vscode.window.setStatusBarMessage('正在翻译...', 1000);
            
            // 执行翻译
            const translatedText = await translateText(selectedText.trim());
            
            if (translatedText) {
                // 替换选中的文本
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, translatedText);
                });
                
                vscode.window.showInformationMessage('翻译完成！');
            } else {
                vscode.window.showErrorMessage('翻译失败，请稍后重试');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`翻译出错: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

