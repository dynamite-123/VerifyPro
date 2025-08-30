import nodemailer from "nodemailer";

// 1. Generate OTP
export function generateOTP() {
	return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

// 2. Create transporter function (lazy initialization)
function createTransporter() {
	console.log('Checking email configuration...');
	console.log('Gmail user:', process.env.GMAIL_USER ? 'Set' : 'Not set');
	console.log('Gmail password:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set');
	console.log('SMTP host:', process.env.SMTP_HOST);
	console.log('SMTP user:', process.env.SMTP_USER);
	console.log('SMTP password:', process.env.SMTP_PASS ? 'Set' : 'Not set');

	// Try Gmail first if credentials are available
	if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
		console.log('Using Gmail transporter');
		return nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_APP_PASSWORD,
			},
		});
	}

	// Fallback to SMTP configuration
	if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
		console.log('Using SMTP transporter');
		return nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: parseInt(process.env.SMTP_PORT) || 587,
			secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	}

	throw new Error("No email configuration found. Please set either GMAIL_USER/GMAIL_APP_PASSWORD or SMTP_HOST/SMTP_USER/SMTP_PASS");
}

// 3. Send email
export async function sendOTP(email) {
	const otp = generateOTP();

	// For testing purposes, log the OTP to console instead of sending email
	console.log(`\n🔐 OTP for user ${email}: ${otp}`);
	console.log('📧 In production, this would be sent via email\n');

	// Uncomment the lines below to enable actual email sending
	
	try {
		const transporter = createTransporter();

		const mailOptions = {
			from: process.env.GMAIL_USER ? `"VerifyPro" <${process.env.GMAIL_USER}>` : `"VerifyPro" <${process.env.SMTP_USER}>`,
			to: email,
			subject: "Your OTP Code",
			text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
		};

		console.log("Sending email with options:", {
			from: mailOptions.from,
			to: mailOptions.to,
			subject: mailOptions.subject,
			transporterType: process.env.GMAIL_USER ? 'Gmail' : 'SMTP'
		});

		const result = await transporter.sendMail(mailOptions);
		console.log("Email sent successfully:", result.messageId);
		return otp;
	} catch (error) {
		console.error("Email sending failed:", error);
		console.error("Error details:", {
			message: error.message,
			code: error.code,
			command: error.command
		});
		throw new Error(`Email sending failed: ${error.message}`);
	}
	

	return otp;
}
