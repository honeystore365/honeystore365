const cookies = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
}));

module.exports = {
  cookies,
};
