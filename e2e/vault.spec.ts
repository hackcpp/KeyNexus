import { test, expect, overrideVaultApi } from './fixtures/auth'

/** Mock vault entries (encrypted payloads are dummy data for UI testing) */
const MOCK_KEYS = [
  {
    id: 'key-1',
    user_id: 'test-user-id-1234',
    name: 'OpenAI',
    type: 'simple',
    encrypted_payload: 'dummy-ciphertext-1',
    iv: 'dummy-iv-1',
    salt: 'dummy-salt-1',
    created_at: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'key-2',
    user_id: 'test-user-id-1234',
    name: 'AWS Production',
    type: 'pair',
    encrypted_payload: 'dummy-ciphertext-2',
    iv: 'dummy-iv-2',
    salt: 'dummy-salt-2',
    created_at: '2026-05-15T08:00:00.000Z',
  },
  {
    id: 'key-3',
    user_id: 'test-user-id-1234',
    name: '内部系统',
    type: 'userpass',
    encrypted_payload: 'dummy-ciphertext-3',
    iv: 'dummy-iv-3',
    salt: 'dummy-salt-3',
    created_at: '2026-04-20T14:00:00.000Z',
  },
]

/**
 * 密钥保险库 E2E 测试
 * 验证密钥的安全操作与数据展示
 */
test.describe('密钥保险库 - 已认证用户', () => {
  test('密钥管理页面应显示标题和添加表单', async ({ authPage }) => {
    await authPage.goto('/vault')

    await expect(authPage.locator('.page-title')).toContainText('密钥管理', { timeout: 15000 })

    // 添加密钥表单应可见
    await expect(authPage.locator('.form-card')).toBeVisible()
    await expect(authPage.locator('.form-header h3')).toContainText('添加密钥')
  })

  test('密钥表单应包含三种类型的标签页', async ({ authPage }) => {
    await authPage.goto('/vault')
    await expect(authPage.locator('.page-title')).toContainText('密钥管理', { timeout: 15000 })

    const tabs = authPage.locator('.form-card .tabs .tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toContainText('单密钥')
    await expect(tabs.nth(1)).toContainText('ID + 密钥')
    await expect(tabs.nth(2)).toContainText('用户名/密码')
  })

  test('默认类型为单密钥，应显示密钥输入框', async ({ authPage }) => {
    await authPage.goto('/vault')
    await expect(authPage.locator('.page-title')).toContainText('密钥管理', { timeout: 15000 })

    // 单密钥 tab 应为 active
    const simpleTab = authPage.locator('.form-card .tab', { hasText: '单密钥' })
    await expect(simpleTab).toHaveClass(/active/)

    // 名称输入框应可见
    await expect(authPage.locator('input[placeholder*="OpenAI"]')).toBeVisible()
  })

  test('密钥列表应展示已有的密钥条目', async ({ authPage, page }) => {
    await overrideVaultApi(page, MOCK_KEYS)

    await authPage.goto('/vault')
    await expect(authPage.locator('.page-title')).toContainText('密钥管理', { timeout: 15000 })

    // 等待列表加载
    await expect(authPage.locator('.vault-title')).toContainText('密钥列表', { timeout: 10000 })

    // 应显示密钥卡片
    const keyCards = authPage.locator('.key-card')
    await expect(keyCards).toHaveCount(3)

    // 验证密钥名称
    await expect(keyCards.nth(0).locator('.key-name')).toContainText('OpenAI')
    await expect(keyCards.nth(1).locator('.key-name')).toContainText('AWS Production')
    await expect(keyCards.nth(2).locator('.key-name')).toContainText('内部系统')
  })

  test('密钥卡片应显示类型标签', async ({ authPage, page }) => {
    await overrideVaultApi(page, MOCK_KEYS)

    await authPage.goto('/vault')
    await expect(authPage.locator('.vault-title')).toContainText('密钥列表', { timeout: 15000 })

    const badges = authPage.locator('.key-card .badge')
    await expect(badges.nth(0)).toContainText('simple')
    await expect(badges.nth(1)).toContainText('pair')
    await expect(badges.nth(2)).toContainText('userpass')
  })

  test('密钥卡片应包含操作按钮（编辑、删除）', async ({ authPage, page }) => {
    await overrideVaultApi(page, MOCK_KEYS)

    await authPage.goto('/vault')
    await expect(authPage.locator('.vault-title')).toContainText('密钥列表', { timeout: 15000 })

    const firstCard = authPage.locator('.key-card').first()
    await expect(firstCard.locator('.btn-edit')).toBeVisible()
    await expect(firstCard.locator('.btn-danger')).toBeVisible()
  })

  test('密钥列表应支持搜索', async ({ authPage, page }) => {
    await overrideVaultApi(page, MOCK_KEYS)

    await authPage.goto('/vault')
    await expect(authPage.locator('.vault-title')).toContainText('密钥列表', { timeout: 15000 })

    const searchInput = authPage.locator('.vault-header input[placeholder*="搜索"]')
    await expect(searchInput).toBeVisible()

    // 输入搜索关键词
    await searchInput.fill('OpenAI')

    // 应只显示匹配项
    const keyCards = authPage.locator('.key-card')
    await expect(keyCards).toHaveCount(1)
    await expect(keyCards.first().locator('.key-name')).toContainText('OpenAI')
  })

  test('空列表应显示空状态提示', async ({ authPage }) => {
    // 默认 mock 返回空列表
    await authPage.goto('/vault')
    await expect(authPage.locator('.vault-title')).toContainText('密钥列表', { timeout: 15000 })

    await expect(authPage.locator('.empty-state')).toContainText('暂无密钥')
  })

  test('删除操作应显示确认对话框', async ({ authPage, page }) => {
    await overrideVaultApi(page, MOCK_KEYS)

    await authPage.goto('/vault')
    await expect(authPage.locator('.vault-title')).toContainText('密钥列表', { timeout: 15000 })

    // 点击第一个卡片的删除按钮
    const deleteBtn = authPage.locator('.key-card').first().locator('.btn-danger')
    await deleteBtn.click()

    // 应显示确认/取消按钮
    await expect(authPage.locator('.key-card').first().locator('.confirm-actions')).toBeVisible()
    await expect(authPage.locator('.key-card').first().locator('.btn-confirm')).toHaveCount(2)
  })
})
