import bcrypt from 'bcryptjs';

/**
 * Hashes a plain-text password using bcryptjs.
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
};

/**
 * Compares a plain-text password with a hashed password.
 * @param {string} password - The plain-text password to compare.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the passwords match, otherwise `false`.
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword); // Compare passwords
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing passwords: ' + error.message);
  }
};

export { hashPassword, comparePassword };