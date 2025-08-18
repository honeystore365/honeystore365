import { http, HttpResponse } from 'msw'
import { createMockCart, createMockOrder, createMockProduct, createMockUser } from '../../utils/test-utils'

// API handlers for MSW
export const handlers = [
  // Products API
  http.get('/api/products', () => {
    return HttpResponse.json({
      products: [
        createMockProduct({ id: '1' }),
        createMockProduct({ id: '2', name: 'Premium Honey' }),
        createMockProduct({ id: '3', name: 'Royal Jelly' }),
      ],
    })
  }),

  http.get('/api/products/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      product: createMockProduct({ id: id as string }),
    })
  }),

  // Cart API
  http.get('/api/cart', () => {
    return HttpResponse.json({
      cart: createMockCart({
        items: [
          createMockProduct({ id: '1', quantity: 2 }),
        ],
      }),
    })
  }),

  http.post('/api/cart', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      cart: createMockCart({
        items: [
          { ...createMockProduct(), ...body },
        ],
      }),
    })
  }),

  // Orders API
  http.get('/api/orders', () => {
    return HttpResponse.json({
      orders: [
        createMockOrder({ id: '1' }),
        createMockOrder({ id: '2', status: 'processing' }),
      ],
    })
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      order: createMockOrder({ id: id as string }),
    })
  }),

  // Auth API
  http.post('/api/auth/login', async () => {
    return HttpResponse.json({
      user: createMockUser(),
      session: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    })
  }),

  http.post('/api/auth/register', async () => {
    return HttpResponse.json({
      user: createMockUser(),
      session: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // Error handlers for testing
  http.get('/api/error/500', () => {
    return HttpResponse.error()
  }),

  http.get('/api/error/404', () => {
    return new HttpResponse(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }),

  http.get('/api/error/401', () => {
    return new HttpResponse(null, {
      status: 401,
      statusText: 'Unauthorized',
    })
  }),
]