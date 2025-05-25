// client/src/services/authService.js (TEMPORARY VERY SIMPLE VERSION FOR TESTING)

console.log('--- [DEBUG] authService.js (simple) in services directory IS PARSED ---');

const simpleAuthService = {
  test: () => {
    return 'AuthService test function executed from services!';
  },
  // Add a dummy register function so RegisterPage doesn't break if we accidentally try to call it later
  register: async (userData) => {
    console.log('[DEBUG] Dummy authService.register called with:', userData);
    return Promise.resolve({ message: "Dummy registration from simple authService" });
  }
};

export default simpleAuthService;