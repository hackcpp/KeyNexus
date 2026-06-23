import { test, expect } from './fixtures/auth'

/**
 * 系统总览（Dashboard）E2E 测试
 * 验证已认证用户看到的总览页面
 */
test.describe('系统总览 - 已认证用户', () => {
  test('总览页面应显示页面标题', async ({ authPage }) => {
    await authPage.goto('/')
    await expect(authPage.locator('.page-title')).toContainText('系统总览', { timeout: 15000 })
  })

  test('总览页面应显示侧边栏导航', async ({ authPage }) => {
    await authPage.goto('/')
    await expect(authPage.locator('.sidebar')).toBeVisible({ timeout: 15000 })
    await expect(authPage.locator('.sidebar-brand .sidebar-title')).toContainText('SoloBiz')
  })

  test('侧边栏应包含所有导航项', async ({ authPage }) => {
    await authPage.goto('/')
    await expect(authPage.locator('.sidebar')).toBeVisible({ timeout: 15000 })

    const navLinks = authPage.locator('.sidebar-nav .sidebar-link')
    await expect(navLinks).toHaveCount(3)
    await expect(navLinks.nth(0)).toContainText('系统总览')
    await expect(navLinks.nth(1)).toContainText('密钥管理')
    await expect(navLinks.nth(2)).toContainText('收支账本')
  })

  test('总览页面应显示累计统计和本月概况', async ({ authPage }) => {
    await authPage.goto('/')
    await expect(authPage.locator('.page-title')).toContainText('系统总览', { timeout: 15000 })

    // 累计统计
    await expect(authPage.locator('.section-subtitle').first()).toContainText('累计统计')

    // 本月概况
    await expect(authPage.locator('.section-subtitle').nth(1)).toContainText('本月概况')

    // 统计卡片
    const statCards = authPage.locator('.stat-card')
    await expect(statCards).toHaveCount(6) // 3 for cumulative + 3 for monthly
  })

  test('总览页面应显示快捷入口', async ({ authPage }) => {
    await authPage.goto('/')
    await expect(authPage.locator('.page-title')).toContainText('系统总览', { timeout: 15000 })

    const quickLinks = authPage.locator('.quick-link')
    await expect(quickLinks).toHaveCount(2)
    await expect(quickLinks.nth(0)).toContainText('密钥管理')
    await expect(quickLinks.nth(1)).toContainText('收支账本')
  })

  test('侧边栏应包含退出登录按钮', async ({ authPage }) => {
    await authPage.goto('/')
    await expect(authPage.locator('.sidebar')).toBeVisible({ timeout: 15000 })

    await expect(authPage.locator('.sidebar-footer button')).toContainText('退出登录')
  })
})
