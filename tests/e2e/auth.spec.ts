import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should allow user to register and login', async ({ page }) => {
    // Navigate to register page
    await page.goto('/register')
    
    // Fill registration form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to login with message
    await expect(page).toHaveURL('/login?message=Check je e-mail voor verificatie')
  })

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register')
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')
    
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Wachtwoorden komen niet overeen')).toBeVisible()
  })

  test('should show error for short password', async ({ page }) => {
    await page.goto('/register')
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')
    
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Wachtwoord moet minimaal 6 karakters zijn')).toBeVisible()
  })
})

test.describe('Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in real tests you'd use actual login
    await page.goto('/recipes')
  })

  test('should display recipes list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Recepten')
    await expect(page.locator('text=Nieuw')).toBeVisible()
  })

  test('should allow creating new recipe', async ({ page }) => {
    await page.click('text=Nieuw')
    
    // Should navigate to new recipe page
    await expect(page).toHaveURL('/recipes/new')
  })

  test('should allow searching recipes', async ({ page }) => {
    await page.fill('input[name="query"]', 'test recipe')
    await page.click('button[type="submit"]')
    
    // Should update URL with query parameter
    await expect(page).toHaveURL(/.*query=test%20recipe/)
  })
})

test.describe('Session Management', () => {
  test('should display session page with tabs', async ({ page }) => {
    // Mock session ID - in real tests you'd create an actual session
    const mockSessionId = 'test-session-id'
    await page.goto(`/sessions/${mockSessionId}`)
    
    // Should show session tabs
    await expect(page.locator('text=Notities')).toBeVisible()
    await expect(page.locator('text=Foto\'s')).toBeVisible()
    await expect(page.locator('text=Temperatuur')).toBeVisible()
  })
})

test.describe('Import Flow', () => {
  test('should display import page', async ({ page }) => {
    await page.goto('/import')
    
    await expect(page.locator('h1')).toContainText('Recept importeren')
    await expect(page.locator('input[type="url"]')).toBeVisible()
    await expect(page.locator('text=Preview')).toBeVisible()
  })

  test('should validate URL input', async ({ page }) => {
    await page.goto('/import')
    
    await page.fill('input[type="url"]', 'invalid-url')
    await page.click('text=Preview')
    
    // Should show validation error
    await expect(page.locator('text=Preview laden...')).toBeVisible()
  })
})

test.describe('Profile Management', () => {
  test('should display profile page', async ({ page }) => {
    await page.goto('/profile')
    
    await expect(page.locator('h1')).toContainText('Profiel')
    await expect(page.locator('text=Persoonlijke informatie')).toBeVisible()
    await expect(page.locator('text=BBQ voorkeuren')).toBeVisible()
    await expect(page.locator('text=Statistieken')).toBeVisible()
  })
})
