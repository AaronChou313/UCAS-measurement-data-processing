import { defineConfig } from 'vitepress'
import taskLists from 'markdown-it-task-lists'

// Mark Python and course data as downloads, rather than document routes.
process.env.VITE_EXTRA_EXTENSIONS = 'py,dat'

export default defineConfig({
  lang: 'zh-CN',
  title: '测量数据处理',
  description: '测量数据处理理论与方法：六章系统笔记、知识点清单和可复现作业',
  base: '/UCAS-measurement-data-processing/',
  srcDir: '.site',
  srcExclude: ['public/**'],
  vite: { define: { 'import.meta.env.VITE_EXTRA_EXTENSIONS': JSON.stringify('py,dat') } },
  cleanUrls: false,
  markdown: {
    math: true,
    config(md) { md.use(taskLists) }
  },
  themeConfig: {
    siteTitle: '测量数据处理',
    nav: [
      { text: '课程笔记', link: '/notes/start' },
      { text: '知识点清单', link: '/checklist' },
      { text: '作业', link: '/homework/questions' },
      { text: '代码与数据', link: '/downloads' }
    ],
    sidebar: [
      { text: '开始学习', items: [
        { text: '课程首页', link: '/' },
        { text: '学习大纲与路径', link: '/guide' },
        { text: '阅读指南与统一符号', link: '/notes/start' },
        { text: '全课程知识点清单', link: '/checklist' }
      ] },
      { text: '六章系统笔记', items: [
        { text: '一 · 概述与线性变换', link: '/notes/chapter-1' },
        { text: '二 · 参数估计与最小二乘', link: '/notes/chapter-2' },
        { text: '三 · 回归、相关与 Fourier', link: '/notes/chapter-3' },
        { text: '四 · 误差、噪声与椭圆', link: '/notes/chapter-4' },
        { text: '五 · 泛化与正则化', link: '/notes/chapter-5' },
        { text: '六 · 时空、状态估计与神经网络', link: '/notes/chapter-6' }
      ] },
      { text: '课程作业', items: [
        { text: '逐课原题', link: '/homework/questions' },
        { text: '逐题解答', link: '/homework/answers' },
        { text: '作业原页图', link: '/homework/source-pages' },
        { text: '图表与复现', link: '/homework/reproduce' },
        { text: '代码与数据下载', link: '/downloads' }
      ] },
      { text: '资料与更新', collapsed: true, items: [
        { text: '覆盖核对', link: '/notes/coverage' },
        { text: '课件来源与版本', link: '/sources' },
        { text: '数据说明', link: '/data' },
        { text: '后续课件更新', link: '/maintenance' }
      ] }
    ],
    outline: { level: [2, 3], label: '本页目录' },
    search: { provider: 'local', options: { locales: { root: { translations: {
      button: { buttonText: '搜索课程', buttonAriaLabel: '搜索课程' },
      modal: { noResultsText: '没有找到相关内容', resetButtonTitle: '清除搜索', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } }
    } } } } },
    socialLinks: [{ icon: 'github', link: 'https://github.com/AaronChou313/UCAS-measurement-data-processing' }],
    editLink: { pattern: ({ frontmatter }) => 'https://github.com/AaronChou313/UCAS-measurement-data-processing/blob/main/' + encodeURI(frontmatter.sourceFile || 'README.md'), text: '查看 Markdown 原文' },
    docFooter: { prev: '上一页', next: '下一页' },
    sidebarMenuLabel: '课程目录',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换浅色模式',
    darkModeSwitchTitle: '切换深色模式',
    returnToTopLabel: '返回顶部',
    footer: { message: '课程学习整理 · 当前主线：2026 第 01—08 课 + 2025 第 09—14 课' }
  }
})
