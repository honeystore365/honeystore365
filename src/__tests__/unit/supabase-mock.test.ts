import { mockSuccessResponse, mockSupabaseClient } from '../mocks/supabase';

describe('Supabase Mock Tests', () => {
  it('should mock Supabase client responses', async () => {
    // Arrange
    const mockData = { id: '1', name: 'Test Product' };
    mockSupabaseClient.then.mockResolvedValueOnce(mockSuccessResponse(mockData));

    // Act
    const { data, error } = await mockSupabaseClient
      .from('products')
      .select('*')
      .eq('id', '1')
      .single();

    // Assert
    expect(error).toBeNull();
    expect(data).toEqual(mockData);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
    expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabaseClient.single).toHaveBeenCalled();
  });
});