const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Temporary OTP storage (in-memory) - only saved to DB after verification
const pendingOtps = new Map();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chethanrohit0045@gmail.com',
    pass: 'bhhy aucu whxr fzmo'
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp, name) {
  const mailOptions = {
    from: '"KVS Bricks" <chethanrohit0045@gmail.com>',
    to: email,
    subject: 'KVS Bricks - Your OTP Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: #2c1810; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0;">KVS Bricks</h1>
        </div>
        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hello <strong>${name || 'User'}</strong>,</p>
          <p style="font-size: 14px; color: #555;">Your OTP verification code is:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #c0392b; letter-spacing: 8px; background: #f4f1ee; padding: 15px 30px; border-radius: 8px;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #888;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">KVS Bricks Management System</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// POST /register - Send OTP to email (does NOT save user to DB)
router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check if already registered
    const existing = await User.findOne({ email: email.toLowerCase(), is_verified: true });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    const otp = generateOTP();
    const otp_expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP in memory only, NOT in database
    pendingOtps.set(email.toLowerCase(), { name, otp, otp_expiry });

    await sendOTPEmail(email, otp, name);

    res.json({ message: 'OTP sent to your email', email });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /verify-otp - Verify OTP, THEN create user in DB
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailLower = email.toLowerCase();
    const pending = pendingOtps.get(emailLower);

    if (!pending) {
      return res.status(400).json({ error: 'No OTP found. Please register again.' });
    }

    if (pending.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > pending.otp_expiry) {
      pendingOtps.delete(emailLower);
      return res.status(400).json({ error: 'OTP expired. Please register again.' });
    }

    // OTP verified - NOW create user in database
    const user = await User.create({
      name: pending.name,
      email: emailLower,
      is_verified: true
    });

    // Clean up
    pendingOtps.delete(emailLower);

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Registration successful', token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /login - Send OTP to registered email
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), is_verified: true });
    if (!user) {
      return res.status(404).json({ error: 'Email not registered. Please register first.' });
    }

    const otp = generateOTP();
    const otp_expiry = Date.now() + 5 * 60 * 1000;

    // Store login OTP in memory
    pendingOtps.set('login_' + email.toLowerCase(), { userId: user._id, name: user.name, otp, otp_expiry });

    await sendOTPEmail(email, otp, user.name);

    res.json({ message: 'OTP sent to your email', email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /login/verify - Verify login OTP
router.post('/login/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailLower = email.toLowerCase();
    const pending = pendingOtps.get('login_' + emailLower);

    if (!pending) {
      return res.status(400).json({ error: 'No OTP found. Please request again.' });
    }

    if (pending.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > pending.otp_expiry) {
      pendingOtps.delete('login_' + emailLower);
      return res.status(400).json({ error: 'OTP expired. Please request again.' });
    }

    // Clean up
    pendingOtps.delete('login_' + emailLower);

    const token = jwt.sign(
      { userId: pending.userId, name: pending.name, email: emailLower },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user: { name: pending.name, email: emailLower } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /register/password - Register with email and password
router.post('/register/password', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const existing = await User.findOne({ email: email.toLowerCase(), is_verified: true });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      is_verified: true
    });

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Registration successful', token, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Password register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /login/password - Login with email and password
router.post('/login/password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), is_verified: true });
    if (!user) {
      return res.status(404).json({ error: 'Email not registered. Please register first.' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account uses OTP login. Please use OTP to login.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
