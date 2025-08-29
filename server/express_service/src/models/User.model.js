import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        phoneVerified: {
            type: Boolean,
            default: false
        },
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        photo: {
            type: String,
            default: ""
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6
        },
        refreshToken: {
            type: String
        },
        aadhaarCard: {
            aadhaar_number: {
                type: String,
                trim: true,
                sparse: true, // Only enforce uniqueness if field exists
                default: undefined,
                // ensure null/empty values are not stored (so sparse index ignores them)
                set: v => (v === null || v === '' ? undefined : v)
            },
            full_name: {
                type: String,
                trim: true
            },
            date_of_birth: {
                type: String,
                trim: true
            },
            gender: {
                type: String,
                trim: true
            },
            address: {
                type: String,
                trim: true
            },
            father_name: {
                type: String,
                trim: true
            },
            phone_number: {
                type: String,
                trim: true
            },
            email: {
                type: String,
                trim: true
            },
            pin_code: {
                type: String,
                trim: true
            },
            state: {
                type: String,
                trim: true
            },
            district: {
                type: String,
                trim: true
            },
            verified: {
                type: Boolean,
                default: false
            }
        },
        panCard: {
            pan_number: {
                type: String,
                trim: true,
                sparse: true, // Only enforce uniqueness if field exists
                default: undefined,
                // ensure null/empty values are not stored (so sparse index ignores them)
                set: v => (v === null || v === '' ? undefined : v)
            },
            full_name: {
                type: String,
                trim: true
            },
            father_name: {
                type: String,
                trim: true
            },
            date_of_birth: {
                type: String,
                trim: true
            },
            photo_present: {
                type: Boolean,
                default: false
            },
            signature_present: {
                type: Boolean,
                default: false
            },
            photoUrl: {
                type: String,
                default: ""
            },
            signatureUrl: {
                type: String,
                default: ""
            },
            verified: {
                type: Boolean,
                default: false
            }
        },
        kycStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
            required: true
        },
        kycVerifiedAt: {
            type: Date,
            default: null
        },
        kycRejectedReason: {
            type: String,
            default: ''
        },
        kycVerification: {
            overall_status: {
                type: String,
                enum: ['APPROVED', 'PENDING_REVIEW', 'REJECTED'],
                default: null
            },
            checks: [{
                step: String,
                status: {
                    type: String,
                    enum: ['PASS', 'FAIL', 'MANUAL_CHECK']
                },
                details: String
            }],
            performed_at: {
                type: Date,
                default: null
            }
        },
        otpPicture: {
            type: String,
            default: ""
        },
        otpVerification: {
            phoneNumber: {
                type: String,
                trim: true
            },
            status: {
                type: String,
                enum: ['pending', 'verified', 'failed'],
                default: 'pending'
            },
            sentAt: {
                type: Date
            },
            verifiedAt: {
                type: Date
            },
            verificationSid: {
                type: String
            },
            otp: {
                type: String,
                trim: true
            }
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Custom validation for unique Aadhaar number (only when provided)
userSchema.pre("save", async function (next) {
    if (this.aadhaarCard?.aadhaar_number && this.isModified("aadhaarCard.aadhaar_number")) {
        const existingUser = await this.constructor.findOne({
            "aadhaarCard.aadhaar_number": this.aadhaarCard.aadhaar_number,
            _id: { $ne: this._id }
        });
        if (existingUser) {
            const error = new Error("Aadhaar number already exists");
            error.code = 11000;
            return next(error);
        }
    }
    next();
});

// Custom validation for unique PAN number (only when provided)
userSchema.pre("save", async function (next) {
    if (this.panCard?.pan_number && this.isModified("panCard.pan_number")) {
        const existingUser = await this.constructor.findOne({
            "panCard.pan_number": this.panCard.pan_number,
            _id: { $ne: this._id }
        });
        if (existingUser) {
            const error = new Error("PAN number already exists");
            error.code = 11000;
            return next(error);
        }
    }
    next();
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export const User = mongoose.model("User", userSchema);
