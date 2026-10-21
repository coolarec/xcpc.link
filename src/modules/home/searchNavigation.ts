export const scrollToSearchTarget = (
  target: HTMLElement,
  mobile: boolean,
  browser: Window = window,
): (() => void) => {
  if (!mobile) {
    target.scrollIntoView({
      behavior: browser.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
    return () => {}
  }

  // QQ 等内置浏览器可能忽略平滑滚动；使用旧式数值 API，并在键盘收起后校正位置。
  const scroll = () => {
    if (!target.isConnected) return
    const top = target.getBoundingClientRect().top + browser.pageYOffset - 18
    browser.scrollTo(0, Math.max(0, top))
  }
  scroll()
  const timer = browser.setTimeout(scroll, 350)
  return () => browser.clearTimeout(timer)
}
