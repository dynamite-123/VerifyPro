import twilio from "twilio";

class TwilioService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.serviceSid = process.env.TWILIO_SERVICE_SID;
        
        if (!this.accountSid || !this.authToken || !this.serviceSid) {
            throw new Error("Twilio credentials are required in environment variables");
        }
        
        this.client = twilio(this.accountSid, this.authToken);
    }

    async sendOTP(phoneNumber) {
        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const verification = await this.client.verify.v2
                .services(this.serviceSid)
                .verifications
                .create({
                    to: formattedPhone,
                    channel: 'sms'
                });
            
            return {
                success: true,
                status: verification.status,
                sid: verification.sid
            };
        } catch (error) {
            console.error("Error sending OTP:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async verifyOTP(phoneNumber, code) {
        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const verificationCheck = await this.client.verify.v2
                .services(this.serviceSid)
                .verificationChecks
                .create({
                    to: formattedPhone,
                    code: code
                });
            
            return {
                success: verificationCheck.status === 'approved',
                status: verificationCheck.status,
                sid: verificationCheck.sid
            };
        } catch (error) {
            console.error("Error verifying OTP:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    formatPhoneNumber(phoneNumber) {
        let formatted = phoneNumber.toString().replace(/\D/g, '');
        
        if (formatted.length === 10) {
            formatted = '+91' + formatted;
        } else if (formatted.length === 12 && formatted.startsWith('91')) {
            formatted = '+' + formatted;
        } else if (!formatted.startsWith('+91')) {
            formatted = '+91' + formatted;
        }
        
        return formatted;
    }

    async sendCustomSMS(phoneNumber, message) {
        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            const sms = await this.client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedPhone
            });
            
            return {
                success: true,
                sid: sms.sid,
                status: sms.status
            };
        } catch (error) {
            console.error("Error sending SMS:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default TwilioService;
