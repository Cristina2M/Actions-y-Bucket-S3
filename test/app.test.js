const { incrementar } = require('../src/app');

test('incrementar 0 -> 1', () => {
  expect(incrementar(0)).toBe(1);
});

test('incrementar 5 -> 6', () => {
  expect(incrementar(5)).toBe(6);
});
