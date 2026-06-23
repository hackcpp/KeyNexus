import { guestTest, expect } from './fixtures/auth'

/**
 * 登录页面 E2E 测试
 * 验证未认证用户看到的登录界面及认证拦截行为
 */
guestTest.describe('登录页面 - 认证拦截', () => {
  guestTest('未登录用户应看到登录页面', async ({ guestPage }) => {
    await guestPage.goto('/')

    // 应显示登录卡片
    await expect(guestPage.locator('.login-card')).toBeVisible({ timeout: 15000 })
    await expect(guestPage.locator('.login-logo')).toHaveText('◆')
    await expect(guestPage.locator('h1')).toContainText('SoloBiz')
  })

  guestTest('登录页面应显示 Google 和 GitHub 登录按钮', async ({ guestPage }) => {
    await guestPage.goto('/')
    await expect(guestPage.locator('.login-card')).toBeVisible({ timeout: 15000 })

    const buttons = guestPage.locator('.login-buttons button')
    await expect(buttons).toHaveCount(2)
    await expect(buttons.nth(0)).toContainText('使用 Google 登录')
    await expect(buttons.nth(1)).toContainText('使用 GitHub 登录')
  })

  guestTest('访问 /vault 路由应被重定向到登录页', async ({ guestPage }) => {
    await guestPage.goto('/vault')
    await expect(guestPage.locator('.login-card')).toBeVisible({ timeout: 15000 })
  })

  guestTest('访问 /ledger 路由应被重定向到登录页', async ({ guestPage }) => {
    await guestPage.goto('/ledger')
    await expect(guestPage.locator('.login-card')).toBeVisible({ timeout: 15000 })
  })

  guestTest('登录页面标语文字正确', async ({ guestPage }) => {
    await guestPage.goto('/')
    await expect(guestPage.locator('.login-tagline')).toHaveText('千里之行，始于足下。')
  })
})
