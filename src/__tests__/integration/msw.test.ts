import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { setupIntegrationTest } from '../utils/test-env-setup';

// Setup the test environment
setupIntegrationTest();

describe('MSW Integration Tests', () => {
  it('should intercept API requests', async () => {
    // Arrange - Add a custom handler for this test
    server.use(
      http.get('/api/test', () => {
        return HttpResponse.json({ message: 'MSW is working!' });
      })
    );

    // Act
    const response = await fetch('/api/test');
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'MSW is working!' });
  });
});