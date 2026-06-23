import { test, expect, overrideLedgerApi } from './fixtures/auth'

/** Sample ledger entries for mocking API responses */
const MOCK_ENTRIES = [
  {
    id: 'entry-1',
    user_id: 'test-user-id-1234',
    type: 'income',
    amount: 5000,
    category: '工资',
    note: '六月工资',
    date: '2026-06-15',
    created_at: '2026-06-15T10:00:00.000Z',
  },
  {
    id: 'entry-2',
    user_id: 'test-user-id-1234',
    type: 'expense',
    amount: 120.5,
    category: '餐饮',
    note: '午餐',
    date: '2026-06-14',
    created_at: '2026-06-14T12:00:00.000Z',
  },
  {
    id: 'entry-3',
    user_id: 'test-user-id-1234',
    type: 'expense',
    amount: 50,
    category: '交通',
    note: '打车',
    date: '2026-06-10',
    created_at: '2026-06-10T09:00:00.000Z',
  },
]

/**
 * 收支账本 E2E 测试
 * 验证账本记录的创建、列表展示与统计功能
 */
test.describe('收支账本 - 已认证用户', () => {
  test('账本页面应显示标题', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })
  })

  test('账本页面默认显示统计标签页', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 默认应为统计 tab
    const statsTab = authPage.locator('.tabs .tab', { hasText: '统计' })
    await expect(statsTab).toHaveClass(/active/)
  })

  test('切换到记账标签页后应显示表单', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 点击记账 tab
    await authPage.locator('.tab', { hasText: '记账' }).click()

    // 记账表单应可见
    await expect(authPage.locator('.form-card')).toBeVisible()
    await expect(authPage.locator('.form-card form')).toBeVisible()
  })

  test('记账表单应包含收入/支出切换标签', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账
    await authPage.locator('.tab', { hasText: '记账' }).click()

    const tabs = authPage.locator('.form-card .tabs .tab')
    await expect(tabs.nth(0)).toContainText('收入')
    await expect(tabs.nth(1)).toContainText('支出')
  })

  test('记账表单应包含金额、日期、分类、备注字段', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账
    await authPage.locator('.tab', { hasText: '记账' }).click()

    await expect(authPage.locator('input[type="number"]')).toBeVisible()
    await expect(authPage.locator('input[type="date"]')).toBeVisible()

    const labels = authPage.locator('.form-card label')
    await expect(labels).toContainText(['金额', '日期', '分类', '备注'])
  })

  test('记账表单提交按钮默认应禁用（金额为空）', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账
    await authPage.locator('.tab', { hasText: '记账' }).click()

    const submitBtn = authPage.locator('.form-card button[type="submit"]')
    await expect(submitBtn).toBeDisabled()
  })

  test('填写金额后提交按钮应启用', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账
    await authPage.locator('.tab', { hasText: '记账' }).click()

    await authPage.locator('input[type="number"]').fill('100')
    const submitBtn = authPage.locator('.form-card button[type="submit"]')
    await expect(submitBtn).toBeEnabled()
  })

  test('应能切换收入/支出类型', async ({ authPage }) => {
    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账
    await authPage.locator('.tab', { hasText: '记账' }).click()

    const incomeTab = authPage.locator('.form-card .tab', { hasText: '收入' })
    const expenseTab = authPage.locator('.form-card .tab', { hasText: '支出' })

    // 默认应为收入
    await expect(incomeTab).toHaveClass(/active/)

    // 切换到支出
    await expenseTab.click()
    await expect(expenseTab).toHaveClass(/active/)

    // 切换回收入
    await incomeTab.click()
    await expect(incomeTab).toHaveClass(/active/)
  })

  test('列表展示已有的收支记录', async ({ authPage, page }) => {
    await overrideLedgerApi(page, MOCK_ENTRIES)

    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账 tab 以显示列表
    await authPage.locator('.tab', { hasText: '记账' }).click()

    // 等待列表加载
    await expect(authPage.locator('.vault-title')).toContainText('记录列表', { timeout: 10000 })

    // 应显示条目数量
    await expect(authPage.locator('.vault-header')).toContainText('3')

    // 应显示记录条目
    const entries = authPage.locator('.ledger-entry')
    await expect(entries).toHaveCount(3)
  })

  test('列表应支持按类型筛选（全部/收入/支出）', async ({ authPage, page }) => {
    await overrideLedgerApi(page, MOCK_ENTRIES)

    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账
    await authPage.locator('.tab', { hasText: '记账' }).click()

    await expect(authPage.locator('.vault-title')).toContainText('记录列表', { timeout: 10000 })

    // 筛选按钮
    const filterTabs = authPage.locator('.vault-section .tabs .tab')
    await expect(filterTabs).toHaveCount(3)
    await expect(filterTabs.nth(0)).toContainText('全部')
    await expect(filterTabs.nth(1)).toContainText('支出')
    await expect(filterTabs.nth(2)).toContainText('收入')
  })

  test('列表应支持搜索', async ({ authPage, page }) => {
    await overrideLedgerApi(page, MOCK_ENTRIES)

    await authPage.goto('/ledger')
    await expect(authPage.locator('.page-title')).toContainText('收支账本', { timeout: 15000 })

    // 切换到记账
    await authPage.locator('.tab', { hasText: '记账' }).click()

    await expect(authPage.locator('.vault-title')).toContainText('记录列表', { timeout: 10000 })

    // 搜索框应存在
    const searchInput = authPage.locator('.vault-section input[placeholder*="搜索"]')
    await expect(searchInput).toBeVisible()
  })
})
