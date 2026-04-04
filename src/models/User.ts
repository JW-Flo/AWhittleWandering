import { Document, Schema, model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'manager';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true 
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'user', 'manager'],
    default: 'user'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  }
}, {
  timestamps: true
});

export const User = model<IUser>('User', UserSchema);