import { http, HttpResponse } from 'msw'
import { createMockCart, createMockOrder, createMockProduct, createMockUser } from '../utils/test-utils'

// Mock data
const mockProducts = [
  createMockProduct({ id: '1', name: 'عسل الزهور', price: 150 }),
  createMockProduct({ id: '2', name: 'عسل السدر', price: 200 }),
  createMockProduct({ id: '3', name: 'عسل الأكاسيا', price: 180 }),
]

const mockUsers = [
  createMockUser({ id: '1', email: 'user1@example.com' }),
  createMockUser({ id: '2', email: 'user2@example.com' }),
]

const mockCarts = [
  createMockCart({ id: '1', customerId: '1' }),
]

const mockOrders = [
  createMockOrder({ id: '1', customerId: '1' }),
]

export const handlers = [
  // Products API
  http.get('/api/products', () => {
    return HttpResponse.json({
      success: true,
      data: mockProducts,
    })
  }),

  http.get('/api/products/:id', ({ params }) => {
    const { id } = params
    const product = mockProducts.find(p => p.id === id)
    
    if (!product) {
      return HttpResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: product,
    })
  }),

  // Cart API
  http.get('/api/cart', () => {
    return HttpResponse.json({
      success: true,
      data: mockCarts[0],
    })
  }),

  http.post('/api/cart/add', async ({ request }) => {
    const body = await request.json() as { productId: string; quantity: number }
    
    if (!body.productId || !body.quantity) {
      return HttpResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      message: 'Item added to cart',
    })
  }),

  http.delete('/api/cart/remove/:itemId', ({ params }) => {
    const { itemId } = params
    
    if (!itemId) {
      return HttpResponse.json(
        { success: false, error: 'Item ID required' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      message: 'Item removed from cart',
    })
  }),

  // Orders API
  http.get('/api/orders', () => {
    return HttpResponse.json({
      success: true,
      data: mockOrders,
    })
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = await request.json() as any
    
    if (!body.items || !body.shippingAddress) {
      return HttpResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newOrder = createMockOrder({
      id: Date.now().toString(),
      ...body,
    })

    return HttpResponse.json({
      success: true,
      data: newOrder,
    })
  }),

  // Auth API
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    const user = mockUsers.find(u => u.email === body.email)
    
    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: { user, token: 'mock-jwt-token' },
    })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string; password: string; firstName: string; lastName: string }
    
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return HttpResponse.json(
        { success: false, error: 'All fields required' },
        { status: 400 }
      )
    }

    const newUser = createMockUser({
      id: Date.now().toString(),
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    })

    return HttpResponse.json({
      success: true,
      data: { user: newUser, token: 'mock-jwt-token' },
    })
  }),

  // Admin API
  http.post('/api/admin/update-role', async ({ request }) => {
    const body = await request.json() as { userId: string; role: string }
    
    if (!body.userId || !body.role) {
      return HttpResponse.json(
        { success: false, error: 'User ID and role required' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      message: 'User role updated successfully',
    })
  }),

  // Search API
  http.get('/api/products/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const category = url.searchParams.get('category')
    
    let filteredProducts = mockProducts
    
    if (query) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.id === category
      )
    }

    return HttpResponse.json({
      success: true,
      data: filteredProducts,
    })
  }),

  // User profile API
  http.get('/api/profile', () => {
    return HttpResponse.json({
      success: true,
      data: mockUsers[0],
    })
  }),

  http.put('/api/profile', async ({ request }) => {
    const body = await request.json() as Partial<typeof mockUsers[0]>
    
    const updatedUser = { ...mockUsers[0], ...body }
    
    return HttpResponse.json({
      success: true,
      data: updatedUser,
    })
  }),

  // Categories API
  http.get('/api/categories', () => {
    const mockCategories = [
      { id: '1', name: 'عسل الزهور', description: 'عسل طبيعي من الزهور' },
      { id: '2', name: 'عسل السدر', description: 'عسل السدر الأصلي' },
      { id: '3', name: 'عسل الأكاسيا', description: 'عسل الأكاسيا الطبيعي' },
    ]
    
    return HttpResponse.json({
      success: true,
      data: mockCategories,
    })
  }),

  // Error simulation endpoints for testing
  http.get('/api/test/error', () => {
    return HttpResponse.json(
      { success: false, error: 'Simulated server error' },
      { status: 500 }
    )
  }),

  http.get('/api/test/timeout', () => {
    return new Promise(() => {
      // Never resolves to simulate timeout
    })
  }),

  http.get('/api/test/unauthorized', () => {
    return HttpResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }),

  http.get('/api/test/forbidden', () => {
    return HttpResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )
  }),

  http.get('/api/test/not-found', () => {
    return HttpResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    )
  }),

  http.get('/api/test/validation-error', () => {
    return HttpResponse.json(
      { 
        success: false, 
        error: 'Validation failed',
        details: {
          field: 'email',
          message: 'Invalid email format'
        }
      },
      { status: 400 }
    )
  }),
]