// Manual mock for Redis
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();

const createClient = jest.fn().mockImplementation(() => {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockImplementation((key) => {
      return mockRedisGet(key);
    }),
    set: jest.fn().mockImplementation((key, value, options) => {
      return mockRedisSet(key, value, options);
    }),
    quit: jest.fn().mockResolvedValue(undefined),
  };
});

export { createClient, mockRedisGet, mockRedisSet };
