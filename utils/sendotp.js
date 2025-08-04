import nodemailer from 'nodemailer';

const sendOtp = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `VIN Auth <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    html: `<h2>Your OTP is: ${otp}</h2><p>This OTP is valid for 10 minutes.</p>`
  });
};

export default sendOtp;
