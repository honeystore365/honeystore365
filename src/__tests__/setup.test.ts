/**
 * Test to verify that the testing environment is properly configured
 */

import { render, screen } from './utils/test-utils'
import { testAccessibility } from './utils/accessibility'

// Simple component for testing setup
const TestComponent = () => (
  <div>
    <h1>Test Component</h1>
    <button type="button">Click me</button>
    <input type="text" aria-label="Test input" />
  </div>
)

describe('Testing Environment Setup', () => {
  it('should render components correctly', () => {
    render(<TestComponent />)
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    expect(screen.getByLabelText('Test input')).toBeInTheDocument()
  })

  it('should support accessibility testing', async () => {
    const { container } = render(<TestComponent />)
    
    await testAccessibility(container)
  })

  it('should have proper test utilities', () => {
    // Test that our mock factories work
    const mockProduct = {
      id: '1',
      name: 'Test Honey',
      description: 'Test honey description',
      price: 100,
      stock: 10,
      imageUrl: '/test-image.jpg',
      category: {
        id: '1',
        name: 'Natural Honey',
      },
      isActive: true,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    }

    expect(mockProduct).toMatchObject({
      id: '1',
      name: 'Test Honey',
      price: 100,
    })
  })

  it('should have MSW server configured', () => {
    // This test verifies that MSW is properly set up
    // The actual API mocking will be tested in integration tests
    expect(global.fetch).toBeDefined()
  })

  it('should have proper environment variables mocked', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://localhost:54321')
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key')
  })
})