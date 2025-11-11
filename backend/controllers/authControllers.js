import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc user sign up
// @route /api/auth/signup
export async function register(req, res) {
  const { full_name, email, phone_number, password, gender, preferred_language, literacy_level, role } = req.body;
  const hashed = await bcrypt.hash(password, 10); // explain this function
  const user = await User.create({
    full_name, email, phone_number,
    password_hash: hashed, gender,
    preferred_language, literacy_level, role
  });
  res.status(201).json({ message: 'User registered', user_id: user.user_id });
}

// @desc user log in
// @route /api/auth/login
export async function login(req, res) {
  const { email, phone_number, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user_id: user.user_id });
}

//seperate middleware for error handling?
// middleware?