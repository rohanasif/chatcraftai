// Filter out expected console errors during tests
const originalConsoleError = console.error;

console.error = (...args: any[]) => {
  const message = args.join(' ');

  // List of expected error messages that we want to suppress
  const expectedErrors = [
    // Authentication errors (expected in auth tests)
    'Token verification failed:',
    'jwt malformed',
    'jwt expired',
    'Malformed Authorization header',
    'Access token required',

    // Prisma constraint errors (expected in various tests)
    'Unique constraint failed on the fields: (`email`)',
    'An operation failed because it depends on one or more records that were required but not found',
    'Required exactly one parent ID to be present for connect query',

    // Email service errors (expected in invitation tests)
    'Failed to decode invitation token:',
    'Invalid base64 token',

    // Frontend chart errors (expected in test environment)
    'Failed to create chart:',
    'can\'t acquire context from the given item',

    // Network errors after tests complete (timing issues)
    'Failed to refresh user:',
    'socket hang up',
    'ECONNRESET',

    // Registration errors (expected in auth tests)
    'Registration error:',
    'User already exists',

    // Conversation creation errors (expected in tests)
    'Error creating direct chat:',
    'Error creating group chat:',
    'Error joining group:',
    'Failed to accept invitation:',

    // Message errors (expected in tests)
    'Failed to mark message as read:',
  ];

  // Check if this is an expected error
  const isExpectedError = expectedErrors.some(expected =>
    message.includes(expected)
  );

  // Only log unexpected errors
  if (!isExpectedError) {
    originalConsoleError(...args);
  }
};