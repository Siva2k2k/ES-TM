// Load environment variables from parent directory first
require("dotenv").config({ path: "../.env.development" });

if (process.env.NODE_ENV === "development") {
  const mockDate = process.env.MOCK_DATE || new Date().toISOString();
  const mockTZ = process.env.MOCK_TZ || "UTC";

  // Store the original Date before we override it
  const OriginalDate = globalThis.Date;

  // Create mock implementation as a regular function
  function MockDateConstructor(...args) {
    if (new.target) {
      // Called with 'new'
      if (args.length === 0) {
        return new OriginalDate(mockDate);
      }
      return new OriginalDate(...args);
    } else {
      // Called as function
      if (args.length === 0) {
        return new OriginalDate(mockDate).toString();
      }
      return new OriginalDate(...args).toString();
    }
  }

  // Copy prototype and static methods
  MockDateConstructor.prototype = OriginalDate.prototype;
  MockDateConstructor.now = () => new OriginalDate(mockDate).getTime();
  MockDateConstructor.parse = OriginalDate.parse;
  MockDateConstructor.UTC = OriginalDate.UTC;
  MockDateConstructor.length = OriginalDate.length;
  MockDateConstructor.name = "Date";

  // Set up prototype chain properly
  Object.setPrototypeOf(MockDateConstructor, OriginalDate);

  // Override after a slight delay to ensure modules are loaded
  setImmediate(() => {
    globalThis.Date = MockDateConstructor;
  });

  process.env.TZ = mockTZ;
  console.log(`[🕒 Backend Mock Active] Date=${mockDate}, TZ=${mockTZ}`);
}
