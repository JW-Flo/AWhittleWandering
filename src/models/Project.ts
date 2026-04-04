import { Document, Schema, model, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  startDate: Date;
  endDate?: Date;
  budget?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String 
  },
  owner: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  status: { 
    type: String, 
    enum: ['planning', 'in-progress', 'completed', 'on-hold'],
    default: 'planning'
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date 
  },
  budget: { 
    type: Number,
    min: 0 
  },
  tags: [{ 
    type: String, 
    trim: true 
  }]
}, {
  timestamps: true
});

export const Project = model<IProject>('Project', ProjectSchema);