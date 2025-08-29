import nodemailer from "nodemailer";

// 1. Generate OTP
export function generateOTP() {
	return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

// 2. Create transporter function (lazy initialization)
function createTransporter() {
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.GMAIL_USER,
			pass: process.env.GMAIL_APP_PASSWORD, // Use Gmail app password
		},
	});
}

// 3. Send email
export async function sendOTP(email) {
	const otp = generateOTP();

	// Create transporter when needed (after env vars are loaded)
	const transporter = createTransporter();

	const mailOptions = {
		from: `"VerifyPro" <${process.env.GMAIL_USER}>`,
		to: email,
		subject: "Your OTP Code",
		text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
	};

	try {
		console.log("Sending email with options:", { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });
		console.log("Using Gmail credentials:", { user: process.env.GMAIL_USER, hasPassword: !!process.env.GMAIL_APP_PASSWORD });
		
		const result = await transporter.sendMail(mailOptions);
		console.log("Email sent successfully:", result.messageId);
		return otp;
	} catch (error) {
		console.error("Email sending failed:", error);
		throw new Error(`Email sending failed: ${error.message}`);
	}
}
