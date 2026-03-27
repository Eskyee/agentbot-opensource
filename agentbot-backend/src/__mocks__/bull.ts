// Stub for 'bull' queue library — used only in test mocks, not a runtime dep
const Bull = jest.fn().mockImplementation(() => ({
  process: jest.fn(),
  add:     jest.fn(),
  on:      jest.fn(),
}));
export default Bull;
